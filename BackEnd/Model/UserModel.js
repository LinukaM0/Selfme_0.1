// Model/UserModel.js (unchanged, provided for completeness)
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const userSchema = new Schema({
  userid: { type: String, unique: true, required: true }, // Custom userid field (e.g., SELFMEID0001)
  firstName: { type: String, maxlength: 150 },
  lastName: { type: String, maxlength: 150 },
  email: { type: String, required: true, unique: true, maxlength: 150 },
  password: { type: String, required: true, maxlength: 255 }, // Hashed
  nic: { type: String, required: true, maxlength: 100 },
  phone: { type: String, maxlength: 20 },
  dob: { type: Date },
  address: { type: String, maxlength: 255 },
  ceboNo: { type: String, maxlength: 10 }, // For customers/technicians
  role: {
    type: String,
    enum: ['Admin', 'Inventory', 'Finance', 'Technician', 'Customer'],
    required: true
  },
  status: { type: String, maxlength: 20, default: 'Active' }, // Active/Inactive
  created_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', userSchema);