const express = require("express");

const router = express.Router();

const {
  superAdminLogin,
} = require("../controllers/superAdminController");

// ===============================
// Super Admin Login
// ===============================
router.post("/login", superAdminLogin);

module.exports = router;