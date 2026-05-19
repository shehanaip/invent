const router = require("express").Router();
const CashFlow = require("../models/CashFlow");
const auth = require("../middleware/auth");

// ================= GET =================
router.get("/", auth, async (req, res) => {
  try {
    const data = await CashFlow.find({
      userId: req.user,
    }).sort({ createdAt: -1 });

    res.json(data);
  } catch (err) {
    console.log("GET CASHFLOW ERROR:", err);
    res.status(500).json({ msg: err.message });
  }
});

// ================= ADD =================
router.post("/", auth, async (req, res) => {
  try {
    const item = await CashFlow.create({
      userId: req.user,
      type: req.body.type,
      source: req.body.source,
      amount: req.body.amount,
      date: req.body.date,
    });

    res.json(item);
  } catch (err) {
    console.log("ADD CASHFLOW ERROR:", err);
    res.status(500).json({ msg: err.message });
  }
});

// ================= UPDATE =================
router.put("/:id", auth, async (req, res) => {
  try {
    const updated = await CashFlow.findOneAndUpdate(
      {
        _id: req.params.id,
        userId: req.user,
      },
      {
        type: req.body.type,
        source: req.body.source,
        amount: req.body.amount,
        date: req.body.date,
      },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({
        msg: "Transaction not found",
      });
    }

    res.json(updated);
  } catch (err) {
    console.log("UPDATE CASHFLOW ERROR:", err);
    res.status(500).json({ msg: err.message });
  }
});

// ================= DELETE =================
router.delete("/:id", auth, async (req, res) => {
  try {
    const deleted = await CashFlow.findOneAndDelete({
      _id: req.params.id,
      userId: req.user,
    });

    if (!deleted) {
      return res.status(404).json({
        msg: "Transaction not found",
      });
    }

    res.json({
      msg: "Transaction deleted",
    });
  } catch (err) {
    console.log("DELETE CASHFLOW ERROR:", err);
    res.status(500).json({ msg: err.message });
  }
});

module.exports = router;