const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },

  customer: String,

  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Order"
  },

  amount: Number,

  gateway: {
    type: String,
    enum: ["Stripe", "SSLCommerz", "PayPal"]
  },

  type: {
    type: String,
    enum: ["Incoming", "Outgoing"],
    default: "Incoming"
  },

  status: {
    type: String,
    enum: ["Pending", "Paid", "Failed"],
    default: "Pending"
  },

  transactionId: String

}, { timestamps: true });

module.exports = mongoose.model("Payment", paymentSchema);