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
  async showAddForm(req, res) {
    const uploadedImages = fs // lấy danh sách ảnh đã update
      .readdirSync(path.join(__dirname, "../../../public/images"))
      .filter((file) => /\.(jpg|jpeg|png|gif)$/i.test(file));
    res.render("add-chatbot", {
      title: "Thêm mới trợ lý AI",
      message: "",
      uploadedImages,
    });
  },
  // Xử lý thêm khóa học
  async create(req, res) {
    try {
      const {
        name,
        internal_name,
        initial_prompt,
        description,
        selected_image,
        old_thumbnail_url,
      } = req.body;
      console.log(req.body.name);
      const is_active = req.body.is_active === "1" ? 1 : 0;
      let avatar_url;
      if (req.file) {
        avatar_url = "/images/" + req.file.filename;
      } else if (selected_image) {
        avatar_url = selected_image;
      } else {
        avatar_url = old_thumbnail_url;
      }
      const createChatbot = {
        name,
        internal_name,
        initial_prompt,
        description,
        is_active,
        avatar_url,
      };

      await chatModel.create(createChatbot);
      res.redirect("/admin/chatbot/danhsach");
    } catch (err) {
      console.error("Lỗi thêm tro ly ai", err);
      res.send("Lỗi thêm tro li ai");
    }
  },
  async showEditForm(req, res) {
    const uploadedImages = fs // lấy danh sách ảnh đã update
      .readdirSync(path.join(__dirname, "../../../public/images"))
      .filter((file) => /\.(jpg|jpeg|png|gif)$/i.test(file));
    const id = req.params.id;
    const chat = await chatModel.getById(id);
    if (!chat) {
      return res.render("error", { message: "Không tìm thấy tài liệu" });
    }
    res.render("edit-settingchatai", {
      title: "Chỉnh sửa trợ lý AI",
      chat,
      uploadedImages,
    });
  },
  async update(req, res) {
    try {
      const id = req.params.id;
      const {
        name,
        internal_name,
        initial_prompt,
        description,
        selected_image,
        old_thumbnail_url,
      } = req.body;
      const is_active = req.body.is_active === "1" ? 1 : 0;
      const checktitle = await chatModel.checkDuplicateTitle(name, id);
      if (checktitle) {
        return res.send(`Tên ${name} đã bị trùng `);
      }
      let avatar_url;
      if (req.file) {
        avatar_url = "/images/" + req.file.filename;
      } else if (selected_image) {
        avatar_url = selected_image;
      } else {
        avatar_url = old_thumbnail_url;
      }
      const dataUpdate = {
        name,
        internal_name,
        initial_prompt,
        description,
        is_active,
        avatar_url,
      };

      await chatModel.update(id, dataUpdate);
      res.redirect("/admin/chatbot/danhsach");
    } catch (err) {
      console.error("Lỗi cập nhật:", err);
      res.send("Cập nhật thất bại");
    }
  },
  async remove(req, res) {
    const id = req.params.id;
    try {
      await chatModel.delete(id);
      res.redirect("/admin/chatbot/danhsach");
    } catch (err) {
      console.error("Lỗi xóa:", err);
      res.status(500).send("Xóa thất bại");
    }
  },
};
