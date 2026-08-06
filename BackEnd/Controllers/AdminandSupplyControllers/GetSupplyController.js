// 1) Controller = BackEnd > Controller > AdminandSupplyControllers > GetSupplyController.js

const ProductRequest = require("../../Model/inventory_models/productRequestModel");

// Get all product requests
const getAllProductRequests = async (req, res, next) => {
    let productRequests;
    try {
        productRequests = await ProductRequest.find();
    } catch (err) {
        console.log(err);
        return res.status(500).json({ message: "Server error while fetching product requests" });
    }
    if (!productRequests) return res.status(404).json({ message: "Product requests not found" });
    return res.status(200).json({ productRequests });
};

// Get product request by ID
const getById = async (req, res, next) => {
    const id = req.params.id;
    let productRequest;
    try {
        productRequest = await ProductRequest.findById(id);
    } catch (err) {
        console.log(err);
        return res.status(500).json({ message: "Server error while fetching product request" });
    }
    if (!productRequest) return res.status(404).json({ message: "Product request not found" });
    return res.status(200).json({ productRequest });
};

// Update request_status by ID
const updateStatus = async (req, res, next) => {
    const id = req.params.id;
    const { request_status } = req.body;
    let productRequest;
    try {
        productRequest = await ProductRequest.findByIdAndUpdate(id, { request_status }, { new: true });
    } catch (err) {
        console.log(err);
        return res.status(500).json({ message: "Server error while updating product request status" });
    }
    if (!productRequest) return res.status(404).json({ message: "Product request not found" });
    return res.status(200).json({ productRequest });
};

exports.getAllProductRequests = getAllProductRequests;
exports.getById = getById;
exports.updateStatus = updateStatus;