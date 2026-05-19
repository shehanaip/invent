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

    quantity: { type: Number, default: 1 },
    unit: { type: String, default: "" },
    total: { type: Number, default: 0 },

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