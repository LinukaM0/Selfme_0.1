import React, { useState } from "react";
import axios from "axios";
import InventoryManagementNav from "../Inventory_Management_Nav/Inventory_Management_Nav";
import "./Supplier.css";

const Supplier = () => {
  const [formData, setFormData] = useState({
    name: "",
    company_name: "",
    email: "",
    phone: "",
    address: "",
    remark: "",
    status: "Active",
  });
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [supplierId, setSupplierId] = useState(null);
  const [validationErrors, setValidationErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    let processedValue = value;

    switch (name) {
      case "name":
      case "company_name":
        // Allow only letters and spaces
        processedValue = value.replace(/[^a-zA-Z\s]/g, "");
        break;
      case "phone":
        // Allow only digits, max 10
        processedValue = value.replace(/[^0-9]/g, "").slice(0, 10);
        break;
      case "address":
        // Max 100 characters
        processedValue = value.slice(0, 100);
        break;
      case "remark":
        // Max 100 characters
        processedValue = value.slice(0, 100);
        break;
      case "email":
        // Max 50 characters
        processedValue = value.slice(0, 50);
        break;
      default:
        processedValue = value;
    }

    setFormData({ ...formData, [name]: processedValue });
    setValidationErrors({ ...validationErrors, [name]: "" });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Invalid image file");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("Max image size 5MB");
      return;
    }
    setImage(file);
    setPreview(URL.createObjectURL(file));
    setError("");
  };

  const validateForm = () => {
    const errors = {};

    if (!formData.name.trim()) {
      errors.name = "Supplier name is required";
    } else if (!/^[a-zA-Z\s]+$/.test(formData.name)) {
      errors.name = "Supplier name can only contain letters and spaces";
    } else if (formData.name.length > 50) {
      errors.name = "Supplier name cannot exceed 50 characters";
    }

    if (
      formData.company_name.trim() &&
      !/^[a-zA-Z\s]+$/.test(formData.company_name)
    ) {
      errors.company_name = "Company name can only contain letters and spaces";
    } else if (formData.company_name.length > 50) {
      errors.company_name = "Company name cannot exceed 50 characters";
    }

    if (formData.email.trim()) {
      const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      if (!emailRegex.test(formData.email)) {
        errors.email = "Invalid email format (e.g., example@domain.com)";
      } else if (formData.email.length > 50) {
        errors.email = "Email cannot exceed 50 characters";
      } else if (
        formData.email.includes("..") ||
        formData.email.includes("@.") ||
        formData.email.includes(".@")
      ) {
        errors.email =
          "Invalid email format (consecutive dots or misplaced symbols)";
      } else if (
        !/^[a-zA-Z0-9][a-zA-Z0-9._%+-]*@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(
          formData.email
        )
      ) {
        errors.email = "Email must start with a letter or number";
      }
    }

    if (formData.phone.trim()) {
      if (!/^\d{10}$/.test(formData.phone)) {
        errors.phone = "Phone number must be exactly 10 digits";
      }
    }

    if (formData.address.length > 100) {
      errors.address = "Address cannot exceed 100 characters";
    }

    if (formData.remark.length > 100) {
      errors.remark = "Remark cannot exceed 100 characters";
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    setError("");
    setSuccess(false);

    const data = new FormData();
    Object.keys(formData).forEach((key) =>
      data.append(key, formData[key] || "")
    );
    if (image) data.append("image", image);

    try {
      const res = await axios.post("http://localhost:5000/suppliers", data, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setSupplierId(res.data._id || res.data.supplier_id);

      setSuccess(true);
      setFormData({
        name: "",
        company_name: "",
        email: "",
        phone: "",
        address: "",
        remark: "",
        status: "Active",
      });
      setImage(null);
      setPreview(null);
      setValidationErrors({});

      const fileInput = document.querySelector('input[type="file"]');
      if (fileInput) fileInput.value = "";
      setTimeout(() => setSuccess(false), 5000);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to add supplier");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClear = () => {
    setFormData({
      name: "",
      company_name: "",
      email: "",
      phone: "",
      address: "",
      remark: "",
      status: "Active",
    });
    setImage(null);
    setPreview(null);
    setError("");
    setSuccess(false);
    setSupplierId(null);
    setValidationErrors({});
    const fileInput = document.querySelector('input[type="file"]');
    if (fileInput) fileInput.value = "";
  };

  return (
    <div className="supplier-page-wrapper">
      <InventoryManagementNav />
      <div className="supplier-form-container">
        <h2>Add New Supplier</h2>
        {error && <div className="error-message">{error}</div>}
        {success && (
          <div className="success-message">
            Supplier added successfully!{" "}
            {supplierId && <span>Supplier ID: {supplierId}</span>}
          </div>
        )}

        <form onSubmit={handleSubmit} className="supplier-form">
          {supplierId && (
            <div className="form-group">
              <input
                type="text"
                value={supplierId}
                readOnly
                disabled
                style={{ background: "#f4f4f4", fontWeight: "bold" }}
              />
            </div>
          )}

          <div className="form-group">
            <input
              type="text"
              name="name"
              placeholder="Supplier Name*"
              value={formData.name}
              onChange={handleChange}
              required
              maxLength={50}
            />
            {validationErrors.name && (
              <span className="error-text">{validationErrors.name}</span>
            )}
          </div>

          <div className="form-group">
            <input
              type="text"
              name="company_name"
              placeholder="Company Name"
              value={formData.company_name}
              onChange={handleChange}
              maxLength={50}
            />
            {validationErrors.company_name && (
              <span className="error-text">
                {validationErrors.company_name}
              </span>
            )}
          </div>

          <div className="form-group">
            <input
              type="email"
              name="email"
              placeholder="Email"
              value={formData.email}
              onChange={handleChange}
              maxLength={50}
            />
            {validationErrors.email && (
              <span className="error-text">{validationErrors.email}</span>
            )}
          </div>

          <div className="form-group">
            <input
              type="tel"
              name="phone"
              placeholder="Phone"
              value={formData.phone}
              onChange={handleChange}
              maxLength={10}
            />
            {validationErrors.phone && (
              <span className="error-text">{validationErrors.phone}</span>
            )}
          </div>

          <div className="form-group">
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
            >
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>

          <div className="form-group">
            <textarea
              name="address"
              placeholder="Address"
              value={formData.address}
              onChange={handleChange}
              maxLength={100}
            ></textarea>
            {validationErrors.address && (
              <span className="error-text">{validationErrors.address}</span>
            )}
          </div>

          <div className="form-group">
            <textarea
              name="remark"
              placeholder="Remarks"
              value={formData.remark}
              onChange={handleChange}
              maxLength={100}
            ></textarea>
            {validationErrors.remark && (
              <span className="error-text">{validationErrors.remark}</span>
            )}
          </div>

          <div className="form-group">
            <input type="file" accept="image/*" onChange={handleImageChange} />
            {preview && (
              <img
                src={preview}
                alt="Preview"
                style={{ width: "100px", margin: "10px 0" }}
              />
            )}
          </div>

          <div className="form-actions">
            <button type="button" onClick={handleClear}>
              Clear
            </button>
            <button type="submit" disabled={isLoading}>
              {isLoading ? "Adding..." : "Add Supplier"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Supplier;
