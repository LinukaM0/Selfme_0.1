import React, { useState, useEffect } from "react";
import axios from "axios";
import InventoryManagementNav from "../Inventory_Management_Nav/Inventory_Management_Nav";
import "./Add_Items.css";

const Add_Items = () => {
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
  const [suppliers, setSuppliers] = useState([]);
  const [errors, setErrors] = useState({});
  const [isSerialGenerated, setIsSerialGenerated] = useState(false);

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
  ];

  const statusOptions = ["Available", "Coming Soon", "Damaged", "Returned"];

  // Fetch active suppliers
  useEffect(() => {
    const fetchSuppliers = async () => {
      try {
        const res = await axios.get("http://localhost:5000/suppliers");
        setSuppliers(res.data.filter((s) => s.status === "Active"));
      } catch (err) {
        console.error("Error fetching suppliers:", err);
      }
    };
    fetchSuppliers();
  }, []);

  // Handle input changes with validation
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
    
    // Validate price relationship when either price field changes
    if (name === "purchase_price" || name === "selling_price") {
      validatePriceRelationship();
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

  const validatePriceRelationship = () => {
    const purchasePrice = parseFloat(formData.purchase_price) || 0;
    const sellingPrice = parseFloat(formData.selling_price) || 0;
    
    if (purchasePrice > 0 && sellingPrice > 0 && sellingPrice <= purchasePrice) {
      setErrors((prev) => ({
        ...prev,
        selling_price: "Selling price must be greater than purchase price"
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
    setIsSerialGenerated(true);
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
    // Validate price relationship after formatting
    validatePriceRelationship();
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
    }

    // New validation: Selling price must be greater than purchase price
    const purchasePrice = parseFloat(formData.purchase_price) || 0;
    const sellingPrice = parseFloat(formData.selling_price) || 0;
    
    if (purchasePrice > 0 && sellingPrice > 0 && sellingPrice <= purchasePrice) {
      newErrors.selling_price = "Selling price must be greater than purchase price";
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

      await axios.post("http://localhost:5000/products", data, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      alert("Product added successfully!");
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
      setIsSerialGenerated(false);
    } catch (error) {
      if (error.response?.data?.code === 11000) {
        alert("Error: Serial Number already exists!");
      } else {
        alert("Error adding product");
      }
    }
  };

  return (
    <div>
      <InventoryManagementNav />
      <div className="add-item-container">
        <h2>Add New Product</h2>
        <form onSubmit={handleSubmit} className="add-item-form">
          {/* Basic Info */}
          <div className="form-section">
            <h3>Basic Information</h3>
            <div className="form-row">
              <div className="form-group serial-number-group">
                <label>Serial Number *</label>
                <div className="serial-input-container">
                  <input
                    type="text"
                    name="serial_number"
                    placeholder="SN-1758999984335-411"
                    value={formData.serial_number}
                    readOnly
                    required
                  />
                  <button
                    type="button"
                    className="generate-btn"
                    onClick={generateSerialNumber}
                    disabled={isSerialGenerated}
                  >
                    {isSerialGenerated ? "Generated" : "Generate"}
                  </button>
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
                  required
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
                  required
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
                  required
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
            <h3>Inventory Information</h3>
            <div className="form-row">
              <div className="form-group">
                <label>Quantity in Stock *</label>
                <input
                  type="number"
                  name="quantity_in_stock"
                  value={formData.quantity_in_stock}
                  onChange={handleChange}
                  min="1"
                  max="500"
                  required
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
                  min="1"
                  max="500"
                  required
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
                required
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
            <h3>Pricing Information</h3>
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
                  required
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
                  required
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
              <h3>Remarks</h3>
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
                  required
                />
                {errors.product_remark && (
                  <span className="error-text">{errors.product_remark}</span>
                )}
              </div>
            </div>
          )}

          <button type="submit" className="form-submit-btn">
            Add Product
          </button>
        </form>
      </div>
    </div>
  );
};

export default Add_Items;