const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    name: {
      type: String,
      required: true,
    },

    description: String,

    brand: String,

    category: String,
    subCategory: String,
    childCategory: String,

    // ✅ NEW
    barcode: String,

    // ✅ NEW
    qrEnabled: {
      type: Boolean,
      default: false,
    },

    // ✅ NEW
    tax: {
      type: Number,
      default: 0,
    },

    // ✅ NEW
    currency: {
      type: String,
      default: "BDT",
    },

    unitType: {
      type: String,
      enum: [
        "piece",
        "kg",
        "gram",
        "liter",
        "ml",
        "box",
        "packet",
      ],
      default: "piece",
    },

    totalStock: {
      type: Number,
      default: 0,
    },

    pricePerUnit: {
      type: Number,
      required: true,
    },

    allowPartialSale: {
      type: Boolean,
      default: false,
    },

    minSellUnit: {
      type: Number,
      default: 1,
    },

    skus: [
      {
        code: String,
        stock: Number,
      },
    ],

    images: [String],

    status: {
      type: String,
      default: "Available",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Product", productSchema);