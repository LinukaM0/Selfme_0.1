const Salary = require('../../Model/FinanceManager/salaryModel');
const Staff = require('../../Model/FinanceManager/staffModel');
const JobAssigning = require('../../Model/FinanceManager/jobAssigningModel');

const months = [
  'January 2025', 'February 2025', 'March 2025', 'April 2025', 'May 2025', 'June 2025',
  'July 2025', 'August 2025', 'September 2025'
];

exports.getAllSalaries = async (req, res) => {
  const month = req.query.month;
  if (!month) {
    return res.status(400).json({ message: 'Month is required' });
  }
  try {
    const staff = await Staff.find({});
    const jobAssignments = await JobAssigning.find();
    const salaries = [];

    for (const staffMember of staff) {
      const monthStart = new Date(month.split(' ')[1], months.indexOf(month), 1);
      const monthEnd = new Date(month.split(' ')[1], months.indexOf(month) + 1, 0);
      const assignments = jobAssignments.filter(ja => {
        const start = new Date(ja.startDate);
        const end = new Date(ja.endDate);
        return ja.empId === staffMember.empId && start <= monthEnd && end >= monthStart;
      });
      let totalDays = 0;
      const processedDates = new Set();
      assignments.forEach(ja => {
        const start = new Date(ja.startDate);
        const end = new Date(ja.endDate);
        const adjustedStart = new Date(Math.max(monthStart, start));
        const adjustedEnd = new Date(Math.min(monthEnd, end));
        if (adjustedStart <= adjustedEnd) {
          for (let d = new Date(adjustedStart); d <= adjustedEnd; d.setDate(d.getDate() + 1)) {
            const dateStr = d.toISOString().split('T')[0];
            if (!processedDates.has(dateStr)) {
              processedDates.add(dateStr);
              totalDays++;
            }
          }
        }
      });

      const isManager = staffMember.isManager;
      const basicSalary = isManager ? 20000 : 10000;
      const perDayManpower = 3000;
      const manpowerAllowance = perDayManpower * totalDays;
      const existingSalary = await Salary.findOne({ empId: staffMember.empId, month });
      const otherAllowance = existingSalary ? existingSalary.otherAllowance || 0 : 0;
      const totalSalary = basicSalary + manpowerAllowance + otherAllowance;

      if (!existingSalary) {
        const salary = new Salary({
          empId: staffMember.empId,
          month,
          workingDays: totalDays,
          otherAllowance,
          salaryStatus: 'Non-Paid',
          basicSalary,
          manpowerAllowance,
          totalSalary
        });
        await salary.save();
        salaries.push(salary);
      } else {
        await Salary.findByIdAndUpdate(existingSalary._id, {
          workingDays: totalDays,
          basicSalary,
          manpowerAllowance,
          totalSalary
        }, { new: true });
        salaries.push(existingSalary);
      }
    }

    const result = await Salary.aggregate([
      { $match: { month } },
      {
        $lookup: {
          from: 'staffs',
          localField: 'empId',
          foreignField: 'empId',
          as: 'staffDetails'
        }
      },
      { $unwind: '$staffDetails' },
      {
        $project: {
          _id: 1,
          empId: 1,
          name: '$staffDetails.name',
          isManager: '$staffDetails.isManager',
          workingDays: 1,
          otherAllowance: 1,
          salaryStatus: 1,
          basicSalary: 1,
          manpowerAllowance: 1,
          totalSalary: 1
        }
      }
    ]);
    res.json(result);
  } catch (err) {
    console.error('Error in getAllSalaries:', err.message);
    res.status(500).json({ message: err.message });
  }
};

exports.getAllStaff = async (req, res) => {
  try {
    const staff = await Staff.find({});
    res.json(staff);
  } catch (err) {
    console.error('Error in getAllStaff:', err.message);
    res.status(500).json({ message: err.message });
  }
};

exports.createSalary = async (req, res) => {
  const { empId, month, workingDays, otherAllowance, salaryStatus } = req.body;
  try {
    const staff = await Staff.findOne({ empId });
    if (!staff) {
      return res.status(404).json({ message: 'Staff not found' });
    }
    const isManager = staff.isManager;
    const basicSalary = isManager ? 20000 : 10000;
    const perDayManpower = 3000;
    const manpowerAllowance = perDayManpower * workingDays;
    const totalSalary = basicSalary + manpowerAllowance + (otherAllowance || 0);

    const salary = new Salary({
      empId,
      month,
      workingDays,
      otherAllowance: otherAllowance || 0,
      salaryStatus,
      basicSalary,
      manpowerAllowance,
      totalSalary
    });
    const newSalary = await salary.save();
    res.status(201).json(newSalary);
  } catch (err) {
    console.error('Error in createSalary:', err.message);
    res.status(400).json({ message: err.message });
  }
};

exports.updateSalary = async (req, res) => {
  try {
    const salary = await Salary.findById(req.params.id);
    if (!salary) {
      return res.status(404).json({ message: 'Salary not found' });
    }
    const staff = await Staff.findOne({ empId: salary.empId });
    if (!staff) {
      return res.status(404).json({ message: 'Staff not found' });
    }
    const isManager = staff.isManager;
    const month = salary.month;
    const workingDays = await calculateWorkingDays(salary.empId, month);
    const otherAllowance = req.body.otherAllowance !== undefined ? parseInt(req.body.otherAllowance) : salary.otherAllowance || 0;
    const basicSalary = isManager ? 20000 : 10000;
    const perDayManpower = 3000;
    const manpowerAllowance = perDayManpower * workingDays;
    const totalSalary = basicSalary + manpowerAllowance + otherAllowance;

    const updatedSalary = await Salary.findByIdAndUpdate(req.params.id, {
      workingDays,
      otherAllowance,
      salaryStatus: req.body.salaryStatus || salary.salaryStatus,
      basicSalary,
      manpowerAllowance,
      totalSalary
    }, { new: true, runValidators: true });
    if (!updatedSalary) throw new Error('Update failed');
    res.json(updatedSalary);
  } catch (err) {
    console.error('Error in updateSalary:', err.message);
    res.status(400).json({ message: err.message });
  }
};

exports.deleteSalary = async (req, res) => {
  try {
    await Salary.findByIdAndDelete(req.params.id);
    res.json({ message: 'Salary deleted' });
  } catch (err) {
    console.error('Error in deleteSalary:', err.message);
    res.status(500).json({ message: err.message });
  }
};

const calculateWorkingDays = async (empId, month) => {
  const monthStart = new Date(month.split(' ')[1], months.indexOf(month), 1);
  const monthEnd = new Date(month.split(' ')[1], months.indexOf(month) + 1, 0);
  const jobAssignments = await JobAssigning.find({ empId });
  let totalDays = 0;
  const processedDates = new Set();
  jobAssignments.forEach(ja => {
    const start = new Date(ja.startDate);
    const end = new Date(ja.endDate);
    if (start <= monthEnd && end >= monthStart) {
      const adjustedStart = new Date(Math.max(monthStart, start));
      const adjustedEnd = new Date(Math.min(monthEnd, end));
      for (let d = new Date(adjustedStart); d <= adjustedEnd; d.setDate(d.getDate() + 1)) {
        const dateStr = d.toISOString().split('T')[0];
        if (!processedDates.has(dateStr)) {
          processedDates.add(dateStr);
          totalDays++;
        }
      }
    }
  });
  return totalDays;
};