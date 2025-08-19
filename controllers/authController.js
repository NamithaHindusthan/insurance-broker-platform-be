// backend/controllers/authController.js
const User = require('../models/User');
const { generateToken } = require('../middleware/auth');

// Signup a new user (approval required based on role hierarchy)
const signup = async (req, res) => {
  try {
    const { firstName, lastName, email, password, phone, role, assignedTo } = req.body;

    // Validate required fields
    if (!firstName || !lastName || !email || !password || !phone || !role) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // Only allow specific roles to be requested (superAdmin is created manually)
    if (!['client', 'superClient', 'admin'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role for signup' });
    }

    // Check email uniqueness
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    // Create user - initially inactive and unapproved
    const user = new User({
      firstName, 
      lastName, 
      email, 
      password, 
      phone, 
      role, 
      assignedTo,
      isActive: false,
      isApproved: false
    });

    await user.save();
    
    return res.status(201).json({
      success: true,
      message: 'Signup successful, awaiting approval',
      userId: user._id,
      role: user.role
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Signup failed', 
      error: error.message 
    });
  }
};

// Login user
const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Check if account is approved and active
    if (!user.isActive || !user.isApproved) {
      return res.status(401).json({ 
        message: 'Account not approved or inactive. Please contact your administrator.' 
      });
    }

    // Verify password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate token
    const token = generateToken(user._id);
    
    return res.json({ 
      success: true,
      token, 
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
        lastLogin: user.lastLogin,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Login failed', 
      error: error.message 
    });
  }
};

// Approve user (role-based approval hierarchy)
const approveUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const approver = req.user; // from auth middleware

    const userToApprove = await User.findById(userId);
    if (!userToApprove) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (userToApprove.isApproved) {
      return res.status(400).json({ message: 'User is already approved' });
    }

    // Approval logic based on hierarchy
    // SuperAdmin approves Admin
    // Admin approves SuperClient and Client
    if (userToApprove.role === 'admin' && approver.role !== 'superAdmin') {
      return res.status(403).json({ 
        message: 'Only superAdmin can approve admin accounts' 
      });
    }

    if ((userToApprove.role === 'superClient' || userToApprove.role === 'client') && 
        (approver.role !== 'admin' && approver.role !== 'superAdmin')) {
      return res.status(403).json({ 
        message: 'Only admin or superAdmin can approve this user' 
      });
    }

    // Update user approval status
    userToApprove.isApproved = true;
    userToApprove.isActive = true;
    userToApprove.approvedBy = approver._id;
    userToApprove.approvedAt = new Date();
    await userToApprove.save();

    res.json({ 
      success: true,
      message: 'User approved successfully',
      approvedUser: {
        id: userToApprove._id,
        name: userToApprove.fullName,
        email: userToApprove.email,
        role: userToApprove.role,
        approvedAt: userToApprove.approvedAt
      }
    });
  } catch (error) {
    console.error('Approval error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Approval failed', 
      error: error.message 
    });
  }
};

// Get pending approvals (for admins and superAdmins)
const getPendingApprovals = async (req, res) => {
  try {
    const approver = req.user;
    let query = { isApproved: false };

    // Filter based on approver role
    if (approver.role === 'admin') {
      query.role = { $in: ['client', 'superClient'] };
    } else if (approver.role === 'superAdmin') {
      query.role = { $in: ['admin', 'client', 'superClient'] };
    } else {
      return res.status(403).json({ message: 'Access denied' });
    }

    const pendingUsers = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 });

    res.json({ 
      success: true,
      pendingApprovals: pendingUsers,
      count: pendingUsers.length
    });
  } catch (error) {
    console.error('Get pending approvals error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to get pending approvals', 
      error: error.message 
    });
  }
};

// Get user profile
const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    res.json({
      success: true,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        role: user.role,
        isActive: user.isActive,
        isApproved: user.isApproved,
        lastLogin: user.lastLogin,
        createdAt: user.createdAt,
        address: user.address
      }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to get profile', 
      error: error.message 
    });
  }
};

// Get all users (for admins and superAdmins)
const getAllUsers = async (req, res) => {
  try {
    const requester = req.user;
    let query = {};

    // Filter based on requester role
    if (requester.role === 'admin') {
      query.role = { $in: ['client', 'superClient'] };
    } else if (requester.role === 'superAdmin') {
      query.role = { $in: ['admin', 'client', 'superClient'] };
    } else {
      return res.status(403).json({ message: 'Access denied' });
    }

    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 });

    res.json({ 
      success: true,
      users,
      count: users.length
    });
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to get users', 
      error: error.message 
    });
  }
};

module.exports = { 
  signup, 
  login, 
  approveUser, 
  getPendingApprovals,
  getProfile,
  getAllUsers
};
