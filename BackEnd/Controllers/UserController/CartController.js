const jwt = require("jsonwebtoken");
const Cart = require("../../Model/UserModel/CartModel");
const Product = require("../../Model/inventory_models/itemModel");

console.log("Product Model Loaded:", Product ? "Yes" : "No");

const addToCart = async (req, res) => {
  try {
    const { itemId, quantity } = req.body;
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).json({ message: "No token provided" });
    }
    const decoded = jwt.verify(token, "your_jwt_secret_key_here");
    const userid = decoded.userid; // Changed to userid

    // Validate product exists
    const product = await Product.findById(itemId);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Validate stock
    if (product.quantity_in_stock < quantity) {
      return res.status(400).json({ message: "Insufficient stock" });
    }

    // Calculate subtotal
    const unitPrice = product.selling_price;
    const subtotal = quantity * unitPrice;

    // Check if the item is already in the cart
    let cartItem = await Cart.findOne({ userid, itemId, receipt: null }); // Changed to userid
    if (cartItem) {
      cartItem.quantity += quantity;
      cartItem.subtotal = cartItem.quantity * cartItem.unit_price;
      if (product.quantity_in_stock < cartItem.quantity) {
        return res.status(400).json({ message: "Insufficient stock for updated quantity" });
      }
      await cartItem.save();
      return res.status(200).json({ message: "Product quantity updated in cart", cartItem });
    } else {
      cartItem = new Cart({
        userid, // Changed to userid
        itemId,
        quantity,
        unit_price: unitPrice,
        subtotal,
        receipt: null,
      });
      await cartItem.save();
      return res.status(201).json({ message: "Product added to cart", cartItem });
    }
  } catch (err) {
    console.error("addToCart error:", err);
    if (err.name === "JsonWebTokenError") {
      return res.status(401).json({ message: "Invalid token" });
    }
    res.status(400).json({ message: "Error adding to cart", error: err.message });
  }
};

const getCart = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).json({ message: "No token provided" });
    }
    const decoded = jwt.verify(token, "your_jwt_secret_key_here");
    const userid = decoded.userid; // Changed to userid

    // Fetch all unpaid cart items, populate product details
    const cartItems = await Cart.find({ userid, receipt: null }).populate({ // Changed to userid
      path: 'itemId',
      select: 'item_name description item_image selling_price'
    });
    console.log("Fetched Cart Items:", cartItems);
    res.status(200).json(cartItems);
  } catch (err) {
    console.error("getCart error:", err);
    if (err.name === "JsonWebTokenError") {
      return res.status(401).json({ message: "Invalid token" });
    }
    res.status(400).json({ message: "Error fetching cart", error: err.message });
  }
};

const updateCartItem = async (req, res) => {
  try {
    const { quantity } = req.body;
    const cartItemId = req.params.id;
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).json({ message: "No token provided" });
    }
    const decoded = jwt.verify(token, "your_jwt_secret_key_here");
    const userid = decoded.userid; // Changed to userid

    // Find the cart item
    const cartItem = await Cart.findOne({ _id: cartItemId, userid, receipt: null }); // Changed to userid
    if (!cartItem) {
      return res.status(404).json({ message: "Cart item not found" });
    }

    // Fetch the product to check stock
    const product = await Product.findById(cartItem.itemId);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }
    if (product.quantity_in_stock < quantity) {
      return res.status(400).json({ message: "Insufficient stock" });
    }

    // Update quantity and subtotal
    cartItem.quantity = quantity;
    cartItem.subtotal = quantity * cartItem.unit_price;
    await cartItem.save();
    res.status(200).json(cartItem);
  } catch (err) {
    console.error("updateCartItem error:", err);
    if (err.name === "JsonWebTokenError") {
      return res.status(401).json({ message: "Invalid token" });
    }
    res.status(400).json({ message: "Error updating cart item", error: err.message });
  }
};

const deleteCartItem = async (req, res) => {
  try {
    const cartItemId = req.params.id;
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).json({ message: "No token provided" });
    }
    const decoded = jwt.verify(token, "your_jwt_secret_key_here");
    const userid = decoded.userid; // Changed to userid

    // Find and delete the cart item
    const cartItem = await Cart.findOneAndDelete({ _id: cartItemId, userid, receipt: null }); // Changed to userid
    if (!cartItem) {
      return res.status(404).json({ message: "Cart item not found" });
    }
    res.status(200).json({ message: "Item removed from cart" });
  } catch (err) {
    console.error("deleteCartItem error:", err);
    if (err.name === "JsonWebTokenError") {
      return res.status(401).json({ message: "Invalid token" });
    }
    res.status(400).json({ message: "Error deleting cart item", error: err.message });
  }
};

module.exports = { addToCart, getCart, updateCartItem, deleteCartItem };