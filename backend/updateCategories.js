const mongoose = require("mongoose");
const dotenv = require("dotenv");
const Menu = require("./models/Menu");

dotenv.config();

async function updateMenuCategories() {
  try {
    console.log("Connecting to database...");
    await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 5000 });
    console.log("Connected.");

    const result = await Menu.updateMany(
      { category: "Non-Veg Main Course" },
      { $set: { category: "Main Course", type: "Non-Veg" } }
    );

    console.log(`Updated ${result.modifiedCount} items from 'Non-Veg Main Course' to 'Main Course' with type 'Non-Veg'.`);

    // Verify all items under Main Course and Non-Veg
    const nonVegMainCourseCount = await Menu.countDocuments({ category: "Non-Veg Main Course" });
    const mainCourseNonVeg = await Menu.countDocuments({ category: "Main Course", type: "Non-Veg" });
    const mainCourseVeg = await Menu.countDocuments({ category: "Main Course", type: "Veg" });

    console.log(`Remaining 'Non-Veg Main Course': ${nonVegMainCourseCount}`);
    console.log(`Total 'Main Course' (Non-Veg): ${mainCourseNonVeg}`);
    console.log(`Total 'Main Course' (Veg): ${mainCourseVeg}`);

    await mongoose.disconnect();
    console.log("Database disconnected successfully.");
  } catch (error) {
    console.error("Migration error:", error);
    process.exit(1);
  }
}

updateMenuCategories();
