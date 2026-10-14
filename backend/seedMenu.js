const mongoose = require("mongoose");
const dotenv = require("dotenv");
const Menu = require("./models/Menu");

dotenv.config();

const menuItems = [
  // ==================== STARTERS ====================

  {
    name: "Paneer Tikka",
    category: "Starters",
    price: 220,
    description: "Soft paneer cubes marinated with Indian spices and grilled.",
    type: "Veg",
    rating: 4.5,
    inStock: true,
    status: "Available",
    customization: [
      {
        name: "Spice Level",
        options: [
          { name: "Mild", price: 0 },
          { name: "Medium", price: 0 },
          { name: "Spicy", price: 0 },
        ],
      },
      {
        name: "Extra Paneer",
        options: [
          { name: "Regular", price: 0 },
          { name: "Extra Paneer", price: 60 },
        ],
      },
      {
        name: "Extra Butter",
        options: [
          { name: "No Butter", price: 0 },
          { name: "Extra Butter", price: 30 },
        ],
      },
    ],
  },

  {
    name: "Veg Manchurian",
    category: "Starters",
    price: 180,
    description: "Crispy vegetable balls tossed in spicy Manchurian sauce.",
    type: "Veg",
    rating: 4.3,
    inStock: true,
    status: "Available",
    customization: [
      {
        name: "Spice Level",
        options: [
          { name: "Mild", price: 0 },
          { name: "Medium", price: 0 },
          { name: "Spicy", price: 0 },
        ],
      },
      {
        name: "Sauce",
        options: [
          { name: "Regular", price: 0 },
          { name: "Extra Sauce", price: 20 },
        ],
      },
    ],
  },

  {
    name: "Chicken Tikka",
    category: "Starters",
    price: 280,
    description: "Juicy chicken pieces marinated in spices and grilled.",
    type: "Non-Veg",
    rating: 4.6,
    inStock: true,
    status: "Available",
    customization: [
      {
        name: "Spice Level",
        options: [
          { name: "Mild", price: 0 },
          { name: "Medium", price: 0 },
          { name: "Spicy", price: 0 },
        ],
      },
      {
        name: "Extra Chicken",
        options: [
          { name: "Regular", price: 0 },
          { name: "Extra Chicken", price: 80 },
        ],
      },
    ],
  },

  // ==================== MAIN COURSE ====================

  {
    name: "Paneer Butter Masala",
    category: "Main Course",
    price: 260,
    description: "Creamy tomato gravy with soft paneer pieces.",
    type: "Veg",
    rating: 4.7,
    inStock: true,
    status: "Available",
    customization: [
      {
        name: "Spice Level",
        options: [
          { name: "Mild", price: 0 },
          { name: "Medium", price: 0 },
          { name: "Spicy", price: 0 },
        ],
      },
      {
        name: "Extra Paneer",
        options: [
          { name: "Regular", price: 0 },
          { name: "Extra Paneer", price: 60 },
        ],
      },
      {
        name: "Extra Gravy",
        options: [
          { name: "Regular Gravy", price: 0 },
          { name: "Extra Gravy", price: 40 },
        ],
      },
      {
        name: "Butter",
        options: [
          { name: "Regular", price: 0 },
          { name: "Extra Butter", price: 30 },
        ],
      },
    ],
  },

  {
    name: "Kadai Paneer",
    category: "Main Course",
    price: 250,
    description: "Paneer cooked with capsicum, onion and kadai spices.",
    type: "Veg",
    rating: 4.6,
    inStock: true,
    status: "Available",
    customization: [
      {
        name: "Spice Level",
        options: [
          { name: "Mild", price: 0 },
          { name: "Medium", price: 0 },
          { name: "Spicy", price: 0 },
        ],
      },
      {
        name: "Extra Paneer",
        options: [
          { name: "Regular", price: 0 },
          { name: "Extra Paneer", price: 60 },
        ],
      },
      {
        name: "Extra Gravy",
        options: [
          { name: "Regular", price: 0 },
          { name: "Extra Gravy", price: 40 },
        ],
      },
    ],
  },

  {
    name: "Dal Makhani",
    category: "Main Course",
    price: 210,
    description: "Rich and creamy black lentils cooked with butter.",
    type: "Veg",
    rating: 4.5,
    inStock: true,
    status: "Available",
    customization: [
      {
        name: "Butter",
        options: [
          { name: "Regular", price: 0 },
          { name: "Extra Butter", price: 30 },
        ],
      },
      {
        name: "Cream",
        options: [
          { name: "Regular", price: 0 },
          { name: "Extra Cream", price: 30 },
        ],
      },
      {
        name: "Spice Level",
        options: [
          { name: "Mild", price: 0 },
          { name: "Medium", price: 0 },
          { name: "Spicy", price: 0 },
        ],
      },
    ],
  },

  {
    name: "Butter Chicken",
    category: "Main Course",
    price: 320,
    description: "Tender chicken cooked in creamy tomato butter gravy.",
    type: "Non-Veg",
    rating: 4.8,
    inStock: true,
    status: "Available",
    customization: [
      {
        name: "Spice Level",
        options: [
          { name: "Mild", price: 0 },
          { name: "Medium", price: 0 },
          { name: "Spicy", price: 0 },
        ],
      },
      {
        name: "Extra Chicken",
        options: [
          { name: "Regular", price: 0 },
          { name: "Extra Chicken", price: 90 },
        ],
      },
      {
        name: "Extra Gravy",
        options: [
          { name: "Regular", price: 0 },
          { name: "Extra Gravy", price: 40 },
        ],
      },
    ],
  },

  {
    name: "Chicken Curry",
    category: "Main Course",
    price: 290,
    description: "Traditional Indian chicken curry with aromatic spices.",
    type: "Non-Veg",
    rating: 4.5,
    inStock: true,
    status: "Available",
    customization: [
      {
        name: "Spice Level",
        options: [
          { name: "Mild", price: 0 },
          { name: "Medium", price: 0 },
          { name: "Spicy", price: 0 },
        ],
      },
      {
        name: "Extra Chicken",
        options: [
          { name: "Regular", price: 0 },
          { name: "Extra Chicken", price: 90 },
        ],
      },
      {
        name: "Extra Gravy",
        options: [
          { name: "Regular", price: 0 },
          { name: "Extra Gravy", price: 40 },
        ],
      },
    ],
  },

  // ==================== BIRYANI ====================

  {
    name: "Veg Biryani",
    category: "Biryani & Rice",
    price: 220,
    description: "Aromatic basmati rice cooked with vegetables and spices.",
    type: "Veg",
    rating: 4.4,
    inStock: true,
    status: "Available",
    customization: [
      {
        name: "Spice Level",
        options: [
          { name: "Mild", price: 0 },
          { name: "Medium", price: 0 },
          { name: "Spicy", price: 0 },
        ],
      },
      {
        name: "Extra Raita",
        options: [
          { name: "No Extra", price: 0 },
          { name: "Extra Raita", price: 30 },
        ],
      },
      {
        name: "Extra Rice",
        options: [
          { name: "Regular", price: 0 },
          { name: "Extra Rice", price: 50 },
        ],
      },
    ],
  },

  {
    name: "Chicken Biryani",
    category: "Biryani & Rice",
    price: 300,
    description: "Fragrant basmati rice layered with spicy chicken.",
    type: "Non-Veg",
    rating: 4.8,
    inStock: true,
    status: "Available",
    customization: [
      {
        name: "Spice Level",
        options: [
          { name: "Mild", price: 0 },
          { name: "Medium", price: 0 },
          { name: "Spicy", price: 0 },
        ],
      },
      {
        name: "Chicken Quantity",
        options: [
          { name: "Regular", price: 0 },
          { name: "Extra Chicken", price: 100 },
        ],
      },
      {
        name: "Raita",
        options: [
          { name: "Regular", price: 0 },
          { name: "Extra Raita", price: 30 },
        ],
      },
    ],
  },

  {
    name: "Mutton Biryani",
    category: "Biryani & Rice",
    price: 380,
    description: "Slow-cooked mutton with fragrant basmati rice.",
    type: "Non-Veg",
    rating: 4.7,
    inStock: true,
    status: "Available",
    customization: [
      {
        name: "Spice Level",
        options: [
          { name: "Mild", price: 0 },
          { name: "Medium", price: 0 },
          { name: "Spicy", price: 0 },
        ],
      },
      {
        name: "Extra Mutton",
        options: [
          { name: "Regular", price: 0 },
          { name: "Extra Mutton", price: 120 },
        ],
      },
      {
        name: "Extra Raita",
        options: [
          { name: "Regular", price: 0 },
          { name: "Extra Raita", price: 30 },
        ],
      },
    ],
  },

  // ==================== INDIAN BREADS ====================

  {
    name: "Butter Naan",
    category: "Indian Breads",
    price: 60,
    description: "Soft naan topped with butter.",
    type: "Veg",
    rating: 4.5,
    inStock: true,
    status: "Available",
    customization: [
      {
        name: "Butter",
        options: [
          { name: "Regular Butter", price: 0 },
          { name: "Extra Butter", price: 20 },
        ],
      },
      {
        name: "Garlic",
        options: [
          { name: "Plain", price: 0 },
          { name: "Add Garlic", price: 15 },
        ],
      },
    ],
  },

  {
    name: "Garlic Naan",
    category: "Indian Breads",
    price: 80,
    description: "Soft naan topped with garlic and butter.",
    type: "Veg",
    rating: 4.6,
    inStock: true,
    status: "Available",
    customization: [
      {
        name: "Garlic",
        options: [
          { name: "Regular Garlic", price: 0 },
          { name: "Extra Garlic", price: 20 },
        ],
      },
      {
        name: "Butter",
        options: [
          { name: "Regular", price: 0 },
          { name: "Extra Butter", price: 20 },
        ],
      },
    ],
  },

  // ==================== PIZZA ====================

  {
    name: "Margherita Pizza",
    category: "Pizza",
    price: 199,
    description: "Classic pizza with tomato sauce and mozzarella cheese.",
    type: "Veg",
    rating: 4.5,
    inStock: true,
    status: "Available",
    customization: [
      {
        name: "Size",
        options: [
          { name: "Regular", price: 0 },
          { name: "Medium", price: 70 },
          { name: "Large", price: 140 },
        ],
      },
      {
        name: "Crust",
        options: [
          { name: "Regular Crust", price: 0 },
          { name: "Thin Crust", price: 30 },
          { name: "Cheese Burst", price: 70 },
        ],
      },
      {
        name: "Extra Cheese",
        options: [
          { name: "No Extra Cheese", price: 0 },
          { name: "Extra Cheese", price: 50 },
        ],
      },
      {
        name: "Toppings",
        options: [
          { name: "No Extra Topping", price: 0 },
          { name: "Olives", price: 30 },
          { name: "Capsicum", price: 30 },
          { name: "Mushroom", price: 40 },
        ],
      },
    ],
  },

  {
    name: "Farmhouse Pizza",
    category: "Pizza",
    price: 249,
    description: "Loaded with onion, capsicum, tomato and mushroom.",
    type: "Veg",
    rating: 4.7,
    inStock: true,
    status: "Available",
    customization: [
      {
        name: "Size",
        options: [
          { name: "Regular", price: 0 },
          { name: "Medium", price: 80 },
          { name: "Large", price: 150 },
        ],
      },
      {
        name: "Crust",
        options: [
          { name: "Regular Crust", price: 0 },
          { name: "Thin Crust", price: 30 },
          { name: "Cheese Burst", price: 70 },
        ],
      },
      {
        name: "Extra Cheese",
        options: [
          { name: "No Extra Cheese", price: 0 },
          { name: "Extra Cheese", price: 50 },
        ],
      },
      {
        name: "Extra Topping",
        options: [
          { name: "No Extra", price: 0 },
          { name: "Olives", price: 30 },
          { name: "Jalapeno", price: 30 },
          { name: "Mushroom", price: 40 },
        ],
      },
    ],
  },

  {
    name: "Chicken Tikka Pizza",
    category: "Pizza",
    price: 299,
    description: "Pizza topped with spicy chicken tikka and cheese.",
    type: "Non-Veg",
    rating: 4.8,
    inStock: true,
    status: "Available",
    customization: [
      {
        name: "Size",
        options: [
          { name: "Regular", price: 0 },
          { name: "Medium", price: 90 },
          { name: "Large", price: 170 },
        ],
      },
      {
        name: "Crust",
        options: [
          { name: "Regular Crust", price: 0 },
          { name: "Thin Crust", price: 30 },
          { name: "Cheese Burst", price: 70 },
        ],
      },
      {
        name: "Extra Chicken",
        options: [
          { name: "Regular", price: 0 },
          { name: "Extra Chicken", price: 80 },
        ],
      },
      {
        name: "Extra Cheese",
        options: [
          { name: "No Extra Cheese", price: 0 },
          { name: "Extra Cheese", price: 50 },
        ],
      },
    ],
  },

  // ==================== BURGERS ====================

  {
    name: "Veg Burger",
    category: "Burgers",
    price: 149,
    description: "Crispy veg patty with fresh vegetables and sauces.",
    type: "Veg",
    rating: 4.3,
    inStock: true,
    status: "Available",
    customization: [
      {
        name: "Cheese",
        options: [
          { name: "No Cheese", price: 0 },
          { name: "Cheese Slice", price: 30 },
        ],
      },
      {
        name: "Patty",
        options: [
          { name: "Regular Patty", price: 0 },
          { name: "Extra Patty", price: 60 },
        ],
      },
      {
        name: "Sauce",
        options: [
          { name: "Regular Sauce", price: 0 },
          { name: "Extra Mayo", price: 20 },
          { name: "Extra Spicy Sauce", price: 20 },
        ],
      },
    ],
  },

  {
    name: "Chicken Burger",
    category: "Burgers",
    price: 199,
    description: "Crispy chicken patty with cheese and special sauce.",
    type: "Non-Veg",
    rating: 4.6,
    inStock: true,
    status: "Available",
    customization: [
      {
        name: "Cheese",
        options: [
          { name: "No Cheese", price: 0 },
          { name: "Cheese Slice", price: 30 },
        ],
      },
      {
        name: "Patty",
        options: [
          { name: "Regular Chicken Patty", price: 0 },
          { name: "Extra Chicken Patty", price: 80 },
        ],
      },
      {
        name: "Sauce",
        options: [
          { name: "Regular Sauce", price: 0 },
          { name: "Extra Mayo", price: 20 },
          { name: "Extra Spicy Sauce", price: 20 },
        ],
      },
    ],
  },

  // ==================== CHINESE ====================

  {
    name: "Veg Hakka Noodles",
    category: "Chinese",
    price: 180,
    description: "Stir-fried noodles with fresh vegetables.",
    type: "Veg",
    rating: 4.4,
    inStock: true,
    status: "Available",
    customization: [
      {
        name: "Spice Level",
        options: [
          { name: "Mild", price: 0 },
          { name: "Medium", price: 0 },
          { name: "Spicy", price: 0 },
        ],
      },
      {
        name: "Extra Vegetables",
        options: [
          { name: "Regular", price: 0 },
          { name: "Extra Vegetables", price: 40 },
        ],
      },
      {
        name: "Sauce",
        options: [
          { name: "Regular", price: 0 },
          { name: "Extra Sauce", price: 20 },
        ],
      },
    ],
  },

  {
    name: "Chicken Hakka Noodles",
    category: "Chinese",
    price: 230,
    description: "Stir-fried noodles with chicken and vegetables.",
    type: "Non-Veg",
    rating: 4.5,
    inStock: true,
    status: "Available",
    customization: [
      {
        name: "Spice Level",
        options: [
          { name: "Mild", price: 0 },
          { name: "Medium", price: 0 },
          { name: "Spicy", price: 0 },
        ],
      },
      {
        name: "Extra Chicken",
        options: [
          { name: "Regular", price: 0 },
          { name: "Extra Chicken", price: 70 },
        ],
      },
      {
        name: "Extra Sauce",
        options: [
          { name: "Regular", price: 0 },
          { name: "Extra Sauce", price: 20 },
        ],
      },
    ],
  },

  {
    name: "Veg Fried Rice",
    category: "Chinese",
    price: 170,
    description: "Fried rice cooked with vegetables and Chinese sauces.",
    type: "Veg",
    rating: 4.3,
    inStock: true,
    status: "Available",
    customization: [
      {
        name: "Spice Level",
        options: [
          { name: "Mild", price: 0 },
          { name: "Medium", price: 0 },
          { name: "Spicy", price: 0 },
        ],
      },
      {
        name: "Extra Vegetables",
        options: [
          { name: "Regular", price: 0 },
          { name: "Extra Vegetables", price: 40 },
        ],
      },
    ],
  },

  // ==================== SNACKS ====================

  {
    name: "French Fries",
    category: "Snacks",
    price: 120,
    description: "Crispy golden french fries.",
    type: "Veg",
    rating: 4.4,
    inStock: true,
    status: "Available",
    customization: [
      {
        name: "Size",
        options: [
          { name: "Regular", price: 0 },
          { name: "Large", price: 50 },
        ],
      },
      {
        name: "Seasoning",
        options: [
          { name: "Salted", price: 0 },
          { name: "Peri Peri", price: 20 },
          { name: "Cheese Seasoning", price: 30 },
        ],
      },
      {
        name: "Dip",
        options: [
          { name: "No Dip", price: 0 },
          { name: "Mayo Dip", price: 20 },
          { name: "Cheese Dip", price: 30 },
        ],
      },
    ],
  },

  {
    name: "Cheese Garlic Bread",
    category: "Snacks",
    price: 160,
    description: "Garlic bread loaded with melted cheese.",
    type: "Veg",
    rating: 4.6,
    inStock: true,
    status: "Available",
    customization: [
      {
        name: "Cheese",
        options: [
          { name: "Regular Cheese", price: 0 },
          { name: "Extra Cheese", price: 40 },
        ],
      },
      {
        name: "Garlic",
        options: [
          { name: "Regular Garlic", price: 0 },
          { name: "Extra Garlic", price: 20 },
        ],
      },
    ],
  },

  // ==================== BEVERAGES ====================

  {
    name: "Cold Coffee",
    category: "Beverages",
    price: 130,
    description: "Chilled creamy coffee.",
    type: "Veg",
    rating: 4.5,
    inStock: true,
    status: "Available",
    customization: [
      {
        name: "Size",
        options: [
          { name: "Regular", price: 0 },
          { name: "Large", price: 40 },
        ],
      },
      {
        name: "Sugar",
        options: [
          { name: "Normal", price: 0 },
          { name: "Less Sugar", price: 0 },
          { name: "Extra Sugar", price: 0 },
        ],
      },
      {
        name: "Topping",
        options: [
          { name: "No Topping", price: 0 },
          { name: "Chocolate", price: 30 },
          { name: "Whipped Cream", price: 40 },
        ],
      },
    ],
  },

  {
    name: "Fresh Lime Soda",
    category: "Beverages",
    price: 90,
    description: "Refreshing lime soda.",
    type: "Veg",
    rating: 4.3,
    inStock: true,
    status: "Available",
    customization: [
      {
        name: "Type",
        options: [
          { name: "Sweet", price: 0 },
          { name: "Salted", price: 0 },
          { name: "Sweet & Salted", price: 0 },
        ],
      },
      {
        name: "Size",
        options: [
          { name: "Regular", price: 0 },
          { name: "Large", price: 30 },
        ],
      },
    ],
  },

  // ==================== DESSERTS ====================

  {
    name: "Gulab Jamun",
    category: "Desserts",
    price: 100,
    description: "Soft warm gulab jamuns served with sugar syrup.",
    type: "Veg",
    rating: 4.7,
    inStock: true,
    status: "Available",
    customization: [
      {
        name: "Quantity",
        options: [
          { name: "2 Pieces", price: 0 },
          { name: "4 Pieces", price: 70 },
          { name: "6 Pieces", price: 120 },
        ],
      },
      {
        name: "Ice Cream",
        options: [
          { name: "No Ice Cream", price: 0 },
          { name: "Vanilla Ice Cream", price: 50 },
        ],
      },
    ],
  },

  {
    name: "Chocolate Brownie",
    category: "Desserts",
    price: 150,
    description: "Rich chocolate brownie.",
    type: "Veg",
    rating: 4.6,
    inStock: true,
    status: "Available",
    customization: [
      {
        name: "Ice Cream",
        options: [
          { name: "No Ice Cream", price: 0 },
          { name: "Vanilla Ice Cream", price: 50 },
          { name: "Chocolate Ice Cream", price: 60 },
        ],
      },
      {
        name: "Chocolate Sauce",
        options: [
          { name: "No Sauce", price: 0 },
          { name: "Extra Chocolate Sauce", price: 30 },
        ],
      },
    ],
  },

  // ==================== COMBO ====================

  {
    name: "Paneer Meal Combo",
    category: "Combo",
    price: 399,
    description: "Paneer curry, 2 naan, rice and soft drink.",
    type: "Veg",
    rating: 4.7,
    inStock: true,
    status: "Available",
    customization: [
      {
        name: "Paneer Curry",
        options: [
          { name: "Paneer Butter Masala", price: 0 },
          { name: "Kadai Paneer", price: 0 },
        ],
      },
      {
        name: "Spice Level",
        options: [
          { name: "Mild", price: 0 },
          { name: "Medium", price: 0 },
          { name: "Spicy", price: 0 },
        ],
      },
      {
        name: "Bread",
        options: [
          { name: "Butter Naan", price: 0 },
          { name: "Garlic Naan", price: 20 },
        ],
      },
      {
        name: "Drink",
        options: [
          { name: "Soft Drink", price: 0 },
          { name: "Fresh Lime Soda", price: 30 },
        ],
      },
    ],
  },

  {
    name: "Chicken Biryani Combo",
    category: "Combo",
    price: 449,
    description: "Chicken biryani with raita, kebab and soft drink.",
    type: "Non-Veg",
    rating: 4.8,
    inStock: true,
    status: "Available",
    customization: [
      {
        name: "Spice Level",
        options: [
          { name: "Mild", price: 0 },
          { name: "Medium", price: 0 },
          { name: "Spicy", price: 0 },
        ],
      },
      {
        name: "Chicken",
        options: [
          { name: "Regular", price: 0 },
          { name: "Extra Chicken", price: 100 },
        ],
      },
      {
        name: "Drink",
        options: [
          { name: "Soft Drink", price: 0 },
          { name: "Fresh Lime Soda", price: 30 },
        ],
      },
    ],
  },
];

const seedDatabase = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    console.log("MongoDB connected");

    await Menu.deleteMany();

    await Menu.insertMany(menuItems);

    console.log(`${menuItems.length} menu items inserted successfully`);

    await mongoose.connection.close();

    console.log("Database connection closed");
  } catch (error) {
    console.error("Seed failed:", error.message);
    process.exit(1);
  }
};

if (require.main === module) {
  seedDatabase();
}

module.exports = menuItems;
