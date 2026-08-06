// FrontEnd/src/Components/Nav/Navbar.jsx
import React from "react";
import { useNavigate } from "react-router-dom";
import { removeAuthToken } from '../../utils/auth';
import "./Navbar.css";

const Navbar = () => {
  const navigate = useNavigate();

  // Get user data - fallback to "Guest" if not available
  const authUser = JSON.parse(localStorage.getItem('authUser') || '{}');
  const displayName = authUser.firstName || 'Guest'; // Use firstName, fallback to Guest

  // Check if token exists
  const hasToken = !!localStorage.getItem('token');

  const handleLogout = () => {
    removeAuthToken();
    localStorage.removeItem('authUser');
    navigate('/login');
  };

  const handleNavClick = (e, path) => {
    e.preventDefault();
    window.location.replace(path); // Force refresh for query params
  };

  const handleUserClick = () => {
    navigate('/?view=dashboard'); // Navigate to dashboard
  };

  return (
    <nav id="selfmeNavbarContainer">
      <h1 id="selfmeNavbarLogo" onClick={(e) => handleNavClick(e, '/')}>Selfme.lk</h1>
      <a href="/" id="selfmeNavHome" onClick={(e) => handleNavClick(e, '/')}>
        Home
      </a>
      <a href="/packages" id="selfmeNavPackages" onClick={(e) => handleNavClick(e, '/?view=packages')}>
        Product
      </a>
      <a href="/service" id="selfmeNavService" onClick={(e) => handleNavClick(e, '/?view=service')}>
        Service
      </a>
      <a href="/cart" id="selfmeNavCart" onClick={(e) => handleNavClick(e, '/?view=cart')}>
        Cart
      </a>
      <a href="/feedback" id="selfmeNavFeedback" onClick={(e) => handleNavClick(e, '/?view=feedback')}>
        Feedback
      </a>
      <a href="/about" id="selfmeNavAbout" onClick={(e) => handleNavClick(e, '/?view=about')}>
        About Us
      </a>
      <a href="/contact" id="selfmeNavContact" onClick={(e) => handleNavClick(e, '/?view=contact')}>
        Contact
      </a>
      {hasToken ? (
        <div className="user-info">
          <span className="user-name" onClick={handleUserClick} style={{ cursor: "pointer" }}>
            Welcome, {displayName}
          </span>
          <button className="logout-btn" onClick={handleLogout}>Logout</button>
        </div>
      ) : (
        <div className="user-info">
          <a href="/login" className="login-link">Login</a>
          <a href="/signup" className="signup-link">Sign Up</a>
        </div>
      )}
    </nav>
  );
};

export default Navbar;