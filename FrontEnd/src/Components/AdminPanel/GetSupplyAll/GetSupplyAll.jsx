import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { removeAuthToken } from '../../../utils/auth';
import axios from 'axios';
import jsPDF from 'jspdf';
import Nav from '../../Nav/Nav';
import './GetSupplyAll.css';

const URL = 'http://localhost:5000/all-productrequests';

function GetSupplyAll() {
  const navigate = useNavigate();
  const authUser = JSON.parse(localStorage.getItem('authUser') || '{}');
  const firstName = authUser.firstName || 'Admin';

  const handleLogout = () => {
    removeAuthToken();
    localStorage.removeItem('authUser');
    navigate('/login');
  };

  // ------------------- STATES -------------------
  const [productRequests, setProductRequests] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showUpdateStatusForm, setShowUpdateStatusForm] = useState(false);
  const [selectedRequestId, setSelectedRequestId] = useState(null);
  const [selectedFields, setSelectedFields] = useState({
    supplier_name: true,
    product_item: true,
    quantity: true,
    unit_price: true,
    total_cost: true,
    need_date: true,
    remark: true,
    financial_status: true,
    request_status: true,
  });

  const defaultInputs = {
    request_status: 'pending',
  };

  const [inputs, setInputs] = useState(defaultInputs);
  const [errors, setErrors] = useState({});

  // ------------------- COMPANY INFORMATION -------------------
  const companyInfo = {
    name: 'SelfMe',
    tagline: 'FUTURE OF SUN - SOLAR POWER',
    address: ['No/346, Madalanda, Dompe,', 'Colombo, Sri Lanka'],
    phone: '+94 717 882 883',
    email: 'Selfmepvtltd@gmail.com',
    website: 'www.selfme.com',
  };

  // ------------------- VALIDATION FUNCTIONS -------------------
  const validateRequestStatus = (value) => ['pending', 'processing', 'completed', 'rejected'].includes(value);

  // ------------------- INPUT HANDLERS -------------------
  const handleRequestStatus = (e) => {
    const value = e.target.value;
    if (validateRequestStatus(value)) {
      setInputs((prev) => ({ ...prev, request_status: value }));
      setErrors((prev) => ({ ...prev, request_status: '' }));
    }
  };

  // ------------------- UPDATE STATUS -------------------
  const handleUpdateStatus = async (e) => {
    e.preventDefault();
    const newErrors = {};
    if (!validateRequestStatus(inputs.request_status)) newErrors.request_status = 'Valid status required';

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    try {
      const res = await axios.put(`${URL}/${selectedRequestId}`, { ...inputs });
      const updatedRequests = productRequests.map((r) => (r._id === selectedRequestId ? res.data.productRequest : r));
      setProductRequests(updatedRequests);
      setInputs(defaultInputs);
      setShowUpdateStatusForm(false);
      setSelectedRequestId(null);
      setErrors({});
      alert('Status updated successfully!');
      window.location.reload();
    } catch (err) {
      console.error('Error updating status:', err);
      setErrors({ submit: err.response?.data?.message || 'Failed to update status' });
    }
  };

  const openUpdateForm = (id, currentStatus) => {
    setSelectedRequestId(id);
    setInputs({ request_status: currentStatus });
    setShowUpdateStatusForm(true);
  };

  const closeUpdateForm = () => {
    setShowUpdateStatusForm(false);
    setSelectedRequestId(null);
    setInputs(defaultInputs);
    setErrors({});
  };

  // ------------------- FETCH PRODUCT REQUESTS -------------------
  const fetchProductRequests = async () => {
    try {
      const res = await axios.get(URL);
      setProductRequests(res.data.productRequests || []);
    } catch (err) {
      console.error('Error fetching product requests:', err);
      setProductRequests([]);
    }
  };

  useEffect(() => {
    fetchProductRequests();
  }, []);

  // ------------------- LOGO CONVERSION -------------------
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

  // ------------------- OFFICIAL PDF GENERATION -------------------
  const generatePDF = async (data, title) => {
    if (!data.length) return alert('No product requests to download!');
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
        const footerText = `Generated by ${companyInfo.name} Product Request Management System`;
        doc.text(footerText, pageWidth / 2, pageHeight - 15, { align: 'center' });
        const recordText = lastRecordIdx >= 0 ? `Request #${String(lastRecordIdx + 1).padStart(3, '0')}` : '';
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

      let totalPages = 1;
      let tempY = 50;
      let lastRecordIdxPerPage = [];
      let currentPageRecords = [];

      data.forEach((_, idx) => {
        let fieldsCount = Object.keys(selectedFields).filter((field) => selectedFields[field]).length;
        let itemHeight = fieldsCount * 10 + 20;
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

      data.forEach((request, idx) => {
        let fieldsCount = Object.keys(selectedFields).filter((field) => selectedFields[field]).length;
        let itemHeight = fieldsCount * 10 + 20;
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
        doc.text(`Request #${String(idx + 1).padStart(3, '0')}`, 15, y);
        doc.setFont('times', 'normal');
        doc.setFontSize(10);
        doc.text(`ID: ${request._id || 'N/A'}`, pageWidth - 50, y);
        y += 10;
        doc.setLineWidth(0.3);
        doc.setDrawColor(150, 150, 150);
        doc.rect(15, y, pageWidth - 30, fieldsCount * 10 + 5, 'S');
        y += 5;
        Object.keys(selectedFields).forEach((field) => {
          if (selectedFields[field]) {
            let label = field.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase());
            let value = request[field] || 'N/A';
            if (field === 'need_date') {
              value = new Date(value).toLocaleDateString('en-GB');
            }
            if (typeof value === 'string' && value.length > 50) {
              value = value.substring(0, 47) + '...';
            }
            doc.setFont('times', 'bold');
            doc.text(`${label}:`, 20, y);
            doc.setFont('times', 'normal');
            doc.text(String(value), 60, y);
            y += 10;
          }
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
      alert(`Official report "${fileName}" downloaded successfully!`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Error generating PDF. Please try again.');
    }
  };

  // ------------------- DOWNLOAD FUNCTIONS -------------------
  const handleDownloadAll = () => generatePDF(productRequests, 'Product Request Directory Report');
  const handleDownloadSingle = (request) => generatePDF([request], `Product Request Report - ${request._id || 'Unnamed'}`);

  // ------------------- FILTERED PRODUCT REQUESTS -------------------
  const filteredProductRequests = productRequests.filter(
    (request) =>
      (request.supplier_name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (request.product_item?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      String(request.quantity || '').includes(searchTerm) ||
      String(request.unit_price || '').includes(searchTerm) ||
      String(request.total_cost || '').includes(searchTerm) ||
      (request.remark?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (request.financial_status?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (request.request_status?.toLowerCase() || '').includes(searchTerm.toLowerCase())
  );

  // ------------------- RENDER -------------------
  return (
    <div className="get-supply-all-container">
      <Nav firstName={firstName} handleLogout={handleLogout} />
      <div className="get-supply-all-section">
        <div className="title-container">
          <h2 className="Title">Product Request Management System</h2>
          <p className="subtitle">{companyInfo.name} - {companyInfo.tagline}</p>
        </div>

        <div className="search-bar">
          <input
            type="text"
            placeholder="Search by Supplier Name, Product Item, Quantity, Status..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="download-options professional-section">
          <h3>Official Report Generation</h3>
          <p>Select the fields to include in your official report:</p>
          <div className="field-checkboxes">
            {Object.keys(selectedFields).map((field) => (
              <label key={field} className="checkbox-label">
                <input
                  type="checkbox"
                  checked={selectedFields[field]}
                  onChange={() =>
                    setSelectedFields((prev) => ({ ...prev, [field]: !prev[field] }))
                  }
                />
                <span>
                  {field.replace('_', ' ').replace(/([A-Z])/g, ' $1').trim().replace(/\b\w/g, (l) => l.toUpperCase())}
                </span>
              </label>
            ))}
          </div>
          <div className="download-buttons">
            <button className="download-all-btn" onClick={handleDownloadAll}>
              Download Directory ({productRequests.length} requests)
            </button>
            <p className="download-note">
              Reports include official letterhead with {companyInfo.name} branding and contact details.
            </p>
          </div>
        </div>
        <div className="users-table-container">
          <div className="table-header">
            <span className="table-user-count">Total Product Requests: {productRequests.length}</span>
            <span className="filtered-count">
              {searchTerm && `(Showing ${filteredProductRequests.length} filtered results)`}
            </span>
          </div>
          <table className="users-table">
            <thead>
              <tr>
                <th>Supplier Name</th>
                <th>Product Item</th>
                <th>Quantity</th>
                <th>Unit Price</th>
                <th>Total Cost</th>
                <th>Need Date</th>
                <th>Remark</th>
                <th>Financial Status</th>
                <th>Request Status</th>
                <th>Created At</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredProductRequests.map((request) => (
                <tr key={request._id}>
                  <td>{request.supplier_name || 'N/A'}</td>
                  <td>{request.product_item || 'N/A'}</td>
                  <td>{request.quantity || 'N/A'}</td>
                  <td>{request.unit_price || 'N/A'}</td>
                  <td>{request.total_cost || 'N/A'}</td>
                  <td>{new Date(request.need_date).toLocaleDateString('en-GB') || 'N/A'}</td>
                  <td>{request.remark || 'N/A'}</td>
                  <td>{request.financial_status || 'N/A'}</td>
                  <td>{request.request_status || 'N/A'}</td>
                  <td>{new Date(request.createdAt).toLocaleDateString('en-GB')}</td>
                  <td className="actions-cell">
                    <button
                      className="action-btn update-btn"
                      onClick={() => openUpdateForm(request._id, request.request_status)}
                      title="Update Status"
                    >
                      Update
                    </button>
                    <button
                      className="action-btn download-btn"
                      onClick={() => handleDownloadSingle(request)}
                      title="Download Request Report"
                    >
                      Download
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {showUpdateStatusForm && (
            <div className="modal-overlay">
              <div className="modal-content">
                <button className="modal-close-btn" onClick={closeUpdateForm}>✕</button>
                <h3>Update Request Status</h3>
                <form className="add-user-form" onSubmit={handleUpdateStatus}>
                  <div className="form-group">
                    <select
                      value={inputs.request_status}
                      onChange={handleRequestStatus}
                      required
                    >
                      <option value="pending">Pending</option>
                      <option value="processing">Processing</option>
                      <option value="completed">Completed</option>
                      <option value="rejected">Rejected</option>
                    </select>
                    {errors.request_status && <p className="error">{errors.request_status}</p>}
                  </div>
                  <div className="modal-actions">
                    <button type="submit" className="submit-btn">
                      Update Status
                    </button>
                    <button type="button" className="cancel-btn" onClick={closeUpdateForm}>
                      Cancel
                    </button>
                  </div>
                  {errors.submit && <p className="error">{errors.submit}</p>}
                </form>
              </div>
            </div>
          )}
          {filteredProductRequests.length === 0 && (
            <div className="no-users-message">
              <p>No product requests found matching your search criteria.</p>
              {searchTerm && (
                <button className="clear-search-btn" onClick={() => setSearchTerm('')}>
                  Clear Search
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default GetSupplyAll;