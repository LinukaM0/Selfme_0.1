// routes/itemRoutes.js
const express = require("express");
const router = express.Router();
const { getAllItems, createItem } = require("../../Controllers/UserController/ItemCartController"); // Adjust path as needed

router.get("/items", getAllItems); // For fetching items
router.post("/items", createItem); // For creating items

module.exports = router;