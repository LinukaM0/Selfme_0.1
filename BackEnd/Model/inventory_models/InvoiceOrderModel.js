const mongoose = require("mongoose");

const invoiceOrderSchema = new mongoose.Schema({
  userid: { type: String, ref: "User", required: true },
  items: [
    {
      itemId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
      quantity: { type: Number, required: true },
      unit_price: { type: Number, required: true },
      subtotal: { type: Number, required: true },
    },
  ],
  total: { type: Number, required: true },
  tax: { type: Number, required: true },
  grandTotal: { type: Number, required: true },
  status: { 
    type: String, 
    enum: ["pending", "processed", "completed", "cancelled"],
    default: "pending" 
  },
  created_at: { type: Date, default: Date.now },
  processed_at: { type: Date },
  stock_out_id: { type: String }
});

module.exports = mongoose.model("InvoiceOrder", invoiceOrderSchema);