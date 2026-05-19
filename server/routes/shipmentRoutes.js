const router = require("express").Router();
const Shipment = require("../models/Shipment");
const auth = require("../middleware/auth");

// GET ALL
router.get("/", auth, async (req, res) => {
  try {
    const shipments = await Shipment.find({ userId: req.user })
      .populate("productId")
      .sort({ createdAt: -1 });

    res.json(shipments);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

// CREATE
router.post("/", auth, async (req, res) => {
  try {
    const shipment = await Shipment.create({
      ...req.body,
      userId: req.user,
    });

    res.json(shipment);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

// UPDATE
router.put("/:id", auth, async (req, res) => {
  try {
    const updated = await Shipment.findOneAndUpdate(
      { _id: req.params.id, userId: req.user },
      req.body,
      { new: true }
    );

    res.json(updated);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

// DELETE
router.delete("/:id", auth, async (req, res) => {
  try {
    await Shipment.findOneAndDelete({
      _id: req.params.id,
      userId: req.user,
    });

    res.json({ msg: "Deleted" });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

module.exports = router;