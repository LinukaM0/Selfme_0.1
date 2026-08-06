import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import './TaxCompliance.css';

// Convert logo to Base64
const getLogoAsBase64 = () => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
      const base64 = canvas.toDataURL('image/png');
      resolve(base64);
    };
    img.onerror = () => {
      console.warn('Could not load logo, proceeding without it');
      resolve(null);
    };
    img.src = '/newLogo.png';
  });
};

const TAX_RATE = 0.085; // 8.5%

const TaxCompliance = () => {
  const [taxData, setTaxData] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [totalTax, setTotalTax] = useState(0);
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const currentYear = new Date().getFullYear();
  const currentMonth = (new Date().getMonth() + 1).toString().padStart(2, "0");

  const getFilteredTaxData = () => {
    if (!searchQuery.trim()) {
      return taxData;
    }
    return taxData.filter(item =>
      item.payment_id?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

  // fetch and build tax rows from payments endpoint
  const fetchPaidPayments = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setError("Please login to view tax compliance");
        setTaxData([]);
        setTotalTax(0);
        setIsLoading(false);
        return;
      }

      const res = await axios.get("http://localhost:5000/api/finance/payments", {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 10000,
      });

      const allPayments = Array.isArray(res.data) ? res.data : [];
      const paidPayments = allPayments.filter(
        (p) => String(p.status).toLowerCase() === "paid"
      );

      // Map to rows with year/month and tax calc
      const rows = paidPayments
        .map((p) => {
          const amount = Number(p.amount) || 0;
          const taxAmount = Math.round(amount * TAX_RATE);
          const date = p.payment_date ? new Date(p.payment_date) : null;
          const y = date ? date.getFullYear() : null;
          const m = date ? (date.getMonth() + 1).toString().padStart(2, "0") : null;
          const customerObject = p.customer_id || p.customer || null;
          const customerName =
            (customerObject &&
              (customerObject.firstName || customerObject.lastName
                ? `${customerObject.firstName || ""} ${customerObject.lastName || ""}`.trim()
                : customerObject.userid || customerObject))
            || "Unknown";

          return {
            payment_id: p.payment_id || p._id || "N/A",
            customer: customerName,
            totalAmount: amount,
            taxAmount,
            payment_date: date ? date.toLocaleDateString('en-GB') : "N/A",
            year: y,
            month: m,
          };
        })
        .filter((r) => {
          if (!r.payment_date) return false;
          if (year && Number(r.year) !== Number(year)) return false;
          if (month && r.month !== month) return false;
          return true;
        });

      const totalTaxCalc = rows.reduce((sum, r) => sum + (r.taxAmount || 0), 0);

      setTaxData(rows);
      setTotalTax(totalTaxCalc);
    } catch (err) {
      console.error("❌ Tax data fetch error:", err);
      setError(err.response?.data?.message || "Failed to load tax compliance data.");
      setTaxData([]);
      setTotalTax(0);
    } finally {
      setIsLoading(false);
    }
  }, [year, month]);

  useEffect(() => {
    fetchPaidPayments();
    const handler = () => fetchPaidPayments();
    window.addEventListener("paymentsUpdated", handler);
    return () => window.removeEventListener("paymentsUpdated", handler);
  }, [fetchPaidPayments]);

  const resetFilters = () => {
    setYear(currentYear);
    setMonth("");
    setSearchQuery("");
  };

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  const clearSearch = () => {
    setSearchQuery('');
  };

  const downloadReport = async () => {
    const filteredData = getFilteredTaxData();
    if (filteredData.length === 0) {
      alert("No data available to download.");
      return;
    }

    const companyInfo = {
      name: "SelfMe",
      address: "No/346, Madalanda, Dompe, Colombo, Sri Lanka",
      phone: "+94 717 882 883",
      email: "Selfmepvtltd@gmail.com",
      website: "www.selfme.com",
    };

    const logoBase64 = await getLogoAsBase64();
    const doc = new jsPDF();
    autoTable(doc, {});
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    // UPDATED LETTERHEAD to match professional style
    const addLetterhead = () => {
      // Logo on the left
      if (logoBase64) {
        doc.addImage(logoBase64, "PNG", 15, 15, 30, 30);
      }
      
      // Company name centered and bold
      doc.setFont("times", "bold");
      doc.setFontSize(20);
      doc.setTextColor(0, 0, 0);
      doc.text(companyInfo.name, pageWidth / 2, 25, { align: "center" });
      
      // Address below company name
      doc.setFont("times", "normal");
      doc.setFontSize(11);
      doc.text(companyInfo.address, pageWidth / 2, 32, { align: "center" });
      
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

    const addFooter = (pageNum, totalPages, lastRecordIdx) => {
      doc.setFont("times", "normal");
      doc.setFontSize(8);
      doc.setTextColor(50, 50, 50);
      doc.setLineWidth(0.3);
      doc.setDrawColor(150, 150, 150);
      doc.line(15, pageHeight - 20, pageWidth - 15, pageHeight - 20);
      const footerText = `Generated by ${companyInfo.name} Tax Management System`;
      doc.text(footerText, pageWidth / 2, pageHeight - 15, { align: "center" });
      const recordText = lastRecordIdx >= 0 ? `Tax Entry #${String(lastRecordIdx + 1).padStart(3, "0")}` : "";
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

    // Build report title with period
    let reportTitle = "Tax Compliance Report";
    if (year && month) {
      const monthName = new Date(year, Number(month) - 1).toLocaleString("default", { month: "long" });
      reportTitle += ` - ${monthName} ${year}`;
    } else if (year) {
      reportTitle += ` - ${year}`;
    }

    // Calculate pagination
    const tableRowHeight = 10;
    const rowsPerPage = Math.floor((pageHeight - 110) / tableRowHeight);
    const totalPages = Math.ceil(filteredData.length / rowsPerPage);

    // Add letterhead
    addLetterhead();
    
    // UPDATED TITLE STYLE
    doc.setFont("times", "bold");
    doc.setFontSize(16);
    doc.setTextColor(0, 0, 0);
    doc.text(reportTitle, pageWidth / 2, 55, { align: "center" });

    // Define columns
    const columns = [
      { header: "Payment ID", dataKey: "payment_id" },
      { header: "Customer", dataKey: "customer" },
      { header: "Total Amount", dataKey: "totalAmount" },
      { header: "Tax Amount (8.5%)", dataKey: "taxAmount" },
      { header: "Date", dataKey: "payment_date" },
    ];

    let currentPage = 1;
    for (let i = 0; i < filteredData.length; i += rowsPerPage) {
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

      const pageData = filteredData.slice(i, i + rowsPerPage);
      const bodyData = pageData.map((row) => ({
        payment_id: row.payment_id || "N/A",
        customer: row.customer || "Unknown",
        totalAmount: `Rs. ${(row.totalAmount || 0).toLocaleString()}`,
        taxAmount: `Rs. ${(row.taxAmount || 0).toLocaleString()}`,
        payment_date: row.payment_date || "N/A",
      }));

      // UPDATED TABLE STYLE with professional dark green header for tax reports
      autoTable(doc, {
        startY: 62,
        columns: columns,
        body: bodyData.map(item => columns.map(col => item[col.dataKey])),
        theme: "striped",
        headStyles: {
          fillColor: [39, 174, 96],
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
        columnStyles: {
          0: { cellWidth: 35 },
          1: { cellWidth: 45 },
          2: { cellWidth: 35, halign: "left" },
          3: { cellWidth: 40, halign: "left" },
          4: { cellWidth: 30 },
        }
      });
    }

    // Add summary on last page
    const finalY = doc.lastAutoTable.finalY + 15;
    if (finalY > pageHeight - 50) {
      addSignatureField();
      addFooter(currentPage, totalPages, filteredData.length - 1);
      doc.addPage();
      currentPage++;
      addLetterhead();
      doc.setFont("times", "bold");
      doc.setFontSize(14);
      doc.text("Tax Summary", pageWidth / 2, 55, { align: "center" });
    }

    const filteredTotal = filteredData.reduce((sum, r) => sum + (r.taxAmount || 0), 0);
    const summaryY = doc.lastAutoTable ? doc.lastAutoTable.finalY + 15 : 70;
    
    doc.setFont("times", "bold");
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text(`Total Tax Collected: Rs. ${filteredTotal.toLocaleString()}`, 15, summaryY);
    doc.text(`Tax Rate: ${(TAX_RATE * 100).toFixed(1)}%`, 15, summaryY + 10);
    doc.text(`Number of Transactions: ${filteredData.length}`, 15, summaryY + 20);

    addSignatureField();
    addFooter(currentPage, totalPages, filteredData.length - 1);

    const timestamp = new Date().toISOString().split("T")[0];
    const fileName = `${companyInfo.name}_Tax_Compliance_Report_${timestamp}.pdf`;
    doc.save(fileName);
    alert(`Official report "${fileName}" downloaded successfully!`);
  };

  const filteredTaxData = getFilteredTaxData();
  const filteredTotal = filteredTaxData.reduce((sum, r) => sum + (r.taxAmount || 0), 0);

  return (
    <div id="tax-compliance-main-container" className="tax-compliance-container">
      <h2 id="tax-compliance-page-title" className="page-title">Tax Compliance</h2>

      <div id="tax-compliance-filters-section" className="filters-section">
        <div id="year-filter-container" className="filter-container">
          <label id="year-filter-label" className="filter-label">Year: </label>
          <input
            id="year-filter-input"
            type="number"
            value={year}
            max={currentYear}
            onChange={(e) => {
              const v = Number(e.target.value);
              setYear(Number.isNaN(v) ? currentYear : v);
            }}
            className="filter-input year-input"
          />
        </div>

        <div id="month-filter-container" className="filter-container">
          <label id="month-filter-label" className="filter-label">Month: </label>
          <select 
            id="month-filter-select" 
            value={month} 
            onChange={(e) => setMonth(e.target.value)}
            className="filter-select"
          >
            <option value="">All</option>
            {["01","02","03","04","05","06","07","08","09","10","11","12"].map((m, index) => (
              <option
                key={m}
                value={m}
                disabled={Number(year) === currentYear && Number(m) > Number(currentMonth)}
              >
                {new Date(0, index).toLocaleString("default", { month: "long" })}
              </option>
            ))}
          </select>
        </div>

        <button
          id="tax-compliance-refresh-btn"
          onClick={fetchPaidPayments}
          className="action-btn refresh-btn"
          disabled={isLoading}
        >
          Refresh
        </button>

        <button
          id="tax-compliance-reset-btn"
          onClick={resetFilters}
          className="action-btn reset-btn"
        >
          Reset
        </button>
      </div>

      {/* Search Bar Section */}
      <div id="tax-search-section">
        <div id="tax-search-container">
          <input
            id="tax-search-input"
            type="text"
            placeholder="Search by Payment ID..."
            value={searchQuery}
            onChange={handleSearchChange}
            className="tax-search-input"
          />
          {searchQuery && (
            <button
              id="tax-search-clear-btn"
              onClick={clearSearch}
              className="tax-search-clear-btn"
            >
              ✕
            </button>
          )}
        </div>
        {searchQuery && (
          <div id="tax-search-results-info">
            <p>{filteredTaxData.length === 0 ? `No records found matching "${searchQuery}"` : `Found ${filteredTaxData.length} record(s) matching your search`}</p>
          </div>
        )}
      </div>

      {isLoading ? (
        <div id="tax-compliance-loading" className="loading-container">
          <p id="tax-compliance-loading-text" className="loading-text">Loading tax data...</p>
        </div>
      ) : error ? (
        <div id="tax-compliance-error" className="error-container">
          <p id="tax-compliance-error-text" className="error-text">{error}</p>
        </div>
      ) : (
        <div id="tax-compliance-content" className="content-section">
          <div id="tax-table-wrapper" className="table-wrapper">
            <table id="tax-compliance-table" className="data-table">
              <thead id="tax-table-head" className="table-head">
                <tr id="tax-table-header-row" className="header-row">
                  <th id="payment-id-header" className="table-header">Payment ID</th>
                  <th id="customer-header" className="table-header">Customer</th>
                  <th id="total-amount-header" className="table-header">Total Amount</th>
                  <th id="tax-amount-header" className="table-header">Tax Amount</th>
                  <th id="payment-date-header" className="table-header">Date</th>
                </tr>
              </thead>
              <tbody id="tax-table-body" className="table-body">
                {filteredTaxData.map((row, i) => (
                  <tr key={i} id={`tax-row-${i}`} className="table-row">
                    <td id={`payment-id-${i}`} className="table-cell">{row.payment_id}</td>
                    <td id={`customer-${i}`} className="table-cell">{row.customer}</td>
                    <td id={`total-amount-${i}`} className="table-cell amount-cell">Rs. {row.totalAmount.toLocaleString()}</td>
                    <td id={`tax-amount-${i}`} className="table-cell tax-cell">Rs. {row.taxAmount.toLocaleString()}</td>
                    <td id={`payment-date-${i}`} className="table-cell date-cell">
                      {row.payment_date}
                    </td>
                  </tr>
                ))}
                {filteredTaxData.length === 0 && (
                  <tr id="no-tax-data-row">
                    <td id="no-tax-data-cell" colSpan="5" className="no-data-cell">No records found</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div id="tax-summary-section" className="summary-section">
            <h3 id="total-tax-summary" className="summary-title">
              Total Tax Collected: Rs. {filteredTotal.toLocaleString()}
            </h3>

            <button
              id="download-tax-report-btn"
              onClick={downloadReport}
              className="download-btn"
              disabled={filteredTaxData.length === 0}
            >
              Download Report
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TaxCompliance;