import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { API_URL } from "../config/api";
import "./AdminCleanerView.css";

export default function AdminCleanerView() {
  const { cleanerId: paramCleanerId } = useParams();
  const navigate = useNavigate();

  const authCleanerId = (() => {
    try {
      const raw = localStorage.getItem("cleaner") || localStorage.getItem("authUser");
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      return parsed?._id || parsed?.id || null;
    } catch {
      return null;
    }
  })();

  const cleanerId = paramCleanerId || authCleanerId;

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingTableId, setUpdatingTableId] = useState(null);
  const [actionSuccess, setActionSuccess] = useState("");

  const [activeTab, setActiveTab] = useState("tables"); // "tables" | "profile" | "settings"
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Password reset state
  const [resetPwd, setResetPwd] = useState("");
  const [resetPwdConfirm, setResetPwdConfirm] = useState("");
  const [resetPwdLoading, setResetPwdLoading] = useState(false);
  const [resetPwdMsg, setResetPwdMsg] = useState({ type: "", text: "" });
  const [showPwd, setShowPwd] = useState(false);

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setResetPwdMsg({ type: "", text: "" });
    if (!cleanerId) return setResetPwdMsg({ type: "error", text: "Cleaner ID missing." });
    if (resetPwd.length < 6) {
      return setResetPwdMsg({ type: "error", text: "Password must be at least 6 characters." });
    }
    if (resetPwd !== resetPwdConfirm) {
      return setResetPwdMsg({ type: "error", text: "Passwords do not match." });
    }
    setResetPwdLoading(true);
    try {
      const res = await fetch(`${API_URL}/cleaners/${cleanerId}/reset-password`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newPassword: resetPwd }),
      });
      const result = await res.json();
      if (!res.ok || !result.success) throw new Error(result.message || "Password reset failed.");
      setResetPwdMsg({ type: "success", text: "✅ Password reset successfully!" });
      setResetPwd("");
      setResetPwdConfirm("");
    } catch (err) {
      setResetPwdMsg({ type: "error", text: err.message || "Password reset failed." });
    } finally {
      setResetPwdLoading(false);
    }
  };

  const load = useCallback(async () => {
    if (!cleanerId) {
      setError("No cleaner selected or cleaner account not found.");
      setLoading(false);
      return;
    }
    try {
      const res = await fetch(`${API_URL}/cleaners/${cleanerId}/dashboard`);
      const result = await res.json();
      if (!res.ok || !result.success) throw new Error(result.message || "Unable to load cleaner data.");
      setData(result);
      setError("");
    } catch (err) {
      setError(err.message || "Failed to load cleaner dashboard.");
    } finally {
      setLoading(false);
    }
  }, [cleanerId]);

  useEffect(() => {
    load();
    const timer = setInterval(load, 25000);
    return () => clearInterval(timer);
  }, [load]);

  const handleMarkCleaned = async (tableId, tableNumber) => {
    setUpdatingTableId(tableId);
    setActionSuccess("");
    try {
      const res = await fetch(`${API_URL}/cleaners/tables/${tableId}/cleaned`, {
        method: "PATCH",
      });
      const result = await res.json();
      if (!res.ok || !result.success) {
        throw new Error(result.message || "Failed to update table.");
      }
      const cleanNum = String(tableNumber || "").replace(/^table\s*/i, "").trim();
      setActionSuccess(`Table ${cleanNum} is now marked Available & Clean! ✨`);
      setTimeout(() => setActionSuccess(""), 3000);
      await load();
    } catch (err) {
      alert(`Error updating table: ${err.message}`);
    } finally {
      setUpdatingTableId(null);
    }
  };

  if (loading && !data) {
    return (
      <div className="acv-loading">
        <div className="acv-spinner" />
        <p>Loading cleaner dashboard…</p>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="acv-error-state">
        <span>⚠️</span>
        <p>{error}</p>
        <button onClick={() => navigate(-1)}>← Go Back</button>
      </div>
    );
  }

  const { stats = { totalTables: 0, needingCleaning: 0, available: 0, occupied: 0 }, tables = [], cleaner = {}, restaurant = {} } = data || {};

  const statCards = [
    { icon: "🧹", label: "Needing Cleaning", value: stats.needingCleaning, alert: stats.needingCleaning > 0 },
    { icon: "🟢", label: "Available & Clean", value: stats.available },
    { icon: "🍽️", label: "Occupied Tables", value: stats.occupied },
    { icon: "📊", label: "Total Tables", value: stats.totalTables },
  ];

  return (
    <div className="acv-dashboard-layout">
      {/* Sidebar Backdrop for Mobile */}
      {sidebarOpen && (
        <div className="acv-sidebar-backdrop" onClick={() => setSidebarOpen(false)} aria-hidden="true" />
      )}

      {/* LEFT SIDEBAR */}
      <aside className={`acv-sidebar ${sidebarOpen ? "open" : ""}`}>
        <div className="acv-brand">
          <div className="brand-icon">🧹</div>
          <div>
            <h2>Cleaner Panel</h2>
            <span>Sanitation & Tables</span>
          </div>
          <button className="acv-sidebar-close" onClick={() => setSidebarOpen(false)} aria-label="Close menu">
            ✕
          </button>
        </div>

        {/* Cleaner Info Box in Sidebar */}
        <div className="acv-sidebar-user">
          <div className="user-avatar">{cleaner?.name?.charAt(0)?.toUpperCase() || "C"}</div>
          <div className="user-info-text">
            <strong>{cleaner?.name}</strong>
            <small>ID: {cleaner?.cleanerId}</small>
            <span className="user-area-pill">{cleaner?.assignedArea || "General Area"}</span>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="acv-navigation">
          <button
            type="button"
            className={`acv-nav-item ${activeTab === "tables" ? "active" : ""}`}
            onClick={() => {
              setActiveTab("tables");
              setSidebarOpen(false);
            }}
          >
            <span className="nav-icon">🪑</span>
            <span>Tables & Cleaning</span>
          </button>

          <button
            type="button"
            className={`acv-nav-item ${activeTab === "profile" ? "active" : ""}`}
            onClick={() => {
              setActiveTab("profile");
              setSidebarOpen(false);
            }}
          >
            <span className="nav-icon">👤</span>
            <span>Profile Details</span>
          </button>

          <button
            type="button"
            className={`acv-nav-item ${activeTab === "settings" ? "active" : ""}`}
            onClick={() => {
              setActiveTab("settings");
              setSidebarOpen(false);
            }}
          >
            <span className="nav-icon">⚙️</span>
            <span>Settings</span>
          </button>
        </nav>

        {/* Sidebar Footer Return Button */}
        <div className="acv-sidebar-footer">
          <button type="button" className="acv-exit-btn" onClick={() => navigate("/admin/dashboard")}>
            <span>←</span> Return to Staff
          </button>
        </div>
      </aside>

      {/* RIGHT MAIN CONTENT */}
      <main className="acv-main-content">
        {/* Top Header Bar */}
        <header className="acv-header">
          <div className="header-left">
            <button
              type="button"
              className="mobile-menu-btn"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open menu"
            >
              <span></span>
              <span></span>
              <span></span>
            </button>
            <div>
              <h1>
                {activeTab === "tables" && "Dining Tables & Cleaning Status"}
                {activeTab === "profile" && "Cleaner Profile Details"}
                {activeTab === "settings" && "Cleaner Station Settings"}
              </h1>
              <p>
                🏪 {restaurant?.restaurantName} ({restaurant?.restaurantId}) • 🧹 {cleaner?.assignedArea}
              </p>
            </div>
          </div>

          <div className="header-right">
            <div className="acv-status-badge">
              <span className={`acv-dot ${cleaner?.status === "Active" ? "dot-active" : "dot-inactive"}`} />
              {cleaner?.status || "Active"}
            </div>
          </div>
        </header>

        {actionSuccess && <div className="acv-success-banner">{actionSuccess}</div>}

        {/* KPI Stats */}
        <div className="acv-stats-grid">
          {statCards.map((c, i) => (
            <div key={i} className={`acv-stat-card ${c.alert ? "stat-alert" : ""}`}>
              <div className="acv-stat-icon">{c.icon}</div>
              <div className="acv-stat-val">{c.value}</div>
              <div className="acv-stat-label">{c.label}</div>
            </div>
          ))}
        </div>

        {/* TAB 1: TABLES & CLEANING */}
        {activeTab === "tables" && (
          <div className="acv-tables-card">
            <div className="acv-tables-header">
              <div>
                <h3>Dining Tables & Cleaning Status</h3>
                <p>Tables marked "Cleaning" require sanitation before welcoming new guests.</p>
              </div>
              <button type="button" className="acv-refresh-btn" onClick={load}>
                🔄 Refresh
              </button>
            </div>

            {tables.length === 0 ? (
              <div className="acv-empty-tables">
                <p>No tables configured for this restaurant yet.</p>
              </div>
            ) : (
              <div className="acv-tables-grid">
                {tables.map((tbl) => {
                  const isCleaning = tbl.status === "Cleaning";
                  const isAvailable = tbl.status === "Available";
                  const isOccupied = tbl.status === "Occupied";
                  const displayTblNum = /^table\s*/i.test(String(tbl.tableNumber || "").trim())
                    ? String(tbl.tableNumber).trim()
                    : `Table ${tbl.tableNumber}`;

                  return (
                    <div
                      key={tbl._id}
                      className={`acv-table-item ${isCleaning ? "table-cleaning-pulse" : ""} status-${(tbl.status || "").toLowerCase().replace(/\s+/g, "-")}`}
                    >
                      <div className="acv-tbl-num">{displayTblNum}</div>
                      <div className="acv-tbl-cap">👥 Capacity: {tbl.capacity || 4}</div>
                      <div className="acv-tbl-status">
                        <span className={`acv-tbl-badge badge-${(tbl.status || "").toLowerCase().replace(/\s+/g, "-")}`}>
                          {tbl.status}
                        </span>
                      </div>

                      {isCleaning ? (
                        <button
                          type="button"
                          className="acv-mark-clean-btn"
                          disabled={updatingTableId === tbl._id}
                          onClick={() => handleMarkCleaned(tbl._id, tbl.tableNumber)}
                        >
                          {updatingTableId === tbl._id ? "Updating..." : "✨ Mark Clean & Ready"}
                        </button>
                      ) : (
                        <div className="acv-tbl-note">
                          {isAvailable ? "Ready for guests" : isOccupied ? "Guests dining" : "Unavailable"}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: PROFILE DETAILS */}
        {activeTab === "profile" && (
          <div className="acv-info-card">
            <h3>Cleaner Profile Details</h3>
            <div className="acv-info-grid">
              <div><label>Full Name:</label> <span>{cleaner?.name}</span></div>
              <div><label>Cleaner ID:</label> <span>{cleaner?.cleanerId}</span></div>
              <div><label>Assigned Area:</label> <span>{cleaner?.assignedArea}</span></div>
              <div><label>Work Shift:</label> <span>{cleaner?.shift}</span></div>
              <div><label>Phone:</label> <span>{cleaner?.phone || "—"}</span></div>
              <div><label>Email:</label> <span>{cleaner?.email || "—"}</span></div>
              <div><label>Joined:</label> <span>{new Date(cleaner?.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</span></div>
              <div><label>Status:</label> <span style={{ color: cleaner?.status === "Active" ? "#059669" : "#dc2626", fontWeight: 700 }}>{cleaner?.status}</span></div>
            </div>
          </div>
        )}

        {/* TAB 3: SETTINGS & RESET PASSWORD */}
        {activeTab === "settings" && (
          <div className="acv-info-card acv-reset-card">
            <div className="acv-reset-card-header">
              <span className="acv-reset-icon">⚙️</span>
              <div>
                <h3>Cleaner Account Settings & Password Reset</h3>
                <p>Manage cleaner account security credentials and reset password</p>
              </div>
            </div>

            <form className="acv-reset-form" onSubmit={handleResetPassword}>
              <input
                type="text"
                name="username"
                value={cleaner?.email || cleaner?.cleanerId || cleaner?.name || "cleaner"}
                readOnly
                autoComplete="username"
                style={{ display: "none" }}
              />

              {resetPwdMsg.text && (
                <div className={`acv-reset-msg ${resetPwdMsg.type === "success" ? "acv-msg-success" : "acv-msg-error"}`}>
                  {resetPwdMsg.text}
                </div>
              )}

              <div className="acv-reset-row">
                <div className="acv-reset-field">
                  <label>New Password *</label>
                  <div className="acv-pwd-wrap">
                    <input
                      type={showPwd ? "text" : "password"}
                      name="new-password"
                      autoComplete="new-password"
                      className="acv-reset-input"
                      placeholder="Enter new password (min 6 chars)"
                      value={resetPwd}
                      onChange={(e) => setResetPwd(e.target.value)}
                      required
                      minLength={6}
                    />
                    <button
                      type="button"
                      className="acv-pwd-toggle"
                      onClick={() => setShowPwd((v) => !v)}
                      title={showPwd ? "Hide password" : "Show password"}
                    >
                      {showPwd ? (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                          <line x1="1" y1="1" x2="23" y2="23"></line>
                        </svg>
                      ) : (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                          <circle cx="12" cy="12" r="3"></circle>
                        </svg>
                      )}
                    </button>
                  </div>
                </div>

                <div className="acv-reset-field">
                  <label>Confirm New Password *</label>
                  <div className="acv-pwd-wrap">
                    <input
                      type={showPwd ? "text" : "password"}
                      name="confirm-password"
                      autoComplete="new-password"
                      className="acv-reset-input"
                      placeholder="Re-enter new password"
                      value={resetPwdConfirm}
                      onChange={(e) => setResetPwdConfirm(e.target.value)}
                      required
                      minLength={6}
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                className="acv-reset-btn"
                disabled={resetPwdLoading}
              >
                {resetPwdLoading ? "Resetting…" : "🔑 Reset Password"}
              </button>
            </form>
          </div>
        )}
      </main>
    </div>
  );
}
