/**
 * cleanup-restaurant-data.js
 * 
 * Run this script to delete ALL operational data (tables, orders, reservations)
 * for a specific restaurant (Addymize / REST022 by default).
 * 
 * Usage:
 *   node cleanup-restaurant-data.js
 *   node cleanup-restaurant-data.js REST022
 */

const mongoose = require("mongoose");
const Restaurant = require("./models/Restaurant");
const Table = require("./models/Table");
const Order = require("./models/Order");
const Reservation = require("./models/Reservation");
const Menu = require("./models/Menu");

require("dotenv").config();

const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/restaurant2";

const targetRestCode = process.argv[2] || "REST022"; // default: Addymize

async function cleanup() {
  await mongoose.connect(MONGO_URI);
  console.log("✅ Connected to MongoDB:", MONGO_URI);

  // Find the restaurant
  const restaurant = await Restaurant.findOne({ restaurantId: targetRestCode.toUpperCase() });
  if (!restaurant) {
    console.error(`❌ Restaurant with code "${targetRestCode}" not found.`);
    process.exit(1);
  }

  const restId = restaurant._id;
  console.log(`\n🔍 Found: ${restaurant.restaurantName} (${restaurant.restaurantId}) — _id: ${restId}`);
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

  // 1. Delete Tables
  const tables = await Table.deleteMany({ restaurantId: restId });
  console.log(`🪑  Tables deleted:       ${tables.deletedCount}`);

  // 2. Delete Orders
  const orders = await Order.deleteMany({ restaurantId: restId });
  console.log(`📦  Orders deleted:       ${orders.deletedCount}`);

  // 3. Delete Reservations
  const reservations = await Reservation.deleteMany({ restaurantId: restId });
  console.log(`📅  Reservations deleted: ${reservations.deletedCount}`);

  // 4. Delete Menu items scoped to this restaurant
  const menuItems = await Menu.deleteMany({ restaurantId: restId });
  console.log(`🍔  Menu items deleted:   ${menuItems.deletedCount}`);

  console.log(`\n✅ All operational data for "${restaurant.restaurantName}" has been cleaned up!`);
  console.log("   The restaurant account itself and staff accounts are preserved.\n");

  await mongoose.disconnect();
  process.exit(0);
}

cleanup().catch((err) => {
  console.error("💥 Error during cleanup:", err.message);
  process.exit(1);
});
