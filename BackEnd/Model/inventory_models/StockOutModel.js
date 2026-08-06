const mongoose = require("mongoose");

const stockOutSchema = new mongoose.Schema(
  {
    stock_out_id: {
      type: String,
      unique: true,
      required: true
    },
    customer_id: {
      type: String,
      required: true,
    },
    items: [
      {
        product_id: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
        item_name: { type: String, required: true },
        quantity: { type: Number, required: true, min: 1 },
        price: { type: Number, required: true },
      },
    ],
    total: {
      type: Number,
      required: true,
    },
    type: {
      type: String,
      enum: ["customer", "technical"],
      default: "customer",
    },
    status: {
      type: String,
      enum: ["Pending", "Confirmed"],
      default: "Pending",
    },
  },
  { timestamps: true }
);

// Generate stock_out_id before saving
stockOutSchema.pre('save', async function(next) {
  if (this.isNew) {
    const year = new Date().getFullYear();
    
    // Find the latest stock out for this year
    const latestStockOut = await this.constructor
      .findOne({ stock_out_id: new RegExp(`^SO-${year}-`) })
      .sort({ createdAt: -1 });
    
    let sequence = 1;
    if (latestStockOut) {
      const lastSequence = parseInt(latestStockOut.stock_out_id.split('-')[2]) || 0;
      sequence = lastSequence + 1;
    }
    
    this.stock_out_id = `SO-${year}-${sequence.toString().padStart(4, '0')}`;
  }
  next();
});

module.exports = mongoose.model("StockOut", stockOutSchema);