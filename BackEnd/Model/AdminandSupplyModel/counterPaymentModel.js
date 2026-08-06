// Model/AdminandSupplyModel/counterPaymentModel.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const counterSchema = new Schema({
  _id: { type: String, required: true }, // e.g., 'paymentid'
  prefix: { type: String, required: true }, // e.g., 'PAYID'
  sequence_value: { type: Number, default: 0 }
}, {
  collection: 'counters' // Optional: specify collection name
});

module.exports = mongoose.model('CounterPayment', counterSchema);