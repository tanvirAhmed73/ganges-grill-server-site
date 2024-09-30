const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    const uri = process.env.MONGO_URI;
    if (!uri) {
      throw new Error("MONGO_URI environment variable is not defined");
    }

    mongoose
      .connect(uri)
      .then(() => {
        console.log("connection successful");
      })
      .catch((err) => console.log(err));
  } catch (error) {
    console.log(error.message);
    process.exit(1);
  }
};

module.exports = connectDB;
