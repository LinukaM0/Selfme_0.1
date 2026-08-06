const express = require("express");
const router = express.Router();
const itemController = require("../../Controllers/inventory_controllers/itemController"); // ✅ corrected relative path
const multer = require("multer");
const path = require("path");

// Configure storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, "../../item_images")); // ✅ corrected to lowercase and relative path
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const upload = multer({ storage });

// Routes
router.get("/", itemController.getAllItems);
router.post("/", upload.single("item_image"), itemController.createItem);
router.get("/:id", itemController.getItemById);
router.put("/:id", upload.single("item_image"), itemController.updateItem);
router.delete("/:id", itemController.deleteItem);

module.exports = router;