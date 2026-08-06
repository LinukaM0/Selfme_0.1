import React, { useState, useEffect } from 'react';
import axios from 'axios';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import './Salaries.css';

const companyInfo = {
  name: 'SelfMe',
  address: ['123 Business Street', 'City, State, ZIP'],
  phone: '(123) 456-7890',
  email: 'info@company.com',
  website: 'www.company.com'
};

const Salaries = () => {
  const [employees, setEmployees] = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [jobAssignments, setJobAssignments] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState('September 2025');
  const [searchQuery, setSearchQuery] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ workingDays: 0, otherAllowance: 0, salaryStatus: 'Non-Paid' });
  const [error, setError] = useState(null);
  
  const months = [
    'January 2025', 'February 2025', 'March 2025', 'April 2025', 'May 2025', 'June 2025',
    'July 2025', 'August 2025', 'September 2025'
  ];
  
  const currentMonthIndex = months.indexOf(new Date().toLocaleString('default', { month: 'long', year: 'numeric' }));
  const selectedMonthIndex = months.indexOf(selectedMonth);

  useEffect(() => {
    fetchStaff();
    fetchJobAssignments();
    fetchSalaries();
  }, [selectedMonth]);

  const fetchStaff = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/finance/staff');
      setStaffList(response.data);
    } catch (err) {
      console.error('Error fetching staff:', err);
      setError('Error fetching staff data.');
    }
  };

  const fetchJobAssignments = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/finance/job-assigning');
      setJobAssignments(response.data);
    } catch (err) {
      console.error('Error fetching job assignments:', err);
      setError('Error fetching job assignments.');
    }
  };

  const fetchSalaries = async () => {
    try {
      const response = await axios.get(`http://localhost:5000/api/finance/salary?month=${selectedMonth}`);
      console.log('Fetched salaries:', response.data);
      let fetchedEmployees = response.data;
      fetchedEmployees = fetchedEmployees.map(emp => ({
        ...emp,
        salaryStatus: selectedMonthIndex < currentMonthIndex ? 'Paid' : emp.salaryStatus || 'Non-Paid'
      }));
      setEmployees(fetchedEmployees);
      setError(null);
    } catch (err) {
      setError('Error fetching salaries. Please check the backend server.');
      console.error('Error fetching salaries:', err);
    }
  };

  const getFilteredEmployees = () => {
    if (!searchQuery.trim()) {
      return employees;
    }
    return employees.filter(emp => 
      emp.empId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

  const calculateSalary = (emp) => {
    const workingDays = emp.workingDays || 0;
    const perDayManpower = 3000;
    const basic = emp.isManager ? 20000 : 10000;
    const manpowerAllowance = perDayManpower * workingDays;
    const total = basic + manpowerAllowance + (emp.otherAllowance || 0);
    return { basic, perDayManpower, workingDays, manpowerAllowance, total };
  };

  const calculateTotalSalaries = () => {
    return getFilteredEmployees().reduce((sum, emp) => sum + calculateSalary(emp).total, 0);
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

  // UPDATED: Individual Salary Slip with Professional Style
  const generatePDF = async (emp, month) => {
    try {
      const logoBase64 = await getLogoAsBase64();
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const { basic, perDayManpower, workingDays, manpowerAllowance, total } = calculateSalary(emp);
      const monthParts = month.split(' ');
      const monthIndex = months.indexOf(month);
      const generateDate = new Date(parseInt(monthParts[1]), monthIndex, 28).toLocaleDateString('en-GB');

      // UPDATED LETTERHEAD
      if (logoBase64) {
        doc.addImage(logoBase64, 'PNG', 15, 15, 30, 30);
      }
      doc.setFont('times', 'bold');
      doc.setFontSize(20);
      doc.setTextColor(0, 0, 0);
      doc.text(companyInfo.name, pageWidth / 2, 25, { align: 'center' });
      doc.setFont('times', 'normal');
      doc.setFontSize(11);
      doc.text(companyInfo.address.join(', '), pageWidth / 2, 32, { align: 'center' });
      doc.setFontSize(10);
      doc.text(`Phone: ${companyInfo.phone} | Email: ${companyInfo.email} | Website: ${companyInfo.website}`, pageWidth / 2, 38, { align: 'center' });
      doc.setLineWidth(0.5);
      doc.setDrawColor(0, 0, 0);
      doc.line(15, 45, pageWidth - 15, 45);

      // UPDATED TITLE
      doc.setFont('times', 'bold');
      doc.setFontSize(16);
      doc.text(`Salary Slip - ${month}`, pageWidth / 2, 55, { align: 'center' });

      // Employee Information Table
      const empInfoData = [
        ['Employee ID', emp.empId],
        ['Employee Name', emp.name],
        ['Role', emp.isManager ? 'Team Manager' : 'Employee'],
        ['Generate Date', generateDate],
        ['Salary Status', emp.salaryStatus]
      ];

      autoTable(doc, {
        startY: 65,
        body: empInfoData,
        theme: 'plain',
        styles: {
          font: 'times',
          fontSize: 11,
          cellPadding: 5,
        },
        columnStyles: {
          0: { fontStyle: 'bold', cellWidth: 60 },
          1: { cellWidth: 110 }
        }
      });

      // Salary Breakdown Table
      const salaryData = [
        ['Basic Salary', `Rs. ${basic.toLocaleString()}`],
        ['Per Day Manpower', `Rs. ${perDayManpower.toLocaleString()}`],
        ['Working Days', workingDays.toString()],
        ['Manpower Allowance', `Rs. ${manpowerAllowance.toLocaleString()}`],
        ['Other Allowance', `Rs. ${(emp.otherAllowance || 0).toLocaleString()}`],
      ];

      autoTable(doc, {
        startY: doc.lastAutoTable.finalY + 10,
        head: [['Description', 'Amount']],
        body: salaryData,
        foot: [['Total Salary', `Rs. ${total.toLocaleString()}`]],
        theme: 'striped',
        headStyles: {
          fillColor: [52, 152, 219],
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          fontSize: 11,
        },
        footStyles: {
          fillColor: [41, 128, 185],
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          fontSize: 12,
        },
        bodyStyles: {
          textColor: [0, 0, 0],
          fontSize: 10,
        },
        alternateRowStyles: {
          fillColor: [245, 245, 245],
        },
        styles: {
          font: 'times',
          cellPadding: 4,
          lineColor: [200, 200, 200],
          lineWidth: 0.1,
        },
        columnStyles: {
          0: { fontStyle: 'bold', cellWidth: 100 },
          1: { halign: 'left', cellWidth: 70 }
        }
      });

      // Signature field
      doc.setFont('times', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);
      doc.text('Authorized Signature: __________________', pageWidth - 85, pageHeight - 30);

      // Footer
      doc.setFont('times', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(50, 50, 50);
      doc.setLineWidth(0.3);
      doc.setDrawColor(150, 150, 150);
      doc.line(15, pageHeight - 20, pageWidth - 15, pageHeight - 20);
      const footerText = `Generated by ${companyInfo.name} Salary Management System`;
      doc.text(footerText, pageWidth / 2, pageHeight - 15, { align: 'center' });
      const genDate = new Date().toLocaleDateString('en-GB');
      const genTime = new Date().toLocaleTimeString('en-GB', { hour12: false });
      doc.text(`Generated on ${genDate} at ${genTime}`, 15, pageHeight - 10);
      doc.text(`Page 1 of 1`, pageWidth - 15, pageHeight - 10, { align: 'right' });

      // Save PDF
      const timestamp = new Date().toISOString().split('T')[0];
      const fileName = `${companyInfo.name}_Salary_Slip_${emp.empId}_${month.replace(' ', '_')}_${timestamp}.pdf`;
      doc.save(fileName);
      alert(`Salary slip "${fileName}" downloaded successfully!`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Error generating PDF. Please try again.');
    }
  };

  // NEW: Monthly Salary Report for All Employees
  const generateMonthlyReport = async () => {
    const filteredData = getFilteredEmployees();
    if (filteredData.length === 0) {
      alert('No employee data available to download.');
      return;
    }

    try {
      const logoBase64 = await getLogoAsBase64();
      const doc = new jsPDF();
      autoTable(doc, {});
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();

      // PROFESSIONAL LETTERHEAD
      const addLetterhead = () => {
        if (logoBase64) {
          doc.addImage(logoBase64, 'PNG', 15, 15, 30, 30);
        }
        doc.setFont('times', 'bold');
        doc.setFontSize(20);
        doc.setTextColor(0, 0, 0);
        doc.text(companyInfo.name, pageWidth / 2, 25, { align: 'center' });
        doc.setFont('times', 'normal');
        doc.setFontSize(11);
        doc.text(companyInfo.address.join(', '), pageWidth / 2, 32, { align: 'center' });
        doc.setFontSize(10);
        doc.text(`Phone: ${companyInfo.phone} | Email: ${companyInfo.email} | Website: ${companyInfo.website}`, pageWidth / 2, 38, { align: 'center' });
        doc.setLineWidth(0.5);
        doc.setDrawColor(0, 0, 0);
        doc.line(15, 45, pageWidth - 15, 45);
      };

      const addFooter = (pageNum, totalPages) => {
        doc.setFont('times', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(50, 50, 50);
        doc.setLineWidth(0.3);
        doc.setDrawColor(150, 150, 150);
        doc.line(15, pageHeight - 20, pageWidth - 15, pageHeight - 20);
        const footerText = `Generated by ${companyInfo.name} Salary Management System`;
        doc.text(footerText, pageWidth / 2, pageHeight - 15, { align: 'center' });
        doc.text(`Page ${pageNum} of ${totalPages}`, pageWidth - 15, pageHeight - 10, { align: 'right' });
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

      const reportTitle = `Salary Report - ${selectedMonth}`;

      // Calculate pagination
      const tableRowHeight = 10;
      const rowsPerPage = Math.floor((pageHeight - 110) / tableRowHeight);
      const totalPages = Math.ceil(filteredData.length / rowsPerPage);

      // Add letterhead
      addLetterhead();

      // Report title
      doc.setFont('times', 'bold');
      doc.setFontSize(16);
      doc.setTextColor(0, 0, 0);
      doc.text(reportTitle, pageWidth / 2, 55, { align: 'center' });

      // Define columns
      const columns = [
        { header: 'Emp ID', dataKey: 'empId' },
        { header: 'Name', dataKey: 'name' },
        { header: 'Role', dataKey: 'role' },
        { header: 'Basic', dataKey: 'basic' },
        { header: 'W.Days', dataKey: 'workingDays' },
        { header: 'Manpower', dataKey: 'manpower' },
        { header: 'Other', dataKey: 'other' },
        { header: 'Total', dataKey: 'total' },
        { header: 'Status', dataKey: 'status' },
      ];

      let currentPage = 1;
      for (let i = 0; i < filteredData.length; i += rowsPerPage) {
        if (i > 0) {
          addSignatureField();
          addFooter(currentPage, totalPages);
          doc.addPage();
          currentPage++;
          addLetterhead();
          doc.setFont('times', 'bold');
          doc.setFontSize(16);
          doc.text(reportTitle, pageWidth / 2, 55, { align: 'center' });
        }

        const pageData = filteredData.slice(i, i + rowsPerPage);
        const bodyData = pageData.map((emp) => {
          const salary = calculateSalary(emp);
          return {
            empId: emp.empId || 'N/A',
            name: emp.name || 'Unknown',
            role: emp.isManager ? 'Manager' : 'Employee',
            basic: `Rs. ${salary.basic.toLocaleString()}`,
            workingDays: salary.workingDays.toString(),
            manpower: `Rs. ${salary.manpowerAllowance.toLocaleString()}`,
            other: `Rs. ${(emp.otherAllowance || 0).toLocaleString()}`,
            total: `Rs. ${salary.total.toLocaleString()}`,
            status: emp.salaryStatus || 'Non-Paid',
          };
        });

        // PROFESSIONAL TABLE with Purple Header for Salary Reports
        autoTable(doc, {
          startY: 62,
          columns: columns,
          body: bodyData.map(item => columns.map(col => item[col.dataKey])),
          theme: 'striped',
          margin: { left: 15, right: 15 },
          tableWidth: 'auto',
          headStyles: {
            fillColor: [142, 68, 173],
            textColor: [255, 255, 255],
            fontStyle: 'bold',
            fontSize: 9,
            halign: 'center',
          },
          bodyStyles: {
            textColor: [0, 0, 0],
            fontSize: 8,
            halign: 'center',
          },
          alternateRowStyles: {
            fillColor: [245, 245, 245],
          },
          styles: {
            font: 'times',
            fontSize: 8,
            cellPadding: 2,
            lineColor: [200, 200, 200],
            lineWidth: 0.1,
            overflow: 'linebreak',
            cellWidth: 'wrap',
          },
          columnStyles: {
            0: { cellWidth: 18 },
            1: { cellWidth: 30, halign: 'left' },
            2: { cellWidth: 20 },
            3: { cellWidth: 20 },
            4: { cellWidth: 14 },
            5: { cellWidth: 22 },
            6: { cellWidth: 18 },
            7: { cellWidth: 22 },
            8: { cellWidth: 18 },
          }
        });
      }

      // Add summary on last page
      const finalY = doc.lastAutoTable.finalY + 15;
      const totalSalaries = calculateTotalSalaries();
      const paidCount = filteredData.filter(emp => emp.salaryStatus === 'Paid').length;
      const nonPaidCount = filteredData.filter(emp => emp.salaryStatus === 'Non-Paid').length;

      doc.setFont('times', 'bold');
      doc.setFontSize(12);
      doc.setTextColor(0, 0, 0);
      doc.text(`Total Employees: ${filteredData.length}`, 15, finalY);
      doc.text(`Paid: ${paidCount} | Non-Paid: ${nonPaidCount}`, 15, finalY + 10);
      doc.text(`Total Salaries: Rs. ${totalSalaries.toLocaleString()}`, 15, finalY + 20);

      addSignatureField();
      addFooter(currentPage, totalPages);

      const timestamp = new Date().toISOString().split('T')[0];
      const fileName = `${companyInfo.name}_Salary_Report_${selectedMonth.replace(' ', '_')}_${timestamp}.pdf`;
      doc.save(fileName);
      alert(`Monthly salary report "${fileName}" downloaded successfully!`);
    } catch (error) {
      console.error('Error generating monthly report:', error);
      alert('Error generating monthly report. Please try again.');
    }
  };

  const handleUpdateClick = (emp) => {
    if (selectedMonthIndex < currentMonthIndex) {
      alert('Cannot update salaries for past months.');
      return;
    }
    setEditingId(emp._id);
    setEditForm({
      workingDays: emp.workingDays || 0,
      otherAllowance: emp.otherAllowance || 0,
      salaryStatus: emp.salaryStatus,
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditForm({ ...editForm, [name]: value });
  };

  const saveUpdate = async () => {
    try {
      const emp = employees.find(e => e._id === editingId);
      if (!emp) throw new Error('Employee not found in local state');
      const isManager = emp.isManager;
      const basicSalary = isManager ? 20000 : 10000;
      const perDayManpower = 3000;
      const workingDays = emp.workingDays || 0;
      const manpowerAllowance = perDayManpower * workingDays;
      const newOtherAllowance = parseInt(editForm.otherAllowance) || 0;
      const totalSalary = basicSalary + manpowerAllowance + newOtherAllowance;

      const response = await axios.put(`http://localhost:5000/api/finance/salary/${editingId}`, {
        workingDays,
        otherAllowance: newOtherAllowance,
        salaryStatus: editForm.salaryStatus,
        basicSalary,
        manpowerAllowance,
        totalSalary
      });
      fetchSalaries();
      setEditingId(null);
    } catch (err) {
      setError('Error updating salary. Please check console for details.');
      console.error('Update error:', err.response?.data || err.message);
    }
  };

  const cancelUpdate = () => {
    setEditingId(null);
  };

  const handleMonthChange = (e) => {
    setSelectedMonth(e.target.value);
  };

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  const clearSearch = () => {
    setSearchQuery('');
  };

  const filteredEmployees = getFilteredEmployees();

  return (
    <div id="salaries-content-section">
      <h2 id="salaries-page-title">Manage Salaries</h2>
      <p id="salaries-page-description">View and manage employee salaries based on job assignments for the finance manager.</p>
      
      <div id="salaries-controls-container">
        <div id="month-selection-container">
          <label id="month-selection-label">Select Month: </label>
          <select id="month-dropdown" value={selectedMonth} onChange={handleMonthChange}>
            {months.map(month => (
              <option key={month} value={month}>{month}</option>
            ))}
          </select>
        </div>

        <div id="search-container">
          <input 
            id="employee-search-input"
            type="text" 
            placeholder="Search by Employee ID or Name..."
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

        {/* NEW: Monthly Report Download Button */}
        <button
          id="download-monthly-report-btn"
          onClick={generateMonthlyReport}
          disabled={filteredEmployees.length === 0}
          style={{
            padding: '0.6rem 1.2rem',
            background: 'linear-gradient(135deg, #8e44ad 0%, #9b59b6 100%)',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            fontWeight: '600',
            cursor: filteredEmployees.length === 0 ? 'not-allowed' : 'pointer',
            opacity: filteredEmployees.length === 0 ? 0.6 : 1,
            transition: 'all 0.3s ease'
          }}
        >
          Download Monthly Report
        </button>
      </div>
      
      {error && <p id="salaries-error-message">{error}</p>}
      
      {employees.length > 0 ? (
        <div id="salaries-table-container">
          <div id="search-results-info">
            {searchQuery && (
              <p>Showing {filteredEmployees.length} of {employees.length} employees</p>
            )}
          </div>

          {filteredEmployees.length > 0 ? (
            <table id="salaries-main-table">
              <thead>
                <tr>
                  <th>Employee ID</th>
                  <th>Name</th>
                  <th>Role</th>
                  <th>Month</th>
                  <th>Basic Salary</th>
                  <th>Per Day Manpower</th>
                  <th>Working Days</th>
                  <th>Manpower Allowance</th>
                  <th>Other Allowance</th>
                  <th>Total Salary</th>
                  <th>Salary Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredEmployees.map((emp, index) => {
                  const { basic, perDayManpower, workingDays, manpowerAllowance, total } = calculateSalary(emp);
                  const isEditable = selectedMonthIndex >= currentMonthIndex;
                  return (
                    <tr key={emp._id} id={`salary-employee-row-${index}`}>
                      <td>{emp.empId}</td>
                      <td>{emp.name}</td>
                      <td>
                        <span className={emp.isManager ? 'salary-role-manager' : 'salary-role-employee'}>
                          {emp.isManager ? 'Team Manager' : 'Employee'}
                        </span>
                      </td>
                      <td>{selectedMonth}</td>
                      <td>Rs. {basic.toLocaleString()}</td>
                      <td>Rs. {perDayManpower.toLocaleString()}</td>
                      <td>{workingDays}</td>
                      <td>Rs. {manpowerAllowance.toLocaleString()}</td>
                      <td>Rs. {(emp.otherAllowance || 0).toLocaleString()}</td>
                      <td>Rs. {total.toLocaleString()}</td>
                      <td>
                        <span className={emp.salaryStatus === 'Paid' ? 'salary-status-paid' : 'salary-status-non-paid'}>
                          {emp.salaryStatus}
                        </span>
                      </td>
                      <td>
                        {isEditable && (
                          <button 
                            id={`salary-update-btn-${index}`}
                            className="salary-update-btn" 
                            onClick={() => handleUpdateClick(emp)}
                          >
                            Update
                          </button>
                        )}
                        <button 
                          id={`salary-download-btn-${index}`}
                          className="salary-download-btn" 
                          onClick={() => generatePDF(emp, selectedMonth)}
                        >
                          Download Slip
                        </button>
                      </td>
                    </tr>
                  );
                })}
                <tr id="salaries-total-row">
                  <td colSpan="9">
                    Total Salaries for {selectedMonth}:
                  </td>
                  <td>
                    Rs. {calculateTotalSalaries().toLocaleString()}
                  </td>
                  <td colSpan="2"></td>
                </tr>
              </tbody>
            </table>
          ) : (
            <p id="no-results-message">No employees found matching "{searchQuery}"</p>
          )}
        </div>
      ) : (
        <p id="no-salaries-message">{error || 'No salaries for this month or no staff assigned.'}</p>
      )}
      
      {editingId && (
        <div id="salary-edit-form-container">
          <h3 id="salary-edit-form-title">Edit Employee Salary</h3>
          
          <div className="salary-edit-employee-info">
            <p>Employee ID: {employees.find(emp => emp._id === editingId)?.empId}</p>
            <p>Name: {employees.find(emp => emp._id === editingId)?.name}</p>
            <p>Role: {employees.find(emp => emp._id === editingId)?.isManager ? 'Team Manager' : 'Employee'}</p>
          </div>
          
          <div className="salary-edit-field-container">
            <label htmlFor="working-days-input">Working Days: </label>
            <input 
              id="working-days-input"
              className="salary-edit-input"
              type="number" 
              name="workingDays" 
              value={editForm.workingDays} 
              readOnly 
            />
          </div>
          
          <div className="salary-edit-field-container">
            <label htmlFor="other-allowance-input">Other Allowance: </label>
            <input 
              id="other-allowance-input"
              className="salary-edit-input"
              type="number" 
              name="otherAllowance" 
              value={editForm.otherAllowance} 
              onChange={handleInputChange} 
            />
          </div>
          
          <div className="salary-edit-field-container">
            <label htmlFor="salary-status-select">Salary Status: </label>
            <select 
              id="salary-status-select"
              className="salary-edit-select"
              name="salaryStatus" 
              value={editForm.salaryStatus} 
              onChange={handleInputChange}
            >
              <option value="Paid">Paid</option>
              <option value="Non-Paid">Non-Paid</option>
            </select>
          </div>
          
          <button id="salary-edit-save-btn" onClick={saveUpdate}>
            Save Changes
          </button>
          <button id="salary-edit-cancel-btn" onClick={cancelUpdate}>
            Cancel
          </button>
        </div>
      )}
    </div>
  );
};

export default Salaries;