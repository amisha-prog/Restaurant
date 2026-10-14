const express = require("express");
const router = express.Router();
const Cleaner = require("../models/Cleaner");

const {
  createCleaner,
  getCleaners,
  getCleanerById,
  updateCleanerStatus,
  getCleanerDashboard,
  markTableCleaned,
} = require("../controllers/cleanerController");

// Create new cleaner account
router.post("/", createCleaner);

// Get all cleaners (for admin staff management view)
router.get("/", getCleaners);

// Get single cleaner profile
router.get("/:id", getCleanerById);

// Update cleaner profile (name, email, phone, assignedArea, shift)
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, phone, assignedArea, shift } = req.body || {};
    const cleaner = await Cleaner.findById(id);
    if (!cleaner) return res.status(404).json({ success: false, message: "Cleaner not found." });
    if (name) cleaner.name = name.trim();
    if (email) cleaner.email = email.trim();
    if (phone !== undefined) cleaner.phone = phone.trim();
    if (assignedArea) cleaner.assignedArea = assignedArea;
    if (shift) cleaner.shift = shift;
    await cleaner.save();
    res.json({ success: true, message: "Cleaner updated.", cleaner });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Reset cleaner password (admin action)
const bcrypt = require("bcryptjs");
router.patch("/:id/reset-password", async (req, res) => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body || {};
    if (!newPassword || String(newPassword).trim().length < 6) {
      return res.status(400).json({ success: false, message: "New password must be at least 6 characters." });
    }
    const cleaner = await Cleaner.findById(id);
    if (!cleaner) return res.status(404).json({ success: false, message: "Cleaner not found." });
    cleaner.password = await bcrypt.hash(String(newPassword).trim(), 10);
    await cleaner.save();
    res.json({ success: true, message: "Cleaner password reset successfully." });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Update / toggle cleaner active/inactive status
router.patch("/:id/status", updateCleanerStatus);

// Get cleaner dashboard (tables needing cleaning, restaurant details)
router.get("/:id/dashboard", getCleanerDashboard);

// Mark table clean
router.patch("/tables/:tableId/cleaned", markTableCleaned);

module.exports = router;
