const Settings = require("../../models/setting");
const fs = require("fs");
const path = require("path");
const setting = require("../../models/setting");
module.exports = {
  async index(req, res) {
    const search = req.query.search || "";
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    const totalItems = await Settings.getTotalRow(search);
    const totalPages = Math.max(Math.ceil(totalItems / limit), 1);
    const currentPage = Math.min(Math.max(page, 1), totalPages);
    const offset = (currentPage - 1) * limit;

    const data = await Settings.getAll(search, offset, limit);

    res.json({
      data,
      pagination: {
        totalItems,
        totalPages,
        currentPage,
        limit,
      },
    });
  },
};
