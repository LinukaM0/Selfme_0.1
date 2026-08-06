const express = require("express");
const router = express.Router();
const { updateFinancialStatus } = require("../../Controllers/FinanceManager/updateFinancialStatusController");
const { getAllProductRequests } = require("../../Controllers/inventory_controllers/productRequestController");

// Route to fetch all product requests for financial manager
router.get("/financial/product-requests", getAllProductRequests);

// Route to update financial status of a product request
router.put("/financial/product-requests/:id/financial-status", updateFinancialStatus);

module.exports = router;