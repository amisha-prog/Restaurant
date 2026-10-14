const router = require("express").Router();
const mongoose = require("mongoose");
const { createManager, getManagerDashboard } = require("../controllers/managerController");
const Manager = require("../models/Manager");
const Restaurant = require("../models/Restaurant");

// Create manager
router.post("/", createManager);

// Get manager dashboard
router.get("/:id/dashboard", getManagerDashboard);

// GET all managers (admin staff view)
router.get("/", async (req, res) => {
  try {
    const { restaurantId } = req.query;
    let query = {};
    if (restaurantId) {
      const restQuery = [
        { restaurantId: String(restaurantId).toUpperCase() },
        { restaurantId: String(restaurantId) },
      ];
      if (mongoose.isValidObjectId(restaurantId)) {
        restQuery.unshift({ _id: restaurantId });
      }
      const rest = await Restaurant.findOne({ $or: restQuery });
      if (rest) {
        query.restaurantId = rest._id;
      } else if (mongoose.isValidObjectId(restaurantId)) {
        query.restaurantId = restaurantId;
      } else {
        query.restaurantId = new mongoose.Types.ObjectId();
      }
    }
    const managers = await Manager.find(query)
      .select("-password")
      .populate("restaurantId", "restaurantName restaurantId city")
      .sort({ createdAt: -1 });
    res.json({ success: true, managers });
  } catch (err) {
    console.error("GET managers error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// Update manager profile (name, email, phone)
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, phone } = req.body || {};
    const manager = await Manager.findById(id);
    if (!manager) return res.status(404).json({ success: false, message: "Manager not found." });
    if (name) manager.name = name.trim();
    if (email) manager.email = email.trim();
    if (phone !== undefined) manager.phone = phone.trim();
    await manager.save();
    res.json({ success: true, message: "Manager updated.", manager });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Reset manager password (admin action)
router.patch("/:id/reset-password", async (req, res) => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body || {};
    if (!newPassword || String(newPassword).trim().length < 6) {
      return res.status(400).json({ success: false, message: "New password must be at least 6 characters." });
    }
    const manager = await Manager.findById(id);
    if (!manager) return res.status(404).json({ success: false, message: "Manager not found." });
    const bcrypt = require("bcryptjs");
    manager.password = await bcrypt.hash(String(newPassword).trim(), 10);
    await manager.save();
    res.json({ success: true, message: "Manager password reset successfully." });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Update / toggle manager active/inactive status
router.patch("/:id/status", async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body || {};

    const manager = await Manager.findById(id);
    if (!manager) {
      return res.status(404).json({ success: false, message: "Manager not found." });
    }

    const nextStatus = status || (manager.status === "Active" ? "Inactive" : "Active");
    manager.status = nextStatus;
    await manager.save();

    res.json({
      success: true,
      message: `Manager status updated to ${nextStatus}`,
      status: nextStatus,
      manager,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
