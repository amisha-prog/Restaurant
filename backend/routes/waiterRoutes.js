const express = require("express");
const mongoose = require("mongoose");
const Restaurant = require("../models/Restaurant");

const {
  createWaiter,
  waiterLogin,
  getWaiterProfile,
  getRestaurantWaiters,
  getWaiterDashboard,
  updateTableStatus,
  updateOrderStatus,
  getOrderBill,
  changeBillItemQuantity,
  addBillItem,
  applyBillDiscount,
  updateBillPayment,
  getWaiterNotifications,
  markWaiterNotificationsRead,
} = require("../controllers/waiterController");

const router = express.Router();

// Create waiter
router.post("/create", createWaiter);

// Waiter login
router.post("/login", waiterLogin);

// Get waiter profile
router.get("/profile/:id", getWaiterProfile);

// Get all waiters of restaurant
router.get("/restaurant/:restaurantId", getRestaurantWaiters);
router.get("/:id/dashboard", getWaiterDashboard);
router.patch("/:id/tables/:tableId/status", updateTableStatus);
router.patch("/:id/orders/:orderId/status", updateOrderStatus);
router.get("/:id/orders/:orderId/bill", getOrderBill);
router.patch("/:id/orders/:orderId/bill/items/:itemIndex", changeBillItemQuantity);
router.post("/:id/orders/:orderId/bill/items", addBillItem);
router.patch("/:id/orders/:orderId/bill/discount", applyBillDiscount);
router.patch("/:id/orders/:orderId/bill/payment", updateBillPayment);
router.get("/:id/notifications", getWaiterNotifications);
router.patch("/:id/notifications/:notificationId/read", markWaiterNotificationsRead);

// GET all waiters (admin staff view)
const Waiter = require("../models/Waiter");
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
    const waiters = await Waiter.find(query)
      .select("-password")
      .populate("restaurantId", "restaurantName restaurantId city")
      .sort({ createdAt: -1 });
    res.json({ success: true, waiters });
  } catch (err) {
    console.error("GET waiters error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// Update waiter profile (name, email, phone, gender, address)
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, phone, gender, address } = req.body || {};
    const waiter = await Waiter.findById(id);
    if (!waiter) return res.status(404).json({ success: false, message: "Waiter not found." });
    if (name) waiter.name = name.trim();
    if (email) waiter.email = email.trim();
    if (phone !== undefined) waiter.phone = phone.trim();
    if (gender) waiter.gender = gender;
    if (address !== undefined) waiter.address = address.trim();
    await waiter.save();
    res.json({ success: true, message: "Waiter updated.", waiter });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Reset waiter password (admin action)
const bcrypt = require("bcryptjs");
router.patch("/:id/reset-password", async (req, res) => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body || {};
    if (!newPassword || String(newPassword).trim().length < 6) {
      return res.status(400).json({ success: false, message: "New password must be at least 6 characters." });
    }
    const waiter = await Waiter.findById(id);
    if (!waiter) return res.status(404).json({ success: false, message: "Waiter not found." });
    waiter.password = await bcrypt.hash(String(newPassword).trim(), 10);
    await waiter.save();
    res.json({ success: true, message: "Waiter password reset successfully." });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Update / toggle waiter active/inactive status
router.patch("/:id/status", async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body || {};

    const waiter = await Waiter.findById(id);
    if (!waiter) {
      return res.status(404).json({ success: false, message: "Waiter not found." });
    }

    const nextStatus = status || (waiter.status === "Active" ? "Inactive" : "Active");
    waiter.status = nextStatus;
    await waiter.save();

    res.json({
      success: true,
      message: `Waiter status updated to ${nextStatus}`,
      status: nextStatus,
      waiter,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
