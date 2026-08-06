// Controllers/AuthController.js (updated to handle prefix on upsert for robustness)
const User = require('../Model/UserModel');
const Counter = require('../Model/AdminandSupplyModel/counterUserModel');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key_here'; // Use env var for security

// Function to get the next sequence value and generate formatted ID
const getNextSequenceValue = async (sequenceName) => {
  const prefix = 'SELFMEID'; // Fixed prefix for userid
  const counter = await Counter.findOneAndUpdate(
    { _id: sequenceName },
    { 
      $inc: { sequence_value: 1 },
      $setOnInsert: { prefix } // Set prefix only on insert (first time)
    },
    { new: true, upsert: true }
  );
  const sequence = counter.sequence_value.toString().padStart(4, '0'); // Pad with zeros to get 0001, 0002, etc.
  return `${counter.prefix}${sequence}`; // e.g., SELFMEID0001
};

// Signup
const signup = async (req, res) => {
  try {
    const { firstName, lastName, email, password, nic, phone, dob, address, ceboNo, role } = req.body;

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Generate custom userid
    const userid = await getNextSequenceValue('userid');

    // Create user
    const newUser = new User({
      userid, // Add custom userid
      firstName,
      lastName,
      email,
      password: hashedPassword,
      nic,
      phone,
      dob,
      address,
      ceboNo,
      role
    });

    await newUser.save();
    console.log("✅ New user created:", newUser._id, newUser.email, newUser.userid);

    res.status(201).json({ message: 'User created successfully', userid: newUser.userid });
  } catch (error) {
    console.error("❌ Signup error:", error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Login
const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log("🔐 Login attempt for:", email);

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      console.log("❌ User not found:", email);
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      console.log("❌ Invalid password for:", email);
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Generate token
    const token = jwt.sign(
      {
        userId: user._id.toString(),
        email: user.email,
        role: user.role,
        userid: user.userid // Include custom userid in token
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    console.log("✅ Login successful for:", email, "User ID:", user._id, "Custom UserID:", user.userid);

    // Return token and user data
    res.json({
      token,
      userId: user._id.toString(),
      userid: user.userid, // Include custom userid
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role
    });
  } catch (error) {
    console.error("❌ Login error:", error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = { signup, login };