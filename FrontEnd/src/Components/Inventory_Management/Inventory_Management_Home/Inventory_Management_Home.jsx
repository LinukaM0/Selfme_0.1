import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import InventoryManagementNav from "../Inventory_Management_Nav/Inventory_Management_Nav";
import "./Inventory_Management_Home.css";
import { removeAuthToken } from "../../../utils/auth";

const InventoryManagementHome = () => {
  const navigate = useNavigate();

  // Get user data from localStorage
  const authUser = JSON.parse(localStorage.getItem("authUser") || "{}");

  const [user, setUser] = useState({
    name:
      `${authUser.firstName || ""} ${authUser.lastName || ""}`.trim() ||
      "Inventory Manager",
    email: authUser.email || "inventory@selfme.lk",
    role: authUser.role || "Inventory Manager",
  });

  const [showSignOut, setShowSignOut] = useState(false);
  const [products, setProducts] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [lowStockItems, setLowStockItems] = useState([]);
  const [damagedReturnedItems, setDamagedReturnedItems] = useState([]);
  const [recentStockOuts, setRecentStockOuts] = useState([]);
  const [recentRequests, setRecentRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [stats, setStats] = useState({
    totalProducts: 0,
    totalSuppliers: 0,
    lowStockCount: 0,
    damagedReturnedCount: 0,
    totalInventoryValue: 0,
    outOfStockCount: 0,
    criticalStockCount: 0,
  });

  // Chart data state
  const [chartData, setChartData] = useState({
    adequate: 0,
    nearReorder: 0,
    low: 0,
    critical: 0,
    outOfStock: 0,
  });

  // Category data for vertical bar chart
  const [categoryData, setCategoryData] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [productsRes, suppliersRes, stockOutsRes, requestsRes] =
          await Promise.all([
            axios.get("http://localhost:5000/products"),
            axios.get("http://localhost:5000/suppliers"),
            axios.get("http://localhost:5000/stockouts"),
            axios.get("http://localhost:5000/productrequests"),
          ]);

        const allProducts = productsRes.data;
        setProducts(allProducts.slice(0, 5));

        const activeSuppliers = suppliersRes.data.filter(
          (s) => s.status === "Active"
        );
        setSuppliers(activeSuppliers.slice(0, 5));

        const lowStock = allProducts.filter(
          (p) => p.quantity_in_stock <= p.re_order_level
        );
        const criticalStock = allProducts.filter(
          (p) => p.quantity_in_stock <= p.re_order_level * 0.5
        );
        const outOfStock = allProducts.filter((p) => p.quantity_in_stock === 0);
        const nearReorder = allProducts.filter(
          (p) =>
            p.quantity_in_stock <= p.re_order_level &&
            p.quantity_in_stock > p.re_order_level * 0.7
        );
        const lowStockOnly = allProducts.filter(
          (p) =>
            p.quantity_in_stock <= p.re_order_level * 0.7 &&
            p.quantity_in_stock > p.re_order_level * 0.3
        );
        const adequateStock = allProducts.filter(
          (p) => p.quantity_in_stock > p.re_order_level
        );

        setLowStockItems(lowStock);

        const damagedReturned = allProducts.filter(
          (p) => p.status === "Damaged" || p.status === "Returned"
        );
        setDamagedReturnedItems(damagedReturned.slice(0, 5));

        const sortedStockOuts = stockOutsRes.data
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
          .slice(0, 5);
        setRecentStockOuts(sortedStockOuts);

        const sortedRequests = requestsRes.data
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
          .slice(0, 5);
        setRecentRequests(sortedRequests);

        const totalValue = allProducts.reduce(
          (sum, p) => sum + p.quantity_in_stock * p.selling_price,
          0
        );

        // Calculate category data for vertical bar chart
        const categoryStats = {};
        allProducts.forEach((product) => {
          const category = product.category || "Uncategorized";
          if (!categoryStats[category]) {
            categoryStats[category] = {
              count: 0,
              totalValue: 0,
              totalStock: 0,
            };
          }
          categoryStats[category].count++;
          categoryStats[category].totalValue +=
            product.quantity_in_stock * product.selling_price;
          categoryStats[category].totalStock += product.quantity_in_stock;
        });

        // Convert to array and sort by count (descending)
        const sortedCategories = Object.entries(categoryStats)
          .map(([name, data]) => ({
            name,
            count: data.count,
            totalValue: data.totalValue,
            totalStock: data.totalStock,
            percentage: ((data.count / allProducts.length) * 100).toFixed(1),
          }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 6); // Top 6 categories

        setCategoryData(sortedCategories);

        // Set chart data
        setChartData({
          adequate: adequateStock.length,
          nearReorder: nearReorder.length,
          low: lowStockOnly.length,
          critical: criticalStock.length,
          outOfStock: outOfStock.length,
        });

        setStats({
          totalProducts: allProducts.length,
          totalSuppliers: activeSuppliers.length,
          lowStockCount: lowStock.length,
          criticalStockCount: criticalStock.length,
          outOfStockCount: outOfStock.length,
          damagedReturnedCount: damagedReturned.length,
          totalInventoryValue: totalValue,
        });

        setError(null);
      } catch (err) {
        setError("Failed to fetch data. Please try again.");
        console.error("Error fetching data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleSignOut = () => {
    removeAuthToken();
    localStorage.removeItem("authUser");
    navigate("/login");
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatCurrency = (value) => {
    return value.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const getStockStatus = (quantity, reorderLevel) => {
    if (quantity === 0) return { status: "Out of Stock", class: "critical" };
    if (quantity <= reorderLevel * 0.3)
      return { status: "Critical", class: "critical" };
    if (quantity <= reorderLevel * 0.7)
      return { status: "Low", class: "warning" };
    if (quantity <= reorderLevel)
      return { status: "Near Reorder", class: "info" };
    return { status: "Adequate", class: "adequate" };
  };

  // Calculate pie chart segments
  const calculatePieChart = () => {
    const total =
      chartData.adequate +
      chartData.nearReorder +
      chartData.low +
      chartData.critical +
      chartData.outOfStock;
    if (total === 0) return null;

    const percentages = {
      adequate: (chartData.adequate / total) * 100,
      nearReorder: (chartData.nearReorder / total) * 100,
      low: (chartData.low / total) * 100,
      critical: (chartData.critical / total) * 100,
      outOfStock: (chartData.outOfStock / total) * 100,
    };

    let currentPercentage = 0;
    const segments = [];

    const colors = {
      adequate: "#10b981",
      nearReorder: "#3b82f6",
      low: "#f59e0b",
      critical: "#ef4444",
      outOfStock: "#6b7280",
    };

    Object.keys(percentages).forEach((key) => {
      if (percentages[key] > 0) {
        segments.push({
          percentage: percentages[key],
          start: currentPercentage,
          color: colors[key],
          label: key
            .replace(/([A-Z])/g, " $1")
            .replace(/^./, (str) => str.toUpperCase()),
        });
        currentPercentage += percentages[key];
      }
    });

    return segments;
  };

  const pieSegments = calculatePieChart();
  const totalProducts = stats.totalProducts;

  if (loading) {
    return (
      <div className="imh-page">
        <div className="imh-sidebar">
          <InventoryManagementNav />
        </div>
        <main className="imh-main">
          <div className="imh-loading">
            <div className="imh-spinner"></div>
            <p>Loading dashboard data...</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="imh-page">
      <div className="imh-sidebar">
        <InventoryManagementNav />
      </div>

      <main className="imh-main">
        <header className="imh-header">
          <div className="imh-header-content">
            <div className="imh-header-left">
              <h1 className="imh-title">Inventory Dashboard</h1>
              <p className="imh-subtitle">Welcome back, {user.name}</p>
            </div>

            <div className="imh-header-right">
              <div className="imh-alert-badge">
                <span className="imh-alert-icon">⚠️</span>
                <span className="imh-alert-count">{stats.lowStockCount}</span>
              </div>
              <div className="imh-user-profile">
                <div
                  className="imh-user-avatar"
                  onClick={() => setShowSignOut(!showSignOut)}
                >
                  <div className="imh-avatar-placeholder">
                    {user.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </div>
                  <span className="imh-user-dropdown">▼</span>
                </div>

                {showSignOut && (
                  <div className="imh-user-dropdown-menu">
                    <div className="imh-user-details-card">
                      <div className="imh-avatar-placeholder large">
                        {user.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </div>
                      <div className="imh-user-detail-info">
                        <strong>{user.name}</strong>
                        <span>{user.email}</span>
                        <span>{user.role}</span>
                      </div>
                    </div>
                    <div className="imh-dropdown-divider"></div>
                    <button
                      className="imh-dropdown-item sign-out"
                      onClick={handleSignOut}
                    >
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {error && (
          <div className="imh-error-banner">
            <span>{error}</span>
            <button onClick={() => window.location.reload()}>Retry</button>
          </div>
        )}

        <section className="imh-stats-grid">
          <div className="imh-stat-card">
            <div className="imh-stat-icon">📦</div>
            <div className="imh-stat-content">
              <h3>Total Products</h3>
              <span className="imh-stat-number">{stats.totalProducts}</span>
            </div>
          </div>

          <div className="imh-stat-card">
            <div className="imh-stat-icon">💰</div>
            <div className="imh-stat-content">
              <h3>Inventory Value</h3>
              <span className="imh-stat-number">
                LKR {formatCurrency(stats.totalInventoryValue)}
              </span>
            </div>
          </div>

          <div className="imh-stat-card critical">
            <div className="imh-stat-icon">⚠️</div>
            <div className="imh-stat-content">
              <h3>Low Stock</h3>
              <span className="imh-stat-number">{stats.lowStockCount}</span>
            </div>
          </div>

          <div className="imh-stat-card">
            <div className="imh-stat-icon">🏢</div>
            <div className="imh-stat-content">
              <h3>Active Suppliers</h3>
              <span className="imh-stat-number">{stats.totalSuppliers}</span>
            </div>
          </div>
        </section>

        <div className="imh-main-content">
          <div className="imh-left-column">
            <section className="imh-data-card">
              <div className="imh-card-header">
                <h3>Re-Order Alerts</h3>
                <span className="imh-alert-badge-small">
                  {stats.lowStockCount}
                </span>
              </div>
              <div className="imh-table-container">
                {lowStockItems.length > 0 ? (
                  <table className="imh-data-table">
                    <thead>
                      <tr>
                        <th>Item</th>
                        <th>Current Stock</th>
                        <th>Re-Order Level</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {lowStockItems.map((item) => {
                        const status = getStockStatus(
                          item.quantity_in_stock,
                          item.re_order_level
                        );
                        return (
                          <tr key={item._id} className={status.class}>
                            <td>
                              <div className="imh-item-info">
                                <img
                                  src={
                                    item.item_image
                                      ? `http://localhost:5000/images/${item.item_image}`
                                      : "/placeholder-image.png"
                                  }
                                  alt={item.item_name}
                                  className="imh-item-image"
                                />
                                <div className="imh-item-details">
                                  <span className="imh-item-name">
                                    {item.item_name}
                                  </span>
                                  <span className="imh-item-category">
                                    {item.category}
                                  </span>
                                </div>
                              </div>
                            </td>
                            <td>{item.quantity_in_stock}</td>
                            <td>{item.re_order_level}</td>
                            <td>
                              <span
                                className={`imh-status-badge ${status.class}`}
                              >
                                {status.status}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                ) : (
                  <div className="imh-no-data">No low stock items</div>
                )}
              </div>
            </section>

            <section className="imh-data-card">
              <div className="imh-card-header">
                <h3>Recent Product Requests</h3>
              </div>
              <div className="imh-table-container">
                {recentRequests.length > 0 ? (
                  <table className="imh-data-table">
                    <thead>
                      <tr>
                        <th>Product</th>
                        <th>Quantity</th>
                        <th>Date</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentRequests.map((req) => (
                        <tr key={req._id}>
                          <td>{req.product_item}</td>
                          <td>{req.quantity}</td>
                          <td>{formatDate(req.createdAt)}</td>
                          <td>
                            <span
                              className={`imh-status-badge ${
                                req.request_status?.toLowerCase() || "pending"
                              }`}
                            >
                              {req.request_status || "Pending"}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="imh-no-data">No recent requests</div>
                )}
              </div>
            </section>
          </div>

          <div className="imh-right-column">
            <section className="imh-data-card">
              <div className="imh-card-header">
                <h3>Inventory Status</h3>
              </div>
              <div className="imh-pie-chart-container">
                {pieSegments ? (
                  <>
                    <div className="imh-pie-chart">
                      <div
                        className="imh-pie"
                        style={{
                          background: `conic-gradient(
                            ${pieSegments
                              .map(
                                (segment) =>
                                  `${segment.color} 0% ${
                                    segment.start + segment.percentage
                                  }%`
                              )
                              .join(", ")}
                          )`,
                        }}
                      >
                        <div className="imh-pie-center">
                          <span className="imh-pie-total">{totalProducts}</span>
                          <span className="imh-pie-label">Total Items</span>
                        </div>
                      </div>
                    </div>
                    <div className="imh-pie-legend">
                      {pieSegments.map((segment, index) => (
                        <div key={index} className="imh-legend-item">
                          <div
                            className="imh-legend-color"
                            style={{ backgroundColor: segment.color }}
                          ></div>
                          <span className="imh-legend-label">
                            {segment.label}
                          </span>
                          <span className="imh-legend-value">
                            {segment.percentage.toFixed(1)}%
                          </span>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="imh-no-data">No data available for chart</div>
                )}
              </div>
            </section>

            <section className="imh-data-card">
              <div className="imh-card-header">
                <h3>Top Products</h3>
              </div>
              <div className="imh-table-container">
                <table className="imh-data-table">
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>Stock</th>
                      <th>Price</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map((product) => (
                      <tr key={product._id}>
                        <td>
                          <div className="imh-item-info">
                            <img
                              src={
                                product.item_image
                                  ? `http://localhost:5000/images/${product.item_image}`
                                  : "/placeholder-image.png"
                              }
                              alt={product.item_name}
                              className="imh-item-image"
                            />
                            <div className="imh-item-details">
                              <span className="imh-item-name">
                                {product.item_name}
                              </span>
                              <span className="imh-item-category">
                                {product.category}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td>{product.quantity_in_stock}</td>
                        <td>LKR {formatCurrency(product.selling_price)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
};

export default InventoryManagementHome;
