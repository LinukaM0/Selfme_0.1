// 8) Updated FrontEnd/src/Components/Nav/Nav.jsx
import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { removeAuthToken } from '../../utils/auth';
import './Nav.css';
function Nav({ firstName, handleLogout }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const authUser = JSON.parse(localStorage.getItem('authUser') || '{}');
  const name = firstName || (authUser.firstName || 'Admin');
  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };
  const onLogout = handleLogout || (() => {
    removeAuthToken();
    localStorage.removeItem('authUser');
    navigate('/login');
  });
  const companyInfo = {
    name: 'SelfMe',
    logo: '/newLogo.png', // Ensure this logo exists in the public directory
  };
  return (
    <nav id="nav" className={`sidebar ${isSidebarOpen ? 'open' : ''}`}>
      <div className="sidebar-header">
        <img src={companyInfo.logo} alt={`${companyInfo.name} Logo`} className="sidebar-logo" />
        <h3 className="sidebar-title">{companyInfo.name}</h3>
        <button className="sidebar-toggle" onClick={toggleSidebar}>
          {isSidebarOpen ? '✕' : '☰'}
        </button>
      </div>
      <ul className="sidebar-menu">
        <li>
          <NavLink
            to="/mainAdminhome"
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
            title="Admin Home"
          >
            <span className="text">Admin Home</span>
          </NavLink>
        </li>
   
        <li>
          <NavLink
            to="/AllUsers"
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
            title="User Management"
          >
            <span className="text">User Management</span>
          </NavLink>
        </li>
        <li>
          <NavLink
            to="/AllFeedback"
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
            title="Feedback Management"
          >
            <span className="text">All Feedback</span>
          </NavLink>
        </li>
        <li>
          <NavLink
            to="/AllEmployees"
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
            title="Employee Management"
          >
            <span className="text">All Employees</span>
          </NavLink>
        </li>
        <li>
          <NavLink
            to="/ViewSupplyAll"
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
            title="Supplier Management"
          >
            <span className="text">All Suppliers</span>
          </NavLink>
        </li>
        <li>
          <NavLink
            to="/GetSupplyAll"
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
            title="Product Request Management"
          >
            <span className="text">All Product Requests</span>
          </NavLink>
        </li>
        <li>
          <NavLink
            to="/AllProducts"
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
            title="Product Management"
          >
            <span className="text">All Products</span>
          </NavLink>
        </li>
         
      
      </ul>
      <div className="sidebar-user-info">
        <span className="user-name">Welcome, {name}</span>
        <button className="logout-btn" onClick={onLogout}>
       
          <span className="text">Logout</span>
        </button>
      </div>
      <div className="sidebar-footer">
        <p>© {new Date().getFullYear()} {companyInfo.name}</p>
      </div>
    </nav>
  );
}
export default Nav;