const mongoose = require("mongoose");
const dotenv = require("dotenv");
const Menu = require("./models/Menu");

dotenv.config();

const startersList = [
  // 🍗 Chicken Starters
  {
    name: "Chicken Tikka",
    category: "Starters",
    type: "Non-Veg",
    price: 280,
    description: "Juicy chicken chunks marinated in yogurt and tandoori spices, grilled to perfection.",
    rating: 4.8,
    inStock: true,
    status: "Available",
  },
  {
    name: "Chicken Malai Tikka",
    category: "Starters",
    type: "Non-Veg",
    price: 310,
    description: "Succulent boneless chicken marinated in cream, cheese, and mild aromatic spices.",
    rating: 4.9,
    inStock: true,
    status: "Available",
  },
  {
    name: "Chicken Seekh Kebab",
    category: "Starters",
    type: "Non-Veg",
    price: 290,
    description: "Minced chicken seasoned with fresh herbs and spices, skewered and grilled.",
    rating: 4.7,
    inStock: true,
    status: "Available",
  },
  {
    name: "Chicken Tangdi Kebab",
    category: "Starters",
    type: "Non-Veg",
    price: 320,
    description: "Chicken drumsticks marinated in rich tandoori marinade and roasted in clay oven.",
    rating: 4.8,
    inStock: true,
    status: "Available",
  },
  {
    name: "Chicken Reshmi Kebab",
    category: "Starters",
    type: "Non-Veg",
    price: 300,
    description: "Silky soft chicken kebab infused with cashew paste, cardamom, and cream.",
    rating: 4.7,
    inStock: true,
    status: "Available",
  },
  {
    name: "Chicken Afghani",
    category: "Starters",
    type: "Non-Veg",
    price: 330,
    description: "Rich and smoky chicken pieces coated in cashew-cream sauce with mild spices.",
    rating: 4.8,
    inStock: true,
    status: "Available",
  },
  {
    name: "Chicken 65",
    category: "Starters",
    type: "Non-Veg",
    price: 270,
    description: "Crispy, spicy South-Indian style deep fried chicken tempered with curry leaves.",
    rating: 4.8,
    inStock: true,
    status: "Available",
  },
  {
    name: "Chicken Lollipop",
    category: "Starters",
    type: "Non-Veg",
    price: 280,
    description: "Crispy fried chicken wings shaped into lollipops served with Schezwan sauce.",
    rating: 4.7,
    inStock: true,
    status: "Available",
  },
  {
    name: "Crispy Chicken",
    category: "Starters",
    type: "Non-Veg",
    price: 290,
    description: "Golden battered crispy fried chicken strips tossed with mild seasonings.",
    rating: 4.6,
    inStock: true,
    status: "Available",
  },
  {
    name: "Chicken Pakora",
    category: "Starters",
    type: "Non-Veg",
    price: 240,
    description: "Tender chicken pieces coated in spiced gram flour batter and deep fried.",
    rating: 4.5,
    inStock: true,
    status: "Available",
  },
  {
    name: "Chicken Wings",
    category: "Starters",
    type: "Non-Veg",
    price: 260,
    description: "Tender chicken wings glazed in spicy peri-peri barbecue sauce.",
    rating: 4.6,
    inStock: true,
    status: "Available",
  },
  {
    name: "Chicken Chilli",
    category: "Starters",
    type: "Non-Veg",
    price: 290,
    description: "Indo-Chinese style crispy chicken tossed with capsicum, onion, and green chillies.",
    rating: 4.7,
    inStock: true,
    status: "Available",
  },
  {
    name: "Tandoori Chicken",
    category: "Starters",
    type: "Non-Veg",
    price: 340,
    description: "Whole chicken marinated in traditional tandoori masala and charred in clay tandoor.",
    rating: 4.9,
    inStock: true,
    status: "Available",
  },
  {
    name: "Chicken Shashlik",
    category: "Starters",
    type: "Non-Veg",
    price: 310,
    description: "Grilled chicken cubes skewered with bell peppers, tomatoes, and onions.",
    rating: 4.6,
    inStock: true,
    status: "Available",
  },

  // 🥩 Mutton Starters
  {
    name: "Mutton Seekh Kebab",
    category: "Starters",
    type: "Non-Veg",
    price: 360,
    description: "Flavorful minced mutton skewers blended with authentic aromatic royal spices.",
    rating: 4.9,
    inStock: true,
    status: "Available",
  },
  {
    name: "Mutton Shami Kebab",
    category: "Starters",
    type: "Non-Veg",
    price: 380,
    description: "Melt-in-mouth pan-fried patties made with minced mutton and chana dal.",
    rating: 4.8,
    inStock: true,
    status: "Available",
  },
  {
    name: "Mutton Galouti Kebab",
    category: "Starters",
    type: "Non-Veg",
    price: 410,
    description: "Lucknowi specialty ultra-tender mutton kebabs infused with saffron and spices.",
    rating: 4.9,
    inStock: true,
    status: "Available",
  },
  {
    name: "Mutton Tikka",
    category: "Starters",
    type: "Non-Veg",
    price: 390,
    description: "Tender boneless mutton pieces marinated in rich curd masala and roasted.",
    rating: 4.7,
    inStock: true,
    status: "Available",
  },
  {
    name: "Mutton Chops",
    category: "Starters",
    type: "Non-Veg",
    price: 420,
    description: "Juicy mutton ribs marinated in spiced yogurt and slow-grilled to perfection.",
    rating: 4.8,
    inStock: true,
    status: "Available",
  },
  {
    name: "Mutton Fry",
    category: "Starters",
    type: "Non-Veg",
    price: 370,
    description: "Spicy dry-roasted mutton cooked with caramelized onions and South Indian spices.",
    rating: 4.8,
    inStock: true,
    status: "Available",
  },
  {
    name: "Mutton Boti Kebab",
    category: "Starters",
    type: "Non-Veg",
    price: 390,
    description: "Succulent mutton cubes roasted on skewers with rich garlic and herb glaze.",
    rating: 4.7,
    inStock: true,
    status: "Available",
  },

  // 🐟 Fish Starters
  {
    name: "Fish Tikka",
    category: "Starters",
    type: "Non-Veg",
    price: 340,
    description: "Boneless river fish cubes marinated in ajwain, curd, and tandoori spices.",
    rating: 4.8,
    inStock: true,
    status: "Available",
  },
  {
    name: "Fish Amritsari",
    category: "Starters",
    type: "Non-Veg",
    price: 330,
    description: "Crispy Punjabi batter-fried fish fillets coated with carom seeds and gram flour.",
    rating: 4.8,
    inStock: true,
    status: "Available",
  },
  {
    name: "Fish Fry",
    category: "Starters",
    type: "Non-Veg",
    price: 310,
    description: "Crispy pan-fried fish fillets coated with fiery coastal Indian masala.",
    rating: 4.6,
    inStock: true,
    status: "Available",
  },
  {
    name: "Crispy Fish",
    category: "Starters",
    type: "Non-Veg",
    price: 320,
    description: "Golden crumb-fried fish fillets served with tartar sauce and lemon wedges.",
    rating: 4.7,
    inStock: true,
    status: "Available",
  },
  {
    name: "Chilli Fish",
    category: "Starters",
    type: "Non-Veg",
    price: 330,
    description: "Crisp fish cubes tossed with scallions, capsicum, and spicy soya sauce.",
    rating: 4.7,
    inStock: true,
    status: "Available",
  },
  {
    name: "Fish Fingers",
    category: "Starters",
    type: "Non-Veg",
    price: 290,
    description: "Crumbed fish strips fried until golden and crisp, served with dip.",
    rating: 4.6,
    inStock: true,
    status: "Available",
  },
  {
    name: "Tandoori Fish",
    category: "Starters",
    type: "Non-Veg",
    price: 360,
    description: "Whole pomfret or fish fillets infused with smoky tandoori marinade.",
    rating: 4.8,
    inStock: true,
    status: "Available",
  },

  // 🦐 Prawn Starters
  {
    name: "Prawn Fry",
    category: "Starters",
    type: "Non-Veg",
    price: 390,
    description: "Fresh prawns shallow fried with shallots, curry leaves, and coastal masala.",
    rating: 4.8,
    inStock: true,
    status: "Available",
  },
  {
    name: "Crispy Prawns",
    category: "Starters",
    type: "Non-Veg",
    price: 410,
    description: "Golden batter-fried crunchy prawns seasoned with sea salt and herbs.",
    rating: 4.9,
    inStock: true,
    status: "Available",
  },
  {
    name: "Chilli Prawns",
    category: "Starters",
    type: "Non-Veg",
    price: 420,
    description: "Juicy prawns wok-tossed in spicy chilli garlic sauce with bell peppers.",
    rating: 4.8,
    inStock: true,
    status: "Available",
  },
  {
    name: "Tandoori Prawns",
    category: "Starters",
    type: "Non-Veg",
    price: 440,
    description: "Jumbo prawns marinated in mustard oil, ajwain, and hung curd, tandoor grilled.",
    rating: 4.9,
    inStock: true,
    status: "Available",
  },
  {
    name: "Garlic Prawns",
    category: "Starters",
    type: "Non-Veg",
    price: 410,
    description: "Succulent prawns pan-seared with burnt garlic, butter, and crushed pepper.",
    rating: 4.8,
    inStock: true,
    status: "Available",
  },
  {
    name: "Prawn 65",
    category: "Starters",
    type: "Non-Veg",
    price: 390,
    description: "Crispy fried prawns tempered with red chillies, curry leaves, and ginger-garlic.",
    rating: 4.8,
    inStock: true,
    status: "Available",
  },
];

