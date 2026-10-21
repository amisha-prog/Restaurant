const Order = require("../models/Order");
const mongoose = require("mongoose");
const Restaurant = require("../models/Restaurant");
const Table = require("../models/Table");
const Reservation = require("../models/Reservation");
const { createRestaurantNotification } = require("./notificationController");
const syncTableStatus = require("../utils/syncTableStatus");


const createOrder = async (req, res) => {
  try {
    const { restaurantId, tableNumber, customerName, customerPhone, items, source = "QR" } = req.body;
    if (!restaurantId || !tableNumber || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: "Restaurant, table and at least one cart item are required." });
    }

    const cleanedItems = items.map((item) => ({
      menuItemId: String(item._id || ""),
      name: String(item.name || "Food item"),
      price: Math.max(0, Number(item.price) || 0),
      quantity: Math.max(1, Number(item.quantity) || 1),
      selectedModifiers: Array.isArray(item.selectedModifiers) ? item.selectedModifiers.map((modifier) => ({ name: String(modifier.name || ""), priceAdjustment: Math.max(0, Number(modifier.priceAdjustment) || 0) })) : [],
    }));
    const total = cleanedItems.reduce((sum, item) => {
      const modifiersTotal = item.selectedModifiers.reduce((modifierSum, modifier) => modifierSum + modifier.priceAdjustment, 0);
      return sum + (item.price + modifiersTotal) * item.quantity;
    }, 0);
    const taxRate = 5;
    const taxAmount = Number((total * taxRate / 100).toFixed(2));
    const validSources = ["Admin", "Waiter", "Manager", "Manual", "QR"];
    const finalSource = validSources.includes(source) ? source : "QR";

    // Block creating manual/admin/waiter orders on unavailable tables (Cleaning or Out of Service)
    const restQuery = [{ restaurantId: String(restaurantId) }];
    if (mongoose.isValidObjectId(restaurantId)) restQuery.unshift({ _id: restaurantId });
    const foundRest = await Restaurant.findOne({ $or: restQuery }).select("_id restaurantId");
    const matchedRestIds = [String(restaurantId)];
    if (foundRest?._id) matchedRestIds.push(String(foundRest._id));
    if (foundRest?.restaurantId) matchedRestIds.push(String(foundRest.restaurantId));
    const targetRestId = foundRest?._id || restaurantId;

    const normTable = String(tableNumber).trim();
    const cleanT = normTable.replace(/^Table\s*/i, "").replace(/^0+/, "");
    const tableRegex = new RegExp(`^(Table\\s*0*${cleanT}|0*${cleanT}|${normTable.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')})$`, "i");

    if (finalSource !== "QR") {
      const existingTable = await Table.findOne({
        restaurantId: targetRestId,
        tableNumber: { $regex: tableRegex },
      });

      if (existingTable && ["Cleaning", "Out of Service"].includes(existingTable.status)) {
        return res.status(400).json({
          message: `${existingTable.tableNumber || tableNumber} is currently ${existingTable.status}. Orders cannot be placed on this table.`
        });
      }
    }

    // CHECK IF TABLE ALREADY HAS AN ACTIVE RUNNING ORDER (RE-ORDER CASE)
    // If the table already has an active order (not yet paid/completed),
    // merge reordered items directly into that existing order so it appears in ONE display/ticket.
    const existingActiveOrder = await Order.findOne({
      restaurantId: { $in: matchedRestIds },
      tableNumber: { $regex: tableRegex },
      status: { $in: ["New", "Preparing", "Ready", "Served"] },
      "payment.status": { $ne: "Paid" },
    }).sort({ createdAt: -1 });

    if (existingActiveOrder) {
      // Merge incoming items into existing order
      for (const newItem of cleanedItems) {
        const matchIndex = existingActiveOrder.items.findIndex((exItem) => {
          const nameMatch = String(exItem.name || "").trim().toLowerCase() === String(newItem.name || "").trim().toLowerCase();
          const exMods = exItem.selectedModifiers || [];
          const newMods = newItem.selectedModifiers || [];
          const modsMatch = exMods.length === newMods.length &&
            exMods.every((m, idx) => m.name === newMods[idx]?.name);
          return nameMatch && modsMatch;
        });

        if (matchIndex !== -1) {
          existingActiveOrder.items[matchIndex].quantity += newItem.quantity;
        } else {
          existingActiveOrder.items.push(newItem);
        }
      }

      // Recalculate totals
      const updatedSubtotal = existingActiveOrder.items.reduce((sum, item) => {
        const modifiersTotal = (item.selectedModifiers || []).reduce(
          (mSum, modifier) => mSum + (Number(modifier.priceAdjustment) || 0),
          0
        );
        return sum + ((Number(item.price) || 0) + modifiersTotal) * (Number(item.quantity) || 1);
      }, 0);

      const activeTaxRate = existingActiveOrder.taxRate || taxRate || 5;
      const updatedTaxAmount = Number(((updatedSubtotal * activeTaxRate) / 100).toFixed(2));
      const updatedTotal = Number((updatedSubtotal + updatedTaxAmount).toFixed(2));

      existingActiveOrder.subtotal = updatedSubtotal;
      existingActiveOrder.taxAmount = updatedTaxAmount;
      existingActiveOrder.total = updatedTotal;

      if (customerName && customerName.trim() && (!existingActiveOrder.customerName || ["Customer", "Walk-in Customer"].includes(existingActiveOrder.customerName))) {
        existingActiveOrder.customerName = customerName.trim();
      }
      if (customerPhone && customerPhone.trim() && !existingActiveOrder.customerPhone) {
        existingActiveOrder.customerPhone = customerPhone.trim();
      }

      // If order was already Ready or Served, put it back to Preparing so the kitchen prepares the new items
      if (["Ready", "Served"].includes(existingActiveOrder.status)) {
        existingActiveOrder.status = "Preparing";
      }

      // Record accurate actor if placed by Manager, Waiter, or Admin
      if (finalSource && ["Manager", "Waiter", "Admin"].includes(finalSource)) {
        existingActiveOrder.source = finalSource;
      }

      existingActiveOrder.updatedAt = new Date();
      await existingActiveOrder.save();
      await syncTableStatus(restaurantId, existingActiveOrder.tableNumber);

      const reorderedSummary = cleanedItems.map((it) => `${it.quantity}x ${it.name}`).join(", ");
      const totalItemCount = existingActiveOrder.items.reduce((sum, item) => sum + item.quantity, 0);
      const reorderActor = finalSource === "Manager" ? "Manager" : finalSource === "Admin" ? "Admin" : finalSource === "Waiter" ? "Waiter" : "Customer";

      const notifMsg = `🍳 Reorder for ${existingActiveOrder.tableNumber}: ${reorderedSummary} added to Order #${existingActiveOrder._id.toString().slice(-6).toUpperCase()} (${totalItemCount} total items, ₹${existingActiveOrder.total}) by ${reorderActor}.`;

      await createRestaurantNotification({
        restaurantId,
        type: "order_updated",
        title: `🍳 Reorder Added by ${reorderActor} for ${existingActiveOrder.tableNumber}`,
        message: notifMsg,
        tableNumber: existingActiveOrder.tableNumber,
        orderId: existingActiveOrder._id,
      });

      return res.status(200).json({
        message: `Reordered items added to Table ${existingActiveOrder.tableNumber} successfully.`,
        order: existingActiveOrder,
        isReorder: true,
      });
    }

    // Otherwise create brand new order
    const order = await Order.create({
      restaurantId,
      tableNumber,
      customerName,
      customerPhone,
      source: finalSource,
      items: cleanedItems,
      subtotal: total,
      taxRate,
      taxAmount,
      total: Number((total + taxAmount).toFixed(2)),
    });

    const restaurantQuery = { restaurantId };
    if (mongoose.Types.ObjectId.isValid(restaurantId)) restaurantQuery.$or = [{ restaurantId }, { _id: restaurantId }];
    const restaurant = await Restaurant.findOne(restaurantQuery).select("_id");
    await syncTableStatus(restaurantId, tableNumber);
    const totalItemCount = cleanedItems.reduce((sum, item) => sum + item.quantity, 0);
    const notifType =
      finalSource === "Admin"
        ? "admin_order"
        : finalSource === "Manager"
        ? "manager_order"
        : finalSource === "QR"
        ? "qr_order"
        : "manual_order";

    const notifTitle =
      finalSource === "Admin"
        ? "🛡️ New Admin Order"
        : finalSource === "Manager"
        ? "👔 New Manager Order"
        : finalSource === "QR"
        ? "📱 New User QR Order"
        : "📝 New Waiter Order";

    const notifMsg =
      finalSource === "Admin"
        ? `Admin order placed for ${tableNumber} (${totalItemCount} items, Total: ₹${order.total}).`
        : finalSource === "Manager"
        ? `Manager order placed for ${tableNumber} (${totalItemCount} items, Total: ₹${order.total}).`
        : finalSource === "QR"
        ? `Customer at ${tableNumber} placed a new order (${totalItemCount} items, Total: ₹${order.total}).`
        : `Waiter order placed for ${tableNumber} (${totalItemCount} items, Total: ₹${order.total}).`;

    await createRestaurantNotification({
      restaurantId,
      type: notifType,
      title: notifTitle,
      message: notifMsg,
      tableNumber,
      orderId: order._id,
    });
    return res.status(201).json({ message: "Order placed successfully.", order });
  } catch (error) {
    console.error("Create order error:", error);
    return res.status(500).json({ message: "Unable to place order." });
  }
};

