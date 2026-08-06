const mongoose = require('mongoose');

const paidTaskSchema = new mongoose.Schema({
  paymentId: { type: String, required: true, unique: true }, // Payment ID
  userId: { type: String, required: true }, // User ID
  customer: { type: String, required: true }, // Customer name
  amount: { type: Number, required: true }, // Amount
  paymentDate: { type: Date, required: true }, // Payment Date
  status: { type: String, required: true }, // Status (e.g., Paid)
  statusofmy: { type: String, default: 'notyet' }, // Statusofmy with default "notyet"
  created_at: { type: Date, default: Date.now }, // Creation timestamp
});

module.exports = mongoose.model('MyPaidTask', paidTaskSchema);