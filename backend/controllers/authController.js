const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const Admin = require("../models/adminModel");
const Restaurant = require("../models/Restaurant");
const Waiter = require("../models/Waiter");
const Manager = require("../models/Manager");
const Chef = require("../models/Chef");
const Cleaner = require("../models/Cleaner");
const bcrypt = require("bcryptjs");

const createToken = (id, role) =>
  jwt.sign({ id, role }, process.env.JWT_SECRET || "secretkey", {
    expiresIn: "1d",
  });

// One endpoint for both privileged roles. Super Admin uses an ID; Admin uses email.
const login = async (req, res) => {
  const { identifier, password } = req.body;

  if (!identifier || !password) {
    return res.status(400).json({ message: "Login ID or email and password are required" });
  }

  const normalizedIdentifier = identifier.trim();
  const superAdminId = process.env.SUPER_ADMIN_ID || "superadmin";
  const superAdminPassword = process.env.SUPER_ADMIN_PASSWORD || "123456";
  const customerId = process.env.CUSTOMER_ID || "customer";
  const customerPassword = process.env.CUSTOMER_PASSWORD || "customer123";

  if (normalizedIdentifier.toLowerCase() === superAdminId.toLowerCase()) {
    if (password !== superAdminPassword) {
      return res.status(401).json({ message: "Invalid login credentials" });
    }

    const user = { id: "superadmin", name: "Super Admin", role: "superadmin" };
    return res.status(200).json({ role: "superadmin", user, token: createToken(user.id, user.role) });
  }

  // Customer login is intentionally separate from Admin and Restaurant roles.
  // Environment variables can be used to replace these development defaults.
  if (normalizedIdentifier.toLowerCase() === customerId.toLowerCase()) {
    if (password !== customerPassword) {
      return res.status(401).json({ message: "Invalid login credentials" });
    }

    const user = { id: "customer", name: "FoodVista Customer", role: "customer" };
    return res.status(200).json({ role: "customer", user, token: createToken(user.id, user.role) });
  }

  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({ message: "Login is temporarily unavailable because the database is disconnected" });
  }

  try {
    const restaurants = await Restaurant.find({
      $or: [
        { restaurantId: normalizedIdentifier.toUpperCase() },
        { email: normalizedIdentifier.toLowerCase() },
        { restaurantName: new RegExp(`^${normalizedIdentifier}$`, "i") },
      ],
    }).sort({ status: 1, createdAt: -1 });

    const restaurant = restaurants[0];

    if (restaurant) {
      let passwordMatches = await bcrypt.compare(password, restaurant.password);

      if (!passwordMatches && restaurant.password) {
        passwordMatches = await bcrypt.compare(password.trim(), restaurant.password);
      }

      // Check linked Admin account if restaurant password did not match directly
      if (!passwordMatches) {
        const linkedAdmin = await Admin.findOne({
          $or: [
            { restaurantId: restaurant._id },
            { email: restaurant.email },
            { restaurantCode: restaurant.restaurantId },
          ],
        });
        if (linkedAdmin && linkedAdmin.password) {
          passwordMatches = (await bcrypt.compare(password, linkedAdmin.password)) ||
                            (await bcrypt.compare(password.trim(), linkedAdmin.password));
        }
      }

      if (!passwordMatches) {
        return res.status(401).json({ message: "Invalid login credentials" });
      }

      // Block login if restaurant is not Active
      if (restaurant.status !== "Active") {
        return res.status(403).json({
          message: `This restaurant account is currently ${restaurant.status || "inactive"}. Please contact the Super Admin to reactivate your account.`,
          status: restaurant.status || "Inactive",
          suspended: true,
        });
      }

      const user = {
        id: restaurant._id,
        _id: restaurant._id,
        restaurantName: restaurant.restaurantName,
        ownerName: restaurant.ownerName,
        name: restaurant.ownerName,
        email: restaurant.email,
        phone: restaurant.phone,
        city: restaurant.city,
        cuisine: restaurant.cuisine,
        address: restaurant.address,
        restaurantId: restaurant.restaurantId,
        status: restaurant.status,
        role: "restaurant",
      };
      return res.status(200).json({ role: "restaurant", user, token: createToken(restaurant._id, user.role) });
    }

    const waiter = await Waiter.findOne({ waiterId: normalizedIdentifier.toUpperCase() }).populate("restaurantId", "restaurantName status");
    if (waiter) {
      if (!(await bcrypt.compare(password, waiter.password))) return res.status(401).json({ message: "Invalid login credentials" });
      if (waiter.status !== "Active") return res.status(403).json({ message: "Waiter account is inactive" });
      if (waiter.restaurantId && waiter.restaurantId.status !== "Active") {
        return res.status(403).json({ message: `This restaurant is currently ${waiter.restaurantId.status || "inactive"}. Login is not allowed. Please contact the Super Admin.`, suspended: true });
      }
      const user = { id: waiter._id, waiterId: waiter.waiterId, name: waiter.name, restaurantId: waiter.restaurantId?._id, restaurantName: waiter.restaurantId?.restaurantName, role: "waiter" };
      return res.status(200).json({ role: "waiter", user, token: createToken(waiter._id, user.role) });
    }

    const manager = await Manager.findOne({ $or: [{ managerId: normalizedIdentifier.toUpperCase() }, { email: normalizedIdentifier.toLowerCase() }] }).populate("restaurantId", "restaurantName restaurantId status");
    if (manager) {
      if (!(await bcrypt.compare(password, manager.password))) return res.status(401).json({ message: "Invalid login credentials" });
      if (manager.status !== "Active") return res.status(403).json({ message: "Manager account is inactive" });
      if (manager.restaurantId && manager.restaurantId.status !== "Active") {
        return res.status(403).json({ message: `This restaurant is currently ${manager.restaurantId.status || "inactive"}. Login is not allowed. Please contact the Super Admin.`, suspended: true });
      }
      const user = { id: manager._id, managerId: manager.managerId, name: manager.name, email: manager.email, restaurantId: manager.restaurantId?._id, restaurantName: manager.restaurantId?.restaurantName, role: "manager" };
      return res.status(200).json({ role: "manager", user, token: createToken(manager._id, user.role) });
    }

    const chef = await Chef.findOne({
      $or: [
        { chefId: normalizedIdentifier.toUpperCase() },
        { email: normalizedIdentifier.toLowerCase() },
      ],
    }).populate("restaurantId", "restaurantName restaurantId status");
    if (chef) {
      if (!(await bcrypt.compare(password, chef.password))) {
        return res.status(401).json({ message: "Invalid login credentials" });
      }
      if (chef.status !== "Active") {
        return res.status(403).json({ message: "Chef account is inactive" });
      }
      if (chef.restaurantId && chef.restaurantId.status !== "Active") {
        return res.status(403).json({ message: `This restaurant is currently ${chef.restaurantId.status || "inactive"}. Login is not allowed. Please contact the Super Admin.`, suspended: true });
      }
      const user = {
        id: chef._id,
        _id: chef._id,
        chefId: chef.chefId,
        name: chef.name,
        email: chef.email,
        phone: chef.phone,
        speciality: chef.speciality,
        shift: chef.shift,
        restaurantId: chef.restaurantId?._id,
        restaurantCode: chef.restaurantId?.restaurantId,
        restaurantName: chef.restaurantId?.restaurantName,
        role: "chef",
      };
      return res.status(200).json({ role: "chef", user, token: createToken(chef._id, user.role) });
    }

    const cleaner = await Cleaner.findOne({
      $or: [
        { cleanerId: normalizedIdentifier.toUpperCase() },
        { email: normalizedIdentifier.toLowerCase() },
      ],
    }).populate("restaurantId", "restaurantName restaurantId status");
    if (cleaner) {
      if (!(await bcrypt.compare(password, cleaner.password))) {
        return res.status(401).json({ message: "Invalid login credentials" });
      }
      if (cleaner.status !== "Active") {
        return res.status(403).json({ message: "Cleaner account is inactive" });
      }
      if (cleaner.restaurantId && cleaner.restaurantId.status !== "Active") {
        return res.status(403).json({ message: `This restaurant is currently ${cleaner.restaurantId.status || "inactive"}. Login is not allowed. Please contact the Super Admin.`, suspended: true });
      }
      const user = {
        id: cleaner._id,
        _id: cleaner._id,
        cleanerId: cleaner.cleanerId,
        name: cleaner.name,
        email: cleaner.email,
        phone: cleaner.phone,
        assignedArea: cleaner.assignedArea,
        shift: cleaner.shift,
        restaurantId: cleaner.restaurantId?._id,
        restaurantCode: cleaner.restaurantId?.restaurantId,
        restaurantName: cleaner.restaurantId?.restaurantName,
        role: "cleaner",
      };
      return res.status(200).json({ role: "cleaner", user, token: createToken(cleaner._id, user.role) });
    }

    if (/^WAIT\d+$/i.test(normalizedIdentifier)) {
      return res.status(404).json({ message: "Waiter ID not found. Create this waiter from Restaurant Admin → Waiter Management first." });
    }

    if (/^CHEF\d+$/i.test(normalizedIdentifier)) {
      return res.status(404).json({ message: "Chef ID not found. Create this chef from Restaurant Admin → Staff Management first." });
    }

    if (/^CLN\d+$/i.test(normalizedIdentifier)) {
      return res.status(404).json({ message: "Cleaner ID not found. Create this cleaner from Restaurant Admin → Staff Management first." });
    }

    const admin = await Admin.findOne({ email: normalizedIdentifier.toLowerCase() });

    if (!admin || !(await admin.matchPassword(password))) {
      return res.status(401).json({ message: "Invalid login credentials" });
    }

    if (admin.role === "restaurant" || admin.restaurantId) {
      let linkedRest = null;
      if (admin.restaurantId) {
        linkedRest = await Restaurant.findById(admin.restaurantId);
      }
      if (!linkedRest && admin.restaurantCode) {
        linkedRest = await Restaurant.findOne({ restaurantId: admin.restaurantCode });
      }
      if (!linkedRest) {
        linkedRest = await Restaurant.findOne({ email: admin.email });
      }

      if (linkedRest && linkedRest.status !== "Active") {
        return res.status(403).json({ message: "Restaurant account is inactive" });
      }

      const user = {
        id: linkedRest?._id || admin._id,
        _id: linkedRest?._id || admin._id,
        name: admin.name,
        ownerName: admin.name,
        restaurantName: linkedRest?.restaurantName || admin.restaurantName || "Restaurant",
        email: admin.email,
        phone: admin.phone || linkedRest?.phone || "",
        restaurantId: linkedRest?.restaurantId || admin.restaurantCode || "",
        city: linkedRest?.city || "",
        cuisine: linkedRest?.cuisine || "",
        address: linkedRest?.address || "",
        status: linkedRest?.status || "Active",
        role: "restaurant",
      };
      return res.status(200).json({ role: "restaurant", user, token: createToken(user.id, user.role) });
    }

    const user = { id: admin._id, name: admin.name, email: admin.email, role: "admin" };
    return res.status(200).json({ role: "admin", user, token: createToken(admin._id, user.role) });
  } catch (error) {
    console.error("Unified login error:", error);
    return res.status(500).json({ message: "Unable to complete login" });
  }
};

module.exports = { login };
