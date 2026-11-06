const router = require("express").Router();
const mongoose = require("mongoose");
const Order = require("../models/Order");
const Customer = require("../models/Customer");
const Product = require("../models/Product");
const Store = require("../models/Store");
const auth = require("../middleware/auth");

function getRequestedItems(body) {
  if (Array.isArray(body.lineItems) && body.lineItems.length) {
    return body.lineItems;
  }
  return body.productId
    ? [{
        productId: body.productId,
        barcode: body.barcode || "",
        quantity: body.quantity,
      }]
    : [];
}

async function calculateOrderItems({ userId, items, requestedTaxRate }) {
  if (!items.length) {
    const error = new Error("Add at least one product to the order.");
    error.status = 400;
    throw error;
  }

  const result = [];
  for (const item of items) {
    const productId = item.productId?._id || item.productId;
    const quantity = Number(item.quantity);
    if (!mongoose.isValidObjectId(productId) || !Number.isFinite(quantity) || quantity <= 0) {
      const error = new Error("Each order item needs a product and a quantity greater than zero.");
      error.status = 400;
      throw error;
    }

    const product = await Product.findOne({ _id: productId, userId });
    if (!product) {
      const error = new Error("An order product could not be found.");
      error.status = 400;
      throw error;
    }

    const barcode = String(item.barcode || "").trim();
    const productBarcodes = [...new Set(
      [product.barcode, ...(product.barcodes || [])].filter(Boolean)
    )];
    if (barcode && !productBarcodes.includes(barcode)) {
      const error = new Error(`Barcode ${barcode} does not match ${product.name}.`);
      error.status = 400;
      throw error;
    }

    const price = Number(product.pricePerUnit || 0);
    const taxRate = product.tax == null || product.tax === ""
      ? Number(requestedTaxRate || 0)
      : Number(product.tax);
    if (!Number.isFinite(taxRate) || taxRate < 0 || taxRate > 1000) {
      const error = new Error("Tax rate must be between 0 and 1000.");
      error.status = 400;
      throw error;
    }
    const subtotal = price * quantity;
    result.push({
      productId: product._id,
      barcode,
      quantity,
      unitPrice: price,
      total: subtotal * (1 + taxRate / 100),
      taxRate,
    });
  }
  return result;
}

function getStoredItems(order) {
  if (order.lineItems?.length) return order.lineItems;
  if (!order.productId) return [];
  return [{
    productId: order.productId,
    quantity: order.quantity || 0,
  }];
}

function buildStockDeltas(previousItems, nextItems, previousStoreId, nextStoreId) {
  const deltas = new Map();
  const append = (items, storeId, multiplier) => {
    for (const item of items) {
      const productId = String(item.productId?._id || item.productId);
      const key = `${productId}:${storeId || ""}`;
      const current = deltas.get(key) || {
        productId,
        storeId: storeId ? String(storeId) : "",
        quantity: 0,
      };
      current.quantity += Number(item.quantity || 0) * multiplier;
      deltas.set(key, current);
    }
  };
  append(previousItems, previousStoreId, 1);
  append(nextItems, nextStoreId, -1);
  return [...deltas.values()].filter((delta) => delta.quantity !== 0);
}

