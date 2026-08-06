const User = require("../../Model/UserModel");
const Counter = require("../../Model/AdminandSupplyModel/counterModel");
const bcrypt = require('bcrypt');

// Function to get the next sequence value and generate formatted ID
const getNextSequenceValue = async (sequenceName) => {
  const counter = await Counter.findOneAndUpdate(
    { _id: sequenceName },
    { $inc: { sequence_value: 1 } },
    { new: true, upsert: true }
  );
  const sequence = counter.sequence_value.toString().padStart(4, '0'); // Pad with zeros to get 0001, 0002, etc.
  return `${counter.prefix}${sequence}`; // e.g., SELFMEID0001
};

// ------------------- ADD USER -------------------
const addUser = async (req, res) => {
  const { firstName, lastName, email, password, nic, phone, dob, address, ceboNo, role, status } = req.body;
  try {
    // Generate custom userid
    const userid = await getNextSequenceValue('userid');

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

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
      role,
      status,
    });

    await newUser.save();
    return res.status(201).json({ user: newUser });
  } catch (err) {
    console.error(err);
    return res.status(400).json({ message: "Validation error", error: err.message });
  }
};

// ------------------- UPDATE USER -------------------
const updateUser = async (req, res) => {
  const id = req.params.id;
  const { firstName, lastName, email, password, nic, phone, dob, address, ceboNo, role, status } = req.body;
  const updateData = {
    firstName,
    lastName,
    email,
    nic,
    phone,
    dob,
    address,
    ceboNo,
    role,
    status,
  };
  // Exclude userid from being updated
  delete updateData.userid;
  
  if (password) {
    updateData.password = await bcrypt.hash(password, 10);
  }
  try {
    const updatedUser = await User.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });
    if (!updatedUser) return res.status(404).json({ message: "User not found" });
    return res.status(200).json({ user: updatedUser });
  } catch (err) {
    console.error(err);
    return res.status(400).json({ message: "Validation error", error: err.message });
  }
};

// ------------------- GET ALL USERS -------------------
const getAllUsers = async (req, res) => {
  try {
    const users = await User.find();
    return res.status(200).json({ users });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
};

// ------------------- GET USER BY ID -------------------
const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    return res.status(200).json({ user });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
};

// ------------------- DELETE USER -------------------
const deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ message: "Unable to delete user" });
    return res.status(200).json({ user });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
};

// ------------------- EXPORT CONTROLLER FUNCTIONS -------------------
module.exports = {
  addUser,
  updateUser,
  getAllUsers,
  getUserById,
  deleteUser,
};