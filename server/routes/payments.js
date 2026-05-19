const router = require("express").Router();
const Payment = require("../models/Payment");
const auth = require("../middleware/auth");

// ================= GET USER PAYMENTS =================
router.get("/", auth, async (req, res) => {
  try {
    const payments = await Payment.find({
      userId: req.user
    }).sort({ createdAt: -1 });

    res.json(payments);

  } catch (err) {
    res.status(500).json({
      msg: err.message
    });
  }
});

// ================= CREATE PAYMENT =================
router.post("/", auth, async (req, res) => {
  try {
    const payment = await Payment.create({
      userId: req.user,
      ...req.body
    });

    res.json(payment);

  } catch (err) {
    res.status(500).json({
      msg: err.message
    });
  }
});

module.exports = router;