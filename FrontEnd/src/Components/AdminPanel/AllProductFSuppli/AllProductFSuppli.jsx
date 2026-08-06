// Updated FrontEnd/src/Components/AdminPanel/AllProductFSuppli/AllProductFSuppli.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { removeAuthToken } from '../../../utils/auth';
import axios from 'axios';
import { Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js';
import jsPDF from 'jspdf';
import Nav from '../../Nav/Nav';
import './AllProductFSuppli.css';

ChartJS.register(ArcElement, Tooltip, Legend);

const URL = 'http://localhost:5000/products';
const SUPPLIERS_URL = 'http://localhost:5000/suppliers';

function AllProductFSuppli() {
  const navigate = useNavigate();
  const authUser = JSON.parse(localStorage.getItem('authUser') || '{}');
  const firstName = authUser.firstName || 'Admin';

  const handleLogout = () => {
    removeAuthToken();
    localStorage.removeItem('authUser');
    navigate('/login');
  };

  // ------------------- STATES -------------------
  const [products, setProducts] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFields, setSelectedFields] = useState({
    serial_number: true,
    item_name: true,
    category: true,
    quantity_in_stock: true,
    re_order_level: true,
    supplier_name: true,
    purchase_price: true,
    selling_price: true,
    status: true,
  });

  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [currentProductId, setCurrentProductId] = useState(null);
  const [formData, setFormData] = useState({
    serial_number: "",
    item_name: "",
    category: "",
    description: "",
    quantity_in_stock: "",
    re_order_level: "",
    supplier_name: "",
    purchase_price: "",
    selling_price: "",
    status: "Available",
    product_remark: "",
  });
  const [itemImage, setItemImage] = useState(null);
  const [errors, setErrors] = useState({});

  const categories = [
    "Solar Panels",
    "Solar Batteries",
    "Solar Inverters",
    "Solar Controllers",
    "Solar Wires & Cables",
    "Mounting Structures & Accessories",
    "Solar Lights & Devices",
    "Solar Pumps & Appliances",
    "Monitoring & Miscellaneous Accessories",
    "Selfme Pakages",
  ];

  const statusOptions = ["Available", "Coming Soon", "Damaged", "Returned"];

  // ------------------- COMPANY INFORMATION -------------------
  const companyInfo = {
    name: 'SelfMe',
    tagline: 'FUTURE OF SUN - SOLAR POWER',
    address: ['No/346, Madalanda, Dompe,', 'Colombo, Sri Lanka'],
    phone: '+94 717 882 883',
    email: 'Selfmepvtltd@gmail.com',
    website: 'www.selfme.com',
  };

  // ------------------- FETCH DATA -------------------
  const fetchProducts = async () => {
    try {
      const res = await axios.get(URL);
      setProducts(res.data);
    } catch (err) {
      console.error('Error fetching products:', err);
      setProducts([]);
    }
  };

  const fetchSuppliers = async () => {
    try {
      const res = await axios.get(SUPPLIERS_URL);
      setSuppliers(res.data.filter((s) => s.status === "Active"));
    } catch (err) {
      console.error("Error fetching suppliers:", err);
      setSuppliers([]);
    }
  };

  useEffect(() => {
    fetchProducts();
    fetchSuppliers();
  }, []);

  // ------------------- CHART DATA -------------------
  const categoryData = useMemo(() => {
    const categoryCounts = {};
    products.forEach(product => {
      const cat = product.category || 'Unknown';
      categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
    });

    return {
      labels: Object.keys(categoryCounts),
      datasets: [{
        data: Object.values(categoryCounts),
        backgroundColor: [
          '#FF6384',
          '#36A2EB',
          '#FFCE56',
          '#4BC0C0',
          '#9966FF',
          '#FF9F40',
          '#FF6384',
          '#C9CBCF',
          '#4BC0C0',
        ],
        borderWidth: 1,
      }],
    };
  }, [products]);

  const statusData = useMemo(() => {
    const statusCounts = {};
    products.forEach(product => {
      const stat = product.status || 'Unknown';
      statusCounts[stat] = (statusCounts[stat] || 0) + 1;
    });

    return {
      labels: Object.keys(statusCounts),
      datasets: [{
        data: Object.values(statusCounts),
        backgroundColor: [
          '#36A2EB',
          '#FFCE56',
          '#FF6384',
          '#4BC0C0',
        ],
        borderWidth: 1,
      }],
    };
  }, [products]);

  const selfmePackagesStatusData = useMemo(() => {
    const filteredProducts = products.filter(p => p.category === "Selfme Pakages");
    const statusCounts = {};
    filteredProducts.forEach(product => {
      const stat = product.status || 'Unknown';
      statusCounts[stat] = (statusCounts[stat] || 0) + 1;
    });

    return {
      labels: Object.keys(statusCounts),
      datasets: [{
        data: Object.values(statusCounts),
        backgroundColor: [
          '#36A2EB',
          '#FFCE56',
          '#FF6384',
          '#4BC0C0',
        ],
        borderWidth: 1,
      }],
    };
  }, [products]);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Product Distribution by Category',
      },
    },
  };

  const statusOptionsChart = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Product Status Distribution',
      },
    },
  };

  const selfmeChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Selfme Packages Status Distribution',
      },
    },
  };

  // ------------------- MODAL HANDLERS -------------------
  const openAddModal = () => {
    setFormData({
      serial_number: "",
      item_name: "",
      category: "",
      description: "",
      quantity_in_stock: "",
      re_order_level: "",
      supplier_name: "",
      purchase_price: "",
      selling_price: "",
      status: "Available",
      product_remark: "",
    });
    setItemImage(null);
    setErrors({});
    setIsEdit(false);
    setCurrentProductId(null);
    setShowModal(true);
  };

  const openEditModal = (product) => {
    setFormData({
      serial_number: product.serial_number || "",
      item_name: product.item_name || "",
      category: product.category || "",
      description: product.description || "",
      quantity_in_stock: product.quantity_in_stock || "",
      re_order_level: product.re_order_level || "",
      supplier_name: product.supplier_name || "",
      purchase_price: product.purchase_price || "",
      selling_price: product.selling_price || "",
      status: product.status || "Available",
      product_remark: product.product_remark || "",
    });
    setItemImage(null);
    setErrors({});
    setIsEdit(true);
    setCurrentProductId(product._id);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
  };

  // ------------------- FORM HANDLERS -------------------
  const handleChange = (e) => {
    const { name, value } = e.target;
    let processedValue = value;

    switch (name) {
      case "quantity_in_stock":
      case "re_order_level": {
        if (value === "") {
          processedValue = "";
        } else {
          const numValue = parseInt(value);
          if (!isNaN(numValue) && numValue > 0 && numValue <= 500) {
            processedValue = numValue.toString();
          } else if (numValue > 500) {
            processedValue = "500";
          } else if (numValue <= 0) {
            processedValue = "";
          }
        }
        break;
      }

      case "purchase_price":
      case "selling_price": {
        if (value === "") {
          processedValue = "";
        } else {
          const cleanValue = value.replace(/[^\d.]/g, "");
          const parts = cleanValue.split(".");
          if (parts.length > 2) {
            processedValue = parts[0] + "." + parts.slice(1).join("");
          } else if (parts.length === 2) {
            processedValue = parts[0] + "." + parts[1].slice(0, 2);
          } else {
            processedValue = cleanValue;
          }

          const numValue = parseFloat(processedValue);
          if (!isNaN(numValue) && numValue <= 0) {
            processedValue = "";
          }
        }
        break;
      }

      default:
        processedValue = value;
    }

    setFormData((prev) => ({ ...prev, [name]: processedValue }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
    if (name === "quantity_in_stock" || name === "re_order_level") {
      validateReorderLevel();
    }
    if (name === "purchase_price" || name === "selling_price") {
      validatePrices();
    }
  };

  const validateReorderLevel = () => {
    const quantity = parseInt(formData.quantity_in_stock) || 0;
    const reorderLevel = parseInt(formData.re_order_level) || 0;
    if (reorderLevel > quantity) {
      setErrors((prev) => ({
        ...prev,
        re_order_level:
          "Re-order level cannot be greater than quantity in stock",
      }));
    } else {
      setErrors((prev) => ({ ...prev, re_order_level: "" }));
    }
  };

  const validatePrices = () => {
    const purchase = parseFloat(formData.purchase_price) || 0;
    const selling = parseFloat(formData.selling_price) || 0;
    if (selling < purchase) {
      setErrors((prev) => ({
        ...prev,
        selling_price: "Selling price must be greater than or equal to purchase price",
      }));
    } else {
      setErrors((prev) => ({ ...prev, selling_price: "" }));
    }
  };

  const handleFileChange = (e) => {
    setItemImage(e.target.files[0]);
  };

  const generateSerialNumber = () => {
    const sn = `SN-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    setFormData((prev) => ({ ...prev, serial_number: sn }));
  };

  const formatPrice = (price) => {
    if (price === "" || price === null || price === undefined) return "";
    const num = parseFloat(price);
    return isNaN(num) ? "" : num.toFixed(2);
  };

  const handlePriceBlur = (e) => {
    const { name, value } = e.target;
    if (value && value !== "") {
      const formattedValue = formatPrice(value);
      setFormData((prev) => ({ ...prev, [name]: formattedValue }));
    }
  };

  // Form validation
  const validateForm = () => {
    const newErrors = {};

    if (!formData.serial_number) {
      newErrors.serial_number = "Serial number required";
    }

    if (!formData.item_name) {
      newErrors.item_name = "Product name required";
    }

    if (!formData.category) newErrors.category = "Select a category";

    if (!formData.quantity_in_stock) {
      newErrors.quantity_in_stock = "Quantity must be greater than 0";
    }

    if (!formData.re_order_level) {
      newErrors.re_order_level = "Re-order level must be greater than 0";
    } else if (
      parseInt(formData.re_order_level) >
      parseInt(formData.quantity_in_stock || 0)
    ) {
      newErrors.re_order_level =
        "Re-order level cannot be greater than quantity in stock";
    }

    if (!formData.supplier_name) newErrors.supplier_name = "Select a supplier";

    if (!formData.purchase_price) {
      newErrors.purchase_price = "Purchase price must be greater than 0";
    }

    if (!formData.selling_price) {
      newErrors.selling_price = "Selling price must be greater than 0";
    } else if (parseFloat(formData.selling_price) < parseFloat(formData.purchase_price || 0)) {
      newErrors.selling_price = "Selling price must be greater than or equal to purchase price";
    }

    if ((formData.status === "Damaged" || formData.status === "Returned") && !formData.product_remark) {
      newErrors.product_remark = "Remark required for this status";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      const data = new FormData();
      const numericFields = [
        "quantity_in_stock",
        "re_order_level",
        "purchase_price",
        "selling_price",
      ];
      Object.keys(formData).forEach((key) => {
        let value = formData[key];
        if (numericFields.includes(key)) {
          value = value === "" ? null : Number(value);
        }
        data.append(key, value);
      });

      if (itemImage) data.append("item_image", itemImage);

      let response;
      if (isEdit && currentProductId) {
        response = await axios.put(`${URL}/${currentProductId}`, data, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      } else {
        response = await axios.post(URL, data, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      }

      alert(isEdit ? "Product updated successfully!" : "Product added successfully!");
      closeModal();
      fetchProducts();
    } catch (error) {
      if (error.response?.data?.code === 11000) {
        alert("Error: Serial Number already exists!");
      } else {
        alert(isEdit ? "Error updating product" : "Error adding product");
      }
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this product?")) return;

    try {
      await axios.delete(`${URL}/${id}`);
      alert("Product deleted successfully!");
      fetchProducts();
    } catch (error) {
      alert("Error deleting product");
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

  // ------------------- OFFICIAL PDF GENERATION -------------------
  const generatePDF = async (data, title) => {
    if (!data.length) return alert('No products to download!');
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
        const footerText = `Generated by ${companyInfo.name} Product Management System`;
        doc.text(footerText, pageWidth / 2, pageHeight - 15, { align: 'center' });
        const recordText = lastRecordIdx >= 0 ? `Product #${String(lastRecordIdx + 1).padStart(3, '0')}` : '';
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

      data.forEach((product, idx) => {
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
        doc.text(`Product #${String(idx + 1).padStart(3, '0')}`, 15, y);
        doc.setFont('times', 'normal');
        doc.setFontSize(10);
        doc.text(`Serial Number: ${product.serial_number || 'N/A'}`, pageWidth - 50, y);
        y += 10;
        doc.setLineWidth(0.3);
        doc.setDrawColor(150, 150, 150);
        doc.rect(15, y, pageWidth - 30, fieldsCount * 10 + 5, 'S');
        y += 5;
        Object.keys(selectedFields).forEach((field) => {
          if (selectedFields[field]) {
            let label = field.replace(/([A-Z])/g, ' $1').trim().replace(/\b\w/g, (l) => l.toUpperCase());
            let value = product[field] || 'N/A';
            if (field === 'quantity_in_stock' || field === 're_order_level' || field === 'purchase_price' || field === 'selling_price') {
              value = value ? `$${parseFloat(value).toFixed(2)}` : 'N/A';
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
  const handleDownloadAll = () => generatePDF(products, 'Product Directory Report');
  const handleDownloadSingle = (product) => generatePDF([product], `Product Report - ${product.item_name || 'Unnamed'}`);

  // ------------------- FILTERED PRODUCTS -------------------
  const filteredProducts = products.filter(
    (product) =>
      (product.serial_number?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (product.item_name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (product.category?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (product.supplier_name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (String(product.quantity_in_stock) || '').includes(searchTerm)
  );

  // ------------------- RENDER -------------------
  return (
    <div id="all-product-container">
      <Nav firstName={firstName} handleLogout={handleLogout} />
      <div id="all-product-section">
        <div id="title-container">
          <h2 id="title">Product Management System</h2>
          <p id="subtitle">{companyInfo.name} - {companyInfo.tagline}</p>
        </div>
        <div id="search-bar">
          <input
            type="text"
            placeholder="Search by Serial Number, Item Name, Category, Supplier or Quantity..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Charts Section */}
        <div id="charts-section">
          <div id="category-chart-container">
            <Pie data={categoryData} options={chartOptions} />
          </div>
          <div id="status-chart-container">
            <Pie data={statusData} options={statusOptionsChart} />
          </div>
          <div id="selfme-packages-chart-container">
            <Pie data={selfmePackagesStatusData} options={selfmeChartOptions} />
          </div>
        </div>

        <div id="action-buttons">
          <button id="add-product-btn" onClick={openAddModal}>
            Add New Product
          </button>
          <div id="download-options">
            <h3 id="download-options-title">Official Report Generation</h3>
            <p id="download-options-text">Select the fields to include in your official report:</p>
            <div id="field-checkboxes">
              {Object.keys(selectedFields).map((field) => (
                <label key={field} className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={selectedFields[field]}
                    onChange={() => setSelectedFields((prev) => ({ ...prev, [field]: !prev[field] }))}
                  />
                  <span>
                    {field.replace(/([A-Z])/g, ' $1').trim().replace(/\b\w/g, (l) => l.toUpperCase())}
                  </span>
                </label>
              ))}
            </div>
            <div id="download-buttons">
              <button id="download-all-btn" onClick={handleDownloadAll}>
                Download Directory ({products.length} products)
              </button>
              <p id="download-note">
                Reports include official letterhead with {companyInfo.name} branding and contact details.
              </p>
            </div>
          </div>
        </div>
        <div id="products-table-container">
          <div id="table-header">
            <span id="table-product-count">Total Products: {products.length}</span>
            <span id="filtered-count">
              {searchTerm && `(Showing ${filteredProducts.length} filtered results)`}
            </span>
          </div>
          <table id="products-table">
            <thead>
              <tr>
                <th>Serial Number</th>
                <th>Item Name</th>
                <th>Category</th>
                <th>Quantity in Stock</th>
                <th>Re-order Level</th>
                <th>Supplier</th>
                <th>Purchase Price</th>
                <th>Selling Price</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map((product) => (
                <tr key={product._id}>
                  <td>{product.serial_number || 'N/A'}</td>
                  <td>{product.item_name || 'N/A'}</td>
                  <td>{product.category || 'N/A'}</td>
                  <td>{product.quantity_in_stock || 'N/A'}</td>
                  <td>{product.re_order_level || 'N/A'}</td>
                  <td>{product.supplier_name || 'N/A'}</td>
                  <td>{product.purchase_price ? parseFloat(product.purchase_price).toFixed(2) : 'N/A'}</td>
                  <td>{product.selling_price ? parseFloat(product.selling_price).toFixed(2) : 'N/A'}</td>
                  <td>{product.status || 'N/A'}</td>
                  <td className="actions-cell">
                    <button
                      className="action-btn edit-btn"
                      onClick={() => openEditModal(product)}
                      title="Edit Product"
                    >
                      Edit
                    </button>
                    <button
                      className="action-btn delete-btn"
                      onClick={() => handleDelete(product._id)}
                      title="Delete Product"
                    >
                      Delete
                    </button>
                    <button
                      className="action-btn download-btn"
                      onClick={() => handleDownloadSingle(product)}
                      title="Download Product Report"
                    >
                      Download
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredProducts.length === 0 && (
            <div id="no-products-message">
              <p>No products found matching your search criteria.</p>
              {searchTerm && (
                <button id="clear-search-btn" onClick={() => setSearchTerm('')}>
                  Clear Search
                </button>
              )}
            </div>
          )}
        </div>

        {/* Modal */}
        {showModal && (
          <div id="product-modal">
            <div id="modal-backdrop" onClick={closeModal}></div>
            <div id="modal-content">
              <div id="modal-header">
                <h3>{isEdit ? "Edit Product" : "Add New Product"}</h3>
                <button id="close-modal-btn" onClick={closeModal}>×</button>
              </div>
              <form onSubmit={handleSubmit} id="modal-form">
                {/* Basic Info */}
                <div className="form-section">
                  <h4>Basic Information</h4>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Serial Number *</label>
                      <div className="serial-input-container">
                        <input
                          type="text"
                          name="serial_number"
                          placeholder="SN-1758999984335-411"
                          value={formData.serial_number}
                          onChange={handleChange}
                          readOnly={!isEdit}
                        />
                        {!isEdit && (
                          <button
                            type="button"
                            className="generate-btn"
                            onClick={generateSerialNumber}
                          >
                            Generate
                          </button>
                        )}
                      </div>
                      {errors.serial_number && (
                        <span className="error-text">{errors.serial_number}</span>
                      )}
                    </div>

                    <div className="form-group">
                      <label>Product Name *</label>
                      <input
                        type="text"
                        name="item_name"
                        value={formData.item_name}
                        onChange={handleChange}
                        maxLength={100}
                      />
                      {errors.item_name && (
                        <span className="error-text">{errors.item_name}</span>
                      )}
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Category *</label>
                      <select
                        name="category"
                        value={formData.category}
                        onChange={handleChange}
                      >
                        <option value="">-- Select Category --</option>
                        {categories.map((cat, index) => (
                          <option key={index} value={cat}>
                            {cat}
                          </option>
                        ))}
                      </select>
                      {errors.category && (
                        <span className="error-text">{errors.category}</span>
                      )}
                    </div>

                    <div className="form-group">
                      <label>Status *</label>
                      <select
                        name="status"
                        value={formData.status}
                        onChange={handleChange}
                      >
                        {statusOptions.map((status, index) => (
                          <option key={index} value={status}>
                            {status}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Description (Max 500 characters)</label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleChange}
                      rows="3"
                      maxLength={500}
                    />
                  </div>

                  <div className="form-group">
                    <label>Upload Product Image</label>
                    <input type="file" accept="image/*" onChange={handleFileChange} />
                  </div>
                </div>

                {/* Inventory Info */}
                <div className="form-section">
                  <h4>Inventory Information</h4>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Quantity in Stock *</label>
                      <input
                        type="number"
                        name="quantity_in_stock"
                        value={formData.quantity_in_stock}
                        onChange={handleChange}
                        onBlur={handlePriceBlur}
                        min="1"
                        max="500"
                      />
                      {errors.quantity_in_stock && (
                        <span className="error-text">{errors.quantity_in_stock}</span>
                      )}
                    </div>
                    <div className="form-group">
                      <label>Re-order Level *</label>
                      <input
                        type="number"
                        name="re_order_level"
                        value={formData.re_order_level}
                        onChange={handleChange}
                        onBlur={handlePriceBlur}
                        min="1"
                        max="500"
                      />
                      {errors.re_order_level && (
                        <span className="error-text">{errors.re_order_level}</span>
                      )}
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Supplier *</label>
                    <select
                      name="supplier_name"
                      value={formData.supplier_name}
                      onChange={handleChange}
                    >
                      <option value="">-- Select Supplier --</option>
                      {suppliers.map((sup) => (
                        <option key={sup._id} value={sup.name}>
                          {sup.name} | {sup.company_name || "No Company"} |{" "}
                          {sup.email || "No Email"}
                        </option>
                      ))}
                    </select>
                    {errors.supplier_name && (
                      <span className="error-text">{errors.supplier_name}</span>
                    )}
                  </div>
                </div>

                {/* Pricing Info */}
                <div className="form-section">
                  <h4>Pricing Information</h4>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Purchase Price *</label>
                      <input
                        type="text"
                        name="purchase_price"
                        value={formData.purchase_price}
                        onChange={handleChange}
                        onBlur={handlePriceBlur}
                        placeholder="0.00"
                      />
                      {errors.purchase_price && (
                        <span className="error-text">{errors.purchase_price}</span>
                      )}
                    </div>
                    <div className="form-group">
                      <label>Selling Price *</label>
                      <input
                        type="text"
                        name="selling_price"
                        value={formData.selling_price}
                        onChange={handleChange}
                        onBlur={handlePriceBlur}
                        placeholder="0.00"
                      />
                      {errors.selling_price && (
                        <span className="error-text">{errors.selling_price}</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Remarks */}
                {(formData.status === "Damaged" ||
                  formData.status === "Returned") && (
                  <div className="form-section">
                    <h4>Remarks</h4>
                    <div className="form-group">
                      <label>
                        {formData.status === "Damaged"
                          ? "Damage Details *"
                          : "Return Reason *"}
                      </label>
                      <textarea
                        name="product_remark"
                        value={formData.product_remark}
                        onChange={handleChange}
                        rows="3"
                        maxLength={200}
                      />
                      {errors.product_remark && (
                        <span className="error-text">{errors.product_remark}</span>
                      )}
                    </div>
                  </div>
                )}

                <button type="submit" className="modal-submit-btn">
                  {isEdit ? "Update Product" : "Add Product"}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default AllProductFSuppli;