// testUserModel.js
const mongoose = require('mongoose');
require('dotenv').config();
const User = require('./models/User');

async function runTest() {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✅ Connected to MongoDB');

    /* ---------- create & save a user ---------- */
    const testUser = new User({
      firstName: 'John',
      lastName:  'Tester',
      email:     'john.tester@example.com',
      password:  'testpassword123',
      phone:     '1234567890',
      role:      'client'          // will trigger password-hash middleware
    });

    await testUser.save();
    console.log('✅ User saved ->', testUser.fullName, testUser.role);

    /* ---------- compare the password ---------- */
    const ok = await testUser.comparePassword('testpassword123');
    console.log('✅ Password check returns:', ok);   // should be true

    /* ---------- done ---------- */
    await mongoose.disconnect();
    console.log('✅ Disconnected – model works!');
  } catch (err) {
    console.error('❌ Test failed:', err.message);
  }
}
setTimeout(() => {
  console.log('🟢 Test script finished – press Ctrl-C to exit');
}, 1000);

runTest();
