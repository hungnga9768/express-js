const lessons = require("../../models/baihoc");
const dsKhoahoc = require("../../models/khoahoc");
module.exports = {
  // Trang danh sách khóa học với phân trang & tìm kiếm
  async index(req, res) {
    const search = req.query.search || "";
    // const page = parseInt(req.query.page) || 1;
    // const limit = 5;
    // const totalRow = await lessons.getTotalRow(search);
    // const totalPage = Math.ceil(totalRow / limit);
    // const baihocPage = Math.min(Math.max(page, 1), totalPage);
    // const offset = (baihocPage - 1) * limit;
    const data = await lessons.getDs(search);
    console.log(data);
    res.send({
      data: data ? data : [],
      message: "lấy dữ liệu thành công",
      code: 200,
    });
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
      };
      await lessons.create(newCourse);
      res.send({
        data: req.body,
        message: " thêm khóa học thành công ",
        code: 200,
      });
    } catch (err) {
      return res.send("error", {
        data: "",
        message: "Lỗi thêm khóa học",
        code: 200,
      });
    }
  },

  // Trang form chỉnh sửa khóa học
  async showEditForm(req, res) {
    const id = req.params.id;
    const lesson = await lessons.getById(id);
    if (!lesson) {
      return res.send({ message: "Không tìm thấy bài học" });
    }
    res.send({ data: lesson, message: " get dữ liệu thành công", code: 200 });
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
      } = req.body;
      const is_preview = req.body.is_preview === "1" ? true : false;
      //check co khoa hoc nua khong
      const lesson = await lessons.getById(id);
      if (!lesson) {
        res.send({
          data: "",
          message: " Không tìm thấy bài học để sửa ",
          code: 404,
        });
      }
      //data update
      const isDuplicate = await lessons.checkDuplicateTitle(title, id);
      if (isDuplicate) {
        return res.send("teen trung roi moi nhap lai ten");
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
      };
      const data = dataUpdate;
      data.lesson_id = id;
      //goivà truyền để update
      await lessons.update(id, dataUpdate);
      res.send({ data: data, message: " thanh cong ", code: 200 });
    } catch (err) {
      console.error("Lỗi cập nhật:", err);
      return res.send("error");
    }
  },

  // Xử lý xóa khóa học
  async remove(req, res) {
    const id = req.params.id; //lấy req id trên urlurl
    const lesson = await lessons.getById(id);
    if (!lesson) {
      res.send({
        data: "",
        message: " Không tìm thấy bài học để xóa ",
        code: 404,
      });
    } else {
      await lessons.delete(id); //gọi model xử lí
      res.send({
        data: lesson,
        message: " xóa dữ liệu thành công ",
        code: 200,
      });
    }
  },
};
