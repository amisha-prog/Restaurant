import { useCallback, useEffect, useMemo, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { API_URL } from "../config/api";
import WaiterLogoIcon from "../Components/WaiterLogoIcon";
import "./WaiterDashboard.css";

const STATUSES = ["New", "Preparing", "Ready", "Served", "Completed"];
const NEXT_ORDER_ACTION = {
  Ready: { status: "Served", label: "Serve order" },
};
const money = (v) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(Number(v || 0));
const ago = (v) => { 
  const m = Math.max(0, Math.floor((Date.now() - new Date(v).getTime()) / 60000)); 
  if (m < 1) return "Just now"; 
  if (m < 60) return `${m}m ago`; 
  if (m < 1440) return `${Math.floor(m / 60)}h ${m % 60}m ago`; 
  const d = Math.floor(m / 1440);
  return `${d}d ago`; 
};
const cls = (v) => String(v || "").toLowerCase().replace(/\s+/g, "-");
const itemCount = (order) => order.items.reduce((sum, item) => sum + Number(item.quantity || 0), 0);

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

function WaiterDashboard() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tab, setTab] = useState("All");
  const [working, setWorking] = useState("");
  const [now, setNow] = useState(new Date());
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

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 1050) {
        setSidebarOpen(false);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeNav, setActiveNav] = useState("Dashboard");
  const [selectedOrderModal, setSelectedOrderModal] = useState(null);
  const [menuList, setMenuList] = useState([]);
  const [showAddDrawer, setShowAddDrawer] = useState(false);
  const [itemSearch, setItemSearch] = useState("");
  const [modifyingItem, setModifyingItem] = useState(false);
  const [addedNotice, setAddedNotice] = useState("");
  const [justAddedId, setJustAddedId] = useState(null);
  const [tablePage, setTablePage] = useState(1);
  const [tablesPerPage, setTablesPerPage] = useState(8);
  const [tableFilterStatus, setTableFilterStatus] = useState("All");
  const [tableSearch, setTableSearch] = useState("");
  const [orderPage, setOrderPage] = useState(1);
  const [ordersPerPage, setOrdersPerPage] = useState(8);
  const [kitchenPage, setKitchenPage] = useState(1);
  const [kitchenPerPage, setKitchenPerPage] = useState(5);
  const session = useMemo(() => { try { return JSON.parse(localStorage.getItem("waiter") || localStorage.getItem("authUser") || "null"); } catch { return null; } }, []);
  const waiterId = session?.id || session?._id;

  const reload = useCallback(async (quiet = false) => {
    if (!waiterId) { setError("Your waiter session was not found. Please sign in again."); setLoading(false); return; }
    if (!quiet) setLoading(true);
    try {
      const response = await fetch(`${API_URL}/waiters/${waiterId}/dashboard`);
      const result = await response.json().catch(() => ({}));
      if (!response.ok || !result.success) throw new Error(result.message || "Unable to load dashboard data");
      setData(result);
      const notificationResponse = await fetch(`${API_URL}/waiters/${waiterId}/notifications`);
      const notificationData = await notificationResponse.json().catch(() => ({}));
      if (notificationResponse.ok && notificationData.success) setNotifications(notificationData.notifications || []);
      setError("");
    } catch (err) { setError(err.message || "Unable to load dashboard data"); }
    finally { setLoading(false); }
  }, [waiterId]);

  // Fetch Menu list for reordering
  useEffect(() => {
    const fetchMenu = async () => {
      try {
        const rest = data?.waiter?.restaurantId;
        const restId = rest?._id || rest || session?.restaurantId;
        const url = restId ? `${API_URL}/menu?restaurantId=${restId}` : `${API_URL}/menu`;
        const res = await fetch(url);
        const menuData = await res.json();
        if (Array.isArray(menuData)) setMenuList(menuData);
      } catch (e) {
        console.error("Fetch menu error:", e);
      }
    };
    if (waiterId) fetchMenu();
  }, [waiterId, data?.waiter, session]);

  const handleItemQtyChange = async (itemIndex, newQty) => {
    if (!selectedOrderModal || modifyingItem) return;
    setModifyingItem(true);
    const activeId = waiterId || session?.id || session?._id || "waiter";
    const currentItem = selectedOrderModal.items[itemIndex];
    const prevQty = currentItem?.quantity || 0;
    const itemName = currentItem?.name || "Item";

    try {
      const res = await fetch(`${API_URL}/waiters/${activeId}/orders/${selectedOrderModal._id}/bill/items/${itemIndex}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quantity: newQty }),
      });
      const result = await res.json();
      if (!res.ok || !result.success) throw new Error(result.message || "Failed to update item quantity");
      setSelectedOrderModal(result.order);
      setData((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          orders: (prev.orders || []).map((o) => (o._id === result.order._id ? result.order : o)),
        };
      });

      // Show instant feedback message when item is reordered and sent to kitchen
      if (newQty > prevQty) {
        setAddedNotice(`🍳 "${itemName}" (+1) reordered & sent to Kitchen!`);
      } else if (newQty < prevQty && newQty > 0) {
        setAddedNotice(`ℹ️ "${itemName}" quantity updated to ${newQty}`);
      } else if (newQty === 0) {
        setAddedNotice(`🗑 "${itemName}" removed from order.`);
      }
      setTimeout(() => setAddedNotice(""), 3500);

      await reload(true);
    } catch (err) {
      console.error("Item qty error:", err);
      setError(err.message || "Failed to update item quantity");
    } finally {
      setModifyingItem(false);
    }
  };

  const handleAddMoreItem = async (menuItem) => {
    if (!selectedOrderModal || modifyingItem) return;
    setModifyingItem(true);
    const activeId = waiterId || session?.id || session?._id || "waiter";
    try {
      const res = await fetch(`${API_URL}/waiters/${activeId}/orders/${selectedOrderModal._id}/bill/items`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          menuItemId: menuItem._id,
          name: menuItem.name,
          price: menuItem.price,
          quantity: 1,
        }),
      });
      const result = await res.json();
      if (!res.ok || !result.success) throw new Error(result.message || "Failed to add item to order");
      setSelectedOrderModal(result.order);
      setData((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          orders: (prev.orders || []).map((o) => (o._id === result.order._id ? result.order : o)),
        };
      });

      // Show instant success popup toast & button feedback
      setAddedNotice(`🍳 "${menuItem.name}" added & sent to Kitchen!`);
      setJustAddedId(menuItem._id);
      setTimeout(() => {
        setAddedNotice("");
        setJustAddedId(null);
      }, 3500);

      await reload(true);
    } catch (err) {
      console.error("Add item error:", err);
      setError(err.message || "Failed to add item to order");
    } finally {
      setModifyingItem(false);
    }
  };

  const filteredMenuList = useMemo(() => {
    const searchLower = itemSearch.trim().toLowerCase();
    const filtered = menuList.filter((m) =>
      !searchLower || `${m.name} ${m.category || ""}`.toLowerCase().includes(searchLower)
    );

    return [...filtered].sort((a, b) => {
      const aType = String(a.type || (a.isVeg ? "veg" : "non-veg")).toLowerCase();
      const bType = String(b.type || (b.isVeg ? "veg" : "non-veg")).toLowerCase();
      const aIsVeg = aType.includes("veg") && !aType.includes("non");
      const bIsVeg = bType.includes("veg") && !bType.includes("non");

      const aRank = aIsVeg ? 0 : 1;
      const bRank = bIsVeg ? 0 : 1;

      if (aRank !== bRank) return aRank - bRank;
      return (a.name || "").localeCompare(b.name || "");
    });
  }, [menuList, itemSearch]);

  useEffect(() => { reload(); }, [reload]);
  useEffect(() => { const timer = window.setInterval(() => { setNow(new Date()); reload(true); }, 5000); return () => window.clearInterval(timer); }, [reload]);
  const patch = async (path, id, body) => {
    setWorking(id);
    try {
      const response = await fetch(`${API_URL}/waiters/${waiterId}/${path}/${id}/status`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || !result.success) throw new Error(result.message || "Update failed");
      await reload(true);
    } catch (err) { setError(err.message); } finally { setWorking(""); }
  };
  const logout = () => { ["waiter", "authUser", "authToken"].forEach((key) => localStorage.removeItem(key)); navigate("/login"); };
  const markNotificationsRead = async () => {
    try {
      await fetch(`${API_URL}/waiters/${waiterId}/notifications/all/read`, { method: "PATCH" });
      setNotifications((current) => current.map((notification) => ({ ...notification, isRead: true })));
    } catch { /* Notifications can be read again after the next refresh. */ }
  };

  const tables = data?.tables || [];
  const orders = data?.orders || [];
  const stats = data?.stats || {};
  const waiter = data?.waiter || {};

  const filteredTables = useMemo(() => {
    const q = tableSearch.trim().toLowerCase();
    return tables.filter((t) => {
      const matchStatus = tableFilterStatus === "All" || t.status === tableFilterStatus;
      if (!q) return matchStatus;
      const active = orders.find((o) => o.tableNumber === t.tableNumber && !["Served", "Completed"].includes(o.status));
      const matchNum = String(t.tableNumber || "").toLowerCase().includes(q);
      const matchOrder = active && String(active._id || "").toLowerCase().includes(q);
      const matchGuest = active && String(active.customerName || "").toLowerCase().includes(q);
      return matchStatus && (matchNum || matchOrder || matchGuest);
    });
  }, [tables, tableFilterStatus, tableSearch, orders]);

  const totalTablePages = Math.ceil(filteredTables.length / tablesPerPage) || 1;
  const currentTablePage = Math.min(tablePage, totalTablePages);

  const paginatedTables = useMemo(() => {
    const start = (currentTablePage - 1) * tablesPerPage;
    return filteredTables.slice(start, start + tablesPerPage);
  }, [filteredTables, currentTablePage, tablesPerPage]);

  const visibleOrders = useMemo(() => {
    return tab === "All" ? orders : orders.filter((order) => order.status === tab);
  }, [orders, tab]);

  const totalOrderPages = Math.ceil(visibleOrders.length / ordersPerPage) || 1;
  const currentOrderPage = Math.min(orderPage, totalOrderPages);

  const paginatedOrders = useMemo(() => {
    const start = (currentOrderPage - 1) * ordersPerPage;
    return visibleOrders.slice(start, start + ordersPerPage);
  }, [visibleOrders, currentOrderPage, ordersPerPage]);

  const kitchen = useMemo(() => {
    return orders
      .filter((order) => ["New", "Preparing", "Ready"].includes(order.status))
      .sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt));
  }, [orders]);

  const totalKitchenPages = Math.ceil(kitchen.length / kitchenPerPage) || 1;
  const currentKitchenPage = Math.min(kitchenPage, totalKitchenPages);

  const paginatedKitchen = useMemo(() => {
    const start = (currentKitchenPage - 1) * kitchenPerPage;
    return kitchen.slice(start, start + kitchenPerPage);
  }, [kitchen, currentKitchenPage, kitchenPerPage]);

  if (loading && !data) return <main className="waiter-dashboard-state">Loading your live dashboard…</main>;
  if (!data) return <main className="waiter-dashboard-state"><p>{error}</p><button onClick={() => navigate("/login")}>Go to login</button></main>;

  const newOrders = orders.filter((order) => order.status === "New");


  const cards = [
    ["blue", "🪑", "My Tables", `${stats.myTables || 0} / ${stats.totalTables || 0}`, "Assigned tables"],
    ["green", "🪑", "Available", stats.availableTables || 0, "Ready for guests"],
    ["red", "👥", "Occupied", stats.occupiedTables || 0, "Currently occupied"],
    ["purple", "📄", "New Orders", stats.newOrders || 0, "Just received"],
    ["orange", "👨‍🍳", "Preparing", stats.preparingOrders || 0, "In kitchen"],
    ["success", "✓", "Ready", stats.readyOrders || 0, "Waiting to serve"],
    ["violet", "₹", "Today's Sales", money(stats.todaySales), `(${stats.todayOrderCount || 0} served orders)`],
  ];

  const handleCardClick = (title) => {
    if (title.includes("My Tables")) {
      setTableFilterStatus("All");
      setTableSearch("");
      setTablePage(1);
      document.getElementById("table-management")?.scrollIntoView({ behavior: "smooth" });
    } else if (title.includes("Available")) {
      setTableFilterStatus("Available");
      setTableSearch("");
      setTablePage(1);
      document.getElementById("table-management")?.scrollIntoView({ behavior: "smooth" });
    } else if (title.includes("Occupied")) {
      setTableFilterStatus("Occupied");
      setTableSearch("");
      setTablePage(1);
      document.getElementById("table-management")?.scrollIntoView({ behavior: "smooth" });
    } else if (title.includes("New")) {
      setTab("New");
      setOrderPage(1);
      document.getElementById("recent-orders")?.scrollIntoView({ behavior: "smooth" });
    } else if (title.includes("Preparing")) {
      setTab("Preparing");
      setOrderPage(1);
      document.getElementById("recent-orders")?.scrollIntoView({ behavior: "smooth" });
    } else if (title.includes("Ready")) {
      setTab("Ready");
      setOrderPage(1);
      document.getElementById("recent-orders")?.scrollIntoView({ behavior: "smooth" });
    } else if (title.includes("Sales")) {
      setTab("All");
      setOrderPage(1);
      document.getElementById("recent-orders")?.scrollIntoView({ behavior: "smooth" });
    }
  };
  
  const orderStatus = (order) => {
    const st = order.status || "New";
    if (st === "Preparing") {
      return (
        <span className="order-status-chip chip-preparing">
          <span>♨</span> Preparing
        </span>
      );
    }
    if (st === "Ready") {
      return (
        <span className="order-status-chip chip-ready">
          <span>✓</span> Ready
        </span>
      );
    }
    if (st === "Served") {
      return (
        <span className="order-status-chip chip-served">
          <span>🍽️</span> Served
        </span>
      );
    }
    if (st === "Completed") {
      return (
        <span className="order-status-chip chip-completed">
          <span>✓</span> Completed
        </span>
      );
    }
    return (
      <span className="order-status-chip chip-new">
        <span>⏳</span> Sent to Kitchen
      </span>
    );
  };

  const nextOrderAction = (order) => {
    if (order.status === "Ready") {
      return (
        <button 
          className="order-next-button btn-serve-ready" 
          disabled={working === order._id} 
          onClick={() => patch("orders", order._id, { status: "Served" })}
        >
          {working === order._id ? "Updating…" : "Serve order"}
        </button>
      );
    }
    if (order.status === "Preparing") {
      return (
        <span className="order-complete-label order-kitchen-pill preparing">
          ♨ In Kitchen
        </span>
      );
    }
    if (order.status === "New") {
      return (
        <span className="order-complete-label order-kitchen-pill new">
          ⏳ Sent to Kitchen
        </span>
      );
    }
    return <span className="order-complete-label">{order.status || "Served"}</span>;
  };

  return <div className="waiter-dashboard">
    {sidebarOpen && <div className="sidebar-backdrop" onClick={() => setSidebarOpen(false)} aria-hidden="true" />}
    <aside className={`waiter-sidebar ${sidebarOpen ? "open" : ""}`}>
      <div className="waiter-brand">
        <div className="brand-icon">
          <img src="/waiter_logo.png" alt="Waiter Panel Logo" className="waiter-brand-logo-img" />
        </div>
        <div>
          <h2>Waiter Panel</h2>
          <span>Restaurant Management</span>
        </div>
        <button className="sidebar-close-btn" onClick={() => setSidebarOpen(false)} aria-label="Close menu">✕</button>
      </div>
      <nav className="waiter-navigation">
        <button 
          className={`waiter-nav-item ${activeNav === "Dashboard" ? "active" : ""}`} 
          onClick={() => {
            setActiveNav("Dashboard");
            setSidebarOpen(false);
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
        >
          <span className="nav-icon">⌂</span> <span>Dashboard</span>
        </button>

        <div className="nav-section-label">ORDERS</div>
        <button 
          className={`waiter-nav-item ${activeNav === "Create Order" ? "active" : ""}`} 
          onClick={() => { 
            setActiveNav("Create Order");
            setSidebarOpen(false); 
            navigate("/waiter/create-order"); 
          }}
        >
          <span className="nav-icon">＋</span> <span>Create Order</span>
        </button>
        <button 
          className={`waiter-nav-item ${activeNav === "Orders" ? "active" : ""}`} 
          onClick={() => { 
            setActiveNav("Orders");
            setSidebarOpen(false); 
            document.getElementById("recent-orders")?.scrollIntoView({ behavior: "smooth" }); 
          }}
        >
          <span className="nav-icon">▤</span> <span>Orders</span>
        </button>

        <div className="nav-section-label">TABLES</div>
        <button 
          className={`waiter-nav-item ${activeNav === "Tables" ? "active" : ""}`} 
          onClick={() => { 
            setActiveNav("Tables");
            setSidebarOpen(false); 
            document.getElementById("table-management")?.scrollIntoView({ behavior: "smooth" }); 
          }}
        >
          <span className="nav-icon">🪑</span> <span>Tables</span>
        </button>

        <div className="nav-section-label">KITCHEN</div>
        <button 
          className={`waiter-nav-item ${activeNav === "Kitchen Board" ? "active" : ""}`} 
          onClick={() => { 
            setActiveNav("Kitchen Board");
            setSidebarOpen(false); 
            navigate("/waiter/kitchen"); 
          }}
        >
          <span className="nav-icon">♨</span> <span>Kitchen Board</span>
        </button>

        <div className="nav-section-label">PAYMENTS</div>
        <button 
          className={`waiter-nav-item ${activeNav === "Billing" ? "active" : ""}`} 
          onClick={() => { 
            setActiveNav("Billing");
            setSidebarOpen(false); 
            navigate("/waiter/billing"); 
          }}
        >
          <span className="nav-icon">🧾</span> <span>Billing</span>
        </button>
      </nav>
      <button className="logout-button" onClick={logout}>⇥ Logout</button>
    </aside>
    <main className="waiter-main">
      <header className="waiter-header">
        <div className="header-left">
          <button className="mobile-menu-btn" onClick={() => setSidebarOpen(true)} aria-label="Open menu">
            <span></span>
            <span></span>
            <span></span>
          </button>
          <div className="header-brand-logo-mobile">
            <img src="/waiter_logo.png" alt="Waiter Logo" className="waiter-header-logo-img" />
          </div>
          <div className="header-greeting">
            <h1 className="header-greeting-title">
              {(() => {
                const hour = now.getHours();
                const salute = hour < 12 ? "Good Morning" : hour < 17 ? "Good Afternoon" : "Good Evening";
                return `${salute}, ${waiter.name || "Waiter"}! 👋`;
              })()}
            </h1>
            <p className="header-greeting-subtitle">
              Manage tables, orders and kitchen status
            </p>
          </div>
        </div>
        <div className="header-right">
          <div className="notification-wrap" ref={notifRef}>
            {(() => {
              const getCat = (t = "") => {
                const typeStr = String(t).toLowerCase();
                if (typeStr.includes("kitchen")) return "kitchen";
                if (typeStr.includes("qr") || typeStr.includes("customer") || typeStr.includes("bill") || typeStr.includes("user")) return "user";
                return "waiter";
              };
              const getBadge = (t = "") => {
                const cat = getCat(t);
                if (cat === "kitchen") return { label: "👨‍🍳 Kitchen", bg: "#fef3c7", color: "#92400e" };
                return { label: "📱 User", bg: "#dbeafe", color: "#1e40af" };
              };

              // Exclude Waiter's own self-notifications in Waiter Dashboard
              const waiterDashboardNotifs = notifications.filter((n) => getCat(n.type) !== "waiter");
              const unreadCount = waiterDashboardNotifs.filter((n) => !n.isRead).length;
              const userCount = waiterDashboardNotifs.filter((n) => getCat(n.type) === "user").length;
              const kitchenCount = waiterDashboardNotifs.filter((n) => getCat(n.type) === "kitchen").length;

              const filteredNotifs = waiterDashboardNotifs.filter((n) => {
                if (notifFilter === "all") return true;
                return getCat(n.type) === notifFilter;
              });

              return (
                <>
                  <button className="notification-button" aria-label="Notifications" onClick={() => { setShowNotifications((open) => !open); markNotificationsRead(); }}>
                    🔔{unreadCount > 0 && <span>{unreadCount}</span>}
                  </button>
                  {showNotifications && (
                    <div className="notification-panel">
                      <div className="notif-header">
                        <b>Notifications</b>
                        <button onClick={markNotificationsRead}>Mark all read</button>
                      </div>
                      <div className="notif-tabs" style={{ display: "flex", gap: "6px", marginBottom: "10px", borderBottom: "1px solid #e2e8f0", paddingBottom: "8px", overflowX: "auto" }}>
                        <button type="button" style={{ padding: "4px 8px", borderRadius: "14px", border: "none", background: notifFilter === "all" ? "#2563eb" : "#f1f5f9", color: notifFilter === "all" ? "#fff" : "#475569", fontSize: "11px", fontWeight: "600", cursor: "pointer", whitespace: "nowrap" }} onClick={() => setNotifFilter("all")}>
                          All ({waiterDashboardNotifs.length})
                        </button>
                        <button type="button" style={{ padding: "4px 8px", borderRadius: "14px", border: "none", background: notifFilter === "user" ? "#1e40af" : "#f1f5f9", color: notifFilter === "user" ? "#fff" : "#475569", fontSize: "11px", fontWeight: "600", cursor: "pointer", whitespace: "nowrap" }} onClick={() => setNotifFilter("user")}>
                          📱 User ({userCount})
                        </button>
                        <button type="button" style={{ padding: "4px 8px", borderRadius: "14px", border: "none", background: notifFilter === "kitchen" ? "#b45309" : "#f1f5f9", color: notifFilter === "kitchen" ? "#fff" : "#475569", fontSize: "11px", fontWeight: "600", cursor: "pointer", whitespace: "nowrap" }} onClick={() => setNotifFilter("kitchen")}>
                          👨‍🍳 Kitchen ({kitchenCount})
                        </button>
                      </div>
                      {filteredNotifs.length ? filteredNotifs.slice(0, 15).map((notification) => {
                        const badge = getBadge(notification.type);
                        return (
                          <article className={notification.isRead ? "read" : "unread"} key={notification._id} style={{ position: "relative" }}>
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
                      }) : <p className="dashboard-empty" style={{ padding: "16px", textAlign: "center", color: "#64748b", fontSize: "12px" }}>No notifications in this category.</p>}
                    </div>
                  )}
                </>
              );
            })()}
          </div>
          <div className="user-profile">
            <div
              className="user-avatar-badge"
              title={waiter.name || "Waiter"}
            >
              <img
                src="/waiter_logo.png"
                alt={waiter.name || "Waiter"}
              />
            </div>
            <div className="user-info-text">
              <strong>{waiter.name || "Waiter"}</strong>
              <span>Staff</span>
            </div>
          </div>
        </div>
      </header>
      <section className="summary-grid">
        {cards.map(([color, icon, title, value, detail]) => (
          <div
            className={`summary-card ${color}`}
            key={title}
            onClick={() => handleCardClick(title)}
            role="button"
            tabIndex={0}
            title={`Click to view ${title}`}
            style={{ cursor: "pointer", userSelect: "none", transition: "transform 0.15s ease, box-shadow 0.15s ease" }}
            onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") handleCardClick(title); }}
          >
            <div className="summary-icon">{icon}</div>
            <span>{title}</span>
            <h2>{value}</h2>
            <small>{detail}</small>
          </div>
        ))}
      </section>
      <section className="dashboard-content">
        <div className="table-section" id="table-management">
          <div className="table-section-header">
            <div className="table-header-left">
              <h2 className="table-header-title">
                🪑 Table Management
              </h2>
              <span className="table-header-badge">
                {tables.length} tables
              </span>
            </div>
          </div>

          {/* Table Search, Filters & Controls Bar */}
          <div className="table-controls-bar">
            <div className="table-search-input-wrap">
              <span className="table-search-icon">🔍</span>
              <input
                type="text"
                className="table-search-input"
                placeholder="Search table, order, guest..."
                value={tableSearch}
                onChange={(e) => {
                  setTableSearch(e.target.value);
                  setTablePage(1);
                }}
              />
              {tableSearch && (
                <button
                  type="button"
                  className="table-search-clear-btn"
                  onClick={() => {
                    setTableSearch("");
                    setTablePage(1);
                  }}
                  title="Clear search"
                  aria-label="Clear search"
                >
                  ✕
                </button>
              )}
            </div>

            <div className="table-controls-filters-row">
              <div className="table-filter-pills">
                {["All", "Available", "Occupied", "Reserved", "Cleaning"].map((status) => {
                  const count = status === "All" ? tables.length : tables.filter((t) => t.status === status).length;
                  return (
                    <button
                      key={status}
                      type="button"
                      className={`table-filter-pill ${tableFilterStatus === status ? "active" : ""}`}
                      onClick={() => {
                        setTableFilterStatus(status);
                        setTablePage(1);
                      }}
                    >
                      {status} <span className="pill-count">({count})</span>
                    </button>
                  );
                })}
              </div>

              <div className="table-per-page-wrap">
                <select
                  className="table-per-page-select"
                  value={tablesPerPage}
                  onChange={(e) => {
                    setTablesPerPage(Number(e.target.value));
                    setTablePage(1);
                  }}
                  aria-label="Tables per page"
                >
                  <option value={8}>8 / page</option>
                  <option value={12}>12 / page</option>
                  <option value={16}>16 / page</option>
                  <option value={100}>All tables</option>
                </select>
              </div>
            </div>
          </div>

          <div className="table-grid">
            {paginatedTables.length ? (
              paginatedTables.map((table) => {
                const active = orders.find((order) => order.tableNumber === table.tableNumber && !["Served", "Completed"].includes(order.status));

                const itemsCount = active ? itemCount(active) : 0;
                const itemsLabel = active ? `${itemsCount} item${itemsCount === 1 ? "" : "s"}` : (table.status === "Available" ? "0 items" : "0 item");
                const elapsedMin = active 
                  ? (() => {
                      const m = Math.max(0, Math.floor((Date.now() - new Date(active.createdAt).getTime()) / 60000));
                      if (m < 1) return "Just now";
                      if (m < 60) return `${m} min`;
                      if (m < 1440) {
                        const h = Math.floor(m / 60);
                        const rem = m % 60;
                        return rem > 0 ? `${h}h ${rem}m` : `${h}h`;
                      }
                      return `${Math.floor(m / 1440)}d`;
                    })()
                  : "--";
                
                const cardStatus = active && active.status === "Preparing" 
                  ? "Preparing" 
                  : (active && active.status === "Ready" ? "Ready" : table.status);
                const borderAccentClass = cardStatus.toLowerCase();

                return (
                  <div className={`table-card-modern status-${borderAccentClass}`} key={table._id}>
                    {/* Header Row */}
                    <div className="table-card-top">
                      <h3 className="table-card-title">{table.tableNumber}</h3>
                      <span className={`table-status-pill pill-${borderAccentClass}`}>
                        {cardStatus}
                      </span>
                    </div>

                    {/* Metrics Info Rows: Items, Time */}
                    <div className="table-card-metrics">
                      <div className="table-metric-row">
                        <span className="metric-icon">🍴</span>
                        <span className="metric-text">{itemsLabel}</span>
                      </div>
                      <div className="table-metric-row">
                        <span className="metric-icon">⏱</span>
                        <span className="metric-text">{elapsedMin}</span>
                      </div>
                    </div>

                    {/* Bottom Action Area */}
                    <div className="table-card-bottom">
                      {active ? (
                        <>
                          <div 
                            className="table-order-strip" 
                            onClick={() => setSelectedOrderModal(active)}
                            title={`Click to view Order #${active._id.slice(-6).toUpperCase()}`}
                          >
                            <span className={`order-dot dot-${(active.status || "new").toLowerCase()}`}></span>
                            <span className="order-strip-id">Order #{active._id.slice(-6).toUpperCase()}</span>
                            <span className="order-strip-arrow">›</span>
                          </div>
                          <button 
                            className="table-btn-primary" 
                            onClick={() => setSelectedOrderModal(active)}
                          >
                            View Order
                          </button>
                        </>
                      ) : table.status === "Reserved" ? (
                        <>
                          <div className="table-status-strip strip-reserved">
                            <span>📅</span> Reserved
                          </div>
                          <button 
                            className="table-btn-outline" 
                            onClick={() => setTableFilterStatus("Reserved")}
                          >
                            View Details
                          </button>
                        </>
                      ) : table.status === "Cleaning" ? (
                        <>
                          <div className="table-status-strip strip-cleaning">
                            <span>🧹</span> Cleaning in Progress
                          </div>
                          <button 
                            className="table-btn-outline" 
                            disabled={working === table._id}
                            onClick={() => patch("tables", table._id, { status: "Available" })}
                          >
                            {working === table._id ? "Updating…" : "Mark Clean"}
                          </button>
                        </>
                      ) : (
                        <>
                          <div className="table-status-strip strip-available">
                            <span>🟢</span> Ready for guests
                          </div>
                          <button 
                            className="table-btn-outline" 
                            disabled={working === table._id}
                            onClick={() => patch("tables", table._id, { status: "Occupied", guestCount: table.capacity || 2 })}
                          >
                            {working === table._id ? "Updating…" : "Assign / Occupy"}
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="dashboard-empty">
                {tables.length ? "No tables match your search or filter criteria." : "No tables have been created for this restaurant yet."}
              </p>
            )}
          </div>

          {/* Table Pagination Bar */}
          {filteredTables.length > 0 && totalTablePages > 1 && (
            <div className="table-pagination-bar">
              <span className="pagination-info">
                Showing {Math.min((currentTablePage - 1) * tablesPerPage + 1, filteredTables.length)}–
                {Math.min(currentTablePage * tablesPerPage, filteredTables.length)} of {filteredTables.length} tables
              </span>
              <div className="pagination-nav">
                <button
                  className="page-number-btn"
                  disabled={currentTablePage <= 1}
                  onClick={() => setTablePage((p) => Math.max(p - 1, 1))}
                  title="Previous page"
                  aria-label="Previous page"
                >
                  ‹
                </button>
                {getPaginationRange(currentTablePage, totalTablePages).map((item, idx) =>
                  item === "..." ? (
                    <span key={`t-ellipsis-${idx}`} className="page-ellipsis">…</span>
                  ) : (
                    <button
                      key={`t-page-${item}`}
                      className={`page-number-btn ${item === currentTablePage ? "active" : ""}`}
                      onClick={() => setTablePage(item)}
                    >
                      {item}
                    </button>
                  )
                )}
                <button
                  className="page-number-btn"
                  disabled={currentTablePage >= totalTablePages}
                  onClick={() => setTablePage((p) => Math.min(p + 1, totalTablePages))}
                  title="Next page"
                  aria-label="Next page"
                >
                  ›
                </button>
              </div>
            </div>
          )}
        </div>
        <div className="right-column">
          <div className="dashboard-card">
            <div className="card-header" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "8px", marginBottom: "14px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ fontSize: "18px" }}>👨‍🍳</span>
                <h2 style={{ margin: 0, fontSize: "16px", fontWeight: "700", color: "#1e293b" }}>Kitchen Order Status</h2>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <button
                  onClick={() => { setTab("Preparing"); document.getElementById("recent-orders")?.scrollIntoView({ behavior: "smooth" }); }}
                  style={{ border: "none", background: "none", color: "#2563eb", fontSize: "12px", fontWeight: "600", cursor: "pointer", display: "flex", alignItems: "center", gap: "2px", padding: 0 }}
                >
                  View All →
                </button>
                <span style={{ background: "#f1f5f9", color: "#475569", padding: "2px 8px", borderRadius: "12px", fontSize: "11px", fontWeight: "600" }}>
                  {kitchen.length} orders
                </span>
                <select
                  className="table-per-page-select"
                  value={kitchenPerPage}
                  onChange={(e) => {
                    setKitchenPerPage(Number(e.target.value));
                    setKitchenPage(1);
                  }}
                  style={{ padding: "3px 6px", fontSize: "11px", height: "26px", borderRadius: "6px" }}
                  aria-label="Kitchen orders per page"
                >
                  <option value={4}>4 per page</option>
                  <option value={5}>5 per page</option>
                  <option value={8}>8 per page</option>
                  <option value={10}>10 per page</option>
                </select>
              </div>
            </div>
            <div className="kitchen-list">
              {paginatedKitchen.length ? (
                paginatedKitchen.map((order) => {
                  const statusClass = (order.status || "new").toLowerCase();
                  return (
                    <div 
                      className={`kitchen-card-modern border-${statusClass}`} 
                      key={order._id} 
                      onClick={() => setSelectedOrderModal(order)}
                    >
                      <div className="kitchen-card-head">
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                          <div className={`kitchen-icon-circle bg-${statusClass}`}>
                            {order.status === "Ready" ? "🍽️" : order.status === "Preparing" ? "♨" : "⏳"}
                          </div>
                          <div>
                            <strong className="kitchen-order-id">#{order._id.slice(-6).toUpperCase()}</strong>
                            <div className="kitchen-table-name">Table {String(order.tableNumber).replace(/^Table\s*/i, "")}</div>
                          </div>
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "4px" }}>
                          {orderStatus(order)}
                          <small className="order-time">{ago(order.createdAt)}</small>
                        </div>
                      </div>

                      <div className="kitchen-items-preview">
                        {Array.isArray(order.items) && order.items.length > 0
                          ? order.items.map((it) => `${it.name || "Item"} × ${it.quantity || 1}`).join(", ")
                          : `${itemCount(order)} Items`}
                      </div>

                      {order.status === "Ready" && (
                        <div className="kitchen-card-actions" onClick={(e) => e.stopPropagation()}>
                          {nextOrderAction(order)}
                        </div>
                      )}
                    </div>
                  );
                })
              ) : (
                <p className="dashboard-empty">Kitchen queue is clear.</p>
              )}
            </div>

            {/* Kitchen Orders Pagination Bar */}
            {kitchen.length > 0 && totalKitchenPages > 1 && (
              <div className="table-pagination-bar" style={{ marginTop: "auto", paddingTop: "12px" }}>
                <span className="pagination-info">
                  Showing {Math.min((currentKitchenPage - 1) * kitchenPerPage + 1, kitchen.length)}–
                  {Math.min(currentKitchenPage * kitchenPerPage, kitchen.length)} of {kitchen.length}
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
                      <span key={`k-ellipsis-${idx}`} className="page-ellipsis">…</span>
                    ) : (
                      <button
                        key={`k-page-${item}`}
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
          </div>
        </div>
      </section>

      <section className="recent-orders dashboard-card" id="recent-orders">
        <div className="card-header" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "10px" }}>
          <h2>▣ Recent Orders</h2>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <select
              className="table-per-page-select"
              value={ordersPerPage}
              onChange={(e) => {
                setOrdersPerPage(Number(e.target.value));
                setOrderPage(1);
              }}
            >
              <option value={5}>5 per page</option>
              <option value={8}>8 per page</option>
              <option value={12}>12 per page</option>
              <option value={20}>20 per page</option>
              <option value={100}>All orders</option>
            </select>
            <button onClick={() => reload()}>Refresh</button>
          </div>
        </div>
        <div className="order-tabs">
          {["All", ...STATUSES].map((status) => (
            <button
              key={status}
              className={tab === status ? "active" : ""}
              onClick={() => {
                setTab(status);
                setOrderPage(1);
              }}
            >
              {status}
            </button>
          ))}
        </div>
        <div className="orders-table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Order #</th>
                <th>Table</th>
                <th>Ordered Menu Items</th>
                <th>Total</th>
                <th>Status</th>
                <th>Next action</th>
                <th>Time</th>
              </tr>
            </thead>
            <tbody>
              {paginatedOrders.length ? (
                paginatedOrders.map((order) => (
                  <tr key={order._id} style={{ cursor: "pointer" }} onClick={() => setSelectedOrderModal(order)}>
                    <td><strong>#{order._id.slice(-6)}</strong></td>
                    <td><strong style={{ color: "#2563eb" }}>{order.tableNumber}</strong></td>
                    <td style={{ minWidth: "220px" }}>
                      <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
                        {Array.isArray(order.items) && order.items.length > 0 ? (
                          order.items.map((it, idx) => (
                            <span key={idx} style={{ fontSize: "0.85rem", color: "#1e293b" }}>
                              • <strong>{it.name || "Item"}</strong> × {it.quantity || 1}
                              {it.selectedModifiers?.length > 0 && (
                                <small style={{ color: "#64748b", marginLeft: "4px" }}>
                                  ({it.selectedModifiers.map((m) => m.name).join(", ")})
                                </small>
                              )}
                            </span>
                          ))
                        ) : (
                          <span>{itemCount(order)} Items</span>
                        )}
                      </div>
                    </td>
                    <td><strong>{money(order.total)}</strong></td>
                    <td>{orderStatus(order)}</td>
                    <td onClick={(e) => e.stopPropagation()}>{nextOrderAction(order)}</td>
                    <td>{ago(order.createdAt)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="dashboard-empty">
                    No {tab === "All" ? "orders" : `${tab.toLowerCase()} orders`} found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Orders Pagination Bar */}
        {visibleOrders.length > 0 && totalOrderPages > 1 && (
          <div className="table-pagination-bar" style={{ marginTop: "16px" }}>
            <span className="pagination-info">
              Showing {Math.min((currentOrderPage - 1) * ordersPerPage + 1, visibleOrders.length)}–
              {Math.min(currentOrderPage * ordersPerPage, visibleOrders.length)} of {visibleOrders.length} orders
            </span>
            <div className="pagination-nav">
              <button
                className="page-number-btn"
                disabled={currentOrderPage <= 1}
                onClick={() => setOrderPage((p) => Math.max(p - 1, 1))}
                title="Previous page"
                aria-label="Previous page"
              >
                ‹
              </button>
              {getPaginationRange(currentOrderPage, totalOrderPages).map((item, idx) =>
                item === "..." ? (
                  <span key={`o-ellipsis-${idx}`} className="page-ellipsis">…</span>
                ) : (
                  <button
                    key={`o-page-${item}`}
                    className={`page-number-btn ${item === currentOrderPage ? "active" : ""}`}
                    onClick={() => setOrderPage(item)}
                  >
                    {item}
                  </button>
                )
              )}
              <button
                className="page-number-btn"
                disabled={currentOrderPage >= totalOrderPages}
                onClick={() => setOrderPage((p) => Math.min(p + 1, totalOrderPages))}
                title="Next page"
                aria-label="Next page"
              >
                ›
              </button>
            </div>
          </div>
        )}
      </section>

      {/* ORDER DETAILS POPUP MODAL (PREMIUM DESIGN) */}
      {selectedOrderModal && (
        <div className="order-modal-overlay" onClick={() => setSelectedOrderModal(null)}>
          <div className="order-modal-card" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="order-modal-header">
              <div className="modal-header-left">
                <div className="modal-order-badge">
                  <span className="order-source-icon">⚡</span>
                  <h3>Order #{selectedOrderModal._id.slice(-6)}</h3>
                </div>
                <div className="modal-order-subtitle">
                  <span>{selectedOrderModal.source || "QR"} Order</span>
                  <span className="dot-sep">•</span>
                  <span>{ago(selectedOrderModal.createdAt)}</span>
                </div>
              </div>
              <button className="order-modal-close" onClick={() => setSelectedOrderModal(null)} aria-label="Close modal">
                ✕
              </button>
            </div>

            <div className="order-modal-body">
              {/* Meta Grid */}
              <div className="order-meta-grid">
                <div className="meta-card">
                  <span className="meta-label">🪑 Table</span>
                  <strong className="meta-value table-num">{selectedOrderModal.tableNumber}</strong>
                </div>
                <div className="meta-card">
                  <span className="meta-label">👤 Customer</span>
                  <strong className="meta-value">{selectedOrderModal.customerName || "Walk-in Guest"}</strong>
                </div>
                <div className="meta-card">
                  <span className="meta-label">🏷 Status</span>
                  <div className="meta-status-badge">{orderStatus(selectedOrderModal)}</div>
                </div>
              </div>

              {/* Items Section */}
              <div className="modal-items-section">
                <div className="items-section-header">
                  <div>
                    <h4>🍽 Ordered Menu Items</h4>
                    <span className="items-count-badge">{itemCount(selectedOrderModal)} {itemCount(selectedOrderModal) === 1 ? "item" : "items"}</span>
                  </div>
                  <button
                    type="button"
                    className={`btn-toggle-add-items ${showAddDrawer ? "active" : ""}`}
                    onClick={() => setShowAddDrawer((prev) => !prev)}
                  >
                    {showAddDrawer ? "✕ Close Selector" : "➕ Add Items / Reorder"}
                  </button>
                </div>

                {/* Reorder / Add Item Success Notice Banner */}
                {addedNotice && (
                  <div className="add-item-success-popup reorder-toast-banner">
                    <span>{addedNotice}</span>
                  </div>
                )}

                {/* Add Items Drawer */}
                {showAddDrawer && (
                  <div className="modal-add-items-drawer">
                    <div className="add-items-header">
                      <h5>🛒 Select Items to Add to Order #{selectedOrderModal._id.slice(-6).toUpperCase()}</h5>
                      <input
                        type="search"
                        className="add-items-search-input"
                        placeholder="🔍 Search food item to add..."
                        value={itemSearch}
                        onChange={(e) => setItemSearch(e.target.value)}
                      />
                    </div>
                    <div className="add-items-menu-grid">
                      {filteredMenuList.length === 0 ? (
                        <p className="no-items-text">No menu items found matching search.</p>
                      ) : (
                        filteredMenuList.map((menuItem) => {
                          const itemTypeStr = String(menuItem.type || (menuItem.isVeg ? "veg" : "non-veg")).toLowerCase();
                          const isVeg = itemTypeStr.includes("veg") && !itemTypeStr.includes("non");
                          const isJustAdded = justAddedId === menuItem._id;
                          return (
                            <div className={`add-menu-item-row ${isJustAdded ? "just-added" : ""}`} key={menuItem._id}>
                              <div className="add-item-info">
                                <span className={`type-badge-pill ${isVeg ? "veg" : "non-veg"}`}>
                                  {isVeg ? "🟢 Veg" : "🔴 Non-Veg"}
                                </span>
                                <strong className="add-item-title">{menuItem.name}</strong>
                                <small className="add-item-cost">{money(menuItem.price)}</small>
                              </div>
                              <button
                                type="button"
                                className={`btn-add-item-action ${isJustAdded ? "added-success" : ""}`}
                                disabled={modifyingItem}
                                onClick={() => handleAddMoreItem(menuItem)}
                              >
                                {isJustAdded ? "✓ Added!" : "+ Add Item"}
                              </button>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                )}

                {/* Ordered Items List */}
                <div className="modal-items-list">
                  {Array.isArray(selectedOrderModal.items) && selectedOrderModal.items.length > 0 ? (
                    selectedOrderModal.items.map((item, idx) => {
                      const itemPrice = Number(item.price || 0);
                      const qty = Number(item.quantity || 1);
                      const lineTotal = itemPrice * qty;
                      return (
                        <div className="modal-item-card" key={idx}>
                          <div className="modal-item-bullet">{idx + 1}</div>
                          <div className="modal-item-details">
                            <div className="modal-item-name-row">
                              <span className="modal-item-name">{item.name || "Food Item"}</span>
                              <span className="modal-item-unit-price">{money(itemPrice)} each</span>
                            </div>
                            {item.selectedModifiers?.length > 0 && (
                              <div className="modal-item-modifiers">
                                <span>Customization: {item.selectedModifiers.map((m) => m.name).join(", ")}</span>
                              </div>
                            )}
                          </div>

                          {/* Reorder / Quantity Step Controls */}
                          <div className="modal-item-qty-controls">
                            <button
                              type="button"
                              className="btn-qty-step"
                              disabled={modifyingItem}
                              onClick={() => handleItemQtyChange(idx, qty - 1)}
                              title="Decrease quantity"
                            >
                              -
                            </button>
                            <span className="modal-item-qty-badge">{qty}</span>
                            <button
                              type="button"
                              className="btn-qty-step btn-qty-plus"
                              disabled={modifyingItem}
                              onClick={() => handleItemQtyChange(idx, qty + 1)}
                              title="Reorder +1 more"
                            >
                              + Reorder
                            </button>
                          </div>

                          <div className="modal-item-price-tag">
                            {money(lineTotal)}
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="modal-empty-items">No items listed for this order.</div>
                  )}
                </div>
              </div>

              {/* Bill Summary */}
              <div className="order-bill-summary">
                <div className="bill-summary-row">
                  <span>Total Amount</span>
                  <strong className="bill-total-price">{money(selectedOrderModal.total)}</strong>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="order-modal-footer">
              <div className="footer-action-btn">{nextOrderAction(selectedOrderModal)}</div>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setSelectedOrderModal(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
    {/* Fixed Mobile Bottom Navigation */}
    <nav className="waiter-bottom-nav">
      <button className="bottom-nav-item active" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
        <span className="bnav-icon">⌂</span>
        <span className="bnav-label">Home</span>
      </button>
      <button className="bottom-nav-item" onClick={() => document.getElementById("table-management")?.scrollIntoView({ behavior: "smooth" })}>
        <span className="bnav-icon">🪑</span>
        <span className="bnav-label">Tables</span>
      </button>
      <button className="bottom-nav-item bnav-create" onClick={() => navigate("/waiter/create-order")}>
        <span className="bnav-plus">＋</span>
        <span className="bnav-label">Order</span>
      </button>
      <button className="bottom-nav-item" onClick={() => navigate("/waiter/kitchen")}>
        <span className="bnav-icon">♨</span>
        <span className="bnav-label">Kitchen</span>
      </button>
      <button className="bottom-nav-item" onClick={() => navigate("/waiter/billing")}>
        <span className="bnav-icon">🧾</span>
        <span className="bnav-label">Billing</span>
      </button>
    </nav>
  </div>;
}

export default WaiterDashboard;
