const express = require('express');
const router = express.Router();
const paidController = require('../../Controllers/TechController/PaidController');

router.post('/', paidController.createPaidTask);
router.get('/', paidController.getAllPaidTasks);
router.get('/pending', paidController.getPendingTasks);
router.get('/notyet', paidController.getNotYetTasks);
router.get('/completed', paidController.getCompletedTasks);
router.put('/:paymentId/statusofmy', paidController.updateStatusOfMy);

module.exports = router;