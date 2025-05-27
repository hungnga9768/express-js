const Banner = require("../../models/banner");
const Settings = require("../../models/setting");
const fs = require("fs");
const path = require("path");
module.exports = {
  // Trang danh sách baitap với phân trang & tìm kiếm
  async index(req, res) {
    const search = req.query.search || "";
    const page = parseInt(req.query.page) || 1;
    const limit = 10;
    const totalRow = await Banner.getTotalRow(search);
    const totalPage = Math.max(Math.ceil(totalRow / limit), 1);
    const Page = Math.min(Math.max(page, 1), totalPage);
    const offset = (Page - 1) * limit;

    const data = await Banner.getAll(search, offset, limit);

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
        link_url,
        display_order,
        selected_image,
        old_thumbnail_url,
      } = req.body;
      const is_active = req.body.is_active === "1" ? 1 : 0;
      let image_url;
      if (req.file) {
        image_url = "/images/" + req.file.filename;
      } else if (selected_image) {
        image_url = selected_image;
      } else {
        image_url = old_thumbnail_url;
      }

      const dataUpdate = {
        title,
        description,
        link_url,
        display_order,
        is_active,
        image_url,
      };
      await Banner.create(dataUpdate);
      res.redirect("/admin/setting/banner/danhsach");
    } catch (err) {
      console.error("Lỗi thêm banner", err);
      res.send("Lỗi thêm banner");
    }
  },
  async showEditForm(req, res) {
    const id = req.params.id;
    const banner = await Banner.getById(id);
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
      const checktitle = await Banner.checkDuplicateTitle(title, id);
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

      await Banner.update(id, dataUpdate);
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
      await Banner.delete(id); //gọi model xử lí
      console.log("Đã xóa banner", id);
      res.redirect("/admin/setting/banner/danhsach");
    } catch (err) {
      console.error("Lỗi xóa:", err);
      res.status(500).send("Xóa thất bại");
    }
  },
  async indexSetttings(req, res) {
    const search = req.query.search || "";
    const page = parseInt(req.query.page) || 1;
    const limit = 100;

    const totalRow = await Settings.getTotalRow(search);
    const totalPage = Math.max(Math.ceil(totalRow / limit), 1);
    const Page = Math.min(Math.max(page, 1), totalPage);
    const offset = (Page - 1) * limit;

    const data = await Settings.getAll(search, offset, limit);

    res.render("ds-settings", {
      data,
      totalPage,
      Page,
      search,
      title: "Danh sách thiết lập websites",
    });
  },
  async showEditForSettings(req, res) {
    const id = req.params.id;
    const setting = await Settings.getById(id);
    const fs = require("fs");
    const path = require("path");

    const uploadedImages = fs
      .readdirSync(path.join(__dirname, "../../../public/images"))
      .filter((file) => /\.(jpg|jpeg|png|gif)$/i.test(file));

    if (!setting) {
      return res.render("error", { message: "Không tìm thấy tài liệu" });
    }
    res.render("edit-settings", {
      title: "Chỉnh sửa bố cục website",
      setting,
      uploadedImages,
    });
  },
  async updateSettings(req, res) {
    try {
      const id = req.params.id;
      const { selected_image, old_thumbnail_url, key } = req.body;

      let value;

      // Trường hợp là ảnh (logo hoặc favicon)
      if (key === "logo" || key === "favicon") {
        if (req.file) {
          value = "/images/" + req.file.filename;

          // Nếu có ảnh cũ và khác ảnh mới => xóa ảnh cũ khỏi thư mục public
          if (
            old_thumbnail_url &&
            old_thumbnail_url !== value &&
            !old_thumbnail_url.startsWith("http")
          ) {
            const oldPath = path.join("public", old_thumbnail_url);
            if (fs.existsSync(oldPath)) {
              fs.unlinkSync(oldPath);
            }
          }
        } else if (selected_image) {
          value = selected_image;
        } else if (old_thumbnail_url) {
          value = old_thumbnail_url;
        }
      } else {
        // Trường hợp là input hoặc textarea khác
        value = req.body.value;
      }

      const dataUpdate = { key, value };

      await Settings.update(id, dataUpdate);

      res.redirect("/admin/setting");
    } catch (err) {
      console.error("Lỗi cập nhật:", err);
      res.status(500).send("Lỗi cập nhật: " + err.message);
    }
  },
};
