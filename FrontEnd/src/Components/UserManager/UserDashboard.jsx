import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import Navbar from "../Nav/Navbar";
import Footer from "../Footer/Footer";
import { isAuthenticated, removeAuthToken } from "../../utils/auth";
import "./UserDashboard.css";

// Company Information
const companyInfo = {
  name: "SelfMe",
  address: ["123 Solar Street", "Green City, GC 12345"],
  phone: "+1-800-555-1234",
  email: "support@solarsolutions.com",
  website: "www.solarsolutions.com",
};

const UserDashboard = () => {
  const navigate = useNavigate();
  const [payments, setPayments] = useState([]);
  const [userDetails, setUserDetails] = useState(null);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    nic: '',
    address: '',
    ceboNo: '',
  });
  const [formError, setFormError] = useState(null);

  // Get user data from localStorage
  const authUser = JSON.parse(localStorage.getItem("authUser") || "{}");
  const firstName = authUser.firstName || "User";

  // Check authentication and fetch data
  useEffect(() => {
    if (!isAuthenticated()) {
      removeAuthToken();
      localStorage.removeItem("authUser");
      navigate("/login");
      return;
    }
    fetchPayments();
    fetchUserDetails();
  }, [navigate]);

  // Fetch user details
  const fetchUserDetails = async () => {
    try {
      console.log("🔄 Fetching user details...");
      const token = localStorage.getItem("token");
      if (!token) {
        console.log("❌ No token for user details");
        setError("Please login to view user details");
        return;
      }
      const res = await axios.get("http://localhost:5000/auth/user", {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 10000,
      });
      console.log("✅ User details fetch response:", {
        status: res.status,
        data: res.data,
      });
      setUserDetails(res.data);
      setFormData({
        firstName: res.data.firstName || '',
        lastName: res.data.lastName || '',
        phone: res.data.phone || '',
        nic: res.data.nic || '',
        address: res.data.address || '',
        ceboNo: res.data.ceboNo || '',
      });
    } catch (err) {
      console.error("💥 User details fetch error:", err);
      setError(err.response?.data?.message || "Failed to load user details.");
    }
  };

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    // Restrict phone and ceboNo to numbers only
    if (name === 'phone' || name === 'ceboNo') {
      if (!/^\d*$/.test(value)) return; // Allow only digits
    }
    setFormData({ ...formData, [name]: value });
  };

  // Validate and submit form
  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setFormError(null);

    // Client-side validation
    if (!formData.firstName) {
      setFormError("First name is required");
      return;
    }
    if (formData.phone && !/^\d{10}$/.test(formData.phone)) {
      setFormError("Phone number must be exactly 10 digits");
      return;
    }
    if (formData.nic && !/^[0-9]{9}[vVxX]$|^[0-9]{12}$/.test(formData.nic)) {
      setFormError("Invalid NIC format (9 digits + v/V/x/X or 12 digits)");
      return;
    }
    if (formData.ceboNo && !/^\d{10}$/.test(formData.ceboNo)) {
      setFormError("CEB number must be exactly 10 digits");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const res = await axios.put(
        "http://localhost:5000/auth/user",
        formData,
        {
          headers: { Authorization: `Bearer ${token}` },
          timeout: 10000,
        }
      );
      console.log("✅ Profile update response:", res.data);
      setUserDetails(res.data.user);
      setIsEditing(false);
      localStorage.setItem(
        "authUser",
        JSON.stringify({ ...authUser, firstName: res.data.user.firstName })
      );
    } catch (err) {
      console.error("💥 Profile update error:", err);
      setFormError(err.response?.data?.message || "Failed to update profile.");
    }
  };

  const fetchPayments = async () => {
    try {
      console.log("🔄 Fetching payments...");
      const token = localStorage.getItem("token");
      if (!token) {
        console.log("❌ No token for payments");
        setError("Please login to view payment history");
        return;
      }
      const res = await axios.get("http://localhost:5000/api/payments", {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 10000,
      });
      console.log("✅ Payments fetch response:", {
        status: res.status,
        dataLength: res.data.length,
        sampleData: res.data[0] || "No payments",
      });
      const paymentData = Array.isArray(res.data) ? res.data : [];
      setPayments(paymentData);
    } catch (err) {
      console.error("💥 Payments fetch error:", err);
      setError(err.response?.data?.message || "Failed to load payment history.");
    }
  };

  // ------------------- LOGO CONVERSION -------------------
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

  // ------------------- PROFESSIONAL PDF RECEIPT GENERATION -------------------
  const generateReceiptPDF = async (payment) => {
    try {
      const logoBase64 = await getLogoAsBase64();
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();

      // PROFESSIONAL LETTERHEAD
      if (logoBase64) {
        doc.addImage(logoBase64, "PNG", 15, 15, 30, 30);
      }
      doc.setFont("times", "bold");
      doc.setFontSize(20);
      doc.setTextColor(0, 0, 0);
      doc.text(companyInfo.name, pageWidth / 2, 25, { align: "center" });
      doc.setFont("times", "normal");
      doc.setFontSize(11);
      doc.text(companyInfo.address.join(", "), pageWidth / 2, 32, { align: "center" });
      doc.setFontSize(10);
      doc.text(
        `Phone: ${companyInfo.phone} | Email: ${companyInfo.email} | Website: ${companyInfo.website}`,
        pageWidth / 2,
        38,
        { align: "center" }
      );
      doc.setLineWidth(0.5);
      doc.setDrawColor(0, 0, 0);
      doc.line(15, 45, pageWidth - 15, 45);

      // RECEIPT TITLE
      doc.setFont("times", "bold");
      doc.setFontSize(16);
      doc.text("Payment Receipt", pageWidth / 2, 55, { align: "center" });

      // Customer Information Table
      const fullName = userDetails 
        ? `${userDetails.firstName || ""} ${userDetails.lastName || ""}`.trim() || "N/A"
        : "N/A";

      const customerInfoData = [
        ['Customer Name', fullName],
        ['Email', userDetails?.email || 'N/A'],
        ['Phone', userDetails?.phone || 'N/A'],
        ['Address', userDetails?.address || 'N/A'],
        ['CEB Number', userDetails?.ceboNo || 'N/A'],
      ];

      autoTable(doc, {
        startY: 65,
        body: customerInfoData,
        theme: 'plain',
        styles: {
          font: 'times',
          fontSize: 10,
          cellPadding: 4,
        },
        columnStyles: {
          0: { fontStyle: 'bold', cellWidth: 50 },
          1: { cellWidth: 120 }
        }
      });

      // Payment Information Table
      const paymentInfoData = [
        ['Payment ID', payment.payment_id || 'N/A'],
        ['Payment Date', payment.payment_date ? new Date(payment.payment_date).toLocaleDateString("en-GB") : 'N/A'],
        ['Payment Status', payment.status || 'N/A'],
      ];

      autoTable(doc, {
        startY: doc.lastAutoTable.finalY + 10,
        body: paymentInfoData,
        theme: 'plain',
        styles: {
          font: 'times',
          fontSize: 10,
          cellPadding: 4,
        },
        columnStyles: {
          0: { fontStyle: 'bold', cellWidth: 50 },
          1: { cellWidth: 120 }
        }
      });

      // Items Table
      const items = payment.items || [
        { item_name: "Solar Package", quantity: 1, subtotal: payment.amount }
      ];

      const itemsData = items.map((item, index) => [
        String(index + 1),
        item.item_name || "Product",
        String(item.quantity || 1),
        `Rs. ${Number(item.subtotal || 0).toLocaleString()}`
      ]);

      autoTable(doc, {
        startY: doc.lastAutoTable.finalY + 10,
        head: [['#', 'Item Description', 'Quantity', 'Amount']],
        body: itemsData,
        theme: 'striped',
        headStyles: {
          fillColor: [22, 160, 133],
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          fontSize: 10,
        },
        bodyStyles: {
          textColor: [0, 0, 0],
          fontSize: 9,
        },
        alternateRowStyles: {
          fillColor: [245, 245, 245],
        },
        styles: {
          font: 'times',
          cellPadding: 3,
          lineColor: [200, 200, 200],
          lineWidth: 0.1,
        },
        columnStyles: {
          0: { cellWidth: 15, halign: 'center' },
          1: { cellWidth: 90, halign: 'left' },
          2: { cellWidth: 25, halign: 'center' },
          3: { cellWidth: 40, halign: 'right' },
        }
      });

      // Calculate totals
      const subtotal = payment.amount || 0;
      const taxAmount = Math.round(subtotal * 0.085);
      const grandTotal = subtotal + taxAmount;

      // Summary Table
      const summaryData = [
        ['Subtotal', `Rs. ${subtotal.toLocaleString()}`],
        ['Tax (8.5%)', `Rs. ${taxAmount.toLocaleString()}`],
      ];

      autoTable(doc, {
        startY: doc.lastAutoTable.finalY + 5,
        body: summaryData,
        foot: [['Grand Total', `Rs. ${grandTotal.toLocaleString()}`]],
        theme: 'plain',
        footStyles: {
          fillColor: [22, 160, 133],
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          fontSize: 11,
        },
        bodyStyles: {
          textColor: [0, 0, 0],
          fontSize: 10,
        },
        styles: {
          font: 'times',
          cellPadding: 3,
          lineColor: [200, 200, 200],
          lineWidth: 0.1,
        },
        columnStyles: {
          0: { fontStyle: 'bold', cellWidth: 130, halign: 'right' },
          1: { cellWidth: 40, halign: 'right' }
        }
      });

      // Thank You Message
      const finalY = doc.lastAutoTable.finalY + 15;
      doc.setFont("times", "italic");
      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);
      doc.text("Thank you for choosing our solar solutions!", pageWidth / 2, finalY, { align: "center" });

      // Signature Field
      doc.setFont("times", "normal");
      doc.setFontSize(10);
      doc.text("Authorized Signature: __________________", pageWidth - 85, pageHeight - 30);

      // Footer
      doc.setFont("times", "normal");
      doc.setFontSize(8);
      doc.setTextColor(50, 50, 50);
      doc.setLineWidth(0.3);
      doc.setDrawColor(150, 150, 150);
      doc.line(15, pageHeight - 20, pageWidth - 15, pageHeight - 20);
      const footerText = `Generated by ${companyInfo.name} Payment System`;
      doc.text(footerText, pageWidth / 2, pageHeight - 15, { align: "center" });
      const genDate = new Date().toLocaleDateString("en-GB");
      const genTime = new Date().toLocaleTimeString("en-GB", { hour12: false });
      doc.text(`Generated on ${genDate} at ${genTime}`, 15, pageHeight - 10);
      doc.text("Page 1 of 1", pageWidth - 15, pageHeight - 10, { align: "right" });

      // Save PDF
      const timestamp = new Date().toISOString().split("T")[0];
      const fileName = `${companyInfo.name}_Receipt_${payment.payment_id}_${timestamp}.pdf`;
      doc.save(fileName);
      console.log(`✅ Receipt "${fileName}" downloaded successfully!`);
    } catch (error) {
      console.error("💥 Error generating receipt PDF:", error);
      setError("Error generating receipt. Please try again.");
    }
  };

  // ------------------- HANDLE DOWNLOAD RECEIPT -------------------
  const handleDownloadReceipt = async (payment) => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(`http://localhost:5000/api/receipt/${payment.payment_id}`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: "blob",
        timeout: 10000,
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `receipt_${payment.payment_id}.pdf`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("💥 Receipt download error:", err);
      if (err.response?.status === 404) {
        console.log("Falling back to client-side PDF generation...");
        await generateReceiptPDF(payment);
      } else {
        setError(err.response?.data?.message || "Failed to download receipt. Please try again.");
      }
    }
  };

  console.log("📊 Rendering UserDashboard - payments:", payments.length, "userDetails:", userDetails, "error:", error);

  return (
    <div id="user-dashboard-main">
      <Navbar />
      <div id="user-dashboard-content">
        <div id="dashboard-welcome-header">
          <h2>Welcome to Your Dashboard, {firstName}!</h2>
          <div id="dashboard-welcome-info">
            <p>Your solar journey starts here! Explore our packages or check your cart to continue.</p>
          </div>
        </div>

        {/* User Details Section */}
        <div id="user-details-container">
          <div className="profile-header-with-actions">
            <div id="user-details-header">
              <h3>Your Profile</h3>
            </div>
            {userDetails && !isEditing && (
              <div className="profile-header-actions">
                <button
                  className="btn-edit-compact"
                  onClick={() => setIsEditing(true)}
                >
                  ✏️ Edit Profile
                </button>
              </div>
            )}
          </div>
          
          {(error || formError) && (
            <div id="user-details-error">
              {formError || (userDetails === null && error)}
            </div>
          )}
          
          {userDetails ? (
            isEditing ? (
              <form id="user-profile-form" onSubmit={handleUpdateProfile}>
                <div className="form-group">
                  <label>User ID (Read-only):</label>
                  <input
                    type="text"
                    value={userDetails.userid || "N/A"}
                    disabled
                  />
                </div>
                <div className="form-group">
                  <label>First Name:</label>
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Last Name:</label>
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="form-group">
                  <label>Email (Read-only):</label>
                  <input
                    type="email"
                    value={userDetails.email || "N/A"}
                    disabled
                  />
                </div>
                <div className="form-group">
                  <label>Phone:</label>
                  <input
                    type="text"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    maxLength={10}
                    placeholder="e.g., 1234567890"
                  />
                </div>
                <div className="form-group">
                  <label>NIC:</label>
                  <input
                    type="text"
                    name="nic"
                    value={formData.nic}
                    onChange={handleInputChange}
                    placeholder="e.g., 123456789V or 123456789123"
                  />
                </div>
                <div className="form-group">
                  <label>Address:</label>
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="form-group">
                  <label>Date of Birth (Read-only):</label>
                  <input
                    type="date"
                    value={userDetails.dob ? new Date(userDetails.dob).toISOString().split('T')[0] : ''}
                    disabled
                  />
                </div>
                <div className="form-group">
                  <label>CEB Number:</label>
                  <input
                    type="text"
                    name="ceboNo"
                    value={formData.ceboNo}
                    onChange={handleInputChange}
                    maxLength={10}
                    placeholder="e.g., 1234567890"
                  />
                </div>
                
                <div className="form-actions">
                  <button type="submit" className="btn-save">
                    💾 Save Changes
                  </button>
                  <button
                    type="button"
                    className="btn-cancel"
                    onClick={() => setIsEditing(false)}
                  >
                    ❌ Cancel
                  </button>
                </div>
              </form>
            ) : (
              <div>
                <div id="user-profile-display">
                  <div className="profile-info-card">
                    <strong>User ID</strong>
                    <span>{userDetails.userid || "N/A"}</span>
                  </div>
                  <div className="profile-info-card">
                    <strong>Full Name</strong>
                    <span>{userDetails.firstName} {userDetails.lastName || ""}</span>
                  </div>
                  <div className="profile-info-card">
                    <strong>Email</strong>
                    <span>{userDetails.email || "N/A"}</span>
                  </div>
                  <div className="profile-info-card">
                    <strong>Phone</strong>
                    <span>{userDetails.phone || "N/A"}</span>
                  </div>
                  <div className="profile-info-card">
                    <strong>NIC</strong>
                    <span>{userDetails.nic || "N/A"}</span>
                  </div>
                  <div className="profile-info-card">
                    <strong>Address</strong>
                    <span>{userDetails.address || "N/A"}</span>
                  </div>
                  <div className="profile-info-card">
                    <strong>Date of Birth</strong>
                    <span>{userDetails.dob ? new Date(userDetails.dob).toLocaleDateString("en-GB") : "N/A"}</span>
                  </div>
                  <div className="profile-info-card">
                    <strong>CEB Number</strong>
                    <span>{userDetails.ceboNo || "N/A"}</span>
                  </div>
                  <div className="profile-info-card">
                    <strong>Account Created</strong>
                    <span>{userDetails.createdAt ? new Date(userDetails.createdAt).toLocaleDateString("en-GB") : "N/A"}</span>
                  </div>
                </div>
              </div>
            )
          ) : (
            <div id="user-profile-loading">
              Loading user details...
            </div>
          )}
        </div>

        {/* Payment History Section */}
        <div id="payment-history-container">
          <div id="payment-history-header">
            <h2>Payment History</h2>
          </div>
          {error && payments.length === 0 && (
            <div id="user-details-error">{error}</div>
          )}
          {payments.length > 0 ? (
            <table id="payment-table">
              <thead>
                <tr>
                  <th>Payment ID</th>
                  <th>Amount</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th>Slip</th>
                  <th>Receipt</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((payment, index) => (
                  <tr key={payment.payment_id || `payment-${index}`}>
                    <td>{payment.payment_id}</td>
                    <td>
                      Rs. {(payment.amount || 0).toLocaleString()}
                    </td>
                    <td>
                      {payment.payment_date
                        ? new Date(payment.payment_date).toLocaleDateString()
                        : "N/A"}
                    </td>
                    <td>
                      <span
                        className={
                          payment.status === "Pending"
                            ? "status-pending"
                            : payment.status === "Paid"
                            ? "status-paid"
                            : "status-failed"
                        }
                      >
                        {payment.status}
                      </span>
                    </td>
                    <td>
                      {payment.reference_no ? (
                        <a
                          href={`http://localhost:5000${payment.reference_no}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <img
                            className="slip-image"
                            src={`http://localhost:5000${payment.reference_no}`}
                            alt="Payment Slip"
                            onError={(e) => {
                              e.target.src =
                                "https://via.placeholder.com/50x50/007BFF/FFFFFF?text=Slip";
                              console.log(
                                "🖼️ Slip image load error for payment:",
                                payment.payment_id
                              );
                            }}
                          />
                        </a>
                      ) : (
                        "No Slip"
                      )}
                    </td>
                    <td>
                      {payment.status === "Paid" ? (
                        <button
                          className="btn-receipt"
                          onClick={() => handleDownloadReceipt(payment)}
                        >
                          📄 Download Receipt
                        </button>
                      ) : payment.status === "Pending" ? (
                        <span className="waiting-approval">
                          ⏳ Waiting for Approval
                        </span>
                      ) : (
                        "N/A"
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div id="payment-empty-state">
              No payment history available.
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default UserDashboard;