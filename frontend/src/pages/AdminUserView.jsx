import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { API_URL } from "../config/api";
import "./AdminUserView.css";

export default function AdminUserView() {
  const { restaurantId } = useParams();
  const navigate = useNavigate();
  const [restaurant, setRestaurant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      // Try fetching restaurant directly
      let res = await fetch(`${API_URL}/restaurants/${restaurantId}`);
      let result = await res.json();

      if (res.ok && (result.restaurant || result._id)) {
        setRestaurant(result.restaurant || result);
        return;
      }

      // Fallback to dashboard endpoint which also provides restaurant object
      res = await fetch(`${API_URL}/restaurants/${restaurantId}/dashboard`);
      result = await res.json();

      if (res.ok && result.restaurant) {
        setRestaurant(result.restaurant);
      } else {
        throw new Error(result.message || "Unable to load restaurant details.");
      }
    } catch (err) {
      setError(err.message || "Failed to load restaurant details.");
    } finally {
      setLoading(false);
    }
  }, [restaurantId]);

  useEffect(() => {
    load();
  }, [load]);

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate("/superadmin/dashboard");
    }
  };

  if (loading && !restaurant) {
    return (
      <div className="auv-loading">
        <div className="auv-spinner" />
        <p>Loading restaurant details…</p>
      </div>
    );
  }

  if (error && !restaurant) {
    return (
      <div className="auv-error-state">
        <span>⚠️</span>
        <p>{error}</p>
        <button onClick={handleBack}>← Go Back</button>
      </div>
    );
  }

  return (
    <div className="auv-layout">
      <aside className="auv-sidebar">
        <div className="auv-sidebar-brand">
          <div className="auv-brand-icon">🏪</div>
          <div>
            <h2>Super Admin</h2>
            <span>Restaurant View</span>
          </div>
        </div>

        <div className="auv-sidebar-profile">
          <div className="auv-profile-avatar">
            {restaurant?.restaurantName?.charAt(0)?.toUpperCase() || "R"}
          </div>
          <div className="auv-profile-info">
            <strong>{restaurant?.restaurantName || "Restaurant"}</strong>
            <small>{restaurant?.restaurantId || "—"}</small>
            <small className="auv-tag">{restaurant?.ownerName || "Owner"}</small>
          </div>
        </div>

        <nav className="auv-nav">
          <button className="auv-nav-btn auv-nav-active">
            <span className="auv-nav-icon">📋</span>Details
          </button>
        </nav>

        <div className="auv-sidebar-footer">
          <button className="auv-back-btn" onClick={handleBack}>← Back to Admin</button>
          <button className="auv-refresh-btn" onClick={load}>🔄 Refresh</button>
        </div>
      </aside>

      <main className="auv-main">
        <header className="auv-header">
          <div className="auv-header-left">
            <h1>{restaurant?.restaurantName || "Restaurant"}</h1>
            <p>
              {restaurant?.restaurantId || "—"}
              {restaurant?.city ? ` · ${restaurant.city}` : ""}
              {restaurant?.state ? `, ${restaurant.state}` : ""}
            </p>
          </div>
          <div className="auv-header-right">
            <button className="auv-back-header-btn" onClick={handleBack}>← Back to Dashboard</button>
            <button className="auv-refresh-header-btn" onClick={load}>🔄 Refresh</button>
          </div>
        </header>

        {error && <div className="auv-error-banner">⚠️ {error}</div>}

        <div className="auv-content">
          {/* Structured Details Grid */}
          <div className="auv-basic-details-grid">
            {/* 1. Restaurant Profile */}
            <div className="auv-detail-card">
              <div className="auv-detail-card-header">
                <span className="auv-detail-icon">🏢</span>
                <h4>Restaurant Information</h4>
              </div>
              <div className="auv-detail-list">
                <div className="auv-detail-item">
                  <span className="auv-detail-label">Restaurant Name</span>
                  <strong className="auv-detail-value">{restaurant?.restaurantName || "—"}</strong>
                </div>
                <div className="auv-detail-item">
                  <span className="auv-detail-label">Restaurant ID</span>
                  <span className="auv-info-id">{restaurant?.restaurantId || "—"}</span>
                </div>
                <div className="auv-detail-item">
                  <span className="auv-detail-label">Cuisine Type</span>
                  <strong className="auv-detail-value">{restaurant?.cuisine || "Not specified"}</strong>
                </div>
                <div className="auv-detail-item">
                  <span className="auv-detail-label">Current Status</span>
                  <span
                    className={`auv-restaurant-status ${
                      restaurant?.status?.toLowerCase() !== "inactive"
                        ? "auv-dot-active"
                        : "auv-dot-inactive"
                    }`}
                  >
                    {restaurant?.status?.toLowerCase() !== "inactive" ? "Active" : "Inactive"}
                  </span>
                </div>
              </div>
            </div>

            {/* 2. Owner & Contact */}
            <div className="auv-detail-card">
              <div className="auv-detail-card-header">
                <span className="auv-detail-icon">👤</span>
                <h4>Owner & Contact</h4>
              </div>
              <div className="auv-detail-list">
                <div className="auv-detail-item">
                  <span className="auv-detail-label">Owner Name</span>
                  <strong className="auv-detail-value">{restaurant?.ownerName || "—"}</strong>
                </div>
                <div className="auv-detail-item">
                  <span className="auv-detail-label">Email Address</span>
                  <strong className="auv-detail-value">{restaurant?.email || "—"}</strong>
                </div>
                <div className="auv-detail-item">
                  <span className="auv-detail-label">Phone Number</span>
                  <strong className="auv-detail-value">{restaurant?.phone || "—"}</strong>
                </div>
                <div className="auv-detail-item">
                  <span className="auv-detail-label">Account Role</span>
                  <strong className="auv-detail-value">Restaurant Admin</strong>
                </div>
              </div>
            </div>

            {/* 3. Location & Address */}
            <div className="auv-detail-card">
              <div className="auv-detail-card-header">
                <span className="auv-detail-icon">📍</span>
                <h4>Address & Location</h4>
              </div>
              <div className="auv-detail-list">
                <div className="auv-detail-item">
                  <span className="auv-detail-label">Street Address</span>
                  <strong className="auv-detail-value">{restaurant?.address || "—"}</strong>
                </div>
                <div className="auv-detail-item">
                  <span className="auv-detail-label">City</span>
                  <strong className="auv-detail-value">{restaurant?.city || "—"}</strong>
                </div>
                <div className="auv-detail-item">
                  <span className="auv-detail-label">State</span>
                  <strong className="auv-detail-value">{restaurant?.state || "—"}</strong>
                </div>
                <div className="auv-detail-item">
                  <span className="auv-detail-label">Pincode</span>
                  <strong className="auv-detail-value">{restaurant?.pincode || "—"}</strong>
                </div>
              </div>
            </div>

            {/* 4. Registration & Meta */}
            <div className="auv-detail-card">
              <div className="auv-detail-card-header">
                <span className="auv-detail-icon">📅</span>
                <h4>Registration & System</h4>
              </div>
              <div className="auv-detail-list">
                <div className="auv-detail-item">
                  <span className="auv-detail-label">Registered On</span>
                  <strong className="auv-detail-value">
                    {restaurant?.createdAt
                      ? new Date(restaurant.createdAt).toLocaleDateString("en-IN", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric"
                        })
                      : "—"}
                  </strong>
                </div>
                <div className="auv-detail-item">
                  <span className="auv-detail-label">System DB ID</span>
                  <code className="auv-code">{restaurant?._id || "—"}</code>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
