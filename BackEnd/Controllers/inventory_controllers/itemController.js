const Item = require("../../Model/inventory_models/itemModel");
const fs = require("fs");
const path = require("path");

// Helper to delete old image
const deleteImage = (filename) => {
  if (!filename) return;
  const filePath = path.join(__dirname, "../../item_images", filename);
  if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
};

// GET all items
const getAllItems = async (req, res) => {
  try {
    const {
      sortBy = "createdAt",
      sortOrder = "desc",
      category,
      status,
      lowStock,
    } = req.query;
    let filter = {};
    if (category) filter.category = new RegExp(category, "i");
    if (status) filter.status = new RegExp(status, "i");
    if (lowStock === "true")
      filter.$expr = { $lte: ["$quantity_in_stock", "$re_order_level"] };

    const sort = { [sortBy]: sortOrder === "desc" ? -1 : 1 };
    const items = await Item.find(filter).sort(sort);
    res.json(items);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error fetching items", error: err.message });
  }
};

// CREATE item
const createItem = async (req, res) => {
  try {
    if (req.fileValidationError)
      return res.status(400).json({ message: req.fileValidationError });

    const {
      serial_number,
      item_name,
      category,
      description,
      quantity_in_stock,
      re_order_level,
      supplier_name, // updated
      purchase_price,
      selling_price,
      status,
      product_remark,
    } = req.body;

    if (!serial_number || !item_name || !category || !supplier_name) {
      return res.status(400).json({ message: "Required fields missing" });
    }

    const newItem = new Item({
      serial_number,
      item_name,
      category,
      item_image: req.file ? req.file.filename : null,
      description: description || "",
      quantity_in_stock: Number(quantity_in_stock),
      re_order_level: Number(re_order_level),
      supplier_name,
      purchase_price: Number(purchase_price),
      selling_price: Number(selling_price),
      status: status || "Available",
      product_remark: product_remark || "",
    });

    const savedItem = await newItem.save();
    res
      .status(201)
      .json({ message: "Product created successfully", item: savedItem });
  } catch (err) {
    console.error("Create item error:", err);
    if (err.code === 11000) {
      return res
        .status(400)
        .json({
          message: "Serial number already exists",
          field: "serial_number",
        });
    }
    res
      .status(500)
      .json({ message: "Error creating product", error: err.message });
  }
};

// GET item by ID
const getItemById = async (req, res) => {
  try {
    const item = await Item.findById(req.params.id);
    if (!item) return res.status(404).json({ message: "Item not found" });
    res.status(200).json(item);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// UPDATE item
const updateItem = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = { ...req.body };
    const file = req.file;

    const existingItem = await Item.findById(id);
    if (!existingItem)
      return res.status(404).json({ message: "Item not found" });

    if (file) {
      deleteImage(existingItem.item_image);
      updates.item_image = file.filename;
    }

    [
      "quantity_in_stock",
      "re_order_level",
      "purchase_price",
      "selling_price",
    ].forEach((field) => {
      if (updates[field] !== undefined)
        updates[field] = updates[field] === "" ? null : Number(updates[field]);
    });

    const updatedItem = await Item.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true,
    });
    res
      .status(200)
      .json({ message: "Product updated successfully", item: updatedItem });
  } catch (err) {
    if (err.code === 11000)
      return res
        .status(400)
        .json({
          message: "Serial number already exists",
          field: "serial_number",
        });
    res
      .status(500)
      .json({ message: "Error updating product", error: err.message });
  }
};

// DELETE item
const deleteItem = async (req, res) => {
  try {
    const item = await Item.findById(req.params.id);
    if (!item) return res.status(404).json({ message: "Item not found" });

    deleteImage(item.item_image);
    await Item.findByIdAndDelete(req.params.id);
    res
      .status(200)
      .json({ message: "Product deleted successfully", deletedItem: item });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = {
  getAllItems,
  createItem,
  getItemById,
  updateItem,
  deleteItem,
};
