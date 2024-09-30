// todo: need to add the user collection

const verifyAdmin = async (req, res, next) => {
  const email = req.decoded.userEmail;
  const query = { email: email };
  const user = await userCollection.findOne(query);
  const isAdmin = user?.role === "admin";
  if (!isAdmin) {
    return res.status(403).send({ message: "forbidden access" });
  }
  next();
};

module.exports = verifyAdmin;
