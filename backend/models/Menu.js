const mongoose = require("mongoose");

const customizationOptionSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    price: { type: Number, default: 0 },
  },
  { _id: false }
);

const customizationGroupSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    options: { type: [customizationOptionSchema], default: [] },
  },
  { _id: false }
);

const menuSchema = new mongoose.Schema(
  {
    // Which restaurant this menu item belongs to (null = legacy/shared)
    restaurantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Restaurant",
      default: null,
      index: true,
    },

    name: {
      type: String,
      required: true,
    },

    category: {
      type: String,
      required: true,
    },

    price: {
      type: Number,
      required: true,
    },

    description: {
      type: String,
    },

    image: {
      type: String,
    },

    rating: {
      type: Number,
      default: 0,
    },

    inStock: {
      type: Boolean,
      default: true,
    },

    status: {
      type: String,
      default: "Available",
    },

    type: {
      type: String,
      default: "Veg",
    },

    // These groups belong to this menu item only (for example Pizza size/crust).
    customization: {
      type: [customizationGroupSchema],
      default: [],
    },
  },
  {
    timestamps: true,
    collection: "items",
  }
);

module.exports = mongoose.model("Menu", menuSchema);
