import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { API_URL } from "../config/api";
import "./WaiterManagement.css";

function WaiterManagement() {
  const navigate = useNavigate();

  const [waiters, setWaiters] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showAddForm, setShowAddForm] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    gender: "Other",
    address: "",
  });

  // =========================================
  // Get Restaurant
  // =========================================

  const restaurantAdmin = JSON.parse(
    localStorage.getItem("restaurantAdmin") || "null"
  );

  const restaurantId =
    restaurantAdmin?._id ||
    restaurantAdmin?.id ||
    restaurantAdmin?.restaurantId?._id;

  // =========================================
  // Fetch Waiters
  // =========================================

  const fetchWaiters = async () => {
    try {
      setLoading(true);

      if (!restaurantId) {
        console.error("Restaurant ID not found");
        return;
      }

      const response = await fetch(
        `${API_URL}/waiters/restaurant/${restaurantId}`
      );

      const data = await response.json();

      if (data.success) {
        setWaiters(data.waiters || []);
      } else {
        console.error(data.message);
      }
    } catch (error) {
      console.error("Fetch waiters error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWaiters();
  }, []);

  // =========================================
  // Input Change
  // =========================================

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  // =========================================
  // Add Waiter
  // =========================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      if (!restaurantId) {
        alert("Restaurant ID not found");
        return;
      }

      const response = await fetch(
        `${API_URL}/waiters/create`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            restaurantId,
            ...formData,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        alert(data.message || "Failed to create waiter");
        return;
      }

      alert(
        `Waiter created successfully!\n\nWaiter ID: ${data.waiter.waiterId}`
      );

      setFormData({
        name: "",
        email: "",
        phone: "",
        password: "",
        gender: "Other",
        address: "",
      });

      setShowAddForm(false);

      fetchWaiters();
    } catch (error) {
      console.error("Create waiter error:", error);
      alert("Something went wrong");
    }
  };

  // =========================================
  // Logout
  // =========================================

  const handleLogout = () => {
    localStorage.removeItem("restaurantAdmin");
    navigate("/login");
  };

  return (
    <div className="waiter-management-page">

      {/* ======================================
          Header
      ====================================== */}

      <div className="waiter-page-header">

        <div>
          <h1>Waiter Management</h1>
          <p>
            Manage restaurant waiters and assigned tables
          </p>
        </div>

        <div className="header-actions">

          <button
            className="back-btn"
            onClick={() => navigate("/admin/dashboard")}
          >
            ← Dashboard
          </button>

          <button
            className="add-waiter-btn"
            onClick={() => setShowAddForm(true)}
          >
            + Add Waiter
          </button>

        </div>

      </div>

      {/* ======================================
          Stats
      ====================================== */}

      <div className="waiter-stats">

        <div className="waiter-stat-card">
          <span>Total Waiters</span>
          <strong>{waiters.length}</strong>
        </div>

        <div className="waiter-stat-card">
          <span>Active</span>
          <strong>
            {
              waiters.filter(
                (waiter) => waiter.status === "Active"
              ).length
            }
          </strong>
        </div>

        <div className="waiter-stat-card">
          <span>Inactive</span>
          <strong>
            {
              waiters.filter(
                (waiter) => waiter.status === "Inactive"
              ).length
            }
          </strong>
        </div>

      </div>

      {/* ======================================
          Add Waiter Form
      ====================================== */}

      {showAddForm && (
        <div className="form-overlay">

          <div className="waiter-form-card">

            <div className="form-header">

              <div>
                <h2>Add New Waiter</h2>
                <p>Create login credentials for waiter</p>
              </div>

              <button
                className="close-btn"
                onClick={() => setShowAddForm(false)}
              >
                ×
              </button>

            </div>

            <form onSubmit={handleSubmit}>

              <div className="form-grid">

                <div className="form-group">
                  <label>Waiter Name *</label>

                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Enter waiter name"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Email</label>

                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="Enter email"
                  />
                </div>

                <div className="form-group">
                  <label>Phone</label>

                  <input
                    type="text"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="Enter phone number"
                  />
                </div>

                <div className="form-group">
                  <label>Password *</label>

                  <input
                    type="password"
                    name="new_waiter_password_field"
                    autoComplete="new-password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Enter password"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Gender</label>

                  <select
                    name="gender"
                    value={formData.gender}
                    onChange={handleChange}
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div className="form-group full-width">
                  <label>Address</label>

                  <textarea
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    placeholder="Enter address"
                    rows="3"
                  />
                </div>

              </div>

              <div className="form-actions">

                <button
                  type="button"
                  className="cancel-btn"
                  onClick={() => setShowAddForm(false)}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="save-btn"
                >
                  Create Waiter
                </button>

              </div>

            </form>

          </div>

        </div>
      )}

      {/* ======================================
          Waiter List
      ====================================== */}

      <div className="waiter-list-card">

        <div className="list-header">
          <div>
            <h2>Restaurant Waiters</h2>
            <p>
              {waiters.length} waiter
              {waiters.length !== 1 ? "s" : ""} found
            </p>
          </div>
        </div>

        {loading ? (
          <div className="loading-message">
            Loading waiters...
          </div>
        ) : waiters.length === 0 ? (
          <div className="empty-message">
            <div className="empty-icon">👨‍🍳</div>

            <h3>No Waiters Added</h3>

            <p>
              Add your first waiter to start managing
              tables and orders.
            </p>

            <button
              className="add-waiter-btn"
              onClick={() => setShowAddForm(true)}
            >
              + Add First Waiter
            </button>
          </div>
        ) : (
          <div className="waiter-table-wrapper">

            <table className="waiter-table">

              <thead>
                <tr>
                  <th>Waiter</th>
                  <th>Waiter ID</th>
                  <th>Phone</th>
                  <th>Assigned Tables</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>

                {waiters.map((waiter) => (

                  <tr key={waiter._id}>

                    <td>
                      <div className="waiter-info">

                        <div className="waiter-avatar">
                          {waiter.name
                            ?.charAt(0)
                            .toUpperCase()}
                        </div>

                        <div>
                          <strong>{waiter.name}</strong>

                          <small>
                            {waiter.email || "No email"}
                          </small>
                        </div>

                      </div>
                    </td>

                    <td>
                      <span className="waiter-id">
                        {waiter.waiterId}
                      </span>
                    </td>

                    <td>
                      {waiter.phone || "-"}
                    </td>

                    <td>

                      {waiter.assignedTables?.length > 0
                        ? waiter.assignedTables
                            .map(
                              (table) =>
                                table.tableNumber
                            )
                            .join(", ")
                        : "Not Assigned"}

                    </td>

                    <td>

                      <span
                        className={`status-badge ${
                          waiter.status === "Active"
                            ? "active"
                            : "inactive"
                        }`}
                      >
                        {waiter.status}
                      </span>

                    </td>

                    <td>

                      <div className="action-buttons">

                        <button
                          className="view-btn"
                          onClick={() =>
                            navigate(
                              `/restaurant/waiters/${waiter._id}`
                            )
                          }
                        >
                          View
                        </button>

                        <button
                          className="assign-btn"
                          onClick={() =>
                            alert(
                              "Table assignment will be added in the next step."
                            )
                          }
                        >
                          Assign
                        </button>

                      </div>

                    </td>

                  </tr>

                ))}

              </tbody>

            </table>

          </div>
        )}

      </div>

    </div>
  );
}

export default WaiterManagement;
