const router = require("express").Router();
const Supplier = require("../models/Supplier");
const auth = require("../middleware/auth");

// ================= GET ALL =================
router.get("/", auth, async (req, res) => {
  try {
    const suppliers = await Supplier.find({
      userId: req.user, // ✅ FIXED (IMPORTANT)
    }).sort({ createdAt: -1 });

    res.json(suppliers);
  } catch (err) {
    console.log("GET SUPPLIERS ERROR:", err); // 👈 DEBUG
    res.status(500).json({ msg: err.message });
  }
});

// ================= CREATE =================
router.post("/", auth, async (req, res) => {
  try {
    const supplier = await Supplier.create({
      ...req.body,
      userId: req.user, // ✅ FIXED
    });

    res.json(supplier);
  } catch (err) {
    console.log("CREATE SUPPLIER ERROR:", err);
    res.status(500).json({ msg: err.message });
  }
});

// ================= UPDATE =================
router.put("/:id", auth, async (req, res) => {
  try {
    const updated = await Supplier.findOneAndUpdate(
      {
        _id: req.params.id,
        userId: req.user, // ✅ FIXED
      },
      req.body,
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ msg: "Supplier not found" });
    }

    res.json(updated);
  } catch (err) {
    console.log("UPDATE SUPPLIER ERROR:", err);
    res.status(500).json({ msg: err.message });
  }
});

// ================= DELETE =================
router.delete("/:id", auth, async (req, res) => {
  try {
    const deleted = await Supplier.findOneAndDelete({
      _id: req.params.id,
      userId: req.user, // ✅ FIXED
    });

    if (!deleted) {
      return res.status(404).json({ msg: "Supplier not found" });
    }

    res.json({ msg: "Supplier deleted" });
  } catch (err) {
    console.log("DELETE SUPPLIER ERROR:", err);
    res.status(500).json({ msg: err.message });
  }
});

module.exports = router;