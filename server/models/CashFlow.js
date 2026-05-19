const mongoose = require("mongoose");

const cashFlowSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    type: {
      type: String,
      enum: ["Income", "Expense"],
      required: true,
    },

    source: {
      type: String,
      required: true,
    },

    amount: {
      type: Number,
      required: true,
    },

    date: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("CashFlow", cashFlowSchema);