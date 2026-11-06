const router = require("express").Router();
const Product = require("../models/Product");
const Store = require("../models/Store");
const auth = require("../middleware/auth");
const mongoose = require("mongoose");
const multer = require("multer");
const path = require("path");

function parseList(value) {
  if (Array.isArray(value)) return value;
  if (typeof value !== "string" || !value.trim()) return [];
  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) return parsed;
  } catch {
    // Older clients send comma-separated SKUs.
  }
  return value.split(",");
}

function parseProductFields(body) {
  const barcodes = [...new Set(
    [...parseList(body.barcodes), body.barcode]
      .map((value) => String(value || "").trim())
      .filter(Boolean)
  )];
  const stockByStore = parseList(body.stockByStore)
    .map((entry) => ({
      storeId: entry.storeId,
      stock: Number(entry.stock),
    }));
  if (stockByStore.some((entry) =>
    !mongoose.isValidObjectId(entry.storeId) || !Number.isFinite(entry.stock) || entry.stock < 0
  )) {
    const error = new Error("Branch stock must use a valid store and a non-negative quantity.");
    error.status = 400;
    throw error;
  }
  if (new Set(stockByStore.map((entry) => String(entry.storeId))).size !== stockByStore.length) {
    const error = new Error("A branch can only be listed once per product.");
    error.status = 400;
    throw error;
  }
  const skuCodes = parseList(body.skus)
    .map((sku) => String(sku?.code || sku).trim())
    .filter(Boolean);
  const totalStock = stockByStore.length
    ? stockByStore.reduce((sum, entry) => sum + entry.stock, 0)
    : Number(body.totalStock || 0);
  const pricePerUnit = Number(body.pricePerUnit);
  if (!Number.isFinite(totalStock) || !Number.isFinite(pricePerUnit) || totalStock < 0 || pricePerUnit < 0) {
    const error = new Error("Stock and price must be valid non-negative numbers.");
    error.status = 400;
    throw error;
  }

  return {
    name: body.name,
    description: body.description,
    brand: body.brand,
    category: body.category,
    subCategory: body.subCategory,
    childCategory: body.childCategory,
    unitType: body.unitType,
    totalStock,
    pricePerUnit,
    ...(body.tax !== undefined && body.tax !== ""
      ? { tax: Number(body.tax) }
      : {}),
    allowPartialSale: body.allowPartialSale === true || body.allowPartialSale === "true",
    minSellUnit: Number(body.minSellUnit || 1),
    skus: skuCodes.map((code) => ({
      code,
      stock: totalStock,
    })),
    barcode: barcodes[0] || "",
    barcodes,
    stockByStore,
  };
}

async function ensureStoresBelongToUser(userId, stockByStore) {
  const storeIds = [...new Set(stockByStore.map((entry) => String(entry.storeId)))];
  if (!storeIds.length) return;
  const ownedStores = await Store.countDocuments({ _id: { $in: storeIds }, userId });
  if (ownedStores !== storeIds.length) {
    const error = new Error("One or more selected branches could not be found.");
    error.status = 400;
    throw error;
  }
}

async function ensureBarcodesAvailable(userId, barcodes, excludeId) {
  if (!barcodes.length) return;
  const conflict = await Product.findOne({
    userId,
    ...(excludeId ? { _id: { $ne: excludeId } } : {}),
    $or: [{ barcode: { $in: barcodes } }, { barcodes: { $in: barcodes } }],
  }).select("name");
  if (conflict) {
    const error = new Error(`Barcode already belongs to ${conflict.name}.`);
    error.status = 409;
    throw error;
  }
}

// ================= MULTER =================
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, "../uploads"));
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({ storage });

// ================= GET PRODUCTS (USER ONLY) =================
router.get("/", auth, async (req, res) => {
  try {
    const products = await Product.find({
      userId: req.user,   // ✅ FIXED
    });

    res.json(products);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ================= CREATE PRODUCT =================
router.post("/", upload.array("images", 10), auth, async (req, res) => {
  try {
    const fields = parseProductFields(req.body);
    if (Object.prototype.hasOwnProperty.call(req.body, "stockByStore")) {
      if (Object.prototype.hasOwnProperty.call(req.body, "stockByStore")) {
        await ensureStoresBelongToUser(req.user, fields.stockByStore);
      }
    }
    await ensureBarcodesAvailable(req.user, fields.barcodes);
    const product = await Product.create({
      userId: req.user,
      ...fields,
      images: req.files ? req.files.map((f) => f.filename) : [],
    });

    res.json(product);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
});

// ================= UPDATE PRODUCT =================
router.put("/:id", auth, async (req, res) => {
  try {
    const fields = parseProductFields(req.body);
    const currentProduct = await Product.findOne({
      _id: req.params.id,
      userId: req.user,
    });
    if (!currentProduct) {
      return res.status(404).json({ msg: "Product not found" });
    }

    if (!Object.prototype.hasOwnProperty.call(req.body, "barcodes")) {
      fields.barcodes = [...new Set([
        ...(currentProduct.barcodes || []),
        currentProduct.barcode,
        ...fields.barcodes,
      ].filter(Boolean))];
      fields.barcode = req.body.barcode || currentProduct.barcode || fields.barcodes[0] || "";
    }
    if (!Object.prototype.hasOwnProperty.call(req.body, "stockByStore")) {
      fields.stockByStore = currentProduct.stockByStore;
      if (currentProduct.stockByStore.length) {
        fields.totalStock = currentProduct.totalStock;
      }
    }

    await ensureStoresBelongToUser(req.user, fields.stockByStore);
    await ensureBarcodesAvailable(req.user, fields.barcodes, req.params.id);
    const product = await Product.findOneAndUpdate(
      {
        _id: req.params.id,
        userId: req.user,   // ✅ FIXED
      },
      fields,
      { new: true, runValidators: true }
    );

    if (!product) {
      return res.status(404).json({ msg: "Product not found" });
    }

    res.json(product);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
});

// ================= DELETE PRODUCT =================
router.delete("/:id", auth, async (req, res) => {
  try {
    const product = await Product.findOneAndDelete({
      _id: req.params.id,
      userId: req.user,   // ✅ FIXED
    });

    if (!product) {
      return res.status(404).json({ msg: "Product not found" });
    }

    res.json({ msg: "Deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;