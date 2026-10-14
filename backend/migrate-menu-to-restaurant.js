/**
 * migrate-menu-to-restaurant.js
 *
 * One-time migration: assigns all menu items that have no restaurantId
 * to the FIRST restaurant found (Addymize / REST022 by default).
 *
 * Usage:
 *   node migrate-menu-to-restaurant.js REST022
 */

const mongoose = require("mongoose");
const Restaurant = require("./models/Restaurant");
const Menu = require("./models/Menu");

require("dotenv").config();

const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/restaurant2";
const targetRestCode = process.argv[2] || "REST022";

async function migrate() {
  await mongoose.connect(MONGO_URI);
  console.log("✅ Connected to MongoDB");

  const restaurant = await Restaurant.findOne({ restaurantId: targetRestCode.toUpperCase() });
  if (!restaurant) {
    console.error(`❌ Restaurant "${targetRestCode}" not found.`);
    process.exit(1);
  }

  console.log(`🔍 Migrating menu items to: ${restaurant.restaurantName} (${restaurant.restaurantId}) — _id: ${restaurant._id}`);

  // Assign all unowned (null restaurantId) menu items to this restaurant
  const result = await Menu.updateMany(
    { $or: [{ restaurantId: null }, { restaurantId: { $exists: false } }] },
    { $set: { restaurantId: restaurant._id } }
  );

  console.log(`\n🍔 Menu items migrated: ${result.modifiedCount}`);
  console.log(`✅ Done! All existing menu items now belong to "${restaurant.restaurantName}".`);
  console.log(`   New restaurants will see an empty menu going forward.\n`);

  await mongoose.disconnect();
  process.exit(0);
}

migrate().catch((err) => {
  console.error("💥 Error:", err.message);
  process.exit(1);
});
