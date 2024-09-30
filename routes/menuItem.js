const express = require("express");
const {
  getMenuItem,
  createMenuItem,
  menuDeleteById,
} = require("../controllers/menuItemController");
const verifyToken = require("../middleware/verifyToken");
const verifyAdmin = require("../middleware/verify admin");
const router = express.Router();

router.route("/menuItem").get(getMenuItem).post(createMenuItem);
router.delete("/menuItem/:id", verifyToken, verifyAdmin, menuDeleteById);

module.exports = router;
