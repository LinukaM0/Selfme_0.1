const express = require('express');
const { signup, login } = require('../Controllers/AuthController');
const jwt = require('jsonwebtoken');
const User = require('../Model/UserModel');
const router = express.Router();

// Middleware to verify token
const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ message: 'No token provided' });
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret_key_here');
    req.userId = decoded.userId;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid token' });
  }
};

// Existing routes
router.post('/signup', signup);
router.post('/login', login);

// Get complete user data
router.get('/user', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const userData = {
      userid: user.userid,
      firstName: user.firstName,
      lastName: user.lastName || '',
      email: user.email,
      phone: user.phone || 'N/A',
      nic: user.nic || 'N/A',
      address: user.address || 'N/A',
      dob: user.dob || null,
      ceboNo: user.ceboNo || 'N/A',
      role: user.role,
      status: user.status,
      createdAt: user.created_at,
    };

    console.log('✅ User details fetched:', {
      userid: userData.userid,
      email: userData.email,
      hasPhone: !!user.phone,
      hasNic: !!user.nic,
      hasAddress: !!user.address,
      hasDob: !!user.dob,
      hasCeboNo: !!user.ceboNo,
    });

    res.json(userData);
  } catch (err) {
    console.error('❌ Get user error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Update user details
router.put('/user', verifyToken, async (req, res) => {
  try {
    const { firstName, lastName, phone, nic, address, ceboNo } = req.body;

    // Validate input
    if (!firstName) {
      return res.status(400).json({ message: 'First name is required' });
    }
    if (phone && !/^\d{10}$/.test(phone)) {
      return res.status(400).json({ message: 'Phone number must be exactly 10 digits' });
    }
    if (nic && !/^[0-9]{9}[vVxX]$|^[0-9]{12}$/.test(nic)) {
      return res.status(400).json({ message: 'Invalid NIC format (9 digits + v/V/x/X or 12 digits)' });
    }
    if (ceboNo && !/^\d{10}$/.test(ceboNo)) {
      return res.status(400).json({ message: 'CEB number must be exactly 10 digits' });
    }

    const updateData = {
      firstName,
      lastName: lastName || '',
      phone: phone || '',
      nic: nic || '',
      address: address || '',
      ceboNo: ceboNo || '',
    };

    const user = await User.findByIdAndUpdate(
      req.userId,
      { $set: updateData },
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const userData = {
      userid: user.userid,
      firstName: user.firstName,
      lastName: user.lastName || '',
      email: user.email,
      phone: user.phone || 'N/A',
      nic: user.nic || 'N/A',
      address: user.address || 'N/A',
      dob: user.dob || null,
      ceboNo: user.ceboNo || 'N/A',
      role: user.role,
      status: user.status,
      createdAt: user.created_at,
    };

    console.log('✅ User details updated:', {
      userid: userData.userid,
      email: userData.email,
    });

    res.json({ message: 'Profile updated successfully', user: userData });
  } catch (err) {
    console.error('❌ Update user error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;