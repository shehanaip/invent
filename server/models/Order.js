const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    customer: { type: String, required: true },
    email: { type: String, default: "" },
    phone: { type: String, default: "" },

    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
    },

    lineItems: [
      {
        productId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
          required: true,
        },
        barcode: { type: String, default: "" },
        quantity: { type: Number, min: 0, required: true },
        unitPrice: { type: Number, min: 0, default: 0 },
        total: { type: Number, min: 0, default: 0 },
      },
    ],
    storeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Store",
      default: null,
    },
    stockDeducted: {
      type: Boolean,
      default: false,
    },

    quantity: { type: Number, default: 1 },
    unit: { type: String, default: "" },
    total: { type: Number, default: 0 },
    taxRate: { type: Number, min: 0, max: 1000 },

    status: {
      type: String,
      enum: ["Pending", "Completed", "Cancelled"],
      default: "Pending",
    },

    payment: {
      type: String,
      enum: ["Unpaid", "Paid"],
      default: "Unpaid",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Order", orderSchema);