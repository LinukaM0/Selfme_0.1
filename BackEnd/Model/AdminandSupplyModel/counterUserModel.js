// Model/AdminandSupplyModel/counterUserModel.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const counterSchema = new Schema({
  _id: { type: String, required: true }, // e.g., 'userid'
  prefix: { type: String, required: true }, // e.g., 'SELFMEID'
  sequence_value: { type: Number, default: 0 }
}, {
  collection: 'counters' // Optional: specify collection name
});

module.exports = mongoose.model('CounterUser', counterSchema);