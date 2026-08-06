import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import InventoryManagementNav from "../Inventory_Management_Nav/Inventory_Management_Nav";
import "./View_All_Items.css";

const View_All_Items = () => {
  const [items, setItems] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState({
    category: "all",
    status: "all",
    sortBy: "createdAt",
    sortOrder: "desc",
    lowStock: false,
  });
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    item: null,
    loading: false,
  });
  const [editModal, setEditModal] = useState({
    isOpen: false,
    item: null,
    loading: false,
    formData: {},
    imagePreview: null,
    newImage: null,
    errors: {},
    isSerialGenerated: false,
  });
  const navigate = useNavigate();

  const categories = [
    "Selfme packages",
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

  const statusOptions = ["Available", "Damaged", "Returned", "Sold Out"];

  // Fetch suppliers
  useEffect(() => {
    const fetchSuppliers = async () => {
      try {
        const res = await axios.get("http://localhost:5000/suppliers");
        setSuppliers(res.data);
      } catch (err) {
        console.error("Error fetching suppliers:", err);
      }
    };
    fetchSuppliers();
  }, []);

  // Fetch items
  const fetchItems = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filters.category !== "all")
        params.append("category", filters.category);
      if (filters.status !== "all") params.append("status", filters.status);
      if (filters.sortBy) params.append("sortBy", filters.sortBy);
      if (filters.sortOrder) params.append("sortOrder", filters.sortOrder);
      if (filters.lowStock) params.append("lowStock", "true");

      const res = await axios.get(`http://localhost:5000/products?${params}`);
      setItems(res.data);
      setFilteredItems(res.data);
    } catch (error) {
      console.error("Error fetching items:", error);
      setError("Failed to fetch items. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, [
    filters.category,
    filters.status,
    filters.sortBy,
    filters.sortOrder,
    filters.lowStock,
  ]);

  // Search
  useEffect(() => {
    const results = items.filter((item) =>
      Object.values(item).some(
        (value) =>
          value &&
          value.toString().toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
    setFilteredItems(results);
  }, [searchTerm, items]);

  const handleFilterChange = (filterType, value) => {
    setFilters((prev) => ({ ...prev, [filterType]: value }));
  };

  const handleSortChange = (sortBy, sortOrder) => {
    setFilters((prev) => ({ ...prev, sortBy, sortOrder }));
  };

  const openDeleteModal = (item) => {
    setDeleteModal({ isOpen: true, item, loading: false });
  };

  const closeDeleteModal = () => {
    setDeleteModal({ isOpen: false, item: null, loading: false });
  };

  // Enhanced input change handler with validations
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    let processedValue = value;

    switch (name) {
      case "serial_number":
        if (!editModal.isSerialGenerated) {
          processedValue = value.slice(0, 50);
        } else {
          return; // Prevent editing if serial number is generated
        }
        break;

      case "item_name":
        processedValue = value.slice(0, 100);
        break;

      case "description":
        processedValue = value.slice(0, 500);
        break;

      case "quantity_in_stock": {
        if (value === "") {
          processedValue = "";
        } else {
          const numValue = parseInt(value);
          if (!isNaN(numValue) && numValue >= 0 && numValue <= 10000) {
            processedValue = numValue.toString();
          } else if (numValue > 10000) {
            processedValue = "10000";
          } else if (numValue < 0) {
            processedValue = "0";
          }
        }
        break;
      }

      case "re_order_level": {
        if (value === "") {
          processedValue = "";
        } else {
          const numValue = parseInt(value);
          const currentQuantity =
            parseInt(editModal.formData.quantity_in_stock) || 0;

          if (!isNaN(numValue) && numValue >= 1 && numValue <= 10000) {
            processedValue = numValue.toString();
          } else if (numValue > 10000) {
            processedValue = "10000";
          } else if (numValue < 1) {
            processedValue = "1";
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

      case "product_remark":
        processedValue = value.slice(0, 200);
        break;

      default:
        processedValue = value;
    }

    setEditModal((prev) => ({
      ...prev,
      formData: { ...prev.formData, [name]: processedValue },
      errors: { ...prev.errors, [name]: "" },
    }));

    // Validate re-order level whenever quantity or re-order level changes
    if (name === "quantity_in_stock" || name === "re_order_level") {
      validateReorderLevel();
    }

    // Validate selling price vs purchase price when either changes
    if (name === "purchase_price" || name === "selling_price") {
      validatePriceComparison();
    }
  };

  // Generate serial number
  const generateSerialNumber = () => {
    const sn = `SN-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    setEditModal((prev) => ({
      ...prev,
      formData: { ...prev.formData, serial_number: sn },
      isSerialGenerated: true,
    }));
  };

  // Validate that re-order level is less than or equal to quantity and not 0
  const validateReorderLevel = () => {
    const quantity = parseInt(editModal.formData.quantity_in_stock) || 0;
    const reorderLevel = parseInt(editModal.formData.re_order_level) || 0;

    if (reorderLevel === 0) {
      setEditModal((prev) => ({
        ...prev,
        errors: {
          ...prev.errors,
          re_order_level: "Re-order level must be at least 1",
        },
      }));
      return false;
    } else if (reorderLevel > quantity) {
      setEditModal((prev) => ({
        ...prev,
        errors: {
          ...prev.errors,
          re_order_level:
            "Re-order level cannot be greater than quantity in stock",
        },
      }));
      return false;
    } else {
      setEditModal((prev) => ({
        ...prev,
        errors: { ...prev.errors, re_order_level: "" },
      }));
      return true;
    }
  };

  // Validate that selling price is always greater than purchase price
  const validatePriceComparison = () => {
    const purchasePrice = parseFloat(editModal.formData.purchase_price) || 0;
    const sellingPrice = parseFloat(editModal.formData.selling_price) || 0;

    if (purchasePrice > 0 && sellingPrice > 0 && sellingPrice <= purchasePrice) {
      setEditModal((prev) => ({
        ...prev,
        errors: {
          ...prev.errors,
          selling_price: "Selling price must be greater than purchase price",
        },
      }));
      return false;
    } else {
      setEditModal((prev) => ({
        ...prev,
        errors: { ...prev.errors, selling_price: "" },
      }));
      return true;
    }
  };

  // Format price for display with .00 format
  const formatPrice = (price) => {
    if (price === "" || price === null || price === undefined) return "";
    const num = parseFloat(price);
    return isNaN(num) ? "" : num.toFixed(2);
  };

  // Handle price blur to format with .00
  const handlePriceBlur = (e) => {
    const { name, value } = e.target;
    if (value && value !== "") {
      const formattedValue = formatPrice(value);
      setEditModal((prev) => ({
        ...prev,
        formData: { ...prev.formData, [name]: formattedValue },
      }));
    }
  };

  const openEditModal = (item) => {
    setEditModal({
      isOpen: true,
      item,
      loading: false,
      formData: {
        serial_number: item.serial_number,
        item_name: item.item_name,
        category: item.category,
        description: item.description || "",
        quantity_in_stock: item.quantity_in_stock,
        re_order_level: item.re_order_level,
        supplier_name: item.supplier_name || "",
        purchase_price: formatPrice(item.purchase_price),
        selling_price: formatPrice(item.selling_price),
        status: item.status,
        product_remark: item.product_remark || "",
      },
      imagePreview: item.item_image
        ? `http://localhost:5000/images/${item.item_image}`
        : null,
      newImage: null,
      errors: {},
      isSerialGenerated: true,
    });
  };

  const closeEditModal = () => {
    setEditModal({
      isOpen: false,
      item: null,
      loading: false,
      formData: {},
      imagePreview: null,
      newImage: null,
      errors: {},
      isSerialGenerated: false,
    });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setEditModal((prev) => ({
        ...prev,
        newImage: file,
        imagePreview: URL.createObjectURL(file),
      }));
    }
  };

  // Form validation for edit modal
  const validateEditForm = () => {
    const newErrors = {};
    const formData = editModal.formData;

    if (!formData.serial_number) {
      newErrors.serial_number = "Serial number required";
    } else if (formData.serial_number.length > 50) {
      newErrors.serial_number = "Serial number cannot exceed 50 characters";
    }

    if (!formData.item_name) {
      newErrors.item_name = "Product name required";
    } else if (formData.item_name.length > 100) {
      newErrors.item_name = "Product name cannot exceed 100 characters";
    }

    if (!formData.category) newErrors.category = "Select a category";

    if (formData.description.length > 500) {
      newErrors.description = "Description cannot exceed 500 characters";
    }

    // Quantity validation - can be 0
    if (
      formData.quantity_in_stock === "" ||
      formData.quantity_in_stock === null
    ) {
      newErrors.quantity_in_stock = "Quantity is required";
    } else {
      const quantity = parseInt(formData.quantity_in_stock);
      if (isNaN(quantity) || quantity < 0) {
        newErrors.quantity_in_stock = "Quantity cannot be negative";
      } else if (quantity > 10000) {
        newErrors.quantity_in_stock = "Quantity cannot exceed 10,000";
      }
    }

    // Re-order level validation - cannot be 0
    if (formData.re_order_level === "" || formData.re_order_level === null) {
      newErrors.re_order_level = "Re-order level is required";
    } else {
      const reorderLevel = parseInt(formData.re_order_level);
      if (isNaN(reorderLevel) || reorderLevel < 1) {
        newErrors.re_order_level = "Re-order level must be at least 1";
      } else if (reorderLevel > 10000) {
        newErrors.re_order_level = "Re-order level cannot exceed 10,000";
      } else if (reorderLevel > parseInt(formData.quantity_in_stock || 0)) {
        newErrors.re_order_level =
          "Re-order level cannot be greater than quantity in stock";
      }
    }

    if (!formData.supplier_name) newErrors.supplier_name = "Select a supplier";

    if (!formData.purchase_price || formData.purchase_price === "") {
      newErrors.purchase_price = "Purchase price must be greater than 0";
    } else {
      const price = parseFloat(formData.purchase_price);
      if (isNaN(price) || price <= 0) {
        newErrors.purchase_price = "Purchase price must be greater than 0";
      }
    }

    if (!formData.selling_price || formData.selling_price === "") {
      newErrors.selling_price = "Selling price must be greater than 0";
    } else {
      const price = parseFloat(formData.selling_price);
      if (isNaN(price) || price <= 0) {
        newErrors.selling_price = "Selling price must be greater than 0";
      }
    }

    // Validate selling price is greater than purchase price
    const purchasePrice = parseFloat(formData.purchase_price) || 0;
    const sellingPrice = parseFloat(formData.selling_price) || 0;
    if (purchasePrice > 0 && sellingPrice > 0 && sellingPrice <= purchasePrice) {
      newErrors.selling_price = "Selling price must be greater than purchase price";
    }

    if (
      (formData.status === "Damaged" || formData.status === "Returned") &&
      !formData.product_remark
    ) {
      newErrors.product_remark = "Remark required for Damaged/Returned items";
    } else if (formData.product_remark.length > 200) {
      newErrors.product_remark = "Remark cannot exceed 200 characters";
    }

    setEditModal((prev) => ({ ...prev, errors: newErrors }));
    return Object.keys(newErrors).length === 0;
  };

  const handleDeleteConfirm = async () => {
    if (!deleteModal.item) return;
    try {
      setDeleteModal((prev) => ({ ...prev, loading: true }));
      await axios.delete(
        `http://localhost:5000/products/${deleteModal.item._id}`
      );
      alert(`"${deleteModal.item.item_name}" has been deleted successfully!`);
      fetchItems();
      closeDeleteModal();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete item");
      closeDeleteModal();
    }
  };

  const handleUpdateConfirm = async () => {
    if (!editModal.item) return;

    // First validate re-order level specifically
    if (!validateReorderLevel()) {
      return;
    }

    // Then validate price comparison
    if (!validatePriceComparison()) {
      return;
    }

    // Then validate the entire form
    if (!validateEditForm()) return;

    try {
      setEditModal((prev) => ({ ...prev, loading: true }));

      const formData = new FormData();
      const numericFields = [
        "quantity_in_stock",
        "re_order_level",
        "purchase_price",
        "selling_price",
      ];

      Object.keys(editModal.formData).forEach((key) => {
        let value = editModal.formData[key];
        if (numericFields.includes(key)) {
          value = value === "" ? null : Number(value);
        }
        formData.append(key, value);
      });

      if (editModal.newImage) formData.append("item_image", editModal.newImage);

      await axios.put(
        `http://localhost:5000/products/${editModal.item._id}`,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );

      alert(`"${editModal.item.item_name}" has been updated successfully!`);
      fetchItems();
      closeEditModal();
    } catch (err) {
      if (err.response?.data?.code === 11000) {
        setEditModal((prev) => ({
          ...prev,
          errors: {
            ...prev.errors,
            serial_number: "Serial Number already exists",
          },
        }));
      } else {
        setError(err.response?.data?.message || "Failed to update item");
      }
      setEditModal((prev) => ({ ...prev, loading: false }));
    }
  };

  const totalValue = items.reduce(
    (sum, item) => sum + item.quantity_in_stock * item.selling_price,
    0
  );

  if (loading) {
    return (
      <div>
        <InventoryManagementNav />
        <div className="loading-container">
          <p className="loading-text">Loading items...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <InventoryManagementNav />
      <div className="view-items-container">
        <div className="page-header">
          <h2>Inventory Management</h2>
          
        </div>

        {/* Statistics */}
        <div className="stats-container">
          <div className="stat-card">
            <h3>Total Items</h3>
            <p className="stat-number">{items.length}</p>
          </div>
          <div className="stat-card">
            <h3>Total Value</h3>
            <p className="stat-number">LKR {formatPrice(totalValue)}</p>
          </div>
          <div className="stat-card">
            <h3>Low Stock Items</h3>
            <p className="stat-number">
              {
                items.filter(
                  (item) => item.quantity_in_stock <= item.re_order_level
                ).length
              }
            </p>
          </div>
        </div>

        {/* Filters & Search */}
        <div className="filters-container">
          <div className="search-box">
            <input
              type="text"
              placeholder="Search items..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>

          <div className="filter-group">
            <select
              value={filters.category}
              onChange={(e) => handleFilterChange("category", e.target.value)}
            >
              <option value="all">All Categories</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>

            <select
              value={filters.status}
              onChange={(e) => handleFilterChange("status", e.target.value)}
            >
              <option value="all">All Status</option>
              {statusOptions.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>

            <select
              value={filters.sortBy}
              onChange={(e) =>
                handleSortChange(e.target.value, filters.sortOrder)
              }
            >
              <option value="createdAt">Sort by Date</option>
              <option value="item_name">Sort by Name</option>
              <option value="selling_price">Sort by Price</option>
              <option value="quantity_in_stock">Sort by Stock</option>
            </select>

            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={filters.lowStock}
                onChange={(e) =>
                  handleFilterChange("lowStock", e.target.checked)
                }
              />
              Show Low Stock Only
            </label>
          </div>
        </div>

        {error && <div className="error-message">{error}</div>}

        {/* Items Grid */}
        <div className="items-grid">
          {filteredItems.length > 0 ? (
            filteredItems.map((item) => (
              <div key={item._id} className="item-card">
                <div className="item-image-container">
                  <img
                    src={
                      item.item_image
                        ? `http://localhost:5000/images/${item.item_image}`
                        : "/placeholder-image.png"
                    }
                    alt={item.item_name}
                    className="item-image"
                    onError={(e) => {
                      e.target.src = "/placeholder-image.png";
                    }}
                  />
                  {item.quantity_in_stock <= item.re_order_level && (
                    <div className="low-stock-badge">Low Stock</div>
                  )}
                </div>

                <div className="item-details">
                  <h3 className="item-name">{item.item_name}</h3>
                  <p className="item-serial">SN: {item.serial_number}</p>
                  <p className="item-category">{item.category}</p>
                  <p className="item-supplier">
                    Supplier: {item.supplier_name || "N/A"}
                  </p>

                  <div className="item-stock-info">
                    <span className="stock-quantity">
                      {item.quantity_in_stock} in stock
                    </span>
                    <span className="reorder-level">
                      Reorder at: {item.re_order_level}
                    </span>
                  </div>

                  <div className="item-pricing">
                    <span className="selling-price">
                      LKR {formatPrice(item.selling_price)}
                    </span>
                    <span className="cost-price">
                      Cost: LKR {formatPrice(item.purchase_price)}
                    </span>
                  </div>

                  <div className="item-status">
                    <span
                      className={`status-badge status-${item.status.toLowerCase()}`}
                    >
                      {item.status}
                    </span>
                  </div>

                  {item.product_remark && (
                    <p className="item-remark">Remark: {item.product_remark}</p>
                  )}
                </div>

                <div className="item-actions">
                  <button
                    className="btn-update"
                    onClick={() => openEditModal(item)}
                  >
                    Edit
                  </button>
                  <button
                    className="btn-delete"
                    onClick={() => openDeleteModal(item)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="no-items-found">
              <p>No items found{searchTerm && ` matching "${searchTerm}"`}.</p>
              {searchTerm && (
                <button
                  className="btn-clear-search"
                  onClick={() => setSearchTerm("")}
                >
                  Clear Search
                </button>
              )}
            </div>
          )}
        </div>

        {/* Delete Modal */}
        {deleteModal.isOpen && (
          <div className="modal-overlay">
            <div className="modal-content">
              <div className="modal-header">
                <h3>Confirm Delete</h3>
                <button className="modal-close" onClick={closeDeleteModal}>
                  ×
                </button>
              </div>

              <div className="modal-body">
                <p>Are you sure you want to delete this item?</p>
                <div className="item-to-delete">
                  <strong>{deleteModal.item?.item_name}</strong>
                  <br />
                  <span>Serial: {deleteModal.item?.serial_number}</span>
                  <br />
                  <span>Category: {deleteModal.item?.category}</span>
                </div>
                <p className="warning-text">
                  ⚠️ This action cannot be undone. All item data will be
                  permanently deleted.
                </p>
              </div>

              <div className="modal-actions">
                <button
                  className="btn-cancel"
                  onClick={closeDeleteModal}
                  disabled={deleteModal.loading}
                >
                  Cancel
                </button>
                <button
                  className="btn-confirm-delete"
                  onClick={handleDeleteConfirm}
                  disabled={deleteModal.loading}
                >
                  {deleteModal.loading ? "Deleting..." : "Yes, Delete Item"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Modal */}
        {editModal.isOpen && (
          <div className="modal-overlay">
            <div className="modal-content edit-modal">
              <div className="modal-header">
                <h3>Edit Product: {editModal.item?.item_name}</h3>
                <button className="modal-close" onClick={closeEditModal}>
                  ×
                </button>
              </div>

              <div className="modal-body">
                <div className="edit-form">
                  {/* Image Upload */}
                  <div className="form-group">
                    <label>Product Image</label>
                    <div className="image-upload-container">
                      <img
                        src={editModal.imagePreview || "/placeholder-image.png"}
                        alt="Preview"
                        className="image-preview"
                      />
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="image-upload-input"
                      />
                      <button
                        type="button"
                        className="btn-upload"
                        onClick={() =>
                          document.querySelector(".image-upload-input").click()
                        }
                      >
                        Change Image
                      </button>
                    </div>
                  </div>

                  {/* Basic Info */}
                  <div className="form-row">
                    <div className="form-group serial-number-group">
                      <label>Serial Number *</label>
                      <div className="serial-input-container">
                        <input
                          type="text"
                          name="serial_number"
                          value={editModal.formData.serial_number}
                          onChange={handleInputChange}
                          maxLength={50}
                          readOnly={editModal.isSerialGenerated}
                          required
                        />
                        <button
                          type="button"
                          className="generate-btn"
                          onClick={generateSerialNumber}
                          disabled={editModal.isSerialGenerated}
                        >
                          {editModal.isSerialGenerated
                            ? "Generated"
                            : "Generate"}
                        </button>
                      </div>
                      {editModal.errors.serial_number && (
                        <span className="error-text">
                          {editModal.errors.serial_number}
                        </span>
                      )}
                    </div>
                    <div className="form-group">
                      <label>Product Name *</label>
                      <input
                        type="text"
                        name="item_name"
                        value={editModal.formData.item_name}
                        onChange={handleInputChange}
                        maxLength={100}
                        required
                      />
                      {editModal.errors.item_name && (
                        <span className="error-text">
                          {editModal.errors.item_name}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Category *</label>
                      <select
                        name="category"
                        value={editModal.formData.category}
                        onChange={handleInputChange}
                        required
                      >
                        <option value="">Select Category</option>
                        {categories.map((cat) => (
                          <option key={cat} value={cat}>
                            {cat}
                          </option>
                        ))}
                      </select>
                      {editModal.errors.category && (
                        <span className="error-text">
                          {editModal.errors.category}
                        </span>
                      )}
                    </div>

                    <div className="form-group">
                      <label>Status *</label>
                      <select
                        name="status"
                        value={editModal.formData.status}
                        onChange={handleInputChange}
                        required
                      >
                        {statusOptions.map((status) => (
                          <option key={status} value={status}>
                            {status}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Supplier *</label>
                    <select
                      name="supplier_name"
                      value={editModal.formData.supplier_name || ""}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="">Select Supplier</option>
                      {suppliers
                        .filter((supplier) => supplier.status === "Active")
                        .map((supplier) => (
                          <option key={supplier._id} value={supplier.name}>
                            {supplier.name}{" "}
                            {supplier.company_name
                              ? `- ${supplier.company_name}`
                              : ""}
                          </option>
                        ))}
                    </select>
                    {editModal.errors.supplier_name && (
                      <span className="error-text">
                        {editModal.errors.supplier_name}
                      </span>
                    )}
                  </div>

                  <div className="form-group">
                    <label>Description</label>
                    <textarea
                      name="description"
                      value={editModal.formData.description}
                      onChange={handleInputChange}
                      rows="3"
                      maxLength={500}
                    />
                    {editModal.errors.description && (
                      <span className="error-text">
                        {editModal.errors.description}
                      </span>
                    )}
                  </div>

                  {/* Inventory Info */}
                  <div className="form-row">
                    <div className="form-group">
                      <label>Quantity in Stock *</label>
                      <input
                        type="number"
                        name="quantity_in_stock"
                        value={editModal.formData.quantity_in_stock}
                        onChange={handleInputChange}
                        min="0"
                        max="10000"
                        required
                      />
                      {editModal.errors.quantity_in_stock && (
                        <span className="error-text">
                          {editModal.errors.quantity_in_stock}
                        </span>
                      )}
                      <div className="field-hint">
                        <p style={{ fontSize: "12px", color: "#666", margin: "5px 0 0 0" }}>
                          *Set Quantity 0 to make Out of stock
                        </p>
                      </div>
                    </div>

                    <div className="form-group">
                      <label>Re-order Level *</label>
                      <input
                        type="number"
                        name="re_order_level"
                        value={editModal.formData.re_order_level}
                        onChange={handleInputChange}
                        min="1"
                        max="10000"
                        required
                      />
                      {editModal.errors.re_order_level && (
                        <span className="error-text">
                          {editModal.errors.re_order_level}
                        </span>
                      )}
                      
                    </div>
                  </div>

                  {/* Prices */}
                  <div className="form-row">
                    <div className="form-group">
                      <label>Purchase Price *</label>
                      <input
                        type="text"
                        name="purchase_price"
                        value={editModal.formData.purchase_price}
                        onChange={handleInputChange}
                        onBlur={handlePriceBlur}
                        placeholder="0.00"
                        required
                      />
                      {editModal.errors.purchase_price && (
                        <span className="error-text">
                          {editModal.errors.purchase_price}
                        </span>
                      )}
                    </div>

                    <div className="form-group">
                      <label>Selling Price *</label>
                      <input
                        type="text"
                        name="selling_price"
                        value={editModal.formData.selling_price}
                        onChange={handleInputChange}
                        onBlur={handlePriceBlur}
                        placeholder="0.00"
                        required
                      />
                      {editModal.errors.selling_price && (
                        <span className="error-text">
                          {editModal.errors.selling_price}
                        </span>
                      )}
                    </div>
                  </div>

                  {(editModal.formData.status === "Damaged" ||
                    editModal.formData.status === "Returned") && (
                    <div className="form-group">
                      <label>
                        {editModal.formData.status === "Damaged"
                          ? "Damage Details *"
                          : "Return Reason *"}
                      </label>
                      <textarea
                        name="product_remark"
                        value={editModal.formData.product_remark}
                        onChange={handleInputChange}
                        rows="2"
                        maxLength={200}
                        required
                      />
                      {editModal.errors.product_remark && (
                        <span className="error-text">
                          {editModal.errors.product_remark}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="modal-actions">
                <button
                  className="btn-cancel"
                  onClick={closeEditModal}
                  disabled={editModal.loading}
                >
                  Cancel
                </button>
                <button
                  className="btn-confirm-update"
                  onClick={handleUpdateConfirm}
                  disabled={editModal.loading}
                >
                  {editModal.loading ? "Updating..." : "Update Item"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default View_All_Items;