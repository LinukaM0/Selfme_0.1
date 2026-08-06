// Routes/UserRoutes/PaymentRoutes.js (unchanged, provided for completeness)
const express = require('express');
const router = express.Router();
const multer = require('multer');
const { createPayment, updatePaymentStatus, getPayments } = require('../../Controllers/UserController/PaymentController');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'Uploads/';
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const fileName = `${Date.now()}-${file.originalname.replace(/[^a-zA-Z0-9.]/g, '_')}`;
    cb(null, fileName);
  }
});
const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, and PDF are allowed.'), false);
    }
  }
});

// Routes
router.post('/payments', upload.single('slip'), createPayment);
router.put('/payments/:payment_id', updatePaymentStatus);
router.get('/payments', getPayments);

module.exports = router;