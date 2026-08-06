import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import jsPDF from "jspdf";
import { Bar } from "react-chartjs-2";
import { Chart as ChartJS, BarElement, CategoryScale, LinearScale, Tooltip, Legend } from "chart.js";
import TechnicianLayout from "./TechnicianLayout";
import "./TechnicianDashboard.css";

// Register Chart.js components
ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend);

const TechnicianDashboard = () => {
  const navigate = useNavigate();
  const authUser = JSON.parse(localStorage.getItem("authUser") || "{}");
  const firstName = authUser.firstName || "Technician";

  const [tasks, setTasks] = useState([]);
  const [filteredTasks, setFilteredTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [sortBy, setSortBy] = useState("paymentDate");
  const [sortOrder, setSortOrder] = useState("desc");
  const [activities, setActivities] = useState([]);
  const [paymentSummary, setPaymentSummary] = useState({ total: 0, completed: 0, pending: 0 });
  const [theme, setTheme] = useState("light");

  const companyInfo = {
    name: "SelfMe",
    tagline: "FUTURE OF SUN - SOLAR POWER",
    address: ["No/346, Madalanda, Dompe,", "Colombo, Sri Lanka"],
    phone: "+94 717 882 883",
    email: "Selfmepvtltd@gmail.com",
    website: "www.selfme.com",
  };

  useEffect(() => {
    const fetchTasks = async () => {
      setIsLoading(true);
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          setError("No authentication token found.");
          return;
        }
        const res = await axios.get("http://localhost:5000/api/tech/paidtasks", {
          headers: { Authorization: `Bearer ${token}` },
          timeout: 10000,
        });
        const taskData = Array.isArray(res.data) ? res.data : [];
        setTasks(taskData);
        setFilteredTasks(taskData);
        const totalAmount = taskData.reduce((sum, task) => sum + (task.amount || 0), 0);
        const completedAmount = taskData
          .filter((task) => task.statusofmy === "completed")
          .reduce((sum, task) => sum + (task.amount || 0), 0);
        const pendingAmount = totalAmount - completedAmount;
        setPaymentSummary({ total: totalAmount, completed: completedAmount, pending: pendingAmount });
        setActivities([
          { id: 1, action: "Task 001 Assigned", timestamp: new Date().toISOString(), type: "assigned" },
          { id: 2, action: "Task 002 Completed", timestamp: new Date(Date.now() - 3600000).toISOString(), type: "completed" },
        ]);
        setError(null);
      } catch (err) {
        setError("Failed to fetch tasks. Please try again.");
        console.error("Task fetch error:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchTasks();
  }, []);

  const getLogoAsBase64 = () => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        const base64 = canvas.toDataURL("image/png");
        resolve(base64);
      };
      img.onerror = () => {
        console.warn("Could not load logo, proceeding without it");
        resolve(null);
      };
      img.src = "/newLogo.png";
    });
  };

  const generatePDF = async (data, title) => {
    if (!data.length) return alert("No payments to download!");
    try {
      const logoBase64 = await getLogoAsBase64();
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();

      const addLetterhead = () => {
        if (logoBase64) {
          doc.addImage(logoBase64, "PNG", 15, 10, 20, 20);
        }
        doc.setFont("times", "bold");
        doc.setFontSize(16);
        doc.setTextColor(0, 0, 0);
        doc.text(companyInfo.name, pageWidth / 2, 20, { align: "center" });
        doc.setFont("times", "italic");
        doc.setFontSize(10);
        doc.setTextColor(0, 0, 0);
        doc.text(companyInfo.tagline, pageWidth / 2, 25, { align: "center" });
        doc.setFont("times", "normal");
        doc.text(companyInfo.address.join(", "), pageWidth / 2, 30, { align: "center" });
        doc.text(`Phone: ${companyInfo.phone} | Email: ${companyInfo.email} | Website: ${companyInfo.website}`, pageWidth / 2, 35, { align: "center" });
        doc.setLineWidth(0.5);
        doc.setDrawColor(139, 92, 246);
        doc.line(15, 40, pageWidth - 15, 40);
      };

      const addFooter = (pageNum, totalPages, lastRecordIdx) => {
        doc.setFont("times", "normal");
        doc.setFontSize(8);
        doc.setTextColor(0, 0, 0);
        doc.setLineWidth(0.3);
        doc.setDrawColor(150, 150, 150);
        doc.line(15, pageHeight - 20, pageWidth - 15, pageHeight - 20);
        const footerText = `Generated by ${companyInfo.name} Payment Management System`;
        doc.text(footerText, pageWidth / 2, pageHeight - 15, { align: "center" });
        const recordText = lastRecordIdx >= 0 ? `Payment #${String(lastRecordIdx + 1).padStart(3, "0")}` : "";
        doc.text(`Page ${pageNum} of ${totalPages} | ${recordText}`, pageWidth - 15, pageHeight - 10, { align: "right" });
        const genDate = new Date().toLocaleDateString("en-GB");
        const genTime = new Date().toLocaleTimeString("en-GB", { hour12: false });
        doc.text(`Generated on ${genDate} at ${genTime}`, 15, pageHeight - 10);
      };

      const addSignatureField = () => {
        doc.setFont("times", "normal");
        doc.setFontSize(10);
        doc.setTextColor(0, 0, 0);
        doc.text("Authorized Signature: __________________", pageWidth - 85, pageHeight - 30);
      };

      const fields = ["paymentId", "userId", "customer", "amount", "paymentDate", "status", "statusofmy"];
      let totalPages = 1;
      let tempY = 50;
      let lastRecordIdxPerPage = [];
      let currentPageRecords = [];

      data.forEach((_, idx) => {
        let itemHeight = fields.length * 10 + 20;
        if (tempY + itemHeight > pageHeight - 40) {
          totalPages++;
          lastRecordIdxPerPage.push(currentPageRecords[currentPageRecords.length - 1] || -1);
          currentPageRecords = [];
          tempY = 50;
        }
        currentPageRecords.push(idx);
        tempY += itemHeight;
      });
      lastRecordIdxPerPage.push(currentPageRecords[currentPageRecords.length - 1] || -1);

      let currentPage = 1;
      let y = 50;
      addLetterhead();
      doc.setFont("times", "bold");
      doc.setFontSize(14);
      doc.setTextColor(0, 0, 0);
      doc.text(title, pageWidth / 2, 45, { align: "center" });

      data.forEach((task, idx) => {
        let itemHeight = fields.length * 10 + 20;
        if (y + itemHeight > pageHeight - 40) {
          addSignatureField();
          addFooter(currentPage, totalPages, lastRecordIdxPerPage[currentPage - 1]);
          doc.addPage();
          currentPage++;
          addLetterhead();
          y = 50;
        }
        doc.setFont("times", "bold");
        doc.setFontSize(12);
        doc.setTextColor(0, 0, 0);
        doc.text(`Payment #${String(idx + 1).padStart(3, "0")}`, 15, y);
        doc.setFont("times", "normal");
        doc.setFontSize(10);
        y += 10;
        doc.setLineWidth(0.3);
        doc.setDrawColor(150, 150, 150);
        doc.rect(15, y, pageWidth - 30, fields.length * 10 + 5, "S");
        y += 5;
        fields.forEach((field) => {
          let label = field.replace(/([A-Z])/g, " $1").trim().replace(/\b\w/g, (l) => l.toUpperCase());
          let value = task[field] || "N/A";
          if (field === "paymentDate") {
            value = task[field] ? new Date(task[field]).toLocaleDateString("en-GB") : "N/A";
          } else if (field === "amount") {
            value = `Rs. ${task[field]?.toLocaleString() || "0"}`;
          }
          if (typeof value === "string" && value.length > 50) {
            value = value.substring(0, 47) + "...";
          }
          doc.setFont("times", "bold");
          doc.setTextColor(0, 0, 0);
          doc.text(`${label}:`, 20, y);
          doc.setFont("times", "normal");
          doc.setTextColor(0, 0, 0);
          doc.text(String(value), 60, y);
          y += 10;
        });
        y += 5;
        if (idx < data.length - 1) {
          doc.setLineWidth(0.2);
          doc.setDrawColor(200, 200, 200);
          doc.line(15, y, pageWidth - 15, y);
          y += 5;
        }
      });
      addSignatureField();
      addFooter(currentPage, totalPages, lastRecordIdxPerPage[currentPage - 1]);
      const timestamp = new Date().toISOString().split("T")[0];
      const fileName = `${companyInfo.name}_${title.replace(/\s+/g, "_")}_${timestamp}.pdf`;
      doc.save(fileName);
      alert(`Official report "${fileName}" downloaded successfully!`);
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("Error generating PDF. Please try again.");
    }
  };

  const handleDownloadAll = () => generatePDF(filteredTasks, "Approved Payments Report");
  const handleDownloadSingle = (task) => generatePDF([task], `Approved Payment Report - ${task.paymentId || "Unnamed"}`);

  const handleSearch = (e) => {
    const term = e.target.value.toLowerCase();
    setSearchTerm(term);
    filterTasks(term, filterStatus, sortBy, sortOrder);
  };

  const handleFilterStatus = (status) => {
    setFilterStatus(status);
    filterTasks(searchTerm, status, sortBy, sortOrder);
  };

  const handleSort = (e) => {
    const [field, order] = e.target.value.split(":");
    setSortBy(field);
    setSortOrder(order);
    filterTasks(searchTerm, filterStatus, field, order);
  };

  const filterTasks = (term, status, sortField, sortOrder) => {
    let filtered = tasks;
    if (term) {
      filtered = filtered.filter(
        (task) =>
          task.paymentId?.toLowerCase().includes(term) ||
          task.userId?.toLowerCase().includes(term) ||
          task.customer?.toLowerCase().includes(term) ||
          String(task.amount || "").includes(term)
      );
    }
    if (status !== "all") {
      filtered = filtered.filter((task) => task.statusofmy === status);
    }
    filtered = [...filtered].sort((a, b) => {
      const aValue = a[sortField] || "";
      const bValue = b[sortField] || "";
      if (sortField === "amount" || sortField === "paymentDate") {
        const aNum = sortField === "amount" ? aValue || 0 : new Date(aValue).getTime();
        const bNum = sortField === "amount" ? bValue || 0 : new Date(bValue).getTime();
        return sortOrder === "asc" ? aNum - bNum : bNum - aNum;
      }
      return sortOrder === "asc"
        ? String(aValue).localeCompare(String(bValue))
        : String(bValue).localeCompare(String(aValue));
    });
    setFilteredTasks(filtered);
  };

  const handleSignOut = () => {
    localStorage.removeItem("authUser");
    localStorage.removeItem("token");
    navigate("/login");
  };

  const handleRefresh = () => {
    window.location.reload();
  };

  const toggleTheme = () => {
    setTheme(theme === "light" ? "dark" : "light");
  };

  const formatCurrency = (value) => {
    return value.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const statusCounts = tasks.reduce(
    (acc, task) => {
      acc[task.statusofmy] = (acc[task.statusofmy] || 0) + 1;
      return acc;
    },
    { completed: 0, notyet: 0 }
  );

  const chartData = {
    labels: ["Completed", "Not Yet"],
    datasets: [
      {
        label: "Task Count",
        data: [statusCounts.completed, statusCounts.notyet],
        backgroundColor: ["#10b981", "#f59e0b"],
        borderColor: ["#ffffff", "#ffffff"],
        borderWidth: 1,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        barPercentage: 0.45,
        categoryPercentage: 0.9,
        title: {
          display: true,
          text: "Task Status",
          font: {
            family: "'Poppins', sans-serif",
            size: 14,
          },
          color: theme === "light" ? "#1e293b" : "#e2e8f0",
        },
        ticks: {
          color: theme === "light" ? "#1e293b" : "#e2e8f0",
          font: {
            family: "'Poppins', sans-serif",
            size: 12,
          },
        },
      },
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: "Number of Tasks",
          font: {
            family: "'Poppins', sans-serif",
            size: 14,
          },
          color: theme === "light" ? "#1e293b" : "#e2e8f0",
        },
        ticks: {
          color: theme === "light" ? "#1e293b" : "#e2e8f0",
          font: {
            family: "'Poppins', sans-serif",
            size: 12,
          },
          stepSize: 1,
        },
      },
    },
    plugins: {
      legend: {
        position: "top",
        labels: {
          font: {
            family: "'Poppins', sans-serif",
            size: 12,
          },
          color: theme === "light" ? "#1e293b" : "#e2e8f0",
        },
      },
      title: {
        display: true,
        text: "Task Status Distribution",
        font: {
          family: "'Poppins', sans-serif",
          size: 16,
        },
        color: theme === "light" ? "#1e293b" : "#e2e8f0",
      },
    },
  };

  const completedPercentage = paymentSummary.total ? (paymentSummary.completed / paymentSummary.total) * 100 : 0;
  const pendingPercentage = paymentSummary.total ? (paymentSummary.pending / paymentSummary.total) * 100 : 0;

  if (isLoading) {
    return (
      <div className={`td-page ${theme}`} id="td-root">
        <div className="td-sidebar">
          <TechnicianLayout firstName={firstName} handleLogout={handleSignOut} />
        </div>
        <main className="td-main">
          <div className="td-loading">
            <div className="td-spinner"></div>
            <p>Loading tasks...</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className={`td-page ${theme}`} id="td-root">
      <div className="td-sidebar">
        <TechnicianLayout firstName={firstName} handleLogout={handleSignOut} />
      </div>
      <main className="td-main">
        <header className="td-header">
          <div className="td-header-left">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Technician Dashboard
            </h1>
            <p className="text-gray-600 italic">Welcome, {firstName}! Manage your tasks, payments, and activities.</p>
          </div>
          <button
            className="td-theme-toggle"
            onClick={toggleTheme}
            title={theme === "light" ? "Switch to Dark Mode" : "Switch to Light Mode"}
          >
            {theme === "light" ? "🌙" : "☀️"}
          </button>
        </header>

        {error && (
          <div className="td-error-banner">
            <span>{error}</span>
            <button onClick={handleRefresh} className="bg-gradient-to-r from-red-600 to-red-800 text-white">
              Retry
            </button>
          </div>
        )}

        <section className="td-stats-container">
          <div className="td-card-header">
            <h3 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Task Statistics
            </h3>
            <span className="text-gray-600">Total Tasks: {tasks.length}</span>
          </div>
          <div className="td-stats-grid">
            <div className="td-stat-card blue">
              <span className="td-stat-icon">📋</span>
              <div className="td-stat-content">
                <h3>Total Tasks</h3>
                <span className="td-stat-number">{tasks.length}</span>
              </div>
            </div>
            <div className="td-stat-card green">
              <span className="td-stat-icon">✅</span>
              <div className="td-stat-content">
                <h3>Completed Tasks</h3>
                <span className="td-stat-number">{statusCounts.completed}</span>
              </div>
            </div>
            <div className="td-stat-card purple">
              <span className="td-stat-icon">⏳</span>
              <div className="td-stat-content">
                <h3>Pending Tasks</h3>
                <span className="td-stat-number">{statusCounts.notyet}</span>
              </div>
            </div>
          </div>
          <div className="td-chart-container">
            <Bar data={chartData} options={chartOptions} />
          </div>
        </section>

        <section className="td-payments-container">
          <div className="td-card-header">
            <h3 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Payment Summary
            </h3>
            <span className="text-gray-600">Total Payments: LKR {formatCurrency(paymentSummary.total)}</span>
          </div>
          <div className="td-payments-grid">
            <div className="td-payment-card total">
              <span className="td-payment-icon">💰</span>
              <div className="td-payment-content">
                <h3>Total Payments</h3>
                <span className="td-payment-amount">LKR {formatCurrency(paymentSummary.total)}</span>
                <div className="td-progress-bar">
                  <div className="td-progress-fill blue" style={{ width: "100%" }}></div>
                </div>
              </div>
            </div>
            <div className="td-payment-card completed">
              <span className="td-payment-icon">✅</span>
              <div className="td-payment-content">
                <h3>Completed Payments</h3>
                <span className="td-payment-amount">LKR {formatCurrency(paymentSummary.completed)}</span>
                <div className="td-progress-bar">
                  <div className="td-progress-fill green" style={{ width: `${completedPercentage}%` }}></div>
                </div>
              </div>
            </div>
            <div className="td-payment-card pending">
              <span className="td-payment-icon">⏳</span>
              <div className="td-payment-content">
                <h3>Pending Payments</h3>
                <span className="td-payment-amount">LKR {formatCurrency(paymentSummary.pending)}</span>
                <div className="td-progress-bar">
                  <div className="td-progress-fill orange" style={{ width: `${pendingPercentage}%` }}></div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="td-activities-container">
          <div className="td-card-header">
            <h3 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Recent Activities
            </h3>
            <span className="text-gray-600">Total: {activities.length}</span>
          </div>
          <div className="td-activities-timeline">
            {activities.length === 0 ? (
              <div className="td-no-data">No recent activities.</div>
            ) : (
              activities.map((activity, index) => (
                <div key={activity.id} className="td-timeline-item">
                  <div className="td-timeline-icon">
                    <span className={activity.type === "completed" ? "td-icon-completed" : "td-icon-assigned"}>
                      {activity.type === "completed" ? "✅" : "📌"}
                    </span>
                  </div>
                  <div className="td-timeline-content">
                    <p className="td-timeline-action">{activity.action}</p>
                    <p className="td-timeline-timestamp">{formatDate(activity.timestamp)}</p>
                  </div>
                </div>
              ))
            )}
          </div>
          <button
            className="td-cta-button secondary mt-4"
            onClick={() => alert("View all activities functionality not implemented.")}
          >
            View All Activities
          </button>
        </section>

        <section className="td-tasks-container">
          <div className="td-card-header">
            <h3 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Assigned Tasks
            </h3>
            <span className="text-gray-600">Total: {filteredTasks.length}</span>
          </div>
          <div className="td-search-filter-container">
            <div className="td-search-box">
              <input
                type="text"
                className="td-search-input"
                placeholder="Search by Task ID, User ID, Customer, or Amount..."
                value={searchTerm}
                onChange={handleSearch}
              />
            </div>
            <div className="td-filter-container">
              <div className="td-filter-buttons">
                <button
                  className={`td-filter-button ${filterStatus === "all" ? "active" : ""}`}
                  onClick={() => handleFilterStatus("all")}
                >
                  All
                </button>
                <button
                  className={`td-filter-button ${filterStatus === "notyet" ? "active" : ""}`}
                  onClick={() => handleFilterStatus("notyet")}
                >
                  Not Yet
                </button>
                <button
                  className={`td-filter-button ${filterStatus === "completed" ? "active" : ""}`}
                  onClick={() => handleFilterStatus("completed")}
                >
                  Completed
                </button>
              </div>
              <select className="td-filter-select" value={`${sortBy}:${sortOrder}`} onChange={handleSort}>
                <option value="paymentDate:desc">Date (Newest First)</option>
                <option value="paymentDate:asc">Date (Oldest First)</option>
                <option value="amount:desc">Amount (High to Low)</option>
                <option value="amount:asc">Amount (Low to High)</option>
                <option value="paymentId:asc">Task ID (A-Z)</option>
                <option value="paymentId:desc">Task ID (Z-A)</option>
              </select>
              <button className="td-cta-button primary" onClick={handleDownloadAll}>
                Download All Tasks ({filteredTasks.length})
              </button>
            </div>
          </div>
          <div className="td-tasks-list">
            {filteredTasks.length === 0 ? (
              <div className="td-no-data">No tasks found matching your criteria.</div>
            ) : (
              filteredTasks.map((task) => (
                <div key={task.paymentId} className={`td-task-card ${task.statusofmy}`}>
                  <div className="td-task-header">
                    <h4>Task {task.paymentId || "N/A"}</h4>
                    <span className={`td-status-badge ${task.statusofmy}`}>
                      {task.statusofmy === "notyet" ? "Not Yet" : "Completed"}
                    </span>
                  </div>
                  <div className="td-task-details">
                    <div className="td-progress-circle-container">
                      <svg className={`td-progress-circle ${task.statusofmy}`} viewBox="0 0 100 100">
                        <circle className="td-progress-bg" cx="50" cy="50" r="45" />
                        <circle
                          className="td-progress-fill"
                          cx="50"
                          cy="50"
                          r="45"
                          strokeDasharray={`${task.statusofmy === "completed" ? 283 : 141.5} 283`}
                        />
                        <text className="td-progress-text" x="50" y="50" textAnchor="middle" dy=".3em">
                          {task.statusofmy === "completed" ? "100%" : "50%"}
                        </text>
                      </svg>
                    </div>
                    <div>
                      <p>
                        <strong>Customer:</strong> {task.customer || "Unknown"}
                      </p>
                      <p>
                        <strong>Amount:</strong> LKR {formatCurrency(task.amount || 0)}
                      </p>
                      <p>
                        <strong>Date:</strong> {task.paymentDate ? formatDate(task.paymentDate) : "N/A"}
                      </p>
                      <p>
                        <strong>Status:</strong> {task.status || "N/A"}
                      </p>
                    </div>
                  </div>
                  <div className="td-task-actions">
                    <button
                      className="td-task-button"
                      onClick={() => alert(`Viewing details for Task ${task.paymentId}`)}
                    >
                      View Details
                    </button>
                    <button className="td-task-button download" onClick={() => handleDownloadSingle(task)}>
                      Download Report
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        <section className="td-actions-container">
          <div className="td-card-header">
            <h3 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Quick Actions
            </h3>
          </div>
          <div className="td-actions-list">
            <button
              className="td-action-button primary"
              onClick={() => alert("Create new task functionality not implemented.")}
            >
              Create New Task
            </button>
            <button className="td-action-button secondary" onClick={handleRefresh}>
              Refresh Data
            </button>
            <button className="td-action-button tertiary" onClick={() => generatePDF(tasks, "Approved Payments Report")}>
              Export All Payments
            </button>
          </div>
        </section>
      </main>
    </div>
  );
};

export default TechnicianDashboard;