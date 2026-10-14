import { API_URL } from "../config/api";

// ===============================
// Get Menu Items
// ===============================
export const getMenuItems = async () => {
  const response = await fetch(`${API_URL}/menu`);

  if (!response.ok) {
    throw new Error("Failed to fetch menu");
  }

  return response.json();
};

// ===============================
// Add Menu Item
// ===============================
export const addMenuItem = async (menuData) => {
  const response = await fetch(`${API_URL}/menu`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(menuData),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to add menu item");
  }

  return data;
};

// ===============================
// Add Restaurant
// ===============================
export const addRestaurant = async (restaurantData) => {
  const response = await fetch(`${API_URL}/restaurants/add`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(restaurantData),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to create restaurant");
  }

  return data;
};

// ===============================
// Get Restaurants
// ===============================
export const getRestaurants = async () => {
  const response = await fetch(`${API_URL}/restaurants`);

  if (!response.ok) {
    throw new Error("Failed to fetch restaurants");
  }

  return response.json();
};
