const dsBaitap = require("../../models/baitap");
const dsBaihoc = require("../../models/baihoc");
const db = require("../../../connect-mysql");
module.exports = {
  // Trang danh sách baitap với phân trang & tìm kiếm
  async index(req, res) {
    const search = req.query.search || "";
    const page = parseInt(req.query.page) || 1;
    const limit = 5;
    const totalRow = await dsBaitap.getTotalRow(search);
    const totalPage = Math.ceil(totalRow / limit);
    const Page = Math.min(Math.max(page, 1), totalPage);
    const offset = (Page - 1) * limit;
    const data = await dsBaitap.getAll(search, offset, limit);
    const listbaihoc = await dsBaihoc.getDs();
    res.render("ds-baitap", {
      title: "Danh sách bài tập",
      data,
      totalPage,
      Page,
      search,
      listbaihoc,
    });
  },

  // Trang form thêm bài tập
  async showAddForm(req, res) {
    const { exercise_set_id } = req.query;
    const lessons = await dsBaihoc.getDs();
    const exerciseSet = exercise_set_id
      ? await dsBaitap.getById(exercise_set_id)
      : null;
    res.render("add-baitap", {
      title: "Thêm mới bài tập",
      message: "",
      lessons,
      exerciseSet,
    });
  },
  // trang them moi bai tap lơn
  // Trang tạo mới bài tập
  async create(req, res) {
    try {
      const { exercise_set_id, lesson_id, title, description } = req.body;
      const newbaitap = {
        exercise_set_id,
        lesson_id,
        title,
        description,
      };
      const id_baitap = await dsBaitap.create(newbaitap);
      res.redirect(`/admin/baitap/edit/${id_baitap.insertId}`);
    } catch (error) {
      console.error("Lỗi cập nhật:", error);
      return res.render("error", {
        message: "Cập nhật thất bại",
      });
    }
  },
  // add câu hỏi
  async createcauhoi(req, res) {
    try {
      const {
        exercise_set_id,
        exercise_type,
        question,
        correct_answer,
        optionA,
        optionB,
        optionC,
        optionD,
        explanation,
      } = req.body;

      const options = [optionA, optionB, optionC, optionD].filter(
        (opt) => opt && opt.trim() !== ""
      );

      const data = {
        exercise_set_id,
        exercise_type,
        question,
        correct_answer,
        options: options.length ? JSON.stringify(options) : null,
        explanation,
      };

      await dsBaitap.createcauhoi(data);
      res.redirect(`/admin/baitap/edit/${exercise_set_id}`);
    } catch (err) {
      console.error("Lỗi thêm câu hỏi:", err);
      res.status(500).send("Lỗi khi thêm câu hỏi.");
    }
  },

  // Xử lý thêm baitapbaitap

  // Trang form chỉnh sửa khóa học
  async showEditForm(req, res) {
    const id = req.params.id;
    const baitap = await dsBaitap.getById(id);
    const baihoc = await dsBaihoc.getDs();
    const listcauhoi = (await dsBaitap.getDscauhoi(id)) || [];
    if (!baitap) {
      return res.render("error", { message: "Không tìm thấy bài học" });
    }
    res.render("edit-baitap", {
      title: "Chỉnh sửa bài tập",
      baitap,
      baihoc,
      listcauhoi,
    });
  },

  // Xử lý cập nhật bai tap
  async update(req, res) {
    try {
      const id = req.params.id;
      const { lesson_id, title, description } = req.body;
      //data update
      const dataUpdate = {
        lesson_id,
        title,
        description,
      };
      //goivà truyền để update
      await dsBaitap.update(id, dataUpdate);
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
      await dsBaitap.delete(id); //gọi model xử lí
      console.log("Đã xóa bài hoc ID:", id);
      res.redirect("/admin/baitap/danhsach");
    } catch (err) {
      console.error("Lỗi xóa:", err);
      res.status(500).send("Xóa thất bại");
    }
  },
  async removecauhoi(req, res) {
    const id = req.params.id; //lấy req id trên urlurl
    try {
      const listcauhoi = await dsBaitap.getIdcauhoi(id);
      await dsBaitap.deletecauhoi(id); //gọi model xử lí
      console.log("Đã xóa bài hoc ID:", id);
      res.redirect(`/admin/baitap/edit/${listcauhoi.exercise_set_id}`);
    } catch (err) {
      console.error("Lỗi xóa:", err);
      res.status(500).send("Xóa thất bại");
    }
  },
};
