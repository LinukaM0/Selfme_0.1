const StockOut = require("../../Model/inventory_models/StockOutModel");
const Product = require("../../Model/inventory_models/itemModel");

// Helper function to generate stock_out_id
const generateStockOutId = async () => {
  const year = new Date().getFullYear();

  // Find the latest stock out for this year
  const latestStockOut = await StockOut.findOne({
    stock_out_id: new RegExp(`^SO-${year}-`),
  }).sort({ createdAt: -1 });

  let sequence = 1;
  if (latestStockOut && latestStockOut.stock_out_id) {
    const lastSequence =
      parseInt(latestStockOut.stock_out_id.split("-")[2]) || 0;
    sequence = lastSequence + 1;
  }

  return `SO-${year}-${sequence.toString().padStart(4, "0")}`;
};

// Create StockOut Order - FIXED
exports.createStockOut = async (req, res) => {
  try {
    const { customer_id, items, type } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ message: "Items are required" });
    }

    // Generate stock_out_id first
    const stock_out_id = await generateStockOutId();

    // Calculate total
    const total = items.reduce((sum, i) => sum + i.quantity * i.price, 0);

    // Save new order with stock_out_id
    const stockOut = new StockOut({
      stock_out_id: stock_out_id, // Add this line
      customer_id,
      items,
      total,
      type,
      status: "Pending",
    });

    await stockOut.save();

    res.status(201).json({
      message: "Stock out order created successfully",
      stockOut: stockOut,
    });
  } catch (err) {
    console.error("Error creating stock out:", err);
    if (err.code === 11000) {
      return res
        .status(400)
        .json({
          message: "Duplicate stock out ID generated. Please try again.",
        });
    }
    if (err.name === "ValidationError") {
      return res
        .status(400)
        .json({ message: `Validation error: ${err.message}` });
    }
    res.status(500).json({ message: "Server error: " + err.message });
  }
};

// Confirm Order (reduce stock)
exports.confirmStockOut = async (req, res) => {
  try {
    const { id } = req.params;
    const stockOut = await StockOut.findById(id);

    if (!stockOut) return res.status(404).json({ message: "Order not found" });

    if (stockOut.status === "Confirmed") {
      return res.status(400).json({ message: "Order already confirmed" });
    }

    // Reduce stock
    for (const item of stockOut.items) {
      const product = await Product.findById(item.product_id);
      if (!product) {
        return res
          .status(404)
          .json({ message: `Product ${item.item_name} not found` });
      }

      if (product.quantity_in_stock < item.quantity) {
        return res
          .status(400)
          .json({
            message: `Insufficient stock for ${product.item_name}. Available: ${product.quantity_in_stock}, Requested: ${item.quantity}`,
          });
      }

      product.quantity_in_stock -= item.quantity;
      await product.save();
    }

    stockOut.status = "Confirmed";
    await stockOut.save();

    res.json({
      message: "Order confirmed successfully",
      stockOut,
    });
  } catch (err) {
    console.error("Error confirming stock out:", err);
    res.status(500).json({ message: "Server error: " + err.message });
  }
};

// Get all StockOuts
exports.getAllStockOuts = async (req, res) => {
  try {
    const stockOuts = await StockOut.find().sort({ createdAt: -1 });
    res.json(stockOuts);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Failed to fetch stock outs: " + err.message });
  }
};

// Get stock out by ID
exports.getStockOutById = async (req, res) => {
  try {
    const stockOut = await StockOut.findById(req.params.id);
    if (!stockOut)
      return res.status(404).json({ message: "Stock out order not found" });
    res.json(stockOut);
  } catch (err) {
    res.status(500).json({ message: "Server error: " + err.message });
  }
};

// Delete stock out
exports.deleteStockOut = async (req, res) => {
  try {
    const stockOut = await StockOut.findByIdAndDelete(req.params.id);
    if (!stockOut)
      return res.status(404).json({ message: "Stock out order not found" });
    res.json({ message: "Stock out order deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Server error: " + err.message });
  }
};
