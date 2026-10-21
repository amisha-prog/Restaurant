import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { API_URL } from "../config/api";
import WaiterLogoIcon from "../Components/WaiterLogoIcon";
import "./WaiterBilling.css";

const money = (value) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(Number(value || 0));
const sessionData = () => { try { return JSON.parse(localStorage.getItem("waiter") || localStorage.getItem("authUser") || "null"); } catch { return null; } };

const getPaginationRange = (current, total) => {
  if (total <= 5) return Array.from({ length: total }, (_, i) => i + 1);
  if (current <= 3) return [1, 2, 3, 4, "...", total];
  if (current >= total - 2) return [1, "...", total - 3, total - 2, total - 1, total];
  return [1, "...", current - 1, current, current + 1, "...", total];
};

function WaiterBilling() {
  const navigate = useNavigate();
  const session = useMemo(sessionData, []);
  const waiterId = session?.id || session?._id;
  const [orders, setOrders] = useState([]);
  const [menu, setMenu] = useState([]);
  const [selectedId, setSelectedId] = useState("");
  const [bill, setBill] = useState(null);
  const [method, setMethod] = useState("Cash");
  const [discountType, setDiscountType] = useState("percentage");
  const [discountValue, setDiscountValue] = useState(0);
  const [reference, setReference] = useState("");
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState("");

  // Orders Pagination & Search
  const [ordersPage, setOrdersPage] = useState(1);
  const [ordersPerPage, setOrdersPerPage] = useState(6);
  const [orderSearch, setOrderSearch] = useState("");

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const q = orderSearch.trim().toLowerCase();
      if (!q) return true;
      return (
        order._id?.toLowerCase().includes(q) ||
        String(order.tableNumber || "").toLowerCase().includes(q) ||
        String(order.payment?.status || "").toLowerCase().includes(q) ||
        String(order.customerName || "").toLowerCase().includes(q)
      );
    });
  }, [orders, orderSearch]);

  const totalOrderPages = Math.ceil(filteredOrders.length / ordersPerPage) || 1;
  const currentOrderPage = Math.min(ordersPage, totalOrderPages);

  const paginatedOrders = useMemo(() => {
    const start = (currentOrderPage - 1) * ordersPerPage;
    return filteredOrders.slice(start, start + ordersPerPage);
  }, [filteredOrders, currentOrderPage, ordersPerPage]);

  const loadOrders = useCallback(async () => {
    if (!waiterId) { setError("Waiter session not found. Please sign in again."); setLoading(false); return; }
    try {
      const dashboardResponse = await fetch(`${API_URL}/waiters/${waiterId}/dashboard`);
      const dashboard = await dashboardResponse.json();
      if (!dashboardResponse.ok || !dashboard.success) throw new Error(dashboard.message || "Unable to load orders.");
      setOrders(dashboard.orders || []);
      setSelectedId((current) => current || dashboard.orders?.[0]?._id || "");
      // Fetch menu scoped to this restaurant only
      const restaurant = dashboard.waiter?.restaurantId;
      const restId = restaurant?._id || restaurant || "";
      const menuUrl = restId ? `${API_URL}/menu?restaurantId=${restId}` : `${API_URL}/menu`;
      const menuResponse = await fetch(menuUrl);
      const menuData = await menuResponse.json();
      setMenu(Array.isArray(menuData) ? menuData.filter((item) => item.inStock !== false) : []);
    } catch (requestError) { setError(requestError.message || "Unable to load billing."); }
    finally { setLoading(false); }
  }, [waiterId]);

  const loadBill = useCallback(async () => {
    if (!selectedId || !waiterId) { setBill(null); return; }
    try {
      const response = await fetch(`${API_URL}/waiters/${waiterId}/orders/${selectedId}/bill`);
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.message || "Unable to load bill.");
      setBill(result.order);
      setMethod(result.order.payment?.method || "Cash");
      setDiscountType(result.order.discount?.type || "percentage");
      setDiscountValue(result.order.discount?.value || 0);
      setReference(result.order.payment?.reference || "");
    } catch (requestError) { setError(requestError.message); }
  }, [selectedId, waiterId]);

  useEffect(() => { loadOrders(); }, [loadOrders]);
  useEffect(() => { loadBill(); }, [loadBill]);
  const mutate = async (path, options) => {
    setWorking(true); setError("");
    try {
      const response = await fetch(`${API_URL}/waiters/${waiterId}/orders/${selectedId}/bill/${path}`, { ...options, headers: { "Content-Type": "application/json", ...(options.headers || {}) } });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.message || "Unable to update bill.");
      setBill(result.order);
      await loadOrders();
    } catch (requestError) { setError(requestError.message); }
    finally { setWorking(false); }
  };
  const updateQuantity = (index, quantity) => mutate(`items/${index}`, { method: "PATCH", body: JSON.stringify({ quantity }) });
  const paid = bill?.payment?.status === "Paid";

  if (loading) return <main className="billing-state">Loading billing…</main>;
  return <div className="billing-page">
    <aside className="billing-sidebar"><h2 style={{ display: "flex", alignItems: "center", gap: "8px" }}><WaiterLogoIcon size={32} /> Waiter Panel</h2><button onClick={() => navigate("/waiter/dashboard")}>⌂ Dashboard</button><button onClick={() => navigate("/waiter/create-order")}>＋ Create Order</button><button onClick={() => navigate("/waiter/kitchen")}>♨ Kitchen Board</button><button className="active">🧾 Billing</button><button className="billing-logout" onClick={() => { ["waiter", "authUser", "authToken"].forEach((key) => localStorage.removeItem(key)); navigate("/login"); }}>⇥ Logout</button></aside>
    <main className="billing-main"><header><div><button className="back" onClick={() => navigate("/waiter/dashboard")}>←</button><h1>Billing & Payments</h1><p>Review order, update items, apply a discount and record payment.</p></div>{session?.name && <span>{session.name}</span>}</header>
      {error && <div className="billing-error">{error}<button onClick={() => setError("")}>×</button></div>}
      <div className="billing-layout">
        <section className="billing-orders">
          <div className="billing-orders-header">
            <h2>Orders <span className="billing-orders-count">({filteredOrders.length})</span></h2>
            <select
              className="billing-per-page-select"
              value={ordersPerPage}
              onChange={(e) => {
                setOrdersPerPage(Number(e.target.value));
                setOrdersPage(1);
              }}
              title="Orders per page"
              aria-label="Orders per page"
            >
              <option value={5}>5 / page</option>
              <option value={6}>6 / page</option>
              <option value={8}>8 / page</option>
              <option value={12}>12 / page</option>
              <option value={100}>All</option>
            </select>
          </div>

          <div className="billing-search-wrap">
            <span className="billing-search-icon">🔍</span>
            <input
              type="text"
              className="billing-search-input"
              placeholder="Search table, order ID..."
              value={orderSearch}
              onChange={(e) => {
                setOrderSearch(e.target.value);
                setOrdersPage(1);
              }}
            />
            {orderSearch && (
              <button
                type="button"
                className="billing-search-clear"
                onClick={() => {
                  setOrderSearch("");
                  setOrdersPage(1);
                }}
                title="Clear search"
                aria-label="Clear search"
              >
                ✕
              </button>
            )}
          </div>

          <div className="billing-order-list">
            {paginatedOrders.length ? (
              paginatedOrders.map((order) => {
                const statusStr = String(order.payment?.status || "Pending");
                const statusClass = statusStr.toLowerCase();
                return (
                  <button
                    className={`billing-order-item ${selectedId === order._id ? "selected" : ""}`}
                    key={order._id}
                    onClick={() => setSelectedId(order._id)}
                  >
                    <div className="order-item-top">
                      <b>#{order._id.slice(-6)}</b>
                      <span className="order-item-table">{order.tableNumber}</span>
                    </div>
                    <div className="order-item-bottom">
                      <span className={`order-status-badge status-${statusClass}`}>
                        {statusStr}
                      </span>
                      <strong className="order-item-total">{money(order.total)}</strong>
                    </div>
                  </button>
                );
              })
            ) : (
              <p className="billing-empty-text">No orders available.</p>
            )}
          </div>

          {filteredOrders.length > 0 && totalOrderPages > 1 && (
            <div className="billing-pagination-bar">
              <span className="billing-page-info">
                {Math.min((currentOrderPage - 1) * ordersPerPage + 1, filteredOrders.length)}–
                {Math.min(currentOrderPage * ordersPerPage, filteredOrders.length)} of {filteredOrders.length}
              </span>
              <div className="billing-page-nav">
                <button
                  type="button"
                  className="billing-nav-btn"
                  disabled={currentOrderPage <= 1}
                  onClick={() => setOrdersPage((p) => Math.max(p - 1, 1))}
                  title="Previous page"
                  aria-label="Previous page"
                >
                  ‹
                </button>
                {getPaginationRange(currentOrderPage, totalOrderPages).map((item, idx) =>
                  item === "..." ? (
                    <span key={`b-ellipsis-${idx}`} className="billing-page-ellipsis">…</span>
                  ) : (
                    <button
                      type="button"
                      key={`b-page-${item}`}
                      className={`billing-nav-btn ${item === currentOrderPage ? "active" : ""}`}
                      onClick={() => setOrdersPage(item)}
                    >
                      {item}
                    </button>
                  )
                )}
                <button
                  type="button"
                  className="billing-nav-btn"
                  disabled={currentOrderPage >= totalOrderPages}
                  onClick={() => setOrdersPage((p) => Math.min(p + 1, totalOrderPages))}
                  title="Next page"
                  aria-label="Next page"
                >
                  ›
                </button>
              </div>
            </div>
          )}
        </section>
        <section className="bill-card">{bill ? <><div className="bill-heading"><div><h2>Bill #{bill._id.slice(-6)}</h2><p>{bill.tableNumber} · {bill.customerName || "Walk-in customer"}</p></div><span className={`payment-status ${String(bill.payment?.status || "Pending").toLowerCase()}`}>{bill.payment?.status || "Pending"}</span></div>
          <div className="bill-lines">{bill.items.map((item, index) => <div className="bill-line" key={`${item.menuItemId}-${index}`}><div><b>{item.name}</b><small>{money(item.price)} each</small></div><div className="quantity-control"><button disabled={working || paid} onClick={() => updateQuantity(index, item.quantity - 1)}>−</button><b>{item.quantity}</b><button disabled={working || paid} onClick={() => updateQuantity(index, item.quantity + 1)}>+</button></div><strong>{money(Number(item.price) * item.quantity)}</strong></div>)}</div>
          <div className="add-item"><select disabled={working || paid} defaultValue="" onChange={(event) => { if (event.target.value) { mutate("items", { method: "POST", body: JSON.stringify({ menuItemId: event.target.value }) }); event.target.value = ""; } }}><option value="">+ Add menu item to bill</option>{menu.map((item) => <option key={item._id} value={item._id}>{item.name} — {money(item.price)}</option>)}</select></div>
          <div className="discount-row"><label>Discount <select value={discountType} disabled={working || paid} onChange={(event) => setDiscountType(event.target.value)}><option value="percentage">Percentage (%)</option><option value="amount">Amount (₹)</option></select></label><input type="number" min="0" max={discountType === "percentage" ? 100 : undefined} value={discountValue} disabled={working || paid} onChange={(event) => setDiscountValue(event.target.value)} /><button disabled={working || paid} onClick={() => mutate("discount", { method: "PATCH", body: JSON.stringify({ type: discountType, value: discountValue }) })}>Apply</button></div>
          <div className="totals"><span><b>Subtotal</b><b>{money(bill.subtotal ?? bill.total)}</b></span><span><b>Discount</b><b>− {money(bill.discount?.amount)}</b></span><span><b>Tax ({bill.taxRate ?? 5}%)</b><b>{money(bill.taxAmount)}</b></span><strong><b>Total payable</b><b>{money(bill.total)}</b></strong></div></> : <p>Select an order to view its bill.</p>}</section>
        {bill && <aside className="payment-card"><h2>Payment</h2><p>Current status: <b>{bill.payment?.status || "Pending"}</b></p><div className="method-list">{["Cash", "UPI", "Card"].map((name) => <button key={name} className={method === name ? "selected" : ""} disabled={working || paid} onClick={() => setMethod(name)}>{name === "Cash" ? "💵" : name === "UPI" ? "📱" : "💳"} {name}</button>)}</div>{method !== "Cash" && <label className="reference">Reference / transaction ID<input value={reference} disabled={working || paid} onChange={(event) => setReference(event.target.value)} /></label>}<button className="request-payment" disabled={working || paid} onClick={() => mutate("payment", { method: "PATCH", body: JSON.stringify({ action: "request", method }) })}>Request {method} Payment</button><button className="complete-payment" disabled={working || paid} onClick={() => mutate("payment", { method: "PATCH", body: JSON.stringify({ action: "complete", method, reference }) })}>{paid ? "Payment Recorded" : `Mark ${method} Paid`}</button>{bill.payment?.paidAt && <small className="paid-at">Paid on {new Date(bill.payment.paidAt).toLocaleString("en-IN")}</small>}</aside>}
      </div>
    </main>
  </div>;
}

export default WaiterBilling;
