import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { removeAuthToken } from '../../utils/auth';
import './FinanceManager.css';
import Sidebar from './Sidebar';
import ContentHeader from './ContentHeader';
// Section Components
import Dashboard from './sections/Dashboard';
import SupplierPaymentStatus from './sections/SupplierPaymentStatus';
import Salaries from './sections/Salaries';
import Payments from './sections/Payments';
import TaxCompliance from './sections/TaxCompliance';
import FinancialOverview from './sections/FinancialOverview';

const FinanceManager = () => {
  const [activeSection, setActiveSection] = useState('dashboard');
  const navigate = useNavigate();

  // Retrieve user data from localStorage
  const authUser = JSON.parse(localStorage.getItem('authUser') || '{}');
  const firstName = authUser.firstName || 'Finance';

  const handleLogout = () => {
    removeAuthToken();
    localStorage.removeItem('authUser');
    navigate('/login');
  };

  const renderContent = () => {
    switch (activeSection) {
      case 'dashboard':
        return <Dashboard />;
      case 'supplier-payment-status':
        return <SupplierPaymentStatus />;
      case 'salaries':
        return <Salaries />;
      case 'payments':
        return <Payments />;
      case 'tax':
        return <TaxCompliance />;
      case 'financial-overview':
        return <FinancialOverview />;
      default:
        return <div id="default-content-message">Select a section from the menu</div>;
    }
  };

  return (
    <div id="finance-manager-app" className="finance-management">
      <Sidebar activeSection={activeSection} setActiveSection={setActiveSection} />
      <div id="finance-main-content" className="main-content">
        <ContentHeader firstName={firstName} handleLogout={handleLogout} />
        <div id="finance-content-body" className="content-body">
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

export default FinanceManager;