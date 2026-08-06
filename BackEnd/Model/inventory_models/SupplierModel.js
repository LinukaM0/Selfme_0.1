const mongoose = require("mongoose");

const supplierSchema = new mongoose.Schema(
  {
    supplier_id: { type: String, unique: true, sparse: true }, // auto-generated
    name: { type: String, required: true, trim: true },
    company_name: { type: String, trim: true },
    email: {
      type: String,
      unique: true,
      sparse: true, // allows multiple null/undefined
      trim: true,
      lowercase: true,
      validate: {
        validator: function (email) {
          if (!email) return true;
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          return emailRegex.test(email);
        },
        message: "Please provide a valid email address",
      },
    },
    phone: { type: String, trim: true },
    address: { type: String, trim: true },
    remark: { type: String, trim: true },
    image: { type: String },
    status: { type: String, default: "Active", enum: ["Active", "Inactive"] },
  },
  { timestamps: true }
);

// Convert empty string email to undefined
supplierSchema.pre("validate", function (next) {
  if (this.email === "") this.email = undefined;
  next();
});

// Auto-generate unique supplier_id before saving
supplierSchema.pre("save", async function (next) {
  if (!this.supplier_id) {
    this.supplier_id = "SUP-" + Date.now() + "-" + Math.floor(Math.random() * 1000);
  }
  next();
});

module.exports = mongoose.model("Supplier", supplierSchema);
