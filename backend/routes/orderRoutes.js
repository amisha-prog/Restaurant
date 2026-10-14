const express = require("express");
const {
  createOrder,
  getOrders,
  getDashboardSummary,
  updateOrderStatus,
  updateTableStatus,
} = require("../controllers/orderController");
const { createCustomerRequest, createBillRequest, getRestaurantNotifications } = require("../controllers/notificationController");

const router = express.Router();

// GET /api/orders/notifications
router.get("/notifications", getRestaurantNotifications);

// GET /api/orders/dashboard-summary (Must be before /:id)
router.get("/dashboard-summary", getDashboardSummary);

// GET /api/orders
router.get("/", getOrders);

// POST /api/orders
router.post("/", createOrder);

// PATCH /api/orders/:id/status
router.patch("/:id/status", updateOrderStatus);

// PATCH /api/orders/tables/:id/status
router.patch("/tables/:id/status", updateTableStatus);

// Customer / Bill requests
router.post("/customer-request", createCustomerRequest);
router.post("/bill-request", createBillRequest);

module.exports = router;
