import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { API_URL } from "../config/api";
import "./AdminManagerView.css";

const money = (v) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(v || 0));

const TABS = ["Overview", "Orders", "Tables", "Kitchen", "Staff", "Menu", "Customers", "Reservations", "Settings"];

const TAB_ICONS = {
  Overview: "🏠",
  Orders: "🧾",
  Tables: "🪑",
  Kitchen: "👨‍🍳",
  Staff: "👷",
  Menu: "🍔",
  Customers: "👥",
  Reservations: "📅",
  Settings: "⚙️",
};

const formatTableNum = (num) => {
  if (!num) return "Table —";
  const s = String(num).trim();
  if (/^table/i.test(s)) return s;
  return `Table ${s}`;
};

const getTableBadge = (num) => {
  if (!num) return "T";
  const match = String(num).match(/\d+/);
  return match ? `T-${match[0].padStart(2, "0")}` : `T-${num}`;
};

export default function AdminManagerView() {
  const { managerId } = useParams();
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tab, setTab] = useState("Overview");
  const [tableFilter, setTableFilter] = useState("all");
  const [tableSearch, setTableSearch] = useState("");

  // Password reset state
  const [resetPwd, setResetPwd] = useState("");
  const [resetPwdConfirm, setResetPwdConfirm] = useState("");
  const [resetPwdLoading, setResetPwdLoading] = useState(false);
  const [resetPwdMsg, setResetPwdMsg] = useState({ type: "", text: "" });
  const [showPwd, setShowPwd] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/managers/${managerId}/dashboard`);
      const result = await res.json();
      if (!res.ok || !result.success) throw new Error(result.message || "Unable to load data.");
      setData(result);
      setError("");
    } catch (err) {
      setError(err.message || "Failed to load manager dashboard.");
    } finally {
      setLoading(false);
    }
  }, [managerId]);

  useEffect(() => {
    load();
    const timer = setInterval(load, 30000);
    return () => clearInterval(timer);
  }, [load]);

  if (loading && !data) {
    return (
      <div className="amv-loading">
        <div className="amv-spinner" />
        <p>Loading manager dashboard…</p>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="amv-error-state">
        <span className="amv-error-icon">⚠️</span>
        <p>{error}</p>
        <button onClick={() => navigate(-1)}>← Go Back</button>
      </div>
    );
  }

  const { stats, orders, tables, staff, menu, customers, reservations, manager } = data;

  const statCards = [
    { icon: "💰", label: "Today's Sales", value: money(stats.todaySales) },
    { icon: "🧾", label: "Today's Orders", value: stats.todayOrders },
    { icon: "🔥", label: "Active Orders", value: stats.activeOrders },
    { icon: "✅", label: "Ready to Serve", value: stats.readyOrders },
    { icon: "🪑", label: "Occupied Tables", value: stats.occupiedTables },
    { icon: "📅", label: "Reservations", value: stats.reservations },
    { icon: "👨‍🍳", label: "Staff", value: stats.staff },
    { icon: "👥", label: "Customers", value: stats.customers },
  ];

  const getActiveOrderForTable = (tNum) => {
    if (!tNum || !orders) return null;
    const cleanTarget = String(tNum).replace(/\D/g, "");
    return orders.find((o) => {
      const cleanO = String(o.tableNumber || "").replace(/\D/g, "");
      return cleanTarget && cleanO && cleanTarget === cleanO && ["New", "Preparing", "Ready"].includes(o.status);
    });
  };

  // Password reset handler
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
      const res = await fetch(`${API_URL}/managers/${managerId}/reset-password`, {
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
        <div className="amv-settings-view">
          {/* Manager Profile Card */}
          <div className="amv-settings-profile-card">
            <div className="amv-settings-avatar">{manager?.name?.charAt(0)?.toUpperCase() || "M"}</div>
            <div className="amv-settings-profile-info">
              <h2>{manager?.name}</h2>
              <span className="amv-settings-id-badge">ID: {manager?.managerId}</span>
              <p>✉️ {manager?.email || "—"}</p>
              {manager?.phone && <p>📞 {manager.phone}</p>}
              <p>🏢 {manager?.restaurantId?.restaurantName || "—"}</p>
              <span className={`amv-settings-status ${manager?.status === "Inactive" ? "amv-status-inactive" : "amv-status-active-badge"}`}>
                {manager?.status || "Active"}
              </span>
            </div>
          </div>

          {/* Password Reset Card */}
          <div className="amv-settings-card">
            <div className="amv-settings-card-header">
              <span className="amv-settings-card-icon">🔐</span>
              <div>
                <h3>Reset Password</h3>
                <p>Set a new password for this manager account</p>
              </div>
            </div>

            <form className="amv-reset-form" onSubmit={handleResetPassword}>
              {/* Hidden username input so Chrome browser popup identifies manager account instead of superadmin */}
              <input
                type="text"
                name="username"
                value={manager?.email || manager?.managerId || "manager"}
                readOnly
                autoComplete="username"
                style={{ display: "none" }}
              />

              {resetPwdMsg.text && (
                <div className={`amv-reset-msg ${resetPwdMsg.type === "success" ? "amv-reset-success" : "amv-reset-error"}`}>
                  {resetPwdMsg.text}
                </div>
              )}

              <div className="amv-reset-field">
                <label>New Password *</label>
                <div className="amv-pwd-input-wrap">
                  <input
                    type={showPwd ? "text" : "password"}
                    name="new-password"
                    autoComplete="new-password"
                    className="amv-reset-input"
                    placeholder="Enter new password (min 6 chars)"
                    value={resetPwd}
                    onChange={(e) => setResetPwd(e.target.value)}
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    className="amv-pwd-toggle"
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

              <div className="amv-reset-field">
                <label>Confirm New Password *</label>
                <div className="amv-pwd-input-wrap">
                  <input
                    type={showPwd ? "text" : "password"}
                    name="confirm-password"
                    autoComplete="new-password"
                    className="amv-reset-input"
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
                className="amv-reset-submit-btn"
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
        <div className="amv-table-wrap">
          <table className="amv-table">
            <thead>
              <tr><th>Order #</th><th>Table</th><th>Source</th><th>Status</th><th>Payment</th><th>Total</th></tr>
            </thead>
            <tbody>
              {orders.length === 0 ? (
                <tr><td colSpan={6} className="amv-empty-cell">No orders found</td></tr>
              ) : orders.map((o) => (
                <tr key={o._id}>
                  <td className="amv-order-id">#{o._id.slice(-6)}</td>
                  <td>{o.tableNumber || "—"}</td>
                  <td>{o.source || "QR"}</td>
                  <td><span className={`amv-status amv-status-${(o.status || "").toLowerCase()}`}>{o.status}</span></td>
                  <td><span className={`amv-pay-badge ${o.payment?.status === "Paid" ? "amv-paid" : "amv-pending"}`}>{o.payment?.status || "Pending"}</span></td>
                  <td><strong>{money(o.total)}</strong></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }

    if (tab === "Tables") {
      const totalCount = tables.length;
      const availCount = tables.filter((t) => (t.status || "").toLowerCase() === "available").length;
      const occCount = tables.filter((t) => (t.status || "").toLowerCase() === "occupied").length;
      const cleanCount = tables.filter((t) => (t.status || "").toLowerCase() === "cleaning").length;
      const resCount = tables.filter((t) => (t.status || "").toLowerCase() === "reserved").length;
      const occPercent = totalCount > 0 ? Math.round((occCount / totalCount) * 100) : 0;

      const filteredTables = tables.filter((t) => {
        const matchesFilter =
          tableFilter === "all" ||
          (t.status || "").toLowerCase() === tableFilter.toLowerCase();
        const searchLower = tableSearch.trim().toLowerCase();
        const matchesSearch =
          !searchLower ||
          formatTableNum(t.tableNumber).toLowerCase().includes(searchLower) ||
          (t.assignedWaiter?.name || "").toLowerCase().includes(searchLower) ||
          (t.status || "").toLowerCase().includes(searchLower);
        return matchesFilter && matchesSearch;
      });

      return (
        <div className="amv-tables-view">
          {/* Top KPI Summary Cards */}
          <div className="amv-tables-kpi-row">
            <div
              className={`amv-kpi-card ${tableFilter === "all" ? "amv-kpi-active" : ""}`}
              onClick={() => setTableFilter("all")}
            >
              <div className="amv-kpi-icon-box amv-kpi-total">🪑</div>
              <div className="amv-kpi-meta">
                <span className="amv-kpi-name">Total Tables</span>
                <strong className="amv-kpi-num">{totalCount}</strong>
              </div>
            </div>

            <div
              className={`amv-kpi-card ${tableFilter === "available" ? "amv-kpi-active" : ""}`}
              onClick={() => setTableFilter("available")}
            >
              <div className="amv-kpi-icon-box amv-kpi-avail">🟢</div>
              <div className="amv-kpi-meta">
                <span className="amv-kpi-name">Available</span>
                <strong className="amv-kpi-num amv-num-avail">{availCount}</strong>
                <small className="amv-kpi-sub">{totalCount > 0 ? Math.round((availCount / totalCount) * 100) : 0}% Ready</small>
              </div>
            </div>

            <div
              className={`amv-kpi-card ${tableFilter === "occupied" ? "amv-kpi-active" : ""}`}
              onClick={() => setTableFilter("occupied")}
            >
              <div className="amv-kpi-icon-box amv-kpi-occ">🔥</div>
              <div className="amv-kpi-meta">
                <span className="amv-kpi-name">Occupied</span>
                <strong className="amv-kpi-num amv-num-occ">{occCount}</strong>
                <small className="amv-kpi-sub">{occPercent}% Seated</small>
              </div>
            </div>

            <div
              className={`amv-kpi-card ${tableFilter === "cleaning" ? "amv-kpi-active" : ""}`}
              onClick={() => setTableFilter("cleaning")}
            >
              <div className="amv-kpi-icon-box amv-kpi-clean">🧹</div>
              <div className="amv-kpi-meta">
                <span className="amv-kpi-name">Cleaning</span>
                <strong className="amv-kpi-num amv-num-clean">{cleanCount}</strong>
                <small className="amv-kpi-sub">{cleanCount > 0 ? "Needs Reset" : "All Clean"}</small>
              </div>
            </div>

            <div
              className={`amv-kpi-card ${tableFilter === "reserved" ? "amv-kpi-active" : ""}`}
              onClick={() => setTableFilter("reserved")}
            >
              <div className="amv-kpi-icon-box amv-kpi-res">📅</div>
              <div className="amv-kpi-meta">
                <span className="amv-kpi-name">Reserved</span>
                <strong className="amv-kpi-num amv-num-res">{resCount}</strong>
                <small className="amv-kpi-sub">Upcoming</small>
              </div>
            </div>
          </div>

          {/* Floor Occupancy Progress Bar */}
          <div className="amv-floor-bar">
            <div className="amv-floor-bar-header">
              <span><strong>Floor Occupancy:</strong> {occPercent}% ({occCount} of {totalCount} occupied)</span>
              <span className="amv-floor-ready-text">{availCount} ready for seating</span>
            </div>
            <div className="amv-floor-track">
              <div
                className="amv-floor-fill"
                style={{ width: `${occPercent}%` }}
              />
            </div>
          </div>

          {/* Action & Filter Toolbar */}
          <div className="amv-tables-toolbar">
            <div className="amv-filter-chips">
              <button
                className={`amv-fchip ${tableFilter === "all" ? "active" : ""}`}
                onClick={() => setTableFilter("all")}
              >
                All Tables <span className="amv-chip-badge">{totalCount}</span>
              </button>
              <button
                className={`amv-fchip amv-chip-avail ${tableFilter === "available" ? "active" : ""}`}
                onClick={() => setTableFilter("available")}
              >
                <span className="amv-dot-avail" /> Available <span className="amv-chip-badge">{availCount}</span>
              </button>
              <button
                className={`amv-fchip amv-chip-occ ${tableFilter === "occupied" ? "active" : ""}`}
                onClick={() => setTableFilter("occupied")}
              >
                <span className="amv-dot-occ" /> Occupied <span className="amv-chip-badge">{occCount}</span>
              </button>
              <button
                className={`amv-fchip amv-chip-clean ${tableFilter === "cleaning" ? "active" : ""}`}
                onClick={() => setTableFilter("cleaning")}
              >
                <span className="amv-dot-clean" /> Cleaning <span className="amv-chip-badge">{cleanCount}</span>
              </button>
              <button
                className={`amv-fchip amv-chip-res ${tableFilter === "reserved" ? "active" : ""}`}
                onClick={() => setTableFilter("reserved")}
              >
                <span className="amv-dot-res" /> Reserved <span className="amv-chip-badge">{resCount}</span>
              </button>
            </div>

            <div className="amv-search-wrapper">
              <span className="amv-search-ico">🔍</span>
              <input
                type="text"
                className="amv-table-search-input"
                placeholder="Search table or waiter..."
                value={tableSearch}
                onChange={(e) => setTableSearch(e.target.value)}
              />
              {tableSearch && (
                <button className="amv-search-clear-btn" onClick={() => setTableSearch("")}>✕</button>
              )}
            </div>
          </div>

          {/* Tables Cards Grid */}
          {filteredTables.length === 0 ? (
            <div className="amv-empty-filter-state">
              <div className="amv-empty-icon">🍽️</div>
              <h4>No tables found</h4>
              <p>No tables match "{tableSearch || tableFilter}".</p>
              <button
                className="amv-clear-filters-btn"
                onClick={() => { setTableFilter("all"); setTableSearch(""); }}
              >
                Reset All Filters
              </button>
            </div>
          ) : (
            <div className="amv-tables-grid">
              {filteredTables.map((t) => {
                const statusCls = (t.status || "available").toLowerCase();
                const activeOrder = getActiveOrderForTable(t.tableNumber);
                const title = formatTableNum(t.tableNumber);
                const digits = getTableBadge(t.tableNumber);

                return (
                  <div key={t._id} className={`amv-tcard amv-tcard-${statusCls}`}>
                    {/* Top row: Table Number & Capacity */}
                    <div className="amv-tcard-top">
                      <div className="amv-tcard-title-box">
                        <span className="amv-tcard-tag">{digits}</span>
                        <h4 className="amv-tcard-heading">{title}</h4>
                      </div>
                      <span className="amv-tcard-seats" title="Seating Capacity">
                        👥 {t.capacity || 4}
                      </span>
                    </div>

                    {/* Visual Disk + Status Pill */}
                    <div className="amv-tcard-body">
                      <div className={`amv-table-disc amv-disc-${statusCls}`}>
                        <div className="amv-disc-center">
                          <span className="amv-disc-icon">
                            {statusCls === "occupied" ? "🍽️" : statusCls === "cleaning" ? "🧹" : statusCls === "reserved" ? "📅" : "🪑"}
                          </span>
                        </div>
                      </div>

                      <div className={`amv-tcard-pill amv-pill-${statusCls}`}>
                        <span className="amv-pulse-dot" />
                        {t.status || "Available"}
                      </div>
                    </div>

                    {/* Active Order Details if Occupied */}
                    {statusCls === "occupied" && (
                      <div className="amv-tcard-order-box">
                        {activeOrder ? (
                          <>
                            <div className="amv-order-top-row">
                              <span className="amv-order-id-tag">#{activeOrder._id.slice(-6)}</span>
                              <span className={`amv-order-status-tag amv-tag-${(activeOrder.status || "").toLowerCase()}`}>
                                {activeOrder.status}
                              </span>
                            </div>
                            <div className="amv-order-details">
                              <span>{activeOrder.items?.reduce((s, i) => s + i.quantity, 0) || 0} items</span>
                              <strong>{money(activeOrder.total)}</strong>
                            </div>
                          </>
                        ) : (
                          <div className="amv-order-placeholder">
                            <span>Active Dining Session</span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Bottom: Waiter Assignment */}
                    <div className="amv-tcard-bottom">
                      <span className="amv-waiter-label">Server</span>
                      <div className="amv-waiter-val">
                        {t.assignedWaiter?.name ? (
                          <span className="amv-waiter-name-tag" title={`Waiter: ${t.assignedWaiter.name}`}>
                            👤 {t.assignedWaiter.name}
                          </span>
                        ) : (
                          <span className="amv-waiter-unassigned-tag">
                            ⚠️ Unassigned
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      );
    }

    if (tab === "Kitchen") {
      const kitchenOrders = orders.filter((o) => ["New", "Preparing", "Ready"].includes(o.status));
      return (
        <div className="amv-grid">
          {kitchenOrders.length === 0 ? <p className="amv-empty">No active kitchen orders.</p>
            : kitchenOrders.map((o) => (
              <div key={o._id} className={`amv-kitchen-card amv-kitchen-${(o.status || "").toLowerCase()}`}>
                <div className="amv-kitchen-id">#{o._id.slice(-6)}</div>
                <div className="amv-kitchen-table">Table {o.tableNumber}</div>
                <span className="amv-kitchen-status">{o.status}</span>
                <small>{o.items?.reduce((s, i) => s + i.quantity, 0) || 0} items</small>
              </div>
            ))}
        </div>
      );
    }

    if (tab === "Staff") {
      return (
        <div className="amv-table-wrap">
          <table className="amv-table">
            <thead><tr><th>Waiter ID</th><th>Name</th><th>Email</th><th>Phone</th><th>Status</th></tr></thead>
            <tbody>
              {staff.length === 0 ? <tr><td colSpan={5} className="amv-empty-cell">No staff found</td></tr>
                : staff.map((s) => (
                  <tr key={s._id}>
                    <td><code className="amv-code">{s.waiterId}</code></td>
                    <td>{s.name}</td>
                    <td>{s.email || "—"}</td>
                    <td>{s.phone || "—"}</td>
                    <td><span className={`amv-status-dot ${s.status === "Active" ? "amv-dot-active" : "amv-dot-inactive"}`}>{s.status}</span></td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      );
    }

    if (tab === "Menu") {
      return (
        <div className="amv-table-wrap">
          <table className="amv-table">
            <thead><tr><th>Item</th><th>Category</th><th>Type</th><th>Price</th><th>Availability</th></tr></thead>
            <tbody>
              {menu.length === 0 ? <tr><td colSpan={5} className="amv-empty-cell">No menu items</td></tr>
                : menu.map((item) => (
                  <tr key={item._id}>
                    <td>{item.name}</td>
                    <td>{item.category}</td>
                    <td><span className={`amv-food-type ${item.type?.toLowerCase() === "non-veg" ? "amv-nonveg" : "amv-veg"}`}>{item.type || "Veg"}</span></td>
                    <td>{money(item.price)}</td>
                    <td><span className={item.inStock !== false ? "amv-available" : "amv-unavailable"}>{item.inStock !== false ? "Available" : "Out of stock"}</span></td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      );
    }

    if (tab === "Customers") {
      return (
        <div className="amv-table-wrap">
          <table className="amv-table">
            <thead><tr><th>Customer</th><th>Phone</th><th>Orders</th><th>Total Spend</th></tr></thead>
            <tbody>
              {customers.length === 0 ? <tr><td colSpan={4} className="amv-empty-cell">No customer data</td></tr>
                : customers.map((c, i) => (
                  <tr key={`${c.phone}-${i}`}>
                    <td>{c.name}</td>
                    <td>{c.phone || "—"}</td>
                    <td>{c.orders}</td>
                    <td><strong>{money(c.spend)}</strong></td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      );
    }

    if (tab === "Reservations") {
      return (
        <div className="amv-tables-view">
          {reservations.length === 0 ? (
            <div className="amv-empty-filter-state">
              <div className="amv-empty-icon">📅</div>
              <h4>No reservations</h4>
              <p>There are no reserved tables at this time.</p>
            </div>
          ) : (
            <div className="amv-tables-grid">
              {reservations.map((t) => {
                const title = formatTableNum(t.tableNumber);
                const digits = getTableBadge(t.tableNumber);
                return (
                  <div key={t._id} className="amv-tcard amv-tcard-reserved">
                    <div className="amv-tcard-top">
                      <div className="amv-tcard-title-box">
                        <span className="amv-tcard-tag">{digits}</span>
                        <h4 className="amv-tcard-heading">{title}</h4>
                      </div>
                      <span className="amv-tcard-seats">👥 {t.capacity || 4}</span>
                    </div>

                    <div className="amv-tcard-body">
                      <div className="amv-table-disc amv-disc-reserved">
                        <div className="amv-disc-center">
                          <span className="amv-disc-icon">📅</span>
                        </div>
                      </div>
                      <div className="amv-tcard-pill amv-pill-reserved">
                        <span className="amv-pulse-dot" />
                        Reserved
                      </div>
                    </div>

                    <div className="amv-tcard-bottom">
                      <span className="amv-waiter-label">Server</span>
                      <div className="amv-waiter-val">
                        {t.assignedWaiter?.name ? (
                          <span className="amv-waiter-name-tag">👤 {t.assignedWaiter.name}</span>
                        ) : (
                          <span className="amv-waiter-unassigned-tag">⚠️ Unassigned</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      );
    }

    // Overview
    return (
      <>
        <div className="amv-stat-grid">
          {statCards.map(({ icon, label, value }) => (
            <div key={label} className="amv-stat-card">
              <div className="amv-stat-icon">{icon}</div>
              <div>
                <p className="amv-stat-label">{label}</p>
                <strong className="amv-stat-value">{value}</strong>
              </div>
            </div>
          ))}
        </div>

        <div className="amv-overview-grid">
          <section className="amv-box">
            <h3>🔥 Live Orders</h3>
            {orders.filter((o) => ["New", "Preparing", "Ready"].includes(o.status)).length === 0 ? (
              <p className="amv-empty">No active orders right now.</p>
            ) : (
              <div className="amv-table-wrap">
                <table className="amv-table">
                  <thead><tr><th>Order</th><th>Table</th><th>Status</th><th>Total</th></tr></thead>
                  <tbody>
                    {orders.filter((o) => ["New", "Preparing", "Ready"].includes(o.status)).slice(0, 6).map((o) => (
                      <tr key={o._id}>
                        <td className="amv-order-id">#{o._id.slice(-6)}</td>
                        <td>{o.tableNumber}</td>
                        <td><span className={`amv-status amv-status-${o.status.toLowerCase()}`}>{o.status}</span></td>
                        <td>{money(o.total)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <section className="amv-box">
            <div className="amv-box-title-row">
              <h3>🪑 Table Status</h3>
              <button
                className="amv-box-link-btn"
                onClick={() => { setTab("Tables"); setTableFilter("all"); }}
              >
                View Floor Grid →
              </button>
            </div>
            <div className="amv-table-summary">
              {[["Available", "available"], ["Occupied", "occupied"], ["Reserved", "reserved"], ["Cleaning", "cleaning"]].map(([label, cls]) => (
                <div
                  key={label}
                  className={`amv-tsummary-item amv-tsummary-${cls} amv-clickable`}
                  onClick={() => { setTab("Tables"); setTableFilter(cls); }}
                  title={`Click to view ${label} tables`}
                >
                  <strong>{tables.filter((t) => (t.status || "").toLowerCase() === cls).length}</strong>
                  <span>{label}</span>
                </div>
              ))}
            </div>
          </section>
        </div>

        <section className="amv-box amv-box-full">
          <h3>📋 Recent Orders</h3>
          <div className="amv-table-wrap">
            <table className="amv-table">
              <thead><tr><th>Order #</th><th>Table</th><th>Status</th><th>Payment</th><th>Total</th></tr></thead>
              <tbody>
                {orders.slice(0, 10).map((o) => (
                  <tr key={o._id}>
                    <td className="amv-order-id">#{o._id.slice(-6)}</td>
                    <td>{o.tableNumber || "—"}</td>
                    <td><span className={`amv-status amv-status-${(o.status || "").toLowerCase()}`}>{o.status}</span></td>
                    <td><span className={`amv-pay-badge ${o.payment?.status === "Paid" ? "amv-paid" : "amv-pending"}`}>{o.payment?.status || "Pending"}</span></td>
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
    <div className="amv-layout">
      <aside className="amv-sidebar">
        <div className="amv-sidebar-brand">
          <div className="amv-brand-icon">👔</div>
          <div>
            <h2>Manager View</h2>
            <span>Admin Read-only</span>
          </div>
        </div>

        <div className="amv-sidebar-profile">
          <div className="amv-profile-avatar">{manager?.name?.charAt(0)?.toUpperCase() || "M"}</div>
          <div className="amv-profile-info">
            <strong>{manager?.name}</strong>
            <small>{manager?.managerId}</small>
            <small className="amv-restaurant-tag">{manager?.restaurantId?.restaurantName}</small>
          </div>
        </div>

        <nav className="amv-nav">
          {TABS.map((t) => (
            <button
              key={t}
              className={`amv-nav-btn ${tab === t ? "amv-nav-active" : ""}`}
              onClick={() => setTab(t)}
            >
              <span className="amv-nav-icon">{TAB_ICONS[t]}</span>
              {t}
            </button>
          ))}
        </nav>

        <div className="amv-sidebar-footer">
          {/* Bottom refresh removed per request */}
        </div>
      </aside>

      <main className="amv-main">
        <header className="amv-header">
          <div className="amv-header-left">
            <div className="amv-read-only-badge">👁️ Admin Read-Only View</div>
            <h1>{tab}</h1>
            <p>{manager?.restaurantId?.restaurantName} · {manager?.name} · {manager?.managerId}</p>
          </div>
          <div className="amv-header-right">
            <div className="amv-live-indicator">
              <span className="amv-live-dot" />
              Live Data
            </div>
            <button className="amv-back-header-btn" onClick={() => navigate(-1)}>← Back to Admin</button>
          </div>
        </header>

        {error && <div className="amv-error-banner">⚠️ {error}</div>}

        <div className="amv-content">
          {renderContent()}
        </div>
      </main>
    </div>
  );
}
