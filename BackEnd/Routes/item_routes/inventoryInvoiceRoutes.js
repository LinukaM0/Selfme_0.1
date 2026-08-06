const express = require("express");
const router = express.Router();
const inventoryInvoiceController = require("../../Controllers/inventory_controllers/inventoryInvoiceController");

router.post("/", inventoryInvoiceController.createInvoice);
router.get("/", inventoryInvoiceController.getAllInvoices);
router.get("/user/:userid", inventoryInvoiceController.getInvoicesByUserId);
router.get("/:id", inventoryInvoiceController.getInvoiceById);
router.put("/:id", inventoryInvoiceController.updateInvoice);
router.delete("/:id", inventoryInvoiceController.deleteInvoice);

module.exports = router;
