import React, { useEffect, useState } from "react";
import axios from "axios";
import InventoryManagementNav from "../Inventory_Management_Nav/Inventory_Management_Nav";
import { jsPDF } from "jspdf";
import "jspdf-autotable";
import logo from "./logo selfme.png";
import "./View_Stock_Levels.css";

const categories = [
  "All Categories",
  "Solar Panels",
  "Solar Batteries",
  "Solar Inverters",
  "Solar Controllers",
  "Solar Wires & Cables",
  "Mounting Structures & Accessories",
  "Solar Lights & Devices",
  "Solar Pumps & Appliances",
  "Monitoring & Miscellaneous Accessories",
];

function View_Stock_Levels() {
  const [items, setItems] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterCategory, setFilterCategory] = useState("All Categories");
  const [pdfLoading, setPdfLoading] = useState(false);
  const [selectedItems, setSelectedItems] = useState(new Set());

  useEffect(() => {
    const fetchItems = async () => {
      try {
        const res = await axios.get("http://localhost:5000/products");
        setItems(res.data);
        setFilteredItems(res.data);
      } catch (error) {
        console.error("Error fetching items:", error);
        setError("Failed to fetch items. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    fetchItems();
  }, []);

  const getStockStatus = (quantity, reorderLevel) => {
    if (quantity === 0) return "out-of-stock";
    if (quantity <= reorderLevel) return "low-stock";
    if (quantity <= reorderLevel * 2) return "medium-stock";
    return "good-stock";
  };

  const getStatusText = (quantity, reorderLevel) => {
    if (quantity === 0) return "Out of Stock";
    if (quantity <= reorderLevel) return "Reorder Needed";
    if (quantity <= reorderLevel * 2) return "Low Stock";
    return "In Stock";
  };

  useEffect(() => {
    let results = items.filter((item) =>
      Object.values(item).some(
        (value) =>
          value &&
          value.toString().toLowerCase().includes(searchTerm.toLowerCase())
      )
    );

    if (filterStatus !== "all") {
      results = results.filter(
        (item) =>
          getStockStatus(item.quantity_in_stock, item.re_order_level) ===
          filterStatus
      );
    }

    if (filterCategory !== "All Categories") {
      results = results.filter((item) => item.category === filterCategory);
    }

    setFilteredItems(results);
    setSelectedItems(new Set());
  }, [searchTerm, filterStatus, filterCategory, items]);

  // Selection
  const toggleItemSelection = (itemId) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(itemId)) newSelected.delete(itemId);
    else newSelected.add(itemId);
    setSelectedItems(newSelected);
  };

  const selectAllItems = () => {
    if (selectedItems.size === filteredItems.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(filteredItems.map((item) => item._id)));
    }
  };

  const calculateStats = () => {
    const totalItems = items.length;
    const lowStockItems = items.filter(
      (item) =>
        item.quantity_in_stock <= item.re_order_level &&
        item.quantity_in_stock > 0
    ).length;
    const outOfStockItems = items.filter(
      (item) => item.quantity_in_stock === 0
    ).length;
    
    // Calculate total capital value
    const totalCapital = items.reduce((total, item) => {
      const purchasePrice = item.purchase_price || 0;
      const quantity = item.quantity_in_stock || 0;
      return total + (purchasePrice * quantity);
    }, 0);

    return { totalItems, lowStockItems, outOfStockItems, totalCapital };
  };

  const stats = calculateStats();

  // Professional PDF Generation with consistent header colors
  // Professional PDF Generation with price columns
