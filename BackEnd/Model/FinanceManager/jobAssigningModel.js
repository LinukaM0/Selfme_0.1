const mongoose = require('mongoose');

const jobAssigningSchema = new mongoose.Schema({
  empId: { type: String, required: true, ref: 'Staff' }, // Reference to Staff empId
  jobTitle: { type: String, required: true, maxlength: 100 }, // Title of the job/task
  startDate: { type: Date, required: true }, // Start date of the job
  endDate: { type: Date, required: true }, // End date of the job
  status: { 
    type: String, 
    required: true, 
    enum: ['Assigned', 'In Progress', 'Completed', 'Cancelled'], 
    default: 'Assigned', 
    maxlength: 20 
  }, // Job status
  projectId: { type: String, ref: 'Project' }, // Optional reference to a project (if applicable)
  created_at: { type: Date, default: Date.now } // Date created
});

module.exports = mongoose.model('JobAssigning', jobAssigningSchema);