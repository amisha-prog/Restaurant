import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { API_URL } from "../config/api";
import "./AdminWaiterView.css";

const money = (v) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(Number(v || 0));

const TABS = ["Overview", "Orders", "Tables", "Kitchen", "Settings"];
const TAB_ICONS = { Overview: "🏠", Orders: "🧾", Tables: "🪑", Kitchen: "👨‍🍳", Settings: "⚙️" };

export default function AdminWaiterView() {
  const { waiterId } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tab, setTab] = useState("Overview");

  // Password reset state
  const [resetPwd, setResetPwd] = useState("");
  const [resetPwdConfirm, setResetPwdConfirm] = useState("");
  const [resetPwdLoading, setResetPwdLoading] = useState(false);
  const [resetPwdMsg, setResetPwdMsg] = useState({ type: "", text: "" });
  const [showPwd, setShowPwd] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/waiters/${waiterId}/dashboard`);
      const result = await res.json();
      if (!res.ok || !result.success) throw new Error(result.message || "Unable to load data.");
      setData(result);
      setError("");
    } catch (err) {
      setError(err.message || "Failed to load waiter dashboard.");
    } finally {
      setLoading(false);
    }
  }, [waiterId]);

  useEffect(() => {
    load();
    const timer = setInterval(load, 30000);
    return () => clearInterval(timer);
  }, [load]);

  if (loading && !data) {
    return (
      <div className="awv-loading">
        <div className="awv-spinner" />
        <p>Loading waiter dashboard…</p>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="awv-error-state">
        <span>⚠️</span>
        <p>{error}</p>
        <button onClick={() => navigate(-1)}>← Go Back</button>
      </div>
    );
  }

  const { stats, orders, tables, waiter } = data;

  const statCards = [
    { icon: "💰", label: "Today's Sales", value: money(stats.todaySales) },
    { icon: "🧾", label: "Today's Orders", value: stats.todayOrderCount },
    { icon: "🔴", label: "New Orders", value: stats.newOrders },
    { icon: "🍳", label: "Preparing", value: stats.preparingOrders },
    { icon: "✅", label: "Ready", value: stats.readyOrders },
    { icon: "🪑", label: "My Tables", value: stats.myTables },
    { icon: "📊", label: "Total Tables", value: stats.totalTables },
    { icon: "🟢", label: "Available Tables", value: stats.availableTables },
  ];

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setResetPwdMsg({ type: "", text: "" });
    if (resetPwd.length < 6) {
      return setResetPwdMsg({ type: "error", text: "Password must be at least 6 characters." });
    }
    if (resetPwd !== resetPwdConfirm) {
      return setResetPwdMsg({ type: "error", text: "Passwords do not match." });
    }
    setResetPwdLoading(true);
    try {
      const res = await fetch(`${API_URL}/waiters/${waiterId}/reset-password`, {
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

  const renderContent = () => {
    if (tab === "Settings") {
      return (
        <div className="awv-settings-view">
          <div className="awv-settings-profile-card">
            <div className="awv-settings-avatar">{waiter?.name?.charAt(0)?.toUpperCase() || "W"}</div>
            <div className="awv-settings-profile-info">
              <h2>{waiter?.name}</h2>
              <span className="awv-settings-id-badge">ID: {waiter?.waiterId}</span>
              <p>✉️ {waiter?.email || "—"}</p>
              {waiter?.phone && <p>📞 {waiter.phone}</p>}
              {waiter?.gender && <p>👤 Gender: {waiter.gender}</p>}
              {waiter?.address && <p>📍 Address: {waiter.address}</p>}
              <p>🏢 {waiter?.restaurantId?.restaurantName || "—"}</p>
              <span className={`awv-settings-status ${waiter?.status === "Inactive" ? "awv-dot-inactive" : "awv-dot-active"}`}>
                {waiter?.status || "Active"}
              </span>
            </div>
          </div>

          <div className="awv-settings-card">
            <div className="awv-settings-card-header">
              <span className="awv-settings-card-icon">🔐</span>
              <div>
                <h3>Reset Password</h3>
                <p>Set a new password for this waiter account</p>
              </div>
            </div>

            <form className="awv-reset-form" onSubmit={handleResetPassword}>
              {/* Hidden username input so Chrome browser popup identifies waiter account instead of superadmin */}
              <input
                type="text"
                name="username"
                value={waiter?.email || waiter?.waiterId || waiter?.name || "waiter"}
                readOnly
                autoComplete="username"
                style={{ display: "none" }}
              />

              {resetPwdMsg.text && (
                <div className={`awv-reset-msg ${resetPwdMsg.type === "success" ? "amv-reset-success" : "amv-reset-error"}`}>
                  {resetPwdMsg.text}
                </div>
              )}

              <div className="awv-reset-field">
                <label>New Password *</label>
                <div className="awv-pwd-input-wrap">
                  <input
                    type={showPwd ? "text" : "password"}
                    name="new-password"
                    autoComplete="new-password"
                    className="awv-reset-input"
                    placeholder="Enter new password (min 6 chars)"
                    value={resetPwd}
                    onChange={(e) => setResetPwd(e.target.value)}
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    className="awv-pwd-toggle"
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

              <div className="awv-reset-field">
                <label>Confirm New Password *</label>
                <div className="awv-pwd-input-wrap">
                  <input
                    type={showPwd ? "text" : "password"}
                    name="confirm-password"
                    autoComplete="new-password"
                    className="awv-reset-input"
                    placeholder="Re-enter new password"
                    value={resetPwdConfirm}
                    onChange={(e) => setResetPwdConfirm(e.target.value)}
                    required
                    minLength={6}
                  />
                </div>
              </div>

              <button
                type="submit"
                className="awv-reset-submit-btn"
                disabled={resetPwdLoading}
              >
                {resetPwdLoading ? "Resetting…" : "🔑 Reset Password"}
              </button>
            </form>
          </div>
        </div>
      );
    }
    if (tab === "Orders") {
      return (
        <div className="awv-table-wrap">
          <table className="awv-table">
            <thead><tr><th>Order #</th><th>Table</th><th>Source</th><th>Status</th><th>Payment</th><th>Total</th></tr></thead>
            <tbody>
              {orders.length === 0
                ? <tr><td colSpan={6} className="awv-empty-cell">No orders found</td></tr>
                : orders.map(o => (
                  <tr key={o._id}>
                    <td className="awv-mono">#{o._id.slice(-6)}</td>
                    <td>{o.tableNumber || "—"}</td>
                    <td>{o.source || "QR"}</td>
                    <td><span className={`awv-status awv-status-${(o.status || "").toLowerCase()}`}>{o.status}</span></td>
                    <td><span className={`awv-pay ${o.payment?.status === "Paid" ? "awv-paid" : "awv-pending"}`}>{o.payment?.status || "Pending"}</span></td>
                    <td><strong>{money(o.total)}</strong></td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      );
    }

    if (tab === "Tables") {
      return (
        <div className="awv-grid">
          {tables.length === 0
            ? <p className="awv-empty">No tables found.</p>
            : tables.map(t => (
              <div key={t._id} className={`awv-table-card awv-tbl-${(t.status || "").toLowerCase()}`}>
                <div className="awv-table-num">T{t.tableNumber?.replace(/\D/g, "") || "?"}</div>
                <span className="awv-table-status">{t.status}</span>
                <small>Cap: {t.capacity || "?"}</small>
              </div>
            ))}
        </div>
      );
    }

    if (tab === "Kitchen") {
      const active = orders.filter(o => ["New", "Preparing", "Ready"].includes(o.status));
      return (
        <div className="awv-grid">
          {active.length === 0
            ? <p className="awv-empty">No active kitchen orders.</p>
            : active.map(o => (
              <div key={o._id} className={`awv-kitchen-card awv-kitchen-${(o.status || "").toLowerCase()}`}>
                <div className="awv-kitchen-id">#{o._id.slice(-6)}</div>
                <div className="awv-kitchen-tbl">Table {o.tableNumber}</div>
                <span className="awv-kitchen-status">{o.status}</span>
                <small>{o.items?.reduce((s, i) => s + i.quantity, 0) || 0} items</small>
              </div>
            ))}
        </div>
      );
    }

    // Overview
    return (
      <>
        <div className="awv-stat-grid">
          {statCards.map(({ icon, label, value }) => (
            <div key={label} className="awv-stat-card">
              <div className="awv-stat-icon">{icon}</div>
              <div>
                <p className="awv-stat-label">{label}</p>
                <strong className="awv-stat-value">{value}</strong>
              </div>
            </div>
          ))}
        </div>

        <div className="awv-overview-grid">
          <section className="awv-box">
            <h3>🔥 Active Orders</h3>
            {orders.filter(o => ["New", "Preparing", "Ready"].includes(o.status)).length === 0
              ? <p className="awv-empty">No active orders right now.</p>
              : (
                <div className="awv-table-wrap">
                  <table className="awv-table">
                    <thead><tr><th>Order</th><th>Table</th><th>Status</th><th>Total</th></tr></thead>
                    <tbody>
                      {orders.filter(o => ["New", "Preparing", "Ready"].includes(o.status)).slice(0, 6).map(o => (
                        <tr key={o._id}>
                          <td className="awv-mono">#{o._id.slice(-6)}</td>
                          <td>{o.tableNumber}</td>
                          <td><span className={`awv-status awv-status-${o.status.toLowerCase()}`}>{o.status}</span></td>
                          <td>{money(o.total)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
          </section>

          <section className="awv-box">
            <h3>🪑 Table Status</h3>
            <div className="awv-tbl-summary">
              {[["Available", "available"], ["Occupied", "occupied"], ["Reserved", "reserved"], ["Cleaning", "cleaning"]].map(([label, cls]) => (
                <div key={label} className={`awv-tsummary-item awv-tsummary-${cls}`}>
                  <strong>{tables.filter(t => t.status?.toLowerCase() === cls).length}</strong>
                  <span>{label}</span>
                </div>
              ))}
            </div>
          </section>
        </div>

        <section className="awv-box awv-box-full">
          <h3>📋 Recent Orders</h3>
          <div className="awv-table-wrap">
            <table className="awv-table">
              <thead><tr><th>Order #</th><th>Table</th><th>Status</th><th>Payment</th><th>Total</th></tr></thead>
              <tbody>
                {orders.slice(0, 10).map(o => (
                  <tr key={o._id}>
                    <td className="awv-mono">#{o._id.slice(-6)}</td>
                    <td>{o.tableNumber || "—"}</td>
                    <td><span className={`awv-status awv-status-${(o.status || "").toLowerCase()}`}>{o.status}</span></td>
                    <td><span className={`awv-pay ${o.payment?.status === "Paid" ? "awv-paid" : "awv-pending"}`}>{o.payment?.status || "Pending"}</span></td>
                    <td><strong>{money(o.total)}</strong></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </>
    );
  };

  return (
    <div className="awv-layout">
      <aside className="awv-sidebar">
        <div className="awv-sidebar-brand">
          <div className="awv-brand-icon">🍽️</div>
          <div>
            <h2>Waiter View</h2>
            <span>Admin Read-only</span>
          </div>
        </div>

        <div className="awv-sidebar-profile">
          <div className="awv-profile-avatar">{waiter?.name?.charAt(0)?.toUpperCase() || "W"}</div>
          <div className="awv-profile-info">
            <strong>{waiter?.name}</strong>
            <small>{waiter?.waiterId}</small>
            <small className="awv-tag">{waiter?.restaurantId?.restaurantName}</small>
          </div>
        </div>

        <nav className="awv-nav">
          {TABS.map(t => (
            <button key={t} className={`awv-nav-btn ${tab === t ? "awv-nav-active" : ""}`} onClick={() => setTab(t)}>
              <span className="awv-nav-icon">{TAB_ICONS[t]}</span>{t}
            </button>
          ))}
        </nav>

        <div className="awv-sidebar-footer">
          {/* Bottom refresh removed */}
        </div>
      </aside>

      <main className="awv-main">
        <header className="awv-header">
          <div className="awv-header-left">
            <div className="awv-read-only-badge">👁️ Admin Read-Only View</div>
            <h1>{tab}</h1>
            <p>{waiter?.restaurantId?.restaurantName} · {waiter?.name} · {waiter?.waiterId}</p>
          </div>
          <div className="awv-header-right">
            <div className="awv-live-indicator"><span className="awv-live-dot" />Live Data</div>
            <button className="awv-back-header-btn" onClick={() => navigate(-1)}>← Back to Admin</button>
          </div>
        </header>

        {error && <div className="awv-error-banner">⚠️ {error}</div>}

        <div className="awv-content">{renderContent()}</div>
      </main>
    </div>
  );
}
