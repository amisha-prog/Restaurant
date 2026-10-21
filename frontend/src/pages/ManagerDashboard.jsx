import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { API_URL } from "../config/api";
import { getFallbackMenuImage, getMenuImageUrl } from "../utils/menuImage";
import "./ManagerDashboard.css";

const isNonVegItem = (item) => {
  const t = String(item?.type || "").toLowerCase().trim();
  const c = String(item?.category || "").toLowerCase().trim();
  const n = String(item?.name || "").toLowerCase().trim();
  if (t === "non-veg" || t === "nonveg" || t.includes("non-veg") || t.includes("non veg")) return true;
  if (t === "veg") return false;
  if (c.includes("non-veg") || c.includes("non veg") || c.includes("chicken") || c.includes("mutton") || c.includes("fish") || c.includes("prawn") || c.includes("egg")) return true;
  if (n.includes("chicken") || n.includes("mutton") || n.includes("fish") || n.includes("prawn") || n.includes("egg") || n.includes("gosht") || n.includes("wings")) return true;
  return false;
};

const CATEGORY_PRIORITY = [
  "All",
  "Starters",
  "Main Course",
  "Beverages",
  "Biryani & Rice",
  "Pizza",
  "Burgers",
  "Chinese",
  "Snacks",
  "Combo",
  "Indian Breads",
  "Desserts",
];

const normalizeCategory = (cat, itemName = "") => {
  const c = String(cat || "").trim();
  const lower = c.toLowerCase();
  if (!c) return "Main Course";
  if (lower === "starters" || lower === "starter" || lower === "srater") return "Starters";
  if (lower === "beverages" || lower === "beverage" || lower === "drinks" || lower === "beverge") return "Beverages";
  if (lower === "main course" || lower === "non-veg main course" || lower === "veg main course") return "Main Course";
  if (lower === "biryani & rice" || lower.includes("biryani") || lower.includes("rice")) return "Biryani & Rice";
  if (lower === "pizza") return "Pizza";
  if (lower === "burgers" || lower === "burger") return "Burgers";
  if (lower === "chinese") return "Chinese";
  if (lower === "snacks" || lower === "snack") return "Snacks";
  if (lower === "combo" || lower === "combos") return "Combo";
  if (lower === "indian breads" || lower.includes("bread") || lower.includes("roti") || lower.includes("naan")) return "Indian Breads";
  if (lower === "desserts" || lower === "dessert" || lower.includes("sweet")) return "Desserts";
  if (lower === "veg") {
    if (String(itemName).toLowerCase().includes("roti") || String(itemName).toLowerCase().includes("naan")) {
      return "Indian Breads";
    }
    return "Main Course";
  }
  return c;
};

