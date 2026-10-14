const mongoose = require('mongoose');
const Admin = require('./models/adminModel');
require('dotenv').config();

// Connect to Database
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/restaurant')
  .then(() => console.log('MongoDB Connected for Seeding...'))
  .catch((err) => console.log('DB Connection Error:', err));

const makeAdmin = async () => {
  try {
    // Duplicate entry se bachne ke liye pehle check karein
    const existingAdmin = await Admin.findOne({ email: "admin@gmail.com" });
    if (existingAdmin) {
      console.log("Admin user pehle se database me maujood hai!");
      process.exit();
    }

    await Admin.create({
      name: "Admin User",
      email: "admin@gmail.com",
      password: "password123"
    });

    console.log("SUCCESS: Admin User Ban Gaya Hai!");
  } catch (error) {
    console.log("Error:", error.message);
  } finally {
    process.exit();
  }
};

makeAdmin();