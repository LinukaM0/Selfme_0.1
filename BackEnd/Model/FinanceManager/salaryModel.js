const mongoose = require('mongoose');

const salarySchema = new mongoose.Schema({
  empId: { type: String, required: true },
  month: { type: String, required: true },
  workingDays: { type: Number, default: 0 },
  otherAllowance: { type: Number, default: 0 },
  salaryStatus: { type: String, default: 'Non-Paid' },
  basicSalary: { type: Number, default: 0 },
  manpowerAllowance: { type: Number, default: 0 },
  totalSalary: { type: Number, default: 0 }
});

salarySchema.index({ empId: 1, month: 1 }, { unique: true });

module.exports = mongoose.model('Salary', salarySchema);