import React from 'react';

const icons = {
  receipt: '🧾',
  salary: '💰',
  payment: '💳',
  tax: '📋',
  analytics: '📈',
  dashboard: '🏠'
};

const menuItems = [
  { id: 'dashboard', label: 'Dashboard', icon: icons.dashboard },
  { id: 'supplier-payment-status', label: 'Supplier Payment Status', icon: icons.receipt },
  { id: 'salaries', label: 'Manage Salaries', icon: icons.salary },
  { id: 'payments', label: 'Payment Status', icon: icons.payment },
  { id: 'tax', label: 'Tax Compliance', icon: icons.tax },
  { id: 'financial-overview', label: 'Financial Overview', icon: icons.analytics }
];

const Sidebar = ({ activeSection, setActiveSection }) => {
  return (
    <div id="finance-sidebar" className="sidebar">
      <div id="sidebar-header" className="sidebar-header">
        <div id="sidebar-logo">
          <h2>FinancePro</h2>
          <p>Management System</p>
        </div>
      </div>
      <nav id="sidebar-navigation" className="sidebar-nav">
        {menuItems.map((item, index) => (
          <button
            key={item.id}
            id={`nav-item-${item.id}`}
            className={`nav-item ${activeSection === item.id ? 'active' : ''}`}
            onClick={() => setActiveSection(item.id)}
          >
            <span id={`nav-icon-${item.id}`} className="nav-icon">{item.icon}</span>
            <span id={`nav-label-${item.id}`} className="nav-label">{item.label}</span>
            <div id={`nav-indicator-${item.id}`} className="nav-indicator"></div>
          </button>
        ))}
      </nav>
      <div id="sidebar-footer">
        <div id="user-profile">
          
          <div id="user-info">
            
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;