const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema({
  restaurantId: { type: mongoose.Schema.Types.ObjectId, ref: "Restaurant", required: true, index: true },
  type: { type: String, required: true },
  title: { type: String, required: true, trim: true },
  message: { type: String, required: true, trim: true },
  tableNumber: { type: String, default: "", trim: true },
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: "Order", default: null },
  readBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "Waiter" }],
}, { timestamps: true });

module.exports = mongoose.model("Notification", notificationSchema);
