const mongoose = require("mongoose");

const categorySchema = new mongoose.Schema({
  category: String,
  subCategory: String,
  childCategory: String
});

module.exports = mongoose.model("Category", categorySchema);