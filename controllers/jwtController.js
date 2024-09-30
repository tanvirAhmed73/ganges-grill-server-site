const user = require("../model/UserSchema");

async function postJwt(req, res) {
  const data = req.body;
  const token = jwt.sign(data, process.env.access_token, {
    expiresIn: "1h",
  });
  res.send({ token });
}

async function isAdmin(req, res) {
  const email = req.params.email;
  if (email !== req.decoded.userEmail) {
    return res.status(403).send({ message: "unauthorized access" });
  }
  const query = { email: email };
  const user = await user.findOne(query);
  let isAdmin = false;
  if (user) {
    isAdmin = user?.role === "admin";
  }
  res.send({ isAdmin });
}

module.exports = { postJwt, isAdmin };
