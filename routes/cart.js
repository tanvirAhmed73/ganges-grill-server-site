const express = require("express");
const cartController = require("../controllers/cartController");
const verifyToken = require("../middleware/verifyToken");

const router = express.Router();

router.get("/cart", cartController.getCart);
router.post("/cart", verifyToken, cartController.postCart);
router.delete("/cart:id", verifyToken, cartController.deleteCart);

module.exports = router;
