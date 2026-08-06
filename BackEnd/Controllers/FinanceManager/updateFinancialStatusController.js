const ProductRequest = require("../../Model/inventory_models/productRequestModel");

// ✅ Update financial status of a product request
const updateFinancialStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { financial_status } = req.body;

    // Validate financial_status
    if (!["pending", "approved", "rejected"].includes(financial_status)) {
      return res.status(400).json({ message: "Invalid financial status" });
    }

    const updatedProductRequest = await ProductRequest.findByIdAndUpdate(
      id,
      { financial_status },
      { new: true, runValidators: true }
    );

    if (!updatedProductRequest) {
      return res.status(404).json({ message: "Product request not found" });
    }

    res.status(200).json({
      message: "Financial status updated successfully",
      updatedProductRequest,
    });
  } catch (error) {
    res.status(500).json({ message: "Error updating financial status", error });
  }
};

module.exports = {
  updateFinancialStatus,
};