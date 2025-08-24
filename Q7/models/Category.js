// models/Category.js
const mongoose = require("mongoose");

const categorySchema = new mongoose.Schema({
  name: { type: String, required: true },
  parent: { type: mongoose.Schema.Types.ObjectId, ref: "Category", default: null } // null = parent
});

module.exports = mongoose.model("Category", categorySchema);
