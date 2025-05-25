const Settings = require("../../models/setting");
const fs = require("fs");
const path = require("path");
const setting = require("../../models/setting");
module.exports = {
  // Trang danh sách baitap với phân trang & tìm kiếm
  async index(req, res) {
    const search = req.query.search || "";
    const page = parseInt(req.query.page) || 1;
    const limit = 5;

    const totalRow = await Settings.getTotalRow(search);
    const totalPage = Math.max(Math.ceil(totalRow / limit), 1);
    const Page = Math.min(Math.max(page, 1), totalPage);
    const offset = (Page - 1) * limit;

    const data = await Settings.getAll(search, offset, limit);

    res.render("ds-banner", {
      data,
      totalPage,
      Page,
      search,
      title: "Danh sách banner",
    });
  },

  // Trang form thêm tài liệu
  async showAddForm(req, res) {
    const uploadedImages = fs // lấy danh sách ảnh đã update
      .readdirSync(path.join(__dirname, "../../../public/images"))
      .filter((file) => /\.(jpg|jpeg|png|gif)$/i.test(file));
    res.render("add-banner", {
      title: "Thêm mới banner",
      message: "",
      uploadedImages,
    });
  },
  // Xử lý thêm khóa học
  async create(req, res) {
    try {
      const {
        title,
        description,
        content_type,
        content_url,
        difficulty_level,
        hsk_level,
        category,
        word_count,
        duration,
        is_free,
        price,
        selected_image,
        old_thumbnail_url,
      } = req.body;
      // Kiểm tra trùng tên

      // Xác định thumbnail_url theo thứ tự ưu tiên:
      // 1. Upload file mới (req.file)
      // 2. Chọn ảnh có sẵn (selected_image)
      // 3. anh mac dinh
      let thumbnail_url;
      if (req.file) {
        thumbnail_url = "/images/" + req.file.filename;
      } else if (selected_image) {
        thumbnail_url = selected_image;
      } else {
        thumbnail_url = old_thumbnail_url;
      }

      const dataUpdate = {
        title,
        description,
        content_type,
        content_url,
        difficulty_level,
        hsk_level,
        category,
        word_count: word_count === "" ? null : parseInt(word_count),
        duration: duration === "" ? null : parseInt(duration),
        is_free,
        price,
        thumbnail_url,
      };
      await dsTailieu.create(dataUpdate);
      res.redirect("/admin/tailieu/danhsach");
    } catch (err) {
      console.error("Lỗi thêm tai lieu", err);
      res.send("Lỗi thêm tai lieu");
    }
  },
  //show form cập nhật tài liệu
  async showEditForm(req, res) {
    const id = req.params.id;
    const banner = await Settings.getById(id);
    const fs = require("fs");
    const path = require("path");

    const uploadedImages = fs
      .readdirSync(path.join(__dirname, "../../../public/images"))
      .filter((file) => /\.(jpg|jpeg|png|gif)$/i.test(file));

    if (!banner) {
      return res.render("error", { message: "Không tìm thấy tài liệu" });
    }
    res.render("edit-banner", {
      title: "Chỉnh sửa baner",
      banner,
      uploadedImages,
    });
  },
  // Xử lý cập nhật tài liệu
  async update(req, res) {
    try {
      const id = req.params.id;
      const {
        title,
        description,
        link_url,
        display_order,
        selected_image,
        old_thumbnail_url,
      } = req.body;
      const is_active = req.body.is_active === "1" ? 1 : 0;
      const checktitle = await Settings.checkDuplicateTitle(title, id);
      if (checktitle) {
        return res.send("Tên tiêu đề đã bị trùng ");
      }
      let image_url;
      if (req.file) {
        image_url = "/images/" + req.file.filename;
      } else if (selected_image) {
        image_url = selected_image;
      } else {
        image_url = old_thumbnail_url;
      }
      console.log(image_url);
      const dataUpdate = {
        title,
        description,
        link_url,
        display_order,
        is_active,
        image_url,
      };

      await Settings.update(id, dataUpdate);
      res.redirect("/admin/setting/banner/danhsach");
    } catch (err) {
      console.error("Lỗi cập nhật:", err);
      res.send("Cập nhật thất bại");
    }
  },

  // Xử lý xóa khóa học
  async remove(req, res) {
    const id = req.params.id; //lấy req id trên urlurl
    try {
      await Settings.delete(id); //gọi model xử lí
      console.log("Đã xóa banner", id);
      res.redirect("/admin/setting/banner/danhsach");
    } catch (err) {
      console.error("Lỗi xóa:", err);
      res.status(500).send("Xóa thất bại");
    }
  },
};
