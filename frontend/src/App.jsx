// src/App.jsx

import "./App.css";
import AppRoutes from "./routes/AppRoutes";
import { CartProvider } from "./context/CartContext.jsx";

function App() {
  return (
    <CartProvider>
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
