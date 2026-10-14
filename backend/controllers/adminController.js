const Admin = require('../models/adminModel');
const Restaurant = require('../models/Restaurant');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');

// Token Generator Helper
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET || 'secretkey', {
        expiresIn: '1d',
    });
};

// @desc    Admin Login
// @route   POST /api/admin/login
exports.loginAdmin = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Check if admin exists
        const admin = await Admin.findOne({ email });
        if (!admin) {
            return res.status(401).json({ message: 'Invalid Email or Password' });
        }

        // Match Password
        const isMatch = await admin.matchPassword(password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid Email or Password' });
        }

        // Return Data with Token
        res.status(200).json({
            _id: admin._id,
            name: admin.name,
            email: admin.email,
            role: admin.role,
            token: generateToken(admin._id),
        });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// @desc    Get Admin Profile
// @route   GET /api/admin/profile/:id
exports.getAdminProfile = async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ message: 'Invalid Admin ID' });
        }

        let admin = await Admin.findById(req.params.id).select('-password');
        if (!admin) {
            // Check if ID is a Restaurant
            const rest = await Restaurant.findById(req.params.id).select('-password');
            if (rest) {
                return res.status(200).json({
                    id: rest._id,
                    _id: rest._id,
                    name: rest.ownerName || rest.restaurantName,
                    email: rest.email,
                    role: 'restaurant',
                    phone: rest.phone || '',
                    restaurantId: rest.restaurantId,
                    restaurantName: rest.restaurantName,
                });
            }
            return res.status(404).json({ message: 'Admin not found' });
        }

        res.status(200).json({
            id: admin._id,
            _id: admin._id,
            name: admin.name,
            email: admin.email,
            role: admin.role,
            phone: admin.phone || '',
            restaurantId: admin.restaurantCode || '',
            restaurantName: admin.restaurantName || '',
        });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// @desc    Update Admin Profile
// @route   PUT /api/admin/profile/:id
exports.updateAdminProfile = async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ message: 'Invalid Admin ID' });
        }

        const { name, email, phone } = req.body;
        const updateData = {};
        if (name) updateData.name = name.trim();
        if (email) updateData.email = email.trim().toLowerCase();
        if (phone !== undefined) updateData.phone = phone.trim();

        let updated = await Admin.findByIdAndUpdate(req.params.id, updateData, { new: true }).select('-password');

        if (!updated) {
            // Check if ID is Restaurant
            const rest = await Restaurant.findById(req.params.id);
            if (rest) {
                if (name) rest.ownerName = name.trim();
                if (email) rest.email = email.trim().toLowerCase();
                if (phone !== undefined) rest.phone = phone.trim();
                await rest.save();

                // Also check if admin exists by email and update
                await Admin.findOneAndUpdate(
                    { email: rest.email },
                    { name: rest.ownerName, phone: rest.phone, email: rest.email },
                    { new: true }
                );

                return res.status(200).json({
                    message: 'Profile updated successfully',
                    user: {
                        id: rest._id,
                        _id: rest._id,
                        name: rest.ownerName,
                        email: rest.email,
                        role: 'restaurant',
                        phone: rest.phone || '',
                        restaurantId: rest.restaurantId,
                        restaurantName: rest.restaurantName,
                    },
                });
            }
            return res.status(404).json({ message: 'Admin not found' });
        }

        // If updated Admin has restaurantId, sync to Restaurant
        if (updated.restaurantId) {
            const restUpdate = {};
            if (name) restUpdate.ownerName = name.trim();
            if (email) restUpdate.email = email.trim().toLowerCase();
            if (phone !== undefined) restUpdate.phone = phone.trim();
            await Restaurant.findByIdAndUpdate(updated.restaurantId, restUpdate);
        }

        res.status(200).json({
            message: 'Profile updated successfully',
            user: {
                id: updated._id,
                _id: updated._id,
                name: updated.name,
                email: updated.email,
                role: updated.role,
                phone: updated.phone || '',
                restaurantId: updated.restaurantCode || '',
                restaurantName: updated.restaurantName || '',
            },
        });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};