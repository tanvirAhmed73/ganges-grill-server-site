const app = require("./app");
const logger = require("./config/logger");
const connectDB = require("./config/db");
const verifyToken = require("./middleware/verifyToken");
const verifyAdmin = require("./middleware/verify admin");

require("dotenv").config();

// connect mongodb
const port = process.env.PORT || 5000;

connectDB();

app.listen(port, () => {
  logger.info(`server is running on the port ${port}`);
});

async function run() {
  try {
    // use after verify admin after vefity token
    app.get("/user/admin/:email", verifyToken, async (req, res) => {
      const email = req.params.email;
      if (email !== req.decoded.userEmail) {
        return res.status(403).send({ message: "unauthorized access" });
      }
      const query = { email: email };
      const user = await userCollection.findOne(query);
      let isAdmin = false;
      if (user) {
        isAdmin = user?.role === "admin";
      }
      res.send({ isAdmin });
    });
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);
