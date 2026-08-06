const Order = require("../../Model/inventory_models/OrderModel");
const Product = require("../../Model/inventory_models/itemModel");

const Supplier = require("../../Model/inventory_models/SupplierModel")

// Get all orders with population
const getOrders = async (req, res) => {
  try {
    const orders = await Order.find()
      .populate('product')
      .populate('supplier')
      .sort({ orderDate: -1 });
    
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create a new order
const createOrder = async (req, res) => {
  try {
    const { product, supplier, quantity, status } = req.body;
    
    // Validate required fields
    if (!product || !supplier || !quantity) {
      return res.status(400).json({ 
        message: 'Product, supplier, and quantity are required' 
      });
    }
    
    // Validate quantity
    if (quantity <= 0) {
      return res.status(400).json({ 
        message: 'Quantity must be greater than 0' 
      });
    }
    
    const order = new Order({
      product,
      supplier,
      quantity: parseInt(quantity),
      status: status || 'pending',
      orderDate: new Date()
    });
    
    const savedOrder = await order.save();
    
    // Populate the saved order before returning
    const populatedOrder = await Order.findById(savedOrder._id)
      .populate('product')
      .populate('supplier');
    
    res.status(201).json({
      success: true,
      message: 'Order placed successfully',
      order: populatedOrder
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Update order status
const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    const order = await Order.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    ).populate('product').populate('supplier');
    
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    
    res.json({
      success: true,
      message: 'Order status updated successfully',
      order
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Delete order
const deleteOrder = async (req, res) => {
  try {
    const { id } = req.params;
    
    const order = await Order.findByIdAndDelete(id);
    
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    
    res.json({
      success: true,
      message: 'Order deleted successfully'
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Get order by ID
const getOrderById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const order = await Order.findById(id)
      .populate('product')
      .populate('supplier');
    
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    
    res.json(order);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

module.exports = {
  getOrders,
  createOrder,
  updateOrderStatus,
  deleteOrder,
  getOrderById
};