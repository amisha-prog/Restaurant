const express = require("express");
const router = express.Router();
const Chef = require("../models/Chef");

const {
  createChef,
  getChefs,
  getChefById,
  getChefDashboard,
  updateChefOrderStatus,
  toggleMenuItemStock,
  updateChefStatus,
} = require("../controllers/chefController");

// Create new chef account
router.post("/", createChef);

// Get all chefs (for admin staff management view)
router.get("/", getChefs);

// Get single chef profile
router.get("/:id", getChefById);

// Update chef profile (name, email, phone, speciality, shift)
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, phone, speciality, shift } = req.body || {};
    const chef = await Chef.findById(id);
    if (!chef) return res.status(404).json({ success: false, message: "Chef not found." });
    if (name) chef.name = name.trim();
    if (email) chef.email = email.trim();
    if (phone !== undefined) chef.phone = phone.trim();
    if (speciality) chef.speciality = speciality;
    if (shift) chef.shift = shift;
    await chef.save();
    res.json({ success: true, message: "Chef updated.", chef });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Reset chef password (admin action)
const bcrypt = require("bcryptjs");
router.patch("/:id/reset-password", async (req, res) => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body || {};
    if (!newPassword || String(newPassword).trim().length < 6) {
      return res.status(400).json({ success: false, message: "New password must be at least 6 characters." });
    }
    const chef = await Chef.findById(id);
    if (!chef) return res.status(404).json({ success: false, message: "Chef not found." });
    chef.password = await bcrypt.hash(String(newPassword).trim(), 10);
    await chef.save();
    res.json({ success: true, message: "Chef password reset successfully." });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Update / toggle chef active/inactive status
router.patch("/:id/status", updateChefStatus);

// Get chef live KDS dashboard
router.get("/:id/dashboard", getChefDashboard);

// Update kitchen order status (Preparing / Ready / Served)
router.patch("/orders/:orderId/status", updateChefOrderStatus);

// Toggle menu item stock availability (Available / 86'd Unavailable)
router.patch("/menu/:itemId/availability", toggleMenuItemStock);

module.exports = router;
