const router = require("express").Router();
const Store = require("../models/Store");
const auth = require("../middleware/auth");

// ================= GET ALL STORES =================
router.get("/", auth, async (req, res) => {
  try {
    const stores = await Store.find({
      userId: req.user, // ✅ FIXED
    }).sort({ createdAt: -1 });

    res.json(stores);
  } catch (err) {
    res.status(500).json({
      msg: err.message,
    });
  }
});

// ================= CREATE STORE =================
router.post("/", auth, async (req, res) => {
  try {
    const store = await Store.create({
      ...req.body,
      userId: req.user, // ✅ FIXED
    });

    res.json(store);
  } catch (err) {
    res.status(500).json({
      msg: err.message,
    });
  }
});

// ================= UPDATE STORE =================
router.put("/:id", auth, async (req, res) => {
  try {
    const updatedStore = await Store.findOneAndUpdate(
      {
        _id: req.params.id,
        userId: req.user, // ✅ FIXED
      },
      req.body,
      { new: true }
    );

    if (!updatedStore) {
      return res.status(404).json({
        msg: "Store not found",
      });
    }

    res.json(updatedStore);
  } catch (err) {
    res.status(500).json({
      msg: err.message,
    });
  }
});

// ================= DELETE STORE =================
router.delete("/:id", auth, async (req, res) => {
  try {
    const deletedStore = await Store.findOneAndDelete({
      _id: req.params.id,
      userId: req.user, // ✅ FIXED
    });

    if (!deletedStore) {
      return res.status(404).json({
        msg: "Store not found",
      });
    }

    res.json({
      msg: "Store deleted successfully",
    });
  } catch (err) {
    res.status(500).json({
      msg: err.message,
    });
  }
});

module.exports = router;