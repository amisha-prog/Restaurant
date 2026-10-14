const mongoose = require("mongoose");
const Restaurant = require("./models/Restaurant");
const Menu = require("./models/Menu");

require("dotenv").config();

const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/restaurant2";

async function fixMenuAssignment() {
  await mongoose.connect(MONGO_URI);
  console.log("✅ Connected to MongoDB");

  const restaurants = await Restaurant.find();
  console.log("\n📋 All Restaurants in DB:");
  restaurants.forEach(r => {
    console.log(`- ${r.restaurantName} | Code: ${r.restaurantId} | ID: ${r._id}`);
  });

  // Find Alok restaurant
  const alok = restaurants.find(r => 
    r.restaurantName.toLowerCase().includes("alok") || 
    r.ownerName.toLowerCase().includes("alok")
  );

  // Find Addymize restaurant
  const addymize = restaurants.find(r => 
    r.restaurantName.toLowerCase().includes("addymize")
  );

  if (!alok) {
    console.error("❌ Restaurant 'Alok' not found!");
    process.exit(1);
  }

  console.log(`\n🎯 Found Alok: ${alok.restaurantName} (${alok.restaurantId}) — _id: ${alok._id}`);

  if (addymize) {
    console.log(`🎯 Found Addymize: ${addymize.restaurantName} (${addymize.restaurantId}) — _id: ${addymize._id}`);
    
    // Transfer menu items from Addymize to Alok
    const transferResult = await Menu.updateMany(
      { restaurantId: addymize._id },
      { $set: { restaurantId: alok._id } }
    );
    console.log(`🔄 Transferred ${transferResult.modifiedCount} items from Addymize to Alok.`);
  }

  // Also transfer any unassigned menu items to Alok
  const unassignedResult = await Menu.updateMany(
    { $or: [{ restaurantId: null }, { restaurantId: { $exists: false } }] },
    { $set: { restaurantId: alok._id } }
  );
  console.log(`🔄 Assigned ${unassignedResult.modifiedCount} unassigned items to Alok.`);

  const alokItemsCount = await Menu.countDocuments({ restaurantId: alok._id });
  const addymizeItemsCount = addymize ? await Menu.countDocuments({ restaurantId: addymize._id }) : 0;

  console.log(`\n📊 Final Counts:`);
  console.log(`- ${alok.restaurantName}: ${alokItemsCount} menu items`);
  if (addymize) {
    console.log(`- ${addymize.restaurantName}: ${addymizeItemsCount} menu items (Fresh Empty Menu)`);
  }

  await mongoose.disconnect();
  process.exit(0);
}

fixMenuAssignment().catch(err => {
  console.error("💥 Error:", err.message);
  process.exit(1);
});
