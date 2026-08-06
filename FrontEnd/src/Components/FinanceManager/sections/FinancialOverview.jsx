import React, { useEffect, useState } from "react";
import axios from "axios";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { FiRefreshCw, FiEdit, FiTrash2 } from "react-icons/fi";
import "./FinancialOverview.css";

// Static company info
const companyInfo = {
  name: "SelfMe",
  address: ["123 Business St", "City, Country"],
  phone: "+1234567890",
  email: "info@company.com",
  website: "www.company.com",
};

// Convert logo to base64
const getLogoAsBase64 = () => {
  return new Promise((resolve, reject) => {
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

const FinancialOverview = () => {
  const [incomes, setIncomes] = useState([]);
  const [filteredIncomes, setFilteredIncomes] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [salaries, setSalaries] = useState([]);
  const [otherExpenses, setOtherExpenses] = useState([]);
  const [totalIncome, setTotalIncome] = useState(0);
  const [totalProfit, setTotalProfit] = useState(0);
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [selectedMonth, setSelectedMonth] = useState("");
  const [selectedYear, setSelectedYear] = useState("");
  const [selectedTable, setSelectedTable] = useState("income");
  const [newExpense, setNewExpense] = useState({
    type: "",
    amount: "",
    date: "",
    description: "",
    referenceId: "",
  });
  const [editingExpense, setEditingExpense] = useState(null);
  const [error, setError] = useState(null);
  const today = new Date();
  const expenseTypes = ["Utilities", "Rent", "Supplies", "Travel", "Miscellaneous"];

  // Generate year options (current year and past 5 years)
  const currentYear = today.getFullYear();
  const yearOptions = Array.from({ length: 6 }, (_, i) => currentYear - i);

  // Get first and last day of current month for date validation
  const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split("T")[0];
  const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().split("T")[0];

  // Initialize selectedYear and selectedMonth
  useEffect(() => {
    const currentMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;
    setSelectedMonth(currentMonth);
    setSelectedYear(today.getFullYear().toString());
  }, []);

  // Get filtered data based on search query
  const getFilteredIncomes = () => {
    if (!searchQuery.trim()) {
      return filteredIncomes;
    }
    return filteredIncomes.filter(inc =>
      inc.payment_id?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

  const getFilteredExpenses = () => {
    if (!searchQuery.trim()) {
      return otherExpenses;
    }
    return otherExpenses.filter(exp =>
      exp.referenceId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      exp._id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      exp.type?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

  // Function to calculate profit for a single item after tax
  const calculateItemProfit = (item) => {
    const taxAmount = item.selling_price * 0.085;
    const profitBeforeTax = item.selling_price - item.purchase_price;
    return profitBeforeTax - taxAmount;
  };

  // Function to calculate tax amount for a single item
  const calculateTaxAmount = (item) => {
    return item.selling_price * 0.085;
  };

  // Function to calculate total purchase price for a payment
  const calculatePurchasePrice = (payment) => {
    return payment.itemId ? payment.itemId.reduce((sum, item) => sum + item.purchase_price, 0) : 0;
  };

  // Function to calculate total salaries for a given month
  const calculateTotalSalaries = (salaries) => {
    return salaries.reduce((sum, emp) => {
      const basic = emp.isManager ? 20000 : 10000;
      const perDayManpower = 3000;
      const manpowerAllowance = perDayManpower * (emp.workingDays || 0);
      return sum + basic + manpowerAllowance + (emp.otherAllowance || 0);
    }, 0);
  };

  // Function to calculate total other expenses
  const calculateTotalOtherExpenses = (expenses) => {
    return expenses.reduce((sum, exp) => sum + (exp.amount || 0), 0);
  };

  // Calculate net income
  const calculateNetIncome = () => {
    return totalIncome - totalExpenses;
  };

  // Fetch incomes, salaries, and other expenses
  useEffect(() => {
    const fetchIncomes = async () => {
      try {
        const token = localStorage.getItem("token");
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        const res = await axios.get("http://localhost:5000/api/finance/payments", { headers });
        const paidPayments = res.data.filter((p) => p.status === "Paid");
        console.log("Fetched Incomes:", paidPayments);
        setIncomes(paidPayments);
        setFilteredIncomes(paidPayments);
        setTotalIncome(paidPayments.reduce((acc, p) => acc + p.amount, 0));
        setTotalProfit(
          paidPayments.reduce((acc, p) =>
            acc + (p.itemId ? p.itemId.reduce((sum, item) => sum + calculateItemProfit(item), 0) : 0), 0)
        );
        setTotalExpenses(
          paidPayments.reduce((acc, p) => acc + calculatePurchasePrice(p), 0) +
          calculateTotalSalaries(salaries) +
          calculateTotalOtherExpenses(otherExpenses)
        );
      } catch (err) {
        console.error("Error fetching incomes:", err.message);
        setError("Error fetching incomes.");
      }
    };

    const fetchSalaries = async () => {
      try {
        const month = selectedMonth ? new Date(`${selectedMonth}-01`).toLocaleString("default", { month: "long", year: "numeric" }) : "October 2025";
        const response = await axios.get(`http://localhost:5000/api/finance/salary?month=${month}`);
        console.log("Fetched Salaries:", response.data);
        setSalaries(response.data);
      } catch (err) {
        console.error("Error fetching salaries:", err.message);
        setError("Error fetching salaries.");
      }
    };

    const fetchOtherExpenses = async () => {
      try {
        const month = selectedMonth ? new Date(`${selectedMonth}-01`).toLocaleString("default", { month: "long", year: "numeric" }) : "October 2025";
        const response = await axios.get(`http://localhost:5000/api/finance/expenses?month=${month}`);
        console.log("Fetched Other Expenses:", response.data);
        setOtherExpenses(response.data);
      } catch (err) {
        console.error("Error fetching other expenses:", err.message);
        setError("Error fetching other expenses.");
      }
    };

    fetchIncomes();
    fetchSalaries();
    fetchOtherExpenses();
  }, [selectedMonth]);

  // Handle form input changes
  const handleExpenseInputChange = (e) => {
    const { name, value } = e.target;
    if (name === "amount") {
      if (value === "" || (/^\d*\.?\d*$/.test(value) && parseFloat(value) >= 0)) {
        if (editingExpense) {
          setEditingExpense({ ...editingExpense, [name]: value });
        } else {
          setNewExpense({ ...newExpense, [name]: value });
        }
      }
    } else {
      if (editingExpense) {
        setEditingExpense({ ...editingExpense, [name]: value });
      } else {
        setNewExpense({ ...newExpense, [name]: value });
      }
    }
  };

  // Submit new expense
  const handleAddExpense = async (e) => {
    e.preventDefault();
    if (!newExpense.type) {
      alert("Please select an expense type.");
      return;
    }
    if (!newExpense.amount || parseFloat(newExpense.amount) <= 0) {
      alert("Please enter a positive amount.");
      return;
    }
    if (!newExpense.date) {
      alert("Please select a date.");
      return;
    }
    if (new Date(newExpense.date) < new Date(firstDayOfMonth) || new Date(newExpense.date) > new Date(lastDayOfMonth)) {
      alert("Date must be within the current month and not in the future.");
      return;
    }
    try {
      const token = localStorage.getItem("token");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const month = new Date(newExpense.date).toLocaleString("default", { month: "long", year: "numeric" });
      const response = await axios.post("http://localhost:5000/api/finance/expenses", { ...newExpense, month }, { headers });
      const newExpenseData = response.data;

      let shouldAddToTable = true;
      if (fromDate && toDate) {
        const expenseDate = new Date(newExpenseData.date);
        shouldAddToTable = expenseDate >= new Date(fromDate) && expenseDate <= new Date(toDate);
      }
      if (selectedMonth) {
        const [year, monthNum] = selectedMonth.split("-");
        const expenseDate = new Date(newExpenseData.date);
        shouldAddToTable = shouldAddToTable && expenseDate.getFullYear() === parseInt(year) && expenseDate.getMonth() === parseInt(monthNum) - 1;
      }

      if (shouldAddToTable) {
        setOtherExpenses((prev) => [...prev, newExpenseData]);
      }

      setNewExpense({ type: "", amount: "", date: "", description: "", referenceId: "" });

      setTotalExpenses(
        filteredIncomes.reduce((acc, p) => acc + calculatePurchasePrice(p), 0) +
        calculateTotalSalaries(salaries) +
        calculateTotalOtherExpenses(shouldAddToTable ? [...otherExpenses, newExpenseData] : otherExpenses)
      );
      setError(null);
    } catch (err) {
      console.error("Error adding expense:", err.message);
      setError("Error adding expense. Please try again.");
    }
  };

  // Update expense
  const handleUpdateExpense = async (e) => {
    e.preventDefault();
    if (!editingExpense.type) {
      alert("Please select an expense type.");
      return;
    }
    if (!editingExpense.amount || parseFloat(editingExpense.amount) <= 0) {
      alert("Please enter a positive amount.");
      return;
    }
    if (!editingExpense.date) {
      alert("Please select a date.");
      return;
    }
    if (new Date(editingExpense.date) < new Date(firstDayOfMonth) || new Date(editingExpense.date) > new Date(lastDayOfMonth)) {
      alert("Date must be within the current month and not in the future.");
      return;
    }
    try {
      const token = localStorage.getItem("token");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const month = new Date(editingExpense.date).toLocaleString("default", { month: "long", year: "numeric" });
      const response = await axios.put(
        `http://localhost:5000/api/finance/expenses/${editingExpense._id}`,
        { ...editingExpense, month },
        { headers }
      );
      const updatedExpenseData = response.data;

      let shouldIncludeInTable = true;
      if (fromDate && toDate) {
        const expenseDate = new Date(updatedExpenseData.date);
        shouldIncludeInTable = expenseDate >= new Date(fromDate) && expenseDate <= new Date(toDate);
      }
      if (selectedMonth) {
        const [year, monthNum] = selectedMonth.split("-");
        const expenseDate = new Date(updatedExpenseData.date);
        shouldIncludeInTable = shouldIncludeInTable && expenseDate.getFullYear() === parseInt(year) && expenseDate.getMonth() === parseInt(monthNum) - 1;
      }

      if (shouldIncludeInTable) {
        setOtherExpenses((prev) =>
          prev.map((exp) => (exp._id === updatedExpenseData._id ? updatedExpenseData : exp))
        );
      } else {
        setOtherExpenses((prev) => prev.filter((exp) => exp._id !== updatedExpenseData._id));
      }

      setTotalExpenses(
        filteredIncomes.reduce((acc, p) => acc + calculatePurchasePrice(p), 0) +
        calculateTotalSalaries(salaries) +
        calculateTotalOtherExpenses(
          shouldIncludeInTable
            ? otherExpenses.map((exp) => (exp._id === updatedExpenseData._id ? updatedExpenseData : exp))
            : otherExpenses.filter((exp) => exp._id !== updatedExpenseData._id)
        )
      );

      setEditingExpense(null);
      setError(null);
    } catch (err) {
      console.error("Error updating expense:", err.message);
      setError("Error updating expense. Please try again.");
    }
  };

  // Delete expense
  const handleDeleteExpense = async (id) => {
    if (!window.confirm("Are you sure you want to delete this expense?")) {
      return;
    }
    try {
      const token = localStorage.getItem("token");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      await axios.delete(`http://localhost:5000/api/finance/expenses/${id}`, { headers });
      setOtherExpenses((prev) => prev.filter((exp) => exp._id !== id));
      setTotalExpenses(
        filteredIncomes.reduce((acc, p) => acc + calculatePurchasePrice(p), 0) +
        calculateTotalSalaries(salaries) +
        calculateTotalOtherExpenses(otherExpenses.filter((exp) => exp._id !== id))
      );
      setError(null);
    } catch (err) {
      console.error("Error deleting expense:", err.message);
      setError("Error deleting expense. Please try again.");
    }
  };

  // Start editing expense
  const startEditing = (expense) => {
    setEditingExpense({ ...expense, date: new Date(expense.date).toISOString().split("T")[0] });
  };

  // Cancel editing
  const cancelEditing = () => {
    setEditingExpense(null);
  };

  // Handle search changes
  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  // Clear search
  const clearSearch = () => {
    setSearchQuery("");
  };

  // Reset filter
  const resetFilter = () => {
    setFilteredIncomes(incomes);
    setSearchQuery("");
    setTotalIncome(incomes.reduce((acc, p) => acc + p.amount, 0));
    setTotalProfit(
      incomes.reduce((acc, p) =>
        acc + (p.itemId ? p.itemId.reduce((sum, item) => sum + calculateItemProfit(item), 0) : 0), 0)
    );
    setTotalExpenses(
      incomes.reduce((acc, p) => acc + calculatePurchasePrice(p), 0) +
      calculateTotalSalaries(salaries) +
      calculateTotalOtherExpenses(otherExpenses)
    );
    setFromDate("");
    setToDate("");
    setSelectedMonth(`${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`);
    setSelectedYear(today.getFullYear().toString());
  };

  // Date range filter with validation
  const handleFilterByDate = () => {
    if (!fromDate || !toDate) {
      alert("Please select both from and to dates.");
      return;
    }
    if (new Date(fromDate) > new Date(toDate)) {
      alert("From date cannot be later than To date.");
      return;
    }
    if (new Date(toDate) > today) {
      alert("To date cannot be in the future.");
      return;
    }
    const filtered = incomes.filter((p) => {
      const d = new Date(p.payment_date);
      return d >= new Date(fromDate) && d <= new Date(toDate);
    });
    const filteredExpenses = otherExpenses.filter((exp) => {
      const d = new Date(exp.date);
      return d >= new Date(fromDate) && d <= new Date(toDate);
    });
    if (filtered.length === 0 && filteredExpenses.length === 0 && salaries.length === 0) {
      alert("No records found for the selected date range.");
    }
    setFilteredIncomes(filtered);
    setTotalIncome(filtered.reduce((acc, p) => acc + p.amount, 0));
    setTotalProfit(
      filtered.reduce((acc, p) =>
        acc + (p.itemId ? p.itemId.reduce((sum, item) => sum + calculateItemProfit(item), 0) : 0), 0)
    );
    setTotalExpenses(
      filtered.reduce((acc, p) => acc + calculatePurchasePrice(p), 0) +
      calculateTotalSalaries(salaries) +
      calculateTotalOtherExpenses(filteredExpenses)
    );
    setOtherExpenses(filteredExpenses);
  };

  // Calculate salary for an employee
  const calculateSalary = (emp) => {
    const basic = emp.isManager ? 20000 : 10000;
    const perDayManpower = 3000;
    const manpowerAllowance = perDayManpower * (emp.workingDays || 0);
    return { total: basic + manpowerAllowance + (emp.otherAllowance || 0) };
  };

  // UPDATED Download report function with new PDF style
  const downloadReport = async (type) => {
    try {
      // Validate inputs
      if (!incomes.length && !salaries.length && !otherExpenses.length) {
        setError("No records available to download.");
        console.warn("⚠️ No data available for report");
        alert("No records to download!");
        return;
      }
      if (type === "Monthly" && (!selectedMonth || !/^\d{4}-\d{2}$/.test(selectedMonth))) {
        setError("Please select a valid month for the report.");
        console.warn("⚠️ Invalid or no month selected for Monthly report:", selectedMonth);
        alert("Please select a valid month for the report.");
        return;
      }
      if (type === "Yearly" && (!selectedYear || isNaN(selectedYear) || selectedYear < 2000 || selectedYear > currentYear)) {
        setError("Please select a valid year (2000-2025) for the report.");
        console.warn("⚠️ Invalid or no year selected for Yearly report:", selectedYear);
        alert("Please select a valid year (2000-2025) for the report.");
        return;
      }
      
      const logoBase64 = await getLogoAsBase64();
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();

      // UPDATED LETTERHEAD to match payment report style
      const addLetterhead = () => {
        // Logo on the left
        if (logoBase64) {
          doc.addImage(logoBase64, "PNG", 15, 15, 30, 30);
        }
        
        // Company name centered and bold
        doc.setFont("times", "bold");
        doc.setFontSize(20);
        doc.setTextColor(0, 0, 0);
        doc.text("Your Company", pageWidth / 2, 25, { align: "center" });
        
        // Address below company name
        doc.setFont("times", "normal");
        doc.setFontSize(11);
        doc.text(companyInfo.address.join(", "), pageWidth / 2, 32, { align: "center" });
        
        // Contact info on one line
        doc.setFontSize(10);
        doc.text(
          `Phone: ${companyInfo.phone} | Email: ${companyInfo.email} | Website: ${companyInfo.website}`,
          pageWidth / 2,
          38,
          { align: "center" }
        );
        
        // Black line separator
        doc.setLineWidth(0.5);
        doc.setDrawColor(0, 0, 0);
        doc.line(15, 45, pageWidth - 15, 45);
      };

      // Footer function
      const addFooter = (pageNum, totalPages, lastRecordIdx) => {
        doc.setFont("times", "normal");
        doc.setFontSize(8);
        doc.setTextColor(50, 50, 50);
        doc.setLineWidth(0.3);
        doc.setDrawColor(150, 150, 150);
        doc.line(15, pageHeight - 20, pageWidth - 15, pageHeight - 20);
        const footerText = `Generated by ${companyInfo.name} Financial Management System`;
        doc.text(footerText, pageWidth / 2, pageHeight - 15, { align: "center" });
        const recordText = lastRecordIdx >= 0 ? `Record #${String(lastRecordIdx + 1).padStart(3, "0")}` : "";
        doc.text(`Page ${pageNum} of ${totalPages} | ${recordText}`, pageWidth - 15, pageHeight - 10, { align: "right" });
        const genDate = new Date().toLocaleDateString("en-GB");
        const genTime = new Date().toLocaleTimeString("en-GB", { hour12: false });
        doc.text(`Generated on ${genDate} at ${genTime}`, 15, pageHeight - 10);
      };

      // Signature field function
      const addSignatureField = () => {
        doc.setFont("times", "normal");
        doc.setFontSize(10);
        doc.setTextColor(0, 0, 0);
        doc.text("Authorized Signature: __________________", pageWidth - 85, pageHeight - 30);
      };

      // Prepare data based on selected table - using ALL data, not filtered data
      let data = [];
      let reportTitle = "";
      let columns = [];
      let reportIncomes = incomes;
      let reportExpenses = otherExpenses;
      let reportSalaries = salaries;

      // Filter data based on report type
      if (type === "Monthly") {
        const [year, month] = selectedMonth.split("-");
        reportIncomes = incomes.filter((inc) => {
          const date = new Date(inc.payment_date);
          return date.getFullYear() === parseInt(year) && date.getMonth() === parseInt(month) - 1;
        });
        reportExpenses = otherExpenses.filter((exp) => {
          const date = new Date(exp.date);
          return date.getFullYear() === parseInt(year) && date.getMonth() === parseInt(month) - 1;
        });
        reportSalaries = salaries.filter((sal) => {
          const date = new Date(sal.date || sal.createdAt || today);
          return date.getFullYear() === parseInt(year) && date.getMonth() === parseInt(month) - 1;
        });
      } else if (type === "Yearly") {
        reportIncomes = incomes.filter((inc) => {
          const date = new Date(inc.payment_date);
          return date.getFullYear() === parseInt(selectedYear);
        });
        reportExpenses = otherExpenses.filter((exp) => {
          const date = new Date(exp.date);
          return date.getFullYear() === parseInt(selectedYear);
        });
        reportSalaries = salaries.filter((sal) => {
          const date = new Date(sal.date || sal.createdAt || today);
          return date.getFullYear() === parseInt(selectedYear);
        });
      }

      // Prepare data based on selected table
      if (selectedTable === "income") {
        reportTitle = `Income Report - ${type === "Monthly" ? new Date(selectedMonth + "-01").toLocaleString("default", { month: "long", year: "numeric" }) : selectedYear}`;
        columns = [
          { header: "Payment ID", dataKey: "payment_id" },
          { header: "Date", dataKey: "date" },
          { header: "Amount", dataKey: "amount" },
        ];
        data = reportIncomes.map((inc, idx) => ({
          payment_id: inc.payment_id || "N/A",
          date: inc.payment_date ? new Date(inc.payment_date).toLocaleDateString("en-GB") : "N/A",
          amount: `Rs. ${typeof inc.amount === "number" ? inc.amount.toLocaleString() : "0"}`,
          index: idx,
        }));
      } else if (selectedTable === "profit") {
        reportTitle = `Profit Analysis Report - ${type === "Monthly" ? new Date(selectedMonth + "-01").toLocaleString("default", { month: "long", year: "numeric" }) : selectedYear}`;
        columns = [
          { header: "Payment ID", dataKey: "payment_id" },
          { header: "Item ID", dataKey: "item_id" },
          { header: "Selling Price", dataKey: "selling_price" },
          { header: "Purchase Price", dataKey: "purchase_price" },
          { header: "Tax Amount", dataKey: "tax_amount" },
          { header: "Profit", dataKey: "profit" },
        ];
        data = reportIncomes.flatMap((inc, idx) =>
          inc.itemId && inc.itemId.length > 0
            ? inc.itemId.map((item, itemIdx) => ({
                payment_id: itemIdx === 0 ? inc.payment_id || "N/A" : "",
                item_id: item.serial_number || "N/A",
                selling_price: `Rs. ${typeof item.selling_price === "number" ? item.selling_price.toLocaleString() : "0"}`,
                purchase_price: `Rs. ${typeof item.purchase_price === "number" ? item.purchase_price.toLocaleString() : "0"}`,
                tax_amount: `Rs. ${calculateTaxAmount(item).toLocaleString()}`,
                profit: `Rs. ${calculateItemProfit(item).toLocaleString()}`,
                index: idx,
              }))
            : [{
                payment_id: inc.payment_id || "N/A",
                item_id: "N/A",
                selling_price: "N/A",
                purchase_price: "N/A",
                tax_amount: "Rs. 0",
                profit: "Rs. 0",
                index: idx,
              }]
        );
      } else if (selectedTable === "expenses") {
        reportTitle = `Expenses Report - ${type === "Monthly" ? new Date(selectedMonth + "-01").toLocaleString("default", { month: "long", year: "numeric" }) : selectedYear}`;
        columns = [
          { header: "Record ID", dataKey: "record_id" },
          { header: "Date", dataKey: "date_role" },
          { header: "Amount", dataKey: "amount" },
          { header: "Type", dataKey: "type" },
        ];
        data = [
          ...reportIncomes.map((inc, idx) => ({
            record_id: inc.payment_id || "N/A",
            date_role: inc.payment_date ? new Date(inc.payment_date).toLocaleDateString("en-GB") : "N/A",
            amount: `Rs. ${calculatePurchasePrice(inc).toLocaleString()}`,
            type: "Purchase",
            index: idx,
          })),
          ...reportSalaries.map((emp, idx) => {
            let salaryDate;
            if (type === "Monthly" && selectedMonth) {
              const [year, month] = selectedMonth.split("-");
              salaryDate = new Date(parseInt(year), parseInt(month) - 1, 10).toLocaleDateString("en-GB");
            } else if (type === "Yearly" && selectedYear) {
              salaryDate = new Date(parseInt(selectedYear), 0, 10).toLocaleDateString("en-GB");
            } else {
              salaryDate = "N/A";
            }
            return {
              record_id: emp.empId || "N/A",
              date_role: salaryDate,
              amount: `Rs. ${calculateSalary(emp).total.toLocaleString()}`,
              type: "Salary",
              index: idx + reportIncomes.length,
            };
          }),
          ...reportExpenses.map((exp, idx) => ({
            record_id: exp.referenceId || exp._id || "N/A",
            date_role: exp.date ? new Date(exp.date).toLocaleDateString("en-GB") : "N/A",
            amount: `Rs. ${typeof exp.amount === "number" ? exp.amount.toLocaleString() : "0"}`,
            type: exp.type || "N/A",
            index: idx + reportIncomes.length + reportSalaries.length,
          })),
        ];
      } else if (selectedTable === "netIncome") {
        reportTitle = `Net Income Report - ${type === "Monthly" ? new Date(selectedMonth + "-01").toLocaleString("default", { month: "long", year: "numeric" }) : selectedYear}`;
        columns = [
          { header: "Total Income", dataKey: "total_income" },
          { header: "Total Expenses", dataKey: "total_expenses" },
          { header: "Net Income", dataKey: "net_income" },
        ];
        const reportTotalIncome = reportIncomes.reduce((acc, p) => acc + p.amount, 0);
        const reportTotalExpenses = reportIncomes.reduce((acc, p) => acc + calculatePurchasePrice(p), 0) + calculateTotalSalaries(reportSalaries) + calculateTotalOtherExpenses(reportExpenses);
        data = [{
          total_income: `Rs. ${reportTotalIncome.toLocaleString()}`,
          total_expenses: `Rs. ${reportTotalExpenses.toLocaleString()}`,
          net_income: `Rs. ${(reportTotalIncome - reportTotalExpenses).toLocaleString()}`,
          index: 0,
        }];
      }

      // Check if no data found
      if (data.length === 0) {
        addLetterhead();
        doc.setFont("times", "bold");
        doc.setFontSize(16);
        doc.text(reportTitle, pageWidth / 2, 55, { align: "center" });
        doc.setFont("times", "normal");
        doc.setFontSize(12);
        doc.text("No records found for the selected criteria.", pageWidth / 2, 70, { align: "center" });
        addSignatureField();
        addFooter(1, 1, -1);
        const fileName = `${reportTitle.replace(/\s+/g, "_")}_${type}_${new Date().toISOString().split("T")[0]}.pdf`;
        doc.save(fileName);
        alert(`Official report "${fileName}" downloaded successfully (no data found)!`);
        return;
      }

      // Calculate pagination
      const tableRowHeight = 10;
      const rowsPerPage = Math.floor((pageHeight - 90) / tableRowHeight);
      const totalPages = Math.ceil(data.length / rowsPerPage);

      // Add letterhead
      addLetterhead();

      // UPDATED TITLE STYLE to match payment report
      doc.setFont("times", "bold");
      doc.setFontSize(16);
      doc.setTextColor(0, 0, 0);
      doc.text(reportTitle, pageWidth / 2, 55, { align: "center" });

      let currentPage = 1;
      for (let i = 0; i < data.length; i += rowsPerPage) {
        if (i > 0) {
          addSignatureField();
          addFooter(currentPage, totalPages, i - 1);
          doc.addPage();
          currentPage++;
          addLetterhead();
          doc.setFont("times", "bold");
          doc.setFontSize(16);
          doc.text(reportTitle, pageWidth / 2, 55, { align: "center" });
        }

        const pageData = data.slice(i, i + rowsPerPage);
        const bodyData = pageData.map(item => columns.map(col => item[col.dataKey]));

        // UPDATED TABLE STYLE with professional blue header for financial reports
        autoTable(doc, {
          startY: 62,
          head: [columns.map(col => col.header)],
          body: bodyData,
          theme: "striped",
          headStyles: {
            fillColor: [41, 128, 185],
            textColor: [255, 255, 255],
            fontStyle: "bold",
            fontSize: 11,
            halign: "left",
          },
          bodyStyles: {
            textColor: [0, 0, 0],
            fontSize: 10,
          },
          alternateRowStyles: {
            fillColor: [245, 245, 245],
          },
          styles: {
            font: "times",
            fontSize: 10,
            cellPadding: 4,
            lineColor: [200, 200, 200],
            lineWidth: 0.1,
          },
          columnStyles: 
            selectedTable === "income" ? {
              0: { cellWidth: 60 },
              1: { cellWidth: 50 },
              2: { cellWidth: 60, halign: "left" },
            } :
            selectedTable === "profit" ? {
              0: { cellWidth: 30 },
              1: { cellWidth: 30 },
              2: { cellWidth: 30 },
              3: { cellWidth: 30 },
              4: { cellWidth: 30 },
              5: { cellWidth: 30 },
            } :
            selectedTable === "expenses" ? {
              0: { cellWidth: 40 },
              1: { cellWidth: 40 },
              2: { cellWidth: 50, halign: "left" },
              3: { cellWidth: 40 },
            } :
            selectedTable === "netIncome" ? {
              0: { cellWidth: 60, halign: "left" },
              1: { cellWidth: 60, halign: "left" },
              2: { cellWidth: 60, halign: "left" },
            } : {}
        });
      }

      // Add signature field and footer to last page
      addSignatureField();
      addFooter(currentPage, totalPages, data.length - 1);

      // Save the PDF
      const fileName = `${reportTitle.replace(/\s+/g, "_")}_${type}_${new Date().toISOString().split("T")[0]}.pdf`;
      doc.save(fileName);
      setError(null);
      alert(`Official report "${fileName}" downloaded successfully!`);
      console.log("✅ Report generated successfully:", fileName);
    } catch (err) {
      console.error("❌ Report generation error:", err.message);
      setError("Failed to generate report. Please check the console for details.");
      alert("Error generating PDF. Please try again.");
    }
  };

  // Monthly report with validation
  const downloadMonthlyReport = () => {
    console.log("Downloading Monthly Report for:", selectedMonth);
    if (!selectedMonth) {
      alert("Please select a month.");
      return;
    }
    downloadReport("Monthly");
  };

  // Yearly report with validation
  const downloadYearlyReport = () => {
    console.log("Downloading Yearly Report for:", selectedYear);
    if (!selectedYear) {
      alert("Please select a year.");
      return;
    }
    downloadReport("Yearly");
  };

  const displayIncomes = getFilteredIncomes();
  const displayExpenses = getFilteredExpenses();

  return (
    <div id="financial-overview-content-section">
      <h1 id="financial-overview-page-title">Financial Overview</h1>
      
      {/* Date Range Filter */}
      <div id="financial-overview-date-filter-container">
        <label className="financial-overview-date-label">From:</label>
        <input
          id="financial-overview-from-date"
          type="date"
          className="financial-overview-date-input"
          value={fromDate}
          onChange={(e) => setFromDate(e.target.value)}
          max={today.toISOString().split("T")[0]}
        />
        <label className="financial-overview-date-label">To:</label>
        <input
          id="financial-overview-to-date"
          type="date"
          className="financial-overview-date-input"
          value={toDate}
          onChange={(e) => setToDate(e.target.value)}
          min={fromDate || ""}
          max={today.toISOString().split("T")[0]}
        />
        <button
          id="financial-overview-filter-btn"
          onClick={handleFilterByDate}
        >
          Filter
        </button>
        <button
          id="financial-overview-reset-btn"
          onClick={resetFilter}
          title="Reset Filters"
        >
          <FiRefreshCw size={20} />
        </button>
      </div>

      {/* Search Bar Section */}
      <div id="financial-overview-search-section">
        <div id="financial-overview-search-container">
          <input
            id="financial-overview-search-input"
            type="text"
            placeholder="Search by Payment ID or Expense ID..."
            value={searchQuery}
            onChange={handleSearchChange}
            className="financial-overview-search-input"
          />
          {searchQuery && (
            <button
              id="financial-overview-search-clear-btn"
              onClick={clearSearch}
              className="financial-overview-search-clear-btn"
            >
              ✕
            </button>
          )}
        </div>
        {searchQuery && (
          <div id="financial-overview-search-results-info">
            <p>{displayIncomes.length === 0 && displayExpenses.length === 0 ? `No records found matching "${searchQuery}"` : `Found ${displayIncomes.length + displayExpenses.length} record(s) matching your search`}</p>
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && <div id="financial-overview-error-message">{error}</div>}
      
      {/* Income Section */}
      <h2 className="financial-overview-section-header">Income</h2>
      <div className="financial-overview-table-container">
        <table className="financial-overview-table">
          <thead>
            <tr>
              <th>Payment ID</th>
              <th>Date</th>
              <th>Amount</th>
            </tr>
          </thead>
          <tbody>
            {displayIncomes.length === 0 ? (
              <tr>
                <td colSpan="3" className="financial-overview-no-data">
                  No income records found
                </td>
              </tr>
            ) : (
              displayIncomes.map((inc) => (
                <tr key={inc.payment_id}>
                  <td>{inc.payment_id}</td>
                  <td>{new Date(inc.payment_date).toLocaleDateString()}</td>
                  <td>Rs. {inc.amount.toLocaleString()}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <h3 className="financial-overview-total-header">Total Income: Rs. {totalIncome.toLocaleString()}</h3>

      {/* Profit Analysis Section */}
      <h2 className="financial-overview-section-header">Profit Analysis</h2>
      <div className="financial-overview-table-container">
        <table className="financial-overview-table">
          <thead>
            <tr>
              <th>Payment ID</th>
              <th>Item ID</th>
              <th>Selling Price</th>
              <th>Purchase Price</th>
              <th>Tax Amount</th>
              <th>Profit</th>
            </tr>
          </thead>
          <tbody>
            {displayIncomes.length === 0 ? (
              <tr>
                <td colSpan="6" className="financial-overview-no-data">
                  No profit records found
                </td>
              </tr>
            ) : (
              displayIncomes.map((inc) =>
                inc.itemId && inc.itemId.length > 0 ? (
                  inc.itemId.map((item, index) => (
                    <tr key={`${inc.payment_id}-${index}`}>
                      <td>{index === 0 ? inc.payment_id : ""}</td>
                      <td>{item.serial_number}</td>
                      <td>Rs. {item.selling_price.toLocaleString()}</td>
                      <td>Rs. {item.purchase_price.toLocaleString()}</td>
                      <td>Rs. {calculateTaxAmount(item).toLocaleString()}</td>
                      <td>Rs. {calculateItemProfit(item).toLocaleString()}</td>
                    </tr>
                  ))
                ) : (
                  <tr key={inc.payment_id}>
                    <td>{inc.payment_id}</td>
                    <td>N/A</td>
                    <td>N/A</td>
                    <td>N/A</td>
                    <td>Rs. 0</td>
                    <td>Rs. 0</td>
                  </tr>
                )
              )
            )}
          </tbody>
        </table>
      </div>
      <h3 className="financial-overview-total-header">Total Profit: Rs. {totalProfit.toLocaleString()}</h3>

      {/* Expenses Section */}
      <h2 className="financial-overview-section-header">Expenses</h2>
      <div className="financial-overview-table-container">
        <table className="financial-overview-table">
          <thead>
            <tr>
              <th>Record ID</th>
              <th>Date</th>
              <th>Amount</th>
              <th>Type</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {displayIncomes.length === 0 && salaries.length === 0 && displayExpenses.length === 0 ? (
              <tr>
                <td colSpan="5" className="financial-overview-no-data">
                  No expense records found
                </td>
              </tr>
            ) : (
              <>
                {displayIncomes.map((inc) => (
                  <tr key={`purchase-${inc.payment_id}`}>
                    <td>{inc.payment_id}</td>
                    <td>{new Date(inc.payment_date).toLocaleDateString()}</td>
                    <td>Rs. {calculatePurchasePrice(inc).toLocaleString()}</td>
                    <td>Purchase</td>
                    <td></td>
                  </tr>
                ))}
                {salaries.length > 0 && !searchQuery && salaries.map((emp) => {
                  const salaryDate = selectedMonth
                    ? new Date(selectedMonth.split("-")[0], selectedMonth.split("-")[1] - 1, 10).toLocaleDateString()
                    : "N/A";
                  return (
                    <tr key={`salary-${emp._id}`}>
                      <td>{emp.empId}</td>
                      <td>{salaryDate}</td>
                      <td>Rs. {calculateSalary(emp).total.toLocaleString()}</td>
                      <td>Salary</td>
                      <td></td>
                    </tr>
                  );
                })}
                {displayExpenses.map((exp) => (
                  <tr key={`other-${exp._id}`}>
                    <td>{exp.referenceId || exp._id}</td>
                    <td>{new Date(exp.date).toLocaleDateString()}</td>
                    <td>Rs. {exp.amount.toLocaleString()}</td>
                    <td>{exp.type}</td>
                    <td>
                      <button
                        className="financial-overview-edit-btn"
                        onClick={() => startEditing(exp)}
                        title="Edit Expense"
                      >
                        <FiEdit size={16} color="#007BFF" />
                      </button>
                      <button
                        className="financial-overview-delete-btn"
                        onClick={() => handleDeleteExpense(exp._id)}
                        title="Delete Expense"
                      >
                        <FiTrash2 size={16} color="#FF0000" />
                      </button>
                    </td>
                  </tr>
                ))}
              </>
            )}
          </tbody>
        </table>
      </div>
      <h3 className="financial-overview-total-header">Total Expenses: Rs. {totalExpenses.toLocaleString()}</h3>

      {/* Add/Edit Expense Form */}
      <div id="financial-overview-expense-form-container">
        <h3 id="financial-overview-expense-form-title">
          {editingExpense ? "Edit Expense" : "Add New Expense"}
        </h3>
        <div className="financial-overview-form-fields">
          <div className="financial-overview-form-field">
            <label className="financial-overview-form-label">Type:</label>
            <select
              name="type"
              className="financial-overview-form-select"
              value={editingExpense ? editingExpense.type : newExpense.type}
              onChange={handleExpenseInputChange}
              required
            >
              <option value="" disabled>Select Type</option>
              {expenseTypes.map((type) => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>
          <div className="financial-overview-form-field">
            <label className="financial-overview-form-label">Amount:</label>
            <input
              type="text"
              name="amount"
              className="financial-overview-form-input"
              value={editingExpense ? editingExpense.amount : newExpense.amount}
              onChange={handleExpenseInputChange}
              placeholder="Enter amount"
              pattern="^\d*\.?\d*$"
              required
            />
          </div>
          <div className="financial-overview-form-field">
            <label className="financial-overview-form-label">Date:</label>
            <input
              type="date"
              name="date"
              className="financial-overview-form-input"
              value={editingExpense ? editingExpense.date : newExpense.date}
              onChange={handleExpenseInputChange}
              min={firstDayOfMonth}
              max={today.toISOString().split("T")[0]}
              required
            />
          </div>
          <div className="financial-overview-form-field">
            <label className="financial-overview-form-label">Description:</label>
            <textarea
              name="description"
              className="financial-overview-form-textarea"
              value={editingExpense ? editingExpense.description : newExpense.description}
              onChange={handleExpenseInputChange}
              placeholder="Enter description (optional)"
            />
          </div>
          <div className="financial-overview-form-actions">
            <button
              id={editingExpense ? "financial-overview-update-expense-btn" : "financial-overview-add-expense-btn"}
              onClick={editingExpense ? handleUpdateExpense : handleAddExpense}
            >
              {editingExpense ? "Update" : "Add"} Expense
            </button>
            {editingExpense && (
              <button
                id="financial-overview-cancel-edit-btn"
                onClick={cancelEditing}
              >
                Cancel
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Net Income Section */}
      <h2 className="financial-overview-section-header">Net Income</h2>
      <div className="financial-overview-table-container">
        <table className="financial-overview-table">
          <thead>
            <tr>
              <th>Total Income</th>
              <th>Total Expenses</th>
              <th>Net Income</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Rs. {totalIncome.toLocaleString()}</td>
              <td>Rs. {totalExpenses.toLocaleString()}</td>
              <td className={calculateNetIncome() >= 0 ? "financial-overview-positive" : "financial-overview-negative"}>
                Rs. {calculateNetIncome().toLocaleString()}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <h3 className="financial-overview-total-header">Total Net Income: Rs. {calculateNetIncome().toLocaleString()}</h3>

      {/* Download Section */}
      <div id="financial-overview-download-section">
        <div id="financial-overview-download-controls">
          <div>
            <label className="financial-overview-download-label">Select Table to Download:</label>
            <select
              className="financial-overview-download-select"
              value={selectedTable}
              onChange={(e) => setSelectedTable(e.target.value)}
            >
              <option value="income">Income</option>
              <option value="profit">Profit Analysis</option>
              <option value="expenses">Expenses</option>
              <option value="netIncome">Net Income</option>
            </select>
          </div>
          <div>
            <label className="financial-overview-download-label">Select Month:</label>
            <input
              type="month"
              className="financial-overview-download-input"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              max={`${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`}
            />
          </div>
          <button
            className="financial-overview-download-btn"
            onClick={downloadMonthlyReport}
          >
            Download Monthly Report
          </button>
          <div>
            <label className="financial-overview-download-label">Select Year:</label>
            <select
              className="financial-overview-download-select"
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
            >
              <option value="">Select Year</option>
              {yearOptions.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>
          <button
            className="financial-overview-download-btn"
            onClick={downloadYearlyReport}
          >
            Download Yearly Report
          </button>
        </div>
      </div>
    </div>
  );
};

export default FinancialOverview;