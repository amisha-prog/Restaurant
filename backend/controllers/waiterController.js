const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");
const Waiter = require("../models/Waiter");
const Table = require("../models/Table");
const Order = require("../models/Order");
const Restaurant = require("../models/Restaurant");
const Menu = require("../models/Menu");
const Notification = require("../models/Notification");
const { createRestaurantNotification } = require("./notificationController");
const syncTableStatus = require("../utils/syncTableStatus");

const ORDER_STATUSES = ["New", "Preparing", "Ready", "Served", "Completed"];
const ORDER_STATUS_TRANSITIONS = {
  New: ["Preparing"],
  Preparing: ["Ready"],
  Ready: ["Served"],
  Served: ["Completed"],
  Completed: [],
};
const TABLE_STATUSES = ["Available", "Occupied", "Reserved", "Cleaning"];
const PAYMENT_METHODS = ["Cash", "UPI", "Card"];

const getRestaurantIds = async (restaurantId) => {
  const restaurant = await Restaurant.findById(restaurantId).select("restaurantId");
  return [String(restaurantId), restaurant?.restaurantId].filter(Boolean);
};

const getWaiterOrder = async (waiterId, orderId) => {
  let waiter = null;
  if (waiterId && mongoose.isValidObjectId(waiterId)) {
    waiter = await Waiter.findById(waiterId).select("restaurantId");
  }
  let order = null;
  if (orderId && mongoose.isValidObjectId(orderId)) {
    if (waiter) {
      const restaurantIds = await getRestaurantIds(waiter.restaurantId);
      order = await Order.findOne({ _id: orderId, restaurantId: { $in: restaurantIds } });
    }
    if (!order) {
      order = await Order.findById(orderId);
    }
  }
  if (!order) return { error: "Order not found", status: 404 };
  return { waiter: waiter || { restaurantId: order.restaurantId }, order };
};

const refreshBillTotals = (order) => {
  const subtotal = (order.items || []).reduce((sum, item) => {
    const modifiers = (item.selectedModifiers || []).reduce((modifierSum, modifier) => modifierSum + Number(modifier.priceAdjustment || 0), 0);
    return sum + (Number(item.price || 0) + modifiers) * Number(item.quantity || 0);
  }, 0);
  const discount = order.discount || {};
  const requestedDiscount = discount.type === "amount"
    ? Number(discount.value || 0)
    : subtotal * Number(discount.value || 0) / 100;
  const discountAmount = Math.min(subtotal, Math.max(0, requestedDiscount));
  const taxRate = Math.max(0, Number(order.taxRate ?? 5));
  const taxAmount = (subtotal - discountAmount) * taxRate / 100;
  order.subtotal = Number(subtotal.toFixed(2));
  order.discount = { type: discount.type === "amount" ? "amount" : "percentage", value: Number(discount.value || 0), amount: Number(discountAmount.toFixed(2)) };
  order.taxRate = taxRate;
  order.taxAmount = Number(taxAmount.toFixed(2));
  order.total = Number((subtotal - discountAmount + taxAmount).toFixed(2));
};

