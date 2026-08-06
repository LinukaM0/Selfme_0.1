const mongoose = require("mongoose");
const Invoice = require("../../Model/UserModel/InvoiceModel");
const InvoiceOrder = require("../../Model/inventory_models/InvoiceOrderModel");
const Product = require("../../Model/inventory_models/itemModel");

// Process invoice - move to InvoiceOrder (pending state)
exports.processInvoice = async (req, res) => {
  try {
    const { invoiceId } = req.body;

    if (!invoiceId) {
      return res.status(400).json({ 
        success: false, 
        message: "Invoice ID is required" 
      });
    }

    // Find the invoice with populated products
    const invoice = await Invoice.findById(invoiceId)
      .populate('items.itemId')
      .exec();
    
    if (!invoice) {
      return res.status(404).json({ 
        success: false, 
        message: "Invoice not found" 
      });
    }

    // Generate stock out ID
    const stockOutId = `SO-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;

    // Create InvoiceOrder with pending status
    const invoiceOrder = new InvoiceOrder({
      userid: invoice.userid,
      items: invoice.items.map(item => ({
        itemId: item.itemId._id,
        quantity: item.quantity,
        unit_price: item.unit_price,
        subtotal: item.subtotal
      })),
      total: invoice.total,
      tax: invoice.tax,
      grandTotal: invoice.grandTotal,
      status: "pending",
      created_at: invoice.created_at,
      stock_out_id: stockOutId
    });

    await invoiceOrder.save();

    // Delete the original invoice
    await Invoice.findByIdAndDelete(invoiceId);

    res.status(200).json({
      success: true,
      message: "Order moved to pending confirmation",
      stockOutId: stockOutId,
      invoiceOrder: invoiceOrder
    });

  } catch (err) {
    console.error("Error processing invoice:", err);
    res.status(500).json({
      success: false,
      message: "Error processing order",
      error: err.message
    });
  }
};

// Confirm pending order and reduce stock
exports.confirmOrder = async (req, res) => {
  try {
    const { orderId } = req.params;

    // Find the pending order with populated products
    const order = await InvoiceOrder.findById(orderId)
      .populate('items.itemId')
      .exec();
    
    if (!order) {
      return res.status(404).json({ 
        success: false, 
        message: "Order not found" 
      });
    }

    if (order.status !== "pending") {
      return res.status(400).json({ 
        success: false, 
        message: "Order is not in pending state" 
      });
    }

    // Check stock availability and reduce stock
    for (const item of order.items) {
      const product = item.itemId;
      if (!product) {
        return res.status(400).json({
          success: false,
          message: `Product not found`
        });
      }
      
      if (product.quantity_in_stock < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for ${product.item_name}. Available: ${product.quantity_in_stock}, Requested: ${item.quantity}`
        });
      }

      // Reduce stock
      await Product.findByIdAndUpdate(
        product._id,
        { 
          $inc: { quantity_in_stock: -item.quantity } 
        }
      );
    }

    // Update order status to processed
    order.status = "processed";
    order.processed_at = new Date();
    await order.save();

    res.status(200).json({
      success: true,
      message: "Order confirmed and stock reduced successfully",
      order: order
    });

  } catch (err) {
    console.error("Error confirming order:", err);
    res.status(500).json({
      success: false,
      message: "Error confirming order",
      error: err.message
    });
  }
};

// Get pending orders with product details
exports.getPendingOrders = async (req, res) => {
  try {
    const orders = await InvoiceOrder.find({ status: "pending" })
      .populate('items.itemId', 'item_name serial_number category selling_price item_image')
      .sort({ created_at: -1 });
    res.status(200).json(orders);
  } catch (err) {
    res.status(500).json({
      message: "Error fetching pending orders",
      error: err.message
    });
  }
};

// Get processed orders with product details
exports.getProcessedOrders = async (req, res) => {
  try {
    const orders = await InvoiceOrder.find({ status: "processed" })
      .populate('items.itemId', 'item_name serial_number category selling_price item_image')
      .sort({ processed_at: -1 });
    res.status(200).json(orders);
  } catch (err) {
    res.status(500).json({
      message: "Error fetching processed orders",
      error: err.message
    });
  }
};