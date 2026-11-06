const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    // 🔐 IMPORTANT: ownership (multi-user support)
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

    unitType: {
      type: String,
      enum: ["piece", "kg", "gram", "liter", "ml", "box", "packet"],
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

    tax: {
      type: Number,
      min: 0,
      max: 1000,
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

    barcode: {
      type: String,
      trim: true,
      default: "",
    },

    barcodes: {
      type: [String],
      default: [],
    },

    stockByStore: [
      {
        storeId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Store",
          required: true,
        },
        stock: {
          type: Number,
          min: 0,
          default: 0,
        },
      },
    ],

    images: [String],

    status: {
      type: String,
      default: "Available",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Product", productSchema);