async function applyOneStockDelta(userId, delta) {
  const product = await Product.findOne({ _id: delta.productId, userId });
  if (!product) {
    const error = new Error("An order product could not be found while updating stock.");
    error.status = 409;
    throw error;
  }

  const storeId = delta.storeId;
  if (storeId) {
    const store = await Store.findOne({ _id: storeId, userId }).select("_id");
    if (!store) {
      const error = new Error("Select an active store or branch for this order.");
      error.status = 400;
      throw error;
    }
    const branchStock = product.stockByStore.find(
      (entry) => String(entry.storeId) === storeId
    );
    if (!branchStock) {
      const error = new Error(`${product.name} has no stock assigned to the selected branch.`);
      error.status = 409;
      throw error;
    }
    const amount = Math.abs(delta.quantity);
    const filter = {
      _id: delta.productId,
      userId,
      ...(delta.quantity < 0
        ? {
            totalStock: { $gte: amount },
            stockByStore: { $elemMatch: { storeId, stock: { $gte: amount } } },
          }
        : {}),
    };
    const update = await Product.updateOne(
      filter,
      {
        $inc: {
          totalStock: delta.quantity,
          "stockByStore.$[branch].stock": delta.quantity,
        },
      },
      { arrayFilters: [{ "branch.storeId": storeId }] }
    );
    if (!update.modifiedCount) {
      const error = new Error(`${product.name} does not have enough stock at this branch.`);
      error.status = 409;
      throw error;
    }
    return;
  }

  if (product.stockByStore.length) {
    const error = new Error(`Choose a branch for ${product.name} before placing the order.`);
    error.status = 400;
    throw error;
  }
  const update = await Product.updateOne(
    {
      _id: delta.productId,
      userId,
      ...(delta.quantity < 0
        ? { totalStock: { $gte: Math.abs(delta.quantity) } }
        : {}),
    },
    { $inc: { totalStock: delta.quantity } }
  );
  if (!update.modifiedCount) {
    const error = new Error(`${product.name} does not have enough stock.`);
    error.status = 409;
    throw error;
  }
}

async function applyStockDeltas(userId, deltas) {
  const orderedDeltas = [
    ...deltas.filter((delta) => delta.quantity > 0),
    ...deltas.filter((delta) => delta.quantity < 0),
  ];
  const applied = [];
  try {
    for (const delta of orderedDeltas) {
      await applyOneStockDelta(userId, delta);
      applied.push(delta);
    }
  } catch (error) {
    const rollbackErrors = [];
    for (const delta of applied.reverse()) {
      try {
        await applyOneStockDelta(userId, { ...delta, quantity: -delta.quantity });
      } catch (rollbackError) {
        rollbackErrors.push(rollbackError.message);
      }
    }
    if (rollbackErrors.length) {
      const rollbackError = new Error(
        `${error.message} Inventory rollback also failed: ${rollbackErrors.join("; ")}`
      );
      rollbackError.status = 500;
      throw rollbackError;
    }
    throw error;
  }
}

function stockItemsForOrder(order) {
  return order.status === "Cancelled" || !order.stockDeducted
    ? []
    : getStoredItems(order);
}