const generatePDF = (itemsToExport, reportType = "all") => {
  setPdfLoading(true);
  try {
    const doc = new jsPDF("p", "mm", "a4");
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 15;

    const date = new Date();
    const formattedDate = date.toLocaleDateString();
    const formattedTime = date.toLocaleTimeString();

    // --- Professional Header ---
    doc.addImage(logo, "PNG", margin, 8, 20, 20);
    
    // Company Info
    doc.setFontSize(16);
    doc.setTextColor(33, 37, 41);
    doc.text("SelfMe Pvt Ltd", margin + 25, 15);
    
    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    doc.text("No/346, Madalanda, Dompe, Colombo, Sri Lanka", margin + 25, 21);
    doc.text("Phone: +94 717 882 883 | Email: Selfmepvtltd@gmail.com", margin + 25, 26);

    // Header line
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.5);
    doc.line(margin, 32, pageWidth - margin, 32);

    // --- Report Title ---
    doc.setFontSize(14);
    doc.setTextColor(0, 53, 128);
    const title = reportType === "selected" 
      ? "SELECTED ITEMS STOCK REPORT" 
      : "INVENTORY STOCK REPORT";
    doc.text(title, pageWidth / 2, 45, { align: "center" });

    // --- Report Details ---
    doc.setFontSize(10);
    doc.setTextColor(80, 80, 80);
    doc.text(`Generated on: ${formattedDate} at ${formattedTime}`, margin, 55);
    doc.text(`Total Items: ${itemsToExport.length}`, margin, 62);

    // --- Calculate total capital value for the report ---
    const reportTotalCapital = itemsToExport.reduce((total, item) => {
      const purchasePrice = item.purchase_price || 0;
      const quantity = item.quantity_in_stock || 0;
      return total + (purchasePrice * quantity);
    }, 0);

    doc.text(`Total Capital Value: Rs. ${reportTotalCapital.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`, margin, 69);

    // --- Professional Table Setup with Price Columns ---
    const tableColumns = [
      { header: "#", dataKey: "index", width: 8 },
      { header: "Serial Number", dataKey: "serial", width: 25 },
      { header: "Product Name", dataKey: "name", width: 35 },
      { header: "Category", dataKey: "category", width: 30 },
      { header: "Stock Qty", dataKey: "stock", width: 15 },
      { header: "Reorder Level", dataKey: "reorder", width: 18 },
      { header: "Unit Price (Rs.)", dataKey: "unitPrice", width: 20 },
      { header: "Total Value (Rs.)", dataKey: "totalValue", width: 22 },
      { header: "Status", dataKey: "status", width: 20 }
    ];

    const tableData = itemsToExport.map((item, index) => {
      const unitPrice = item.purchase_price || 0;
      const totalValue = unitPrice * (item.quantity_in_stock || 0);
      
      return {
        index: index + 1,
        serial: item.serial_number,
        name: item.item_name.length > 25 ? item.item_name.substring(0, 25) + "..." : item.item_name,
        category: item.category.length > 20 ? item.category.substring(0, 20) + "..." : item.category,
        stock: item.quantity_in_stock.toString(),
        reorder: item.re_order_level.toString(),
        unitPrice: unitPrice.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2}),
        totalValue: totalValue.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2}),
        status: getStatusText(item.quantity_in_stock, item.re_order_level)
      };
    });

    // --- AutoTable with Professional Styling ---
    doc.autoTable({
      columns: tableColumns,
      body: tableData,
      startY: 75,
      margin: { left: margin, right: margin },
      theme: 'grid',
      styles: {
        fontSize: 7,
        cellPadding: 2,
        textColor: [33, 37, 41],
        lineColor: [200, 200, 200],
        lineWidth: 0.1
      },
      headStyles: {
        fillColor: [0, 53, 128], // Consistent blue color for ALL headers
        textColor: 255, // White text for ALL headers
        fontStyle: 'bold',
        fontSize: 8,
        cellPadding: 3,
        halign: 'center'
      },
      bodyStyles: {
        fontSize: 7,
        cellPadding: 2,
        valign: 'middle'
      },
      columnStyles: {
        index: { 
          cellWidth: 8, 
          halign: 'center',
          fontStyle: 'bold'
        },
        serial: { 
          cellWidth: 25, 
          halign: 'center',
          fontStyle: 'bold'
        },
        name: { 
          cellWidth: 35, 
          halign: 'left'
        },
        category: { 
          cellWidth: 30, 
          halign: 'left'
        },
        stock: { 
          cellWidth: 15, 
          halign: 'center',
          fontStyle: 'bold'
        },
        reorder: { 
          cellWidth: 18, 
          halign: 'center'
        },
        unitPrice: { 
          cellWidth: 20, 
          halign: 'right',
          fontStyle: 'bold'
        },
        totalValue: { 
          cellWidth: 22, 
          halign: 'right',
          fontStyle: 'bold'
        },
        status: { 
          cellWidth: 20, 
          halign: 'center'
        }
      },
      didParseCell: function(data) {
        // Color code status cells (body only)
        if (data.section === 'body' && data.column.dataKey === 'status') {
          const status = data.cell.raw;
          if (status === 'Out of Stock') {
            data.cell.styles.fillColor = [248, 215, 218];
            data.cell.styles.textColor = [114, 28, 36];
          } else if (status === 'Reorder Needed') {
            data.cell.styles.fillColor = [255, 243, 205];
            data.cell.styles.textColor = [133, 100, 4];
          } else if (status === 'Low Stock') {
            data.cell.styles.fillColor = [255, 234, 167];
            data.cell.styles.textColor = [133, 100, 4];
          } else {
            data.cell.styles.fillColor = [212, 237, 218];
            data.cell.styles.textColor = [21, 87, 36];
          }
        }
        
        // Style price columns (body only)
        if (data.section === 'body' && (data.column.dataKey === 'unitPrice' || data.column.dataKey === 'totalValue')) {
          data.cell.styles.fontStyle = 'bold';
          data.cell.styles.textColor = [0, 100, 0]; // Dark green for money
        }
      },
      didDrawPage: function(data) {
        // Professional footer
        const pageCount = doc.internal.getNumberOfPages();
        const currentPage = data.pageNumber;
        
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        
        // Footer text only - removed confidential watermark
        doc.text(
          `SelfMe Inventory Management System - Page ${currentPage} of ${pageCount}`,
          pageWidth / 2,
          doc.internal.pageSize.height - 10,
          { align: "center" }
        );
      }
    });

    // --- Final Signature Section ---
    const finalY = doc.lastAutoTable.finalY + 15;
    if (finalY < doc.internal.pageSize.height - 30) {
      doc.setFontSize(10);
      doc.setTextColor(80, 80, 80);
      doc.text("Authorized Signature:", margin, finalY);
      doc.line(margin + 50, finalY + 1, margin + 150, finalY + 1);
      
      doc.text("Date:", pageWidth - margin - 50, finalY);
      doc.line(pageWidth - margin - 30, finalY + 1, pageWidth - margin, finalY + 1);
    }

    // --- Save PDF ---
    const fileName = `Stock_Report_${reportType}_${formattedDate.replace(/\//g, "-")}.pdf`;
    doc.save(fileName);

  } catch (err) {
    console.error("PDF generation error:", err);
    alert("Error generating PDF. Please try again.");
  } finally {
    setPdfLoading(false);
  }
};

  const handleAllItemsPDF = () => {
    if (items.length === 0) return alert("No items in inventory.");
    generatePDF(items, "all");
  };

  const handleSelectedPDF = () => {
    const selectedProducts = filteredItems.filter((item) =>
      selectedItems.has(item._id)
    );
    if (selectedProducts.length === 0) return alert("Please select items.");
    generatePDF(selectedProducts, "selected");
  };

  if (loading) {
    return (
      <div id="stock-levels-page">
        <InventoryManagementNav />
        <div className="loading-container">Loading stock levels...</div>
      </div>
    );
  }

  return (
    <div id="stock-levels-page">
      <InventoryManagementNav />
      <div id="stock-levels-container">
        <div className="header-section">
          <h2>Inventory Stock Levels</h2>
          <div className="total-capital">
            <h3>Total Capital Value: Rs. {stats.totalCapital.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</h3>
          </div>
        </div>

        {/* Stats */}
        <div className="stats-cards">
          <div className="stat-card total-items">
            <h3>Total Items</h3>
            <p>{stats.totalItems}</p>
          </div>
          <div className="stat-card low-stock">
            <h3>Low Stock</h3>
            <p>{stats.lowStockItems}</p>
          </div>
          <div className="stat-card out-of-stock">
            <h3>Out of Stock</h3>
            <p>{stats.outOfStockItems}</p>
          </div>
          <div className="stat-card selected-items">
            <h3>Selected Items</h3>
            <p>{selectedItems.size}</p>
          </div>
          <div className="stat-card capital-value">
            <h3>Total Capital</h3>
            <p>Rs. {stats.totalCapital.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</p>
          </div>
        </div>

        {/* Search + Filters */}
        <div className="search-filter-container">
          <input
            type="text"
            placeholder="Search by item name, serial number..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="all">All Stock Status</option>
            <option value="good-stock">In Stock</option>
            <option value="medium-stock">Low Stock</option>
            <option value="low-stock">Reorder Needed</option>
            <option value="out-of-stock">Out of Stock</option>
          </select>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
          >
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
          <div className="selection-controls">
            <button
              className="select-all-btn"
              onClick={selectAllItems}
              disabled={filteredItems.length === 0}
            >
              {selectedItems.size === filteredItems.length &&
              filteredItems.length > 0
                ? "Deselect All"
                : "Select All"}
            </button>
            {selectedItems.size > 0 && (
              <span className="selected-count">{selectedItems.size} selected</span>
            )}
          </div>
        </div>

        {error && <div className="error-message">{error}</div>}

        {/* PDF buttons */}
        <div className="pdf-controls" style={{ marginBottom: "12px" }}>
          <button
            className="pdf-btn primary"
            onClick={handleAllItemsPDF}
            disabled={pdfLoading || items.length === 0}
          >
            {pdfLoading ? "Generating..." : "Full Inventory PDF"}
          </button>
          <button
            className="pdf-btn accent"
            onClick={handleSelectedPDF}
            disabled={pdfLoading || selectedItems.size === 0}
          >
            {pdfLoading
              ? "Generating..."
              : `Selected (${selectedItems.size}) PDF`}
          </button>
        </div>

        {/* Table */}
        <div className="inventory-table-container">
          <table className="inventory-table">
            <thead>
              <tr>
                <th className="checkbox-column">
                  <input
                    type="checkbox"
                    checked={
                      selectedItems.size === filteredItems.length &&
                      filteredItems.length > 0
                    }
                    onChange={selectAllItems}
                    disabled={filteredItems.length === 0}
                  />
                </th>
                <th>#</th>
                <th>Product Image</th>
                <th>Serial Number</th>
                <th>Item Name</th>
                <th>Category</th>
                <th>Current Stock</th>
                <th>Reorder Level</th>
                <th>Unit Price (Rs.)</th>
                <th>Total Value (Rs.)</th>
                <th>Status</th>
                <th>Stock Level</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.length > 0 ? (
                filteredItems.map((item, index) => {
                  const status = getStockStatus(
                    item.quantity_in_stock,
                    item.re_order_level
                  );
                  const statusText = getStatusText(
                    item.quantity_in_stock,
                    item.re_order_level
                  );
                  const percentage = Math.min(
                    Math.round(
                      (item.quantity_in_stock /
                        (item.re_order_level * 3 || 1)) *
                        100
                    ),
                    100
                  );
                  const unitPrice = item.purchase_price || 0;
                  const totalValue = unitPrice * (item.quantity_in_stock || 0);

                  return (
                    <tr
                      key={item._id}
                      className={`${status} ${
                        selectedItems.has(item._id) ? "selected" : ""
                      }`}
                    >
                      <td className="checkbox-column">
                        <input
                          type="checkbox"
                          checked={selectedItems.has(item._id)}
                          onChange={() => toggleItemSelection(item._id)}
                        />
                      </td>
                      <td>{index + 1}</td>
                      <td>
                        <img
                          src={
                            item.item_image
                              ? `http://localhost:5000/images/${item.item_image}`
                              : "/placeholder-image.png"
                          }
                          alt={item.item_name}
                          className="table-item-image"
                          onError={(e) => {
                            e.target.src = "/placeholder-image.png";
                          }}
                        />
                      </td>
                      <td>{item.serial_number}</td>
                      <td>{item.item_name}</td>
                      <td>{item.category}</td>
                      <td>{item.quantity_in_stock}</td>
                      <td>{item.re_order_level}</td>
                      <td className="price-cell">Rs. {unitPrice.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                      <td className="price-cell total-value">Rs. {totalValue.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                      <td>
                        <span className={`status-badge ${status}`}>
                          {statusText}
                        </span>
                      </td>
                      <td>
                        <div className="stock-bar-container">
                          <div
                            className={`stock-bar ${status}`}
                            style={{ width: `${percentage}%` }}
                          >
                            <span className="stock-bar-label">
                              {percentage}%
                            </span>
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="12" className="no-items-cell">
                    No items found
                    {searchTerm && ` matching "${searchTerm}"`}.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default View_Stock_Levels;