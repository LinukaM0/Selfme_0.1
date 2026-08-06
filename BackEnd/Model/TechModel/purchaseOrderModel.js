const mongoose = require("mongoose");

const purchaseOrderSchema = new mongoose.Schema(
  {
    custom_id: { type: String }, // For hardcoded demo IDs like "PO-001"
    customerId: { type: String }, // <-- Add this line
    order_date: { type: Date, required: true },
    total_amount: { type: Number, required: true },
    status: { type: String, required: true },
    paid: { type: Boolean, required: true },
    created_at: { type: Date, default: Date.now },
    assigned_employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      default: null,
    },
    assigned_date: { type: Date, default: null },
    deadline: { type: Date, default: null },
    customerName: { type: String },
    product: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model("PurchaseOrder", purchaseOrderSchema);