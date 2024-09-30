const logger = require("../config/logger");
const cart = require("../model/CartSchema");

async function getCart(req, res) {
  logger.info("Get The Cart Item Using Email");
  const email = req.query.email;
  console.log(email);
  const query = { email: email };
  const result = await cart.find(query);
  res.send(result);
}

async function postCart(req, res) {
  logger.info("Post The Item In The Cart");
  const data = req.body;
  const cartdata = new cart(data);
  const result = await cartdata.save();
  res.send(result);
}

async function deleteCart(req, res) {
  logger.info("Cart Deleting Pogress Start");
  const id = req.params.id;
  const query = { _id: new ObjectId(id) };
  const result = await cart.deleteOne(query);
  res.send(result);
}

module.exports = { getCart, postCart, deleteCart };