// ================= GET ALL =================
router.get("/", auth, async (req, res) => {
  try {
    const orders = await Order.find({ userId: req.user })
      .populate("productId")
      .populate("lineItems.productId")
      .populate("storeId")
      .sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

// ================= GET ONE =================
router.get("/:id", auth, async (req, res) => {
  try {
    const order = await Order.findOne({
      _id: req.params.id,
      userId: req.user,
    })
      .populate("productId")
      .populate("lineItems.productId")
      .populate("storeId");
    if (!order) return res.status(404).json({ msg: "Order not found" });
    res.json(order);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

// ================= CREATE =================
router.post("/", auth, async (req, res) => {
  try {
    const userId = req.user;
    const lineItems = await calculateOrderItems({
      userId,
      items: getRequestedItems(req.body),
      requestedTaxRate: req.body.taxRate,
    });
    const total = lineItems.reduce((sum, item) => sum + item.total, 0);
    const storeId = req.body.storeId || null;
    const status = req.body.status || "Pending";
    const stockDeducted = status !== "Cancelled";
    const orderData = {
      userId,
      customer: req.body.customer,
      email: req.body.email || "",
      phone: req.body.phone || "",
      lineItems,
      productId: lineItems[0].productId,
      quantity: lineItems.reduce((sum, item) => sum + item.quantity, 0),
      total,
      taxRate: lineItems[0].taxRate,
      status,
      payment: req.body.payment || "Unpaid",
      storeId,
      stockDeducted,
    };

    await applyStockDeltas(
      userId,
      buildStockDeltas([], stockDeducted ? lineItems : [], null, storeId)
    );

    let order;
    try {
      order = await Order.create(orderData);

      const existingCustomer = await Customer.findOne({
        userId,
        $or: [
          { name: req.body.customer },
          { email: req.body.email || "" },
          { phone: req.body.phone || "" },
        ],
      });
      if (!existingCustomer) {
        await Customer.create({
          userId,
          name: req.body.customer,
          email: req.body.email || "",
          phone: req.body.phone || "",
          status: "Active",
          totalSpent: total,
        });
      } else {
        existingCustomer.totalSpent = Number(existingCustomer.totalSpent || 0) + total;
        if (!existingCustomer.email && req.body.email) existingCustomer.email = req.body.email;
        if (!existingCustomer.phone && req.body.phone) existingCustomer.phone = req.body.phone;
        await existingCustomer.save();
      }
    } catch (error) {
      if (order) {
        await order.deleteOne();
      }
      if (stockDeducted) {
        await applyStockDeltas(
          userId,
          buildStockDeltas(lineItems, [], storeId, null)
        );
      }
      throw error;
    }
    res.json(order);
  } catch (err) {
    res.status(err.status || 500).json({ msg: err.message });
  }
});

// ================= UPDATE =================
router.put("/:id", auth, async (req, res) => {
  try {
    const userId = req.user;
    const order = await Order.findOne({ _id: req.params.id, userId });
    if (!order) return res.status(404).json({ msg: "Order not found" });

    const lineItems = await calculateOrderItems({
      userId,
      items: getRequestedItems(req.body).length
        ? getRequestedItems(req.body)
        : getStoredItems(order),
      requestedTaxRate: req.body.taxRate ?? order.taxRate,
    });
    const status = req.body.status || order.status;
    const storeId = req.body.storeId === undefined
      ? order.storeId
      : req.body.storeId || null;
    const previousItems = stockItemsForOrder(order);
    const nextItems = status === "Cancelled" ? [] : lineItems;
    const deltas = buildStockDeltas(previousItems, nextItems, order.storeId, storeId);

    await applyStockDeltas(userId, deltas);
    try {
      const total = lineItems.reduce((sum, item) => sum + item.total, 0);
      order.customer = req.body.customer ?? order.customer;
      order.email = req.body.email ?? order.email;
      order.phone = req.body.phone ?? order.phone;
      order.lineItems = lineItems;
      order.productId = lineItems[0].productId;
      order.quantity = lineItems.reduce((sum, item) => sum + item.quantity, 0);
      order.total = total;
      order.taxRate = lineItems[0].taxRate;
      order.status = status;
      order.payment = req.body.payment || order.payment;
      order.storeId = storeId;
      order.stockDeducted = status !== "Cancelled";
      await order.save();
      res.json(order);
    } catch (error) {
      await applyStockDeltas(
        userId,
        deltas.map((delta) => ({ ...delta, quantity: -delta.quantity }))
      );
      throw error;
    }
  } catch (err) {
    res.status(err.status || 500).json({ msg: err.message });
  }
});

// ================= DELETE =================
router.delete("/:id", auth, async (req, res) => {
  try {
    const userId = req.user;
    const order = await Order.findOne({ _id: req.params.id, userId });
    if (!order) return res.status(404).json({ msg: "Order not found" });

    const deltas = buildStockDeltas(stockItemsForOrder(order), [], order.storeId, null);
    await applyStockDeltas(userId, deltas);
    try {
      await order.deleteOne();
      res.json({ msg: "Order deleted" });
    } catch (error) {
      await applyStockDeltas(
        userId,
        deltas.map((delta) => ({ ...delta, quantity: -delta.quantity }))
      );
      throw error;
    }
  } catch (err) {
    res.status(err.status || 500).json({ msg: err.message });
  }
});

module.exports = router;
