// 2) Routes = BackEnd > Routes > AdminandSupplyRoutes > ViewSupplyAllRoute.js
const express = require("express");
const router = express.Router();

// Insert Model
const Supplier = require("../../Model/inventory_models/SupplierModel");

// Insert controller
const SupplierController = require("../../Controllers/AdminandSupplyControllers/ViewSupplyAllController");

router.get("/", SupplierController.getAllSuppliers);
router.get("/:id", SupplierController.getById);

module.exports = router;