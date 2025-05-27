const Course = require("../../models/khoahoc");
const { listItems } = require("../../utils/listItemsAPI");

module.exports = {
  async index(req, res) {
    await listItems(Course, req, res);
  },

  showAddForm(req, res) {
    res.render("add-khoahoc", { title: "Thêm khóa học" });
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
        instructor_id,
      } = req.body;

      const thumbnail_url = "/images/" + req.file.filename;

      const newCourse = {
        title,
        description,
        difficulty_level,
        estimated_duration,
        is_free,
        price,
        instructor_id,
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
    const id = req.params.id;
    const course = await Course.getById(id);
    if (!course) {
      return res.render("error", { message: "Không tìm thấy khóa học" });
    }
    res.render("edit-khoahoc", { title: "Chỉnh sửa khóa học", course });
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
        instructor_id,
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
        instructor_id,
      };

      if (req.file) {
        dataUpdate.thumbnail_url = "/images/" + req.file.filename;
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
};
