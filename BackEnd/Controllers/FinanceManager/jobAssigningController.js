const JobAssigning = require('../../Model/FinanceManager/jobAssigningModel');

exports.getAllJobAssignments = async (req, res) => {
  try {
    const jobAssignments = await JobAssigning.find().populate('empId');
    res.json(jobAssignments);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.createJobAssignment = async (req, res) => {
  const jobAssignment = new JobAssigning(req.body);
  try {
    const newJobAssignment = await jobAssignment.save();
    res.status(201).json(newJobAssignment);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.updateJobAssignment = async (req, res) => {
  try {
    const updatedJobAssignment = await JobAssigning.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updatedJobAssignment);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.deleteJobAssignment = async (req, res) => {
  try {
    await JobAssigning.findByIdAndDelete(req.params.id);
    res.json({ message: 'Job assignment deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};