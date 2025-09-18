const dsBaitap = require("../../models/baitap");
const dsBaihoc = require("../../models/baihoc");
const db = require("../../../connect-mysql");

// Helper: normalize and validate exercise payload from form/API
function processExercisePayload(body, files) {
  const {
    set_id,
    exercise_type,
    question,
    correct_answer,
    options,
    explanation,
    // Optional granular fields from form when not sending JSON "options"
    optionA,
    optionB,
    optionC,
    optionD,
    matching_left,
    matching_right,
    drag_items,
    drop_zones,
    ordering_items,
    card_count,
    image_count,
    pair_count,
    word_limit,
  } = body;

  if (!set_id) throw new Error("set_id is required");
  if (!exercise_type) throw new Error("exercise_type is required");
  if (!question || question.trim() === "") throw new Error("question is required");

  let processedOptions = null;
  let processedCorrectAnswer = correct_answer ?? "";

  // If raw options JSON provided, trust but validate
  if (options && typeof options === "string" && options.trim() !== "") {
    try {
      processedOptions = JSON.stringify(JSON.parse(options));
    } catch (e) {
      // keep as-is (string) to avoid data loss; DB column is TEXT/JSON compatible
      processedOptions = options;
    }
  }

  // Build options when not provided as JSON, based on exercise_type
  if (!processedOptions) {
    switch (exercise_type) {
      case "multiple_choice": {
        const list = [optionA, optionB, optionC, optionD].filter((x) => x && x.trim() !== "");
        processedOptions = list.length ? JSON.stringify(list) : null;
        break;
      }
      case "matching": {
        if (matching_left && matching_right) {
          const obj = {
            left: matching_left.split(",").map((s) => s.trim()).filter(Boolean),
            right: matching_right.split(",").map((s) => s.trim()).filter(Boolean),
          };
          processedOptions = JSON.stringify(obj);
        }
        break;
      }
      case "drag_drop": {
        if (drag_items && drop_zones) {
          const obj = {
            items: drag_items.split(",").map((s) => s.trim()).filter(Boolean),
            zones: drop_zones.split(",").map((s) => s.trim()).filter(Boolean),
          };
          processedOptions = JSON.stringify(obj);
        }
        break;
      }
      case "ordering": {
        if (ordering_items) {
          const obj = {
            items: ordering_items.split(",").map((s) => s.trim()).filter(Boolean),
          };
          processedOptions = JSON.stringify(obj);
        }
        break;
      }
      case "dialog_cards": {
        const count = parseInt(card_count || "0");
        if (count > 0) {
          const cards = [];
          for (let i = 1; i <= count; i++) {
            const front = body[`card_${i}_front`];
            const back = body[`card_${i}_back`];
            if (front || back) cards.push({ id: i, front: front || "", back: back || "" });
          }
          processedOptions = cards.length ? JSON.stringify(cards) : null;
        }
        break;
      }
      case "image_sequencing": {
        const count = parseInt(image_count || "0");
        if (count > 0) {
          const imgs = [];
          for (let i = 1; i <= count; i++) {
            const text = body[`seq_image_${i}_text`];
            if (text) imgs.push({ id: i, text: text.trim() });
          }
          processedOptions = imgs.length ? JSON.stringify(imgs) : null;
        }
        break;
      }
      case "memory_game": {
        const count = parseInt(pair_count || "0");
        if (count > 0) {
          const pairs = [];
          for (let i = 1; i <= count; i++) {
            const item1 = body[`pair_${i}_item1`];
            const item2 = body[`pair_${i}_item2`];
            if (item1 || item2) pairs.push({ id: i, item1: item1 || "", item2: item2 || "" });
          }
          processedOptions = pairs.length ? JSON.stringify(pairs) : null;
        }
        break;
      }
      case "writing": {
        const cfg = { word_limit: word_limit ? parseInt(word_limit) : null };
        processedOptions = JSON.stringify(cfg);
        processedCorrectAnswer = correct_answer || "";
        break;
      }
      // true_false, fill_blank, image_choice handled by frontend as needed
      default:
        break;
    }
  }

  // Normalize correct_answer by type
  if (processedCorrectAnswer && typeof processedCorrectAnswer === "string" &&
      (processedCorrectAnswer.startsWith("{") || processedCorrectAnswer.startsWith("["))) {
    try {
      processedCorrectAnswer = JSON.stringify(JSON.parse(processedCorrectAnswer));
    } catch (e) {
      // leave as raw string
    }
  }

  // Special cases
  if (exercise_type === "fill_blank") {
    if (!processedCorrectAnswer || processedCorrectAnswer === "[]") {
      processedCorrectAnswer = "[]";
    } else if (typeof processedCorrectAnswer === "string" && !processedCorrectAnswer.startsWith("[")) {
      const arr = processedCorrectAnswer.split(",").map((s) => s.trim()).filter(Boolean);
      processedCorrectAnswer = JSON.stringify(arr);
    }
  }

  // Media files (generic, stored as JSON)
  const media = {};
  if (files) {
    if (files.media_image && files.media_image[0]) media.image = files.media_image[0].filename;
    if (files.media_audio && files.media_audio[0]) media.audio = files.media_audio[0].filename;
  }

  return {
    set_id: parseInt(set_id),
    exercise_type,
    question: question.trim(),
    correct_answer: processedCorrectAnswer ?? "",
    options: processedOptions,
    explanation: explanation ? String(explanation).trim() : null,
    media: Object.keys(media).length > 0 ? JSON.stringify(media) : null,
    order_in_set: 0,
  };
}
module.exports = {
  // Trang danh sách baitap với phân trang & tìm kiếm
  async index(req, res) {
    const search = req.query.search || "";
    const page = parseInt(req.query.page) || 1;
    const limit = 10;
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
    const { set_id } = req.query;
    const lessons = await dsBaihoc.getDs();
    const exerciseSet = set_id
      ? await dsBaitap.getById(set_id)
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
      const { set_id, lesson_id, title, description } = req.body;
      const newbaitap = {
        lesson_id,
        title,
        description,
      };
      const id_baitap = await dsBaitap.create(newbaitap);
      res.redirect(`/admin/baitap/edit/${id_baitap}`);
    } catch (error) {
      console.error("Lỗi cập nhật:", error);
      return res.render("error", {
        message: "Cập nhật thất bại",
      });
    }
  },
  // add câu hỏi - Enhanced for all exercise types
  async createcauhoi(req, res) {
    try {
      const data = processExercisePayload(req.body, req.files);
      await dsBaitap.createcauhoi(data);
      res.redirect(`/admin/baitap/edit/${data.set_id}`);
    } catch (err) {
      console.error("Lỗi thêm câu hỏi:", err);
      res.status(500).send("Lỗi khi thêm câu hỏi: " + err.message);
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
  // Show edit form for individual question
  async showEditCauhoiForm(req, res) {
    try {
      const id = req.params.id;
      const cauhoi = await dsBaitap.getIdcauhoi(id);
      const baitap = await dsBaitap.getById(cauhoi.set_id);
      
      if (!cauhoi) {
        return res.render("error", { message: "Không tìm thấy câu hỏi" });
      }

      res.render("edit-cauhoi", {
        title: "Sửa câu hỏi",
        cauhoi,
        baitap
      });
    } catch (err) {
      console.error("Lỗi hiển thị form sửa câu hỏi:", err);
      res.status(500).send("Lỗi hiển thị form");
    }
  },

  // Update individual question
  async updatecauhoi(req, res) {
    try {
      const id = req.params.id;
      const current = await dsBaitap.getIdcauhoi(id);
      if (!current) throw new Error("Câu hỏi không tồn tại");

      const normalized = processExercisePayload({ ...req.body, set_id: current.set_id }, req.files);
      const updateData = {
        exercise_type: normalized.exercise_type,
        question: normalized.question,
        correct_answer: normalized.correct_answer,
        options: normalized.options,
        explanation: normalized.explanation,
        media: normalized.media,
      };

      await dsBaitap.updatecauhoi(id, updateData);
      res.redirect(`/admin/baitap/edit/${current.set_id}`);
    } catch (err) {
      console.error("Lỗi cập nhật câu hỏi:", err);
      res.status(500).send("Lỗi khi cập nhật câu hỏi: " + err.message);
    }
  },

  // ===== JSON APIs for admin tooling / integration =====
  async apiGetSet(req, res) {
    try {
      const id = parseInt(req.params.id);
      const set = await dsBaitap.getById(id);
      if (!set) return res.status(404).json({ success: false, message: "Exercise set not found" });
      const questions = await dsBaitap.getDscauhoi(id);
      res.json({ success: true, data: { set, questions } });
    } catch (e) {
      res.status(500).json({ success: false, message: e.message });
    }
  },

  async apiGetQuestion(req, res) {
    try {
      const id = parseInt(req.params.id);
      const q = await dsBaitap.getIdcauhoi(id);
      if (!q) return res.status(404).json({ success: false, message: "Question not found" });
      res.json({ success: true, data: q });
    } catch (e) {
      res.status(500).json({ success: false, message: e.message });
    }
  },

  async apiReorderQuestions(req, res) {
    try {
      const { set_id, order } = req.body; // order: array of { exercise_id, order_in_set }
      if (!set_id || !Array.isArray(order)) return res.status(400).json({ success: false, message: "Invalid payload" });
      const conn = await db.getConnection();
      try {
        await conn.beginTransaction();
        for (const item of order) {
          await conn.query("UPDATE exercises SET order_in_set = ? WHERE exercise_id = ? AND set_id = ?", [item.order_in_set, item.exercise_id, set_id]);
        }
        await conn.commit();
      } catch (e) {
        await conn.rollback();
        throw e;
      } finally {
        conn.release();
      }
      res.json({ success: true });
    } catch (e) {
      res.status(500).json({ success: false, message: e.message });
    }
  },

  async apiDeleteQuestion(req, res) {
    try {
      const id = parseInt(req.params.id);
      await dsBaitap.deletecauhoi(id);
      res.json({ success: true });
    } catch (e) {
      res.status(500).json({ success: false, message: e.message });
    }
  },

  async removecauhoi(req, res) {
    const id = req.params.id; //lấy req id trên urlurl
    try {
      const listcauhoi = await dsBaitap.getIdcauhoi(id);
      await dsBaitap.deletecauhoi(id); //gọi model xử lí
      console.log("Đã xóa bài hoc ID:", id);
      res.redirect(`/admin/baitap/edit/${listcauhoi.set_id}`);
    } catch (err) {
      console.error("Lỗi xóa:", err);
      res.status(500).send("Xóa thất bại");
    }
  },

  // ========================================
  // AJAX API METHODS
  // ========================================

  // Tạo bài tập qua AJAX
  async createViaAjax(req, res) {
    try {
      const { title, lesson_id, description } = req.body;
      
      if (!title || !lesson_id) {
        return res.status(400).json({
          success: false,
          message: "Tiêu đề và lesson_id là bắt buộc"
        });
      }

      // Tạo exercise set mới
      const newExerciseSet = {
        title: title.trim(),
        lesson_id: parseInt(lesson_id),
        description: description ? description.trim() : null,
        created_at: new Date()
      };

      const result = await dsBaitap.create(newExerciseSet);
      
      res.status(201).json({
        success: true,
        message: "Đã tạo bài tập thành công",
        data: {
          set_id: result.insertId,
          ...newExerciseSet
        }
      });
    } catch (error) {
      console.error("Lỗi tạo bài tập qua AJAX:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi server khi tạo bài tập",
        error: error.message
      });
    }
  },

  // Lấy chi tiết bài tập qua AJAX
  async getExerciseDetails(req, res) {
    try {
      const { id } = req.params;
      
      const exercise = await dsBaitap.getById(id);
      if (!exercise) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy bài tập"
        });
      }

      // Lấy danh sách câu hỏi
      const questions = await dsBaitap.getWithQuestions(id);
      
      res.json({
        success: true,
        data: {
          ...exercise,
          questions: questions,
          question_count: questions.length
        }
      });
    } catch (error) {
      console.error("Lỗi lấy chi tiết bài tập:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi server khi lấy chi tiết bài tập",
        error: error.message
      });
    }
  },

  // Xóa bài tập qua AJAX
  async deleteViaAjax(req, res) {
    try {
      const { id } = req.params;
      
      // Kiểm tra bài tập có tồn tại không
      const exercise = await dsBaitap.getById(id);
      if (!exercise) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy bài tập"
        });
      }

      await dsBaitap.delete(id);
      
      res.json({
        success: true,
        message: "Đã xóa bài tập thành công"
      });
    } catch (error) {
      console.error("Lỗi xóa bài tập qua AJAX:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi server khi xóa bài tập",
        error: error.message
      });
    }
  }
};
