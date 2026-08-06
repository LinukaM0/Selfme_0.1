const SubmitFeedback = require('../../Model/UserModel/SubmitFeedbackModel');
const User = require('../../Model/UserModel');
const Counter = require('../../Model/AdminandSupplyModel/counterModel');

const getNextSequenceValue = async (sequenceName, prefix) => {
  const counter = await Counter.findOneAndUpdate(
    { _id: sequenceName },
    { $inc: { sequence_value: 1 }, $setOnInsert: { prefix } },
    { new: true, upsert: true }
  );
  const sequence = counter.sequence_value.toString().padStart(3, '0');
  return `${counter.prefix}${sequence}`;
};

const addFeedback = async (req, res, next) => {
  const { customer_id, rating, comments } = req.body;

  if (!customer_id || !rating || !comments) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  // Validate customer_id exists in User collection
  const user = await User.findOne({ userid: customer_id });
  if (!user) {
    return res.status(400).json({ message: 'Invalid Customer ID' });
  }

  try {
    // Generate feedback_id
    const feedback_id = await getNextSequenceValue('feedbackId', 'FEBID');

    const feedback = new SubmitFeedback({
      feedback_id,
      customer_id,
      rating,
      comments,
    });
    await feedback.save();
    return res.status(200).json({ feedback, message: 'Feedback submitted successfully' });
  } catch (err) {
    console.error('❌ Feedback submission error:', err);
    if (err.code === 11000) {
      return res.status(400).json({ message: 'Feedback ID already exists' });
    }
    return res.status(400).json({ message: 'Unable to add feedback', error: err.message });
  }
};

const getFeedbackByCustomerId = async (req, res, next) => {
  const { customer_id } = req.params;

  try {
    const feedback = await SubmitFeedback.find({ customer_id }).sort({ created_at: -1 });
    return res.status(200).json({ feedback });
  } catch (err) {
    console.error('❌ Feedback retrieval error:', err);
    return res.status(400).json({ message: 'Unable to fetch feedback', error: err.message });
  }
};

const updateFeedback = async (req, res, next) => {
  const { feedback_id } = req.params;
  const { comments } = req.body;

  if (!comments) {
    return res.status(400).json({ message: 'Comments are required' });
  }

  if (!/^[a-zA-Z0-9\s,.]*$/.test(comments)) {
    return res.status(400).json({ message: 'Comments can only contain letters, numbers, spaces, commas, and periods' });
  }

  if (comments.length > 500) {
    return res.status(400).json({ message: 'Comments cannot exceed 500 characters' });
  }

  try {
    const feedback = await SubmitFeedback.findOneAndUpdate(
      { feedback_id },
      { comments, updated_at: Date.now() },
      { new: true }
    );

    if (!feedback) {
      return res.status(404).json({ message: 'Feedback not found' });
    }

    return res.status(200).json({ feedback, message: 'Feedback updated successfully' });
  } catch (err) {
    console.error('❌ Feedback update error:', err);
    return res.status(400).json({ message: 'Unable to update feedback', error: err.message });
  }
};

exports.addFeedback = addFeedback;
exports.getFeedbackByCustomerId = getFeedbackByCustomerId;
exports.updateFeedback = updateFeedback;