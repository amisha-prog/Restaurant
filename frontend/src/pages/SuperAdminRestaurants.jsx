import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { API_URL } from "../config/api";
import "../App.css";

function SuperAdminRestaurants() {
  const navigate = useNavigate();

  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteLoading, setDeleteLoading] = useState(null);
  const [activeDropdownId, setActiveDropdownId] = useState(null);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);

  const totalPages = Math.ceil(restaurants.length / itemsPerPage) || 1;

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(Math.max(1, totalPages));
    }
  }, [restaurants.length, totalPages, currentPage]);

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentRestaurants = restaurants.slice(
    indexOfFirstItem,
    indexOfLastItem
  );

  useEffect(() => {
    const handleOutsideClick = () => setActiveDropdownId(null);
    window.addEventListener("click", handleOutsideClick);
    return () => window.removeEventListener("click", handleOutsideClick);
  }, []);

  // =====================================
  // Fetch All Restaurants
  // =====================================

  const fetchRestaurants = async () => {
    try {
      setLoading(true);

      const response = await fetch(
        `${API_URL}/restaurants`
      );

      const data = await response.json();

      console.log("Restaurants API Response:", data);

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to fetch restaurants"
        );
      }

      setRestaurants(data.restaurants || []);
    } catch (error) {
      console.error("Fetch Restaurants Error:", error);
      alert(error.message || "Failed to fetch restaurants");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRestaurants();
  }, []);

  // =====================================
  // View Restaurant
  // =====================================

  const handleView = (id) => {
    navigate(`/superadmin/restaurants/${id}`);
  };

  // =====================================
  // Edit Restaurant
  // =====================================

  const handleEdit = (id) => {
    navigate(`/superadmin/restaurants/${id}/edit`);
  };

  // =====================================
  // Delete Restaurant
  // =====================================

  const handleDelete = async (id) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this restaurant?"
    );

    if (!confirmDelete) return;

    try {
      setDeleteLoading(id);

      const response = await fetch(
        `${API_URL}/restaurants/${id}`,
        {
          method: "DELETE",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to delete restaurant"
        );
      }

      alert("Restaurant deleted successfully.");

      setRestaurants((prev) =>
        prev.filter((restaurant) => restaurant._id !== id)
      );
    } catch (error) {
      console.error("Delete Restaurant Error:", error);

      alert(
        error.message || "Failed to delete restaurant"
      );
    } finally {
      setDeleteLoading(null);
    }
  };

  useEffect(() => {
    const isSuper =
      Boolean(localStorage.getItem("superAdmin")) ||
      (() => {
        try {
          return JSON.parse(localStorage.getItem("authUser") || "{}").role === "superadmin";
        } catch {
          return false;
        }
      })();

    if (!isSuper) {
      const isRest = Boolean(localStorage.getItem("restaurantAdmin") || localStorage.getItem("adminInfo"));
      if (isRest) {
        navigate("/admin/dashboard", { replace: true });
      } else {
        navigate("/login", { replace: true });
      }
    }
  }, [navigate]);

  // =====================================
  // Logout
  // =====================================

  const handleLogout = () => {
    localStorage.removeItem("superAdmin");
    localStorage.removeItem("restaurantAdmin");
    localStorage.removeItem("adminInfo");
    localStorage.removeItem("adminToken");
    localStorage.removeItem("authToken");
    localStorage.removeItem("authUser");
    localStorage.removeItem("admin");
    navigate("/login", { replace: true });
  };

  return (
    <div className="professional-dashboard">

      {/* MOBILE TOP NAVBAR (MATCHING REFERENCE IMAGE media_1791367078833.png) */}
      <div className="superadmin-mobile-bar">
        <div className="superadmin-mobile-profile">
          <div className="superadmin-mobile-avatar">SA</div>
          <div className="superadmin-mobile-info">
            <strong>Super Admin</strong>
            <small>Restaurant Management</small>
          </div>
        </div>

        <button
          className="superadmin-hamburger-btn"
          onClick={() => setMobileNavOpen((o) => !o)}
          aria-label="Toggle navigation"
        >
          <span></span>
          <span></span>
          <span></span>
        </button>
      </div>

      {/* MOBILE OVERLAY BACKDROP */}
      {mobileNavOpen && (
        <div className="mobile-nav-overlay" onClick={() => setMobileNavOpen(false)} />
      )}

      {/* =================================
          SIDEBAR
      ================================= */}

      <aside className={`professional-sidebar${mobileNavOpen ? " mobile-open" : ""}`}>

        <div className="sidebar-brand">
          <div className="sidebar-brand-content">
            <div className="brand-avatar-logo">
              <svg viewBox="0 0 24 24" fill="none" width="42" height="42" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="12" fill="url(#superadmin-logo-grad-rest)" />
                <circle cx="12" cy="8.5" r="4.2" fill="#ffffff" />
                <path d="M12 14.2C7.8 14.2 4.5 17.2 4.5 21C4.5 21.55 4.95 22 5.5 22H18.5C19.05 22 19.5 21.55 19.5 21C19.5 17.2 16.2 14.2 12 14.2Z" fill="#ffffff" />
                <defs>
                  <linearGradient id="superadmin-logo-grad-rest" x1="0" y1="0" x2="24" y2="24" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#38bdf8" />
                    <stop offset="1" stopColor="#2563eb" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
            <div>
              <h2>Super Admin</h2>
              <p>Restaurant Management</p>
            </div>
          </div>
        </div>

        <nav className="sidebar-navigation">

          <button className="sidebar-nav-active">
            <span>▤</span>
            Restaurants
          </button>

        </nav>

        <div className="sidebar-bottom">

          <div className="admin-profile">

            <div className="admin-avatar">
              SA
            </div>

            <div>
              <strong>Super Admin</strong>
              <span>Administrator</span>
            </div>

          </div>

          <button
            className="logout-button"
            onClick={handleLogout}
          >
            Logout
          </button>

        </div>

      </aside>


      {/* =================================
          MAIN CONTENT
      ================================= */}

      <main className="professional-main">

        {/* Header */}

        <header className="professional-header">

          <div>

            <h1 className="welcome-title">
              Welcome to <span className="gradient-text">SuperAdmin</span> <span className="wave-emoji">👋</span>
            </h1>

            <p className="welcome-subtitle">
              Manage and monitor all registered restaurants seamlessly
            </p>

          </div>

        </header>


        {/* =================================
            RESTAURANT MANAGEMENT
        ================================= */}

        <section className="restaurant-management">

          <div className="management-header">

            <div>

              <span className="section-label">
                RESTAURANT LIST
              </span>

              <h2>
                Restaurant Management
              </h2>

              <p>
                Total registered restaurants:{" "}
                <strong>{restaurants.length}</strong>
              </p>

            </div>

            <button
              className="primary-button"
              onClick={() =>
                navigate("/superadmin/add-restaurant")
              }
            >
              + Add Restaurant
            </button>

          </div>



          {/* =================================
              TABLE
          ================================= */}

          <div className="restaurant-table-container">

            {loading ? (

              <div className="dashboard-loading">
                Loading restaurants...
              </div>

            ) : restaurants.length === 0 ? (

              <div className="empty-restaurants">

                <h3>
                  No restaurants found
                </h3>

                <p>
                  Add your first restaurant to get started.
                </p>

                <button
                  className="primary-button"
                  onClick={() =>
                    navigate(
                      "/superadmin/add-restaurant"
                    )
                  }
                >
                  + Add Restaurant
                </button>

              </div>

            ) : (

              <table className="restaurant-table">

                <thead>

                  <tr>
                    <th>RESTAURANT</th>
                    <th>LOCATION</th>
                    <th>CUISINE</th>
                    <th>OWNER</th>
                    <th>STATUS</th>
                    <th>ACTION</th>
                  </tr>

                </thead>

                <tbody>

                  {currentRestaurants.map((restaurant) => (

                    <tr key={restaurant._id}>

                      {/* Restaurant */}

                      <td>

                        <div className="restaurant-name-cell">

                          <div className="restaurant-avatar">

                            {restaurant.restaurantName
                              ?.charAt(0)
                              .toUpperCase()}

                          </div>

                          <div>

                            <strong>
                              {restaurant.restaurantName}
                            </strong>

                            <span>
                              ID: {restaurant.restaurantId}
                            </span>

                          </div>

                        </div>

                      </td>


                      {/* Location */}

                      <td>

                        <span className="location-text">
                          {restaurant.city || "-"}
                        </span>

                      </td>


                      {/* Cuisine */}

                      <td>
                        {restaurant.cuisine || "-"}
                      </td>


                      {/* Owner */}

                      <td>
                        {restaurant.ownerName || "-"}
                      </td>


                      {/* Status */}

                      <td>

                        <span
                          className={
                            restaurant.status === "Active"
                              ? "status-active"
                              : "status-inactive"
                          }
                        >

                          <span className="status-dot"></span>

                          {restaurant.status || "Active"}

                        </span>

                      </td>


                      {/* Action */}

                      <td>

                        <div className="table-actions-dropdown-wrapper">

                          <button
                            type="button"
                            className={`action-dots-btn ${activeDropdownId === restaurant._id ? "active" : ""}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveDropdownId(prev => prev === restaurant._id ? null : restaurant._id);
                            }}
                            title="Actions"
                            aria-label="Actions"
                          >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                              <circle cx="12" cy="5" r="2" />
                              <circle cx="12" cy="12" r="2" />
                              <circle cx="12" cy="19" r="2" />
                            </svg>
                          </button>

                          {activeDropdownId === restaurant._id && (
                            <div className="action-dropdown-menu" onClick={(e) => e.stopPropagation()}>
                              <button
                                type="button"
                                className="action-dropdown-item item-view"
                                onClick={() => {
                                  setActiveDropdownId(null);
                                  handleView(restaurant._id);
                                }}
                              >
                                <span className="action-item-icon">👁️</span>
                                <span>View Details</span>
                              </button>

                              <button
                                type="button"
                                className="action-dropdown-item item-edit"
                                onClick={() => {
                                  setActiveDropdownId(null);
                                  handleEdit(restaurant._id);
                                }}
                              >
                                <span className="action-item-icon">✏️</span>
                                <span>Edit Restaurant</span>
                              </button>

                              <div className="action-dropdown-divider"></div>

                              <button
                                type="button"
                                className="action-dropdown-item item-delete"
                                disabled={deleteLoading === restaurant._id}
                                onClick={() => {
                                  setActiveDropdownId(null);
                                  handleDelete(restaurant._id);
                                }}
                              >
                                <span className="action-item-icon">🗑️</span>
                                <span>{deleteLoading === restaurant._id ? "Deleting..." : "Delete Restaurant"}</span>
                              </button>
                            </div>
                          )}

                        </div>

                      </td>

                    </tr>

                  ))}

                </tbody>

              </table>

            )}

            {/* Pagination Controls */}
            {restaurants.length > 0 && (
              <div className="table-pagination">
                <div className="pagination-info">
                  Showing <strong>{indexOfFirstItem + 1}</strong> to{" "}
                  <strong>{Math.min(indexOfLastItem, restaurants.length)}</strong> of{" "}
                  <strong>{restaurants.length}</strong> restaurants
                </div>

                <div className="pagination-controls">
                  <div className="rows-per-page">
                    <label htmlFor="itemsPerPage">Rows per page:</label>
                    <select
                      id="itemsPerPage"
                      value={itemsPerPage}
                      onChange={(e) => {
                        setItemsPerPage(Number(e.target.value));
                        setCurrentPage(1);
                      }}
                    >
                      <option value={5}>5</option>
                      <option value={10}>10</option>
                      <option value={20}>20</option>
                      <option value={50}>50</option>
                    </select>
                  </div>

                  <div className="pagination-buttons">
                    <button
                      type="button"
                      className="pagination-arrow-btn"
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                      title="Previous Page"
                      aria-label="Previous Page"
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="15 18 9 12 15 6"></polyline>
                      </svg>
                    </button>

                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                      <button
                        key={page}
                        type="button"
                        className={`pagination-number-btn ${currentPage === page ? "active" : ""}`}
                        onClick={() => setCurrentPage(page)}
                      >
                        {page}
                      </button>
                    ))}

                    <button
                      type="button"
                      className="pagination-arrow-btn"
                      disabled={currentPage === totalPages || totalPages === 0}
                      onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                      title="Next Page"
                      aria-label="Next Page"
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="9 18 15 12 9 6"></polyline>
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            )}

          </div>

        </section>

      </main>

    </div>
  );
}

export default SuperAdminRestaurants;
