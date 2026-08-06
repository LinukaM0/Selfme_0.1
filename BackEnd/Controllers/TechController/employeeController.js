const Staff = require('../../Model/FinanceManager/staffModel');
const Counter = require('../../Model/AdminandSupplyModel/counterEmployeeModel');

// Function to get the next sequence value for empId
const getNextSequenceValue = async (sequenceName) => {
  const prefix = 'EMPID'; // Fixed prefix for empId
  const counter = await Counter.findOneAndUpdate(
    { _id: sequenceName },
    { 
      $inc: { sequence_value: 1 },
      $setOnInsert: { prefix } // Set prefix only on insert (first time)
    },
    { new: true, upsert: true }
  );
  const sequence = counter.sequence_value.toString().padStart(4, '0'); // Pad with zeros to get 0001, 0002, etc.
  return `${counter.prefix}${sequence}`; // e.g., EMPID0001
};

// Register new employee
exports.registerEmployee = async (req, res) => {
  try {
    const { Employee_name, Employee_Address, Employee_Dob, contact_number, hire_date, isManager } = req.body;

    // Validate required fields
    if (!Employee_name || !/^[A-Za-z\s]+$/.test(Employee_name)) {
      return res.status(400).json({ error: 'Name must contain only letters and spaces' });
    }
    if (!Employee_Address) {
      return res.status(400).json({ error: 'Address is required' });
    }
    if (!Employee_Dob || (new Date().getFullYear() - new Date(Employee_Dob).getFullYear()) < 18) {
      return res.status(400).json({ error: 'Employee must be at least 18 years old' });
    }
    if (!contact_number || !/^\d{10}$/.test(contact_number)) {
      return res.status(400).json({ error: 'Contact number must be exactly 10 digits' });
    }
    if (!hire_date) {
      return res.status(400).json({ error: 'Hire date is required' });
    }

    // Generate empId
    const empId = await getNextSequenceValue('empId');

    // Map dropdown value to boolean for isManager
    const isManagerBoolean = isManager === 'Team Manager';

    const employee = new Staff({
      empId,
      name: Employee_name,
      address: Employee_Address,
      dob: new Date(Employee_Dob),
      contactNumber: contact_number,
      hireDate: new Date(hire_date),
      isManager: isManagerBoolean
    });

    await employee.save();
    res.status(201).json(employee);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ error: 'Employee ID already exists' });
    }
    res.status(400).json({ error: err.message });
  }
};

// Get all employees
exports.getAllEmployees = async (req, res) => {
  try {
    const employees = await Staff.find();
    // Map to match frontend field names
    const formattedEmployees = employees.map(emp => ({
      _id: emp._id,
      employee_id: emp.empId,
      Employee_name: emp.name,
      Employee_Address: emp.address,
      Employee_Dob: emp.dob ? emp.dob.toISOString() : null,
      contact_number: emp.contactNumber,
      hire_date: emp.hireDate ? emp.hireDate.toISOString() : null,
      isManager: emp.isManager ? 'Team Manager' : 'Employee'
    }));
    res.json(formattedEmployees);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Delete employee
exports.deleteEmployee = async (req, res) => {
  try {
    const employee = await Staff.findByIdAndDelete(req.params.id);
    if (!employee) {
      return res.status(404).json({ error: 'Employee not found' });
    }
    res.json({ message: 'Employee deleted successfully' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Update employee
exports.updateEmployee = async (req, res) => {
  try {
    const { Employee_name, Employee_Address, Employee_Dob, contact_number, hire_date, isManager } = req.body;

    // Validate inputs
    if (!Employee_name || !/^[A-Za-z\s]+$/.test(Employee_name)) {
      return res.status(400).json({ error: 'Name must contain only letters and spaces' });
    }
    if (!Employee_Address) {
      return res.status(400).json({ error: 'Address is required' });
    }
    if (!Employee_Dob || (new Date().getFullYear() - new Date(Employee_Dob).getFullYear()) < 18) {
      return res.status(400).json({ error: 'Employee must be at least 18 years old' });
    }
    if (!contact_number || !/^\d{10}$/.test(contact_number)) {
      return res.status(400).json({ error: 'Contact number must be exactly 10 digits' });
    }
    if (!hire_date) {
      return res.status(400).json({ error: 'Hire date is required' });
    }

    // Map dropdown value to boolean for isManager
    const isManagerBoolean = isManager === 'Team Manager';

    const updated = await Staff.findByIdAndUpdate(
      req.params.id,
      {
        name: Employee_name,
        address: Employee_Address,
        dob: new Date(Employee_Dob),
        contactNumber: contact_number,
        hireDate: new Date(hire_date),
        isManager: isManagerBoolean
      },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    // Format response to match frontend
    const formattedEmployee = {
      _id: updated._id,
      employee_id: updated.empId,
      Employee_name: updated.name,
      Employee_Address: updated.address,
      Employee_Dob: updated.dob ? updated.dob.toISOString() : null,
      contact_number: updated.contactNumber,
      hire_date: updated.hireDate ? updated.hireDate.toISOString() : null,
      isManager: updated.isManager ? 'Team Manager' : 'Employee'
    };

    res.json(formattedEmployee);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};