import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import jsPDF from 'jspdf';
import TechnicianLayout from './TechnicianLayout';
import './AssignedTasks.css';

function TechnicianDashboard() {
  const navigate = useNavigate();
  const authUser = JSON.parse(localStorage.getItem('authUser') || '{}');
  const firstName = authUser.firstName || 'Technician';
  const [payments, setPayments] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Company Information
  const companyInfo = {
    name: 'SelfMe',
    tagline: 'FUTURE OF SUN - SOLAR POWER',
    address: ['No/346, Madalanda, Dompe,', 'Colombo, Sri Lanka'],
    phone: '+94 717 882 883',
    email: 'Selfmepvtltd@gmail.com',
    website: 'www.selfme.com',
  };

  // Fetch payments and save to mypaidtask on component mount
  useEffect(() => {
    console.log('TechnicianDashboard mounted, fetching payments...');
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.warn('⚠️ No token found');
        return;
      }
      const res = await axios.get('http://localhost:5000/api/finance/payments', {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 10000,
      });
      const paymentData = Array.isArray(res.data) ? res.data : [];
      const paidPayments = paymentData.filter((payment) => payment?.status === 'Paid');
      setPayments(paidPayments);
      console.log('✅ Paid payments fetched:', paidPayments.length, paidPayments);

      await saveToMyPaidTask(paidPayments);
    } catch (err) {
      console.error('💥 Payment fetch error:', err.response?.data, err.message);
    } finally {
      setIsLoading(false);
      console.log('Fetch payments complete, isLoading:', false);
    }
  };

  const saveToMyPaidTask = async (payments) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.warn('⚠️ No token found for saving paid tasks');
        return;
      }

      const tasks = payments.map((payment) => ({
        paymentId: payment.payment_id || 'N/A',
        userId: payment.customer_id?.userid || 'N/A',
        customer: `${payment.customer_id?.firstName || 'Unknown'} ${payment.customer_id?.lastName || ''}`.trim(),
        amount: payment.amount || 0,
        paymentDate: payment.payment_date || new Date(),
        status: payment.status || 'Paid',
        statusofmy: 'notyet',
      }));

      const res = await axios.post('http://localhost:5000/api/tech/paidtasks', tasks, {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 10000,
      });

      console.log('✅ Paid tasks saved:', res.data);
    } catch (err) {
      console.error('❌ Error saving paid tasks:', err.response?.data, err.message);
    }
  };

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

  const generatePDF = async (data, title) => {
    if (!data.length) {
      console.warn('No payments to download!');
      alert('No payments to download!');
      return;
    }
    try {
      const logoBase64 = await getLogoAsBase64();
      const doc = new jsPDF();
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
        doc.text(`Phone: ${companyInfo.phone} | Email: ${companyInfo.email} | Website: ${companyInfo.website}`, pageWidth / 2, 34, { align: 'center' });
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
        const footerText = `Generated by ${companyInfo.name} Task Management System`;
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

      const fields = ['payment_id', 'customer_id.userid', 'customer', 'amount', 'payment_date', 'status'];
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
      doc.setFont('times', 'bold');
      doc.setFontSize(14);
      doc.setTextColor(0, 0, 0);
      doc.text(title, pageWidth / 2, 45, { align: 'center' });

      data.forEach((payment, idx) => {
        let itemHeight = fields.length * 10 + 20;
        if (y + itemHeight > pageHeight - 40) {
          addSignatureField();
          addFooter(currentPage, totalPages, lastRecordIdxPerPage[currentPage - 1]);
          doc.addPage();
          currentPage++;
          addLetterhead();
          y = 50;
        }
        doc.setFont('times', 'bold');
        doc.setFontSize(12);
        doc.setTextColor(0, 0, 0);
        doc.text(`Payment #${String(idx + 1).padStart(3, '0')}`, 15, y);
        doc.setFont('times', 'normal');
        doc.setFontSize(10);
        y += 10;
        doc.setLineWidth(0.3);
        doc.setDrawColor(150, 150, 150);
        doc.rect(15, y, pageWidth - 30, fields.length * 10 + 5, 'S');
        y += 5;
        fields.forEach((field) => {
          let label = field.replace(/([A-Z])/g, ' $1').replace(/\./g, ' ').trim().replace(/\b\w/g, (l) => l.toUpperCase());
          let value;
          if (field === 'customer_id.userid') {
            value = payment.customer_id?.userid || 'N/A';
          } else if (field === 'customer') {
            value = `${payment.customer_id?.firstName || 'Unknown'} ${payment.customer_id?.lastName || ''}`.trim();
          } else if (field === 'payment_date') {
            value = payment.payment_date ? new Date(payment.payment_date).toLocaleDateString('en-GB') : 'N/A';
          } else if (field === 'amount') {
            value = `Rs. ${payment.amount?.toLocaleString() || '0'}`;
          } else {
            value = payment[field] || 'N/A';
          }
          if (typeof value === 'string' && value.length > 50) {
            value = value.substring(0, 47) + '...';
          }
          doc.setFont('times', 'bold');
          doc.text(`${label}:`, 20, y);
          doc.setFont('times', 'normal');
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
      const timestamp = new Date().toISOString().split('T')[0];
      const fileName = `${companyInfo.name}_${title.replace(/\s+/g, '_')}_${timestamp}.pdf`;
      doc.save(fileName);
      console.log(`✅ PDF saved as ${fileName}`);
      alert(`Official report "${fileName}" downloaded successfully!`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Error generating PDF. Please try again.');
    }
  };

  const handleDownloadAll = () => {
    console.log('Download All clicked');
    generatePDF(payments, 'Approved Payments Report');
  };

  const handleDownloadSingle = (payment) => {
    console.log('Download Single clicked for payment:', payment.payment_id);
    generatePDF([payment], `Payment Report - ${payment.payment_id || 'Unnamed'}`);
  };

  const filteredPayments = payments.filter(
    (payment) =>
      (payment.payment_id?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (payment.customer_id?.userid?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (`${payment.customer_id?.firstName || ''} ${payment.customer_id?.lastName || ''}`.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (String(payment.amount) || '').includes(searchTerm)
  );

  const handleLogout = () => {
    localStorage.removeItem('authUser');
    navigate('/login');
  };

  return (
    <TechnicianLayout firstName={firstName} handleLogout={handleLogout}>
      <div id="technicianDashboard" className="animate-slide-in-left">
        <h2 className="dashboard-title">Approved Payments</h2>

        {isLoading && (
          <div className="loading-overlay">
            <div className="spinner animate-spin-slow"></div>
            <p>Loading payments...</p>
          </div>
        )}

        <div className="search-filter-container animate-slide-in-right">
          <div className="search-box">
            <input
              type="text"
              placeholder="Search by Payment ID, User ID, Customer, or Amount..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input employee-form"
            />
          </div>
        </div>

        <div className="download-options animate-slide-in-right">
          <h3 className="download-options-title">Official Report Generation</h3>
          <div className="download-buttons">
            <button className="cta-button primary" onClick={handleDownloadAll}>
              Download Directory ({payments.length} payments)
            </button>
            <p className="download-note">
              Reports include official letterhead with {companyInfo.name} branding and contact details.
            </p>
          </div>
        </div>

        <div className="approved-payment-list">
          <h3>Approved Payments</h3>
          <div className="table-header">
            <span className="table-payment-count">Total Payments: {payments.length}</span>
            <span className="filtered-count">
              {searchTerm && `(Showing ${filteredPayments.length} filtered results)`}
            </span>
          </div>
          {filteredPayments.length === 0 && !isLoading ? (
            <div className="empty-state">
              <h3>No Payments Found</h3>
              <p className="empty-message">No approved payments match your search criteria.</p>
              <button className="cta-button" onClick={() => setSearchTerm('')}>Clear Search</button>
              <div className="empty-animation"></div>
            </div>
          ) : (
            <table className="orders-table">
              <thead>
                <tr>
                  <th>Payment ID</th>
                  <th>User ID</th>
                  <th>Customer</th>
                  <th>Amount</th>
                  <th>Payment Date</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredPayments.map((payment) => (
                  <tr key={payment.payment_id} status={payment.status}>
                    <td>{payment.payment_id || 'N/A'}</td>
                    <td>{payment.customer_id?.userid || 'N/A'}</td>
                    <td>{`${payment.customer_id?.firstName || 'Unknown'} ${payment.customer_id?.lastName || ''}`.trim()}</td>
                    <td>Rs. {payment.amount?.toLocaleString() || '0'}</td>
                    <td>{payment.payment_date ? new Date(payment.payment_date).toLocaleDateString() : 'N/A'}</td>
                    <td>{payment.status || 'N/A'}</td>
                    <td>
                      <button
                        className="cta-button"
                        onClick={() => handleDownloadSingle(payment)}
                        title="Download Payment Report"
                      >
                        Download
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {filteredPayments.length === 0 && searchTerm && (
            <div className="no-payments-message">
              <button className="cta-button" onClick={() => setSearchTerm('')}>
                Clear Search
              </button>
            </div>
          )}
        </div>
      </div>
    </TechnicianLayout>
  );
}

export default TechnicianDashboard;