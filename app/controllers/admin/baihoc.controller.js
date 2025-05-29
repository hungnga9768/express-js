const Course = require("../../models/baihoc");
const dsKhoahoc = require("../../models/khoahoc");
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
    res.render("ds-baihoc", {
      data,
      totalPage,
      currentPage,
      search,
      title: "Danh sách bài học",
    });
  },

  // Trang form thêm khóa học
  async showAddForm(req, res) {
    const courses = await dsKhoahoc.getDs();
    res.render("add-baihoc", { courses, title: "Thêm mới bài học" });
  },

  // Xử lý thêm khóa học
  async create(req, res) {
    try {
      const {
        course_id,
        title,
        description,
        content_type,
        content_url,
        duration,
        display_order,
        module_order,
      } = req.body;
      const is_preview = req.body.is_preview === "1" ? true : false;

      const newCourse = {
        course_id,
        title,
        description,
        content_type,
        content_url,
        duration,
        display_order,
        is_preview,
        module_order,
      };

      await Course.create(newCourse);
      res.redirect("/admin/baihoc/danhsach");
    } catch (err) {
      console.error("Lỗi thêm khóa học:", err);
      return res.render("error", {
        message: "Lỗi thêm khóa học",
      });
    }
  },

  // Trang form chỉnh sửa khóa học
  async showEditForm(req, res) {
    const id = req.params.id;
    const lesson = await Course.getById(id);
    const courses = await dsKhoahoc.getDs();
    if (!lesson) {
      return res.render("error", { message: "Không tìm thấy bài học" });
    }
    res.render("edit-baihoc", { title: "Chỉnh sửa bài học", lesson, courses });
  },

  // Xử lý cập nhật khóa học
  async update(req, res) {
    try {
      const id = req.params.id;
      const {
        course_id,
        title,
        description,
        content_type,
        content_url,
        duration,
        display_order,
        module_order,
      } = req.body;
      const is_preview = req.body.is_preview === "1" ? true : false;
      //data update
      const isDuplicate = await Course.checkDuplicateTitle(title, id);
      if (isDuplicate) {
        return res.render("error", {
          message: "Khóa học với tiêu đề này đã tồn tại.",
        });
      }
      const dataUpdate = {
        course_id,
        title,
        description,
        content_type,
        content_url,
        duration,
        display_order,
        is_preview,
        module_order,
      };
      //goivà truyền để update
      await Course.update(id, dataUpdate);
      res.redirect("/admin/baihoc/danhsach");
    } catch (err) {
      console.error("Lỗi cập nhật:", err);
      return res.render("error", {
        message: "Cập nhật thất bại",
      });
    }
  },

  // Xử lý xóa khóa học
  async remove(req, res) {
    const id = req.params.id; //lấy req id trên urlurl
    try {
      await Course.delete(id); //gọi model xử lí
      console.log("Đã xóa bài hoc ID:", id);
      res.redirect("/admin/baihoc/danhsach");
    } catch (err) {
      console.error("Lỗi xóa:", err);
      res.status(500).send("Xóa thất bại");
    }
  },
  // up date hàng loạtloạt trên router ds bài học
  async updateMultiple(req, res) {
    const { lessons } = req.body;
    const results = [];

    for (const lesson of lessons) {
      try {
        await Course.update(lesson.lesson_id, {
          title: lesson.title,
          content_type: lesson.content_type,
          duration: lesson.duration,
          is_preview: lesson.is_preview,
          display_order: lesson.display_order,
        });

        results.push({ lesson_id: lesson.lesson_id, success: true });
      } catch (error) {
        results.push({
          lesson_id: lesson.lesson_id,
          success: false,
          message: error.message,
        });
      }
    }

    res.json({ success: true, results });
  },
  // up date hàng loạtloạt trên router theo chi tiết khóa học
  async bulkUpdateLessons(req, res) {
    try {
      const lessons = req.body.lessons;
      for (const lesson of lessons) {
        await Course.update(lesson.lesson_id, {
          title: lesson.title,
          content_type: lesson.content_type,
          content_url: lesson.content_url,
          duration: parseInt(lesson.duration),
          module_order: parseInt(lesson.module_order),
          display_order: parseInt(lesson.display_order),
          is_preview: lesson.is_preview === "1",
        });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Lỗi khi cập nhật:", error);
      res.status(500).json({ success: false, message: "Lỗi server" });
    }
  },
};
