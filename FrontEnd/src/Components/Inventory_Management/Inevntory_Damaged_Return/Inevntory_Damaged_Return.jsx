import React, { useEffect, useState } from "react";
import axios from "axios";
import { jsPDF } from "jspdf";
import "jspdf-autotable";
import InventoryManagementNav from "../Inventory_Management_Nav/Inventory_Management_Nav";
import logo from "./logo selfme.png";
import "./Inevntory_Damaged_Return.css";

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

const statusOptions = ["Damaged", "Returned"];

const Inevntory_Damaged_Return = () => {
  const [items, setItems] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("All Categories");
  const [filterStatus, setFilterStatus] = useState("all");
  const [selectedItems, setSelectedItems] = useState(new Set());
  const [pdfLoading, setPdfLoading] = useState(false);

  // Simplified remark editing state
  const [editingItem, setEditingItem] = useState(null);
  const [newRemark, setNewRemark] = useState("");
  const [savingRemark, setSavingRemark] = useState(false);

  useEffect(() => {
    const fetchItems = async () => {
      try {
        setLoading(true);
        const res = await axios.get("http://localhost:5000/products");
        const damagedReturnedItems = res.data.filter(
          (item) => item.status === "Damaged" || item.status === "Returned"
        );
        setItems(damagedReturnedItems);
        setFilteredItems(damagedReturnedItems);
      } catch (err) {
        setError("Failed to fetch items. Try again.");
      } finally {
        setLoading(false);
      }
    };
    fetchItems();
  }, []);

  useEffect(() => {
    let results = items.filter((item) =>
      Object.values(item).some(
        (v) =>
          v && v.toString().toLowerCase().includes(searchTerm.toLowerCase())
      )
    );

    if (filterCategory !== "All Categories") {
      results = results.filter((item) => item.category === filterCategory);
    }

    if (filterStatus !== "all") {
      results = results.filter((item) => item.status === filterStatus);
    }

    setFilteredItems(results);
    setSelectedItems(new Set());
  }, [searchTerm, filterCategory, filterStatus, items]);

  const toggleItemSelection = (itemId) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(itemId)) newSelected.delete(itemId);
    else newSelected.add(itemId);
    setSelectedItems(newSelected);
  };

  const selectAllItems = () => {
    if (selectedItems.size === filteredItems.length)
      setSelectedItems(new Set());
    else setSelectedItems(new Set(filteredItems.map((i) => i._id)));
  };

  // Open edit modal
  const openEditModal = (item) => {
    setEditingItem(item);
    setNewRemark(item.product_remark || "");
  };

  // Close edit modal
  const closeEditModal = () => {
    setEditingItem(null);
    setNewRemark("");
    setError(null);
  };

  // Save remark
  const saveRemark = async () => {
    if (savingRemark || !editingItem) return;

    try {
      setSavingRemark(true);
      const response = await axios.put(
        `http://localhost:5000/products/${editingItem._id}`,
        {
          product_remark: newRemark,
        }
      );

      if (response.data) {
        // Update the local state
        const updatedItems = items.map((item) =>
          item._id === editingItem._id
            ? { ...item, product_remark: newRemark }
            : item
        );
        setItems(updatedItems);

        const updatedFilteredItems = filteredItems.map((item) =>
          item._id === editingItem._id
            ? { ...item, product_remark: newRemark }
            : item
        );
        setFilteredItems(updatedFilteredItems);

        closeEditModal();
      }
    } catch (err) {
      setError("Failed to update remark. Please try again.");
      console.error("Error updating remark:", err);
    } finally {
      setSavingRemark(false);
    }
  };

  // Format currency function
  const formatCurrency = (value) => {
    return value.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const stats = {
    totalItems: items.length,
    damagedItems: items.filter((i) => i.status === "Damaged").length,
    returnedItems: items.filter((i) => i.status === "Returned").length,
    totalCapital: items.reduce(
      (sum, i) => sum + (i.purchase_price || 0) * (i.quantity_in_stock || 0),
      0
    ),
  };

  const generatePDF = (itemsToExport, reportType = "all") => {
    setPdfLoading(true);
    try {
      const doc = new jsPDF("p", "mm", "a4");
      const pageWidth = doc.internal.pageSize.getWidth();
      const margin = 15;
      const date = new Date();
      const formattedDate = date.toLocaleDateString();
      const formattedTime = date.toLocaleTimeString();

      // Header
      doc.addImage(logo, "PNG", margin, 8, 20, 20);
      doc.setFontSize(16);
      doc.setTextColor(33, 37, 41);
      doc.text("SelfMe Pvt Ltd", margin + 25, 15);
      doc.setFontSize(9);
      doc.setTextColor(100, 100, 100);
      doc.text("No/346, Madalanda, Dompe, Colombo, Sri Lanka", margin + 25, 21);
      doc.text(
        "Phone: +94 717 882 883 | Email: Selfmepvtltd@gmail.com",
        margin + 25,
        26
      );
      doc.setDrawColor(200, 200, 200);
      doc.setLineWidth(0.5);
      doc.line(margin, 32, pageWidth - margin, 32);

      // Report title
      doc.setFontSize(14);
      doc.setTextColor(0, 53, 128);
      const title =
        reportType === "selected"
          ? "SELECTED DAMAGED/RETURNED ITEMS REPORT"
          : "DAMAGED & RETURNED INVENTORY REPORT";
      doc.text(title, pageWidth / 2, 45, { align: "center" });

      // Report details
      doc.setFontSize(10);
      doc.setTextColor(80, 80, 80);
      doc.text(
        `Generated on: ${formattedDate} at ${formattedTime}`,
        margin,
        55
      );
      doc.text(`Total Items: ${itemsToExport.length}`, margin, 62);
      const reportTotalCapital = itemsToExport.reduce(
        (sum, i) => sum + (i.purchase_price || 0) * (i.quantity_in_stock || 0),
        0
      );
      doc.text(
        `Total Capital Value: LKR ${formatCurrency(reportTotalCapital)}`,
        margin,
        69
      );

      // Table
      const tableColumns = [
        { header: "#", dataKey: "index" },
        { header: "Serial Number", dataKey: "serial" },
        { header: "Item Name", dataKey: "name" },
        { header: "Category", dataKey: "category" },
        { header: "Status", dataKey: "status" },
        { header: "Quantity", dataKey: "stock" },
        { header: "Unit Price (LKR)", dataKey: "unitPrice" },
        { header: "Total Value (LKR)", dataKey: "totalValue" },
        { header: "Remark", dataKey: "remark" },
      ];

      const tableData = itemsToExport.map((item, index) => {
        const unitPrice = item.purchase_price || 0;
        const totalValue = unitPrice * (item.quantity_in_stock || 0);
        return {
          index: index + 1,
          serial: item.serial_number,
          name:
            item.item_name.length > 25
              ? item.item_name.slice(0, 25) + "..."
              : item.item_name,
          category:
            item.category.length > 20
              ? item.category.slice(0, 20) + "..."
              : item.category,
          status: item.status,
          stock: item.quantity_in_stock,
          unitPrice: formatCurrency(unitPrice),
          totalValue: formatCurrency(totalValue),
          remark: item.product_remark || "-",
        };
      });

      doc.autoTable({
        columns: tableColumns,
        body: tableData,
        startY: 75,
        margin: { left: margin, right: margin },
        theme: "grid",
        styles: { fontSize: 7, cellPadding: 2 },
        headStyles: {
          fillColor: [0, 53, 128],
          textColor: 255,
          fontStyle: "bold",
          halign: "center",
        },
        columnStyles: {
          unitPrice: { halign: "right" },
          totalValue: { halign: "right" },
        },
        didDrawPage: (data) => {
          const pageCount = doc.internal.getNumberOfPages();
          const currentPage = data.pageNumber;
          doc.setFontSize(8);
          doc.setTextColor(150, 150, 150);
          doc.text(
            `SelfMe Inventory Management System - Page ${currentPage} of ${pageCount}`,
            pageWidth / 2,
            doc.internal.pageSize.height - 10,
            { align: "center" }
          );
        },
      });

      const finalY = doc.lastAutoTable.finalY + 15;
      if (finalY < doc.internal.pageSize.height - 30) {
        doc.setFontSize(10);
        doc.setTextColor(80, 80, 80);
        doc.text("Authorized Signature:", margin, finalY);
        doc.line(margin + 50, finalY + 1, margin + 150, finalY + 1);
        doc.text("Date:", pageWidth - margin - 50, finalY);
        doc.line(
          pageWidth - margin - 30,
          finalY + 1,
          pageWidth - margin,
          finalY + 1
        );
      }

      const fileName = `Damaged_Returned_Report_${reportType}_${formattedDate.replace(
        /\//g,
        "-"
      )}.pdf`;
      doc.save(fileName);
    } catch (err) {
      console.error("PDF generation error:", err);
      alert("Error generating PDF. Please try again.");
    } finally {
      setPdfLoading(false);
    }
  };

  const handleAllPDF = () => {
    if (items.length === 0) return alert("No items found.");
    generatePDF(items, "all");
  };

  const handleSelectedPDF = () => {
    const selectedProducts = filteredItems.filter((i) =>
      selectedItems.has(i._id)
    );
    if (selectedProducts.length === 0) return alert("Please select items.");
    generatePDF(selectedProducts, "selected");
  };

  if (loading)
    return (
      <div className="idr_loading-page">
        <InventoryManagementNav />
        <div className="idr_loading-text">
          Loading damaged & returned items...
        </div>
      </div>
    );

  return (
    <div id="idr_inventory-damaged-return">
      <InventoryManagementNav />

      <div id="idr_damaged-return-container">
        {/* Page Header */}
        <div id="idr_page-header">
          <h2>Damaged & Returned Inventory</h2>
          <p id="idr_page-subtitle">
            Overview of damaged and returned stock with filters & reports
          </p>
        </div>

        {/* Statistics */}
        <div id="idr_stats-container">
          <div className="idr_stat-card">
            <h3>Damaged</h3>
            <span className="idr_stat-number">{stats.damagedItems}</span>
          </div>
          <div className="idr_stat-card">
            <h3>Returned</h3>
            <span className="idr_stat-number">{stats.returnedItems}</span>
          </div>
          <div className="idr_stat-card">
            <h3>Total Items</h3>
            <span className="idr_stat-number">{stats.totalItems}</span>
          </div>
          <div className="idr_stat-card">
            <h3>Selected</h3>
            <span className="idr_stat-number">{selectedItems.size}</span>
          </div>
          <div className="idr_stat-card">
            <h3>Total Capital</h3>
            <span className="idr_stat-number">
              LKR {formatCurrency(stats.totalCapital)}
            </span>
          </div>
        </div>

        {/* Filters */}
        <div id="idr_filters-container">
          <div className="idr_search-box">
            <input
              type="text"
              id="idr_search-input"
              placeholder="Search by item name, serial number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="idr_filter-group">
            <select
              id="idr_status-filter"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="all">All Status</option>
              {statusOptions.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>

            <select
              id="idr_category-filter"
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
          <div id="idr_selection-controls">
            <button
              id="idr_select-all-btn"
              onClick={selectAllItems}
              disabled={filteredItems.length === 0}
            >
              {selectedItems.size === filteredItems.length &&
              filteredItems.length > 0
                ? "Deselect All"
                : "Select All"}
            </button>
            {selectedItems.size > 0 && (
              <span id="idr_selected-count">{selectedItems.size} selected</span>
            )}
          </div>
        </div>

        {/* Error */}
        {error && <div id="idr_error-message">{error}</div>}

        {/* PDF Controls */}
        <div id="idr_pdf-controls">
          <button
            id="idr_pdf-all"
            onClick={handleAllPDF}
            disabled={pdfLoading || items.length === 0}
          >
            {pdfLoading ? "Generating..." : "Full Inventory PDF"}
          </button>
          <button
            id="idr_pdf-selected"
            onClick={handleSelectedPDF}
            disabled={pdfLoading || selectedItems.size === 0}
          >
            {pdfLoading
              ? "Generating..."
              : `Selected (${selectedItems.size}) PDF`}
          </button>
        </div>

        {/* Table */}
        <div id="idr_inventory-table-container">
          <table id="idr_inventory-table">
            <thead>
              <tr>
                <th>
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
                <th>Image</th>
                <th>Serial Number</th>
                <th>Item Name</th>
                <th>Category</th>
                <th>Status</th>
                <th>Quantity</th>
                <th>Unit Price</th>
                <th>Total Value</th>
                <th>Remark</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.length > 0 ? (
                filteredItems.map((item, idx) => {
                  const unitPrice = item.purchase_price || 0;
                  const totalValue = unitPrice * (item.quantity_in_stock || 0);
                  return (
                    <tr
                      key={item._id}
                      className={
                        selectedItems.has(item._id) ? "idr_row-selected" : ""
                      }
                    >
                      <td>
                        <input
                          type="checkbox"
                          checked={selectedItems.has(item._id)}
                          onChange={() => toggleItemSelection(item._id)}
                        />
                      </td>
                      <td>{idx + 1}</td>
                      <td>
                        <img
                          src={
                            item.item_image
                              ? `http://localhost:5000/images/${item.item_image}`
                              : "/placeholder-image.png"
                          }
                          alt={item.item_name}
                          className="idr_table-image"
                        />
                      </td>
                      <td>{item.serial_number}</td>
                      <td>{item.item_name}</td>
                      <td>{item.category}</td>
                      <td>{item.status}</td>
                      <td>{item.quantity_in_stock}</td>
                      <td>LKR {formatCurrency(unitPrice)}</td>
                      <td>LKR {formatCurrency(totalValue)}</td>
                      <td>
                        <div className="idr_remark-display">
                          {item.product_remark || "No remark"}
                        </div>
                      </td>
                      <td>
                        <button
                          onClick={() => openEditModal(item)}
                          className="idr_edit-btn"
                          title="Edit Remark"
                        >
                          Edit Remark
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="12" id="idr_no-items">
                    No items found
                    {searchTerm && ` matching "${searchTerm}"`}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Edit Remark Modal */}
        {editingItem && (
          <div className="idr_modal-overlay">
            <div className="idr_modal-content">
              <div className="idr_modal-header">
                <h3>Edit Remark</h3>
                <button className="idr_modal-close" onClick={closeEditModal}>
                  ×
                </button>
              </div>
              <div className="idr_modal-body">
                <div className="idr_modal-item-info">
                  <p>
                    <strong>Item:</strong> {editingItem.item_name}
                  </p>
                  <p>
                    <strong>Serial:</strong> {editingItem.serial_number}
                  </p>
                </div>
                <div className="idr_form-group">
                  <label htmlFor="remark">Remark:</label>
                  <textarea
                    id="remark"
                    value={newRemark}
                    onChange={(e) => setNewRemark(e.target.value)}
                    placeholder="Enter your remark here..."
                    rows="4"
                    maxLength={200}
                  />
                  <span className="idr_char-count">
                    {newRemark.length}/200 characters
                  </span>
                </div>
              </div>
              <div className="idr_modal-actions">
                <button
                  className="idr_btn-cancel"
                  onClick={closeEditModal}
                  disabled={savingRemark}
                >
                  Cancel
                </button>
                <button
                  className="idr_btn-save"
                  onClick={saveRemark}
                  disabled={savingRemark}
                >
                  {savingRemark ? "Saving..." : "Save Remark"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Inevntory_Damaged_Return;
