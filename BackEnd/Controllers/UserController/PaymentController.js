// Controllers/UserController/PaymentController.js (updated to use counter for payment_id)
const mongoose = require('mongoose');
const Payment = require('../../Model/UserModel/PaymentModel');
const Cart = require('../../Model/UserModel/CartModel');
const Invoice = require('../../Model/UserModel/InvoiceModel');
const Counter = require('../../Model/AdminandSupplyModel/counterPaymentModel');
const jwt = require('jsonwebtoken');

// Function to get the next sequence value and generate formatted payment_id
const getNextPaymentId = async () => {
  const prefix = 'PAYID'; // Fixed prefix for payment_id
  const sequenceName = 'paymentid';
  const counter = await Counter.findOneAndUpdate(
    { _id: sequenceName },
    { 
      $inc: { sequence_value: 1 },
      $setOnInsert: { prefix } // Set prefix only on insert (first time)
    },
    { new: true, upsert: true }
  );
  const sequence = counter.sequence_value.toString().padStart(4, '0'); // Pad with zeros to get 0001, 0002, etc.
  return `${counter.prefix}${sequence}`; // e.g., PAYID0001
};

const createPayment = async (req, res) => {
  try {
    const { amount, payment_method, payment_date, status } = req.body;
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).json({ message: "No token provided" });
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "your_jwt_secret_key_here");
    const userid = decoded.userid; // Use custom userid from token

    // Validate cart items
    const cartItems = await Cart.find({ userid, receipt: null }).populate({
      path: 'itemId',
      select: 'item_name selling_price item_image',
    });
    if (!cartItems.length) {
      return res.status(400).json({ message: "Cart is empty" });
    }

    // Calculate total from cart
    const totalAmount = cartItems.reduce((sum, item) => sum + Number(item.subtotal), 0);
    const taxAmount = Math.round(totalAmount * 0.085);
    const expectedTotal = totalAmount + taxAmount;
    if (Number(amount) !== expectedTotal) {
      return res.status(400).json({ message: "Payment amount does not match cart total" });
    }

    // Create invoice
    const invoice = new Invoice({
      userid, // Changed to userid
      items: cartItems.map((item) => ({
        itemId: item.itemId,
        quantity: item.quantity,
        unit_price: item.unit_price,
        subtotal: item.subtotal,
      })),
      total: totalAmount,
      tax: taxAmount,
      grandTotal: expectedTotal,
    });
    await invoice.save();

    let reference_no = null;
    if (payment_method === "Bank Transfer" && !req.file) {
      throw new Error("Bank transfer slip is required");
    }
    if (req.file) {
      reference_no = `/Uploads/${req.file.filename}`;
    }

    // Generate custom payment_id using counter
    const payment_id = await getNextPaymentId();

    const payment = new Payment({
      payment_id, // Use custom payment_id
      invoice_id: invoice._id,
      userid, // Changed to userid
      itemId: cartItems.map(item => item.itemId._id),
      payment_method,
      amount,
      payment_date: payment_date ? new Date(payment_date) : new Date(),
      reference_no,
      status,
    });

    console.log("Saving payment:", {
      payment_id: payment.payment_id,
      invoice_id: invoice._id.toString(),
      itemId: payment.itemId.map(id => id.toString()),
      amount,
      payment_method,
      status,
      userid,
    });

    await payment.save();

    // Update cart items to associate with this invoice
    await Cart.updateMany({ userid, receipt: null }, { receipt: invoice._id });

    console.log("✅ Payment created:", payment.payment_id);
    res.status(201).json({ message: "Payment created successfully", payment });
  } catch (error) {
    console.error("❌ Payment creation error:", {
      message: error.message,
      stack: error.stack,
      code: error.code,
      name: error.name,
    });
    if (error.code === 11000) {
      return res.status(400).json({ message: "Payment ID already exists" });
    }
    res.status(400).json({ message: "Error creating payment", error: error.message });
  }
};

const updatePaymentStatus = async (req, res) => {
  try {
    const { payment_id } = req.params;
    const { status } = req.body;
    const payment = await Payment.findOneAndUpdate(
      { payment_id },
      { status },
      { new: true, runValidators: true }
    );
    if (!payment) {
      return res.status(404).json({ message: "Payment not found" });
    }
    console.log("✅ Payment status updated:", payment_id, status);
    res.json({ message: "Payment status updated", payment });
  } catch (error) {
    console.error("❌ Payment status update error:", error);
    res.status(400).json({ message: "Error updating payment status", error: error.message });
  }
};

const getPayments = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).json({ message: "No token provided" });
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "your_jwt_secret_key_here");
    const userid = decoded.userid; // Changed to userid

    const payments = await Payment.find({ userid }) // Changed to userid
      .populate({
        path: 'invoice_id',
        populate: {
          path: 'items.itemId',
          model: 'Product',
          select: 'item_name item_image',
        },
      })
      .populate({
        path: 'itemId',
        model: 'Product',
        select: 'item_name item_image',
      });
    res.json(payments);
  } catch (error) {
    console.error("❌ Get payments error:", error);
    res.status(400).json({ message: "Error fetching payments", error: error.message });
  }
};

module.exports = { createPayment, updatePaymentStatus, getPayments };