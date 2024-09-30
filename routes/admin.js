const express = require("express");
const verifyToken = require("../middleware/verifyToken");
const verifyAdmin = require("../middleware/verify admin");
const {
  getUser,
  deleteUser,
  makeAdmin,
} = require("../controllers/adminController");

const router = express.Router();

router.get("/", verifyToken, verifyAdmin, getUser);
router.delete("/:id", verifyToken, verifyAdmin, deleteUser);
router.patch("/admin/:id", verifyToken, verifyAdmin, makeAdmin);
