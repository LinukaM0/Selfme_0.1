const mongoose = require('mongoose');
const invoiceSchema = new mongoose.Schema({
  userid: { type: String, ref: 'User', required: true }, // Changed to userid
  items: [{
    itemId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    quantity: { type: Number, required: true },
    unit_price: { type: Number, required: true },
    subtotal: { type: Number, required: true }
  }],
  total: { type: Number, required: true },
  tax: { type: Number, required: true },
  grandTotal: { type: Number, required: true },
  created_at: { type: Date, default: Date.now }
});
module.exports = mongoose.model('Invoice', invoiceSchema);