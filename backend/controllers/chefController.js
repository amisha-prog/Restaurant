const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");
const Chef = require("../models/Chef");
const Restaurant = require("../models/Restaurant");
const Order = require("../models/Order");
const Menu = require("../models/Menu");
const syncTableStatus = require("../utils/syncTableStatus");
const { createRestaurantNotification } = require("./notificationController");

// =====================================================
// CREATE CHEF
// =====================================================
const createChef = async (req, res) => {
  try {
    const {
      restaurantId,
      name,
      email,
      phone,
      password,
      speciality,
      shift,
      experience,
    } = req.body;

    if (!restaurantId || !name || !password) {
      return res.status(400).json({
        success: false,
        message: "Restaurant ID, chef name, and password are required.",
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
      const existingChef = await Chef.findOne({ email: normalizedEmail });
      if (existingChef) {
        return res.status(400).json({
          success: false,
          message: "A chef with this email address already exists.",
        });
      }
    }

    // Generate auto-increment CHEF ID: CHEF001, CHEF002...
    const lastChef = await Chef.findOne().sort({ createdAt: -1 }).select("chefId");
    let nextNum = 1;
    if (lastChef && lastChef.chefId) {
      const parsed = parseInt(lastChef.chefId.replace("CHEF", ""), 10);
      if (!isNaN(parsed)) {
        nextNum = parsed + 1;
      }
    }
    const chefId = `CHEF${String(nextNum).padStart(3, "0")}`;

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    const chef = await Chef.create({
      restaurantId: targetRestaurant._id,
      chefId,
      name: name.trim(),
      email: email ? email.trim().toLowerCase() : "",
      phone: phone ? phone.trim() : "",
      password: hashedPassword,
      speciality: speciality ? speciality.trim() : "Head Chef",
      shift: shift || "Full Day",
      experience: experience ? experience.trim() : "",
      status: "Active",
    });

    return res.status(201).json({
      success: true,
      message: "Chef account created successfully.",
      chef: {
        id: chef._id,
        _id: chef._id,
        chefId: chef.chefId,
        name: chef.name,
        email: chef.email,
        phone: chef.phone,
        speciality: chef.speciality,
        shift: chef.shift,
        status: chef.status,
        restaurantId: targetRestaurant._id,
        restaurantName: targetRestaurant.restaurantName,
        restaurantCode: targetRestaurant.restaurantId,
      },
    });
  } catch (error) {
    console.error("Create Chef Error:", error);
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Chef ID or email already exists.",
      });
    }
    return res.status(500).json({
      success: false,
      message: "Server error while creating chef account.",
    });
  }
};

// =====================================================
// GET ALL CHEFS
// =====================================================
const getChefs = async (req, res) => {
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
    const chefs = await Chef.find(query)
      .select("-password")
      .populate("restaurantId", "restaurantName restaurantId city")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      chefs,
    });
  } catch (error) {
    console.error("Get Chefs Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve chefs.",
    });
  }
};

// =====================================================
// GET CHEF BY ID
// =====================================================
const getChefById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ success: false, message: "Invalid chef ID." });
    }

    const chef = await Chef.findById(id)
      .select("-password")
      .populate("restaurantId", "restaurantName restaurantId city address phone");

    if (!chef) {
      return res.status(404).json({ success: false, message: "Chef not found." });
    }

    return res.status(200).json({
      success: true,
      chef,
    });
  } catch (error) {
    console.error("Get Chef By ID Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve chef details.",
    });
  }
};

