const Expense = require('../../Model/FinanceManager/ExpenseModel');

// Generate unique referenceId in EXPXXX format
const generateReferenceId = async () => {
  const prefix = 'EXP';
  let isUnique = false;
  let referenceId;

  while (!isUnique) {
    // Generate random 3-digit number (001-999)
    const randomNum = Math.floor(100 + Math.random() * 900).toString().padStart(3, '0');
    referenceId = `${prefix}${randomNum}`;
    
    // Check if referenceId exists
    const existingExpense = await Expense.findOne({ referenceId });
    if (!existingExpense) {
      isUnique = true;
    }
  }

  return referenceId;
};

exports.getExpenses = async (req, res) => {
  try {
    console.log('GET /api/finance/expenses received with month:', req.query.month);
    const month = req.query.month || 'September 2025';
    const expenses = await Expense.find({ month });
    res.json(expenses);
  } catch (err) {
    console.error('Error fetching expenses:', err.message);
    res.status(500).json({ message: err.message });
  }
};

exports.createExpense = async (req, res) => {
  try {
    console.log('POST /api/finance/expenses received with body:', req.body);
    const { type, amount, date, description, month } = req.body;

    // Validate required fields
    if (!type || !amount || !date || !month) {
      return res.status(400).json({ message: 'Type, amount, date, and month are required' });
    }

    // Validate amount
    if (amount <= 0) {
      return res.status(400).json({ message: 'Amount must be greater than zero' });
    }

    // Validate date
    const expenseDate = new Date(date);
    const today = new Date();
    if (expenseDate > today) {
      return res.status(400).json({ message: 'Expense date cannot be in the future' });
    }

    // Generate unique referenceId
    const referenceId = await generateReferenceId();

    const expense = new Expense({
      type,
      amount: Number(amount),
      date,
      description,
      referenceId,
      month,
    });
    const newExpense = await expense.save();
    res.status(201).json(newExpense);
  } catch (err) {
    console.error('Error adding expense:', {
      message: err.message,
      body: req.body,
    });
    res.status(400).json({ message: err.message });
  }
};

exports.updateExpense = async (req, res) => {
  try {
    console.log('PUT /api/finance/expenses/:id received with body:', req.body);
    const { id } = req.params;
    const { type, amount, date, description, month } = req.body;

    // Validate required fields
    if (!type || !amount || !date || !month) {
      return res.status(400).json({ message: 'Type, amount, date, and month are required' });
    }

    // Validate amount
    if (amount <= 0) {
      return res.status(400).json({ message: 'Amount must be greater than zero' });
    }

    // Validate date
    const expenseDate = new Date(date);
    const today = new Date();
    if (expenseDate > today) {
      return res.status(400).json({ message: 'Expense date cannot be in the future' });
    }

    const expense = await Expense.findById(id);
    if (!expense) {
      return res.status(404).json({ message: 'Expense not found' });
    }

    expense.type = type;
    expense.amount = Number(amount);
    expense.date = date;
    expense.description = description;
    expense.month = month;

    const updatedExpense = await expense.save();
    res.json(updatedExpense);
  } catch (err) {
    console.error('Error updating expense:', err.message);
    res.status(400).json({ message: err.message });
  }
};

exports.deleteExpense = async (req, res) => {
  try {
    console.log('DELETE /api/finance/expenses/:id received');
    const { id } = req.params;
    const expense = await Expense.findById(id);
    if (!expense) {
      return res.status(404).json({ message: 'Expense not found' });
    }
    await expense.deleteOne();
    res.json({ message: 'Expense deleted successfully' });
  } catch (err) {
    console.error('Error deleting expense:', err.message);
    res.status(400).json({ message: err.message });
  }
};