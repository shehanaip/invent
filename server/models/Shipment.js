const mongoose = require("mongoose");

const shipmentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },

    status: {
      type: String,
      enum: ["Pending", "In Transit", "Delivered", "Cancelled"],
      default: "Pending",
    },

    location: {
      type: String,
      required: true,
    },

    trackingNumber: {
      type: String,
      unique: true,
      sparse: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Shipment", shipmentSchema);