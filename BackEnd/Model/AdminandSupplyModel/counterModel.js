const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const counterSchema = new Schema({
  _id: { type: String, required: true }, // e.g., 'empId', 'feedbackId'
  sequence_value: { type: Number, default: 0 },
  prefix: { type: String, required: true } // e.g., 'EMPID', 'FEBID'
});

module.exports = mongoose.model('Counter', counterSchema);