import { useCallback, useEffect, useMemo, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { API_URL } from "../config/api";
import WaiterLogoIcon from "../Components/WaiterLogoIcon";
import "./WaiterKitchen.css";

const FLOW = {
  New: { next: "Preparing", action: "Start Cooking", icon: "🔥", color: "#2563eb" },
  Preparing: { next: "Ready", action: "Mark Ready", icon: "✅", color: "#f59e0b" },
  Ready: { next: "Served", action: "Serve Order", icon: "🍽️", color: "#16a34a" },
};

const ago = (value) => {
  const minutes = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 60000));
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  const remainingMins = minutes % 60;
  return `${hours}h ${remainingMins}m ago`;
};

const sessionData = () => {
  try {
    return JSON.parse(localStorage.getItem("waiter") || localStorage.getItem("authUser") || "null");
  } catch {
    return null;
  }
};

const itemCount = (order) =>
  (order.items || []).reduce((sum, item) => sum + Number(item.quantity || 0), 0);

const getPaginationRange = (current, total) => {
  if (total <= 5) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }
  if (current <= 3) {
    return [1, 2, 3, "...", total];
  }
  if (current >= total - 2) {
    return [1, "...", total - 2, total - 1, total];
  }
  return [1, "...", current, "...", total];
};

function WaiterKitchen() {
  const navigate = useNavigate();
  const session = useMemo(sessionData, []);
  const waiterId = session?.id || session?._id;

  const [orders, setOrders] = useState([]);
  const [working, setWorking] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState("grid"); // "grid" | "lanes"
  const [statusFilter, setStatusFilter] = useState("all"); // "all" | "New" | "Preparing" | "Ready"
  const [searchQuery, setSearchQuery] = useState("");
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [kitchenPage, setKitchenPage] = useState(1);
  const [kitchenPerPage, setKitchenPerPage] = useState(6);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifFilter, setNotifFilter] = useState("all");
  const notifRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    };
    if (showNotifications) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("touchstart", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [showNotifications]);


  const load = useCallback(
    async (quiet = false) => {
      if (!waiterId) {
        setError("Waiter session not found. Please sign in again.");
        setLoading(false);
        return;
      }
      if (!quiet) setLoading(true);
      try {
        const response = await fetch(`${API_URL}/waiters/${waiterId}/dashboard`);
        const data = await response.json();
        if (!response.ok || !data.success) {
          throw new Error(data.message || "Unable to load kitchen orders.");
        }
        setOrders((data.orders || []).filter((order) => ["New", "Preparing", "Ready"].includes(order.status)));
        
        const notifRes = await fetch(`${API_URL}/waiters/${waiterId}/notifications`);
        const notifData = await notifRes.json().catch(() => ({}));
        if (notifRes.ok && notifData.success) setNotifications(notifData.notifications || []);

        setError("");
        setLastUpdated(new Date());
      } catch (requestError) {
        setError(requestError.message || "Unable to load kitchen orders.");
      } finally {
        setLoading(false);
      }
    },
    [waiterId]
  );

  useEffect(() => {
    load();
    const timer = window.setInterval(() => load(true), 20000);
    return () => window.clearInterval(timer);
  }, [load]);

  const changeStatus = async (order) => {
    const flow = FLOW[order.status];
    if (!flow) return;
    setWorking(order._id);
    setError("");
    try {
      const response = await fetch(`${API_URL}/waiters/${waiterId}/orders/${order._id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: flow.next }),
      });
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.message || "Unable to update kitchen status.");
      }
      await load(true);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setWorking("");
    }
  };

  // Status counts
  const newCount = orders.filter((o) => o.status === "New").length;
  const preparingCount = orders.filter((o) => o.status === "Preparing").length;
  const readyCount = orders.filter((o) => o.status === "Ready").length;

  // Filtered orders for Grid view
  const filteredOrders = orders.filter((order) => {
    const matchesStatus = statusFilter === "all" || order.status === statusFilter;
    const query = searchQuery.trim().toLowerCase();
    if (!query) return matchesStatus;

    const matchesTable = String(order.tableNumber || "").toLowerCase().includes(query);
    const matchesId = String(order._id || "").toLowerCase().includes(query);
    const matchesCustomer = String(order.customerName || "").toLowerCase().includes(query);
    const matchesItem = (order.items || []).some((item) =>
      String(item.name || "").toLowerCase().includes(query)
    );

    return matchesStatus && (matchesTable || matchesId || matchesCustomer || matchesItem);
  });

  useEffect(() => {
    setKitchenPage(1);
  }, [statusFilter, searchQuery]);

  const totalKitchenPages = Math.ceil(filteredOrders.length / kitchenPerPage) || 1;
  const currentKitchenPage = Math.min(kitchenPage, totalKitchenPages);

  const paginatedOrders = useMemo(() => {
    const start = (currentKitchenPage - 1) * kitchenPerPage;
    return filteredOrders.slice(start, start + kitchenPerPage);
  }, [filteredOrders, currentKitchenPage, kitchenPerPage]);

  const logout = () => {
    ["waiter", "authUser", "authToken"].forEach((key) => localStorage.removeItem(key));
    navigate("/login");
  };

  if (loading) {
    return (
      <main className="kitchen-state">
        <div className="kitchen-spinner">⏳</div>
        <p>Loading Kitchen Orders Grid…</p>
      </main>
    );
  }

  return (
    <div className="kitchen-page">
      {/* SIDEBAR */}
      <aside className="kitchen-sidebar">
        <div className="sidebar-brand">
          <span className="brand-icon" style={{ display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
            <WaiterLogoIcon size={44} />
          </span>
          <h2>Waiter Panel</h2>
        </div>

        <nav className="sidebar-nav">
          <button onClick={() => navigate("/waiter/dashboard")}>
            <span className="nav-icon">⌂</span> Dashboard
          </button>
          <button onClick={() => navigate("/waiter/create-order")}>
            <span className="nav-icon">＋</span> Create Order
          </button>
          <button className="active">
            <span className="nav-icon">♨</span> Kitchen Board
          </button>
          <button onClick={() => navigate("/waiter/billing")}>
            <span className="nav-icon">🧾</span> Billing
          </button>
        </nav>

        <button className="kitchen-logout" onClick={logout}>
          <span className="nav-icon">⇥</span> Logout
        </button>
      </aside>

      {/* MAIN CONTENT */}
      <main className="kitchen-main">
        {/* TOP HEADER */}
        <header className="kitchen-header">
          <div className="header-left">
            <button className="back-nav-btn" onClick={() => navigate("/waiter/dashboard")} title="Back to Dashboard">
              ←
            </button>
            <div>
              <div className="header-title-row">
                <h1>Kitchen Order Board</h1>
                <span className="live-status-pill">
                  <span className="live-dot" /> Live Queue ({orders.length} Active)
                </span>
                <span className="read-only-badge">
                  <span>👁️</span> Monitor Only (Read-Only)
                </span>
              </div>
              <p>Real-time order queue monitoring. Preparation status is managed by the Kitchen/Chef.</p>
            </div>
          </div>

          <div className="header-actions" style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div className="notification-wrap" ref={notifRef} style={{ position: "relative" }}>
              <button
                type="button"
                className="refresh-kitchen"
                aria-label="Notifications"
                onClick={() => setShowNotifications((open) => !open)}
                title="Notifications"
                style={{ position: "relative", display: "inline-flex", alignItems: "center", justifyContent: "center", width: "40px", height: "40px", borderRadius: "50%", padding: 0, fontSize: "18px" }}
              >
                🔔
                {notifications.filter((n) => !String(n.type).toLowerCase().includes("kitchen")).length > 0 && (
                  <span style={{ position: "absolute", top: "-2px", right: "-2px", background: "#ef4444", color: "#fff", borderRadius: "10px", padding: "1px 5px", fontSize: "10px", fontWeight: "700" }}>
                    {notifications.filter((n) => !String(n.type).toLowerCase().includes("kitchen")).length}
                  </span>
                )}
              </button>

              {showNotifications && (() => {
                const ago = (val) => {
                  const m = Math.max(0, Math.floor((Date.now() - new Date(val).getTime()) / 60000));
                  if (m < 1) return "Just now";
                  if (m < 60) return `${m}m ago`;
                  return `${Math.floor(m / 60)}h ${m % 60}m ago`;
                };
                const getCat = (t = "") => {
                  const typeStr = String(t).toLowerCase();
                  if (typeStr.includes("qr") || typeStr.includes("customer") || typeStr.includes("bill") || typeStr.includes("user")) return "user";
                  return "waiter";
                };
                const getBadge = (t = "") => {
                  const cat = getCat(t);
                  if (cat === "user") return { label: "📱 User", bg: "#dbeafe", color: "#1e40af" };
                  return { label: "🛎️ Waiter", bg: "#f3e8ff", color: "#6b21a8" };
                };

                const kdsNotifications = notifications.filter((n) => !String(n.type).toLowerCase().includes("kitchen"));
                const userCount = kdsNotifications.filter((n) => getCat(n.type) === "user").length;
                const waiterCount = kdsNotifications.filter((n) => getCat(n.type) === "waiter").length;

                const filteredNotifs = kdsNotifications.filter((n) => {
                  if (notifFilter === "all") return true;
                  return getCat(n.type) === notifFilter;
                });

                return (
                  <div className="notification-panel" style={{ position: "absolute", top: "45px", right: "0", width: "340px", maxHeight: "420px", overflowY: "auto", background: "#ffffff", border: "1px solid #cbd5e1", borderRadius: "12px", boxShadow: "0 12px 28px rgba(0,0,0,0.18)", padding: "12px", zIndex: 1000, color: "#0f172a" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                      <b style={{ color: "#0f172a", fontSize: "14px" }}>Notifications</b>
                      <button type="button" onClick={() => setShowNotifications(false)} style={{ border: 0, background: "none", color: "#94a3b8", cursor: "pointer", fontSize: "14px" }}>✕</button>
                    </div>
                    <div style={{ display: "flex", gap: "6px", marginBottom: "10px", borderBottom: "1px solid #e2e8f0", paddingBottom: "8px", overflowX: "auto" }}>
                      <button type="button" style={{ padding: "4px 8px", borderRadius: "14px", border: "none", background: notifFilter === "all" ? "#2563eb" : "#f1f5f9", color: notifFilter === "all" ? "#fff" : "#475569", fontSize: "11px", fontWeight: "600", cursor: "pointer", whitespace: "nowrap" }} onClick={() => setNotifFilter("all")}>
                        All ({kdsNotifications.length})
                      </button>
                      <button type="button" style={{ padding: "4px 8px", borderRadius: "14px", border: "none", background: notifFilter === "user" ? "#1e40af" : "#f1f5f9", color: notifFilter === "user" ? "#fff" : "#475569", fontSize: "11px", fontWeight: "600", cursor: "pointer", whitespace: "nowrap" }} onClick={() => setNotifFilter("user")}>
                        📱 User ({userCount})
                      </button>
                      <button type="button" style={{ padding: "4px 8px", borderRadius: "14px", border: "none", background: notifFilter === "waiter" ? "#6b21a8" : "#f1f5f9", color: notifFilter === "waiter" ? "#fff" : "#475569", fontSize: "11px", fontWeight: "600", cursor: "pointer", whitespace: "nowrap" }} onClick={() => setNotifFilter("waiter")}>
                        🛎️ Waiter ({waiterCount})
                      </button>
                    </div>
                    {filteredNotifs.length ? filteredNotifs.slice(0, 15).map((notification) => {
                      const badge = getBadge(notification.type);
                      return (
                        <article key={notification._id} style={{ padding: "8px 0", borderBottom: "1px solid #f1f5f9" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "8px" }}>
                            <strong style={{ fontSize: "12px", color: "#0f172a" }}>{notification.title}</strong>
                            <span style={{ fontSize: "10px", fontWeight: "700", padding: "2px 6px", borderRadius: "10px", background: badge.bg, color: badge.color, whitespace: "nowrap", flexShrink: 0 }}>
                              {badge.label}
                            </span>
                          </div>
                          <p style={{ margin: "4px 0", fontSize: "11px", color: "#334155", lineHeight: "1.4" }}>{notification.message}</p>
                          <small style={{ fontSize: "10px", color: "#94a3b8" }}>{ago(notification.createdAt)}</small>
                        </article>
                      );
                    }) : <p style={{ padding: "12px", textAlign: "center", color: "#64748b", fontSize: "12px" }}>No notifications in this category.</p>}
                  </div>
                );
              })()}
            </div>

            <button
              className="refresh-kitchen"
              onClick={() => load()}
              disabled={loading}
              title={`Last updated: ${lastUpdated.toLocaleTimeString()}`}
            >
              🔄 Refresh
            </button>
          </div>
        </header>

        {error && <div className="kitchen-error">{error}</div>}

        {/* METRICS / STATS OVERVIEW CARDS */}
        <section className="kitchen-stats-grid">
          <div
            className={`stat-card total ${statusFilter === "all" ? "selected" : ""}`}
            onClick={() => setStatusFilter("all")}
          >
            <div className="stat-icon blue">📋</div>
            <div className="stat-info">
              <span className="stat-label">Total Active</span>
              <strong className="stat-value">{orders.length}</strong>
            </div>
          </div>

          <div
            className={`stat-card new ${statusFilter === "New" ? "selected" : ""}`}
            onClick={() => setStatusFilter(statusFilter === "New" ? "all" : "New")}
          >
            <div className="stat-icon purple">⚡</div>
            <div className="stat-info">
              <span className="stat-label">New Orders</span>
              <strong className="stat-value">{newCount}</strong>
            </div>
          </div>

          <div
            className={`stat-card preparing ${statusFilter === "Preparing" ? "selected" : ""}`}
            onClick={() => setStatusFilter(statusFilter === "Preparing" ? "all" : "Preparing")}
          >
            <div className="stat-icon amber">🔥</div>
            <div className="stat-info">
              <span className="stat-label">Cooking in Progress</span>
              <strong className="stat-value">{preparingCount}</strong>
            </div>
          </div>

          <div
            className={`stat-card ready ${statusFilter === "Ready" ? "selected" : ""}`}
            onClick={() => setStatusFilter(statusFilter === "Ready" ? "all" : "Ready")}
          >
            <div className="stat-icon green">🍽️</div>
            <div className="stat-info">
              <span className="stat-label">Ready to Serve</span>
              <strong className="stat-value">{readyCount}</strong>
            </div>
          </div>
        </section>

        {/* CONTROLS BAR: SEARCH, STATUS TABS & VIEW TOGGLE */}
        <div className="kitchen-controls-bar">
          <div className="search-wrap">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              placeholder="Search table, order ID, customer or dish..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button className="clear-search-btn" onClick={() => setSearchQuery("")}>
                ✕
              </button>
            )}
          </div>

          <div className="filter-and-view">
            <div className="status-tabs" role="tablist">
              <button
                className={`status-tab ${statusFilter === "all" ? "active" : ""}`}
                onClick={() => setStatusFilter("all")}
              >
                All ({orders.length})
              </button>
              <button
                className={`status-tab tab-new ${statusFilter === "New" ? "active" : ""}`}
                onClick={() => setStatusFilter("New")}
              >
                New ({newCount})
              </button>
              <button
                className={`status-tab tab-preparing ${statusFilter === "Preparing" ? "active" : ""}`}
                onClick={() => setStatusFilter("Preparing")}
              >
                Cooking ({preparingCount})
              </button>
              <button
                className={`status-tab tab-ready ${statusFilter === "Ready" ? "active" : ""}`}
                onClick={() => setStatusFilter("Ready")}
              >
                Ready ({readyCount})
              </button>
            </div>

            <div className="view-toggle-btns" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              {viewMode === "grid" && (
                <select
                  className="table-per-page-select"
                  value={kitchenPerPage}
                  onChange={(e) => {
                    setKitchenPerPage(Number(e.target.value));
                    setKitchenPage(1);
                  }}
                  style={{
                    padding: "6px 10px",
                    borderRadius: "8px",
                    border: "1px solid #cbd5e1",
                    background: "#ffffff",
                    fontSize: "13px",
                    fontWeight: 600,
                    color: "#334155",
                    cursor: "pointer",
                  }}
                  aria-label="Orders per page"
                >
                  <option value={6}>6 per page</option>
                  <option value={9}>9 per page</option>
                  <option value={12}>12 per page</option>
                  <option value={24}>24 per page</option>
                </select>
              )}
              <button
                className={`view-btn ${viewMode === "grid" ? "active" : ""}`}
                onClick={() => setViewMode("grid")}
                title="Grid View (Responsive multi-column orders grid)"
              >
                🔲 Grid View
              </button>
              <button
                className={`view-btn ${viewMode === "lanes" ? "active" : ""}`}
                onClick={() => setViewMode("lanes")}
                title="Lanes View (Kanban columns)"
              >
                📋 Lanes View
              </button>
            </div>
          </div>
        </div>

        {/* VIEW 1: EXPANSIVE RESPONSIVE GRID (DEFAULT) */}
        {viewMode === "grid" && (
          <section className="kitchen-orders-grid-view">
            {filteredOrders.length === 0 ? (
              <div className="empty-kitchen-grid">
                <span className="empty-icon">🍽️</span>
                <h3>No orders found</h3>
                <p>
                  {searchQuery || statusFilter !== "all"
                    ? "Try adjusting your search query or status filter."
                    : "Kitchen queue is completely clear right now."}
                </p>
                {(searchQuery || statusFilter !== "all") && (
                  <button
                    className="reset-filters-btn"
                    onClick={() => {
                      setSearchQuery("");
                      setStatusFilter("all");
                    }}
                  >
                    Reset Filters
                  </button>
                )}
              </div>
            ) : (
              <div className="orders-grid">
                {paginatedOrders.map((order) => {
                  const status = order.status;
                  const flow = FLOW[status];
                  const isUpdating = working === order._id;

                  return (
                    <article
                      className={`kitchen-grid-card status-${status.toLowerCase()}`}
                      key={order._id}
                    >
                      {/* CARD HEADER */}
                      <div className="card-top-bar">
                        <div className="table-badge">
                          <span className="table-icon">🪑</span>
                          <strong>Table {String(order.tableNumber).replace(/^Table\s*/i, "")}</strong>
                        </div>

                        <span className={`status-badge-chip ${status.toLowerCase()}`}>
                          <span className="status-dot" />
                          {status === "New" ? "New Order" : status === "Preparing" ? "Cooking" : "Ready to Serve"}
                        </span>
                      </div>

                      {/* ORDER META */}
                      <div className="order-meta-row">
                        <span className="order-id-label">#{order._id.slice(-6).toUpperCase()}</span>
                        <span className="customer-name-label">
                          👤 {order.customerName || "Walk-in Guest"}
                        </span>
                        <span className="order-time-label">◷ {ago(order.createdAt)}</span>
                      </div>

                      {/* ORDER ITEMS LIST */}
                      <div className="order-items-container">
                        <div className="items-header">
                          <span>Items ordered</span>
                          <span className="total-items-badge">{itemCount(order)} items</span>
                        </div>

                        <ul className="items-list">
                          {(order.items || []).map((item, index) => (
                            <li key={`${item.menuItemId || item._id}-${index}`} className="item-row">
                              <span className="qty-tag">{item.quantity}×</span>
                              <div className="item-name-wrap">
                                <strong className="item-title">{item.name}</strong>
                                {item.selectedModifiers && item.selectedModifiers.length > 0 && (
                                  <small className="item-modifiers">
                                    {item.selectedModifiers.map((m) => m.name).join(", ")}
                                  </small>
                                )}
                              </div>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* READ-ONLY LIVE KITCHEN STATUS BADGE */}
                      <div className="card-footer read-only-footer">
                        <div className={`kitchen-status-pill status-${status.toLowerCase()}`}>
                          <span className="status-pill-icon">
                            {status === "New" ? "⏳" : status === "Preparing" ? "🔥" : "✅"}
                          </span>
                          <div className="status-pill-info">
                            <strong className="status-pill-label">
                              {status === "New"
                                ? "Waiting for Kitchen"
                                : status === "Preparing"
                                ? "Cooking in Progress"
                                : "Ready to Serve"}
                            </strong>
                            <small className="status-pill-hint">
                              {status === "New"
                                ? "Order received · Chef has not started yet"
                                : status === "Preparing"
                                ? "Chef is cooking this order"
                                : "Food prepared · Ready for pickup"}
                            </small>
                          </div>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}

            {/* Pagination Controls */}
            {filteredOrders.length > 0 && totalKitchenPages > 1 && (
              <div className="table-pagination-bar" style={{ marginTop: "20px" }}>
                <span className="pagination-info">
                  Showing {Math.min((currentKitchenPage - 1) * kitchenPerPage + 1, filteredOrders.length)}–
                  {Math.min(currentKitchenPage * kitchenPerPage, filteredOrders.length)} of {filteredOrders.length} orders
                </span>
                <div className="pagination-nav">
                  <button
                    className="page-number-btn"
                    disabled={currentKitchenPage <= 1}
                    onClick={() => setKitchenPage((p) => Math.max(p - 1, 1))}
                    title="Previous page"
                    aria-label="Previous page"
                  >
                    ‹
                  </button>
                  {getPaginationRange(currentKitchenPage, totalKitchenPages).map((item, idx) =>
                    item === "..." ? (
                      <span key={`kp-ellipsis-${idx}`} className="page-ellipsis">…</span>
                    ) : (
                      <button
                        key={`kp-page-${item}`}
                        className={`page-number-btn ${item === currentKitchenPage ? "active" : ""}`}
                        onClick={() => setKitchenPage(item)}
                      >
                        {item}
                      </button>
                    )
                  )}
                  <button
                    className="page-number-btn"
                    disabled={currentKitchenPage >= totalKitchenPages}
                    onClick={() => setKitchenPage((p) => Math.min(p + 1, totalKitchenPages))}
                    title="Next page"
                    aria-label="Next page"
                  >
                    ›
                  </button>
                </div>
              </div>
            )}
          </section>
        )}

        {/* VIEW 2: KANBAN LANES VIEW */}
        {viewMode === "lanes" && (
          <section className="kitchen-columns">
            {["New", "Preparing", "Ready"].map((status) => {
              const columnOrders = orders.filter((order) => order.status === status);
              const flow = FLOW[status];

              return (
                <div className={`kitchen-column ${status.toLowerCase()}`} key={status}>
                  <div className="kitchen-column-title">
                    <div className="col-title-left">
                      <h2>{status === "New" ? "New Orders" : status === "Preparing" ? "Cooking" : "Ready to Serve"}</h2>
                    </div>
                    <span className="col-count-badge">{columnOrders.length}</span>
                  </div>

                  <div className="column-cards-container">
                    {columnOrders.length ? (
                      columnOrders.map((order) => (
                        <article className={`kitchen-order-card status-${status.toLowerCase()}`} key={order._id}>
                          <div className="kitchen-order-top">
                            <b className="order-id">#{order._id.slice(-6).toUpperCase()}</b>
                            <strong className="table-badge-compact">🪑 Table {String(order.tableNumber).replace(/^Table\s*/i, "")}</strong>
                          </div>

                          <p className="order-customer-sub">
                            👤 {order.customerName || "Walk-in Guest"} · {itemCount(order)} items
                          </p>

                          <ul className="lane-items-list">
                            {(order.items || []).map((item, index) => (
                              <li key={`${item.menuItemId || item._id}-${index}`}>
                                <span className="lane-qty">{item.quantity}×</span> {item.name}
                              </li>
                            ))}
                          </ul>

                          <footer className="lane-card-footer">
                            <small>◷ {ago(order.createdAt)}</small>
                            <span className={`lane-status-pill status-${status.toLowerCase()}`}>
                              <span className="lane-pill-dot" />
                              {status === "New" ? "⏳ Waiting" : status === "Preparing" ? "🔥 Cooking" : "✅ Ready"}
                            </span>
                          </footer>
                        </article>
                      ))
                    ) : (
                      <div className="no-column-orders">
                        <span>✓</span>
                        <p>No {status.toLowerCase()} orders</p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </section>
        )}
      </main>
    </div>
  );
}

export default WaiterKitchen;