// =====================================
// Create Waiter
// =====================================
const createWaiter = async (req, res) => {
  try {
    const {
      restaurantId,
      name,
      email,
      phone,
      password,
      gender,
      address,
    } = req.body;

    if (!restaurantId || !name || !password) {
      return res.status(400).json({
        success: false,
        message: "Restaurant ID, name and password are required",
      });
    }

    let targetRestaurantId = restaurantId;
    const restQuery = [{ restaurantId: String(restaurantId).toUpperCase() }];
    if (mongoose.isValidObjectId(restaurantId)) restQuery.unshift({ _id: restaurantId });
    const foundRest = await Restaurant.findOne({ $or: restQuery });
    if (foundRest) {
      targetRestaurantId = foundRest._id;
    } else if (!mongoose.isValidObjectId(restaurantId)) {
      return res.status(404).json({ success: false, message: "Restaurant not found" });
    }

    // Generate Waiter ID
    const lastWaiter = await Waiter.findOne()
      .sort({ createdAt: -1 })
      .select("waiterId");

    let nextNumber = 1;

    if (lastWaiter && lastWaiter.waiterId) {
      const number = parseInt(
        lastWaiter.waiterId.replace("WAIT", ""),
        10
      );

      if (!isNaN(number)) {
        nextNumber = number + 1;
      }
    }

    const waiterId = `WAIT${String(nextNumber).padStart(3, "0")}`;

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    const waiter = await Waiter.create({
      restaurantId: targetRestaurantId,
      waiterId,
      name,
      email,
      phone,
      password: hashedPassword,
      gender,
      address,
    });

    res.status(201).json({
      success: true,
      message: "Waiter created successfully",
      waiter: {
        id: waiter._id,
        waiterId: waiter.waiterId,
        name: waiter.name,
        email: waiter.email,
        phone: waiter.phone,
        gender: waiter.gender,
        address: waiter.address,
        status: waiter.status,
      },
    });
  } catch (error) {
    console.error("Create waiter error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to create waiter",
      error: error.message,
    });
  }
};

// =====================================
// Waiter Login
// =====================================
const waiterLogin = async (req, res) => {
  try {
    const { waiterId, password } = req.body;

    if (!waiterId || !password) {
      return res.status(400).json({
        success: false,
        message: "Waiter ID and password are required",
      });
    }

    const waiter = await Waiter.findOne({ waiterId });

    if (!waiter) {
      return res.status(404).json({
        success: false,
        message: "Waiter not found",
      });
    }

    if (waiter.status === "Inactive") {
      return res.status(403).json({
        success: false,
        message: "Waiter account is inactive",
      });
    }

    const passwordMatch = await bcrypt.compare(
      password,
      waiter.password
    );

    if (!passwordMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid waiter ID or password",
      });
    }

    const waiterData = await Waiter.findById(waiter._id)
      .select("-password")
      .populate("restaurantId", "restaurantName")
      .populate("assignedTables");

    res.json({
      success: true,
      message: "Waiter login successful",
      waiter: waiterData,
    });
  } catch (error) {
    console.error("Waiter login error:", error);

    res.status(500).json({
      success: false,
      message: "Login failed",
      error: error.message,
    });
  }
};

// =====================================
// Get Waiter Profile
// =====================================
const getWaiterProfile = async (req, res) => {
  try {
    const { id } = req.params;

    const waiter = await Waiter.findById(id)
      .select("-password")
      .populate("restaurantId", "restaurantName")
      .populate("assignedTables");

    if (!waiter) {
      return res.status(404).json({
        success: false,
        message: "Waiter not found",
      });
    }

    res.json({
      success: true,
      waiter,
    });
  } catch (error) {
    console.error("Get waiter profile error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to get waiter profile",
      error: error.message,
    });
  }
};

// =====================================
// Get Restaurant Waiters
// =====================================
const getRestaurantWaiters = async (req, res) => {
  try {
    const { restaurantId } = req.params;

    const waiters = await Waiter.find({ restaurantId })
      .select("-password")
      .populate("assignedTables")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      waiters,
    });
  } catch (error) {
    console.error("Get waiters error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to get waiters",
      error: error.message,
    });
  }
};

