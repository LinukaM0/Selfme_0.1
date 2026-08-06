const express = require('express');
const router = express.Router();
const salaryController = require('../../Controllers/FinanceManager/salaryController');

router.get('/', salaryController.getAllSalaries);
router.get('/staff', salaryController.getAllStaff);
router.post('/', salaryController.createSalary);
router.put('/:id', salaryController.updateSalary);
router.delete('/:id', salaryController.deleteSalary);

module.exports = router;