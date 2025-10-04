// scripts/makeAdmin.js
// Usage: node scripts/makeAdmin.js <userEmail>

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../backend/models/User');

dotenv.config();

const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  console.error('MONGO_URI not set in .env');
  process.exit(1);
}

const email = process.argv[2];
if (!email) {
  console.error('Usage: node scripts/makeAdmin.js raajyadav5641@gmail.com');
  process.exit(1);
}

async function makeAdmin() {
  try {
    await mongoose.connect(MONGO_URI);
    const user = await User.findOne({ email });
    if (!user) {
      console.error('User not found');
      process.exit(1);
    }
    user.role = 'admin';
    await user.save();
    console.log(`User ${user.email} is now an admin.`);
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

makeAdmin();
