const mongoose = require("mongoose");
const dotenv = require("dotenv");
const Menu = require("./models/Menu");
const seedMenuItems = require("./seedMenu");

dotenv.config();

const options = (name, values) => ({
  name,
  options: values.map(([optionName, price = 0]) => ({ name: optionName, price })),
});

// Used only for existing menu records that are not present in seedMenu.js.
// Each result is saved on the individual item, never shown as a global modifier.
const getDefaultCustomization = (item) => {
  switch (item.category) {
    case "Pizza":
      return [options("Size", [["Regular", 0], ["Medium", 80], ["Large", 150]]), options("Crust", [["Classic", 0], ["Cheese Burst", 70]]), options("Extra Cheese", [["Regular", 0], ["Extra Cheese", 50]])];
    case "Burgers":
      return [options("Cheese", [["Regular", 0], ["Extra Cheese", 30]]), options("Patty", [["Regular", 0], ["Extra Patty", 60]]), options("Sauce", [["Regular", 0], ["Extra Sauce", 15]])];
    case "Chinese":
      return [options("Spice Level", [["Mild", 0], ["Medium", 0], ["Spicy", 0]]), options(item.type === "Non-Veg" ? "Extra Chicken" : "Extra Vegetables", [["Regular", 0], [item.type === "Non-Veg" ? "Extra Chicken" : "Extra Vegetables", 40]]), options("Sauce", [["Regular", 0], ["Extra Sauce", 20]])];
    case "Snacks":
      return [options("Serving", [["Regular", 0], ["Large", 40]]), options("Chutney", [["Mint", 0], ["Tamarind", 0], ["Both", 10]])];
    case "Beverages":
      return [options("Size", [["Regular", 0], ["Large", 40]]), options("Sugar", [["Regular", 0], ["Less Sugar", 0], ["No Sugar", 0]])];
    case "Desserts":
      return [options("Serving", [["Regular", 0], ["Double", 60]]), options("Add Ice Cream", [["No", 0], ["Vanilla Scoop", 45]])];
    case "Combo":
      return [options("Spice Level", [["Mild", 0], ["Medium", 0], ["Spicy", 0]]), options("Drink", [["Regular", 0], ["Cold Drink", 30]])];
    case "Indian Breads":
      return [options("Butter", [["No Butter", 0], ["Extra Butter", 20]]), options("Quantity", [["1", 0], ["2", Number(item.price) || 0]])];
    case "Biryani & Rice":
      return [options("Spice Level", [["Mild", 0], ["Medium", 0], ["Spicy", 0]]), options("Raita", [["No Raita", 0], ["Raita", 25]])];
    case "Starters":
    case "Main Course":
    case "Non-Veg Main Course":
      return [options("Spice Level", [["Mild", 0], ["Medium", 0], ["Spicy", 0]]), options(item.type === "Non-Veg" ? "Extra Chicken" : "Extra Gravy", [["Regular", 0], [item.type === "Non-Veg" ? "Extra Chicken" : "Extra Gravy", 50]])];
    default:
      return [];
  }
};

async function migrateMenuCustomizations() {
  try {
    await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 5000 });

    const seedCustomizations = new Map(seedMenuItems.map((item) => [item.name, item.customization || []]));
    const databaseItems = await Menu.find({}, { name: 1, category: 1, type: 1, price: 1 }).lean();
    const updates = databaseItems.map((item) => {
      const seededCustomization = seedCustomizations.get(item.name);
      const customization = seededCustomization?.length
        ? seededCustomization
        : getDefaultCustomization(item);

      return ({
      updateOne: {
        filter: { name: item.name },
        update: { $set: { customization } },
      },
      });
    });

    const result = await Menu.bulkWrite(updates, { ordered: false });
    console.log(`Customization updated for ${result.modifiedCount} menu items.`);
    const withoutCustomization = await Menu.find({ customization: { $size: 0 } }, { name: 1, category: 1 }).lean();
    if (withoutCustomization.length) {
      console.log("Items still without customization:", withoutCustomization.map((item) => `${item.name} (${item.category})`).join(", "));
    }
  } catch (error) {
    console.error("Customization migration failed:", error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.connection.close();
  }
}

migrateMenuCustomizations();
