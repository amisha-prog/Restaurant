const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    restaurantId: { type: String, required: true, trim: true },
    tableNumber: { type: String, required: true, trim: true },
    customerName: { type: String, default: "Customer", trim: true },
    customerPhone: { type: String, default: "", trim: true },
    guestCount: { type: Number, default: 2, min: 1 },
    source: { type: String, enum: ["QR", "Manual", "Waiter", "Admin", "Manager"], default: "QR" },
    items: [{ menuItemId: String, name: String, price: Number, quantity: Number, selectedModifiers: [{ name: String, priceAdjustment: Number }] }],
    total: { type: Number, required: true, min: 0 },
    subtotal: { type: Number, min: 0 },
    discount: {
      type: {
        type: String,
        enum: ["percentage", "amount"],
        default: "percentage",
      },
      value: { type: Number, default: 0, min: 0 },
      amount: { type: Number, default: 0, min: 0 },
    },
    taxRate: { type: Number, default: 5, min: 0 },
    taxAmount: { type: Number, default: 0, min: 0 },
    payment: {
      status: { type: String, enum: ["Pending", "Requested", "Paid", "Failed"], default: "Pending" },
      method: { type: String, enum: ["Cash", "UPI", "Card", ""], default: "" },
      requestedAt: { type: Date, default: null },
      paidAt: { type: Date, default: null },
      reference: { type: String, default: "", trim: true },
    },
    status: { type: String, enum: ["New", "Preparing", "Ready", "Served", "Completed"], default: "New" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Order", orderSchema);
