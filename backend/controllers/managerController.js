const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");
const Manager = require("../models/Manager");
const Restaurant = require("../models/Restaurant");
const Order = require("../models/Order");
const Table = require("../models/Table");
const Waiter = require("../models/Waiter");
const Menu = require("../models/Menu");

const createManager = async (req, res) => {
  try {
    const { restaurantId, name, email, password, phone } = req.body;
    if (!restaurantId || !name || !email || !password) return res.status(400).json({ message: "Restaurant, name, email and password are required." });
    const query = [{ restaurantId: String(restaurantId).toUpperCase() }];
    if (mongoose.isValidObjectId(restaurantId)) query.unshift({ _id: restaurantId });
    const restaurant = await Restaurant.findOne({ $or: query });
    if (!restaurant) return res.status(404).json({ message: "Restaurant not found." });
    const count = await Manager.countDocuments();
    const manager = await Manager.create({ restaurantId: restaurant._id, managerId: `MGR${String(count + 1).padStart(3, "0")}`, name, email, phone, password: await bcrypt.hash(password, 10) });
    return res.status(201).json({ success: true, manager: { id: manager._id, managerId: manager.managerId, name: manager.name, email: manager.email } });
  } catch (error) {
    return res.status(error.code === 11000 ? 400 : 500).json({ message: error.code === 11000 ? "Manager email already exists." : "Unable to create manager." });
  }
};

const getManagerDashboard = async (req, res) => {
  try {
    const manager = await Manager.findById(req.params.id).select("-password").populate("restaurantId", "restaurantName restaurantId");
    if (!manager) return res.status(404).json({ success: false, message: "Manager not found." });
    const restaurantId = manager.restaurantId._id;
    const publicId = manager.restaurantId.restaurantId;
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const query = { restaurantId: { $in: [String(restaurantId), publicId] } };
    const [orders, todayOrders, tables, staff, menu] = await Promise.all([
      Order.find(query).sort({ createdAt: -1 }).limit(100),
      Order.find({ ...query, createdAt: { $gte: today } }),
      Table.find({ restaurantId }).populate("assignedWaiter", "name waiterId").sort({ tableNumber: 1 }),
      Waiter.find({ restaurantId }).select("waiterId name email phone status").sort({ createdAt: -1 }),
      Menu.find().sort({ category: 1, name: 1 }),
    ]);
    const paidOrders = todayOrders.filter((order) => order.payment?.status === "Paid" || ["Served", "Completed"].includes(order.status));
    const customers = Object.values(orders.reduce((grouped, order) => { const key = order.customerPhone || order.customerName || order._id; if (!grouped[key]) grouped[key] = { name: order.customerName || "Walk-in customer", phone: order.customerPhone || "", orders: 0, spend: 0 }; grouped[key].orders += 1; grouped[key].spend += Number(order.total || 0); return grouped; }, {}));
    return res.json({ success: true, manager, orders, tables, staff, menu, customers, reservations: tables.filter((table) => table.status === "Reserved"), stats: { todaySales: paidOrders.reduce((sum, order) => sum + Number(order.total || 0), 0), todayOrders: todayOrders.length, activeOrders: orders.filter((order) => ["New", "Preparing", "Ready"].includes(order.status)).length, readyOrders: orders.filter((order) => order.status === "Ready").length, occupiedTables: tables.filter((table) => table.status === "Occupied").length, reservations: tables.filter((table) => table.status === "Reserved").length, staff: staff.length, customers: customers.length } });
  } catch (error) { console.error("Manager dashboard error:", error); return res.status(500).json({ success: false, message: "Unable to load manager dashboard." }); }
};

module.exports = { createManager, getManagerDashboard };
