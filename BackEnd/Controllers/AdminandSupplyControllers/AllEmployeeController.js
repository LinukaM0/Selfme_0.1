const Employee = require("../../Model/FinanceManager/staffModel");

// Get all employees
const getAllEmployees = async (req, res, next) => {
  let employees;
  try {
    employees = await Employee.find();
    if (!employees || employees.length === 0) {
      return res.status(404).json({ message: "No employees found" });
    }
    return res.status(200).json({ employees });
  } catch (err) {
    console.error('Error fetching employees:', err);
    return res.status(500).json({ message: "Server error while fetching employees" });
  }
};

// Get employee by ID
const getById = async (req, res, next) => {
  const id = req.params.id;
  let employee;
  try {
    employee = await Employee.findById(id);
    if (!employee) {
      return res.status(404).json({ message: "Employee not found" });
    }
    return res.status(200).json({ employee });
  } catch (err) {
    console.error('Error fetching employee:', err);
    return res.status(500).json({ message: "Server error while fetching employee" });
  }
};

exports.getAllEmployees = getAllEmployees;
exports.getById = getById;