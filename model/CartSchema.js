const mongoose = require("mongoose");

const cartSchema = new mongoose.Schema(
  {
    foodId: String,
    email: String,
    name: String,
    image: String,
    price: Number,
  },
  { timestamps: true }
);

const cart = mongoose.model("Cart", cartSchema, "carts_item");

module.exports = cart;
