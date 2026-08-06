import React, { useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import "./Signup.css";

const Signup = () => {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nic, setNic] = useState("");
  const [phone, setPhone] = useState("");
  const [dob, setDob] = useState("");
  const [address, setAddress] = useState("");
  const [ceboNo, setCeboNo] = useState("");
  const [role] = useState("Customer");
  const [nicType, setNicType] = useState("New");
  const [errors, setErrors] = useState({});
  const [currentStep, setCurrentStep] = useState(1);
  const navigate = useNavigate();

  // Validation functions
  const validateName = (value) => /^[A-Za-z]*$/.test(value);
  const validateEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  const validateNic = (value, type) => {
    if (type === "New") return /^\d{12}$/.test(value);
    return /^\d{9}[VX]$/.test(value);
  };
  const validatePhone = (value) => /^\d{10}$/.test(value);
  const validateCeboNo = (value) => /^\d{10}$/.test(value);

  const validateDob = (value) => {
    if (!value) return false;
    const today = new Date();
    const inputDate = new Date(value);
    const ageInYears = (today - inputDate) / (1000 * 60 * 60 * 24 * 365.25);
    return inputDate < today && ageInYears >= 18;
  };

  // Input handlers with real-time validation
  const handleFirstName = (e) => {
    const value = e.target.value;
    if (validateName(value)) {
      setFirstName(value);
      setErrors((prev) => ({ ...prev, firstName: "" }));
    } else if (value === "") {
      setFirstName("");
      setErrors((prev) => ({ ...prev, firstName: "" }));
    } else {
      setErrors((prev) => ({ ...prev, firstName: "Only letters are allowed" }));
    }
  };

  const handleLastName = (e) => {
    const value = e.target.value;
    if (validateName(value)) {
      setLastName(value);
      setErrors((prev) => ({ ...prev, lastName: "" }));
    } else if (value === "") {
      setLastName("");
      setErrors((prev) => ({ ...prev, lastName: "" }));
    } else {
      setErrors((prev) => ({ ...prev, lastName: "Only letters are allowed" }));
    }
  };

  const handleEmail = (e) => {
    const value = e.target.value;
    setEmail(value);
    if (value && !validateEmail(value)) {
      setErrors((prev) => ({ ...prev, email: "Invalid email format" }));
    } else {
      setErrors((prev) => ({ ...prev, email: "" }));
    }
  };

  const handleNic = (e) => {
    const value = e.target.value;
    const isValidInput =
      nicType === "New" ? /^[\d]*$/.test(value) : /^[\dVX]*$/.test(value);
    if (isValidInput && value.length <= (nicType === "New" ? 12 : 10)) {
      setNic(value);
      if (value && !validateNic(value, nicType)) {
        setErrors((prev) => ({
          ...prev,
          nic:
            nicType === "New"
              ? "NIC must be exactly 12 digits"
              : "NIC must be 9 digits followed by V or X",
        }));
      } else {
        setErrors((prev) => ({ ...prev, nic: "" }));
      }
    }
  };

  const handlePhone = (e) => {
    const value = e.target.value;
    if (/^\d{0,10}$/.test(value)) {
      setPhone(value);
      if (value && !validatePhone(value)) {
        setErrors((prev) => ({
          ...prev,
          phone: "Phone number must be exactly 10 digits",
        }));
      } else {
        setErrors((prev) => ({ ...prev, phone: "" }));
      }
    }
  };

  const handleCeboNo = (e) => {
    const value = e.target.value;
    if (/^\d{0,10}$/.test(value)) {
      setCeboNo(value);
      if (value && !validateCeboNo(value)) {
        setErrors((prev) => ({
          ...prev,
          ceboNo: "CEBO number must be exactly 10 digits",
        }));
      } else {
        setErrors((prev) => ({ ...prev, ceboNo: "" }));
      }
    }
  };

  const handleDob = (e) => {
    const value = e.target.value;
    if (
      (/^\d{4}-\d{2}-\d{2}$/.test(value) || value === "") &&
      (validateDob(value) || value === "")
    ) {
      setDob(value);
      setErrors((prev) => ({ ...prev, dob: "" }));
    } else if (value) {
      setErrors((prev) => ({
        ...prev,
        dob: "You must be at least 18 years old and use YYYY-MM-DD format",
      }));
    }
  };

  const nextStep = () => {
    if (currentStep === 1) {
      const step1Errors = {};
      if (!validateName(firstName))
        step1Errors.firstName = "First name can only contain letters";
      if (!validateName(lastName))
        step1Errors.lastName = "Last name can only contain letters";
      if (!validateEmail(email)) step1Errors.email = "Invalid email format";
      if (!password) step1Errors.password = "Password is required";

      if (Object.keys(step1Errors).length === 0) {
        setCurrentStep(2);
      } else {
        setErrors(step1Errors);
      }
    } else if (currentStep === 2) {
      const step2Errors = {};
      if (!validateNic(nic, nicType))
        step2Errors.nic =
          nicType === "New"
            ? "NIC must be exactly 12 digits"
            : "NIC must be 9 digits followed by V or X";
      if (phone && !validatePhone(phone))
        step2Errors.phone = "Phone number must be exactly 10 digits";
      if (!validateDob(dob))
        step2Errors.dob = "You must be at least 18 years old";

      if (Object.keys(step2Errors).length === 0) {
        setCurrentStep(3);
      } else {
        setErrors(step2Errors);
      }
    }
  };

  const prevStep = () => {
    setCurrentStep(currentStep - 1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = {};

    if (!validateName(firstName))
      newErrors.firstName = "First name can only contain letters";
    if (!validateName(lastName))
      newErrors.lastName = "Last name can only contain letters";
    if (!validateEmail(email)) newErrors.email = "Invalid email format";
    if (!password) newErrors.password = "Password is required";
    if (!validateNic(nic, nicType))
      newErrors.nic =
        nicType === "New"
          ? "NIC must be exactly 12 digits"
          : "NIC must be 9 digits followed by V or X";
    if (phone && !validatePhone(phone))
      newErrors.phone = "Phone number must be exactly 10 digits";
    if (ceboNo && !validateCeboNo(ceboNo))
      newErrors.ceboNo = "CEBO number must be exactly 10 digits";
    if (!validateDob(dob)) newErrors.dob = "You must be at least 18 years old";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      await axios.post("http://localhost:5000/auth/signup", {
        firstName,
        lastName,
        email,
        password,
        nic,
        phone,
        dob,
        address,
        ceboNo,
        role: "Customer",
      });
      window.alert("Signup successful! Redirecting to login...");
      navigate("/login");
    } catch (err) {
      setErrors({ submit: err.response?.data?.message || "Signup failed" });
    }
  };

  return (
    <div id="signup-page" className="signup-container">
      {/* Background Elements */}
      <div className="solar-panel-grid"></div>
      <div className="energy-wave energy-wave-1"></div>
      <div className="energy-wave energy-wave-2"></div>
      <div className="energy-wave energy-wave-3"></div>
      <div className="solar-pattern"></div>
      <div className="gradient-overlay"></div>

      <div className="signup-card">
        <div className="signup-header">
          <h1 className="company-title">Selfme.lk</h1>
          <p className="company-tagline">
            Powering Your Future with Solar Energy
          </p>
          <h2 className="form-title">Create Your Account</h2>
        </div>

        {/* Progress Steps */}
        <div className="progress-steps">
          <div className={`step ${currentStep >= 1 ? "active" : ""}`}>
            <div className="step-number">1</div>
            <span>Personal Info</span>
          </div>
          <div className={`step ${currentStep >= 2 ? "active" : ""}`}>
            <div className="step-number">2</div>
            <span>Identity</span>
          </div>
          <div className={`step ${currentStep >= 3 ? "active" : ""}`}>
            <div className="step-number">3</div>
            <span>Additional</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="signup-form">
          {/* Step 1: Personal Information */}
          {currentStep === 1 && (
            <div className="form-step">
              <div className="input-group">
                <div className="input-row">
                  <div className="input-column">
                    <input
                      type="text"
                      placeholder="First Name"
                      value={firstName}
                      onChange={handleFirstName}
                      required
                      className="form-input"
                    />
                    {errors.firstName && (
                      <p className="error-message">{errors.firstName}</p>
                    )}
                  </div>
                  <div className="input-column">
                    <input
                      type="text"
                      placeholder="Last Name"
                      value={lastName}
                      onChange={handleLastName}
                      required
                      className="form-input"
                    />
                    {errors.lastName && (
                      <p className="error-message">{errors.lastName}</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="input-group">
                <input
                  type="email"
                  placeholder="Email Address"
                  value={email}
                  onChange={handleEmail}
                  required
                  className="form-input"
                />
                {errors.email && (
                  <p className="error-message">{errors.email}</p>
                )}
              </div>

              <div className="input-group">
                <input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="form-input"
                />
                {errors.password && (
                  <p className="error-message">{errors.password}</p>
                )}
              </div>

              <button type="button" onClick={nextStep} className="next-button">
                Continue to Identity
              </button>
            </div>
          )}

          {/* Step 2: Identity Information */}
          {currentStep === 2 && (
            <div className="form-step">
              <div className="input-group">
                <div className="nic-selection">
                  <label>NIC Type:</label>
                  <select
                    value={nicType}
                    onChange={(e) => setNicType(e.target.value)}
                    className="nic-select"
                  >
                    <option value="New">New NIC (12 digits)</option>
                    <option value="Old">Old NIC (9 digits + V/X)</option>
                  </select>
                </div>
                <input
                  type="text"
                  placeholder={
                    nicType === "New"
                      ? "Enter 12-digit NIC"
                      : "Enter 9 digits + V/X"
                  }
                  value={nic}
                  onChange={handleNic}
                  required
                  className="form-input"
                  maxLength={nicType === "New" ? 12 : 10}
                />
                {errors.nic && <p className="error-message">{errors.nic}</p>}
              </div>

              <div className="input-group">
                <input
                  type="text"
                  placeholder="Phone Number (10 digits)"
                  value={phone}
                  onChange={handlePhone}
                  className="form-input"
                />
                {errors.phone && (
                  <p className="error-message">{errors.phone}</p>
                )}
              </div>

              <div className="input-group">
                <input
                  type="date"
                  placeholder="Date of Birth"
                  value={dob}
                  onChange={handleDob}
                  max={
                    new Date(new Date().setDate(new Date().getDate() - 1))
                      .toISOString()
                      .split("T")[0]
                  }
                  required
                  className="form-input"
                />
                {errors.dob && <p className="error-message">{errors.dob}</p>}
              </div>

              <div className="form-navigation">
                <button
                  type="button"
                  onClick={prevStep}
                  className="back-button"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={nextStep}
                  className="next-button"
                >
                  Continue to Additional Info
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Additional Information */}
          {currentStep === 3 && (
            <div className="form-step">
              <div className="input-group">
                <input
                  type="text"
                  placeholder="Address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="form-input"
                />
              </div>

              <div className="input-group">
                <input
                  type="text"
                  placeholder="CEBO Number (10 digits)"
                  value={ceboNo}
                  onChange={handleCeboNo}
                  className="form-input"
                />
                {errors.ceboNo && (
                  <p className="error-message">{errors.ceboNo}</p>
                )}
              </div>

              <div className="form-navigation">
                <button
                  type="button"
                  onClick={prevStep}
                  className="back-button"
                >
                  Back
                </button>
                <button type="submit" className="submit-button">
                  Create Account
                </button>
              </div>
            </div>
          )}

          {errors.submit && (
            <p className="error-message submit-error">{errors.submit}</p>
          )}
        </form>

        <div className="login-redirect">
          <p>
            Already have an account?{" "}
            <Link to="/login" className="login-link">
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Signup;