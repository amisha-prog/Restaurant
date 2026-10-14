const express = require("express");
const router = express.Router();

const {
  getMenuItems,
  addMenuItem,
  updateMenuItem,
  deleteMenuItem,
  getModifiers,
  addModifier,
  deleteModifier,
} = require("../controllers/menuController");

// Menu
router.get("/", getMenuItems);
router.post("/", addMenuItem);
router.put("/:id", updateMenuItem);
router.patch("/:id", updateMenuItem);
router.delete("/:id", deleteMenuItem);

// Modifiers
router.get("/modifiers", getModifiers);
router.post("/modifiers", addModifier);
router.delete("/modifiers/:id", deleteModifier);

module.exports = router;
