const MyPaidTask = require('../../Model/TechModel/PaidModel');

exports.createPaidTask = async (req, res) => {
  try {
    const tasks = Array.isArray(req.body) ? req.body : [req.body];
    const savedTasks = [];
    const existingTasks = [];

    for (const task of tasks) {
      const existingTask = await MyPaidTask.findOne({ paymentId: task.paymentId });
      if (existingTask) {
        existingTasks.push(task.paymentId);
        continue;
      }

      const paidTask = new MyPaidTask({
        paymentId: task.paymentId,
        userId: task.userId,
        customer: task.customer,
        amount: task.amount,
        paymentDate: task.paymentDate,
        status: task.status,
        statusofmy: task.statusofmy || 'notyet',
      });

      const savedTask = await paidTask.save();
      savedTasks.push(savedTask);
    }

    res.status(201).json({
      message: 'Paid tasks processed',
      savedTasks,
      existingTasks,
    });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.getAllPaidTasks = async (req, res) => {
  try {
    const paidTasks = await MyPaidTask.find();
    res.json(paidTasks);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getPendingTasks = async (req, res) => {
  try {
    const pendingTasks = await MyPaidTask.find({ statusofmy: 'pending' });
    res.json(pendingTasks);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getNotYetTasks = async (req, res) => {
  try {
    const notYetTasks = await MyPaidTask.find({ statusofmy: 'notyet' });
    res.json(notYetTasks);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getCompletedTasks = async (req, res) => {
  try {
    const completedTasks = await MyPaidTask.find({ statusofmy: 'Completed' });
    res.json(completedTasks);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updateStatusOfMy = async (req, res) => {
  try {
    const { paymentId } = req.params;
    const { statusofmy } = req.body;

    // Validate statusofmy
    const validStatuses = ['notyet', 'pending', 'Completed'];
    if (!validStatuses.includes(statusofmy)) {
      return res.status(400).json({ message: 'Invalid statusofmy value. Must be one of: notyet, pending, Completed' });
    }

    const updatedTask = await MyPaidTask.findOneAndUpdate(
      { paymentId },
      { statusofmy },
      { new: true }
    );

    if (!updatedTask) {
      return res.status(404).json({ message: 'Paid task not found' });
    }

    res.json(updatedTask);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};