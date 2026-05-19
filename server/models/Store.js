const mongoose = require("mongoose");

const storeSchema = new mongoose.Schema(
  {
    // 🔐 Ownership (multi-user system)
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true, // ✅ important for fast filtering per user
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },

    location: {
      type: String,
      default: "",
      trim: true,
    },

    online: {
      type: Boolean,
      default: false,
    },

    todayRevenue: {
      type: Number,
      default: 0,
    },

    activeOrders: {
      type: Number,
      default: 0,
    },

    lastSale: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Store", storeSchema);