// =====================================================
// GET ALL ORDERS (Supports restaurantId & status filters)
// =====================================================
const getOrders = async (req, res) => {
  try {
    const { restaurantId, status } = req.query;
    const query = {};

    if (restaurantId) {
      let rest = null;
      if (mongoose.isValidObjectId(restaurantId)) {
        rest = await Restaurant.findById(restaurantId).select("_id restaurantId");
      }
      if (!rest) {
        rest = await Restaurant.findOne({ restaurantId: restaurantId.toUpperCase() }).select("_id restaurantId");
      }
      if (rest) {
        query.restaurantId = { $in: [String(rest._id), rest.restaurantId] };
      } else {
        query.restaurantId = restaurantId;
      }
    }

    if (status && status !== "All") {
      query.status = status;
    }

    if (req.query.tableNumber) {
      const tNorm = String(req.query.tableNumber).trim();
      query.tableNumber = { $regex: new RegExp(`^${tNorm.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')}$`, "i") };
    }

    const orders = await Order.find(query).sort({ createdAt: -1 }).limit(200);
    return res.status(200).json({ success: true, count: orders.length, orders });
  } catch (error) {
    console.error("Get Orders Error:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch orders." });
  }
};

// =====================================================
// GET DASHBOARD SUMMARY (Orders, Customers, Revenue, Tables)
// =====================================================
const getDashboardSummary = async (req, res) => {
  try {
    const { restaurantId } = req.query;
    let orderQuery = {};
    let tableQuery = {};
    let resQuery = {};
    let targetRestaurant = null;

    if (restaurantId && String(restaurantId).trim()) {
      const rId = String(restaurantId).trim();
      if (mongoose.isValidObjectId(rId)) {
        targetRestaurant = await Restaurant.findById(rId).select("-password");
      }
      if (!targetRestaurant) {
        targetRestaurant = await Restaurant.findOne({
          $or: [
            { restaurantId: rId.toUpperCase() },
            { restaurantId: rId },
            { email: rId.toLowerCase() },
          ],
        }).select("-password");
      }

      if (targetRestaurant) {
        const stringIds = [String(targetRestaurant._id), targetRestaurant.restaurantId, targetRestaurant.email].filter(Boolean);
        orderQuery = { restaurantId: { $in: stringIds } };
        tableQuery = { restaurantId: targetRestaurant._id };
        resQuery = { restaurantId: targetRestaurant._id };
      } else if (mongoose.isValidObjectId(rId)) {
        orderQuery = { restaurantId: rId };
        tableQuery = { restaurantId: new mongoose.Types.ObjectId(rId) };
        resQuery = { restaurantId: new mongoose.Types.ObjectId(rId) };
      } else {
        // Unknown restaurant identifier -> return empty datasets
        const dummyId = new mongoose.Types.ObjectId();
        orderQuery = { _id: dummyId };
        tableQuery = { _id: dummyId };
        resQuery = { _id: dummyId };
      }
    } else {
      // Unscoped request -> return empty dataset so new admins don't see global orders
      const dummyId = new mongoose.Types.ObjectId();
      orderQuery = { _id: dummyId };
      tableQuery = { _id: dummyId };
      resQuery = { _id: dummyId };
    }

    const [orders, tables, activeReservationsCount] = await Promise.all([
      Order.find(orderQuery).sort({ createdAt: -1 }),
      Table.find(tableQuery).sort({ tableNumber: 1 }),
      Reservation.countDocuments({
        ...resQuery,
        status: { $in: ["Confirmed", "Seated"] },
      }),
    ]);

    // Aggregate unique customers from orders
    const customerMap = {};
    orders.forEach((o) => {
      const phone = (o.customerPhone || "").trim();
      const name = (o.customerName || "").trim();
      const key = phone || name || String(o._id);

      if (!customerMap[key]) {
        customerMap[key] = {
          id: key,
          name: name || "Walk-in Guest",
          phone: phone || "—",
          orders: 0,
          totalSpend: 0,
          lastOrderDate: o.createdAt,
          lastOrderTable: o.tableNumber || "Table",
          lastStatus: o.status,
        };
      }
      customerMap[key].orders += 1;
      customerMap[key].totalSpend += Number(o.total || 0);
      if (new Date(o.createdAt) > new Date(customerMap[key].lastOrderDate)) {
        customerMap[key].lastOrderDate = o.createdAt;
        customerMap[key].lastOrderTable = o.tableNumber || "Table";
        customerMap[key].lastStatus = o.status;
      }
    });

    const customers = Object.values(customerMap).sort((a, b) => b.totalSpend - a.totalSpend);
    const totalRevenue = orders.reduce((sum, o) => sum + Number(o.total || 0), 0);
    const activeOrders = orders.filter((o) => ["New", "Preparing", "Ready"].includes(o.status)).length;
    const readyOrders = orders.filter((o) => o.status === "Ready").length;
    const completedOrders = orders.filter((o) => o.status === "Completed").length;

    const availableTables = tables.filter((t) => t.status === "Available").length;
    const occupiedTables = tables.filter((t) => t.status === "Occupied").length;
    const reservedTables = tables.filter((t) => t.status === "Reserved").length;
    const cleaningTables = tables.filter((t) => t.status === "Cleaning").length;
    const outOfServiceTables = tables.filter((t) => t.status === "Out of Service").length;

    return res.status(200).json({
      success: true,
      stats: {
        totalOrders: orders.length,
        totalCustomers: customers.length,
        totalRevenue,
        totalTables: tables.length,
        activeOrders,
        readyOrders,
        completedOrders,
        reservations: activeReservationsCount,
      },
      tableStats: {
        available: availableTables,
        occupied: occupiedTables,
        reserved: reservedTables,
        cleaning: cleaningTables,
        outOfService: outOfServiceTables,
        total: tables.length,
      },
      recentOrders: orders.slice(0, 10),
      orders,
      customers,
      tables,
      restaurant: targetRestaurant,
    });
  } catch (error) {
    console.error("Dashboard Summary Error:", error);
    return res.status(500).json({ success: false, message: error.message || "Failed to load dashboard summary." });
  }
};

