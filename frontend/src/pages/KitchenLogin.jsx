import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { API_URL } from "../config/api";
import "./KitchenLogin.css";

function KitchenLogin() {
  const navigate = useNavigate();
  const [chefId, setChefId] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    if (!chefId.trim() || !password) return setError("Chef ID and password are required.");
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: chefId.trim().toUpperCase(), password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data.role !== "chef" || !data.user) {
        throw new Error(data.message || "Invalid Chef ID or password.");
      }
      localStorage.setItem("chef", JSON.stringify(data.user));
      localStorage.setItem("authUser", JSON.stringify(data.user));
      localStorage.setItem("authToken", data.token || "");
      navigate("/kitchen/dashboard");
    } catch (err) {
      setError(err.message || "Unable to sign in.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="kitchen-login-page">
      {/* LEFT PANEL */}
      <section className="kitchen-login-left">
        <button className="kitchen-login-back" type="button" onClick={() => navigate("/login")}>
          ← Main Login
        </button>

        <div className="kitchen-login-brand">
          <div className="kitchen-brand-icon">🍳</div>
          <div>
            <h1>Kitchen Station</h1>
            <span>Display System</span>
          </div>
        </div>

        <div className="kitchen-login-copy">
          <p className="kitchen-eyebrow">KITCHEN OPERATIONS</p>
          <h2>Manage orders from the kitchen, one ticket at a time.</h2>
          <p>Sign in using your Chef ID and password to access the Kitchen Display System.</p>
        </div>

        <div className="kitchen-login-features">
          <div className="kitchen-feature-item">
            <span className="kitchen-feature-icon">🔔</span>
            <div>
              <strong>Live Order Tickets</strong>
              <p>Real-time new orders as they come in</p>
            </div>
          </div>
          <div className="kitchen-feature-item">
            <span className="kitchen-feature-icon">⏱️</span>
            <div>
              <strong>Timer Tracking</strong>
              <p>Monitor prep time for every order</p>
            </div>
          </div>
          <div className="kitchen-feature-item">
            <span className="kitchen-feature-icon">📋</span>
            <div>
              <strong>Status Management</strong>
              <p>New → Preparing → Ready workflow</p>
            </div>
          </div>
        </div>
      </section>

      {/* RIGHT PANEL */}
      <section className="kitchen-login-right">
        <form className="kitchen-login-card" onSubmit={submit} noValidate>
          <div className="kitchen-card-icon">👨‍🍳</div>
          <div className="kitchen-card-header">
            <p>KITCHEN SIGN IN</p>
            <h2>Welcome, Chef!</h2>
            <span>Enter your Chef ID and password to access the kitchen dashboard.</span>
          </div>

          {error && <p className="kitchen-login-error" role="alert">{error}</p>}

          <label htmlFor="chef-id">Chef ID</label>
          <div className="kitchen-input-wrap">
            <span aria-hidden="true">👨‍🍳</span>
            <input
              id="chef-id"
              type="text"
              value={chefId}
              onChange={(e) => setChefId(e.target.value)}
              placeholder="e.g. CHEF001"
              autoComplete="username"
              disabled={loading}
            />
          </div>

          <label htmlFor="chef-password">Password</label>
          <div className="kitchen-input-wrap">
            <span aria-hidden="true">🔑</span>
            <input
              id="chef-password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              autoComplete="current-password"
              disabled={loading}
            />
            <button type="button" onClick={() => setShowPassword((v) => !v)} disabled={loading}>
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>

          <button className="kitchen-login-submit" type="submit" disabled={loading}>
            {loading ? "Signing in…" : "Enter Kitchen Dashboard"}
            <span aria-hidden="true">→</span>
          </button>

          <p className="kitchen-login-help">
            Contact the restaurant admin if you don't have your Chef ID or password.
          </p>
        </form>
      </section>
    </main>
  );
}

export default KitchenLogin;
