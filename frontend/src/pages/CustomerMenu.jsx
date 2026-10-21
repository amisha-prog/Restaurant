import React, { useContext, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import QRCode from "qrcode";
import { CartContext } from "../context/CartContext";
import { getFallbackMenuImage, getMenuImageUrl } from "../utils/menuImage";
import "./CustomerMenu.css";

import { API_URL } from "../config/api";

const categoryIcons = {
  All: "✨",
  Starters: "🍢",
  "Main Course": "🍛",
  Veg: "🥗",
  "Non-Veg": "🍗",
  "Biryani & Rice": "🍚",
  "Indian Breads": "🫓",
  Pizza: "🍕",
  Burgers: "🍔",
  Chinese: "🥢",
  Snacks: "🍟",
  Beverages: "🥤",
  Desserts: "🍨",
  Combo: "🍱",
};

const heroCarouselSlides = [
  {
    id: "biryani",
    name: "Royal Chicken Biryani",
    desc: "Fragrant basmati rice layered with spiced tender chicken",
    badge: "🔥 Chef's Recommendation",
    tag: "Bestseller",
    price: "₹360.00",
    image: "https://images.unsplash.com/photo-1589302168068-964664d93dc0?auto=format&fit=crop&w=700&q=85",
  },
  {
    id: "pizza",
    name: "Cheese Burst Pizza",
    desc: "Extra cheesy pizza with delicious molten cheese burst crust",
    badge: "🍕 Fresh From Oven",
    tag: "Most Loved",
    price: "₹399.00",
    image: "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=700&q=85",
  },
  {
    id: "paneer-tikka",
    name: "Paneer Tikka Platter",
    desc: "Char-grilled cottage cheese cubes with aromatic spices & mint dip",
    badge: "✨ Tandoor Special",
    tag: "Chef's Choice",
    price: "₹289.00",
    image: "https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?auto=format&fit=crop&w=700&q=85",
  },
  {
    id: "burger",
    name: "Crispy Double Burger",
    desc: "Double patties with fresh lettuce, cheddar & house secret sauce",
    badge: "🍔 Gourmet Bites",
    tag: "Trending",
    price: "₹179.00",
    image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=700&q=85",
  },
  {
    id: "noodles",
    name: "Wok Hakka Noodles",
    desc: "Stir-fried noodles with crunchy fresh vegetables & zesty sauces",
    badge: "🥢 Wok Tossed",
    tag: "Guest Favorite",
    price: "₹190.00",
    image: "https://images.unsplash.com/photo-1585032226651-759b368d7246?auto=format&fit=crop&w=700&q=85",
  },
];

function CustomerMenu() {
  const navigate = useNavigate();
  const location = useLocation();
  const { cartItems: cart, addToCart, removeFromCart, updateQuantity } = useContext(CartContext);

  const [customerUser, setCustomerUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("customerUser") || "null");
    } catch {
      return null;
    }
  });

  const [menuItems, setMenuItems] = useState([]);
  const [modifierItem, setModifierItem] = useState(null);
  const [selectedCustomizations, setSelectedCustomizations] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [dietaryFilter, setDietaryFilter] = useState("all"); // "all" | "veg" | "non-veg"
  const [currentHeroSlide, setCurrentHeroSlide] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [tableContext, setTableContext] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("tableOrderContext") || "null");
    } catch {
      return null;
    }
  });
  const [serviceMessage, setServiceMessage] = useState("");
  const [tableStatus, setTableStatus] = useState("Available");
  const [showOccupiedModal, setShowOccupiedModal] = useState(true);
  const [restaurantTables, setRestaurantTables] = useState([]);
  const [showTableModal, setShowTableModal] = useState(false);
  const [customTableInput, setCustomTableInput] = useState("");

  const displayTableLabel = useMemo(() => {
    const raw = tableContext?.tableNumber || "";
    if (!raw) return "";
    const trimmed = String(raw).trim();
    return trimmed.toLowerCase().startsWith("table") ? trimmed : `Table ${trimmed}`;
  }, [tableContext]);

  // =====================================================
  // REAL-TIME TABLE STATUS CHECKING & POLLING
  // =====================================================
  useEffect(() => {
    const fetchTableStatus = async () => {
      const restId = tableContext?.restaurantId || "REST012";
      const tNum = tableContext?.tableNumber;

      try {
        const res = await fetch(`${API_URL}/tables?restaurantId=${encodeURIComponent(restId)}`);
        const data = await res.json();
        if (res.ok && data.success && Array.isArray(data.tables)) {
          setRestaurantTables(data.tables);
          if (tNum) {
            const cleanTNum = String(tNum).trim().toLowerCase().replace(/^table\s*/i, "");
            const match = data.tables.find((t) => {
              const cleanT = String(t.tableNumber || "").trim().toLowerCase().replace(/^table\s*/i, "");
              return cleanT === cleanTNum || String(t.tableNumber).trim().toLowerCase() === String(tNum).trim().toLowerCase();
            });
            if (match && match.status) {
              setTableStatus(match.status);
            } else {
              setTableStatus("Available");
            }
          }
        }
      } catch (err) {
        console.warn("Could not check table status:", err);
      }
    };

    fetchTableStatus();
    const interval = setInterval(fetchTableStatus, 4000);
    return () => clearInterval(interval);
  }, [tableContext]);

  // =====================================================
  // LOAD MENU + CART
  // =====================================================
  useEffect(() => {
    fetchMenu();
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tableParam = params.get("table") || params.get("tableNumber") || params.get("table_number") || params.get("t");
    const restParam = params.get("restaurant") || params.get("restaurantId") || params.get("restId");

    if (tableParam) {
      const nextTableContext = {
        tableNumber: tableParam,
        restaurantId: restParam || tableContext?.restaurantId || "REST012",
      };
      localStorage.setItem("tableOrderContext", JSON.stringify(nextTableContext));
      setTableContext(nextTableContext);
      setShowOccupiedModal(true);
    } else if (restParam && (!tableContext || !tableContext.restaurantId)) {
      const nextTableContext = {
        tableNumber: tableContext?.tableNumber || "",
        restaurantId: restParam,
      };
      localStorage.setItem("tableOrderContext", JSON.stringify(nextTableContext));
      setTableContext(nextTableContext);
    }
  }, [location.search]);

  const [selectedTableQr, setSelectedTableQr] = useState(null);

  const handleSelectTable = (selectedNum) => {
    const raw = String(selectedNum).trim();
    if (!raw) return;
    const formatted = raw.toLowerCase().startsWith("table") ? raw : `Table ${raw}`;
    const nextTableContext = {
      tableNumber: formatted,
      restaurantId: tableContext?.restaurantId || "REST012",
    };
    localStorage.setItem("tableOrderContext", JSON.stringify(nextTableContext));
    setTableContext(nextTableContext);
    setShowTableModal(false);
    setShowOccupiedModal(true);
  };

  const handleOpenTableQr = async (tableNumber) => {
    const raw = String(tableNumber).trim();
    if (!raw) return;
    const formatted = raw.toLowerCase().startsWith("table") ? raw : `Table ${raw}`;
    const origin = window.location.origin;
    const restId = tableContext?.restaurantId || "REST012";
    const params = new URLSearchParams({
      restaurant: restId,
      table: formatted,
    });
    const targetUrl = `${origin}/customer/menu?${params.toString()}`;

    try {
      const qrDataUrl = await QRCode.toDataURL(targetUrl, {
        width: 320,
        margin: 2,
        errorCorrectionLevel: "H",
        color: { dark: "#0f172a", light: "#ffffff" },
      });
      setSelectedTableQr({
        tableNumber: formatted,
        qrDataUrl,
        menuUrl: targetUrl,
      });
      setShowTableModal(false);
    } catch (err) {
      console.error("QR Code Error:", err);
      handleSelectTable(formatted);
    }
  };

  // =====================================================
  // AUTO-PLAY HERO CAROUSEL (PAUSES ON HOVER)
  // =====================================================
  useEffect(() => {
    if (isHovered) return;
    const timer = setInterval(() => {
      setCurrentHeroSlide((prev) => (prev + 1) % heroCarouselSlides.length);
    }, 3800);
    return () => clearInterval(timer);
  }, [isHovered]);

  const prevHeroSlide = (e) => {
    if (e) e.stopPropagation();
    setCurrentHeroSlide((prev) => (prev - 1 + heroCarouselSlides.length) % heroCarouselSlides.length);
  };

  const nextHeroSlide = (e) => {
    if (e) e.stopPropagation();
    setCurrentHeroSlide((prev) => (prev + 1) % heroCarouselSlides.length);
  };

  // =====================================================
  // FETCH MENU FROM BACKEND
  // =====================================================
  const fetchMenu = async () => {
    try {
      setLoading(true);
      setError("");

      const params = new URLSearchParams(window.location.search);
      const restId = params.get("restaurant") || tableContext?.restaurantId || "";
      const url = restId ? `${API_URL}/menu?restaurantId=${encodeURIComponent(restId)}` : `${API_URL}/menu`;

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`Menu API Error: ${response.status}`);
      }

      const data = await response.json();

      let items = [];
      if (Array.isArray(data)) {
        items = data;
      } else if (Array.isArray(data.data)) {
        items = data.data;
      } else if (Array.isArray(data.menuItems)) {
        items = data.menuItems;
      } else if (Array.isArray(data.items)) {
        items = data.items;
      } else if (Array.isArray(data.menu)) {
        items = data.menu;
      }

      setMenuItems(items);
    } catch (err) {
      console.error("Menu Error:", err);
      setError("Menu load nahi ho pa raha. Please backend server check karein.");
      setMenuItems([]);
    } finally {
      setLoading(false);
    }
  };

  const openModifierPopup = (item) => {
    setModifierItem(item);
    setSelectedCustomizations(
      Object.fromEntries(
        (item.customization || []).map((group) => [group.name, group.options?.[0]?.name || ""])
      )
    );
  };

  const selectCustomization = (groupName, optionName) => {
    setSelectedCustomizations((current) => ({ ...current, [groupName]: optionName }));
  };

  const addConfiguredItemToCart = () => {
    if (!modifierItem) return;
    const selectedModifiers = (modifierItem.customization || []).flatMap((group) => {
      const option = group.options?.find((currentOption) => currentOption.name === selectedCustomizations[group.name]);
      return option ? [{ name: `${group.name}: ${option.name}`, priceAdjustment: Number(option.price) || 0 }] : [];
    });
    const modifierTotal = selectedModifiers.reduce((total, modifier) => total + modifier.priceAdjustment, 0);
    const modifierKey = selectedModifiers.map((modifier) => modifier.name).join("-") || "plain";
    addToCart({
      ...modifierItem,
      price: Number(modifierItem.price || 0) + modifierTotal,
      basePrice: Number(modifierItem.price || 0),
      selectedModifiers,
      cartKey: `${modifierItem._id}-${modifierKey}`,
    });
    setModifierItem(null);
  };

  // =====================================================
  // CART METRICS
  // =====================================================
  const cartCount = cart.reduce(
    (total, item) => total + (Number(item.quantity) || 0),
    0
  );

  const cartTotal = cart.reduce(
    (sum, item) => sum + (Number(item.price) || 0) * (Number(item.quantity) || 1),
    0
  );

  // =====================================================
  // CATEGORIES
  // =====================================================
  // Sort categories: Veg categories first, then Non-Veg categories
  const categories = useMemo(() => {
    const allCats = [...new Set(menuItems.map((item) => item.category).filter(Boolean))];

    // Determine if a category is primarily non-veg
    const isNonVegCategory = (cat) => {
      const c = String(cat).toLowerCase();
      return c.includes("non-veg") || c.includes("non veg") || c.includes("nonveg") || c.includes("chicken") || c.includes("mutton") || c.includes("fish") || c.includes("prawn") || c.includes("seafood") || c.includes("meat");
    };

    const vegCats = allCats.filter((cat) => !isNonVegCategory(cat));
    const nonVegCats = allCats.filter((cat) => isNonVegCategory(cat));

    return ["All", ...vegCats, ...nonVegCats];
  }, [menuItems]);

  // =====================================================
  // HELPER: DETECT NON-VEG
  // =====================================================
  const isNonVegItem = (item) => {
    const t = String(item.type || "").toLowerCase().trim();
    const c = String(item.category || "").toLowerCase().trim();
    if (t === "non-veg" || t === "nonveg") return true;
    if (t === "veg") return false;
    if (c.includes("non-veg") || c.includes("non veg")) return true;
    return false;
  };

  // =====================================================
  // FILTER & SORT MENU (VEG FIRST, THEN NON-VEG)
  // =====================================================
  const filteredItems = useMemo(() => {
    const list = menuItems.filter((item) => {
      const matchesCategory = category === "All" || item.category === category;
      
      const isNonVeg = isNonVegItem(item);
      const isVeg = !isNonVeg;

      const matchesDietary =
        dietaryFilter === "all"
          ? true
          : dietaryFilter === "veg"
          ? isVeg
          : isNonVeg;

      const searchText = search.trim().toLowerCase();

      const matchesSearch =
        !searchText ||
        item.name?.toLowerCase().includes(searchText) ||
        item.category?.toLowerCase().includes(searchText) ||
        item.description?.toLowerCase().includes(searchText);

      return matchesCategory && matchesSearch && matchesDietary;
    });

    // Pure Veg items first (0), Non-Veg items after (1)
    return [...list].sort((a, b) => {
      const aNonVeg = isNonVegItem(a) ? 1 : 0;
      const bNonVeg = isNonVegItem(b) ? 1 : 0;
      if (aNonVeg !== bNonVeg) {
        return aNonVeg - bNonVeg;
      }
      return 0;
    });
  }, [menuItems, category, dietaryFilter, search]);

  const openCart = () => {
    navigate("/customer/cart");
  };

  const requestService = async (kind) => {
    if (!tableContext?.restaurantId || !tableContext?.tableNumber) {
      return setServiceMessage("Please open the menu using your table QR code.");
    }
    try {
      const endpoint = kind === "bill" ? "bill-request" : "customer-request";
      const response = await fetch(`${API_URL}/orders/${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          restaurantId: tableContext.restaurantId,
          tableNumber: tableContext.tableNumber,
          message: "Customer needs assistance.",
        }),
      });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.message || "Unable to send request.");
      setServiceMessage(kind === "bill" ? "Bill request sent to your waiter." : "Waiter has been notified.");
    } catch (requestError) {
      setServiceMessage(requestError.message || "Unable to send request.");
    }
  };

  const openLogin = () => {
    navigate("/login");
  };

  const logoutCustomer = () => {
    localStorage.removeItem("customerUser");
    localStorage.removeItem("authUser");
    localStorage.removeItem("authToken");
    setCustomerUser(null);
  };

  return (
    <div className="customer-menu-page">
      {/* =================================================
          HEADER
      ================================================= */}
      <header className="customer-header">
        <div className="customer-logo" onClick={() => navigate("/customer/menu")} style={{ cursor: "pointer" }}>
          <div className="logo-icon">🍴</div>
          <div>
            <h2>FoodVista</h2>
            <span className="logo-tagline">Gourmet Dining & Bites</span>
          </div>
        </div>

        <div className="header-actions">
          {displayTableLabel ? (
            <button
              type="button"
              className="header-table-badge"
              onClick={() => setShowTableModal(true)}
              title="Click to switch your dining table"
              style={{ cursor: "pointer", border: "none", background: "none" }}
            >
              <span className="table-live-dot" />
              <span><strong>{displayTableLabel}</strong></span>
              <span style={{ fontSize: "10px", marginLeft: "4px", color: "#16a34a" }}>▼</span>
            </button>
          ) : (
            <button
              type="button"
              className="header-table-badge"
              onClick={() => setShowTableModal(true)}
              title="Click to select dining table"
              style={{ cursor: "pointer", border: "none", background: "none" }}
            >
              <span className="table-live-dot" />
              <span><strong>Select Table</strong></span>
              <span style={{ fontSize: "10px", marginLeft: "4px", color: "#16a34a" }}>▼</span>
            </button>
          )}

          {customerUser ? (
            <div className="customer-account">
              <span className="user-greeting">Hi, {customerUser.name?.replace("FoodVista ", "") || "Customer"}</span>
              <button className="login-btn logout" onClick={logoutCustomer}>Logout</button>
            </div>
          ) : (
            <button className="login-btn" onClick={openLogin}>Login</button>
          )}
        </div>
      </header>

      {/* =================================================
          OCCUPIED TABLE MODAL POPUP & ALERT BANNER
      ================================================= */}
      {tableStatus === "Occupied" && showOccupiedModal && (
        <div className="occupied-modal-overlay">
          <div className="occupied-modal-card">
            <div className="occupied-modal-badge">🔴</div>
            <h2>This Table is Currently Occupied</h2>
            <p>
              <strong>{displayTableLabel || "This table"}</strong> is currently marked as <strong>Occupied</strong> by restaurant staff.
              <br /><br />
              If you are already seated here, enjoy your meal! If you are a new guest, you can easily choose another table or call staff for assistance.
            </p>
            <div className="occupied-modal-actions">
              <button
                type="button"
                className="btn-occupied-switch"
                onClick={() => {
                  setShowOccupiedModal(false);
                  setShowTableModal(true);
                }}
                style={{
                  padding: "12px 20px",
                  background: "#0f172a",
                  color: "#ffffff",
                  fontSize: "14px",
                  fontWeight: "700",
                  border: "none",
                  borderRadius: "12px",
                  cursor: "pointer",
                  boxShadow: "0 4px 12px rgba(15, 23, 42, 0.2)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px"
                }}
              >
                🔄 Choose Another Table
              </button>
              <button
                type="button"
                className="btn-occupied-call"
                onClick={() => {
                  requestService("waiter");
                  setShowOccupiedModal(false);
                }}
              >
                🛎️ Call Waiter for Assistance
              </button>
              <button
                type="button"
                className="btn-occupied-dismiss"
                onClick={() => setShowOccupiedModal(false)}
              >
                Browse Menu
              </button>
            </div>
          </div>
        </div>
      )}

      {tableStatus === "Occupied" && (
        <div className="table-occupied-warning-box">
          <div className="occupied-warning-inner">
            <span className="occupied-warning-icon">🛑</span>
            <div className="occupied-warning-text">
              <h3>This Table is Currently Occupied</h3>
              <p>
                <strong>{displayTableLabel || "This table"}</strong> is marked as <strong>Occupied</strong> by restaurant staff. Orders on this table are currently active.
              </p>
            </div>
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
              <button
                type="button"
                className="call-waiter-warn-btn"
                onClick={() => setShowTableModal(true)}
                style={{ background: "#ffffff", color: "#991b1b", border: "1.5px solid #fca5a5" }}
              >
                🔄 Switch Table
              </button>
              <button
                type="button"
                className="call-waiter-warn-btn"
                onClick={() => requestService("waiter")}
              >
                🛎️ Call Waiter
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =================================================
          TABLE ORDER BANNER
      ================================================= */}
      {displayTableLabel && (
        <div className="table-order-banner">
          <div className="table-pill customer-table-pill">
            <div className="table-pill-top-row">
              <div className="table-pill-main">
                <span className="table-icon">🍽️</span>
                <strong className="table-number-text">{displayTableLabel}</strong>
              </div>
              <span className="table-status-indicator">
                <span className="pulse-dot" />
                Active Dine-in
              </span>
            </div>

            <div className="table-pill-actions">
              <button
                type="button"
                className="btn-change-table-pill qr-pill-btn"
                onClick={() => handleOpenTableQr(displayTableLabel)}
                title="Click to view QR code to scan with your phone"
              >
                📱 Scan QR
              </button>
              <button
                type="button"
                className="btn-change-table-pill"
                onClick={() => setShowTableModal(true)}
                title="Click to switch dining table"
              >
                Switch Table
              </button>
            </div>
          </div>

          <small className="table-note">Your order will be prepared fresh and served directly to your table.</small>

          <div className="table-actions">
            <button
              type="button"
              className="table-btn waiter-btn"
              onClick={() => requestService("waiter")}
              title="Click to notify restaurant staff"
            >
              🛎️ Call Waiter
            </button>
            <button
              type="button"
              className="table-btn bill-btn"
              onClick={() => requestService("bill")}
              title="Click to request your dining bill"
            >
              🧾 Request Bill
            </button>
          </div>

          {serviceMessage && <div className="table-toast-msg">{serviceMessage}</div>}
        </div>
      )}

      {/* =================================================
          TABLE SELECTOR / SWITCHER MODAL
      ================================================= */}
      {showTableModal && (
        <div className="table-switch-modal-overlay" onClick={() => setShowTableModal(false)}>
          <div className="table-switch-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="table-switch-header">
              <div className="table-switch-title">
                <span className="modal-icon">🍽️</span>
                <div>
                  <h3>Select Dining Table</h3>
                  <p>Click any table to open its QR Scanner and order directly</p>
                </div>
              </div>
              <button
                type="button"
                className="table-switch-close"
                onClick={() => setShowTableModal(false)}
              >
                ✕
              </button>
            </div>

            {/* Quick manual input */}
            <form
              className="table-manual-form"
              onSubmit={(e) => {
                e.preventDefault();
                if (customTableInput.trim()) {
                  handleOpenTableQr(customTableInput.trim());
                  setCustomTableInput("");
                }
              }}
            >
              <input
                type="text"
                placeholder="Enter Table (e.g. Table 05 or 12)"
                value={customTableInput}
                onChange={(e) => setCustomTableInput(e.target.value)}
                className="table-manual-input"
              />
              <button type="submit" className="table-manual-btn">
                Show QR
              </button>
            </form>

            {/* Tables Grid */}
            <div className="table-switch-grid-wrap">
              <span className="grid-label">Quick Pick Table to Scan & Order:</span>
              <div className="table-switch-grid">
                {(restaurantTables.length > 0
                  ? restaurantTables
                  : Array.from({ length: 20 }, (_, i) => ({
                      _id: `t_${i + 1}`,
                      tableNumber: `Table ${String(i + 1).padStart(2, "0")}`,
                      status: "Available",
                    }))
                ).map((t) => {
                  const tStr = String(t.tableNumber || "");
                  const isCurrent =
                    displayTableLabel.toLowerCase().replace(/\s+/g, "") ===
                    tStr.toLowerCase().replace(/\s+/g, "");
                  const isOccupied = String(t.status).toLowerCase() === "occupied";
                  return (
                    <button
                      key={t._id || t.tableNumber}
                      type="button"
                      className={`table-grid-btn ${isCurrent ? "current" : ""} ${isOccupied ? "occupied" : "available"}`}
                      onClick={() => handleOpenTableQr(t.tableNumber)}
                      title={`Click to open QR scanner for ${t.tableNumber}`}
                    >
                      <strong>{t.tableNumber}</strong>
                      <span className="table-grid-status">
                        {isCurrent ? "Active" : t.status || "Available"}
                      </span>
                      <span className="table-grid-qr-badge">📱 Scan QR</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="table-switch-actions">
              <button
                type="button"
                className="btn-table-cancel"
                onClick={() => setShowTableModal(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =================================================
          TABLE QR SCANNER MODAL (Scan & Order directly)
      ================================================= */}
      {selectedTableQr && (
        <div className="table-qr-modal-overlay" onClick={() => setSelectedTableQr(null)}>
          <div className="table-qr-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="table-qr-header">
              <div className="table-qr-title">
                <span className="qr-badge-icon">📱</span>
                <div>
                  <h3>Scan & Order at {selectedTableQr.tableNumber}</h3>
                  <p>Point any phone camera to scan and order directly</p>
                </div>
              </div>
              <button
                type="button"
                className="table-switch-close"
                onClick={() => setSelectedTableQr(null)}
              >
                ✕
              </button>
            </div>

            <div className="table-qr-body">
              <div className="table-qr-code-frame">
                <img
                  src={selectedTableQr.qrDataUrl}
                  alt={`QR Code for ${selectedTableQr.tableNumber}`}
                  className="table-qr-img"
                />
                <div className="table-qr-scan-badge">
                  <span className="scan-pulse" />
                  Point mobile camera to order
                </div>
              </div>

              <div className="table-qr-info">
                <div className="table-qr-pill">
                  🍽️ <strong>{selectedTableQr.tableNumber}</strong>
                  <span className="table-qr-status-tag">Ready to Order</span>
                </div>
                <p className="table-qr-hint">
                  Customer apne phone ke camera se is QR ko scan karke directly {selectedTableQr.tableNumber} ka menu open karke order kar sakte hain.
                </p>
              </div>

              <div className="table-qr-actions">
                <button
                  type="button"
                  className="btn-qr-order-here"
                  onClick={() => {
                    handleSelectTable(selectedTableQr.tableNumber);
                    setSelectedTableQr(null);
                  }}
                >
                  👉 Order on this Device
                </button>
                <div className="table-qr-secondary-btns">
                  <button
                    type="button"
                    className="btn-qr-copy"
                    onClick={() => {
                      navigator.clipboard.writeText(selectedTableQr.menuUrl);
                      setServiceMessage(`Link copied for ${selectedTableQr.tableNumber}!`);
                      setTimeout(() => setServiceMessage(""), 3000);
                    }}
                  >
                    📋 Copy Order Link
                  </button>
                  <button
                    type="button"
                    className="btn-qr-back"
                    onClick={() => {
                      setSelectedTableQr(null);
                      setShowTableModal(true);
                    }}
                  >
                    ⬅️ Pick Another Table
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =================================================
          HERO BANNER
      ================================================= */}
      <section className="menu-hero">
        <div className="hero-content">
          <div className="hero-badge">
            <span className="badge-sparkle">✨</span>
            <span>GOURMET DINING EXPERIENCE</span>
          </div>

          <h1>
            Delicious Food,
            <br />
            <span className="hero-gradient-text">Delivered With Love</span>
          </h1>

          <p className="hero-desc">
            Explore 55+ authentic delicacies, fresh sizzlers, artisan breads, and refreshing drinks crafted fresh for your table.
          </p>

          <div className="hero-features">
            <div className="feature-pill">
              <span className="feature-icon">⚡</span>
              <span>Fast Kitchen Service</span>
            </div>
            <div className="feature-pill">
              <span className="feature-icon">🥗</span>
              <span>100% Fresh Quality</span>
            </div>
            <div className="feature-pill">
              <span className="feature-icon">❤️</span>
              <span>Loved By Guests</span>
            </div>
          </div>
        </div>

        <div className="hero-visual">
          <div className="hero-card-glow" />
          
          <div
            className="hero-showcase-card carousel-showcase"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
          >
            {/* CAROUSEL IMAGE CONTAINER */}
            <div className="showcase-img-wrap">
              <img
                key={heroCarouselSlides[currentHeroSlide].id}
                src={heroCarouselSlides[currentHeroSlide].image}
                alt={heroCarouselSlides[currentHeroSlide].name}
                className="showcase-img carousel-slide-img"
              />
              <div className="showcase-badge">{heroCarouselSlides[currentHeroSlide].badge}</div>

              {/* CAROUSEL ARROWS */}
              <button
                type="button"
                className="hero-carousel-arrow prev-arrow"
                onClick={prevHeroSlide}
                aria-label="Previous slide"
              >
                ‹
              </button>
              <button
                type="button"
                className="hero-carousel-arrow next-arrow"
                onClick={nextHeroSlide}
                aria-label="Next slide"
              >
                ›
              </button>
            </div>

            {/* DETAILS */}
            <div className="showcase-details">
              <h4>{heroCarouselSlides[currentHeroSlide].name}</h4>
              <p>{heroCarouselSlides[currentHeroSlide].desc}</p>
              
              <div className="showcase-meta">
                <span className="showcase-tag">{heroCarouselSlides[currentHeroSlide].tag}</span>
                <strong className="showcase-price">{heroCarouselSlides[currentHeroSlide].price}</strong>
              </div>

              {/* DOT INDICATORS */}
              <div className="hero-carousel-dots" role="tablist" aria-label="Hero carousel pagination">
                {heroCarouselSlides.map((slide, idx) => (
                  <button
                    key={slide.id}
                    type="button"
                    className={`hero-dot ${idx === currentHeroSlide ? "active" : ""}`}
                    onClick={() => setCurrentHeroSlide(idx)}
                    aria-label={`Slide ${idx + 1}: ${slide.name}`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =================================================
          SEARCH & QUICK FILTERS
      ================================================= */}
      <section className="menu-controls">
        <div className="search-box">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            placeholder="Search food by name, category, spices..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button className="clear-search" onClick={() => setSearch("")} aria-label="Clear search">
              ✕
            </button>
          )}
        </div>

        <div className="dietary-filter-group" role="group" aria-label="Dietary filter">
          <button
            type="button"
            className={`dietary-filter-btn veg-btn ${dietaryFilter === "veg" ? "active veg-active" : ""}`}
            onClick={() => setDietaryFilter(dietaryFilter === "veg" ? "all" : "veg")}
            title={dietaryFilter === "veg" ? "Click to clear Veg filter" : "Show only Pure Veg dishes"}
          >
            <span>Veg</span>
            {dietaryFilter === "veg" && <span className="filter-clear-cross">✕</span>}
          </button>

          <button
            type="button"
            className={`dietary-filter-btn nonveg-btn ${dietaryFilter === "non-veg" ? "active nonveg-active" : ""}`}
            onClick={() => setDietaryFilter(dietaryFilter === "non-veg" ? "all" : "non-veg")}
            title={dietaryFilter === "non-veg" ? "Click to clear Non-Veg filter" : "Show only Non-Veg dishes"}
          >
            <span>Non-Veg</span>
            {dietaryFilter === "non-veg" && <span className="filter-clear-cross">✕</span>}
          </button>
        </div>
      </section>

      {/* =================================================
          CATEGORIES
      ================================================= */}
      <section className="categories-section">
        <div className="categories-heading">
          <div>
            <span className="section-kicker">FIND YOUR FAVOURITE</span>
            <h2>Explore Categories</h2>
          </div>
          <span className="category-total">{filteredItems.length} items available</span>
        </div>

        <div className="category-list">
          {categories.map((cat) => {
            const count = cat === "All"
              ? menuItems.length
              : menuItems.filter((item) => item.category === cat).length;
            const icon = categoryIcons[cat] || "🍽️";

            return (
              <button
                key={cat}
                className={category === cat ? "category-btn active" : "category-btn"}
                onClick={() => setCategory(cat)}
              >
                <span className="category-icon">{icon}</span>
                <span className="category-name">{cat}</span>
                <span className="category-count">{count}</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* =================================================
          MENU GRID
      ================================================= */}
      <section className="menu-section">
        <div className="section-heading">
          <div>
            <h2>{category === "All" ? "Popular Dishes" : category}</h2>
            <p>{filteredItems.length} delicious {filteredItems.length === 1 ? "dish" : "dishes"} crafted with passion</p>
          </div>
        </div>

        {/* LOADING */}
        {loading && (
          <div className="loading">
            <div className="loading-spinner">⏳</div>
            <p>Loading fresh dishes...</p>
          </div>
        )}

        {/* ERROR */}
        {!loading && error && (
          <div className="empty-menu">
            <div className="empty-icon">⚠️</div>
            <h3>Unable to load menu</h3>
            <p>{error}</p>
            <button className="retry-btn" onClick={fetchMenu}>Try Again</button>
          </div>
        )}

        {/* EMPTY */}
        {!loading && !error && filteredItems.length === 0 && (
          <div className="empty-menu">
            <div className="empty-icon">🍽️</div>
            <h3>No dishes found</h3>
            <p>
              {dietaryFilter === "veg"
                ? "No pure-veg dishes found with current filters."
                : dietaryFilter === "non-veg"
                ? "No non-veg dishes found with current filters."
                : "Try adjusting your search or selecting another category."}
            </p>
            {(search || dietaryFilter !== "all" || category !== "All") && (
              <button
                className="retry-btn"
                onClick={() => {
                  setSearch("");
                  setDietaryFilter("all");
                  setCategory("All");
                }}
              >
                Reset All Filters
              </button>
            )}
          </div>
        )}

        {/* FOOD GRID */}
        {!loading && !error && filteredItems.length > 0 && (
          <div className="food-grid">
            {filteredItems.map((item) => {
              const imageUrl = getMenuImageUrl(item);
              const cartItem = cart.find(
                (c) => (c.cartKey || c._id) === item._id || c._id === item._id
              );

              return (
                <article className="food-card" key={item._id}>
                  {/* FOOD IMAGE WRAPPER */}
                  <div className="food-image">
                    {imageUrl ? (
                      <img
                        src={imageUrl}
                        alt={item.name || "Food item"}
                        loading="lazy"
                        onError={(event) => {
                          event.currentTarget.onerror = null;
                          event.currentTarget.style.display = "none";
                          const ph = event.currentTarget.parentNode?.querySelector(".no-image");
                          if (ph) ph.style.display = "flex";
                        }}
                      />
                    ) : (
                      <div className="no-image">🍽️</div>
                    )}

                    {/* VEG / NON-VEG WRITTEN TEXT BADGE */}
                    <span
                      className={`food-type-badge ${item.type?.toLowerCase() === "non-veg" ? "nonveg" : "veg"}`}
                      title={item.type || "Veg"}
                    >
                      {item.type?.toLowerCase() === "non-veg" ? "Non-Veg" : "Veg"}
                    </span>

                    {/* OUT OF STOCK / UNAVAILABLE OVERLAY */}
                    {(item.inStock === false || item.status?.toLowerCase() === "unavailable") && (
                      <div className="out-of-stock-overlay">
                        <span>Unavailable</span>
                      </div>
                    )}
                  </div>

                  {/* FOOD CONTENT */}
                  <div className="food-content">
                    <span className="food-category-tag">{item.category}</span>
                    <h3 className="food-title">{item.name}</h3>
                    <p className="food-desc">
                      {item.description || "Freshly prepared with authentic herbs, spices, and premium ingredients."}
                    </p>

                    <div className="food-bottom">
                      <div className="food-price-wrap">
                        <span className="price-currency">₹</span>
                        <strong className="food-price">{Number(item.price || 0).toFixed(2)}</strong>
                      </div>

                      {item.inStock === false || item.status?.toLowerCase() === "unavailable" ? (
                        <button className="add-btn disabled" disabled>
                          Unavailable
                        </button>
                      ) : cartItem ? (
                        <div className="menu-quantity" aria-label={`Quantity for ${item.name}`}>
                          <button
                            type="button"
                            onClick={() => {
                              const key = cartItem.cartKey || cartItem._id;
                              if (cartItem.quantity === 1) {
                                removeFromCart(key);
                              } else {
                                updateQuantity(key, cartItem.quantity - 1);
                              }
                            }}
                          >
                            −
                          </button>
                          <span>{cartItem.quantity}</span>
                          <button
                            type="button"
                            onClick={() => {
                              const key = cartItem.cartKey || cartItem._id;
                              updateQuantity(key, cartItem.quantity + 1);
                            }}
                          >
                            +
                          </button>
                        </div>
                      ) : (
                        <button
                          className="add-btn"
                          onClick={() => {
                            if (item.customization && item.customization.length > 0) {
                              openModifierPopup(item);
                            } else {
                              addToCart(item);
                            }
                          }}
                        >
                          + Add
                        </button>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {/* =================================================
          MODIFIER POPUP
      ================================================= */}
      {modifierItem && (
        <div className="modifier-modal-backdrop" role="presentation" onClick={() => setModifierItem(null)}>
          <section
            className="modifier-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="modifier-modal-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="modifier-modal-header">
              <div>
                <p>Customize your selection</p>
                <h2 id="modifier-modal-title">{modifierItem.name}</h2>
              </div>
              <button
                type="button"
                className="modifier-close"
                aria-label="Close"
                onClick={() => setModifierItem(null)}
              >
                ✕
              </button>
            </div>

            <div className="modifier-options">
              {(modifierItem.customization || []).length ? (
                modifierItem.customization.map((group) => (
                  <fieldset className="customization-group" key={group.name}>
                    <legend>{group.name}</legend>
                    {(group.options || []).map((option) => (
                      <label className="modifier-option" key={`${group.name}-${option.name}`}>
                        <input
                          type="radio"
                          name={`customization-${group.name}`}
                          checked={selectedCustomizations[group.name] === option.name}
                          onChange={() => selectCustomization(group.name, option.name)}
                        />
                        <span>{option.name}</span>
                        <strong>
                          {Number(option.price) > 0 ? `+ ₹${Number(option.price).toFixed(2)}` : "Included"}
                        </strong>
                      </label>
                    ))}
                  </fieldset>
                ))
              ) : (
                <p className="no-modifiers">No extra customization required for this dish.</p>
              )}
            </div>

            <div className="modifier-modal-footer">
              <div className="modifier-price-preview">
                <small>Total Price</small>
                <strong>
                  ₹
                  {(
                    Number(modifierItem.price || 0) +
                    (modifierItem.customization || []).reduce(
                      (total, group) =>
                        total +
                        (Number(
                          group.options?.find((option) => option.name === selectedCustomizations[group.name])?.price
                        ) || 0),
                      0
                    )
                  ).toFixed(2)}
                </strong>
              </div>
              <button type="button" className="add-btn modal-add-btn" onClick={addConfiguredItemToCart}>
                Add to Cart
              </button>
            </div>
          </section>
        </div>
      )}

      {cartCount > 0 && (
        <button className="floating-cart" onClick={openCart} aria-label="View Cart">
          <div className="floating-cart-left">
            <span className="floating-cart-badge">{cartCount}</span>
            <span className="floating-cart-amount">₹{cartTotal.toFixed(2)}</span>
          </div>
          <div className="floating-cart-action">
            <span>View Cart</span>
            <span className="floating-cart-arrow">→</span>
          </div>
        </button>
      )}
    </div>
  );
}

export default CustomerMenu;
