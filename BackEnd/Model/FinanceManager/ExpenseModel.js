// BackEnd/Model/FinanceModel/ExpenseModel.js
const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema({
  type: {
    type: String,
    required: [true, 'Expense type is required'],
    enum: ['Utilities', 'Rent', 'Supplies', 'Travel', 'Miscellaneous'],
  },
  amount: {
    type: Number,
    required: [true, 'Amount is required'],
    min: [0, 'Amount must be positive'],
  },
  date: {
    type: Date,
    required: [true, 'Date is required'],
  },
  description: {
    type: String,
    trim: true,
  },
  referenceId: {
    type: String,
    required: [true, 'Reference ID is required'],
    unique: true, // Ensure uniqueness
    trim: true,
  },
  month: {
    type: String,
    required: [true, 'Month is required'],
    trim: true, // e.g., "September 2025"
  },
}, { timestamps: true });

module.exports = mongoose.model('Expense', expenseSchema);