const Menu = require("../models/Menu");
const Modifier = require("../models/Modifier");
const Restaurant = require("../models/Restaurant");
const mongoose = require("mongoose");

const ensureDatabaseConnection = (res) => {
  if (mongoose.connection.readyState === 1) {
    return true;
  }

  res.status(503).json({
    message: "Database is unavailable. Check the MongoDB connection and try again.",
  });
  return false;
};

// ===============================
// Get Menu Items
// ===============================
const getMenuItems = async (req, res) => {
  try {
    if (!ensureDatabaseConnection(res)) return;

    let filter = {};
    if (req.query.restaurantId) {
      const rId = String(req.query.restaurantId).trim();
      let targetRestaurant = null;
      if (mongoose.isValidObjectId(rId)) {
        targetRestaurant = await Restaurant.findById(rId).select("_id restaurantId");
      }
      if (!targetRestaurant) {
        targetRestaurant = await Restaurant.findOne({
          $or: [
            { restaurantId: rId.toUpperCase() },
            { restaurantId: rId },
            { email: rId.toLowerCase() },
          ],
        }).select("_id restaurantId");
      }

      if (targetRestaurant) {
        filter = { restaurantId: targetRestaurant._id };
      } else if (mongoose.isValidObjectId(rId)) {
        filter = { restaurantId: new mongoose.Types.ObjectId(rId) };
      } else {
        filter = { restaurantId: new mongoose.Types.ObjectId() };
      }
    }

    const items = await Menu.find(filter).sort({ createdAt: -1 });

    res.status(200).json(items);
  } catch (error) {
    console.error("Get Menu Error:", error);

    res.status(500).json({
      message: "Failed to fetch menu items",
    });
  }
};

// ===============================
// Add Menu Item
// ===============================
const addMenuItem = async (req, res) => {
  try {
    if (!ensureDatabaseConnection(res)) return;

    const {
      name,
      category,
      price,
      description,
      image,
      type,
      inStock,
      customization,
      restaurantId,
    } = req.body;

    if (!name || !category || price === undefined) {
      return res.status(400).json({
        message: "Name, category and price are required",
      });
    }

    let resolvedRestaurantId = null;
    if (restaurantId) {
      const rId = String(restaurantId).trim();
      let targetRestaurant = null;
      if (mongoose.isValidObjectId(rId)) {
        targetRestaurant = await Restaurant.findById(rId).select("_id");
      }
      if (!targetRestaurant) {
        targetRestaurant = await Restaurant.findOne({
          $or: [
            { restaurantId: rId.toUpperCase() },
            { restaurantId: rId },
          ],
        }).select("_id");
      }

      if (targetRestaurant) {
        resolvedRestaurantId = targetRestaurant._id;
      } else if (mongoose.isValidObjectId(rId)) {
        resolvedRestaurantId = new mongoose.Types.ObjectId(rId);
      }
    }

    const isAvailable = inStock !== undefined
      ? Boolean(inStock)
      : (req.body.status ? req.body.status.toLowerCase() !== "unavailable" : true);
    const newStatus = isAvailable ? "Available" : "Unavailable";

    const item = await Menu.create({
      restaurantId: resolvedRestaurantId,
      name,
      category,
      price: Number(price),
      description,
      image,
      type: type || "Veg",
      inStock: isAvailable,
      status: newStatus,
      customization: Array.isArray(customization) ? customization : [],
    });

    res.status(201).json({
      message: "Menu item added successfully",
      item,
    });
  } catch (error) {
    console.error("Add Menu Error:", error);

    res.status(500).json({
      message: "Failed to add menu item",
    });
  }
};

