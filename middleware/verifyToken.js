let jwt = require("jsonwebtoken");

const verifyToken = (req, res, next) => {
  if (!req.headers.authorization) {
    return res.status(401).send({ message: "forbidden access" });
  }
  const token = req.headers.authorization?.split(" ")[1];
  jwt.verify(token, process.env.access_token, function (err, decoded) {
    if (err) {
      return res.status(401).send({ message: "forbidden access" });
    } else {
      req.decoded = decoded;
      // console.log("fffff", req.headers.authorization)
      next();
    }
  });
};

module.exports = verifyToken;
