import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import Navbar from "../Nav/Navbar";
import Footer from "../Footer/Footer";
import "./Cart.css";

function Cart() {
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updating, setUpdating] = useState({});
  const navigate = useNavigate();

  useEffect(() => {
    console.log("🛒 Cart component mounted");
    fetchCart();
  }, []);

  const fetchCart = async () => {
    try {
      console.log("🔄 Fetching cart...");
      setLoading(true);
      setError(null);
      const token = localStorage.getItem("token");
      console.log("🔑 Token exists:", !!token);
      if (!token) {
        const errorMsg = "Please login to view your cart";
        console.log("❌", errorMsg);
        setError(errorMsg);
        setLoading(false);
        return;
      }
      console.log("📡 Making API call to: http://localhost:5000/api/cart");
      const res = await axios.get("http://localhost:5000/api/cart", {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        timeout: 10000
      });
      console.log("✅ API Response:", {
        status: res.status,
        dataLength: res.data.length,
        sampleData: res.data[0] || "No items"
      });
    
      const items = Array.isArray(res.data) ? res.data : [];
      setCartItems(items);
    
    } catch (err) {
      console.error("💥 Cart fetch error:", err);
    
      let errorMessage = "Failed to load cart items.";
    
      if (err.response) {
        const { status, data } = err.response;
        console.error(`Server error ${status}:`, data);
      
        if (status === 401) {
          errorMessage = "Session expired. Please login again.";
          localStorage.removeItem("token");
          setTimeout(() => navigate("/login"), 1500);
        } else if (status === 404) {
          errorMessage = "Cart not found. Your cart is empty.";
        } else if (status === 500) {
          errorMessage = "Server error. Please try again later.";
        } else if (data.message) {
          errorMessage = data.message;
        } else {
          errorMessage = `Server error (${status})`;
        }
      } else if (err.request) {
        errorMessage = "Cannot connect to server. Please check your connection.";
        console.error("Network error:", err.request);
      } else {
        errorMessage = err.message || "An unexpected error occurred.";
      }
    
      setError(errorMessage);
    } finally {
      setLoading(false);
      console.log("🏁 Cart fetch complete");
    }
  };

  const updateQuantity = async (cartItemId, newQuantity) => {
    if (newQuantity < 1) return;
   
    setUpdating(prev => ({ ...prev, [cartItemId]: true }));
   
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setError("Session expired. Please login again.");
        localStorage.removeItem("token");
        setTimeout(() => navigate("/login"), 1500);
        return;
      }
      console.log(`🔄 Updating quantity for ${cartItemId} to ${newQuantity}`);
     
      const response = await axios.put(
        `http://localhost:5000/api/cart/${cartItemId}`,
        { quantity: newQuantity },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          timeout: 5000
        }
      );
      console.log("✅ Quantity updated:", response.data);
     
      setCartItems(prevItems =>
        prevItems.map(item =>
          item._id === cartItemId
            ? { ...item, quantity: response.data.quantity, subtotal: response.data.subtotal }
            : item
        )
      );
     
    } catch (error) {
      console.error("❌ Failed to update quantity:", error);
     
      let errorMessage = "Failed to update quantity.";
     
      if (error.response) {
        if (error.response.status === 401) {
          localStorage.removeItem("token");
          setTimeout(() => navigate("/login"), 1500);
          return;
        }
        errorMessage = error.response.data?.message || `Server error (${error.response.status})`;
      } else if (error.request) {
        errorMessage = "Network error. Please check your connection.";
      }
     
      console.error("Error updating quantity:", errorMessage);
    } finally {
      setUpdating(prev => ({ ...prev, [cartItemId]: false }));
    }
  };

  const deleteItem = async (cartItemId) => {
    if (!window.confirm("Are you sure you want to remove this item from your cart?")) {
      return;
    }
   
    setUpdating(prev => ({ ...prev, [cartItemId]: true }));
   
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setError("Session expired. Please login again.");
        localStorage.removeItem("token");
        setTimeout(() => navigate("/login"), 1500);
        return;
      }
      console.log(`🗑️ Deleting item ${cartItemId}`);
     
      await axios.delete(`http://localhost:5000/api/cart/${cartItemId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        timeout: 5000
      });
      console.log("✅ Item deleted successfully");
     
      setCartItems(prevItems => prevItems.filter(item => item._id !== cartItemId));
     
    } catch (error) {
      console.error("❌ Failed to delete item:", error);
     
      let errorMessage = "Failed to remove item.";
     
      if (error.response) {
        if (error.response.status === 401) {
          localStorage.removeItem("token");
          setTimeout(() => navigate("/login"), 1500);
          return;
        }
        errorMessage = error.response.data?.message || `Server error (${error.response.status})`;
      } else if (error.request) {
        errorMessage = "Network error. Please check your connection.";
      }
     
      console.error("Error deleting item:", errorMessage);
      setError(errorMessage);
    } finally {
      setUpdating(prev => ({ ...prev, [cartItemId]: false }));
    }
  };

  const handleProceed = () => {
    console.log("💳 Proceed to payment");
    navigate("/?view=payment");
  };

  const handleAddMoreItems = () => {
    console.log("🛍️ Navigating to packages page");
    navigate("/?view=packages");
  };

  const totalAmount = cartItems.reduce((sum, item) => {
    const subtotal = Number(item.subtotal) || 0;
    return sum + subtotal;
  }, 0);
  const taxAmount = Math.round(totalAmount * 0.085);
  const grandTotal = totalAmount + taxAmount;

  console.log("📊 Rendering - Items:", cartItems.length, "Total: Rs.", grandTotal);

  return (
    <div className="cart-main-container">
      <Navbar />
      <div className="cart-content-wrapper">
        <div className="cart-card">
          <div className="cart-header">
            <h1 className="cart-title">🛒 My Cart</h1>
          </div>
          
          {loading && (
            <div className="cart-loading-container">
              <div className="cart-loading-icon">⏳</div>
              <h2 className="cart-loading-text">Loading your cart...</h2>
              <p className="cart-loading-subtext">Just a moment while we fetch your items!</p>
            </div>
          )}
          
          {error && (
            <div className="cart-error-container">
              <div className="cart-error-message">
                <strong>❌ Error:</strong> {error}
              </div>
              <div className="cart-error-actions">
                <button
                  onClick={fetchCart}
                  disabled={loading}
                  className="cart-retry-btn"
                >
                  {loading ? "⏳ Loading..." : "🔄 Retry"}
                </button>
                {error.includes("login") && (
                  <button
                    onClick={() => navigate("/login")}
                    className="cart-login-btn"
                  >
                    🔐 Login
                  </button>
                )}
              </div>
            </div>
          )}
          
          {!loading && !error && (
            <div>
              <div className="cart-info-header">
                <h2 className="cart-info-title">Your Shopping Cart</h2>
                <p className="cart-info-subtitle">
                  {cartItems.length} item{cartItems.length !== 1 ? 's' : ''} selected
                </p>
              </div>
              
              <table className="cart-table">
                <thead className="cart-table-header">
                  <tr>
                    <th>Item</th>
                    <th>Quantity</th>
                    <th>Unit Price</th>
                    <th>Subtotal</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {cartItems.length > 0 ? (
                    cartItems.map((item, index) => (
                      <tr key={item._id || `item-${index}`} className="cart-table-row">
                        <td className="cart-item-cell">
                          <div className="cart-item-content">
                            <div className="cart-item-image-container">
                              {item.itemId?.item_image ? (
                                <img
                                  src={`http://localhost:5000${item.itemId.item_image}`}
                                  alt={item.itemId?.item_name || "Product"}
                                  className="cart-item-image"
                                  onError={(e) => {
                                    e.target.src = "https://via.placeholder.com/70x70/81c784/FFFFFF?text=SOLAR";
                                  }}
                                />
                              ) : (
                                <div className="cart-item-placeholder">
                                  No Image
                                </div>
                              )}
                            </div>
                            <div className="cart-item-details">
                              <div className="cart-item-name">
                                {item.itemId?.item_name || "Solar Product"}
                              </div>
                              <div className="cart-item-description">
                                {item.itemId?.description || "High-quality solar solution"}
                              </div>
                              <div className="cart-item-date">
                                Added: {item.created_at ? new Date(item.created_at).toLocaleDateString() : "Unknown"}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="cart-quantity-cell">
                          <div className="cart-quantity-controls">
                            <button
                              onClick={() => updateQuantity(item._id, item.quantity - 1)}
                              disabled={updating[item._id] || item.quantity <= 1}
                              className="cart-quantity-btn cart-quantity-decrease"
                              title="Decrease quantity"
                            >
                              −
                            </button>
                            <span className="cart-quantity-display">
                              {updating[item._id] ? (
                                <span className="cart-quantity-loading">⏳</span>
                              ) : (
                                item.quantity || 1
                              )}
                            </span>
                            <button
                              onClick={() => updateQuantity(item._id, item.quantity + 1)}
                              disabled={updating[item._id]}
                              className="cart-quantity-btn cart-quantity-increase"
                              title="Increase quantity"
                            >
                              +
                            </button>
                          </div>
                        </td>
                        <td className="cart-price-cell">
                          <span className="cart-unit-price">
                            Rs. {(item.unit_price || 0).toLocaleString()}
                          </span>
                        </td>
                        <td className="cart-subtotal-cell">
                          <strong className="cart-item-subtotal">
                            Rs. {(item.subtotal || 0).toLocaleString()}
                          </strong>
                        </td>
                        <td className="cart-actions-cell">
                          <button
                            onClick={() => deleteItem(item._id)}
                            disabled={updating[item._id]}
                            className="cart-remove-btn"
                            title="Remove item"
                          >
                            {updating[item._id] ? "⏳" : "🗑️"} Remove
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5" className="cart-empty-container">
                        <div className="cart-empty-icon">🛒</div>
                        <h3 className="cart-empty-title">Your cart is empty</h3>
                        <p className="cart-empty-text">
                          Add some amazing solar products to get started!
                        </p>
                        <button
                          onClick={() => navigate("/?view=packages")}
                          className="cart-shop-btn"
                        >
                          🛍️ Shop Solar Products
                        </button>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
              
              {cartItems.length > 0 && (
                <div className="cart-summary">
                  <div className="cart-subtotal">
                    Subtotal: Rs. {totalAmount.toLocaleString()}
                  </div>
                  <div className="cart-tax">
                    Tax (8.5%): Rs. {taxAmount.toLocaleString()}
                  </div>
                  <div className="cart-grand-total">
                    Total: Rs. {grandTotal.toLocaleString()}
                  </div>
                </div>
              )}
            </div>
          )}
          
          <div className="cart-action-buttons">
            <button
              onClick={handleAddMoreItems}
              className="cart-add-more-btn"
            >
              🛍️ Add More Items
            </button>
            <button
              onClick={handleProceed}
              disabled={cartItems.length === 0 || loading}
              className="cart-proceed-btn"
            >
              💳 Proceed to Payment
            </button>
          </div>
          
          <div className="cart-footer-info">
            <p>🔒 Secure checkout • 🚚 Free shipping • ⏪ 30-day returns</p>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}

export default Cart;