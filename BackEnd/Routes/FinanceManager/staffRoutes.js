const express = require('express');
const router = express.Router();
const staffController = require('../../Controllers/FinanceManager/staffController');

router.get('/', staffController.getAllStaff);
router.post('/', staffController.createStaff);
router.put('/:id', staffController.updateStaff);
router.delete('/:id', staffController.deleteStaff);

module.exports = router;