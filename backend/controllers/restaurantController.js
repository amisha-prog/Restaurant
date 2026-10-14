const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");

const Restaurant = require("../models/Restaurant");
const Admin = require("../models/adminModel");
const Counter = require("../models/Counter");

// =====================================================
// GENERATE AUTO INCREMENT RESTAURANT ID
// =====================================================
const generateRestaurantId = async () => {
  const counter = await Counter.findOneAndUpdate(
    { name: "restaurant" },
    { $inc: { sequence: 1 } },
    {
      new: true,
      upsert: true,
    }
  );

  return `REST${String(counter.sequence).padStart(3, "0")}`;
};

// =====================================================
// ADD RESTAURANT
// =====================================================
const addRestaurant = async (req, res) => {
  try {
    const {
      restaurantName,
      ownerName,
      email,
      phone,
      password,
      address,
      city,
      state,
      pincode,
      cuisine,
    } = req.body;

    // Required fields
    if (
      !restaurantName ||
      !ownerName ||
      !email ||
      !phone ||
      !password ||
      !address ||
      !city
    ) {
      return res.status(400).json({
        message:
          "Restaurant name, owner name, email, phone, password, address and city are required.",
      });
    }

    // Password strength check (min 8 chars, 1 uppercase, 1 lowercase, 1 digit, 1 special char)
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@#$!%*?&]).{8,}$/;
    if (!passwordRegex.test(password)) {
      return res.status(400).json({
        message:
          "Password must be at least 8 characters long and contain at least 1 uppercase letter, 1 lowercase letter, 1 number, and 1 special character (@#$!%*?&).",
      });
    }

    // Normalize email
    const normalizedEmail = email.toLowerCase().trim();

    // Check duplicate email
    const existingRestaurant = await Restaurant.findOne({
      email: normalizedEmail,
    });

    if (existingRestaurant) {
      return res.status(400).json({
        message: "A restaurant with this email already exists.",
      });
    }

    // Generate REST001, REST002...
    const restaurantId = await generateRestaurantId();

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create restaurant
    const restaurant = await Restaurant.create({
      restaurantName: restaurantName.trim(),
      ownerName: ownerName.trim(),
      email: normalizedEmail,
      phone: phone.trim(),
      password: hashedPassword,

      address: address.trim(),
      city: city.trim(),
      state: state ? state.trim() : "",
      pincode: pincode ? pincode.trim() : "",
      cuisine: cuisine ? cuisine.trim() : "",

      restaurantId,
      status: "Active",
    });

    // Automatically create / sync Admin account for this restaurant
    let adminAccount = null;
    try {
      const existingAdmin = await Admin.findOne({ email: normalizedEmail });
      if (existingAdmin) {
        existingAdmin.name = ownerName.trim();
        existingAdmin.phone = phone.trim();
        if (existingAdmin.role !== "superadmin") {
          existingAdmin.role = "restaurant";
        }
        existingAdmin.restaurantId = restaurant._id;
        existingAdmin.restaurantCode = restaurant.restaurantId;
        existingAdmin.restaurantName = restaurant.restaurantName;
        existingAdmin.password = password; // pre('save') hook will hash with salt
        adminAccount = await existingAdmin.save();
      } else {
        adminAccount = await Admin.create({
          name: ownerName.trim(),
          email: normalizedEmail,
          password: password, // pre('save') hook will hash with salt
          phone: phone.trim(),
          role: "restaurant",
          restaurantId: restaurant._id,
          restaurantCode: restaurant.restaurantId,
          restaurantName: restaurant.restaurantName,
        });
      }
    } catch (adminErr) {
      console.warn("Auto Admin account creation warning:", adminErr.message);
    }

    return res.status(201).json({
      message: "Restaurant and Restaurant Admin account created successfully.",

      restaurant: {
        _id: restaurant._id,
        restaurantId: restaurant.restaurantId,
        restaurantName: restaurant.restaurantName,
        ownerName: restaurant.ownerName,
        email: restaurant.email,
        phone: restaurant.phone,
        address: restaurant.address,
        city: restaurant.city,
        state: restaurant.state,
        pincode: restaurant.pincode,
        cuisine: restaurant.cuisine,
        status: restaurant.status,
        createdAt: restaurant.createdAt,
      },
      admin: {
        id: adminAccount?._id || restaurant._id,
        name: ownerName.trim(),
        email: normalizedEmail,
        role: "restaurant",
        restaurantId: restaurant.restaurantId,
      },
    });
  } catch (error) {
    console.error("Add Restaurant Error:", error);

    if (error.code === 11000) {
      return res.status(400).json({
        message:
          "Restaurant email or Restaurant ID already exists.",
      });
    }

    return res.status(500).json({
      message: "Server error while creating restaurant.",
    });
  }
};

// =====================================================
// GET ALL RESTAURANTS
// =====================================================
const getRestaurants = async (req, res) => {
  try {
    const restaurants = await Restaurant.find()
      .select("-password")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      restaurants,
    });
  } catch (error) {
    console.error("Get Restaurants Error:", error);

    return res.status(500).json({
      message: "Server error while fetching restaurants.",
    });
  }
};

