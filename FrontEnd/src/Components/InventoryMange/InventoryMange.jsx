import React from 'react';
import { useNavigate } from 'react-router-dom';
import { removeAuthToken } from '../../utils/auth';

const InventoryManage = () => {
  const navigate = useNavigate();
  // Retrieve user data from localStorage
  const authUser = JSON.parse(localStorage.getItem('authUser') || '{}');
  const firstName = authUser.firstName || 'Inventory'; // Use firstName, default to 'Inventory'

  const handleLogout = () => {
    removeAuthToken();
    localStorage.removeItem('authUser'); // Clear user data
    navigate('/login');
  };

  return (
    <div className="home-container">
      <div className="dashboard">
        <div className="dashboard-header">
          <div>
            <h1 className="dashboard-title">Inventory Dashboard</h1>
            <p className="dashboard-subtitle">SelfMe - FUTURE OF SUN - SOLAR POWER</p>
          </div>
          <div className="user-info">
            <span className="user-name">Welcome, {firstName}</span>
            <button className="logout-btn" onClick={handleLogout}>Logout</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InventoryManage;
