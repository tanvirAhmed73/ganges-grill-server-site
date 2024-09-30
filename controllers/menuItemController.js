const logger = require("../config/logger");
const menu = require("../model/MenuSchema");

async function getMenuItem(req, res) {
  logger.info(`Get The All Menu Item`);
  const result = await menu.find();
  res.send(result);
}

async function createMenuItem(req, res) {
  logger.info("Post The Menu Item");
  const data = req.body;
  const menuData = new menu(data);
  const result = await menuData.save();
  res.send(result);
}

async function menuDeleteById(req, res) {
  const id = req.params.id;
  const result = await menu.findOneAndDelete({ _id: id });
  res.send(result);
}

module.exports = { getMenuItem, createMenuItem, menuDeleteById };
