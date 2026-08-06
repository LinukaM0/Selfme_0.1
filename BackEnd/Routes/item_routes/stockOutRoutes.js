const express = require("express");
const router = express.Router();
const stockOutController = require("../../Controllers/inventory_controllers/StockOutController");

// Create order
router.post("/", stockOutController.createStockOut);

// Confirm order
router.put("/:id/confirm", stockOutController.confirmStockOut);

// Get all stock outs
router.get("/", stockOutController.getAllStockOuts);

module.exports = router;
