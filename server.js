// backend/server.js
console.log('🚀 Starting Insurance Broker API...');

const express = require('express');
const cors = require('cors');
const connectDB = require('./utils/db');
const authRoutes = require('./routes/authRoutes');
require('dotenv').config();

console.log('📦 Modules loaded successfully');

const app = express();

// Connect to MongoDB
console.log('🔄 Attempting to connect to MongoDB...');
connectDB();

// Middleware
console.log('🔧 Setting up middleware...');
app.use(cors());
app.use(express.json());

// Routes
console.log('🛣️ Setting up routes...');
app.use('/api/auth', authRoutes);

// Health check route
app.get('/api/health', (req, res) => {
  console.log('✅ Health check endpoint hit');
  res.json({ message: 'Insurance Broker API is running', status: 'OK' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('❌ Error occurred:', err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

// Start server
const PORT = process.env.PORT || 5000;
console.log(`🔥 Attempting to start server on port ${PORT}...`);

app.listen(PORT, () => {
  console.log(`🎉 Server successfully running on port ${PORT}`);
  console.log(`🌐 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🔐 Auth endpoint: http://localhost:${PORT}/api/auth`);
});

console.log('📝 Server setup completed');
module.exports = app;
