const express = require('express');
const router = express.Router();
const { getAllPayments, updatePaymentStatus, createPayment } = require('../../Controllers/FinanceManager/PaymentController');

router.get('/', getAllPayments);
router.post('/', createPayment);
router.put('/status/:payment_id', updatePaymentStatus);

module.exports = router;