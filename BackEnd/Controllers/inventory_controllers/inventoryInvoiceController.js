const mongoose = require('mongoose');
const Invoice = require("../../Model/UserModel/InvoiceModel");
const Product = require("../../Model/inventory_models/itemModel");

// ✅ Create new invoice
exports.createInvoice = async (req, res) => {
  try {
    let { userid, items, tax } = req.body;

    if (!userid || !items || items.length === 0) {
      return res.status(400).json({ message: "User ID and items are required" });
    }

    // Validate that all itemIds are valid ObjectIds
    for (let item of items) {
      if (!mongoose.Types.ObjectId.isValid(item.itemId)) {
        return res.status(400).json({ 
          message: `Invalid product ID: ${item.itemId}` 
        });
      }
      
      // Verify product exists
      const product = await Product.findById(item.itemId);
      if (!product) {
        return res.status(400).json({ 
          message: `Product not found with ID: ${item.itemId}` 
        });
      }
    }

    // calculate subtotals
    items = items.map((item) => ({
      ...item,
      subtotal: item.quantity * item.unit_price,
    }));

    const total = items.reduce((sum, item) => sum + item.subtotal, 0);
    tax = tax || 0;
    const grandTotal = total + tax;

    const newInvoice = new Invoice({
      userid,
      items,
      total,
      tax,
      grandTotal,
    });

    await newInvoice.save();

    res.status(201).json({
      message: "Invoice created successfully",
      invoice: newInvoice,
    });
  } catch (err) {
    res.status(500).json({
      message: "Error creating invoice",
      error: err.message,
    });
  }
};

// ✅ Get all invoices with product details
exports.getAllInvoices = async (req, res) => {
  try {
    const invoices = await Invoice.find()
      .populate('items.itemId', 'item_name serial_number category selling_price item_image')
      .sort({ created_at: -1 })
      .exec();
    res.status(200).json(invoices);
  } catch (err) {
    res.status(500).json({
      message: "Error fetching invoices",
      error: err.message,
    });
  }
};

// ✅ Get invoices by user ID with product details
exports.getInvoicesByUserId = async (req, res) => {
  try {
    const { userid } = req.params;

    const invoices = await Invoice.find({ userid })
      .populate('items.itemId', 'item_name serial_number category selling_price item_image')
      .sort({ created_at: -1 })
      .exec();

    if (!invoices || invoices.length === 0) {
      return res.status(404).json({ message: "No invoices found for this user" });
    }

    res.status(200).json(invoices);
  } catch (err) {
    res.status(500).json({
      message: "Error fetching user invoices",
      error: err.message,
    });
  }
};

// ✅ Get invoice by ID with product details
exports.getInvoiceById = async (req, res) => {
  try {
    const { id } = req.params;

    const invoice = await Invoice.findById(id)
      .populate('items.itemId', 'item_name serial_number category selling_price item_image')
      .exec();

    if (!invoice) {
      return res.status(404).json({ message: "Invoice not found" });
    }

    res.status(200).json(invoice);
  } catch (err) {
    res.status(500).json({
      message: "Error fetching invoice",
      error: err.message,
    });
  }
};

// ✅ Update invoice
exports.updateInvoice = async (req, res) => {
  try {
    let { items, tax } = req.body;

    if (items && items.length > 0) {
      // Validate that all itemIds are valid ObjectIds
      for (let item of items) {
        if (!mongoose.Types.ObjectId.isValid(item.itemId)) {
          return res.status(400).json({ 
            message: `Invalid product ID: ${item.itemId}` 
          });
        }
        
        // Verify product exists
        const product = await Product.findById(item.itemId);
        if (!product) {
          return res.status(400).json({ 
            message: `Product not found with ID: ${item.itemId}` 
          });
        }
      }

      items = items.map((item) => ({
        ...item,
        subtotal: item.quantity * item.unit_price,
      }));

      const total = items.reduce((sum, item) => sum + item.subtotal, 0);
      tax = tax || 0;
      req.body.total = total;
      req.body.grandTotal = total + tax;
      req.body.items = items;
    }

    const updatedInvoice = await Invoice.findByIdAndUpdate(
      req.params.id, 
      req.body, 
      { new: true }
    ).populate('items.itemId', 'item_name serial_number category selling_price item_image');

    if (!updatedInvoice) {
      return res.status(404).json({ message: "Invoice not found" });
    }

    res.status(200).json({
      message: "Invoice updated successfully",
      invoice: updatedInvoice,
    });
  } catch (err) {
    res.status(500).json({
      message: "Error updating invoice",
      error: err.message,
    });
  }
};

// ✅ Delete invoice
exports.deleteInvoice = async (req, res) => {
  try {
    const deletedInvoice = await Invoice.findByIdAndDelete(req.params.id);
    if (!deletedInvoice) {
      return res.status(404).json({ message: "Invoice not found" });
    }
    res.status(200).json({ message: "Invoice deleted successfully" });
  } catch (err) {
    res.status(500).json({
      message: "Error deleting invoice",
      error: err.message,
    });
  }
};