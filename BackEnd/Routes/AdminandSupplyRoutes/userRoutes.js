const express = require("express");
const router = express.Router();
const UserController = require("../../Controllers/AdminandSupplyControllers/userController");

router.get("/", UserController.getAllUsers); // Get all users
router.post("/", UserController.addUser); // Add user
router.get("/:id", UserController.getUserById); // Get user by ID
router.put("/:id", UserController.updateUser); // Update user
router.delete("/:id", UserController.deleteUser); // Delete user

module.exports = router;