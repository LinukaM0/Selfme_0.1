// cartroute.js (updated with new routes)
const express = require("express");
const router = express.Router();
const { addToCart, getCart, updateCartItem, deleteCartItem } = require("../../Controllers/UserController/CartController");

router.post("/cart", addToCart);
router.get("/cart", getCart);
router.put("/cart/:id", updateCartItem);
router.delete("/cart/:id", deleteCartItem);

module.exports = router;