// =====================================================
// GET CHEF DASHBOARD (KDS + Orders + Menu Stock)
// =====================================================
const getChefDashboard = async (req, res) => {
  try {
    const { id } = req.params;
    let chef = null;

    if (mongoose.isValidObjectId(id)) {
      chef = await Chef.findById(id).select("-password").populate("restaurantId");
    } else {
      chef = await Chef.findOne({ chefId: String(id).toUpperCase() })
        .select("-password")
        .populate("restaurantId");
    }

    if (!chef) {
      return res.status(404).json({
        success: false,
        message: "Chef account not found.",
      });
    }

    const restaurant = chef.restaurantId;
    const restIdList = [
      String(restaurant?._id || ""),
      restaurant?.restaurantId || "",
    ].filter(Boolean);

    // Orders for today and active orders
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [orders, menuItems] = await Promise.all([
      Order.find({
        restaurantId: { $in: restIdList },
      })
        .sort({ createdAt: -1 })
        .limit(100),
      Menu.find().sort({ category: 1, name: 1 }),
    ]);

    const newOrders = orders.filter((o) => o.status === "New");
    const preparingOrders = orders.filter((o) => o.status === "Preparing");
    const readyOrders = orders.filter((o) => o.status === "Ready");
    const completedOrders = orders.filter((o) =>
      ["Served", "Completed"].includes(o.status)
    );

    return res.status(200).json({
      success: true,
      chef: {
        id: chef._id,
        _id: chef._id,
        chefId: chef.chefId,
        name: chef.name,
        email: chef.email,
        phone: chef.phone,
        speciality: chef.speciality,
        shift: chef.shift,
        status: chef.status,
      },
      restaurant: {
        id: restaurant?._id,
        restaurantName: restaurant?.restaurantName || "Restaurant",
        restaurantId: restaurant?.restaurantId || "",
        city: restaurant?.city || "",
      },
      stats: {
        newOrdersCount: newOrders.length,
        preparingOrdersCount: preparingOrders.length,
        readyOrdersCount: readyOrders.length,
        completedTodayCount: completedOrders.length,
        totalActiveOrders: newOrders.length + preparingOrders.length + readyOrders.length,
        totalMenuItems: menuItems.length,
        outOfStockCount: menuItems.filter(
          (m) => m.inStock === false || m.status?.toLowerCase() === "unavailable"
        ).length,
      },
      newOrders,
      preparingOrders,
      readyOrders,
      completedOrders,
      orders,
      menuItems,
    });
  } catch (error) {
    console.error("Chef Dashboard Error:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to load chef dashboard data.",
    });
  }
};

// =====================================================
// UPDATE ORDER STATUS (Chef Action: Preparing -> Ready -> Served)
// =====================================================
const updateChefOrderStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;

    const validStatuses = ["New", "Preparing", "Ready", "Served", "Completed"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status value provided.",
      });
    }

    const order = await Order.findByIdAndUpdate(
      orderId,
      { status },
      { new: true }
    );

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found.",
      });
    }

    await syncTableStatus(order.restaurantId, order.tableNumber);

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
        restaurantId: order.restaurantId,
        type: notifType,
        title: notifTitle,
        message: notifMessage,
        tableNumber: order.tableNumber,
        orderId: order._id,
      });
    }

    return res.status(200).json({
      success: true,
      message: `Order status updated to ${status}`,
      order,
    });
  } catch (error) {
    console.error("Update Chef Order Status Error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while updating order status.",
    });
  }
};

// =====================================================
// TOGGLE MENU ITEM AVAILABILITY (Kitchen 86 Board)
// =====================================================
const toggleMenuItemStock = async (req, res) => {
  try {
    const { itemId } = req.params;
    const item = await Menu.findById(itemId);

    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Menu item not found.",
      });
    }

    const newInStock = item.inStock === false ? true : false;
    item.inStock = newInStock;
    item.status = newInStock ? "Available" : "Unavailable";
    await item.save();

    if (item.restaurantId) {
      await createRestaurantNotification({
        restaurantId: item.restaurantId,
        type: "kitchen_stock",
        title: "⚠️ Kitchen Stock Update",
        message: `Kitchen marked "${item.name}" as ${item.status}.`,
        tableNumber: "",
      });
    }

    return res.status(200).json({
      success: true,
      message: `"${item.name}" is now ${item.status}`,
      item,
    });
  } catch (error) {
    console.error("Toggle Menu Item Stock Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update item availability.",
    });
  }
};

// =====================================================
// UPDATE / TOGGLE CHEF STATUS
// =====================================================
const updateChefStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body || {};

    const chef = await Chef.findById(id);
    if (!chef) {
      return res.status(404).json({ success: false, message: "Chef not found." });
    }

    const nextStatus = status || (chef.status === "Active" ? "Inactive" : "Active");
    chef.status = nextStatus;
    await chef.save();

    return res.status(200).json({
      success: true,
      message: `Chef status updated to ${nextStatus}`,
      status: nextStatus,
      chef,
    });
  } catch (error) {
    console.error("Update Chef Status Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update chef status.",
    });
  }
};

module.exports = {
  createChef,
  getChefs,
  getChefById,
  getChefDashboard,
  updateChefOrderStatus,
  toggleMenuItemStock,
  updateChefStatus,
};