// Aggregates the restaurant's operational data into one waiter-specific payload.
const getWaiterDashboard = async (req, res) => {
  try {
    const waiter = await Waiter.findById(req.params.id)
      .select("-password")
      .populate("restaurantId", "restaurantName restaurantId")
      .populate("assignedTables");
    if (!waiter) return res.status(404).json({ success: false, message: "Waiter not found" });

    const restaurantObjectId = waiter.restaurantId?._id || waiter.restaurantId;
    const restaurantIds = [String(restaurantObjectId), waiter.restaurantId?.restaurantId].filter(Boolean);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    // Customer checkout offers these table numbers. Create their operational
    // records once, with Available as the default—not Occupied.
    await Table.bulkWrite(
      Array.from({ length: 0 }, (_, index) => {
        const tableNumber = `Table ${String(index + 1).padStart(2, "0")}`;
        return {
          updateOne: {
            filter: { restaurantId: restaurantObjectId, tableNumber },
            update: { $setOnInsert: { restaurantId: restaurantObjectId, tableNumber, capacity: 4, status: "Available" } },
            upsert: true,
          },
        };
      })
    );
    const [tables, orders, todayOrders] = await Promise.all([
      Table.find({ restaurantId: restaurantObjectId }).sort({ tableNumber: 1 }),
      Order.find({ restaurantId: { $in: restaurantIds } }).sort({ createdAt: -1 }).limit(100),
      Order.find({ restaurantId: { $in: restaurantIds }, createdAt: { $gte: today } }),
    ]);
    const assignedIds = new Set((waiter.assignedTables || []).map((table) => String(table._id)));
    const myTables = tables.filter((table) => assignedIds.has(String(table._id)) || String(table.assignedWaiter) === String(waiter._id));
    const countOrders = (status) => orders.filter((order) => order.status === status).length;
    const paidOrders = todayOrders.filter((order) => ["Served", "Completed"].includes(order.status));

    return res.json({ success: true, waiter, tables, orders, stats: {
      myTables: myTables.length,
      totalTables: tables.length,
      availableTables: tables.filter((table) => table.status === "Available").length,
      occupiedTables: tables.filter((table) => table.status === "Occupied").length,
      newOrders: countOrders("New"),
      preparingOrders: countOrders("Preparing"),
      readyOrders: countOrders("Ready"),
      todaySales: paidOrders.reduce((sum, order) => sum + Number(order.total || 0), 0),
      todayOrderCount: paidOrders.length,
    }});
  } catch (error) {
    console.error("Get waiter dashboard error:", error);
    return res.status(500).json({ success: false, message: "Failed to load waiter dashboard" });
  }
};

const updateTableStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!TABLE_STATUSES.includes(status)) return res.status(400).json({ success: false, message: "Invalid table status" });
    const waiter = await Waiter.findById(req.params.id).select("restaurantId");
    if (!waiter) return res.status(404).json({ success: false, message: "Waiter not found" });
    const table = await Table.findOne({ _id: req.params.tableId, restaurantId: waiter.restaurantId });
    if (!table) return res.status(404).json({ success: false, message: "Table not found" });

    const restaurant = await require("../models/Restaurant").findById(waiter.restaurantId).select("restaurantId");
    const restaurantIds = [String(waiter.restaurantId), restaurant?.restaurantId].filter(Boolean);

    // Do not release a table while its order is still being prepared or is
    // waiting to be served. It must move through Cleaning after completion.
    if (status === "Available") {
      const activeOrders = await Order.exists({
        restaurantId: { $in: restaurantIds },
        tableNumber: table.tableNumber,
        status: { $in: ["New", "Preparing", "Ready"] },
      });
      if (activeOrders) {
        return res.status(409).json({
          success: false,
          message: "This table has an active order and cannot be marked available.",
        });
      }
    }

    const previousWaiterId = table.assignedWaiter;
    const previousStatus = table.status;
    table.status = status;
    if (req.body.guestCount !== undefined) {
      table.guestCount = Math.max(0, Number(req.body.guestCount) || 0);
    } else if (status === "Available") {
      table.guestCount = 0;
    }
    table.assignedWaiter = status === "Available" ? null : waiter._id;
    await table.save();

    if (status === "Reserved" && previousStatus !== "Reserved") {
      await createRestaurantNotification({ restaurantId: waiter.restaurantId, type: "table_reserved", title: "Table reserved", message: `${table.tableNumber} has been reserved.`, tableNumber: table.tableNumber });
    }

    if (previousWaiterId && String(previousWaiterId) !== String(waiter._id)) {
      await Waiter.updateOne({ _id: previousWaiterId }, { $pull: { assignedTables: table._id } });
    }
    if (status === "Available") {
      await Waiter.updateMany({ assignedTables: table._id }, { $pull: { assignedTables: table._id } });
    } else {
      await Waiter.updateOne({ _id: waiter._id }, { $addToSet: { assignedTables: table._id } });
    }
    return res.json({ success: true, table });
  } catch (error) {
    console.error("Update table status error:", error)
    return res.status(500).json({ success: false, message: "Failed to update table" });
  }
};

const updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!ORDER_STATUSES.includes(status)) return res.status(400).json({ success: false, message: "Invalid order status" });
    const waiter = await Waiter.findById(req.params.id).select("restaurantId");
    if (!waiter) return res.status(404).json({ success: false, message: "Waiter not found" });
    const restaurant = await Restaurant.findById(waiter.restaurantId).select("restaurantId");
    const restaurantIds = [String(waiter.restaurantId), restaurant?.restaurantId].filter(Boolean);
    const order = await Order.findOne({ _id: req.params.orderId, restaurantId: { $in: restaurantIds } });
    if (!order) return res.status(404).json({ success: false, message: "Order not found" });
    if (order.status !== status && !ORDER_STATUS_TRANSITIONS[order.status]?.includes(status)) {
      return res.status(409).json({
        success: false,
        message: `Order must move from ${order.status} to ${ORDER_STATUS_TRANSITIONS[order.status]?.[0] || "its final state"}.`,
      });
    }
    // Waiters can only monitor kitchen status; only Chef / Kitchen staff can start cooking ("Preparing") or mark "Ready".
    if (["Preparing", "Ready"].includes(status)) {
      return res.status(403).json({
        success: false,
        message: "Waiters cannot update kitchen preparation status. Cooking actions can only be performed by the Kitchen/Chef.",
      });
    }

    if (order.status !== status) {
      order.status = status;
      await order.save();
      const orderIdShort = String(order._id).slice(-6).toUpperCase();
      let notifType = "";
      let notifTitle = "";
      let notifMessage = "";

      if (status === "Preparing") {
        notifType = "kitchen_preparing";
        notifTitle = "👨‍🍳 Kitchen: Order Preparing";
        notifMessage = `Kitchen started preparing Order #${orderIdShort} for ${order.tableNumber}.`;
      } else if (status === "Ready") {
        notifType = "kitchen_ready";
        notifTitle = "👨‍🍳 Kitchen: Order Ready!";
        notifMessage = `Order #${orderIdShort} for ${order.tableNumber} is ready to serve!`;
      } else if (status === "Served") {
        notifType = "order_served";
        notifTitle = "🍽️ Order Served";
        notifMessage = `Order #${orderIdShort} for ${order.tableNumber} has been served.`;
      } else if (status === "Completed") {
        notifType = "order_completed";
        notifTitle = "✅ Order Completed";
        notifMessage = `Order #${orderIdShort} for ${order.tableNumber} is completed.`;
      }

      if (notifType) {
        await createRestaurantNotification({
          restaurantId: waiter.restaurantId,
          type: notifType,
          title: notifTitle,
          message: notifMessage,
          tableNumber: order.tableNumber,
          orderId: order._id,
        });
      }
    }

    // A table stays occupied only while it has an active order. Once its last
    // order is served/completed, the waiter must clean it before it becomes
    // available again.
    const activeOrders = await Order.countDocuments({
      restaurantId: { $in: restaurantIds },
      tableNumber: order.tableNumber,
      status: { $in: ["New", "Preparing", "Ready"] },
    });
    await Table.findOneAndUpdate(
      { restaurantId: waiter.restaurantId, tableNumber: order.tableNumber },
      { status: activeOrders > 0 ? "Occupied" : "Cleaning" }
    );
    return res.json({ success: true, order });
  } catch (error) {
    console.error("Update order status error:", error);
    return res.status(500).json({ success: false, message: "Failed to update order" });
  }
};

const getOrderBill = async (req, res) => {
  try {
    const result = await getWaiterOrder(req.params.id, req.params.orderId);
    if (result.error) return res.status(result.status).json({ success: false, message: result.error });
    // Older orders did not store an itemised bill. Calculate it when viewed.
    refreshBillTotals(result.order);
    return res.json({ success: true, order: result.order, paymentMethods: PAYMENT_METHODS });
  } catch (error) {
    console.error("Get order bill error:", error);
    return res.status(500).json({ success: false, message: "Failed to load bill" });
  }
};

