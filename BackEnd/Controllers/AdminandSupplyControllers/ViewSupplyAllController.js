// 1) Controller = BackEnd > Controller > AdminandSupplyControllers > ViewSupplyAllController.js
const Supplier = require("../../Model/inventory_models/SupplierModel");

// Get all suppliers
const getAllSuppliers = async (req, res, next) => {
    let suppliers;
    try {
        suppliers = await Supplier.find();
    } catch (err) {
        console.log(err);
        return res.status(500).json({ message: "Server error while fetching suppliers" });
    }
    if (!suppliers) return res.status(404).json({ message: "Suppliers not found" });
    return res.status(200).json({ suppliers });
};

// Get supplier by ID
const getById = async (req, res, next) => {
    const id = req.params.id;
    let supplier;
    try {
        supplier = await Supplier.findById(id);
    } catch (err) {
        console.log(err);
        return res.status(500).json({ message: "Server error while fetching supplier" });
    }
    if (!supplier) return res.status(404).json({ message: "Supplier not found" });
    return res.status(200).json({ supplier });
};

exports.getAllSuppliers = getAllSuppliers;
exports.getById = getById;