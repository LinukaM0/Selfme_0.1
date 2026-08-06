const express = require('express');
const router = express.Router();
const SubmitFeedbackController = require('../../Controllers/UserController/SubmitFeedbackController');

router.post('/', SubmitFeedbackController.addFeedback);
router.get('/:customer_id', SubmitFeedbackController.getFeedbackByCustomerId);
router.patch('/:feedback_id', SubmitFeedbackController.updateFeedback);

module.exports = router;