const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    email: String,
    name: String,
    role: {
      type: String,
      default: "user",
    },
  },
  { timestamps: true }
);

const user = mongoose.model("User", userSchema, user_Collection);
module.exports = user;
