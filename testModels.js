console.log('Starting test...');

require('dotenv').config();
console.log('Environment loaded');

const mongoose = require('mongoose');
console.log('Mongoose loaded');

const User = require('./models/User');
console.log('User model loaded');

const testModels = async () => {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    const superAdmin = new User({
      firstName: 'Super',
      lastName: 'Admin',
      email: 'superadmin@test.com',
      password: 'password123',
      phone: '1234567890',
      role: 'superAdmin',
      isActive: true,
      isApproved: true
    });
    
    console.log('✅ User model works');
    console.log('User:', superAdmin.fullName);
    
    await mongoose.connection.close();
    console.log('✅ Test completed');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
};

console.log('About to run test...');
testModels();
