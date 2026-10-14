const mongoose = require("mongoose");
const Notification = require("../models/Notification");
const Restaurant = require("../models/Restaurant");

const resolveRestaurant = async (restaurantId) => {
  if (!restaurantId) return null;
  if (mongoose.Types.ObjectId.isValid(restaurantId)) {
    const byId = await Restaurant.findById(restaurantId).select("_id");
    if (byId) return byId._id;
  }
  const restaurant = await Restaurant.findOne({ restaurantId: String(restaurantId) }).select("_id");
  return restaurant?._id || null;
};

const createRestaurantNotification = async ({ restaurantId, type, title, message, tableNumber = "", orderId = null }) => {
  const resolvedId = await resolveRestaurant(restaurantId);
  if (!resolvedId) return null;
  return Notification.create({ restaurantId: resolvedId, type, title, message, tableNumber, orderId });
};

const createCustomerRequest = async (req, res) => {
  try {
    const { restaurantId, tableNumber, message = "Customer needs assistance" } = req.body;
    if (!restaurantId || !tableNumber) return res.status(400).json({ success: false, message: "Restaurant and table are required." });
    const notification = await createRestaurantNotification({
      restaurantId,
      type: "customer_request",
      title: "🙋 User Assistance Request",
      message: `Customer at ${tableNumber} requested assistance: "${message}"`,
      tableNumber,
    });
    if (!notification) return res.status(404).json({ success: false, message: "Restaurant not found." });
    return res.status(201).json({ success: true, notification });
  } catch (error) {
    console.error("Customer request notification error:", error);
    return res.status(500).json({ success: false, message: "Unable to send customer request." });
  }
};

const createBillRequest = async (req, res) => {
  try {
    const { restaurantId, tableNumber } = req.body;
    if (!restaurantId || !tableNumber) return res.status(400).json({ success: false, message: "Restaurant and table are required." });
    const notification = await createRestaurantNotification({
      restaurantId,
      type: "bill_request",
      title: "🧾 User Request: Bill Requested",
      message: `Customer at ${tableNumber} requested the bill.`,
      tableNumber,
    });
    if (!notification) return res.status(404).json({ success: false, message: "Restaurant not found." });
    return res.status(201).json({ success: true, notification });
  } catch (error) {
    console.error("Bill request notification error:", error);
    return res.status(500).json({ success: false, message: "Unable to send bill request." });
  }
};

const getRestaurantNotifications = async (req, res) => {
  try {
    const { restaurantId } = req.query;
    if (!restaurantId) return res.status(400).json({ success: false, message: "Restaurant ID is required." });
    const resolvedId = await resolveRestaurant(restaurantId);
    if (!resolvedId) return res.status(404).json({ success: false, message: "Restaurant not found." });
    const notifications = await Notification.find({ restaurantId: resolvedId })
      .sort({ createdAt: -1 })
      .limit(60)
      .lean();
    return res.json({ success: true, notifications });
  } catch (error) {
    console.error("Get restaurant notifications error:", error);
    return res.status(500).json({ success: false, message: "Failed to load notifications." });
  }
};

module.exports = {
  createRestaurantNotification,
  createCustomerRequest,
  createBillRequest,
  getRestaurantNotifications,
};

