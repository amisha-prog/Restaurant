const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");
const Cleaner = require("../models/Cleaner");
const Restaurant = require("../models/Restaurant");
const Table = require("../models/Table");

// =====================================================
// CREATE CLEANER
// =====================================================
const createCleaner = async (req, res) => {
  try {
    const {
      restaurantId,
      name,
      email,
      phone,
      password,
      assignedArea,
      shift,
    } = req.body;

    if (!restaurantId || !name || !password) {
      return res.status(400).json({
        success: false,
        message: "Restaurant ID, cleaner name, and password are required.",
      });
    }

    // Resolve restaurant
    let targetRestaurant = null;
    const restQuery = [{ restaurantId: String(restaurantId).toUpperCase() }];
    if (mongoose.isValidObjectId(restaurantId)) {
      restQuery.unshift({ _id: restaurantId });
    }

    targetRestaurant = await Restaurant.findOne({ $or: restQuery });
    if (!targetRestaurant) {
      return res.status(404).json({
        success: false,
        message: "Restaurant not found.",
      });
    }

    // Check duplicate email if provided
    if (email && email.trim()) {
      const normalizedEmail = email.trim().toLowerCase();
      const existingCleaner = await Cleaner.findOne({ email: normalizedEmail });
      if (existingCleaner) {
        return res.status(400).json({
          success: false,
          message: "A cleaner with this email address already exists.",
        });
      }
    }

    // Generate auto-increment CLEANER ID: CLN001, CLN002...
    const lastCleaner = await Cleaner.findOne().sort({ createdAt: -1 }).select("cleanerId");
    let nextNum = 1;
    if (lastCleaner && lastCleaner.cleanerId) {
      const parsed = parseInt(lastCleaner.cleanerId.replace("CLN", ""), 10);
      if (!isNaN(parsed)) {
        nextNum = parsed + 1;
      }
    }
    const cleanerId = `CLN${String(nextNum).padStart(3, "0")}`;

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    const cleaner = await Cleaner.create({
      restaurantId: targetRestaurant._id,
      cleanerId,
      name: name.trim(),
      email: email ? email.trim().toLowerCase() : "",
      phone: phone ? phone.trim() : "",
      password: hashedPassword,
      assignedArea: assignedArea ? assignedArea.trim() : "Dining Hall & Tables",
      shift: shift || "Full Day",
      status: "Active",
    });

    return res.status(201).json({
      success: true,
      message: "Cleaner account created successfully.",
      cleaner: {
        id: cleaner._id,
        _id: cleaner._id,
        cleanerId: cleaner.cleanerId,
        name: cleaner.name,
        email: cleaner.email,
        phone: cleaner.phone,
        assignedArea: cleaner.assignedArea,
        shift: cleaner.shift,
        status: cleaner.status,
        restaurantId: targetRestaurant._id,
        restaurantName: targetRestaurant.restaurantName,
        restaurantCode: targetRestaurant.restaurantId,
      },
    });
  } catch (error) {
    console.error("Create Cleaner Error:", error);
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Cleaner ID or email already exists.",
      });
    }
    return res.status(500).json({
      success: false,
      message: "Server error creating cleaner account.",
    });
  }
};

// =====================================================
// GET ALL CLEANERS (Admin Staff View)
// =====================================================
const getCleaners = async (req, res) => {
  try {
    const { restaurantId } = req.query;
    let filter = {};

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
        filter.restaurantId = rest._id;
      } else if (mongoose.isValidObjectId(restaurantId)) {
        filter.restaurantId = restaurantId;
      } else {
        filter.restaurantId = new mongoose.Types.ObjectId();
      }
    }

    const cleaners = await Cleaner.find(filter)
      .select("-password")
      .populate("restaurantId", "restaurantName restaurantId city")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: cleaners.length,
      cleaners,
    });
  } catch (error) {
    console.error("Get Cleaners Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch cleaners.",
    });
  }
};

// =====================================================
// GET SINGLE CLEANER
// =====================================================
const getCleanerById = async (req, res) => {
  try {
    const cleaner = await Cleaner.findById(req.params.id)
      .select("-password")
      .populate("restaurantId", "restaurantName restaurantId city");

    if (!cleaner) {
      return res.status(404).json({
        success: false,
        message: "Cleaner not found.",
      });
    }

    return res.status(200).json({
      success: true,
      cleaner,
    });
  } catch (error) {
    console.error("Get Cleaner Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch cleaner profile.",
    });
  }
};

// =====================================================
// UPDATE / TOGGLE CLEANER STATUS (Active <-> Inactive)
// =====================================================
const updateCleanerStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body || {};

    const cleaner = await Cleaner.findById(id);
    if (!cleaner) {
      return res.status(404).json({ success: false, message: "Cleaner not found." });
    }

    const nextStatus = status || (cleaner.status === "Active" ? "Inactive" : "Active");
    cleaner.status = nextStatus;
    await cleaner.save();

    return res.status(200).json({
      success: true,
      message: `Cleaner status updated to ${nextStatus}`,
      status: nextStatus,
      cleaner,
    });
  } catch (error) {
    console.error("Update Cleaner Status Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update cleaner status.",
    });
  }
};

// =====================================================
// GET CLEANER DASHBOARD
// =====================================================
const getCleanerDashboard = async (req, res) => {
  try {
    const cleaner = await Cleaner.findById(req.params.id)
      .select("-password")
      .populate("restaurantId", "restaurantName restaurantId city");

    if (!cleaner) {
      return res.status(404).json({ success: false, message: "Cleaner not found." });
    }

    // Fetch tables for cleaner's restaurant
    const tables = await Table.find({ restaurantId: cleaner.restaurantId._id }).sort({ tableNumber: 1 });
    const tablesNeedingCleaning = tables.filter((t) => t.status === "Cleaning");
    const availableTables = tables.filter((t) => t.status === "Available");
    const occupiedTables = tables.filter((t) => t.status === "Occupied");

    return res.status(200).json({
      success: true,
      cleaner,
      restaurant: cleaner.restaurantId,
      tables,
      stats: {
        totalTables: tables.length,
        needingCleaning: tablesNeedingCleaning.length,
        available: availableTables.length,
        occupied: occupiedTables.length,
      },
    });
  } catch (error) {
    console.error("Cleaner Dashboard Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to load cleaner dashboard.",
    });
  }
};

// =====================================================
// MARK TABLE CLEANED (Cleaning -> Available)
// =====================================================
const markTableCleaned = async (req, res) => {
  try {
    const { tableId } = req.params;
    const table = await Table.findById(tableId);

    if (!table) {
      return res.status(404).json({ success: false, message: "Table not found." });
    }

    table.status = "Available";
    await table.save();

    return res.status(200).json({
      success: true,
      message: `Table ${table.tableNumber} is now marked Available and Clean.`,
      table,
    });
  } catch (error) {
    console.error("Mark Table Cleaned Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update table cleaning status.",
    });
  }
};

module.exports = {
  createCleaner,
  getCleaners,
  getCleanerById,
  updateCleanerStatus,
  getCleanerDashboard,
  markTableCleaned,
};
