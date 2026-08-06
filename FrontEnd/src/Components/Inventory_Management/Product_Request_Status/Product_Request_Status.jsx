import React, { useState, useEffect } from "react";
import axios from "axios";
import InventoryManagementNav from "../Inventory_Management_Nav/Inventory_Management_Nav";
import { jsPDF } from "jspdf";
import "jspdf-autotable";
import "./Product_Request_Status.css";
import logo from "./logo selfme.png";

function Product_Request_Status() {
  const [requests, setRequests] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterStatus, setFilterStatus] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [updateFormData, setUpdateFormData] = useState({});
  const [errors, setErrors] = useState({});

  useEffect(() => {
    fetchRequests();
    fetchSuppliers();
  }, []);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const response = await axios.get("http://localhost:5000/productrequests");
      setRequests(response.data);
    } catch (err) {
      setError("Failed to fetch requests. Please try again.");
      console.error("Error fetching requests:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchSuppliers = async () => {
    try {
      const res = await axios.get("http://localhost:5000/suppliers");
      const activeSuppliers = res.data.filter((sup) => sup.status === "Active");
      setSuppliers(activeSuppliers);
    } catch (err) {
      console.error("Error fetching suppliers:", err);
    }
  };

  // Function to get today's date in YYYY-MM-DD format
  const getTodayDate = () => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  };

  // Function to get maximum date (1 month from today)
  const getMaxDate = () => {
    const today = new Date();
    const maxDate = new Date(today);
    maxDate.setMonth(today.getMonth() + 1);
    return maxDate.toISOString().split("T")[0];
  };

  const formatPrice = (price) => {
    if (price === "" || price === null || price === undefined) return "";
    const num = parseFloat(price);
    return isNaN(num) ? "" : num.toFixed(2);
  };

  const handleUpdateClick = (request) => {
    setSelectedRequest(request);
    setUpdateFormData({
      supplier_name: request.supplier_name || "",
      product_item: request.product_item || "",
      quantity: request.quantity ?? "",
      need_date: request.need_date ? request.need_date.split("T")[0] : "",
      unit_price: formatPrice(request.unit_price),
      total_cost: formatPrice(request.total_cost),
      remark: request.remark || "",
      financial_status: request.financial_status || "pending",
      request_status: request.request_status || "pending",
    });
    setShowUpdateModal(true);
    setErrors({});
  };

  const handleUpdateChange = (e) => {
    const { name, value } = e.target;
    let processedValue = value;

    switch (name) {
      case "supplier_name":
        processedValue = value;
        break;
      case "product_item":
        processedValue = value.slice(0, 100);
        break;
      case "quantity":
        if (value === "") {
          processedValue = "";
        } else {
          const numValue = parseInt(value);
          if (!isNaN(numValue) && numValue > 0 && numValue <= 500) {
            processedValue = numValue.toString();
          } else if (numValue > 500) {
            processedValue = "500";
          } else if (numValue <= 0) {
            processedValue = "";
          }
        }
        break;
      case "need_date":
        processedValue = value;
        // Validate date immediately when changed
        if (value) {
          const selectedDate = new Date(value);
          const today = new Date();
          today.setHours(0, 0, 0, 0); // Set to beginning of day for accurate comparison

          const maxDate = new Date();
          maxDate.setMonth(maxDate.getMonth() + 1);
          maxDate.setHours(23, 59, 59, 999); // Set to end of day

          if (selectedDate < today) {
            setErrors((prev) => ({
              ...prev,
              need_date: "Need date cannot be in the past",
            }));
          } else if (selectedDate > maxDate) {
            setErrors((prev) => ({
              ...prev,
              need_date: "Need date cannot be more than 1 month ahead",
            }));
          } else {
            setErrors((prev) => ({ ...prev, need_date: "" }));
          }
        }
        break;
      case "unit_price":
        if (value === "") {
          processedValue = "";
        } else {
          const cleanValue = value.replace(/[^\d.]/g, "");
          const parts = cleanValue.split(".");
          if (parts.length > 2) {
            processedValue = parts[0] + "." + parts.slice(1).join("");
          } else if (parts.length === 2) {
            processedValue = parts[0] + "." + parts[1].slice(0, 2);
          } else {
            processedValue = cleanValue;
          }
          const numValue = parseFloat(processedValue);
          if (!isNaN(numValue) && numValue <= 0) {
            processedValue = "";
          }
        }
        break;
      case "remark":
        processedValue = value.slice(0, 200);
        break;
      default:
        processedValue = value;
    }

    setUpdateFormData((prev) => ({
      ...prev,
      [name]: processedValue,
    }));

    // Clear other errors except need_date which we handle above
    if (name !== "need_date") {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }

    if (name === "quantity" || name === "unit_price") {
      const quantity =
        name === "quantity"
          ? parseInt(processedValue) || 0
          : parseInt(updateFormData.quantity) || 0;
      const unitPrice =
        name === "unit_price"
          ? parseFloat(processedValue) || 0
          : parseFloat(updateFormData.unit_price) || 0;
      setUpdateFormData((prev) => ({
        ...prev,
        total_cost: formatPrice(quantity * unitPrice),
      }));
    }
  };

  const handlePriceBlur = (e) => {
    const { name, value } = e.target;
    if (value && value !== "") {
      const formattedValue = formatPrice(value);
      setUpdateFormData((prev) => ({
        ...prev,
        [name]: formattedValue,
      }));
    }
  };

  const validateUpdateForm = () => {
    const newErrors = {};

    if (!updateFormData.supplier_name) {
      newErrors.supplier_name = "Please select a supplier";
    }

    if (!updateFormData.product_item) {
      newErrors.product_item = "Product name is required";
    } else if (updateFormData.product_item.length > 100) {
      newErrors.product_item = "Product name cannot exceed 100 characters";
    }

    if (!updateFormData.quantity || updateFormData.quantity === "") {
      newErrors.quantity = "Quantity must be greater than 0";
    } else {
      const quantity = parseInt(updateFormData.quantity);
      if (isNaN(quantity) || quantity < 1) {
        newErrors.quantity = "Quantity must be greater than 0";
      } else if (quantity > 500) {
        newErrors.quantity = "Quantity cannot exceed 500";
      }
    }

    // Enhanced date validation
    if (!updateFormData.need_date) {
      newErrors.need_date = "Need date is required";
    } else {
      const selectedDate = new Date(updateFormData.need_date);
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Set to beginning of day

      const maxDate = new Date();
      maxDate.setMonth(maxDate.getMonth() + 1);
      maxDate.setHours(23, 59, 59, 999); // Set to end of day

      if (selectedDate < today) {
        newErrors.need_date = "Need date cannot be in the past";
      } else if (selectedDate > maxDate) {
        newErrors.need_date = "Need date cannot be more than 1 month ahead";
      }
    }

    if (!updateFormData.unit_price || updateFormData.unit_price === "") {
      newErrors.unit_price = "Unit price must be greater than 0";
    } else {
      const price = parseFloat(updateFormData.unit_price);
      if (isNaN(price) || price <= 0) {
        newErrors.unit_price = "Unit price must be greater than 0";
      }
    }

    if (updateFormData.remark.length > 200) {
      newErrors.remark = "Remark cannot exceed 200 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleUpdateSubmit = async (e) => {
    e.preventDefault();
    if (!validateUpdateForm()) return;

    try {
      const response = await axios.put(
        `http://localhost:5000/productrequests/${selectedRequest._id}`,
        {
          ...updateFormData,
          quantity: parseInt(updateFormData.quantity),
          unit_price: parseFloat(updateFormData.unit_price),
          total_cost: parseFloat(updateFormData.total_cost),
        }
      );
      setRequests((prev) =>
        prev.map((req) =>
          req._id === selectedRequest._id
            ? response.data.updatedProductRequest
            : req
        )
      );
      setShowUpdateModal(false);
      setSelectedRequest(null);
      setError(null);
    } catch (err) {
      setError("Failed to update request. Please try again.");
      console.error("Error updating request:", err);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this request?"))
      return;
    try {
      await axios.delete(`http://localhost:5000/productrequests/${id}`);
      setRequests((prev) => prev.filter((req) => req._id !== id));
      setError(null);
    } catch (err) {
      setError("Failed to delete request. Please try again.");
      console.error("Error deleting request:", err);
    }
  };

  const handlePrintPDF = () => {
    if (filteredRequests.length === 0) {
      return alert("No requests to export.");
    }

    try {
      const doc = new jsPDF("p", "mm", "a4");
      const margin = 15;
      const pageWidth = doc.internal.pageSize.getWidth();
      const date = new Date();
      const formattedDate = date.toLocaleDateString();
      const formattedTime = date.toLocaleTimeString();

      // --- Load logo properly ---
      const img = new Image();
      img.src = logo; // imported logo
      img.onload = () => {
        doc.addImage(img, "PNG", margin, 8, 20, 20);

        // Company Info
        doc.setFontSize(16);
        doc.setTextColor(33, 37, 41);
        doc.text("SelfMe Pvt Ltd", margin + 25, 15);

        doc.setFontSize(9);
        doc.setTextColor(100, 100, 100);
        doc.text(
          "No/346, Madalanda, Dompe, Colombo, Sri Lanka",
          margin + 25,
          21
        );
        doc.text(
          "Phone: +94 717 882 883 | Email: Selfmepvtltd@gmail.com",
          margin + 25,
          26
        );

        // Header line
        doc.setDrawColor(200, 200, 200);
        doc.setLineWidth(0.5);
        doc.line(margin, 32, pageWidth - margin, 32);

        // --- Report Title ---
        doc.setFontSize(14);
        doc.setTextColor(0, 53, 128);
        doc.text("PRODUCT REQUEST REPORT", pageWidth / 2, 45, {
          align: "center",
        });

        // --- Report Details ---
        doc.setFontSize(10);
        doc.setTextColor(80, 80, 80);
        doc.text(
          `Generated on: ${formattedDate} at ${formattedTime}`,
          margin,
          55
        );
        doc.text(`Total Requests: ${filteredRequests.length}`, margin, 62);

        const totalPending = filteredRequests
          .filter((r) => r.request_status === "pending")
          .reduce((a, b) => a + (b.total_cost ?? 0), 0);

        doc.text(
          `Total Pending Value: LKR ${formatPrice(totalPending)}`,
          margin,
          69
        );

        // --- Table ---
        const tableColumns = [
          { header: "#", dataKey: "index" },
          { header: "Supplier", dataKey: "supplier" },
          { header: "Product", dataKey: "product" },
          { header: "Quantity", dataKey: "quantity" },
          { header: "Need Date", dataKey: "needDate" },
          { header: "Unit Price (LKR)", dataKey: "unitPrice" },
          { header: "Total Cost (LKR)", dataKey: "totalCost" },
          { header: "Request Status", dataKey: "requestStatus" },
          { header: "Financial Status", dataKey: "financialStatus" },
          { header: "Created", dataKey: "created" },
        ];

        const tableData = filteredRequests.map((req, index) => ({
          index: index + 1,
          supplier: req.supplier_name || "N/A",
          product: req.product_item || "N/A",
          quantity: req.quantity ?? 0,
          needDate: req.need_date
            ? new Date(req.need_date).toLocaleDateString("en-US", {
                year: "numeric",
                month: "short",
                day: "numeric",
              })
            : "N/A",
          unitPrice: formatPrice(req.unit_price),
          totalCost: formatPrice(req.total_cost),
          requestStatus: req.request_status || "pending",
          financialStatus: req.financial_status || "pending",
          created: req.createdAt
            ? new Date(req.createdAt).toLocaleDateString("en-US", {
                year: "numeric",
                month: "short",
                day: "numeric",
              })
            : "N/A",
        }));

        doc.autoTable({
          columns: tableColumns,
          body: tableData,
          startY: 75,
          margin: { left: margin, right: margin },
          theme: "grid",
          styles: {
            fontSize: 8,
            cellPadding: 2,
            textColor: [33, 37, 41],
            lineColor: [200, 200, 200],
            lineWidth: 0.1,
          },
          headStyles: {
            fillColor: [0, 53, 128],
            textColor: 255,
            fontStyle: "bold",
            fontSize: 9,
            halign: "center",
          },
          columnStyles: {
            index: { halign: "center", fontStyle: "bold" },
            quantity: { halign: "center" },
            unitPrice: {
              halign: "right",
              fontStyle: "bold",
              textColor: [0, 100, 0],
            },
            totalCost: {
              halign: "right",
              fontStyle: "bold",
              textColor: [0, 100, 0],
            },
            requestStatus: { halign: "center" },
            financialStatus: { halign: "center" },
          },
          didParseCell: function (data) {
            if (data.column.dataKey === "requestStatus") {
              const status = data.cell.raw;
              if (status === "pending")
                data.cell.styles.fillColor = [255, 243, 205];
              else if (status === "approved")
                data.cell.styles.fillColor = [212, 237, 218];
              else if (status === "completed")
                data.cell.styles.fillColor = [198, 223, 255];
              else data.cell.styles.fillColor = [248, 215, 218]; // rejected/other
            }
          },
          didDrawPage: function (data) {
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

        // Signature
        const finalY = doc.lastAutoTable.finalY + 15;
        if (finalY < doc.internal.pageSize.height - 30) {
          doc.setFontSize(10);
          doc.setTextColor(80, 80, 80);
          doc.text("Authorized Signature:", margin, finalY);
          doc.line(margin + 50, finalY + 1, margin + 150, finalY + 1);
          doc.text("Date:", pageWidth - margin - 50, finalY);
          doc.line(
            pageWidth - margin - 30,
            finalY + 1,
            pageWidth - margin,
            finalY + 1
          );
        }

        doc.save(
          `Product_Request_Report_${formattedDate.replace(/\//g, "-")}.pdf`
        );
      };
    } catch (err) {
      console.error("PDF generation failed:", err);
      alert("Error generating PDF. Please make sure all data is valid.");
    }
  };

  const filteredRequests = requests.filter((request) => {
    const matchesStatus =
      filterStatus === "all" || request.request_status === filterStatus;
    const matchesSearch =
      (request.supplier_name || "")
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      (request.product_item || "")
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const formatDate = (dateString) =>
    dateString
      ? new Date(dateString).toLocaleDateString("en-US", {
          year: "numeric",
          month: "short",
          day: "numeric",
        })
      : "N/A";

  const formatCurrency = (amount) =>
    new Intl.NumberFormat("en-LK", {
      style: "currency",
      currency: "LKR",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount ?? 0);

  if (loading) {
    return (
      <div className="page-container">
        <InventoryManagementNav />
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading requests...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <InventoryManagementNav />
      <div className="content-container">
        <div className="page-header">
          <h1>Product Request Status</h1>
          <p>Manage and track all product requests</p>
        </div>

        {error && (
          <div className="error-message">
            {error}
            <button className="error-close" onClick={() => setError(null)}>
              ×
            </button>
          </div>
        )}

        {/* Summary Section */}
        <div className="summary-section">
          <div className="summary-card">
            <div className="summary-content">
              <h3>Total Requests</h3>
              <div className="stat-number">{requests.length}</div>
            </div>
          </div>
          <div className="summary-card">
            <div className="summary-content">
              <h3>Pending Value (LKR)</h3>
              <div className="stat-number">
                {formatCurrency(
                  requests
                    .filter((r) => r.request_status === "pending")
                    .reduce((a, b) => a + (b.total_cost ?? 0), 0)
                )}
              </div>
            </div>
          </div>
          <div className="summary-card">
            <div className="summary-content">
              <h3>Approved Value (LKR)</h3>
              <div className="stat-number">
                {formatCurrency(
                  requests
                    .filter((r) => r.request_status === "approved")
                    .reduce((a, b) => a + (b.total_cost ?? 0), 0)
                )}
              </div>
            </div>
          </div>
          <div className="summary-card">
            <div className="summary-content">
              <h3>Completed Value (LKR)</h3>
              <div className="stat-number">
                {formatCurrency(
                  requests
                    .filter((r) => r.request_status === "completed")
                    .reduce((a, b) => a + (b.total_cost ?? 0), 0)
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="controls-section">
          <div className="search-container">
            <input
              type="text"
              placeholder="Search by supplier or product..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Requests</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="completed">Completed</option>
          </select>
          <button className="btn btn-print" onClick={handlePrintPDF}>
            Print PDF
          </button>
        </div>

        {/* Table */}
        <div className="table-container">
          {filteredRequests.length === 0 ? (
            <div className="no-data">
              <p>No requests found matching your criteria.</p>
            </div>
          ) : (
            <table className="requests-table">
              <thead>
                <tr>
                  <th className="text-left">Supplier</th>
                  <th className="text-left">Product</th>
                  <th className="text-center">Quantity</th>
                  <th className="text-center">Need Date</th>
                  <th className="text-right">Unit Price (LKR)</th>
                  <th className="text-right">Total Cost (LKR)</th>
                  <th className="text-center">Request Status</th>
                  <th className="text-center">Financial Status</th>
                  <th className="text-center">Created</th>
                  <th className="text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredRequests.map((req) => (
                  <tr key={req._id}>
                    <td className="text-left">{req.supplier_name || "N/A"}</td>
                    <td className="text-left">{req.product_item || "N/A"}</td>
                    <td className="text-center">{req.quantity ?? 0}</td>
                    <td className="text-center">{formatDate(req.need_date)}</td>
                    <td className="text-right">
                      {formatCurrency(req.unit_price ?? 0)}
                    </td>
                    <td className="text-right">
                      {formatCurrency(req.total_cost ?? 0)}
                    </td>
                    <td className="text-center">
                      <span
                        className={`status-badge status-${req.request_status}`}
                      >
                        {req.request_status || "pending"}
                      </span>
                    </td>
                    <td className="text-center">
                      <span
                        className={`status-badge status-${req.financial_status}`}
                      >
                        {req.financial_status || "pending"}
                      </span>
                    </td>
                    <td className="text-center">{formatDate(req.createdAt)}</td>
                    <td className="text-center">
                      <div className="action-buttons">
                        <button
                          className="btn btn-edit"
                          onClick={() => handleUpdateClick(req)}
                        >
                          Edit
                        </button>
                        <button
                          className="btn btn-delete"
                          onClick={() => handleDelete(req._id)}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Modal */}
        {showUpdateModal && (
          <div className="modal-overlay">
            <div className="modal">
              <div className="modal-header">
                <h2>Update Product Request</h2>
                <button
                  className="modal-close"
                  onClick={() => setShowUpdateModal(false)}
                >
                  ×
                </button>
              </div>
              <form onSubmit={handleUpdateSubmit} className="modal-form">
                <div className="form-grid">
                  <div className="form-group">
                    <label htmlFor="supplier_name">Supplier Name *</label>
                    <select
                      id="supplier_name"
                      name="supplier_name"
                      value={updateFormData.supplier_name}
                      onChange={handleUpdateChange}
                      required
                    >
                      <option value="">Select Supplier</option>
                      {suppliers.map((sup) => (
                        <option key={sup._id} value={sup.name}>
                          {sup.name}{" "}
                          {sup.company_name ? `- ${sup.company_name}` : ""}
                        </option>
                      ))}
                    </select>
                    {errors.supplier_name && (
                      <span className="error-text">{errors.supplier_name}</span>
                    )}
                  </div>
                  <div className="form-group">
                    <label htmlFor="product_item">Product Item *</label>
                    <input
                      type="text"
                      id="product_item"
                      name="product_item"
                      value={updateFormData.product_item}
                      onChange={handleUpdateChange}
                      maxLength={100}
                      required
                    />
                    {errors.product_item && (
                      <span className="error-text">{errors.product_item}</span>
                    )}
                  </div>
                  <div className="form-group">
                    <label htmlFor="quantity">Quantity *</label>
                    <input
                      type="number"
                      id="quantity"
                      name="quantity"
                      value={updateFormData.quantity}
                      onChange={handleUpdateChange}
                      min="1"
                      max="500"
                      required
                    />
                    {errors.quantity && (
                      <span className="error-text">{errors.quantity}</span>
                    )}
                  </div>
                  <div className="form-group">
                    <label htmlFor="need_date">Need Date *</label>
                    <input
                      type="date"
                      id="need_date"
                      name="need_date"
                      value={updateFormData.need_date}
                      onChange={handleUpdateChange}
                      min={getTodayDate()}
                      max={getMaxDate()}
                      required
                    />
                    {errors.need_date && (
                      <span className="error-text">{errors.need_date}</span>
                    )}
                  </div>
                  <div className="form-group">
                    <label htmlFor="unit_price">Unit Price (LKR) *</label>
                    <input
                      type="text"
                      id="unit_price"
                      name="unit_price"
                      value={updateFormData.unit_price}
                      onChange={handleUpdateChange}
                      onBlur={handlePriceBlur}
                      placeholder="0.00"
                      required
                    />
                    {errors.unit_price && (
                      <span className="error-text">{errors.unit_price}</span>
                    )}
                  </div>
                  <div className="form-group">
                    <label htmlFor="total_cost">Total Cost (LKR)</label>
                    <input
                      type="text"
                      id="total_cost"
                      value={formatCurrency(updateFormData.total_cost)}
                      readOnly
                      className="readonly"
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="request_status">Request Status</label>
                    <select
                      id="request_status"
                      name="request_status"
                      value={updateFormData.request_status}
                      onChange={handleUpdateChange}
                    >
                      <option value="pending">Pending</option>
                      <option value="approved">Approved</option>
                      <option value="rejected">Rejected</option>
                      <option value="completed">Completed</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label htmlFor="financial_status">Financial Status</label>
                    <select
                      id="financial_status"
                      name="financial_status"
                      value={updateFormData.financial_status}
                      onChange={handleUpdateChange}
                    >
                      <option value="pending">Pending</option>
                      <option value="processing">Processing</option>
                      <option value="paid">Paid</option>
                      <option value="unpaid">Unpaid</option>
                    </select>
                  </div>
                </div>
                <div className="form-group full-width">
                  <label htmlFor="remark">Remarks</label>
                  <textarea
                    id="remark"
                    name="remark"
                    value={updateFormData.remark}
                    onChange={handleUpdateChange}
                    rows="3"
                    maxLength={200}
                    placeholder="Additional notes or specifications..."
                  />
                  {errors.remark && (
                    <span className="error-text">{errors.remark}</span>
                  )}
                </div>
                <div className="modal-actions">
                  <button
                    type="button"
                    className="btn btn-cancel"
                    onClick={() => setShowUpdateModal(false)}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-save">
                    Update Request
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Product_Request_Status;