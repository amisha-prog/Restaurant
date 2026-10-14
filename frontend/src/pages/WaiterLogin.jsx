import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { API_URL } from "../config/api";
import "./UnifiedLogin.css";

function WaiterLogin() {
  const navigate = useNavigate();
  const [waiterId, setWaiterId] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);


  const submit = async (event) => {
    event.preventDefault();
    setError("");
    if (!waiterId.trim() || !password) return setError("Waiter ID and password are required.");
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: waiterId.trim().toUpperCase(), password }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || data.role !== "waiter" || !data.user) throw new Error(data.message || "Invalid waiter ID or password.");
      localStorage.setItem("waiter", JSON.stringify(data.user));
      localStorage.setItem("authUser", JSON.stringify(data.user));
      localStorage.setItem("authToken", data.token || "");
      navigate("/waiter/dashboard");
    } catch (requestError) {
      setError(requestError.message || "Unable to sign in.");
    } finally { setLoading(false); }
  };

  return <main className="login-page">
    <section className="login-showcase">
      <button className="login-back" type="button" onClick={() => navigate("/login")}>← Main login</button>
      <div className="login-brand"><span className="login-brand-mark">WP</span><span>Waiter Panel</span></div>
      <div className="login-copy"><p className="login-eyebrow">RESTAURANT OPERATIONS</p><h1>Manage tables and orders with confidence.</h1><p>Sign in using the waiter ID and password provided by your restaurant administrator.</p></div>
      <div className="login-benefits"><span>✓ Live orders</span><span>✓ Table status</span><span>✓ Kitchen updates</span></div>
    </section>
    <section className="login-panel"><form className="login-card" onSubmit={submit} noValidate>
      <div className="login-card-header"><p>WAITER SIGN IN</p><h2>Welcome back</h2><span>Use your assigned waiter credentials.</span></div>
      {error && <p className="login-error" role="alert">{error}</p>}
      <label htmlFor="waiter-id">Waiter ID</label>
      <div className="login-input-wrap"><span>⌁</span><input id="waiter-id" value={waiterId} onChange={(event) => setWaiterId(event.target.value)} placeholder="e.g. WAIT001" autoComplete="username" disabled={loading} /></div>
      <label htmlFor="waiter-password">Password</label>
      <div className="login-input-wrap"><span>⌁</span><input id="waiter-password" type={showPassword ? "text" : "password"} value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Enter password" autoComplete="current-password" disabled={loading} /><button type="button" onClick={() => setShowPassword((value) => !value)}>{showPassword ? "Hide" : "Show"}</button></div>
      <button className="login-submit" type="submit" disabled={loading}>{loading ? "Signing in…" : "Login to waiter panel"}<span>→</span></button>
      <p className="login-help">Ask the restaurant administrator if you do not have your waiter ID or password.</p>
    </form></section>
  </main>;
}

export default WaiterLogin;