const changeBillItemQuantity = async (req, res) => {
  try {
    const quantity = Number(req.body.quantity);
    if (!Number.isInteger(quantity) || quantity < 0) return res.status(400).json({ success: false, message: "Quantity must be a whole number." });
    const result = await getWaiterOrder(req.params.id, req.params.orderId);
    if (result.error) return res.status(result.status).json({ success: false, message: result.error });
    const { order } = result;
    if (order.payment?.status === "Paid") return res.status(409).json({ success: false, message: "A paid bill cannot be changed." });
    const itemIndex = Number(req.params.itemIndex);
    if (!Number.isInteger(itemIndex) || !order.items[itemIndex]) return res.status(404).json({ success: false, message: "Bill item not found" });
    const prevQty = order.items[itemIndex].quantity;
    const itemName = order.items[itemIndex].name;
    if (quantity === 0) order.items.splice(itemIndex, 1);
    else order.items[itemIndex].quantity = quantity;
    if (!order.items.length) return res.status(400).json({ success: false, message: "A bill must contain at least one item." });
    refreshBillTotals(order);
    await order.save();

    // If reordered / quantity increased, notify kitchen
    if (quantity > prevQty) {
      const addedQty = quantity - prevQty;
      await createRestaurantNotification({
        restaurantId: result.waiter.restaurantId,
        type: "order_updated",
        title: "Item Reordered & Sent to Kitchen",
        message: `${addedQty}x ${itemName} reordered for ${order.tableNumber} (Order #${order._id.toString().slice(-6).toUpperCase()}).`,
        tableNumber: order.tableNumber,
        orderId: order._id,
      });
    }

    return res.json({ success: true, order });
  } catch (error) {
    console.error("Change bill item error:", error);
    return res.status(500).json({ success: false, message: "Failed to update bill item" });
  }
};

const addBillItem = async (req, res) => {
  try {
    const quantity = Number(req.body.quantity || 1);
    if (!Number.isInteger(quantity) || quantity < 1) {
      return res.status(400).json({ success: false, message: "A valid quantity is required." });
    }
    const result = await getWaiterOrder(req.params.id, req.params.orderId);
    if (result.error) return res.status(result.status).json({ success: false, message: result.error });
    const { order } = result;
    if (order.payment?.status === "Paid") return res.status(409).json({ success: false, message: "A paid bill cannot be changed." });

    let itemName = req.body.name;
    let itemPrice = Number(req.body.price);
    let menuItemId = req.body.menuItemId || req.body._id;

    if (menuItemId && mongoose.isValidObjectId(menuItemId)) {
      const menuItem = await Menu.findById(menuItemId).select("name price");
      if (menuItem) {
        itemName = menuItem.name;
        itemPrice = Number(menuItem.price);
      }
    }

    if (!itemName || isNaN(itemPrice)) {
      return res.status(400).json({ success: false, message: "A valid menu item name and price are required." });
    }

    const existingItem = order.items.find(
      (item) => String(item.name || "").trim().toLowerCase() === String(itemName).trim().toLowerCase() && !(item.selectedModifiers || []).length
    );
    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      order.items.push({ menuItemId: menuItemId ? String(menuItemId) : "", name: itemName, price: itemPrice, quantity, selectedModifiers: [] });
    }
    refreshBillTotals(order);
    await order.save();

    // Trigger notification for kitchen about updated order
    await createRestaurantNotification({
      restaurantId: result.waiter.restaurantId,
      type: "order_updated",
      title: "Order Items Updated",
      message: `${quantity}x ${itemName} added to ${order.tableNumber} (Order #${order._id.toString().slice(-6).toUpperCase()}).`,
      tableNumber: order.tableNumber,
      orderId: order._id,
    });

    return res.status(201).json({ success: true, order });
  } catch (error) {
    console.error("Add bill item error:", error);
    return res.status(500).json({ success: false, message: "Failed to add bill item" });
  }
};

