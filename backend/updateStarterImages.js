const mongoose = require("mongoose");
const dotenv = require("dotenv");
const Menu = require("./models/Menu");

dotenv.config();

const itemImages = {
  // 🍗 Chicken Starters
  "Chicken Tikka": "/images/chicken_tikka.jpg",
  "Chicken Malai Tikka": "/images/chicken_malai_tikka.jpg",
  "Chicken Seekh Kebab": "/images/chicken_seekh_kebab.jpg",
  "Chicken Tangdi Kebab": "/images/chicken_tangdi_kebab.jpg",
  "Chicken Reshmi Kebab": "/images/chicken_reshmi_kebab.jpg",
  "Chicken Afghani": "/images/chicken_afghani.jpg",
  "Chicken 65": "/images/chicken_65.jpg",
  "Chicken Lollipop": "/images/chicken_lollipop.jpg",
  "Crispy Chicken": "/images/crispy_chicken.jpg",
  "Chicken Pakora": "/images/chicken_pakora.jpg",
  "Chicken Wings": "/images/chicken_wings.jpg",
  "Chicken Chilli": "/images/chicken_chilli.jpg",
  "Tandoori Chicken": "/images/tandoori_chicken.jpg",
  "Chicken Shashlik": "/images/chicken_shashlik.jpg",

  // 🥩 Mutton Starters
  "Mutton Seekh Kebab": "/images/mutton_seekh_kebab.jpg",
  "Mutton Shami Kebab": "/images/mutton_shami_kebab.jpg",
  "Mutton Galouti Kebab": "/images/mutton_galouti_kebab.jpg",
  "Mutton Tikka": "/images/mutton_tikka.jpg",
  "Mutton Chops": "/images/mutton_chops.jpg",
  "Mutton Fry": "/images/mutton_fry.jpg",
  "Mutton Boti Kebab": "/images/mutton_boti_kebab.jpg",

  // 🐟 Fish Starters
  "Fish Tikka": "/images/fish_tikka.jpg",
  "Fish Amritsari": "/images/fish_amritsari.jpg",
  "Fish Fry": "/images/fish_fry.jpg",
  "Crispy Fish": "/images/crispy_fish.jpg",
  "Chilli Fish": "/images/chilli_fish.jpg",
  "Fish Fingers": "/images/fish_fingers.jpg",
  "Tandoori Fish": "/images/tandoori_fish.jpg",

  // 🦐 Prawn Starters
  "Prawn Fry": "/images/prawn_fry.jpg",
  "Crispy Prawns": "/images/crispy_prawns.jpg",
  "Chilli Prawns": "/images/chilli_prawns.jpg",
  "Tandoori Prawns": "/images/tandoori_prawns.jpg",
  "Garlic Prawns": "/images/garlic_prawns.jpg",
  "Prawn 65": "/images/prawn_65.jpg",
};

async function updateDb() {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected.");

    let updatedCount = 0;
    for (const [name, image] of Object.entries(itemImages)) {
      const res = await Menu.updateOne({ name }, { $set: { image } });
      if (res.matchedCount > 0) {
        updatedCount++;
        console.log(`Updated ${name} -> ${image}`);
      }
    }

    console.log(`Finished updating ${updatedCount} items in database.`);
    await mongoose.disconnect();
  } catch (err) {
    console.error("Error updating images:", err);
    process.exit(1);
  }
}

updateDb();
