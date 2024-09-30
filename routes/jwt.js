const express = require("express");
const { isAdmin } = require("../controllers/jwtController");
const router = express.Router();

router.post("/jwt", postJwt);
router.get("/user/admin/:email", verifyToken, isAdmin);

module.exports = router;
