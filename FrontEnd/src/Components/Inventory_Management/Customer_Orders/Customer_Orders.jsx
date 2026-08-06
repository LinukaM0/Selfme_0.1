import React, { useEffect, useState } from "react";
import axios from "axios";
import InventoryManagementNav from "../Inventory_Management_Nav/Inventory_Management_Nav";
import "./Customer_Orders.css";

function Customer_Orders() {
  const [invoices, setInvoices] = useState([]);
  const [filteredInvoices, setFilteredInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [actionLoading, setActionLoading] = useState({});

  useEffect(() => {
    const fetchInvoices = async () => {
      try {
        const res = await axios.get("http://localhost:5000/api/inventory-invoices");
        setInvoices(res.data);
        setFilteredInvoices(res.data);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching invoices:", err);
        setError("Failed to fetch invoices");
        setLoading(false);
      }
    };
    fetchInvoices();
  }, []);

  // Search filter
  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredInvoices(invoices);
    } else {
      const results = invoices.filter((invoice) =>
        Object.values(invoice).some((value) =>
          typeof value === "string" || typeof value === "number"
            ? value.toString().toLowerCase().includes(searchTerm.toLowerCase())
            : false
        )
      );
      setFilteredInvoices(results);
    }
  }, [searchTerm, invoices]);

  // Get product details from populated data
  const getProductDetails = (item) => {
    return {
      item_name: item.itemId?.item_name || "Product Not Available",
      item_image: item.itemId?.item_image || null,
      category: item.itemId?.category || "N/A",
      serial_number: item.itemId?.serial_number || "N/A"
    };
  };

  // Format price
  const formatPrice = (price) => {
    if (price === "" || price === null || price === undefined) return "0.00";
    const num = parseFloat(price);
    return isNaN(num) ? "0.00" : num.toFixed(2);
  };

  // Format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Handle process order - Move to pending orders in Stock_Outs
  const handleProcessOrder = async (invoice) => {
    setActionLoading((prev) => ({ ...prev, [invoice._id]: true }));

    try {
      const response = await axios.post("http://localhost:5000/api/invoice-orders/process", {
        invoiceId: invoice._id
      });

      if (response.data.success) {
        setInvoices(prev => prev.filter(inv => inv._id !== invoice._id));
        setFilteredInvoices(prev => prev.filter(inv => inv._id !== invoice._id));
        alert(`Order moved to pending confirmation! Stock Out ID: ${response.data.stockOutId}`);
      }
    } catch (err) {
      console.error("Error processing order:", err);
      alert("Failed to process order: " + (err.response?.data?.message || err.message));
    } finally {
      setActionLoading((prev) => ({ ...prev, [invoice._id]: false }));
    }
  };

  if (loading) {
    return (
      <div className="customer-orders-wrapper">
        <InventoryManagementNav />
        <div className="customer-orders-loading">
          <div className="loading-spinner"></div>
          <p>Loading customer orders...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="customer-orders-wrapper">
        <InventoryManagementNav />
        <div className="customer-orders-error">
          <p>{error}</p>
          <button onClick={() => window.location.reload()}>Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className="customer-orders-wrapper">
      <InventoryManagementNav />
      
      <div className="customer-orders-container">
        <div className="customer-orders-header">
          <h1>Customer Orders</h1>
          <p>Process customer orders and move to fulfillment</p>
          <div className="orders-stats">
            <span className="stat-badge">Total Orders: {invoices.length}</span>
          </div>
        </div>

        <div className="search-section">
          <input
            type="text"
            placeholder="Search by order ID, customer ID, or product name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>

        <div className="orders-table-container">
          {filteredInvoices.length === 0 ? (
            <div className="no-orders">
              <div className="no-orders-icon">📦</div>
              <h3>No Orders Found</h3>
              <p>
                {searchTerm 
                  ? `No orders matching "${searchTerm}"`
                  : "No customer orders available"
                }
              </p>
              {searchTerm && (
                <button 
                  className="clear-search-btn"
                  onClick={() => setSearchTerm('')}
                >
                  Clear Search
                </button>
              )}
            </div>
          ) : (
            <table className="orders-table">
              <thead>
                <tr>
                  <th>Order Info</th>
                  <th>Items</th>
                  <th>Amount</th>
                  <th>Date</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredInvoices.map((invoice) => {
                  const isLoading = actionLoading[invoice._id];
                  return (
                    <tr key={invoice._id} className="order-row">
                      <td className="order-info-cell">
                        <div className="order-info">
                          <div className="order-id">#{invoice._id.slice(-8)}</div>
                          <div className="customer-id">Customer: {invoice.userid}</div>
                        </div>
                      </td>
                      <td className="items-column">
                        <div className="items-list">
                          {invoice.items.map((item, idx) => {
                            const product = getProductDetails(item);
                            return (
                              <div key={idx} className="order-item">
                                <div className="item-image-container">
                                  <img
                                    src={
                                      product.item_image
                                        ? `http://localhost:5000/images/${product.item_image}`
                                        : "/placeholder-image.png"
                                    }
                                    alt={product.item_name}
                                    className="item-thumb"
                                  />
                                  <span className="quantity-badge">{item.quantity}</span>
                                </div>
                                <div className="item-info">
                                  <span className="item-name">{product.item_name}</span>
                                  <span className="item-serial">SN: {product.serial_number}</span>
                                  <span className="item-price">LKR {formatPrice(item.unit_price)}</span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </td>
                      <td className="amount-cell">
                        <div className="amount-details">
                          <div className="amount-line">
                            <span>Subtotal:</span>
                            <span>LKR {formatPrice(invoice.total)}</span>
                          </div>
                          <div className="amount-line">
                            <span>Tax:</span>
                            <span>LKR {formatPrice(invoice.tax)}</span>
                          </div>
                          <div className="amount-line total">
                            <span>Total:</span>
                            <span>LKR {formatPrice(invoice.grandTotal)}</span>
                          </div>
                        </div>
                      </td>
                      <td className="date-cell">
                        <div className="order-date">
                          {formatDate(invoice.created_at)}
                        </div>
                      </td>
                      <td className="action-column">
                        <button
                          className={`process-btn ${isLoading ? 'loading' : ''}`}
                          onClick={() => handleProcessOrder(invoice)}
                          disabled={isLoading}
                        >
                          {isLoading ? (
                            <>
                              <span className="btn-spinner"></span>
                              Processing...
                            </>
                          ) : (
                            'Process Order'
                          )}
                        </button>
                        <div className="process-note">
                          Moves to pending confirmation
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

export default Customer_Orders;