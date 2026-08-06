import React, { useState } from "react";
import { Link, useLocation, NavLink, useNavigate } from "react-router-dom";
import "./Inventory_Management_Nav.css";
import logo from "./logo selfme.png"; // Corrected import path
import { removeAuthToken } from "../../../utils/auth";

const InventoryManagementNav = () => {
  const navigate = useNavigate();
  // Retrieve user data from localStorage
  const authUser = JSON.parse(localStorage.getItem("authUser") || "{}");
  const firstName = authUser.firstName || "Inventory"; // Use firstName, default to 'Inventory'

  const handleLogout = () => {
    removeAuthToken();
    localStorage.removeItem("authUser"); // Clear user data
    navigate("/login");
  };

  const location = useLocation(); // for active link highlighting

  const isActive = (path) => location.pathname === path;

  return (
    <aside className="inv-nav">
      {/* Brand Section with Logo */}
      <div className="inv-nav__brand">
        <img src={logo} alt="Selfme Logo" className="inv-nav__logo" />
        <Link to="/inventory" className="inv-nav__brand-link">
          Selfme.lk
        </Link>
        <span className="inv-nav__subtitle">Inventory Management</span>
      </div>

      {/* Navigation */}
      <nav className="inv-nav__menu" aria-label="Inventory Navigation">
        <ul className="inv-nav__list">
          {/* Product Management */}
          <li className="inv-nav__item">
            <button className="inv-nav__header">
              <span>Product Management</span>
            </button>
            <div className="inv-nav__submenu">
              <Link
                to="/addItems"
                className={`inv-nav__link ${
                  isActive("/addItems") ? "active" : ""
                }`}
              >
                Add Items
              </Link>
              <Link
                to="/viewAllItems"
                className={`inv-nav__link ${
                  isActive("/viewAllItems") ? "active" : ""
                }`}
              >
                View / Update / Delete Items
              </Link>
              <Link
                to="/stocklevels"
                className={`inv-nav__link ${
                  isActive("/stocklevels") ? "active" : ""
                }`}
              >
                Stock Levels
              </Link>
              <Link
                to="/damage_return_add"
                className={`inv-nav__link ${
                  isActive("/damage_return_add") ? "active" : ""
                }`}
              >
                Mark Damaged / Return Items
              </Link>
            </div>
          </li>

          {/* Re-Order Handle */}
          <li className="inv-nav__item">
            <button className="inv-nav__header">
              <span>Re-Order Handle</span>
            </button>
            <div className="inv-nav__submenu">
              <Link
                to="/reorderlevels"
                className={`inv-nav__link ${
                  isActive("/reorderlevels") ? "active" : ""
                }`}
              >
                Re-Order Handle
              </Link>
              <Link
                to="/product_status"
                className={`inv-nav__link ${
                  isActive("/product_status") ? "active" : ""
                }`}
              >
                Approve / Reject Requests
              </Link>
            </div>
          </li>

          {/* Stock Out Management */}
          <li className="inv-nav__item">
            <button className="inv-nav__header">
              <span>Stock Out Management</span>
            </button>
            <div className="inv-nav__submenu">
              <Link
                to="/material_orders"
                className={`inv-nav__link ${
                  isActive("/material_orders") ? "active" : ""
                }`}
              >
                Order Request
              </Link>

              <Link
                to="/material_outgoings"
                className={`inv-nav__link ${
                  isActive("/material_outgoings") ? "active" : ""
                }`}
              >
                Order Out & Confirm
              </Link>
              <Link
                to="/material_outgoings_history"
                className={`inv-nav__link ${
                  isActive("/material_outgoings_history") ? "active" : ""
                }`}
              >
                Order Placed History
              </Link>
            </div>
          </li>

          {/* Supplier */}
          <li className="inv-nav__item">
            <button className="inv-nav__header">
              <span>Supplier</span>
            </button>
            <div className="inv-nav__submenu">
              <Link
                to="/addSupplier"
                className={`inv-nav__link ${
                  isActive("/addSupplier") ? "active" : ""
                }`}
              >
                Add Supplier
              </Link>
              <Link
                to="/viewSuppliers"
                className={`inv-nav__link ${
                  isActive("/viewSuppliers") ? "active" : ""
                }`}
              >
                Manage Supplier
              </Link>
            </div>
          </li>
        </ul>
      </nav>

      {/* Footer */}
      <div className="inv-nav__footer">
        {/* <span className="user-name">Welcome, {firstName}</span> */}
        <button
          style={{
            backgroundColor: "#ef4444",
            color: "#ffffff",
            padding: "0.5rem 1rem",
            border: "none",
            borderRadius: "0.375rem",
            fontSize: "0.875rem",
            fontWeight: "500",
            cursor: "pointer",
            width: "100%",
            textAlign: "center",
            transition: "background-color 0.2s ease",
            ":hover": {
              backgroundColor: "#dc2626",
            },
          }}
          onClick={handleLogout}
        >
          Logout
        </button>
      </div>
    </aside>
  );
};

export default InventoryManagementNav;
