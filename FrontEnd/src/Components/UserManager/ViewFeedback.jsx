import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Navbar from '../Nav/Navbar';
import Footer from '../Footer/Footer';
import './ViewFeedback.css';

function ViewFeedback() {
  const navigate = useNavigate();
  const authUser = JSON.parse(localStorage.getItem('authUser') || '{}');
  const customer_id = authUser.userid || authUser.userId || '';
  const token = localStorage.getItem('token');

  const [feedbackList, setFeedbackList] = useState([]);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [editFeedbackId, setEditFeedbackId] = useState(null);
  const [editComments, setEditComments] = useState('');
  const [editError, setEditError] = useState(null);

  useEffect(() => {
    if (!token || !customer_id) {
      navigate('/login?redirect=feedback', { replace: true });
      return;
    }

    const fetchFeedback = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await axios.get(
          `http://localhost:5000/api/feedback/${customer_id}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setFeedbackList(response.data.feedback || []);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch feedback. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchFeedback();
  }, [token, customer_id, navigate]);

  const handleAddFeedback = () => {
    navigate('/feedback');
  };

  const handleEditFeedback = (feedback) => {
    setEditFeedbackId(feedback.feedback_id);
    setEditComments(feedback.comments);
    setEditError(null);
  };

  const handleCancelEdit = () => {
    setEditFeedbackId(null);
    setEditComments('');
    setEditError(null);
  };

  const handleUpdateFeedback = async (feedback_id) => {
    if (!editComments.trim()) {
      setEditError('Comments cannot be empty');
      return;
    }
    if (!/^[a-zA-Z0-9\s,.]*$/.test(editComments)) {
      setEditError('Comments can only contain letters, numbers, spaces, commas, and periods');
      return;
    }
    if (editComments.length > 500) {
      setEditError('Comments cannot exceed 500 characters');
      return;
    }

    try {
      const response = await axios.patch(
        `http://localhost:5000/api/feedback/${feedback_id}`,
        { comments: editComments },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setFeedbackList((prev) =>
        prev.map((fb) =>
          fb.feedback_id === feedback_id ? { ...fb, comments: response.data.feedback.comments } : fb
        )
      );
      setEditFeedbackId(null);
      setEditComments('');
      setEditError(null);
      alert('Feedback updated successfully!');
    } catch (err) {
      setEditError(err.response?.data?.message || 'Failed to update feedback. Please try again.');
    }
  };

  return (
    <div id="view-feedback-container">
      <Navbar />
      <h2 id="view-feedback-title">Your Feedback</h2>
      <div id="view-feedback-content">
        {error && <p id="view-feedback-error" className="error-message">{error}</p>}
        {isLoading ? (
          <p id="view-feedback-loading">Loading...</p>
        ) : feedbackList.length === 0 ? (
          <p id="view-feedback-empty">No feedback found.</p>
        ) : (
          <div id="feedback-list">
            {feedbackList.map((feedback) => (
              <div key={feedback.feedback_id} className="feedback-item">
                <p><strong>Feedback ID:</strong> {feedback.feedback_id}</p>
                <p><strong>Rating:</strong> {feedback.rating} Star{feedback.rating > 1 ? 's' : ''}</p>
                {editFeedbackId === feedback.feedback_id ? (
                  <div className="edit-feedback">
                    <p><strong>Comments:</strong></p>
                    <textarea
                      value={editComments}
                      onChange={(e) => setEditComments(e.target.value)}
                      placeholder="Enter updated comments"
                      maxLength={500}
                    />
                    {editError && <p className="error-message">{editError}</p>}
                    <div className="edit-actions">
                      <button
                        className="save-button"
                        onClick={() => handleUpdateFeedback(feedback.feedback_id)}
                      >
                        Save
                      </button>
                      <button className="cancel-button" onClick={handleCancelEdit}>
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <p><strong>Comments:</strong> {feedback.comments}</p>
                    <button
                      className="edit-button"
                      onClick={() => handleEditFeedback(feedback)}
                    >
                      Edit Comments
                    </button>
                  </div>
                )}
                <p><strong>Submitted:</strong> {new Date(feedback.created_at).toLocaleString()}</p>
              </div>
            ))}
          </div>
        )}
        <button
          id="add-feedback-button"
          className="add-button"
          onClick={handleAddFeedback}
        >
          Add New Feedback
        </button>
      </div>
      <Footer />
    </div>
  );
}

export default ViewFeedback;