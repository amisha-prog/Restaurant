import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { API_URL } from "../config/api";
import ChefLogoIcon from "../Components/ChefLogoIcon";
import "./ChefDashboard.css";

const money = (v) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(v || 0));

const getPaginationRange = (current, total) => {
  if (total <= 5) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }
  if (current <= 3) {
    return [1, 2, 3, 4, "...", total];
  }
  if (current >= total - 2) {
    return [1, "...", total - 3, total - 2, total - 1, total];
  }
  return [1, "...", current - 1, current, current + 1, "...", total];
};

const ChefDashboard = () => {
  const { chefId: paramChefId } = useParams();
  const navigate = useNavigate();

  // Session data for chef direct login
  const sessionChef = useMemo(() => {
    try {
      const raw = localStorage.getItem("chef") || localStorage.getItem("authUser");
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }, []);

  const effectiveChefId = paramChefId || sessionChef?._id || sessionChef?.id || sessionChef?.chefId;
  const isAdminView = Boolean(paramChefId);

  const [chefData, setChefData] = useState(null);
  const [restaurantData, setRestaurantData] = useState(null);
  const [stats, setStats] = useState({
    newOrdersCount: 0,
    preparingOrdersCount: 0,
    readyOrdersCount: 0,
    completedTodayCount: 0,
    totalActiveOrders: 0,
    outOfStockCount: 0,
  });

  const [orders, setOrders] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionSuccess, setActionSuccess] = useState("");
  const [actionLoadingId, setActionLoadingId] = useState(null);

  // Tabs: "kds" | "stock" | "history" | "profile" | "settings"
  const [activeTab, setActiveTab] = useState("kds");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [orderFilter, setOrderFilter] = useState("active"); // "active" | "New" | "Preparing" | "Ready" | "Completed" | "all"
  const [searchQuery, setSearchQuery] = useState("");
  const [menuSearch, setMenuSearch] = useState("");
  const [selectedStockCategory, setSelectedStockCategory] = useState("all");
  const [autoRefresh, setAutoRefresh] = useState(true);
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



  // Orders History Pagination & Search state
  const [historyPage, setHistoryPage] = useState(1);
  const [historyPerPage, setHistoryPerPage] = useState(8);
  const [historySearch, setHistorySearch] = useState("");

  // Password reset state
  const [resetPwd, setResetPwd] = useState("");
  const [resetPwdConfirm, setResetPwdConfirm] = useState("");
  const [resetPwdLoading, setResetPwdLoading] = useState(false);
  const [resetPwdMsg, setResetPwdMsg] = useState({ type: "", text: "" });
  const [showPwd, setShowPwd] = useState(false);

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
      const chefTargetId = chefData?._id || chefData?.id || effectiveChefId;
      const res = await fetch(`${API_URL}/chefs/${chefTargetId}/reset-password`, {
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

  // Real-time ticking clock
  const [currentTime, setCurrentTime] = useState(
    new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true })
  );

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(
        new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true })
      );
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch dashboard data
  const fetchDashboard = useCallback(async (isSilent = false) => {
    if (!effectiveChefId) {
      setError("No chef account found. Please sign in or access from Staff Management.");
      setLoading(false);
      return;
    }

    if (!isSilent) setLoading(true);
    setError("");

    try {
      const res = await fetch(`${API_URL}/chefs/${effectiveChefId}/dashboard`);
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to load kitchen dashboard.");
      }

      setChefData(data.chef);
      setRestaurantData(data.restaurant);
      setStats(data.stats || {});
      setOrders(data.orders || []);
      setMenuItems(data.menuItems || []);

      const restId = data.restaurant?.id || data.restaurant?._id || data.chef?.restaurantId;
      if (restId) {
        const notifRes = await fetch(`${API_URL}/orders/notifications?restaurantId=${restId}`);
        const notifData = await notifRes.json().catch(() => ({}));
        if (notifRes.ok && notifData.success) {
          setNotifications(notifData.notifications || []);
        }
      }
    } catch (err) {
      console.error("Chef dashboard fetch error:", err);
      if (!isSilent) setError(err.message || "Could not retrieve kitchen data.");
    } finally {
      if (!isSilent) setLoading(false);
    }
  }, [effectiveChefId]);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  // Auto-refresh orders every 12 seconds
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      fetchDashboard(true);
    }, 12000);
    return () => clearInterval(interval);
  }, [autoRefresh, fetchDashboard]);

  // Update order status (Preparing, Ready, Served)
  const handleUpdateOrderStatus = async (orderId, nextStatus) => {
    setActionLoadingId(orderId);
    setActionSuccess("");

    try {
      const res = await fetch(`${API_URL}/chefs/orders/${orderId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to update order status.");
      }

      setActionSuccess(`Order marked as "${nextStatus}"!`);
      setTimeout(() => setActionSuccess(""), 3000);
      await fetchDashboard(true);
    } catch (err) {
      alert(err.message || "Failed to update order status.");
    } finally {
      setActionLoadingId(null);
    }
  };

  // Toggle stock availability
  const handleToggleItemStock = async (itemId) => {
    try {
      const res = await fetch(`${API_URL}/chefs/menu/${itemId}/availability`, {
        method: "PATCH",
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Could not update stock.");
      }

      setMenuItems((prev) =>
        prev.map((item) => (item._id === itemId ? data.item : item))
      );
      setActionSuccess(data.message);
      setTimeout(() => setActionSuccess(""), 2500);
    } catch (err) {
      alert(err.message || "Failed to toggle stock status.");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("chef");
    localStorage.removeItem("authToken");
    localStorage.removeItem("authUser");
    navigate("/login");
  };

  // Filtered orders
  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      // Status filter
      let matchesFilter = true;
      if (orderFilter === "active") {
        matchesFilter = ["New", "Preparing", "Ready"].includes(order.status);
      } else if (orderFilter === "New") {
        matchesFilter = order.status === "New";
      } else if (orderFilter === "Preparing") {
        matchesFilter = order.status === "Preparing";
      } else if (orderFilter === "Ready") {
        matchesFilter = order.status === "Ready";
      } else if (orderFilter === "Completed") {
        matchesFilter = ["Served", "Completed"].includes(order.status);
      } else if (orderFilter === "all") {
        matchesFilter = true;
      }

      // Search query
      let matchesSearch = true;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const idMatch = String(order._id).toLowerCase().includes(q);
        const tableMatch = String(order.tableNumber || "").toLowerCase().includes(q);
        const itemMatch = (order.items || []).some((item) =>
          item.name?.toLowerCase().includes(q)
        );
        matchesSearch = idMatch || tableMatch || itemMatch;
      }

      return matchesFilter && matchesSearch;
    });
  }, [orders, orderFilter, searchQuery]);

  // Categories for 86 board
  const stockCategories = useMemo(() => {
    const cats = new Set(menuItems.map((m) => m.category).filter(Boolean));
    return ["all", ...Array.from(cats)];
  }, [menuItems]);

  // Filtered menu items for 86 board
  const filteredMenuItems = useMemo(() => {
    return menuItems.filter((item) => {
      const matchCat =
        selectedStockCategory === "all" || item.category === selectedStockCategory;
      const matchSearch =
        !menuSearch.trim() ||
        item.name?.toLowerCase().includes(menuSearch.toLowerCase().trim()) ||
        item.category?.toLowerCase().includes(menuSearch.toLowerCase().trim());
      return matchCat && matchSearch;
    });
  }, [menuItems, selectedStockCategory, menuSearch]);

  const filteredHistoryOrders = useMemo(() => {
    if (!historySearch.trim()) return orders;
    const q = historySearch.trim().toLowerCase();
    return orders.filter((o) => {
      const matchId = String(o._id || "").toLowerCase().includes(q);
      const matchTable = String(o.tableNumber || "").toLowerCase().includes(q);
      const matchSource = String(o.source || "").toLowerCase().includes(q);
      const matchStatus = String(o.status || "").toLowerCase().includes(q);
      const matchItems = (o.items || []).some((it) => String(it.name || "").toLowerCase().includes(q));
      return matchId || matchTable || matchSource || matchStatus || matchItems;
    });
  }, [orders, historySearch]);

  const totalHistoryPages = Math.ceil(filteredHistoryOrders.length / historyPerPage) || 1;
  const currentHistoryPage = Math.min(historyPage, totalHistoryPages);

  const paginatedHistoryOrders = useMemo(() => {
    const start = (currentHistoryPage - 1) * historyPerPage;
    return filteredHistoryOrders.slice(start, start + historyPerPage);
  }, [filteredHistoryOrders, currentHistoryPage, historyPerPage]);

  const getTimeElapsed = (dateString) => {
    if (!dateString) return "just now";
    const diffMin = Math.floor((Date.now() - new Date(dateString).getTime()) / 60000);
    if (diffMin <= 1) return "Just now";
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHr = Math.floor(diffMin / 60);
    return `${diffHr}h ${diffMin % 60}m ago`;
  };

  if (loading && !chefData) {
    return (
      <div className="chef-loading-screen">
        <div className="chef-spinner" />
        <p>Loading Kitchen Station & Display...</p>
      </div>
    );
  }

  if (error && !chefData) {
    return (
      <div className="chef-error-screen">
        <span className="error-icon">⚠️</span>
        <h3>Unable to Load Chef Dashboard</h3>
        <p>{error}</p>
        <button className="btn-error-back" onClick={() => navigate(-1)}>
          ← Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="chef-layout">
      {/* Off-canvas sidebar overlay for mobile */}
      {sidebarOpen && (
        <div className="chef-sidebar-overlay" onClick={() => setSidebarOpen(false)} />
      )}

      {/* ========================================================
          LEFT SIDEBAR (Off-canvas drawer on mobile)
      ======================================================== */}
      <aside className={`chef-sidebar ${sidebarOpen ? "open" : ""}`}>
        <div className="chef-sidebar-brand">
          <div className="chef-brand-icon">
            <ChefLogoIcon size={46} />
          </div>
          <div>
            <h2>FoodVista KDS</h2>
            <span>Kitchen Display System</span>
          </div>
          <button
            type="button"
            className="chef-sidebar-close-btn"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close menu"
          >
            ✕
          </button>
        </div>

        {/* Chef Profile Badge in Sidebar */}
        <div className="chef-sidebar-profile">
          <div className="chef-profile-avatar">
            <ChefLogoIcon size={42} />
          </div>
          <div className="chef-profile-info">
            <strong>{chefData?.name || "Chef"}</strong>
            <span className="chef-id-badge">ID: {chefData?.chefId || "CHEF"}</span>
            <span className="chef-role-pill">{chefData?.speciality || "Head Chef"}</span>
          </div>
        </div>

        {/* Restaurant Pin */}
        <div className="chef-rest-badge">
          <span className="rest-icon">🏪</span>
          <span className="rest-name">{restaurantData?.restaurantName || "My Restaurant"}</span>
          {restaurantData?.restaurantId && (
            <span className="rest-code">({restaurantData.restaurantId})</span>
          )}
        </div>

        {/* Navigation Tabs */}
        <nav className="chef-nav-menu">
          <button
            type="button"
            className={`chef-nav-item ${activeTab === "kds" ? "active" : ""}`}
            onClick={() => { setActiveTab("kds"); setSidebarOpen(false); }}
          >
            <span className="nav-icon">🍳</span>
            <span className="nav-text">Live Orders (KDS)</span>
            {stats.totalActiveOrders > 0 && (
              <span className="nav-badge count-active">{stats.totalActiveOrders}</span>
            )}
          </button>

          <button
            type="button"
            className={`chef-nav-item ${activeTab === "stock" ? "active" : ""}`}
            onClick={() => { setActiveTab("stock"); setSidebarOpen(false); }}
          >
            <span className="nav-icon">📦</span>
            <span className="nav-text">Kitchen 86 Board</span>
            {stats.outOfStockCount > 0 && (
              <span className="nav-badge count-alert">{stats.outOfStockCount} Out</span>
            )}
          </button>

          <button
            type="button"
            className={`chef-nav-item ${activeTab === "history" ? "active" : ""}`}
            onClick={() => { setActiveTab("history"); setSidebarOpen(false); }}
          >
            <span className="nav-icon">📋</span>
            <span className="nav-text">Orders History</span>
            <span className="nav-badge count-neutral">{orders.length}</span>
          </button>

          <button
            type="button"
            className={`chef-nav-item ${activeTab === "profile" ? "active" : ""}`}
            onClick={() => { setActiveTab("profile"); setSidebarOpen(false); }}
          >
            <span className="nav-icon">👤</span>
            <span className="nav-text">Chef & Station Info</span>
          </button>

          <button
            type="button"
            className={`chef-nav-item ${activeTab === "settings" ? "active" : ""}`}
            onClick={() => { setActiveTab("settings"); setSidebarOpen(false); }}
          >
            <span className="nav-icon">⚙️</span>
            <span className="nav-text">Settings</span>
          </button>
        </nav>

        {/* Bottom Exit Action */}
        <div className="chef-sidebar-footer">
          {isAdminView ? (
            <button
              type="button"
              className="chef-sidebar-exit-btn admin-return"
              onClick={() => { navigate("/admin/dashboard"); setSidebarOpen(false); }}
            >
              <span>←</span> Return to Staff
            </button>
          ) : (
            <button
              type="button"
              className="chef-sidebar-exit-btn chef-signout"
              onClick={() => { handleLogout(); setSidebarOpen(false); }}
            >
              <span>🚪</span> Logout Station
            </button>
          )}
        </div>
      </aside>

      {/* ========================================================
          RIGHT MAIN CONTENT
      ======================================================== */}
      <main className="chef-main-content">
        {/* Top Header Bar */}
        <header className="chef-topbar">
          <div className="chef-topbar-left">
            <button
              type="button"
              className="chef-mobile-menu-btn"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open menu"
            >
              <span></span>
              <span></span>
              <span></span>
            </button>
            <div className="chef-mobile-brand">
              <ChefLogoIcon size={34} />
            </div>
            <div>
              <h1>
                {activeTab === "kds" && "Live Kitchen Orders"}
                {activeTab === "stock" && "Kitchen 86 Board (Menu Stock)"}
                {activeTab === "history" && "Kitchen Orders Log"}
                {activeTab === "profile" && "Chef Station Profile"}
                {activeTab === "settings" && "Settings"}
              </h1>
              <p className="chef-topbar-sub">
                {restaurantData?.restaurantName} · Station: {chefData?.speciality || "General"} · Shift: {chefData?.shift || "Full Day"}
              </p>
            </div>
          </div>

          <div className="chef-topbar-right" style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            {/* Notification Bell Icon */}
            <div className="notification-wrap" ref={notifRef} style={{ position: "relative" }}>
              <button
                type="button"
                className="chef-notif-button"
                aria-label="Notifications"
                onClick={() => setShowNotifications((open) => !open)}
                title="Notifications"
                style={{
                  position: "relative",
                  background: "#f1f5f9",
                  border: "1px solid #cbd5e1",
                  borderRadius: "50%",
                  width: "40px",
                  height: "40px",
                  padding: "0",
                  fontSize: "18px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "all 0.2s ease"
                }}
              >
                <span>🔔</span>
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

                // Exclude Kitchen's own notifications in KDS Dashboard
                const kdsNotifications = notifications.filter((n) => !String(n.type).toLowerCase().includes("kitchen"));
                const userCount = kdsNotifications.filter((n) => getCat(n.type) === "user").length;
                const waiterCount = kdsNotifications.filter((n) => getCat(n.type) === "waiter").length;

                const filteredNotifs = kdsNotifications.filter((n) => {
                  if (notifFilter === "all") return true;
                  return getCat(n.type) === notifFilter;
                });

                return (
                  <div className="notification-panel" style={{ position: "absolute", top: "45px", right: "0", width: "340px", maxHeight: "420px", overflowY: "auto", background: "#ffffff", border: "1px solid #cbd5e1", borderRadius: "12px", boxShadow: "0 12px 28px rgba(0,0,0,0.18)", padding: "12px", zIndex: 1000 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                      <b style={{ color: "#0f172a", fontSize: "14px" }}>Notifications</b>
                      <button type="button" onClick={() => setShowNotifications(false)} style={{ border: 0, background: "none", color: "#94a3b8", cursor: "pointer", fontSize: "14px", padding: "2px 6px" }}>✕</button>
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

            {/* Realtime Live Clock */}
            <div className="chef-clock-card" title="Current Kitchen Time">
              <span className="clock-pulse" />
              <span className="clock-time">🕒 {currentTime}</span>
            </div>

            {/* Auto refresh pill */}
            <button
              type="button"
              className={`chef-auto-toggle ${autoRefresh ? "active" : ""}`}
              onClick={() => setAutoRefresh(!autoRefresh)}
              title={autoRefresh ? "Auto-refreshing every 12 seconds" : "Auto-refresh paused"}
            >
              <span className="auto-full-text">{autoRefresh ? "🟢 Auto Refresh" : "⚪ Paused"}</span>
              <span className="auto-short-text">{autoRefresh ? "🟢 Auto" : "⚪ Off"}</span>
            </button>
          </div>
        </header>

        {/* Toast Notification */}
        {actionSuccess && (
          <div className="chef-toast-alert success">
            <span>✨</span> {actionSuccess}
          </div>
        )}

        {/* ========================================================
            METRIC STAT CARDS
        ======================================================== */}
        <section className="chef-stat-cards-grid">
          <div
            className={`chef-stat-card card-new ${orderFilter === "New" ? "selected" : ""}`}
            onClick={() => { setOrderFilter("New"); setActiveTab("kds"); }}
          >
            <div className="stat-card-icon icon-new">🛎️</div>
            <div className="stat-card-body">
              <span className="stat-card-label">New Orders</span>
              <strong className="stat-card-num">{stats.newOrdersCount}</strong>
              <span className="stat-card-sub">Awaiting Preparation</span>
            </div>
            {stats.newOrdersCount > 0 && <span className="stat-badge-pulse" />}
          </div>

          <div
            className={`chef-stat-card card-prep ${orderFilter === "Preparing" ? "selected" : ""}`}
            onClick={() => { setOrderFilter("Preparing"); setActiveTab("kds"); }}
          >
            <div className="stat-card-icon icon-prep">🔥</div>
            <div className="stat-card-body">
              <span className="stat-card-label">Cooking Now</span>
              <strong className="stat-card-num">{stats.preparingOrdersCount}</strong>
              <span className="stat-card-sub">In Kitchen Preparation</span>
            </div>
          </div>

          <div
            className={`chef-stat-card card-ready ${orderFilter === "Ready" ? "selected" : ""}`}
            onClick={() => { setOrderFilter("Ready"); setActiveTab("kds"); }}
          >
            <div className="stat-card-icon icon-ready">✅</div>
            <div className="stat-card-body">
              <span className="stat-card-label">Ready for Pickup</span>
              <strong className="stat-card-num">{stats.readyOrdersCount}</strong>
              <span className="stat-card-sub">Waiting for Waiter</span>
            </div>
          </div>

          <div
            className={`chef-stat-card card-completed ${orderFilter === "Completed" ? "selected" : ""}`}
            onClick={() => { setOrderFilter("Completed"); setActiveTab("kds"); }}
          >
            <div className="stat-card-icon icon-completed">🍲</div>
            <div className="stat-card-body">
              <span className="stat-card-label">Delivered Today</span>
              <strong className="stat-card-num">{stats.completedTodayCount}</strong>
              <span className="stat-card-sub">Completed Dishes</span>
            </div>
          </div>

          <div
            className={`chef-stat-card card-stock ${activeTab === "stock" ? "selected" : ""}`}
            onClick={() => setActiveTab("stock")}
          >
            <div className="stat-card-icon icon-stock">📦</div>
            <div className="stat-card-body">
              <span className="stat-card-label">86'd Out of Stock</span>
              <strong className="stat-card-num">{stats.outOfStockCount}</strong>
              <span className="stat-card-sub">Items Unavailable</span>
            </div>
          </div>
        </section>

        {/* ========================================================
            TAB 1: LIVE ORDERS (KDS)
        ======================================================== */}
        {activeTab === "kds" && (
          <section className="chef-kds-section">
            {/* Filter Toolbar */}
            <div className="chef-kds-toolbar">
              <div className="kds-filter-pills">
                {[
                  { key: "active", label: "🔥 All Active", count: stats.totalActiveOrders },
                  { key: "New", label: "🛎️ New", count: stats.newOrdersCount },
                  { key: "Preparing", label: "🍳 Cooking", count: stats.preparingOrdersCount },
                  { key: "Ready", label: "✅ Ready", count: stats.readyOrdersCount },
                  { key: "Completed", label: "📦 Completed", count: stats.completedTodayCount },
                  { key: "all", label: "📋 All Orders", count: orders.length },
                ].map((f) => (
                  <button
                    key={f.key}
                    type="button"
                    className={`filter-pill-btn ${orderFilter === f.key ? "active" : ""}`}
                    onClick={() => setOrderFilter(f.key)}
                  >
                    {f.label} <span className="pill-count">({f.count})</span>
                  </button>
                ))}
              </div>

              <div className="kds-search-box">
                <input
                  type="search"
                  placeholder="Search table, item, or order #..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            {/* Orders Content */}
            {filteredOrders.length === 0 ? (
              <div className="chef-empty-card">
                <span className="empty-icon">🍽️</span>
                <h3>No Orders in this Status</h3>
                <p>
                  {orderFilter === "active"
                    ? "All active kitchen orders are cleared! New orders from QR and Waiters will appear here in real time."
                    : `There are currently 0 orders under "${orderFilter}".`}
                </p>
                {orderFilter !== "active" && (
                  <button
                    type="button"
                    className="btn-reset-filter"
                    onClick={() => setOrderFilter("active")}
                  >
                    View All Active Orders ({stats.totalActiveOrders})
                  </button>
                )}
              </div>
            ) : (
              <div className="chef-orders-grid">
                {filteredOrders.map((order) => {
                  const isNew = order.status === "New";
                  const isPreparing = order.status === "Preparing";
                  const isReady = order.status === "Ready";
                  const isCompleted = ["Served", "Completed"].includes(order.status);
                  const isBusy = actionLoadingId === order._id;

                  const diffMin = Math.floor(
                    (Date.now() - new Date(order.createdAt).getTime()) / 60000
                  );
                  const isUrgent = (isNew || isPreparing) && diffMin >= 12;

                  return (
                    <article
                      key={order._id}
                      className={`chef-order-card status-${order.status?.toLowerCase()} ${isUrgent ? "urgent-card" : ""}`}
                    >
                      {/* Top Header of the Order Card */}
                      <div className="order-card-header">
                        <div className="order-table-title">
                          <span className="table-badge">
                            {order.tableNumber
                              ? (/^table\s*/i.test(String(order.tableNumber).trim())
                                  ? String(order.tableNumber).trim()
                                  : `Table ${order.tableNumber}`)
                              : "Takeaway"}
                          </span>
                          <span className="order-id-label">#{String(order._id).slice(-5).toUpperCase()}</span>
                        </div>

                        <div className="order-time-tag">
                          <span className={`time-pill ${isUrgent ? "urgent-pill" : ""}`}>
                            ⏱️ {getTimeElapsed(order.createdAt)}
                          </span>
                        </div>
                      </div>

                      {/* Customer & Origin info */}
                      <div className="order-card-meta">
                        <span className="meta-customer">👤 {order.customerName || "Walk-in Guest"}</span>
                        <span className={`meta-source ${order.source === "Admin" ? "source-admin" : order.source === "QR" ? "source-qr" : "source-waiter"}`}>
                          {order.source === "Admin"
                            ? "🛡️ Admin Order"
                            : order.source === "QR"
                            ? "📱 QR Order"
                            : "👔 Waiter Order"}
                        </span>
                      </div>

                      {/* Items List */}
                      <div className="order-items-box">
                        {(order.items || []).map((item, idx) => (
                          <div key={idx} className="order-item-row">
                            <span className="item-qty-tag">{item.quantity}×</span>
                            <div className="item-text">
                              <span className="item-name">{item.name}</span>
                              {item.selectedModifiers?.length > 0 && (
                                <div className="item-mod-list">
                                  {item.selectedModifiers.map((m, mIdx) => (
                                    <span key={mIdx} className="item-mod-pill">
                                      + {m.name}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Order Special Instructions */}
                      {order.specialInstructions && (
                        <div className="order-notes-callout">
                          <strong>Note:</strong> {order.specialInstructions}
                        </div>
                      )}

                      {/* Status indicator bar */}
                      <div className="order-card-status-bar">
                        <span className={`order-status-badge badge-${order.status?.toLowerCase()}`}>
                          {isNew && "🛎️ New Order"}
                          {isPreparing && "🔥 In Preparation"}
                          {isReady && "✅ Ready for Pickup"}
                          {isCompleted && "✔️ Served / Completed"}
                        </span>
                        <span className="order-items-total-qty">
                          {(order.items || []).reduce((s, i) => s + (i.quantity || 1), 0)} items total
                        </span>
                      </div>

                      {/* Action buttons */}
                      <div className="order-card-actions">
                        {isNew && (
                          <button
                            type="button"
                            className="btn-kds-action btn-start-prep"
                            disabled={isBusy}
                            onClick={() => handleUpdateOrderStatus(order._id, "Preparing")}
                          >
                            {isBusy ? "Updating..." : "🔥 Start Cooking"}
                          </button>
                        )}

                        {isPreparing && (
                          <button
                            type="button"
                            className="btn-kds-action btn-mark-ready"
                            disabled={isBusy}
                            onClick={() => handleUpdateOrderStatus(order._id, "Ready")}
                          >
                            {isBusy ? "Updating..." : "✅ Food is Ready"}
                          </button>
                        )}

                        {isReady && (
                          <div className="ready-action-row">
                            <span className="ready-callout-text">
                              🔔 Waiter Notified! Food waiting at counter
                            </span>
                            <button
                              type="button"
                              className="btn-kds-action btn-mark-served"
                              disabled={isBusy}
                              onClick={() => handleUpdateOrderStatus(order._id, "Served")}
                            >
                              {isBusy ? "Saving..." : "🍽️ Mark as Picked Up"}
                            </button>
                          </div>
                        )}

                        {isCompleted && (
                          <div className="completed-card-footer">
                            <span>🎉 Order Served & Completed</span>
                          </div>
                        )}
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        )}

        {/* ========================================================
            TAB 2: KITCHEN STOCK & 86 BOARD
        ======================================================== */}
        {activeTab === "stock" && (
          <section className="chef-stock-section">
            <div className="stock-panel-header">
              <div className="stock-title-info">
                <h3>🍳 Kitchen 86 Board & Stock Management</h3>
                <p>
                  Toggle items as <strong>In Stock</strong> or <strong>Out of Stock</strong>. When an item is marked Out of Stock (86'd), customers and waiters cannot order it.
                </p>
              </div>

              <div className="stock-search-wrap">
                <input
                  type="search"
                  placeholder="Search dishes or categories..."
                  value={menuSearch}
                  onChange={(e) => setMenuSearch(e.target.value)}
                />
              </div>
            </div>

            {/* Category Filter Pills */}
            <div className="stock-category-pills">
              {stockCategories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  className={`stock-cat-btn ${selectedStockCategory === cat ? "active" : ""}`}
                  onClick={() => setSelectedStockCategory(cat)}
                >
                  {cat === "all" ? "All Categories" : cat}
                </button>
              ))}
            </div>

            {/* Items Grid */}
            <div className="stock-grid">
              {filteredMenuItems.map((item) => {
                const isAvailable =
                  item.inStock !== false && item.status?.toLowerCase() !== "unavailable";

                return (
                  <div
                    key={item._id}
                    className={`stock-card ${isAvailable ? "card-in-stock" : "card-out-stock"}`}
                  >
                    <div className="stock-card-top">
                      <div className="stock-card-thumb">
                        {item.image ? (
                          <img src={item.image} alt={item.name} />
                        ) : (
                          <div className="stock-placeholder-icon">🍲</div>
                        )}
                        <span className={`stock-badge ${isAvailable ? "available" : "out-of-stock"}`}>
                          {isAvailable ? "🟢 In Stock" : "🔴 86'd Out"}
                        </span>
                      </div>

                      <div className="stock-card-meta">
                        <span className="stock-cat-name">{item.category}</span>
                        <h4>{item.name}</h4>
                        <strong className="stock-price">{money(item.price)}</strong>
                      </div>
                    </div>

                    <button
                      type="button"
                      className={`btn-toggle-stock ${isAvailable ? "btn-make-out" : "btn-make-in"}`}
                      onClick={() => handleToggleItemStock(item._id)}
                    >
                      {isAvailable ? "Mark Out of Stock (86)" : "Restock Item (Available)"}
                    </button>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* ========================================================
            TAB 3: ORDERS HISTORY LOG
        ======================================================== */}
        {activeTab === "history" && (
          <section className="chef-history-section">
            {/* History Search & Per Page Controls */}
            <div className="history-controls-bar">
              <div className="history-search-box">
                <span className="search-icon">🔍</span>
                <input
                  type="text"
                  className="history-search-input"
                  placeholder="Search table, order #, or dish..."
                  value={historySearch}
                  onChange={(e) => {
                    setHistorySearch(e.target.value);
                    setHistoryPage(1);
                  }}
                />
              </div>
              <select
                className="history-per-page-select"
                value={historyPerPage}
                onChange={(e) => {
                  setHistoryPerPage(Number(e.target.value));
                  setHistoryPage(1);
                }}
              >
                <option value={5}>5 per page</option>
                <option value={8}>8 per page</option>
                <option value={12}>12 per page</option>
                <option value={20}>20 per page</option>
                <option value={100}>All orders</option>
              </select>
            </div>

            <div className="history-table-container">
              <table className="chef-history-table">
                <thead>
                  <tr>
                    <th>Order #</th>
                    <th>Table</th>
                    <th>Source</th>
                    <th>Time</th>
                    <th>Items</th>
                    <th>Status</th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedHistoryOrders.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="empty-table-cell">
                        {orders.length ? "No history orders match your search." : "No orders recorded yet."}
                      </td>
                    </tr>
                  ) : (
                    paginatedHistoryOrders.map((o) => (
                      <tr key={o._id}>
                        <td className="mono-order-id">#{String(o._id).slice(-6).toUpperCase()}</td>
                        <td>
                          <strong>{o.tableNumber ? `Table ${o.tableNumber}` : "Takeaway"}</strong>
                        </td>
                        <td>
                          <span className={`history-source-badge ${o.source === "Admin" ? "source-admin" : o.source === "QR" ? "source-qr" : "source-waiter"}`}>
                            {o.source === "Admin" ? "🛡️ Admin" : o.source === "QR" ? "📱 QR" : "👔 Waiter"}
                          </span>
                        </td>
                        <td>{getTimeElapsed(o.createdAt)}</td>
                        <td>
                          {(o.items || [])
                            .map((it) => `${it.quantity}× ${it.name}`)
                            .join(", ")}
                        </td>
                        <td>
                          <span className={`history-status-pill status-${o.status?.toLowerCase()}`}>
                            {o.status}
                          </span>
                        </td>
                        <td>
                          <strong>{money(o.total)}</strong>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* History Pagination Bar */}
            {filteredHistoryOrders.length > 0 && totalHistoryPages > 1 && (
              <div className="table-pagination-bar" style={{ marginTop: "16px" }}>
                <span className="pagination-info">
                  Showing {Math.min((currentHistoryPage - 1) * historyPerPage + 1, filteredHistoryOrders.length)}–
                  {Math.min(currentHistoryPage * historyPerPage, filteredHistoryOrders.length)} of {filteredHistoryOrders.length} orders
                </span>
                <div className="pagination-nav">
                  <button
                    className="page-number-btn"
                    disabled={currentHistoryPage <= 1}
                    onClick={() => setHistoryPage((p) => Math.max(p - 1, 1))}
                    title="Previous page"
                    aria-label="Previous page"
                  >
                    ‹
                  </button>
                  {getPaginationRange(currentHistoryPage, totalHistoryPages).map((item, idx) =>
                    item === "..." ? (
                      <span key={`h-ellipsis-${idx}`} className="page-ellipsis">…</span>
                    ) : (
                      <button
                        key={`h-page-${item}`}
                        className={`page-number-btn ${item === currentHistoryPage ? "active" : ""}`}
                        onClick={() => setHistoryPage(item)}
                      >
                        {item}
                      </button>
                    )
                  )}
                  <button
                    className="page-number-btn"
                    disabled={currentHistoryPage >= totalHistoryPages}
                    onClick={() => setHistoryPage((p) => Math.min(p + 1, totalHistoryPages))}
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

        {/* ========================================================
            TAB 4: CHEF PROFILE & STATION INFO
        ======================================================== */}
        {activeTab === "profile" && (
          <section className="chef-profile-section">
            <div className="profile-detail-card">
              <div className="profile-card-hero">
                <div className="profile-hero-avatar">
                  <ChefLogoIcon size={56} />
                </div>
                <div className="profile-hero-text">
                  <h2>{chefData?.name || "Chef"}</h2>
                  <span className="profile-id-pill">ID: {chefData?.chefId}</span>
                  <span className="profile-role-pill">🌟 {chefData?.speciality || "Head Chef"}</span>
                  <span className="profile-status-pill">🟢 Active Kitchen Station</span>
                </div>
              </div>

              <div className="profile-boxes-grid">
                <div className="profile-info-box">
                  <label>Restaurant Name & Code</label>
                  <strong>{restaurantData?.restaurantName || "Restaurant"} ({restaurantData?.restaurantId})</strong>
                </div>

                <div className="profile-info-box">
                  <label>Assigned Work Shift</label>
                  <strong>⏰ {chefData?.shift || "Full Day"}</strong>
                </div>

                <div className="profile-info-box">
                  <label>Kitchen Station Speciality</label>
                  <strong>🍳 {chefData?.speciality || "General Cooking"}</strong>
                </div>

                <div className="profile-info-box">
                  <label>Email Address</label>
                  <strong>✉️ {chefData?.email || "No email assigned"}</strong>
                </div>

                <div className="profile-info-box">
                  <label>Phone Number</label>
                  <strong>📞 {chefData?.phone || "No phone assigned"}</strong>
                </div>

                <div className="profile-info-box">
                  <label>Branch / City</label>
                  <strong>📍 {restaurantData?.city || "Main Branch"}</strong>
                </div>
              </div>

              <div className="profile-exit-actions">
                {isAdminView ? (
                  <button
                    type="button"
                    className="btn-profile-return"
                    onClick={() => navigate("/admin/dashboard")}
                  >
                    ← Back to Staff Management
                  </button>
                ) : (
                  <button
                    type="button"
                    className="btn-profile-return logout"
                    onClick={handleLogout}
                  >
                    🚪 Logout from Kitchen
                  </button>
                )}
              </div>
            </div>
          </section>
        )}

        {/* ========================================================
            TAB 5: SETTINGS & PASSWORD RESET
        ======================================================== */}
        {activeTab === "settings" && (
          <section className="chef-settings-section">
            <div className="chef-settings-grid">
              {/* Chef Profile Summary Card */}
              <div className="chef-settings-card">
                <div className="chef-settings-card-header">
                  <span className="chef-settings-card-icon">👨‍🍳</span>
                  <div>
                    <h3>Chef Profile</h3>
                    <p>Account & kitchen station details</p>
                  </div>
                </div>

                <div className="chef-settings-profile-info">
                  <div className="chef-settings-hero">
                    <div className="chef-settings-avatar">
                      <ChefLogoIcon size={48} />
                    </div>
                    <div>
                      <h4>{chefData?.name || "Chef"}</h4>
                      <span className="chef-settings-id-pill">ID: {chefData?.chefId || "CHEF"}</span>
                      <span className="chef-settings-spec-pill">🍳 {chefData?.speciality || "Head Chef"}</span>
                    </div>
                  </div>

                  <div className="chef-settings-detail-list">
                    <div className="chef-detail-row">
                      <span className="label">🏪 Restaurant</span>
                      <span className="val">{restaurantData?.restaurantName || "Restaurant"} ({restaurantData?.restaurantId || "—"})</span>
                    </div>
                    <div className="chef-detail-row">
                      <span className="label">✉️ Email</span>
                      <span className="val">{chefData?.email || "—"}</span>
                    </div>
                    <div className="chef-detail-row">
                      <span className="label">📞 Phone</span>
                      <span className="val">{chefData?.phone || "—"}</span>
                    </div>
                    <div className="chef-detail-row">
                      <span className="label">⏰ Work Shift</span>
                      <span className="val">{chefData?.shift || "Full Day"}</span>
                    </div>
                    <div className="chef-detail-row">
                      <span className="label">🟢 Station Status</span>
                      <span className="chef-status-tag active">{chefData?.status || "Active"}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Reset Password Card */}
              <div className="chef-settings-card">
                <div className="chef-settings-card-header">
                  <span className="chef-settings-card-icon">🔐</span>
                  <div>
                    <h3>Reset Password</h3>
                    <p>Update password for this chef account</p>
                  </div>
                </div>

                <form className="chef-settings-reset-form" onSubmit={handleResetPassword}>
                  {/* Hidden username input so Chrome browser popup identifies chef account instead of superadmin */}
                  <input
                    type="text"
                    name="username"
                    value={chefData?.email || chefData?.chefId || chefData?.name || "chef"}
                    readOnly
                    autoComplete="username"
                    style={{ display: "none" }}
                  />

                  {resetPwdMsg.text && (
                    <div className={`chef-settings-alert ${resetPwdMsg.type === "success" ? "alert-success" : "alert-error"}`}>
                      {resetPwdMsg.text}
                    </div>
                  )}

                  <div className="chef-settings-field">
                    <label>New Password *</label>
                    <div className="chef-pwd-input-wrap">
                      <input
                        type={showPwd ? "text" : "password"}
                        name="new-password"
                        autoComplete="new-password"
                        className="chef-settings-input"
                        placeholder="Enter new password (min 6 characters)"
                        value={resetPwd}
                        onChange={(e) => setResetPwd(e.target.value)}
                        required
                        minLength={6}
                      />
                      <button
                        type="button"
                        className="chef-pwd-toggle-btn"
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

                  <div className="chef-settings-field">
                    <label>Confirm New Password *</label>
                    <div className="chef-pwd-input-wrap">
                      <input
                        type={showPwd ? "text" : "password"}
                        name="confirm-password"
                        autoComplete="new-password"
                        className="chef-settings-input"
                        placeholder="Re-enter new password"
                        value={resetPwdConfirm}
                        onChange={(e) => setResetPwdConfirm(e.target.value)}
                        required
                        minLength={6}
                      />
                    </div>
                  </div>

                  <div className="chef-settings-hints">
                    <small>💡 Password must be at least 6 characters long.</small>
                  </div>

                  <button
                    type="submit"
                    className="chef-settings-submit-btn"
                    disabled={resetPwdLoading}
                  >
                    {resetPwdLoading ? "Resetting Password…" : "🔑 Reset Password"}
                  </button>
                </form>
              </div>
            </div>
          </section>
        )}
      </main>
    </div>
  );
};

export default ChefDashboard;
