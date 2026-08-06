const mongoose = require('mongoose');

const SubmitFeedbackSchema = new mongoose.Schema({
  feedback_id: {
    type: String,
    required: [true, 'Feedback ID is required'],
    unique: true,
    trim: true,
  },
  customer_id: {
    type: String,
    required: [true, 'Customer ID is required'],
    trim: true,
    ref: 'User',
  },
  rating: {
    type: Number,
    required: [true, 'Rating is required'],
    min: 1,
    max: 5,
  },
  comments: {
    type: String,
    required: [true, 'Comments are required'],
    trim: true,
    maxlength: 500,
  },
  created_at: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('AllFeedback', SubmitFeedbackSchema);