// =====================================================
// GET SINGLE RESTAURANT
// =====================================================
const getRestaurantById = async (req, res) => {
  try {
    const { id } = req.params;

    console.log("=================================");
    console.log("GET RESTAURANT BY ID");
    console.log("Received ID:", id);
    console.log("=================================");

    // Check ID
    if (!id) {
      return res.status(400).json({
        message: "Restaurant ID is required.",
      });
    }

    // Check MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      console.log("Invalid MongoDB ID:", id);

      return res.status(400).json({
        message: "Invalid restaurant ID.",
      });
    }

    // Find restaurant
    const restaurant = await Restaurant.findById(id)
      .select("-password")
      .lean();

    console.log("Restaurant Found:", restaurant);

    // Restaurant not found
    if (!restaurant) {
      return res.status(404).json({
        message: "Restaurant not found.",
      });
    }

    // IMPORTANT:
    // Frontend expects data.restaurant
    return res.status(200).json({
      success: true,
      restaurant: restaurant,
    });
  } catch (error) {
    console.error("Get Restaurant Error:", error);

    return res.status(500).json({
      message: "Server error while fetching restaurant.",
      error: error.message,
    });
  }
};

// =====================================================
// RESTAURANT LOGIN
// =====================================================
const restaurantLogin = async (req, res) => {
  try {
    const { restaurantId, password } = req.body;

    if (!restaurantId || !password) {
      return res.status(400).json({
        message: "Restaurant ID and password are required.",
      });
    }

    const restaurant = await Restaurant.findOne({
      restaurantId: restaurantId.trim(),
    });

    if (!restaurant) {
      return res.status(401).json({
        message: "Invalid Restaurant ID or password.",
      });
    }

    if (restaurant.status === "Inactive") {
      return res.status(403).json({
        message: "This restaurant account is inactive.",
      });
    }

    let isPasswordCorrect = await bcrypt.compare(
      password,
      restaurant.password
    );

    if (!isPasswordCorrect && restaurant.password) {
      isPasswordCorrect = await bcrypt.compare(password.trim(), restaurant.password);
    }

    if (!isPasswordCorrect) {
      const linkedAdmin = await Admin.findOne({
        $or: [
          { restaurantId: restaurant._id },
          { email: restaurant.email },
          { restaurantCode: restaurant.restaurantId },
        ],
      });
      if (linkedAdmin && linkedAdmin.password) {
        isPasswordCorrect = (await bcrypt.compare(password, linkedAdmin.password)) ||
                            (await bcrypt.compare(password.trim(), linkedAdmin.password));
      }
    }

    if (!isPasswordCorrect) {
      return res.status(401).json({
        message: "Invalid Restaurant ID or password.",
      });
    }

    return res.status(200).json({
      message: "Restaurant login successful.",

      restaurant: {
        _id: restaurant._id,
        restaurantId: restaurant.restaurantId,
        restaurantName: restaurant.restaurantName,
        ownerName: restaurant.ownerName,
        email: restaurant.email,
        phone: restaurant.phone,
        address: restaurant.address,
        city: restaurant.city,
        state: restaurant.state,
        pincode: restaurant.pincode,
        cuisine: restaurant.cuisine,
        status: restaurant.status,
      },
    });
  } catch (error) {
    console.error("Restaurant Login Error:", error);

    return res.status(500).json({
      message: "Server error during restaurant login.",
    });
  }
};

// =====================================================
// DELETE RESTAURANT
// =====================================================
const deleteRestaurant = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        message: "Restaurant ID is required.",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        message: "Invalid restaurant ID.",
      });
    }

    const restaurant = await Restaurant.findByIdAndDelete(id);

    if (!restaurant) {
      return res.status(404).json({
        message: "Restaurant not found.",
      });
    }

    // Delete associated Admin account
    try {
      await Admin.deleteMany({
        $or: [
          { restaurantId: id },
          { restaurantCode: restaurant.restaurantId },
          { email: restaurant.email },
        ],
        role: { $ne: "superadmin" },
      });
    } catch (adminDelErr) {
      console.warn("Delete associated admin warning:", adminDelErr.message);
    }

    return res.status(200).json({
      message: "Restaurant and associated admin account deleted successfully.",
    });
  } catch (error) {
    console.error("Delete Restaurant Error:", error);

    return res.status(500).json({
      message: "Server error while deleting restaurant.",
    });
  }
};

