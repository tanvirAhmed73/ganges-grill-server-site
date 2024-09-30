const user = require("../model/UserSchema");

async function getUser(req, res) {
  const result = await user.find();
  res.send(result);
}

// Delete The User After Verify The Token And Admin
async function deleteUser(req, res) {
  const id = req.params.id;
  const result = await findByIdAndDelete(id);
  res.send(result);
}

// Make User To Admin
async function makeAdmin(req, res) {
  const id = req.params.id;
  const result = await findOneAndUpdate({ _id: id }, { role: "admin" });
  res.send(result);
}

module.exports = { getUser, deleteUser, makeAdmin };
