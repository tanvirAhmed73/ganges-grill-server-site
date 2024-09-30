const menuItem = require("./menuItem");
const cart = require("./cart");
const admin = require("./admin");
const user = require("./user");
const jwt = require("./jwt");

const routeRegistration = (app) => {
  app.use("/", menuItem);
  app.use("/", cart);
  app.use("/user", admin);
  app.use("/user", user);
  app.use("/", jwt);
};

module.exports = routeRegistration;
