import React, { useState, useEffect } from "react";
import axios from "axios";
import InventoryManagementNav from "../Inventory_Management_Nav/Inventory_Management_Nav";
import "./Re_Order.css";

const Re_Order = () => {
  const [items, setItems] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [orderQuantity, setOrderQuantity] = useState("");
  const [selectedSupplier, setSelectedSupplier] = useState("");
  const [ordering, setOrdering] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    fetchLowStockItems();
    fetchSuppliers();
    fetchRequests();
  }, []);

  const fetchLowStockItems = async () => {
    try {
      setLoading(true);
      const res = await axios.get(
        "http://localhost:5000/products?lowStock=true"
      );
      setItems(res.data);
      setError(null);
    } catch (err) {
      setError("Failed to load reorder items.");
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

  const fetchRequests = async () => {
    try {
      const res = await axios.get("http://localhost:5000/productrequests");
      setRequests(res.data);
    } catch (err) {
      console.error("Error fetching requests:", err);
    }
  };

  const openReorderModal = (item) => {
    const safeItem = {
      ...item,
      purchase_price: item.purchase_price ?? 0,
      quantity_in_stock: item.quantity_in_stock ?? 0,
      re_order_level: item.re_order_level ?? 1,
      serial_number: item.serial_number || "N/A",
    };

    setSelectedItem(safeItem);
    setOrderQuantity("");
    setSelectedSupplier("");
    setShowModal(true);
    setErrors({});
  };

  const handleQuantityChange = (e) => {
    let value = e.target.value;
    let processedValue = value;

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

    setOrderQuantity(processedValue);
    setErrors((prev) => ({ ...prev, orderQuantity: "" }));
  };

  const validateForm = () => {
    const newErrors = {};

    if (!selectedSupplier) {
      newErrors.supplier = "Please select a supplier";
    }

    if (!orderQuantity || orderQuantity === "") {
      newErrors.orderQuantity = "Quantity must be greater than 0";
    } else {
      const quantity = parseInt(orderQuantity);
      if (isNaN(quantity) || quantity < 1) {
        newErrors.orderQuantity = "Quantity must be greater than 0";
      } else if (quantity > 500) {
        newErrors.orderQuantity = "Quantity cannot exceed 500";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handlePlaceOrder = async () => {
    if (!validateForm()) return;

    try {
      setOrdering(true);
      const supplier = suppliers.find((sup) => sup._id === selectedSupplier);

      const unitPrice = Number(selectedItem.purchase_price);
      const quantity = parseInt(orderQuantity);
      const totalCost = quantity * unitPrice;

      const requestData = {
        supplier_name: supplier?.name || "Unknown",
        product_item: selectedItem.item_name,
        quantity,
        need_date: new Date().toISOString(),
        unit_price: unitPrice,
        total_cost: totalCost,
        remark: "Reorder request created from Re_Order page",
        request_status: "pending",
        financial_status: "pending",
        createdAt: new Date().toISOString(),
      };

      const response = await axios.post(
        "http://localhost:5000/productrequests",
        requestData
      );

      if (response.data) {
        alert(`Reorder request placed for ${selectedItem.item_name}!`);
        setShowModal(false);
        fetchLowStockItems();
        fetchRequests();
      } else {
        throw new Error("Failed to place reorder request");
      }
    } catch (err) {
      console.error("Order placement failed:", err);
      alert(err.response?.data?.message || "Failed to place reorder request.");
    } finally {
      setOrdering(false);
    }
  };

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

  return (
    <div>
      <InventoryManagementNav />
      <div className="reorder-container">
        <header className="reorder-header">
          <h1>Inventory Re-Order Management</h1>
          <p>Track items that require replenishment</p>
        </header>

        {error && <div className="error-message">{error}</div>}

        {/* Stats */}
        <div className="stats-grid">
          <div className="stat-card">
            <h3>Items Need Reordering</h3>
            <p>{items.length}</p>
          </div>
          <div className="stat-card">
            <h3>Active Suppliers</h3>
            <p>{suppliers.length}</p>
          </div>
          <div className="stat-card">
            <h3>Total Requests</h3>
            <p>{requests.length}</p>
          </div>
        </div>

        {/* Items list */}
        {items.length > 0 ? (
          <div className="items-grid">
            {items.map((item) => (
              <div key={item._id} className="item-card">
                <div className="card-top">
                  <span className="item-name">{item.item_name}</span>
                  <span className="stock-level">
                    {item.quantity_in_stock ?? 0}/{item.re_order_level ?? 0}
                  </span>
                </div>
                <div className="card-image">
                  <img
                    src={
                      item.item_image
                        ? `http://localhost:5000/images/${item.item_image}`
                        : "/placeholder-image.png"
                    }
                    alt={item.item_name}
                    onError={(e) => (e.target.src = "/placeholder-image.png")}
                  />
                </div>
                <div className="card-bottom">
                  <p>Category: {item.category}</p>
                  <p>
                    Suggested Order:{" "}
                    {Math.max(
                      1,
                      (item.re_order_level ?? 0) -
                        (item.quantity_in_stock ?? 0) +
                        10
                    )}
                  </p>
                  <button
                    className="btn-primary"
                    onClick={() => openReorderModal(item)}
                    disabled={suppliers.length === 0}
                  >
                    {suppliers.length === 0 ? "No Suppliers" : "Re-Order"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <p>All items are sufficiently stocked.</p>
          </div>
        )}

        {/* Requests table */}
        <div className="requests-section">
          <h2>Reorder Requests</h2>
          {requests.length === 0 ? (
            <p>No requests yet.</p>
          ) : (
            <table className="requests-table">
              <thead>
                <tr>
                  <th>Supplier</th>
                  <th>Product</th>
                  <th>Quantity</th>
                  <th>Need Date</th>
                  <th>Unit Price</th>
                  <th>Total Cost</th>
                  <th>Status</th>
                  <th>Created</th>
                </tr>
              </thead>
              <tbody>
                {requests.map((req) => (
                  <tr key={req._id}>
                    <td>{req.supplier_name}</td>
                    <td>{req.product_item}</td>
                    <td>{req.quantity}</td>
                    <td>{formatDate(req.need_date)}</td>
                    <td>{formatCurrency(req.unit_price)}</td>
                    <td>{formatCurrency(req.total_cost)}</td>
                    <td>
                      <span
                        className={`status-badge status-${req.request_status}`}
                      >
                        {req.request_status}
                      </span>
                    </td>
                    <td>{formatDate(req.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Modal */}
        {showModal && selectedItem && (
          <div className="modal-overlay">
            <div className="modal-card">
              <div className="modal-header">
                <h2>Place Re-Order</h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="close-btn"
                >
                  ×
                </button>
              </div>

              <div className="modal-body">
                <div className="product-summary">
                  <img
                    src={
                      selectedItem.item_image
                        ? `http://localhost:5000/images/${selectedItem.item_image}`
                        : "/placeholder-image.png"
                    }
                    alt={selectedItem.item_name}
                  />
                  <div>
                    <h3>{selectedItem.item_name}</h3>
                    <p>SKU: {selectedItem.serial_number}</p>
                    <p>Current Stock: {selectedItem.quantity_in_stock}</p>
                    <p>Reorder Level: {selectedItem.re_order_level}</p>
                    <p>
                      Unit Price: {formatCurrency(selectedItem.purchase_price)}
                    </p>
                    <p>
                      Total Price:{" "}
                      {formatCurrency(
                        Number(selectedItem.purchase_price ?? 0) *
                          (orderQuantity || 0)
                      )}
                    </p>
                  </div>
                </div>

                <div className="form-group">
                  <label>Quantity *</label>
                  <input
                    type="number"
                    min="1"
                    max="500"
                    value={orderQuantity}
                    onChange={handleQuantityChange}
                    placeholder="Enter quantity"
                  />
                  {errors.orderQuantity && (
                    <span className="error-text">{errors.orderQuantity}</span>
                  )}
                </div>

                <div className="form-group">
                  <label>Select Supplier *</label>
                  <select
                    value={selectedSupplier}
                    onChange={(e) => {
                      setSelectedSupplier(e.target.value);
                      setErrors((prev) => ({ ...prev, supplier: "" }));
                    }}
                  >
                    <option value="">Choose a supplier...</option>
                    {suppliers.map((sup) => (
                      <option key={sup._id} value={sup._id}>
                        {sup.name} ({sup.company_name})
                      </option>
                    ))}
                  </select>
                  {errors.supplier && (
                    <span className="error-text">{errors.supplier}</span>
                  )}
                </div>
              </div>

              <div className="modal-footer">
                <button
                  className="btn-secondary"
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </button>
                <button
                  className="btn-primary"
                  onClick={handlePlaceOrder}
                  disabled={!selectedSupplier || !orderQuantity || ordering}
                >
                  {ordering ? "Placing..." : "Confirm Order"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Re_Order;
