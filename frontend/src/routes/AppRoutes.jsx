import { Navigate, Routes, Route } from "react-router-dom";

// ===============================
// Customer Pages
// ===============================
import Home from "../pages/Home";
import Menu from "../pages/Menu";
import CustomerMenu from "../pages/CustomerMenu";
import CustomerCart from "../pages/CustomerCart";

// ===============================
// Admin Pages
// ===============================
import AdminDashboard from "../pages/AdminDashboard";
import UnifiedLogin from "../pages/UnifiedLogin";
import AddRestaurant from "../pages/AddRestaurant";
import RestaurantDetails from "../pages/RestaurantDetails";
import EditRestaurant from "../pages/EditRestaurant";

// ===============================
// Super Admin
// ===============================
import SuperAdminDashboard from "../pages/SuperAdminDashboard";
import SuperAdminRestaurants from "../pages/SuperAdminRestaurants";

// ===============================
// Restaurant Admin
// ===============================
import QRManagement from "../pages/QRManagement";

// ===============================
// Waiter & Manager
// ===============================
import WaiterDashboard from "../pages/WaiterDashboard";
import WaiterLogin from "../pages/WaiterLogin";
import WaiterManagement from "../pages/WaiterManagement";
import WaiterCreateOrder from "../pages/WaiterCreateOrder";
import WaiterBilling from "../pages/WaiterBilling";
import WaiterKitchen from "../pages/WaiterKitchen";
import ManagerDashboard from "../pages/ManagerDashboard";
import AdminManagerView from "../pages/AdminManagerView";
import AdminWaiterView from "../pages/AdminWaiterView";
import AdminUserView from "../pages/AdminUserView";
import ChefDashboard from "../pages/ChefDashboard";
import AdminCleanerView from "../pages/AdminCleanerView";

// ===============================
// Kitchen
// ===============================
import KitchenLogin from "../pages/KitchenLogin";
import KitchenDashboard from "../pages/KitchenDashboard";

// Role-based Route Protection Helpers
const isSuperAdminUser = () => {
  try {
    if (localStorage.getItem("superAdmin")) return true;
    const auth = JSON.parse(localStorage.getItem("authUser") || "null");
    return auth?.role === "superadmin";
  } catch {
    return false;
  }
};

const isRestaurantAdminUser = () => {
  try {
    if (isSuperAdminUser()) return false;
    if (
      localStorage.getItem("restaurantAdmin") ||
      localStorage.getItem("adminInfo") ||
      localStorage.getItem("admin")
    ) {
      return true;
    }
    const auth = JSON.parse(localStorage.getItem("authUser") || "null");
    return auth?.role === "restaurant";
  } catch {
    return false;
  }
};


const SuperAdminRoute = ({ children }) => {
  if (!isSuperAdminUser()) {
    return <Navigate to={isRestaurantAdminUser() ? "/admin/dashboard" : "/login"} replace />;
  }
  return children;
};

