const express = require('express');
const router = express.Router();
const jobAssigningController = require('../../Controllers/FinanceManager/jobAssigningController');

router.get('/', jobAssigningController.getAllJobAssignments);
router.post('/', jobAssigningController.createJobAssignment);
router.put('/:id', jobAssigningController.updateJobAssignment);
router.delete('/:id', jobAssigningController.deleteJobAssignment);

module.exports = router;