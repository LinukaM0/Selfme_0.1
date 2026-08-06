// controllers/productRequestController.js
const ProductRequest = require("../../Model/inventory_models/productRequestModel");

// ✅ Create a new product request
const createProductRequest = async (req, res) => {
  try {
    const productRequestData = {
      ...req.body,
      request_status: req.body.request_status || "pending", // default pending
    };

    const productRequest = new ProductRequest(productRequestData);
    await productRequest.save();

    res.status(201).json({
      message: "Product request created successfully",
      productRequest,
    });
  } catch (error) {
    res.status(500).json({ message: "Error creating product request", error });
  }
};

// ✅ Get all product requests
const getAllProductRequests = async (req, res) => {
  try {
    const productRequests = await ProductRequest.find().sort({ createdAt: -1 });
    res.status(200).json(productRequests);
  } catch (error) {
    res.status(500).json({ message: "Error fetching product requests", error });
  }
};

// ✅ Get a single product request by ID
const getProductRequestById = async (req, res) => {
  try {
    const productRequest = await ProductRequest.findById(req.params.id);

    if (!productRequest) {
      return res.status(404).json({ message: "Product request not found" });
    }

    res.status(200).json(productRequest);
  } catch (error) {
    res.status(500).json({ message: "Error fetching product request", error });
  }
};

// ✅ Update a product request
const updateProductRequest = async (req, res) => {
  try {
    const updatedProductRequest = await ProductRequest.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!updatedProductRequest) {
      return res.status(404).json({ message: "Product request not found" });
    }

    res.status(200).json({
      message: "Product request updated successfully",
      updatedProductRequest,
    });
  } catch (error) {
    res.status(500).json({ message: "Error updating product request", error });
  }
};

// ✅ Delete a product request
const deleteProductRequest = async (req, res) => {
  try {
    const deletedProductRequest = await ProductRequest.findByIdAndDelete(
      req.params.id
    );

    if (!deletedProductRequest) {
      return res.status(404).json({ message: "Product request not found" });
    }

    res.status(200).json({
      message: "Product request deleted successfully",
    });
  } catch (error) {
    res.status(500).json({ message: "Error deleting product request", error });
  }
};

module.exports = {
  createProductRequest,
  getAllProductRequests,
  getProductRequestById,
  updateProductRequest,
  deleteProductRequest,
};
