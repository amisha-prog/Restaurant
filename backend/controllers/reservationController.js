const mongoose = require("mongoose");
const Reservation = require("../models/Reservation");
const Restaurant = require("../models/Restaurant");
const Table = require("../models/Table");

// Helper to resolve Restaurant ObjectId
const findTargetRestaurant = async (identifier) => {
  if (!identifier) return null;
  if (mongoose.isValidObjectId(identifier)) {
    const found = await Restaurant.findById(identifier);
    if (found) return found;
  }
  return await Restaurant.findOne({
    $or: [
      { restaurantId: String(identifier).toUpperCase() },
      { restaurantId: identifier },
      { email: String(identifier).toLowerCase() },
      { name: identifier },
      { restaurantName: identifier },
    ],
  });
};

// GET /api/reservations?restaurantId=...&date=...&status=...
const getReservations = async (req, res) => {
  try {
    const { restaurantId, date, status } = req.query;

    let query = {};
    if (restaurantId) {
      const restaurant = await findTargetRestaurant(restaurantId);
      if (restaurant) {
        query.restaurantId = restaurant._id;
      } else {
        query.restaurantId = new mongoose.Types.ObjectId();
      }
    }

    if (date) {
      query.reservationDate = date;
    }

    if (status && status !== "All") {
      query.status = status;
    }

    const reservations = await Reservation.find(query)
      .sort({ reservationDate: -1, reservationTime: 1, createdAt: -1 })
      .populate("tableId", "tableNumber capacity status");

    // Calculate metrics
    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

    const totalCount = reservations.length;
    const todayCount = reservations.filter((r) => r.reservationDate === todayStr).length;
    const confirmedCount = reservations.filter((r) => r.status === "Confirmed").length;
    const seatedCount = reservations.filter((r) => r.status === "Seated").length;

    return res.status(200).json({
      success: true,
      stats: {
        total: totalCount,
        today: todayCount,
        confirmed: confirmedCount,
        seated: seatedCount,
      },
      reservations,
    });
  } catch (error) {
    console.error("Get reservations error:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch reservations." });
  }
};

// POST /api/reservations
const createReservation = async (req, res) => {
  try {
    const {
      restaurantId,
      customerName,
      customerPhone,
      customerEmail,
      guestsCount,
      reservationDate,
      reservationTime,
      tableNumber,
      specialRequest,
      status = "Confirmed",
      source = "Admin",
    } = req.body;

    if (!restaurantId || !customerName || !customerPhone || !reservationDate || !reservationTime) {
      return res.status(400).json({
        success: false,
        message: "Restaurant, guest name, phone, date, and time are required.",
      });
    }

    const restaurant = await findTargetRestaurant(restaurantId);
    if (!restaurant) {
      return res.status(404).json({ success: false, message: "Restaurant not found." });
    }

    let linkedTableId = null;
    let cleanTableNumber = tableNumber ? String(tableNumber).trim() : "";

    if (cleanTableNumber) {
      const table = await Table.findOne({
        restaurantId: restaurant._id,
        tableNumber: { $regex: new RegExp(`^${cleanTableNumber}$`, "i") },
      });
      if (table) {
        linkedTableId = table._id;
        cleanTableNumber = table.tableNumber;
        // If reservation is confirmed, mark table as Reserved
        if (status === "Confirmed" && table.status === "Available") {
          table.status = "Reserved";
          await table.save();
        }
      }
    }

    const reservation = new Reservation({
      restaurantId: restaurant._id,
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim(),
      customerEmail: customerEmail ? customerEmail.trim() : "",
      guestsCount: Number(guestsCount) || 2,
      reservationDate,
      reservationTime,
      tableId: linkedTableId,
      tableNumber: cleanTableNumber,
      specialRequest: specialRequest ? specialRequest.trim() : "",
      status,
      source,
    });

    await reservation.save();

    return res.status(201).json({
      success: true,
      message: "Reservation created successfully.",
      reservation,
    });
  } catch (error) {
    console.error("Create reservation error:", error);
    return res.status(500).json({ success: false, message: "Failed to create reservation." });
  }
};

// PATCH /api/reservations/:id/status
const updateReservationStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ["Confirmed", "Seated", "Completed", "Cancelled", "No Show"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: "Invalid reservation status." });
    }

    const reservation = await Reservation.findById(id);
    if (!reservation) {
      return res.status(404).json({ success: false, message: "Reservation not found." });
    }

    reservation.status = status;
    await reservation.save();

    // Floor sync with Table
    if (reservation.tableNumber || reservation.tableId) {
      const table = reservation.tableId
        ? await Table.findById(reservation.tableId)
        : await Table.findOne({
            restaurantId: reservation.restaurantId,
            tableNumber: { $regex: new RegExp(`^${reservation.tableNumber.trim()}$`, "i") },
          });

      if (table) {
        if (status === "Seated") {
          table.status = "Occupied";
          await table.save();
        } else if (["Completed", "Cancelled"].includes(status)) {
          if (["Reserved", "Occupied"].includes(table.status)) {
            table.status = "Available";
            await table.save();
          }
        } else if (status === "Confirmed") {
          if (table.status === "Available") {
            table.status = "Reserved";
            await table.save();
          }
        }
      }
    }

    return res.status(200).json({
      success: true,
      message: `Reservation status updated to ${status}.`,
      reservation,
    });
  } catch (error) {
    console.error("Update reservation status error:", error);
    return res.status(500).json({ success: false, message: "Failed to update reservation status." });
  }
};

