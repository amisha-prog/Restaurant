import { useEffect, useState } from "react";
import { CartContext } from "./CartContext";

export { CartContext } from "./CartContext";

const CART_KEY = "customerCart";

const getSavedCart = () => {
  try {
    const savedCart = JSON.parse(localStorage.getItem(CART_KEY) || "[]");
    return Array.isArray(savedCart) ? savedCart : [];
  } catch {
    return [];
  }
};

export function CartProvider({ children }) {
  const [cartItems, setCartItems] = useState(getSavedCart);

  useEffect(() => {
    localStorage.setItem(CART_KEY, JSON.stringify(cartItems));
  }, [cartItems]);

  const addToCart = (item) => {
    setCartItems((previousItems) => {
      const itemKey = item.cartKey || item._id;
      const existingItem = previousItems.find(
        (cartItem) => (cartItem.cartKey || cartItem._id) === itemKey
      );

      if (existingItem) {
        return previousItems.map((cartItem) =>
          (cartItem.cartKey || cartItem._id) === itemKey
            ? {
                ...cartItem,
                quantity: cartItem.quantity + 1,
              }
            : cartItem
        );
      }

      return [
        ...previousItems,
        {
          ...item,
          quantity: 1,
        },
      ];
    });
  };

  const removeFromCart = (itemId) => {
    setCartItems((previousItems) =>
      previousItems.filter((item) => (item.cartKey || item._id) !== itemId)
    );
  };

  const updateQuantity = (itemId, quantity) => {
    if (quantity <= 0) {
      removeFromCart(itemId);
      return;
    }

    setCartItems((previousItems) =>
      previousItems.map((item) =>
        (item.cartKey || item._id) === itemId
          ? { ...item, quantity }
          : item
      )
    );
  };

  const clearCart = () => {
    setCartItems([]);
  };

  return (
    <CartContext.Provider
      value={{
        cartItems,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}
