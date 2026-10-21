import { useContext, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { API_URL } from "../config/api";
import { CartContext } from "../context/CartContext";
import { getFallbackMenuImage, getMenuImageUrl } from "../utils/menuImage";
import "./CustomerCart.css";

function CustomerCart() {
  const navigate = useNavigate();
  const { cartItems: cart, removeFromCart, updateQuantity, clearCart } = useContext(CartContext);
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [placingOrder, setPlacingOrder] = useState(false);
  const [error, setError] = useState("");
  const [restaurantError, setRestaurantError] = useState("");
  
  const itemCount = cart.reduce((count, item) => count + Number(item.quantity || 0), 0);
  const total = useMemo(() => cart.reduce((sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 0), 0), [cart]);
  const [customer, setCustomer] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("customerUser") || "null");
    } catch {
      return null;
    }
  });

  const logoutCustomer = () => {
    localStorage.removeItem("customerUser");
    localStorage.removeItem("authUser");
    localStorage.removeItem("authToken");
    setCustomer(null);
  };

  const tableContext = (() => { try { return JSON.parse(localStorage.getItem("tableOrderContext") || "null"); } catch { return null; } })();
  const [tableNumber, setTableNumber] = useState(tableContext?.tableNumber || "Table 01");
  const [restaurantId, setRestaurantId] = useState(tableContext?.restaurantId || "");
  const [guestName, setGuestName] = useState("");

  const [tableStatuses, setTableStatuses] = useState({});
  const [restaurantTables, setRestaurantTables] = useState([]);

  // A cart opened from the normal menu has no QR context. In that case use the
  // first active restaurant so the customer can still choose a table and order.
  useEffect(() => {
    if (restaurantId) return;
    fetch(`${API_URL}/restaurants`)
      .then((response) => response.json())
      .then((data) => {
        const restaurants = Array.isArray(data) ? data : data.restaurants || [];
        const restaurant = restaurants.find((item) => item.status === "Active");
        if (!restaurant) throw new Error("No active restaurant is available.");
        setRestaurantId(restaurant.restaurantId);
      })
      .catch(() => setRestaurantError("Restaurant information could not be loaded."));
  }, [restaurantId]);

  // Fetch live tables and active orders status for this restaurant
  useEffect(() => {
    if (!restaurantId) return;
    const fetchLiveTableStatus = async () => {
      try {
        const [tablesResponse, ordersResponse] = await Promise.all([
          fetch(`${API_URL}/tables?restaurantId=${restaurantId}`),
          fetch(`${API_URL}/orders?restaurantId=${restaurantId}`),
        ]);
        const tablesData = await tablesResponse.json().catch(() => ({}));
        const ordersData = await ordersResponse.json().catch(() => ({}));

        const tablesList = Array.isArray(tablesData.tables) ? tablesData.tables : [];
        setRestaurantTables(tablesList);

        const ordersList = Array.isArray(ordersData.orders)
          ? ordersData.orders
          : Array.isArray(ordersData)
          ? ordersData
          : [];

        // Active ongoing orders (not Completed or Cancelled) mark tables as Occupied
        const activeOrders = ordersList.filter(
          (o) => o.status !== "Completed" && o.status !== "Cancelled" && o.orderStatus !== "Completed"
        );
        const activeTableNumbers = new Set(
          activeOrders.map((o) => String(o.tableNumber || "").toLowerCase().replace(/^table\s*/i, "").trim())
        );

        const statusMap = {};
        tablesList.forEach((t) => {
          const normNum = String(t.tableNumber || "").toLowerCase().replace(/^table\s*/i, "").trim();
          if (t.status && t.status !== "Available") {
            statusMap[normNum] = t.status;
          } else if (activeTableNumbers.has(normNum)) {
            statusMap[normNum] = "Occupied";
          } else {
            statusMap[normNum] = "Available";
          }
        });

        activeTableNumbers.forEach((num) => {
          if (!statusMap[num]) statusMap[num] = "Occupied";
        });

        setTableStatuses(statusMap);
      } catch (fetchErr) {
        console.error("Error fetching live table status:", fetchErr);
      }
    };

    fetchLiveTableStatus();
    const intervalId = window.setInterval(fetchLiveTableStatus, 6000);
    return () => window.clearInterval(intervalId);
  }, [restaurantId]);

  const getTableStatusInfo = (tableStr) => {
    const normNum = String(tableStr || "").toLowerCase().replace(/^table\s*/i, "").trim();
    const status = tableStatuses[normNum] || "Available";
    if (status === "Occupied") return { text: "Occupied", color: "#dc2626", bg: "#fef2f2", badge: "🔴 Occupied" };
    if (status === "Reserved") return { text: "Reserved", color: "#d97706", bg: "#fef3c7", badge: "🟡 Reserved" };
    if (status === "Cleaning") return { text: "Cleaning", color: "#2563eb", bg: "#eff6ff", badge: "🧹 Cleaning" };
    return { text: "Available", color: "#166534", bg: "#f0fdf4", badge: "🟢 Available" };
  };

  const tableOptions = useMemo(() => {
    if (restaurantTables.length > 0) {
      return restaurantTables.map((t) => {
        const rawStr = String(t.tableNumber || "").trim();
        return rawStr.toLowerCase().startsWith("table") ? rawStr : `Table ${rawStr.padStart(2, "0")}`;
      });
    }
    return Array.from({ length: 30 }, (_, index) => `Table ${String(index + 1).padStart(2, "0")}`);
  }, [restaurantTables]);

  const changeQuantity = (item, amount) => {
    const itemKey = item.cartKey || item._id;
    const nextQuantity = Number(item.quantity || 1) + amount;
    if (nextQuantity <= 0) removeFromCart(itemKey);
    else updateQuantity(itemKey, nextQuantity);
  };

  const checkout = async () => {
    setError("");
    if (!restaurantId) {
      setError(restaurantError || "Restaurant information is still loading. Please try again.");
      return;
    }
    setPlacingOrder(true);
    try {
      const finalCustomerName = customer?.name || guestName.trim() || `Guest (${tableNumber})`;
      const response = await fetch(`${API_URL}/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          restaurantId,
          tableNumber,
          customerName: finalCustomerName,
          items: cart,
          source: "QR",
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.message || "Unable to place order.");
      clearCart();
      localStorage.setItem("tableOrderContext", JSON.stringify({ restaurantId, tableNumber }));
      setOrderPlaced(true);
    } catch (requestError) {
      setError(requestError.message || "Unable to place order.");
    } finally {
      setPlacingOrder(false);
    }
  };

  if (orderPlaced) {
    return (
      <div className="customer-cart-container">
        <header className="customer-header">
          <div className="customer-logo" onClick={() => navigate("/customer/menu")} style={{ cursor: "pointer" }}>
            <div className="logo-icon">🍴</div>
            <div>
              <h2>FoodVista</h2>
              <span className="logo-tagline">Gourmet Dining & Bites</span>
            </div>
          </div>
          <div className="header-actions">
            {tableNumber && (
              <div className="header-table-badge" style={{ cursor: "default" }}>
                <span className="table-live-dot" />
                <span><strong>{tableNumber.toLowerCase().startsWith("table") ? tableNumber : `Table ${tableNumber}`}</strong></span>
              </div>
            )}
          </div>
        </header>

        <main className="customer-cart-page">
          <section className="cart-empty">
            <h2>Order placed successfully!</h2>
            <p>Your order has been sent to {tableNumber}. The restaurant will prepare it shortly.</p>
            <button type="button" onClick={() => navigate("/customer/menu")}>Order More Food</button>
          </section>
        </main>
      </div>
    );
  }

  return (
    <div className="customer-cart-container">
      <header className="customer-header">
        <div className="customer-logo" onClick={() => navigate("/customer/menu")} style={{ cursor: "pointer" }}>
          <div className="logo-icon">🍴</div>
          <div>
            <h2>FoodVista</h2>
            <span className="logo-tagline">Gourmet Dining & Bites</span>
          </div>
        </div>

        <div className="header-actions">
          {tableNumber && (
            <div className="header-table-badge" style={{ cursor: "default" }}>
              <span className="table-live-dot" />
              <span><strong>{tableNumber.toLowerCase().startsWith("table") ? tableNumber : `Table ${tableNumber}`}</strong></span>
            </div>
          )}

          {customer ? (
            <div className="customer-account">
              <span className="user-greeting">Hi, {customer.name?.replace("FoodVista ", "") || "Customer"}</span>
              <button className="login-btn logout" onClick={logoutCustomer}>Logout</button>
            </div>
          ) : (
            <button className="login-btn" onClick={() => navigate("/login")}>Login</button>
          )}
        </div>
      </header>

      <main className="customer-cart-page">
        <header className="customer-cart-header">
          <button type="button" onClick={() => navigate("/customer/menu")}>← Continue shopping</button>
          <h1>Your Cart</h1>
          <span>{itemCount} item{itemCount === 1 ? "" : "s"}</span>
        </header>
      {cart.length === 0 ? (
        <section className="cart-empty"><h2>Your cart is empty</h2><button type="button" onClick={() => navigate("/customer/menu")}>Browse Menu</button></section>
      ) : (
        <section className="cart-layout">
          <div className="cart-items">
            {cart.map((item) => (
              <article className="cart-item" key={item.cartKey || item._id}>
                {getMenuImageUrl(item) ? (
                  <img src={getMenuImageUrl(item)} alt={item.name || "Food item"} onError={(event) => {
                    event.currentTarget.onerror = null;
                    event.currentTarget.style.display = "none";
                  }} />
                ) : (
                  <div style={{ width: "80px", height: "80px", background: "#f1f5f9", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.8rem", flexShrink: 0 }}>🍽️</div>
                )}
                <div className="cart-item-info">
                  <span>{item.category || "Food"}</span>
                  <h2>{item.name || "Unnamed food"}</h2>
                  <p className="cart-description">{item.description || "Freshly prepared especially for you."}</p>
                  {item.selectedModifiers?.length > 0 && <p className="cart-customizations">{item.selectedModifiers.map((modifier) => modifier.name).join(" | ")}</p>}
                  <strong>Rs. {Number(item.price || 0).toFixed(2)}</strong>
                </div>
                <div className="cart-quantity" aria-label={`Quantity for ${item.name}`}>
                  <button type="button" onClick={() => changeQuantity(item, -1)}>-</button>
                  <span>{item.quantity}</span>
                  <button type="button" onClick={() => changeQuantity(item, 1)}>+</button>
                </div>
              </article>
            ))}
          </div>
          <aside className="cart-summary">
            <h2>Order Summary</h2>
            <div><span>Total</span><strong>Rs. {total.toFixed(2)}</strong></div>
            
            <label className="cart-table-select" htmlFor="table-number">Table Number
              <select id="table-number" value={tableNumber} onChange={(event) => setTableNumber(event.target.value)}>
                {tableOptions.map((tName) => {
                  const info = getTableStatusInfo(tName);
                  return (
                    <option key={tName} value={tName}>
                      {tName} — {info.badge}
                    </option>
                  );
                })}
              </select>
            </label>

            {/* Live Table Status Badge Indicator */}
            {(() => {
              const currentInfo = getTableStatusInfo(tableNumber);
              return (
                <div
                  className="table-live-status-badge"
                  style={{
                    margin: "8px 0 14px",
                    padding: "8px 12px",
                    borderRadius: "8px",
                    fontSize: "0.83rem",
                    fontWeight: "600",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    background: currentInfo.bg,
                    color: currentInfo.color,
                    border: `1px solid ${currentInfo.color}35`
                  }}
                >
                  <span>Selected Table Status:</span>
                  <span style={{ fontWeight: "700" }}>{currentInfo.badge}</span>
                </div>
              );
            })()}

            {!customer && (
              <label className="cart-table-select" htmlFor="guest-name" style={{ marginTop: "4px", display: "flex", flexDirection: "column", gap: "4px" }}>
                <span>Your Name (Optional)</span>
                <input
                  id="guest-name"
                  type="text"
                  placeholder="e.g. Guest Customer"
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.9rem", boxSizing: "border-box" }}
                />
              </label>
            )}
            {error && <p className="cart-error">{error}</p>}
            <button type="button" onClick={checkout} disabled={placingOrder || !restaurantId}>
              {placingOrder ? "Placing order..." : `Place Order for ${tableNumber}`}
            </button>
          </aside>
        </section>
      )}
      </main>
    </div>
  );
}

export default CustomerCart;
