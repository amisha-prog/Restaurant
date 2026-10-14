const mongoose = require("mongoose");
const Restaurant = require("../models/Restaurant");
const Table = require("../models/Table");
const Order = require("../models/Order");

const syncTableStatus = async (restaurantIdInput, tableNumberInput) => {
  if (!restaurantIdInput || !tableNumberInput) return;
  try {
    let rest = null;
    if (mongoose.isValidObjectId(restaurantIdInput)) {
      rest = await Restaurant.findById(restaurantIdInput);
    }
    if (!rest) {
      rest = await Restaurant.findOne({
        $or: [
          { restaurantId: String(restaurantIdInput).toUpperCase() },
          { restaurantId: String(restaurantIdInput) },
          { email: String(restaurantIdInput).toLowerCase() },
        ],
      });
    }

    const cleanNumStr = String(tableNumberInput).replace(/^table\s*/i, "").trim();
    const padNum = `Table ${cleanNumStr.padStart(2, "0")}`;
    const rawNum = `Table ${cleanNumStr}`;
    const tableNumVariants = Array.from(new Set([tableNumberInput, padNum, rawNum, cleanNumStr]));

    // Query active orders (New, Preparing, Ready) for this table
    const orderQuery = {
      tableNumber: { $in: tableNumVariants },
      status: { $in: ["New", "Preparing", "Ready"] },
    };

    if (rest) {
      orderQuery.$or = [
        { restaurantId: rest._id },
        { restaurantId: rest.restaurantId },
        { restaurantId: String(rest._id) },
      ];
    } else if (mongoose.isValidObjectId(restaurantIdInput)) {
      orderQuery.restaurantId = restaurantIdInput;
    } else {
      orderQuery.restaurantId = String(restaurantIdInput);
    }

    const activeCount = await Order.countDocuments(orderQuery);
    const targetStatus = activeCount > 0 ? "Occupied" : "Cleaning";

    // Query Table
    const tableFilter = {
      tableNumber: { $in: tableNumVariants },
    };
    if (rest) {
      tableFilter.restaurantId = rest._id;
    } else if (mongoose.isValidObjectId(restaurantIdInput)) {
      tableFilter.restaurantId = restaurantIdInput;
    }

    await Table.updateMany(tableFilter, { status: targetStatus });
  } catch (err) {
    console.error("syncTableStatus error:", err);
  }
};

module.exports = syncTableStatus;
