const user = require("../model/UserSchema");

async function postUser(req, res) {
  const user = req.body;
  const query = { email: user.email };
  const ifExist = await user.findOne(query);
  if (ifExist) {
    return;
  } else {
    const result = await user.save(user);
    res.send(result);
  }
}

module.exports = { postUser };
