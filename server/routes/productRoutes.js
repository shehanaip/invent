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
    cb(
      null,
      Date.now() + path.extname(file.originalname)
    );
  },
});

const upload = multer({ storage });

// ================= GET PRODUCTS =================
router.get("/", auth, async (req, res) => {
  try {
    const products = await Product.find({
      userId: req.user,
    }).sort({ createdAt: -1 });

    res.json(products);

  } catch (err) {
    console.log(err);

    res.status(500).json({
      error: err.message,
    });
  }
});

// ================= GET SINGLE PRODUCT =================
router.get("/:id", auth, async (req, res) => {
  try {
    const product = await Product.findOne({
      _id: req.params.id,
      userId: req.user,
    });

    if (!product) {
      return res.status(404).json({
        msg: "Product not found",
      });
    }

    res.json(product);

  } catch (err) {
    console.log(err);

    res.status(500).json({
      error: err.message,
    });
  }
});

// ================= CREATE PRODUCT =================
router.post(
  "/",
  auth,
  upload.array("images", 10),
  async (req, res) => {
    try {
      const product = await Product.create({
        userId: req.user,

        name: req.body.name,

        description: req.body.description || "",

        brand: req.body.brand || "",

        category: req.body.category || "",

        subCategory: req.body.subCategory || "",

        childCategory: req.body.childCategory || "",

        // ✅ BARCODE
        barcode: req.body.barcode || "",

        // ✅ QR ENABLE
        qrEnabled:
          req.body.qrEnabled === "true",

        // ✅ TAX
        tax: Number(req.body.tax || 0),

        // ✅ CURRENCY
        currency:
          req.body.currency || "BDT",

        unitType:
          req.body.unitType || "piece",

        totalStock: Number(
          req.body.totalStock || 0
        ),

        pricePerUnit: Number(
          req.body.pricePerUnit || 0
        ),

        allowPartialSale:
          req.body.allowPartialSale === "true",

        minSellUnit: Number(
          req.body.minSellUnit || 1
        ),

        // ✅ SKU
        skus: req.body.skus
          ? req.body.skus
              .split(",")
              .map((sku) => ({
                code: sku.trim(),
                stock: Number(
                  req.body.totalStock || 0
                ),
              }))
          : [],

        // ✅ IMAGES
        images: req.files
          ? req.files.map((f) => f.filename)
          : [],
      });

      res.json(product);

    } catch (err) {
      console.log(err);

      res.status(500).json({
        error: err.message,
      });
    }
  }
);

// ================= UPDATE PRODUCT =================
router.put("/:id", auth, async (req, res) => {
  try {
    const updatedData = {
      ...req.body,

      totalStock: Number(
        req.body.totalStock || 0
      ),

      pricePerUnit: Number(
        req.body.pricePerUnit || 0
      ),

      tax: Number(req.body.tax || 0),

      allowPartialSale:
        req.body.allowPartialSale === true ||
        req.body.allowPartialSale === "true",

      qrEnabled:
        req.body.qrEnabled === true ||
        req.body.qrEnabled === "true",
    };

    const product = await Product.findOneAndUpdate(
      {
        _id: req.params.id,
        userId: req.user,
      },
      updatedData,
      {
        new: true,
      }
    );

    if (!product) {
      return res.status(404).json({
        msg: "Product not found",
      });
    }

    res.json(product);

  } catch (err) {
    console.log(err);

    res.status(500).json({
      error: err.message,
    });
  }
});

// ================= DELETE PRODUCT =================
router.delete("/:id", auth, async (req, res) => {
  try {
    const product = await Product.findOneAndDelete({
      _id: req.params.id,
      userId: req.user,
    });

    if (!product) {
      return res.status(404).json({
        msg: "Product not found",
      });
    }

    res.json({
      msg: "Product deleted",
    });

  } catch (err) {
    console.log(err);

    res.status(500).json({
      error: err.message,
    });
  }
});

module.exports = router;