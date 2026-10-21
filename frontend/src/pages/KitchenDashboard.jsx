import { useEffect, useState, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { API_URL } from "../config/api";
import "./KitchenDashboard.css";

/* ─── helpers ─── */
const money = (v) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(Number(v || 0));

const timeElapsed = (dateStr) => {
  if (!dateStr) return "Just now";
  const diffMin = Math.floor((Date.now() - new Date(dateStr).getTime()) / 60000);
  if (diffMin <= 0) return "Just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const h = Math.floor(diffMin / 60);
  return `${h}h ${diffMin % 60}m ago`;
};

/* ─── sidebar tabs config ─── */
const SIDEBAR_TABS = [
  { key: "dashboard",  icon: "🏠", label: "Dashboard"   },
  { key: "new",        icon: "🛎️", label: "New Orders"  },
  { key: "preparing",  icon: "🔥", label: "Preparing"   },
  { key: "ready",      icon: "✅", label: "Ready"       },
  { key: "completed",  icon: "📦", label: "Completed"   },
];

function KitchenDashboard() {
  const navigate = useNavigate();

  /* ── Session ── */
  const session = useMemo(() => {
    try {
      const raw = localStorage.getItem("chef") || localStorage.getItem("authUser");
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  }, []);

  const chefId = session?._id || session?.id || session?.chefId;

  /* ── State ── */
  const [activeTab, setActiveTab]       = useState("dashboard");
  const [chefData, setChefData]         = useState(null);
  const [restaurantData, setRestaurantData] = useState(null);
  const [orders, setOrders]             = useState([]);
  const [stats, setStats]               = useState({
    newOrdersCount: 0,
    preparingOrdersCount: 0,
    readyOrdersCount: 0,
    completedTodayCount: 0,
    totalActiveOrders: 0,
  });
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState("");
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [toastMsg, setToastMsg]         = useState("");
  const [autoRefresh, setAutoRefresh]   = useState(true);
  const [sidebarOpen, setSidebarOpen]   = useState(false);

  /* ── Live clock ── */
  const [clock, setClock] = useState(
    new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true })
  );
  useEffect(() => {
    const t = setInterval(() =>
      setClock(new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true })),
    1000);
    return () => clearInterval(t);
  }, []);

  /* ── Fetch dashboard ── */
  const fetchDashboard = useCallback(async (silent = false) => {
    if (!chefId) {
      setError("Chef session not found. Please sign in again.");
      setLoading(false);
      return;
    }
    if (!silent) setLoading(true);
    setError("");
    try {
      const res  = await fetch(`${API_URL}/chefs/${chefId}/dashboard`);
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || "Failed to load kitchen data.");
      setChefData(data.chef);
      setRestaurantData(data.restaurant);
      setStats(data.stats || {});
      setOrders(data.orders || []);
    } catch (err) {
      if (!silent) setError(err.message || "Could not load kitchen dashboard.");
    } finally {
      if (!silent) setLoading(false);
    }
  }, [chefId]);

  useEffect(() => { fetchDashboard(); }, [fetchDashboard]);

  /* ── Auto-refresh every 12s ── */
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => fetchDashboard(true), 12000);
    return () => clearInterval(interval);
  }, [autoRefresh, fetchDashboard]);

  /* ── Update order status ── */
  const updateStatus = async (orderId, nextStatus) => {
    setActionLoadingId(orderId);
    try {
      const res  = await fetch(`${API_URL}/chefs/orders/${orderId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || "Failed to update status.");
      setToastMsg(`Order marked as "${nextStatus}" ✓`);
      setTimeout(() => setToastMsg(""), 3000);
      fetchDashboard(true);
    } catch (err) {
      alert(err.message || "Update failed.");
    } finally {
      setActionLoadingId(null);
    }
  };

  /* ── Logout ── */
  const handleLogout = () => {
    ["chef", "authUser", "authToken"].forEach((k) => localStorage.removeItem(k));
    navigate("/kitchen/login", { replace: true });
  };

  /* ── Filtered orders per tab ── */
  const filteredOrders = useMemo(() => {
    if (activeTab === "new")       return orders.filter((o) => o.status === "New");
    if (activeTab === "preparing") return orders.filter((o) => o.status === "Preparing");
    if (activeTab === "ready")     return orders.filter((o) => o.status === "Ready");
    if (activeTab === "completed") return orders.filter((o) => ["Served", "Completed"].includes(o.status));
    return orders;
  }, [orders, activeTab]);

  /* ── Badge counts for sidebar ── */
  const badgeCounts = {
    new:       stats.newOrdersCount       || 0,
    preparing: stats.preparingOrdersCount || 0,
    ready:     stats.readyOrdersCount     || 0,
    completed: stats.completedTodayCount  || 0,
    dashboard: stats.totalActiveOrders    || 0,
  };

  /* ─────────────────────────── RENDER ─────────────────────────── */
  if (loading) {
    return (
      <div className="kd-loading-screen">
        <div className="kd-spinner" />
        <p>Loading Kitchen Dashboard…</p>
      </div>
    );
  }

  if (error && !chefData) {
    return (
      <div className="kd-error-screen">
        <span>⚠️</span>
        <h3>Unable to Load Kitchen Dashboard</h3>
        <p>{error}</p>
        <button onClick={() => navigate("/kitchen/login")}>← Go to Login</button>
      </div>
    );
  }

  return (
    <div className={`kd-layout ${sidebarOpen ? "sidebar-open" : ""}`}>

      {/* ══════════════════ SIDEBAR ══════════════════ */}
      <aside className="kd-sidebar">

        {/* Brand */}
        <div className="kd-sidebar-brand">
          <div className="kd-brand-icon">🍳</div>
          <div className="kd-brand-text">
            <h2>Kitchen</h2>
            <span>Display System</span>
          </div>
        </div>

        {/* Chef Info */}
        <div className="kd-chef-card">
          <div className="kd-chef-avatar">
            {chefData?.name?.charAt(0)?.toUpperCase() || "C"}
          </div>
          <div className="kd-chef-info">
            <strong>{chefData?.name || "Chef"}</strong>
            <span>{chefData?.chefId || "CHEF"}</span>
            <span className="kd-chef-role">{chefData?.speciality || "Head Chef"}</span>
          </div>
        </div>

        {/* Restaurant */}
        <div className="kd-restaurant-tag">
          <span>🏪</span>
          <span>{restaurantData?.restaurantName || "Restaurant"}</span>
        </div>

        {/* Nav */}
        <nav className="kd-nav">
          {SIDEBAR_TABS.map((tab) => (
            <button
              key={tab.key}
              type="button"
              className={`kd-nav-item ${activeTab === tab.key ? "active" : ""}`}
              onClick={() => { setActiveTab(tab.key); setSidebarOpen(false); }}
            >
              <span className="kd-nav-icon">{tab.icon}</span>
              <span className="kd-nav-label">{tab.label}</span>
              {badgeCounts[tab.key] > 0 && (
                <span className={`kd-nav-badge ${tab.key === "new" ? "badge-red" : tab.key === "preparing" ? "badge-orange" : tab.key === "ready" ? "badge-green" : "badge-gray"}`}>
                  {badgeCounts[tab.key]}
                </span>
              )}
            </button>
          ))}
        </nav>

        {/* Sidebar footer */}
        <div className="kd-sidebar-footer">
          <div className="kd-clock-small">🕒 {clock}</div>
          <button className="kd-logout-btn" onClick={handleLogout}>
            🚪 Logout
          </button>
        </div>
      </aside>

      {/* Mobile overlay */}
      {sidebarOpen && <div className="kd-mobile-overlay" onClick={() => setSidebarOpen(false)} />}

      {/* ══════════════════ MAIN CONTENT ══════════════════ */}
      <main className="kd-main">

        {/* Top Bar */}
        <header className="kd-topbar">
          <div className="kd-topbar-left">
            <button className="kd-hamburger" onClick={() => setSidebarOpen(!sidebarOpen)}>☰</button>
            <div>
              <h1 className="kd-page-title">
                {SIDEBAR_TABS.find((t) => t.key === activeTab)?.icon}{" "}
                {SIDEBAR_TABS.find((t) => t.key === activeTab)?.label}
              </h1>
              <p className="kd-page-sub">
                {restaurantData?.restaurantName} · {chefData?.speciality || "General"} · {chefData?.shift || "Full Day"}
              </p>
            </div>
          </div>

          <div className="kd-topbar-right">
            <span className="kd-topbar-clock">🕒 {clock}</span>
            <button
              className={`kd-refresh-toggle ${autoRefresh ? "active" : ""}`}
              onClick={() => setAutoRefresh((v) => !v)}
              title={autoRefresh ? "Auto-refreshing every 12s" : "Paused"}
            >
              {autoRefresh ? "🟢 Live" : "⚪ Paused"}
            </button>
            <button className="kd-refresh-btn" onClick={() => fetchDashboard(false)}>🔄 Refresh</button>
          </div>
        </header>

        {/* Toast */}
        {toastMsg && (
          <div className="kd-toast">
            <span>✨</span> {toastMsg}
          </div>
        )}

        {/* ════ DASHBOARD TAB ════ */}
        {activeTab === "dashboard" && (
          <section className="kd-dashboard-section">

            {/* Stat cards */}
            <div className="kd-stat-grid">
              {[
                { label: "New Orders",   count: stats.newOrdersCount,       icon: "🛎️", color: "red",    tab: "new"       },
                { label: "Preparing",    count: stats.preparingOrdersCount, icon: "🔥", color: "orange", tab: "preparing" },
                { label: "Ready",        count: stats.readyOrdersCount,     icon: "✅", color: "green",  tab: "ready"     },
                { label: "Completed Today", count: stats.completedTodayCount, icon: "📦", color: "blue",  tab: "completed" },
                { label: "Total Active", count: stats.totalActiveOrders,    icon: "⚡", color: "purple", tab: null        },
              ].map((card) => (
                <div
                  key={card.label}
                  className={`kd-stat-card kd-stat-${card.color} ${card.tab ? "clickable" : ""}`}
                  onClick={() => card.tab && setActiveTab(card.tab)}
                >
                  <div className="kd-stat-icon">{card.icon}</div>
                  <div className="kd-stat-body">
                    <span className="kd-stat-label">{card.label}</span>
                    <strong className="kd-stat-count">{card.count}</strong>
                  </div>
                  {card.color === "red" && card.count > 0 && <span className="kd-stat-pulse" />}
                </div>
              ))}
            </div>

            {/* Recent active orders preview */}
            <div className="kd-recent-section">
              <div className="kd-section-header">
                <h2>🔥 Active Orders Overview</h2>
                <button className="kd-see-all-btn" onClick={() => setActiveTab("new")}>
                  See New Orders →
                </button>
              </div>

              {orders.filter((o) => ["New", "Preparing", "Ready"].includes(o.status)).length === 0 ? (
                <div className="kd-empty-state">
                  <span>🍽️</span>
                  <h3>Kitchen is Clear!</h3>
                  <p>No active orders right now. New orders will appear here automatically.</p>
                </div>
              ) : (
                <div className="kd-order-list">
                  {orders
                    .filter((o) => ["New", "Preparing", "Ready"].includes(o.status))
                    .slice(0, 6)
                    .map((order) => {
                      const diffMin = Math.floor((Date.now() - new Date(order.createdAt).getTime()) / 60000);
                      const isUrgent = diffMin >= 12 && ["New", "Preparing"].includes(order.status);
                      return (
                        <div key={order._id} className={`kd-order-row status-${order.status?.toLowerCase()} ${isUrgent ? "urgent" : ""}`}>
                          <div className="kd-order-row-left">
                            <span className="kd-order-table">
                              {order.tableNumber ? `Table ${order.tableNumber}` : "Takeaway"}
                            </span>
                            <span className="kd-order-id">#{String(order._id).slice(-5).toUpperCase()}</span>
                            <span className="kd-order-items-preview">
                              {(order.items || []).map((i) => `${i.quantity}× ${i.name}`).join(", ")}
                            </span>
                          </div>
                          <div className="kd-order-row-right">
                            <span className={`kd-status-pill pill-${order.status?.toLowerCase()}`}>{order.status}</span>
                            <span className="kd-order-time">{timeElapsed(order.createdAt)}</span>
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>
          </section>
        )}

        {/* ════ ORDER TABS (new / preparing / ready / completed) ════ */}
        {["new", "preparing", "ready", "completed"].includes(activeTab) && (
          <section className="kd-orders-section">

            {filteredOrders.length === 0 ? (
              <div className="kd-empty-state">
                <span>
                  {activeTab === "new" ? "🛎️" : activeTab === "preparing" ? "🔥" : activeTab === "ready" ? "✅" : "📦"}
                </span>
                <h3>
                  {activeTab === "new"       && "No New Orders"}
                  {activeTab === "preparing" && "Nothing in Preparation"}
                  {activeTab === "ready"     && "No Ready Orders"}
                  {activeTab === "completed" && "No Completed Orders Yet"}
                </h3>
                <p>
                  {activeTab === "new"       && "New orders from waiters and QR customers will appear here."}
                  {activeTab === "preparing" && "Orders you start cooking will appear here."}
                  {activeTab === "ready"     && "Orders marked as ready for pickup will appear here."}
                  {activeTab === "completed" && "Served orders will be listed here."}
                </p>
              </div>
            ) : (
              <div className="kd-cards-grid">
                {filteredOrders.map((order) => {
                  const isNew       = order.status === "New";
                  const isPreparing = order.status === "Preparing";
                  const isReady     = order.status === "Ready";
                  const isCompleted = ["Served", "Completed"].includes(order.status);
                  const isBusy      = actionLoadingId === order._id;
                  const diffMin     = Math.floor((Date.now() - new Date(order.createdAt).getTime()) / 60000);
                  const isUrgent    = (isNew || isPreparing) && diffMin >= 12;

                  return (
                    <article
                      key={order._id}
                      className={`kd-order-card kd-card-${order.status?.toLowerCase()} ${isUrgent ? "kd-card-urgent" : ""}`}
                    >
                      {isUrgent && <div className="kd-urgent-banner">⚠️ Waiting {diffMin} mins — High Priority!</div>}

                      {/* Card Header */}
                      <div className="kd-card-header">
                        <div className="kd-card-header-left">
                          <span className="kd-card-table">
                            {order.tableNumber ? `Table ${order.tableNumber}` : "Takeaway"}
                          </span>
                          <span className="kd-card-order-id">#{String(order._id).slice(-5).toUpperCase()}</span>
                        </div>
                        <div className="kd-card-header-right">
                          <span className={`kd-card-status-badge badge-${order.status?.toLowerCase()}`}>
                            {isNew       && "🛎️ New"}
                            {isPreparing && "🔥 Preparing"}
                            {isReady     && "✅ Ready"}
                            {isCompleted && "📦 Done"}
                          </span>
                          <span className="kd-card-time">{timeElapsed(order.createdAt)}</span>
                        </div>
                      </div>

                      {/* Customer & Source */}
                      <div className="kd-card-meta">
                        <span>👤 {order.customerName || "Walk-in"}</span>
                        <span>
                          {order.source === "Admin"
                            ? "🛡️ Admin Order"
                            : String(order.source).toLowerCase() === "manager"
                            ? "👔 Manager Order"
                            : String(order.source).toLowerCase() === "waiter"
                            ? "🧑‍💼 Waiter Order"
                            : "📱 QR Order"}
                        </span>
                      </div>

                      {/* Items */}
                      <div className="kd-card-items">
                        {(order.items || []).map((item, idx) => (
                          <div key={idx} className="kd-item-row">
                            <span className="kd-item-qty">{item.quantity}×</span>
                            <div className="kd-item-info">
                              <span className="kd-item-name">{item.name}</span>
                              {item.selectedModifiers?.length > 0 && (
                                <div className="kd-item-mods">
                                  {item.selectedModifiers.map((m, i) => (
                                    <span key={i} className="kd-mod-pill">+{m.name}</span>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Notes */}
                      {order.specialInstructions && (
                        <div className="kd-card-note">
                          📝 {order.specialInstructions}
                        </div>
                      )}

                      {/* Total */}
                      <div className="kd-card-total">
                        Total: <strong>{money(order.total)}</strong>
                        <span className="kd-card-items-count">
                          {(order.items || []).reduce((s, i) => s + (i.quantity || 1), 0)} items
                        </span>
                      </div>

                      {/* Action buttons */}
                      <div className="kd-card-actions">
                        {isNew && (
                          <button
                            className="kd-action-btn kd-btn-start"
                            disabled={isBusy}
                            onClick={() => updateStatus(order._id, "Preparing")}
                          >
                            {isBusy ? "Updating…" : "🔥 Start Cooking"}
                          </button>
                        )}
                        {isPreparing && (
                          <button
                            className="kd-action-btn kd-btn-ready"
                            disabled={isBusy}
                            onClick={() => updateStatus(order._id, "Ready")}
                          >
                            {isBusy ? "Updating…" : "✅ Mark as Ready"}
                          </button>
                        )}
                        {isReady && (
                          <div className="kd-ready-row">
                            <span className="kd-ready-note">🔔 Notified waiter — waiting at counter</span>
                            <button
                              className="kd-action-btn kd-btn-served"
                              disabled={isBusy}
                              onClick={() => updateStatus(order._id, "Served")}
                            >
                              {isBusy ? "Saving…" : "🍽️ Mark Picked Up"}
                            </button>
                          </div>
                        )}
                        {isCompleted && (
                          <div className="kd-completed-note">🎉 Order Successfully Served</div>
                        )}
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        )}

      </main>
    </div>
  );
}

export default KitchenDashboard;
