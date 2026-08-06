import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Navbar from '../Nav/Navbar';
import Footer from '../Footer/Footer';
import './SubmitFeedback.css';

function SubmitFeedback() {
  const navigate = useNavigate();
  const authUser = JSON.parse(localStorage.getItem('authUser') || '{}');
  const customer_id = authUser.userid || authUser.userId || '';
  const token = localStorage.getItem('token');

  const [formData, setFormData] = useState({
    customer_id: customer_id,
    rating: 1,
    comments: '',
  });
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!token || !customer_id) {
      navigate('/login?redirect=feedback', { replace: true });
    }
  }, [token, customer_id, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'customer_id') return;
    if (name === 'comments' && value.length > 500) {
      setError('Comments cannot exceed 500 characters.');
      return;
    }
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setError(null);
  };

  const validateForm = () => {
    if (!formData.customer_id) return 'Customer ID is required';
    if (!formData.rating || formData.rating < 1 || formData.rating > 5) return 'Rating must be between 1 and 5';
    if (!formData.comments.trim()) return 'Comments are required';
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      setIsLoading(false);
      return;
    }

    try {
      const response = await axios.post(
        'http://localhost:5000/api/feedback',
        formData,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setSuccess('Feedback submitted successfully!');
      setFormData({
        customer_id: customer_id,
        rating: 1,
        comments: '',
      });
      // Navigate to ViewFeedback after successful submission
      navigate('/feedback/view');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit feedback. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewFeedback = () => {
    navigate('/feedback/view');
  };

  return (
    <div id="submit-feedback-container">
      <Navbar />
      <h2 id="submit-feedback-title">Submit Your Feedback</h2>
      <div id="submit-feedback-form-container">
        {error && <p id="submit-feedback-error" className="error-message">{error}</p>}
        {success && <p id="submit-feedback-success" className="success-message">{success}</p>}
        <form id="submit-feedback-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="customer_id">Customer ID</label>
            <input
              type="text"
              id="customer_id"
              name="customer_id"
              value={formData.customer_id}
              readOnly
              required
              title="Customer ID is auto-filled from your account"
            />
          </div>
          <div className="form-group">
            <label htmlFor="rating">Rating (1-5)</label>
            <select
              id="rating"
              name="rating"
              value={formData.rating}
              onChange={handleChange}
              required
            >
              {[1, 2, 3, 4, 5].map((num) => (
                <option key={num} value={num}>
                  {num} Star{num > 1 ? 's' : ''}
                </option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="comments">Comments</label>
            <textarea
              id="comments"
              name="comments"
              value={formData.comments}
              onChange={handleChange}
              required
              placeholder="Share your feedback (max 500 characters)"
              maxLength={500}
            ></textarea>
          </div>
          <div className="button-group">
            <button
              type="submit"
              id="submit-feedback-button"
              className={`submit-button ${isLoading ? 'loading' : ''}`}
              disabled={isLoading}
            >
              {isLoading ? 'Submitting...' : 'Submit Feedback'}
            </button>
            <button
              type="button"
              id="view-feedback-button"
              className="view-button"
              onClick={handleViewFeedback}
            >
              View Your Feedback
            </button>
          </div>
        </form>
      </div>
      <Footer />
    </div>
  );
}

export default SubmitFeedback;