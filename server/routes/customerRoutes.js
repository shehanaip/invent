const router = require("express").Router();
const Customer = require("../models/Customer");
const auth = require("../middleware/auth");

// ================= GET =================
router.get("/", auth, async (req, res) => {
  try {
    const userId = req.user;

    const customers = await Customer.find({ userId }).sort({ createdAt: -1 });

    res.json(customers);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ================= CREATE =================
router.post("/", auth, async (req, res) => {
  try {
    const userId = req.user;

    const { name, email, phone } = req.body;

    const existing = await Customer.findOne({ userId, name });

    if (existing) {
      return res.status(400).json({ msg: "Customer already exists" });
    }

    const customer = await Customer.create({
      userId,
      name,
      email: email || "",
      phone: phone || "",
      status: "Active",
      totalSpent: 0,
    });

    res.json(customer);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;