const RestaurantAdminRoute = ({ children }) => {
  if (isSuperAdminUser()) {
    return <Navigate to="/superadmin/dashboard" replace />;
  }
  if (!isRestaurantAdminUser()) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

const NonSuperAdminRoute = ({ children }) => {
  if (isSuperAdminUser()) {
    return <Navigate to="/superadmin/dashboard" replace />;
  }
  return children;
};

function AppRoutes() {
  return (
    <Routes>

      {/* =========================
          CUSTOMER
      ========================= */}
      <Route path="/" element={<Home />} />
      <Route path="/menu" element={<Menu />} />
      <Route path="/customer/menu" element={<CustomerMenu />} />
      <Route path="/customer/cart" element={<CustomerCart />} />

      {/* =========================
          COMMON LOGIN
      ========================= */}
      <Route path="/login" element={<UnifiedLogin />} />
      <Route path="/admin/login" element={<Navigate to="/login" replace />} />
      <Route path="/superadmin/login" element={<Navigate to="/login" replace />} />
      <Route path="/restaurant/login" element={<Navigate to="/login" replace />} />

      {/* =========================
          ADMIN DASHBOARD & RESTAURANT ADMIN
      ========================= */}
      <Route
        path="/admin/dashboard"
        element={
          <RestaurantAdminRoute>
            <AdminDashboard />
          </RestaurantAdminRoute>
        }
      />
      <Route
        path="/admin/add-restaurant"
        element={
          <SuperAdminRoute>
            <AddRestaurant />
          </SuperAdminRoute>
        }
      />
      <Route
        path="/admin/restaurants/:id"
        element={
          <SuperAdminRoute>
            <RestaurantDetails />
          </SuperAdminRoute>
        }
      />
      <Route
        path="/admin/restaurants/:id/edit"
        element={
          <SuperAdminRoute>
            <EditRestaurant />
          </SuperAdminRoute>
        }
      />

      {/* =========================
          SUPER ADMIN
      ========================= */}
      <Route
        path="/superadmin/dashboard"
        element={
          <SuperAdminRoute>
            <SuperAdminDashboard />
          </SuperAdminRoute>
        }
      />
      <Route
        path="/superadmin/restaurants"
        element={
          <SuperAdminRoute>
            <SuperAdminRestaurants />
          </SuperAdminRoute>
        }
      />
      <Route
        path="/superadmin/add-restaurant"
        element={
          <SuperAdminRoute>
            <AddRestaurant />
          </SuperAdminRoute>
        }
      />
      <Route
        path="/superadmin/restaurants/:id"
        element={
          <SuperAdminRoute>
            <RestaurantDetails />
          </SuperAdminRoute>
        }
      />
      <Route
        path="/superadmin/restaurants/:id/edit"
        element={
          <SuperAdminRoute>
            <EditRestaurant />
          </SuperAdminRoute>
        }
      />

      {/* =========================
          RESTAURANT ADMIN ROUTES
      ========================= */}
      <Route path="/restaurant/dashboard" element={<Navigate to="/admin/dashboard" replace />} />
      <Route
        path="/restaurant/qr-management"
        element={
          <RestaurantAdminRoute>
            <QRManagement />
          </RestaurantAdminRoute>
        }
      />
      <Route
        path="/restaurant/waiters"
        element={
          <RestaurantAdminRoute>
            <WaiterManagement />
          </RestaurantAdminRoute>
        }
      />

      {/* =========================
          KITCHEN ROUTES
      ========================= */}
      <Route path="/kitchen/login" element={<KitchenLogin />} />
      <Route
        path="/kitchen/dashboard"
        element={
          <NonSuperAdminRoute>
            <KitchenDashboard />
          </NonSuperAdminRoute>
        }
      />

      {/* =========================
          WAITER & STAFF ROUTES
      ========================= */}
      <Route path="/waiter/login" element={<WaiterLogin />} />
      <Route
        path="/waiter/dashboard"
        element={
          <NonSuperAdminRoute>
            <WaiterDashboard />
          </NonSuperAdminRoute>
        }
      />
      <Route
        path="/waiter/create-order"
        element={
          <NonSuperAdminRoute>
            <WaiterCreateOrder />
          </NonSuperAdminRoute>
        }
      />
      <Route
        path="/waiter/billing"
        element={
          <NonSuperAdminRoute>
            <WaiterBilling />
          </NonSuperAdminRoute>
        }
      />
      <Route
        path="/waiter/kitchen"
        element={
          <NonSuperAdminRoute>
            <WaiterKitchen />
          </NonSuperAdminRoute>
        }
      />
      <Route
        path="/manager/dashboard"
        element={
          <NonSuperAdminRoute>
            <ManagerDashboard />
          </NonSuperAdminRoute>
        }
      />
      <Route
        path="/chef/dashboard"
        element={
          <NonSuperAdminRoute>
            <ChefDashboard />
          </NonSuperAdminRoute>
        }
      />
      <Route
        path="/cleaner/dashboard"
        element={
          <NonSuperAdminRoute>
            <AdminCleanerView />
          </NonSuperAdminRoute>
        }
      />

      {/* Admin Staff Views */}
      <Route
        path="/admin/staff/managers/:managerId"
        element={
          <RestaurantAdminRoute>
            <AdminManagerView />
          </RestaurantAdminRoute>
        }
      />
      <Route
        path="/admin/staff/waiters/:waiterId"
        element={
          <RestaurantAdminRoute>
            <AdminWaiterView />
          </RestaurantAdminRoute>
        }
      />
      <Route
        path="/admin/staff/chefs/:chefId"
        element={
          <RestaurantAdminRoute>
            <ChefDashboard />
          </RestaurantAdminRoute>
        }
      />
      <Route
        path="/admin/staff/cleaners/:cleanerId"
        element={
          <NonSuperAdminRoute>
            <AdminCleanerView />
          </NonSuperAdminRoute>
        }
      />
      <Route
        path="/admin/staff/users/:restaurantId"
        element={
          <RestaurantAdminRoute>
            <AdminUserView />
          </RestaurantAdminRoute>
        }
      />

      {/* Dynamic Admin Sub-paths (e.g. /admin/orders, /admin/menu, /admin/settings, /admin/staff) */}
      <Route
        path="/admin/:section"
        element={
          <RestaurantAdminRoute>
            <AdminDashboard />
          </RestaurantAdminRoute>
        }
      />
      <Route
        path="/admin/:section/:subSection"
        element={
          <RestaurantAdminRoute>
            <AdminDashboard />
          </RestaurantAdminRoute>
        }
      />

    </Routes>
  );
}

export default AppRoutes;
