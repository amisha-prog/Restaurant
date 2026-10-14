import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { API_URL } from "../config/api";
import "./AddRestaurant.css";

const AddRestaurant = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    restaurantName: "",
    ownerName: "",
    email: "",
    phone: "",
    cuisine: "",
    password: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [createdData, setCreatedData] = useState(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [copied, setCopied] = useState(false);

  // ===============================
  // Generate Strong 8-char Password
  // ===============================
  const generateStrongPassword = () => {
    const upper = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const lower = "abcdefghijklmnopqrstuvwxyz";
    const numbers = "0123456789";
    const special = "@#$!%*?&";
    const all = upper + lower + numbers + special;

    const chars = [
      upper[Math.floor(Math.random() * upper.length)],
      lower[Math.floor(Math.random() * lower.length)],
      numbers[Math.floor(Math.random() * numbers.length)],
      special[Math.floor(Math.random() * special.length)],
    ];

    for (let i = 4; i < 8; i++) {
      chars.push(all[Math.floor(Math.random() * all.length)]);
    }

    // Fisher-Yates Shuffle algorithm for true randomness
    for (let i = chars.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [chars[i], chars[j]] = [chars[j], chars[i]];
    }

    return chars.join("");
  };

  const handleGeneratePassword = () => {
    const newPwd = generateStrongPassword();
    setFormData((prev) => ({ ...prev, password: newPwd }));
    setCopied(false);
  };

  const handleCopyPassword = () => {
    if (formData.password) {
      navigator.clipboard.writeText(formData.password);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // ===============================
  // Input Change
  // ===============================
  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // ===============================
  // Submit Form
  // ===============================
  const handleSubmit = async (e) => {
    e.preventDefault();

    setMessage("");
    setError("");
    setCreatedData(null);

    // ===============================
    // Basic Validation
    // ===============================
    if (
      !formData.restaurantName.trim() ||
      !formData.ownerName.trim() ||
      !formData.email.trim() ||
      !formData.phone.trim() ||
      !formData.cuisine.trim() ||
      !formData.password.trim() ||
      !formData.address.trim() ||
      !formData.city.trim()
    ) {
      setError("Please fill all required fields.");
      return;
    }

    // Password Validation: 8+ chars, Uppercase, Lowercase, Number, Special Char
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@#$!%*?&]).{8,}$/;
    if (!passwordRegex.test(formData.password)) {
      setError(
        "Password must be at least 8 characters long and contain at least 1 uppercase letter, 1 lowercase letter, 1 number, and 1 special character (@#$!%*?&)."
      );
      return;
    }

    try {
      setLoading(true);

      // ===============================
      // API Request
      // ===============================
      const response = await fetch(`${API_URL}/restaurants/add`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Failed to create restaurant.");
        return;
      }

      // ===============================
      // Success
      // ===============================
      setCreatedData({
        restaurantName: data.restaurant?.restaurantName || formData.restaurantName,
        restaurantId: data.restaurant?.restaurantId || "Generated",
        ownerName: data.restaurant?.ownerName || formData.ownerName,
        email: data.restaurant?.email || formData.email,
        phone: data.restaurant?.phone || formData.phone,
      });

      setShowSuccessModal(true);

      setMessage(
        `Restaurant "${data.restaurant?.restaurantName || formData.restaurantName}" & Admin Account created successfully!`
      );

      // ===============================
      // Clear Form
      // ===============================
      setFormData({
        restaurantName: "",
        ownerName: "",
        email: "",
        phone: "",
        cuisine: "",
        password: "",
        address: "",
        city: "",
        state: "",
        pincode: "",
      });
    } catch (err) {
      console.error("Create Restaurant Error:", err);
      setError(
        "Unable to connect with server. Please make sure backend server is running."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="add-restaurant-page">
      {/* ===============================
          Header
      =============================== */}
      <div className="add-restaurant-header">
        <div>
          <h1>Add Restaurant</h1>
          <p>Create a new restaurant and restaurant admin account</p>
        </div>

        <button
          type="button"
          className="back-button"
          onClick={() => navigate("/superadmin/dashboard")}
        >
          ← Back to Dashboard
        </button>
      </div>

      {/* ===============================
          Form Card
      =============================== */}
      <div className="restaurant-form-card">
        <form onSubmit={handleSubmit} autoComplete="off">
          {/* ===============================
              Restaurant Information
          =============================== */}
          <div className="form-section">
            <div className="section-title">
              <h2>Restaurant Information</h2>
              <p>Enter basic restaurant details</p>
            </div>

            <div className="form-grid">
              {/* Restaurant Name */}
              <div className="form-group">
                <label>
                  Restaurant Name <span>*</span>
                </label>
                <input
                  type="text"
                  name="restaurantName"
                  value={formData.restaurantName}
                  onChange={handleChange}
                  placeholder="Enter restaurant name"
                  autoComplete="off"
                  required
                />
              </div>

              {/* Owner Name */}
              <div className="form-group">
                <label>
                  Owner Name (Admin) <span>*</span>
                </label>
                <input
                  type="text"
                  name="ownerName"
                  value={formData.ownerName}
                  onChange={handleChange}
                  placeholder="Enter owner/admin name"
                  autoComplete="off"
                  required
                />
              </div>

              {/* Email */}
              <div className="form-group">
                <label>
                  Email Address (Login ID) <span>*</span>
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="admin@restaurant.com"
                  autoComplete="off"
                  required
                />
              </div>

              {/* Phone */}
              <div className="form-group">
                <label>
                  Phone Number <span>*</span>
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="e.g. +91 98765 43210"
                  autoComplete="off"
                  required
                />
              </div>

              {/* Cuisine */}
              <div className="form-group">
                <label>
                  Cuisine <span>*</span>
                </label>
                <input
                  type="text"
                  name="cuisine"
                  value={formData.cuisine}
                  onChange={handleChange}
                  placeholder="e.g. Indian, Chinese, Italian"
                  autoComplete="off"
                  required
                />
              </div>
            </div>
          </div>

          {/* ===============================
              Login Information
          =============================== */}
          <div className="form-section">
            <div className="section-title">
              <h2>Restaurant Admin Login</h2>
              <p>These credentials will be used by the restaurant admin to sign in</p>
            </div>

            <div className="form-grid">
              <div className="form-group full-width">
                <label style={{ color: "#374151", marginBottom: "7px", fontSize: "12px", fontWeight: "600", display: "block" }}>
                  Login Password <span style={{ color: "#dc2626" }}>*</span>
                </label>
                <div style={{ position: "relative", display: "flex", gap: "8px" }}>
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Min 8 chars with uppercase, number & special char"
                    autoComplete="new-password"
                    required
                    style={{ flex: 1 }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(v => !v)}
                    style={{
                      padding: "0 12px",
                      border: "1.5px solid #e2e8f0",
                      borderRadius: "8px",
                      background: "#f8fafc",
                      cursor: "pointer",
                      fontSize: "13px",
                      color: "#475569",
                      fontWeight: "600",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                  <button
                    type="button"
                    onClick={handleCopyPassword}
                    style={{
                      padding: "0 12px",
                      border: "1.5px solid #e2e8f0",
                      borderRadius: "8px",
                      background: copied ? "#dcfce7" : "#f8fafc",
                      cursor: "pointer",
                      fontSize: "13px",
                      color: copied ? "#16a34a" : "#475569",
                      fontWeight: "600",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {copied ? "✓ Copied!" : "📋 Copy"}
                  </button>
                </div>
                {formData.password && (
                  <div style={{ marginTop: "6px", fontSize: "12px", color: "#64748b" }}>
                    💡 Strength: {/^(?=.*[A-Z])(?=.*[a-z])(?=.*[0-9])(?=.*[@#$!%*?&]).{8,}$/.test(formData.password)
                      ? <span style={{ color: "#16a34a", fontWeight: 700 }}>✅ Strong</span>
                      : <span style={{ color: "#dc2626", fontWeight: 700 }}>❌ Weak (needs uppercase, number & special char)</span>
                    }
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ===============================
              Address Information
          =============================== */}
          <div className="form-section">
            <div className="section-title">
              <h2>Restaurant Address</h2>
              <p>Enter restaurant location details</p>
            </div>

            <div className="form-grid">
              {/* Address */}
              <div className="form-group full-width">
                <label>
                  Address <span>*</span>
                </label>
                <textarea
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="Enter complete restaurant address"
                  rows="3"
                  required
                />
              </div>

              {/* City */}
              <div className="form-group">
                <label>
                  City <span>*</span>
                </label>
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  placeholder="Enter city"
                  required
                />
              </div>

              {/* State */}
              <div className="form-group">
                <label>State</label>
                <input
                  type="text"
                  name="state"
                  value={formData.state}
                  onChange={handleChange}
                  placeholder="Enter state"
                />
              </div>

              {/* Pincode */}
              <div className="form-group">
                <label>Pincode</label>
                <input
                  type="text"
                  name="pincode"
                  value={formData.pincode}
                  onChange={handleChange}
                  placeholder="Enter pincode"
                />
              </div>
            </div>
          </div>

          {/* ===============================
              Error Message
          =============================== */}
          {error && <div className="form-error">⚠️ {error}</div>}

          {/* ===============================
              Success Message & Admin Details
          =============================== */}
          {createdData && (
            <div className="admin-created-success-card">
              <div className="admin-success-header">
                <span className="success-icon">🎉</span>
                <div>
                  <h3>Restaurant & Admin Account Created!</h3>
                  <p>Restaurant and its dedicated Administrator account are now active in the system.</p>
                </div>
              </div>

              <div className="admin-cred-grid">
                <div className="cred-item">
                  <label>Restaurant Name</label>
                  <strong>{createdData.restaurantName}</strong>
                </div>
                <div className="cred-item">
                  <label>Restaurant ID</label>
                  <span className="cred-badge rest-id">🆔 {createdData.restaurantId}</span>
                </div>
                <div className="cred-item">
                  <label>Admin Owner Name</label>
                  <strong>👤 {createdData.ownerName}</strong>
                </div>
                <div className="cred-item">
                  <label>Admin Login Email</label>
                  <span className="cred-badge rest-email">✉️ {createdData.email}</span>
                </div>
              </div>

              <div className="admin-login-hint">
                💡 <strong>Admin Sign-In:</strong> The restaurant owner can now log in using either their <strong>Restaurant ID ({createdData.restaurantId})</strong> or <strong>Email ({createdData.email})</strong> with the password you just configured.
              </div>
            </div>
          )}

          {message && !createdData && <div className="form-success">{message}</div>}

          {/* ===============================
              Buttons
          =============================== */}
          <div className="form-actions">
            <button
              type="button"
              className="cancel-button"
              onClick={() => navigate("/superadmin/dashboard")}
            >
              Cancel
            </button>

            <button
              type="submit"
              className="create-button"
              disabled={loading}
            >
              {loading ? "Creating Restaurant & Admin..." : "Create Restaurant & Admin"}
            </button>
          </div>
        </form>
      </div>

      {/* ===============================
          Success Popup Modal
      =============================== */}
      {showSuccessModal && createdData && (
        <div className="restaurant-success-modal-backdrop" onClick={() => setShowSuccessModal(false)}>
          <div className="restaurant-success-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="success-modal-header">
              <div className="success-modal-badge">
                <span>✓</span>
              </div>
              <h2>Restaurant Created Successfully!</h2>
              <p>Restaurant and its Admin Account are now active in the system.</p>
            </div>

            <div className="success-modal-body">
              <div className="modal-info-grid">
                <div className="modal-info-box">
                  <span className="info-label">Restaurant Name</span>
                  <strong className="info-val">{createdData.restaurantName}</strong>
                </div>
                <div className="modal-info-box">
                  <span className="info-label">Restaurant ID</span>
                  <span className="info-badge id-badge">🆔 {createdData.restaurantId}</span>
                </div>
                <div className="modal-info-box">
                  <span className="info-label">Admin Owner Name</span>
                  <strong className="info-val">👤 {createdData.ownerName}</strong>
                </div>
                <div className="modal-info-box">
                  <span className="info-label">Admin Email (Login ID)</span>
                  <span className="info-badge email-badge">✉️ {createdData.email}</span>
                </div>
              </div>

              <div className="modal-login-notice">
                💡 <strong>Admin Sign-In:</strong> The restaurant owner can now log in using either <strong>Restaurant ID ({createdData.restaurantId})</strong> or <strong>Email ({createdData.email})</strong> with the password configured.
              </div>
            </div>

            <div className="success-modal-footer">
              <button
                type="button"
                className="modal-btn-add-more"
                onClick={() => {
                  setShowSuccessModal(false);
                  setCreatedData(null);
                }}
              >
                + Add Another Restaurant
              </button>
              <button
                type="button"
                className="modal-btn-dashboard"
                onClick={() => navigate("/superadmin/dashboard")}
              >
                Go to Dashboard →
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AddRestaurant;
