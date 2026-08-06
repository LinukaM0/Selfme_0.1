const express = require("express");
const router = express.Router();
const {
  createProductRequest,
  getAllProductRequests,
  getProductRequestById,
  updateProductRequest,
  deleteProductRequest,
} = require("../../Controllers/inventory_controllers/productRequestController");

// Create
router.post("/", createProductRequest);

// Get All
router.get("/", getAllProductRequests);

// Get One by ID
router.get("/:id", getProductRequestById);

// Update
router.put("/:id", updateProductRequest);

// Delete
router.delete("/:id", deleteProductRequest);

module.exports = router;
