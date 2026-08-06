
const mongoose = require('mongoose');

const staffSchema = new mongoose.Schema({
  empId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  isManager: { type: Boolean, default: false },
  address: { type: String },
  dob: { type: Date },
  contactNumber: { type: String },
  hireDate: { type: Date }
});

module.exports = mongoose.model('Staff', staffSchema);