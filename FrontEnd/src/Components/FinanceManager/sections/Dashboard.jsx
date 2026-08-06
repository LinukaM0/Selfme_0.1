import React, { useState, useEffect } from 'react';
import './Dashboard.css';
import axios from 'axios';
import { 
  FiDollarSign, 
  FiTrendingUp, 
  FiTrendingDown, 
  FiFileText, 
  FiUsers, 
  FiAlertTriangle, 
  FiCheckCircle,
  FiPieChart,
  FiBarChart2
} from 'react-icons/fi';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

const Dashboard = () => {
  const [totalIncome, setTotalIncome] = useState(0);
  const [totalProfit, setTotalProfit] = useState(0);
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [netIncome, setNetIncome] = useState(0);
  const [totalTax, setTotalTax] = useState(0);
  const [totalSalaries, setTotalSalaries] = useState(0);
  const [pendingPayments, setPendingPayments] = useState(0);
  const [approvedPayments, setApprovedPayments] = useState(0);
  const [pendingSuppliers, setPendingSuppliers] = useState(0);
  const [approvedSuppliers, setApprovedSuppliers] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [chartData, setChartData] = useState([]);
  const [paymentStatusData, setPaymentStatusData] = useState([]);
  const [expenseBreakdownData, setExpenseBreakdownData] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setError('Please login to view dashboard');
          setIsLoading(false);
          return;
        }
        const headers = { Authorization: `Bearer ${token}` };

        // Fetch payments
        const paymentsRes = await axios.get('http://localhost:5000/api/finance/payments', { headers });
        const payments = Array.isArray(paymentsRes.data) ? paymentsRes.data : [];
        const paidPayments = payments.filter(p => p.status === 'Paid');
        const pendingCount = payments.filter(p => p.status === 'Pending').length;
        const approvedCount = paidPayments.length;

        // Calculate income, profit, purchase expenses
        const income = paidPayments.reduce((acc, p) => acc + (p.amount || 0), 0);
        const profit = paidPayments.reduce((acc, p) => 
          acc + (p.itemId ? p.itemId.reduce((sum, item) => 
            sum + ((item.selling_price || 0) - (item.purchase_price || 0) - (item.selling_price || 0) * 0.085), 0) : 0), 0);
        const purchaseExpenses = paidPayments.reduce((acc, p) => 
          acc + (p.itemId ? p.itemId.reduce((sum, item) => sum + (item.purchase_price || 0), 0) : 0), 0);

        // Fetch salaries for current month
        const currentMonth = new Date().toLocaleString('default', { month: 'long', year: 'numeric' });
        const salariesRes = await axios.get(`http://localhost:5000/api/finance/salary?month=${currentMonth}`, { headers });
        const salariesData = Array.isArray(salariesRes.data) ? salariesRes.data : [];
        const salariesTotal = salariesData.reduce((sum, emp) => 
          sum + (emp.isManager ? 20000 : 10000) + 3000 * (emp.workingDays || 0) + (emp.otherAllowance || 0), 0);

        // Fetch other expenses for current month
        const expensesRes = await axios.get(`http://localhost:5000/api/finance/expenses?month=${currentMonth}`, { headers });
        const otherExp = (expensesRes.data || []).reduce((sum, exp) => sum + (exp.amount || 0), 0);

        // Total expenses
        const exp = purchaseExpenses + salariesTotal + otherExp;

        // Net income
        const net = income - exp;

        // Tax
        const tax = paidPayments.reduce((sum, p) => sum + (p.amount || 0) * 0.085, 0);

        // Supplier requests
        const supplierRes = await axios.get('http://localhost:5000/api/finance/financial/product-requests', { headers });
        const suppliers = Array.isArray(supplierRes.data) ? supplierRes.data : [];
        const pendingSup = suppliers.filter(r => r.financial_status !== 'approved').length;
        const approvedSup = suppliers.filter(r => r.financial_status === 'approved').length;

        // Set main data
        setTotalIncome(income);
        setTotalProfit(profit);
        setTotalExpenses(exp);
        setNetIncome(net);
        setTotalTax(tax);
        setTotalSalaries(salariesTotal);
        setPendingPayments(pendingCount);
        setApprovedPayments(approvedCount);
        setPendingSuppliers(pendingSup);
        setApprovedSuppliers(approvedSup);

        // Prepare chart data
        prepareChartData(income, profit, exp, net, tax, salariesTotal);
        preparePaymentStatusData(pendingCount, approvedCount);
        prepareExpenseBreakdownData(purchaseExpenses, salariesTotal, otherExp);
        
        setIsLoading(false);
      } catch (err) {
        console.error('Dashboard fetch error:', err);
        setError(err.response?.data?.message || 'Failed to load dashboard data.');
        setIsLoading(false);
      }
    };

    const prepareChartData = (income, profit, expenses, netIncome, tax, salaries) => {
      const data = [
        { name: 'Income', value: income },
        { name: 'Profit', value: profit },
        { name: 'Expenses', value: expenses },
        { name: 'Net Income', value: netIncome },
        { name: 'Tax', value: tax },
        { name: 'Salaries', value: salaries },
      ];
      setChartData(data);
    };

    const preparePaymentStatusData = (pending, approved) => {
      const data = [
        { name: 'Pending', value: pending, color: '#ffc107' },
        { name: 'Approved', value: approved, color: '#28a745' },
      ];
      setPaymentStatusData(data);
    };

    const prepareExpenseBreakdownData = (purchase, salaries, other) => {
      const data = [
        { name: 'Purchases', value: purchase, color: '#007BFF' },
        { name: 'Salaries', value: salaries, color: '#28a745' },
        { name: 'Other', value: other, color: '#dc3545' },
      ];
      setExpenseBreakdownData(data);
    };

    fetchData();
  }, []);

  if (isLoading) return <div id="dashboard-loading" style={{ textAlign: 'center', padding: '20px' }}>Loading Dashboard...</div>;
  if (error) return <div id="dashboard-error" style={{ textAlign: 'center', padding: '20px', color: 'red' }}>Error: {error}</div>;

  return (
    <div id="finance-dashboard" style={{ padding: '20px', maxWidth: '1400px', margin: '0 auto' }}>
      <h1 id="dashboard-title" style={{ textAlign: 'center', marginBottom: '30px', color: '#2c3e50' }}>
        Finance Manager Dashboard
      </h1>
      
      {/* Key Metrics Cards */}
      <div id="metrics-grid" style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', 
        gap: '20px',
        marginBottom: '30px'
      }}>
        <DashboardCard 
          icon={<FiDollarSign size={24} />} 
          title="Total Income" 
          value={`Rs. ${totalIncome.toLocaleString()}`} 
          color="#007BFF" 
          trend="up"
        />
        <DashboardCard 
          icon={<FiTrendingUp size={24} />} 
          title="Total Profit" 
          value={`Rs. ${totalProfit.toLocaleString()}`} 
          color="#28a745" 
          trend="up"
        />
        <DashboardCard 
          icon={<FiTrendingDown size={24} />} 
          title="Total Expenses" 
          value={`Rs. ${totalExpenses.toLocaleString()}`} 
          color="#dc3545" 
          trend="down"
        />
        <DashboardCard 
          icon={<FiDollarSign size={24} />} 
          title="Net Income" 
          value={`Rs. ${netIncome.toLocaleString()}`} 
          color="#6f42c1" 
          trend={netIncome >= 0 ? "up" : "down"}
        />
        <DashboardCard 
          icon={<FiFileText size={24} />} 
          title="Total Tax Collected" 
          value={`Rs. ${totalTax.toLocaleString()}`} 
          color="#fd7e14" 
        />
        <DashboardCard 
          icon={<FiUsers size={24} />} 
          title="Total Salaries" 
          value={`Rs. ${totalSalaries.toLocaleString()}`} 
          color="#20c997" 
        />
        <DashboardCard 
          icon={<FiAlertTriangle size={24} />} 
          title="Pending Payments" 
          value={pendingPayments} 
          color="#ffc107" 
        />
        <DashboardCard 
          icon={<FiCheckCircle size={24} />} 
          title="Approved Payments" 
          value={approvedPayments} 
          color="#28a745" 
        />
        <DashboardCard 
          icon={<FiAlertTriangle size={24} />} 
          title="Pending Supplier Requests" 
          value={pendingSuppliers} 
          color="#ffc107" 
        />
        <DashboardCard 
          icon={<FiCheckCircle size={24} />} 
          title="Approved Supplier Requests" 
          value={approvedSuppliers} 
          color="#28a745" 
        />
      </div>

      {/* Charts Section */}
      <div id="charts-section" style={{ marginBottom: '30px' }}>
        <h2 id="charts-title" style={{ marginBottom: '20px', color: '#2c3e50', borderBottom: '2px solid #ecf0f1', paddingBottom: '10px' }}>
          <FiBarChart2 style={{ marginRight: '10px' }} />
          Financial Overview
        </h2>
        
        <div id="charts-grid" style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', 
          gap: '20px' 
        }}>
          {/* Financial Metrics Bar Chart */}
          <ChartContainer title="Financial Metrics Comparison">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={(value) => `Rs. ${value.toLocaleString()}`} />
                <Legend />
                <Bar dataKey="value" fill="#007BFF" name="Amount (Rs.)" />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>

          {/* Payment Status Pie Chart */}
          <ChartContainer title="Payment Status Distribution">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={paymentStatusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {paymentStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`${value} payments`, 'Count']} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </ChartContainer>

          {/* Expense Breakdown Pie Chart */}
          <ChartContainer title="Expense Breakdown">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={expenseBreakdownData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {expenseBreakdownData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`Rs. ${value.toLocaleString()}`, 'Amount']} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </ChartContainer>

          {/* Net Income Trend Line Chart */}
          <ChartContainer title="Income vs Expenses Trend">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={[
                { month: 'Jan', income: totalIncome * 0.8, expenses: totalExpenses * 0.7 },
                { month: 'Feb', income: totalIncome * 0.9, expenses: totalExpenses * 0.8 },
                { month: 'Mar', income: totalIncome, expenses: totalExpenses },
              ]}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value) => `Rs. ${value.toLocaleString()}`} />
                <Legend />
                <Line type="monotone" dataKey="income" stroke="#007BFF" name="Income" strokeWidth={2} />
                <Line type="monotone" dataKey="expenses" stroke="#dc3545" name="Expenses" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </ChartContainer>
        </div>
      </div>

      {/* Quick Stats Section */}
      <div id="quick-stats" style={{ 
        backgroundColor: '#f8f9fa', 
        padding: '20px', 
        borderRadius: '8px',
        border: '1px solid #dee2e6'
      }}>
        <h3 style={{ marginBottom: '15px', color: '#2c3e50' }}>
          <FiPieChart style={{ marginRight: '10px' }} />
          Quick Statistics
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
          <StatItem label="Profit Margin" value={`${totalIncome > 0 ? ((totalProfit / totalIncome) * 100).toFixed(1) : 0}%`} />
          <StatItem label="Expense Ratio" value={`${totalIncome > 0 ? ((totalExpenses / totalIncome) * 100).toFixed(1) : 0}%`} />
          <StatItem label="Tax Rate" value="8.5%" />
          <StatItem label="Approval Rate" value={`${pendingPayments + approvedPayments > 0 ? ((approvedPayments / (pendingPayments + approvedPayments)) * 100).toFixed(1) : 0}%`} />
        </div>
      </div>
    </div>
  );
};

