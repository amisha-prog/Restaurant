// src/App.jsx

import "./App.css";
import AppRoutes from "./routes/AppRoutes";
import { useLocation } from "react-router-dom";
import { CartProvider } from "./context/CartContext.jsx";

function App() {
  const location = useLocation();

  // Hide customer Nav on all dashboard, staff, login, and portal pages
  const hideNav = location.pathname !== "/" && location.pathname !== "/menu";

  return (
    <CartProvider>

      {/* ===============================
          CUSTOMER NAV
          =============================== */}
      {!hideNav && (
        <nav className="customer-nav" aria-label="Main navigation">
          <a href="/">Home</a>
          <a href="/menu">Menu</a>
        </nav>
      )}

      {/* ===============================
          APPLICATION ROUTES
          =============================== */}
      <main>
        <AppRoutes />
      </main>

    </CartProvider>
  );
}

export default App;
