import React, { useEffect, useState } from "react";
import axios from "axios";
import InventoryManagementNav from "../Inventory_Management_Nav/Inventory_Management_Nav";
import { jsPDF } from "jspdf";
import "jspdf-autotable";
import logo from "./logo selfme.png";
import "./View_Suppliers.css";

const View_Suppliers = () => {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [supplierToDelete, setSupplierToDelete] = useState(null);
  const [updateLoading, setUpdateLoading] = useState(false);
  const [updateError, setUpdateError] = useState(null);
  const [updateSuccess, setUpdateSuccess] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});

  const fetchSuppliers = async () => {
    try {
      setLoading(true);
      const response = await axios.get("http://localhost:5000/suppliers");
      setSuppliers(response.data);
      setError(null);
    } catch (err) {
      setError("Failed to fetch suppliers.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const openEditModal = (supplier) => {
    setSelectedSupplier({
      _id: supplier._id || "",
      supplier_id: supplier.supplier_id || "",
      name: supplier.name || "",
      company_name: supplier.company_name || "",
      email: supplier.email || "",
      phone: supplier.phone || "",
      address: supplier.address || "",
      status: supplier.status || "Active",
      remark: supplier.remark || "",
      image: supplier.image || "",
      newImage: null,
      imagePreview: supplier.image
        ? `http://localhost:5000/uploads/${supplier.image}`
        : null,
    });
    setIsEditModalOpen(true);
    setUpdateError(null);
    setUpdateSuccess(false);
    setValidationErrors({});
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    let processedValue = value;

    switch (name) {
      case "name":
      case "company_name":
        // Allow only letters and spaces
        processedValue = value.replace(/[^a-zA-Z\s]/g, "").slice(0, 50);
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

    setSelectedSupplier((prev) => ({
      ...prev,
      [name]: processedValue,
    }));
    setValidationErrors({ ...validationErrors, [name]: "" });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setUpdateError("Invalid image file");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setUpdateError("Max image size 5MB");
      return;
    }
    setSelectedSupplier((prev) => ({
      ...prev,
      newImage: file,
      imagePreview: URL.createObjectURL(file),
    }));
    setUpdateError(null);
  };

  const validateForm = () => {
    const errors = {};

    if (!selectedSupplier.supplier_id) {
      errors.supplier_id = "Supplier ID is required";
    }

    if (!selectedSupplier.name.trim()) {
      errors.name = "Supplier name is required";
    } else if (!/^[a-zA-Z\s]+$/.test(selectedSupplier.name)) {
      errors.name = "Supplier name can only contain letters and spaces";
    } else if (selectedSupplier.name.length > 50) {
      errors.name = "Supplier name cannot exceed 50 characters";
    }

    if (
      selectedSupplier.company_name.trim() &&
      !/^[a-zA-Z\s]+$/.test(selectedSupplier.company_name)
    ) {
      errors.company_name = "Company name can only contain letters and spaces";
    } else if (selectedSupplier.company_name.length > 50) {
      errors.company_name = "Company name cannot exceed 50 characters";
    }

    if (selectedSupplier.email.trim()) {
      const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      if (!emailRegex.test(selectedSupplier.email)) {
        errors.email = "Invalid email format (e.g., example@domain.com)";
      } else if (selectedSupplier.email.length > 50) {
        errors.email = "Email cannot exceed 50 characters";
      } else if (
        selectedSupplier.email.includes("..") ||
        selectedSupplier.email.includes("@.") ||
        selectedSupplier.email.includes(".@")
      ) {
        errors.email =
          "Invalid email format (consecutive dots or misplaced symbols)";
      } else if (
        !/^[a-zA-Z0-9][a-zA-Z0-9._%+-]*@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(
          selectedSupplier.email
        )
      ) {
        errors.email = "Email must start with a letter or number";
      }
    }

    if (selectedSupplier.phone.trim()) {
      if (!/^\d{10}$/.test(selectedSupplier.phone)) {
        errors.phone = "Phone number must be exactly 10 digits";
      }
    }

    if (selectedSupplier.address.length > 100) {
      errors.address = "Address cannot exceed 100 characters";
    }

    if (selectedSupplier.remark.length > 100) {
      errors.remark = "Remark cannot exceed 100 characters";
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setUpdateLoading(true);
    setUpdateError(null);
    setUpdateSuccess(false);

    try {
      const formData = new FormData();
      // Only append fields expected by the backend
      const fieldsToAppend = [
        "name",
        "company_name",
        "email",
        "phone",
        "address",
        "remark",
        "status",
      ];
      fieldsToAppend.forEach((key) => {
        formData.append(key, selectedSupplier[key] || "");
      });
      if (selectedSupplier.newImage) {
        formData.append("image", selectedSupplier.newImage);
      }

      await axios.put(
        `http://localhost:5000/suppliers/${selectedSupplier._id}`,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );

      setUpdateSuccess(true);
      setIsEditModalOpen(false);
      fetchSuppliers();
      setTimeout(() => setUpdateSuccess(false), 3000);
    } catch (err) {
      setUpdateError(err.response?.data?.error || "Failed to update supplier.");
    } finally {
      setUpdateLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      await axios.delete(
        `http://localhost:5000/suppliers/${supplierToDelete._id}`
      );
      setSuppliers(suppliers.filter((s) => s._id !== supplierToDelete._id));
      setIsDeleteModalOpen(false);
      setSupplierToDelete(null);
    } catch (err) {
      setError("Failed to delete supplier.");
    }
  };

  const openDeleteModal = (supplier) => {
    setSupplierToDelete(supplier);
    setIsDeleteModalOpen(true);
  };

  const handlePrintPDF = () => {
    if (!suppliers.length) return alert("No suppliers to export.");
    const doc = new jsPDF("p", "mm", "a4");
    const margin = 15;
    const pageWidth = doc.internal.pageSize.getWidth();
    const date = new Date();
    const formattedDate = date.toLocaleDateString();
    const formattedTime = date.toLocaleTimeString();

    const img = new Image();
    img.src = logo;
    img.onload = () => {
      doc.addImage(img, "PNG", margin, 8, 20, 20);
      doc.setFontSize(16);
      doc.setTextColor(33, 37, 41);
      doc.text("SelfMe Pvt Ltd", margin + 25, 15);

      doc.setFontSize(9);
      doc.setTextColor(100, 100, 100);
      doc.text("No/346, Madalanda, Dompe, Colombo, Sri Lanka", margin + 25, 21);
      doc.text(
        "Phone: +94 717 882 883 | Email: Selfmepvtltd@gmail.com",
        margin + 25,
        26
      );

      doc.setDrawColor(200, 200, 200);
      doc.setLineWidth(0.5);
      doc.line(margin, 32, pageWidth - margin, 32);

      doc.setFontSize(14);
      doc.setTextColor(0, 53, 128);
      doc.text("SUPPLIER LIST REPORT", pageWidth / 2, 45, { align: "center" });

      doc.setFontSize(10);
      doc.setTextColor(80, 80, 80);
      doc.text(
        `Generated on: ${formattedDate} at ${formattedTime}`,
        margin,
        55
      );
      doc.text(`Total Suppliers: ${suppliers.length}`, margin, 62);

      const tableColumns = [
        { header: "#", dataKey: "index" },
        { header: "Supplier ID", dataKey: "supplier_id" },
        { header: "Name", dataKey: "name" },
        { header: "Company", dataKey: "company" },
        { header: "Email", dataKey: "email" },
        { header: "Phone", dataKey: "phone" },
        { header: "Status", dataKey: "status" },
      ];

      const tableData = suppliers.map((s, i) => ({
        index: i + 1,
        supplier_id: s.supplier_id || "N/A",
        name: s.name || "N/A",
        company: s.company_name || "N/A",
        email: s.email || "N/A",
        phone: s.phone || "N/A",
        status: s.status || "Active",
      }));

      doc.autoTable({
        columns: tableColumns,
        body: tableData,
        startY: 75,
        margin: { left: margin, right: margin },
        theme: "grid",
        headStyles: {
          fillColor: [0, 53, 128],
          textColor: 255,
          fontStyle: "bold",
          halign: "center",
        },
        columnStyles: {
          index: { halign: "center", fontStyle: "bold" },
          status: { halign: "center" },
        },
        didDrawPage: (data) => {
          const pageCount = doc.internal.getNumberOfPages();
          doc.setFontSize(8);
          doc.setTextColor(150, 150, 150);
          doc.text(
            `SelfMe Inventory Management System - Page ${data.pageNumber} of ${pageCount}`,
            pageWidth / 2,
            doc.internal.pageSize.height - 10,
            { align: "center" }
          );
        },
      });

      doc.save(`Supplier_List_${formattedDate.replace(/\//g, "-")}.pdf`);
    };
  };

  return (
    <div id="suppliers-page">
      <InventoryManagementNav />
      <div id="suppliers-content" className="suppliers-content">
        <div id="suppliers-header" className="page-header">
          <div className="header-info">
            <h1>Supplier Management</h1>
            <p>Manage all supplier information and details</p>
          </div>
          <div className="header-actions">
            {/* <button
              className="btn-primary"
              onClick={() => (window.location.href = "/supplier")}
            >
              Add New Supplier
            </button> */}
          </div>
        </div>

        <div id="suppliers-stats" className="stats-container">
          <div className="stat-item">
            <h3>{suppliers.length}</h3>
            <p>Total Suppliers</p>
          </div>
          <div className="stat-item">
            <h3>{suppliers.filter((s) => s.status === "Active").length}</h3>
            <p>Active Suppliers</p>
          </div>
          <div className="stat-item">
            <h3>{suppliers.filter((s) => s.status === "Inactive").length}</h3>
            <p>Inactive Suppliers</p>
          </div>
        </div>

        {error && <div className="alert alert-error">{error}</div>}
        {updateSuccess && (
          <div className="alert alert-success">
            Supplier updated successfully!
          </div>
        )}

        <button
          className="btn-secondary"
          style={{ marginLeft: "10px", marginBottom: "1.5rem" }}
          onClick={handlePrintPDF}
        >
          Generate PDF
        </button>

        <div id="suppliers-container" className="suppliers-container">
          {loading ? (
            <div className="loading-state">
              <div className="spinner"></div>
              <p>Loading suppliers...</p>
            </div>
          ) : suppliers.length === 0 ? (
            <div className="empty-state">
              <p>No suppliers found.</p>
              <button
                className="btn-primary"
                onClick={() => (window.location.href = "/supplier")}
              >
                Add Your First Supplier
              </button>
            </div>
          ) : (
            <div className="suppliers-grid">
              {suppliers.map((supplier) => (
                <div key={supplier._id} className="supplier-card compact">
                  <div className="supplier-header">
                    <div className="supplier-image-container">
                      {supplier.image ? (
                        <img
                          src={`http://localhost:5000/uploads/${supplier.image}`}
                          alt={supplier.name}
                          className="supplier-image"
                        />
                      ) : (
                        <div className="supplier-image-placeholder">
                          {supplier.name?.charAt(0).toUpperCase() || "S"}
                        </div>
                      )}
                    </div>
                    <div className="supplier-title">
                      <h3 className="supplier-name">
                        {supplier.name || "N/A"}
                      </h3>
                      <span className="supplier-id">
                        ID: {supplier.supplier_id || "N/A"}
                      </span>
                      <span
                        className={`status-badge status-${
                          supplier.status?.toLowerCase() || "active"
                        }`}
                      >
                        {supplier.status || "Active"}
                      </span>
                    </div>
                  </div>

                  <div className="supplier-info">
                    <div className="info-item">
                      <span className="info-label">Company:</span>
                      <span className="info-value">
                        {supplier.company_name || "Not specified"}
                      </span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">Email:</span>
                      <span className="info-value">
                        {supplier.email || "Not provided"}
                      </span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">Phone:</span>
                      <span className="info-value">
                        {supplier.phone || "Not provided"}
                      </span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">Address:</span>
                      <span className="info-value">
                        {supplier.address || "Not provided"}
                      </span>
                    </div>
                    {supplier.remark && (
                      <div className="info-item">
                        <span className="info-label">Remark:</span>
                        <span className="info-value">{supplier.remark}</span>
                      </div>
                    )}
                  </div>

                  <div className="supplier-actions">
                    <button
                      className="btn-edit"
                      onClick={() => openEditModal(supplier)}
                    >
                      Edit
                    </button>
                    <button
                      className="btn-delete"
                      onClick={() => openDeleteModal(supplier)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Edit Modal */}
        {isEditModalOpen && selectedSupplier && (
          <div className="modal-overlay">
            <div className="modal compact">
              <h2>Edit Supplier</h2>
              <form onSubmit={handleUpdate}>
                <div className="form-grid">
                  <div className="form-group">
                    <label>Supplier ID*</label>
                    <input
                      type="text"
                      name="supplier_id"
                      value={selectedSupplier.supplier_id}
                      onChange={handleInputChange}
                      required
                      disabled
                    />
                    {validationErrors.supplier_id && (
                      <span className="error-text">
                        {validationErrors.supplier_id}
                      </span>
                    )}
                  </div>
                  <div className="form-group">
                    <label>Name*</label>
                    <input
                      type="text"
                      name="name"
                      value={selectedSupplier.name}
                      onChange={handleInputChange}
                      required
                      maxLength={50}
                    />
                    {validationErrors.name && (
                      <span className="error-text">
                        {validationErrors.name}
                      </span>
                    )}
                  </div>
                  <div className="form-group">
                    <label>Company</label>
                    <input
                      type="text"
                      name="company_name"
                      value={selectedSupplier.company_name}
                      onChange={handleInputChange}
                      maxLength={50}
                    />
                    {validationErrors.company_name && (
                      <span className="error-text">
                        {validationErrors.company_name}
                      </span>
                    )}
                  </div>
                  <div className="form-group">
                    <label>Email</label>
                    <input
                      type="email"
                      name="email"
                      value={selectedSupplier.email}
                      onChange={handleInputChange}
                      maxLength={50}
                    />
                    {validationErrors.email && (
                      <span className="error-text">
                        {validationErrors.email}
                      </span>
                    )}
                  </div>
                  <div className="form-group">
                    <label>Phone</label>
                    <input
                      type="tel"
                      name="phone"
                      value={selectedSupplier.phone}
                      onChange={handleInputChange}
                      maxLength={10}
                    />
                    {validationErrors.phone && (
                      <span className="error-text">
                        {validationErrors.phone}
                      </span>
                    )}
                  </div>
                  <div className="form-group full-width">
                    <label>Address</label>
                    <input
                      type="text"
                      name="address"
                      value={selectedSupplier.address}
                      onChange={handleInputChange}
                      maxLength={100}
                    />
                    {validationErrors.address && (
                      <span className="error-text">
                        {validationErrors.address}
                      </span>
                    )}
                  </div>
                  <div className="form-group">
                    <label>Status</label>
                    <select
                      name="status"
                      value={selectedSupplier.status}
                      onChange={handleInputChange}
                    >
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                  </div>
                  <div className="form-group full-width">
                    <label>Remark</label>
                    <textarea
                      name="remark"
                      value={selectedSupplier.remark}
                      onChange={handleInputChange}
                      maxLength={100}
                    ></textarea>
                    {validationErrors.remark && (
                      <span className="error-text">
                        {validationErrors.remark}
                      </span>
                    )}
                  </div>
                  <div className="form-group full-width">
                    <label>Image</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                    />
                    {selectedSupplier.imagePreview && (
                      <img
                        src={selectedSupplier.imagePreview}
                        alt="Preview"
                        className="preview-image"
                      />
                    )}
                  </div>
                </div>
                {updateError && (
                  <div className="alert alert-error">{updateError}</div>
                )}
                <div className="modal-actions">
                  <button
                    type="submit"
                    className="btn-primary"
                    disabled={updateLoading}
                  >
                    {updateLoading ? "Updating..." : "Update"}
                  </button>
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => setIsEditModalOpen(false)}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Delete Modal */}
        {isDeleteModalOpen && supplierToDelete && (
          <div className="modal-overlay">
            <div className="modal compact">
              <h2>Confirm Delete</h2>
              <p>
                Are you sure you want to delete supplier "
                {supplierToDelete.name}"?
              </p>
              <div className="modal-actions">
                <button className="btn-delete" onClick={handleDelete}>
                  Delete
                </button>
                <button
                  className="btn-secondary"
                  onClick={() => setIsDeleteModalOpen(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default View_Suppliers;
