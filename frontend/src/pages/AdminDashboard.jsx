import { useEffect, useState, useCallback, useMemo } from "react";
import { useNavigate, useSearchParams, useParams, useLocation } from "react-router-dom";
import { API_URL } from "../config/api";
import {
  getMenuImageUrl,
  PLACEHOLDER_FOOD_IMAGE,
  itemImages,
  categoryImages,
  getFallbackMenuImage,
} from "../utils/menuImage";
import QRManagement from "./QRManagement";

import "./AdminDashboard.css";

const menuCategoryImages = {
  Starters: "https://images.unsplash.com/photo-1601050690117-94f5f6fa8bd7?auto=format&fit=crop&w=900&q=80",
  "Main Course": "https://images.unsplash.com/photo-1585937421612-70a008356fbe?auto=format&fit=crop&w=900&q=80",
  Veg: "https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=900&q=80",
  "Non-Veg": "https://images.unsplash.com/photo-1565557623262-b51c2513a641?auto=format&fit=crop&w=900&q=80",
  "Biryani & Rice": "https://images.unsplash.com/photo-1563379926898-05f4575a45d8?auto=format&fit=crop&w=900&q=80",
  "Indian Breads": "https://images.unsplash.com/photo-1610057099431-d73a1c9d2f2f?auto=format&fit=crop&w=900&q=80",
  Pizza: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=900&q=80",
  Burgers: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=900&q=80",
  Chinese: "https://images.unsplash.com/photo-1563245372-f21724e3856d?auto=format&fit=crop&w=900&q=80",
  Snacks: "https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=900&q=80",
  Beverages: "https://images.unsplash.com/photo-1544145945-f90425340c7e?auto=format&fit=crop&w=900&q=80",
  Desserts: "https://images.unsplash.com/photo-1551024506-0bccd828d307?auto=format&fit=crop&w=900&q=80",
  Combo: "https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=900&q=80",
};

const getMenuImage = (item) => {
  if (!item) return null;
  const direct = getMenuImageUrl(item);
  if (direct) return direct;
  if (item.name && itemImages && itemImages[item.name]) return itemImages[item.name];
  if (item.category && (menuCategoryImages[item.category] || (categoryImages && categoryImages[item.category]))) {
    return menuCategoryImages[item.category] || categoryImages[item.category];
  }
  return null;
};

const menuCategoryOptions = Object.keys(menuCategoryImages);

const SECTION_SLUG_MAP = {
  dashboard: "Dashboard",
  orders: "Orders",
  kitchen: "Kitchen",
  tables: "Table Management",
  "table-management": "Table Management",
  menu: "Menu",
  inventory: "Inventory",
  customers: "Customers",
  reservations: "Reservations",
  staff: "Staff",
  managers: "Managers",
  waiters: "Waiters",
  chefs: "Chefs",
  cleaners: "Cleaners",
  users: "Users",
  "offers-loyalty": "Offers & Loyalty",
  offers: "Offers & Loyalty",
  payments: "Payments",
  expenses: "Expenses",
  reviews: "Reviews",
  analytics: "Analytics",
  notifications: "Notifications",
  settings: "Settings",
  "qr-management": "QR Management",
  "qr_management": "QR Management",
  "qr-code": "QR Management",
  qr: "QR Management",
  qrmanagement: "QR Management",
};

const MENU_TO_SLUG = {
  Dashboard: "dashboard",
  Orders: "orders",
  Kitchen: "kitchen",
  "Table Management": "table-management",
  Menu: "menu",
  Inventory: "inventory",
  Customers: "customers",
  Reservations: "reservations",
  Staff: "staff",
  Managers: "managers",
  Waiters: "waiters",
  Chefs: "chefs",
  Cleaners: "cleaners",
  Users: "users",
  "Offers & Loyalty": "offers-loyalty",
  Payments: "payments",
  Expenses: "expenses",
  Reviews: "reviews",
  Analytics: "analytics",
  Notifications: "notifications",
  Settings: "settings",
  "QR Management": "qr-management",
  "QR Code": "qr-management",
  "All Items": "menu",
  Veg: "menu",
  "Non-Veg": "menu",
};

const SAMPLE_FLOOR_TABLES = [
  { tableNumber: "T01", status: "Available" },
  { tableNumber: "T02", status: "Occupied" },
  { tableNumber: "T03", status: "Available" },
  { tableNumber: "T04", status: "Cleaning" },
  { tableNumber: "T05", status: "Reserved" },
  { tableNumber: "T06", status: "Cleaning" },
  { tableNumber: "T07", status: "Occupied" },
  { tableNumber: "T08", status: "Reserved" },
  { tableNumber: "T09", status: "Occupied" },
  { tableNumber: "T10", status: "Cleaning" },
  { tableNumber: "T11", status: "Occupied" },
  { tableNumber: "T12", status: "Cleaning" },
  { tableNumber: "T13", status: "Occupied" },
  { tableNumber: "T14", status: "Occupied" },
  { tableNumber: "T15", status: "Occupied" },
  { tableNumber: "T16", status: "Cleaning" },
  { tableNumber: "T17", status: "Available" },
  { tableNumber: "T18", status: "Available" },
  { tableNumber: "T19", status: "Available" },
  { tableNumber: "T20", status: "Available" },
  { tableNumber: "T21", status: "Available" },
  { tableNumber: "T24", status: "Available" },
  { tableNumber: "T25", status: "Occupied" },
  { tableNumber: "T26", status: "Available" },
];

const cleanTableNumber = (str) =>
  String(str || "")
    .replace(/^Table\s*/i, "")
    .replace(/^0+/, "")
    .trim()
    .toLowerCase();

const formatTableName = (tNum) => {
  if (!tNum) return "Table";
  const str = String(tNum).trim();
  return str.toLowerCase().startsWith("table") ? str : `Table ${str}`;
};

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

const AdminDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { section, subSection } = useParams();
  const [searchParams] = useSearchParams();

  // URL Path-driven activeMenu (/admin/orders -> "Orders", /admin/settings -> "Settings")
  // with fallback to ?s= query param or "Dashboard"
  const activeMenu = useMemo(() => {
    if (subSection) {
      const mappedSub = SECTION_SLUG_MAP[subSection.toLowerCase()];
      if (mappedSub) return mappedSub;
      return subSection.charAt(0).toUpperCase() + subSection.slice(1);
    }
    if (section) {
      const mapped = SECTION_SLUG_MAP[section.toLowerCase()];
      if (mapped) return mapped;
      return section.charAt(0).toUpperCase() + section.slice(1);
    }
    const queryS = searchParams.get("s");
    if (queryS) return queryS;
    return "Dashboard";
  }, [section, subSection, searchParams]);

  const setActiveMenu = (name) => {
    const slug = MENU_TO_SLUG[name] || String(name).toLowerCase().replace(/\s+/g, "-");
    if (slug === "dashboard") {
      navigate("/admin/dashboard");
    } else {
      navigate(`/admin/${slug}`);
    }
  };

  const [openMenu, setOpenMenu] = useState(null);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [globalSearch, setGlobalSearch] = useState("");
  const [topFilterRange, setTopFilterRange] = useState("Last 7 Days");
  const [restaurants, setRestaurants] = useState([]);
  const [restaurantsLoading, setRestaurantsLoading] = useState(true);
  const [menuEntries, setMenuEntries] = useState([]);
  const [menuLoading, setMenuLoading] = useState(true);
  const [menuError, setMenuError] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [dietFilter, setDietFilter] = useState("All");
  const [subCategoryFilter, setSubCategoryFilter] = useState("");
  const [openSubMenu, setOpenSubMenu] = useState(null);
  const [showAddMenuForm, setShowAddMenuForm] = useState(false);
  const [menuItemSaving, setMenuItemSaving] = useState(false);
  const [menuItemError, setMenuItemError] = useState("");
  const [menuSearch, setMenuSearch] = useState("");
  const [editingMenuItem, setEditingMenuItem] = useState(null);
  const [newMenuItem, setNewMenuItem] = useState({
    name: "",
    category: "Starters",
    price: "",
    description: "",
    image: "",
    type: "Veg",
    inStock: true,
  });
  const [modifiers, setModifiers] = useState([]);
  const [modifierForm, setModifierForm] = useState({
    name: "",
    priceAdjustment: "0",
  });
  const [modifierSaving, setModifierSaving] = useState(false);
  const [modifierError, setModifierError] = useState("");

  // Staff state
  const [managers, setManagers] = useState([]);
  const [waiters, setWaiters] = useState([]);
  const [chefs, setChefs] = useState([]);
  const [cleaners, setCleaners] = useState([]);
  const [staffLoading, setStaffLoading] = useState(false);
  const [staffError, setStaffError] = useState("");
  const [staffSearch, setStaffSearch] = useState("");
  const [selectedRestaurantId, setSelectedRestaurantId] = useState("");
  const [statusUpdatingId, setStatusUpdatingId] = useState(null);

  // Staff creation modals & form state
  const [showAddManagerModal, setShowAddManagerModal] = useState(false);
  const [showAddWaiterModal, setShowAddWaiterModal] = useState(false);
  const [showAddChefModal, setShowAddChefModal] = useState(false);
  const [showAddCleanerModal, setShowAddCleanerModal] = useState(false);
  const [staffActionLoading, setStaffActionLoading] = useState(false);
  const [staffActionError, setStaffActionError] = useState("");
  // Admin Create Order Modal state
  const [showAdminCreateOrderModal, setShowAdminCreateOrderModal] = useState(false);
  const [adminOrderTable, setAdminOrderTable] = useState("");
  const [adminOrderCustomerName, setAdminOrderCustomerName] = useState("");
  const [adminOrderCustomerPhone, setAdminOrderCustomerPhone] = useState("");
  const [adminOrderCart, setAdminOrderCart] = useState([]);
  const [adminOrderCategory, setAdminOrderCategory] = useState("All");
  const [adminOrderSearch, setAdminOrderSearch] = useState("");
  const [adminOrderSubmitting, setAdminOrderSubmitting] = useState(false);
  const [adminOrderError, setAdminOrderError] = useState("");
  const [adminOrderSuccess, setAdminOrderSuccess] = useState("");
  const [adminOrderViewMode, setAdminOrderViewMode] = useState("grid");
  const [adminOrderDietFilter, setAdminOrderDietFilter] = useState("All");
  const [adminOrderSuccessModal, setAdminOrderSuccessModal] = useState(null);
  const [adminOccupiedModal, setAdminOccupiedModal] = useState(null);

  const [managerForm, setManagerForm] = useState({
    restaurantId: "",
    name: "",
    email: "",
    password: "",
    phone: "",
  });

  const [waiterForm, setWaiterForm] = useState({
    restaurantId: "",
    name: "",
    email: "",
    password: "",
    phone: "",
    gender: "Male",
    address: "",
  });

  const [chefForm, setChefForm] = useState({
    restaurantId: "",
    name: "",
    email: "",
    password: "",
    phone: "",
    speciality: "Head Chef",
    shift: "Full Day",
  });

  const [cleanerForm, setCleanerForm] = useState({
    restaurantId: "",
    name: "",
    email: "",
    password: "",
    phone: "",
    assignedArea: "Dining Hall & Tables",
    shift: "Full Day",
  });

  // Staff EDIT modals & form state
  const [editingStaff, setEditingStaff] = useState(null); // { type, data }
  const [editStaffForm, setEditStaffForm] = useState({});
  const [editStaffLoading, setEditStaffLoading] = useState(false);
  const [editStaffError, setEditStaffError] = useState("");
  const [editStaffSuccess, setEditStaffSuccess] = useState("");

  const [dashboardSummary, setDashboardSummary] = useState({
    stats: {
      totalOrders: 0,
      totalCustomers: 0,
      totalRevenue: 0,
      totalTables: 0,
      activeOrders: 0,
      readyOrders: 0,
      completedOrders: 0,
      reservations: 0,
    },
    tableStats: {
      available: 0,
      occupied: 0,
      reserved: 0,
      cleaning: 0,
      outOfService: 0,
      total: 0,
    },
    recentOrders: [],
    orders: [],
    customers: [],
    tables: [],
  });

  // Active running order for selected admin table
  const activeAdminTableOrder = useMemo(() => {
    if (!adminOrderTable) return null;
    const cleanAdmin = cleanTableNumber(adminOrderTable);
    return (dashboardSummary.orders || []).find((o) => {
      if (["Completed", "Paid", "Cancelled"].includes(o.status)) return false;
      if (o.payment?.status === "Paid") return false;
      const cleanO = cleanTableNumber(o.tableNumber);
      return (
        cleanO === cleanAdmin ||
        String(o.tableNumber).trim().toLowerCase() === String(adminOrderTable).trim().toLowerCase()
      );
    });
  }, [adminOrderTable, dashboardSummary.orders]);

  const existingRunningSubtotal = useMemo(() => {
    if (!activeAdminTableOrder || !Array.isArray(activeAdminTableOrder.items)) return 0;
    return activeAdminTableOrder.items.reduce((sum, item) => {
      const modTotal = (item.selectedModifiers || []).reduce((s, m) => s + (Number(m.priceAdjustment) || 0), 0);
      return sum + ((Number(item.price) || 0) + modTotal) * (Number(item.quantity) || 1);
    }, 0);
  }, [activeAdminTableOrder]);

  const existingRunningTax = useMemo(() => {
    return Number((existingRunningSubtotal * 0.05).toFixed(2));
  }, [existingRunningSubtotal]);

  const existingRunningTotal = useMemo(() => {
    return Number((existingRunningSubtotal + existingRunningTax).toFixed(2));
  }, [existingRunningSubtotal, existingRunningTax]);

  useEffect(() => {
    if (activeAdminTableOrder) {
      if (!adminOrderCustomerName && activeAdminTableOrder.customerName && !["Customer", "Walk-in Customer"].includes(activeAdminTableOrder.customerName)) {
        setAdminOrderCustomerName(activeAdminTableOrder.customerName);
      }
      if (!adminOrderCustomerPhone && activeAdminTableOrder.customerPhone) {
        setAdminOrderCustomerPhone(activeAdminTableOrder.customerPhone);
      }
    }
  }, [activeAdminTableOrder]);

  const tableCounts = useMemo(() => {
    if (dashboardSummary.tables && dashboardSummary.tables.length > 0) {
      return {
        Available: dashboardSummary.tables.filter((t) => t.status === "Available").length,
        Occupied: dashboardSummary.tables.filter((t) => t.status === "Occupied").length,
        Reserved: dashboardSummary.tables.filter((t) => t.status === "Reserved").length,
        Cleaning: dashboardSummary.tables.filter((t) => t.status === "Cleaning").length,
        "Out of Service": dashboardSummary.tables.filter((t) => t.status === "Out of Service").length,
      };
    }
    return { Available: 0, Occupied: 0, Reserved: 0, Cleaning: 0, "Out of Service": 0 };
  }, [dashboardSummary.tables]);

  const globalSearchResults = useMemo(() => {
    if (!globalSearch.trim()) return null;
    const q = globalSearch.toLowerCase().trim();

    const matchedMenu = (menuEntries || []).filter(
      (item) => item.name?.toLowerCase().includes(q) || item.category?.toLowerCase().includes(q)
    ).slice(0, 4);

    const matchedOrders = (dashboardSummary.orders || []).filter(
      (order) =>
        String(order.orderId || order._id).toLowerCase().includes(q) ||
        String(order.customerName || "").toLowerCase().includes(q) ||
        String(order.tableNumber || "").toLowerCase().includes(q)
    ).slice(0, 4);

    const matchedTables = (dashboardSummary.tables || []).filter(
      (table) =>
        String(table.tableNumber).toLowerCase().includes(q) ||
        String(table.status).toLowerCase().includes(q)
    ).slice(0, 4);

    const matchedCustomers = (dashboardSummary.customers || []).filter(
      (cust) =>
        String(cust.name || cust.customerName || "").toLowerCase().includes(q) ||
        String(cust.phone || "").includes(q)
    ).slice(0, 4);

    return {
      menu: matchedMenu,
      orders: matchedOrders,
      tables: matchedTables,
      customers: matchedCustomers,
      totalCount: matchedMenu.length + matchedOrders.length + matchedTables.length + matchedCustomers.length,
    };
  }, [globalSearch, menuEntries, dashboardSummary]);
  const [dashboardLoading, setDashboardLoading] = useState(false);
  const [orderSearch, setOrderSearch] = useState("");
  const [orderStatusFilter, setOrderStatusFilter] = useState("All");
  const [orderUpdatingId, setOrderUpdatingId] = useState(null);
  const [customerSearch, setCustomerSearch] = useState("");
  const [customerOrderFilter, setCustomerOrderFilter] = useState(null);

  // Day & Date Filter State for Orders
  const [orderDateFilter, setOrderDateFilter] = useState("all"); // "all" | "today" | "yesterday" | "custom"
  const [orderCustomDate, setOrderCustomDate] = useState("");

  // Orders Pagination State
  const [ordersPage, setOrdersPage] = useState(1);
  const [ordersPerPage, setOrdersPerPage] = useState(9);

  // Customers Pagination State
  const [customersPage, setCustomersPage] = useState(1);
  const [customersPerPage, setCustomersPerPage] = useState(6);

  // Reset page when filters change
  useEffect(() => {
    setOrdersPage(1);
  }, [orderStatusFilter, orderSearch, customerOrderFilter, orderDateFilter, orderCustomDate, activeMenu]);

  useEffect(() => {
    setCustomersPage(1);
  }, [customerSearch, activeMenu]);

  const getOrderDateKey = useCallback((createdAt) => {
    if (!createdAt) return "";
    const d = new Date(createdAt);
    if (isNaN(d.getTime())) return "";
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }, []);

  const formatDateKeyDisplay = useCallback((dateKey) => {
    if (!dateKey) return "";
    const parts = dateKey.split("-").map(Number);
    if (parts.length < 3) return dateKey;
    const [y, m, d] = parts;
    const dateObj = new Date(y, m - 1, d);
    if (isNaN(dateObj.getTime())) return dateKey;
    return dateObj.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }, []);

  const todayDateKey = useMemo(() => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }, []);

  const yesterdayDateKey = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }, []);

  const todayOrdersList = useMemo(() => {
    return (dashboardSummary.orders || []).filter(
      (o) => getOrderDateKey(o.createdAt) === todayDateKey
    );
  }, [dashboardSummary.orders, todayDateKey, getOrderDateKey]);

  const yesterdayOrdersList = useMemo(() => {
    return (dashboardSummary.orders || []).filter(
      (o) => getOrderDateKey(o.createdAt) === yesterdayDateKey
    );
  }, [dashboardSummary.orders, yesterdayDateKey, getOrderDateKey]);

  const customDateOrdersList = useMemo(() => {
    if (!orderCustomDate) return [];
    return (dashboardSummary.orders || []).filter(
      (o) => getOrderDateKey(o.createdAt) === orderCustomDate
    );
  }, [dashboardSummary.orders, orderCustomDate, getOrderDateKey]);

  const dateFilteredOrders = useMemo(() => {
    const all = dashboardSummary.orders || [];
    if (orderDateFilter === "today") {
      return all.filter((o) => getOrderDateKey(o.createdAt) === todayDateKey);
    }
    if (orderDateFilter === "yesterday") {
      return all.filter((o) => getOrderDateKey(o.createdAt) === yesterdayDateKey);
    }
    if (orderDateFilter === "custom" && orderCustomDate) {
      return all.filter((o) => getOrderDateKey(o.createdAt) === orderCustomDate);
    }
    return all;
  }, [dashboardSummary.orders, orderDateFilter, todayDateKey, yesterdayDateKey, orderCustomDate, getOrderDateKey]);

  const todayRevenue = useMemo(() => {
    return todayOrdersList.reduce((sum, o) => {
      if (o.status === "Cancelled") return sum;
      return sum + Number(o.total || o.totalAmount || 0);
    }, 0);
  }, [todayOrdersList]);

  const activeDateRevenue = useMemo(() => {
    return dateFilteredOrders.reduce((sum, o) => {
      if (o.status === "Cancelled") return sum;
      return sum + Number(o.total || o.totalAmount || 0);
    }, 0);
  }, [dateFilteredOrders]);

  const activeDateLabel = useMemo(() => {
    if (orderDateFilter === "today") return `Today (${formatDateKeyDisplay(todayDateKey)})`;
    if (orderDateFilter === "yesterday") return `Yesterday (${formatDateKeyDisplay(yesterdayDateKey)})`;
    if (orderDateFilter === "custom" && orderCustomDate) return formatDateKeyDisplay(orderCustomDate);
    return "All Time";
  }, [orderDateFilter, orderCustomDate, todayDateKey, yesterdayDateKey, formatDateKeyDisplay]);
  const [tableFilter, setTableFilter] = useState("All");
  const [tablesPage, setTablesPage] = useState(1);
  const [tablesPerPage, setTablesPerPage] = useState(8);

  useEffect(() => {
    setTablesPage(1);
  }, [tableFilter, activeMenu]);
  const [tableUpdatingId, setTableUpdatingId] = useState(null);
  const [tableDeletingId, setTableDeletingId] = useState(null);
  const [editingTableId, setEditingTableId] = useState(null);
  const [showAddTableModal, setShowAddTableModal] = useState(false);
  const [tableActionLoading, setTableActionLoading] = useState(false);
  const [tableActionError, setTableActionError] = useState("");
  const [tableActionSuccess, setTableActionSuccess] = useState("");
  const [tableForm, setTableForm] = useState({
    restaurantId: "",
    tableNumber: "",
    capacity: 4,
    status: "Available",
  });

  // ================= RESERVATIONS STATE =================
  const [reservations, setReservations] = useState([]);
  const [reservationStats, setReservationStats] = useState({
    total: 0,
    today: 0,
    confirmed: 0,
    seated: 0,
  });
  const [reservationsLoading, setReservationsLoading] = useState(false);
  const [reservationFilter, setReservationFilter] = useState("All");
  const [reservationDateFilter, setReservationDateFilter] = useState("");
  const [reservationSearch, setReservationSearch] = useState("");
  const [showAddReservationModal, setShowAddReservationModal] = useState(false);
  const [showEditReservationModal, setShowEditReservationModal] = useState(false);
  const [reservationActionLoading, setReservationActionLoading] = useState(false);
  const [reservationActionError, setReservationActionError] = useState("");
  const [reservationActionSuccess, setReservationActionSuccess] = useState("");
  const [reservationForm, setReservationForm] = useState({
    restaurantId: "",
    customerName: "",
    customerPhone: "",
    customerEmail: "",
    guestsCount: 2,
    reservationDate: new Date().toISOString().split("T")[0],
    reservationTime: "07:30 PM",
    tableNumber: "",
    specialRequest: "",
    status: "Confirmed",
    source: "Admin",
  });
  const [editReservationForm, setEditReservationForm] = useState({
    _id: "",
    restaurantId: "",
    customerName: "",
    customerPhone: "",
    customerEmail: "",
    guestsCount: 2,
    reservationDate: new Date().toISOString().split("T")[0],
    reservationTime: "07:30 PM",
    tableNumber: "",
    specialRequest: "",
    status: "Confirmed",
    source: "Admin",
  });

  // ================= ADMIN PROFILE STATE =================

  const [adminUser, setAdminUser] = useState(() => {
    try {
      const isSuper = Boolean(localStorage.getItem("superAdmin"));
      if (isSuper) return null;
      const raw =
        localStorage.getItem("restaurantAdmin") ||
        localStorage.getItem("adminInfo") ||
        localStorage.getItem("admin") ||
        localStorage.getItem("authUser");
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (parsed.role === "superadmin") return null;
      return parsed;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    const superAdminRaw = localStorage.getItem("superAdmin");
    const authUserRaw = localStorage.getItem("authUser");
    let isSuper = Boolean(superAdminRaw);
    if (!isSuper && authUserRaw) {
      try {
        const parsed = JSON.parse(authUserRaw);
        if (parsed.role === "superadmin") isSuper = true;
      } catch (_) {}
    }

    if (isSuper) {
      // superadmin ko dashboard pe redirect karo — replace:true theek hai (security)
      navigate("/superadmin/dashboard", { replace: true });
      return;
    }

    const restAdminRaw =
      localStorage.getItem("restaurantAdmin") ||
      localStorage.getItem("adminInfo") ||
      localStorage.getItem("admin");

    if (!restAdminRaw && !adminUser) {
      // Unauthenticated user ko login pe bhejo — replace:true theek hai (security)
      navigate("/login", { replace: true });
    }
    // Note: Authenticated admin ke liye koi redirect nahi — back button kaam karega
  }, [adminUser, navigate]);

  const [showProfileModal, setShowProfileModal] = useState(false);
  const [profileTab, setProfileTab] = useState("overview"); // "overview" | "edit"
  const [profileSuccessMsg, setProfileSuccessMsg] = useState("");
  const [profileErrorMsg, setProfileErrorMsg] = useState("");
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileForm, setProfileForm] = useState({
    name: "",
    email: "",
    phone: "",
  });

  useEffect(() => {
    if (adminUser) {
      setProfileForm({
        name: adminUser.name || adminUser.ownerName || "Admin",
        email: adminUser.email || "admin@foodvista.com",
        phone: adminUser.phone || "",
      });
    }
  }, [adminUser]);

  const isRestaurantAdmin =
    adminUser?.role === "restaurant" ||
    Boolean(localStorage.getItem("restaurantAdmin"));

  const myRestId = String(adminUser?._id || adminUser?.id || "");
  const myRestCode = String(adminUser?.restaurantId || adminUser?.restaurantCode || "").toUpperCase();

  const adminDisplayName =
    adminUser?.ownerName || adminUser?.name || adminUser?.restaurantName || "Admin";
  const adminDisplayEmail = adminUser?.email || "admin@foodvista.com";
  const adminDisplayRole = adminUser?.role === "superadmin"
    ? "Super Administrator"
    : (adminUser?.role === "restaurant" || isRestaurantAdmin)
    ? "Restaurant Admin"
    : "Administrator";
  const adminDisplayId = adminUser?.restaurantId || adminUser?._id || adminUser?.id || "ADM-001";
  const adminDisplayPhone = adminUser?.phone || "+91 98765 43210";

  const adminInitials = (() => {
    const src = adminUser?.ownerName || adminUser?.name || adminUser?.restaurantName;
    if (src) {
      const parts = src.trim().split(/\s+/);
      if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
      return src.slice(0, 2).toUpperCase();
    }
    return "AD";
  })();

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setProfileSaving(true);
    setProfileSuccessMsg("");
    setProfileErrorMsg("");

    try {
      const updated = {
        ...adminUser,
        name: profileForm.name.trim(),
        email: profileForm.email.trim(),
        phone: profileForm.phone.trim(),
      };

      if (adminUser?._id || adminUser?.id) {
        const id = adminUser._id || adminUser.id;
        try {
          await fetch(`${API_URL}/admin/profile/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              name: profileForm.name.trim(),
              email: profileForm.email.trim(),
              phone: profileForm.phone.trim(),
            }),
          });
        } catch (apiErr) {
          console.warn("Backend profile update skipped:", apiErr);
        }
      }

      setAdminUser(updated);
      localStorage.setItem("adminInfo", JSON.stringify(updated));
      localStorage.setItem("authUser", JSON.stringify(updated));
      setProfileSuccessMsg("Profile updated successfully! ✨");
      setTimeout(() => {
        setProfileSuccessMsg("");
        setProfileTab("overview");
      }, 1200);
    } catch (err) {
      setProfileErrorMsg(err.message || "Failed to update profile");
    } finally {
      setProfileSaving(false);
    }
  };

  // ================= SETTINGS & PASSWORD RESET =================
  const [restResetPwd, setRestResetPwd] = useState("");
  const [restResetPwdConfirm, setRestResetPwdConfirm] = useState("");
  const [restResetPwdLoading, setRestResetPwdLoading] = useState(false);
  const [restResetPwdMsg, setRestResetPwdMsg] = useState({ type: "", text: "" });
  const [showRestPwd, setShowRestPwd] = useState(false);

  const handleRestaurantResetPassword = async (e) => {
    e.preventDefault();
    setRestResetPwdMsg({ type: "", text: "" });
    if (restResetPwd.length < 6) {
      return setRestResetPwdMsg({ type: "error", text: "Password must be at least 6 characters." });
    }
    if (restResetPwd !== restResetPwdConfirm) {
      return setRestResetPwdMsg({ type: "error", text: "Passwords do not match." });
    }
    setRestResetPwdLoading(true);
    try {
      const restTargetId = adminUser?._id || adminUser?.id || adminUser?.restaurantId || adminUser?.restaurantCode;
      if (!restTargetId) throw new Error("Restaurant ID not found. Please log in again.");
      const res = await fetch(`${API_URL}/restaurants/${restTargetId}/reset-password`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newPassword: restResetPwd }),
      });
      const result = await res.json();
      if (!res.ok || !result.success) throw new Error(result.message || "Failed to reset password.");
      setRestResetPwdMsg({ type: "success", text: "✅ Password reset successfully! Please use your new password next time you login." });
      setRestResetPwd("");
      setRestResetPwdConfirm("");
    } catch (err) {
      setRestResetPwdMsg({ type: "error", text: err.message || "Failed to reset password." });
    } finally {
      setRestResetPwdLoading(false);
    }
  };

  const menuItems = [
    {
      name: "Dashboard",
      icon: "🏠",
    },

    {
      name: "Add Restaurant",
      icon: "➕",
      path: "/admin/add-restaurant",
    },

    {
      name: "Restaurants",
      icon: "🏪",
      children: [
        "All Restaurants",
        "Active",
        "Inactive",
      ],
    },

    {
      name: "Orders",
      icon: "🧾",
    },

    {
      name: "Kitchen",
      icon: "👨‍🍳",
    },

    {
      name: "Table Management",
      icon: "🪑",
    },

    {
      name: "Menu",
      icon: "🍔",
      children: [
        "All Items",
        "Veg",
        "Non-Veg",
      ],
    },

    {
      name: "Inventory",
      icon: "📦",
    },

    {
      name: "Customers",
      icon: "👥",
    },

    {
      name: "Reservations",
      icon: "📅",
    },

    {
      name: "Staff",
      icon: "👨‍💼",
    },

    {
      name: "QR Management",
      icon: "📱",
      path: "/restaurant/qr-management",
    },

    {
      name: "Offers & Loyalty",
      icon: "🎁",
    },

    {
      name: "Payments",
      icon: "💳",
    },

    {
      name: "Expenses",
      icon: "💰",
    },

    {
      name: "Reviews",
      icon: "⭐",
    },

    {
      name: "Analytics",
      icon: "📊",
    },

    {
      name: "Notifications",
      icon: "🔔",
    },

    {
      name: "Settings",
      icon: "⚙️",
    },
  ];

  useEffect(() => {
    const fetchRestaurants = async () => {
      try {
        const response = await fetch(
          `${API_URL}/restaurants`
        );
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Failed to fetch restaurants.");
        }

        setRestaurants(
          Array.isArray(data) ? data : data.restaurants || []
        );
      } catch (error) {
        console.error("Fetch Restaurants Error:", error);
        setRestaurants([]);
      } finally {
        setRestaurantsLoading(false);
      }
    };

    fetchRestaurants();
  }, []);

  const fetchModifiers = async () => {
    try {
      const response = await fetch(`${API_URL}/menu/modifiers`);
      const contentType = response.headers.get("content-type") || "";

      if (!contentType.includes("application/json")) {
        throw new Error(
          "Modifier API is unavailable. Restart the backend server and try again."
        );
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to fetch modifiers.");
      }

      setModifiers(data.modifiers || []);
    } catch (error) {
      console.error("Fetch Modifiers Error:", error);
      setModifierError(error.message || "Unable to load modifiers.");
    }
  };

  useEffect(() => {
    fetchModifiers();
  }, []);

  // Fetch staff
  const fetchStaff = async () => {
    setStaffLoading(true);
    setStaffError("");
    try {
      const restParam = isRestaurantAdmin
        ? (myRestCode || myRestId || adminUser?.restaurantId || adminUser?.restaurantCode || adminUser?._id || adminUser?.id || "")
        : (selectedRestaurantId || "");
      const qStr = restParam ? `?restaurantId=${encodeURIComponent(restParam)}` : "";

      const [mgRes, wtRes, cfRes, clRes] = await Promise.all([
        fetch(`${API_URL}/managers${qStr}`),
        fetch(`${API_URL}/waiters${qStr}`),
        fetch(`${API_URL}/chefs${qStr}`),
        fetch(`${API_URL}/cleaners${qStr}`),
      ]);
      const mgData = await mgRes.json();
      const wtData = await wtRes.json();
      const cfData = await cfRes.json();
      const clData = await clRes.json();
      const allManagers = mgData.managers || [];
      const allWaiters = wtData.waiters || [];
      const allChefs = cfData.chefs || [];
      const allCleaners = clData.cleaners || [];

      const staffMatches = (s) => {
        if (!s) return false;
        if (qStr) return true; // Backend API already filtered by restaurantId parameter!

        const target = isRestaurantAdmin
          ? (myRestCode || myRestId || adminUser?.restaurantId || adminUser?.restaurantCode || "")
          : (selectedRestaurantId || "");

        if (!target) return true;

        const sId = String(s.restaurantId?._id || s.restaurantId?.id || s.restaurantId || "").trim().toLowerCase();
        const sCode = String(s.restaurantId?.restaurantId || s.restaurantId?.code || "").trim().toLowerCase();
        const tLower = String(target).trim().toLowerCase();

        return sId === tLower || sCode === tLower || (sCode && tLower.includes(sCode)) || (sId && tLower.includes(sId));
      };

      setManagers(allManagers.filter(staffMatches));
      setWaiters(allWaiters.filter(staffMatches));
      setChefs(allChefs.filter(staffMatches));
      setCleaners(allCleaners.filter(staffMatches));
    } catch (err) {
      console.error("Fetch Staff Error:", err);
      setStaffError("Failed to load staff data.");
    } finally {
      setStaffLoading(false);
    }
  };

  // Fetch staff when Staff sub-pages are active
  useEffect(() => {
    const isStaffView = ["Staff", "Managers", "Waiters", "Chefs", "Cleaners"].includes(activeMenu);
    if (isStaffView) {
      fetchStaff();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeMenu, selectedRestaurantId]);

  // ================= FETCH DASHBOARD, ORDERS & CUSTOMERS =================
  const fetchDashboardSummary = useCallback(async (showLoading = true) => {
    try {
      if (showLoading) setDashboardLoading(true);
      const restParam =
        myRestCode ||
        myRestId ||
        adminUser?.restaurantId ||
        adminUser?.restaurantCode ||
        adminUser?._id ||
        adminUser?.id ||
        adminUser?.email ||
        selectedRestaurantId ||
        "";
      const url = `${API_URL}/orders/dashboard-summary${
        restParam ? `?restaurantId=${encodeURIComponent(restParam)}` : ""
      }`;
      const res = await fetch(url);
      const data = await res.json();
      if (res.ok && data.success) {
        setDashboardSummary({
          stats: data.stats || {
            totalOrders: 0,
            totalCustomers: 0,
            totalRevenue: 0,
            totalTables: 0,
            activeOrders: 0,
            readyOrders: 0,
            completedOrders: 0,
            reservations: 0,
          },
          tableStats: data.tableStats || {
            available: 0,
            occupied: 0,
            reserved: 0,
            cleaning: 0,
            outOfService: 0,
            total: 0,
          },
          recentOrders: data.recentOrders || [],
          orders: data.orders || [],
          customers: data.customers || [],
          tables: data.tables || [],
        });
      }
    } catch (err) {
      console.error("Dashboard summary fetch failed:", err);
    } finally {
      if (showLoading) setDashboardLoading(false);
    }
  }, [adminUser, myRestCode, myRestId, selectedRestaurantId]);

  useEffect(() => {
    fetchDashboardSummary(true);
    const interval = setInterval(() => fetchDashboardSummary(false), 12000);
    return () => clearInterval(interval);
  }, [fetchDashboardSummary]);

  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    setOrderUpdatingId(orderId);
    try {
      const res = await fetch(`${API_URL}/orders/${orderId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setDashboardSummary((prev) => {
          const updateItem = (o) =>
            o._id === orderId
              ? {
                  ...o,
                  status: newStatus,
                  payment: newStatus === "Completed" ? { ...(o.payment || {}), status: "Paid" } : o.payment,
                }
              : o;
          return {
            ...prev,
            orders: prev.orders.map(updateItem),
            recentOrders: prev.recentOrders.map(updateItem),
          };
        });
        fetchDashboardSummary();
      } else {
        alert(data.message || "Failed to update order status.");
      }
    } catch (err) {
      console.error("Error updating order status:", err);
      alert("Failed to update order status.");
    } finally {
      setOrderUpdatingId(null);
    }
  };

  const handleOpenAdminCreateOrder = () => {
    setAdminOrderError("");
    setAdminOrderSuccess("");
    setAdminOrderTable("");
    setAdminOrderCustomerName("");
    setAdminOrderCustomerPhone("");
    setAdminOrderCart([]);
    setAdminOrderCategory("All");
    setAdminOrderSearch("");
    setAdminOrderViewMode("grid");
    setAdminOrderDietFilter("All");
    setAdminOrderSuccessModal(null);
    setAdminOccupiedModal(null);
    if (!menuEntries.length) {
      fetchMenu();
    }
    fetchDashboardSummary();
    setShowAdminCreateOrderModal(true);
  };

  const handleAdminAddCartItem = (item) => {
    setAdminOrderCart((prev) => {
      const existing = prev.find((i) => i._id === item._id);
      if (existing) {
        return prev.map((i) => (i._id === item._id ? { ...i, quantity: i.quantity + 1 } : i));
      }
      return [
        ...prev,
        {
          _id: item._id,
          name: item.name,
          price: Number(item.price || 0),
          quantity: 1,
          type: item.type,
          selectedModifiers: [],
        },
      ];
    });
  };

  const handleAdminUpdateCartQty = (itemId, qty) => {
    setAdminOrderCart((prev) => {
      if (qty <= 0) return prev.filter((i) => i._id !== itemId);
      return prev.map((i) => (i._id === itemId ? { ...i, quantity: qty } : i));
    });
  };

  const handleAdminSubmitOrder = async (e) => {
    if (e) e.preventDefault();
    setAdminOrderError("");
    setAdminOrderSuccess("");

    if (!adminOrderTable) {
      setAdminOrderError("Please select a dining table from the dropdown above.");
      const tableSelect = document.querySelector(".admin-order-select");
      if (tableSelect) {
        tableSelect.focus();
        tableSelect.scrollIntoView({ behavior: "smooth", block: "center" });
      }
      return;
    }

    const targetTableObj = (dashboardSummary.tables || []).find(
      (t) => String(t.tableNumber).trim().toLowerCase() === String(adminOrderTable).trim().toLowerCase()
    );
    if (targetTableObj && ["Cleaning", "Out of Service"].includes(targetTableObj.status)) {
      setAdminOrderError(`⛔ Table ${adminOrderTable} is currently ${targetTableObj.status}. Please select another table.`);
      setAdminOccupiedModal({
        tableNumber: adminOrderTable,
        status: targetTableObj.status,
      });
      return;
    }

    if (!adminOrderCart.length) {
      setAdminOrderError("Please add at least one menu item to the order.");
      return;
    }

    const restIdToSend = isRestaurantAdmin
      ? (myRestId || adminUser?.restaurantId || myRestCode)
      : (selectedRestaurantId || (restaurants[0]?._id || ""));

    if (!restIdToSend) {
      setAdminOrderError("Restaurant identifier missing. Please refresh.");
      return;
    }

    setAdminOrderSubmitting(true);
    try {
      const response = await fetch(`${API_URL}/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          restaurantId: restIdToSend,
          tableNumber: adminOrderTable,
          customerName: adminOrderCustomerName.trim() || "Walk-in Customer",
          customerPhone: adminOrderCustomerPhone.trim(),
          items: adminOrderCart,
          source: "Admin",
        }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.message || "Failed to create order.");
      }

      const orderShortId = data.order?._id?.slice(-6)?.toUpperCase() || "NEW";
      const subtotal = adminOrderCart.reduce((s, i) => s + i.price * i.quantity, 0);
      const tax = Number((subtotal * 0.05).toFixed(2));
      const grandTotal = Number((subtotal + tax).toFixed(2));
      const totalCount = adminOrderCart.reduce((sum, i) => sum + i.quantity, 0);

      setAdminOrderSuccessModal({
        orderId: orderShortId,
        tableNumber: formatTableName(adminOrderTable),
        customerName: adminOrderCustomerName.trim() || "Walk-in Customer",
        customerPhone: adminOrderCustomerPhone.trim(),
        itemCount: totalCount,
        totalAmount: grandTotal,
      });

      setAdminOrderSuccess(data.isReorder ? `🎉 Reorder added to Order #${orderShortId} (${formatTableName(adminOrderTable)}) & sent to kitchen!` : `🎉 Order #${orderShortId} for ${formatTableName(adminOrderTable)} sent to kitchen!`);
      setAdminOrderCart([]);

      // Auto-refresh orders list in dashboard
      await fetchDashboardSummary();
    } catch (err) {
      console.error("Admin create order error:", err);
      setAdminOrderError(err.message || "Unable to place order.");
    } finally {
      setAdminOrderSubmitting(false);
    }
  };

  const handleUpdateTableStatus = async (tableId, newStatus) => {
    setTableUpdatingId(tableId);
    const targetTable = dashboardSummary.tables.find((t) => t._id === tableId);

    // Optimistically update table status and clear active orders if released
    setDashboardSummary((prev) => ({
      ...prev,
      tables: prev.tables.map((t) => (t._id === tableId ? { ...t, status: newStatus } : t)),
      orders: newStatus !== "Occupied"
        ? prev.orders.map((o) =>
            String(o.tableNumber).trim().toLowerCase() === String(targetTable?.tableNumber).trim().toLowerCase() &&
            ["New", "Preparing", "Ready", "Served"].includes(o.status)
              ? { ...o, status: "Completed" }
              : o
          )
        : prev.orders,
    }));

    try {
      const res = await fetch(`${API_URL}/orders/tables/${tableId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        fetchDashboardSummary();
      }
    } catch (err) {
      console.error("Update table status error:", err);
    } finally {
      setTableUpdatingId(null);
    }
  };

  // Open Add Table Modal with auto-calculated next table number
  const openAddTable = () => {
    setEditingTableId(null);
    const defaultRest = isRestaurantAdmin
      ? (myRestId || adminUser?.restaurantId || "")
      : (selectedRestaurantId || (restaurants[0]?._id || ""));

    let nextNum = 1;
    if (dashboardSummary.tables && dashboardSummary.tables.length > 0) {
      const numbers = dashboardSummary.tables
        .map((t) => {
          const match = String(t.tableNumber || "").match(/\d+/);
          return match ? parseInt(match[0], 10) : 0;
        })
        .filter((n) => !isNaN(n) && n > 0);
      if (numbers.length > 0) {
        nextNum = Math.max(...numbers) + 1;
      }
    }
    const suggestedName = `Table ${String(nextNum).padStart(2, "0")}`;

    setTableForm({
      restaurantId: defaultRest,
      tableNumber: suggestedName,
      capacity: 4,
      status: "Available",
    });
    setTableActionError("");
    setTableActionSuccess("");
    setShowAddTableModal(true);
  };

  const openEditTable = (table) => {
    setEditingTableId(table._id);
    const defaultRest = isRestaurantAdmin
      ? (myRestId || adminUser?.restaurantId || "")
      : (table.restaurantId || selectedRestaurantId || (restaurants[0]?._id || ""));

    setTableForm({
      restaurantId: defaultRest,
      tableNumber: table.tableNumber || "",
      capacity: table.capacity || 4,
      status: table.status || "Available",
    });
    setTableActionError("");
    setTableActionSuccess("");
    setShowAddTableModal(true);
  };

  // Create / Update Table Handler
  const handleCreateTable = async (e) => {
    e.preventDefault();
    setTableActionLoading(true);
    setTableActionError("");
    setTableActionSuccess("");

    try {
      const restIdToSend = isRestaurantAdmin
        ? (myRestId || adminUser?.restaurantId)
        : tableForm.restaurantId;

      if (!restIdToSend) {
        throw new Error("Please select a target restaurant.");
      }
      if (!tableForm.tableNumber.trim()) {
        throw new Error("Table Number or Name is required.");
      }

      const isEditing = Boolean(editingTableId);
      const url = isEditing
        ? `${API_URL}/tables/${editingTableId}`
        : `${API_URL}/tables`;
      const method = isEditing ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          restaurantId: restIdToSend,
          tableNumber: tableForm.tableNumber.trim(),
          capacity: Number(tableForm.capacity) || 4,
          status: tableForm.status || "Available",
        }),
      });

      const data = await res.json();
      if (!res.ok || data.success === false) {
        throw new Error(data.message || `Failed to ${isEditing ? "update" : "add"} table.`);
      }

      setTableActionSuccess(
        `🎉 Table "${tableForm.tableNumber}" ${isEditing ? "updated" : "added"} successfully!`
      );
      await fetchDashboardSummary(false);
      setTimeout(() => {
        setShowAddTableModal(false);
        setEditingTableId(null);
        setTableActionSuccess("");
      }, 1200);
    } catch (err) {
      setTableActionError(err.message || "Failed to save table.");
    } finally {
      setTableActionLoading(false);
    }
  };

  // Delete Table Handler
  const handleDeleteTable = async (tableId, tableName) => {
    if (!window.confirm(`Are you sure you want to delete ${tableName || "this table"}?`)) {
      return;
    }
    setTableDeletingId(tableId);
    try {
      const res = await fetch(`${API_URL}/tables/${tableId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok || data.success === false) {
        throw new Error(data.message || "Failed to delete table.");
      }
      await fetchDashboardSummary(false);
    } catch (err) {
      alert(err.message || "Failed to delete table.");
    } finally {
      setTableDeletingId(null);
    }
  };

  // ================= RESERVATIONS HANDLERS =================

  const PRESET_TIME_SLOTS = [
    "12:30 PM",
    "01:00 PM",
    "01:30 PM",
    "02:00 PM",
    "07:00 PM",
    "07:30 PM",
    "08:00 PM",
    "08:30 PM",
    "09:00 PM",
    "09:30 PM",
  ];

  const getTableAvailabilityNote = (table, selectedDate, currentResId = null) => {
    const booking = reservations.find((r) =>
      r._id !== currentResId &&
      r.reservationDate === selectedDate &&
      ["Confirmed", "Seated"].includes(r.status) &&
      String(r.tableNumber || "").trim().toLowerCase() === String(table.tableNumber || "").trim().toLowerCase()
    );
    if (booking) {
      return `⚠️ Booked at ${booking.reservationTime} (${booking.customerName})`;
    }
    if (table.status === "Occupied") {
      return `🔴 Floor Occupied`;
    }
    return `🟢 Free / Available`;
  };

  const fetchReservations = useCallback(async (isSilent = false) => {
    try {
      if (!isSilent) setReservationsLoading(true);
      const restParam = isRestaurantAdmin
        ? (myRestCode || myRestId || "")
        : (selectedRestaurantId || "");
      const res = await fetch(`${API_URL}/reservations${restParam ? `?restaurantId=${encodeURIComponent(restParam)}` : ""}`);
      const data = await res.json();
      if (res.ok && data.success) {
        setReservations(data.reservations || []);
        if (data.stats) {
          setReservationStats(data.stats);
        }
      }
    } catch (err) {
      console.error("Fetch reservations error:", err);
    } finally {
      if (!isSilent) setReservationsLoading(false);
    }
  }, [isRestaurantAdmin, myRestCode, myRestId, selectedRestaurantId]);

  // Live Auto-Refresh Polling for Real-Time Synchronization (Silent Background Refresh)
  useEffect(() => {
    fetchReservations(false);
    const interval = setInterval(() => {
      if (!showAddReservationModal && !showEditReservationModal) {
        fetchReservations(true);
      }
    }, 15000);
    return () => clearInterval(interval);
  }, [fetchReservations, showAddReservationModal, showEditReservationModal]);

  const openAddReservation = () => {
    const defaultRest = isRestaurantAdmin
      ? (myRestId || adminUser?.restaurantId || "")
      : (selectedRestaurantId || (restaurants[0]?._id || ""));
    const today = new Date().toISOString().split("T")[0];

    const firstFreeTable = dashboardSummary.tables?.find((t) => t.status === "Available")?.tableNumber || "";

    setReservationForm({
      restaurantId: defaultRest,
      customerName: "",
      customerPhone: "",
      customerEmail: "",
      guestsCount: 2,
      reservationDate: today,
      reservationTime: "07:30 PM",
      tableNumber: firstFreeTable,
      specialRequest: "",
      status: "Confirmed",
    });
    setReservationActionError("");
    setReservationActionSuccess("");
    setShowAddReservationModal(true);
  };

  const handleCreateReservation = async (e) => {
    e.preventDefault();
    setReservationActionLoading(true);
    setReservationActionError("");
    setReservationActionSuccess("");

    try {
      const restIdToSend = isRestaurantAdmin
        ? (myRestId || adminUser?.restaurantId)
        : reservationForm.restaurantId;

      if (!restIdToSend) {
        throw new Error("Please select a target restaurant.");
      }
      if (!reservationForm.customerName.trim() || !reservationForm.customerPhone.trim()) {
        throw new Error("Guest name and phone number are required.");
      }
      if (!reservationForm.reservationDate || !reservationForm.reservationTime) {
        throw new Error("Reservation date and time are required.");
      }

      const res = await fetch(`${API_URL}/reservations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          restaurantId: restIdToSend,
          customerName: reservationForm.customerName.trim(),
          customerPhone: reservationForm.customerPhone.trim(),
          customerEmail: reservationForm.customerEmail.trim(),
          guestsCount: Number(reservationForm.guestsCount) || 2,
          reservationDate: reservationForm.reservationDate,
          reservationTime: reservationForm.reservationTime,
          tableNumber: reservationForm.tableNumber,
          specialRequest: reservationForm.specialRequest.trim(),
          status: reservationForm.status || "Confirmed",
        }),
      });

      const data = await res.json();
      if (!res.ok || data.success === false) {
        throw new Error(data.message || "Failed to create reservation.");
      }

      setReservationActionSuccess(`🎉 Reservation for "${reservationForm.customerName}" confirmed!`);
      await fetchReservations();
      await fetchDashboardSummary();
      setTimeout(() => {
        setShowAddReservationModal(false);
        setReservationActionSuccess("");
      }, 1200);
    } catch (err) {
      setReservationActionError(err.message || "Failed to create reservation.");
    } finally {
      setReservationActionLoading(false);
    }
  };

  const openEditReservation = (item) => {
    setEditingReservation(item);
    setEditReservationForm({
      _id: item._id,
      restaurantId: item.restaurantId?._id || item.restaurantId || "",
      customerName: item.customerName || "",
      customerPhone: item.customerPhone || "",
      customerEmail: item.customerEmail || "",
      guestsCount: item.guestsCount || 2,
      reservationDate: item.reservationDate || new Date().toISOString().split("T")[0],
      reservationTime: item.reservationTime || "07:30 PM",
      tableNumber: item.tableNumber || "",
      specialRequest: item.specialRequest || "",
      status: item.status || "Confirmed",
      source: item.source || "Admin",
    });
    setReservationActionError("");
    setReservationActionSuccess("");
    setShowEditReservationModal(true);
  };

  const handleUpdateReservation = async (e) => {
    e.preventDefault();
    setReservationActionLoading(true);
    setReservationActionError("");
    setReservationActionSuccess("");

    try {
      if (!editReservationForm.customerName.trim() || !editReservationForm.customerPhone.trim()) {
        throw new Error("Guest name and phone number are required.");
      }
      if (!editReservationForm.reservationDate || !editReservationForm.reservationTime) {
        throw new Error("Reservation date and time are required.");
      }

      const res = await fetch(`${API_URL}/reservations/${editReservationForm._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: editReservationForm.customerName.trim(),
          customerPhone: editReservationForm.customerPhone.trim(),
          customerEmail: editReservationForm.customerEmail.trim(),
          guestsCount: Number(editReservationForm.guestsCount) || 2,
          reservationDate: editReservationForm.reservationDate,
          reservationTime: editReservationForm.reservationTime,
          tableNumber: editReservationForm.tableNumber,
          specialRequest: editReservationForm.specialRequest.trim(),
          status: editReservationForm.status || "Confirmed",
          source: editReservationForm.source || "Admin",
        }),
      });

      const data = await res.json();
      if (!res.ok || data.success === false) {
        throw new Error(data.message || "Failed to update reservation.");
      }

      setReservationActionSuccess(`✨ Reservation for "${editReservationForm.customerName}" updated!`);
      await fetchReservations();
      await fetchDashboardSummary();
      setTimeout(() => {
        setShowEditReservationModal(false);
        setReservationActionSuccess("");
      }, 1000);
    } catch (err) {
      setReservationActionError(err.message || "Failed to update reservation.");
    } finally {
      setReservationActionLoading(false);
    }
  };


  const handleUpdateReservationStatus = async (reservationId, nextStatus) => {
    try {
      const res = await fetch(`${API_URL}/reservations/${reservationId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        await fetchReservations();
        await fetchDashboardSummary();
      } else {
        alert(data.message || "Failed to update reservation status.");
      }
    } catch (err) {
      console.error("Error updating reservation status:", err);
      alert("Failed to update reservation status.");
    }
  };

  const handleDeleteReservation = async (reservationId, guestName) => {
    if (!window.confirm(`Are you sure you want to cancel and delete the reservation for ${guestName}?`)) {
      return;
    }
    try {
      const res = await fetch(`${API_URL}/reservations/${reservationId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (res.ok && data.success) {
        await fetchReservations();
        await fetchDashboardSummary();
      } else {
        alert(data.message || "Failed to delete reservation.");
      }
    } catch (err) {
      console.error("Error deleting reservation:", err);
      alert("Failed to delete reservation.");
    }
  };

  // Open modal helpers

  const openAddManager = () => {
    const defaultRest = isRestaurantAdmin
      ? (myRestId || adminUser?.restaurantId || "")
      : (selectedRestaurantId || (restaurants[0]?._id || ""));
    setManagerForm({
      restaurantId: defaultRest,
      name: "",
      email: "",
      password: "",
      phone: "",
    });
    setStaffActionError("");
    setStaffActionSuccess("");
    setShowAddManagerModal(true);
  };

  const openAddWaiter = () => {
    const defaultRest = isRestaurantAdmin
      ? (myRestId || adminUser?.restaurantId || "")
      : (selectedRestaurantId || (restaurants[0]?._id || ""));
    setWaiterForm({
      restaurantId: defaultRest,
      name: "",
      email: "",
      password: "",
      phone: "",
      gender: "Male",
      address: "",
    });
    setStaffActionError("");
    setStaffActionSuccess("");
    setShowAddWaiterModal(true);
  };

  const openAddChef = () => {
    const defaultRest = isRestaurantAdmin
      ? (myRestId || adminUser?.restaurantId || "")
      : (selectedRestaurantId || (restaurants[0]?._id || ""));
    setChefForm({
      restaurantId: defaultRest,
      name: "",
      email: "",
      password: "",
      phone: "",
      speciality: "Head Chef",
      shift: "Full Day",
    });
    setStaffActionError("");
    setStaffActionSuccess("");
    setShowAddChefModal(true);
  };

  const openAddCleaner = () => {
    const defaultRest = isRestaurantAdmin
      ? (myRestId || adminUser?.restaurantId || "")
      : (selectedRestaurantId || (restaurants[0]?._id || ""));
    setCleanerForm({
      restaurantId: defaultRest,
      name: "",
      email: "",
      password: "",
      phone: "",
      assignedArea: "Dining Hall & Tables",
      shift: "Full Day",
    });
    setStaffActionError("");
    setStaffActionSuccess("");
    setShowAddCleanerModal(true);
  };

  // Open Edit Staff Modal
  const openEditStaff = (type, staffData) => {
    setEditingStaff({ type, data: staffData });
    if (type === "manager") {
      setEditStaffForm({ name: staffData.name || "", email: staffData.email || "", phone: staffData.phone || "" });
    } else if (type === "waiter") {
      setEditStaffForm({ name: staffData.name || "", email: staffData.email || "", phone: staffData.phone || "", gender: staffData.gender || "Male", address: staffData.address || "" });
    } else if (type === "chef") {
      setEditStaffForm({ name: staffData.name || "", email: staffData.email || "", phone: staffData.phone || "", speciality: staffData.speciality || "Head Chef", shift: staffData.shift || "Full Day" });
    } else if (type === "cleaner") {
      setEditStaffForm({ name: staffData.name || "", email: staffData.email || "", phone: staffData.phone || "", assignedArea: staffData.assignedArea || "Dining Hall & Tables", shift: staffData.shift || "Full Day" });
    }
    setEditStaffError("");
    setEditStaffSuccess("");
  };

  // Handle Update Staff
  const handleUpdateStaff = async (e) => {
    e.preventDefault();
    if (!editingStaff) return;
    setEditStaffLoading(true);
    setEditStaffError("");
    setEditStaffSuccess("");
    try {
      const { type, data } = editingStaff;
      const urlMap = { manager: "managers", waiter: "waiters", chef: "chefs", cleaner: "cleaners" };
      const endpoint = `${API_URL}/${urlMap[type]}/${data._id}`;
      const res = await fetch(endpoint, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editStaffForm),
      });
      const result = await res.json();
      if (!res.ok || result.success === false) throw new Error(result.message || "Update failed.");
      setEditStaffSuccess("Updated successfully!");
      await fetchStaff();
      setTimeout(() => {
        setEditingStaff(null);
        setEditStaffSuccess("");
      }, 1200);
    } catch (err) {
      setEditStaffError(err.message || "Update failed.");
    } finally {
      setEditStaffLoading(false);
    }
  };

  // Create Manager Handler
  const handleCreateManager = async (e) => {
    e.preventDefault();
    setStaffActionLoading(true);
    setStaffActionError("");
    setStaffActionSuccess("");

    try {
      const restIdToSend = isRestaurantAdmin
        ? (myRestId || adminUser?.restaurantId)
        : managerForm.restaurantId;

      if (!restIdToSend) {
        throw new Error("Please select a restaurant.");
      }
      if (!managerForm.name.trim() || !managerForm.email.trim() || !managerForm.password.trim()) {
        throw new Error("Full name, email, and password are required.");
      }

      const res = await fetch(`${API_URL}/managers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          restaurantId: restIdToSend,
          name: managerForm.name.trim(),
          email: managerForm.email.trim(),
          password: managerForm.password,
          phone: managerForm.phone.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok || data.success === false) {
        throw new Error(data.message || "Failed to create manager.");
      }

      setStaffActionSuccess(`Manager "${managerForm.name}" created successfully! (ID: ${data.manager?.managerId || "Generated"})`);
      await fetchStaff();
      setTimeout(() => {
        setShowAddManagerModal(false);
        setStaffActionSuccess("");
      }, 1400);
    } catch (err) {
      setStaffActionError(err.message || "Failed to create manager.");
    } finally {
      setStaffActionLoading(false);
    }
  };

  // Create Waiter Handler
  const handleCreateWaiter = async (e) => {
    e.preventDefault();
    setStaffActionLoading(true);
    setStaffActionError("");
    setStaffActionSuccess("");

    try {
      const restIdToSend = isRestaurantAdmin
        ? (myRestId || adminUser?.restaurantId)
        : waiterForm.restaurantId;

      if (!restIdToSend) {
        throw new Error("Please select a restaurant.");
      }
      if (!waiterForm.name.trim() || !waiterForm.password.trim()) {
        throw new Error("Full name and password are required.");
      }

      const res = await fetch(`${API_URL}/waiters/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          restaurantId: restIdToSend,
          name: waiterForm.name.trim(),
          email: waiterForm.email.trim(),
          password: waiterForm.password,
          phone: waiterForm.phone.trim(),
          gender: waiterForm.gender,
          address: waiterForm.address.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok || data.success === false) {
        throw new Error(data.message || "Failed to create waiter.");
      }

      setStaffActionSuccess(`Waiter "${waiterForm.name}" created successfully! (ID: ${data.waiter?.waiterId || "Generated"})`);
      await fetchStaff();
      setTimeout(() => {
        setShowAddWaiterModal(false);
        setStaffActionSuccess("");
      }, 1400);
    } catch (err) {
      setStaffActionError(err.message || "Failed to create waiter.");
    } finally {
      setStaffActionLoading(false);
    }
  };

  // Create Chef Handler
  const handleCreateChef = async (e) => {
    e.preventDefault();
    setStaffActionLoading(true);
    setStaffActionError("");
    setStaffActionSuccess("");

    try {
      const restIdToSend = isRestaurantAdmin
        ? (myRestId || adminUser?.restaurantId)
        : chefForm.restaurantId;

      if (!restIdToSend) {
        throw new Error("Please select a restaurant.");
      }
      if (!chefForm.name.trim() || !chefForm.password.trim()) {
        throw new Error("Full name and password are required.");
      }

      const res = await fetch(`${API_URL}/chefs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          restaurantId: restIdToSend,
          name: chefForm.name.trim(),
          email: chefForm.email.trim(),
          password: chefForm.password,
          phone: chefForm.phone.trim(),
          speciality: chefForm.speciality,
          shift: chefForm.shift,
        }),
      });

      const data = await res.json();
      if (!res.ok || data.success === false) {
        throw new Error(data.message || "Failed to create chef.");
      }

      setStaffActionSuccess(`Chef "${chefForm.name}" created successfully! (ID: ${data.chef?.chefId || "Generated"})`);
      await fetchStaff();
      setTimeout(() => {
        setShowAddChefModal(false);
        setStaffActionSuccess("");
      }, 1400);
    } catch (err) {
      setStaffActionError(err.message || "Failed to create chef.");
    } finally {
      setStaffActionLoading(false);
    }
  };

  // Create Cleaner Handler
  const handleCreateCleaner = async (e) => {
    e.preventDefault();
    setStaffActionLoading(true);
    setStaffActionError("");
    setStaffActionSuccess("");

    try {
      const restIdToSend = isRestaurantAdmin
        ? (myRestId || adminUser?.restaurantId)
        : cleanerForm.restaurantId;

      if (!restIdToSend) {
        throw new Error("Please select a restaurant.");
      }
      if (!cleanerForm.name.trim() || !cleanerForm.password.trim()) {
        throw new Error("Cleaner name and password are required.");
      }

      const res = await fetch(`${API_URL}/cleaners`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          restaurantId: restIdToSend,
          name: cleanerForm.name.trim(),
          email: cleanerForm.email.trim(),
          password: cleanerForm.password,
          phone: cleanerForm.phone.trim(),
          assignedArea: cleanerForm.assignedArea,
          shift: cleanerForm.shift,
        }),
      });

      const data = await res.json();
      if (!res.ok || data.success === false) {
        throw new Error(data.message || "Failed to create cleaner.");
      }

      setStaffActionSuccess(`Cleaner "${cleanerForm.name}" created successfully! (ID: ${data.cleaner?.cleanerId || "Generated"})`);
      await fetchStaff();
      setTimeout(() => {
        setShowAddCleanerModal(false);
        setStaffActionSuccess("");
      }, 1400);
    } catch (err) {
      setStaffActionError(err.message || "Failed to create cleaner.");
    } finally {
      setStaffActionLoading(false);
    }
  };

  // Toggle Staff Status (Active <-> Inactive)
  const handleToggleStaffStatus = async (type, id, currentStatus) => {
    const isCurrentlyActive = (currentStatus || "Active").toLowerCase() === "active";
    const nextStatus = isCurrentlyActive ? "Inactive" : "Active";
    setStatusUpdatingId(id);

    // Optimistically update local UI state immediately
    if (type === "manager") {
      setManagers((prev) =>
        prev.map((m) => (m._id === id ? { ...m, status: nextStatus } : m))
      );
    } else if (type === "waiter") {
      setWaiters((prev) =>
        prev.map((w) => (w._id === id ? { ...w, status: nextStatus } : w))
      );
    } else if (type === "chef") {
      setChefs((prev) =>
        prev.map((c) => (c._id === id ? { ...c, status: nextStatus } : c))
      );
    } else if (type === "cleaner") {
      setCleaners((prev) =>
        prev.map((cl) => (cl._id === id ? { ...cl, status: nextStatus } : cl))
      );
    } else if (type === "user") {
      setRestaurants((prev) =>
        prev.map((r) => (r._id === id ? { ...r, status: nextStatus } : r))
      );
    }

    try {
      const endpoint =
        type === "manager"
          ? `managers/${id}/status`
          : type === "waiter"
          ? `waiters/${id}/status`
          : type === "chef"
          ? `chefs/${id}/status`
          : type === "cleaner"
          ? `cleaners/${id}/status`
          : `restaurants/${id}/status`;

      const res = await fetch(`${API_URL}/${endpoint}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });

      const data = await res.json();
      if (!res.ok || data.success === false) {
        throw new Error(data.message || "Failed to update staff status.");
      }
    } catch (err) {
      console.error("Toggle staff status error:", err);
      alert(`Could not update status: ${err.message}`);
      // Revert optimistic update on failure
      const prevStatus = isCurrentlyActive ? "Active" : "Inactive";
      if (type === "manager") {
        setManagers((prev) =>
          prev.map((m) => (m._id === id ? { ...m, status: prevStatus } : m))
        );
      } else if (type === "waiter") {
        setWaiters((prev) =>
          prev.map((w) => (w._id === id ? { ...w, status: prevStatus } : w))
        );
      } else if (type === "chef") {
        setChefs((prev) =>
          prev.map((c) => (c._id === id ? { ...c, status: prevStatus } : c))
        );
      } else if (type === "cleaner") {
        setCleaners((prev) =>
          prev.map((cl) => (cl._id === id ? { ...cl, status: prevStatus } : cl))
        );
      } else if (type === "user") {
        setRestaurants((prev) =>
          prev.map((r) => (r._id === id ? { ...r, status: prevStatus } : r))
        );
      }
    } finally {
      setStatusUpdatingId(null);
    }
  };


  const fetchMenu = useCallback(async () => {
    try {
      setMenuLoading(true);
      const restParam = isRestaurantAdmin
        ? (myRestCode || myRestId || "")
        : (selectedRestaurantId || "");
      const url = restParam
        ? `${API_URL}/menu?restaurantId=${encodeURIComponent(restParam)}`
        : `${API_URL}/menu`;
      const response = await fetch(url);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to fetch menu items.");
      }

      const allItems = Array.isArray(data) ? data : data.items || [];
      if (isRestaurantAdmin) {
        const filtered = allItems.filter((item) => {
          const itemRestId = String(item.restaurantId?._id || item.restaurantId?.id || item.restaurantId || "");
          const itemRestCode = String(item.restaurantId?.restaurantId || "").toUpperCase();
          return (myRestId && itemRestId === myRestId) || (myRestCode && (itemRestCode === myRestCode || itemRestId === myRestCode));
        });
        setMenuEntries(filtered);
      } else {
        setMenuEntries(allItems);
      }
    } catch (error) {
      console.error("Fetch Menu Error:", error);
      setMenuError(error.message || "Unable to load menu items.");
    } finally {
      setMenuLoading(false);
    }
  }, [isRestaurantAdmin, myRestCode, myRestId, selectedRestaurantId]);

  useEffect(() => {
    fetchMenu();
  }, [fetchMenu]);

  const getRestaurantStatus = (restaurant) =>
    restaurant.status?.trim().toLowerCase() === "inactive"
      ? "Inactive"
      : "Active";
  const activeRestaurants = restaurants.filter(
    (restaurant) => getRestaurantStatus(restaurant) === "Active"
  );
  const inactiveRestaurants = restaurants.filter(
    (restaurant) => getRestaurantStatus(restaurant) === "Inactive"
  );
  const isRestaurantView = [
    "Restaurants",
    "All Restaurants",
    "Active",
    "Inactive",
  ].includes(activeMenu);
  const visibleRestaurants =
    activeMenu === "Active"
      ? activeRestaurants
      : activeMenu === "Inactive"
        ? inactiveRestaurants
        : restaurants;
  const isVeg = (item) =>
    (item.type || "Veg").toLowerCase() === "veg" &&
    !(item.category || "").toLowerCase().includes("non-veg");

  const isNonVeg = (item) =>
    (item.type || "").toLowerCase() === "non-veg" ||
    (item.category || "").toLowerCase().includes("non-veg");

  const vegItems = menuEntries.filter(isVeg);
  const nonVegItems = menuEntries.filter(isNonVeg);

  const vegSubCategories = [...new Set(vegItems.map((item) => item.category).filter(Boolean))];
  const nonVegSubCategories = [...new Set(nonVegItems.map((item) => item.category).filter(Boolean))];
  const allSubCategories = [...new Set(menuEntries.map((item) => item.category).filter(Boolean))];

  const isMenuView = [
    "Menu",
    "All Items",
    "Veg",
    "Non-Veg",
    "Categories",
    "Items",
    "Modifiers",
    "Availability",
    ...allSubCategories,
  ].includes(activeMenu) || !!subCategoryFilter;
  const isStaffView = ["Staff", "Managers", "Waiters", "Chefs", "Cleaners", "Users"].includes(activeMenu);
  const isOrdersView = [
    "Orders",
    "All Orders",
    "New Orders",
    "Preparing",
    "Completed",
    "Kitchen",
  ].includes(activeMenu);
  const isCustomersView = ["Customers"].includes(activeMenu);
  const isTableManagementView = [
    "Table Management",
    "Available",
    "Occupied",
    "Reserved",
    "Cleaning",
    "Out of Service",
  ].includes(activeMenu);
  const isReservationsView = ["Reservations"].includes(activeMenu);
  const isQRManagementView = [
    "QR Management",
    "QR Code",
    "qr-management",
    "Qr-management",
    "QR-Management",
    "qr_management",
  ].includes(activeMenu);
  const isSettingsView = ["Settings"].includes(activeMenu);

  const currentDiet =
    activeMenu === "Veg"
      ? "Veg"
      : activeMenu === "Non-Veg"
      ? "Non-Veg"
      : dietFilter;

  const activeSubCategories =
    currentDiet === "Veg"
      ? vegSubCategories
      : currentDiet === "Non-Veg"
      ? nonVegSubCategories
      : allSubCategories;

  const categoryCards = [
    { name: "Veg", filter: "type" },
    { name: "Non-Veg", filter: "type" },
    ...allSubCategories.map((name) => ({ name, filter: "category" })),
  ];

  const availableMenuEntries = menuEntries.filter(
    (item) => item.inStock !== false && item.status?.toLowerCase() !== "unavailable"
  );

  const rawDisplayedMenuEntries =
    activeMenu === "Availability"
      ? availableMenuEntries
      : menuEntries.filter((item) => {
          if (currentDiet === "Veg" && !isVeg(item)) return false;
          if (currentDiet === "Non-Veg" && !isNonVeg(item)) return false;
          if (subCategoryFilter && item.category !== subCategoryFilter) return false;
          return true;
        });

  // When viewing "All Items" (or any mixed view), display Veg items first followed by Non-Veg items
  const displayedMenuEntries =
    currentDiet === "All"
      ? [...rawDisplayedMenuEntries].sort((a, b) => {
          const aVeg = isVeg(a) ? 0 : 1;
          const bVeg = isVeg(b) ? 0 : 1;
          return aVeg - bVeg;
        })
      : rawDisplayedMenuEntries;

  const searchedMenuEntries = displayedMenuEntries.filter((item) => {
    const query = menuSearch.trim().toLowerCase();
    if (!query) return true;

    return [item.name, item.category, item.type, item.description]
      .filter(Boolean)
      .some((value) => value.toLowerCase().includes(query));
  });

  const handleMenuClick = (item) => {
    setActiveMenu(item.name);

    if (item.name === "Menu" || item.name === "All Items") {
      setDietFilter("All");
      setSubCategoryFilter("");
    }

    if (item.children) {
      setOpenMenu(
        openMenu === item.name ? null : item.name
      );
      return;
    }

    if (item.path) {
      navigate(item.path);
    }
  };

  const handleSubMenuClick = (parent, child) => {
    setActiveMenu(child);
    if (parent === "Menu") {
      setSubCategoryFilter("");
      if (child === "All Items" || child === "Items") {
        setDietFilter("All");
      } else if (child === "Veg") {
        setDietFilter("Veg");
      } else if (child === "Non-Veg") {
        setDietFilter("Non-Veg");
      }
    }
    console.log(`${parent} > ${child}`);
  };

  const handleModifierSubmit = async (event) => {
    event.preventDefault();
    setModifierError("");

    try {
      setModifierSaving(true);
      const response = await fetch(`${API_URL}/menu/modifiers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: modifierForm.name,
          priceAdjustment: Number(modifierForm.priceAdjustment || 0),
        }),
      });
      const contentType = response.headers.get("content-type") || "";

      if (!contentType.includes("application/json")) {
        throw new Error(
          "Modifier API is unavailable. Restart the backend server and try again."
        );
      }
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to add modifier.");
      }

      setModifiers((current) => [data.modifier, ...current]);
      setModifierForm({ name: "", priceAdjustment: "0" });
    } catch (error) {
      setModifierError(error.message || "Failed to add modifier.");
    } finally {
      setModifierSaving(false);
    }
  };

  const handleModifierDelete = async (id) => {
    try {
      const response = await fetch(
        `${API_URL}/menu/modifiers/${id}`,
        { method: "DELETE" }
      );
      const contentType = response.headers.get("content-type") || "";

      if (!contentType.includes("application/json")) {
        throw new Error(
          "Modifier API is unavailable. Restart the backend server and try again."
        );
      }
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to delete modifier.");
      }

      setModifiers((current) => current.filter((modifier) => modifier._id !== id));
    } catch (error) {
      setModifierError(error.message || "Failed to delete modifier.");
    }
  };

  const handleMenuItemChange = (event) => {
    const { name, value, checked, type } = event.target;
    setNewMenuItem((current) => {
      const next = {
        ...current,
        [name]: type === "checkbox" ? checked : value,
      };
      if (name === "category" && value.toLowerCase().includes("non-veg")) {
        next.type = "Non-Veg";
      }
      return next;
    });
  };

  const handleImageFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setMenuItemError("Please select a valid image file (PNG, JPG, JPEG, WEBP).");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const MAX_DIM = 800;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_DIM) {
            height = Math.round((height * MAX_DIM) / width);
            width = MAX_DIM;
          }
        } else {
          if (height > MAX_DIM) {
            width = Math.round((width * MAX_DIM) / height);
            height = MAX_DIM;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
        setNewMenuItem((prev) => ({ ...prev, image: dataUrl }));
        setMenuItemError("");
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  const handleAddMenuItem = async (event) => {
    event.preventDefault();
    setMenuItemError("");

    try {
      setMenuItemSaving(true);
      const response = await fetch(
        editingMenuItem
          ? `${API_URL}/menu/${editingMenuItem._id}`
          : `${API_URL}/menu`,
        {
        method: editingMenuItem ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...newMenuItem,
          price: Number(newMenuItem.price),
          status: newMenuItem.inStock ? "Available" : "Unavailable",
          restaurantId: editingMenuItem
            ? (editingMenuItem.restaurantId || adminUser?._id || adminUser?.id || adminUser?.restaurantId || null)
            : (adminUser?._id || adminUser?.id || adminUser?.restaurantId || null),
        }),
        }
      );
      const contentType = response.headers.get("content-type") || "";

      if (!contentType.includes("application/json")) {
        throw new Error("Menu API is unavailable. Restart the backend server and try again.");
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to add menu item.");
      }

      setMenuEntries((current) =>
        editingMenuItem
          ? current.map((item) =>
              item._id === data.item._id ? data.item : item
            )
          : [data.item, ...current]
      );
      setNewMenuItem({
        name: "",
        category: "Starters",
        price: "",
        description: "",
        image: "",
        type: "Veg",
        inStock: true,
      });
      setShowAddMenuForm(false);
      setEditingMenuItem(null);
      setActiveMenu("Menu");
    } catch (error) {
      setMenuItemError(error.message || "Failed to add menu item.");
    } finally {
      setMenuItemSaving(false);
    }
  };

  const resetMenuForm = () => {
    setNewMenuItem({
      name: "", category: "Starters", price: "", description: "",
      image: "", type: "Veg", inStock: true,
    });
    setEditingMenuItem(null);
    setMenuItemError("");
    setShowAddMenuForm(false);
  };

  const handleToggleMenuStock = async (item) => {
    const isCurrentlyAvailable = item.inStock !== false && item.status?.toLowerCase() !== "unavailable";
    const nextInStock = !isCurrentlyAvailable;
    const nextStatus = nextInStock ? "Available" : "Unavailable";

    try {
      setMenuEntries((current) =>
        current.map((entry) =>
          entry._id === item._id
            ? { ...entry, inStock: nextInStock, status: nextStatus }
            : entry
        )
      );

      const response = await fetch(`${API_URL}/menu/${item._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          inStock: nextInStock,
          status: nextStatus,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update status");
      }

      const data = await response.json();
      if (data.item) {
        setMenuEntries((current) =>
          current.map((entry) =>
            entry._id === data.item._id ? data.item : entry
          )
        );
      }
    } catch (error) {
      console.error("Toggle stock error:", error);
      setMenuEntries((current) =>
        current.map((entry) =>
          entry._id === item._id
            ? { ...entry, inStock: isCurrentlyAvailable, status: isCurrentlyAvailable ? "Available" : "Unavailable" }
            : entry
        )
      );
      alert("Failed to update item availability. Please try again.");
    }
  };

  const handleEditMenuItem = (item) => {
    const isAvailable = item.inStock !== false && item.status?.toLowerCase() !== "unavailable";
    setNewMenuItem({
      name: item.name || "",
      category: item.category || "Starters",
      price: item.price ?? "",
      description: item.description || "",
      image: item.image || "",
      type: item.type || "Veg",
      inStock: isAvailable,
      status: isAvailable ? "Available" : "Unavailable",
    });
    setEditingMenuItem(item);
    setMenuItemError("");
    setShowAddMenuForm(true);
  };

  const handleDeleteMenuItem = async (item) => {
    if (!window.confirm(`Delete "${item.name}"? This cannot be undone.`)) return;

    try {
      const response = await fetch(`${API_URL}/menu/${item._id}`, {
        method: "DELETE",
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to delete menu item.");
      }

      setMenuEntries((current) =>
        current.filter((menuItem) => menuItem._id !== item._id)
      );
    } catch (error) {
      setMenuItemError(error.message || "Failed to delete menu item.");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("admin");
    localStorage.removeItem("adminInfo");
    localStorage.removeItem("adminToken");
    localStorage.removeItem("authUser");
    localStorage.removeItem("authToken");
    localStorage.removeItem("superAdmin");
    localStorage.removeItem("restaurantAdmin");

    navigate("/login", { replace: true });
  };

  const closeMobileNav = () => setMobileNavOpen(false);

  return (
    <div className="admin-layout">

      {/* MOBILE OVERLAY */}
      {mobileNavOpen && (
        <div className="mobile-nav-overlay" onClick={closeMobileNav} />
      )}

      {/* ================= SIDEBAR ================= */}

      <aside className={`admin-sidebar${mobileNavOpen ? " mobile-open" : ""}`}>

        <div className="admin-brand">
          <div className="brand-logo">
            🍽️
          </div>

          <div>
            <h2>{adminUser?.restaurantName || "Food Admin"}</h2>
            <span>Administration</span>
          </div>
        </div>

        <div className="sidebar-menu">

          {menuItems
            .filter(
              (item) =>
                item.name !== "Add Restaurant" &&
                item.name !== "Restaurants"
            )
            .map((item) => (
            <div
              className="menu-wrapper"
              key={item.name}
            >

              <button
                className={`sidebar-item ${
                  activeMenu === item.name ||
                  (item.children && item.children.includes(activeMenu)) ||
                  (item.name === "Menu" && isMenuView)
                    ? "active"
                    : ""
                }`}
                onClick={() => {
                  handleMenuClick(item);
                  if (!item.children) closeMobileNav();
                }}
              >

                <span className="menu-icon">
                  {item.icon}
                </span>

                <span className="menu-name">
                  {item.name}
                </span>

                {item.name === "Reservations" && (reservationStats?.today || 0) > 0 && (
                  <span className="sidebar-pill-count" title="Today's Bookings">
                    {reservationStats.today}
                  </span>
                )}


                {item.children && (
                  <span className="menu-arrow">
                    {openMenu === item.name
                      ? "⌄"
                      : "›"}
                  </span>
                )}

              </button>

              {/* SUB MENU */}

              {item.children &&
                openMenu === item.name && (
                  <div className="submenu">
                    {item.name === "Menu" ? (
                      <>
                        {/* All Items */}
                        <button
                          className={
                            activeMenu === "All Items" || (currentDiet === "All" && !subCategoryFilter && isMenuView)
                              ? "submenu-active"
                              : ""
                          }
                          onClick={() => {
                            setActiveMenu("All Items");
                            setDietFilter("All");
                            setSubCategoryFilter("");
                            setOpenSubMenu(null);
                            closeMobileNav();
                          }}
                        >
                          All Items
                        </button>

                        {/* Veg Header & Subcategories */}
                        <button
                          className={`submenu-expandable ${
                            currentDiet === "Veg" ? "submenu-active" : ""
                          }`}
                          onClick={() => {
                            const willOpen = openSubMenu !== "Veg";
                            setOpenSubMenu(willOpen ? "Veg" : null);
                            setDietFilter("Veg");
                            setSubCategoryFilter("");
                            setActiveMenu("Veg");
                          }}
                        >
                          <span>🟢 Veg</span>
                          <span style={{ fontSize: "11px", opacity: 0.8 }}>
                            {openSubMenu === "Veg" ? "⌄" : "›"}
                          </span>
                        </button>

                        {openSubMenu === "Veg" && (
                          <div className="nested-submenu">
                            <button
                              className={!subCategoryFilter && currentDiet === "Veg" ? "nested-active" : ""}
                              onClick={() => {
                                setSubCategoryFilter("");
                                setDietFilter("Veg");
                                setActiveMenu("Menu");
                                closeMobileNav();
                              }}
                            >
                              <span>All Veg</span>
                              <span className="nested-count-pill">{vegItems.length}</span>
                            </button>
                            {vegSubCategories.map((catName) => {
                              const count = vegItems.filter((i) => i.category === catName).length;
                              const isCatActive = subCategoryFilter === catName && currentDiet === "Veg";
                              return (
                                <button
                                  key={catName}
                                  className={isCatActive ? "nested-active" : ""}
                                  onClick={() => {
                                    setSubCategoryFilter(catName);
                                    setDietFilter("Veg");
                                    setActiveMenu("Menu");
                                    closeMobileNav();
                                  }}
                                >
                                  <span>{catName}</span>
                                  <span className="nested-count-pill">{count}</span>
                                </button>
                              );
                            })}
                          </div>
                        )}

                        {/* Non-Veg Header & Subcategories */}
                        <button
                          className={`submenu-expandable ${
                            currentDiet === "Non-Veg" ? "submenu-active" : ""
                          }`}
                          onClick={() => {
                            const willOpen = openSubMenu !== "Non-Veg";
                            setOpenSubMenu(willOpen ? "Non-Veg" : null);
                            setDietFilter("Non-Veg");
                            setSubCategoryFilter("");
                            setActiveMenu("Menu");
                          }}
                        >
                          <span>🔴 Non-Veg</span>
                          <span style={{ fontSize: "11px", opacity: 0.8 }}>
                            {openSubMenu === "Non-Veg" ? "⌄" : "›"}
                          </span>
                        </button>

                        {openSubMenu === "Non-Veg" && (
                          <div className="nested-submenu">
                            <button
                              className={!subCategoryFilter && currentDiet === "Non-Veg" ? "nested-active" : ""}
                              onClick={() => {
                                setSubCategoryFilter("");
                                setDietFilter("Non-Veg");
                                setActiveMenu("Menu");
                                closeMobileNav();
                              }}
                            >
                              <span>All Non-Veg</span>
                              <span className="nested-count-pill">{nonVegItems.length}</span>
                            </button>
                            {nonVegSubCategories.map((catName) => {
                              const count = nonVegItems.filter((i) => i.category === catName).length;
                              const isCatActive = subCategoryFilter === catName && currentDiet === "Non-Veg";
                              return (
                                <button
                                  key={catName}
                                  className={isCatActive ? "nested-active" : ""}
                                  onClick={() => {
                                    setSubCategoryFilter(catName);
                                    setDietFilter("Non-Veg");
                                    setActiveMenu("Menu");
                                    closeMobileNav();
                                  }}
                                >
                                  <span>{catName}</span>
                                  <span className="nested-count-pill">{count}</span>
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </>
                    ) : (
                      item.children.map((child) => (
                        <button
                          key={child}
                          className={activeMenu === child ? "submenu-active" : ""}
                          onClick={() => {
                            handleSubMenuClick(item.name, child);
                            closeMobileNav();
                          }}
                        >
                          {child}
                        </button>
                      ))
                    )}
                  </div>
                )}

            </div>
          ))}

        </div>

        {/* LOGOUT */}

        <button
          className="logout-button"
          onClick={handleLogout}
        >
          <span>🚪</span>
          Logout
        </button>

      </aside>

      {/* ================= MAIN ================= */}

      <main className="admin-main">

        {/* HEADER */}

        <header className="admin-header">

          <div className="header-left">
            {/* MOBILE USER PROFILE (Avatar + Name & Role on left on mobile, exactly matching reference image) */}
            <div 
              className="admin-user mobile-profile-left"
              onClick={() => setShowProfileModal(true)}
              title="Click to view & manage profile"
            >
              <div className="admin-avatar blue-avatar">
                {adminInitials}
              </div>
              <div className="admin-user-info-text mobile-user-info">
                <strong>{adminDisplayName}</strong>
                <small>{adminDisplayRole}</small>
              </div>
            </div>

            <h1 className="header-page-title-main">{activeMenu}</h1>
          </div>

          {/* HEADER SEARCH BAR - CENTERED IN NAVBAR */}
          <div className="header-center-search">
            <div className="header-search-box-wrapper">
              <div className="header-search-box">
                <button
                  type="button"
                  className="search-glass-btn"
                  title="Click to Search"
                  onClick={() => {
                    if (globalSearch.trim()) {
                      const q = globalSearch.toLowerCase().trim();
                      if (q.includes("order") || q.startsWith("#ord")) {
                        setActiveMenu("Orders");
                        setOrderSearch(globalSearch);
                      } else if (q.includes("table") || q.startsWith("t")) {
                        setActiveMenu("Table Management");
                      } else if (q.includes("guest") || q.includes("customer")) {
                        setActiveMenu("Customers");
                      } else {
                        setActiveMenu("Menu");
                        setMenuSearch(globalSearch);
                      }
                    }
                  }}
                >
                  🔍
                </button>
                <input
                  type="text"
                  placeholder="Search here..."
                  value={globalSearch}
                  onChange={(e) => setGlobalSearch(e.target.value)}
                  className="header-search-input"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && globalSearch.trim()) {
                      const q = globalSearch.toLowerCase().trim();
                      if (q.includes("order") || q.startsWith("#ord")) {
                        setActiveMenu("Orders");
                        setOrderSearch(globalSearch);
                      } else if (q.includes("table") || q.startsWith("t")) {
                        setActiveMenu("Table Management");
                      } else {
                        setActiveMenu("Menu");
                        setMenuSearch(globalSearch);
                      }
                    }
                  }}
                />
                {globalSearch && (
                  <button className="clear-search-btn" onClick={() => setGlobalSearch("")}>✕</button>
                )}
              </div>

              {/* LIVE SEARCH DROPDOWN */}
              {globalSearchResults && (
                <>
                  <div className="search-dropdown-backdrop" onClick={() => setGlobalSearch("")} />
                  <div className="header-search-dropdown">
                  <div className="search-dropdown-header">
                    <span>Results for "{globalSearch}"</span>
                    <button type="button" onClick={() => setGlobalSearch("")}>Close ✕</button>
                  </div>

                  {globalSearchResults.totalCount === 0 ? (
                    <div className="search-dropdown-empty">
                      No matching menu, orders, tables, or guests found.
                    </div>
                  ) : (
                    <div className="search-dropdown-body">
                      {globalSearchResults.orders.length > 0 && (
                        <div className="search-group">
                          <div className="search-group-title">🧾 Orders ({globalSearchResults.orders.length})</div>
                          {globalSearchResults.orders.map((ord) => {
                            const tblStr = ord.tableNumber
                              ? String(ord.tableNumber).toLowerCase().startsWith("table")
                                ? ord.tableNumber
                                : `Table ${ord.tableNumber}`
                              : "N/A";
                            return (
                              <div
                                key={ord._id}
                                className="search-item"
                                onClick={() => {
                                  setActiveMenu("Orders");
                                  setOrderSearch(ord.orderId || ord._id);
                                  setGlobalSearch("");
                                }}
                              >
                                <span><strong>#{String(ord.orderId || ord._id).slice(-6).toUpperCase()}</strong> - {tblStr} ({ord.status})</span>
                                <span className="search-item-arrow">→</span>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {globalSearchResults.menu.length > 0 && (
                        <div className="search-group">
                          <div className="search-group-title">🍔 Menu Items ({globalSearchResults.menu.length})</div>
                          {globalSearchResults.menu.map((item) => (
                            <div
                              key={item._id}
                              className="search-item"
                              onClick={() => {
                                setActiveMenu("Menu");
                                setMenuSearch(item.name);
                                setGlobalSearch("");
                              }}
                            >
                              <span><strong>{item.name}</strong> - ₹{item.price} ({item.category})</span>
                              <span className="search-item-arrow">→</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {globalSearchResults.tables.length > 0 && (
                        <div className="search-group">
                          <div className="search-group-title">🪑 Dining Tables ({globalSearchResults.tables.length})</div>
                          {globalSearchResults.tables.map((tbl) => {
                            const tblStr = tbl.tableNumber
                              ? String(tbl.tableNumber).toLowerCase().startsWith("table")
                                ? tbl.tableNumber
                                : `Table ${tbl.tableNumber}`
                              : "N/A";
                            return (
                              <div
                                key={tbl._id}
                                className="search-item"
                                onClick={() => {
                                  setActiveMenu("Table Management");
                                  setGlobalSearch("");
                                }}
                              >
                                <span><strong>{tblStr}</strong> - Status: {tbl.status} ({tbl.capacity || 4} Seats)</span>
                                <span className="search-item-arrow">→</span>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {globalSearchResults.customers.length > 0 && (
                        <div className="search-group">
                          <div className="search-group-title">👥 Guests ({globalSearchResults.customers.length})</div>
                          {globalSearchResults.customers.map((c, idx) => (
                            <div
                              key={c._id || idx}
                              className="search-item"
                              onClick={() => {
                                setActiveMenu("Customers");
                                setCustomerSearch(c.name || c.customerName || "");
                                setGlobalSearch("");
                              }}
                            >
                              <span><strong>{c.name || c.customerName || "Guest"}</strong> {c.phone ? `(${c.phone})` : ""}</span>
                              <span className="search-item-arrow">→</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </>
            )}
            </div>
          </div>

          <div className="header-actions">

            <button className="notification-icon-btn" title="Notifications">
              <span className="bell-emoji">🔔</span>
              <span className="bell-count-badge">0</span>
            </button>

            {/* DESKTOP USER PROFILE */}
            <div 
              className="admin-user desktop-only-profile clickable-profile"
              onClick={() => setShowProfileModal(true)}
              title="Click to view & manage profile"
              role="button"
              tabIndex={0}
              onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") setShowProfileModal(true); }}
            >
              <div className="admin-avatar">
                {adminInitials}
              </div>
              <div className="admin-user-info-text">
                <strong>{adminDisplayName}</strong>
                <small>{adminDisplayRole}</small>
              </div>
            </div>

            {/* HAMBURGER BUTTON - RIGHT SIDE ON MOBILE MATCHING REFERENCE SCREENSHOT */}
            <button
              className="hamburger-btn"
              onClick={() => setMobileNavOpen(o => !o)}
              aria-label="Toggle navigation"
            >
              <span></span>
              <span></span>
              <span></span>
            </button>

          </div>

        </header>

        {/* ================= CONTENT ================= */}

        {activeMenu === "Dashboard" ? (

          <div className="alok-dashboard-container">
            {/* WELCOME BANNER MATCHING IMAGE 2 */}
            <div className="alok-welcome-banner">
              <div className="alok-welcome-text">
                <h2 className="alok-welcome-title">
                  <span className="welcome-hand-emoji">👋</span> Welcome to {adminUser?.restaurantName || "Alok"}
                </h2>
                <p className="alok-welcome-subtitle">Manage your restaurant operations efficiently</p>
              </div>
              <div className="alok-welcome-illustration">
                <div className="alok-admin-logo-circle">
                  <img src="/admin_logo.png" alt="Admin Logo" className="alok-admin-logo-img" />
                </div>
              </div>
            </div>

            {/* UNIFIED 4-COLUMN CARDS GRID MATCHING IMAGE 2 */}
            <div className="alok-unified-grid">
              
              {/* ROW 1 */}
              {/* COL 1: TOTAL ORDERS */}
              <div className="alok-kpi-card" onClick={() => setActiveMenu("Orders")}>
                <div className="alok-kpi-icon-badge blue-badge">
                  📋
                </div>
                <div className="alok-kpi-body">
                  <span className="alok-kpi-title">TOTAL ORDERS</span>
                  <div className="alok-kpi-val-row">
                    <h2 className="alok-kpi-val">{dashboardSummary.stats.totalOrders ?? 0}</h2>
                    <span
                      className="alok-kpi-day-badge"
                      title="Click to view today's orders"
                      onClick={(e) => {
                        e.stopPropagation();
                        setOrderDateFilter("today");
                        setOrderCustomDate("");
                        setActiveMenu("Orders");
                      }}
                    >
                      📅 Today: <strong>{todayOrdersList.length}</strong>
                    </span>
                  </div>
                  <span className="alok-kpi-link">View All Orders →</span>
                </div>
              </div>

              {/* COL 2: TOTAL CUSTOMERS */}
              <div className="alok-kpi-card" onClick={() => setActiveMenu("Customers")}>
                <div className="alok-kpi-icon-badge purple-badge">
                  👥
                </div>
                <div className="alok-kpi-body">
                  <span className="alok-kpi-title">TOTAL CUSTOMERS</span>
                  <h2 className="alok-kpi-val">{dashboardSummary.stats.totalCustomers ?? 0}</h2>
                  <span className="alok-kpi-link">View Directory →</span>
                </div>
              </div>

              {/* COL 3: Orders Quick Nav */}
              <div className="alok-nav-card" onClick={() => setActiveMenu("Orders")}>
                <div className="alok-nav-icon-box green-box">📋</div>
                <div className="alok-nav-info">
                  <h4>Orders</h4>
                  <p>Manage all dining orders</p>
                </div>
                <span className="alok-nav-arrow">→</span>
              </div>

              {/* COL 4: Customers Quick Nav */}
              <div className="alok-nav-card" onClick={() => setActiveMenu("Customers")}>
                <div className="alok-nav-icon-box pink-box">👥</div>
                <div className="alok-nav-info">
                  <h4>Customers</h4>
                  <p>Guest directory & spend</p>
                </div>
                <span className="alok-nav-arrow">→</span>
              </div>

              {/* ROW 2 */}
              {/* COL 1: TOTAL REVENUE */}
              <div className="alok-kpi-card">
                <div className="alok-kpi-icon-badge yellow-badge">
                  💰
                </div>
                <div className="alok-kpi-body">
                  <span className="alok-kpi-title">TOTAL REVENUE</span>
                  <div className="alok-kpi-val-row">
                    <h2 className="alok-kpi-val">₹{Math.round(dashboardSummary.stats.totalRevenue || 0).toLocaleString("en-IN")}</h2>
                    <span
                      className="alok-kpi-day-badge green-badge-pill"
                      title="Today's sales"
                    >
                      📅 Today: <strong>₹{Math.round(todayRevenue).toLocaleString("en-IN")}</strong>
                    </span>
                  </div>
                  <span className="alok-kpi-subtext">Gross Sales</span>
                </div>
              </div>

              {/* COL 2: TOTAL TABLES */}
              <div className="alok-kpi-card" onClick={() => setActiveMenu("Table Management")}>
                <div className="alok-kpi-icon-badge cyan-badge">
                  🪑
                </div>
                <div className="alok-kpi-body">
                  <span className="alok-kpi-title">TOTAL TABLES</span>
                  <h2 className="alok-kpi-val">{dashboardSummary.stats.totalTables ?? dashboardSummary.tables?.length ?? 0}</h2>
                  <span className="alok-kpi-subtext">
                    {tableCounts.Occupied || 0} Occupied · {tableCounts.Available || 0} Free
                  </span>
                </div>
              </div>

              {/* COL 3: Tables Quick Nav */}
              <div className="alok-nav-card" onClick={() => setActiveMenu("Table Management")}>
                <div className="alok-nav-icon-box red-box">🪑</div>
                <div className="alok-nav-info">
                  <h4>Tables</h4>
                  <p>Floor & seating status</p>
                </div>
                <span className="alok-nav-arrow">→</span>
              </div>

              {/* COL 4: Reservations Quick Nav */}
              <div className="alok-nav-card" onClick={() => setActiveMenu("Reservations")}>
                <div className="alok-nav-icon-box purple-box">📅</div>
                <div className="alok-nav-info">
                  <h4>Reservations</h4>
                  <p>{reservationStats?.today || 0} today · {reservationStats?.upcoming || 0} upcoming</p>
                </div>
                <span className="alok-nav-arrow">→</span>
              </div>

              {/* ROW 3 */}
              {/* COL 1 & 2 (SPANS 2 COLUMNS): ACTIVE ORDERS */}
              <div className="alok-kpi-card alok-kpi-card-wide" onClick={() => setActiveMenu("Orders")}>
                <div className="alok-kpi-icon-badge green-badge">
                  ⚡
                </div>
                <div className="alok-kpi-body">
                  <span className="alok-kpi-title">ACTIVE ORDERS</span>
                  <h2 className="alok-kpi-val">{dashboardSummary.stats.activeOrders ?? 0}</h2>
                  <span className="alok-kpi-subtext">In Kitchen / Dining</span>
                </div>
              </div>

              {/* COL 3: Menu Quick Nav */}
              <div className="alok-nav-card" onClick={() => setActiveMenu("Menu")}>
                <div className="alok-nav-icon-box orange-box">🍔</div>
                <div className="alok-nav-info">
                  <h4>Menu</h4>
                  <p>Items, prices & stock</p>
                </div>
                <span className="alok-nav-arrow">→</span>
              </div>

              {/* COL 4: Staff Quick Nav */}
              <div className="alok-nav-card" onClick={() => setActiveMenu("Staff")}>
                <div className="alok-nav-icon-box blue-box">👤</div>
                <div className="alok-nav-info">
                  <h4>Staff</h4>
                  <p>Manage team members</p>
                </div>
                <span className="alok-nav-arrow">→</span>
              </div>

            </div>

            {/* BOTTOM SECTION: TABLE MANAGEMENT & FLOOR OCCUPANCY */}
            <div className="alok-floor-management-card">
              
              <div className="alok-floor-card-header">
                <div className="alok-floor-header-left">
                  <span className="alok-floor-header-icon">🪑</span>
                  <div>
                    <h3>Table Management & Floor Occupancy</h3>
                    <p>Current floor occupancy and status across {dashboardSummary.stats.totalTables || dashboardSummary.tables?.length || 0} dining tables</p>
                  </div>
                </div>
                <button className="alok-manage-tables-btn" onClick={() => setActiveMenu("Table Management")}>
                  Manage All Tables →
                </button>
              </div>

              {/* 5 STATUS SUMMARY BOXES WITH PERCENTAGES */}
              {(() => {
                const tot = dashboardSummary.stats.totalTables || dashboardSummary.tables?.length || 1;
                const avail = tableCounts.Available || 0;
                const occ = tableCounts.Occupied || 0;
                const res = tableCounts.Reserved || 0;
                const clean = tableCounts.Cleaning || 0;
                const out = tableCounts["Out of Service"] || 0;
                return (
                  <div className="alok-status-summary-grid">
                    <div className="alok-status-box box-available">
                      <div className="alok-status-icon green-icon">🪑</div>
                      <span className="alok-status-box-title">Available</span>
                      <h1 className="alok-status-box-val">{avail}</h1>
                      <span className="alok-status-pct">{Math.round((avail / tot) * 100)}%</span>
                    </div>

                    <div className="alok-status-box box-occupied">
                      <div className="alok-status-icon red-icon">🪑</div>
                      <span className="alok-status-box-title">Occupied</span>
                      <h1 className="alok-status-box-val">{occ}</h1>
                      <span className="alok-status-pct">{Math.round((occ / tot) * 100)}%</span>
                    </div>

                    <div className="alok-status-box box-reserved">
                      <div className="alok-status-icon yellow-icon">🪑</div>
                      <span className="alok-status-box-title">Reserved</span>
                      <h1 className="alok-status-box-val">{res}</h1>
                      <span className="alok-status-pct">{Math.round((res / tot) * 100)}%</span>
                    </div>

                    <div className="alok-status-box box-cleaning">
                      <div className="alok-status-icon blue-icon">🧹</div>
                      <span className="alok-status-box-title">Cleaning</span>
                      <h1 className="alok-status-box-val">{clean}</h1>
                      <span className="alok-status-pct">{Math.round((clean / tot) * 100)}%</span>
                    </div>

                    <div className="alok-status-box box-out-of-service">
                      <div className="alok-status-icon gray-icon">🛠️</div>
                      <span className="alok-status-box-title">Out of Service</span>
                      <h1 className="alok-status-box-val">{out}</h1>
                      <span className="alok-status-pct">{Math.round((out / tot) * 100)}%</span>
                    </div>
                  </div>
                );
              })()}

              {/* FLOOR SNAPSHOT TABLE PILLS GRID */}
              <div className="alok-floor-snapshot-section">
                <div className="alok-snapshot-label">Floor Snapshot:</div>
                <div className="alok-table-pills-row">
                  {dashboardSummary.tables && dashboardSummary.tables.length > 0 ? (
                    dashboardSummary.tables.map((t, idx) => {
                      const statusClass = (t.status || "Available").toLowerCase().replace(/\s+/g, "-");
                      return (
                        <div key={t._id || idx} className={`alok-table-pill pill-${statusClass}`}>
                          <span className={`alok-dot dot-${statusClass}`}>●</span>
                          <span className="alok-pill-text">{t.tableNumber || `T${idx+1}`}</span>
                        </div>
                      );
                    })
                  ) : (
                    <span style={{ color: "#6b7280", fontSize: "0.9rem", padding: "8px 0" }}>
                      No tables added yet. Click <strong>"Manage All Tables"</strong> to setup your dining tables.
                    </span>
                  )}
                </div>
              </div>

            </div>
          </div>

        ) : isRestaurantView ? (

          <section className="module-page restaurant-module-page">
            <div className="module-page-header">
              <div>
                <h2>{activeMenu === "Restaurants" ? "All Restaurants" : activeMenu}</h2>
                <p>Manage registered restaurant accounts.</p>
              </div>

              <button
                className="back-dashboard"
                onClick={() => navigate("/admin/add-restaurant")}
              >
                Add Restaurant
              </button>
            </div>

            {restaurantsLoading ? (
              <p>Loading restaurants...</p>
            ) : visibleRestaurants.length === 0 ? (
              <div className="empty-module-state">
                <p>No restaurants found for this filter.</p>
              </div>
            ) : (
              <div className="admin-restaurant-list">
                {visibleRestaurants.map((restaurant) => (
                  <article key={restaurant._id} className="admin-restaurant-row">
                    <div>
                      <strong>{restaurant.restaurantName}</strong>
                      <span>{restaurant.restaurantId} · {restaurant.city}</span>
                    </div>

                    <span className={`restaurant-status-badge ${getRestaurantStatus(restaurant) === "Active" ? "is-active" : "is-inactive"}`}>
                      {getRestaurantStatus(restaurant)}
                    </span>

                    <div className="restaurant-row-actions">
                      <button onClick={() => navigate(`/admin/restaurants/${restaurant._id}`)}>
                        View
                      </button>
                      <button onClick={() => navigate(`/admin/restaurants/${restaurant._id}/edit`)}>
                        Edit
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>

        ) : isMenuView ? (

          <section className="module-page restaurant-module-page">
            <div className="module-page-header">
              <div>
                <h2>
                  {subCategoryFilter
                    ? `${subCategoryFilter} (${currentDiet === "All" ? "All Items" : currentDiet})`
                    : currentDiet !== "All"
                    ? `${currentDiet} Menu`
                    : "Menu Management"}
                </h2>
              </div>
              <strong className="menu-item-count">
                {activeMenu === "Modifiers"
                  ? `${modifiers.length} modifiers`
                  : `${displayedMenuEntries.length} items`}
              </strong>
            </div>

            {activeMenu === "Modifiers" ? (
              <div className="modifier-layout">
                <form className="modifier-form" onSubmit={handleModifierSubmit}>
                  <h3>Add Modifier</h3>
                  <label htmlFor="modifier-name">Modifier name</label>
                  <input
                    id="modifier-name"
                    value={modifierForm.name}
                    onChange={(event) => setModifierForm((current) => ({ ...current, name: event.target.value }))}
                    placeholder="e.g. Extra cheese"
                    required
                  />
                  <label htmlFor="modifier-price">Extra price (Rs.)</label>
                  <input
                    id="modifier-price"
                    type="number"
                    min="0"
                    step="0.01"
                    value={modifierForm.priceAdjustment}
                    onChange={(event) => setModifierForm((current) => ({ ...current, priceAdjustment: event.target.value }))}
                    required
                  />
                  {modifierError && <p className="modifier-error">{modifierError}</p>}
                  <button className="back-dashboard" disabled={modifierSaving}>
                    {modifierSaving ? "Adding..." : "Add Modifier"}
                  </button>
                </form>

                <div className="modifier-list">
                  {modifiers.length === 0 ? (
                    <div className="empty-module-state"><p>No modifiers added yet.</p></div>
                  ) : modifiers.map((modifier) => (
                    <article key={modifier._id} className="modifier-row">
                      <div>
                        <strong>{modifier.name}</strong>
                        <span>Rs. {modifier.priceAdjustment || 0} extra</span>
                      </div>
                      <button onClick={() => handleModifierDelete(modifier._id)}>Delete</button>
                    </article>
                  ))}
                </div>
              </div>
            ) : menuLoading ? (
              <p>Loading menu items...</p>
            ) : menuError ? (
              <div className="empty-module-state"><p>{menuError}</p></div>
            ) : activeMenu === "Categories" ? (
              <div className="menu-category-grid">
                {categoryCards.map((category) => {
                  let count = 0;
                  if (category.name === "Veg") {
                    count = menuEntries.filter(
                      (item) => item.type?.toLowerCase() === "veg" && !item.category?.toLowerCase().includes("non-veg")
                    ).length;
                  } else if (category.name === "Non-Veg") {
                    count = menuEntries.filter(
                      (item) => item.type?.toLowerCase() === "non-veg" || item.category?.toLowerCase().includes("non-veg")
                    ).length;
                  } else {
                    count = menuEntries.filter((item) => item.category === category.name).length;
                  }

                  return (
                    <button
                      key={category.name}
                      type="button"
                      className="menu-category-card"
                      onClick={() => {
                        setSelectedCategory(category.name);
                        setActiveMenu("Items");
                      }}
                    >
                      <strong>{category.name === "Veg" ? "🟢 Veg" : category.name === "Non-Veg" ? "🔴 Non-Veg" : category.name}</strong>
                      <span>{count} items</span>
                    </button>
                  );
                })}
              </div>
            ) : (
              <>
                <div className="menu-item-toolbar">
                  <label className="menu-search">
                    <span className="menu-search-icon">🔍</span>
                    <span className="sr-only">Search menu items</span>
                    <input
                      type="search"
                      value={menuSearch}
                      onChange={(event) => setMenuSearch(event.target.value)}
                      placeholder="Search menu..."
                    />
                  </label>

                  <button
                    type="button"
                    className="back-dashboard add-menu-button"
                    onClick={() => {
                      if (showAddMenuForm) {
                        resetMenuForm();
                      } else {
                        setMenuItemError("");
                        setEditingMenuItem(null);
                        setNewMenuItem({
                          name: "",
                          category: subCategoryFilter || (currentDiet === "Non-Veg" ? "Main Course" : "Starters"),
                          price: "",
                          description: "",
                          image: "",
                          type: currentDiet === "Non-Veg" ? "Non-Veg" : "Veg",
                          inStock: true,
                        });
                        setShowAddMenuForm(true);
                      }
                    }}
                  >
                    {showAddMenuForm ? "Close Form" : "+ Add Menu Item"}
                  </button>
                </div>



                {showAddMenuForm && (
                  <div
                    className="admin-profile-backdrop"
                    onClick={resetMenuForm}
                  >
                    <div
                      className="admin-profile-modal menu-item-modal"
                      onClick={(e) => e.stopPropagation()}
                      style={{
                        maxWidth: "600px",
                        width: "95%",
                        maxHeight: "90vh",
                        display: "flex",
                        flexDirection: "column",
                        background: "#ffffff",
                        borderRadius: "16px",
                        overflow: "hidden",
                        boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)"
                      }}
                    >
                      {/* MODAL HEADER */}
                      <div className="admin-profile-modal-header" style={{ padding: "16px 24px", borderBottom: "1.5px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center", background: "#f8fafc", flexShrink: 0 }}>
                        <div className="admin-profile-title" style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                          <span style={{ fontSize: "22px" }}>{editingMenuItem ? "✏️" : "➕"}</span>
                          <div>
                            <h3 style={{ margin: 0, fontSize: "18px", fontWeight: "800", color: "#0f172a" }}>
                              {editingMenuItem ? `Edit: ${editingMenuItem.name}` : "Add New Menu Item"}
                            </h3>
                            <p style={{ margin: "2px 0 0", fontSize: "12px", color: "#64748b" }}>
                              {editingMenuItem ? "Update dish details, price and availability status." : "Create a new food item for your restaurant menu."}
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          className="admin-profile-close-btn"
                          onClick={resetMenuForm}
                          title="Close"
                        >
                          ✕
                        </button>
                      </div>

                      <form
                        className="add-menu-item-form"
                        onSubmit={handleAddMenuItem}
                        style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0, overflow: "hidden" }}
                      >
                        {/* SCROLLABLE FORM BODY */}
                        <div style={{ padding: "18px 24px", overflowY: "auto", flex: 1, display: "flex", flexDirection: "column", gap: "12px" }}>
                          {/* AVAILABILITY STATUS SELECTOR */}
                          <div style={{ padding: "12px", background: "#f8fafc", borderRadius: "10px", border: "1.5px solid #e2e8f0" }}>
                            <label style={{ display: "block", fontSize: "12px", fontWeight: "800", color: "#1e293b", marginBottom: "6px" }}>
                              Item Availability Status
                            </label>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                              <button
                                type="button"
                                onClick={() => setNewMenuItem((prev) => ({ ...prev, inStock: true }))}
                                style={{
                                  padding: "8px 12px",
                                  borderRadius: "8px",
                                  border: newMenuItem.inStock ? "2px solid #16a34a" : "1.5px solid #cbd5e1",
                                  background: newMenuItem.inStock ? "#ecfdf5" : "#ffffff",
                                  color: newMenuItem.inStock ? "#15803d" : "#64748b",
                                  fontWeight: "800",
                                  fontSize: "13px",
                                  cursor: "pointer",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  gap: "6px",
                                  transition: "all 0.2s ease"
                                }}
                              >
                                <span>🟢</span> Available
                              </button>
                              <button
                                type="button"
                                onClick={() => setNewMenuItem((prev) => ({ ...prev, inStock: false }))}
                                style={{
                                  padding: "8px 12px",
                                  borderRadius: "8px",
                                  border: !newMenuItem.inStock ? "2px solid #dc2626" : "1.5px solid #cbd5e1",
                                  background: !newMenuItem.inStock ? "#fef2f2" : "#ffffff",
                                  color: !newMenuItem.inStock ? "#b91c1c" : "#64748b",
                                  fontWeight: "800",
                                  fontSize: "13px",
                                  cursor: "pointer",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  gap: "6px",
                                  transition: "all 0.2s ease"
                                }}
                              >
                                <span>🔴</span> Unavailable
                              </button>
                            </div>
                          </div>

                          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                            <label style={{ display: "flex", flexDirection: "column", gap: "4px", fontSize: "12px", fontWeight: "700", color: "#334155" }}>
                              Item Name *
                              <input
                                name="name"
                                value={newMenuItem.name}
                                onChange={handleMenuItemChange}
                                placeholder="e.g. Paneer Tikka"
                                required
                                style={{ padding: "8px 12px", borderRadius: "8px", border: "1.5px solid #cbd5e1", fontSize: "13px" }}
                              />
                            </label>

                            <label style={{ display: "flex", flexDirection: "column", gap: "4px", fontSize: "12px", fontWeight: "700", color: "#334155" }}>
                              Category *
                              <select
                                name="category"
                                value={newMenuItem.category}
                                onChange={handleMenuItemChange}
                                style={{ padding: "8px 12px", borderRadius: "8px", border: "1.5px solid #cbd5e1", fontSize: "13px" }}
                              >
                                {menuCategoryOptions.map((cat) => (
                                  <option key={cat} value={cat}>{cat}</option>
                                ))}
                              </select>
                            </label>

                            <label style={{ display: "flex", flexDirection: "column", gap: "4px", fontSize: "12px", fontWeight: "700", color: "#334155" }}>
                              Price (Rs.) *
                              <input
                                name="price"
                                type="number"
                                min="0"
                                step="0.01"
                                value={newMenuItem.price}
                                onChange={handleMenuItemChange}
                                placeholder="e.g. 150"
                                required
                                style={{ padding: "8px 12px", borderRadius: "8px", border: "1.5px solid #cbd5e1", fontSize: "13px" }}
                              />
                            </label>

                            <label style={{ display: "flex", flexDirection: "column", gap: "4px", fontSize: "12px", fontWeight: "700", color: "#334155" }}>
                              Food Type
                              <select
                                name="type"
                                value={newMenuItem.type}
                                onChange={handleMenuItemChange}
                                style={{ padding: "8px 12px", borderRadius: "8px", border: "1.5px solid #cbd5e1", fontSize: "13px" }}
                              >
                                <option value="Veg">🟢 Veg</option>
                                <option value="Non-Veg">🔴 Non-Veg</option>
                              </select>
                            </label>
                          </div>

                          <label style={{ display: "flex", flexDirection: "column", gap: "4px", fontSize: "12px", fontWeight: "700", color: "#334155" }}>
                            Description (optional)
                            <textarea
                              name="description"
                              value={newMenuItem.description}
                              onChange={handleMenuItemChange}
                              rows="2"
                              placeholder="Delicious prepared with fresh spices..."
                              style={{ padding: "8px 12px", borderRadius: "8px", border: "1.5px solid #cbd5e1", fontSize: "13px", resize: "vertical" }}
                            />
                          </label>

                          {/* DISH IMAGE SELECTION / UPLOAD */}
                          <div style={{ padding: "12px", background: "#f8fafc", borderRadius: "10px", border: "1.5px solid #e2e8f0", display: "flex", flexDirection: "column", gap: "8px" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                              <label style={{ fontSize: "12px", fontWeight: "800", color: "#1e293b", margin: 0 }}>
                                Dish Image (Choose File or Paste URL)
                              </label>
                              {newMenuItem.image && (
                                <button
                                  type="button"
                                  onClick={() => setNewMenuItem((prev) => ({ ...prev, image: "" }))}
                                  style={{
                                    fontSize: "11px",
                                    fontWeight: "700",
                                    color: "#dc2626",
                                    background: "#fee2e2",
                                    border: "none",
                                    padding: "2px 8px",
                                    borderRadius: "6px",
                                    cursor: "pointer"
                                  }}
                                >
                                  ✕ Remove Image
                                </button>
                              )}
                            </div>

                            <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
                              {/* File Upload / Choose Option */}
                              <label
                                style={{
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: "6px",
                                  padding: "7px 12px",
                                  background: "#ffffff",
                                  border: "1.5px solid #cbd5e1",
                                  borderRadius: "8px",
                                  fontSize: "12px",
                                  fontWeight: "700",
                                  color: "#1e293b",
                                  cursor: "pointer",
                                  boxShadow: "0 1px 2px rgba(0,0,0,0.05)"
                                }}
                              >
                                <span>📁</span> Choose from Device
                                <input
                                  type="file"
                                  accept="image/*"
                                  onChange={handleImageFileUpload}
                                  style={{ display: "none" }}
                                />
                              </label>

                              <span style={{ fontSize: "11px", color: "#94a3b8", fontWeight: "600" }}>or</span>

                              {/* URL input */}
                              <input
                                name="image"
                                type="url"
                                value={newMenuItem.image?.startsWith("data:") ? "" : newMenuItem.image}
                                onChange={handleMenuItemChange}
                                placeholder="Paste Image URL here..."
                                style={{
                                  flex: "1",
                                  minWidth: "160px",
                                  padding: "7px 10px",
                                  borderRadius: "8px",
                                  border: "1.5px solid #cbd5e1",
                                  fontSize: "12px"
                                }}
                              />
                            </div>

                            {/* Image Live Preview - only show when a custom image is selected */}
                            {newMenuItem.image && (
                              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginTop: "2px" }}>
                                <div
                                  style={{
                                    width: "50px",
                                    height: "50px",
                                    borderRadius: "8px",
                                    overflow: "hidden",
                                    border: "1.5px solid #cbd5e1",
                                    background: "#ffffff",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    flexShrink: 0
                                  }}
                                >
                                  <img
                                    src={newMenuItem.image}
                                    alt="Preview"
                                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                                    onError={(e) => {
                                      e.currentTarget.onerror = null;
                                      e.currentTarget.style.display = "none";
                                    }}
                                  />
                                </div>
                                <div style={{ fontSize: "11.5px", color: "#15803d" }}>
                                  <span style={{ fontWeight: "700" }}>✓ Custom image selected</span>
                                </div>
                              </div>
                            )}
                          </div>

                          {menuItemError && (
                            <div style={{ padding: "8px 12px", background: "#fef2f2", color: "#b91c1c", borderRadius: "8px", fontSize: "12.5px", fontWeight: "700" }}>
                              ⚠️ {menuItemError}
                            </div>
                          )}
                        </div>

                        {/* ALWAYS VISIBLE FIXED BOTTOM ACTION FOOTER */}
                        <div
                          style={{
                            padding: "14px 24px",
                            borderTop: "1.5px solid #e2e8f0",
                            background: "#f8fafc",
                            display: "flex",
                            justifyContent: "flex-end",
                            gap: "12px",
                            alignItems: "center",
                            flexShrink: 0
                          }}
                        >
                          <button
                            type="button"
                            onClick={resetMenuForm}
                            style={{
                              padding: "9px 18px",
                              borderRadius: "8px",
                              border: "1.5px solid #cbd5e1",
                              background: "#ffffff",
                              color: "#475569",
                              fontWeight: "700",
                              fontSize: "13.5px",
                              cursor: "pointer"
                            }}
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            disabled={menuItemSaving}
                            style={{
                              padding: "9px 24px",
                              borderRadius: "8px",
                              border: "none",
                              background: "linear-gradient(135deg, #2563eb, #1d4ed8)",
                              color: "#ffffff",
                              fontWeight: "800",
                              fontSize: "14px",
                              cursor: "pointer",
                              boxShadow: "0 4px 12px rgba(37, 99, 235, 0.35)",
                              display: "flex",
                              alignItems: "center",
                              gap: "6px"
                            }}
                          >
                            {menuItemSaving ? "Saving..." : editingMenuItem ? "✓ Update Menu Item" : "✓ Save Menu Item (Submit)"}
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                )}

                {searchedMenuEntries.length === 0 ? (
              <div className="empty-module-state"><p>No menu items match your search.</p></div>
                ) : (
              <div className="admin-menu-grid">
                {searchedMenuEntries.map((item) => (
                  <article key={item._id} className="admin-menu-card">
                  {getMenuImage(item) ? (
                      <img
                        src={getMenuImage(item)}
                        alt={item.name}
                        onError={(event) => {
                          event.currentTarget.onerror = null;
                          event.currentTarget.style.display = "none";
                          event.currentTarget.parentNode.querySelector(".admin-menu-no-image")?.style.setProperty("display", "flex");
                        }}
                      />
                    ) : (
                      <div className="admin-menu-no-image" style={{
                        width: "100%", aspectRatio: "16/9", background: "#f1f5f9",
                        display: "flex", flexDirection: "column", alignItems: "center",
                        justifyContent: "center", gap: "6px", color: "#94a3b8"
                      }}>
                        <span style={{ fontSize: "2.2rem" }}>🍽️</span>
                        <span style={{ fontSize: "0.75rem", fontWeight: 600 }}>No Image Added</span>
                      </div>
                    )}
                    <div className="admin-menu-card-content">
                      <span className="menu-category">{item.category}</span>
                      <span className={item.type?.toLowerCase() === "non-veg" ? "menu-food-type menu-type-nonveg" : "menu-food-type menu-type-veg"}>
                        {item.type?.toLowerCase() === "non-veg" ? "Non-Veg" : "Veg"}
                      </span>
                      <h3>{item.name}</h3>
                      <p>{item.description || "No description provided."}</p>
                      <div className="menu-card-footer">
                        <strong>Rs. {item.price}</strong>
                        <button
                          type="button"
                          className={`menu-status-badge-btn ${item.inStock !== false && item.status?.toLowerCase() !== "unavailable" ? "menu-available" : "menu-unavailable"}`}
                          onClick={() => handleToggleMenuStock(item)}
                          title="Click to toggle Available / Unavailable"
                        >
                          {item.inStock !== false && item.status?.toLowerCase() !== "unavailable" ? "Available" : "Unavailable"}
                        </button>
                      </div>
                      <div className="menu-card-actions">
                        <button type="button" className="menu-edit-button" onClick={() => handleEditMenuItem(item)}>Edit</button>
                        <button type="button" className="menu-delete-button" onClick={() => handleDeleteMenuItem(item)}>Delete</button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
                )}
              </>
            )}
          </section>

        ) : isStaffView ? (

          <section className="module-page restaurant-module-page">
            <div className="module-page-header staff-management-header">
              <div>
                <h2>Staff Management</h2>
                <p>View and manage all staff accounts across restaurants.</p>
              </div>
              <div className="staff-header-actions">
                <button
                  type="button"
                  className="add-staff-header-btn btn-add-manager"
                  onClick={openAddManager}
                  title="Create a new manager account"
                >
                  <span className="btn-icon">👔</span> + Add Manager
                </button>
                <button
                  type="button"
                  className="add-staff-header-btn btn-add-waiter"
                  onClick={openAddWaiter}
                  title="Create a new waiter account"
                >
                  <span className="btn-icon">🍽️</span> + Add Waiter
                </button>
                <button
                  type="button"
                  className="add-staff-header-btn btn-add-chef"
                  onClick={openAddChef}
                  title="Create a new chef account"
                >
                  <span className="btn-icon">👨‍🍳</span> + Add Chef
                </button>
                <button
                  type="button"
                  className="add-staff-header-btn btn-add-cleaner"
                  onClick={openAddCleaner}
                  title="Create a new cleaner account"
                >
                  <span className="btn-icon">🧹</span> + Add Cleaner
                </button>
              </div>
            </div>

            <div className="staff-tabs">
              {["Managers", "Waiters", "Chefs", "Cleaners"].map((tab) => (
                <button
                  key={tab}
                  className={`staff-tab-btn ${activeMenu === tab || (activeMenu === "Staff" && tab === "Managers") ? "staff-tab-active" : ""}`}
                  onClick={() => { setActiveMenu(tab); setStaffSearch(""); }}
                >
                  {tab === "Managers" && "\uD83D\uDC54 "}
                  {tab === "Waiters" && "\uD83C\uDF7D\uFE0F "}
                  {tab === "Chefs" && "👨‍🍳 "}
                  {tab === "Cleaners" && "🧹 "}
                  {tab}
                </button>
              ))}
            </div>

            {!isRestaurantAdmin ? (
              <div className="staff-restaurant-filter">
                <label htmlFor="staff-restaurant-select">🏪 Filter by Restaurant:</label>
                <select
                  id="staff-restaurant-select"
                  value={selectedRestaurantId}
                  onChange={(e) => { setSelectedRestaurantId(e.target.value); setStaffSearch(""); }}
                >
                  <option value="">All Restaurants</option>
                  {restaurants.map(r => (
                    <option key={r._id} value={r._id}>{r.restaurantName} ({r.restaurantId})</option>
                  ))}
                </select>
                {selectedRestaurantId && (
                  <button
                    className="staff-filter-clear-btn"
                    onClick={() => setSelectedRestaurantId("")}
                  >
                    ✕ Clear
                  </button>
                )}
              </div>
            ) : (
              <div className="staff-restaurant-filter">
                <label>🏪 Restaurant:</label>
                <span style={{ fontWeight: 700, background: "#e0e7ff", color: "#3730a3", padding: "5px 14px", borderRadius: "8px", fontSize: "0.85rem" }}>
                  {adminUser?.restaurantName || adminUser?.ownerName || "My Restaurant"} ({adminUser?.restaurantId})
                </span>
              </div>
            )}

            <div className="staff-search-bar">
              <input
                type="search"
                placeholder={`Search ${activeMenu === "Users" ? "restaurant admins" : (activeMenu === "Staff" ? "managers" : activeMenu.toLowerCase())}...`}
                value={staffSearch}
                onChange={(e) => setStaffSearch(e.target.value)}
              />
            </div>

            {staffLoading ? (
              <div className="staff-loading"><span className="staff-spinner">{"\u23F3"}</span> Loading staff...</div>
            ) : staffError ? (
              <div className="empty-module-state"><p>{staffError}</p></div>
            ) : (activeMenu === "Managers" || activeMenu === "Staff") ? (
              (() => {
                const filtered = managers.filter(m =>
                  !staffSearch || [
                    m.name, m.email, m.managerId, m.phone,
                    m.restaurantId?.restaurantName, m.restaurantId?.city
                  ].filter(Boolean).some(v => v.toLowerCase().includes(staffSearch.toLowerCase()))
                );
                return filtered.length === 0 ? (
                  <div className="empty-module-state">
                    <p>No managers found.</p>
                    <button
                      type="button"
                      className="staff-empty-action-btn btn-add-manager"
                      onClick={openAddManager}
                    >
                      👔 + Create First Manager
                    </button>
                  </div>
                ) : (
                  <div className="staff-cards-grid">
                    {filtered.map(m => {
                      const isActive = (m.status || "Active").toLowerCase() === "active";
                      return (
                        <div key={m._id} className={`staff-card ${!isActive ? "staff-card-inactive" : ""}`}>
                          <div className="staff-card-avatar manager-avatar">
                            {m.name?.charAt(0)?.toUpperCase() || "M"}
                          </div>
                          <div className="staff-card-info">
                            <h3>{m.name}</h3>
                            <span className="staff-id-badge">ID: {m.managerId}</span>
                            <p className="staff-email">{"\u2709\uFE0F"} {m.email}</p>
                            {m.phone && <p className="staff-phone">{"\uD83D\uDCDE"} {m.phone}</p>}
                            {m.restaurantId && (
                              <p className="staff-restaurant">{"\uD83C\uDFEA"} {m.restaurantId.restaurantName}</p>
                            )}
                            <span className={`staff-status-badge ${isActive ? "staff-active" : "staff-inactive"}`}>
                              {isActive ? "Active" : "Inactive"}
                            </span>
                          </div>
                          <div className="staff-card-meta">
                            <span>Joined {new Date(m.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</span>
                          </div>
                          <div className="staff-card-actions">
                            <button
                              type="button"
                              className="staff-view-dashboard-btn"
                              onClick={() => navigate(`/admin/staff/managers/${m._id}`)}
                            >
                              👁️ View Dashboard
                            </button>
                            <button
                              type="button"
                              className="staff-edit-btn"
                              onClick={() => openEditStaff("manager", m)}
                              title="Edit Manager"
                            >
                              ✏️ Edit
                            </button>
                            <button
                              type="button"
                              className={`staff-toggle-status-btn ${isActive ? "btn-status-deactivate" : "btn-status-activate"}`}
                              onClick={() => handleToggleStaffStatus("manager", m._id, m.status || "Active")}
                              disabled={statusUpdatingId === m._id}
                              title={isActive ? "Deactivate Manager" : "Activate Manager"}
                            >
                              {statusUpdatingId === m._id ? (
                                "..."
                              ) : isActive ? (
                                "🔴 Deactivate"
                              ) : (
                                "🟢 Activate"
                              )}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()
            ) : activeMenu === "Waiters" ? (
              (() => {
                const filtered = waiters.filter(w =>
                  !staffSearch || [
                    w.name, w.email, w.waiterId, w.phone, w.gender,
                    w.restaurantId?.restaurantName, w.restaurantId?.city
                  ].filter(Boolean).some(v => v.toLowerCase().includes(staffSearch.toLowerCase()))
                );
                return filtered.length === 0 ? (
                  <div className="empty-module-state">
                    <p>No waiters found.</p>
                    <button
                      type="button"
                      className="staff-empty-action-btn btn-add-waiter"
                      onClick={openAddWaiter}
                    >
                      🍽️ + Create First Waiter
                    </button>
                  </div>
                ) : (
                  <div className="staff-cards-grid">
                    {filtered.map(w => {
                      const isActive = (w.status || "Active").toLowerCase() === "active";
                      return (
                        <div key={w._id} className={`staff-card ${!isActive ? "staff-card-inactive" : ""}`}>
                          <div className="staff-card-avatar waiter-avatar">
                            {w.name?.charAt(0)?.toUpperCase() || "W"}
                          </div>
                          <div className="staff-card-info">
                            <h3>{w.name}</h3>
                            <span className="staff-id-badge">ID: {w.waiterId}</span>
                            {w.email && <p className="staff-email">{"\u2709\uFE0F"} {w.email}</p>}
                            {w.phone && <p className="staff-phone">{"\uD83D\uDCDE"} {w.phone}</p>}
                            {w.gender && <p className="staff-gender">{"\u26A7"} {w.gender}</p>}
                            {w.restaurantId && (
                              <p className="staff-restaurant">{"\uD83C\uDFEA"} {w.restaurantId.restaurantName}</p>
                            )}
                            <span className={`staff-status-badge ${isActive ? "staff-active" : "staff-inactive"}`}>
                              {isActive ? "Active" : "Inactive"}
                            </span>
                          </div>
                          <div className="staff-card-meta">
                            <span>Joined {new Date(w.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</span>
                          </div>
                          <div className="staff-card-actions">
                            <button
                              type="button"
                              className="staff-view-dashboard-btn staff-view-waiter-btn"
                              onClick={() => navigate(`/admin/staff/waiters/${w._id}`)}
                            >
                              👁️ View Dashboard
                            </button>
                            <button
                              type="button"
                              className="staff-edit-btn"
                              onClick={() => openEditStaff("waiter", w)}
                              title="Edit Waiter"
                            >
                              ✏️ Edit
                            </button>
                            <button
                              type="button"
                              className={`staff-toggle-status-btn ${isActive ? "btn-status-deactivate" : "btn-status-activate"}`}
                              onClick={() => handleToggleStaffStatus("waiter", w._id, w.status || "Active")}
                              disabled={statusUpdatingId === w._id}
                              title={isActive ? "Deactivate Waiter" : "Activate Waiter"}
                            >
                              {statusUpdatingId === w._id ? (
                                "..."
                              ) : isActive ? (
                                "🔴 Deactivate"
                              ) : (
                                "🟢 Activate"
                              )}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()
            ) : activeMenu === "Chefs" ? (
              (() => {
                const filtered = chefs.filter(c =>
                  !staffSearch || [
                    c.name, c.email, c.chefId, c.phone, c.speciality, c.shift,
                    c.restaurantId?.restaurantName, c.restaurantId?.city
                  ].filter(Boolean).some(v => v.toLowerCase().includes(staffSearch.toLowerCase()))
                );
                return filtered.length === 0 ? (
                  <div className="empty-module-state">
                    <p>No chefs found.</p>
                    <button
                      type="button"
                      className="staff-empty-action-btn btn-add-chef"
                      onClick={openAddChef}
                    >
                      👨‍🍳 + Create First Chef
                    </button>
                  </div>
                ) : (
                  <div className="staff-cards-grid">
                    {filtered.map(c => {
                      const isActive = (c.status || "Active").toLowerCase() === "active";
                      return (
                        <div key={c._id} className={`staff-card ${!isActive ? "staff-card-inactive" : ""}`}>
                          <div className="staff-card-avatar chef-avatar">
                            {c.name?.charAt(0)?.toUpperCase() || "C"}
                          </div>
                          <div className="staff-card-info">
                            <h3>{c.name}</h3>
                            <span className="staff-id-badge">ID: {c.chefId}</span>
                            {c.speciality && (
                              <span className="staff-spec-badge">🍳 {c.speciality}</span>
                            )}
                            {c.email && <p className="staff-email">{"\u2709\uFE0F"} {c.email}</p>}
                            {c.phone && <p className="staff-phone">{"\uD83D\uDCDE"} {c.phone}</p>}
                            {c.shift && <p className="staff-phone">⏱️ Shift: {c.shift}</p>}
                            {c.restaurantId && (
                              <p className="staff-restaurant">{"\uD83C\uDFEA"} {c.restaurantId.restaurantName}</p>
                            )}
                            <span className={`staff-status-badge ${isActive ? "staff-active" : "staff-inactive"}`}>
                              {isActive ? "Active" : "Inactive"}
                            </span>
                          </div>
                          <div className="staff-card-meta">
                            <span>Joined {new Date(c.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</span>
                          </div>
                          <div className="staff-card-actions">
                            <button
                              type="button"
                              className="staff-view-dashboard-btn staff-view-chef-btn"
                              onClick={() => navigate(`/admin/staff/chefs/${c._id}`)}
                            >
                              👁️ View Dashboard
                            </button>
                            <button
                              type="button"
                              className="staff-edit-btn"
                              onClick={() => openEditStaff("chef", c)}
                              title="Edit Chef"
                            >
                              ✏️ Edit
                            </button>
                            <button
                              type="button"
                              className={`staff-toggle-status-btn ${isActive ? "btn-status-deactivate" : "btn-status-activate"}`}
                              onClick={() => handleToggleStaffStatus("chef", c._id, c.status || "Active")}
                              disabled={statusUpdatingId === c._id}
                              title={isActive ? "Deactivate Chef" : "Activate Chef"}
                            >
                              {statusUpdatingId === c._id ? (
                                "..."
                              ) : isActive ? (
                                "🔴 Deactivate"
                              ) : (
                                "🟢 Activate"
                              )}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()
            ) : activeMenu === "Cleaners" ? (
              (() => {
                const filtered = cleaners.filter(cl =>
                  !staffSearch || [
                    cl.name, cl.email, cl.cleanerId, cl.phone, cl.assignedArea, cl.shift,
                    cl.restaurantId?.restaurantName, cl.restaurantId?.city
                  ].filter(Boolean).some(v => v.toLowerCase().includes(staffSearch.toLowerCase()))
                );
                return filtered.length === 0 ? (
                  <div className="empty-module-state">
                    <p>No cleaners found.</p>
                    <button
                      type="button"
                      className="staff-empty-action-btn btn-add-cleaner"
                      onClick={openAddCleaner}
                    >
                      🧹 + Create First Cleaner
                    </button>
                  </div>
                ) : (
                  <div className="staff-cards-grid">
                    {filtered.map(cl => {
                      const isActive = (cl.status || "Active").toLowerCase() === "active";
                      return (
                        <div key={cl._id} className={`staff-card ${!isActive ? "staff-card-inactive" : ""}`}>
                          <div className="staff-card-avatar cleaner-avatar">
                            {cl.name?.charAt(0)?.toUpperCase() || "C"}
                          </div>
                          <div className="staff-card-info">
                            <h3>{cl.name}</h3>
                            <span className="staff-id-badge">ID: {cl.cleanerId}</span>
                            {cl.assignedArea && (
                              <span className="staff-spec-badge cleaner-spec-badge">🧹 {cl.assignedArea}</span>
                            )}
                            {cl.email && <p className="staff-email">{"\u2709\uFE0F"} {cl.email}</p>}
                            {cl.phone && <p className="staff-phone">{"\uD83D\uDCDE"} {cl.phone}</p>}
                            {cl.shift && <p className="staff-phone">⏱️ Shift: {cl.shift}</p>}
                            {cl.restaurantId && (
                              <p className="staff-restaurant">{"\uD83C\uDFEA"} {cl.restaurantId.restaurantName}</p>
                            )}
                            <span className={`staff-status-badge ${isActive ? "staff-active" : "staff-inactive"}`}>
                              {isActive ? "Active" : "Inactive"}
                            </span>
                          </div>
                          <div className="staff-card-meta">
                            <span>Joined {new Date(cl.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</span>
                          </div>
                          <div className="staff-card-actions">
                            <button
                              type="button"
                              className="staff-view-dashboard-btn staff-view-cleaner-btn"
                              onClick={() => navigate(`/admin/staff/cleaners/${cl._id}`)}
                            >
                              👁️ View Dashboard
                            </button>
                            <button
                              type="button"
                              className="staff-edit-btn"
                              onClick={() => openEditStaff("cleaner", cl)}
                              title="Edit Cleaner"
                            >
                              ✏️ Edit
                            </button>
                            <button
                              type="button"
                              className={`staff-toggle-status-btn ${isActive ? "btn-status-deactivate" : "btn-status-activate"}`}
                              onClick={() => handleToggleStaffStatus("cleaner", cl._id, cl.status || "Active")}
                              disabled={statusUpdatingId === cl._id}
                              title={isActive ? "Deactivate Cleaner" : "Activate Cleaner"}
                            >
                              {statusUpdatingId === cl._id ? (
                                "..."
                              ) : isActive ? (
                                "🔴 Deactivate"
                              ) : (
                                "🟢 Activate"
                              )}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()
            ) : activeMenu === "Users" ? (
              (() => {
                const filtered = restaurants.filter(r => {
                  const matchesSearch = !staffSearch || [
                    r.restaurantName, r.email, r.restaurantId, r.city, r.ownerName
                  ].filter(Boolean).some(v => v.toLowerCase().includes(staffSearch.toLowerCase()));
                  const matchesRestaurant = !selectedRestaurantId || r._id === selectedRestaurantId;
                  return matchesSearch && matchesRestaurant;
                });
                return filtered.length === 0 ? (
                  <div className="empty-module-state"><p>No restaurant accounts found.</p></div>
                ) : (
                  <div className="staff-cards-grid">
                    {filtered.map(r => {
                      const isRestActive = r.status?.trim().toLowerCase() !== "inactive";
                      return (
                        <div key={r._id} className={`staff-card ${!isRestActive ? "staff-card-inactive" : ""}`}>
                          <div className="staff-card-avatar user-avatar">
                            {r.restaurantName?.charAt(0)?.toUpperCase() || "R"}
                          </div>
                          <div className="staff-card-info">
                            <h3>{r.restaurantName}</h3>
                            <span className="staff-id-badge">ID: {r.restaurantId}</span>
                            {r.email && <p className="staff-email">{"\u2709\uFE0F"} {r.email}</p>}
                            {r.ownerName && <p className="staff-phone">{"\uD83D\uDC64"} {r.ownerName}</p>}
                            {r.city && <p className="staff-restaurant">{"\uD83D\uDCCD"} {r.city}</p>}
                            <span className={`staff-status-badge ${isRestActive ? "staff-active" : "staff-inactive"}`}>
                              {isRestActive ? "Active" : "Inactive"}
                            </span>
                          </div>
                          <div className="staff-card-meta">
                            <span>Added {new Date(r.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</span>
                          </div>
                          <div className="staff-card-actions">
                            <button
                              type="button"
                              className="staff-view-dashboard-btn staff-view-user-btn"
                              onClick={() => navigate(`/admin/staff/users/${r._id}`)}
                            >
                              👁️ View Dashboard
                            </button>
                            <button
                              type="button"
                              className={`staff-toggle-status-btn ${isRestActive ? "btn-status-deactivate" : "btn-status-activate"}`}
                              onClick={() => handleToggleStaffStatus("user", r._id, isRestActive ? "Active" : "Inactive")}
                              disabled={statusUpdatingId === r._id}
                              title={isRestActive ? "Deactivate Restaurant" : "Activate Restaurant"}
                            >
                              {statusUpdatingId === r._id ? (
                                "..."
                              ) : isRestActive ? (
                                "🔴 Deactivate"
                              ) : (
                                "🟢 Activate"
                              )}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()
            ) : null}
          </section>

        ) : isOrdersView ? (

          <section className="module-page orders-module-page">
            <div className="module-page-header">
              <div>
                <h2>{activeMenu === "Kitchen" ? "Kitchen Display System (KDS)" : "Orders Management"}</h2>
                <p>Track, manage and update real-time customer dining orders.</p>
              </div>

              <div className="orders-header-actions">
                {customerOrderFilter && (
                  <div className="active-filter-chip">
                    <span>Customer: <strong>{customerOrderFilter}</strong></span>
                    <button onClick={() => setCustomerOrderFilter(null)}>✕ Show All Orders</button>
                  </div>
                )}
                <button
                  type="button"
                  className="btn-create-order-admin"
                  onClick={handleOpenAdminCreateOrder}
                  title="Create new dining order"
                >
                  ➕ Create New Order
                </button>
                <button
                  className="btn-refresh-orders"
                  onClick={fetchDashboardSummary}
                  disabled={dashboardLoading}
                  title="Refresh orders"
                >
                  {dashboardLoading ? "Refreshing..." : "🔄 Refresh"}
                </button>
              </div>
            </div>

            {/* Quick Metrics Bar */}
            <div className="orders-metrics-row">
              <div
                className={`metric-chip chip-total ${orderDateFilter === "all" ? "chip-active-filter" : ""}`}
                style={{ cursor: "pointer" }}
                onClick={() => {
                  setOrderDateFilter("all");
                  setOrderCustomDate("");
                }}
                title="Click to view all orders"
              >
                <div className="metric-chip-header">
                  <span className="metric-chip-title">TOTAL ORDERS</span>
                  <div className="metric-chip-icon blue-icon">📋</div>
                </div>
                <h2 className="metric-chip-val">{dashboardSummary.stats.totalOrders ?? 0}</h2>
                <span className="metric-chip-subtext" style={{ fontSize: "11px", color: "#64748b" }}>
                  All-time total
                </span>
              </div>

              <div
                className={`metric-chip chip-today ${orderDateFilter === "today" ? "chip-active-filter" : ""}`}
                style={{ cursor: "pointer" }}
                onClick={() => {
                  setOrderDateFilter(orderDateFilter === "today" ? "all" : "today");
                  setOrderCustomDate("");
                }}
                title="Click to filter Today's orders"
              >
                <div className="metric-chip-header">
                  <span className="metric-chip-title">TODAY ({todayDateKey ? formatDateKeyDisplay(todayDateKey).slice(0, 6) : "Today"})</span>
                  <div className="metric-chip-icon green-icon">📅</div>
                </div>
                <h2 className="metric-chip-val">{todayOrdersList.length}</h2>
                <span className="metric-chip-subtext" style={{ fontSize: "11px", color: "#059669", fontWeight: 700 }}>
                  ₹{Math.round(todayRevenue).toLocaleString("en-IN")} {orderDateFilter === "today" ? "• Active ✓" : ""}
                </span>
              </div>

              <div className="metric-chip chip-new">
                <div className="metric-chip-header">
                  <span className="metric-chip-title">NEW ORDERS</span>
                  <div className="metric-chip-icon red-icon">🔔</div>
                </div>
                <h2 className="metric-chip-val">{dateFilteredOrders.filter(o => o.status === "New").length}</h2>
                <span className="metric-chip-subtext" style={{ fontSize: "11px", color: "#ef4444" }}>
                  {orderDateFilter !== "all" ? "For selected day" : "Awaiting kitchen"}
                </span>
              </div>

              <div className="metric-chip chip-prep">
                <div className="metric-chip-header">
                  <span className="metric-chip-title">IN KITCHEN</span>
                  <div className="metric-chip-icon orange-icon">🍳</div>
                </div>
                <h2 className="metric-chip-val">{dateFilteredOrders.filter(o => o.status === "Preparing").length}</h2>
                <span className="metric-chip-subtext" style={{ fontSize: "11px", color: "#f97316" }}>
                  Cooking now
                </span>
              </div>

              <div className="metric-chip chip-ready">
                <div className="metric-chip-header">
                  <span className="metric-chip-title">READY TO SERVE</span>
                  <div className="metric-chip-icon green-icon">✅</div>
                </div>
                <h2 className="metric-chip-val">{dateFilteredOrders.filter(o => o.status === "Ready").length}</h2>
                <span className="metric-chip-subtext" style={{ fontSize: "11px", color: "#10b981" }}>
                  Ready at counter
                </span>
              </div>

              <div className="metric-chip chip-completed">
                <div className="metric-chip-header">
                  <span className="metric-chip-title">COMPLETED</span>
                  <div className="metric-chip-icon purple-icon">📦</div>
                </div>
                <h2 className="metric-chip-val">{dateFilteredOrders.filter(o => ["Completed", "Served"].includes(o.status)).length}</h2>
                <span className="metric-chip-subtext" style={{ fontSize: "11px", color: "#8b5cf6" }}>
                  Served & closed
                </span>
              </div>
            </div>

            {/* Filter & Search Bar */}
            <div className="orders-control-bar">
              {/* Day & Date Filter Row */}
              <div className="orders-day-filter-container">
                <div className="orders-day-filter-left">
                  <span className="orders-day-filter-label">
                    <span>📅</span> Date:
                  </span>
                  <div className="orders-day-filter-pills">
                    <button
                      type="button"
                      className={`orders-day-pill ${orderDateFilter === "all" ? "active" : ""}`}
                      onClick={() => {
                        setOrderDateFilter("all");
                        setOrderCustomDate("");
                      }}
                    >
                      🌐 All Time ({dashboardSummary.orders.length})
                    </button>
                    <button
                      type="button"
                      className={`orders-day-pill ${orderDateFilter === "today" ? "active" : ""}`}
                      onClick={() => {
                        setOrderDateFilter("today");
                        setOrderCustomDate("");
                      }}
                    >
                      📅 Today ({formatDateKeyDisplay(todayDateKey).slice(0, 6)}) ({todayOrdersList.length})
                    </button>
                    <button
                      type="button"
                      className={`orders-day-pill ${orderDateFilter === "yesterday" ? "active" : ""}`}
                      onClick={() => {
                        setOrderDateFilter("yesterday");
                        setOrderCustomDate("");
                      }}
                    >
                      🗓️ Yesterday ({yesterdayOrdersList.length})
                    </button>
                    <div className={`orders-date-picker-wrap ${orderDateFilter === "custom" ? "active" : ""}`}>
                      <span className="picker-cal-icon">📆</span>
                      <input
                        type="date"
                        className="orders-date-input"
                        value={orderCustomDate}
                        onChange={(e) => {
                          if (e.target.value) {
                            setOrderCustomDate(e.target.value);
                            setOrderDateFilter("custom");
                          } else {
                            setOrderCustomDate("");
                            setOrderDateFilter("all");
                          }
                        }}
                        title="Pick specific date"
                      />
                      {orderDateFilter === "custom" && orderCustomDate && (
                        <span className="picker-orders-tag">
                          ({customDateOrdersList.length})
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {orderDateFilter !== "all" && (
                  <div className="orders-active-date-banner">
                    <span className="active-date-text">
                      Showing: <strong>{activeDateLabel}</strong> ({dateFilteredOrders.length} orders · ₹{Math.round(activeDateRevenue).toLocaleString("en-IN")})
                    </span>
                    <button
                      type="button"
                      className="orders-clear-date-btn"
                      onClick={() => {
                        setOrderDateFilter("all");
                        setOrderCustomDate("");
                      }}
                    >
                      ✕ Clear Date Filter
                    </button>
                  </div>
                )}
              </div>

              {/* Status Tabs and Search */}
              <div className="orders-filter-action-row">
                <div className="orders-status-tabs">
                  {["All", "New", "Preparing", "Ready", "Served", "Completed", "Cancelled"].map((st) => {
                    const currentSt = activeMenu === "New Orders"
                      ? "New"
                      : activeMenu === "Preparing"
                      ? "Preparing"
                      : activeMenu === "Completed"
                      ? "Completed"
                      : orderStatusFilter;
                    const count = st === "All"
                      ? dateFilteredOrders.length
                      : dateFilteredOrders.filter((o) => o.status === st).length;

                    return (
                      <button
                        key={st}
                        className={`orders-tab-btn ${currentSt === st ? "is-active" : ""}`}
                        onClick={() => {
                          setOrderStatusFilter(st);
                          if (["New Orders", "Preparing", "Completed"].includes(activeMenu)) {
                            setActiveMenu("Orders");
                          }
                        }}
                      >
                        {st}
                        <span className="tab-count-pill">{count}</span>
                      </button>
                    );
                  })}
                </div>

                <div className="orders-search-box">
                  <input
                    type="text"
                    placeholder="🔍 Search by Order ID, Table, Customer, Phone, Item..."
                    value={orderSearch}
                    onChange={(e) => setOrderSearch(e.target.value)}
                  />
                  {orderSearch && (
                    <button className="clear-search-btn" onClick={() => setOrderSearch("")}>✕</button>
                  )}
                </div>
              </div>
            </div>

            {/* Orders Cards Grid */}
            {(() => {
              const currentSt = activeMenu === "New Orders"
                ? "New"
                : activeMenu === "Preparing"
                ? "Preparing"
                : activeMenu === "Completed"
                ? "Completed"
                : orderStatusFilter;

              const filtered = dateFilteredOrders.filter((order) => {
                if (currentSt !== "All" && order.status !== currentSt) return false;
                if (customerOrderFilter) {
                  const matchesPhone = order.customerPhone && order.customerPhone.includes(customerOrderFilter);
                  const matchesName = order.customerName && order.customerName.toLowerCase().includes(customerOrderFilter.toLowerCase());
                  if (!matchesPhone && !matchesName) return false;
                }
                if (orderSearch.trim()) {
                  const q = orderSearch.trim().toLowerCase();
                  const matchId = String(order._id || "").toLowerCase().includes(q);
                  const matchTable = String(order.tableNumber || "").toLowerCase().includes(q);
                  const matchName = String(order.customerName || "").toLowerCase().includes(q);
                  const matchPhone = String(order.customerPhone || "").toLowerCase().includes(q);
                  const matchItem = (order.items || []).some(
                    (it) => it.name && it.name.toLowerCase().includes(q)
                  );
                  if (!matchId && !matchTable && !matchName && !matchPhone && !matchItem) {
                    return false;
                  }
                }
                return true;
              });

              if (filtered.length === 0) {
                return (
                  <div className="empty-module-state">
                    <div className="empty-icon">🧾</div>
                    <h3>No orders found</h3>
                    <p>
                      {orderSearch || customerOrderFilter || currentSt !== "All" || orderDateFilter !== "all"
                        ? `No orders matching your criteria${orderDateFilter !== "all" ? ` for ${activeDateLabel}` : ""}. Try clearing filters.`
                        : "No orders have been received yet. Once guests place orders, they will appear here."}
                    </p>
                    {orderDateFilter !== "all" && (
                      <button
                        type="button"
                        className="empty-clear-filter-btn"
                        style={{
                          marginTop: "14px",
                          padding: "8px 16px",
                          borderRadius: "8px",
                          border: "1.5px solid #cbd5e1",
                          background: "#ffffff",
                          cursor: "pointer",
                          fontWeight: 600,
                          color: "#1e293b",
                          fontSize: "13px"
                        }}
                        onClick={() => {
                          setOrderDateFilter("all");
                          setOrderCustomDate("");
                        }}
                      >
                        🔄 View All Orders (Clear Date Filter)
                      </button>
                    )}
                  </div>
                );
              }

              const totalOrdersPages = Math.ceil(filtered.length / ordersPerPage) || 1;
              const currentOrdersPage = Math.min(Math.max(ordersPage, 1), totalOrdersPages);
              const paginatedOrders = filtered.slice(
                (currentOrdersPage - 1) * ordersPerPage,
                currentOrdersPage * ordersPerPage
              );

              return (
                <>
                  <div className="orders-admin-grid">
                    {paginatedOrders.map((order) => {
                      const statusClass = (order.status || "new").toLowerCase();
                      const orderDate = order.createdAt ? new Date(order.createdAt) : new Date();
                      const timeFormatted = orderDate.toLocaleTimeString("en-IN", {
                        hour: "2-digit",
                        minute: "2-digit",
                      });
                      const dateFormatted = orderDate.toLocaleDateString("en-IN", {
                        day: "2-digit",
                        month: "short",
                      });

                      return (
                        <article key={order._id} className={`order-admin-card status-${statusClass}`}>
                          {/* Card Header */}
                          <div className="order-admin-header">
                            <div className="order-header-top-row">
                              <span className="order-card-table-pill">
                                🪑 {formatTableName(order.tableNumber)}
                              </span>
                            <span className={`order-source-pill ${order.source === "Admin" ? "source-admin" : String(order.source).toLowerCase() === "manager" ? "source-manager" : String(order.source).toLowerCase() === "waiter" ? "source-waiter" : "source-qr"}`}>
                              {order.source === "Admin" ? "🛡️ Admin Order" : String(order.source).toLowerCase() === "manager" ? "👔 Manager Order" : String(order.source).toLowerCase() === "waiter" ? "🧑‍💼 Waiter Order" : "📱 QR Order"}
                            </span>
                          </div>

                          <div className="order-header-sub-row">
                            <span className="order-card-id">
                              #{String(order.orderId || order._id).slice(-6).toUpperCase()}
                            </span>
                            <span className={`order-time-tag ${getOrderDateKey(order.createdAt) === todayDateKey ? "is-today" : ""}`}>
                              {getOrderDateKey(order.createdAt) === todayDateKey ? "⚡ Today · " : "📅 "}
                              {timeFormatted} · {dateFormatted}
                            </span>
                          </div>
                        </div>

                        {/* Customer Info Strip */}
                        <div className="order-card-customer-strip">
                          <div className="order-cust-avatar">
                            {(order.customerName || "G").charAt(0).toUpperCase()}
                          </div>
                          <div className="order-cust-details">
                            <strong>{order.customerName || "Walk-in Guest"}</strong>
                            <span>📞 {order.customerPhone || "No Phone"}</span>
                          </div>
                          <span className={`order-status-badge badge-${statusClass}`}>
                            {order.status || "New"}
                          </span>
                        </div>

                        {/* Items Table */}
                        <div className="order-items-scroll">
                          <table className="order-items-table">
                            <thead>
                              <tr>
                                <th>Item</th>
                                <th style={{ textAlign: "center" }}>Qty</th>
                                <th style={{ textAlign: "right" }}>Price</th>
                              </tr>
                            </thead>
                            <tbody>
                              {(order.items || []).map((it, iIdx) => {
                                const modTotal = (it.selectedModifiers || []).reduce(
                                  (sum, m) => sum + (Number(m.priceAdjustment) || 0),
                                  0
                                );
                                const lineTotal = ((Number(it.price) || 0) + modTotal) * (it.quantity || 1);

                                return (
                                  <tr key={iIdx}>
                                    <td>
                                      <span className="item-name-cell">{it.name}</span>
                                      {it.selectedModifiers && it.selectedModifiers.length > 0 && (
                                        <span className="item-mod-sub">
                                          + {it.selectedModifiers.map((m) => m.name).join(", ")}
                                        </span>
                                      )}
                                    </td>
                                    <td style={{ textAlign: "center", fontWeight: "bold" }}>
                                      ×{it.quantity || 1}
                                    </td>
                                    <td style={{ textAlign: "right", fontWeight: "600" }}>
                                      ₹{lineTotal.toFixed(2)}
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>

                        {/* Financial Totals */}
                        <div className="order-card-totals">
                          <div className="totals-line">
                            <span>Subtotal: ₹{Number(order.subtotal || 0).toFixed(2)}</span>
                            <span>Tax (5%): ₹{Number(order.taxAmount || 0).toFixed(2)}</span>
                          </div>
                          <div className="totals-main">
                            <div>
                              <span className="totals-label">Total Amount</span>
                              <strong className="totals-value">₹{Number(order.total || 0).toFixed(2)}</strong>
                            </div>
                            <span className={`payment-pill ${order.payment?.status === "Paid" ? "paid" : "unpaid"}`}>
                              {order.payment?.status === "Paid" ? "✅ Paid" : "⏳ Unpaid"}
                            </span>
                          </div>
                        </div>

                        {/* Actions Bar */}
                        <div className="order-card-actions">
                          <div className="order-step-buttons">
                            {order.status === "New" && (
                              <button
                                className="btn-status-step btn-step-prep"
                                onClick={() => handleUpdateOrderStatus(order._id, "Preparing")}
                                disabled={orderUpdatingId === order._id}
                              >
                                {orderUpdatingId === order._id ? "..." : "▶ Start Preparing"}
                              </button>
                            )}
                            {order.status === "Preparing" && (
                              <button
                                className="btn-status-step btn-step-ready"
                                onClick={() => handleUpdateOrderStatus(order._id, "Ready")}
                                disabled={orderUpdatingId === order._id}
                              >
                                {orderUpdatingId === order._id ? "..." : "✔ Mark Ready"}
                              </button>
                            )}
                            {order.status === "Ready" && (
                              <button
                                className="btn-status-step btn-step-serve"
                                onClick={() => handleUpdateOrderStatus(order._id, "Served")}
                                disabled={orderUpdatingId === order._id}
                              >
                                {orderUpdatingId === order._id ? "..." : "🍽 Mark Served"}
                              </button>
                            )}
                            {order.status === "Served" && (
                              <button
                                className="btn-status-step btn-step-complete"
                                onClick={() => handleUpdateOrderStatus(order._id, "Completed")}
                                disabled={orderUpdatingId === order._id}
                              >
                                {orderUpdatingId === order._id ? "..." : "✅ Complete Order"}
                              </button>
                            )}
                          </div>

                          <div className="order-status-dropdown-wrapper">
                            <select
                              className="order-status-select"
                              value={order.status || "New"}
                              onChange={(e) => handleUpdateOrderStatus(order._id, e.target.value)}
                              disabled={orderUpdatingId === order._id}
                            >
                              <option value="New">New</option>
                              <option value="Preparing">Preparing</option>
                              <option value="Ready">Ready</option>
                              <option value="Served">Served</option>
                              <option value="Completed">Completed</option>
                              <option value="Cancelled">Cancelled</option>
                            </select>
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>

                {/* Orders Pagination Bar */}
                {filtered.length > 0 && (
                  <div className="table-pagination-bar" style={{ marginTop: "24px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
                      <span className="pagination-info">
                        Showing {(currentOrdersPage - 1) * ordersPerPage + 1}–
                        {Math.min(currentOrdersPage * ordersPerPage, filtered.length)} of {filtered.length} orders
                      </span>
                      <div className="orders-per-page-selector" style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "12px", color: "#64748b" }}>
                        <span>Show:</span>
                        <select
                          value={ordersPerPage}
                          onChange={(e) => {
                            setOrdersPerPage(Number(e.target.value));
                            setOrdersPage(1);
                          }}
                          style={{
                            padding: "4px 8px",
                            borderRadius: "6px",
                            border: "1px solid #cbd5e1",
                            background: "#ffffff",
                            fontSize: "12px",
                            fontWeight: "600",
                            color: "#1e293b",
                            cursor: "pointer"
                          }}
                        >
                          <option value={6}>6 per page</option>
                          <option value={9}>9 per page</option>
                          <option value={12}>12 per page</option>
                          <option value={24}>24 per page</option>
                        </select>
                      </div>
                    </div>

                    {totalOrdersPages > 1 && (
                      <div className="pagination-nav">
                        <button
                          type="button"
                          className="page-number-btn"
                          disabled={currentOrdersPage <= 1}
                          onClick={() => setOrdersPage((p) => Math.max(p - 1, 1))}
                          title="Previous page"
                          aria-label="Previous page"
                        >
                          ‹
                        </button>
                        {getPaginationRange(currentOrdersPage, totalOrdersPages).map((item, idx) =>
                          item === "..." ? (
                            <span key={`ord-ellipsis-${idx}`} className="page-ellipsis">…</span>
                          ) : (
                            <button
                              key={`ord-page-${item}`}
                              type="button"
                              className={`page-number-btn ${item === currentOrdersPage ? "active" : ""}`}
                              onClick={() => setOrdersPage(item)}
                            >
                              {item}
                            </button>
                          )
                        )}
                        <button
                          type="button"
                          className="page-number-btn"
                          disabled={currentOrdersPage >= totalOrdersPages}
                          onClick={() => setOrdersPage((p) => Math.min(p + 1, totalOrdersPages))}
                          title="Next page"
                          aria-label="Next page"
                        >
                          ›
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </>
            );
          })()}
          </section>

        ) : isCustomersView ? (

          <section className="module-page customers-module-page">
            <div className="module-page-header">
              <div>
                <h2>Customer Directory</h2>
                <p>Track customer dining frequency, contact numbers, and lifetime revenue.</p>
              </div>

              <button
                className="btn-refresh-orders"
                onClick={fetchDashboardSummary}
                disabled={dashboardLoading}
                title="Refresh customer data"
              >
                {dashboardLoading ? "Refreshing..." : "🔄 Refresh"}
              </button>
            </div>

            {/* Customer Metrics */}
            <div className="customer-stats-grid">
              <div className="cust-stat-card">
                <div className="cust-stat-icon">👥</div>
                <div>
                  <p>Total Customers</p>
                  <h3>{dashboardSummary.customers.length}</h3>
                  <span>Unique diners</span>
                </div>
              </div>

              <div className="cust-stat-card">
                <div className="cust-stat-icon">🧾</div>
                <div>
                  <p>Total Orders</p>
                  <h3>{dashboardSummary.stats.totalOrders}</h3>
                  <span>Lifetime orders placed</span>
                </div>
              </div>

              <div className="cust-stat-card">
                <div className="cust-stat-icon">💰</div>
                <div>
                  <p>Total Customer Spend</p>
                  <h3>₹{Number(dashboardSummary.stats.totalRevenue || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h3>
                  <span>Gross customer revenue</span>
                </div>
              </div>

              <div className="cust-stat-card">
                <div className="cust-stat-icon">⭐</div>
                <div>
                  <p>Avg Spend per Customer</p>
                  <h3>
                    ₹{dashboardSummary.customers.length > 0
                      ? (dashboardSummary.stats.totalRevenue / dashboardSummary.customers.length).toFixed(2)
                      : "0.00"}
                  </h3>
                  <span>Per guest average</span>
                </div>
              </div>
            </div>

            {/* Customer Search */}
            <div className="customers-search-bar">
              <input
                type="text"
                placeholder="🔍 Search customers by name or phone number..."
                value={customerSearch}
                onChange={(e) => setCustomerSearch(e.target.value)}
              />
              {customerSearch && (
                <button className="clear-search-btn" onClick={() => setCustomerSearch("")}>✕</button>
              )}
            </div>

            {/* Customer Cards Grid */}
            {(() => {
              const filteredCusts = dashboardSummary.customers.filter((c) => {
                if (!customerSearch.trim()) return true;
                const q = customerSearch.trim().toLowerCase();
                return (
                  (c.name && c.name.toLowerCase().includes(q)) ||
                  (c.phone && c.phone.toLowerCase().includes(q))
                );
              });

              if (filteredCusts.length === 0) {
                return (
                  <div className="empty-module-state">
                    <div className="empty-icon">👥</div>
                    <h3>No customers found</h3>
                    <p>No customers match your search criteria.</p>
                  </div>
                );
              }

              const totalCustomersPages = Math.ceil(filteredCusts.length / customersPerPage) || 1;
              const currentCustomersPage = Math.min(Math.max(customersPage, 1), totalCustomersPages);
              const paginatedCustomers = filteredCusts.slice(
                (currentCustomersPage - 1) * customersPerPage,
                currentCustomersPage * customersPerPage
              );

              return (
                <>
                  <div className="customers-directory-grid">
                    {paginatedCustomers.map((cust, idx) => {
                      const initials = (cust.name || "G")
                        .split(" ")
                        .map((n) => n[0])
                        .slice(0, 2)
                        .join("")
                        .toUpperCase();

                      const lastDate = cust.lastOrderDate ? new Date(cust.lastOrderDate) : null;
                      const dateStr = lastDate
                        ? `${lastDate.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })} at ${lastDate.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}`
                        : "—";

                      return (
                        <article key={cust.id || idx} className="customer-profile-card">
                          <div className="cust-card-top">
                            <div className="cust-big-avatar">
                              {initials}
                            </div>
                            <div className="cust-main-heading">
                              <h3>{cust.name}</h3>
                              <a
                                href={cust.phone !== "—" ? `tel:${cust.phone}` : undefined}
                                className="cust-phone-link"
                              >
                                📞 {cust.phone}
                              </a>
                            </div>
                            <span className={`order-status-badge badge-${(cust.lastStatus || "new").toLowerCase()}`}>
                              {cust.lastStatus || "Active"}
                            </span>
                          </div>

                          <div className="cust-details-grid">
                            <div className="cust-detail-box">
                              <span>Orders Placed</span>
                              <strong>{cust.orders}</strong>
                            </div>
                            <div className="cust-detail-box highlight-spend">
                              <span>Total Spend</span>
                              <strong>₹{cust.totalSpend.toFixed(2)}</strong>
                            </div>
                            <div className="cust-detail-box">
                              <span>Last Table</span>
                              <strong>🪑 {cust.lastOrderTable}</strong>
                            </div>
                            <div className="cust-detail-box">
                              <span>Last Visit</span>
                              <strong style={{ fontSize: "11px" }}>{dateStr}</strong>
                            </div>
                          </div>

                          <div className="cust-card-footer">
                            <button
                              className="btn-view-cust-orders"
                              onClick={() => {
                                setCustomerOrderFilter(cust.phone !== "—" ? cust.phone : cust.name);
                                setActiveMenu("Orders");
                              }}
                            >
                              🧾 View All Orders ({cust.orders})
                            </button>
                          </div>
                        </article>
                      );
                    })}
                  </div>

                  {/* Customers Pagination Bar */}
                  {filteredCusts.length > 0 && (
                    <div className="table-pagination-bar" style={{ marginTop: "24px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
                        <span className="pagination-info">
                          Showing {(currentCustomersPage - 1) * customersPerPage + 1}–
                          {Math.min(currentCustomersPage * customersPerPage, filteredCusts.length)} of {filteredCusts.length} customers
                        </span>
                        <div className="customers-per-page-selector" style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "12px", color: "#64748b" }}>
                          <span>Show:</span>
                          <select
                            value={customersPerPage}
                            onChange={(e) => {
                              setCustomersPerPage(Number(e.target.value));
                              setCustomersPage(1);
                            }}
                            style={{
                              padding: "4px 8px",
                              borderRadius: "6px",
                              border: "1px solid #cbd5e1",
                              background: "#ffffff",
                              fontSize: "12px",
                              fontWeight: "600",
                              color: "#1e293b",
                              cursor: "pointer"
                            }}
                          >
                            <option value={6}>6 per page</option>
                            <option value={9}>9 per page</option>
                            <option value={12}>12 per page</option>
                            <option value={24}>24 per page</option>
                            <option value={48}>48 per page</option>
                          </select>
                        </div>
                      </div>

                      {totalCustomersPages > 1 && (
                        <div className="pagination-nav">
                          <button
                            type="button"
                            className="page-number-btn"
                            disabled={currentCustomersPage <= 1}
                            onClick={() => setCustomersPage((p) => Math.max(p - 1, 1))}
                            title="Previous page"
                            aria-label="Previous page"
                          >
                            ‹
                          </button>
                          {getPaginationRange(currentCustomersPage, totalCustomersPages).map((item, idx) =>
                            item === "..." ? (
                              <span key={`cust-ellipsis-${idx}`} className="page-ellipsis">…</span>
                            ) : (
                              <button
                                key={`cust-page-${item}`}
                                type="button"
                                className={`page-number-btn ${item === currentCustomersPage ? "active" : ""}`}
                                onClick={() => setCustomersPage(item)}
                              >
                                {item}
                              </button>
                            )
                          )}
                          <button
                            type="button"
                            className="page-number-btn"
                            disabled={currentCustomersPage >= totalCustomersPages}
                            onClick={() => setCustomersPage((p) => Math.min(p + 1, totalCustomersPages))}
                            title="Next page"
                            aria-label="Next page"
                          >
                            ›
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </>
              );
            })()}
          </section>

        ) : isTableManagementView ? (

          <section className="module-page tables-module-page">
            <div className="module-page-header">
              <div>
                <h2>Table Management</h2>
                <p>Real-time restaurant floor occupancy, active dining tables, and guest seating.</p>
              </div>

              <div className="module-header-actions">
                <button
                  type="button"
                  className="btn-add-table-header"
                  onClick={openAddTable}
                  title="Add a new dining table"
                >
                  ➕ Add Table
                </button>
                <button
                  className="btn-refresh-orders"
                  onClick={() => fetchDashboardSummary(true)}
                  disabled={dashboardLoading}
                  title="Refresh table status"
                >
                  {dashboardLoading ? "Refreshing..." : "🔄 Refresh"}
                </button>
              </div>
            </div>

            {/* Table Status Filter Chips */}
            <div className="table-filter-tabs">
              {["All", "Available", "Occupied", "Reserved", "Cleaning", "Out of Service"].map((st) => {
                const count = st === "All"
                  ? dashboardSummary.tables.length
                  : dashboardSummary.tables.filter((t) => t.status === st).length;

                return (
                  <button
                    key={st}
                    className={`table-filter-tab ${tableFilter === st ? "is-active" : ""}`}
                    onClick={() => setTableFilter(st)}
                  >
                    {st}
                    <span className="tab-count-pill">{count}</span>
                  </button>
                );
              })}
            </div>

            {/* Tables Grid */}
            {(() => {
              const filteredTables = dashboardSummary.tables.filter((table) => {
                if (tableFilter !== "All" && table.status !== tableFilter) return false;
                return true;
              });

              if (filteredTables.length === 0) {
                return (
                  <div className="empty-module-state">
                    <div className="empty-icon">🪑</div>
                    <h3>No tables found</h3>
                    <p>No tables match the selected status filter.</p>
                  </div>
                );
              }

              const totalTablesPages = Math.ceil(filteredTables.length / tablesPerPage) || 1;
              const currentTablesPage = Math.min(Math.max(tablesPage, 1), totalTablesPages);
              const paginatedTables = filteredTables.slice(
                (currentTablesPage - 1) * tablesPerPage,
                currentTablesPage * tablesPerPage
              );

              return (
                <>
                  <div className="admin-tables-grid">
                    {paginatedTables.map((table) => {
                      const stLower = (table.status || "available").toLowerCase().replace(/\s+/g, "-");
                      // Find active order for this table if occupied
                      const activeOrder = dashboardSummary.orders.find(
                        (o) =>
                          String(o.tableNumber).trim().toLowerCase() === String(table.tableNumber).trim().toLowerCase() &&
                          ["New", "Preparing", "Ready", "Served"].includes(o.status)
                      );

                      // Find active reservation for this table
                      const activeTableRes = reservations.find(
                        (r) =>
                          String(r.tableNumber || "").trim().toLowerCase() === String(table.tableNumber || "").trim().toLowerCase() &&
                          ["Confirmed", "Seated"].includes(r.status)
                      );

                      return (
                        <article key={table._id} className={`admin-table-card table-status-${stLower}`}>
                          <div className="table-card-header">
                            <div>
                              <h3>{table.tableNumber}</h3>
                              <span className="table-card-capacity">👥 {table.capacity || 4} Seats</span>
                            </div>
                            <div className="table-card-header-right">
                              <span className={`table-pill-badge badge-${stLower}`}>
                                {table.status || "Available"}
                              </span>
                              <button
                                type="button"
                                className="btn-edit-table-card"
                                onClick={() => openEditTable(table)}
                                title="Edit table"
                              >
                                ✏️
                              </button>
                              <button
                                type="button"
                                className="btn-delete-table-card"
                                onClick={() => handleDeleteTable(table._id, table.tableNumber)}
                                disabled={tableDeletingId === table._id}
                                title="Delete table"
                              >
                                {tableDeletingId === table._id ? "⏳" : "🗑️"}
                              </button>
                            </div>
                          </div>

                          {/* Table Content based on Current Status */}
                          {table.status === "Occupied" ? (
                            activeOrder ? (
                              <div className="table-active-order-box">
                                <div className="active-order-header">
                                  <span className="active-order-label">Active Order:</span>
                                  <strong>#{String(activeOrder._id).slice(-6).toUpperCase()}</strong>
                                </div>
                                <p className="active-order-cust">
                                  👤 {activeOrder.customerName || "Walk-in"} · 📞 {activeOrder.customerPhone || "—"}
                                </p>
                                <div className="active-order-bottom">
                                  <span className="active-order-items">
                                    {activeOrder.items?.length || 0} items
                                  </span>
                                  <strong className="active-order-price">
                                    ₹{Number(activeOrder.total || 0).toFixed(2)}
                                  </strong>
                                </div>
                              </div>
                            ) : (
                              <div className="table-state-box table-state-occupied">
                                <span className="table-state-icon">{activeTableRes ? "🍽️" : "🔴"}</span>
                                <div className="table-state-text">
                                  <strong>
                                    {activeTableRes ? `Seated: ${activeTableRes.customerName} (${activeTableRes.guestsCount}p)` : "Diners Seated"}
                                  </strong>
                                  <p>
                                    {activeTableRes ? `📞 ${activeTableRes.customerPhone} · Seated from Booking` : "Guests at table · Awaiting order"}
                                  </p>
                                </div>
                                {activeTableRes && (
                                  <button
                                    type="button"
                                    className="table-jump-res-btn"
                                    onClick={() => {
                                      setReservationSearch(activeTableRes.customerName);
                                      setActiveMenu("Reservations");
                                    }}
                                    title="View Reservation"
                                  >
                                    👁️ View
                                  </button>
                                )}
                              </div>
                            )
                          ) : table.status === "Cleaning" ? (
                            <div className="table-state-box table-state-cleaning">
                              <span className="table-state-icon">🧹</span>
                              <div className="table-state-text">
                                <strong>Cleaning in Progress</strong>
                                <p>Sanitizing & resetting for next guest</p>
                              </div>
                            </div>
                          ) : table.status === "Reserved" ? (
                            <div className="table-state-box table-state-reserved">
                              <span className="table-state-icon">🟡</span>
                              <div className="table-state-text">
                                <strong>
                                  {activeTableRes ? `Reserved: ${activeTableRes.customerName} (${activeTableRes.guestsCount}p)` : "Reserved Table"}
                                </strong>
                                <p>
                                  {activeTableRes ? `⏰ ${activeTableRes.reservationTime} · 📞 ${activeTableRes.customerPhone}` : "Booked for upcoming diners"}
                                </p>
                              </div>
                              {activeTableRes && (
                                <button
                                  type="button"
                                  className="table-jump-res-btn"
                                  onClick={() => {
                                    setReservationSearch(activeTableRes.customerName);
                                    setActiveMenu("Reservations");
                                  }}
                                  title="View Reservation"
                                >
                                  👁️ View
                                </button>
                              )}
                            </div>
                          ) : table.status === "Out of Service" ? (
                            <div className="table-state-box table-state-out-service">
                              <span className="table-state-icon">⚪</span>
                              <div className="table-state-text">
                                <strong>Out of Service</strong>
                                <p>Table temporarily disabled</p>
                              </div>
                            </div>
                          ) : (
                            <div className="table-state-box table-state-available">
                              <span className="table-state-icon">✨</span>
                              <div className="table-state-text">
                                <strong>Available & Fresh</strong>
                                <p>No active diner seated · Ready for guests</p>
                              </div>
                            </div>
                          )}

                          <div className="table-card-actions">
                            <label>Update Status:</label>
                            <select
                              className="table-status-changer"
                              value={table.status || "Available"}
                              onChange={(e) => handleUpdateTableStatus(table._id, e.target.value)}
                              disabled={tableUpdatingId === table._id}
                            >
                              <option value="Available">🟢 Available</option>
                              <option value="Occupied">🔴 Occupied</option>
                              <option value="Reserved">🟡 Reserved</option>
                              <option value="Cleaning">🔵 Cleaning</option>
                              <option value="Out of Service">⚪ Out of Service</option>
                            </select>
                          </div>
                        </article>
                      );
                    })}
                  </div>

                  {/* Tables Pagination Bar */}
                  {filteredTables.length > 0 && (
                    <div className="table-pagination-bar" style={{ marginTop: "24px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
                        <span className="pagination-info">
                          Showing {(currentTablesPage - 1) * tablesPerPage + 1}–
                          {Math.min(currentTablesPage * tablesPerPage, filteredTables.length)} of {filteredTables.length} tables
                        </span>
                        <div className="tables-per-page-selector" style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "12px", color: "#64748b" }}>
                          <span>Show:</span>
                          <select
                            value={tablesPerPage}
                            onChange={(e) => {
                              setTablesPerPage(Number(e.target.value));
                              setTablesPage(1);
                            }}
                            style={{
                              padding: "4px 8px",
                              borderRadius: "6px",
                              border: "1px solid #cbd5e1",
                              background: "#ffffff",
                              fontSize: "12px",
                              fontWeight: "600",
                              color: "#1e293b",
                              cursor: "pointer"
                            }}
                          >
                            <option value={8}>8 per page</option>
                            <option value={12}>12 per page</option>
                            <option value={16}>16 per page</option>
                            <option value={24}>24 per page</option>
                            <option value={48}>48 per page</option>
                          </select>
                        </div>
                      </div>

                      {totalTablesPages > 1 && (
                        <div className="pagination-nav">
                          <button
                            type="button"
                            className="page-number-btn"
                            disabled={currentTablesPage <= 1}
                            onClick={() => setTablesPage((p) => Math.max(p - 1, 1))}
                            title="Previous page"
                            aria-label="Previous page"
                          >
                            ‹
                          </button>
                          {getPaginationRange(currentTablesPage, totalTablesPages).map((item, idx) =>
                            item === "..." ? (
                              <span key={`tbl-ellipsis-${idx}`} className="page-ellipsis">…</span>
                            ) : (
                              <button
                                key={`tbl-page-${item}`}
                                type="button"
                                className={`page-number-btn ${item === currentTablesPage ? "active" : ""}`}
                                onClick={() => setTablesPage(item)}
                              >
                                {item}
                              </button>
                            )
                          )}
                          <button
                            type="button"
                            className="page-number-btn"
                            disabled={currentTablesPage >= totalTablesPages}
                            onClick={() => setTablesPage((p) => Math.min(p + 1, totalTablesPages))}
                            title="Next page"
                            aria-label="Next page"
                          >
                            ›
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </>
              );
            })()}
          </section>

        ) : isReservationsView ? (

          <section className="module-page reservations-module-page">
            <div className="module-page-header">
              <div>
                <h2>Table Reservations</h2>
                <p>Manage guest table bookings, upcoming seatings, party sizes, and reservation schedules.</p>
              </div>

              <div className="module-header-actions">
                <button
                  type="button"
                  className="btn-add-table-header"
                  onClick={openAddReservation}
                  title="Create new dining reservation"
                >
                  📅 + New Reservation
                </button>
                <button
                  className="btn-refresh-orders"
                  onClick={fetchReservations}
                  disabled={reservationsLoading}
                  title="Refresh reservations"
                >
                  {reservationsLoading ? "Refreshing..." : "🔄 Refresh"}
                </button>
              </div>
            </div>

            {/* Metrics Row */}
            <div className="clean-stats-row reservation-stats-row">
              <div className="clean-stat-card blue">
                <div className="clean-stat-left">
                  <span className="clean-stat-label">Total Bookings</span>
                  <strong className="clean-stat-number">{reservationStats.total || reservations.length}</strong>
                  <span className="clean-stat-sub">Lifetime guest reservations</span>
                </div>
                <div className="clean-stat-icon">📅</div>
              </div>

              <div className="clean-stat-card orange">
                <div className="clean-stat-left">
                  <span className="clean-stat-label">Today's Bookings</span>
                  <strong className="clean-stat-number">{reservationStats.today}</strong>
                  <span className="clean-stat-sub">Scheduled for today</span>
                </div>
                <div className="clean-stat-icon">⏰</div>
              </div>

              <div className="clean-stat-card green">
                <div className="clean-stat-left">
                  <span className="clean-stat-label">Confirmed / Upcoming</span>
                  <strong className="clean-stat-number">{reservationStats.confirmed}</strong>
                  <span className="clean-stat-sub">Ready to be seated</span>
                </div>
                <div className="clean-stat-icon">✅</div>
              </div>

              <div className="clean-stat-card red">
                <div className="clean-stat-left">
                  <span className="clean-stat-label">Currently Seated</span>
                  <strong className="clean-stat-number">{reservationStats.seated}</strong>
                  <span className="clean-stat-sub">Dining on floor</span>
                </div>
                <div className="clean-stat-icon">🍽️</div>
              </div>
            </div>

            {/* Filter Tabs, Date Picker & Search Bar */}
            {(() => {
              const todayStr = new Date().toISOString().split("T")[0];
              const tomObj = new Date();
              tomObj.setDate(tomObj.getDate() + 1);
              const tomorrowStr = tomObj.toISOString().split("T")[0];

              return (
                <div className="reservation-controls-row">
                  <div className="table-filter-tabs">
                    {["All", "Today", "Tomorrow", "Confirmed", "Seated", "Completed", "Cancelled"].map((st) => {
                      const count = st === "All"
                        ? reservations.length
                        : st === "Today"
                        ? reservations.filter((r) => r.reservationDate === todayStr).length
                        : st === "Tomorrow"
                        ? reservations.filter((r) => r.reservationDate === tomorrowStr).length
                        : reservations.filter((r) => r.status === st).length;

                      const isTabActive = !reservationDateFilter && reservationFilter === st;

                      return (
                        <button
                          key={st}
                          type="button"
                          className={`table-filter-tab ${isTabActive ? "is-active" : ""}`}
                          onClick={() => {
                            setReservationDateFilter("");
                            setReservationFilter(st);
                          }}
                        >
                          {st === "Today" ? "📅 Today" : st === "Tomorrow" ? "🌅 Tomorrow" : st === "Confirmed" ? "✅ Confirmed" : st === "Seated" ? "🍽️ Seated" : st}
                          <span className="tab-count-pill">{count}</span>
                        </button>
                      );
                    })}
                  </div>

                  <div className="reservation-right-controls">
                    <div className="reservation-date-filter-box">
                      <span className="res-filter-icon">📅 Date:</span>
                      <input
                        type="date"
                        className="res-date-filter-picker"
                        value={reservationDateFilter}
                        onChange={(e) => {
                          setReservationDateFilter(e.target.value);
                          if (e.target.value) setReservationFilter("Custom");
                        }}
                        title="Filter by specific date"
                      />
                      {reservationDateFilter && (
                        <button
                          type="button"
                          className="res-clear-date-btn"
                          onClick={() => {
                            setReservationDateFilter("");
                            setReservationFilter("All");
                          }}
                          title="Clear specific date filter"
                        >
                          ✕
                        </button>
                      )}
                    </div>

                    <div className="reservation-search-box">
                      <span className="search-icon">🔍</span>
                      <input
                        type="text"
                        placeholder="Search guest, phone, table, or request..."
                        value={reservationSearch}
                        onChange={(e) => setReservationSearch(e.target.value)}
                      />
                      {reservationSearch && (
                        <button className="clear-search-btn" onClick={() => setReservationSearch("")}>✕</button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Reservations Grid */}
            {(() => {
              const todayStr = new Date().toISOString().split("T")[0];
              const tomObj = new Date();
              tomObj.setDate(tomObj.getDate() + 1);
              const tomorrowStr = tomObj.toISOString().split("T")[0];

              const filteredReservations = reservations.filter((res) => {
                if (reservationDateFilter) {
                  if (res.reservationDate !== reservationDateFilter) return false;
                } else if (reservationFilter === "Today") {
                  if (res.reservationDate !== todayStr) return false;
                } else if (reservationFilter === "Tomorrow") {
                  if (res.reservationDate !== tomorrowStr) return false;
                } else if (reservationFilter !== "All" && reservationFilter !== "Custom") {
                  if (res.status !== reservationFilter) return false;
                }

                if (reservationSearch.trim()) {
                  const q = reservationSearch.toLowerCase().trim();
                  const matchesName = (res.customerName || "").toLowerCase().includes(q);
                  const matchesPhone = (res.customerPhone || "").includes(q);
                  const matchesTable = (res.tableNumber || "").toLowerCase().includes(q);
                  const matchesReq = (res.specialRequest || "").toLowerCase().includes(q);
                  if (!matchesName && !matchesPhone && !matchesTable && !matchesReq) return false;
                }
                return true;
              });

              if (filteredReservations.length === 0) {
                return (
                  <div className="empty-module-state">
                    <div className="empty-icon">📅</div>
                    <h3>No reservations found</h3>
                    <p>No table bookings match your selected filter or search query.</p>
                    <button
                      type="button"
                      className="btn-add-table-header"
                      style={{ marginTop: "14px" }}
                      onClick={openAddReservation}
                    >
                      📅 + Book New Reservation
                    </button>
                  </div>
                );
              }

              return (
                <div className="admin-reservations-grid">
                  {filteredReservations.map((resItem) => {
                    const stLower = (resItem.status || "confirmed").toLowerCase().replace(/\s+/g, "-");
                    const isToday = resItem.reservationDate === todayStr;
                    const isTomorrow = resItem.reservationDate === tomorrowStr;

                    return (
                      <article key={resItem._id} className={`admin-reservation-card res-status-${stLower}`}>
                        <div className="res-card-header">
                          <div className="res-guest-info">
                            <h3>{resItem.customerName}</h3>
                            <div className="res-contact-info">
                              <span>📞 {resItem.customerPhone}</span>
                              {resItem.customerEmail && <span>✉️ {resItem.customerEmail}</span>}
                            </div>
                          </div>
                          <div className="res-header-badge-group">
                            <span className={`res-pill-badge res-badge-${stLower}`}>
                              {resItem.status}
                            </span>
                            <button
                              type="button"
                              className="btn-delete-table-card"
                              onClick={() => handleDeleteReservation(resItem._id, resItem.customerName)}
                              title="Cancel & Delete Reservation"
                            >
                              🗑️
                            </button>
                          </div>
                        </div>

                        <div className="res-details-box">
                          <div className="res-detail-item">
                            <span className="res-label">Party Size:</span>
                            <strong>👥 {resItem.guestsCount || 2} Guests</strong>
                          </div>

                          <div className="res-detail-item">
                            <span className="res-label">Booking Schedule:</span>
                            <strong className={isToday ? "highlight-today" : isTomorrow ? "highlight-tomorrow" : ""}>
                              📅 {resItem.reservationDate} {isToday && <span className="today-badge">TODAY</span>} {isTomorrow && <span className="tomorrow-badge">TOMORROW</span>}
                            </strong>
                            <span className="res-time-text">⏰ {resItem.reservationTime}</span>
                          </div>

                          <div className="res-detail-item">
                            <span className="res-label">Assigned Table:</span>
                            <strong>{resItem.tableNumber ? `🪑 ${resItem.tableNumber}` : "Unassigned"}</strong>
                          </div>
                        </div>

                        {resItem.specialRequest && (
                          <div className="res-special-request">
                            <span>📝 Note:</span> {resItem.specialRequest}
                          </div>
                        )}

                        <div className="res-card-actions">
                          <button
                            type="button"
                            className="btn-res-action btn-res-edit"
                            onClick={() => openEditReservation(resItem)}
                            title="Edit reservation details"
                          >
                            ✏️ Edit
                          </button>

                          {resItem.status === "Confirmed" && (
                            <button
                              type="button"
                              className="btn-res-action btn-res-seat"
                              onClick={() => handleUpdateReservationStatus(resItem._id, "Seated")}
                              title="Seat guests at their table"
                            >
                              🍽️ Mark Seated
                            </button>
                          )}

                          {resItem.status === "Seated" && (
                            <button
                              type="button"
                              className="btn-res-action btn-res-complete"
                              onClick={() => handleUpdateReservationStatus(resItem._id, "Completed")}
                              title="Complete reservation & release table"
                            >
                              ✅ Complete
                            </button>
                          )}

                          {["Confirmed", "Seated"].includes(resItem.status) && (
                            <button
                              type="button"
                              className="btn-res-action btn-res-cancel"
                              onClick={() => handleUpdateReservationStatus(resItem._id, "Cancelled")}
                              title="Cancel reservation"
                            >
                              ✕ Cancel
                            </button>
                          )}

                          {["Completed", "Cancelled"].includes(resItem.status) && (
                            <button
                              type="button"
                              className="btn-res-action btn-res-reopen"
                              onClick={() => handleUpdateReservationStatus(resItem._id, "Confirmed")}
                              title="Reopen as Confirmed"
                            >
                              🔄 Reconfirm
                            </button>
                          )}
                        </div>
                      </article>
                    );
                  })}
                </div>
              );
            })()}
          </section>

        ) : isQRManagementView ? (

          <QRManagement
            currentRestaurant={
              isRestaurantAdmin
                ? adminUser
                : (restaurants.find((r) => r._id === selectedRestaurantId || r.restaurantId === selectedRestaurantId) || adminUser)
            }
            onBack={() => setActiveMenu("Dashboard")}
          />

        ) : isSettingsView ? (

          <div className="admin-settings-container">
            <div className="admin-settings-header">
              <div className="admin-settings-header-left">
                <h2>⚙️ Restaurant Settings</h2>
                <p>Manage restaurant profile and update security credentials</p>
              </div>
            </div>

            <div className="admin-settings-grid">
              {/* Restaurant Info Card */}
              <div className="admin-settings-card">
                <div className="admin-settings-card-header">
                  <span className="admin-settings-card-icon">🏢</span>
                  <div>
                    <h3>Restaurant Profile</h3>
                    <p>Details registered for your restaurant account</p>
                  </div>
                </div>

                <div className="admin-settings-profile-body">
                  <div className="admin-settings-profile-top">
                    <div className="admin-settings-avatar">
                      {(adminUser?.restaurantName || adminUser?.ownerName || "R").charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="admin-settings-name">{adminUser?.restaurantName || "Restaurant Name"}</h4>
                      <span className="admin-settings-id-tag">ID: {adminUser?.restaurantId || adminUser?.restaurantCode || adminUser?._id || adminUser?.id || "N/A"}</span>
                    </div>
                  </div>

                  <div className="admin-settings-details-list">
                    <div className="admin-settings-detail-item">
                      <span className="detail-label">👤 Owner Name</span>
                      <span className="detail-val">{adminUser?.ownerName || adminUser?.name || "—"}</span>
                    </div>
                    <div className="admin-settings-detail-item">
                      <span className="detail-label">✉️ Email</span>
                      <span className="detail-val">{adminUser?.email || "—"}</span>
                    </div>
                    <div className="admin-settings-detail-item">
                      <span className="detail-label">📞 Phone</span>
                      <span className="detail-val">{adminUser?.phone || "—"}</span>
                    </div>
                    <div className="admin-settings-detail-item">
                      <span className="detail-label">📍 Address</span>
                      <span className="detail-val">
                        {[adminUser?.address, adminUser?.city, adminUser?.state, adminUser?.pincode].filter(Boolean).join(", ") || "—"}
                      </span>
                    </div>
                    <div className="admin-settings-detail-item">
                      <span className="detail-label">🟢 Status</span>
                      <span className="admin-settings-status-badge active">
                        {adminUser?.status || "Active"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Reset Password Card */}
              <div className="admin-settings-card">
                <div className="admin-settings-card-header">
                  <span className="admin-settings-card-icon">🔐</span>
                  <div>
                    <h3>Reset Password</h3>
                    <p>Change login password for this restaurant</p>
                  </div>
                </div>

                <form className="admin-settings-pwd-form" onSubmit={handleRestaurantResetPassword}>
                  {/* Hidden username input so Chrome browser popup identifies admin account instead of superadmin */}
                  <input
                    type="text"
                    name="username"
                    value={adminUser?.email || adminUser?.adminId || adminUser?.restaurantName || "admin"}
                    readOnly
                    autoComplete="username"
                    style={{ display: "none" }}
                  />

                  {restResetPwdMsg.text && (
                    <div className={`admin-settings-alert ${restResetPwdMsg.type === "success" ? "alert-success" : "alert-error"}`}>
                      {restResetPwdMsg.text}
                    </div>
                  )}

                  <div className="admin-settings-field">
                    <label>New Password *</label>
                    <div className="admin-settings-input-wrap">
                      <input
                        type={showRestPwd ? "text" : "password"}
                        name="new-password"
                        autoComplete="new-password"
                        className="admin-settings-input"
                        placeholder="Enter new password (min 6 characters)"
                        value={restResetPwd}
                        onChange={(e) => setRestResetPwd(e.target.value)}
                        required
                        minLength={6}
                      />
                      <button
                        type="button"
                        className="admin-pwd-toggle-btn"
                        onClick={() => setShowRestPwd((v) => !v)}
                        title={showRestPwd ? "Hide password" : "Show password"}
                      >
                        {showRestPwd ? (
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

                  <div className="admin-settings-field">
                    <label>Confirm New Password *</label>
                    <div className="admin-settings-input-wrap">
                      <input
                        type={showRestPwd ? "text" : "password"}
                        name="confirm-password"
                        autoComplete="new-password"
                        className="admin-settings-input"
                        placeholder="Re-enter new password"
                        value={restResetPwdConfirm}
                        onChange={(e) => setRestResetPwdConfirm(e.target.value)}
                        required
                        minLength={6}
                      />
                    </div>
                  </div>

                  <div className="admin-settings-hints">
                    <small>💡 Password must be at least 6 characters long.</small>
                  </div>

                  <button
                    type="submit"
                    className="admin-settings-submit-btn"
                    disabled={restResetPwdLoading}
                  >
                    {restResetPwdLoading ? "Resetting Password…" : "🔑 Reset Password"}
                  </button>
                </form>
              </div>
            </div>
          </div>

        ) : (

          /* OTHER PAGES */

          <div className="module-page">


            <div className="module-icon">
              {menuItems.find(
                (item) =>
                  item.name === activeMenu
              )?.icon || "📄"}
            </div>

            <h2>{activeMenu}</h2>

            <p>
              {activeMenu} module is ready
              for implementation.
            </p>

            <button
              className="back-dashboard"
              onClick={() =>
                setActiveMenu("Dashboard")
              }
            >
              {"\u2190"} Back to Dashboard
            </button>

          </div>

        )}

      </main>

      {/* ================= ADMIN CREATE ORDER MODAL ================= */}
      {showAdminCreateOrderModal && (
        <div
          className="admin-profile-backdrop admin-create-order-backdrop"
          onClick={() => !adminOrderSubmitting && setShowAdminCreateOrderModal(false)}
        >
          <div
            className="admin-create-order-modal"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="admin-create-order-header">
              <div className="admin-create-order-title">
                <span className="order-modal-header-icon">📝</span>
                <div>
                  <h3>Create New Order</h3>
                  <p>Place manual table order for dining guests & transmit directly to kitchen.</p>
                </div>
              </div>
              <button
                type="button"
                className="admin-profile-close-btn"
                onClick={() => setShowAdminCreateOrderModal(false)}
                title="Close"
                disabled={adminOrderSubmitting}
              >
                ✕
              </button>
            </div>

            {/* Success Alert */}
            {adminOrderSuccess && (
              <div className="admin-order-alert success">
                {adminOrderSuccess}
              </div>
            )}

            {/* Modal Body: 2 Columns */}
            <div className="admin-create-order-body">
              {/* Left Column: Table Info, Search, Categories & Menu Grid */}
              <div className="admin-order-left-pane">
                {/* Table & Customer Row */}
                <div className="admin-order-top-fields">
                  <div className="admin-order-field">
                    <label>Dining Table <span className="req">*</span></label>
                    <select
                      value={adminOrderTable}
                      onChange={(e) => {
                        const chosen = e.target.value;
                        setAdminOrderTable(chosen);
                        const target = (dashboardSummary.tables || []).find(
                          (t) => String(t.tableNumber).trim().toLowerCase() === String(chosen).trim().toLowerCase()
                        );
                        if (target && ["Cleaning", "Out of Service"].includes(target.status)) {
                          setAdminOrderError(`⛔ Table ${chosen} is currently ${target.status}! Please select another table.`);
                          setAdminOccupiedModal({
                            tableNumber: chosen,
                            status: target.status,
                          });
                        } else {
                          if (adminOrderError) setAdminOrderError("");
                        }
                      }}
                      className={`admin-order-select ${!adminOrderTable && adminOrderCart.length ? "highlight-needed" : ""}`}
                      required
                    >
                      <option value="">-- Select Table --</option>
                      {(dashboardSummary.tables || []).map((t) => {
                        const isAvail = t.status === "Available";
                        const isOcc = t.status === "Occupied";
                        return (
                          <option key={t._id} value={t.tableNumber}>
                            {isAvail ? `🟢 ${t.tableNumber} (Available)` : isOcc ? `🔴 ${t.tableNumber} (Occupied)` : `⛔ ${t.tableNumber} (${t.status})`}
                          </option>
                        );
                      })}
                    </select>
                  </div>

                  <div className="admin-order-field">
                    <label>Customer Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Walk-in Customer"
                      value={adminOrderCustomerName}
                      onChange={(e) => setAdminOrderCustomerName(e.target.value)}
                      className="admin-order-input"
                    />
                  </div>

                  <div className="admin-order-field">
                    <label>Customer Phone</label>
                    <input
                      type="tel"
                      placeholder="e.g. 9876543210"
                      value={adminOrderCustomerPhone}
                      onChange={(e) => setAdminOrderCustomerPhone(e.target.value)}
                      className="admin-order-input"
                    />
                  </div>
                </div>

                {/* Search, View Mode & Categories Bar */}
                <div className="admin-order-menu-controls">
                  <div className="admin-order-search-and-view">
                    <div className="admin-order-search-box">
                      <span>🔍</span>
                      <input
                        type="text"
                        placeholder="Search menu, drinks…"
                        value={adminOrderSearch}
                        onChange={(e) => setAdminOrderSearch(e.target.value)}
                      />
                      {adminOrderSearch && (
                        <button type="button" onClick={() => setAdminOrderSearch("")}>✕</button>
                      )}
                    </div>
                    <div className="admin-order-view-toggle">
                      <button
                        type="button"
                        className={`admin-view-toggle-btn ${adminOrderViewMode === "grid" ? "active" : ""}`}
                        onClick={() => setAdminOrderViewMode("grid")}
                        title="Card Grid View"
                      >
                        ⊞ Cards
                      </button>
                      <button
                        type="button"
                        className={`admin-view-toggle-btn ${adminOrderViewMode === "list" ? "active" : ""}`}
                        onClick={() => setAdminOrderViewMode("list")}
                        title="Compact List View"
                      >
                        ☰ List
                      </button>
                    </div>
                  </div>

                  <div className="admin-order-filter-row">
                    {/* Diet Filter Group: All / Veg / Non-Veg */}
                    <div className="admin-diet-filter-group">
                      <button
                        type="button"
                        className={`admin-diet-btn all ${adminOrderDietFilter === "All" ? "active" : ""}`}
                        onClick={() => setAdminOrderDietFilter("All")}
                      >
                        🍽️ All
                      </button>
                      <button
                        type="button"
                        className={`admin-diet-btn veg ${adminOrderDietFilter === "Veg" ? "active" : ""}`}
                        onClick={() => setAdminOrderDietFilter("Veg")}
                      >
                        🟢 Veg
                      </button>
                      <button
                        type="button"
                        className={`admin-diet-btn non-veg ${adminOrderDietFilter === "Non-Veg" ? "active" : ""}`}
                        onClick={() => setAdminOrderDietFilter("Non-Veg")}
                      >
                        🔴 Non-Veg
                      </button>
                    </div>

                    {/* Category Tabs: Scrollable */}
                    <div className="admin-order-categories-tabs">
                      {["All", ...new Set(menuEntries.map((m) => m.category).filter(Boolean))].map((cat) => (
                        <button
                          key={cat}
                          type="button"
                          className={`admin-order-cat-chip ${adminOrderCategory === cat ? "active" : ""}`}
                          onClick={() => setAdminOrderCategory(cat)}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Menu Items Container: Grid View or List View */}
                {adminOrderViewMode === "grid" ? (
                  <div className="admin-order-items-grid">
                    {menuEntries
                      .filter((m) => m.inStock !== false)
                      .filter((m) => adminOrderCategory === "All" || m.category === adminOrderCategory)
                      .filter((m) => adminOrderDietFilter === "All" || (adminOrderDietFilter === "Veg" ? (m.type || "").toLowerCase() === "veg" : (m.type || "").toLowerCase() !== "veg"))
                      .filter((m) => `${m.name} ${m.description || ""}`.toLowerCase().includes(adminOrderSearch.toLowerCase()))
                      .sort((a, b) => {
                        const aIsVeg = (a.type || "").toLowerCase() === "veg";
                        const bIsVeg = (b.type || "").toLowerCase() === "veg";
                        if (aIsVeg && !bIsVeg) return -1;
                        if (!aIsVeg && bIsVeg) return 1;
                        return 0;
                      })
                      .map((item) => {
                        const inCart = adminOrderCart.find((c) => c._id === item._id);
                        const isVeg = (item.type || "").toLowerCase() === "veg";
                        const imgUrl = getMenuImage(item);
                        return (
                          <div key={item._id} className={`admin-food-card ${inCart ? "is-selected" : ""}`}>
                            <div className="admin-food-thumb">
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
                                style={{ display: imgUrl ? "none" : "flex" }}
                              >
                                {isVeg ? "🥗" : "🍗"}
                              </div>
                              <span className={`admin-food-badge ${isVeg ? "veg" : "non-veg"}`}>
                                {item.type || (isVeg ? "Veg" : "Non-Veg")}
                              </span>
                            </div>
                            <div className="admin-food-info">
                              <h4 className="admin-food-name" title={item.name}>{item.name}</h4>
                              <p className="admin-food-desc" title={item.description || item.category}>
                                {item.description || `${item.category || "Fresh"} • Freshly prepared`}
                              </p>
                              <div className="admin-food-footer">
                                <span className="admin-food-price">₹{Number(item.price || 0)}</span>
                                {inCart ? (
                                  <div className="admin-food-stepper">
                                    <button type="button" onClick={() => handleAdminUpdateCartQty(item._id, inCart.quantity - 1)}>−</button>
                                    <span>{inCart.quantity}</span>
                                    <button type="button" onClick={() => handleAdminUpdateCartQty(item._id, inCart.quantity + 1)}>+</button>
                                  </div>
                                ) : (
                                  <button type="button" className="admin-food-add-btn" onClick={() => handleAdminAddCartItem(item)}>
                                    + ADD
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    {!menuEntries.length && (
                      <div className="admin-no-items">
                        <p>Loading menu items or no items found.</p>
                        <button type="button" onClick={fetchMenu}>Fetch Menu</button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="admin-order-items-list">
                    {menuEntries
                      .filter((m) => m.inStock !== false)
                      .filter((m) => adminOrderCategory === "All" || m.category === adminOrderCategory)
                      .filter((m) => adminOrderDietFilter === "All" || (adminOrderDietFilter === "Veg" ? (m.type || "").toLowerCase() === "veg" : (m.type || "").toLowerCase() !== "veg"))
                      .filter((m) => `${m.name} ${m.description || ""}`.toLowerCase().includes(adminOrderSearch.toLowerCase()))
                      .sort((a, b) => {
                        const aIsVeg = (a.type || "").toLowerCase() === "veg";
                        const bIsVeg = (b.type || "").toLowerCase() === "veg";
                        if (aIsVeg && !bIsVeg) return -1;
                        if (!aIsVeg && bIsVeg) return 1;
                        return 0;
                      })
                      .map((item) => {
                        const inCart = adminOrderCart.find((c) => c._id === item._id);
                        const isVeg = (item.type || "").toLowerCase() === "veg";
                        const imgUrl = getMenuImage(item);
                        return (
                          <div key={item._id} className={`admin-food-list-row ${inCart ? "is-selected" : ""}`}>
                            <div className="admin-food-list-left">
                              <div className="admin-food-list-thumb-wrap">
                                {imgUrl ? (
                                  <img
                                    src={imgUrl}
                                    alt={item.name}
                                    className="admin-food-list-thumb"
                                    onError={(e) => {
                                      e.currentTarget.style.display = "none";
                                      const fb = e.currentTarget.parentElement?.querySelector(".admin-food-list-thumb-fallback");
                                      if (fb) fb.style.display = "flex";
                                    }}
                                  />
                                ) : null}
                                <div
                                  className="admin-food-list-thumb-fallback"
                                  style={{ display: imgUrl ? "none" : "flex" }}
                                >
                                  {isVeg ? "🥗" : "🍗"}
                                </div>
                              </div>
                              <div className="admin-food-list-details">
                                <div className="admin-food-list-name-row">
                                  <span className={`admin-food-dot ${isVeg ? "veg" : "non-veg"}`} title={item.type || "Veg"}></span>
                                  <span className="admin-food-list-name" title={item.name}>{item.name}</span>
                                  {item.category && <span className="admin-food-list-cat">{item.category}</span>}
                                </div>
                                <span className="admin-food-list-desc">
                                  {item.description ? item.description.slice(0, 50) + (item.description.length > 50 ? "…" : "") : "Freshly prepared"}
                                </span>
                              </div>
                            </div>

                            <div className="admin-food-list-right">
                              <span className="admin-food-price">₹{Number(item.price || 0)}</span>
                              {inCart ? (
                                <div className="admin-food-stepper">
                                  <button type="button" onClick={() => handleAdminUpdateCartQty(item._id, inCart.quantity - 1)}>−</button>
                                  <span>{inCart.quantity}</span>
                                  <button type="button" onClick={() => handleAdminUpdateCartQty(item._id, inCart.quantity + 1)}>+</button>
                                </div>
                              ) : (
                                <button type="button" className="admin-food-add-btn" onClick={() => handleAdminAddCartItem(item)}>
                                  + ADD
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    {!menuEntries.length && (
                      <div className="admin-no-items">
                        <p>Loading menu items or no items found.</p>
                        <button type="button" onClick={fetchMenu}>Fetch Menu</button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Right Column: Order Summary */}
              <div className="admin-order-right-pane">
                <div className="admin-cart-box">
                  <div className="admin-cart-header">
                    <h4>🛒 Order Summary</h4>
                    <span className="admin-cart-count-badge">
                      {adminOrderCart.reduce((sum, i) => sum + i.quantity, 0)} items
                    </span>
                  </div>

                  {adminOrderTable && (
                    <div className="admin-cart-table-pill">
                      🪑 Table: <strong>{adminOrderTable}</strong>
                    </div>
                  )}

                  <div className="admin-cart-items-list">
                    {/* Running Order Section (If table has active order) */}
                    {activeAdminTableOrder && (
                      <div className="admin-running-order-section">
                        <div className="admin-running-order-header">
                          <div className="admin-running-title">
                            <span className="admin-running-icon">📋</span>
                            <div>
                              <strong>Running Order · {formatTableName(adminOrderTable)}</strong>
                              <small>Order #{activeAdminTableOrder._id?.slice(-6)?.toUpperCase()} · {activeAdminTableOrder.status || "In Kitchen"}</small>
                            </div>
                          </div>
                          <span className="admin-running-badge-pill">Already Placed</span>
                        </div>

                        <div className="admin-running-items-list">
                          {activeAdminTableOrder.items && activeAdminTableOrder.items.length > 0 ? (
                            activeAdminTableOrder.items.map((item, idx) => (
                              <div className="admin-running-item-row" key={`running-${item._id || idx}`}>
                                <div className="admin-running-item-details">
                                  <span className="admin-running-item-name">{item.name}</span>
                                  {item.selectedModifiers && item.selectedModifiers.length > 0 && (
                                    <small className="admin-running-item-mods">
                                      {item.selectedModifiers.map((m) => m.name).join(", ")}
                                    </small>
                                  )}
                                  <span className="admin-running-item-price">
                                    ₹{item.price} × {item.quantity}
                                  </span>
                                </div>
                                <div className="admin-running-item-right">
                                  <strong className="admin-running-item-total">₹{item.price * item.quantity}</strong>
                                  <button
                                    type="button"
                                    className="admin-btn-quick-reorder-add"
                                    onClick={() => {
                                      const matched = menuEntries.find(
                                        (m) =>
                                          String(m._id) === String(item.menuItemId || item._id) ||
                                          String(m.name).trim().toLowerCase() === String(item.name).trim().toLowerCase()
                                      );
                                      if (matched) {
                                        handleAdminAddCartItem(matched);
                                      } else {
                                        handleAdminAddCartItem(item);
                                      }
                                    }}
                                    title="Add 1 more to re-order"
                                  >
                                    + Add
                                  </button>
                                </div>
                              </div>
                            ))
                          ) : (
                            <div className="admin-no-running-items">No items on running order.</div>
                          )}
                        </div>

                        <div className="admin-running-subtotal-row">
                          <span>Running Order Total:</span>
                          <strong>₹{existingRunningTotal}</strong>
                        </div>
                      </div>
                    )}

                    {/* Re-Order / New Items Section */}
                    <div className="admin-new-order-section">
                      {activeAdminTableOrder && (
                        <div className="admin-new-items-section-header">
                          <span>🛒 New Items to Add (Re-Order)</span>
                          {adminOrderCart.length > 0 && (
                            <span className="admin-new-items-count-pill">
                              +{adminOrderCart.reduce((sum, i) => sum + i.quantity, 0)} items
                            </span>
                          )}
                        </div>
                      )}

                      {adminOrderCart.length ? (
                        adminOrderCart.map((item) => (
                          <div key={item._id} className="admin-cart-item-row">
                            <div className="admin-cart-item-info">
                              <b>{item.name}</b>
                              <small>₹{item.price} each</small>
                            </div>
                            <div className="admin-cart-item-actions">
                              <div className="admin-cart-stepper-mini">
                                <button type="button" onClick={() => handleAdminUpdateCartQty(item._id, item.quantity - 1)}>−</button>
                                <span>{item.quantity}</span>
                                <button type="button" onClick={() => handleAdminUpdateCartQty(item._id, item.quantity + 1)}>+</button>
                              </div>
                              <strong className="admin-cart-item-subtotal">₹{item.price * item.quantity}</strong>
                              <button
                                type="button"
                                className="admin-cart-remove-btn"
                                onClick={() => handleAdminUpdateCartQty(item._id, 0)}
                                title="Remove item"
                              >
                                ✕
                              </button>
                            </div>
                          </div>
                        ))
                      ) : activeAdminTableOrder ? (
                        <div className="admin-running-reorder-hint">
                          <span>➕</span>
                          <span>Tap any menu item to add it to this table's re-order.</span>
                        </div>
                      ) : (
                        <div className="admin-cart-empty">
                          <span>🍽️</span>
                          <p>No dishes added yet. Click <strong>+ ADD</strong> on dishes to build order.</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Calculations */}
                  {(() => {
                    const subtotal = adminOrderCart.reduce((s, i) => s + i.price * i.quantity, 0);
                    const tax = Number((subtotal * 0.05).toFixed(2));
                    const newGrandTotal = Number((subtotal + tax).toFixed(2));
                    const combinedTotal = Number((existingRunningTotal + newGrandTotal).toFixed(2));

                    return (
                      <div className="admin-cart-totals">
                        {activeAdminTableOrder ? (
                          <>
                            <div className="totals-row">
                              <span><b>Current Order (Running):</b></span>
                              <span>₹{existingRunningTotal}</span>
                            </div>
                            {adminOrderCart.length > 0 && (
                              <div className="totals-row" style={{ color: "#2563eb" }}>
                                <span><b>+ New Re-Order Items:</b></span>
                                <span>₹{newGrandTotal}</span>
                              </div>
                            )}
                            <div className="totals-row grand-total">
                              <span>{adminOrderCart.length > 0 ? "Combined Total Amount:" : "Running Total Amount:"}</span>
                              <span>₹{adminOrderCart.length > 0 ? combinedTotal : existingRunningTotal}</span>
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="totals-row">
                              <span>Subtotal:</span>
                              <span>₹{subtotal}</span>
                            </div>
                            <div className="totals-row">
                              <span>GST (5%):</span>
                              <span>₹{tax}</span>
                            </div>
                            <div className="totals-row grand-total">
                              <span>Total Amount:</span>
                              <span>₹{newGrandTotal}</span>
                            </div>
                          </>
                        )}

                        <div className="admin-cart-submit-btns">
                          {(() => {
                            const target = (dashboardSummary.tables || []).find(
                              (t) => String(t.tableNumber).trim().toLowerCase() === String(adminOrderTable).trim().toLowerCase()
                            );
                            if (target && target.status === "Occupied") {
                              return (
                                <div className="admin-order-table-reminder" style={{ background: "#f0fdf4", borderColor: "#bbf7d0", color: "#166534" }}>
                                  🔄 Re-order for {formatTableName(adminOrderTable)} (Running Table)
                                </div>
                              );
                            }
                            if (target && ["Cleaning", "Out of Service"].includes(target.status)) {
                              return (
                                <div className="admin-order-table-reminder" style={{ background: "#fee2e2", borderColor: "#fca5a5", color: "#991b1b" }}>
                                  ⛔ {formatTableName(adminOrderTable)} is currently {target.status}. Orders cannot be placed.
                                </div>
                              );
                            }
                            return null;
                          })()}
                          {!adminOrderTable && adminOrderCart.length > 0 && (
                            <div className="admin-order-table-reminder">
                              ⚠️ Table not selected! Pick a dining table above.
                            </div>
                          )}
                          {adminOrderError && (
                            <div className="admin-order-inline-error" style={{ background: "#fef2f2", color: "#b91c1c", border: "1.5px solid #fca5a5", padding: "10px 14px", borderRadius: "10px", fontSize: "12.5px", fontWeight: "600", marginBottom: "10px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px" }}>
                              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                <span>⚠️</span>
                                <span>{adminOrderError}</span>
                              </div>
                              <button type="button" onClick={() => setAdminOrderError("")} style={{ border: "none", background: "none", color: "#b91c1c", cursor: "pointer", fontWeight: "bold", fontSize: "16px", padding: "0 4px" }}>✕</button>
                            </div>
                          )}
                          <button
                            type="button"
                            className="btn-admin-order-submit"
                            onClick={handleAdminSubmitOrder}
                            disabled={adminOrderSubmitting || !adminOrderCart.length || !adminOrderTable}
                          >
                            {adminOrderSubmitting
                              ? "Placing Order..."
                              : activeAdminTableOrder
                              ? adminOrderCart.length > 0
                                ? `🚀 Place Re-Order & Send to Kitchen (+${adminOrderCart.reduce((sum, i) => sum + i.quantity, 0)} items)`
                                : "🛒 Add Items to Place Re-Order"
                              : "🚀 Place Order & Send to Kitchen"}
                          </button>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>
            </div>

            {/* FLOATING MOBILE CART / PLACE ORDER BAR */}
            {adminOrderCart.length > 0 && (
              <div className="admin-order-mobile-float-bar">
                <div
                  className="admin-float-bar-details"
                  onClick={() => {
                    const rightPane = document.querySelector('.admin-order-right-pane');
                    if (rightPane) rightPane.scrollIntoView({ behavior: 'smooth' });
                  }}
                  title="Tap to review cart items"
                >
                  <div className="admin-float-cart-pill">
                    <span>🛒</span>
                    <strong>{adminOrderCart.reduce((sum, i) => sum + i.quantity, 0)}</strong>
                  </div>
                  <div className="admin-float-price-group">
                    <span className="admin-float-grand-price">
                      ₹{(() => {
                        const sub = adminOrderCart.reduce((s, i) => s + i.price * i.quantity, 0);
                        const gst = Math.round(sub * 0.05);
                        return activeAdminTableOrder ? (existingRunningTotal + sub + gst) : (sub + gst);
                      })()}
                    </span>
                    <span className="admin-float-table-label">
                      {adminOrderTable ? `Table: ${formatTableName(adminOrderTable)}` : "⚠️ Tap to pick table"} · Review ↗
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  className="btn-admin-float-order-submit"
                  onClick={(e) => {
                    if (!adminOrderTable) {
                      setAdminOrderError("Please select a Dining Table above before placing the order!");
                      const sel = document.querySelector('.admin-order-select');
                      if (sel) {
                        sel.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        sel.focus();
                      }
                      return;
                    }
                    handleAdminSubmitOrder(e);
                  }}
                  disabled={adminOrderSubmitting}
                >
                  {adminOrderSubmitting ? (
                    "Placing..."
                  ) : activeAdminTableOrder ? (
                    "🚀 Send Re-Order"
                  ) : (
                    "🚀 Place Order"
                  )}
                </button>
              </div>
            )}

            {/* SUCCESS POPUP WITH ORDER OPTIONS */}
            {adminOrderSuccessModal && (
              <div
                className="admin-order-success-overlay"
                onClick={() => setAdminOrderSuccessModal(null)}
              >
                <div
                  className="admin-order-success-card"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="admin-success-icon-badge">
                    👨‍🍳
                    <div className="admin-success-check-bubble">✓</div>
                  </div>
                  <h3 className="admin-success-title">Sent to Kitchen Successfully!</h3>
                  <p className="admin-success-desc">
                    Order <strong>#{adminOrderSuccessModal.orderId}</strong> for{" "}
                    <strong>{adminOrderSuccessModal.tableNumber}</strong> has been transmitted to the kitchen.
                  </p>

                  <div className="admin-success-details-box">
                    <div className="admin-detail-row">
                      <span>Table:</span>
                      <strong>{adminOrderSuccessModal.tableNumber}</strong>
                    </div>
                    <div className="admin-detail-row">
                      <span>Customer:</span>
                      <strong>{adminOrderSuccessModal.customerName}</strong>
                    </div>
                    <div className="admin-detail-row">
                      <span>Total Items:</span>
                      <strong>{adminOrderSuccessModal.itemCount} items</strong>
                    </div>
                    <div className="admin-detail-row row-amount">
                      <span>Total Amount:</span>
                      <strong>₹{adminOrderSuccessModal.totalAmount}</strong>
                    </div>
                  </div>

                  <div className="admin-success-actions">
                    <button
                      type="button"
                      className="btn-admin-create-next"
                      onClick={() => {
                        const currentTable = adminOrderSuccessModal.tableNumber;
                        setAdminOrderSuccessModal(null);
                        setAdminOrderCart([]);
                        setAdminOrderTable(currentTable);
                        setAdminOrderError("");
                        setAdminOrderSuccess(`🟢 Table ${currentTable} selected. Add items to place another order for this table.`);
                      }}
                    >
                      ＋ Create Another Order for {adminOrderSuccessModal.tableNumber}
                    </button>
                    <button
                      type="button"
                      className="btn-admin-new-table"
                      onClick={() => {
                        setAdminOrderSuccessModal(null);
                        setAdminOrderCart([]);
                        setAdminOrderTable("");
                        setAdminOrderCustomerName("");
                        setAdminOrderCustomerPhone("");
                        setAdminOrderError("");
                        setAdminOrderSuccess("");
                      }}
                    >
                      🪑 Order for Different Table
                    </button>
                    <button
                      type="button"
                      className="btn-admin-close-modal"
                      onClick={() => {
                        setAdminOrderSuccessModal(null);
                        setShowAdminCreateOrderModal(false);
                        setAdminOrderCart([]);
                        setAdminOrderTable("");
                        setAdminOrderSuccess("");
                      }}
                    >
                      ✓ Done / Go to Orders List
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* OCCUPIED TABLE WARNING MODAL */}
            {adminOccupiedModal && (
              <div
                className="admin-order-success-overlay"
                onClick={() => setAdminOccupiedModal(null)}
              >
                <div
                  className="admin-order-success-card"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="admin-success-icon-badge" style={{ background: "#fef2f2", borderColor: "#fecaca" }}>
                    ⚠️
                  </div>
                  <h3 className="admin-success-title" style={{ color: "#dc2626" }}>Table Already Occupied!</h3>
                  <p className="admin-success-desc">
                    <strong>{adminOccupiedModal.tableNumber}</strong> is already{" "}
                    <span style={{ color: "#dc2626", fontWeight: "800" }}>{adminOccupiedModal.status}</span>.
                  </p>
                  <p style={{ margin: "4px 0 14px", fontSize: "14px", color: "#475569", lineHeight: "1.5" }}>
                    This table is already occupied. Please select another table to place a new order.
                  </p>
                  <button
                    type="button"
                    className="btn-admin-create-next"
                    style={{ background: "linear-gradient(135deg, #dc2626, #b91c1c)" }}
                    onClick={() => {
                      setAdminOccupiedModal(null);
                      setAdminOrderTable("");
                      setAdminOrderError("");
                    }}
                  >
                    Choose Another Table
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ================= PROFILE MODAL ================= */}
      {showProfileModal && (
        <div
          className="admin-profile-backdrop"
          onClick={() => setShowProfileModal(false)}
        >
          <div
            className="admin-profile-modal"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="admin-profile-modal-header">
              <div className="admin-profile-title">
                <span className="profile-header-icon">🛡️</span>
                <div>
                  <h3>Admin Profile</h3>
                  <p>Account details and system credentials</p>
                </div>
              </div>
              <button
                className="admin-profile-close-btn"
                onClick={() => setShowProfileModal(false)}
                title="Close"
              >
                ✕
              </button>
            </div>

            {/* Profile Hero Banner */}
            <div className="admin-profile-hero">
              <div className="admin-hero-avatar-wrap">
                <div className="admin-hero-avatar">
                  {adminInitials}
                </div>
                <span className="admin-hero-status-dot" title="Active"></span>
              </div>
              <div className="admin-hero-info">
                <h4>{adminDisplayName}</h4>
                <p className="admin-hero-email">{adminDisplayEmail}</p>
                <div className="admin-hero-badges">
                  <span className="admin-role-badge">
                    👑 {adminDisplayRole}
                  </span>
                  <span className="admin-status-badge">
                    🟢 Active Now
                  </span>
                </div>
              </div>
            </div>

            {/* Profile Tabs */}
            <div className="admin-profile-tabs">
              <button
                className={`admin-profile-tab ${profileTab === "overview" ? "active" : ""}`}
                onClick={() => setProfileTab("overview")}
              >
                📋 Account Overview
              </button>
              <button
                className={`admin-profile-tab ${profileTab === "edit" ? "active" : ""}`}
                onClick={() => setProfileTab("edit")}
              >
                ✏️ Edit Profile
              </button>
            </div>

            {/* Modal Body */}
            <div className="admin-profile-body">
              {profileTab === "overview" ? (
                <div className="admin-profile-details-grid">
                  <div className="admin-detail-card">
                    <div className="admin-detail-icon">👤</div>
                    <div className="admin-detail-content">
                      <label>Full Name</label>
                      <strong>{adminDisplayName}</strong>
                    </div>
                  </div>

                  <div className="admin-detail-card">
                    <div className="admin-detail-icon">📧</div>
                    <div className="admin-detail-content">
                      <label>Email Address</label>
                      <strong>{adminDisplayEmail}</strong>
                    </div>
                  </div>

                  <div className="admin-detail-card">
                    <div className="admin-detail-icon">🛡️</div>
                    <div className="admin-detail-content">
                      <label>Assigned Role</label>
                      <strong>{adminDisplayRole}</strong>
                    </div>
                  </div>

                  <div className="admin-detail-card">
                    <div className="admin-detail-icon">🆔</div>
                    <div className="admin-detail-content">
                      <label>Admin ID</label>
                      <span className="admin-mono-id">{adminDisplayId}</span>
                    </div>
                  </div>

                  <div className="admin-detail-card">
                    <div className="admin-detail-icon">📱</div>
                    <div className="admin-detail-content">
                      <label>Contact Phone</label>
                      <strong>{adminDisplayPhone}</strong>
                    </div>
                  </div>

                  <div className="admin-detail-card">
                    <div className="admin-detail-icon">🔒</div>
                    <div className="admin-detail-content">
                      <label>Security Level</label>
                      <span className="security-tag">Full Administrator Access</span>
                    </div>
                  </div>

                  <div className="admin-detail-card">
                    <div className="admin-detail-icon">🕒</div>
                    <div className="admin-detail-content">
                      <label>Session Status</label>
                      <span className="status-live">🟢 Active Session</span>
                    </div>
                  </div>

                  <div className="admin-detail-card">
                    <div className="admin-detail-icon">🌐</div>
                    <div className="admin-detail-content">
                      <label>Portal</label>
                      <strong>FoodVista Central Admin</strong>
                    </div>
                  </div>
                </div>
              ) : (
                <form className="admin-profile-edit-form" onSubmit={handleSaveProfile}>
                  {profileSuccessMsg && (
                    <div className="admin-profile-alert success">
                      {profileSuccessMsg}
                    </div>
                  )}
                  {profileErrorMsg && (
                    <div className="admin-profile-alert error">
                      {profileErrorMsg}
                    </div>
                  )}

                  <div className="admin-profile-form-group">
                    <label>Admin Name *</label>
                    <input
                      type="text"
                      value={profileForm.name}
                      onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                      placeholder="Enter full name"
                      required
                    />
                  </div>

                  <div className="admin-profile-form-group">
                    <label>Email Address *</label>
                    <input
                      type="email"
                      value={profileForm.email}
                      onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                      placeholder="Enter email address"
                      required
                    />
                  </div>

                  <div className="admin-profile-form-group">
                    <label>Contact Phone</label>
                    <input
                      type="text"
                      value={profileForm.phone}
                      onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                      placeholder="e.g. +91 98765 43210"
                    />
                  </div>

                  <div className="admin-profile-form-actions">
                    <button
                      type="button"
                      className="btn-profile-secondary"
                      onClick={() => setProfileTab("overview")}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="btn-profile-primary"
                      disabled={profileSaving}
                    >
                      {profileSaving ? "Saving..." : "Save Changes"}
                    </button>
                  </div>
                </form>
              )}
            </div>

            {/* Modal Footer */}
            <div className="admin-profile-modal-footer">
              <button
                type="button"
                className="admin-profile-logout-btn"
                onClick={handleLogout}
              >
                <span>🚪</span> Sign Out
              </button>
              <div className="admin-profile-footer-right">
                {profileTab === "overview" && (
                  <button
                    type="button"
                    className="admin-profile-edit-btn"
                    onClick={() => setProfileTab("edit")}
                  >
                    ✏️ Edit Profile
                  </button>
                )}
                <button
                  type="button"
                  className="admin-profile-close-action-btn"
                  onClick={() => setShowProfileModal(false)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= ADD MANAGER MODAL ================= */}
      {showAddManagerModal && (
        <div
          className="admin-profile-backdrop staff-modal-backdrop"
          onClick={() => setShowAddManagerModal(false)}
        >
          <div
            className="admin-profile-modal staff-creation-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="admin-profile-modal-header staff-modal-header manager-header">
              <div className="admin-profile-title">
                <span className="profile-header-icon staff-modal-icon manager-icon">👔</span>
                <div>
                  <h3>Add New Manager</h3>
                  <p>Create restaurant manager login credentials and account</p>
                </div>
              </div>
              <button
                type="button"
                className="admin-profile-close-btn"
                onClick={() => setShowAddManagerModal(false)}
                title="Close"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateManager} className="staff-modal-form" autoComplete="off">
              {/* Dummy hidden inputs to prevent browser password autofill */}
              <input type="text" name="fake_email_prevent_autofill" style={{ display: "none" }} tabIndex="-1" autoComplete="off" />
              <input type="password" name="fake_pass_prevent_autofill" style={{ display: "none" }} tabIndex="-1" autoComplete="off" />

              <div className="admin-profile-body staff-modal-body">
                {staffActionError && (
                  <div className="admin-profile-alert error">
                    ⚠️ {staffActionError}
                  </div>
                )}
                {staffActionSuccess && (
                  <div className="admin-profile-alert success">
                    ✅ {staffActionSuccess}
                  </div>
                )}

                <div className="admin-profile-form-group">
                  <label>Assigned Restaurant *</label>
                  {isRestaurantAdmin ? (
                    <div className="staff-locked-restaurant">
                      <span className="rest-icon">🏪</span>
                      <span className="rest-name">
                        {adminUser?.restaurantName || adminUser?.ownerName || "My Restaurant"} ({adminUser?.restaurantId})
                      </span>
                      <span className="rest-badge">Locked to your restaurant</span>
                    </div>
                  ) : (
                    <select
                      className="staff-select-input"
                      value={managerForm.restaurantId}
                      onChange={(e) => setManagerForm({ ...managerForm, restaurantId: e.target.value })}
                      required
                    >
                      <option value="">-- Select Restaurant --</option>
                      {restaurants.map((r) => (
                        <option key={r._id} value={r._id}>
                          {r.restaurantName} ({r.restaurantId}) - {r.city || "Branch"}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                <div className="form-row-2">
                  <div className="admin-profile-form-group">
                    <label>Manager Full Name *</label>
                    <input
                      type="text"
                      name="mgr_fullname_new"
                      autoComplete="off"
                      placeholder="e.g. Rahul Sharma"
                      value={managerForm.name}
                      onChange={(e) => setManagerForm({ ...managerForm, name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="admin-profile-form-group">
                    <label>Phone Number</label>
                    <input
                      type="tel"
                      name="mgr_phone_new"
                      autoComplete="off"
                      placeholder="e.g. +91 98765 43210"
                      value={managerForm.phone}
                      onChange={(e) => setManagerForm({ ...managerForm, phone: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-row-2">
                  <div className="admin-profile-form-group">
                    <label>Email Address *</label>
                    <input
                      type="email"
                      name="mgr_email_new"
                      autoComplete="new-password"
                      placeholder="manager@foodvista.com"
                      value={managerForm.email}
                      onChange={(e) => setManagerForm({ ...managerForm, email: e.target.value })}
                      required
                    />
                  </div>
                  <div className="admin-profile-form-group">
                    <label>Login Password *</label>
                    <input
                      type="password"
                      name="mgr_password_new"
                      autoComplete="new-password"
                      placeholder="Enter strong password"
                      value={managerForm.password}
                      onChange={(e) => setManagerForm({ ...managerForm, password: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="staff-form-notice">
                  ℹ️ System will automatically assign a unique <strong>MGR ID</strong> on creation.
                </div>
              </div>

              <div className="admin-profile-modal-footer">
                <button
                  type="button"
                  className="btn-profile-secondary"
                  onClick={() => setShowAddManagerModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-profile-primary btn-save-manager"
                  disabled={staffActionLoading}
                >
                  {staffActionLoading ? "Creating Manager..." : "Create Manager Account"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= ADD WAITER MODAL ================= */}
      {showAddWaiterModal && (
        <div
          className="admin-profile-backdrop staff-modal-backdrop"
          onClick={() => setShowAddWaiterModal(false)}
        >
          <div
            className="admin-profile-modal staff-creation-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="admin-profile-modal-header staff-modal-header waiter-header">
              <div className="admin-profile-title">
                <span className="profile-header-icon staff-modal-icon waiter-icon">🍽️</span>
                <div>
                  <h3>Add New Waiter</h3>
                  <p>Create restaurant waiter account and service credentials</p>
                </div>
              </div>
              <button
                type="button"
                className="admin-profile-close-btn"
                onClick={() => setShowAddWaiterModal(false)}
                title="Close"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateWaiter} className="staff-modal-form">
              <div className="admin-profile-body staff-modal-body">
                {staffActionError && (
                  <div className="admin-profile-alert error">
                    ⚠️ {staffActionError}
                  </div>
                )}
                {staffActionSuccess && (
                  <div className="admin-profile-alert success">
                    ✅ {staffActionSuccess}
                  </div>
                )}

                <div className="admin-profile-form-group">
                  <label>Assigned Restaurant *</label>
                  {isRestaurantAdmin ? (
                    <div className="staff-locked-restaurant">
                      <span className="rest-icon">🏪</span>
                      <span className="rest-name">
                        {adminUser?.restaurantName || adminUser?.ownerName || "My Restaurant"} ({adminUser?.restaurantId})
                      </span>
                      <span className="rest-badge">Locked to your restaurant</span>
                    </div>
                  ) : (
                    <select
                      className="staff-select-input"
                      value={waiterForm.restaurantId}
                      onChange={(e) => setWaiterForm({ ...waiterForm, restaurantId: e.target.value })}
                      required
                    >
                      <option value="">-- Select Restaurant --</option>
                      {restaurants.map((r) => (
                        <option key={r._id} value={r._id}>
                          {r.restaurantName} ({r.restaurantId}) - {r.city || "Branch"}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                <div className="form-row-2">
                  <div className="admin-profile-form-group">
                    <label>Waiter Full Name *</label>
                    <input
                      type="text"
                      placeholder="e.g. Ramesh Kumar"
                      value={waiterForm.name}
                      onChange={(e) => setWaiterForm({ ...waiterForm, name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="admin-profile-form-group">
                    <label>Login Password *</label>
                    <input
                      type="password"
                      name="waiter_password_new"
                      autoComplete="new-password"
                      placeholder="Enter login password"
                      value={waiterForm.password}
                      onChange={(e) => setWaiterForm({ ...waiterForm, password: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="form-row-2">
                  <div className="admin-profile-form-group">
                    <label>Email Address</label>
                    <input
                      type="email"
                      name="waiter_email_new"
                      autoComplete="new-password"
                      placeholder="waiter@foodvista.com (optional)"
                      value={waiterForm.email}
                      onChange={(e) => setWaiterForm({ ...waiterForm, email: e.target.value })}
                    />
                  </div>
                  <div className="admin-profile-form-group">
                    <label>Phone Number</label>
                    <input
                      type="tel"
                      placeholder="e.g. +91 98765 43210"
                      value={waiterForm.phone}
                      onChange={(e) => setWaiterForm({ ...waiterForm, phone: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-row-2">
                  <div className="admin-profile-form-group">
                    <label>Gender</label>
                    <select
                      className="staff-select-input"
                      value={waiterForm.gender}
                      onChange={(e) => setWaiterForm({ ...waiterForm, gender: e.target.value })}
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div className="admin-profile-form-group">
                    <label>Address</label>
                    <input
                      type="text"
                      placeholder="Local area or address"
                      value={waiterForm.address}
                      onChange={(e) => setWaiterForm({ ...waiterForm, address: e.target.value })}
                    />
                  </div>
                </div>

                <div className="staff-form-notice">
                  ℹ️ System will automatically assign a unique <strong>WAIT ID</strong> on creation.
                </div>
              </div>

              <div className="admin-profile-modal-footer">
                <button
                  type="button"
                  className="btn-profile-secondary"
                  onClick={() => setShowAddWaiterModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-profile-primary btn-save-waiter"
                  disabled={staffActionLoading}
                >
                  {staffActionLoading ? "Creating Waiter..." : "Create Waiter Account"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= ADD CHEF MODAL ================= */}
      {showAddChefModal && (
        <div className="admin-profile-modal-backdrop staff-modal-backdrop" onClick={() => setShowAddChefModal(false)}>
          <div className="admin-profile-modal-card staff-modal-card staff-creation-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-profile-modal-header chef-modal-header">
              <div className="admin-profile-modal-title">
                <span className="admin-profile-modal-icon chef-modal-icon">👨‍🍳</span>
                <div>
                  <h3>Add New Chef</h3>
                  <p>Create a Kitchen Display & Cook account with custom shift</p>
                </div>
              </div>
              <button
                type="button"
                className="admin-profile-close-btn"
                onClick={() => setShowAddChefModal(false)}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateChef} className="staff-modal-form">
              <div className="admin-profile-modal-body staff-modal-body">
                {staffActionError && (
                  <div className="admin-profile-msg error-msg">{staffActionError}</div>
                )}
                {staffActionSuccess && (
                  <div className="admin-profile-msg success-msg">{staffActionSuccess}</div>
                )}

                <div className="admin-profile-form-group">
                  <label>Assign to Restaurant *</label>
                  {isRestaurantAdmin ? (
                    <input
                      type="text"
                      disabled
                      value={`${adminUser?.restaurantName || "My Restaurant"} (${adminUser?.restaurantId || myRestCode})`}
                      className="staff-disabled-input"
                    />
                  ) : (
                    <select
                      className="staff-select-input"
                      value={chefForm.restaurantId}
                      onChange={(e) => setChefForm({ ...chefForm, restaurantId: e.target.value })}
                      required
                    >
                      <option value="">-- Select Restaurant --</option>
                      {restaurants.map((r) => (
                        <option key={r._id} value={r._id}>
                          {r.restaurantName} ({r.restaurantId}) - {r.city || "Branch"}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                <div className="form-row-2">
                  <div className="admin-profile-form-group">
                    <label>Chef Full Name *</label>
                    <input
                      type="text"
                      placeholder="e.g. Sanjeev Kapoor"
                      value={chefForm.name}
                      onChange={(e) => setChefForm({ ...chefForm, name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="admin-profile-form-group">
                    <label>Login Password *</label>
                    <input
                      type="password"
                      name="chef_password_new"
                      autoComplete="new-password"
                      placeholder="Enter login password"
                      value={chefForm.password}
                      onChange={(e) => setChefForm({ ...chefForm, password: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="form-row-2">
                  <div className="admin-profile-form-group">
                    <label>Email Address</label>
                    <input
                      type="email"
                      name="chef_email_new"
                      autoComplete="new-password"
                      placeholder="chef@foodvista.com (optional)"
                      value={chefForm.email}
                      onChange={(e) => setChefForm({ ...chefForm, email: e.target.value })}
                    />
                  </div>
                  <div className="admin-profile-form-group">
                    <label>Phone Number</label>
                    <input
                      type="tel"
                      placeholder="e.g. +91 98765 43210"
                      value={chefForm.phone}
                      onChange={(e) => setChefForm({ ...chefForm, phone: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-row-2">
                  <div className="admin-profile-form-group">
                    <label>Speciality / Role</label>
                    <select
                      className="staff-select-input"
                      value={chefForm.speciality}
                      onChange={(e) => setChefForm({ ...chefForm, speciality: e.target.value })}
                    >
                      <option value="Head Chef">Head Chef (Executive)</option>
                      <option value="Sous Chef">Sous Chef</option>
                      <option value="Line Cook">Line Cook</option>
                      <option value="Pastry Chef">Pastry Chef / Desserts</option>
                      <option value="Tandoor Specialist">Tandoor Specialist</option>
                      <option value="Chinese Specialist">Chinese Specialist</option>
                      <option value="Beverage / Barista">Beverage / Barista</option>
                    </select>
                  </div>
                  <div className="admin-profile-form-group">
                    <label>Work Shift</label>
                    <select
                      className="staff-select-input"
                      value={chefForm.shift}
                      onChange={(e) => setChefForm({ ...chefForm, shift: e.target.value })}
                    >
                      <option value="Morning">Morning Shift (7:00 AM - 3:30 PM)</option>
                      <option value="Evening">Evening Shift (3:00 PM - 11:30 PM)</option>
                      <option value="Night">Night Shift (11:00 PM - 7:30 AM)</option>
                      <option value="Full Day">Full Day (10:00 AM - 10:00 PM)</option>
                    </select>
                  </div>
                </div>

                <div className="staff-form-notice">
                  ℹ️ System will automatically assign a unique <strong>CHEF ID</strong> (e.g. CHEF001).
                </div>
              </div>

              <div className="admin-profile-modal-footer">
                <button
                  type="button"
                  className="btn-profile-secondary"
                  onClick={() => setShowAddChefModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-profile-primary btn-save-chef"
                  disabled={staffActionLoading}
                >
                  {staffActionLoading ? "Creating Chef..." : "Create Chef Account"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= ADD CLEANER MODAL ================= */}
      {showAddCleanerModal && (
        <div className="admin-profile-modal-backdrop staff-modal-backdrop" onClick={() => setShowAddCleanerModal(false)}>
          <div className="admin-profile-modal-card staff-modal-card staff-creation-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-profile-modal-header cleaner-modal-header">
              <div className="admin-profile-modal-title">
                <span className="admin-profile-modal-icon cleaner-modal-icon">🧹</span>
                <div>
                  <h3>Add New Cleaner</h3>
                  <p>Create a cleaning and housekeeping staff account</p>
                </div>
              </div>
              <button
                type="button"
                className="admin-profile-close-btn"
                onClick={() => setShowAddCleanerModal(false)}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateCleaner} className="staff-modal-form">
              <div className="admin-profile-modal-body staff-modal-body">
                {staffActionError && (
                  <div className="admin-profile-msg error-msg">{staffActionError}</div>
                )}
                {staffActionSuccess && (
                  <div className="admin-profile-msg success-msg">{staffActionSuccess}</div>
                )}

                <div className="admin-profile-form-group">
                  <label>Assign to Restaurant *</label>
                  {isRestaurantAdmin ? (
                    <input
                      type="text"
                      disabled
                      value={`${adminUser?.restaurantName || "My Restaurant"} (${adminUser?.restaurantId || myRestCode})`}
                      className="staff-disabled-input"
                    />
                  ) : (
                    <select
                      className="staff-select-input"
                      value={cleanerForm.restaurantId}
                      onChange={(e) => setCleanerForm({ ...cleanerForm, restaurantId: e.target.value })}
                      required
                    >
                      <option value="">-- Select Restaurant --</option>
                      {restaurants.map((r) => (
                        <option key={r._id} value={r._id}>
                          {r.restaurantName} ({r.restaurantId}) - {r.city || "Branch"}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                <div className="form-row-2">
                  <div className="admin-profile-form-group">
                    <label>Cleaner Full Name *</label>
                    <input
                      type="text"
                      placeholder="e.g. Raju Verma"
                      value={cleanerForm.name}
                      onChange={(e) => setCleanerForm({ ...cleanerForm, name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="admin-profile-form-group">
                    <label>Login Password *</label>
                    <input
                      type="password"
                      name="cleaner_password_new"
                      autoComplete="new-password"
                      placeholder="Enter login password"
                      value={cleanerForm.password}
                      onChange={(e) => setCleanerForm({ ...cleanerForm, password: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="form-row-2">
                  <div className="admin-profile-form-group">
                    <label>Email Address</label>
                    <input
                      type="email"
                      name="cleaner_email_new"
                      autoComplete="new-password"
                      placeholder="cleaner@foodvista.com (optional)"
                      value={cleanerForm.email}
                      onChange={(e) => setCleanerForm({ ...cleanerForm, email: e.target.value })}
                    />
                  </div>
                  <div className="admin-profile-form-group">
                    <label>Phone Number</label>
                    <input
                      type="tel"
                      placeholder="e.g. +91 98765 43210"
                      value={cleanerForm.phone}
                      onChange={(e) => setCleanerForm({ ...cleanerForm, phone: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-row-2">
                  <div className="admin-profile-form-group">
                    <label>Assigned Area / Section</label>
                    <select
                      className="staff-select-input"
                      value={cleanerForm.assignedArea}
                      onChange={(e) => setCleanerForm({ ...cleanerForm, assignedArea: e.target.value })}
                    >
                      <option value="Dining Hall & Tables">Dining Hall & Tables</option>
                      <option value="Kitchen & Dishwashing">Kitchen & Dishwashing</option>
                      <option value="Restrooms & Washrooms">Restrooms & Washrooms</option>
                      <option value="Entry & Reception">Entry & Reception</option>
                      <option value="Entire Floor / General">Entire Floor / General</option>
                    </select>
                  </div>
                  <div className="admin-profile-form-group">
                    <label>Work Shift</label>
                    <select
                      className="staff-select-input"
                      value={cleanerForm.shift}
                      onChange={(e) => setCleanerForm({ ...cleanerForm, shift: e.target.value })}
                    >
                      <option value="Morning">Morning Shift (7:00 AM - 3:30 PM)</option>
                      <option value="Evening">Evening Shift (3:00 PM - 11:30 PM)</option>
                      <option value="Night">Night Shift (11:00 PM - 7:30 AM)</option>
                      <option value="Full Day">Full Day (10:00 AM - 10:00 PM)</option>
                    </select>
                  </div>
                </div>

                <div className="staff-form-notice">
                  ℹ️ System will automatically assign a unique <strong>CLEANER ID</strong> (e.g. CLN001).
                </div>
              </div>

              <div className="admin-profile-modal-footer">
                <button
                  type="button"
                  className="btn-profile-secondary"
                  onClick={() => setShowAddCleanerModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-profile-primary btn-save-cleaner"
                  disabled={staffActionLoading}
                >
                  {staffActionLoading ? "Creating Cleaner..." : "Create Cleaner Account"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= EDIT STAFF MODAL ================= */}
      {editingStaff && (
        <div className="admin-profile-backdrop staff-modal-backdrop" onClick={() => setEditingStaff(null)}>
          <div className="admin-profile-modal staff-creation-modal" style={{ maxWidth: "520px" }} onClick={(e) => e.stopPropagation()}>
            <div className="admin-profile-modal-header staff-modal-header manager-header">
              <div className="admin-profile-title">
                <span className="profile-header-icon staff-modal-icon manager-icon">✏️</span>
                <div>
                  <h3 style={{ margin: 0, fontSize: "1.15rem", fontWeight: 700, color: "#0f172a" }}>
                    Edit {editingStaff.type.charAt(0).toUpperCase() + editingStaff.type.slice(1)}
                  </h3>
                  <p style={{ margin: "2px 0 0", fontSize: "0.78rem", color: "#64748b" }}>
                    Update {editingStaff.data.name}'s profile details
                  </p>
                </div>
              </div>
              <button type="button" className="admin-profile-close-btn" onClick={() => setEditingStaff(null)}>✕</button>
            </div>

            <form onSubmit={handleUpdateStaff}>
              <div className="admin-profile-body" style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: "14px" }}>
                {editStaffError && <div className="admin-profile-alert error">{editStaffError}</div>}
                {editStaffSuccess && <div className="admin-profile-alert success">{editStaffSuccess}</div>}

                <div className="admin-profile-form-group">
                  <label>Full Name *</label>
                  <input
                    type="text"
                    value={editStaffForm.name || ""}
                    onChange={(e) => setEditStaffForm(f => ({ ...f, name: e.target.value }))}
                    placeholder="Enter full name"
                    required
                  />
                </div>

                <div className="admin-profile-form-group">
                  <label>Email Address *</label>
                  <input
                    type="email"
                    value={editStaffForm.email || ""}
                    onChange={(e) => setEditStaffForm(f => ({ ...f, email: e.target.value }))}
                    placeholder="Enter email address"
                    required
                  />
                </div>

                <div className="admin-profile-form-group">
                  <label>Phone Number</label>
                  <input
                    type="tel"
                    value={editStaffForm.phone || ""}
                    onChange={(e) => setEditStaffForm(f => ({ ...f, phone: e.target.value }))}
                    placeholder="Enter phone number"
                  />
                </div>

                {editingStaff.type === "waiter" && (
                  <div className="form-row-2">
                    <div className="admin-profile-form-group">
                      <label>Gender</label>
                      <select
                        value={editStaffForm.gender || "Male"}
                        onChange={(e) => setEditStaffForm(f => ({ ...f, gender: e.target.value }))}
                      >
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                    <div className="admin-profile-form-group">
                      <label>Address</label>
                      <input
                        type="text"
                        value={editStaffForm.address || ""}
                        onChange={(e) => setEditStaffForm(f => ({ ...f, address: e.target.value }))}
                        placeholder="Enter address"
                      />
                    </div>
                  </div>
                )}

                {editingStaff.type === "chef" && (
                  <div className="form-row-2">
                    <div className="admin-profile-form-group">
                      <label>Speciality</label>
                      <select
                        value={editStaffForm.speciality || "Head Chef"}
                        onChange={(e) => setEditStaffForm(f => ({ ...f, speciality: e.target.value }))}
                      >
                        {["Head Chef","Sous Chef","Pastry Chef","Grill Chef","Tandoor Chef","Chinese Chef","Continental Chef","South Indian Chef","Pizza Chef","Dessert Chef"].map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                    <div className="admin-profile-form-group">
                      <label>Shift</label>
                      <select
                        value={editStaffForm.shift || "Full Day"}
                        onChange={(e) => setEditStaffForm(f => ({ ...f, shift: e.target.value }))}
                      >
                        {["Full Day","Morning","Afternoon","Evening","Night"].map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                  </div>
                )}

                {editingStaff.type === "cleaner" && (
                  <div className="form-row-2">
                    <div className="admin-profile-form-group">
                      <label>Assigned Area</label>
                      <select
                        value={editStaffForm.assignedArea || "Dining Hall & Tables"}
                        onChange={(e) => setEditStaffForm(f => ({ ...f, assignedArea: e.target.value }))}
                      >
                        {["Dining Hall & Tables","Kitchen Area","Restrooms","Entrance & Lobby","Outdoor Area","All Areas"].map(a => <option key={a} value={a}>{a}</option>)}
                      </select>
                    </div>
                    <div className="admin-profile-form-group">
                      <label>Shift</label>
                      <select
                        value={editStaffForm.shift || "Full Day"}
                        onChange={(e) => setEditStaffForm(f => ({ ...f, shift: e.target.value }))}
                      >
                        {["Full Day","Morning","Afternoon","Evening","Night"].map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                  </div>
                )}
              </div>

              <div className="admin-profile-modal-footer">
                <button type="button" className="btn-profile-secondary" onClick={() => setEditingStaff(null)}>
                  Cancel
                </button>
                <button type="submit" className="btn-profile-primary" disabled={editStaffLoading}>
                  {editStaffLoading ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= ADD TABLE MODAL ================= */}
      {showAddTableModal && (
        <div className="admin-profile-backdrop staff-modal-backdrop" onClick={() => setShowAddTableModal(false)}>
          <div className="admin-profile-modal staff-creation-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-profile-modal-header staff-modal-header manager-header">
              <div className="admin-profile-title">
                <span className="profile-header-icon staff-modal-icon manager-icon">🪑</span>
                <div>
                  <h3>{editingTableId ? "Edit Dining Table" : "Add New Dining Table"}</h3>
                  <p>
                    {editingTableId
                      ? "Update table number, seating capacity, or current status."
                      : "Configure table number, seating capacity, and initial status."}
                  </p>
                </div>
              </div>
              <button
                type="button"
                className="admin-profile-close-btn"
                onClick={() => {
                  setShowAddTableModal(false);
                  setEditingTableId(null);
                }}
                title="Close"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateTable} className="staff-modal-form">
              <div className="admin-profile-body staff-modal-body">
                {tableActionError && (
                  <div className="admin-profile-alert error">
                    ⚠️ {tableActionError}
                  </div>
                )}
                {tableActionSuccess && (
                  <div className="admin-profile-alert success">
                    {tableActionSuccess}
                  </div>
                )}

                {!isRestaurantAdmin && (
                  <div className="admin-profile-form-group">
                    <label>Target Restaurant *</label>
                    <select
                      className="staff-select-input"
                      value={tableForm.restaurantId}
                      onChange={(e) => setTableForm({ ...tableForm, restaurantId: e.target.value })}
                      required
                    >
                      <option value="">-- Select Restaurant --</option>
                      {restaurants.map((r) => (
                        <option key={r._id} value={r._id}>
                          {r.restaurantName || r.name} ({r.restaurantId})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="form-row-2">
                  <div className="admin-profile-form-group">
                    <label>Table Number / Name *</label>
                    <input
                      type="text"
                      placeholder="e.g. Table 21 or VIP-01"
                      value={tableForm.tableNumber}
                      onChange={(e) => setTableForm({ ...tableForm, tableNumber: e.target.value })}
                      required
                      autoFocus
                    />
                  </div>

                  <div className="admin-profile-form-group">
                    <label>Table Status</label>
                    <select
                      className="staff-select-input"
                      value={tableForm.status}
                      onChange={(e) => setTableForm({ ...tableForm, status: e.target.value })}
                    >
                      <option value="Available">🟢 Available</option>
                      <option value="Occupied">🔴 Occupied</option>
                      <option value="Reserved">🟡 Reserved</option>
                      <option value="Cleaning">🔵 Cleaning</option>
                      <option value="Out of Service">⚪ Out of Service</option>
                    </select>
                  </div>
                </div>

                <div className="admin-profile-form-group">
                  <label>Seating Capacity (Guests)</label>
                  <div className="capacity-selector-row">
                    <div className="capacity-preset-buttons">
                      {[2, 4, 6, 8, 10].map((cap) => (
                        <button
                          key={cap}
                          type="button"
                          className={`preset-btn ${Number(tableForm.capacity) === cap ? "active" : ""}`}
                          onClick={() => setTableForm({ ...tableForm, capacity: cap })}
                        >
                          👥 {cap} Seats
                        </button>
                      ))}
                    </div>
                    <div className="custom-capacity-input">
                      <label style={{ fontSize: "11px", color: "#64748b", display: "block", marginBottom: "4px" }}>Custom:</label>
                      <input
                        type="number"
                        min="1"
                        max="50"
                        value={tableForm.capacity}
                        onChange={(e) => setTableForm({ ...tableForm, capacity: e.target.value })}
                        required
                        style={{ width: "90px", padding: "8px 10px", borderRadius: "8px", border: "1.5px solid #cbd5e1" }}
                      />
                    </div>
                  </div>
                </div>

                <div className="staff-form-notice">
                  ℹ️ Table updates will immediately sync in <strong>Floor Management</strong> and QR ordering.
                </div>
              </div>

              <div className="admin-profile-modal-footer">
                <button
                  type="button"
                  className="btn-profile-secondary"
                  onClick={() => {
                    setShowAddTableModal(false);
                    setEditingTableId(null);
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-profile-primary"
                  disabled={tableActionLoading}
                  style={{ background: "linear-gradient(135deg, #2563eb, #1d4ed8)", borderColor: "#1d4ed8" }}
                >
                  {tableActionLoading
                    ? (editingTableId ? "Updating Table..." : "Adding Table...")
                    : (editingTableId ? "💾 Save Changes" : "➕ Add Table")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= ADD RESERVATION MODAL ================= */}
      {showAddReservationModal && (
        <div className="admin-profile-backdrop res-modal-backdrop" onClick={() => setShowAddReservationModal(false)}>
          <div className="admin-profile-modal res-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="admin-profile-modal-header res-modal-header">
              <div className="admin-profile-title">
                <span className="profile-header-icon res-header-icon">📅</span>
                <div>
                  <h3>Book Table Reservation</h3>
                  <p>Schedule a new table reservation and dining party for guests.</p>
                </div>
              </div>
              <button
                type="button"
                className="admin-profile-close-btn"
                onClick={() => setShowAddReservationModal(false)}
                title="Close"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateReservation} className="res-modal-form">
              <div className="admin-profile-body res-modal-body">
                {reservationActionError && (
                  <div className="admin-profile-alert error">
                    ⚠️ {reservationActionError}
                  </div>
                )}
                {reservationActionSuccess && (
                  <div className="admin-profile-alert success">
                    {reservationActionSuccess}
                  </div>
                )}

                {!isRestaurantAdmin && (
                  <div className="admin-profile-form-group">
                    <label>Target Restaurant *</label>
                    <select
                      className="staff-select-input"
                      value={reservationForm.restaurantId}
                      onChange={(e) => setReservationForm({ ...reservationForm, restaurantId: e.target.value })}
                      required
                    >
                      <option value="">-- Select Restaurant --</option>
                      {restaurants.map((r) => (
                        <option key={r._id} value={r._id}>
                          {r.restaurantName || r.name} ({r.restaurantId})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Section: Guest Details */}
                <div className="form-row-2">
                  <div className="admin-profile-form-group">
                    <label>Guest Full Name *</label>
                    <input
                      type="text"
                      placeholder="e.g. Rahul Sharma"
                      value={reservationForm.customerName}
                      onChange={(e) => setReservationForm({ ...reservationForm, customerName: e.target.value })}
                      required
                      autoFocus
                    />
                  </div>

                  <div className="admin-profile-form-group">
                    <label>Phone Number *</label>
                    <input
                      type="tel"
                      placeholder="e.g. +91 98765 43210"
                      value={reservationForm.customerPhone}
                      onChange={(e) => setReservationForm({ ...reservationForm, customerPhone: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="admin-profile-form-group">
                  <label>Guest Email (Optional)</label>
                  <input
                    type="email"
                    placeholder="guest@example.com"
                    value={reservationForm.customerEmail}
                    onChange={(e) => setReservationForm({ ...reservationForm, customerEmail: e.target.value })}
                  />
                </div>

                {/* Section: Date & Time Schedule */}
                <div className="form-row-2">
                  <div className="admin-profile-form-group">
                    <label>Reservation Date *</label>
                    <input
                      type="date"
                      value={reservationForm.reservationDate}
                      onChange={(e) => setReservationForm({ ...reservationForm, reservationDate: e.target.value })}
                      required
                    />
                  </div>

                  <div className="admin-profile-form-group">
                    <label>Time Slot *</label>
                    <input
                      type="text"
                      placeholder="e.g. 07:30 PM"
                      value={reservationForm.reservationTime}
                      onChange={(e) => setReservationForm({ ...reservationForm, reservationTime: e.target.value })}
                      required
                    />
                  </div>
                </div>

                {/* Quick Time Slots */}
                <div className="res-quick-time-box">
                  <span className="res-quick-time-label">⚡ Quick Time Slots:</span>
                  <div className="preset-time-slots-row">
                    {PRESET_TIME_SLOTS.map((slot) => (
                      <button
                        key={slot}
                        type="button"
                        className={`preset-time-chip ${reservationForm.reservationTime === slot ? "active" : ""}`}
                        onClick={() => setReservationForm({ ...reservationForm, reservationTime: slot })}
                      >
                        {slot}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Dining Table Selection */}
                <div className="admin-profile-form-group">
                  <label>Assign Dining Table</label>
                  <select
                    className="staff-select-input res-table-select"
                    value={reservationForm.tableNumber}
                    onChange={(e) => setReservationForm({ ...reservationForm, tableNumber: e.target.value })}
                  >
                    <option value="">-- Select Dining Table or Leave Unassigned --</option>
                    {dashboardSummary.tables.map((t) => (
                      <option key={t._id} value={t.tableNumber}>
                        {t.tableNumber} ({t.capacity || 4} Seats) - {getTableAvailabilityNote(t, reservationForm.reservationDate)}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Party Size */}
                <div className="admin-profile-form-group">
                  <div className="res-party-label-row">
                    <label>Party Size (Number of Guests)</label>
                    <span className="res-party-count-badge">👥 {reservationForm.guestsCount || 2} Guests</span>
                  </div>
                  <div className="capacity-selector-row">
                    <div className="capacity-preset-buttons">
                      {[2, 4, 6, 8, 10].map((num) => (
                        <button
                          key={num}
                          type="button"
                          className={`preset-btn ${Number(reservationForm.guestsCount) === num ? "active" : ""}`}
                          onClick={() => setReservationForm({ ...reservationForm, guestsCount: num })}
                        >
                          👥 {num} Guests
                        </button>
                      ))}
                    </div>
                    <div className="custom-capacity-input">
                      <label style={{ fontSize: "11px", color: "#64748b", display: "block", marginBottom: "4px" }}>Custom:</label>
                      <input
                        type="number"
                        min="1"
                        max="50"
                        value={reservationForm.guestsCount}
                        onChange={(e) => setReservationForm({ ...reservationForm, guestsCount: e.target.value })}
                        required
                        style={{ width: "90px", padding: "8px 10px", borderRadius: "8px", border: "1.5px solid #cbd5e1" }}
                      />
                    </div>
                  </div>
                </div>

                {/* Special Requests */}
                <div className="admin-profile-form-group">
                  <label>Special Requests / Occasion</label>
                  <input
                    type="text"
                    placeholder="e.g. Birthday celebration, Candlelight dinner, Window seat, High chair needed"
                    value={reservationForm.specialRequest}
                    onChange={(e) => setReservationForm({ ...reservationForm, specialRequest: e.target.value })}
                  />
                </div>

                <div className="staff-form-notice">
                  ℹ️ When a table is assigned, it will automatically reserve the table in <strong>Floor & Seating Management</strong>.
                </div>
              </div>

              <div className="admin-profile-modal-footer">
                <button
                  type="button"
                  className="btn-profile-secondary"
                  onClick={() => setShowAddReservationModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-profile-primary"
                  disabled={reservationActionLoading}
                  style={{ background: "linear-gradient(135deg, #2563eb, #1d4ed8)", borderColor: "#1d4ed8" }}
                >
                  {reservationActionLoading ? "Saving Booking..." : "📅 Confirm Reservation"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= EDIT RESERVATION MODAL ================= */}
      {showEditReservationModal && (
        <div className="admin-profile-backdrop res-modal-backdrop" onClick={() => setShowEditReservationModal(false)}>
          <div className="admin-profile-modal res-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="admin-profile-modal-header res-modal-header">
              <div className="admin-profile-title">
                <span className="profile-header-icon res-header-icon" style={{ background: "#ecfdf5", borderColor: "#a7f3d0" }}>✏️</span>
                <div>
                  <h3>Edit Reservation Details</h3>
                  <p>Update guest info, party size, booking schedule, or dining table.</p>
                </div>
              </div>
              <button
                type="button"
                className="admin-profile-close-btn"
                onClick={() => setShowEditReservationModal(false)}
                title="Close"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleUpdateReservation} className="res-modal-form">
              <div className="admin-profile-body res-modal-body">
                {reservationActionError && (
                  <div className="admin-profile-alert error">
                    ⚠️ {reservationActionError}
                  </div>
                )}
                {reservationActionSuccess && (
                  <div className="admin-profile-alert success">
                    {reservationActionSuccess}
                  </div>
                )}

                <div className="form-row-2">
                  <div className="admin-profile-form-group">
                    <label>Guest Full Name *</label>
                    <input
                      type="text"
                      placeholder="e.g. Rahul Sharma"
                      value={editReservationForm.customerName}
                      onChange={(e) => setEditReservationForm({ ...editReservationForm, customerName: e.target.value })}
                      required
                    />
                  </div>

                  <div className="admin-profile-form-group">
                    <label>Phone Number *</label>
                    <input
                      type="tel"
                      placeholder="e.g. +91 98765 43210"
                      value={editReservationForm.customerPhone}
                      onChange={(e) => setEditReservationForm({ ...editReservationForm, customerPhone: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="admin-profile-form-group">
                  <label>Guest Email (Optional)</label>
                  <input
                    type="email"
                    placeholder="guest@example.com"
                    value={editReservationForm.customerEmail}
                    onChange={(e) => setEditReservationForm({ ...editReservationForm, customerEmail: e.target.value })}
                  />
                </div>

                <div className="form-row-2">
                  <div className="admin-profile-form-group">
                    <label>Reservation Date *</label>
                    <input
                      type="date"
                      value={editReservationForm.reservationDate}
                      onChange={(e) => setEditReservationForm({ ...editReservationForm, reservationDate: e.target.value })}
                      required
                    />
                  </div>

                  <div className="admin-profile-form-group">
                    <label>Time Slot *</label>
                    <input
                      type="text"
                      placeholder="e.g. 07:30 PM"
                      value={editReservationForm.reservationTime}
                      onChange={(e) => setEditReservationForm({ ...editReservationForm, reservationTime: e.target.value })}
                      required
                    />
                  </div>
                </div>

                {/* Quick Time Slots */}
                <div className="res-quick-time-box">
                  <span className="res-quick-time-label">⚡ Quick Time Slots:</span>
                  <div className="preset-time-slots-row">
                    {PRESET_TIME_SLOTS.map((slot) => (
                      <button
                        key={slot}
                        type="button"
                        className={`preset-time-chip ${editReservationForm.reservationTime === slot ? "active" : ""}`}
                        onClick={() => setEditReservationForm({ ...editReservationForm, reservationTime: slot })}
                      >
                        {slot}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="admin-profile-form-group">
                  <label>Assign Dining Table</label>
                  <select
                    className="staff-select-input res-table-select"
                    value={editReservationForm.tableNumber}
                    onChange={(e) => setEditReservationForm({ ...editReservationForm, tableNumber: e.target.value })}
                  >
                    <option value="">-- Select Dining Table or Leave Unassigned --</option>
                    {dashboardSummary.tables.map((t) => (
                      <option key={t._id} value={t.tableNumber}>
                        {t.tableNumber} ({t.capacity || 4} Seats) - {getTableAvailabilityNote(t, editReservationForm.reservationDate, editReservationForm._id)}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-row-2">
                  <div className="admin-profile-form-group">
                    <label>Status</label>
                    <select
                      className="staff-select-input"
                      value={editReservationForm.status}
                      onChange={(e) => setEditReservationForm({ ...editReservationForm, status: e.target.value })}
                    >
                      <option value="Confirmed">✅ Confirmed</option>
                      <option value="Seated">🍽️ Seated</option>
                      <option value="Completed">🏁 Completed</option>
                      <option value="Cancelled">✕ Cancelled</option>
                      <option value="No Show">👻 No Show</option>
                    </select>
                  </div>

                  <div className="admin-profile-form-group">
                    <label>Booking Source</label>
                    <select
                      className="staff-select-input"
                      value={editReservationForm.source}
                      onChange={(e) => setEditReservationForm({ ...editReservationForm, source: e.target.value })}
                    >
                      <option value="Admin">Admin</option>
                      <option value="Phone">Phone Call</option>
                      <option value="Walk-in">Walk-in</option>
                      <option value="Online">Online Website</option>
                    </select>
                  </div>
                </div>

                <div className="admin-profile-form-group">
                  <div className="res-party-label-row">
                    <label>Party Size (Number of Guests)</label>
                    <span className="res-party-count-badge">👥 {editReservationForm.guestsCount || 2} Guests</span>
                  </div>
                  <div className="capacity-selector-row">
                    <div className="capacity-preset-buttons">
                      {[2, 4, 6, 8, 10].map((num) => (
                        <button
                          key={num}
                          type="button"
                          className={`preset-btn ${Number(editReservationForm.guestsCount) === num ? "active" : ""}`}
                          onClick={() => setEditReservationForm({ ...editReservationForm, guestsCount: num })}
                        >
                          👥 {num} Guests
                        </button>
                      ))}
                    </div>
                    <div className="custom-capacity-input">
                      <label style={{ fontSize: "11px", color: "#64748b", display: "block", marginBottom: "4px" }}>Custom:</label>
                      <input
                        type="number"
                        min="1"
                        max="50"
                        value={editReservationForm.guestsCount}
                        onChange={(e) => setEditReservationForm({ ...editReservationForm, guestsCount: e.target.value })}
                        required
                        style={{ width: "90px", padding: "8px 10px", borderRadius: "8px", border: "1.5px solid #cbd5e1" }}
                      />
                    </div>
                  </div>
                </div>

                <div className="admin-profile-form-group">
                  <label>Special Requests / Occasion</label>
                  <input
                    type="text"
                    placeholder="e.g. Birthday celebration, Candlelight dinner, Window seat, High chair needed"
                    value={editReservationForm.specialRequest}
                    onChange={(e) => setEditReservationForm({ ...editReservationForm, specialRequest: e.target.value })}
                  />
                </div>
              </div>

              <div className="admin-profile-modal-footer">
                <button
                  type="button"
                  className="btn-profile-secondary"
                  onClick={() => setShowEditReservationModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-profile-primary"
                  disabled={reservationActionLoading}
                  style={{ background: "linear-gradient(135deg, #10b981, #059669)", borderColor: "#059669" }}
                >
                  {reservationActionLoading ? "Updating..." : "💾 Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminDashboard;


