const mongoose = require("mongoose");

const ProductRequestSchema = new mongoose.Schema(
  {
    supplier_name: {
      type: String,
      required: true,
    },
    product_item: {
      type: String,
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
    },
    unit_price: {
      type: Number,
      default: 0,
    },
    total_cost: {
      type: Number,
      default: 0,
    },
    need_date: {
      type: Date,
      required: true,
    },
    remark: {
      type: String,
      default: "",
    },
    financial_status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    request_status: {
      type: String,
      enum: ["pending", "processing", "completed", "rejected"],
      default: "pending",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("ProductRequest", ProductRequestSchema);
