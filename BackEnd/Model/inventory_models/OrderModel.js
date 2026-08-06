const mongoose = require("mongoose");

const OrderSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
  supplier: { type: mongoose.Schema.Types.ObjectId, ref: "Supplier", required: true },
  quantity: { type: Number, required: true },
  status: { type: String, default: "pending" },
  orderDate: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Order", OrderSchema);
