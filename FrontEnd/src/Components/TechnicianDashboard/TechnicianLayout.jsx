import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { removeAuthToken } from '../../utils/auth';
import './TechnicianLayout.css';

function TechnicianLayout({ children }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const authUser = JSON.parse(localStorage.getItem('authUser') || '{}');
  const firstName = authUser.firstName || 'Technician';

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const handleLogout = () => {
    removeAuthToken();
    localStorage.removeItem('authUser');
    navigate('/login');
  };

  const companyInfo = {
    name: 'SelfMe',
    logo: '/newLogo.png',
  };

  return (
    <div className="technician-layout">
      <nav id="technician-nav" className={`sidebar ${isSidebarOpen ? 'open' : ''}`}>
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
              to="/technicianDashboard"
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
              title="Submit Report"
            >
              <span className="text">Technician Dashboard</span>
            </NavLink>
          </li>
          
          <li>
            <NavLink
              to="/register-employee"
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
              title="Register Employee"
            >
              <span className="text">Register Employee</span>
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/employees"
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
              title="Registered Employees"
            >
              <span className="text">Registered Employees</span>
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/assigned-tasks"
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
              title="Approved Payments"
            >
              <span className="text">Approved Payments</span>
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/completed-tasks"
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
              title="Not Yet Assigned Tasks"
            >
              <span className="text">Not Yet Assigned Tasks</span>
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/pending-tasks"
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
              title="Pending Tasks"
            >
              <span className="text">Pending Tasks</span>
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/full-completed-tasks"
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
              title="Completed Tasks"
            >
              <span className="text">Completed Tasks</span>
            </NavLink>
          </li>
        </ul>
        <div className="sidebar-user-info">
          <span className="user-name">Welcome, {firstName}</span>
          <button className="logout-btn" onClick={handleLogout}>
            <span className="text">Logout</span>
          </button>
        </div>
        <div className="sidebar-footer">
          <p>© {new Date().getFullYear()} {companyInfo.name}</p>
        </div>
      </nav>
      <div className="technician-content">{children}</div>
    </div>
  );
}

export default TechnicianLayout;