const express = require("express");
const { postJwt } = require("../controllers/jwtController");
const route = express.Router();

route.post("/", postJwt);

module.exports = route;
