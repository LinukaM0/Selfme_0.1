import React, { useState, useEffect } from "react";
import axios from "axios";
import InventoryManagementNav from "../Inventory_Management_Nav/Inventory_Management_Nav";
import { jsPDF } from "jspdf";
import "jspdf-autotable";
import "./Stock_Outs.css";

const API = "http://localhost:5000";

function Stock_Outs() {
  const [items, setItems] = useState([]);
  const [orderItems, setOrderItems] = useState([]);
  const [customerId, setCustomerId] = useState("");
  const [type, setType] = useState("");
  const [message, setMessage] = useState("");
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState("");
  const [generatedStockOutId, setGeneratedStockOutId] = useState("");
  const [pendingOrders, setPendingOrders] = useState([]);
  const [processedOrders, setProcessedOrders] = useState([]);
  const [activeTab, setActiveTab] = useState("create");
  const [pdfLoading, setPdfLoading] = useState(false);

  useEffect(() => {
    fetchItems();
    fetchRecentOrders();
    fetchPendingOrders();
    fetchProcessedOrders();
    generateNewStockOutId();
  }, []);

  const fetchItems = async () => {
    try {
      const res = await axios.get(`${API}/products`);
      setItems(res.data || []);
    } catch (err) {
      console.error(err);
      setMessage("Failed to fetch items.");
    }
  };

  const fetchRecentOrders = async () => {
    try {
      const res = await axios.get(`${API}/stockouts`);
      setRecentOrders(
        (res.data || []).sort(
          (a, b) =>
            new Date(b.createdAt || b.orderDate) -
            new Date(a.createdAt || a.orderDate)
        )
      );
    } catch (err) {
      console.error(err);
    }
  };

  const fetchPendingOrders = async () => {
    try {
      const res = await axios.get(`${API}/api/invoice-orders/pending`);
      setPendingOrders(res.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchProcessedOrders = async () => {
    try {
      const res = await axios.get(`${API}/api/invoice-orders/processed`);
      setProcessedOrders(res.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const generateNewStockOutId = async () => {
    try {
      const year = new Date().getFullYear();
      const sequence = Math.floor(Math.random() * 1000) + 1;
      setGeneratedStockOutId(
        `SO-${year}-${sequence.toString().padStart(4, "0")}`
      );
    } catch (err) {
      console.error("Failed to generate stock out ID:", err);
    }
  };

  // Get product name from populated data
  const getProductName = (item) => {
    return item.itemId?.item_name || `Product (${item.itemId?._id?.slice(-8) || 'Unknown'})`;
  };

  // Get product serial number from populated data
  const getProductSerial = (item) => {
    return item.itemId?.serial_number || "N/A";
  };

  const addItemToOrder = (itemId) => {
    const item = items.find((it) => it._id === itemId);
    if (!item) return;

    setOrderItems((prev) => {
      const exist = prev.find((p) => p.product_id === item._id);
      if (exist) {
        if (exist.quantity >= item.quantity_in_stock) {
          setMessage(
            `Cannot add more. Only ${item.quantity_in_stock} available.`
          );
          return prev;
        }
        return prev.map((p) =>
          p.product_id === item._id ? { ...p, quantity: p.quantity + 1 } : p
        );
      }
      return [
        ...prev,
        {
          product_id: item._id,
          product_serial: item.serial_number,
          item_name: item.item_name,
          price: Number(item.selling_price) || 0,
          quantity: 1,
          available_stock: item.quantity_in_stock,
        },
      ];
    });

    setSelectedItemId("");
    setMessage("");
  };

  const updateQuantity = (productId, qty) => {
    const n = Number(qty);
    if (isNaN(n) || n < 1) return;
    const item = orderItems.find((i) => i.product_id === productId);
    if (item && n > item.available_stock) {
      setMessage(`Cannot exceed available stock of ${item.available_stock}`);
      return;
    }
    setOrderItems((prev) =>
      prev.map((i) => (i.product_id === productId ? { ...i, quantity: n } : i))
    );
    setMessage("");
  };

  const removeFromOrder = (productId) => {
    setOrderItems((prev) => prev.filter((i) => i.product_id !== productId));
    setMessage("");
  };

  const total = orderItems.reduce(
    (s, i) => s + (Number(i.price) || 0) * (Number(i.quantity) || 0),
    0
  );

  // Create Technical Team Order
  const createTechnicalOrder = async () => {
    if (orderItems.length === 0)
      return setMessage("Please add at least one item.");

    setLoading(true);
    try {
      const payloadItems = orderItems.map((i) => ({
        product_id: i.product_id,
        product_serial: i.product_serial,
        item_name: i.item_name,
        quantity: i.quantity,
        price: i.price,
      }));

      const orderPayload = {
        customer_id: "Technical Team",
        type: "technical",
        items: payloadItems,
        total: total,
        stock_out_id: generatedStockOutId,
      };

      const res = await axios.post(`${API}/stockouts`, orderPayload);
      const createdOrder = res.data.stockOut;

      // Confirm order immediately
      await axios.put(`${API}/stockouts/${createdOrder._id}/confirm`);

      setMessage(
        `Technical Order ${createdOrder.stock_out_id} successfully placed and confirmed! Stock has been updated.`
      );
      setOrderItems([]);
      setSelectedItemId("");
      setType("");
      await generateNewStockOutId();
      fetchItems();
      fetchRecentOrders();
      fetchProcessedOrders();
    } catch (err) {
      console.error(err.response?.data || err.message);
      setMessage(
        err.response?.data?.message || "Failed to place order. Try again."
      );
    } finally {
      setLoading(false);
    }
  };

  // Confirm Pending Order (from Customer Orders)
  const confirmPendingOrder = async (orderId) => {
    try {
      const response = await axios.put(`${API}/api/invoice-orders/${orderId}/confirm`);
      
      if (response.data.success) {
        setMessage("Order confirmed successfully! Stock has been updated.");
        fetchPendingOrders();
        fetchProcessedOrders();
        fetchItems();
        fetchRecentOrders();
      }
    } catch (err) {
      console.error(err);
      setMessage(
        err.response?.data?.message || "Failed to confirm order. Try again."
      );
    }
  };

  const clearOrder = () => {
    setOrderItems([]);
    setCustomerId("");
    setSelectedItemId("");
    setType("");
    setMessage("");
  };

  // Dashboard Statistics
  const calculateStats = () => {
    const totalTechnicalOrders = recentOrders.filter(order => order.type === 'technical').length;
    const totalCustomerOrders = processedOrders.length;
    const totalPendingOrders = pendingOrders.length;
    
    const totalTechnicalValue = recentOrders
      .filter(order => order.type === 'technical')
      .reduce((sum, order) => sum + (order.total || 0), 0);
    
    const totalCustomerValue = processedOrders
      .reduce((sum, order) => sum + (order.grandTotal || 0), 0);

    return {
      totalTechnicalOrders,
      totalCustomerOrders,
      totalPendingOrders,
      totalTechnicalValue,
      totalCustomerValue
    };
  };

  const stats = calculateStats();

  // PDF Generation Function
  const generatePDF = (orders, reportType) => {
    setPdfLoading(true);
    try {
      const doc = new jsPDF("p", "mm", "a4");
      const margin = 15;
      const pageWidth = doc.internal.pageSize.getWidth();
      const date = new Date();
      const formattedDate = date.toLocaleDateString();
      const formattedTime = date.toLocaleTimeString();

      // Header
      doc.setFontSize(16);
      doc.setTextColor(33, 37, 41);
      doc.text("SelfMe Pvt Ltd", margin, 15);

      doc.setFontSize(9);
      doc.setTextColor(100, 100, 100);
      doc.text("No/346, Madalanda, Dompe, Colombo, Sri Lanka", margin, 21);
      doc.text("Phone: +94 717 882 883 | Email: Selfmepvtltd@gmail.com", margin, 26);

      // Header line
      doc.setDrawColor(200, 200, 200);
      doc.setLineWidth(0.5);
      doc.line(margin, 32, pageWidth - margin, 32);

      // Report Title
      doc.setFontSize(14);
      doc.setTextColor(0, 53, 128);
      const title = reportType === 'technical' 
        ? "Technical Team Orders Report" 
        : "Processed Customer Orders Report";
      doc.text(title, pageWidth / 2, 45, { align: "center" });

      // Report Details
      doc.setFontSize(10);
      doc.setTextColor(80, 80, 80);
      doc.text(`Generated on: ${formattedDate} at ${formattedTime}`, margin, 55);
      doc.text(`Total Orders: ${orders.length}`, margin, 62);

      // Table Columns
      const tableColumns = [
        { header: "#", dataKey: "index" },
        { header: "Stock Out ID", dataKey: "stockOutId" },
        { header: "Order Type", dataKey: "type" },
        { header: "Customer/Team", dataKey: "customer" },
        { header: "Item Name", dataKey: "itemName" },
        { header: "Qty", dataKey: "quantity" },
        { header: "Unit Price", dataKey: "unitPrice" },
        { header: "Subtotal", dataKey: "subtotal" },
        { header: "Total Amount", dataKey: "total" },
        { header: "Order Date", dataKey: "date" }
      ];

      let tableData = [];

      orders.forEach((order, i) => {
        const orderDate = new Date(order.createdAt || order.processed_at || order.created_at);
        const dateStr = orderDate.toLocaleDateString();
        
        const items = order.items || [];
        const stockOutId = order.stock_out_id || `SO-${orderDate.getFullYear()}-${(i + 1).toString().padStart(4, "0")}`;

        if (items.length > 0) {
          items.forEach((item, idx) => {
            tableData.push({
              index: i + 1,
              stockOutId,
              type: order.type === "technical" ? "Technical" : "Customer",
              customer: order.customer_id || order.userid || "Technical Team",
              itemName: getProductName(item),
              quantity: item.quantity,
              unitPrice: `Rs. ${(item.unit_price || item.price || 0).toLocaleString()}`,
              subtotal: `Rs. ${(item.subtotal || (item.quantity * (item.unit_price || item.price) || 0)).toLocaleString()}`,
              total: idx === 0 ? `Rs. ${(order.total || order.grandTotal || 0).toLocaleString()}` : "",
              date: idx === 0 ? dateStr : ""
            });
          });
        } else {
          tableData.push({
            index: i + 1,
            stockOutId,
            type: order.type === "technical" ? "Technical" : "Customer",
            customer: order.customer_id || order.userid || "Technical Team",
            itemName: "N/A",
            quantity: "-",
            unitPrice: "-",
            subtotal: "-",
            total: `Rs. ${(order.total || order.grandTotal || 0).toLocaleString()}`,
            date: dateStr
          });
        }
      });

      // Generate table
      doc.autoTable({
        columns: tableColumns,
        body: tableData,
        startY: 75,
        theme: "grid",
        margin: { left: margin, right: margin },
        styles: { fontSize: 8, cellPadding: 2 },
        headStyles: {
          fillColor: [0, 53, 128],
          textColor: 255,
          fontStyle: "bold",
          halign: "center",
        },
        columnStyles: {
          index: { halign: "center" },
          stockOutId: { halign: "center", fontStyle: "bold" },
          type: { halign: "center" },
          quantity: { halign: "center" },
          unitPrice: { halign: "right" },
          subtotal: { halign: "right" },
          total: { halign: "right" },
          date: { halign: "center" }
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

      const fileName = `${reportType}_orders_${formattedDate.replace(/\//g, "-")}.pdf`;
      doc.save(fileName);

    } catch (err) {
      console.error("PDF generation failed:", err);
      alert("Error generating PDF.");
    } finally {
      setPdfLoading(false);
    }
  };

  const handleTechnicalPDF = () => {
    const technicalOrders = recentOrders.filter(order => order.type === 'technical');
    if (technicalOrders.length === 0) {
      alert("No technical team orders available.");
      return;
    }
    generatePDF(technicalOrders, 'technical');
  };

  const handleCustomerPDF = () => {
    if (processedOrders.length === 0) {
      alert("No processed customer orders available.");
      return;
    }
    generatePDF(processedOrders, 'customer');
  };

  // Calculate technical orders count for display
  const technicalOrdersCount = recentOrders.filter(order => order.type === 'technical').length;

  return (
    <div id="stock-outs-page-wrapper">
      <InventoryManagementNav />

      <div id="stock-outs-container">
        <div id="stock-outs-page-header">
          <h1 id="stock-outs-main-title">Stock Out & Order Management</h1>
          <p id="stock-outs-subtitle">Create orders and manage order fulfillment</p>
        </div>

        {message && (
          <div
            id="stock-outs-message-alert"
            className={
              message.includes("successfully") ? "success" : "error"
            }
          >
            {message}
          </div>
        )}

        {/* Dashboard Section */}
        <div id="stock-outs-dashboard">
          <div id="stock-outs-dashboard-stats">
            <div className="stock-outs-stat-card">
              <div className="stock-outs-stat-value">{stats.totalTechnicalOrders}</div>
              <div className="stock-outs-stat-label">Technical Team Orders</div>
            </div>
            <div className="stock-outs-stat-card">
              <div className="stock-outs-stat-value">{stats.totalCustomerOrders}</div>
              <div className="stock-outs-stat-label">Processed Customer Orders</div>
            </div>
            <div className={`stock-outs-stat-card ${stats.totalPendingOrders > 0 ? 'pending-alert' : ''}`}>
              <div className="stock-outs-stat-value">{stats.totalPendingOrders}</div>
              <div className="stock-outs-stat-label">Pending Confirmation</div>
              {stats.totalPendingOrders > 0 && (
                <div className="pending-badge">Attention Required</div>
              )}
            </div>
            <div className="stock-outs-stat-card">
              <div className="stock-outs-stat-value">Rs. {stats.totalTechnicalValue.toLocaleString()}</div>
              <div className="stock-outs-stat-label">Technical Orders Value</div>
            </div>
            <div className="stock-outs-stat-card">
              <div className="stock-outs-stat-value">Rs. {stats.totalCustomerValue.toLocaleString()}</div>
              <div className="stock-outs-stat-label">Customer Orders Value</div>
            </div>
          </div>

          <div id="stock-outs-pdf-controls">
            <button 
              id="stock-outs-pdf-technical-btn" 
              onClick={handleTechnicalPDF}
              disabled={pdfLoading || stats.totalTechnicalOrders === 0}
            >
              {pdfLoading ? "Generating..." : "Download Technical Orders PDF"}
            </button>
            <button 
              id="stock-outs-pdf-customer-btn" 
              onClick={handleCustomerPDF}
              disabled={pdfLoading || stats.totalCustomerOrders === 0}
            >
              {pdfLoading ? "Generating..." : "Download Customer Orders PDF"}
            </button>
          </div>
        </div>

        <div id="stock-outs-tabs-section">
          <button
            id="stock-outs-tab-button"
            className={activeTab === "create" ? "active" : ""}
            onClick={() => setActiveTab("create")}
          >
            Create New Order
          </button>
          <button
            id="stock-outs-tab-button"
            className={`${activeTab === "pending" ? "active" : ""} ${pendingOrders.length > 0 ? 'pending-notification' : ''}`}
            onClick={() => setActiveTab("pending")}
          >
            {pendingOrders.length > 0 && <span className="notification-dot"></span>}
            Pending Confirmation ({pendingOrders.length})
            {pendingOrders.length > 0 && <span className="urgent-badge">URGENT</span>}
          </button>
          <button
            id="stock-outs-tab-button"
            className={activeTab === "processed" ? "active" : ""}
            onClick={() => setActiveTab("processed")}
          >
            Processed Customer Orders ({processedOrders.length})
          </button>
          <button
            id="stock-outs-tab-button"
            className={activeTab === "history" ? "active" : ""}
            onClick={() => setActiveTab("history")}
          >
            Technical Team Proceed Orders ({technicalOrdersCount})
          </button>
        </div>

        <div id="stock-outs-main-content">
          {activeTab === "create" && (
            <div id="stock-outs-order-creation-card">
              <div id="stock-outs-order-card-content">
                <div id="stock-outs-form-section">
                  <h3>Create New Order</h3>

                  <div id="stock-outs-order-type-section">
                    <label>Order Type</label>
                    <div id="stock-outs-order-type-buttons">
                      <button
                        id="stock-outs-type-btn"
                        className={type === "technical" ? "active" : ""}
                        onClick={() => setType("technical")}
                      >
                        🛠️ Technical Team Order
                      </button>
                    </div>
                  </div>

                  {type && (
                    <div id="stock-outs-stock-out-id-preview">
                      <label>Stock Out ID</label>
                      <div id="stock-outs-stock-out-id-display">
                        {generatedStockOutId}
                      </div>
                    </div>
                  )}

                  {type && (
                    <div id="stock-outs-add-item-section">
                      <label>Add Item</label>
                      <select
                        value={selectedItemId}
                        onChange={(e) => {
                          if (e.target.value) addItemToOrder(e.target.value);
                        }}
                      >
                        <option value="">Select Item</option>
                        {items
                          .filter((item) => item.quantity_in_stock > 0)
                          .map((item) => (
                            <option key={item._id} value={item._id}>
                              {item.item_name} - Rs. {item.selling_price}{" "}
                              (Stock: {item.quantity_in_stock})
                            </option>
                          ))}
                      </select>
                    </div>
                  )}
                </div>

                {orderItems.length > 0 && (
                  <div id="stock-outs-order-items-section">
                    <h3>
                      Order Items ({orderItems.length}){" "}
                      <button id="stock-outs-clear-order-btn" onClick={clearOrder}>
                        Clear Order
                      </button>
                    </h3>

                    <table id="stock-outs-order-table">
                      <thead>
                        <tr>
                          <th>Item Name</th>
                          <th>Quantity</th>
                          <th>Unit Price (Rs.)</th>
                          <th>Subtotal (Rs.)</th>
                          <th>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {orderItems.map((item) => (
                          <tr key={item.product_id}>
                            <td>{item.item_name}</td>
                            <td>
                              <input
                                id="stock-outs-quantity-input"
                                type="number"
                                min="1"
                                max={item.available_stock}
                                value={item.quantity}
                                onChange={(e) =>
                                  updateQuantity(
                                    item.product_id,
                                    e.target.value
                                  )
                                }
                              />
                              <span id="stock-outs-stock-info">
                                / {item.available_stock} available
                              </span>
                            </td>
                            <td>{item.price.toLocaleString()}</td>
                            <td>
                              {(item.price * item.quantity).toLocaleString()}
                            </td>
                            <td>
                              <button
                                id="stock-outs-remove-item-btn"
                                onClick={() => removeFromOrder(item.product_id)}
                              >
                                Remove
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>

                    <div id="stock-outs-order-summary">
                      <div id="stock-outs-order-total">
                        <strong>
                          Total Amount: Rs. {total.toLocaleString()}
                        </strong>
                      </div>
                    </div>

                    <div id="stock-outs-order-actions">
                      {type === "technical" && (
                        <button
                          id="stock-outs-place-order-btn"
                          className="technical"
                          onClick={createTechnicalOrder}
                          disabled={loading}
                        >
                          {loading ? (
                            <>
                              <span id="stock-outs-loading-spinner"></span>
                              Creating Technical Order...
                            </>
                          ) : (
                            `Create Technical Order (${generatedStockOutId})`
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === "pending" && (
            <div id="stock-outs-pending-orders-card">
              <div className="tab-header-with-alert">
                <h3>Orders Pending Confirmation</h3>
                {pendingOrders.length > 0 && (
                  <div className="pending-alert-banner">
                    <span className="alert-icon">⚠️</span>
                    <span className="alert-text">
                      {pendingOrders.length} order(s) require immediate attention
                    </span>
                  </div>
                )}
              </div>
              <p id="stock-outs-tab-description">
                Orders moved from Customer Orders page awaiting final confirmation and stock reduction.
              </p>
              
              {pendingOrders.length === 0 ? (
                <div id="stock-outs-no-orders">
                  <div id="stock-outs-no-orders-icon">✅</div>
                  <h4>No Pending Orders</h4>
                  <p>All orders have been processed and confirmed.</p>
                </div>
              ) : (
                <div className="pending-orders-container">
                  <div className="pending-orders-header">
                    <span className="pending-count">{pendingOrders.length} Orders Pending</span>
                    <span className="action-required">Action Required: Confirm each order to reduce stock</span>
                  </div>
                  <table id="stock-outs-pending-table">
                    <thead>
                      <tr>
                        <th>Stock Out ID</th>
                        <th>Customer ID</th>
                        <th>Items</th>
                        <th>Total Amount</th>
                        <th>Order Date</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pendingOrders.map((order) => (
                        <tr key={order._id} className="pending-order-row">
                          <td id="stock-outs-stock-out-id">
                            <strong>{order.stock_out_id}</strong>
                          </td>
                          <td>{order.userid}</td>
                          <td>
                            <div id="stock-outs-items-count">
                              {order.items.length} items
                            </div>
                            <div id="stock-outs-items-preview">
                              {order.items.slice(0, 3).map((item, idx) => (
                                <div key={idx} id="stock-outs-item-preview">
                                  <span id="stock-outs-item-name">
                                    {getProductName(item)}
                                  </span>
                                  <span id="stock-outs-item-quantity">(x{item.quantity})</span>
                                  <span id="stock-outs-item-serial">SN: {getProductSerial(item)}</span>
                                </div>
                              ))}
                              {order.items.length > 3 && (
                                <div id="stock-outs-more-items">
                                  +{order.items.length - 3} more
                                </div>
                              )}
                            </div>
                          </td>
                          <td>Rs. {order.grandTotal?.toLocaleString()}</td>
                          <td>
                            {new Date(order.created_at).toLocaleDateString()}
                          </td>
                          <td>
                            <button
                              id="stock-outs-confirm-order-btn"
                              onClick={() => confirmPendingOrder(order._id)}
                            >
                              Confirm & Reduce Stock
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {activeTab === "processed" && (
            <div id="stock-outs-processed-orders-card">
              <h3>Processed Orders</h3>
              <p id="stock-outs-tab-description">
                Orders that have been confirmed and stock has been reduced.
              </p>
              
              {processedOrders.length === 0 ? (
                <div id="stock-outs-no-orders">
                  <div id="stock-outs-no-orders-icon">📦</div>
                  <h4>No Processed Orders</h4>
                  <p>No orders have been processed yet.</p>
                </div>
              ) : (
                <table id="stock-outs-processed-table">
                  <thead>
                    <tr>
                      <th>Stock Out ID</th>
                      <th>Customer ID</th>
                      <th>Items</th>
                      <th>Total Amount</th>
                      <th>Processed Date</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {processedOrders.map((order) => (
                      <tr key={order._id}>
                        <td id="stock-outs-stock-out-id">
                          <strong>{order.stock_out_id}</strong>
                        </td>
                        <td>{order.userid}</td>
                        <td>
                          <div id="stock-outs-items-count">
                            {order.items.length} items
                          </div>
                          <div id="stock-outs-items-preview">
                            {order.items.slice(0, 2).map((item, idx) => (
                              <div key={idx} id="stock-outs-item-preview">
                                <span id="stock-outs-item-name">
                                  {getProductName(item)}
                                </span>
                                <span id="stock-outs-item-quantity">(x{item.quantity})</span>
                                <span id="stock-outs-item-serial">SN: {getProductSerial(item)}</span>
                              </div>
                            ))}
                            {order.items.length > 2 && (
                              <div id="stock-outs-more-items">
                                +{order.items.length - 2} more
                              </div>
                            )}
                          </div>
                        </td>
                        <td>Rs. {order.grandTotal?.toLocaleString()}</td>
                        <td>
                          {new Date(order.processed_at).toLocaleDateString()}
                        </td>
                        <td>
                          <span id="stock-outs-status-badge" className={order.status}>
                            {order.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {activeTab === "history" && (
            <div id="stock-outs-orders-history-card">
              <h3>Technical Team Proceed Orders ({technicalOrdersCount})</h3>
              {recentOrders.length === 0 ? (
                <div id="stock-outs-no-orders">
                  <div id="stock-outs-no-orders-icon">📊</div>
                  <h4>No Order History</h4>
                  <p>No orders have been created yet.</p>
                </div>
              ) : (
                <table id="stock-outs-history-table">
                  <thead>
                    <tr>
                      <th>Stock Out ID</th>
                      <th>Type</th>
                      <th>Customer/Team</th>
                      <th>Items</th>
                      <th>Total (Rs.)</th>
                      <th>Date</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentOrders.slice(0, 10).map((order) => {
                      const orderDate = new Date(
                        order.createdAt || order.orderDate
                      );
                      return (
                        <tr
                          key={order._id}
                        >
                          <td id="stock-outs-stock-out-id">
                            <strong>{order.stock_out_id}</strong>
                        </td>
                          <td>
                            {order.type === "technical"
                              ? "Technical"
                              : "Customer"}
                          </td>
                          <td>{order.customer_id}</td>
                          <td>
                            <div id="stock-outs-items-count">
                              {order.items.length} items
                            </div>
                            <div id="stock-outs-items-preview">
                              {order.items.slice(0, 2).map((item, idx) => (
                                <div key={idx} id="stock-outs-item-preview">
                                  <span id="stock-outs-item-name">
                                    {item.item_name || getProductName(item)}
                                  </span>
                                  <span id="stock-outs-item-quantity">(x{item.quantity})</span>
                                  <span id="stock-outs-item-serial">SN: {item.product_serial || getProductSerial(item)}</span>
                                </div>
                              ))}
                              {order.items.length > 2 && (
                                <div id="stock-outs-more-items">
                                  +{order.items.length - 2} more
                                </div>
                              )}
                            </div>
                          </td>
                          <td>{Number(order.total || 0).toLocaleString()}</td>
                          <td>{orderDate.toLocaleDateString()}</td>
                          <td>
                            <span
                              id="stock-outs-status-badge"
                              className={order.status.toLowerCase()}
                            >
                              {order.status}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Stock_Outs;