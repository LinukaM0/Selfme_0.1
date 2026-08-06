// Model/AdminandSupplyModel/counterEmployeeModel.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const counterSchema = new Schema({
  _id: { type: String, required: true }, // e.g., 'empId'
  prefix: { type: String, required: true }, // e.g., 'EMPID'
  sequence_value: { type: Number, default: 0 }
}, {
  collection: 'counters' // Optional: specify collection name
});

module.exports = mongoose.model('CounterEmployee', counterSchema);