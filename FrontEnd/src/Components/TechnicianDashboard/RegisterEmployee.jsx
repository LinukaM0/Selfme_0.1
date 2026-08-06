import React, { useState } from "react";
import "./RegisterEmployee.css";
import TechnicianLayout from "./TechnicianLayout";

function RegisterEmployee() {
  const [form, setForm] = useState({
    Employee_name: "",
    Employee_Address: "",
    Employee_Dob: "",
    contact_number: "",
    hire_date: "",
    isManager: "Employee" // Default dropdown value
  });
  const [success, setSuccess] = useState(false);
  const [errors, setErrors] = useState({});

  // Helper: Calculate age from DOB
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

  // Restrict input for name (only letters and spaces)
  const handleNameInput = (e) => {
    const value = e.target.value.replace(/[^A-Za-z\s]/g, "");
    setForm({ ...form, Employee_name: value });
  };

  // Restrict input for contact number (only digits, max 10)
  const handleContactInput = (e) => {
    let value = e.target.value.replace(/\D/g, "");
    if (value.length > 10) value = value.slice(0, 10);
    setForm({ ...form, contact_number: value });
  };

  // Restrict input for address
  const handleAddressInput = (e) => {
    setForm({ ...form, Employee_Address: e.target.value });
  };

  // Handle dropdown for isManager
  const handleManagerInput = (e) => {
    setForm({ ...form, isManager: e.target.value });
  };

  // Restrict input for hire date and dob
  const handleInput = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // Validation before submit
  const validate = () => {
    const newErrors = {};
    if (!form.Employee_name.trim()) {
      newErrors.Employee_name = "Name is required";
    } else if (!/^[A-Za-z\s]+$/.test(form.Employee_name)) {
      newErrors.Employee_name = "Name must contain only letters";
    }
    if (!form.Employee_Address.trim()) {
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
    if (!form.isManager) {
      newErrors.isManager = "Please select a role";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleRegister = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      const response = await fetch("http://localhost:5000/employees/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to register employee');
      }

      setForm({
        Employee_name: "",
        Employee_Address: "",
        Employee_Dob: "",
        contact_number: "",
        hire_date: "",
        isManager: "Employee"
      });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 2000);
    } catch (error) {
      setErrors({ general: error.message });
    }
  };

  // Set date constraints
  const today = new Date();
  const minDob = new Date(today.getFullYear() - 100, today.getMonth(), today.getDate());
  const maxDob = new Date(today.getFullYear() - 18, today.getMonth(), today.getDate());
  const minHireDate = today.toISOString().split("T")[0];
  const maxHireDate = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

  return (
    <TechnicianLayout>
      <div id="registerEmployeeDashboard">
        <h2>Register Employee</h2>
        <form className="employee-form" onSubmit={handleRegister} autoComplete="off">
          <div>
            <label>Name:</label>
            <input
              type="text"
              name="Employee_name"
              value={form.Employee_name}
              onChange={handleNameInput}
              required
              autoComplete="off"
            />
            {errors.Employee_name && (
              <div className="error-msg">{errors.Employee_name}</div>
            )}
          </div>
          <div>
            <label>Address:</label>
            <input
              type="text"
              name="Employee_Address"
              value={form.Employee_Address}
              onChange={handleAddressInput}
              required
              autoComplete="off"
            />
            {errors.Employee_Address && (
              <div className="error-msg">{errors.Employee_Address}</div>
            )}
          </div>
          <div>
            <label>Date of Birth:</label>
            <input
              type="date"
              name="Employee_Dob"
              value={form.Employee_Dob}
              onChange={handleInput}
              min={minDob.toISOString().split("T")[0]}
              max={maxDob.toISOString().split("T")[0]}
              required
            />
            {errors.Employee_Dob && (
              <div className="error-msg">{errors.Employee_Dob}</div>
            )}
          </div>
          <div>
            <label>Contact Number:</label>
            <input
              type="text"
              name="contact_number"
              value={form.contact_number}
              onChange={handleContactInput}
              maxLength={10}
              required
              autoComplete="off"
              inputMode="numeric"
              pattern="\d*"
            />
            {errors.contact_number && (
              <div className="error-msg">{errors.contact_number}</div>
            )}
          </div>
          <div>
            <label>Hire Date:</label>
            <input
              type="date"
              name="hire_date"
              value={form.hire_date}
              onChange={handleInput}
              min={minHireDate}
              max={maxHireDate}
              required
            />
            {errors.hire_date && (
              <div className="error-msg">{errors.hire_date}</div>
            )}
          </div>
          <div>
            <label>Role:</label>
            <select
              name="isManager"
              value={form.isManager}
              onChange={handleManagerInput}
              required
            >
              <option value="Employee">Employee</option>
              <option value="Team Manager">Team Manager</option>
            </select>
            {errors.isManager && (
              <div className="error-msg">{errors.isManager}</div>
            )}
          </div>
          <button className="cta-button primary" type="submit">
            Register
          </button>
        </form>
        {success && (
          <div className="success-msg">Employee registered successfully!</div>
        )}
        {errors.general && (
          <div className="error-msg">{errors.general}</div>
        )}
      </div>
    </TechnicianLayout>
  );
}

export default RegisterEmployee;