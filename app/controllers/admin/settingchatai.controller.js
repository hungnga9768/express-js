const chatModel = require("../../models/settingchatai");
const fs = require("fs");
const path = require("path");
module.exports = {
  async index(req, res) {
    const search = req.query.search || "";
    const page = parseInt(req.query.page) || 1;
    const limit = 10;
    const totalRow = await chatModel.getTotalRow(search);
    const totalPage = Math.max(Math.ceil(totalRow / limit), 1);
    const Page = Math.min(Math.max(page, 1), totalPage);
    const offset = (Page - 1) * limit;
    const data = await chatModel.getAll(search, offset, limit);
    res.render("ds-settingchatai", {
      data,
      totalPage,
      Page,
      search,
      title: "quản lý Ai",
    });
  },
  async showEditForm(req, res) {
    const id = req.params.id;
    const chat = await chatModel.getById(id);
    if (!chat) {
      return res.render("error", { message: "Không tìm thấy tài liệu" });
    }
    res.render("edit-settingchatai", {
      title: "Chỉnh sửa trợ lý AI",
      chat,
    });
  },
  async update(req, res) {
    try {
      console.log("req.body:", req.body); // THÊM DÒNG NÀY
      console.log("req.params:", req.params); // Và dòng này để kiểm tra id
      const id = req.params.id;
      const { name, internal_name, initial_prompt, description } = req.body;
      const is_active = req.body.is_active === "1" ? 1 : 0;
      const checktitle = await chatModel.checkDuplicateTitle(name, id);
      if (checktitle) {
        return res.send(`Tên ${name} đã bị trùng `);
      }
      const dataUpdate = {
        name,
        internal_name,
        initial_prompt,
        description,
        is_active,
      };

      await chatModel.update(id, dataUpdate);
      res.redirect("/admin/settingai/danhsach");
    } catch (err) {
      console.error("Lỗi cập nhật:", err);
      res.send("Cập nhật thất bại");
    }
  },
};
