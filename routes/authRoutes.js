// backend/routes/authRoutes.js
const express = require('express');
const router = express.Router();
const { 
  signup, 
  login, 
  approveUser, 
  getPendingApprovals,
  getProfile,
  getAllUsers
} = require('../controllers/authController');
const { verifyToken, authorize } = require('../middleware/auth');

// Public routes (no authentication required)
router.post('/signup', signup);
router.post('/login', login);

// Protected routes (authentication required)
router.get('/profile', verifyToken, getProfile);

// Admin and SuperAdmin routes
router.get('/pending-approvals', verifyToken, authorize('admin', 'superAdmin'), getPendingApprovals);
router.put('/approve/:userId', verifyToken, authorize('admin', 'superAdmin'), approveUser);
router.get('/users', verifyToken, authorize('admin', 'superAdmin'), getAllUsers);

// Test route to verify auth is working
router.get('/test-auth', verifyToken, (req, res) => {
  res.json({ 
    message: 'Authentication working', 
    user: {
      id: req.user._id,
      name: req.user.fullName,
      role: req.user.role
    }
  });
});

module.exports = router;
