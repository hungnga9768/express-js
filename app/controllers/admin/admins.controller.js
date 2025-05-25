const admin = require("../../models/admin");
const adminMd = require("../../models/admin");
const bcrypt = require("bcrypt"); // thư viện mã hóa mật khẩu
const fs = require("fs");
const path = require("path");
const jwt = require("jsonwebtoken");
require("dotenv").config();
const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET;
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET;

module.exports = {
  // Chức năng đăng nhập
  async showLogin(req, res) {
    res.render("Admin-login", {
      message: null,
    });
  },
  async checkLogin(req, res) {
    const { email, password_hash } = req.body;
    const user = await adminMd.check_emaill(email);

    if (!user.length) {
      res.render("Admin-login", {
        message: "Tài khoản không tồn tại",
      });
    }
    //check mật khẩu đã được mã hóa
    const storedPassword = user[0].password_hash;
    const isMatch = await bcrypt.compare(password_hash, storedPassword);
    if (!isMatch) {
      return res.render("Admin-login", {
        message: "Mật khẩu không chính xác",
      });
    }
    const userInfo = {
      admin_id: user[0].admin_id,
      username: user[0].username,
      email: user[0].email,
      full_name: user[0].full_name,
      avatar: user[0].avatar,
    };

    const accessToken_admin = jwt.sign(userInfo, ACCESS_TOKEN_SECRET, {
      expiresIn: "15m",
    });
    const refreshToken_admin = jwt.sign(userInfo, REFRESH_TOKEN_SECRET, {
      expiresIn: "7d",
    });
    res.cookie("accessToken_admin", accessToken_admin, {
      httpOnly: true,
      maxAge: 15 * 60 * 1000, // 15 phút
    });
    res.cookie("refreshToken_admin", refreshToken_admin, {
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 ngày
    });
    res.redirect("/admin");
  },
  // Chức năng đăng xuất
  async Logout(req, res) {
    try {
      res.clearCookie("accessToken_admin");
      res.clearCookie("refreshToken_admin");
      res.redirect("admin/login");
    } catch (error) {
      res.render("err", { message: "đăng xuất thất bại" });
    }
  },
  async index(req, res) {
    const search = req.query.search || "";
    const page = parseInt(req.query.page) || 1;
    const limit = 5;
    const totalRow = await adminMd.getTotalRow(search);
    const totalPage = Math.ceil(totalRow / limit);
    const baihocPage = Math.min(Math.max(page, 1), totalPage);
    const offset = (baihocPage - 1) * limit;
    const data = await adminMd.getAll(search, offset, limit);
    res.render("ds-admins", {
      data,
      totalPage,
      baihocPage,
      search,
      title: "Danh sách Admin",
    });
  },
  //show form thêm
  async showAddForm(req, res) {
    const uploadedImages = fs // lấy danh sách ảnh đã update
      .readdirSync(path.join(__dirname, "../../../public/images"))
      .filter((file) => /\.(jpg|jpeg|png|gif)$/i.test(file));
    res.render("add-admin", {
      title: "Thêm mới Admin",
      message: null,
      uploadedImages,
    });
  },

  // Xử lý thêm admin
  async create(req, res) {
    try {
      const uploadedImages = fs // lấy danh sách ảnh đã update
        .readdirSync(path.join(__dirname, "../../../public/images"))
        .filter((file) => /\.(jpg|jpeg|png|gif)$/i.test(file));
      const {
        username,
        email,
        full_name,
        status,
        role,
        selected_image,
        old_thumbnail_url,
      } = req.body;
      const saltRounds = 10; // độ dài mã hóa
      const password_hash = await bcrypt.hash(
        req.body.password_hash,
        saltRounds
      );
      let avatar;
      if (req.file) {
        avatar = "/images/" + req.file.filename;
      } else if (selected_image) {
        avatar = selected_image;
      } else {
        avatar = old_thumbnail_url;
      }
      const newCourse = {
        username,
        email,
        password_hash,
        full_name,
        status,
        role,
        avatar,
      };
      const isDuplicate = await adminMd.checkDuplicateUsernameOrEmail(
        username,
        email
      );
      if (isDuplicate) {
        return res.render("add-admin", {
          title: "Thêm mới admin",
          message: "Tên tài khoản hoặc emaill đã có trên hệ thống",
          uploadedImages,
        });
      }
      await adminMd.create(newCourse);
      res.redirect("/admin/admins/danhsach");
    } catch (err) {
      console.error("Lỗi thêm khóa học:", err);
      return res.render("error", {
        message: "Lỗi thêm khóa học",
      });
    }
  },
  // Xử lý xóa user
  async remove(req, res) {
    const id = req.params.id; //lấy req id trên urlurl
    try {
      await adminMd.delete(id); //gọi model xử lí
      console.log("Đã xóa bài hoc ID:", id);
      res.redirect("/admin/admins/danhsach");
    } catch (err) {
      console.error("Lỗi xóa:", err);
      res.status(500).send("Xóa thất bại");
    }
  },
  async showEditForm(req, res) {
    const id = req.params.id;
    const admin = await adminMd.getById(id);
    const uploadedImages = fs // lấy danh sách ảnh đã update
      .readdirSync(path.join(__dirname, "../../../public/images"))
      .filter((file) => /\.(jpg|jpeg|png|gif)$/i.test(file));
    if (!admin) {
      return res.render("error", { message: "Không tìm thấy bài học" });
    }
    res.render("edit-admin", {
      title: "Sửa thông tin người dùng",
      admin,
      uploadedImages,
    });
  },
  // Trang form update admin
  async update(req, res) {
    try {
      const id = req.params.id;
      const {
        username,
        email,
        full_name,
        status,
        role,
        selected_image,
        old_thumbnail_url,
      } = req.body;
      console.log(selected_image);
      const isDuplicate = await adminMd.checkDuplicateUsernameOrEmailUpdate(
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
        status,
        role,
      };

      if (req.file) {
        dataUpdate.avatar = "/images/" + req.file.filename;
      } else if (selected_image) {
        dataUpdate.avatar = selected_image;
      } else {
        dataUpdate.avatar = old_thumbnail_url;
      }
      await adminMd.update(id, dataUpdate);
      res.redirect("/admin/admins/danhsach");
    } catch (err) {
      console.error("Lỗi cập nhật:", err);
      res.send("Cập nhật thất bại");
    }
  },
};
