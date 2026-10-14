const express = require("express");
const mongoose = require("mongoose");
const os = require("os");
const Table = require("../models/Table");
const Restaurant = require("../models/Restaurant");

const router = express.Router();

// Helper to get local network IPv4 address (e.g. 192.168.1.41)
const getLocalIpAddress = () => {
  const interfaces = os.networkInterfaces();
  for (const ifaceName of Object.keys(interfaces)) {
    for (const iface of interfaces[ifaceName]) {
      if (iface.family === "IPv4" && !iface.internal) {
        return iface.address;
      }
    }
  }
  return "127.0.0.1";
};

// GET /api/tables/network-ip or /api/network-ip
router.get("/network-ip", (req, res) => {
  try {
    const localIp = getLocalIpAddress();
    return res.status(200).json({
      success: true,
      localIp,
      frontendPort: 5173,
      backendPort: 5001,
      networkBaseUrl: process.env.FRONTEND_URL ? process.env.FRONTEND_URL.replace(/\/+$/, "") : `http://${localIp}:5173`,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// Helper to resolve Restaurant ObjectId
const findTargetRestaurant = async (identifier) => {
  if (!identifier) return null;
  if (mongoose.isValidObjectId(identifier)) {
    const found = await Restaurant.findById(identifier);
    if (found) return found;
  }
  return await Restaurant.findOne({
    $or: [
      { restaurantId: String(identifier).toUpperCase() },
      { restaurantId: identifier },
      { email: String(identifier).toLowerCase() },
      { name: identifier },
      { restaurantName: identifier },
    ],
  });
};

// GET /api/tables?restaurantId=...
router.get("/", async (req, res) => {
  try {
    const { restaurantId } = req.query;
    if (!restaurantId) {
      return res.status(400).json({ success: false, message: "restaurantId query param is required." });
    }

    const restaurant = await findTargetRestaurant(restaurantId);
    if (!restaurant) {
      return res.status(404).json({ success: false, message: "Restaurant not found." });
    }

    const tables = await Table.find({ restaurantId: restaurant._id }).sort({ tableNumber: 1 });

    return res.status(200).json({
      success: true,
      restaurant: {
        _id: restaurant._id,
        restaurantId: restaurant.restaurantId,
        restaurantName: restaurant.restaurantName,
      },
      tables: tables || [],
    });
  } catch (error) {
    console.error("Fetch tables error:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch tables." });
  }
});

// DELETE /api/tables/all?restaurantId=... (Clear all tables for a restaurant)
router.delete("/all", async (req, res) => {
  try {
    const { restaurantId } = req.query;
    if (!restaurantId) {
      return res.status(400).json({ success: false, message: "restaurantId query param is required." });
    }

    const restaurant = await findTargetRestaurant(restaurantId);
    if (!restaurant) {
      return res.status(404).json({ success: false, message: "Restaurant not found." });
    }

    const result = await Table.deleteMany({ restaurantId: restaurant._id });
    return res.status(200).json({
      success: true,
      message: `Cleared ${result.deletedCount} tables for ${restaurant.restaurantName}`,
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    console.error("Delete all tables error:", error);
    return res.status(500).json({ success: false, message: "Failed to clear tables." });
  }
});

// POST /api/tables (Create new table)
router.post("/", async (req, res) => {
  try {
    const { restaurantId, tableNumber, capacity, status } = req.body;
    if (!restaurantId || !tableNumber) {
      return res.status(400).json({ success: false, message: "restaurantId and tableNumber are required." });
    }

    const restaurant = await findTargetRestaurant(restaurantId);
    if (!restaurant) {
      return res.status(404).json({ success: false, message: "Restaurant not found." });
    }

    const cleanTableNumber = String(tableNumber).trim();
    const existing = await Table.findOne({
      restaurantId: restaurant._id,
      tableNumber: { $regex: new RegExp(`^${cleanTableNumber}$`, "i") },
    });

    if (existing) {
      return res.status(400).json({ success: false, message: `Table "${cleanTableNumber}" already exists.` });
    }

    const newTable = new Table({
      restaurantId: restaurant._id,
      tableNumber: cleanTableNumber,
      capacity: Number(capacity) || 4,
      status: status || "Available",
    });

    await newTable.save();

    return res.status(201).json({
      success: true,
      message: "Table created successfully.",
      table: newTable,
    });
  } catch (error) {
    console.error("Create table error:", error);
    return res.status(500).json({ success: false, message: "Failed to create table." });
  }
});

// PUT /api/tables/:id (Update table)
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { tableNumber, capacity, status } = req.body;

    const table = await Table.findById(id);
    if (!table) {
      return res.status(404).json({ success: false, message: "Table not found." });
    }

    if (tableNumber) {
      const cleanNum = String(tableNumber).trim();
      const duplicate = await Table.findOne({
        _id: { $ne: id },
        restaurantId: table.restaurantId,
        tableNumber: { $regex: new RegExp(`^${cleanNum}$`, "i") },
      });
      if (duplicate) {
        return res.status(400).json({ success: false, message: `Table "${cleanNum}" already exists.` });
      }
      table.tableNumber = cleanNum;
    }

    if (capacity !== undefined) {
      table.capacity = Number(capacity) || 4;
    }

    if (status) {
      table.status = status;
    }

    await table.save();

    return res.status(200).json({
      success: true,
      message: "Table updated successfully.",
      table,
    });
  } catch (error) {
    console.error("Update table error:", error);
    return res.status(500).json({ success: false, message: "Failed to update table." });
  }
});

// DELETE /api/tables/:id
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Table.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: "Table not found." });
    }
    return res.status(200).json({
      success: true,
      message: "Table deleted successfully.",
      tableId: id,
    });
  } catch (error) {
    console.error("Delete table error:", error);
    return res.status(500).json({ success: false, message: "Failed to delete table." });
  }
});

module.exports = router;
module.exports.getLocalIpAddress = getLocalIpAddress;
