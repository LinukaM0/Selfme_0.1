// 2) Routes = BackEnd > Routes > AdminandSupplyRoutes > GetSupplyAllRoute.js

const express = require("express");
const router = express.Router();
// Insert Model
const ProductRequest = require("../../Model/inventory_models/productRequestModel");
// Insert controller
const GetSupplyController = require("../../Controllers/AdminandSupplyControllers/GetSupplyController");

router.get("/", GetSupplyController.getAllProductRequests);
router.get("/:id", GetSupplyController.getById);
router.put("/:id", GetSupplyController.updateStatus);

module.exports = router;