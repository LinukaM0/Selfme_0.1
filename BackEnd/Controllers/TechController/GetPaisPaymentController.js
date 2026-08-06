const mongoose = require('mongoose');
const Payment = require('../../Model/UserModel/PaymentModel');
const User = require('../../Model/UserModel');
const Product = require('../../Model/inventory_models/itemModel');

// Conditionally import Invoice model
let Invoice;
try {
  Invoice = require('../../Model/UserModel/InvoiceModel');
} catch (error) {
  console.warn('⚠️ Invoice model not found. Skipping invoice_id population.');
}

// Get all payments
const getAllPayments = async (req, res) => {
  try {
    console.log('📥 Fetching all payments...');
    let query = Payment.find()
      .populate('itemId', 'serial_number item_name purchase_price selling_price');
    if (Invoice) {
      query = query.populate('invoice_id');
    }
    const payments = await query.lean();

    // Manually populate user details by querying User model with userid
    const paymentsWithCustomer = await Promise.all(payments.map(async (payment) => {
      const user = await User.findOne({ userid: payment.userid })
        .select('firstName lastName email userid')
        .lean();
      if (!user) {
        console.warn(`⚠️ No user found for payment ${payment.payment_id}, userid: ${payment.userid}`);
        return {
          ...payment,
          customer_id: { firstName: 'Unknown', lastName: '', email: '', userid: '' }
        };
      }
      return {
        ...payment,
        customer_id: {
          firstName: user.firstName || 'Unknown',
          lastName: user.lastName || '',
          email: user.email || '',
          userid: user.userid || ''
        }
      };
    }));

    console.log('✅ Fetched all payments:', paymentsWithCustomer.length);
    res.json(paymentsWithCustomer);
  } catch (error) {
    console.error('❌ Error fetching payments:', error.message, error.stack);
    res.status(500).json({ message: 'Server error while fetching payments', error: error.message });
  }
};

// Update payment status (restricted to finance managers)
const updatePaymentStatus = async (req, res) => {
  try {
    const { payment_id } = req.params;
    const { status } = req.body;
    console.log('📝 Updating payment status:', payment_id, status);
    if (!['Pending', 'Paid', 'Failed'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }
    const payment = await Payment.findOneAndUpdate(
      { payment_id },
      { status },
      { new: true, runValidators: true }
    );
    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }
    // Populate user and item details for the response
    const populatedPayment = await Payment.findOne({ payment_id })
      .populate('itemId', 'serial_number item_name purchase_price selling_price')
      .populate('invoice_id')
      .lean();
    const user = await User.findOne({ userid: payment.userid })
      .select('firstName lastName email userid')
      .lean();
    const paymentWithCustomer = {
      ...populatedPayment,
      customer_id: user
        ? {
            firstName: user.firstName || 'Unknown',
            lastName: user.lastName || '',
            email: user.email || '',
            userid: user.userid || ''
          }
        : { firstName: 'Unknown', lastName: '', email: '', userid: '' }
    };
    console.log('✅ Payment status updated:', payment_id, status);
    res.json({ message: 'Payment status updated', payment: paymentWithCustomer });
  } catch (error) {
    console.error('❌ Payment status update error:', error.message, error.stack);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Create a payment (status always set to Pending)
const createPayment = async (req, res) => {
  let payment_id;
  try {
    const {
      payment_id: pid,
      invoice_id,
      userid,
      itemId,
      payment_method,
      amount,
      payment_date,
      reference_no
    } = req.body;
    payment_id = pid;
    console.log('📥 Creating payment:', payment_id, req.body);

    // Validate required fields
    if (!payment_id || !invoice_id || !userid || !payment_method || !amount) {
      return res.status(400).json({
        message: 'Missing required fields: payment_id, invoice_id, userid, payment_method, and amount are required'
      });
    }

    // Validate payment_method
    if (payment_method !== 'Bank Transfer') {
      return res.status(400).json({ message: 'Invalid payment_method. Must be "Bank Transfer"' });
    }

    // Validate invoice_id as ObjectId
    if (!mongoose.Types.ObjectId.isValid(invoice_id)) {
      return res.status(400).json({ message: 'Invalid invoice_id format' });
    }

    // Validate itemId array
    if (itemId && Array.isArray(itemId)) {
      for (const id of itemId) {
        if (!mongoose.Types.ObjectId.isValid(id)) {
          return res.status(400).json({ message: `Invalid itemId: ${id}` });
        }
      }
    }

    // Verify userid exists
    const user = await User.findOne({ userid }).select('firstName lastName email userid').lean();
    if (!user) {
      console.warn(`⚠️ User not found for userid: ${userid}`);
      return res.status(400).json({ message: `User with ID ${userid} not found` });
    }

    // Create new payment with status always set to Pending
    const newPayment = new Payment({
      payment_id,
      invoice_id,
      userid,
      itemId: itemId || [],
      payment_method,
      amount,
      payment_date: payment_date || Date.now(),
      reference_no: reference_no || null,
      status: 'Pending'
    });

    // Save to database
    await newPayment.save();
    console.log('💾 Payment saved:', payment_id);

    // Manually populate user and item details
    const populatedUser = await User.findOne({ userid: newPayment.userid })
      .select('firstName lastName email userid')
      .lean();
    let populatedPayment = await Payment.findOne({ payment_id })
      .populate('itemId', 'serial_number item_name purchase_price selling_price')
      .lean();
    if (Invoice) {
      populatedPayment = await Payment.findOne({ payment_id })
        .populate('itemId', 'serial_number item_name purchase_price selling_price')
        .populate('invoice_id')
        .lean();
    }

    // Add customer_id field
    const paymentWithCustomer = {
      ...populatedPayment,
      customer_id: populatedUser
        ? {
            firstName: populatedUser.firstName || 'Unknown',
            lastName: populatedUser.lastName || '',
            email: populatedUser.email || '',
            userid: populatedUser.userid || ''
          }
        : { firstName: 'Unknown', lastName: '', email: '', userid: '' }
    };

    console.log('✅ Payment created and populated:', payment_id);
    res.status(201).json({ message: 'Payment created successfully', payment: paymentWithCustomer });
  } catch (error) {
    if (error.code === 11000) {
      const duplicateField = Object.keys(error.keyValue)[0];
      const duplicateValue = error.keyValue[duplicateField];
      console.error('❌ Duplicate field:', duplicateField, 'value:', duplicateValue);
      return res.status(400).json({
        message: `Duplicate ${duplicateField}: ${duplicateValue} already exists`,
        error: error.message
      });
    }
    console.error('❌ Error creating payment:', error.message, error.stack);
    res.status(400).json({ message: 'Error creating payment', error: error.message });
  }
};

module.exports = { getAllPayments, updatePaymentStatus, createPayment };