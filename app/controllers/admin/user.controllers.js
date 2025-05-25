const userModel = require("../../models/user");
const bcrypt = require("bcrypt"); // phương thức mã hóa sản phẩm
const saltRounds = 10; //số vòng mã hóa sản phẩm vòng càng cao thì chạy chậm
const fs = require("fs");
const path = require("path");
module.exports = {
  // Trang danh sách khóa học với phân trang & tìm kiếm
  async index(req, res) {
    const search = req.query.search || "";
    const page = parseInt(req.query.page) || 1;
    const limit = 5;
    const totalRow = await userModel.getTotalRow(search);
    const totalPage = Math.ceil(totalRow / limit);
    const baihocPage = Math.min(Math.max(page, 1), totalPage);
    const offset = (baihocPage - 1) * limit;
    const data = await userModel.getAll(search, offset, limit);
    res.render("ds-users", {
      data,
      totalPage,
      baihocPage,
      search,
      title: "Danh sách người dùng",
    });
  },

  // Trang form thêm user
  async showAddForm(req, res) {
    const uploadedImages = fs // lấy danh sách ảnh đã update
      .readdirSync(path.join(__dirname, "../../../public/images"))
      .filter((file) => /\.(jpg|jpeg|png|gif)$/i.test(file));
    res.render("add-user", { title: "Thêm mới người dùng", uploadedImages });
  },

  // Xử lý thêm user
  async create(req, res) {
    try {
      const {
        username,
        email,
        full_name,
        account_status,
        subscription_type,
        selected_image,
        old_thumbnail_url,
      } = req.body;
      // mã hóa mật khẩu trước khi thêm
      const password_hash = await bcrypt.hash(
        req.body.password_hash,
        saltRounds
      );
      let profile_picture;
      if (req.file) {
        profile_picture = "/images/" + req.file.filename;
      } else if (selected_image) {
        profile_picture = selected_image;
      } else {
        profile_picture = old_thumbnail_url;
      } // ảnh mặc định
      const subscription_expiry = req.body.subscription_expiry || null;
      const user = {
        username,
        email,
        password_hash,
        full_name,
        profile_picture,
        account_status,
        subscription_type,
        subscription_expiry,
      };
      const isDuplicate = await userModel.checkDuplicateUsernameOrEmail(
        username,
        email
      );
      if (isDuplicate) {
        return res.send(
          "Tên đăng nhập hoặc email đã tồn tại bởi người dùng khác."
        );
      }
      await userModel.create(user);
      res.redirect("/admin/user/danhsach");
    } catch (err) {
      console.error("Lỗi thêm khóa học:", err);
      return res.send({ err });
    }
  },

  // Trang form chỉnh sửa user
  async showEditForm(req, res) {
    const uploadedImages = fs // lấy danh sách ảnh đã update
      .readdirSync(path.join(__dirname, "../../../public/images"));
    const id = req.params.id;
    const user = await userModel.getById(id);
    if (!user) {
      return res.render("error", { message: "Không tìm thấy bài học" });
    }
    res.render("edit-user", {
      title: "Sửa thông tin người dùng",
      user,
      uploadedImages,
    });
  },
  // Trang form update user
  async update(req, res) {
    try {
      const id = req.params.id;
      const {
        username,
        email,
        password_hash,
        full_name,
        account_status,
        subscription_type,
        selected_image,
        old_thumbnail_url,
      } = req.body;
      const subscription_expiry = req.body.subscription_expiry || null;
      const isDuplicate = await userModel.checkDuplicateUsernameOrEmailUpdate(
        username,
        email,
        id
      );
      if (isDuplicate) {
        return res.send(
          "Tên đăng nhập hoặc email đã tồn tại bởi người dùng khác."
        );
      }
      const dataUpdate = {
        username,
        email,
        full_name,
        account_status,
        subscription_type,
        subscription_expiry,
      };
      // mã hóa mật khẩu trước khi thêm
      if (password_hash && password_hash.trim() !== "") {
        dataUpdate.password_hash = await bcrypt.hash(password_hash, saltRounds);
      }
      if (req.file) {
        dataUpdate.profile_picture = "/images/" + req.file.filename;
      } else if (selected_image) {
        dataUpdate.profile_picture = selected_image;
      } else {
        dataUpdate.profile_picture = old_thumbnail_url;
      }
      await userModel.update(id, dataUpdate);
      res.redirect("/admin/user/danhsach");
    } catch (err) {
      console.error("Lỗi cập nhật:", err);
      res.send("Cập nhật thất bại");
    }
  },

  // Xử lý xóa user
  async remove(req, res) {
    const id = req.params.id; //lấy req id trên urlurl
    try {
      await userModel.delete(id); //gọi model xử lí
      console.log("Đã xóa bài hoc ID:", id);
      res.redirect("/admin/user/danhsach");
    } catch (err) {
      console.error("Lỗi xóa:", err);
      res.status(500).send("Xóa thất bại");
    }
  },
};
