const express = require('express');
const router = express.Router();
const Order = require("../../Model/inventory_models/OrderModel");

// GET all orders
router.get('/', async (req, res) => {
  try {
    const orders = await Order.find()
      .populate('product')
      .populate('supplier')
      .sort({ orderDate: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST new order
router.post('/', async (req, res) => {
  try {
    const { product, supplier, quantity } = req.body;
    
    const order = new Order({
      product,
      supplier,
      quantity,
      status: 'pending',
      orderDate: new Date()
    });
    
    const savedOrder = await order.save();
    res.json({ 
      success: true, 
      message: 'Order created successfully',
      order: savedOrder 
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

module.exports = router;