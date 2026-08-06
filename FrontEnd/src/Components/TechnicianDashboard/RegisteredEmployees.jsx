import React, { useEffect, useState } from "react";
import "./RegisteredEmployees.css";
import TechnicianLayout from "./TechnicianLayout";

function RegisteredEmployees() {
  const [employees, setEmployees] = useState([]);
  const [editEmp, setEditEmp] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [editErrors, setEditErrors] = useState({});
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = () => {
    fetch("http://localhost:5000/employees")
      .then((res) => res.json())
      .then((data) => setEmployees(data))
      .catch(() => setEmployees([]));
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this employee?")) {
      await fetch(`http://localhost:5000/employees/${id}`, { method: "DELETE" });
      fetchEmployees();
    }
  };

  // Validation helpers
  const getAge = (dob) => {
    if (!dob) return 0;
    const today = new Date();
    const birthDate = new Date(dob);
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const validate = (form) => {
    const newErrors = {};
    if (!form.Employee_name || !form.Employee_name.trim()) {
      newErrors.Employee_name = "Name is required";
    } else if (!/^[A-Za-z\s]+$/.test(form.Employee_name)) {
      newErrors.Employee_name = "Name must contain only letters and spaces";
    }
    if (!form.Employee_Address || !form.Employee_Address.trim()) {
      newErrors.Employee_Address = "Address is required";
    }
    if (!form.Employee_Dob) {
      newErrors.Employee_Dob = "Date of Birth is required";
    } else if (getAge(form.Employee_Dob) < 18) {
      newErrors.Employee_Dob = "Employee must be at least 18 years old";
    }
    if (!form.contact_number) {
      newErrors.contact_number = "Contact number is required";
    } else if (!/^\d{10}$/.test(form.contact_number)) {
      newErrors.contact_number = "Contact number must be exactly 10 digits";
    }
    if (!form.hire_date) {
      newErrors.hire_date = "Hire date is required";
    } else {
      const hireDate = new Date(form.hire_date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const sevenDaysFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
      if (hireDate < today || hireDate > sevenDaysFromNow) {
        newErrors.hire_date = "Hire date must be between today and the next 7 days";
      }
    }
    return newErrors;
  };

  const openEdit = (emp) => {
    setEditEmp(emp);
    setEditForm({
      Employee_name: emp.Employee_name,
      Employee_Address: emp.Employee_Address,
      Employee_Dob: emp.Employee_Dob?.slice(0, 10),
      contact_number: emp.contact_number,
      hire_date: emp.hire_date?.slice(0, 10),
      isManager: emp.isManager, // Use the string value directly
    });
    setEditErrors({});
  };

  const handleEditInput = (e) => {
    const { name, value } = e.target;
    let newValue = value;
    if (name === "Employee_name") {
      newValue = value.replace(/[^A-Za-z\s]/g, "");
    }
    if (name === "contact_number") {
      newValue = value.replace(/\D/g, "").slice(0, 10);
    }
    setEditForm({ ...editForm, [name]: newValue });
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    const errs = validate(editForm);
    setEditErrors(errs);
    if (Object.keys(errs).length > 0) return;

    try {
      const response = await fetch(`http://localhost:5000/employees/${editEmp._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update employee");
      }
      setEditEmp(null);
      setSuccess(true);
      fetchEmployees();
      setTimeout(() => setSuccess(false), 2000);
    } catch (err) {
      setEditErrors({ general: err.message });
    }
  };

  // Set max date for DOB to ensure 18+ only
  const today = new Date();
  const minDob = new Date(today.getFullYear() - 100, today.getMonth(), today.getDate());
  const maxDob = new Date(today.getFullYear() - 18, today.getMonth(), today.getDate());
  const minHireDate = today.toISOString().split("T")[0];
  const sevenDaysFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
  const maxHireDate = sevenDaysFromNow.toISOString().split("T")[0];

  return (
    <TechnicianLayout>
      <div id="registeredEmployeesDashboard">
        <h2>Registered Employees</h2>
        {success && <div className="success-msg">Employee updated successfully!</div>}
        {editErrors.general && <div className="error-msg">{editErrors.general}</div>}
        <table className="orders-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Address</th>
              <th>DOB</th>
              <th>Contact</th>
              <th>Hire Date</th>
              <th>Role</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {employees.map((emp) => (
              <tr key={emp._id}>
                <td>{emp.employee_id || emp._id}</td>
                <td>{emp.Employee_name}</td>
                <td>{emp.Employee_Address}</td>
                <td>{emp.Employee_Dob?.slice(0, 10)}</td>
                <td>{emp.contact_number}</td>
                <td>{emp.hire_date?.slice(0, 10)}</td>
                <td>{emp.isManager}</td>
                <td>
                  <button className="cta-button" onClick={() => openEdit(emp)}>
                    Edit
                  </button>
                  <button
                    className="cta-button"
                    style={{ background: "#dc3545", color: "#fff" }}
                    onClick={() => handleDelete(emp._id)}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Edit Modal */}
        {editEmp && (
          <div className="modal-overlay">
            <div className="modal-content" style={{ minWidth: "500px" }}>
              <h3>Edit Employee</h3>
              <form className="employee-form" style={{ maxWidth: "100%" }} onSubmit={handleEditSubmit}>
                <div>
                  <label>Name:</label>
                  <input
                    type="text"
                    name="Employee_name"
                    value={editForm.Employee_name}
                    onChange={handleEditInput}
                    required
                  />
                  {editErrors.Employee_name && (
                    <div className="error-msg">{editErrors.Employee_name}</div>
                  )}
                </div>
                <div>
                  <label>Address:</label>
                  <input
                    type="text"
                    name="Employee_Address"
                    value={editForm.Employee_Address}
                    onChange={handleEditInput}
                    required
                  />
                  {editErrors.Employee_Address && (
                    <div className="error-msg">{editErrors.Employee_Address}</div>
                  )}
                </div>
                <div>
                  <label>Date of Birth:</label>
                  <input
                    type="date"
                    name="Employee_Dob"
                    value={editForm.Employee_Dob}
                    onChange={handleEditInput}
                    min={minDob.toISOString().split("T")[0]}
                    max={maxDob.toISOString().split("T")[0]}
                    required
                  />
                  {editErrors.Employee_Dob && (
                    <div className="error-msg">{editErrors.Employee_Dob}</div>
                  )}
                </div>
                <div>
                  <label>Contact Number:</label>
                  <input
                    type="text"
                    name="contact_number"
                    value={editForm.contact_number}
                    onChange={handleEditInput}
                    maxLength={10}
                    required
                    inputMode="numeric"
                    pattern="\d*"
                  />
                  {editErrors.contact_number && (
                    <div className="error-msg">{editErrors.contact_number}</div>
                  )}
                </div>
                <div>
                  <label>Hire Date:</label>
                  <input
                    type="date"
                    name="hire_date"
                    value={editForm.hire_date}
                    onChange={handleEditInput}
                    min={minHireDate}
                    max={maxHireDate}
                    required
                  />
                  {editErrors.hire_date && (
                    <div className="error-msg">{editErrors.hire_date}</div>
                  )}
                </div>
                <div>
                  <label>Role:</label>
                  <select
                    name="isManager"
                    value={editForm.isManager}
                    onChange={handleEditInput}
                    required
                  >
                    <option value="Team Manager">Team Manager</option>
                    <option value="Employee">Employee</option>
                  </select>
                </div>
                <button className="cta-button primary" type="submit">
                  Save
                </button>
                <button
                  className="cta-button"
                  style={{ marginLeft: "10px" }}
                  type="button"
                  onClick={() => setEditEmp(null)}
                >
                  Cancel
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </TechnicianLayout>
  );
}

export default RegisteredEmployees;