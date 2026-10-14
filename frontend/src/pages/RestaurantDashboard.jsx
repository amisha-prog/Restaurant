import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../App.css";

function RestaurantDashboard() {
  const navigate = useNavigate();

  const [restaurant, setRestaurant] = useState(null);
  const [showProfileModal, setShowProfileModal] = useState(false);

  useEffect(() => {
    const storedRestaurant = localStorage.getItem("restaurantAdmin");

    if (!storedRestaurant) {
      navigate("/restaurant/login");
      return;
    }

    try {
      const data = JSON.parse(storedRestaurant);
      setRestaurant(data);
    } catch (error) {
      console.error("Restaurant data error:", error);
      localStorage.removeItem("restaurantAdmin");
      navigate("/restaurant/login");
    }
  }, [navigate]);

  // ===============================
  // Logout
  // ===============================
  const handleLogout = () => {
    localStorage.removeItem("restaurantAdmin");
    navigate("/restaurant/login");
  };

  if (!restaurant) {
    return (
      <div className="restaurant-dashboard-loading">
        <div className="dashboard-spinner"></div>
        <p>Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="restaurant-dashboard">

      {/* ===============================
          SIDEBAR
      =============================== */}
      <aside className="restaurant-sidebar">

        {/* Logo */}
        <div className="restaurant-sidebar-logo">
          <div className="restaurant-logo-icon">
            🍽️
          </div>

          <div>
            <h2>Restaurant</h2>
            <span>Management</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="restaurant-navigation">

          <p className="navigation-title">
            MAIN MENU
          </p>

          <button className="restaurant-nav-item active">
            <span className="nav-icon">▦</span>
            <span>Dashboard</span>
          </button>

          <button
            className="restaurant-nav-item"
            onClick={() => alert("Orders section coming soon")}
          >
            <span className="nav-icon">🛒</span>
            <span>Orders</span>
            <span className="nav-badge">0</span>
          </button>

          <button
            className="restaurant-nav-item"
            onClick={() => alert("Menu section coming soon")}
          >
            <span className="nav-icon">🍴</span>
            <span>Menu</span>
          </button>

          <button
            className="restaurant-nav-item"
            onClick={() => navigate("/restaurant/qr-management")}
          >
            <span className="nav-icon">👥</span>
            <span>QR Management</span>
          </button>

          <p className="navigation-title navigation-title-space">
            MANAGEMENT
          </p>

          <button
            className="restaurant-nav-item"
            onClick={() => alert("Reports section coming soon")}
          >
            <span className="nav-icon">📊</span>
            <span>Reports</span>
          </button>

          <button
            className="restaurant-nav-item"
            onClick={() => alert("Settings section coming soon")}
          >
            <span className="nav-icon">⚙️</span>
            <span>Settings</span>
          </button>

        </nav>

        {/* Sidebar Bottom */}
        <div className="restaurant-sidebar-bottom">

          <div className="restaurant-user-mini">

            <div className="restaurant-user-avatar">
              {restaurant.restaurantName
                ?.charAt(0)
                .toUpperCase() || "R"}
            </div>

            <div className="restaurant-user-info">
              <strong>
                {restaurant.restaurantName || "Restaurant"}
              </strong>

              <span>
                Restaurant Admin
              </span>
            </div>

          </div>

          <button
            className="restaurant-sidebar-logout"
            onClick={handleLogout}
          >
            <span>↪</span>
            Logout
          </button>

        </div>

      </aside>

      {/* ===============================
          MAIN CONTENT
      =============================== */}
      <main className="restaurant-main">

        {/* ===============================
            TOP HEADER
        =============================== */}
        <header className="restaurant-top-header">

          <div className="restaurant-header-left" style={{ display: 'flex', alignItems: 'center', gap: '15px', flex: 1, overflow: 'hidden' }}>
            <div className="mobile-only-logo" style={{ fontSize: "28px", display: "flex", alignItems: "center" }}>
              🍽️
            </div>
            <div style={{ display: "flex", flexDirection: "column", overflow: "hidden" }}>
              <span className="restaurant-page-label">
                RESTAURANT ADMIN
              </span>
              <h1 style={{ margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>Dashboard</h1>
              <p style={{ margin: 0 }}>
                Manage your restaurant from one place
              </p>
            </div>
          </div>

          <div className="restaurant-header-right" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>

            <div className="restaurant-status-indicator">
              <span className="online-dot"></span>
              {restaurant.status || "Active"}
            </div>

            <button className="notification-icon" title="Notifications" style={{ width: "40px", height: "40px", borderRadius: "50%", border: "none", background: "#f3f4f6", cursor: "pointer", fontSize: "17px", position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
              🔔
              <span style={{ position: "absolute", top: "-2px", right: "-2px", background: "#ef4444", color: "white", fontSize: "10px", fontWeight: "bold", padding: "2px 5px", borderRadius: "10px" }}>0</span>
            </button>

            <div 
              className="header-profile clickable-profile"
              onClick={() => setShowProfileModal(true)}
              title="Click to view restaurant admin profile"
              role="button"
              tabIndex={0}
              onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") setShowProfileModal(true); }}
              style={{ display: "flex", alignItems: "center", gap: "10px" }}
            >

              <div className="header-profile-avatar">
                {restaurant.restaurantName
                  ?.charAt(0)
                  .toUpperCase() || "R"}
              </div>

              <div className="header-profile-info">
                <strong>
                  {restaurant.ownerName || "Admin"}
                </strong>

                <span>
                  {restaurant.restaurantId || "Restaurant"}
                </span>
              </div>

              <span className="profile-dropdown-arrow" style={{ fontSize: "9px", color: "#8a94a6", marginLeft: "4px" }}>▼</span>

            </div>

          </div>

        </header>

        {/* ===============================
            WELCOME BANNER
        =============================== */}
        <section className="restaurant-welcome-banner">

          <div className="welcome-content">

            <span className="welcome-small">
              GOOD DAY 👋
            </span>

            <h2>
              Welcome, {restaurant.ownerName || "Admin"}!
            </h2>

            <p>
              Here's what's happening with your restaurant today.
            </p>

          </div>

          <div className="welcome-restaurant">

            <div className="welcome-restaurant-icon">
              🍽️
            </div>

            <div>
              <strong>
                {restaurant.restaurantName}
              </strong>

              <span>
                {restaurant.city} • {restaurant.cuisine}
              </span>
            </div>

          </div>

        </section>

        {/* ===============================
            STATISTICS
        =============================== */}
        <section className="restaurant-statistics">

          {/* Orders */}
          <div className="restaurant-stat-card">

            <div className="stat-card-top">
              <div className="stat-icon stat-icon-blue">
                🛒
              </div>

              <span className="stat-growth">
                +0%
              </span>
            </div>

            <div className="stat-card-content">
              <span>Total Orders</span>
              <h2>0</h2>
              <small>
                Orders received
              </small>
            </div>

          </div>

          {/* Revenue */}
          <div className="restaurant-stat-card">

            <div className="stat-card-top">
              <div className="stat-icon stat-icon-green">
                ₹
              </div>

              <span className="stat-growth">
                +0%
              </span>
            </div>

            <div className="stat-card-content">
              <span>Total Revenue</span>
              <h2>₹0</h2>
              <small>
                Total earnings
              </small>
            </div>

          </div>

          {/* Customers */}
          <div className="restaurant-stat-card">

            <div className="stat-card-top">
              <div className="stat-icon stat-icon-purple">
                👥
              </div>

              <span className="stat-growth">
                +0%
              </span>
            </div>

            <div className="stat-card-content">
              <span>Total Customers</span>
              <h2>0</h2>
              <small>
                Registered customers
              </small>
            </div>

          </div>

          {/* Menu */}
          <div className="restaurant-stat-card">

            <div className="stat-card-top">
              <div className="stat-icon stat-icon-orange">
                🍴
              </div>

              <span className="stat-growth">
                Active
              </span>
            </div>

            <div className="stat-card-content">
              <span>Menu Items</span>
              <h2>0</h2>
              <small>
                Items on your menu
              </small>
            </div>

          </div>

        </section>

        {/* ===============================
            CONTENT GRID
        =============================== */}
        <section className="restaurant-content-grid">

          {/* Recent Orders */}
          <div className="restaurant-panel">

            <div className="panel-header">

              <div>
                <span className="panel-label">
                  ORDERS
                </span>

                <h2>Recent Orders</h2>
              </div>

              <button
                className="panel-action"
                onClick={() =>
                  alert("Orders section coming soon")
                }
              >
                View All →
              </button>

            </div>

            <div className="empty-panel">

              <div className="empty-icon">
                🛒
              </div>

              <h3>No orders yet</h3>

              <p>
                New customer orders will appear here.
              </p>

            </div>

          </div>

          {/* Popular Items */}
          <div className="restaurant-panel">

            <div className="panel-header">

              <div>
                <span className="panel-label">
                  MENU
                </span>

                <h2>Popular Items</h2>
              </div>

              <button
                className="panel-action"
                onClick={() =>
                  alert("Menu section coming soon")
                }
              >
                Manage →
              </button>

            </div>

            <div className="empty-panel">

              <div className="empty-icon">
                🍴
              </div>

              <h3>No menu items</h3>

              <p>
                Add menu items to see them here.
              </p>

            </div>

          </div>

        </section>

        {/* Footer */}
        <footer className="restaurant-dashboard-footer">
          <span>
            © 2026 Restaurant Management System
          </span>

          <span>
            Restaurant ID: {restaurant.restaurantId}
          </span>
        </footer>

      </main>

      {/* ================= RESTAURANT ADMIN PROFILE MODAL ================= */}
      {showProfileModal && (
        <div
          className="admin-profile-backdrop"
          onClick={() => setShowProfileModal(false)}
        >
          <div
            className="admin-profile-modal"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="admin-profile-modal-header">
              <div className="admin-profile-title">
                <span className="profile-header-icon">🏪</span>
                <div>
                  <h3>Restaurant Admin Profile</h3>
                  <p>Branch credentials & owner details</p>
                </div>
              </div>
              <button
                className="admin-profile-close-btn"
                onClick={() => setShowProfileModal(false)}
                title="Close"
              >
                ✕
              </button>
            </div>

            {/* Profile Hero Banner */}
            <div className="admin-profile-hero">
              <div className="admin-hero-avatar-wrap">
                <div className="admin-hero-avatar">
                  {restaurant.restaurantName?.charAt(0).toUpperCase() || "R"}
                </div>
                <span className="admin-hero-status-dot" title="Active"></span>
              </div>
              <div className="admin-hero-info">
                <h4>{restaurant.restaurantName}</h4>
                <p className="admin-hero-email">Managed by: {restaurant.ownerName || "Admin"}</p>
                <div className="admin-hero-badges">
                  <span className="admin-role-badge">
                    🏪 Restaurant Admin
                  </span>
                  <span className="admin-status-badge">
                    🟢 {restaurant.status || "Active"}
                  </span>
                </div>
              </div>
            </div>

            {/* Modal Body */}
            <div className="admin-profile-body">
              <div className="admin-profile-details-grid">
                <div className="admin-detail-card">
                  <div className="admin-detail-icon">🏪</div>
                  <div className="admin-detail-content">
                    <label>Restaurant Name</label>
                    <strong>{restaurant.restaurantName}</strong>
                  </div>
                </div>

                <div className="admin-detail-card">
                  <div className="admin-detail-icon">👤</div>
                  <div className="admin-detail-content">
                    <label>Owner Name</label>
                    <strong>{restaurant.ownerName || "Admin"}</strong>
                  </div>
                </div>

                <div className="admin-detail-card">
                  <div className="admin-detail-icon">🆔</div>
                  <div className="admin-detail-content">
                    <label>Restaurant ID</label>
                    <span className="admin-mono-id">{restaurant.restaurantId}</span>
                  </div>
                </div>

                <div className="admin-detail-card">
                  <div className="admin-detail-icon">📧</div>
                  <div className="admin-detail-content">
                    <label>Email Address</label>
                    <strong>{restaurant.email || "Not specified"}</strong>
                  </div>
                </div>

                <div className="admin-detail-card">
                  <div className="admin-detail-icon">📱</div>
                  <div className="admin-detail-content">
                    <label>Contact Phone</label>
                    <strong>{restaurant.phone || "Not specified"}</strong>
                  </div>
                </div>

                <div className="admin-detail-card">
                  <div className="admin-detail-icon">🍲</div>
                  <div className="admin-detail-content">
                    <label>Cuisine Category</label>
                    <strong>{restaurant.cuisine || "Multi-Cuisine"}</strong>
                  </div>
                </div>

                <div className="admin-detail-card">
                  <div className="admin-detail-icon">📍</div>
                  <div className="admin-detail-content">
                    <label>City / Location</label>
                    <strong>{restaurant.city || "Not specified"}</strong>
                  </div>
                </div>

                <div className="admin-detail-card">
                  <div className="admin-detail-icon">🏢</div>
                  <div className="admin-detail-content">
                    <label>Address</label>
                    <strong>{restaurant.address || "Main Branch"}</strong>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="admin-profile-modal-footer">
              <button
                type="button"
                className="admin-profile-logout-btn"
                onClick={handleLogout}
              >
                <span>🚪</span> Sign Out
              </button>
              <div className="admin-profile-footer-right">
                <button
                  type="button"
                  className="admin-profile-close-action-btn"
                  onClick={() => setShowProfileModal(false)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default RestaurantDashboard;
