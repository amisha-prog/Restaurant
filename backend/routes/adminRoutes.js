const express = require('express');
const router = express.Router();

// Corrected relative path to controllers
const { loginAdmin, getAdminProfile, updateAdminProfile } = require('../controllers/adminController');

// Login Route
router.post('/login', loginAdmin);

// Profile Routes
router.get('/profile/:id', getAdminProfile);
router.put('/profile/:id', updateAdminProfile);

module.exports = router;