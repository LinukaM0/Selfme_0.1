// 7) Updated FrontEnd/src/Components/AdminPanel/Admin.jsx
import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { removeAuthToken } from '../../utils/auth';
import axios from 'axios';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import '../Nav/Nav';
import './Admin.css';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

function Admin() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [usersCount, setUsersCount] = useState(0);
  const [feedbacksCount, setFeedbacksCount] = useState(0);
  const [employeesCount, setEmployeesCount] = useState(0);
  const [suppliersCount, setSuppliersCount] = useState(0);
  const [requestsCount, setRequestsCount] = useState(0);
  const [productsCount, setProductsCount] = useState(0);
  const navigate = useNavigate();
  const authUser = JSON.parse(localStorage.getItem('authUser') || '{}');
  const firstName = authUser.firstName || 'Admin';
  const companyInfo = {
    name: 'SelfMe',
    logo: '/newLogo.png',
  };
  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };
  const handleLogout = () => {
    removeAuthToken();
    localStorage.removeItem('authUser');
    navigate('/login');
  };

  useEffect(() => {
    const fetchCounts = async () => {
      try {
        const [usersRes, feedbacksRes, employeesRes, suppliersRes, requestsRes, productsRes] = await Promise.all([
          axios.get('http://localhost:5000/all-users'),
          axios.get('http://localhost:5000/all-feedback'),
          axios.get('http://localhost:5000/all-employees'),
          axios.get('http://localhost:5000/all-suppliers'),
          axios.get('http://localhost:5000/all-productrequests'),
          axios.get('http://localhost:5000/products')
        ]);
        setUsersCount(usersRes.data.users?.length || 0);
        setFeedbacksCount(feedbacksRes.data.feedbacks?.length || 0);
        setEmployeesCount(employeesRes.data.employees?.length || 0);
        setSuppliersCount(suppliersRes.data.suppliers?.length || 0);
        setRequestsCount(requestsRes.data.productRequests?.length || 0);
        setProductsCount(productsRes.data.length || 0);
      } catch (error) {
        console.error('Error fetching dashboard counts:', error);
      }
    };
    fetchCounts();
  }, []);

  const chartData = {
    labels: ['Users', 'Feedbacks', 'Employees', 'Suppliers', 'Requests', 'Products'],
    datasets: [{
      label: '',
      data: [usersCount, feedbacksCount, employeesCount, suppliersCount, requestsCount, productsCount],
      backgroundColor: [
        'rgba(54, 162, 235, 0.8)',   // Blue
        'rgba(75, 192, 192, 0.8)',   // Teal
        'rgba(153, 102, 255, 0.8)',  // Purple
        'rgba(255, 159, 64, 0.8)',   // Orange
        'rgba(255, 99, 132, 0.8)',    // Red
        'rgba(46, 125, 50, 0.8)'      // Green
      ],
      borderColor: [
        'rgba(54, 162, 235, 1)',
        'rgba(75, 192, 192, 1)',
        'rgba(153, 102, 255, 1)',
        'rgba(255, 159, 64, 1)',
        'rgba(255, 99, 132, 1)',
        'rgba(46, 125, 50, 1)'
      ],
      borderWidth: 2,
      borderRadius: 8,
      borderSkipped: false,
    }],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      duration: 1500,
      easing: 'easeInOutQuart',
    },
    onClick: (event, elements) => {
      if (elements.length > 0) {
        const index = elements[0].index;
        const routes = ['/AllUsers', '/AllFeedback', '/AllEmployees', '/ViewSupplyAll', '/GetSupplyAll', '/AllProducts'];
        navigate(routes[index]);
      }
    },
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: true,
        text: 'Dashboard Statistics Overview',
        font: {
          size: 18,
          weight: 'bold',
          family: 'Poppins',
        },
        color: '#2c3e50',
        padding: {
          top: 10,
          bottom: 25,
        },
      },
      tooltip: {
        backgroundColor: 'rgba(44, 62, 80, 0.95)',
        titleColor: '#ffffff',
        bodyColor: '#ffffff',
        borderColor: 'rgba(189, 195, 199, 0.8)',
        borderWidth: 1,
        cornerRadius: 6,
        padding: 12,
        titleFont: {
          size: 14,
          weight: 'bold'
        },
        bodyFont: {
          size: 13
        },
        callbacks: {
          label: function(context) {
            return context.dataset.label + ': ' + context.parsed.y;
          }
        }
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          color: '#4a5568',
          font: {
            family: 'Poppins',
            size: 12,
            weight: '500'
          },
        },
      },
      y: {
        grid: {
          color: 'rgba(189, 195, 199, 0.3)',
          lineWidth: 1,
        },
        ticks: {
          color: '#4a5568',
          font: {
            family: 'Poppins',
            size: 12,
          },
          stepSize: 1,
        },
        beginAtZero: true,
      },
    },
  };

  return (
    <div className="home-container admin">
      {/* Left Sidebar */}
      <nav className={`sidebar ${isSidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <img
            src={companyInfo.logo}
            alt={`${companyInfo.name} Logo`}
            className="sidebar-logo"
          />
          <div>
            <h2 className="sidebar-title">{companyInfo.name}</h2>
            <p className="sidebar-subtitle">Admin Panel</p>
          </div>
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
          <button className="logout-btn" onClick={handleLogout}>
            <span className="text">Logout</span>
          </button>
        </div>
        <div className="sidebar-footer">
          <p>© {new Date().getFullYear()} {companyInfo.name}</p>
        </div>
      </nav>
      
      {/* Main Content Area */}
      <div className="main-content">
        <div className="dashboard">
          <div className="dashboard-header">
            <div>
              <h1 className="dashboard-title">Administrator Dashboard</h1>
              <p className="dashboard-subtitle">Welcome to {companyInfo.name} Admin Panel</p>
            </div>
            <div className="user-info">
              <span className="user-name">Welcome, {firstName}</span>
            </div>
          </div>
      
          <div className="chart-container">
            <Bar data={chartData} options={options} />
          </div>

          <div className="card-grid">
            <div className="card">
              <NavLink to="/AllUsers" className={({ isActive }) => `activehome ${isActive ? 'active' : ''}`}>
                <h2>Users ({usersCount})</h2>
                <p>Manage all users and their details.</p>
              </NavLink>
            </div>
          
            <div className="card">
              <NavLink to="/AllFeedback" className={({ isActive }) => `activehome ${isActive ? 'active' : ''}`}>
                <h2>All Feedback ({feedbacksCount})</h2>
                <p>Manage all feedbacks and replies.</p>
              </NavLink>
            </div>
            
            <div className="card">
              <NavLink to="/AllEmployees" className={({ isActive }) => `activehome ${isActive ? 'active' : ''}`}>
                <h2>All Employees ({employeesCount})</h2>
                <p>View all employee details.</p>
              </NavLink>
            </div>
           
            <div className="card">
              <NavLink to="/ViewSupplyAll" className={({ isActive }) => `activehome ${isActive ? 'active' : ''}`}>
                <h2>All Suppliers ({suppliersCount})</h2>
                <p>View all supplier details.</p>
              </NavLink>
            </div>
            
            <div className="card">
              <NavLink to="/GetSupplyAll" className={({ isActive }) => `activehome ${isActive ? 'active' : ''}`}>
                <h2>All Product Requests ({requestsCount})</h2>
                <p>Manage all product requests and statuses.</p>
              </NavLink>
            </div>

            <div className="card">
              <NavLink to="/AllProducts" className={({ isActive }) => `activehome ${isActive ? 'active' : ''}`}>
                <h2>All Products ({productsCount})</h2>
                <p>View all product details.</p>
              </NavLink>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Admin;