// =====================================================
// UPDATE ORDER STATUS
// =====================================================
const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found." });
    }

    if (status && status !== order.status) {
      const oldStatus = order.status;
      order.status = status;
      if (status === "Completed") {
        if (!order.payment) order.payment = {};
        order.payment.status = "Paid";
        order.payment.paidAt = new Date();
      }
      await order.save();
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
    }

    return res.status(200).json({
      success: true,
      message: `Order status updated to ${order.status}`,
      order,
    });
  } catch (error) {
    console.error("Update Order Status Error:", error);
    return res.status(500).json({ success: false, message: "Failed to update order status." });
  }
};

// =====================================================
// UPDATE TABLE STATUS
// =====================================================
const updateTableStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ["Available", "Occupied", "Reserved", "Cleaning", "Out of Service"];
    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: "Invalid table status." });
    }

    const table = await Table.findByIdAndUpdate(
      id,
      { ...(status ? { status } : {}) },
      { new: true }
    );

    if (!table) {
      return res.status(404).json({ success: false, message: "Table not found." });
    }

    // If status is updated away from Occupied (e.g. Available, Cleaning),
    // settle / complete any active dining orders on this table so floor stays fresh
    if (status && status !== "Occupied") {
      const restObj = await Restaurant.findById(table.restaurantId);
      const restIdentifiers = [String(table.restaurantId), restObj?.restaurantId].filter(Boolean);

      await Order.updateMany(
        {
          restaurantId: { $in: restIdentifiers },
          tableNumber: { $regex: new RegExp(`^${table.tableNumber.trim()}$`, "i") },
          status: { $in: ["New", "Preparing", "Ready", "Served"] },
        },
        {
          $set: {
            status: "Completed",
            "payment.status": "Paid",
          },
        }
      );
    }

    return res.status(200).json({
      success: true,
      message: `Table status updated to ${table.status}`,
      table,
    });
  } catch (error) {
    console.error("Update Table Status Error:", error);
    return res.status(500).json({ success: false, message: "Failed to update table status." });
  }
};

module.exports = {
  createOrder,
  getOrders,
  getDashboardSummary,
  updateOrderStatus,
  updateTableStatus,
};