// ===============================
// Update Menu Item
// ===============================
const updateMenuItem = async (req, res) => {
  try {
    if (!ensureDatabaseConnection(res)) return;

    const { name, category, price, description, image, type, inStock, status, customization } = req.body;

    // Quick status / inStock toggle without requiring other fields
    if (!name && (inStock !== undefined || status !== undefined)) {
      const isAvailable = inStock !== undefined
        ? Boolean(inStock)
        : (status ? status.toLowerCase() !== "unavailable" : true);
      const newStatus = isAvailable ? "Available" : "Unavailable";

      const item = await Menu.findByIdAndUpdate(
        req.params.id,
        { inStock: isAvailable, status: newStatus },
        { new: true }
      );

      if (!item) {
        return res.status(404).json({ message: "Menu item not found" });
      }

      return res.status(200).json({ message: "Menu item status updated successfully", item });
    }

    if (!name || !category || price === undefined) {
      return res.status(400).json({
        message: "Name, category and price are required",
      });
    }

    const isAvailable = inStock !== undefined
      ? Boolean(inStock)
      : (status ? status.toLowerCase() !== "unavailable" : true);
    const newStatus = isAvailable ? "Available" : "Unavailable";

    const item = await Menu.findByIdAndUpdate(
      req.params.id,
      {
        name,
        category,
        price,
        description,
        image,
        type,
        inStock: isAvailable,
        status: newStatus,
        customization: Array.isArray(customization) ? customization : [],
      },
      { new: true, runValidators: true }
    );

    if (!item) {
      return res.status(404).json({ message: "Menu item not found" });
    }

    res.status(200).json({ message: "Menu item updated successfully", item });
  } catch (error) {
    console.error("Update Menu Error:", error);
    res.status(500).json({ message: "Failed to update menu item" });
  }
};

// ===============================
// Delete Menu Item
// ===============================
const deleteMenuItem = async (req, res) => {
  try {
    if (!ensureDatabaseConnection(res)) return;

    const item = await Menu.findByIdAndDelete(req.params.id);

    if (!item) {
      return res.status(404).json({ message: "Menu item not found" });
    }

    res.status(200).json({ message: "Menu item deleted successfully" });
  } catch (error) {
    console.error("Delete Menu Error:", error);
    res.status(500).json({ message: "Failed to delete menu item" });
  }
};

// ===============================
// Get Modifiers
// ===============================
const getModifiers = async (req, res) => {
  try {
    if (!ensureDatabaseConnection(res)) return;

    const modifiers = await Modifier.find().sort({
      createdAt: -1,
    });

    res.status(200).json({
      modifiers,
    });
  } catch (error) {
    console.error("Get Modifiers Error:", error);

    res.status(500).json({
      message: "Failed to fetch modifiers",
    });
  }
};

// ===============================
// Add Modifier
// ===============================
const addModifier = async (req, res) => {
  try {
    if (!ensureDatabaseConnection(res)) return;

    const { name, priceAdjustment } = req.body;

    if (!name) {
      return res.status(400).json({
        message: "Modifier name is required",
      });
    }

    const modifier = await Modifier.create({
      name,
      priceAdjustment: Number(priceAdjustment || 0),
    });

    res.status(201).json({
      message: "Modifier added successfully",
      modifier,
    });
  } catch (error) {
    console.error("Add Modifier Error:", error);

    res.status(500).json({
      message: "Failed to add modifier",
    });
  }
};

// ===============================
// Delete Modifier
// ===============================
const deleteModifier = async (req, res) => {
  try {
    if (!ensureDatabaseConnection(res)) return;

    const { id } = req.params;

    const modifier = await Modifier.findByIdAndDelete(id);

    if (!modifier) {
      return res.status(404).json({
        message: "Modifier not found",
      });
    }

    res.status(200).json({
      message: "Modifier deleted successfully",
    });
  } catch (error) {
    console.error("Delete Modifier Error:", error);

    res.status(500).json({
      message: "Failed to delete modifier",
    });
  }
};

module.exports = {
  getMenuItems,
  addMenuItem,
  updateMenuItem,
  deleteMenuItem,
  getModifiers,
  addModifier,
  deleteModifier,
};
