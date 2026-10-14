import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { API_URL } from "../config/api";
import "./UnifiedLogin.css";

function UnifiedLogin() {
  const navigate = useNavigate();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [suspendedMsg, setSuspendedMsg] = useState("");
  const [loading, setLoading] = useState(false);


  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSuspendedMsg("");

    if (!identifier.trim() || !password) {
      setError("Please enter your login ID/email and password.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: identifier.trim(), password }),
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok || !data.token || !data.user) {
        // Check if this is a suspended/inactive restaurant
        if (data.suspended) {
          setSuspendedMsg(data.message || "This restaurant account is inactive. Please contact Super Admin.");
          return;
        }
        throw new Error(data.message || "Login failed. Please check your details.");
      }

      ["superAdmin", "restaurantAdmin", "adminToken", "adminInfo", "customerUser"].forEach((key) => localStorage.removeItem(key));
      localStorage.setItem("authToken", data.token);
      localStorage.setItem("authUser", JSON.stringify(data.user));

      if (data.role === "customer") {
        localStorage.setItem("customerUser", JSON.stringify(data.user));
        const redirectPath = localStorage.getItem("postLoginRedirect") || "/customer/menu";
        localStorage.removeItem("postLoginRedirect");
        navigate(redirectPath);
      } else if (data.role === "superadmin") {
        localStorage.setItem("superAdmin", JSON.stringify(data.user));
        navigate("/superadmin/dashboard");
      } else if (data.role === "restaurant") {
        localStorage.setItem("restaurantAdmin", JSON.stringify(data.user));
        localStorage.setItem("adminInfo", JSON.stringify(data.user));
        localStorage.setItem("adminToken", data.token);
        navigate("/admin/dashboard");
      } else if (data.role === "waiter") {
        localStorage.setItem("waiter", JSON.stringify(data.user));
        navigate("/waiter/dashboard");
      } else if (data.role === "manager") {
        localStorage.setItem("manager", JSON.stringify(data.user));
        navigate("/manager/dashboard");
      } else if (data.role === "chef") {
        localStorage.setItem("chef", JSON.stringify(data.user));
        navigate("/chef/dashboard");
      } else if (data.role === "cleaner") {
        localStorage.setItem("cleaner", JSON.stringify(data.user));
        navigate(`/admin/staff/cleaners/${data.user.id || data.user._id}`);
      } else {
        localStorage.setItem("adminToken", data.token);
        localStorage.setItem("adminInfo", JSON.stringify(data.user));
        navigate("/admin/dashboard");
      }
    } catch (requestError) {
      setError(requestError.message || "Unable to sign in. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="login-page">
      <section className="login-showcase" aria-label="FoodVista welcome">
        <div className="login-brand"><span className="login-brand-mark">FV</span><span>FoodVista</span></div>
        <div className="login-copy">
          <p className="login-eyebrow">RESTAURANT MANAGEMENT</p>
          <h1>Everything your restaurant needs, in one place.</h1>
          <p>Manage your menu, restaurant operations and orders with a simple, secure sign in.</p>
        </div>
        <div className="login-benefits"><span>✓ Secure access</span><span>✓ Role-based dashboard</span><span>✓ Quick menu management</span></div>
      </section>

      <section className="login-panel">
        <form className="login-card" onSubmit={handleSubmit} noValidate>
          <div className="login-card-header"><p>WELCOME BACK</p><h2>Sign in to FoodVista</h2><span>Customer, administrator, restaurant and waiter accounts are supported.</span></div>
          {suspendedMsg && (
            <div className="login-suspended-banner" role="alert">
              <span className="suspended-icon">🚫</span>
              <div>
                <strong>Restaurant Suspended / Inactive</strong>
                <p>{suspendedMsg}</p>
              </div>
            </div>
          )}
          {error && <p className="login-error" role="alert">{error}</p>}
          <label htmlFor="identifier">Login ID or email</label>
          <div className="login-input-wrap"><span aria-hidden="true">✦</span><input id="identifier" type="text" value={identifier} onChange={(event) => setIdentifier(event.target.value)} placeholder="e.g. admin@gmail.com" autoComplete="username" disabled={loading} /></div>
          <label htmlFor="password">Password</label>
          <div className="login-input-wrap"><span aria-hidden="true">⌁</span><input id="password" type={showPassword ? "text" : "password"} value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Enter your password" autoComplete="current-password" disabled={loading} /><button type="button" onClick={() => setShowPassword((visible) => !visible)} disabled={loading}>{showPassword ? "Hide" : "Show"}</button></div>
          <button className="login-submit" type="submit" disabled={loading}>{loading ? "Signing you in..." : "Sign in"}<span aria-hidden="true">→</span></button>
          <p className="login-help">Customer, admin, restaurant owner, manager and waiter can all sign in here. Manager uses an ID like MGR001.</p>
        </form>
      </section>
    </main>
  );
}

export default UnifiedLogin;