// DELETE /api/reservations/:id
const deleteReservation = async (req, res) => {
  try {
    const { id } = req.params;
    const reservation = await Reservation.findByIdAndDelete(id);
    if (!reservation) {
      return res.status(404).json({ success: false, message: "Reservation not found." });
    }

    // Release table if it was reserved
    if (reservation.tableNumber || reservation.tableId) {
      const table = reservation.tableId
        ? await Table.findById(reservation.tableId)
        : await Table.findOne({
            restaurantId: reservation.restaurantId,
            tableNumber: { $regex: new RegExp(`^${reservation.tableNumber.trim()}$`, "i") },
          });

      if (table && table.status === "Reserved") {
        table.status = "Available";
        await table.save();
      }
    }

    return res.status(200).json({
      success: true,
      message: "Reservation deleted successfully.",
      reservationId: id,
    });
  } catch (error) {
    console.error("Delete reservation error:", error);
    return res.status(500).json({ success: false, message: "Failed to delete reservation." });
  }
};

// PUT /api/reservations/:id
const updateReservation = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      customerName,
      customerPhone,
      customerEmail,
      guestsCount,
      reservationDate,
      reservationTime,
      tableNumber,
      specialRequest,
      status,
      source,
    } = req.body;

    const existing = await Reservation.findById(id);
    if (!existing) {
      return res.status(404).json({ success: false, message: "Reservation not found." });
    }

    const oldTableNumber = existing.tableNumber;

    // Resolve table if changed
    let newTableId = existing.tableId;
    if (tableNumber !== undefined && tableNumber !== oldTableNumber) {
      if (tableNumber && tableNumber.trim()) {
        const foundT = await Table.findOne({
          restaurantId: existing.restaurantId,
          tableNumber: { $regex: new RegExp(`^${tableNumber.trim()}$`, "i") },
        });
        newTableId = foundT ? foundT._id : null;
      } else {
        newTableId = null;
      }
    }

    if (customerName) existing.customerName = customerName.trim();
    if (customerPhone) existing.customerPhone = customerPhone.trim();
    if (customerEmail !== undefined) existing.customerEmail = customerEmail.trim();
    if (guestsCount) existing.guestsCount = Number(guestsCount);
    if (reservationDate) existing.reservationDate = reservationDate;
    if (reservationTime) existing.reservationTime = reservationTime.trim();
    if (specialRequest !== undefined) existing.specialRequest = specialRequest.trim();
    if (source) existing.source = source;
    if (tableNumber !== undefined) existing.tableNumber = tableNumber.trim();
    existing.tableId = newTableId;

    const newStatus = status || existing.status;
    existing.status = newStatus;

    await existing.save();

    // Floor sync if table changed or status changed
    const targetStatus = newStatus;
    // Release old table if changed and was reserved/occupied
    if (oldTableNumber && oldTableNumber !== existing.tableNumber) {
      const oldTable = await Table.findOne({
        restaurantId: existing.restaurantId,
        tableNumber: { $regex: new RegExp(`^${oldTableNumber.trim()}$`, "i") },
      });
      if (oldTable && ["Reserved", "Occupied"].includes(oldTable.status)) {
        oldTable.status = "Available";
        await oldTable.save();
      }
    }

    // Update new table status
    if (existing.tableNumber) {
      const currentTable = await Table.findOne({
        restaurantId: existing.restaurantId,
        tableNumber: { $regex: new RegExp(`^${existing.tableNumber.trim()}$`, "i") },
      });
      if (currentTable) {
        if (targetStatus === "Seated") {
          currentTable.status = "Occupied";
          await currentTable.save();
        } else if (targetStatus === "Confirmed") {
          if (currentTable.status === "Available") {
            currentTable.status = "Reserved";
            await currentTable.save();
          }
        } else if (["Completed", "Cancelled"].includes(targetStatus)) {
          if (["Reserved", "Occupied"].includes(currentTable.status)) {
            currentTable.status = "Available";
            await currentTable.save();
          }
        }
      }
    }

    const populated = await Reservation.findById(existing._id).populate("tableId", "tableNumber capacity status");

    return res.status(200).json({
      success: true,
      message: "Reservation updated successfully.",
      reservation: populated,
    });
  } catch (error) {
    console.error("Update reservation error:", error);
    return res.status(500).json({ success: false, message: "Failed to update reservation." });
  }
};

module.exports = {
  getReservations,
  createReservation,
  updateReservation,
  updateReservationStatus,
  deleteReservation,
};

