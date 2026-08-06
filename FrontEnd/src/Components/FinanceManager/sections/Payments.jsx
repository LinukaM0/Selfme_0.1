import React, { useState, useEffect } from 'react';
import axios from 'axios';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import './Payments.css';

// Static company info (replace with your actual company details)
const companyInfo = {
  name: 'SelfMe',
  address: ['123 Business St', 'City, Country'],
  phone: '+1234567890',
  email: 'info@company.com',
  website: 'www.company.com',
};

// Convert logo to base64
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

const Payments = () => {
  const [payments, setPayments] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [reportType, setReportType] = useState('Monthly');
  const [selectedMonth, setSelectedMonth] = useState('');
  const [selectedYear, setSelectedYear] = useState('');

  useEffect(() => {
    console.log('Component mounted, fetching payments...');
    fetchPayments();
    const today = new Date();
    setSelectedMonth(`${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`);
    setSelectedYear(today.getFullYear().toString());
  }, []);

  const fetchPayments = async () => {
    setIsLoading(true);
    setError('');
    setSuccessMessage('');
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Please login to view payments');
        console.warn('⚠️ No token found');
        return;
      }
      const res = await axios.get('http://localhost:5000/api/finance/payments', {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 10000,
      });
      const paymentData = Array.isArray(res.data) ? res.data : [];
      setPayments(paymentData);
      console.log('✅ Payments fetched:', paymentData.length, paymentData);
    } catch (err) {
      console.error('💥 Payment fetch error:', err.response?.data, err.message);
      setError(err.response?.data?.message || 'Failed to load payments.');
    } finally {
      setIsLoading(false);
      console.log('Fetch payments complete, isLoading:', false);
    }
  };

  const getFilteredPayments = () => {
    if (!searchQuery.trim()) {
      return payments;
    }
    return payments.filter(payment =>
      payment.payment_id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      payment.customer_id?.userid?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

  const handleSelectPayment = (payment) => {
    setSelectedPayment(payment);
    setError('');
    setSuccessMessage('');
    setIsModalOpen(true);
    console.log('Selected payment:', payment?.payment_id, payment);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedPayment(null);
    setError('');
    setSuccessMessage('');
    console.log('Modal closed, selectedPayment cleared');
  };

  const handleUpdateStatus = async (status) => {
    if (!selectedPayment) {
      setError('No payment selected');
      console.warn('⚠️ No payment selected for status update');
      return;
    }
    setIsLoading(true);
    setError('');
    setSuccessMessage('');
    try {
      console.log('Updating status for payment_id:', selectedPayment.payment_id, 'to', status);
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Authentication token missing. Please login again.');
        console.warn('⚠️ No token found for status update');
        return;
      }
      const res = await axios.put(
        `http://localhost:5000/api/finance/payments/status/${selectedPayment.payment_id}`,
        { status },
        {
          headers: { Authorization: `Bearer ${token}` },
          timeout: 10000,
        }
      );
      console.log('Backend response:', res.data);
      if (res.data.payment && res.data.payment.payment_id) {
        const updatedPayment = {
          ...res.data.payment,
          customer_id: res.data.payment.customer_id || { firstName: 'Unknown', lastName: '', email: '', userid: '' },
        };
        setPayments(payments.map((p) =>
          p.payment_id === selectedPayment.payment_id ? updatedPayment : p
        ));
        setSelectedPayment(updatedPayment);
        setSuccessMessage(`Payment ${selectedPayment.payment_id} marked as ${status}`);
        console.log('✅ Status updated:', selectedPayment.payment_id, status, updatedPayment);
      } else {
        setError('Invalid response from server: missing payment data');
        console.error('❌ Invalid response structure:', res.data);
      }
    } catch (err) {
      console.error('❌ Status update error:', err.response?.data, err.message);
      setError(err.response?.data?.message || 'Failed to update payment status.');
    } finally {
      setIsLoading(false);
      console.log('Status update complete, isLoading:', false, 'selectedPayment:', selectedPayment);
    }
  };

  const generateReceiptPDF = () => {
    if (!selectedPayment || selectedPayment.status !== 'Paid') {
      setError('Select a paid payment to generate receipt');
      console.warn('⚠️ Invalid payment for receipt:', selectedPayment?.status);
      return;
    }
    try {
      const doc = new jsPDF();
      doc.setFontSize(18);
      doc.text('Payment Receipt', 105, 20, { align: 'center' });
      doc.setFontSize(12);
      doc.text(`Receipt ID: REC${selectedPayment.payment_id}`, 20, 40);
      doc.text(
        `Customer: ${selectedPayment.customer_id?.firstName || 'Unknown'} ${selectedPayment.customer_id?.lastName || ''}`,
        20,
        50
      );
      doc.text(`User ID: ${selectedPayment.customer_id?.userid || 'N/A'}`, 20, 60);
      doc.text(`Email: ${selectedPayment.customer_id?.email || ''}`, 20, 70);
      doc.text(`Payment ID: ${selectedPayment.payment_id}`, 20, 80);
      doc.text(`Amount Paid: Rs. ${selectedPayment.amount?.toLocaleString() || '0'}`, 20, 90);
      doc.text(`Payment Date: ${new Date(selectedPayment.payment_date).toLocaleDateString()}`, 20, 100);
      doc.text('Payment Method: Bank Transfer', 20, 110);
      doc.text('Thank you for your payment!', 105, 130, { align: 'center' });
      doc.save(`receipt_${selectedPayment.payment_id}.pdf`);
      setSuccessMessage('Receipt generated and downloaded.');
      console.log('✅ Receipt generated for:', selectedPayment.payment_id);
    } catch (err) {
      console.error('❌ Receipt generation error:', err.message);
      setError('Failed to generate receipt.');
    }
  };

  const generateReportPDF = async (statusFilter) => {
    try {
      if (!payments || !Array.isArray(payments)) {
        setError('No payment data available.');
        console.warn('⚠️ Payments array is invalid:', payments);
        alert('No payments to download!');
        return;
      }
      if (reportType === 'Monthly' && (!selectedMonth || !/^\d{4}-\d{2}$/.test(selectedMonth))) {
        setError('Please select a valid month for the report.');
        console.warn('⚠️ Invalid or no month selected for Monthly report:', selectedMonth);
        alert('Please select a valid month for the report.');
        return;
      }
      if (reportType === 'Yearly' && (!selectedYear || isNaN(selectedYear) || selectedYear < 2000 || selectedYear > 2025)) {
        setError('Please select a valid year (2000-2025) for the report.');
        console.warn('⚠️ Invalid or no year selected for Yearly report:', selectedYear);
        alert('Please select a valid year (2000-2025) for the report.');
        return;
      }

      const logoBase64 = await getLogoAsBase64();
      const doc = new jsPDF();
      autoTable(doc, {});
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();

      const addLetterhead = () => {
        if (logoBase64) {
          doc.addImage(logoBase64, 'PNG', 15, 10, 20, 20);
        }
        doc.setFont('times', 'bold');
        doc.setFontSize(16);
        doc.setTextColor(0, 0, 0);
        doc.text(companyInfo.name, pageWidth / 2, 20, { align: 'center' });
        doc.setFont('times', 'normal');
        doc.setFontSize(10);
        doc.text(companyInfo.address.join(', '), pageWidth / 2, 28, { align: 'center' });
        doc.text(
          `Phone: ${companyInfo.phone} | Email: ${companyInfo.email} | Website: ${companyInfo.website}`,
          pageWidth / 2,
          34,
          { align: 'center' }
        );
        doc.setLineWidth(0.5);
        doc.setDrawColor(0, 0, 0);
        doc.line(15, 40, pageWidth - 15, 40);
      };

      const addFooter = (pageNum, totalPages, lastRecordIdx) => {
        doc.setFont('times', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(50, 50, 50);
        doc.setLineWidth(0.3);
        doc.setDrawColor(150, 150, 150);
        doc.line(15, pageHeight - 20, pageWidth - 15, pageHeight - 20);
        const footerText = `Generated by ${companyInfo.name} Payment Management System`;
        doc.text(footerText, pageWidth / 2, pageHeight - 15, { align: 'center' });
        const recordText = lastRecordIdx >= 0 ? `Payment #${String(lastRecordIdx + 1).padStart(3, '0')}` : '';
        doc.text(`Page ${pageNum} of ${totalPages} | ${recordText}`, pageWidth - 15, pageHeight - 10, { align: 'right' });
        const genDate = new Date().toLocaleDateString('en-GB');
        const genTime = new Date().toLocaleTimeString('en-GB', { hour12: false });
        doc.text(`Generated on ${genDate} at ${genTime}`, 15, pageHeight - 10);
      };

      const addSignatureField = () => {
        doc.setFont('times', 'normal');
        doc.setFontSize(10);
        doc.setTextColor(0, 0, 0);
        doc.text('Authorized Signature: __________________', pageWidth - 85, pageHeight - 30);
      };

      let filteredPayments = payments;
      let reportTitle = '';

      if (statusFilter === 'Pending') {
        filteredPayments = payments.filter((payment) => payment?.status === 'Pending');
        reportTitle = 'Pending Payments Report';
      } else if (statusFilter === 'Approved') {
        filteredPayments = payments.filter((payment) => payment?.status === 'Paid');
        reportTitle = 'Approved Payments Report';
      } else {
        reportTitle = 'All Payments Report';
      }

      if (reportType === 'Monthly' && selectedMonth) {
        const [year, month] = selectedMonth.split('-').map(Number);
        filteredPayments = filteredPayments.filter((payment, index) => {
          if (!payment || !payment.payment_date) {
            console.warn(`⚠️ Missing payment or payment_date at index ${index}:`, payment);
            return false;
          }
          try {
            const paymentDate = new Date(payment.payment_date);
            if (isNaN(paymentDate.getTime())) {
              console.warn(`⚠️ Invalid date format for payment_id ${payment.payment_id || 'unknown'}:`, payment.payment_date);
              return false;
            }
            return paymentDate.getFullYear() === year && paymentDate.getMonth() + 1 === month;
          } catch (err) {
            console.warn(`⚠️ Error parsing payment_date for payment_id ${payment.payment_id || 'unknown'}:`, err.message);
            return false;
          }
        });
        reportTitle += ` - ${new Date(year, month - 1).toLocaleString('default', { month: 'long', year: 'numeric' })}`;
      } else if (reportType === 'Yearly' && selectedYear) {
        const year = Number(selectedYear);
        filteredPayments = filteredPayments.filter((payment, index) => {
          if (!payment || !payment.payment_date) {
            console.warn(`⚠️ Missing payment or payment_date at index ${index}:`, payment);
            return false;
          }
          try {
            const paymentDate = new Date(payment.payment_date);
            if (isNaN(paymentDate.getTime())) {
              console.warn(`⚠️ Invalid date format for payment_id ${payment.payment_id || 'unknown'}:`, payment.payment_date);
              return false;
            }
            return paymentDate.getFullYear() === year;
          } catch (err) {
            console.warn(`⚠️ Error parsing payment_date for payment_id ${payment.payment_id || 'unknown'}:`, err.message);
            return false;
          }
        });
        reportTitle += ` - ${year}`;
      }

      if (filteredPayments.length === 0) {
        setError(`No ${statusFilter || 'All'} payments found for the selected ${reportType.toLowerCase()} period.`);
        console.warn(`⚠️ No payments found for ${statusFilter || 'All'} in ${reportType}:`, selectedMonth || selectedYear);
        addLetterhead();
        doc.setFontSize(18);
        doc.text(reportTitle, pageWidth / 2, 45, { align: 'center' });
        doc.setFontSize(12);
        doc.text('No payments found for the selected criteria.', 15, 60);
        addSignatureField();
        addFooter(1, 1, -1);
        const timestamp = new Date().toISOString().split('T')[0];
        const fileName = `${companyInfo.name}_${statusFilter || 'All'}_Payments_Report_${reportType === 'Monthly' ? selectedMonth : selectedYear}_${timestamp}.pdf`;
        doc.save(fileName);
        setSuccessMessage(`Report for ${statusFilter || 'All'} payments generated (no data found).`);
        alert(`Official report "${fileName}" downloaded successfully!`);
        return;
      }

      const tableRowHeight = 10;
      const rowsPerPage = Math.floor((pageHeight - 80) / tableRowHeight);
      let totalPages = Math.ceil(filteredPayments.length / rowsPerPage);
      let lastRecordIdxPerPage = [];
      let currentPageRecords = [];
      let currentPage = 1;
      let startIndex = 0;

      filteredPayments.forEach((_, idx) => {
        if (currentPageRecords.length >= rowsPerPage) {
          lastRecordIdxPerPage.push(startIndex + currentPageRecords.length - 1);
          currentPageRecords = [];
          currentPage++;
        }
        currentPageRecords.push(idx);
      });
      lastRecordIdxPerPage.push(startIndex + currentPageRecords.length - 1);

      addLetterhead();
      doc.setFont('times', 'bold');
      doc.setFontSize(14);
      doc.setTextColor(0, 0, 0);
      doc.text(reportTitle, pageWidth / 2, 45, { align: 'center' });

      const columns = [
        { header: 'Payment ID', dataKey: 'payment_id' },
        { header: 'User ID', dataKey: 'userid' },
        { header: 'Customer', dataKey: 'customer' },
        { header: 'Amount', dataKey: 'amount' },
        { header: 'Status', dataKey: 'status' },
        { header: 'Payment Date', dataKey: 'payment_date' },
      ];

      currentPage = 1;
      for (let i = 0; i < filteredPayments.length; i += rowsPerPage) {
        if (i > 0) {
          addSignatureField();
          addFooter(currentPage, totalPages, lastRecordIdxPerPage[currentPage - 1]);
          doc.addPage();
          currentPage++;
          addLetterhead();
        }

        const data = filteredPayments.slice(i, i + rowsPerPage).map((payment, index) => {
          if (!payment) {
            console.warn(`⚠️ Null or undefined payment at index ${i + index}`);
            return {
              payment_id: 'N/A',
              userid: 'N/A',
              customer: 'Unknown',
              amount: 'Rs. 0',
              status: 'N/A',
              payment_date: 'N/A',
            };
          }
          return {
            payment_id: payment.payment_id || 'N/A',
            userid: payment.customer_id?.userid || 'N/A',
            customer: `${payment.customer_id?.firstName || 'Unknown'} ${payment.customer_id?.lastName || ''}`,
            amount: `Rs. ${typeof payment.amount === 'number' ? payment.amount.toLocaleString() : '0'}`,
            status: payment.status || 'N/A',
            payment_date: payment.payment_date ? (new Date(payment.payment_date).toLocaleDateString('en-GB') || 'N/A') : 'N/A',
          };
        });

        autoTable(doc, {
          columns,
          body: data,
          startY: 50,
          theme: 'striped',
          headStyles: {
            fillColor: statusFilter === 'Pending' ? [255, 193, 7] : statusFilter === 'Approved' ? [40, 167, 69] : [0, 123, 255],
            textColor: statusFilter === 'Pending' ? [0, 0, 0] : [255, 255, 255],
          },
          styles: { fontSize: 10, cellPadding: 3 },
        });
      }

      addSignatureField();
      addFooter(currentPage, totalPages, lastRecordIdxPerPage[currentPage - 1]);

      const timestamp = new Date().toISOString().split('T')[0];
      const fileName = `${companyInfo.name}_${statusFilter || 'All'}_Payments_Report_${reportType === 'Monthly' ? selectedMonth : selectedYear}_${timestamp}.pdf`;
      doc.save(fileName);
      setSuccessMessage(`Report for ${statusFilter || 'All'} payments generated and downloaded.`);
      alert(`Official report "${fileName}" downloaded successfully!`);
      console.log(`✅ Report generated: ${fileName}`);
    } catch (err) {
      console.error('❌ Report generation error:', {
        message: err.message,
        stack: err.stack,
        statusFilter,
        reportType,
        selectedMonth,
        selectedYear,
        paymentsCount: payments.length,
        paymentsSample: payments.slice(0, 3),
      });
      setError('Failed to generate report. Please check the console for details.');
      alert('Error generating PDF. Please try again.');
    }
  };

  const filteredPayments = getFilteredPayments();
  const pendingPayments = filteredPayments.filter((payment) => payment?.status === 'Pending');
  const approvedPayments = filteredPayments.filter((payment) => payment?.status === 'Paid');

  console.log(
    'Rendering Payments component, payments:', payments.length,
    'filteredPayments:', filteredPayments.length,
    'pendingPayments:', pendingPayments.length,
    'approvedPayments:', approvedPayments.length,
    'selectedPayment:', selectedPayment?.payment_id,
    'isModalOpen:', isModalOpen,
    'reportType:', reportType,
    'selectedMonth:', selectedMonth,
    'selectedYear:', selectedYear
  );

  const today = new Date();
  const maxMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
  const maxYear = today.getFullYear().toString();

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  const clearSearch = () => {
    setSearchQuery('');
  };

  return (
    <div id="payments-main-container">
      <h2 id="payments-page-title">Payment Management</h2>

      {/* Report Download Section */}
      <div id="payments-report-section">
        <div id="report-type-container">
          <label id="report-type-label">Report Type:</label>
          <select
            id="report-type-select"
            value={reportType}
            onChange={(e) => setReportType(e.target.value)}
          >
            <option value="Monthly">Monthly</option>
            <option value="Yearly">Yearly</option>
          </select>
        </div>
        {reportType === 'Monthly' ? (
          <div id="report-month-container">
            <label id="report-month-label">Select Month:</label>
            <input
              id="report-month-input"
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              max={maxMonth}
            />
          </div>
        ) : (
          <div id="report-year-container">
            <label id="report-year-label">Select Year:</label>
            <input
              id="report-year-input"
              type="number"
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              max={maxYear}
              min="2000"
            />
          </div>
        )}
        <div id="report-buttons-container">
          <button
            id="download-pending-report-btn"
            onClick={() => generateReportPDF('Pending')}
          >
            Download Pending Report
          </button>
          <button
            id="download-approved-report-btn"
            onClick={() => generateReportPDF('Approved')}
          >
            Download Approved Report
          </button>
          <button
            id="download-all-report-btn"
            onClick={() => generateReportPDF('All')}
          >
            Download All Payments Report
          </button>
        </div>
      </div>

      {/* Search Bar Section */}
      <div id="payments-search-section">
        <div id="search-container-pp">
          <input
            id="payment-search-input"
            type="text"
            placeholder="Search by Payment ID or User ID..."
            value={searchQuery}
            onChange={handleSearchChange}
            className="search-input"
          />
          {searchQuery && (
            <button
              id="search-clear-btn"
              onClick={clearSearch}
              className="search-clear-btn"
            >
              ✕
            </button>
          )}
        </div>
        {searchQuery && (
          <div id="search-results-info">
            <p>{filteredPayments.length === 0 ? `No payments found matching "${searchQuery}"` : `Found ${filteredPayments.length} payment(s) matching your search`}</p>
          </div>
        )}
      </div>

      {isLoading && <p id="payments-loading-message">Loading payments...</p>}
      {error && !isModalOpen && (
        <p id="payments-error-message">{error}</p>
      )}
      {successMessage && !isModalOpen && (
        <p id="payments-success-message">{successMessage}</p>
      )}

      {/* Pending Payments Table */}
      <div id="pending-payments-section">
        <h3 id="pending-payments-title">Pending Payments</h3>
        {pendingPayments.length === 0 && !isLoading ? (
          <p id="no-pending-payments">No pending payments found.</p>
        ) : (
          <div id="pending-payments-table-container">
            <table id="pending-payments-table">
              <thead>
                <tr>
                  <th>Payment ID</th>
                  <th>User ID</th>
                  <th>Customer</th>
                  <th>Amount</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {pendingPayments.map((payment, index) => (
                  <tr
                    key={payment.payment_id}
                    id={`pending-payment-row-${index}`}
                    className={`payment-table-row ${selectedPayment?.payment_id === payment.payment_id ? 'selected' : ''}`}
                    onClick={() => handleSelectPayment(payment)}
                  >
                    <td>{payment.payment_id || 'N/A'}</td>
                    <td>{payment.customer_id?.userid || 'N/A'}</td>
                    <td>
                      {payment.customer_id?.firstName || 'Unknown'} {payment.customer_id?.lastName || ''}
                    </td>
                    <td>Rs. {payment.amount?.toLocaleString() || '0'}</td>
                    <td>{payment.status || 'N/A'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Approved Payments Table */}
      <div id="approved-payments-section">
        <h3 id="approved-payments-title">Approved Payments</h3>
        {approvedPayments.length === 0 && !isLoading ? (
          <p id="no-approved-payments">No approved payments found.</p>
        ) : (
          <div id="approved-payments-table-container">
            <table id="approved-payments-table">
              <thead>
                <tr>
                  <th>Payment ID</th>
                  <th>User ID</th>
                  <th>Customer</th>
                  <th>Amount</th>
                  <th>Payment Date</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {approvedPayments.map((payment, index) => (
                  <tr
                    key={payment.payment_id}
                    id={`approved-payment-row-${index}`}
                    className={`payment-table-row ${selectedPayment?.payment_id === payment.payment_id ? 'selected' : ''}`}
                    onClick={() => handleSelectPayment(payment)}
                  >
                    <td>{payment.payment_id || 'N/A'}</td>
                    <td>{payment.customer_id?.userid || 'N/A'}</td>
                    <td>
                      {payment.customer_id?.firstName || 'Unknown'} {payment.customer_id?.lastName || ''}
                    </td>
                    <td>Rs. {payment.amount?.toLocaleString() || '0'}</td>
                    <td>
                      {payment.payment_date ? new Date(payment.payment_date).toLocaleDateString() : 'N/A'}
                    </td>
                    <td>{payment.status || 'N/A'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* All Payments Table */}
      <div id="all-payments-section">
        <h3 id="all-payments-title">All Payments</h3>
        {filteredPayments.length === 0 && !isLoading ? (
          <p id="no-all-payments">No payments found.</p>
        ) : (
          <div id="all-payments-table-container">
            <table id="all-payments-table">
              <thead>
                <tr>
                  <th>Payment ID</th>
                  <th>User ID</th>
                  <th>Customer</th>
                  <th>Amount</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredPayments.map((payment, index) => (
                  <tr
                    key={payment.payment_id}
                    id={`all-payment-row-${index}`}
                    className={`payment-table-row ${selectedPayment?.payment_id === payment.payment_id ? 'selected' : ''}`}
                    onClick={() => handleSelectPayment(payment)}
                  >
                    <td>{payment.payment_id || 'N/A'}</td>
                    <td>{payment.customer_id?.userid || 'N/A'}</td>
                    <td>
                      {payment.customer_id?.firstName || 'Unknown'} {payment.customer_id?.lastName || ''}
                    </td>
                    <td>Rs. {payment.amount?.toLocaleString() || '0'}</td>
                    <td>{payment.status || 'N/A'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Payment Details Modal */}
      {isModalOpen && selectedPayment && (
        <div id="payment-details-modal">
          <div id="payment-modal-content">
            <button id="modal-close-btn" onClick={handleCloseModal}>
              ✕ Close
            </button>
            <h3 id="modal-payment-title">Payment Details</h3>
            {error && (
              <p id="modal-error-message">{error}</p>
            )}
            {successMessage && (
              <p id="modal-success-message">{successMessage}</p>
            )}
            <div id="payment-details-container">
              <div className="payment-detail-item">
                <span className="payment-detail-label">Payment ID:</span>
                <span className="payment-detail-value">{selectedPayment.payment_id || 'N/A'}</span>
              </div>
              <div className="payment-detail-item">
                <span className="payment-detail-label">User ID:</span>
                <span className="payment-detail-value">{selectedPayment.customer_id?.userid || 'N/A'}</span>
              </div>
              <div className="payment-detail-item">
                <span className="payment-detail-label">Customer:</span>
                <span className="payment-detail-value">
                  {selectedPayment.customer_id?.firstName || 'Unknown'}{' '}
                  {selectedPayment.customer_id?.lastName || ''}
                </span>
              </div>
              <div className="payment-detail-item">
                <span className="payment-detail-label">Email:</span>
                <span className="payment-detail-value">{selectedPayment.customer_id?.email || 'N/A'}</span>
              </div>
              <div className="payment-detail-item">
                <span className="payment-detail-label">Amount:</span>
                <span className="payment-detail-value">Rs. {selectedPayment.amount?.toLocaleString() || '0'}</span>
              </div>
              <div className="payment-detail-item">
                <span className="payment-detail-label">Status:</span>
                <span className="payment-detail-value">{selectedPayment.status || 'N/A'}</span>
              </div>
              <div className="payment-detail-item">
                <span className="payment-detail-label">Payment Date:</span>
                <span className="payment-detail-value">
                  {selectedPayment.payment_date ? new Date(selectedPayment.payment_date).toLocaleDateString() : 'N/A'}
                </span>
              </div>
              {selectedPayment.reference_no && (
                <div id="bank-slip-section">
                  <h4 id="bank-slip-title">Bank Slip</h4>
                  {selectedPayment.reference_no.endsWith('.pdf') ? (
                    <a
                      id="bank-slip-link"
                      href={`http://localhost:5000${selectedPayment.reference_no}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      View PDF Bank Slip
                    </a>
                  ) : (
                    <img
                      id="bank-slip-image"
                      src={`http://localhost:5000${selectedPayment.reference_no}`}
                      alt="Bank Slip"
                      onError={() => console.error('Failed to load bank slip image:', selectedPayment.reference_no)}
                    />
                  )}
                </div>
              )}
            </div>
            <div id="modal-actions-container">
              <button
                id="mark-paid-btn"
                onClick={() => handleUpdateStatus('Paid')}
                disabled={isLoading || selectedPayment.status === 'Paid'}
              >
                Mark as Paid
              </button>
              <button
                id="mark-failed-btn"
                onClick={() => handleUpdateStatus('Failed')}
                disabled={isLoading || selectedPayment.status === 'Failed'}
              >
                Mark as Failed
              </button>
              <button
                id="generate-receipt-btn"
                onClick={generateReceiptPDF}
                disabled={isLoading || selectedPayment.status !== 'Paid'}
              >
                Generate Receipt
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Payments;