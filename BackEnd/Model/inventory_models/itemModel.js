const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    serial_number: {
      type: String,
      required: true,
      unique: true,
    },
    item_name: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      required: true,
    },
    item_image: {
      type: String,
    },
    description: {
      type: String,
    },
    quantity_in_stock: {
      type: Number,
      required: true,
    },
    re_order_level: {
      type: Number,
      required: true,
    },
    supplier_name: {
      // changed from supplier_details/supplier_id
      type: String,
      required: true,
    },
    purchase_price: {
      type: Number,
      required: true,
    },
    selling_price: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      default: "Available",
    },
    product_remark: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

module.exports =
  mongoose.models.Product || mongoose.model("Product", productSchema);
