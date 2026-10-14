import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { API_URL } from "../config/api";
import { getFallbackMenuImage, getMenuImageUrl } from "../utils/menuImage";
import WaiterLogoIcon from "../Components/WaiterLogoIcon";
import "./WaiterCreateOrder.css";

const money = (value) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(Number(value || 0));
const getSession = () => { try { return JSON.parse(localStorage.getItem("waiter") || localStorage.getItem("authUser") || "null"); } catch { return null; } };

const formatTableName = (tNum) => {
  if (!tNum) return "Table";
  const str = String(tNum).trim();
  return str.toLowerCase().startsWith("table") ? str : `Table ${str}`;
};

function WaiterCreateOrder() {
  const navigate = useNavigate();
  const session = useMemo(getSession, []);
  const waiterId = session?.id || session?._id;
  const [tables, setTables] = useState([]);
  const [orders, setOrders] = useState([]);
  const [menu, setMenu] = useState([]);
  const [modifiers, setModifiers] = useState([]);
  const [restaurantId, setRestaurantId] = useState("");
  const [customer, setCustomer] = useState({ name: "", phone: "" });
  const [tableId, setTableId] = useState("");
  const [cart, setCart] = useState([]);
  const [category, setCategory] = useState("All");
  const [search, setSearch] = useState("");
  const [customizing, setCustomizing] = useState(null);
  const [selectedOptions, setSelectedOptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [mobileCartOpen, setMobileCartOpen] = useState(false);
  const [viewMode, setViewMode] = useState("list"); // "list" | "grid"
  const [unavailableModal, setUnavailableModal] = useState(null);
  const [successModal, setSuccessModal] = useState(null);

  const [orderSource] = useState("Waiter");

  const isAdmin = Boolean(
    localStorage.getItem("restaurantAdmin") ||
    localStorage.getItem("adminInfo") ||
    localStorage.getItem("admin") ||
    localStorage.getItem("adminToken") ||
    session?.role === "restaurant" ||
    session?.role === "superadmin" ||
    session?.role === "admin"
  );

  const load = useCallback(async () => {
    if (isAdmin) {
      try {
        const adminData = JSON.parse(
          localStorage.getItem("adminInfo") ||
          localStorage.getItem("restaurantAdmin") ||
          localStorage.getItem("authUser") ||
          "{}"
        );
        const restId = adminData.restaurantId?._id || adminData.restaurantId || adminData._id || adminData.id || "";
        const restCode = adminData.restaurantId?.restaurantId || adminData.restaurantCode || restId;
        setRestaurantId(restCode);

        const [dashRes, modRes] = await Promise.all([
          fetch(`${API_URL}/orders/dashboard-summary?restaurantId=${encodeURIComponent(restId)}`),
          fetch(`${API_URL}/menu/modifiers`),
        ]);
        const [dashData, modData] = await Promise.all([dashRes.json(), modRes.json()]);
        setTables(dashData.tables || []);
        setOrders(dashData.orders || []);
        setModifiers(modData.modifiers || []);

        const menuRes = await fetch(`${API_URL}/menu?restaurantId=${encodeURIComponent(restId)}`);
        const menuData = await menuRes.json();
        setMenu(Array.isArray(menuData) ? menuData : []);
      } catch (requestError) {
        setError(requestError.message || "Unable to load restaurant order data.");
      } finally {
        setLoading(false);
      }
      return;
    }

    if (!waiterId) { setError("Waiter session not found. Please sign in again."); setLoading(false); return; }
    try {
      const [dashboardResponse, modifierResponse] = await Promise.all([
        fetch(`${API_URL}/waiters/${waiterId}/dashboard`), fetch(`${API_URL}/menu/modifiers`),
      ]);
      const [dashboard, modifierData] = await Promise.all([dashboardResponse.json(), modifierResponse.json()]);
      if (!dashboardResponse.ok || !dashboard.success) throw new Error(dashboard.message || "Unable to load tables.");
      setTables(dashboard.tables || []);
      setOrders(dashboard.orders || []);
      setModifiers(modifierData.modifiers || []);
      const restaurant = dashboard.waiter?.restaurantId;
      const restId = restaurant?._id || restaurant || "";
      setRestaurantId(restaurant?.restaurantId || restId || "");
      // Fetch menu scoped to this restaurant only
      const menuUrl = restId
        ? `${API_URL}/menu?restaurantId=${restId}`
        : `${API_URL}/menu`;
      const menuResponse = await fetch(menuUrl);
      const menuData = await menuResponse.json();
      if (!menuResponse.ok) throw new Error(menuData.message || "Unable to load menu.");
      setMenu(Array.isArray(menuData) ? menuData : []);
    } catch (requestError) { setError(requestError.message || "Unable to load order data."); }
    finally { setLoading(false); }
  }, [waiterId, isAdmin]);

  useEffect(() => { load(); }, [load]);
  const categories = useMemo(() => ["All", ...new Set(menu.map((item) => item.category).filter(Boolean))], [menu]);
  const visibleMenu = useMemo(() => {
    const filtered = menu.filter((item) =>
      item.inStock !== false &&
      (category === "All" || item.category === category) &&
      `${item.name} ${item.description || ""}`.toLowerCase().includes(search.toLowerCase())
    );
    // Veg pehle, Non-Veg baad mein
    return [...filtered].sort((a, b) => {
      const aVeg = (a.type || "").toLowerCase() === "veg" ? 0 : 1;
      const bVeg = (b.type || "").toLowerCase() === "veg" ? 0 : 1;
      return aVeg - bVeg;
    });
  }, [menu, category, search]);
  const chosenTable = tables.find((table) => String(table._id) === String(tableId));

  const cleanTableNumber = (str) =>
    String(str || "")
      .replace(/^Table\s*/i, "")
      .replace(/^0+/, "")
      .trim()
      .toLowerCase();

  // Find active running order for the selected table
  const activeTableOrder = useMemo(() => {
    if (!chosenTable) return null;
    const targetNum = cleanTableNumber(chosenTable.tableNumber);
    return (orders || []).find((o) => {
      if (["Completed", "Paid", "Cancelled"].includes(o.status)) return false;
      if (o.payment?.status === "Paid") return false;
      const orderNum = cleanTableNumber(o.tableNumber);
      return orderNum === targetNum;
    });
  }, [chosenTable, orders]);

  // Autofill customer details if active running order exists
  useEffect(() => {
    if (activeTableOrder) {
      setCustomer((prev) => ({
        name: prev.name || (activeTableOrder.customerName && !["Customer", "Walk-in Customer"].includes(activeTableOrder.customerName) ? activeTableOrder.customerName : ""),
        phone: prev.phone || activeTableOrder.customerPhone || "",
      }));
    }
  }, [activeTableOrder]);

  const modifierTotal = (item) => (item.selectedModifiers || []).reduce((sum, modifier) => sum + Number(modifier.priceAdjustment || 0), 0);
  const total = cart.reduce((sum, item) => sum + (Number(item.price) + modifierTotal(item)) * item.quantity, 0);
  const cartCount = cart.reduce((sum, item) => sum + Number(item.quantity || 0), 0);
  const getItemQuantity = (itemId) => cart.filter((item) => item._id === itemId).reduce((sum, item) => sum + Number(item.quantity || 0), 0);

  // Existing order calculations
  const existingSubtotal = useMemo(() => {
    if (!activeTableOrder || !Array.isArray(activeTableOrder.items)) return 0;
    return activeTableOrder.items.reduce((sum, item) => {
      const modTotal = (item.selectedModifiers || []).reduce((s, m) => s + (Number(m.priceAdjustment) || 0), 0);
      return sum + ((Number(item.price) || 0) + modTotal) * (Number(item.quantity) || 1);
    }, 0);
  }, [activeTableOrder]);

  const existingTax = useMemo(() => {
    return Number((existingSubtotal * 0.05).toFixed(2));
  }, [existingSubtotal]);

  const existingTotal = useMemo(() => {
    return Number((existingSubtotal + existingTax).toFixed(2));
  }, [existingSubtotal, existingTax]);

  // Combined totals
  const newSubtotal = total;
  const newTax = Number((newSubtotal * 0.05).toFixed(2));
  const newTotal = Number((newSubtotal + newTax).toFixed(2));

  const combinedSubtotal = existingSubtotal + newSubtotal;
  const combinedTax = Number((combinedSubtotal * 0.05).toFixed(2));
  const combinedTotal = Number((combinedSubtotal + combinedTax).toFixed(2));

  const addItem = (item, itemModifiers = []) => {
    const key = `${item._id}-${itemModifiers.map((modifier) => modifier.name).sort().join("-")}`;
    setCart((current) => {
      const existing = current.find((entry) => entry.cartKey === key);
      if (existing) return current.map((entry) => entry.cartKey === key ? { ...entry, quantity: entry.quantity + 1 } : entry);
      return [...current, { ...item, cartKey: key, quantity: 1, selectedModifiers: itemModifiers }];
    });
    setCustomizing(null);
  };

  // Quick reorder helper: click + on already ordered item to add 1 more to re-order cart
  const handleQuickReorderExisting = (existingItem) => {
    const matchedMenuItem = menu.find(
      (m) =>
        String(m._id) === String(existingItem.menuItemId) ||
        String(m.name || "").trim().toLowerCase() === String(existingItem.name || "").trim().toLowerCase()
    );
    if (matchedMenuItem) {
      handleItemAdd(matchedMenuItem);
    } else {
      addItem({
        _id: existingItem.menuItemId || existingItem._id || `custom-${Date.now()}`,
        name: existingItem.name,
        price: existingItem.price,
      }, existingItem.selectedModifiers || []);
    }
  };

  const handleItemAdd = (item) => {
    const itemOptions = (item.customization || []).flatMap((group) => group.options || []).map((option) => ({ name: option.name, priceAdjustment: Number(option.price || 0) }));
    if (itemOptions.length > 0) {
      setCustomizing({ ...item, itemOptions });
      setSelectedOptions([]);
    } else {
      addItem(item);
    }
  };

  const handleStepperPlus = (item) => {
    const existing = cart.find((e) => e._id === item._id);
    if (existing) {
      updateQuantity(existing.cartKey, existing.quantity + 1);
    } else {
      handleItemAdd(item);
    }
  };

  const handleStepperMinus = (item) => {
    const existing = cart.find((e) => e._id === item._id);
    if (existing) {
      updateQuantity(existing.cartKey, existing.quantity - 1);
    }
  };

  const toggleOption = (option) => setSelectedOptions((current) => current.some((entry) => entry.name === option.name) ? current.filter((entry) => entry.name !== option.name) : [...current, option]);
  const updateQuantity = (key, quantity) => setCart((current) => quantity < 1 ? current.filter((item) => item.cartKey !== key) : current.map((item) => item.cartKey === key ? { ...item, quantity } : item));
  
  const handleTableChange = async (event) => {
    const selectedId = event.target.value;
    if (!selectedId) {
      setTableId("");
      setError("");
      return;
    }
    const target = tables.find((t) => t._id === selectedId);
    setTableId(selectedId);
    if (target && ["Cleaning", "Out of Service"].includes(target.status)) {
      const tName = formatTableName(target.tableNumber);
      setError(`⛔ ${tName} is currently ${target.status}. Please select another table.`);
      setUnavailableModal({
        tableNumber: tName,
        status: target.status
      });
      return;
    }
    setError("");

    if (target && target.status === "Occupied") {
      try {
        const res = await fetch(`${API_URL}/orders?tableNumber=${encodeURIComponent(target.tableNumber)}`);
        const data = await res.json();
        if (data.success && Array.isArray(data.orders)) {
          setOrders((prev) => {
            const existingIds = new Set(data.orders.map((o) => o._id));
            const retained = (prev || []).filter((o) => !existingIds.has(o._id));
            return [...data.orders, ...retained];
          });
        }
      } catch {
        // Fallback to already loaded orders
      }
    }
  };

  const placeOrder = async () => {
    setError(""); setSuccess("");
    if (!chosenTable) {
      setError("⚠️ Please select a table before placing this order.");
      const selectEl = document.querySelector(".table-picker-group select");
      if (selectEl) {
        selectEl.focus();
        selectEl.scrollIntoView({ behavior: "smooth", block: "center" });
        selectEl.classList.add("highlight-table-picker");
        setTimeout(() => selectEl.classList.remove("highlight-table-picker"), 2500);
      }
      return;
    }
    if (chosenTable.status && ["Cleaning", "Out of Service"].includes(chosenTable.status)) {
      const tName = formatTableName(chosenTable.tableNumber);
      setUnavailableModal({
        tableNumber: tName,
        status: chosenTable.status
      });
      return setError(`⛔ ${tName} is currently ${chosenTable.status}. Orders cannot be placed on this table.`);
    }
    if (!cart.length) return setError("Add at least one menu item to the order.");
    if (!restaurantId) return setError("Restaurant details are missing. Please reload the page.");
    setPlacing(true);
    try {
      const response = await fetch(`${API_URL}/orders`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ restaurantId, tableNumber: chosenTable.tableNumber, customerName: customer.name.trim() || "Walk-in Customer", customerPhone: customer.phone.trim(), items: cart, source: "Waiter" }) });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.message || "Unable to place order.");

      const orderIdShort = result.order?._id?.slice(-6)?.toUpperCase() || "NEW";
      const tName = formatTableName(chosenTable.tableNumber);
      const cName = customer.name.trim() || "Walk-in Customer";
      const totalAmt = total * 1.05;
      const itemCount = cartCount;

      setSuccessModal({
        orderId: orderIdShort,
        tableNumber: tName,
        customerName: cName,
        itemCount: itemCount,
        totalAmount: totalAmt,
        tableId: chosenTable._id,
        customer: { name: customer.name, phone: customer.phone },
        isReorder: Boolean(result.isReorder),
      });

      setSuccess(result.isReorder ? `🎉 Reorder added to Order #${orderIdShort} (${tName}) & sent to kitchen!` : `🎉 Order #${orderIdShort} sent to kitchen successfully.`);
      setCart([]);
      setMobileCartOpen(false);
      await load();
    } catch (requestError) { setError(requestError.message || "Unable to place order."); }
    finally { setPlacing(false); }
  };
  const dashboardPath = isAdmin ? "/admin/dashboard" : "/waiter/dashboard";

  const logout = () => { ["waiter", "authUser", "authToken"].forEach((key) => localStorage.removeItem(key)); navigate("/login"); };

  if (loading) return <main className="create-order-state">Loading create-order workspace…</main>;
  return <div className="create-order-page">
    <aside className="create-sidebar">
      <div className="create-brand">
        <WaiterLogoIcon size={44} />
        <div><strong>{isAdmin ? "Admin Panel" : "Waiter Panel"}</strong><span>Restaurant Management</span></div>
      </div>
      <nav>
        <button onClick={() => navigate(dashboardPath)}>⌂ Dashboard</button>
        <button className="active">＋ Create Order</button>
        <button onClick={() => navigate(dashboardPath)}>🪑 Tables</button>
        <button onClick={() => navigate("/waiter/kitchen")}>♨ Kitchen Board</button>
        <button onClick={() => navigate(dashboardPath)}>▣ Orders</button>
        <button onClick={() => navigate("/waiter/billing")}>🧾 Billing</button>
      </nav>
      <button className="create-logout" onClick={logout}>⇥ Logout</button>
    </aside>
    <main className="create-main">
      <header className="create-header">
        <div className="header-left-col">
          <button className="back-button" onClick={() => navigate(dashboardPath)} aria-label="Go to dashboard">←</button>
          <div className="header-titles">
            <h1>Create New Order</h1>
            <p>Select table, add customer details & menu items.</p>
          </div>
        </div>
        <div className="header-right-col">
          {cartCount > 0 && (
            <button className="header-cart-btn" onClick={() => setMobileCartOpen((open) => !open)} aria-label="View Cart">
              🛒 <span>{cartCount}</span>
            </button>
          )}
          <div className="create-profile">
            <div>{session?.name?.[0]?.toUpperCase() || "W"}</div>
            <span><b>{session?.name || "Waiter"}</b><small>Waiter</small></span>
          </div>
        </div>
      </header>
      {success && <div className="create-alert success">{success}<button onClick={() => setSuccess("")}>×</button></div>}
      <div className="create-layout">
        <section className="order-workspace">
          {/* Table & Customer Details Section */}
          <section className="details-card">
            <div className="table-picker-group">
              <label htmlFor="table-select-dropdown">
                <span className="picker-label-icon">🪑</span>
                <span className="picker-label-text">Select Table <strong className="required-star">*</strong></span>
                {chosenTable && (
                  <span className={`table-status-pill ${chosenTable.status === "Available" ? "status-available" : chosenTable.status === "Occupied" ? "status-occupied" : "status-occupied"}`}>
                    {chosenTable.status === "Occupied" ? "OCCUPIED (RE-ORDER)" : chosenTable.status}
                  </span>
                )}
              </label>
              <select id="table-select-dropdown" value={tableId} onChange={handleTableChange}>
                <option value="">-- Choose a table for this order --</option>
                {tables.map((table) => {
                  const isAvail = table.status === "Available";
                  const isOccupied = table.status === "Occupied";
                  const tName = formatTableName(table.tableNumber);
                  return (
                    <option key={table._id} value={table._id}>
                      {isAvail 
                        ? `🟢 ${tName} (Available)` 
                        : isOccupied 
                          ? `🔴 ${tName} (Occupied - Re-order)` 
                          : `⛔ ${tName} (${table.status || "Unavailable"})`}
                    </option>
                  );
                })}
              </select>
            </div>
            <div className="customer-fields-group">
              <div className="customer-fields-title">
                <span>👥 Customer Details</span>
                <small>(Optional)</small>
              </div>
              <div className="customer-inputs-row">
                <input placeholder="Customer name" value={customer.name} onChange={(event) => setCustomer({ ...customer, name: event.target.value })} />
                <input placeholder="Phone number" value={customer.phone} onChange={(event) => setCustomer({ ...customer, phone: event.target.value })} />
              </div>
            </div>
          </section>

          {/* Menu Section */}
          <section className="menu-section">
            <div className="menu-search">
              <span className="search-icon">🔍</span>
              <input placeholder="Search food items, drinks, pizza, burgers…" value={search} onChange={(event) => setSearch(event.target.value)} />
              {search && <button type="button" className="clear-search-btn" onClick={() => setSearch("")}>✕</button>}
            </div>

            {/* Scrollable Category Chips */}
            <div className="category-list">
              {categories.map((name) => (
                <button type="button" className={category === name ? "active" : ""} key={name} onClick={() => setCategory(name)}>
                  {name}
                </button>
              ))}
            </div>

            {/* Menu Header with Item Count & View Switcher */}
            <div className="menu-view-header">
              <span className="menu-items-count">
                <strong>{visibleMenu.length}</strong> {visibleMenu.length === 1 ? "dish" : "dishes"} available
              </span>
              <div className="view-mode-buttons">
                <button type="button" className={`view-btn ${viewMode === "list" ? "active" : ""}`} onClick={() => setViewMode("list")} title="List View">
                  ☰ List
                </button>
                <button type="button" className={`view-btn ${viewMode === "grid" ? "active" : ""}`} onClick={() => setViewMode("grid")} title="Grid View">
                  ⊞ Grid
                </button>
              </div>
            </div>

            {/* LIST VIEW (Optimized for Mobile Waiters) */}
            {viewMode === "list" && (
              <div className="menu-list-view">
                {visibleMenu.map((item) => {
                  const inCartQty = getItemQuantity(item._id);
                  return (
                    <article className={`menu-list-card ${inCartQty > 0 ? "in-cart" : ""}`} key={item._id}>
                      <div className="mlist-info">
                        <div className="mlist-title-row">
                          <span className={`veg-dot ${item.type === "Non-Veg" ? "non-veg" : "veg"}`} title={item.type || "Veg"}></span>
                          <h3 className="mlist-name">{item.name}</h3>
                        </div>
                        <div className="mlist-price">{money(item.price)}</div>
                        {item.description && <p className="mlist-desc">{item.description}</p>}
                      </div>
                      <div className="mlist-media-col">
                        <div className="mlist-thumb-wrap">
                          {getMenuImageUrl(item) ? (
                            <img src={getMenuImageUrl(item)} alt={item.name} onError={(event) => { event.currentTarget.onerror = null; event.currentTarget.style.display = "none"; }} />
                          ) : (
                            <div style={{ width: "100%", height: "100%", background: "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.8rem", color: "#cbd5e1" }}>🍽️</div>
                          )}
                          {item.type && <span className={`mlist-type-tag ${item.type === "Non-Veg" ? "non-veg" : "veg"}`}>{item.type}</span>}
                        </div>
                        {inCartQty > 0 ? (
                          <div className="mlist-stepper">
                            <button type="button" onClick={() => handleStepperMinus(item)} aria-label="Decrease quantity">−</button>
                            <span className="stepper-qty">{inCartQty}</span>
                            <button type="button" onClick={() => handleStepperPlus(item)} aria-label="Increase quantity">+</button>
                          </div>
                        ) : (
                          <button type="button" className="mlist-add-btn" onClick={() => handleItemAdd(item)}>
                            ADD +
                          </button>
                        )}
                      </div>
                    </article>
                  );
                })}
              </div>
            )}

            {/* GRID VIEW (2-Column Visual Cards with Proper 4:3 Ratio) */}
            {viewMode === "grid" && (
              <div className="menu-grid-view">
                {visibleMenu.map((item) => {
                  const inCartQty = getItemQuantity(item._id);
                  return (
                    <article className={`menu-grid-card ${inCartQty > 0 ? "in-cart" : ""}`} key={item._id}>
                      <div className="mgrid-img-wrap">
                        {getMenuImageUrl(item) ? (
                          <img src={getMenuImageUrl(item)} alt={item.name} onError={(event) => { event.currentTarget.onerror = null; event.currentTarget.style.display = "none"; }} />
                        ) : (
                          <div style={{ width: "100%", height: "100%", background: "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "2.5rem", color: "#cbd5e1" }}>🍽️</div>
                        )}
                        <span className={`mgrid-type-tag ${item.type === "Non-Veg" ? "non-veg" : "veg"}`}>{item.type || "Veg"}</span>
                        {inCartQty > 0 && <span className="mgrid-cart-badge">{inCartQty} in cart</span>}
                      </div>
                      <div className="mgrid-content">
                        <h3 className="mgrid-title">{item.name}</h3>
                        <p className="mgrid-desc">{item.description || "Freshly prepared for your table."}</p>
                        <div className="mgrid-footer">
                          <strong className="mgrid-price">{money(item.price)}</strong>
                          {inCartQty > 0 ? (
                            <div className="mgrid-stepper">
                              <button type="button" onClick={() => handleStepperMinus(item)}>−</button>
                              <span>{inCartQty}</span>
                              <button type="button" onClick={() => handleStepperPlus(item)}>+</button>
                            </div>
                          ) : (
                            <button type="button" className="mlist-add-btn" onClick={() => handleItemAdd(item)}>+ Add</button>
                          )}
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}

            {!visibleMenu.length && <p className="no-menu">No menu items found in this category.</p>}
          </section>
        </section>

        {/* Backdrop for mobile cart bottom sheet */}
        {mobileCartOpen && <div className="cart-backdrop" onClick={() => setMobileCartOpen(false)} aria-hidden="true" />}

        {/* Order Summary: Sticky Sidebar on Desktop, Bottom Sheet on Mobile */}
        <aside className={`order-summary ${mobileCartOpen ? "mobile-open" : ""}`}>
          <div className="mobile-sheet-header">
            <div className="sheet-drag-handle"></div>
            <div className="sheet-title-row">
              <h2>🛒 Order Summary {cartCount > 0 ? `(${cartCount} new)` : ""}</h2>
              <button className="close-sheet-btn" onClick={() => setMobileCartOpen(false)} aria-label="Close cart">✕</button>
            </div>
          </div>
          <div className="summary-heading">
            <h2>🛒 Order Summary</h2>
            <button onClick={() => setCart([])} disabled={!cart.length}>Clear cart</button>
          </div>

          {/* Scrollable Body: Contains all items (both Running Order & New Re-order items) */}
          <div className="order-summary-body">
            {/* Running Order Section (If table has active order) */}
            {activeTableOrder && (
              <div className="running-order-section">
                <div className="running-order-header">
                  <div className="running-order-title">
                    <span className="running-icon">📋</span>
                    <div>
                      <strong>Running Order · {formatTableName(chosenTable?.tableNumber)}</strong>
                      <small>Order #{activeTableOrder._id.slice(-6).toUpperCase()} · {activeTableOrder.status || "In Kitchen"}</small>
                    </div>
                  </div>
                  <span className="running-badge-pill">Already Placed</span>
                </div>

                <div className="running-items-list">
                  {activeTableOrder.items && activeTableOrder.items.length > 0 ? (
                    activeTableOrder.items.map((item, idx) => (
                      <div className="running-item-row" key={`running-${item._id || idx}`}>
                        <div className="running-item-details">
                          <span className="running-item-name">{item.name}</span>
                          {item.selectedModifiers && item.selectedModifiers.length > 0 && (
                            <small className="running-item-mods">
                              {item.selectedModifiers.map((m) => m.name).join(", ")}
                            </small>
                          )}
                          <span className="running-item-price">
                            {money(item.price)} × {item.quantity}
                          </span>
                        </div>
                        <div className="running-item-right">
                          <strong className="running-item-total">{money(item.price * item.quantity)}</strong>
                          <button
                            type="button"
                            className="btn-quick-reorder-add"
                            onClick={() => handleQuickReorderExisting(item)}
                            title="Add another one to re-order"
                          >
                            + Add
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="no-running-items">No items on running order.</div>
                  )}
                </div>

                <div className="running-subtotal-row">
                  <span>Running Order Total:</span>
                  <strong>{money(existingTotal)}</strong>
                </div>
              </div>
            )}

            {/* Re-Order / New Items Section */}
            <div className="new-order-section">
              {activeTableOrder && (
                <div className="new-order-section-header">
                  <span>🛒 New Items to Add (Re-Order)</span>
                  {cart.length > 0 && <span className="new-items-count-pill">+{cartCount} items</span>}
                </div>
              )}

              {cart.length ? (
                <div className="summary-items">
                  {cart.map((item) => (
                    <article key={item.cartKey}>
                      <img src={getMenuImageUrl(item)} alt="" />
                      <div>
                        <b>{item.name}</b>
                        <small>{item.selectedModifiers?.length ? item.selectedModifiers.map((modifier) => modifier.name).join(", ") : "No modifiers"}</small>
                        <span>{money(Number(item.price) + modifierTotal(item))}</span>
                        <div className="quantity">
                          <button onClick={() => updateQuantity(item.cartKey, item.quantity - 1)}>−</button>
                          <b>{item.quantity}</b>
                          <button onClick={() => updateQuantity(item.cartKey, item.quantity + 1)}>+</button>
                        </div>
                      </div>
                      <strong>{money((Number(item.price) + modifierTotal(item)) * item.quantity)}</strong>
                      <button className="remove" onClick={() => updateQuantity(item.cartKey, 0)}>×</button>
                    </article>
                  ))}
                </div>
              ) : activeTableOrder ? (
                <div className="running-reorder-hint">
                  <span>➕</span>
                  <span>Tap any menu item to add it to this table's re-order.</span>
                </div>
              ) : (
                <div className="empty-summary">Your selected menu items will appear here.</div>
              )}
            </div>
          </div>

          {/* Pinned Bottom Footer: Totals and Action Buttons */}
          <div className="order-summary-footer">
            <div className="order-totals">
              {activeTableOrder ? (
                <>
                  <span><b>Current Order (Running)</b><b>{money(existingTotal)}</b></span>
                  {cart.length > 0 && (
                    <span><b style={{ color: "#2563eb" }}>+ New Re-Order Items</b><b style={{ color: "#2563eb" }}>{money(newTotal)}</b></span>
                  )}
                  <strong>
                    <span>{cart.length > 0 ? "Combined Total Amount" : "Running Total Amount"}</span>
                    <span>{money(cart.length > 0 ? combinedTotal : existingTotal)}</span>
                  </strong>
                </>
              ) : (
                <>
                  <span><b>Subtotal</b><b>{money(total)}</b></span>
                  <span><b>Tax (5%)</b><b>{money(total * 0.05)}</b></span>
                  <strong><span>Total Amount</span><span>{money(total * 1.05)}</span></strong>
                </>
              )}
            </div>

            {chosenTable && chosenTable.status === "Occupied" && (
              <div className="reorder-running-table-pill" style={{ margin: "6px 14px 2px", background: "#f0fdf4", color: "#166534", border: "1px solid #bbf7d0", padding: "6px 10px", borderRadius: "8px", fontSize: "11.5px", fontWeight: "700", textAlign: "center", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}>
                <span>🔄</span>
                <span>Re-order for {formatTableName(chosenTable.tableNumber)} (Running Table)</span>
              </div>
            )}

            {/* Table Selection Reminder when items are in cart but no table selected */}
            {cart.length > 0 && !chosenTable && (
              <div
                className="select-table-required-banner"
                onClick={() => {
                  const selectEl = document.querySelector(".table-picker-group select");
                  if (selectEl) {
                    selectEl.focus();
                    selectEl.scrollIntoView({ behavior: "smooth", block: "center" });
                    selectEl.classList.add("highlight-table-picker");
                    setTimeout(() => selectEl.classList.remove("highlight-table-picker"), 2200);
                  }
                }}
                role="button"
                tabIndex={0}
                title="Click to select a table"
              >
                <div className="banner-warn-icon-badge">🪑</div>
                <div className="banner-warn-content">
                  <strong>Please Select a Table</strong>
                  <small>Choose a table from the top to place this order</small>
                </div>
                <span className="banner-warn-action">Select Table ↗</span>
              </div>
            )}

            {/* Table confirmation badge */}
            {cart.length > 0 && chosenTable && (
              <div className="selected-table-confirm-banner" style={{ margin: "6px 14px 2px" }}>
                <span className="confirm-icon">🪑</span>
                <span className="confirm-text">Table: <strong>{formatTableName(chosenTable.tableNumber)}</strong></span>
                <span className={`table-status-pill status-${(chosenTable.status || "available").toLowerCase()}`}>
                  {chosenTable.status}
                </span>
              </div>
            )}

            {chosenTable && ["Cleaning", "Out of Service"].includes(chosenTable.status) && (
              <div className="occupied-table-banner" style={{ margin: "6px 14px 2px", background: "#fef2f2", color: "#dc2626", border: "1px solid #fecaca", padding: "6px 10px", borderRadius: "8px", fontSize: "11.5px", fontWeight: "700", textAlign: "center" }}>
                ⛔ {formatTableName(chosenTable.tableNumber)} is currently {chosenTable.status}. Orders cannot be placed.
              </div>
            )}

            {error && (
              <div className="place-order-inline-error" role="alert" style={{ margin: "6px 14px 2px" }}>
                <div className="inline-error-left">
                  <span className="inline-error-icon">⚠️</span>
                  <span className="inline-error-text">{error}</span>
                </div>
                <button
                  type="button"
                  className="inline-error-dismiss"
                  onClick={() => setError("")}
                  title="Dismiss"
                >
                  ×
                </button>
              </div>
            )}

            <button
              className={`place-order ${cart.length && !chosenTable ? "needs-table" : ""}`}
              onClick={placeOrder}
              disabled={placing || !cart.length || (chosenTable && ["Cleaning", "Out of Service"].includes(chosenTable.status))}
            >
              {placing 
                ? "Transmitting to Kitchen…" 
                : !chosenTable 
                  ? "🪑 Select Table to Place Order" 
                  : activeTableOrder 
                    ? (cart.length > 0 ? `🛒 Place Re-Order (+${money(newTotal)})` : "🛒 Add Items to Place Re-Order")
                    : "🛒 Place Order"}
            </button>
          </div>
        </aside>
      </div>

      {/* Floating Bottom Cart Bar for Mobile */}
      {cartCount > 0 && !mobileCartOpen && (
        <div className="mobile-cart-floating-bar" onClick={() => setMobileCartOpen(true)}>
          <div className="mcart-info">
            <span className="mcart-pill">🛒 {cartCount} {cartCount === 1 ? "item" : "items"}</span>
            <div className="mcart-amounts">
              <strong>{money(total * 1.05)}</strong>
              <small>Total (inc. tax)</small>
            </div>
          </div>
          <button className="mcart-action-btn">
            View Cart & Place Order →
          </button>
        </div>
      )}
    </main>
    {customizing && (
      <div className="modifier-overlay" role="dialog" aria-modal="true">
        <div className="modifier-modal">
          <button className="modal-close" onClick={() => setCustomizing(null)}>×</button>
          <h2>Customize {customizing.name}</h2>
          <p>Choose any modifiers for this item.</p>
          <div className="modifier-options">
            {[...customizing.itemOptions, ...modifiers].map((option, index) => (
              <label key={`${option.name}-${index}`}>
                <input type="checkbox" checked={selectedOptions.some((entry) => entry.name === option.name)} onChange={() => toggleOption(option)} />
                <span>{option.name}</span>
                <b>{Number(option.priceAdjustment) ? `+ ${money(option.priceAdjustment)}` : "Included"}</b>
              </label>
            ))}
          </div>
          <button className="add-customized" onClick={() => addItem(customizing, selectedOptions)}>
            Add to order · {money(Number(customizing.price) + selectedOptions.reduce((sum, option) => sum + Number(option.priceAdjustment || 0), 0))}
          </button>
        </div>
      </div>
    )}

    {/* TABLE UNAVAILABLE POPUP MODAL */}
    {unavailableModal && (
      <div className="table-modal-backdrop" onClick={() => setUnavailableModal(null)} role="dialog" aria-modal="true">
        <div className="table-modal-card" onClick={(e) => e.stopPropagation()}>
          <div className="modal-icon-badge" style={{ background: "#fef2f2", borderColor: "#fecaca" }}>⚠️</div>
          <h3 className="modal-title" style={{ color: "#dc2626" }}>Table Already Occupied!</h3>
          <p className="modal-desc">
            <strong>{unavailableModal.tableNumber}</strong> is already{" "}
            <span className="modal-status-badge" style={{ background: "#fee2e2", color: "#dc2626", borderColor: "#fca5a5" }}>{unavailableModal.status}</span>.
          </p>
          <p className="modal-subtext" style={{ fontSize: "14px", color: "#475569", margin: "6px 0 14px" }}>
            This table is already occupied. Please select another table.
          </p>
          <button 
            type="button" 
            className="modal-action-btn" 
            style={{ background: "linear-gradient(135deg, #dc2626, #b91c1c)" }}
            onClick={() => {
              setUnavailableModal(null);
              setTableId("");
              setError("");
            }}
          >
            Choose Another Table
          </button>
        </div>
      </div>
    )}

    {/* ORDER SENT TO KITCHEN SUCCESS POPUP MODAL */}
    {successModal && (
      <div 
        className="table-modal-backdrop" 
        onClick={() => {
          const prevTableId = successModal.tableId;
          const prevCustomer = successModal.customer;
          setSuccessModal(null);
          setCart([]);
          if (prevTableId) setTableId(prevTableId);
          if (prevCustomer) setCustomer(prevCustomer);
          window.scrollTo({ top: 0, behavior: "smooth" });
        }} 
        role="dialog" 
        aria-modal="true"
      >
        <div className="success-modal-card" onClick={(e) => e.stopPropagation()}>
          <div className="success-icon-badge">
            👨‍🍳
            <div className="success-check-bubble">✓</div>
          </div>
          <h3 className="success-modal-title">
            {successModal.isReorder ? "🔄 Reorder Sent to Kitchen!" : "Sent to Kitchen Successfully!"}
          </h3>
          <p className="success-modal-desc">
            {successModal.isReorder ? (
              <>
                Items added to <strong>{successModal.tableNumber}</strong>'s running order (<strong>#{successModal.orderId}</strong>) and sent to the kitchen.
              </>
            ) : (
              <>
                Order <strong>#{successModal.orderId}</strong> for <strong>{successModal.tableNumber}</strong> has been transmitted to the kitchen.
              </>
            )}
          </p>

          <div className="success-order-details-box">
            <div className="detail-row">
              <span>Table:</span>
              <strong>{successModal.tableNumber}</strong>
            </div>
            <div className="detail-row">
              <span>Customer:</span>
              <strong>{successModal.customerName}</strong>
            </div>
            <div className="detail-row">
              <span>Total Items:</span>
              <strong>{successModal.itemCount} items</strong>
            </div>
            <div className="detail-row row-amount">
              <span>Total Amount:</span>
              <strong>{money(successModal.totalAmount)}</strong>
            </div>
          </div>

          <div className="success-modal-actions">
            <button 
              type="button" 
              className="btn-create-next" 
              onClick={() => {
                const prevTableId = successModal.tableId;
                const prevCustomer = successModal.customer;
                const prevTableName = successModal.tableNumber;
                setSuccessModal(null);
                setCart([]);
                if (prevTableId) setTableId(prevTableId);
                if (prevCustomer) setCustomer(prevCustomer);
                setError("");
                setSuccess(`🟢 Selected ${prevTableName}. Add items to place another order for this table.`);
                setMobileCartOpen(false);
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
            >
              ＋ Create Another Order for {successModal.tableNumber}
            </button>
            <button 
              type="button" 
              className="btn-new-table" 
              onClick={() => {
                setSuccessModal(null);
                setCart([]);
                setTableId("");
                setCustomer({ name: "", phone: "" });
                setError("");
                setSuccess("");
                setMobileCartOpen(false);
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
            >
              🪑 Order for Different Table
            </button>
            <button 
              type="button" 
              className="btn-view-dashboard" 
              onClick={() => {
                setSuccessModal(null);
                navigate(dashboardPath);
              }}
            >
              ⌂ Go to Dashboard
            </button>
          </div>
        </div>
      </div>
    )}
  </div>;
}

export default WaiterCreateOrder;