// =====================================================
// UPDATE RESTAURANT
// =====================================================
const updateRestaurant = async (req, res) => {
  try {
    const { id } = req.params;

    console.log("=================================");
    console.log("UPDATE RESTAURANT");
    console.log("Restaurant ID:", id);
    console.log("Update Data:", req.body);
    console.log("=================================");

    // Check ID
    if (!id) {
      return res.status(400).json({
        message: "Restaurant ID is required.",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        message: "Invalid restaurant ID.",
      });
    }

    // Find restaurant
    const restaurant = await Restaurant.findById(id);

    if (!restaurant) {
      return res.status(404).json({
        message: "Restaurant not found.",
      });
    }

    const oldEmail = restaurant.email;
    const oldRestaurantCode = restaurant.restaurantId;
    const oldMongoId = restaurant._id;

    const {
      restaurantName,
      ownerName,
      email,
      phone,
      password,
      newPassword,
      new_restaurant_password,
      address,
      city,
      state,
      pincode,
      cuisine,
      status,
    } = req.body;

    const targetPassword = password || newPassword || new_restaurant_password;

    // ---------------------------------------------
    // Restaurant Name
    // ---------------------------------------------
    if (restaurantName !== undefined) {
      restaurant.restaurantName = restaurantName.trim();
    }

    // ---------------------------------------------
    // Owner Name
    // ---------------------------------------------
    if (ownerName !== undefined) {
      restaurant.ownerName = ownerName.trim();
    }

    // ---------------------------------------------
    // Email
    // ---------------------------------------------
    if (email !== undefined) {
      const normalizedEmail = email.toLowerCase().trim();

      // Check whether another restaurant uses this email
      const existingRestaurant = await Restaurant.findOne({
        email: normalizedEmail,
        _id: { $ne: id },
      });

      if (existingRestaurant) {
        return res.status(400).json({
          message:
            "This email is already used by another restaurant.",
        });
      }

      restaurant.email = normalizedEmail;
    }

    // ---------------------------------------------
    // Phone
    // ---------------------------------------------
    if (phone !== undefined) {
      restaurant.phone = phone.trim();
    }

    // ---------------------------------------------
    // Address
    // ---------------------------------------------
    if (address !== undefined) {
      restaurant.address = address.trim();
    }

    // ---------------------------------------------
    // City
    // ---------------------------------------------
    if (city !== undefined) {
      restaurant.city = city.trim();
    }

    // ---------------------------------------------
    // State
    // ---------------------------------------------
    if (state !== undefined) {
      restaurant.state = state.trim();
    }

    // ---------------------------------------------
    // Pincode
    // ---------------------------------------------
    if (pincode !== undefined) {
      restaurant.pincode = pincode.trim();
    }

    // ---------------------------------------------
    // Cuisine
    // ---------------------------------------------
    if (cuisine !== undefined) {
      restaurant.cuisine = cuisine.trim();
    }

    // ---------------------------------------------
    // Status
    // ---------------------------------------------
    if (status !== undefined) {
      restaurant.status = status;
    }

    // ---------------------------------------------
    // Password
    // ---------------------------------------------
    if (
      targetPassword !== undefined &&
      String(targetPassword).trim() !== ""
    ) {
      restaurant.password = await bcrypt.hash(
        String(targetPassword).trim(),
        10
      );
    }

    // Save
    await restaurant.save();

    // Sync updates to linked Admin account
    try {
      const adminToUpdate = await Admin.findOne({
        $or: [
          { restaurantId: oldMongoId },
          { email: oldEmail },
          { email: restaurant.email },
          { restaurantCode: oldRestaurantCode },
          { restaurantCode: restaurant.restaurantId },
        ],
      });
      if (adminToUpdate) {
        if (ownerName !== undefined) adminToUpdate.name = ownerName.trim();
        if (email !== undefined) adminToUpdate.email = email.toLowerCase().trim();
        if (phone !== undefined) adminToUpdate.phone = phone.trim();
        if (restaurantName !== undefined) adminToUpdate.restaurantName = restaurantName.trim();
        if (targetPassword !== undefined && String(targetPassword).trim() !== "") {
          adminToUpdate.password = String(targetPassword).trim(); // hashed by pre('save') hook
        }
        await adminToUpdate.save();
      }
    } catch (adminSyncErr) {
      console.warn("Admin sync on update warning:", adminSyncErr.message);
    }

    // ---------------------------------------------
    // Success Response
    // ---------------------------------------------
    return res.status(200).json({
      message: "Restaurant updated successfully.",

      restaurant: {
        _id: restaurant._id,
        restaurantId: restaurant.restaurantId,
        restaurantName: restaurant.restaurantName,
        ownerName: restaurant.ownerName,
        email: restaurant.email,
        phone: restaurant.phone,
        address: restaurant.address,
        city: restaurant.city,
        state: restaurant.state,
        pincode: restaurant.pincode,
        cuisine: restaurant.cuisine,
        status: restaurant.status,
        updatedAt: restaurant.updatedAt,
      },
    });
  } catch (error) {
    console.error("Update Restaurant Error:", error);

    if (error.code === 11000) {
      return res.status(400).json({
        message:
          "This email is already used by another restaurant.",
      });
    }

    return res.status(500).json({
      message: "Server error while updating restaurant.",
      error: error.message,
    });
  }
};

// =====================================================
// EXPORTS
// =====================================================
module.exports = {
  addRestaurant,
  getRestaurants,
  getRestaurantById,
  restaurantLogin,
  deleteRestaurant,
  updateRestaurant,
};