const getMenuImage = (item) => {
  const direct = getMenuImageUrl(item);
  if (direct) return direct;
  return getFallbackMenuImage(item?.category, item?.type);
};

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

  // ==========================================================
  // CREATE ORDER STATE FOR MANAGER
  // ==========================================================
  const [showCreateOrderModal, setShowCreateOrderModal] = useState(false);
  const [orderTable, setOrderTable] = useState("");
  const [orderCustomerName, setOrderCustomerName] = useState("");
  const [orderCustomerPhone, setOrderCustomerPhone] = useState("");
  const [orderCart, setOrderCart] = useState([]);
  const [orderCategory, setOrderCategory] = useState("All");
  const [orderSearch, setOrderSearch] = useState("");
  const [orderDietFilter, setOrderDietFilter] = useState("All"); // "All" | "Veg" | "Non-Veg"
  const [orderViewMode, setOrderViewMode] = useState("grid"); // "grid" | "list"
  const [mobileOrderTab, setMobileOrderTab] = useState("menu"); // "menu" | "cart"
  const [orderSubmitting, setOrderSubmitting] = useState(false);
  const [orderError, setOrderError] = useState("");
  const [orderSuccessModal, setOrderSuccessModal] = useState(null);
  const [extraMenu, setExtraMenu] = useState([]);
  const [showSalesModal, setShowSalesModal] = useState(false);

  // Pagination states
  const [salesPage, setSalesPage] = useState(1);
  const salesPerPage = 7;
  const [overviewOrdersPage, setOverviewOrdersPage] = useState(1);
  const overviewOrdersPerPage = 10;
  const [ordersTabPage, setOrdersTabPage] = useState(1);
  const ordersTabPerPage = 12;

  useEffect(() => {
    setOrdersTabPage(1);
  }, [searchQuery]);

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

  const { stats, orders = [], tables = [], staff = [], menu = [], customers = [], reservations = [], manager = {}, dailySales = [] } = data || {};

  // Combined active menu items with normalized category
  const activeMenu = useMemo(() => {
    const combined = [...(menu || []), ...(extraMenu || [])];
    const map = new Map();
    combined.forEach((rawItem) => {
      if (rawItem && rawItem._id && !map.has(String(rawItem._id))) {
        const normCat = normalizeCategory(rawItem.category, rawItem.name);
        map.set(String(rawItem._id), {
          ...rawItem,
          name: String(rawItem.name || "").trim(),
          category: normCat,
        });
      }
    });
    return Array.from(map.values());
  }, [menu, extraMenu]);

  // Unique categories ordered logically (Starters, Main Course, Beverages, etc.)
  const menuCategories = useMemo(() => {
    const presentCats = new Set();
    activeMenu.forEach((m) => {
      const c = String(m.category || "").trim();
      if (c && c !== "Non-Veg Main Course" && c !== "Veg") {
        presentCats.add(c);
      }
    });

    const ordered = [];
    CATEGORY_PRIORITY.forEach((p) => {
      if (p === "All" || presentCats.has(p)) {
        ordered.push(p);
      }
    });

    presentCats.forEach((c) => {
      if (!ordered.includes(c)) ordered.push(c);
    });

    return ordered;
  }, [activeMenu]);

  // Filtered menu for order modal
  const filteredOrderMenu = useMemo(() => {
    const list = activeMenu.filter((item) => {
      // 1. Category Filter
      if (orderCategory !== "All") {
        const itemCat = String(item.category || "").trim().toLowerCase();
        const selectedCat = String(orderCategory || "").trim().toLowerCase();
        if (itemCat !== selectedCat) return false;
      }

      // 2. Diet Filter (All / Veg / Non-Veg)
      const isNonVeg = isNonVegItem(item);
      if (orderDietFilter === "Veg" && isNonVeg) return false;
      if (orderDietFilter === "Non-Veg" && !isNonVeg) return false;

      // 3. Search Query
      if (orderSearch.trim()) {
        const q = orderSearch.toLowerCase().trim();
        const n = String(item.name || "").toLowerCase();
        const d = String(item.description || "").toLowerCase();
        const c = String(item.category || "").toLowerCase();
        if (!n.includes(q) && !d.includes(q) && !c.includes(q)) return false;
      }
      return true;
    });

    // Pure Veg first, Non-Veg after, sorted alphabetically
    return [...list].sort((a, b) => {
      const aNonVeg = isNonVegItem(a) ? 1 : 0;
      const bNonVeg = isNonVegItem(b) ? 1 : 0;
      if (aNonVeg !== bNonVeg) return aNonVeg - bNonVeg;
      return String(a.name || "").localeCompare(String(b.name || ""));
    });
  }, [activeMenu, orderCategory, orderDietFilter, orderSearch]);

  // Order Cart Totals
  const cartSubtotal = useMemo(() => {
    return orderCart.reduce((sum, item) => sum + (Number(item.price) || 0) * (Number(item.quantity) || 1), 0);
  }, [orderCart]);

  const cartTax = useMemo(() => {
    return Number((cartSubtotal * 0.05).toFixed(2));
  }, [cartSubtotal]);

  const cartGrandTotal = useMemo(() => {
    return Number((cartSubtotal + cartTax).toFixed(2));
  }, [cartSubtotal, cartTax]);

  const cartTotalQty = useMemo(() => {
    return orderCart.reduce((sum, item) => sum + (Number(item.quantity) || 1), 0);
  }, [orderCart]);

  // Selected table object
  const selectedTableObj = useMemo(() => {
    if (!orderTable) return null;
    return (tables || []).find((t) => String(t.tableNumber).trim().toLowerCase() === String(orderTable).trim().toLowerCase());
  }, [orderTable, tables]);

  const cleanTableNumber = (str) =>
    String(str || "")
      .replace(/^Table\s*/i, "")
      .replace(/^0+/, "")
      .trim()
      .toLowerCase();

  // Find active running order for the selected table
  const activeTableOrder = useMemo(() => {
    if (!orderTable) return null;
    const targetNum = cleanTableNumber(orderTable);
    return (orders || []).find((o) => {
      if (["Completed", "Paid", "Cancelled"].includes(o.status)) return false;
      if (o.payment?.status === "Paid") return false;
      const orderNum = cleanTableNumber(o.tableNumber);
      return orderNum === targetNum;
    });
  }, [orderTable, orders]);

  const existingRunningTotal = useMemo(() => {
    if (!activeTableOrder) return 0;
    return Number(activeTableOrder.total || 0);
  }, [activeTableOrder]);

  // Autofill customer details if active running order exists
  useEffect(() => {
    if (activeTableOrder && !orderCustomerName) {
      if (activeTableOrder.customerName) setOrderCustomerName(activeTableOrder.customerName);
      if (activeTableOrder.customerPhone) setOrderCustomerPhone(activeTableOrder.customerPhone);
    }
  }, [activeTableOrder]);

  // Close modals on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        if (showCreateOrderModal && !orderSubmitting) setShowCreateOrderModal(false);
        if (showSalesModal) setShowSalesModal(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showCreateOrderModal, showSalesModal, orderSubmitting]);

  const handleQuickReorderExisting = (item) => {
    const matched = activeMenu.find(
      (m) => String(m._id) === String(item._id) || m.name?.trim().toLowerCase() === item.name?.trim().toLowerCase()
    );
    if (matched) {
      handleAddCartItem(matched);
    } else {
      setOrderCart((prev) => {
        const existing = prev.find((it) => it.name === item.name);
        if (existing) {
          return prev.map((it) => (it.name === item.name ? { ...it, quantity: it.quantity + 1 } : it));
        }
        return [
          ...prev,
          {
            _id: item._id || `reorder-${Date.now()}`,
            name: item.name,
            price: Number(item.price) || 0,
            quantity: 1,
            type: item.type || "Veg",
            image: item.image || "",
          },
        ];
      });
    }
  };

  // Handlers for Order Modal
  const handleOpenCreateOrder = (preSelectedTable = "") => {
    setOrderError("");
    setOrderTable(preSelectedTable || "");
    setOrderCustomerName("");
    setOrderCustomerPhone("");
    setOrderCart([]);
    setOrderCategory("All");
    setOrderSearch("");
    setOrderDietFilter("All");
    setMobileOrderTab("menu");
    setOrderSuccessModal(null);
    setShowCreateOrderModal(true);

    if (!activeMenu.length) {
      const restId = manager?.restaurantId?._id || manager?.restaurantId?.restaurantId || manager?.restaurantId || "";
      if (restId) {
        fetch(`${API_URL}/menu?restaurantId=${encodeURIComponent(restId)}`)
          .then((r) => r.json())
          .then((list) => {
            if (Array.isArray(list)) setExtraMenu(list);
          })
          .catch(() => {});
      }
    }
  };

  const handleAddCartItem = (item) => {
    setOrderCart((prev) => {
      const existing = prev.find((it) => it._id === item._id);
      if (existing) {
        return prev.map((it) => (it._id === item._id ? { ...it, quantity: it.quantity + 1 } : it));
      }
      return [
        ...prev,
        {
          _id: item._id,
          name: item.name,
          price: Number(item.price) || 0,
          quantity: 1,
          type: item.type || "Veg",
          image: item.image || "",
          selectedModifiers: [],
        },
      ];
    });
  };

  const handleUpdateCartQty = (itemId, newQty) => {
    setOrderCart((prev) => {
      if (newQty <= 0) return prev.filter((it) => it._id !== itemId);
      return prev.map((it) => (it._id === itemId ? { ...it, quantity: newQty } : it));
    });
  };

  const handleRemoveCartItem = (itemId) => {
    setOrderCart((prev) => prev.filter((it) => it._id !== itemId));
  };

  const handleVacateTable = async (tableId, tableNum) => {
    if (!tableId) return;
    try {
      const resp = await fetch(`${API_URL}/tables/${tableId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "Available" }),
      });
      const resData = await resp.json().catch(() => ({}));
      if (resp.ok && resData.success) {
        setData((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            tables: (prev.tables || []).map((t) =>
              t._id === tableId ? { ...t, status: "Available" } : t
            ),
          };
        });
      }
    } catch (err) {
      console.error("Vacate table error:", err);
    }
  };

  const handleSubmitOrder = async (e) => {
    if (e) e.preventDefault();
    setOrderError("");

    if (!orderTable) {
      setOrderError("Please select a dining table.");
      return;
    }

    if (selectedTableObj && ["Cleaning", "Out of Service"].includes(selectedTableObj.status)) {
      setOrderError(`⛔ Table ${orderTable} is currently ${selectedTableObj.status}. Orders cannot be placed on this table.`);
      return;
    }

    if (!orderCart.length) {
      setOrderError("Please add at least one menu item to the order.");
      return;
    }

    const restIdToSend =
      manager?.restaurantId?.restaurantId ||
      manager?.restaurantId?._id ||
      manager?.restaurantId ||
      session?.restaurantId?.restaurantId ||
      session?.restaurantId?._id ||
      session?.restaurantId ||
      session?.restaurantCode ||
      "REST012";

    setOrderSubmitting(true);
    try {
      const response = await fetch(`${API_URL}/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          restaurantId: restIdToSend,
          tableNumber: orderTable,
          customerName: orderCustomerName.trim() || "Walk-in Customer",
          customerPhone: orderCustomerPhone.trim(),
          items: orderCart,
          source: "Manager",
        }),
      });

      const resData = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(resData.message || "Failed to create order.");
      }

      const orderShortId = resData.order?._id?.slice(-6)?.toUpperCase() || "NEW";
      const totalAmount = resData.order?.total || cartGrandTotal;
      const count = resData.order?.items?.reduce((s, it) => s + (it.quantity || 1), 0) || cartTotalQty;

      setOrderSuccessModal({
        orderId: orderShortId,
        tableNumber: orderTable,
        customerName: orderCustomerName.trim() || "Walk-in Customer",
        customerPhone: orderCustomerPhone.trim(),
        totalAmount,
        itemCount: count,
        isReorder: Boolean(resData.isReorder),
      });

      setOrderCart([]);
      await load(true);
    } catch (err) {
      console.error("Manager create order error:", err);
      setOrderError(err.message || "Unable to place order.");
    } finally {
      setOrderSubmitting(false);
    }
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

  // Executive Metric Cards Configuration (Interactive with Navigation & Actions)
  const metricCards = [
    {
      id: "sales",
      label: "Today Sales",
      value: money(stats?.todaySales),
      icon: "💰",
      color: "card-emerald",
      detail: (stats?.todayPaidSales || 0) > 0
        ? `Paid: ${money(stats?.todayPaidSales)} · Pending: ${money(stats?.todayPendingSales)}`
        : `₹${Number(stats?.todaySales || 0).toLocaleString("en-IN")} Total · Tap for Day-Wise Report ↗`,
      onClick: () => setShowSalesModal(true),
    },
    {
      id: "today-orders",
      label: "Today's Orders",
      value: stats?.todayOrders || 0,
      icon: "🛍️",
      color: "card-indigo",
      detail: `${stats?.todayOrders || 0} Placed Today · View All Orders ↗`,
      onClick: () => setTab("Orders"),
    },
    {
      id: "active-orders",
      label: "Active Orders",
      value: stats?.activeOrders || 0,
      icon: "🔥",
      color: "card-amber",
      detail: "Cooking / Pending · View Orders ↗",
      onClick: () => setTab("Orders"),
    },
    {
      id: "ready-orders",
      label: "Ready to Serve",
      value: stats?.readyOrders || 0,
      icon: "✅",
      color: "card-green",
      detail: "Awaiting Waiter · View Kitchen ↗",
      onClick: () => setTab("Kitchen"),
    },
    {
      id: "occupied-tables",
      label: "Occupied Tables",
      value: stats?.occupiedTables || 0,
      icon: "🪑",
      color: "card-violet",
      detail: "Seated Guests · View Tables Board ↗",
      onClick: () => setTab("Tables"),
    },
    {
      id: "reservations",
      label: "Reservations",
      value: stats?.reservations || 0,
      icon: "📅",
      color: "card-rose",
      detail: `${stats?.reservations || 0} Booked Tables · View Bookings ↗`,
      onClick: () => setTab("Reservations"),
    },
    {
      id: "staff",
      label: "Staff Members",
      value: stats?.staff || 0,
      icon: "👥",
      color: "card-cyan",
      detail: "Active Waiters · View Staff Team ↗",
      onClick: () => setTab("Staff"),
    },
    {
      id: "customers",
      label: "Total Customers",
      value: stats?.customers || 0,
      icon: "👤",
      color: "card-blue",
      detail: "Guests & Accounts · View Directory ↗",
      onClick: () => setTab("Customers"),
    },
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

  // Modern Pagination Bar Component
  const renderPagination = ({ currentPage, totalPages, totalItems, itemsPerPage, onPageChange }) => {
    if (totalPages <= 1) return null;

    const startItem = totalItems === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
    const endItem = Math.min(currentPage * itemsPerPage, totalItems);

    const pages = [];
    const maxButtons = 3;
    let startPage = Math.max(1, currentPage - 1);
    let endPage = Math.min(totalPages, startPage + maxButtons - 1);
    if (endPage - startPage + 1 < maxButtons) {
      startPage = Math.max(1, endPage - maxButtons + 1);
    }

    for (let p = startPage; p <= endPage; p++) {
      pages.push(p);
    }

    return (
      <div className="manager-pagination-bar">
        <div className="manager-pagination-info">
          Showing <strong>{startItem}</strong>–<strong>{endItem}</strong> of <strong>{totalItems}</strong> records
        </div>
        <div className="manager-pagination-controls">
          <button
            type="button"
            className="manager-page-nav-btn page-nav-btn"
            disabled={currentPage <= 1}
            onClick={() => onPageChange(currentPage - 1)}
            title="Previous Page"
          >
            ‹ Prev
          </button>

          {startPage > 1 && (
            <>
              <button
                type="button"
                className={`manager-page-num-btn page-num-btn ${currentPage === 1 ? "active" : ""}`}
                onClick={() => onPageChange(1)}
              >
                1
              </button>
              {startPage > 2 && <span className="page-ellipsis">…</span>}
            </>
          )}

          {pages.map((p) => (
            <button
              key={p}
              type="button"
              className={`manager-page-num-btn page-num-btn ${currentPage === p ? "active" : ""}`}
              onClick={() => onPageChange(p)}
            >
              {p}
            </button>
          ))}

          {endPage < totalPages && (
            <>
              {endPage < totalPages - 1 && <span className="page-ellipsis">…</span>}
              <button
                type="button"
                className={`manager-page-num-btn page-num-btn ${currentPage === totalPages ? "active" : ""}`}
                onClick={() => onPageChange(totalPages)}
              >
                {totalPages}
              </button>
            </>
          )}

          <button
            type="button"
            className="manager-page-nav-btn page-nav-btn"
            disabled={currentPage >= totalPages}
            onClick={() => onPageChange(currentPage + 1)}
            title="Next Page"
          >
            Next ›
          </button>
        </div>
      </div>
    );
  };

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
          <div className="manager-brand-badge">👔</div>
          <div className="manager-brand-text">
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

        {/* Manager Profile Chip */}
        <div className="manager-user-card">
          <div className="user-avatar-circle">
            {(manager?.name || session?.name || "M").charAt(0).toUpperCase()}
          </div>
          <div className="user-info">
            <strong>{manager?.name || session?.name || "Manager"}</strong>
            <span className="user-role-badge">ID: {manager?.managerId || session?.managerId || "MGR001"}</span>
            <span className="user-rest-badge">🏪 {manager?.restaurantId?.restaurantName || session?.restaurantName || "Restaurant"}</span>
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
                <button
                  key={card.label}
                  type="button"
                  className={`manager-metric-card ${card.color} is-clickable`}
                  onClick={card.onClick}
                  title={`Click to open ${card.label}`}
                >
                  <div className="metric-icon-badge">{card.icon}</div>
                  <div className="metric-details">
                    <div className="metric-top-row">
                      <span className="metric-label">{card.label}</span>
                      <span className="metric-card-arrow">➔</span>
                    </div>
                    <h2 className="metric-value">{card.value}</h2>
                    <small className="metric-detail-text">{card.detail}</small>
                  </div>
                </button>
              ))}
            </section>

            {/* Day-Wise Sales Breakdown Section */}
            <section className="manager-content-card manager-daily-sales-section">
              <div className="card-section-header">
                <div>
                  <h2>📈 Day-Wise Sales & Revenue History</h2>
                  <p>Comprehensive date-by-date record of orders, collected revenue, and active table balances</p>
                </div>
                <div className="card-section-actions">
                  <span className="sales-total-pill">
                    <span className="pill-text-long">All-Time Revenue:</span>
                    <span className="pill-text-short">All-Time:</span>
                    <strong>{money(dailySales.reduce((s, d) => s + (d.totalSales || 0), 0))}</strong>
                  </span>
                  <button
                    type="button"
                    className="btn-view-sales-modal"
                    onClick={() => setShowSalesModal(true)}
                  >
                    <span>📊</span>
                    <span className="btn-text-long">Full Day-Wise Report</span>
                    <span className="btn-text-short">Full Report</span>
                  </button>
                </div>
              </div>

              <div className="daily-sales-table-wrapper">
                <table className="manager-data-table daily-sales-table">
                  <thead>
                    <tr>
                      <th>DATE</th>
                      <th>ORDERS</th>
                      <th>TOTAL SALES</th>
                      <th>PAID REVENUE</th>
                      <th>PENDING REVENUE</th>
                      <th>SETTLEMENT STATUS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dailySales.length === 0 ? (
                      <tr>
                        <td colSpan="6" style={{ textAlign: "center", padding: "32px", color: "#64748b" }}>
                          No sales records found.
                        </td>
                      </tr>
                    ) : (
                      dailySales
                        .slice((salesPage - 1) * salesPerPage, salesPage * salesPerPage)
                        .map((day) => {
                          const isToday = day.date === new Date().toISOString().slice(0, 10);
                          const isSettled = day.pendingSales <= 0;
                          const dateObj = new Date(day.date);
                          const formattedDate = isNaN(dateObj.getTime())
                            ? day.date
                            : dateObj.toLocaleDateString("en-IN", {
                                weekday: "short",
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                              });

                          return (
                            <tr key={day.date} className={isToday ? "today-sales-highlight-row" : ""}>
                              <td>
                                <div className="sales-date-cell">
                                  <strong>{isToday ? "⚡ Today · " : ""}{formattedDate}</strong>
                                  <small>{day.date}</small>
                                </div>
                              </td>
                              <td>
                                <span className="sales-orders-count-badge">
                                  🛍️ {day.orderCount} Order{day.orderCount === 1 ? "" : "s"}
                                </span>
                              </td>
                              <td>
                                <strong className="sales-amount-total">
                                  {money(day.totalSales)}
                                </strong>
                              </td>
                              <td>
                                <span className="sales-amount-paid">
                                  {money(day.paidSales)}
                                </span>
                              </td>
                              <td>
                                <span className={`sales-amount-pending ${day.pendingSales > 0 ? "has-pending" : ""}`}>
                                  {money(day.pendingSales)}
                                </span>
                              </td>
                              <td>
                                <span className={`settle-badge ${isSettled ? "is-settled" : "is-running"}`}>
                                  {isSettled ? "✓ Fully Settled" : "⏳ Active / Pending"}
                                </span>
                              </td>
                            </tr>
                          );
                        })
                    )}
                  </tbody>
                </table>
              </div>

              {renderPagination({
                currentPage: salesPage,
                totalPages: Math.ceil(dailySales.length / salesPerPage),
                totalItems: dailySales.length,
                itemsPerPage: salesPerPage,
                onPageChange: (p) => setSalesPage(p),
              })}
            </section>

            <section className="manager-content-card">
              <div className="card-section-header">
                <div>
                  <h2>🔥 Live Order Management</h2>
                  <p>Real-time stream of incoming orders, kitchen progress, and payment status</p>
                </div>
                <div className="card-section-actions">
                  <button
                    type="button"
                    className="btn-view-all-orders"
                    onClick={() => setTab("Orders")}
                  >
                    View All Orders ({orders.length}) →
                  </button>
                </div>
              </div>
              {renderOrdersTable(
                orders.slice(
                  (overviewOrdersPage - 1) * overviewOrdersPerPage,
                  overviewOrdersPage * overviewOrdersPerPage
                )
              )}
              {renderPagination({
                currentPage: overviewOrdersPage,
                totalPages: Math.ceil(orders.length / overviewOrdersPerPage),
                totalItems: orders.length,
                itemsPerPage: overviewOrdersPerPage,
                onPageChange: (p) => setOverviewOrdersPage(p),
              })}
            </section>
          </>
        )}

        {/* 2. ORDERS TAB */}
        {tab === "Orders" && (
          <section className="manager-content-card">
            <div className="card-section-header orders-section-header">
              <div className="card-section-title-group">
                <h2>📑 Orders History & Live Queue</h2>
                <p>Showing {filteredOrders.length} of {orders.length} total restaurant orders</p>
              </div>

              <div className="manager-search-bar orders-search-mid">
                <span className="search-icon">🔍</span>
                <input
                  type="search"
                  placeholder="Search orders..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                {searchQuery && (
                  <button type="button" className="clear-search-btn" onClick={() => setSearchQuery("")} title="Clear search">
                    ✕
                  </button>
                )}
              </div>

              <div className="card-section-actions orders-actions-corner">
                <button
                  type="button"
                  className="manager-btn-create-order"
                  onClick={() => handleOpenCreateOrder()}
                >
                  ➕ Create New Order
                </button>
              </div>
            </div>
            {renderOrdersTable(
              filteredOrders.slice(
                (ordersTabPage - 1) * ordersTabPerPage,
                ordersTabPage * ordersTabPerPage
              )
            )}
            {renderPagination({
              currentPage: ordersTabPage,
              totalPages: Math.ceil(filteredOrders.length / ordersTabPerPage),
              totalItems: filteredOrders.length,
              itemsPerPage: ordersTabPerPage,
              onPageChange: (p) => setOrdersTabPage(p),
            })}
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
              <div className="card-section-actions">
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
                    <div className="table-card-footer-action">
                      <button
                        type="button"
                        className="btn-table-order"
                        onClick={() => handleOpenCreateOrder(table.tableNumber)}
                        title={`Create Order for ${table.tableNumber}`}
                      >
                        ➕ Place Order
                      </button>
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
                <h2>♨️ Live Kitchen Board & Preparation Queue</h2>
                <p>Tracking dishes currently cooking, preparing and ready for pickup</p>
              </div>
              <div className="card-section-actions">
                <div className="manager-search-bar">
                  <span className="search-icon">🔍</span>
                  <input
                    type="search"
                    placeholder="Filter cooking orders..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Kitchen cards grid */}
            <div className="kitchen-live-grid">
              {filteredOrders
                .filter((o) => ["New", "Preparing", "Ready"].includes(o.status))
                .length === 0 ? (
                <div className="manager-empty-box">
                  <span>♨️</span>
                  <h3>Kitchen is all caught up!</h3>
                  <p>No orders currently in the kitchen queue.</p>
                </div>
              ) : (
                filteredOrders
                  .filter((o) => ["New", "Preparing", "Ready"].includes(o.status))
                  .map((order) => (
                    <div key={order._id} className="kitchen-order-card">
                      <div className="kitchen-card-head">
                        <div>
                          <strong>#{order._id.slice(-6).toUpperCase()}</strong>
                          <span className="kitchen-table-tag">{order.tableNumber}</span>
                        </div>
                        {renderStatusBadge(order.status)}
                      </div>
                      <div className="kitchen-card-meta">
                        <small>Guest: {order.customerName || "Walk-in"}</small>
                        <small className="order-time">{order.source || "QR"}</small>
                      </div>
                      <ul className="kitchen-items-list">
                        {(order.items || []).map((it, idx) => (
                          <li key={idx}>
                            <span className="qty-tag">{it.quantity}x</span>
                            <span className="item-name">{it.name}</span>
                          </li>
                        ))}
                      </ul>
                      <div className="kitchen-card-foot">
                        <span>Total: <strong>{money(order.total)}</strong></span>
                        {renderPaymentBadge(order.payment?.status)}
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
                <h2>👥 Restaurant Staff Directory</h2>
                <p>Team members, assigned waiters and operational staff</p>
              </div>
              <div className="manager-search-bar">
                <span className="search-icon">🔍</span>
                <input
                  type="search"
                  placeholder="Search staff members..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            <div className="manager-table-responsive">
              <table className="manager-data-table">
                <thead>
                  <tr>
                    <th>Staff ID</th>
                    <th>Name</th>
                    <th>Email</th>
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
                    filteredStaff.map((s) => (
                      <tr key={s._id}>
                        <td>
                          <span className="staff-id-pill">{s.waiterId || "STF"}</span>
                        </td>
                        <td>
                          <strong>{s.name}</strong>
                        </td>
                        <td>{s.email}</td>
                        <td>{s.phone || "—"}</td>
                        <td>{renderStatusBadge(s.status || "Active")}</td>
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
                <h2>🍽️ Restaurant Menu Catalog</h2>
                <p>Available dishes, categories, pricing and stock status</p>
              </div>
              <div className="card-section-actions">
                <div className="manager-search-bar">
                  <span className="search-icon">🔍</span>
                  <input
                    type="search"
                    placeholder="Search menu dishes..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="manager-table-responsive">
              <table className="manager-data-table">
                <thead>
                  <tr>
                    <th>Item Name</th>
                    <th>Category</th>
                    <th>Price</th>
                    <th>Type</th>
                    <th>Stock Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredMenu.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="table-empty-row">
                        <span>🍽️</span> No menu items found.
                      </td>
                    </tr>
                  ) : (
                    filteredMenu.map((m) => (
                      <tr key={m._id}>
                        <td>
                          <strong>{m.name}</strong>
                        </td>
                        <td>
                          <span className="category-tag">{m.category}</span>
                        </td>
                        <td>
                          <strong className="order-total-price">{money(m.price)}</strong>
                        </td>
                        <td>
                          <span className={`diet-pill ${(m.type || "").toLowerCase() === "veg" ? "veg" : "non-veg"}`}>
                            {(m.type || "").toLowerCase() === "veg" ? "🟢 Veg" : "🔴 Non-Veg"}
                          </span>
                        </td>
                        <td>
                          <span className={`stock-tag ${m.inStock !== false ? "in-stock" : "out-of-stock"}`}>
                            {m.inStock !== false ? "✓ Available" : "✕ Out of Stock"}
                          </span>
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
                <h2>👤 Valued Guests & Customers</h2>
                <p>Order history and lifetime spend overview</p>
              </div>
              <div className="manager-search-bar">
                <span className="search-icon">🔍</span>
                <input
                  type="search"
                  placeholder="Search guests by name or phone..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            <div className="manager-table-responsive">
              <table className="manager-data-table">
                <thead>
                  <tr>
                    <th>Customer Name</th>
                    <th>Phone</th>
                    <th>Orders Placed</th>
                    <th>Total Spend</th>
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

      {/* ==========================================================
          MANAGER CREATE ORDER MODAL
      ========================================================== */}
      {showCreateOrderModal && (
        <div
          className="manager-modal-backdrop"
          onClick={() => !orderSubmitting && setShowCreateOrderModal(false)}
        >
          <div
            className="manager-order-modal"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="manager-order-modal-header">
              <div className="modal-title-group">
                <span className="modal-header-icon">📝</span>
                <div>
                  <h3>Create New Order (Manager Station)</h3>
                  <p>Place manual table order for dining guests & transmit directly to kitchen.</p>
                </div>
              </div>
              <button
                type="button"
                className="modal-close-btn manager-modal-close-circle"
                onClick={() => setShowCreateOrderModal(false)}
                disabled={orderSubmitting}
                title="Close Modal (Esc)"
                aria-label="Close"
              >
                <span className="modal-close-cross">✕</span>
              </button>
            </div>

            {/* Error banner */}
            {orderError && (
              <div className="manager-order-alert error" role="alert">
                <span>⚠️</span> {orderError}
              </div>
            )}

            {/* Occupied re-order notice */}
            {selectedTableObj && selectedTableObj.status === "Occupied" && (
              <div className="manager-order-alert info">
                <span className="order-alert-icon">🔥</span>
                <div className="order-alert-content">
                  <p>
                    <strong>{String(orderTable || "").trim().toLowerCase().startsWith("table") ? orderTable : `Table ${orderTable}`}</strong> is currently <strong>Occupied</strong>. New items will be automatically appended to the active kitchen ticket as a Re-order!
                  </p>
                  <button
                    type="button"
                    className="btn-vacate-table-quick"
                    onClick={() => handleVacateTable(selectedTableObj._id, orderTable)}
                    title="Mark this table as Available & start a fresh order"
                  >
                    🔓 Mark Table Available (Start Fresh)
                  </button>
                </div>
              </div>
            )}

            {/* Form fields: Table, Customer, Phone */}
            <div className="manager-order-top-fields">
              <div className="order-field">
                <label>Dining Table <span className="req">*</span></label>
                <select
                  value={orderTable}
                  onChange={(e) => {
                    setOrderTable(e.target.value);
                    if (orderError) setOrderError("");
                  }}
                  className={`order-select ${!orderTable && orderCart.length ? "highlight-needed" : ""}`}
                  required
                >
                  <option value="">-- Select Dining Table --</option>
                  {(tables || []).map((t) => {
                    const isAvail = t.status === "Available";
                    const isOcc = t.status === "Occupied";
                    return (
                      <option key={t._id} value={t.tableNumber}>
                        {isAvail
                          ? `🟢 ${t.tableNumber} (Available)`
                          : isOcc
                          ? `🔴 ${t.tableNumber} (Occupied - Re-order)`
                          : `⛔ ${t.tableNumber} (${t.status})`}
                      </option>
                    );
                  })}
                </select>
              </div>

              <div className="order-field">
                <label>Customer Name</label>
                <input
                  type="text"
                  placeholder="e.g. Walk-in Customer"
                  value={orderCustomerName}
                  onChange={(e) => setOrderCustomerName(e.target.value)}
                  className="order-input"
                />
              </div>

              <div className="order-field">
                <label>Customer Phone</label>
                <input
                  type="tel"
                  placeholder="e.g. 9876543210"
                  value={orderCustomerPhone}
                  onChange={(e) => setOrderCustomerPhone(e.target.value)}
                  className="order-input"
                />
              </div>
            </div>

            {/* Mobile View Segmented Tab Control */}
            <div className="mobile-order-modal-tabs">
              <button
                type="button"
                className={`mobile-tab-btn ${mobileOrderTab === "menu" ? "active" : ""}`}
                onClick={() => setMobileOrderTab("menu")}
              >
                🍽️ Dishes ({filteredOrderMenu.length})
              </button>
              <button
                type="button"
                className={`mobile-tab-btn ${mobileOrderTab === "cart" ? "active" : ""}`}
                onClick={() => setMobileOrderTab("cart")}
              >
                🛒 Cart {cartTotalQty > 0 ? `(${cartTotalQty})` : ""} {cartTotalQty > 0 ? `· ${money(cartGrandTotal)}` : ""}
              </button>
            </div>

            {/* Modal Body: Left Menu Browser, Right Order Cart */}
            <div className="manager-order-body-grid">
              {/* Left: Menu Browser */}
              <div className={`manager-order-menu-pane ${mobileOrderTab === "menu" ? "mobile-active" : "mobile-hidden"}`}>
                {/* Search & Diet Filter Bar */}
                <div className="manager-order-controls-bar">
                  <div className="order-search-box">
                    <span>🔍</span>
                    <input
                      type="text"
                      placeholder="Search items, drinks, pizza, rice…"
                      value={orderSearch}
                      onChange={(e) => setOrderSearch(e.target.value)}
                    />
                    {orderSearch && (
                      <button type="button" onClick={() => setOrderSearch("")}>✕</button>
                    )}
                  </div>

                  <div className="order-filter-toggles">
                    {/* Diet Toggle */}
                    <div className="diet-toggle-group">
                      {[
                        { id: "All", label: "🍽️ All", count: activeMenu.length },
                        { id: "Veg", label: "🟢 Veg", count: activeMenu.filter((i) => !isNonVegItem(i)).length },
                        { id: "Non-Veg", label: "🔴 Non-Veg", count: activeMenu.filter((i) => isNonVegItem(i)).length },
                      ].map((d) => (
                        <button
                          key={d.id}
                          type="button"
                          className={`diet-btn ${orderDietFilter === d.id ? "active" : ""}`}
                          onClick={() => setOrderDietFilter(d.id)}
                        >
                          {d.label} <span style={{ opacity: 0.75, fontSize: "0.7rem", marginLeft: "2px" }}>({d.count})</span>
                        </button>
                      ))}
                    </div>

                    {/* View Mode Toggle */}
                    <div className="view-mode-group" title="Switch View Mode">
                      <button
                        type="button"
                        className={`view-btn ${orderViewMode === "grid" ? "active" : ""}`}
                        onClick={() => setOrderViewMode("grid")}
                        title="Card Grid View"
                        aria-label="Grid Cards"
                      >
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="3" y="3" width="7" height="7"></rect>
                          <rect x="14" y="3" width="7" height="7"></rect>
                          <rect x="14" y="14" width="7" height="7"></rect>
                          <rect x="3" y="14" width="7" height="7"></rect>
                        </svg>
                      </button>
                      <button
                        type="button"
                        className={`view-btn ${orderViewMode === "list" ? "active" : ""}`}
                        onClick={() => setOrderViewMode("list")}
                        title="Compact List View"
                        aria-label="List View"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                          <line x1="3" y1="6" x2="21" y2="6"></line>
                          <line x1="3" y1="12" x2="21" y2="12"></line>
                          <line x1="3" y1="18" x2="21" y2="18"></line>
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Category Pills */}
                <div className="manager-order-categories-scroll">
                  {menuCategories.map((cat) => {
                    const count =
                      cat === "All"
                        ? activeMenu.length
                        : activeMenu.filter((i) => i.category === cat).length;
                    return (
                      <button
                        key={cat}
                        type="button"
                        className={`order-cat-pill ${orderCategory === cat ? "active" : ""}`}
                        onClick={() => setOrderCategory(cat)}
                      >
                        <span>{cat}</span>
                        <span className="order-cat-count">{count}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Menu items container */}
                <div className={`manager-order-items-container ${orderViewMode}`}>
                  {filteredOrderMenu.length === 0 ? (
                    <div className="modal-empty-menu">
                      <span>🍽️</span>
                      <h4>No menu dishes found</h4>
                      <p>Try searching for a different item or category.</p>
                    </div>
                  ) : orderViewMode === "grid" ? (
                    filteredOrderMenu.map((item) => {
                      const inCart = orderCart.find((it) => it._id === item._id);
                      const isNonVeg = isNonVegItem(item);
                      const isVeg = !isNonVeg;
                      const imgUrl = getMenuImage(item);
                      return (
                        <div
                          key={item._id}
                          className={`manager-food-card ${inCart ? "is-selected" : ""}`}
                          onClick={() => {
                            if (!inCart) handleAddCartItem(item);
                          }}
                        >
                          <div className="manager-food-thumb">
                            {imgUrl ? (
                              <img
                                src={imgUrl}
                                alt={item.name}
                                onError={(e) => {
                                  e.currentTarget.style.display = "none";
                                  const fb = e.currentTarget.parentElement?.querySelector(".food-thumb-fallback");
                                  if (fb) fb.style.display = "flex";
                                }}
                              />
                            ) : null}
                            <div
                              className="food-thumb-fallback"
                              style={{
                                display: imgUrl ? "none" : "flex",
                                background: isVeg ? "#f0fdf4" : "#fef2f2",
                              }}
                            >
                              {isVeg ? "🥗" : "🍗"}
                            </div>
                            <span className={`manager-food-badge ${isVeg ? "veg" : "non-veg"}`}>
                              {isVeg ? "🟢 Veg" : "🔴 Non-Veg"}
                            </span>
                          </div>

                          <div className="manager-food-info">
                            <div>
                              <h4 className="manager-food-name" title={item.name}>
                                {item.name}
                              </h4>
                              <p className="manager-food-desc" title={item.description || item.category}>
                                {item.description || `${item.category || "Fresh"} · Freshly prepared`}
                              </p>
                            </div>
                            <div className="manager-food-footer">
                              <span className="manager-food-price">
                                {money(item.price)}
                              </span>
                              {inCart ? (
                                <div
                                  className="manager-food-stepper"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <button
                                    type="button"
                                    onClick={() => handleUpdateCartQty(item._id, inCart.quantity - 1)}
                                    title="Decrease quantity"
                                  >
                                    −
                                  </button>
                                  <span>{inCart.quantity}</span>
                                  <button
                                    type="button"
                                    onClick={() => handleUpdateCartQty(item._id, inCart.quantity + 1)}
                                    title="Increase quantity"
                                  >
                                    +
                                  </button>
                                </div>
                              ) : (
                                <button
                                  type="button"
                                  className="manager-food-add-btn"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleAddCartItem(item);
                                  }}
                                >
                                  ➕ Add
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    filteredOrderMenu.map((item) => {
                      const inCart = orderCart.find((it) => it._id === item._id);
                      const isNonVeg = isNonVegItem(item);
                      const isVeg = !isNonVeg;
                      const imgUrl = getMenuImage(item);
                      return (
                        <div
                          key={item._id}
                          className={`manager-food-list-row ${inCart ? "is-selected" : ""}`}
                          onClick={() => {
                            if (!inCart) handleAddCartItem(item);
                          }}
                        >
                          <div className="manager-food-list-thumb">
                            {imgUrl ? (
                              <img
                                src={imgUrl}
                                alt={item.name}
                                onError={(e) => {
                                  e.currentTarget.style.display = "none";
                                  const fb = e.currentTarget.parentElement?.querySelector(".food-thumb-fallback");
                                  if (fb) fb.style.display = "flex";
                                }}
                              />
                            ) : null}
                            <div
                              className="food-thumb-fallback"
                              style={{
                                display: imgUrl ? "none" : "flex",
                                background: isVeg ? "#f0fdf4" : "#fef2f2",
                              }}
                            >
                              {isVeg ? "🥗" : "🍗"}
                            </div>
                          </div>
                          <div className="manager-food-list-info">
                            <div className="list-title-row">
                              <span className={`manager-food-badge ${isVeg ? "veg" : "non-veg"}`}>
                                {isVeg ? "🟢 Veg" : "🔴 Non-Veg"}
                              </span>
                              <strong className="list-food-name">{item.name}</strong>
                              <span className="list-cat-tag">{item.category}</span>
                            </div>
                            <small className="list-food-desc">{item.description || "Freshly prepared"}</small>
                          </div>
                          <div
                            className="manager-food-list-action"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <span className="manager-food-price">
                              {money(item.price)}
                            </span>
                            {inCart ? (
                              <div className="manager-food-stepper">
                                <button
                                  type="button"
                                  onClick={() => handleUpdateCartQty(item._id, inCart.quantity - 1)}
                                  title="Decrease quantity"
                                >
                                  −
                                </button>
                                <span>{inCart.quantity}</span>
                                <button
                                  type="button"
                                  onClick={() => handleUpdateCartQty(item._id, inCart.quantity + 1)}
                                  title="Increase quantity"
                                >
                                  +
                                </button>
                              </div>
                            ) : (
                              <button
                                type="button"
                                className="manager-food-add-btn"
                                onClick={() => handleAddCartItem(item)}
                              >
                                ➕ Add
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Floating Bottom Cart Bar on Mobile when items exist */}
                {cartTotalQty > 0 && (
                  <div
                    className="mobile-floating-cart-bar"
                    onClick={() => setMobileOrderTab("cart")}
                  >
                    <div className="floating-cart-info">
                      <span className="floating-cart-count">{cartTotalQty}</span>
                      <div className="floating-cart-totals">
                        <strong>{money(cartGrandTotal)}</strong>
                        <small>{cartTotalQty} item{cartTotalQty > 1 ? "s" : ""} in cart</small>
                      </div>
                    </div>
                    <span className="floating-cart-cta">View Cart & Order ➔</span>
                  </div>
                )}
              </div>

              {/* Right: Sticky Order Cart */}
              <div className={`manager-order-cart-pane ${mobileOrderTab === "cart" ? "mobile-active" : "mobile-hidden"}`}>
                <button
                  type="button"
                  className="mobile-back-to-menu-btn"
                  onClick={() => setMobileOrderTab("menu")}
                >
                  ‹ Back to Browse Dishes
                </button>
                <div className="cart-pane-header">
                  <h4>
                    <span>🛒</span> {activeTableOrder ? "Table Order & Cart" : "Order Cart"}
                  </h4>
                  <span className="cart-badge">
                    {activeTableOrder
                      ? `${activeTableOrder.items?.length || 0} placed ${cartTotalQty > 0 ? `(+${cartTotalQty} new)` : ""}`
                      : `${cartTotalQty} item${cartTotalQty === 1 ? "" : "s"}`}
                  </span>
                </div>

                <div className="cart-items-scroll">
                  {/* 1. RUNNING ORDER SECTION (If table already has an active ticket) */}
                  {activeTableOrder && (
                    <div className="running-order-section">
                      <div className="running-order-header">
                        <div className="running-order-title">
                          <span className="running-icon">📋</span>
                          <div>
                            <strong>Running Order · {orderTable}</strong>
                            <small>
                              Order #{activeTableOrder._id?.slice(-6)?.toUpperCase()} · {activeTableOrder.status || "In Kitchen"}
                            </small>
                          </div>
                        </div>
                        <span className="running-badge-pill">Already Placed</span>
                      </div>

                      <div className="running-items-list">
                        {(activeTableOrder.items && activeTableOrder.items.length > 0) ? (
                          activeTableOrder.items.map((item, idx) => (
                            <div className="running-item-row" key={`running-${item._id || idx}`}>
                              <div className="running-item-details">
                                <span className="running-item-name">{item.name}</span>
                                <span className="running-item-price">
                                  {money(item.price)} × {item.quantity}
                                </span>
                              </div>
                              <div className="running-item-right">
                                <strong className="running-item-total">
                                  {money((item.price || 0) * (item.quantity || 1))}
                                </strong>
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
                        <strong>{money(existingRunningTotal)}</strong>
                      </div>
                    </div>
                  )}

                  {/* 2. RE-ORDER / NEW ITEMS SECTION */}
                  <div className="new-order-section">
                    {activeTableOrder && (
                      <div className="new-order-section-header">
                        <span>🛒 New Items to Add (Re-Order)</span>
                        {orderCart.length > 0 && (
                          <span className="new-items-count-pill">+{cartTotalQty} items</span>
                        )}
                      </div>
                    )}

                    {orderCart.length === 0 ? (
                      activeTableOrder ? (
                        <div className="running-reorder-hint">
                          <span>➕</span>
                          <span>Tap any menu item to add it to this table's re-order.</span>
                        </div>
                      ) : (
                        <div className="cart-empty-placeholder">
                          <span className="empty-cart-icon">🛒</span>
                          <p>Your order cart is empty.</p>
                          <small>Click ➕ Add on any dish to build this dining ticket.</small>
                        </div>
                      )
                    ) : (
                      orderCart.map((item) => (
                        <div key={item._id} className="manager-cart-row">
                          <div className="cart-row-details">
                            <strong>{item.name}</strong>
                            <small>{money(item.price)} each</small>
                          </div>
                          <div className="cart-row-actions">
                            <div className="cart-qty-stepper">
                              <button
                                type="button"
                                onClick={() => handleUpdateCartQty(item._id, item.quantity - 1)}
                                title="Decrease"
                              >
                                −
                              </button>
                              <span>{item.quantity}</span>
                              <button
                                type="button"
                                onClick={() => handleUpdateCartQty(item._id, item.quantity + 1)}
                                title="Increase"
                              >
                                +
                              </button>
                            </div>
                            <span className="cart-row-total">{money(item.price * item.quantity)}</span>
                            <button
                              type="button"
                              className="btn-remove-row"
                              onClick={() => handleRemoveCartItem(item._id)}
                              title="Remove item"
                            >
                              🗑️
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Cart Bill Summary */}
                <div className="cart-billing-box">
                  {activeTableOrder ? (
                    <>
                      <div className="bill-line">
                        <span>Current Order (Running):</span>
                        <strong>{money(existingRunningTotal)}</strong>
                      </div>
                      {orderCart.length > 0 && (
                        <div className="bill-line" style={{ color: "#2563eb" }}>
                          <span>+ New Re-Order Items:</span>
                          <strong>{money(cartGrandTotal)}</strong>
                        </div>
                      )}
                      <div className="bill-line total">
                        <span>{orderCart.length > 0 ? "Combined Total Amount:" : "Running Total Amount:"}</span>
                        <strong style={{ color: "#2563eb" }}>
                          {money(existingRunningTotal + (orderCart.length ? cartGrandTotal : 0))}
                        </strong>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="bill-line">
                        <span>Subtotal:</span>
                        <strong>{money(cartSubtotal)}</strong>
                      </div>
                      <div className="bill-line">
                        <span>GST (5%):</span>
                        <strong>{money(cartTax)}</strong>
                      </div>
                      <div className="bill-line total">
                        <span>Grand Total:</span>
                        <strong>{money(cartGrandTotal)}</strong>
                      </div>
                    </>
                  )}

                  <div className="cart-footer-buttons">
                    <button
                      type="button"
                      className="btn-clear-cart"
                      onClick={() => setOrderCart([])}
                      disabled={!orderCart.length || orderSubmitting}
                    >
                      Clear
                    </button>
                    <button
                      type="button"
                      className="btn-submit-order"
                      onClick={handleSubmitOrder}
                      disabled={!orderCart.length || !orderTable || orderSubmitting}
                    >
                      {orderSubmitting
                        ? "Transmitting to Kitchen..."
                        : activeTableOrder
                        ? orderCart.length > 0
                          ? `🚀 Place Re-Order & Send to Kitchen (+${cartTotalQty} items)`
                          : `📋 Re-order for ${orderTable}`
                        : orderCart.length > 0
                        ? `🚀 Send to Kitchen (${money(cartGrandTotal)})`
                        : "🚀 Send to Kitchen"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==========================================================
          ORDER SUCCESS CELEBRATION MODAL WITH RE-ORDER OPTIONS
      ========================================================== */}
      {orderSuccessModal && (
        <div
          className="manager-modal-backdrop"
          onClick={() => {
            setOrderSuccessModal(null);
            setShowCreateOrderModal(false);
          }}
        >
          <div
            className="manager-success-dialog"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="success-icon-badge-box">
              <span className="chef-avatar">👨‍🍳</span>
              <span className="success-check-bubble">✓</span>
            </div>
            <h3 className="manager-success-title">
              {orderSuccessModal.isReorder
                ? "Sent to Kitchen Successfully!"
                : "Sent to Kitchen Successfully!"}
            </h3>
            <p className="manager-success-desc">
              Order <strong>#{orderSuccessModal.orderId}</strong> for{" "}
              <strong>{orderSuccessModal.tableNumber}</strong> has been transmitted to the kitchen.
            </p>
            <div className="success-summary-card">
              <div className="summary-line">
                <span>Table:</span>
                <strong>{orderSuccessModal.tableNumber}</strong>
              </div>
              <div className="summary-line">
                <span>Customer:</span>
                <strong>{orderSuccessModal.customerName}</strong>
              </div>
              <div className="summary-line">
                <span>Total Items:</span>
                <strong>{orderSuccessModal.itemCount} items</strong>
              </div>
              <div className="summary-line row-amount">
                <span>Total Amount:</span>
                <strong className="grand-price">{money(orderSuccessModal.totalAmount)}</strong>
              </div>
            </div>

            <div className="success-modal-actions-list">
              <button
                type="button"
                className="btn-success-reorder"
                onClick={() => {
                  const currentTable = orderSuccessModal.tableNumber;
                  const currentCust = orderSuccessModal.customerName;
                  const currentPhone = orderSuccessModal.customerPhone;
                  setOrderSuccessModal(null);
                  setOrderCart([]);
                  setOrderTable(currentTable);
                  setOrderCustomerName(currentCust);
                  setOrderCustomerPhone(currentPhone);
                  setOrderError("");
                }}
              >
                ＋ Create Another Order for {orderSuccessModal.tableNumber}
              </button>
              <button
                type="button"
                className="btn-success-new-table"
                onClick={() => {
                  setOrderSuccessModal(null);
                  setOrderCart([]);
                  setOrderTable("");
                  setOrderCustomerName("");
                  setOrderCustomerPhone("");
                  setOrderError("");
                }}
              >
                🪑 Order for Different Table
              </button>
              <button
                type="button"
                className="btn-success-dashboard"
                onClick={() => {
                  setOrderSuccessModal(null);
                  setShowCreateOrderModal(false);
                  setOrderCart([]);
                  setOrderTable("");
                  setOrderCustomerName("");
                  setOrderCustomerPhone("");
                }}
              >
                🏠 Go to Dashboard
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Day-Wise Sales Modal */}
      {showSalesModal && (
        <div className="manager-modal-backdrop" onClick={() => setShowSalesModal(false)}>
          <div className="manager-modal-card sales-report-modal" onClick={(e) => e.stopPropagation()}>
            <div className="manager-modal-header">
              <div className="modal-title-group">
                <h3>💰 Day-Wise Sales & Revenue Summary</h3>
                <p>Date-by-date revenue, collected payments, and active table balances</p>
              </div>
              <button
                type="button"
                className="modal-close-icon-btn"
                onClick={() => setShowSalesModal(false)}
              >
                ✕
              </button>
            </div>

            {/* Quick Summary Cards */}
            <div className="sales-modal-stats-grid">
              <div className="sales-stat-box box-total">
                <span>Today's Total Sales</span>
                <strong>{money(stats?.todaySales)}</strong>
                <small>{stats?.todayOrders || 0} Orders today</small>
              </div>
              <div className="sales-stat-box box-paid">
                <span>Paid Revenue</span>
                <strong>{money(stats?.todayPaidSales)}</strong>
                <small>Settled & completed</small>
              </div>
              <div className="sales-stat-box box-pending">
                <span>Pending Collections</span>
                <strong>{money(stats?.todayPendingSales)}</strong>
                <small>Active dining tables</small>
              </div>
              <div className="sales-stat-box box-alltime">
                <span>All-Time Tracked</span>
                <strong>{money(dailySales.reduce((s, d) => s + (d.totalSales || 0), 0))}</strong>
                <small>{dailySales.reduce((s, d) => s + (d.orderCount || 0), 0)} Total orders</small>
              </div>
            </div>

            {/* Daily Table in Modal */}
            <div className="daily-sales-table-wrapper modal-table">
              <table className="manager-data-table daily-sales-table">
                <thead>
                  <tr>
                    <th>DATE</th>
                    <th>ORDERS</th>
                    <th>TOTAL SALES</th>
                    <th>PAID</th>
                    <th>PENDING</th>
                    <th>STATUS</th>
                  </tr>
                </thead>
                <tbody>
                  {dailySales.map((day) => {
                    const isToday = day.date === new Date().toISOString().slice(0, 10);
                    const isSettled = day.pendingSales <= 0;
                    return (
                      <tr key={day.date} className={isToday ? "today-sales-highlight-row" : ""}>
                        <td>
                          <strong>{isToday ? "⚡ Today · " : ""}{day.date}</strong>
                        </td>
                        <td>{day.orderCount} Orders</td>
                        <td><strong style={{ color: "#0f172a" }}>{money(day.totalSales)}</strong></td>
                        <td style={{ color: "#16a34a", fontWeight: "700" }}>{money(day.paidSales)}</td>
                        <td style={{ color: day.pendingSales > 0 ? "#dc2626" : "#64748b", fontWeight: "700" }}>
                          {money(day.pendingSales)}
                        </td>
                        <td>
                          <span className={`settle-badge ${isSettled ? "is-settled" : "is-running"}`}>
                            {isSettled ? "✓ Settled" : "⏳ Active"}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="manager-modal-footer">
              <button
                type="button"
                className="btn-modal-close"
                onClick={() => setShowSalesModal(false)}
              >
                Close Report
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ManagerDashboard;
