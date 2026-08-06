const express = require("express");
const router = express.Router();
const invoiceOrderController = require("../../Controllers/inventory_controllers/invoiceOrderController");

router.post("/process", invoiceOrderController.processInvoice);
router.put("/:orderId/confirm", invoiceOrderController.confirmOrder);
router.get("/pending", invoiceOrderController.getPendingOrders);
router.get("/processed", invoiceOrderController.getProcessedOrders);

module.exports = router;