import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { API_URL } from "../config/api";
import "./ManagerDashboard.css";

const money = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));

const sessionData = () => {
  try {
    return JSON.parse(localStorage.getItem("manager") || localStorage.getItem("authUser") || "null");
  } catch {
    return null;
  }
};

function ManagerDashboard() {
  const navigate = useNavigate();
  const session = useMemo(sessionData, []);
  const managerId = session?.id || session?._id;

  const [data, setData] = useState(null);
  const [tab, setTab] = useState("Overview");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState(
    new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })
  );

  // Live Clock
  useEffect(() => {
    const clockTimer = setInterval(() => {
      setCurrentTime(
        new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })
      );
    }, 1000);
    return () => clearInterval(clockTimer);
  }, []);

  const load = useCallback(
    async (isSilent = false) => {
      if (!managerId) {
        setError("Manager session not found. Please sign in again.");
        setLoading(false);
        return;
      }
      if (!isSilent) setRefreshing(true);
      try {
        const response = await fetch(`${API_URL}/managers/${managerId}/dashboard`);
        const result = await response.json().catch(() => ({}));
        if (!response.ok || !result.success) throw new Error(result.message || "Unable to load dashboard.");
        setData(result);
        setError("");
      } catch (err) {
        setError(err.message || "Unable to load dashboard data.");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [managerId]
  );

  useEffect(() => {
    load();
    const timer = setInterval(() => load(true), 20000);
    return () => clearInterval(timer);
  }, [load]);

  const handleLogout = () => {
    ["manager", "authUser", "authToken", "adminInfo"].forEach((key) => localStorage.removeItem(key));
    navigate("/login");
  };

  if (loading && !data) {
    return (
      <div className="manager-loading-screen">
        <div className="manager-spinner" />
        <p>Loading Manager Executive Dashboard...</p>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="manager-error-screen">
        <span className="error-icon">⚠️</span>
        <h3>Manager Dashboard Error</h3>
        <p>{error}</p>
        <button type="button" className="btn-error-retry" onClick={() => load()}>
          🔄 Retry Loading
        </button>
      </div>
    );
  }

  const { stats, orders = [], tables = [], staff = [], menu = [], customers = [], reservations = [], manager = {} } = data || {};

  // Filtered lists based on searchQuery
  const queryLower = searchQuery.toLowerCase().trim();

  const filteredOrders = orders.filter((o) => {
    if (!queryLower) return true;
    const orderId = (o._id || "").toLowerCase();
    const tableNum = (o.tableNumber || "").toLowerCase();
    const status = (o.status || "").toLowerCase();
    const custName = (o.customerName || "").toLowerCase();
    return orderId.includes(queryLower) || tableNum.includes(queryLower) || status.includes(queryLower) || custName.includes(queryLower);
  });

  const filteredTables = tables.filter((t) => {
    if (!queryLower) return true;
    const tNum = (t.tableNumber || "").toLowerCase();
    const status = (t.status || "").toLowerCase();
    const waiterName = (t.assignedWaiter?.name || "").toLowerCase();
    return tNum.includes(queryLower) || status.includes(queryLower) || waiterName.includes(queryLower);
  });

  const filteredStaff = staff.filter((s) => {
    if (!queryLower) return true;
    const name = (s.name || "").toLowerCase();
    const email = (s.email || "").toLowerCase();
    const wId = (s.waiterId || "").toLowerCase();
    return name.includes(queryLower) || email.includes(queryLower) || wId.includes(queryLower);
  });

  const filteredMenu = menu.filter((m) => {
    if (!queryLower) return true;
    const name = (m.name || "").toLowerCase();
    const cat = (m.category || "").toLowerCase();
    return name.includes(queryLower) || cat.includes(queryLower);
  });

  const filteredCustomers = customers.filter((c) => {
    if (!queryLower) return true;
    const name = (c.name || "").toLowerCase();
    const phone = (c.phone || "").toLowerCase();
    return name.includes(queryLower) || phone.includes(queryLower);
  });

  // Executive Metric Cards Configuration
  const metricCards = [
    { label: "Today Sales", value: money(stats?.todaySales), icon: "💰", color: "card-emerald", detail: "Daily Total Revenue" },
    { label: "Today's Orders", value: stats?.todayOrders || 0, icon: "🛍️", color: "card-indigo", detail: "Orders Placed Today" },
    { label: "Active Orders", value: stats?.activeOrders || 0, icon: "🔥", color: "card-amber", detail: "Cooking / Pending" },
    { label: "Ready to Serve", value: stats?.readyOrders || 0, icon: "✅", color: "card-green", detail: "Awaiting Waiter" },
    { label: "Occupied Tables", value: stats?.occupiedTables || 0, icon: "🪑", color: "card-violet", detail: "Seated Customers" },
    { label: "Reservations", value: stats?.reservations || 0, icon: "📅", color: "card-rose", detail: "Booked Tables" },
    { label: "Staff Members", value: stats?.staff || 0, icon: "👥", color: "card-cyan", detail: "Active Waiters & Staff" },
    { label: "Total Customers", value: stats?.customers || 0, icon: "👤", color: "card-blue", detail: "Registered & Guests" },
  ];

  const navItems = [
    { id: "Overview", label: "Overview", icon: "📊" },
    { id: "Orders", label: "Orders", icon: "📑", badge: stats?.activeOrders },
    { id: "Tables", label: "Tables", icon: "🪑", badge: stats?.occupiedTables },
    { id: "Kitchen", label: "Kitchen Board", icon: "♨️", badge: stats?.readyOrders },
    { id: "Staff", label: "Staff Team", icon: "👥" },
    { id: "Menu", label: "Menu Items", icon: "🍽️" },
    { id: "Customers", label: "Customers", icon: "👤" },
    { id: "Reservations", label: "Reservations", icon: "📅", badge: stats?.reservations },
  ];

  // Helper render status badges
  const renderStatusBadge = (statusStr) => {
    const s = String(statusStr || "").trim().toLowerCase();
    let cls = "status-neutral";
    let icon = "⚪";
    if (s === "new") { cls = "status-new"; icon = "🛎️"; }
    else if (s === "preparing" || s === "cooking") { cls = "status-prep"; icon = "🔥"; }
    else if (s === "ready") { cls = "status-ready"; icon = "✅"; }
    else if (s === "served" || s === "completed") { cls = "status-completed"; icon = "🍲"; }
    else if (s === "occupied") { cls = "status-occupied"; icon = "🔴"; }
    else if (s === "available") { cls = "status-available"; icon = "🟢"; }
    else if (s === "reserved") { cls = "status-reserved"; icon = "🟡"; }
    else if (s === "active") { cls = "status-available"; icon = "🟢"; }
    return (
      <span className={`manager-status-badge ${cls}`}>
        <span className="badge-icon">{icon}</span>
        <span>{statusStr}</span>
      </span>
    );
  };

  const renderPaymentBadge = (payStatus) => {
    const isPaid = String(payStatus || "").toLowerCase() === "paid";
    return (
      <span className={`manager-pay-badge ${isPaid ? "paid" : "pending"}`}>
        {isPaid ? "✓ Paid" : "⏳ Pending"}
      </span>
    );
  };

  // Orders Table Component
  const renderOrdersTable = (list) => (
    <div className="manager-table-responsive">
      <table className="manager-data-table">
        <thead>
          <tr>
            <th>Order ID</th>
            <th>Table</th>
            <th>Customer</th>
            <th>Source</th>
            <th>Status</th>
            <th>Payment</th>
            <th>Total Amount</th>
          </tr>
        </thead>
        <tbody>
          {list.length === 0 ? (
            <tr>
              <td colSpan="7" className="table-empty-row">
                <span>🍽️</span> No orders found matching your search.
              </td>
            </tr>
          ) : (
            list.map((order) => (
              <tr key={order._id}>
                <td>
                  <strong className="order-id-code">#{order._id.slice(-6).toUpperCase()}</strong>
                </td>
                <td>
                  <span className="table-number-pill">{order.tableNumber || "N/A"}</span>
                </td>
                <td>
                  <span className="customer-name-text">{order.customerName || "Walk-in Customer"}</span>
                </td>
                <td>
                  <span className={`source-pill ${String(order.source).toLowerCase()}`}>
                    {order.source || "QR"}
                  </span>
                </td>
                <td>{renderStatusBadge(order.status)}</td>
                <td>{renderPaymentBadge(order.payment?.status)}</td>
                <td>
                  <strong className="order-total-price">{money(order.total)}</strong>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );

  return (
    <div className="manager-page">
      {/* Mobile Drawer Overlay */}
      {sidebarOpen && (
        <div className="manager-sidebar-overlay" onClick={() => setSidebarOpen(false)} />
      )}

      {/* ========================================================
          LEFT SIDEBAR
      ======================================================== */}
      <aside className={`manager-sidebar ${sidebarOpen ? "open" : ""}`}>
        <div className="manager-brand-header">
          <div className="manager-brand-badge">
            <span className="brand-logo-icon">👔</span>
          </div>
          <div>
            <h2>Manager Panel</h2>
            <span>Restaurant Executive</span>
          </div>
          <button
            type="button"
            className="sidebar-close-btn"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close menu"
          >
            ✕
          </button>
        </div>

        {/* Manager User Snippet */}
        <div className="manager-user-card">
          <div className="user-avatar-circle">
            {(manager?.name || "M")[0].toUpperCase()}
          </div>
          <div className="user-info">
            <strong>{manager?.name || "Executive Manager"}</strong>
            <span className="user-role-badge">ID: {manager?.managerId || "MGR"}</span>
            <span className="user-rest-badge">🏪 {manager?.restaurantId?.restaurantName || "My Restaurant"}</span>
          </div>
        </div>

        {/* Navigation items */}
        <nav className="manager-nav">
          {navItems.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`manager-nav-btn ${tab === item.id ? "active" : ""}`}
              onClick={() => {
                setTab(item.id);
                setSearchQuery("");
                setSidebarOpen(false);
              }}
            >
              <span className="nav-btn-icon">{item.icon}</span>
              <span className="nav-btn-text">{item.label}</span>
              {Boolean(item.badge) && item.badge > 0 && (
                <span className="nav-btn-badge">{item.badge}</span>
              )}
            </button>
          ))}
        </nav>

        {/* Logout action */}
        <div className="manager-sidebar-footer">
          <button type="button" className="logout-btn" onClick={handleLogout}>
            <span>🚪</span> Logout Station
          </button>
        </div>
      </aside>

      {/* ========================================================
          RIGHT MAIN CONTENT
      ======================================================== */}
      <main className="manager-main">
        {/* Executive Top Header */}
        <header className="manager-topbar">
          <div className="topbar-left">
            <button
              type="button"
              className="manager-hamburger-btn"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open navigation menu"
            >
              <span />
              <span />
              <span />
            </button>

            <div className="manager-topbar-brand">
              <div className="manager-topbar-logo" title="Manager Panel">
                👔
              </div>
              <div className="manager-topbar-title-group">
                <div className="manager-panel-tag">
                  <span className="panel-dot" />
                  <span>MANAGER PANEL</span>
                </div>
                <h1 className="manager-topbar-heading">
                  {tab === "Overview" && "Executive Dashboard"}
                  {tab === "Orders" && "Orders Management"}
                  {tab === "Tables" && "Tables & Seating Board"}
                  {tab === "Kitchen" && "Live Kitchen Board"}
                  {tab === "Staff" && "Staff & Waiter Team"}
                  {tab === "Menu" && "Menu Items & Stock"}
                  {tab === "Customers" && "Customer Directory"}
                  {tab === "Reservations" && "Table Reservations"}
                </h1>
                <p className="topbar-sub-text">
                  🏪 {manager?.restaurantId?.restaurantName || session?.restaurantName || "Restaurant"} · Welcome back, <strong>{manager?.name || session?.name || "Manager"}</strong> 👋
                </p>
              </div>
            </div>
          </div>

          <div className="topbar-right">
            {/* Realtime Live Clock */}
            <div className="manager-clock-card" title="Current Restaurant Time">
              <span className="clock-pulse" />
              <span className="clock-time">🕒 {currentTime}</span>
            </div>

            {/* Refresh Action */}
            <button
              type="button"
              className={`manager-refresh-btn ${refreshing ? "spinning" : ""}`}
              onClick={() => load()}
              title="Refresh Dashboard Data"
            >
              <span>🔄</span> <span className="btn-refresh-text">{refreshing ? "Updating..." : "Refresh"}</span>
            </button>
          </div>
        </header>

        {error && (
          <div className="manager-alert-banner">
            <span>⚠️</span> {error}
            <button type="button" onClick={() => setError("")}>✕</button>
          </div>
        )}

        {/* ========================================================
            TAB CONTENT RENDERING
        ======================================================== */}

        {/* 1. OVERVIEW TAB */}
        {tab === "Overview" && (
          <>
            <section className="manager-metrics-grid">
              {metricCards.map((card) => (
                <div key={card.label} className={`manager-metric-card ${card.color}`}>
                  <div className="metric-icon-badge">{card.icon}</div>
                  <div className="metric-details">
                    <span className="metric-label">{card.label}</span>
                    <h2 className="metric-value">{card.value}</h2>
                    <small className="metric-detail-text">{card.detail}</small>
                  </div>
                </div>
              ))}
            </section>

            <section className="manager-content-card">
              <div className="card-section-header">
                <div>
                  <h2>🔥 Live Order Management</h2>
                  <p>Real-time stream of incoming orders, kitchen progress, and payment status</p>
                </div>
                <button
                  type="button"
                  className="btn-view-all-orders"
                  onClick={() => setTab("Orders")}
                >
                  View All Orders ({orders.length}) →
                </button>
              </div>
              {renderOrdersTable(orders.slice(0, 15))}
            </section>
          </>
        )}

        {/* 2. ORDERS TAB */}
        {tab === "Orders" && (
          <section className="manager-content-card">
            <div className="card-section-header">
              <div>
                <h2>📑 Orders History & Live Queue</h2>
                <p>Showing {filteredOrders.length} of {orders.length} total restaurant orders</p>
              </div>
              <div className="manager-search-bar">
                <span className="search-icon">🔍</span>
                <input
                  type="search"
                  placeholder="Search orders..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                {searchQuery && (
                  <button type="button" className="clear-search-btn" onClick={() => setSearchQuery("")}>
                    ✕
                  </button>
                )}
              </div>
            </div>
            {renderOrdersTable(filteredOrders)}
          </section>
        )}

        {/* 3. TABLES / RESERVATIONS TAB */}
        {(tab === "Tables" || tab === "Reservations") && (
          <section className="manager-content-card">
            <div className="card-section-header">
              <div>
                <h2>{tab === "Reservations" ? "📅 Booked Table Reservations" : "🪑 Restaurant Table Layout"}</h2>
                <p>Displaying live occupancy status and waiter assignments</p>
              </div>
              <div className="manager-search-bar">
                <span className="search-icon">🔍</span>
                <input
                  type="search"
                  placeholder="Search tables..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                {searchQuery && (
                  <button type="button" className="clear-search-btn" onClick={() => setSearchQuery("")}>
                    ✕
                  </button>
                )}
              </div>
            </div>

            <div className="manager-tables-grid">
              {(tab === "Reservations" ? reservations : filteredTables).length === 0 ? (
                <div className="manager-empty-box">
                  <span>🪑</span>
                  <h3>No tables found</h3>
                  <p>No tables matching your filter or query.</p>
                </div>
              ) : (
                (tab === "Reservations" ? reservations : filteredTables).map((table) => (
                  <div className="manager-table-card" key={table._id}>
                    <div className="table-card-top">
                      <h3>{table.tableNumber}</h3>
                      {renderStatusBadge(table.status)}
                    </div>
                    <div className="table-card-body">
                      <div className="table-info-row">
                        <span>Capacity:</span>
                        <strong>👥 {table.capacity || 4} Guests</strong>
                      </div>
                      <div className="table-info-row">
                        <span>Assigned Waiter:</span>
                        <strong className="waiter-assigned-tag">
                          👤 {table.assignedWaiter?.name || "Unassigned"}
                        </strong>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        )}

        {/* 4. KITCHEN BOARD TAB */}
        {tab === "Kitchen" && (
          <section className="manager-content-card">
            <div className="card-section-header">
              <div>
                <h2>♨️ Live Kitchen Board Progress</h2>
                <p>Orders currently new, preparing, or ready for table delivery</p>
              </div>
            </div>

            <div className="manager-kitchen-grid">
              {orders.filter((o) => ["New", "Preparing", "Ready"].includes(o.status)).length === 0 ? (
                <div className="manager-empty-box">
                  <span>🍳</span>
                  <h3>Kitchen Queue Clear</h3>
                  <p>There are no active orders currently cooking or pending in kitchen.</p>
                </div>
              ) : (
                orders
                  .filter((o) => ["New", "Preparing", "Ready"].includes(o.status))
                  .map((order) => (
                    <div key={order._id} className={`manager-kds-card status-${(order.status || "").toLowerCase()}`}>
                      <div className="kds-card-header">
                        <strong>#{order._id.slice(-6).toUpperCase()}</strong>
                        <span className="table-pill">{order.tableNumber}</span>
                        {renderStatusBadge(order.status)}
                      </div>
                      <div className="kds-card-items">
                        <ul>
                          {order.items?.map((item, idx) => (
                            <li key={idx}>
                              <span className="item-qty">{item.quantity}x</span>
                              <span className="item-name">{item.name}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div className="kds-card-footer">
                        <small>Total: {money(order.total)}</small>
                        <small className="order-time">{order.source || "QR"}</small>
                      </div>
                    </div>
                  ))
              )}
            </div>
          </section>
        )}

        {/* 5. STAFF TEAM TAB */}
        {tab === "Staff" && (
          <section className="manager-content-card">
            <div className="card-section-header">
              <div>
                <h2>👥 Staff & Waiter Directory</h2>
                <p>Manage active waiters, credentials, and contact details</p>
              </div>
              <div className="manager-search-bar">
                <span className="search-icon">🔍</span>
                <input
                  type="search"
                  placeholder="Search staff..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                {searchQuery && (
                  <button type="button" className="clear-search-btn" onClick={() => setSearchQuery("")}>
                    ✕
                  </button>
                )}
              </div>
            </div>

            <div className="manager-table-responsive">
              <table className="manager-data-table">
                <thead>
                  <tr>
                    <th>Staff ID</th>
                    <th>Name</th>
                    <th>Email Address</th>
                    <th>Phone</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStaff.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="table-empty-row">
                        <span>👥</span> No staff members found.
                      </td>
                    </tr>
                  ) : (
                    filteredStaff.map((member) => (
                      <tr key={member._id}>
                        <td>
                          <strong className="order-id-code">{member.waiterId || "WAIT"}</strong>
                        </td>
                        <td>
                          <strong>{member.name}</strong>
                        </td>
                        <td>{member.email || "—"}</td>
                        <td>{member.phone || "—"}</td>
                        <td>{renderStatusBadge(member.status || "Active")}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* 6. MENU TAB */}
        {tab === "Menu" && (
          <section className="manager-content-card">
            <div className="card-section-header">
              <div>
                <h2>🍽️ Menu Items & Stock Catalog</h2>
                <p>Showing {filteredMenu.length} restaurant dishes and live availability</p>
              </div>
              <div className="manager-search-bar">
                <span className="search-icon">🔍</span>
                <input
                  type="search"
                  placeholder="Search menu..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                {searchQuery && (
                  <button type="button" className="clear-search-btn" onClick={() => setSearchQuery("")}>
                    ✕
                  </button>
                )}
              </div>
            </div>

            <div className="manager-table-responsive">
              <table className="manager-data-table">
                <thead>
                  <tr>
                    <th>Dish Name</th>
                    <th>Category</th>
                    <th>Price</th>
                    <th>Stock Availability</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredMenu.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="table-empty-row">
                        <span>🍽️</span> No menu items found.
                      </td>
                    </tr>
                  ) : (
                    filteredMenu.map((item) => (
                      <tr key={item._id}>
                        <td>
                          <strong>{item.name}</strong>
                        </td>
                        <td>
                          <span className="category-tag">{item.category || "General"}</span>
                        </td>
                        <td>
                          <strong className="order-total-price">{money(item.price)}</strong>
                        </td>
                        <td>
                          {item.inStock === false ? (
                            <span className="manager-status-badge status-new">🔴 Out of Stock (86'd)</span>
                          ) : (
                            <span className="manager-status-badge status-available">🟢 Available</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* 7. CUSTOMERS TAB */}
        {tab === "Customers" && (
          <section className="manager-content-card">
            <div className="card-section-header">
              <div>
                <h2>👤 Customer Registry & Spend Analytics</h2>
                <p>Showing {filteredCustomers.length} registered and walk-in customers</p>
              </div>
              <div className="manager-search-bar">
                <span className="search-icon">🔍</span>
                <input
                  type="search"
                  placeholder="Search customers..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                {searchQuery && (
                  <button type="button" className="clear-search-btn" onClick={() => setSearchQuery("")}>
                    ✕
                  </button>
                )}
              </div>
            </div>

            <div className="manager-table-responsive">
              <table className="manager-data-table">
                <thead>
                  <tr>
                    <th>Customer Name</th>
                    <th>Phone Number</th>
                    <th>Total Orders Placed</th>
                    <th>Cumulative Spend</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCustomers.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="table-empty-row">
                        <span>👤</span> No customer records found.
                      </td>
                    </tr>
                  ) : (
                    filteredCustomers.map((c, index) => (
                      <tr key={`${c.phone}-${index}`}>
                        <td>
                          <strong>{c.name}</strong>
                        </td>
                        <td>{c.phone || "—"}</td>
                        <td>
                          <span className="count-badge">{c.orders} Order{c.orders === 1 ? "" : "s"}</span>
                        </td>
                        <td>
                          <strong className="order-total-price">{money(c.spend)}</strong>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

export default ManagerDashboard;
