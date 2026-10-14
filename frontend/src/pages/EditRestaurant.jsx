import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { API_URL } from "../config/api";
import "../App.css";

function EditRestaurant() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [formData, setFormData] = useState({
    restaurantId: "",
    restaurantName: "",
    ownerName: "",
    email: "",
    phone: "",
    city: "",
    state: "",
    pincode: "",
    cuisine: "",
    address: "",
    status: "Active",
    password: "",
  });

  // =====================================================
  // FETCH RESTAURANT
  // =====================================================

  useEffect(() => {
    const fetchRestaurant = async () => {
      try {
        setLoading(true);
        setError("");

        console.log("=================================");
        console.log("Edit Restaurant ID:", id);
        console.log("=================================");

        // ---------------------------------------------
        // Validate ID
        // ---------------------------------------------
        if (!id || id === ":id" || id === "id") {
          throw new Error("Invalid restaurant ID.");
        }

        // ---------------------------------------------
        // Get ALL restaurants
        // ---------------------------------------------
        const response = await fetch(
          `${API_URL}/restaurants`
        );

        console.log(
          "All Restaurants Status:",
          response.status
        );

        const data = await response.json();

        console.log(
          "All Restaurants Response:",
          data
        );

        if (!response.ok) {
          throw new Error(
            data.message ||
              "Failed to fetch restaurants."
          );
        }

        // The API may return the list directly or wrapped in { restaurants }.
        const restaurants = Array.isArray(data)
          ? data
          : data.restaurants;

        if (!Array.isArray(restaurants)) {
          throw new Error(
            "Restaurant list not found."
          );
        }

        // ---------------------------------------------
        // Find restaurant using MongoDB _id
        // ---------------------------------------------
        const restaurant = restaurants.find(
          (item) =>
            String(item._id) === String(id)
        );

        console.log(
          "Restaurant Found:",
          restaurant
        );

        if (!restaurant) {
          console.log(
            "Requested ID:",
            id
          );

          console.log(
            "Available IDs:",
            restaurants.map(
              (item) => item._id
            )
          );

          throw new Error(
            "Restaurant data not found for this ID."
          );
        }

        // ---------------------------------------------
        // Set form data
        // ---------------------------------------------
        setFormData({
          restaurantId:
            restaurant.restaurantId || "",

          restaurantName:
            restaurant.restaurantName || "",

          ownerName:
            restaurant.ownerName || "",

          email:
            restaurant.email || "",

          phone:
            restaurant.phone || "",

          city:
            restaurant.city || "",

          state:
            restaurant.state || "",

          pincode:
            restaurant.pincode || "",

          cuisine:
            restaurant.cuisine || "",

          address:
            restaurant.address || "",

          status:
            restaurant.status || "Active",

          // Password blank intentionally
          password: "",
        });
      } catch (err) {
        console.error(
          "Fetch Restaurant Error:",
          err
        );

        setError(
          err.message ||
            "Failed to fetch restaurant."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchRestaurant();
  }, [id]);

  // =====================================================
  // INPUT CHANGE
  // =====================================================

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // =====================================================
  // UPDATE RESTAURANT
  // =====================================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");

    try {
      setSaving(true);

      // ---------------------------------------------
      // Validate ID
      // ---------------------------------------------
      if (!id || id === ":id" || id === "id") {
        throw new Error(
          "Invalid restaurant ID."
        );
      }

      // ---------------------------------------------
      // Prepare update data
      // ---------------------------------------------
      const updateData = {
        restaurantName:
          formData.restaurantName.trim(),

        ownerName:
          formData.ownerName.trim(),

        email:
          formData.email.trim(),

        phone:
          formData.phone.trim(),

        city:
          formData.city.trim(),

        state:
          formData.state.trim(),

        pincode:
          formData.pincode.trim(),

        cuisine:
          formData.cuisine.trim(),

        address:
          formData.address.trim(),

        status:
          formData.status,
      };

      // ---------------------------------------------
      // Password only if entered
      // ---------------------------------------------
      const pwdCandidate = formData.password || formData.new_restaurant_password;
      if (
        pwdCandidate &&
        pwdCandidate.trim() !== ""
      ) {
        updateData.password =
          pwdCandidate.trim();
        updateData.newPassword =
          pwdCandidate.trim();
      }

      console.log(
        "Updating Restaurant ID:",
        id
      );

      console.log(
        "Update Data:",
        updateData
      );

      // ---------------------------------------------
      // PUT request
      // ---------------------------------------------
      const response = await fetch(
        `${API_URL}/restaurants/${id}`,
        {
          method: "PUT",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify(
            updateData
          ),
        }
      );

      console.log(
        "Update Status:",
        response.status
      );

      const data =
        await response.json();

      console.log(
        "Update Restaurant Response:",
        data
      );

      // ---------------------------------------------
      // Error response
      // ---------------------------------------------
      if (!response.ok) {
        throw new Error(
          data.message ||
            "Failed to update restaurant."
        );
      }

      // ---------------------------------------------
      // Success
      // ---------------------------------------------
      alert(
        "Restaurant updated successfully!"
      );

      navigate(
        "/superadmin/dashboard"
      );
    } catch (err) {
      console.error(
        "Update Restaurant Error:",
        err
      );

      setError(
        err.message ||
          "Failed to update restaurant."
      );
    } finally {
      setSaving(false);
    }
  };

  // =====================================================
  // LOADING
  // =====================================================

  if (loading) {
    return (
      <div className="edit-page-loading">
        <div className="loading-spinner"></div>
        <p>Loading restaurant details...</p>
      </div>
    );
  }

  // =====================================================
  // ERROR
  // =====================================================

  if (error && !formData.restaurantId) {
    return (
      <div className="edit-error-page">
        <div className="error-card">
          <h2>Unable to Load Restaurant</h2>
          <p>{error}</p>
          <button
            type="button"
            className="back-button edit-restaurant-back-btn"
            onClick={() => {
              if (window.history.length > 1) {
                navigate(-1);
              } else {
                navigate("/superadmin/dashboard");
              }
            }}
          >
            ← Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // =====================================================
  // UI
  // =====================================================

  return (
    <div className="edit-restaurant-page">
      <div className="edit-restaurant-container">
        {/* HEADER */}
        <div className="edit-page-header">
          <div>
            <span className="section-label">RESTAURANT</span>
            <h1>Edit Restaurant</h1>
            <p>Update restaurant information</p>
          </div>

          <button
            type="button"
            className="back-button edit-restaurant-back-btn"
            onClick={() => {
              if (window.history.length > 1) {
                navigate(-1);
              } else {
                navigate("/superadmin/dashboard");
              }
            }}
          >
            ← Back
          </button>
        </div>

        {/* ERROR */}
        {error && <div className="form-error">{error}</div>}

        {/* FORM */}
        <form className="edit-restaurant-form" onSubmit={handleSubmit}>
          {/* Restaurant ID */}
          <div className="form-group">
            <label>Restaurant ID</label>
            <input type="text" value={formData.restaurantId} disabled />
            <small>Restaurant ID cannot be changed.</small>
          </div>

          {/* Restaurant Name */}
          <div className="form-group">
            <label>Restaurant Name *</label>
            <input
              type="text"
              name="restaurantName"
              value={formData.restaurantName}
              onChange={handleChange}
              placeholder="Enter restaurant name"
              required
            />
          </div>

          {/* Owner Name */}
          <div className="form-group">

            <label>
              Owner Name *
            </label>

            <input
              type="text"
              name="ownerName"
              value={
                formData.ownerName
              }
              onChange={handleChange}
              placeholder="Enter owner name"
              required
            />

          </div>

          {/* Email */}
          <div className="form-group">

            <label>
              Email *
            </label>

            <input
              type="email"
              name="email"
              value={
                formData.email
              }
              onChange={handleChange}
              placeholder="Enter email"
              required
            />

          </div>

          {/* Phone */}
          <div className="form-group">

            <label>
              Phone *
            </label>

            <input
              type="tel"
              name="phone"
              value={
                formData.phone
              }
              onChange={handleChange}
              placeholder="Enter phone number"
              required
            />

          </div>

          {/* City */}
          <div className="form-group">

            <label>
              City *
            </label>

            <input
              type="text"
              name="city"
              value={
                formData.city
              }
              onChange={handleChange}
              placeholder="Enter city"
              required
            />

          </div>

          {/* State */}
          <div className="form-group">

            <label>
              State
            </label>

            <input
              type="text"
              name="state"
              value={
                formData.state
              }
              onChange={handleChange}
              placeholder="Enter state"
            />

          </div>

          {/* Pincode */}
          <div className="form-group">

            <label>
              Pincode
            </label>

            <input
              type="text"
              name="pincode"
              value={
                formData.pincode
              }
              onChange={handleChange}
              placeholder="Enter pincode"
            />

          </div>

          {/* Cuisine */}
          <div className="form-group">

            <label>
              Cuisine
            </label>

            <select
              name="cuisine"
              value={
                formData.cuisine
              }
              onChange={handleChange}
            >

              <option value="">
                Select Cuisine
              </option>

              <option value="Indian">
                Indian
              </option>

              <option value="Chinese">
                Chinese
              </option>

              <option value="Italian">
                Italian
              </option>

              <option value="Multi Cuisine">
                Multi Cuisine
              </option>

              <option value="Fast Food">
                Fast Food
              </option>

            </select>

          </div>

          {/* Address */}
          <div className="form-group">

            <label>
              Address *
            </label>

            <textarea
              name="address"
              value={
                formData.address
              }
              onChange={handleChange}
              placeholder="Enter complete restaurant address"
              rows="4"
              required
            />

          </div>

          {/* Status */}
          <div className="form-group">

            <label>
              Restaurant Status
            </label>

            <select
              name="status"
              value={
                formData.status
              }
              onChange={handleChange}
            >

              <option value="Active">
                Active
              </option>

              <option value="Inactive">
                Inactive
              </option>

            </select>

          </div>

          {/* Password */}
          <div className="form-group">
            <label>
              New Password
            </label>
            <div style={{ position: "relative", display: "flex", gap: "8px", alignItems: "center" }}>
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                autoComplete="new-password"
                value={
                  formData.password || formData.new_restaurant_password || ""
                }
                onChange={handleChange}
                placeholder="Enter new password"
                style={{ flex: 1 }}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                title={showPassword ? "Hide password" : "Show password"}
                style={{
                  padding: "0 14px",
                  height: "44px",
                  border: "1.5px solid #e2e8f0",
                  borderRadius: "8px",
                  background: "#f8fafc",
                  cursor: "pointer",
                  fontSize: "13px",
                  color: "#475569",
                  fontWeight: "600",
                  whiteSpace: "nowrap",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  transition: "all 0.2s ease",
                  flexShrink: 0,
                }}
              >
                {showPassword ? (
                  <>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                      <line x1="1" y1="1" x2="23" y2="23"></line>
                    </svg>
                    <span>Hide</span>
                  </>
                ) : (
                  <>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                      <circle cx="12" cy="12" r="3"></circle>
                    </svg>
                    <span>Show</span>
                  </>
                )}
              </button>
            </div>
            <small style={{ marginTop: "6px", display: "block" }}>
              Leave blank to keep the current password.
            </small>
          </div>

          {/* BUTTONS */}
          <div className="edit-form-actions">

            <button
              type="button"
              className="cancel-button"
              onClick={() =>
                navigate(
                  "/superadmin/dashboard"
                )
              }
            >
              Cancel
            </button>

            <button
              type="submit"
              className="save-button"
              disabled={saving}
            >
              {saving
                ? "Saving..."
                : "Save Changes"}
            </button>

          </div>

        </form>

      </div>

    </div>
  );
}

export default EditRestaurant;
