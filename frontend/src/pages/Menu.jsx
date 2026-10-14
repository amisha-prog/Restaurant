import { useEffect, useState } from "react";
import { getMenuItems } from "../services/api";

function Menu() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchItems = async () => {
      try {
        const data = await getMenuItems();
        setItems(data);
      } catch (err) {
        console.error(err);
        setError("Menu items load nahi ho paaye.");
      } finally {
        setLoading(false);
      }
    };

    fetchItems();
  }, []);

  if (loading) {
    return (
      <div>
        <h2>Loading menu...</h2>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <h2>{error}</h2>
      </div>
    );
  }

  return (
    <div>
      <h1>Our Menu 🍽️</h1>

      {items.length === 0 ? (
        <p>No menu items found.</p>
      ) : (
        items.map((item) => (
          <div key={item._id}>
            <h2>{item.name}</h2>

            <p>{item.category}</p>

            <p>{item.description}</p>

            <h3>₹{item.price}</h3>

            <button>Add to Cart</button>

            <hr />
          </div>
        ))
      )}
    </div>
  );
}

export default Menu;