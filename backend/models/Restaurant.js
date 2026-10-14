
const mongoose = require("mongoose");

const restaurantSchema = new mongoose.Schema(
  {
    // ===============================
    // Restaurant Information
    // ===============================

    restaurantName: {
      type: String,
      required: true,
      trim: true,
    },

    ownerName: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },

    phone: {
      type: String,
      required: true,
      trim: true,
    },

    // ===============================
    // Restaurant Address
    // ===============================

    address: {
      type: String,
      required: true,
      trim: true,
    },

    city: {
      type: String,
      required: true,
      trim: true,
    },

    state: {
      type: String,
      trim: true,
    },

    pincode: {
      type: String,
      trim: true,
    },

    // ===============================
    // Restaurant Details
    // ===============================

    cuisine: {
      type: String,
      trim: true,
      default: "",
    },

    // ===============================
    // Auto Generated Restaurant ID
    // ===============================

    restaurantId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    // ===============================
    // Hashed Password
    // ===============================

    password: {
      type: String,
      required: true,
    },

    // ===============================
    // Restaurant Status
    // ===============================

    status: {
      type: String,
      enum: ["Active", "Inactive"],
      default: "Active",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model(
  "Restaurant",
  restaurantSchema
);

