const Modifier = require("../models/Modifier");

const getModifiers = async (req, res) => {
  try {
    const modifiers = await Modifier.find().sort({ createdAt: -1 });
    return res.status(200).json({ modifiers });
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch modifiers." });
  }
};

const addModifier = async (req, res) => {
  try {
    const { name, priceAdjustment = 0, available = true } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ message: "Modifier name is required." });
    }

    const modifier = await Modifier.create({
      name: name.trim(),
      priceAdjustment: Number(priceAdjustment),
      available,
    });

    return res.status(201).json({ message: "Modifier added successfully.", modifier });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: "A modifier with this name already exists." });
    }

    return res.status(500).json({ message: "Failed to add modifier." });
  }
};

const deleteModifier = async (req, res) => {
  try {
    const modifier = await Modifier.findByIdAndDelete(req.params.id);

    if (!modifier) {
      return res.status(404).json({ message: "Modifier not found." });
    }

    return res.status(200).json({ message: "Modifier deleted successfully." });
  } catch (error) {
    return res.status(400).json({ message: "Invalid modifier ID." });
  }
};

module.exports = { getModifiers, addModifier, deleteModifier };
