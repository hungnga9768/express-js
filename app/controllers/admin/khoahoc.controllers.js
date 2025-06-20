const Course = require("../../models/khoahoc");
const Lessons = require("../../models/baihoc");
const fs = require("fs");
const path = require("path");
module.exports = {
  // Trang danh sách khóa học với phân trang & tìm kiếm
  async index(req, res) {
    const search = req.query.search || "";
    const page = parseInt(req.query.page) || 1;
    const limit = 10;

    const totalRow = await Course.getTotalRow(search);
    const totalPage = Math.ceil(totalRow / limit);
    const currentPage = Math.min(Math.max(page, 1), totalPage);
    const offset = (currentPage - 1) * limit;

    const data = await Course.getAll(search, offset, limit);

    res.render("danhsach", {
      title: "Danh sách khóa học",
      data,
      totalPage,
      currentPage,
      search,
    });
  },

  // Trang form thêm khóa học
  showAddForm(req, res) {
    const uploadedImages = fs // lấy danh sách ảnh đã update
      .readdirSync(path.join(__dirname, "../../../public/images"))
      .filter((file) => /\.(jpg|jpeg|png|gif)$/i.test(file));
    res.render("add-khoahoc", { title: "Thêm khóa học", uploadedImages });
  },

  // Xử lý thêm khóa học
  async create(req, res) {
    try {
      const {
        title,
        description,
        difficulty_level,
        estimated_duration,
        is_free,
        price,

        selected_image,
        old_thumbnail_url,
      } = req.body;

      let thumbnail_url;
      if (req.file) {
        thumbnail_url = "/images/" + req.file.filename;
      } else if (selected_image) {
        thumbnail_url = selected_image;
      } else {
        thumbnail_url = old_thumbnail_url;
      }
      const newCourse = {
        title,
        description,
        difficulty_level,
        estimated_duration,
        is_free,
        price,
        thumbnail_url,
      };

      await Course.create(newCourse);
      res.redirect("/admin/khoahoc/danhsach");
    } catch (err) {
      console.error("Lỗi thêm khóa học:", err);
      res.send("Lỗi thêm khóa học");
    }
  },

  // Trang form chỉnh sửa khóa học
  async showEditForm(req, res) {
    const uploadedImages = fs // lấy danh sách ảnh đã update
      .readdirSync(path.join(__dirname, "../../../public/images"))
      .filter((file) => /\.(jpg|jpeg|png|gif)$/i.test(file));
    const id = req.params.id;
    const course = await Course.getById(id);
    if (!course) {
      return res.render("error", { message: "Không tìm thấy khóa học" });
    }
    const rawLessons = await Lessons.getcourseId(id);

    const groupedLessons = {};
    rawLessons.forEach((lesson) => {
      const module = lesson.module_order || 1;
      if (!groupedLessons[module]) {
        groupedLessons[module] = [];
      }
      groupedLessons[module].push(lesson);
    });
    res.render("edit-khoahoc", {
      title: "Chỉnh sửa khóa học",
      course,
      uploadedImages,
      groupedLessons,
    });
  },

  // Xử lý cập nhật khóa học
  async update(req, res) {
    try {
      const id = req.params.id;
      const {
        title,
        description,
        difficulty_level,
        estimated_duration,
        is_free,
        price,

        old_thumbnail_url,
        selected_image,
      } = req.body;

      const isDuplicate = await Course.checkDuplicateTitle(title, id);
      if (isDuplicate) {
        return res.send("Khóa học với tiêu đề này đã tồn tại.");
      }

      const dataUpdate = {
        title,
        description,
        difficulty_level,
        estimated_duration,
        is_free,
        price,
      };

      if (req.file) {
        dataUpdate.thumbnail_url = "/images/" + req.file.filename;
      } else if (selected_image) {
        dataUpdate.thumbnail_url = selected_image;
      } else {
        dataUpdate.thumbnail_url = old_thumbnail_url;
      }

      await Course.update(id, dataUpdate);
      res.redirect("/admin/khoahoc/danhsach");
    } catch (err) {
      console.error("Lỗi cập nhật:", err);
      res.send("Cập nhật thất bại");
    }
  },

  // Xử lý xóa khóa học
  async remove(req, res) {
    const id = req.params.id;
    try {
      await Course.delete(id);
      console.log("Đã xóa khóa học ID:", id);
      res.redirect("/admin/khoahoc/danhsach");
    } catch (err) {
      console.error("Lỗi xóa:", err);
      res.status(500).send("Xóa thất bại");
    }
  },
  async updateMultipleCourses(req, res) {
    const { courses } = req.body;
    const results = [];

    for (const course of courses) {
      try {
        await Course.update(course.course_id, {
          title: course.title,
          difficulty_level: course.difficulty_level,
          estimated_duration: course.estimated_duration,
          price: course.price,
          is_free: course.is_free,
        });

        results.push({ course_id: course.course_id, success: true });
      } catch (err) {
        results.push({
          course_id: course.course_id,
          success: false,
          message: err.message,
        });
      }
    }

    res.json({ success: true, results });
  },
};