const applyBillDiscount = async (req, res) => {
  try {
    const { type = "percentage", value = 0 } = req.body;
    const numericValue = Number(value);
    if (!["percentage", "amount"].includes(type) || !Number.isFinite(numericValue) || numericValue < 0 || (type === "percentage" && numericValue > 100)) return res.status(400).json({ success: false, message: "Enter a valid discount." });
    const result = await getWaiterOrder(req.params.id, req.params.orderId);
    if (result.error) return res.status(result.status).json({ success: false, message: result.error });
    if (result.order.payment?.status === "Paid") return res.status(409).json({ success: false, message: "A paid bill cannot be changed." });
    result.order.discount = { type, value: numericValue, amount: 0 };
    refreshBillTotals(result.order);
    await result.order.save();
    return res.json({ success: true, order: result.order });
  } catch (error) {
    console.error("Apply bill discount error:", error);
    return res.status(500).json({ success: false, message: "Failed to apply discount" });
  }
};

const updateBillPayment = async (req, res) => {
  try {
    const { action, method, reference = "" } = req.body;
    if (!["request", "complete", "fail"].includes(action)) return res.status(400).json({ success: false, message: "Invalid payment action" });
    if (action !== "fail" && !PAYMENT_METHODS.includes(method)) return res.status(400).json({ success: false, message: "Choose Cash, UPI, or Card." });
    const result = await getWaiterOrder(req.params.id, req.params.orderId);
    if (result.error) return res.status(result.status).json({ success: false, message: result.error });
    const { order } = result;
    if (order.payment?.status === "Paid" && action !== "complete") return res.status(409).json({ success: false, message: "This bill is already paid." });
    if (action === "request") {
      order.payment = { ...order.payment?.toObject?.(), status: "Requested", method, requestedAt: new Date(), paidAt: null, reference: "" };
      await createRestaurantNotification({ restaurantId: result.waiter.restaurantId, type: "payment_request", title: "Payment requested", message: `${method} payment requested for ${order.tableNumber}.`, tableNumber: order.tableNumber, orderId: order._id });
    }
    if (action === "complete") order.payment = { ...order.payment?.toObject?.(), status: "Paid", method, paidAt: new Date(), reference: String(reference).trim() };
    if (action === "fail") order.payment = { ...order.payment?.toObject?.(), status: "Failed", paidAt: null };
    refreshBillTotals(order);
    await order.save();
    await syncTableStatus(result.waiter.restaurantId, order.tableNumber);
    return res.json({ success: true, order });
  } catch (error) {
    console.error("Update bill payment error:", error);
    return res.status(500).json({ success: false, message: "Failed to update payment" });
  }
};

const getWaiterNotifications = async (req, res) => {
  try {
    const waiter = await Waiter.findById(req.params.id).select("restaurantId");
    if (!waiter) return res.status(404).json({ success: false, message: "Waiter not found" });
    const notifications = await Notification.find({ restaurantId: waiter.restaurantId })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();
    const waiterId = String(waiter._id);
    const data = notifications.map((notification) => ({ ...notification, isRead: (notification.readBy || []).some((id) => String(id) === waiterId) }));
    return res.json({ success: true, notifications: data, unreadCount: data.filter((notification) => !notification.isRead).length });
  } catch (error) {
    console.error("Get waiter notifications error:", error);
    return res.status(500).json({ success: false, message: "Failed to load notifications" });
  }
};

const markWaiterNotificationsRead = async (req, res) => {
  try {
    const waiter = await Waiter.findById(req.params.id).select("restaurantId");
    if (!waiter) return res.status(404).json({ success: false, message: "Waiter not found" });
    const filter = { restaurantId: waiter.restaurantId };
    if (req.params.notificationId !== "all") filter._id = req.params.notificationId;
    await Notification.updateMany(filter, { $addToSet: { readBy: waiter._id } });
    return res.json({ success: true });
  } catch (error) {
    console.error("Mark notifications read error:", error);
    return res.status(500).json({ success: false, message: "Failed to update notifications" });
  }
};

module.exports = {
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
};
