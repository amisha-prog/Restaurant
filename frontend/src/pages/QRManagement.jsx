import { useEffect, useMemo, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import QRCode from "qrcode";
import { API_URL } from "../config/api";
import "./QRManagement.css";

function QRManagement({ onBack, currentRestaurant }) {
  const navigate = useNavigate();
  const [restaurant, setRestaurant] = useState(null);
  const [tables, setTables] = useState([]);
  const [selectedTable, setSelectedTable] = useState(null);
  const [qrImage, setQrImage] = useState("");
  const [notice, setNotice] = useState({ type: "", text: "" });
  const [loading, setLoading] = useState(true);

  // Network IP detection for mobile phone scanning
  const [networkIp, setNetworkIp] = useState("");
  const [urlMode, setUrlMode] = useState("network"); // "network" | "localhost" | "custom"
  const [customBaseUrl, setCustomBaseUrl] = useState("");

  // Table creation modal / form state
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTableForm, setNewTableForm] = useState({
    tableNumber: "",
    capacity: 4,
    status: "Available",
  });
  const [tableSaving, setTableSaving] = useState(false);

  // Status updating state
  const [updatingTableId, setUpdatingTableId] = useState(null);

  // Load restaurant info
  useEffect(() => {
    try {
      let savedRestaurant = currentRestaurant;
      if (!savedRestaurant) {
        savedRestaurant =
          JSON.parse(localStorage.getItem("restaurantAdmin") || "null") ||
          JSON.parse(localStorage.getItem("adminInfo") || "null") ||
          JSON.parse(localStorage.getItem("authUser") || "null") ||
          JSON.parse(localStorage.getItem("admin") || "null");
      }

      if (!savedRestaurant) {
        return navigate("/login", { replace: true });
      }

      const rCode = savedRestaurant.restaurantId || savedRestaurant.restaurantCode || savedRestaurant.code || "";
      const rId = savedRestaurant._id || savedRestaurant.id || rCode;

      const restObj = {
        _id: rId,
        restaurantId: rCode || rId,
        restaurantName: savedRestaurant.restaurantName || savedRestaurant.ownerName || savedRestaurant.name || "Restaurant",
        ownerName: savedRestaurant.ownerName || savedRestaurant.name || "Admin",
      };
      setRestaurant(restObj);
    } catch {
      navigate("/login", { replace: true });
    }
  }, [currentRestaurant, navigate]);

  // Fetch host computer network IP from backend
  useEffect(() => {
    const fetchNetworkIp = async () => {
      try {
        const backendBase = API_URL.replace(/\/api$/, "");
        const res = await fetch(`${backendBase}/api/network-ip`);
        const data = await res.json();
        if (data.success && data.localIp) {
          setNetworkIp(data.localIp);
        }
      } catch (err) {
        console.warn("Could not auto-fetch network IP, using fallback:", err);
      }
    };
    fetchNetworkIp();
  }, []);

  // Fetch tables dynamically from backend database
  const fetchTables = useCallback(async (restId) => {
    if (!restId) return;
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/tables?restaurantId=${encodeURIComponent(restId)}`);
      const data = await res.json();
      if (res.ok && data.success && Array.isArray(data.tables)) {
        setTables(data.tables);
        if (data.tables.length > 0) {
          setSelectedTable((prev) => {
            if (prev) {
              const match = data.tables.find((t) => t._id === prev._id || t.tableNumber === prev.tableNumber);
              return match || data.tables[0];
            }
            return data.tables[0];
          });
        } else {
          setSelectedTable(null);
        }
      } else {
        // Fallback to localStorage if API is unavailable
        const saved = JSON.parse(localStorage.getItem(`restaurantTables:${restId}`) || "null");
        if (Array.isArray(saved) && saved.length) {
          const formatted = saved.map((t, idx) =>
            typeof t === "string" ? { _id: `local_${idx}`, tableNumber: t, capacity: 4, status: "Available" } : t
          );
          setTables(formatted);
          setSelectedTable(formatted[0]);
        } else {
          setTables([]);
          setSelectedTable(null);
        }
      }
    } catch (err) {
      console.error("Fetch tables failed:", err);
      setNotice({ type: "error", text: "Failed to connect to tables database." });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const activeId = restaurant?.restaurantId || restaurant?._id || restaurant?.id;
    if (activeId) {
      fetchTables(activeId);
    }
  }, [restaurant, fetchTables]);

  // Compute the effective Base URL (for phone vs localhost vs custom)
  const effectiveBaseUrl = useMemo(() => {
    if (urlMode === "custom" && customBaseUrl.trim()) {
      return customBaseUrl.trim().replace(/\/$/, "");
    }

    if (urlMode === "localhost") {
      return `http://localhost:5173`;
    }

    // "network" mode (default for phone scanning)
    if (networkIp) {
      return `http://${networkIp}:5173`;
    }

    // If current window is already opened via network IP
    if (typeof window !== "undefined" && window.location.hostname && window.location.hostname !== "localhost" && window.location.hostname !== "127.0.0.1") {
      return window.location.origin;
    }

    // Fallback
    return window.location.origin;
  }, [urlMode, customBaseUrl, networkIp]);

  // Compute final QR Menu URL for the selected table
  const menuUrl = useMemo(() => {
    if (!restaurant || !selectedTable) return "";
    const tableName = selectedTable.tableNumber || selectedTable;
    const params = new URLSearchParams({
      restaurant: restaurant.restaurantId,
      table: tableName,
    });
    return `${effectiveBaseUrl}/customer/menu?${params.toString()}`;
  }, [restaurant, selectedTable, effectiveBaseUrl]);

  // Generate QR Code image DataURL
  useEffect(() => {
    if (!menuUrl) return;
    QRCode.toDataURL(menuUrl, {
      width: 480,
      margin: 2,
      errorCorrectionLevel: "H",
      color: { dark: "#0f172a", light: "#ffffff" },
    })
      .then(setQrImage)
      .catch(() => setNotice({ type: "error", text: "QR code could not be generated." }));
  }, [menuUrl]);

  // Handle Add Table submission
  const handleAddTableSubmit = async (e) => {
    e.preventDefault();
    if (!newTableForm.tableNumber.trim()) {
      return alert("Please enter a valid table number.");
    }

    try {
      setTableSaving(true);
      const res = await fetch(`${API_URL}/tables`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          restaurantId: restaurant.restaurantId,
          tableNumber: newTableForm.tableNumber.trim(),
          capacity: Number(newTableForm.capacity) || 4,
          status: newTableForm.status || "Available",
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to add table");
      }

      setNotice({ type: "success", text: `Table "${data.table.tableNumber}" created successfully!` });
      setShowAddModal(false);
      setNewTableForm({ tableNumber: "", capacity: 4, status: "Available" });
      fetchTables(restaurant.restaurantId);
      setSelectedTable(data.table);
    } catch (err) {
      alert(err.message || "Could not add table.");
    } finally {
      setTableSaving(false);
    }
  };

  // Quick Table status toggle (Available -> Occupied -> Reserved -> Cleaning)
  const handleStatusChange = async (tableId, nextStatus) => {
    try {
      setUpdatingTableId(tableId);
      const res = await fetch(`${API_URL}/tables/${tableId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to update table status");
      }

      setTables((prev) =>
        prev.map((t) => (t._id === tableId ? { ...t, status: nextStatus } : t))
      );
      if (selectedTable && selectedTable._id === tableId) {
        setSelectedTable((prev) => ({ ...prev, status: nextStatus }));
      }
      setNotice({ type: "success", text: `Table status changed to ${nextStatus}` });
    } catch (err) {
      alert(err.message);
    } finally {
      setUpdatingTableId(null);
    }
  };

  // Delete single table
  const handleDeleteTable = async (table) => {
    if (!window.confirm(`Delete "${table.tableNumber || "this table"}"?`)) {
      return;
    }

    try {
      if (table._id && !table._id.startsWith("local_") && !table._id.startsWith("default_")) {
        await fetch(`${API_URL}/tables/${table._id}`, { method: "DELETE" });
      }

      const remaining = tables.filter((t) => (t._id ? t._id !== table._id : t !== table));
      setTables(remaining);
      if (selectedTable?._id === table._id || selectedTable?.tableNumber === table.tableNumber) {
        setSelectedTable(remaining[0] || null);
      }
      setNotice({ type: "success", text: `Table "${table.tableNumber}" deleted.` });
    } catch (err) {
      alert("Failed to delete table: " + err.message);
    }
  };

  // Clear all tables for this restaurant
  const handleClearAllTables = async () => {
    if (!window.confirm(`Are you sure you want to remove ALL tables for ${restaurant.restaurantName}?`)) {
      return;
    }

    try {
      await fetch(`${API_URL}/tables/all?restaurantId=${encodeURIComponent(restaurant.restaurantId)}`, {
        method: "DELETE",
      });
      localStorage.removeItem(`restaurantTables:${restaurant.restaurantId}`);
      setTables([]);
      setSelectedTable(null);
      setNotice({ type: "success", text: "All tables cleared successfully." });
    } catch (err) {
      alert("Failed to clear tables: " + err.message);
    }
  };

  // Download QR as PNG
  const downloadQR = () => {
    if (!qrImage || !selectedTable) return;
    const a = document.createElement("a");
    a.href = qrImage;
    const cleanName = (selectedTable.tableNumber || "Table").replace(/\s+/g, "-");
    a.download = `${restaurant.restaurantId}-${cleanName}-QR.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setNotice({ type: "success", text: `Downloaded QR for ${selectedTable.tableNumber || "table"}` });
  };

  const printQR = () => window.print();

  if (!restaurant) return null;

  const currentTableName = selectedTable?.tableNumber || selectedTable || "Select Table";
  const currentTableStatus = selectedTable?.status || "Available";

  return (
    <main className="qr-page">
      {/* HEADER */}
      <header className="qr-header no-print">
        <div className="qr-header-info">
          <button
            type="button"
            className="btn-back-dash"
            onClick={() => {
              if (typeof onBack === "function") {
                onBack();
              } else {
                navigate("/admin/dashboard");
              }
            }}
          >
            ← Back to Dashboard
          </button>
          <div className="qr-title-tag">RESTAURANT ADMIN • TABLE MANAGEMENT</div>
          <h1>Table QR & Menu Management</h1>
          <p className="qr-subtitle">
            Generate dynamic table QR codes that customers scan on their mobile phones to view the live menu & place orders.
          </p>
        </div>

        <div className="qr-restaurant-badge">
          <strong>{restaurant.restaurantName}</strong>
          <span>ID: {restaurant.restaurantId}</span>
          <span className="qr-tables-badge">🪑 {tables.length} Total Tables</span>
        </div>
      </header>



      {/* MAIN TWO-COLUMN LAYOUT */}
      <section className="qr-layout">
        {/* LEFT COLUMN: DYNAMIC TABLES MANAGEMENT */}
        <div className="qr-controls no-print">
          <div className="qr-card-header-flex">
            <div>
              <p className="card-kicker">TABLES</p>
              <h2>Select or Manage Table</h2>
            </div>
            <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
              {tables.length > 0 && (
                <button
                  type="button"
                  style={{
                    padding: "6px 12px",
                    fontSize: "12px",
                    fontWeight: "600",
                    background: "#fee2e2",
                    color: "#dc2626",
                    border: "1px solid #fca5a5",
                    borderRadius: "8px",
                    cursor: "pointer",
                  }}
                  onClick={handleClearAllTables}
                  title="Remove all tables for this restaurant"
                >
                  🗑️ Clear All
                </button>
              )}
              <button
                type="button"
                className="btn-add-table-primary"
                onClick={() => {
                  const nextNum = `Table ${String(tables.length + 1).padStart(2, "0")}`;
                  setNewTableForm({ tableNumber: nextNum, capacity: 4, status: "Available" });
                  setShowAddModal(true);
                }}
              >
                + Add Table
              </button>
            </div>
          </div>

          {loading ? (
            <div className="tables-loading-skeleton">Loading restaurant tables...</div>
          ) : tables.length === 0 ? (
            <div
              style={{
                padding: "32px 20px",
                textAlign: "center",
                background: "#f8fafc",
                borderRadius: "12px",
                border: "2px dashed #cbd5e1",
                margin: "16px 0",
              }}
            >
              <div style={{ fontSize: "36px", marginBottom: "8px" }}>🪑</div>
              <h3 style={{ margin: "0 0 6px 0", color: "#1e293b", fontSize: "16px" }}>No Tables Created Yet</h3>
              <p style={{ margin: "0 0 16px 0", color: "#64748b", fontSize: "13px" }}>
                This restaurant has no dining tables. Click below to add your first table.
              </p>
              <button
                type="button"
                className="btn-add-table-primary"
                style={{ margin: "0 auto" }}
                onClick={() => {
                  setNewTableForm({ tableNumber: "Table 01", capacity: 4, status: "Available" });
                  setShowAddModal(true);
                }}
              >
                + Add First Table
              </button>
            </div>
          ) : (
            <div className="table-grid-dynamic">
              {tables.map((table) => {
                const num = table.tableNumber || table;
                const isSelected = selectedTable?._id
                  ? selectedTable._id === table._id
                  : selectedTable?.tableNumber === num || selectedTable === num;
                const st = (table.status || "Available").toLowerCase();

                return (
                  <div
                    key={table._id || num}
                    className={`table-card-item ${isSelected ? "is-selected" : ""} status-${st}`}
                    onClick={() => {
                      setSelectedTable(table);
                      setNotice({ type: "", text: "" });
                    }}
                  >
                    <div className="table-card-top">
                      <span className="table-card-name">{num}</span>
                      <span className={`table-status-pill status-${st}`}>
                        {table.status || "Available"}
                      </span>
                    </div>

                    <div className="table-card-sub">
                      <span>👥 {table.capacity || 4} Seats</span>
                      <button
                        type="button"
                        className="btn-table-delete-mini"
                        title="Delete this table"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteTable(table);
                        }}
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}


        </div>

        {/* RIGHT COLUMN: QR PREVIEW & READY TO PRINT STANDEE */}
        <section className="qr-preview">
          <div className="qr-preview-card-inner">
            <div className="qr-card-title">
              <p>TABLE STANDEE • READY TO SCAN</p>
              <h2>{selectedTable ? currentTableName : "No Table Selected"}</h2>
              <span>{selectedTable ? "Scan with mobile camera to view menu & order" : "Select or add a table to view & generate its QR code"}</span>
            </div>

            {/* HIGH QUALITY QR CODE DISPLAY */}
            <div className="qr-image-wrapper">
              {selectedTable && qrImage ? (
                <img
                  className="qr-code"
                  src={qrImage}
                  alt={`QR code for ${currentTableName}`}
                />
              ) : (
                <div className="qr-placeholder" style={{ padding: "40px 20px", textAlign: "center", color: "#94a3b8" }}>
                  {selectedTable ? "Generating QR code..." : "➕ Add or select a table to view QR Standee"}
                </div>
              )}
            </div>

            {/* STANDEE BRAND BADGE */}
            <div className="qr-table-label">
              <span className="brand-icon">🍽️</span>
              <div className="brand-names">
                <strong>{restaurant.restaurantName}</strong>
                <span className="table-highlight">{currentTableName}</span>
              </div>
            </div>

            {/* TABLE STATUS SELECTOR ON ACTIVE TABLE */}
            {selectedTable?._id && (
              <div className="active-table-status-bar no-print">
                <span className="status-label">Current Table Status:</span>
                <div className="status-button-group">
                  {["Available", "Occupied", "Reserved", "Cleaning"].map((st) => (
                    <button
                      key={st}
                      type="button"
                      disabled={updatingTableId === selectedTable._id}
                      className={`btn-status-toggle status-${st.toLowerCase()} ${
                        currentTableStatus === st ? "is-current" : ""
                      }`}
                      onClick={() => handleStatusChange(selectedTable._id, st)}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* QUICK TEST LINK BUTTON */}
            <div className="qr-url-box no-print">
              <div className="url-meta">
                <span className="url-label">Customer Menu Link:</span>
                <a
                  href={menuUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="btn-test-url"
                  title="Open this customer dashboard in a new tab"
                >
                  🚀 Test Open in Browser →
                </a>
              </div>
            </div>

            {/* ACTION NOTICES */}
            {notice.text && (
              <div className={`qr-notice-alert ${notice.type === "error" ? "is-error" : "is-success"}`}>
                {notice.type === "error" ? "⚠️ " : "✅ "}
                {notice.text}
              </div>
            )}

            {/* ACTION BUTTONS */}
            <div className="qr-actions no-print">
              <button type="button" className="btn-action print-qr" onClick={printQR}>
                🖨️ Print Standee
              </button>

              <button type="button" className="btn-action download-qr" onClick={downloadQR}>
                ⬇️ Download QR PNG
              </button>

              <button
                type="button"
                className="btn-action copy-link"
                onClick={() => {
                  navigator.clipboard?.writeText(menuUrl).then(() => {
                    setNotice({ type: "success", text: "Customer menu URL copied to clipboard!" });
                  });
                }}
              >
                📋 Copy Link
              </button>
            </div>
          </div>
        </section>
      </section>

      {/* ADD TABLE MODAL */}
      {showAddModal && (
        <div className="qr-modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="qr-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Add New Dining Table</h3>
              <button
                type="button"
                className="btn-modal-close"
                onClick={() => setShowAddModal(false)}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddTableSubmit}>
              <div className="form-group">
                <label>Table Number / Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Table 14 or VIP-1"
                  value={newTableForm.tableNumber}
                  onChange={(e) => setNewTableForm({ ...newTableForm, tableNumber: e.target.value })}
                />
              </div>

              <div className="form-row-2">
                <div className="form-group">
                  <label>Guest Capacity (Seats)</label>
                  <input
                    type="number"
                    min="1"
                    max="30"
                    value={newTableForm.capacity}
                    onChange={(e) => setNewTableForm({ ...newTableForm, capacity: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Initial Status</label>
                  <select
                    value={newTableForm.status}
                    onChange={(e) => setNewTableForm({ ...newTableForm, status: e.target.value })}
                  >
                    <option value="Available">Available (🟢)</option>
                    <option value="Occupied">Occupied (🔴)</option>
                    <option value="Reserved">Reserved (🟡)</option>
                    <option value="Cleaning">Cleaning (🔵)</option>
                  </select>
                </div>
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn-modal-cancel"
                  onClick={() => setShowAddModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-modal-submit"
                  disabled={tableSaving}
                >
                  {tableSaving ? "Saving Table..." : "Create Table"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}

export default QRManagement;
