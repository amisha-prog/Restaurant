// ==========================================
// Super Admin Login
// ==========================================

const superAdminLogin = async (req, res) => {
  try {
    const { superAdminId, password } = req.body;

    // ===============================
    // Check Required Fields
    // ===============================
    if (!superAdminId || !password) {
      return res.status(400).json({
        message: "Please enter Super Admin ID and Password",
      });
    }

    // ===============================
    // Super Admin Credentials
    // ===============================
    const ADMIN_ID = "superadmin";
    const ADMIN_PASSWORD = "123456";

    // ===============================
    // Check Login
    // ===============================
    if (
      superAdminId.trim() !== ADMIN_ID ||
      password !== ADMIN_PASSWORD
    ) {
      return res.status(401).json({
        message: "Invalid Super Admin ID or Password",
      });
    }

    // ===============================
    // Login Successful
    // ===============================
    return res.status(200).json({
      message: "Super Admin login successful",

      superAdmin: {
        id: "superadmin",
        name: "Super Admin",
        role: "Administrator",
      },
    });
  } catch (error) {
    console.error("Super Admin Login Error:", error);

    return res.status(500).json({
      message: "Super Admin login failed",
      error: error.message,
    });
  }
};

module.exports = {
  superAdminLogin,
};