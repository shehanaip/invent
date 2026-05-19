const router = require("express").Router();
const Product = require("../models/Product");
const auth = require("../middleware/auth");
const multer = require("multer");
const path = require("path");

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
    const product = await Product.create({
      userId: req.user,   // ✅ FIXED

      name: req.body.name,
      description: req.body.description,
      brand: req.body.brand,
      category: req.body.category,
      subCategory: req.body.subCategory,
      childCategory: req.body.childCategory,

      unitType: req.body.unitType,
      totalStock: Number(req.body.totalStock),
      pricePerUnit: Number(req.body.pricePerUnit),

      allowPartialSale: req.body.allowPartialSale === "true",
      minSellUnit: Number(req.body.minSellUnit || 1),

      skus: req.body.skus
        ? req.body.skus.split(",").map((sku) => ({
            code: sku.trim(),
            stock: Number(req.body.totalStock || 0),
          }))
        : [],

      images: req.files ? req.files.map((f) => f.filename) : [],
    });

    res.json(product);
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: err.message });
  }
});

// ================= UPDATE PRODUCT =================
router.put("/:id", auth, async (req, res) => {
  try {
    const product = await Product.findOneAndUpdate(
      {
        _id: req.params.id,
        userId: req.user,   // ✅ FIXED
      },
      req.body,
      { new: true }
    );

    if (!product) {
      return res.status(404).json({ msg: "Product not found" });
    }

    res.json(product);
  } catch (err) {
    res.status(500).json({ error: err.message });
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