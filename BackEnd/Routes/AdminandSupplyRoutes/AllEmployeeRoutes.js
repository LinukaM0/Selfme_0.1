const express = require("express");
const router = express.Router();

// Import Controller
const EmployeeController = require("../../Controllers/AdminandSupplyControllers/AllEmployeeController");

router.get("/", EmployeeController.getAllEmployees);
router.get("/:id", EmployeeController.getById);

module.exports = router;