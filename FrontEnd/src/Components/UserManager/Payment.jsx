import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import Navbar from "../Nav/Navbar";
import Footer from "../Footer/Footer";
import "./Payment.css";

function Payment() {
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [slipFile, setSlipFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  const companyInfo = {
    name: "SelfMe",
    address: ["123 Solar Street", "Green City, GC 12345"],
    phone: "+1-800-555-1234",
    email: "support@solarsolutions.com",
    website: "www.solarsolutions.com",
  };

  useEffect(() => {
    console.log("💳 Payment component mounted");
    fetchCart();
  }, []);

  const fetchCart = async () => {
    try {
      console.log("🔄 Fetching cart...");
      setLoading(true);
      setError(null);
      const token = localStorage.getItem("token");
      if (!token) {
        console.log("❌ No token found");
        setError("Please login to proceed with payment");
        setLoading(false);
        return;
      }
      const res = await axios.get("http://localhost:5000/api/cart", {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 10000,
      });
      console.log("✅ Cart fetch response:", {
        status: res.status,
        dataLength: res.data.length,
        sampleData: res.data[0] || "No items",
      });
      const items = Array.isArray(res.data) ? res.data : [];
      setCartItems(items);
    } catch (err) {
      console.error("💥 Cart fetch error:", err);
      let errorMessage = "Failed to load cart items.";
      if (err.response) {
        errorMessage = err.response.data?.message || `Server error (${err.response.status})`;
      } else if (err.request) {
        errorMessage = "Cannot connect to server.";
      }
      setError(errorMessage);
    } finally {
      setLoading(false);
      console.log("🏁 Cart fetch complete");
    }
  };

  const totalAmount = cartItems.reduce((sum, item) => sum + (Number(item.subtotal) || 0), 0);
  const taxAmount = Math.round(totalAmount * 0.085);
  const grandTotal = totalAmount + taxAmount;

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    console.log("📁 File selected:", file?.name);
    setSlipFile(file);
    if (file) {
      e.target.classList.add('payment-file-selected');
    } else {
      e.target.classList.remove('payment-file-selected');
    }
  };

  const handleSubmitPayment = async () => {
    if (!slipFile) {
      console.log("❌ No slip uploaded");
      setError("Please upload bank transfer slip");
      return;
    }
    if (!cartItems.length) {
      console.log("❌ Empty cart");
      setError("Cart is empty. Add items before making a payment.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        console.log("❌ No token for payment submission");
        setError("Session expired. Please login again.");
        localStorage.removeItem("token");
        setTimeout(() => navigate("/login"), 1500);
        return;
      }
      const formData = new FormData();
      formData.append("amount", grandTotal);
      formData.append("payment_method", "Bank Transfer");
      formData.append("payment_date", new Date().toISOString());
      formData.append("status", "Pending");
      formData.append("slip", slipFile);
      console.log("📤 Submitting payment...");
      const response = await axios.post("http://localhost:5000/api/payments", formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
        timeout: 10000,
      });
      console.log("✅ Payment submitted:", response.data);
      alert(`Payment submitted successfully! Your Payment ID is: ${response.data.payment.payment_id}. Waiting for admin review.`);
      navigate("/?view=dashboard");
    } catch (err) {
      console.error("💥 Payment submission error:", err);
      let errorMessage = "Failed to submit payment.";
      if (err.response) {
        errorMessage = err.response.data.message || `Server error (${err.response.status})`;
      } else if (err.request) {
        errorMessage = "Cannot connect to server.";
      }
      setError(errorMessage);
    } finally {
      setSubmitting(false);
      console.log("🏁 Payment submission complete");
    }
  };

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

  // ------------------- PROFESSIONAL INVOICE PDF GENERATION -------------------
  const generatePDF = async (data, title) => {
    if (!data.length) return alert('No items to download!');
    
    try {
      const logoBase64 = await getLogoAsBase64();
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();

      // PROFESSIONAL LETTERHEAD
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

      // INVOICE TITLE
      doc.setFont('times', 'bold');
      doc.setFontSize(16);
      doc.text('INVOICE', pageWidth / 2, 55, { align: 'center' });

      // Invoice Information
      const invoiceId = `INV-${Date.now()}`;
      const invoiceDate = new Date().toLocaleDateString('en-GB');

      const invoiceInfoData = [
        ['Invoice ID', invoiceId],
        ['Invoice Date', invoiceDate],
        ['Payment Method', 'Bank Transfer'],
        ['Status', 'Pending Payment'],
      ];

      autoTable(doc, {
        startY: 65,
        body: invoiceInfoData,
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
      const itemsData = data.map((item, index) => [
        String(index + 1),
        item.itemId?.item_name || 'Solar Product',
        String(item.quantity || 1),
        `Rs. ${(item.unit_price || 0).toLocaleString()}`,
        `Rs. ${(item.subtotal || 0).toLocaleString()}`
      ]);

      autoTable(doc, {
        startY: doc.lastAutoTable.finalY + 10,
        head: [['#', 'Item Description', 'Qty', 'Unit Price', 'Subtotal']],
        body: itemsData,
        theme: 'striped',
        margin: { left: 15, right: 15 },
        tableWidth: 'auto',
        headStyles: {
          fillColor: [22, 160, 133],
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          fontSize: 10,
          halign: 'center',
        },
        bodyStyles: {
          textColor: [0, 0, 0],
          fontSize: 9,
          halign: 'center',
        },
        alternateRowStyles: {
          fillColor: [245, 245, 245],
        },
        styles: {
          font: 'times',
          cellPadding: 3,
          lineColor: [200, 200, 200],
          lineWidth: 0.1,
          overflow: 'linebreak',
          cellWidth: 'wrap',
        },
        columnStyles: {
          0: { cellWidth: 15 },
          1: { cellWidth: 70, halign: 'left' },
          2: { cellWidth: 20 },
          3: { cellWidth: 35, halign: 'right' },
          4: { cellWidth: 35, halign: 'right' },
        }
      });

      // Summary Table
      const summaryData = [
        ['Subtotal', `Rs. ${totalAmount.toLocaleString()}`],
        ['Tax (8.5%)', `Rs. ${taxAmount.toLocaleString()}`],
      ];

      autoTable(doc, {
        startY: doc.lastAutoTable.finalY + 5,
        body: summaryData,
        foot: [['Grand Total', `Rs. ${grandTotal.toLocaleString()}`]],
        theme: 'plain',
        margin: { left: 15, right: 15 },
        footStyles: {
          fillColor: [22, 160, 133],
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          fontSize: 12,
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
          0: { fontStyle: 'bold', cellWidth: 140, halign: 'right' },
          1: { cellWidth: 35, halign: 'right' }
        }
      });

      // Payment Instructions
      const finalY = doc.lastAutoTable.finalY + 15;
      doc.setFont('times', 'bold');
      doc.setFontSize(11);
      doc.text('Payment Instructions:', 15, finalY);
      doc.setFont('times', 'normal');
      doc.setFontSize(9);
      doc.text('1. Transfer the grand total amount to our bank account', 15, finalY + 7);
      doc.text('2. Upload the bank transfer slip on the payment page', 15, finalY + 14);
      doc.text('3. Your order will be processed once payment is verified', 15, finalY + 21);

      // Thank You Message
      doc.setFont('times', 'italic');
      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);
      doc.text('Thank you for choosing our solar solutions!', pageWidth / 2, finalY + 35, { align: 'center' });

      // Signature Field
      doc.setFont('times', 'normal');
      doc.setFontSize(10);
      doc.text('Authorized Signature: __________________', pageWidth - 85, pageHeight - 30);

      // Footer
      doc.setFont('times', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(50, 50, 50);
      doc.setLineWidth(0.3);
      doc.setDrawColor(150, 150, 150);
      doc.line(15, pageHeight - 20, pageWidth - 15, pageHeight - 20);
      const footerText = `Generated by ${companyInfo.name} Invoice System`;
      doc.text(footerText, pageWidth / 2, pageHeight - 15, { align: 'center' });
      const genDate = new Date().toLocaleDateString('en-GB');
      const genTime = new Date().toLocaleTimeString('en-GB', { hour12: false });
      doc.text(`Generated on ${genDate} at ${genTime}`, 15, pageHeight - 10);
      doc.text('Page 1 of 1', pageWidth - 15, pageHeight - 10, { align: 'right' });

      // Save PDF
      const timestamp = new Date().toISOString().split('T')[0];
      const fileName = `${companyInfo.name}_Invoice_${invoiceId}_${timestamp}.pdf`;
      doc.save(fileName);
      console.log("✅ Invoice PDF generated");
      alert(`Invoice "${fileName}" downloaded successfully!`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Error generating PDF. Please try again.');
    }
  };

  const handleDownloadInvoice = () => generatePDF(cartItems, 'Invoice');

  console.log("📊 Rendering Payment - cartItems:", cartItems.length, "loading:", loading, "error:", error);
  
  return (
    <div className="payment-main-container">
      <Navbar />
      <div className="payment-content-wrapper">
        <div className="payment-card">
          <div className="payment-header">
            <h1 className="payment-title">💳 Payment</h1>
          </div>
          
          {loading && (
            <div className="payment-loading">
              Loading your cart items...
            </div>
          )}
          
          {error && (
            <div className="payment-error">
              {error}
            </div>
          )}
          
          {!loading && (
            <>
              {/* Cart Summary Section */}
              <div className="payment-summary-section">
                <h2 className="payment-summary-title">Cart Summary</h2>
                
                {cartItems.length > 0 ? (
                  <>
                    <table className="payment-cart-table">
                      <thead className="payment-table-header">
                        <tr>
                          <th>Item</th>
                          <th>Quantity</th>
                          <th>Unit Price</th>
                          <th>Subtotal</th>
                        </tr>
                      </thead>
                      <tbody>
                        {cartItems.map((item, index) => (
                          <tr key={item._id || `item-${index}`} className="payment-table-row">
                            <td className="payment-item-cell">
                              <div className="payment-item-content">
                                {item.itemId?.item_image ? (
                                  <img
                                    src={`http://localhost:5000${item.itemId.item_image}`}
                                    alt={item.itemId?.item_name || "Product"}
                                    className="payment-item-image"
                                    onError={(e) => {
                                      e.target.src = "https://via.placeholder.com/60x60/81c784/FFFFFF?text=SOLAR";
                                    }}
                                  />
                                ) : (
                                  <div className="payment-item-placeholder">
                                    No Image
                                  </div>
                                )}
                                <span className="payment-item-name">
                                  {item.itemId?.item_name || "Solar Product"}
                                </span>
                              </div>
                            </td>
                            <td className="payment-quantity-cell">
                              {item.quantity || 1}
                            </td>
                            <td className="payment-price-cell">
                              <span className="payment-unit-price">
                                Rs. {(item.unit_price || 0).toLocaleString()}
                              </span>
                            </td>
                            <td className="payment-subtotal-cell">
                              <span className="payment-item-subtotal">
                                Rs. {(item.subtotal || 0).toLocaleString()}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    
                    <div className="payment-total-summary">
                      <div className="payment-subtotal">
                        Subtotal: Rs. {totalAmount.toLocaleString()}
                      </div>
                      <div className="payment-tax">
                        Tax (8.5%): Rs. {taxAmount.toLocaleString()}
                      </div>
                      <div className="payment-grand-total">
                        Grand Total: Rs. {grandTotal.toLocaleString()}
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="payment-empty-cart">
                    <div className="payment-empty-icon">🛒</div>
                    <p className="payment-empty-text">Your cart is empty.</p>
                  </div>
                )}
              </div>

              {/* Payment Form Section */}
              <div className="payment-form-section">
                <h2 className="payment-form-title">Submit Payment</h2>
                
                <div className="payment-method-info">
                  <span className="payment-method-label">Payment Method: Bank Transfer</span>
                  <p className="payment-method-desc">
                    Please transfer the amount to our bank account and upload the transfer slip below.
                  </p>
                </div>
                
                <div className="payment-file-upload">
                  <label className="payment-file-label">
                    Upload Bank Transfer Slip:
                  </label>
                  <input
                    type="file"
                    onChange={handleFileChange}
                    accept="application/pdf,image/jpeg,image/png"
                    className="payment-file-input"
                  />
                  <span className="payment-file-hint">
                    Accepted formats: PDF, JPEG, PNG (Max: 5MB)
                  </span>
                </div>
                
                <div className="payment-action-buttons">
                  <button
                    onClick={handleSubmitPayment}
                    disabled={submitting || !cartItems.length}
                    className="payment-submit-btn"
                  >
                    {submitting ? "⏳ Submitting..." : "💳 Submit Payment"}
                  </button>
                  
                  <button
                    onClick={handleDownloadInvoice}
                    disabled={!cartItems.length}
                    className="payment-download-btn"
                  >
                    📄 Download Invoice
                  </button>
                  
                  <button
                    onClick={() => navigate("/?view=cart")}
                    className="payment-back-btn"
                  >
                    ← Back to Cart
                  </button>
                </div>
              </div>

              <div className="payment-security-footer">
                <p>🔒 Secure payment processing • 📧 Payment confirmation will be sent via email</p>
              </div>
            </>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
}

export default Payment;