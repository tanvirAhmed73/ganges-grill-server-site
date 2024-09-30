const express = require("express");
const app = express();
const cors = require("cors");
const { rateLimit } = require("express-rate-limit");
const routeRegistration = require("./routes/init");

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 100, // Limit each IP to 100 requests per `window` (here, per 15 minutes).
  message: "Too many request form this Ip, please try again after 2 minutes",
});

// middleware
app.use(cors());
app.use(express.json());
app.use(limiter);

routeRegistration(app);

module.exports = app;
