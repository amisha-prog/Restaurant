const mongoose = require("mongoose");

const tableSchema = new mongoose.Schema(
  {
    restaurantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Restaurant",
      required: true,
    },

    tableNumber: {
      type: String,
      required: true,
    },

    capacity: {
      type: Number,
      default: 4,
    },

    guestCount: {
      type: Number,
      default: 0,
    },

    status: {
      type: String,
      enum: [
        "Available",
        "Occupied",
        "Reserved",
        "Cleaning",
        "Out of Service",
      ],
      default: "Available",
    },

    assignedWaiter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Waiter",
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Table", tableSchema);