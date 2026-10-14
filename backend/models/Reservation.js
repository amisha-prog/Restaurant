const mongoose = require("mongoose");

const reservationSchema = new mongoose.Schema(
  {
    restaurantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Restaurant",
      required: true,
    },
    customerName: {
      type: String,
      required: true,
      trim: true,
    },
    customerPhone: {
      type: String,
      required: true,
      trim: true,
    },
    customerEmail: {
      type: String,
      trim: true,
      default: "",
    },
    guestsCount: {
      type: Number,
      default: 2,
      min: 1,
    },
    reservationDate: {
      type: String, // YYYY-MM-DD format
      required: true,
    },
    reservationTime: {
      type: String, // e.g. "07:30 PM" or "19:30"
      required: true,
    },
    tableId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Table",
      default: null,
    },
    tableNumber: {
      type: String,
      default: "",
    },
    specialRequest: {
      type: String,
      default: "",
      trim: true,
    },
    status: {
      type: String,
      enum: ["Confirmed", "Seated", "Completed", "Cancelled", "No Show"],
      default: "Confirmed",
    },
    source: {
      type: String,
      enum: ["Admin", "Online", "Phone"],
      default: "Admin",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Reservation", reservationSchema);
