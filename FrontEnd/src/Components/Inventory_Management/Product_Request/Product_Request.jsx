import React, { useState } from "react";
import axios from "axios";
import InventoryManagementNav from "../Inventory_Management_Nav/Inventory_Management_Nav";
import "./Product_Request.css";

const ProductRequestForm = () => {
  const [formData, setFormData] = useState({
    supplier_name: "",
    product_item: "",
    quantity: "",
    need_date: "",
    unit_price: "",
    total_cost: "",
    remark: "",
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  // format number with commas
  const formatNumber = (num) => {
    if (!num) return "";
    return Number(num).toLocaleString("en-LK", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  // Update form state
  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "quantity" || name === "unit_price") {
      const updatedForm = { ...formData, [name]: value };
      updatedForm.total_cost =
        updatedForm.quantity && updatedForm.unit_price
          ? updatedForm.quantity * updatedForm.unit_price
          : "";
      setFormData(updatedForm);
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  // Submit form
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(false);

    try {
      await axios.post("http://localhost:5000/productrequests", formData);
      setSuccess(true);
      setFormData({
        supplier_name: "",
        product_item: "",
        quantity: "",
        need_date: "",
        unit_price: "",
        total_cost: "",
        remark: "",
      });

      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error(err);
      setError("Failed to submit request. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div id="product-request-page">
      <InventoryManagementNav />
      <div id="product-request-wrapper">
        <div id="product-request-container">
          <div id="product-request-header">
            <h2 id="product-request-title">New Product Request</h2>
            <p id="product-request-subtitle">
              Fill out the form below to request new inventory items
            </p>
          </div>

          {error && (
            <div id="product-request-error" className="message error-message">
              <span className="icon">⚠️</span>
              {error}
              <button className="close-btn" onClick={() => setError(null)}>
                ×
              </button>
            </div>
          )}

          {success && (
            <div
              id="product-request-success"
              className="message success-message"
            >
              <span className="icon">✅</span>
              Product request submitted successfully!
              <button className="close-btn" onClick={() => setSuccess(false)}>
                ×
              </button>
            </div>
          )}

          <form id="product-request-form" onSubmit={handleSubmit}>
            <div id="product-request-form-grid">
              <div className="form-group">
                <label htmlFor="supplier_name">Supplier Name *</label>
                <input
                  type="text"
                  id="supplier_name"
                  name="supplier_name"
                  value={formData.supplier_name}
                  onChange={handleChange}
                  placeholder="Enter supplier name"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="product_category">Product Category *</label>
                <select
                  id="product_category"
                  name="product_category"
                  value={formData.product_category || ""}
                  onChange={handleChange}
                  required
                >
                  <option value="" disabled>
                    Select category
                  </option>
                  <option value="Solar Panels">Solar Panels</option>
                  <option value="Solar Batteries">Solar Batteries</option>
                  <option value="Solar Inverters">Solar Inverters</option>
                  <option value="Solar Controllers">Solar Controllers</option>
                  <option value="Solar Wires & Cables">
                    Solar Wires & Cables
                  </option>
                  <option value="Mounting Structures & Accessories">
                    Mounting Structures & Accessories
                  </option>
                  <option value="Solar Lights & Devices">
                    Solar Lights & Devices
                  </option>
                  <option value="Solar Pumps & Appliances">
                    Solar Pumps & Appliances
                  </option>
                  <option value="Monitoring & Miscellaneous Accessories">
                    Monitoring & Miscellaneous Accessories
                  </option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="product_item">Product Item *</label>
                <input
                  type="text"
                  id="product_item"
                  name="product_item"
                  value={formData.product_item}
                  onChange={handleChange}
                  placeholder="Enter product name"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="quantity">Quantity *</label>
                <input
                  type="number"
                  id="quantity"
                  name="quantity"
                  value={formData.quantity}
                  onChange={handleChange}
                  placeholder="0"
                  min="1"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="need_date">Need By Date *</label>
                <input
                  type="date"
                  id="need_date"
                  name="need_date"
                  value={formData.need_date}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="unit_price">Unit Price (Rs) *</label>
                <div className="input-with-symbol">
                  <span className="currency-symbol"></span>
                  <input
                    type="number"
                    id="unit_price"
                    name="unit_price"
                    value={formData.unit_price}
                    onChange={handleChange}
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="total_cost">Total Cost (Rs)</label>
                <div className="input-with-symbol">
                  <span className="currency-symbol">Rs</span>
                  <input
                    type="text"
                    id="total_cost"
                    name="total_cost"
                    value={formatNumber(formData.total_cost)}
                    readOnly
                    className="readonly-input"
                  />
                </div>
              </div>
            </div>

            <div className="form-group full-width">
              <label htmlFor="remark">Remarks</label>
              <textarea
                id="remark"
                name="remark"
                value={formData.remark}
                onChange={handleChange}
                placeholder="Add any additional notes or specifications here..."
                rows="3"
              />
            </div>

            <div id="product-request-actions" className="form-actions">
              <button
                type="button"
                className="btn cancel-btn"
                onClick={() => {
                  setFormData({
                    supplier_name: "",
                    product_item: "",
                    quantity: "",
                    need_date: "",
                    unit_price: "",
                    total_cost: "",
                    remark: "",
                  });
                  setError(null);
                }}
              >
                Clear Form
              </button>
              <button
                type="submit"
                className="btn submit-btn"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <span className="spinner"></span>
                    Processing...
                  </>
                ) : (
                  "Submit Request"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ProductRequestForm;
