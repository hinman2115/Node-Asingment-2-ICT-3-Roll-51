// models/Order.js
const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  items: [
    {
      product: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
      qty: Number
    }
  ],
  total: Number,
  status: { type: String, default: "Pending" }
});

module.exports = mongoose.model("Order", orderSchema);
