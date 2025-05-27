const Banner = require("../../models/banner");
const Settings = require("../../models/setting");
const fs = require("fs");
const { listItems } = require("../../utils/listItemsAPI");
module.exports = {
  async index(req, res) {
    await listItems(Banner, req, res);
  },
  async getConfig(req, res) {
    await listItems(Settings, req, res);
  },
};
