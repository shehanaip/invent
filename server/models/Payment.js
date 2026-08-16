const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Who is being paid / who pays
    customer: String, // display name (customer or external person)
    payeeName: String, // same as customer for clarity
    isCustomer: {
      type: Boolean,
      default: false,
    },

    // Why is this payment being made
    reason: {
      type: String,
      default: "",
    },

    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
    },

    amount: Number,

    gateway: {
      type: String,
      enum: ["Stripe", "SSLCommerz", "PayPal", "Cash", "Other"],
      default: "SSLCommerz",
    },

    type: {
      type: String,
      enum: ["Incoming", "Outgoing"],
      default: "Incoming",
    },

    status: {
      type: String,
      enum: ["Pending", "Paid", "Failed", "Cancelled"],
      default: "Pending",
    },

    transactionId: String,

    // Payment / due date
    paymentDate: {
      type: Date,
      default: Date.now,
    },

    // SSLCommerz session extras
    gatewayUrl: String,
    valId: String,
    rawGatewayResponse: mongoose.Schema.Types.Mixed,
  },
  { timestamps: true }
);

module.exports = mongoose.model("Payment", paymentSchema);