const DashboardCard = ({ icon, title, value, color, trend }) => (
  <div id={`card-${title.toLowerCase().replace(/\s+/g, '-')}`} style={{
    padding: '25px',
    border: `1px solid ${color}20`,
    borderRadius: '12px',
    backgroundColor: 'white',
    boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
    textAlign: 'center',
    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
    position: 'relative',
    overflow: 'hidden'
  }}
  onMouseEnter={(e) => {
    e.currentTarget.style.transform = 'translateY(-5px)';
    e.currentTarget.style.boxShadow = '0 8px 15px rgba(0,0,0,0.15)';
  }}
  onMouseLeave={(e) => {
    e.currentTarget.style.transform = 'translateY(0)';
    e.currentTarget.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1)';
  }}
  >
    <div style={{ 
      position: 'absolute', 
      top: 0, 
      left: 0, 
      right: 0, 
      height: '4px', 
      backgroundColor: color 
    }} />
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      marginBottom: '15px',
      color: color 
    }}>
      {icon}
      {trend && (
        <span style={{ 
          marginLeft: '8px',
          fontSize: '14px',
          color: trend === 'up' ? '#28a745' : '#dc3545'
        }}>
          {trend === 'up' ? '↗' : '↘'}
        </span>
      )}
    </div>
    <h3 style={{ 
      marginBottom: '10px', 
      fontSize: '14px',
      fontWeight: '600',
      color: '#6c757d',
      textTransform: 'uppercase',
      letterSpacing: '0.5px'
    }}>
      {title}
    </h3>
    <p style={{ 
      fontSize: '24px', 
      fontWeight: 'bold', 
      color: color,
      margin: 0
    }}>
      {value}
    </p>
  </div>
);

const ChartContainer = ({ title, children }) => (
  <div id={`chart-${title.toLowerCase().replace(/\s+/g, '-')}`} style={{
    padding: '20px',
    border: '1px solid #dee2e6',
    borderRadius: '8px',
    backgroundColor: 'white',
    boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
  }}>
    <h4 style={{ 
      marginBottom: '15px', 
      color: '#2c3e50',
      fontSize: '16px',
      fontWeight: '600'
    }}>
      {title}
    </h4>
    {children}
  </div>
);

const StatItem = ({ label, value }) => (
  <div style={{
    textAlign: 'center',
    padding: '10px'
  }}>
    <div style={{ 
      fontSize: '12px', 
      color: '#6c757d',
      marginBottom: '5px'
    }}>
      {label}
    </div>
    <div style={{ 
      fontSize: '18px', 
      fontWeight: 'bold',
      color: '#2c3e50'
    }}>
      {value}
    </div>
  </div>
);

export default Dashboard;