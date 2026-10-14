const express = require("express");

const router = express.Router();

const {
  addRestaurant,
  getRestaurants,
  getRestaurantById,
  restaurantLogin,
  deleteRestaurant,
  updateRestaurant,
} = require("../controllers/restaurantController");

// =====================================================
// ADD RESTAURANT
// =====================================================

// POST /api/restaurants/add
router.post("/add", addRestaurant);

// POST /api/restaurants
// Kept for compatibility with existing frontend
router.post("/", addRestaurant);


// =====================================================
// GET ALL RESTAURANTS
// =====================================================

// GET /api/restaurants
router.get("/", getRestaurants);


// =====================================================
// RESTAURANT LOGIN
// =====================================================

// POST /api/restaurants/login
router.post("/login", restaurantLogin);


// =====================================================
// GET SINGLE RESTAURANT
// =====================================================

// GET /api/restaurants/:id
router.get("/:id", getRestaurantById);


// =====================================================
// UPDATE RESTAURANT
// =====================================================

// PUT /api/restaurants/:id
router.put("/:id", updateRestaurant);


// =====================================================
// DELETE RESTAURANT
// =====================================================

// DELETE /api/restaurants/:id
router.delete("/:id", deleteRestaurant);

// =====================================================
// RESET RESTAURANT PASSWORD
// =====================================================
const bcrypt = require("bcryptjs");
const Admin = require("../models/adminModel");
const RestaurantModel = require("../models/Restaurant");

router.patch("/:id/reset-password", async (req, res) => {
  try {
    const { id } = req.params;
    const body = req.body || {};
    const newPassword = body.newPassword || body.password || body.new_restaurant_password;
    if (!newPassword || String(newPassword).trim().length < 6) {
      return res.status(400).json({ success: false, message: "New password must be at least 6 characters." });
    }

    let restaurant = null;
    if (require("mongoose").Types.ObjectId.isValid(id)) {
      restaurant = await RestaurantModel.findById(id);
    }
    if (!restaurant) {
      restaurant = await RestaurantModel.findOne({
        $or: [
          { restaurantId: String(id).toUpperCase() },
          { email: String(id).toLowerCase() },
        ],
      });
    }

    if (!restaurant) {
      return res.status(404).json({ success: false, message: "Restaurant not found." });
    }

    const hashedPassword = await bcrypt.hash(String(newPassword).trim(), 10);
    restaurant.password = hashedPassword;
    await restaurant.save();

    // Also sync linked Admin account if exists
    try {
      const linkedAdmin = await Admin.findOne({
        $or: [
          { restaurantId: restaurant._id },
          { email: restaurant.email },
          { restaurantCode: restaurant.restaurantId },
        ],
      });
      if (linkedAdmin) {
        linkedAdmin.password = String(newPassword).trim();
        await linkedAdmin.save();
      }
    } catch (adminSyncErr) {
      console.warn("Admin sync warning:", adminSyncErr.message);
    }

    res.json({ success: true, message: "Password reset successfully!" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// =====================================================
// RESTAURANT DASHBOARD (Admin view)
// =====================================================
const Order = require("../models/Order");
const Manager = require("../models/Manager");
const Waiter = require("../models/Waiter");
const Table = require("../models/Table");

router.get("/:id/dashboard", async (req, res) => {
  try {
    const restaurant = await require("../models/Restaurant")
      .findById(req.params.id)
      .select("-password");
    if (!restaurant) return res.status(404).json({ success: false, message: "Restaurant not found." });

    const rid = restaurant._id;
    const pubId = restaurant.restaurantId;
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const query = { restaurantId: { $in: [String(rid), pubId] } };

    const [orders, todayOrders, managers, waiters, tables] = await Promise.all([
      Order.find(query).sort({ createdAt: -1 }).limit(100),
      Order.find({ ...query, createdAt: { $gte: today } }),
      Manager.find({ restaurantId: rid }).select("-password"),
      Waiter.find({ restaurantId: rid }).select("-password"),
      Table.find({ restaurantId: rid }).sort({ tableNumber: 1 }),
    ]);

    const paidOrders = todayOrders.filter(o => ["Served", "Completed", "Paid"].includes(o.status) || o.payment?.status === "Paid");
    const customers = Object.values(orders.reduce((acc, o) => {
      const key = o.customerPhone || o.customerName || String(o._id);
      if (!acc[key]) acc[key] = { name: o.customerName || "Walk-in", phone: o.customerPhone || "", orders: 0, spend: 0 };
      acc[key].orders += 1;
      acc[key].spend += Number(o.total || 0);
      return acc;
    }, {}));

    res.json({
      success: true,
      restaurant,
      orders,
      managers,
      waiters,
      tables,
      customers,
      stats: {
        todaySales: paidOrders.reduce((s, o) => s + Number(o.total || 0), 0),
        todayOrders: todayOrders.length,
        activeOrders: orders.filter(o => ["New", "Preparing", "Ready"].includes(o.status)).length,
        readyOrders: orders.filter(o => o.status === "Ready").length,
        occupiedTables: tables.filter(t => t.status === "Occupied").length,
        totalTables: tables.length,
        managers: managers.length,
        waiters: waiters.length,
        customers: customers.length,
      },
    });
  } catch (err) {
    console.error("Restaurant dashboard error:", err);
    res.status(500).json({ success: false, message: "Failed to load restaurant dashboard." });
  }
});



// Update / toggle restaurant active/inactive status
const Restaurant = require("../models/Restaurant");
router.patch("/:id/status", async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body || {};

    const rest = await Restaurant.findById(id);
    if (!rest) {
      return res.status(404).json({ success: false, message: "Restaurant not found." });
    }

    const currentStatus = rest.status?.trim().toLowerCase() === "inactive" ? "Inactive" : "Active";
    const nextStatus = status || (currentStatus === "Active" ? "Inactive" : "Active");
    rest.status = nextStatus;
    await rest.save();

    res.json({
      success: true,
      message: `Restaurant status updated to ${nextStatus}`,
      status: nextStatus,
      restaurant: rest,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;