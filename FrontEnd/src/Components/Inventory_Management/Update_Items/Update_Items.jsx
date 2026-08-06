import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import InventoryManagementNav from "../Inventory_Management_Nav/Inventory_Management_Nav";
import "./Update_Items.css";

const Update_Items = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [item, setItem] = useState({
    serial_number: "",
    item_name: "",
    category: "",
    quantity_in_stock: "",
    supplier_id: "",
    min_stock_level: "",
    item_image: "",
  });
  const [newImage, setNewImage] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch item details
  useEffect(() => {
    const fetchItem = async () => {
      try {
        setIsLoading(true);
        const response = await axios.get(`http://localhost:5000/items/${id}`);
        setItem(response.data);
      } catch (err) {
        setError("Failed to load item details");
        console.error("Error fetching item:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchItem();
  }, [id]);

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setItem((prev) => ({
      ...prev,
      [name]:
        name.includes("stock") || name.includes("level")
          ? Number(value)
          : value,
    }));
  };

  // Handle delete
  const handleDelete = async () => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this item?"
    );
    if (!confirmDelete) return;

    try {
      setIsLoading(true);
      const response = await axios.delete(`http://localhost:5000/items/${id}`);

      if (response.status === 200) {
        alert("Item deleted successfully!");
        navigate("/viewAllItems");
      }
    } catch (err) {
      const errorMessage =
        err.response?.data?.message ||
        "Failed to delete item. Please try again.";
      setError(errorMessage);
      console.error("Delete error:", {
        error: err.message,
        response: err.response?.data,
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle image change
  const handleImageChange = (e) => {
    setNewImage(e.target.files[0]);
  };

  // Handle update
  const handleUpdate = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const formData = new FormData();

      // Append all fields
      formData.append("serial_number", item.serial_number);
      formData.append("item_name", item.item_name);
      formData.append("category", item.category);
      formData.append("quantity_in_stock", item.quantity_in_stock);
      formData.append("supplier_id", item.supplier_id);
      formData.append("min_stock_level", item.min_stock_level);

      // Only append new image if provided
      if (newImage) {
        formData.append("item_image", newImage);
      }

      const response = await axios.put(
        `http://localhost:5000/items/${id}`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      if (response.status === 200) {
        alert("Item updated successfully!");
        navigate("/viewAllItems");
      }
    } catch (err) {
      const errorMessage =
        err.response?.data?.message ||
        "Failed to update item. Please try again.";
      setError(errorMessage);
      console.error("Update error:", {
        error: err.message,
        response: err.response?.data,
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) return <div className="loading">Loading item details...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div>
      <InventoryManagementNav />
      <div className="update-item-container">
        <h2>Update Item</h2>
        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleUpdate} encType="multipart/form-data">
          {/* Current image preview */}
          {item.item_image && (
            <div className="image-preview">
              <img
                src={`http://localhost:5000/images/${item.item_image}`}
                alt={item.item_name}
                className="preview-img"
              />
              <p>Current Image</p>
            </div>
          )}

          <div className="form-group">
            <label>Serial Number</label>
            <input
              type="text"
              name="serial_number"
              value={item.serial_number}
              onChange={handleChange}
              placeholder="Serial Number"
              required
            />
          </div>

          <div className="form-group">
            <label>Item Name</label>
            <input
              type="text"
              name="item_name"
              value={item.item_name}
              onChange={handleChange}
              placeholder="Item Name"
              required
            />
          </div>

          <div className="form-group">
            <label>Category</label>
            <input
              type="text"
              name="category"
              value={item.category}
              onChange={handleChange}
              placeholder="Category"
              required
            />
          </div>

          <div className="form-group">
            <label>Quantity in Stock</label>
            <input
              type="number"
              name="quantity_in_stock"
              value={item.quantity_in_stock}
              onChange={handleChange}
              placeholder="Quantity in Stock"
              min="0"
              required
            />
          </div>

          <div className="form-group">
            <label>Supplier ID</label>
            <input
              type="text"
              name="supplier_id"
              value={item.supplier_id}
              onChange={handleChange}
              placeholder="Supplier ID"
              required
            />
          </div>

          <div className="form-group">
            <label>Minimum Stock Level</label>
            <input
              type="number"
              name="min_stock_level"
              value={item.min_stock_level}
              onChange={handleChange}
              placeholder="Minimum Stock Level"
              min="0"
              required
            />
          </div>

          <div className="form-group">
            <label>Upload New Image</label>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="file-input"
            />
            {newImage && (
              <div className="new-image-notice">
                New image selected: {newImage.name}
              </div>
            )}
          </div>

          <button type="submit" className="update-btn" disabled={isLoading}>
            {isLoading ? "Updating..." : "Save Changes"}
          </button>

          
        </form>
      </div>
    </div>
  );
};

export default Update_Items;