const defaultCustomization = [
  {
    name: "Spice Level",
    options: [
      { name: "Mild", price: 0 },
      { name: "Medium", price: 0 },
      { name: "Spicy", price: 0 },
    ],
  },
  {
    name: "Dip / Chutney",
    options: [
      { name: "Mint Chutney", price: 0 },
      { name: "Garlic Dip", price: 20 },
    ],
  },
];

async function seedStarters() {
  try {
    console.log("Connecting to database...");
    await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 5000 });
    console.log("Connected.");

    let insertedCount = 0;
    let updatedCount = 0;

    for (const starter of startersList) {
      const itemData = {
        ...starter,
        customization: defaultCustomization,
      };

      const res = await Menu.updateOne(
        { name: starter.name },
        { $set: itemData },
        { upsert: true }
      );

      if (res.upsertedCount > 0) {
        insertedCount++;
      } else {
        updatedCount++;
      }
    }

    console.log(`Successfully processed ${startersList.length} Non-Veg Starters!`);
    console.log(`Inserted: ${insertedCount}, Updated: ${updatedCount}`);

    // Verification
    const totalStarters = await Menu.countDocuments({ category: "Starters" });
    const nonVegStarters = await Menu.countDocuments({ category: "Starters", type: "Non-Veg" });
    const vegStarters = await Menu.countDocuments({ category: "Starters", type: "Veg" });

    console.log(`Total Starters: ${totalStarters}`);
    console.log(`Non-Veg Starters: ${nonVegStarters}`);
    console.log(`Veg Starters: ${vegStarters}`);

    await mongoose.disconnect();
    console.log("Disconnected successfully.");
  } catch (error) {
    console.error("Error seeding starters:", error);
    process.exit(1);
  }
}

seedStarters();
