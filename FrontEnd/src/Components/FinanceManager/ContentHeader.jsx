import React from 'react';
import './ContentHeader';

const ContentHeader = ({ firstName, handleLogout }) => {
  return (
    <div className="content-header">
      <div>
        <h1>Finance Management</h1>
        <p>Welcome to Solar ERP Finance Management Panel</p>
      </div>
      <div className="user-info">
        <span className="user-name">Welcome, {firstName}</span>
        <button className="logout-btn" onClick={handleLogout}>Logout</button>
      </div>
    </div>
  );
};

export default ContentHeader;