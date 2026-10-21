const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const mongoose = require("mongoose");

const connectDB = require("./config/db");

// Routes
const authRoutes = require("./routes/authRoutes");
const menuRoutes = require("./routes/menuRoutes");
const restaurantRoutes = require("./routes/restaurantRoutes");
const superAdminRoutes = require("./routes/superAdminRoutes");
const adminRoutes = require("./routes/adminRoutes");
const orderRoutes = require("./routes/orderRoutes");
const waiterRoutes = require("./routes/waiterRoutes");
const managerRoutes = require("./routes/managerRoutes");

// =====================================================
// Environment Variables
// =====================================================

dotenv.config();

// =====================================================
// Express App
// =====================================================

const app = express();

// =====================================================
// Middleware
// =====================================================

// Allow frontend requests
const allowedOrigins = [
  process.env.FRONTEND_URL,
  "http://localhost:5173",
  "http://localhost:5174",
  "http://127.0.0.1:5173",
  "http://127.0.0.1:5174",
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (
        allowedOrigins.includes(origin) ||
        origin.endsWith(".vercel.app") ||
        process.env.NODE_ENV !== "production"
      ) {
        return callback(null, true);
      }
      return callback(null, true);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  })
);

// Read JSON request body
app.use(express.json());
app.use("/uploads", express.static(require("path").join(__dirname, "uploads")));

// Ensure MongoDB connection (especially in serverless environments like Vercel)
app.use(async (req, res, next) => {
  if (mongoose.connection.readyState !== 1) {
    try {
      await connectDB();
    } catch (err) {
      console.error("MongoDB connection error in middleware:", err.message);
    }
  }
  next();
});

// =====================================================
// Home Route
// =====================================================

app.get("/", (req, res) => {
  res.status(200).json({
    message: "Restaurant Management Backend is running!",
  });
});

// =====================================================
// Health Check
// =====================================================

app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok", uptime: process.uptime() });
});

app.get("/api/health", (req, res) => {
  const databaseConnected = mongoose.connection.readyState === 1;

  res.status(databaseConnected ? 200 : 503).json({
    status: databaseConnected ? "ok" : "degraded",
    database: databaseConnected ? "connected" : "disconnected",
  });
});

// =====================================================
// Authentication Routes
// =====================================================

// POST /api/auth/login
app.use("/api/auth", authRoutes);

// =====================================================
// Menu Routes
// =====================================================

// GET  /api/menu
// POST /api/menu
// GET  /api/menu/modifiers
// POST /api/menu/modifiers
// DELETE /api/menu/modifiers/:id

app.use("/api/menu", menuRoutes);

// =====================================================
// Restaurant Routes
// =====================================================

// POST   /api/restaurants
// POST   /api/restaurants/add
// GET    /api/restaurants
// POST   /api/restaurants/login
// GET    /api/restaurants/:id
// PUT    /api/restaurants/:id
// DELETE /api/restaurants/:id

app.use("/api/restaurants", restaurantRoutes);

// =====================================================
// Super Admin Routes
// =====================================================

// POST /api/superadmin/login
// Other Super Admin routes

app.use("/api/superadmin", superAdminRoutes);

// =====================================================
// Admin Routes
// =====================================================

// Admin related routes

app.use("/api/admin", adminRoutes);

// Customer table orders from QR menu checkout
app.use("/api/orders", orderRoutes);

// =====================================================
// Waiter Routes
// =====================================================

// POST /api/waiters/create
// POST /api/waiters/login
// GET  /api/waiters/profile/:id
// GET  /api/waiters/restaurant/:restaurantId

app.use("/api/waiters", waiterRoutes);
app.use("/api/managers", managerRoutes);
app.use("/api/chefs", require("./routes/chefRoutes"));
app.use("/api/cleaners", require("./routes/cleanerRoutes"));
app.use("/api/tables", require("./routes/tableRoutes"));
app.use("/api/reservations", require("./routes/reservationRoutes"));
app.get("/api/network-ip", (req, res) => {
  const { getLocalIpAddress } = require("./routes/tableRoutes");
  const localIp = getLocalIpAddress();
  res.json({
    success: true,
    localIp,
    frontendPort: 5173,
    backendPort: 5001,
    networkBaseUrl: `http://${localIp}:5173`,
  });
});

// =====================================================
// 404 - Route Not Found
// =====================================================

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "API route not found",
    path: req.originalUrl,
    method: req.method,
  });
});

// =====================================================
// Global Error Handler
// =====================================================

app.use((err, req, res, next) => {
  console.error("Server Error:", err);

  res.status(500).json({
    success: false,
    message: "Internal server error",
    error: process.env.NODE_ENV === "development"
      ? err.message
      : undefined,
  });
});

// =====================================================
// Server Port
// =====================================================

const PORT = process.env.PORT || 5000;

// =====================================================
// Start Server
// =====================================================

const startServer = async () => {
  try {
    // Connect MongoDB
    const connected = await connectDB();

    if (connected) {
      console.log("MongoDB connected successfully.");
    } else {
      console.warn("The API is running without MongoDB.");
    }

    // Start Express Server
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });

    // Retry MongoDB connection if disconnected
    if (!connected) {
      setInterval(async () => {
        if (mongoose.connection.readyState === 0) {
          console.log("Trying to reconnect MongoDB...");

          try {
            await connectDB();
          } catch (error) {
            console.error("MongoDB reconnect failed:", error.message);
          }
        }
      }, 30000);
    }
  } catch (error) {
    console.error("Server startup error:", error);
  }
};

// =====================================================
// Start Application
// =====================================================

if (!process.env.VERCEL) {
  startServer();
}

module.exports = app;
