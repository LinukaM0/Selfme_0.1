const Supplier = require("../../Model/inventory_models/SupplierModel");
const fs = require("fs");
const path = require("path");

// Get all suppliers
exports.getAllSuppliers = async (req, res) => {
  try {
    const suppliers = await Supplier.find().sort({ createdAt: -1 });
    res.json(suppliers);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get supplier by ID
exports.getSupplierById = async (req, res) => {
  try {
    const supplier = await Supplier.findById(req.params.id);
    if (!supplier) return res.status(404).json({ message: "Supplier not found" });
    res.json(supplier);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Create supplier
exports.createSupplier = async (req, res) => {
  try {
    const supplierData = {
      name: req.body.name?.trim(),
      company_name: req.body.company_name?.trim() || "",
      email: req.body.email?.trim() || undefined,
      phone: req.body.phone?.trim() || "",
      address: req.body.address?.trim() || "",
      remark: req.body.remark?.trim() || "",
      status: req.body.status || "Active",
    };

    if (!supplierData.name) return res.status(400).json({ error: "Supplier name is required" });

    // Check duplicate email manually
    if (supplierData.email) {
      const existing = await Supplier.findOne({ email: supplierData.email });
      if (existing) return res.status(400).json({ error: "Email already exists" });
    }

    if (req.file) supplierData.image = req.file.filename;

    const supplier = new Supplier(supplierData);
    await supplier.save();

    res.status(201).json({ message: "Supplier created successfully", supplier });
  } catch (err) {
    console.error(err);
    if (err.name === "ValidationError")
      return res.status(400).json({ error: Object.values(err.errors).map(e => e.message).join(", ") });
    res.status(500).json({ error: "Failed to create supplier" });
  }
};

// Update supplier
exports.updateSupplier = async (req, res) => {
  try {
    const supplier = await Supplier.findById(req.params.id);
    if (!supplier) return res.status(404).json({ message: "Supplier not found" });

    if (req.file && supplier.image) {
      const oldPath = path.join(__dirname, "../../uploads/", supplier.image);
      if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
    }

    const updatedData = {
      name: req.body.name?.trim(),
      company_name: req.body.company_name?.trim() || "",
      email: req.body.email?.trim() || undefined,
      phone: req.body.phone?.trim() || "",
      address: req.body.address?.trim() || "",
      remark: req.body.remark?.trim() || "",
      status: req.body.status || "Active",
    };

    if (updatedData.email && updatedData.email !== supplier.email) {
      const existing = await Supplier.findOne({ email: updatedData.email });
      if (existing) return res.status(400).json({ error: "Email already exists" });
    }

    if (req.file) updatedData.image = req.file.filename;

    const updatedSupplier = await Supplier.findByIdAndUpdate(req.params.id, updatedData, { new: true, runValidators: true });

    res.json({ message: "Supplier updated successfully", supplier: updatedSupplier });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

// Delete supplier
exports.deleteSupplier = async (req, res) => {
  try {
    const supplier = await Supplier.findById(req.params.id);
    if (!supplier) return res.status(404).json({ message: "Supplier not found" });

    if (supplier.image) {
      const imgPath = path.join(__dirname, "../../uploads/", supplier.image);
      if (fs.existsSync(imgPath)) fs.unlinkSync(imgPath);
    }

    await Supplier.findByIdAndDelete(req.params.id);
    res.json({ message: "Supplier deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
