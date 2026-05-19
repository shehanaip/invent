const router = require("express").Router();
const Order = require("../models/Order");
const Customer = require("../models/Customer");
const auth = require("../middleware/auth");

// ================= GET ALL =================
router.get("/", auth, async (req, res) => {
  try {
    const userId = req.user;

    const orders = await Order.find({ userId })
      .populate("productId")
      .sort({ createdAt: -1 });

    res.json(orders);
  } catch (err) {
    console.log(err);
    res.status(500).json({ msg: err.message });
  }
});

// ================= GET ONE =================
router.get("/:id", auth, async (req, res) => {
  try {
    const order = await Order.findOne({
      _id: req.params.id,
      userId: req.user,
    }).populate("productId");

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

    const {
      customer,
      email,
      phone,
      productId,
      quantity,
      total,
      status,
      payment,
    } = req.body;

    let existingCustomer = await Customer.findOne({
      userId,
      $or: [
        { name: customer },
        { email: email || "" },
        { phone: phone || "" },
      ],
    });

    if (!existingCustomer) {
      existingCustomer = await Customer.create({
        userId,
        name: customer,
        email: email || "",
        phone: phone || "",
        status: "Active",
        totalSpent: Number(total || 0),
      });
    } else {
      existingCustomer.totalSpent =
        Number(existingCustomer.totalSpent || 0) + Number(total || 0);

      if (!existingCustomer.email && email) existingCustomer.email = email;
      if (!existingCustomer.phone && phone) existingCustomer.phone = phone;

      await existingCustomer.save();
    }

    const order = await Order.create({
      userId,
      customer,
      email: email || "",
      phone: phone || "",
      productId,
      quantity,
      total,
      status: status || "Pending",
      payment: payment || "Unpaid",
    });

    res.json(order);
  } catch (err) {
    console.log("ORDER ERROR:", err);
    res.status(500).json({ msg: err.message });
  }
});

// ================= UPDATE =================
router.put("/:id", auth, async (req, res) => {
  try {
    const updated = await Order.findOneAndUpdate(
      { _id: req.params.id, userId: req.user },
      req.body,
      { new: true }
    );

    if (!updated) return res.status(404).json({ msg: "Order not found" });

    res.json(updated);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

// ================= DELETE =================
router.delete("/:id", auth, async (req, res) => {
  try {
    const deleted = await Order.findOneAndDelete({
      _id: req.params.id,
      userId: req.user,
    });

    if (!deleted) return res.status(404).json({ msg: "Order not found" });

    res.json({ msg: "Order deleted" });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

module.exports = router;