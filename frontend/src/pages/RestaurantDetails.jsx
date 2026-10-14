import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { API_URL } from "../config/api";

function RestaurantDetails() {
  const navigate = useNavigate();
  const { id } = useParams();

  const [restaurant, setRestaurant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // =====================================
  // Fetch Restaurant Details
  // =====================================

  useEffect(() => {
    const fetchRestaurant = async () => {
      try {
        setLoading(true);
        setError("");

        // Existing working API
        const response = await fetch(
          `${API_URL}/restaurants`
        );

        if (!response.ok) {
          throw new Error("Failed to fetch restaurants");
        }

        const data = await response.json();

        // The API returns { restaurants: [...] }.
        const restaurants = Array.isArray(data)
          ? data
          : data.restaurants || [];

        // Find selected restaurant
        const selectedRestaurant = restaurants.find(
          (item) => item._id === id
        );

        if (!selectedRestaurant) {
          throw new Error("Restaurant not found");
        }

        setRestaurant(selectedRestaurant);

      } catch (error) {
        console.error("Restaurant Details Error:", error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchRestaurant();
  }, [id]);

  // =====================================
  // Loading
  // =====================================

  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#f5f7fb",
        }}
      >
        <h2>Loading restaurant details...</h2>
      </div>
    );
  }

  // =====================================
  // Error
  // =====================================

  if (error) {
    return (
      <div
        style={{
          minHeight: "100vh",
          padding: "40px",
          background: "#f5f7fb",
        }}
      >
        <div
          style={{
            maxWidth: "1100px",
            margin: "0 auto",
            background: "#fff",
            padding: "30px",
            borderRadius: "12px",
          }}
        >
          <h2>Unable to load restaurant</h2>

          <p>{error}</p>

          <button
            onClick={() =>
              navigate("/superadmin/dashboard")
            }
            style={{
              padding: "10px 18px",
              background: "#174ea6",
              color: "#fff",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
            }}
          >
            ← Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // =====================================
  // Restaurant Not Found
  // =====================================

  if (!restaurant) {
    return (
      <div
        style={{
          minHeight: "100vh",
          padding: "40px",
          background: "#f5f7fb",
        }}
      >
        <h2>Restaurant not found</h2>

        <button
          onClick={() =>
            navigate("/superadmin/dashboard")
          }
        >
          Back to Dashboard
        </button>
      </div>
    );
  }

  // =====================================
  // Restaurant Details
  // =====================================

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f5f7fb",
        padding: "40px",
      }}
    >
      <div
        style={{
          maxWidth: "1100px",
          margin: "0 auto",
        }}
      >

        {/* Top Action Buttons */}

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "20px",
          }}
        >
          <button
            onClick={() =>
              navigate("/superadmin/restaurants")
            }
            style={{
              border: "none",
              background: "transparent",
              color: "#174ea6",
              fontSize: "16px",
              cursor: "pointer",
              padding: 0,
            }}
          >
            ← Back to Restaurants
          </button>

        </div>




        {/* =================================
            Restaurant Header
        ================================= */}

        <div
          style={{
            background: "#fff",
            borderRadius: "12px",
            padding: "30px",
            marginBottom: "20px",
            boxShadow:
              "0 2px 10px rgba(0,0,0,0.08)",
          }}
        >

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "20px",
            }}
          >

            {/* Avatar */}

            <div
              style={{
                width: "75px",
                height: "75px",
                borderRadius: "12px",
                background: "#e8eefc",
                color: "#174ea6",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "32px",
                fontWeight: "700",
              }}
            >
              {restaurant.restaurantName
                ?.charAt(0)
                .toUpperCase()}
            </div>


            {/* Name */}

            <div>

              <h1
                style={{
                  margin: "0 0 8px",
                  fontSize: "30px",
                  color: "#111827",
                }}
              >
                {restaurant.restaurantName}
              </h1>

              <p
                style={{
                  margin: 0,
                  color: "#6b7280",
                }}
              >
                Restaurant ID:{" "}
                {restaurant.restaurantId || "N/A"}
              </p>

            </div>

          </div>

        </div>


        {/* =================================
            Details Card
        ================================= */}

        <div
          style={{
            background: "#fff",
            borderRadius: "12px",
            padding: "30px",
            boxShadow:
              "0 2px 10px rgba(0,0,0,0.08)",
          }}
        >

          <h2
            style={{
              marginTop: 0,
              marginBottom: "25px",
              color: "#111827",
            }}
          >
            Restaurant Details
          </h2>


          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit, minmax(300px, 1fr))",
              gap: "20px",
            }}
          >

            {Object.entries(restaurant).map(
              ([key, value]) => {

                // MongoDB internal fields hide
                if (
                  key === "_id" ||
                  key === "__v"
                ) {
                  return null;
                }

                let displayValue = value;

                // Object / Array ko readable banaye
                if (
                  typeof value === "object" &&
                  value !== null
                ) {
                  displayValue = JSON.stringify(
                    value,
                    null,
                    2
                  );
                }

                // Date fields ko India time (IST) mein format karo
                if (
                  (key === "createdAt" || key === "updatedAt") &&
                  value
                ) {
                  displayValue = new Date(value).toLocaleString("en-IN", {
                    timeZone: "Asia/Kolkata",
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit",
                    hour12: true,
                  });
                }

                // Field name formatting
                const formattedKey = key
                  .replace(/([A-Z])/g, " $1")
                  .replace(/^./, (str) =>
                    str.toUpperCase()
                  );

                return (
                  <div
                    key={key}
                    style={{
                      padding: "18px",
                      border:
                        "1px solid #e5e7eb",
                      borderRadius: "8px",
                      background: "#fafafa",
                    }}
                  >

                    <div
                      style={{
                        color: "#6b7280",
                        fontSize: "13px",
                        marginBottom: "7px",
                        textTransform:
                          "uppercase",
                        fontWeight: "600",
                      }}
                    >
                      {formattedKey}
                    </div>

                    <div
                      style={{
                        color: "#111827",
                        fontSize: "16px",
                        fontWeight: "500",
                        whiteSpace: "pre-wrap",
                        wordBreak: "break-word",
                      }}
                    >
                      {displayValue !==
                        undefined &&
                      displayValue !== null &&
                      displayValue !== ""
                        ? String(displayValue)
                        : "N/A"}
                    </div>

                  </div>
                );
              }
            )}

          </div>

        </div>

      </div>
    </div>
  );
}

export default RestaurantDetails;
