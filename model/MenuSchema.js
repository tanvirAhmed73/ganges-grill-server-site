const mongoose = require("mongoose");

const menuschema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    recipe: {
      type: String,
      required: true,
    },
    image: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
  },
  { timestamps: true }
);

const menu = mongoose.model("Menu", menuschema, "popular_item");

module.exports = menu;
