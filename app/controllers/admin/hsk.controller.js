const hskModel = require("../../models/hsk");

module.exports = {
  async index(req, res) {
    try {
      const { search = "", level = "", page = 1, limit = 20 } = req.query;
      const offset = (parseInt(page) - 1) * parseInt(limit);
      const [rows, total] = await Promise.all([
        hskModel.getTests({ search, level: level || null, offset, limit: parseInt(limit) }),
        hskModel.getTestsTotal({ search, level: level || null })
      ]);
      const totalPages = Math.max(1, Math.ceil(total / parseInt(limit)));
      res.render("ds-hsktests", {
        title: "Quản lý đề thi HSK",
        data: rows,
        search, level,
        Page: parseInt(page),
        totalPage: totalPages
      });
    } catch (e) {
      console.error(e);
      res.status(500).render("error", { message: "Lỗi tải danh sách đề thi" });
    }
  },

  async createForm(req, res) {
    res.render("add-hsktest", { title: "Thêm đề HSK", test: null });
  },

  async create(req, res) {
    try {
      const b = req.body;
      const payload = {
        hsk_level: parseInt(b.hsk_level),
        title: b.title,
        description: b.description || null,
        total_questions: parseInt(b.total_questions || 0),
        time_limit: b.time_limit ? parseInt(b.time_limit) : null,
        passing_score: parseInt(b.passing_score || 0),
        randomize_questions: b.randomize_questions ? 1 : 0
      };
      const r = await hskModel.createTest(payload);
      return res.redirect(`/admin/hsk/${r.insertId}/questions`);
    } catch (e) {
      console.error(e);
      res.status(500).render("add-hsktest", { title: "Thêm đề HSK", error: "Không tạo được đề thi", test: req.body });
    }
  },

  async editForm(req, res) {
    const test = await hskModel.getTestById(req.params.id);
    if (!test) return res.status(404).render("error", { message: "Không tìm thấy đề" });
    res.render("add-hsktest", { title: "Sửa đề HSK", test });
  },

  async update(req, res) {
    try {
      const b = req.body;
      const payload = {
        hsk_level: parseInt(b.hsk_level),
        title: b.title,
        description: b.description || null,
        total_questions: parseInt(b.total_questions || 0),
        time_limit: b.time_limit ? parseInt(b.time_limit) : null,
        passing_score: parseInt(b.passing_score || 0),
        randomize_questions: b.randomize_questions ? 1 : 0
      };
      await hskModel.updateTest(req.params.id, payload);
      res.redirect("/admin/hsk?success=1");
    } catch (e) {
      console.error(e);
      res.status(500).render("add-hsktest", { title: "Sửa đề HSK", error: "Không cập nhật được đề", test: { ...req.body, test_id: req.params.id } });
    }
  },

  async delete(req, res) {
    try {
      await hskModel.deleteTest(req.params.id);
      res.redirect("/admin/hsk?deleted=1");
    } catch (e) {
      console.error(e);
      res.status(500).render("error", { message: "Không xóa được đề" });
    }
  },

  async toggleRandomize(req, res) {
    try {
      const { id } = req.params;
      const { value } = req.body; // '1' or '0'
      await hskModel.setRandomize(id, value === "1");
      res.redirect("/admin/hsk");
    } catch (e) {
      console.error(e);
      res.status(500).render("error", { message: "Không cập nhật trộn đề" });
    }
  },

  async questionsPage(req, res) {
    const testId = req.params.testId;
    const test = await hskModel.getTestById(testId);
    if (!test) return res.status(404).render("error", { message: "Không tìm thấy đề" });
    const questions = await hskModel.getQuestionsByTest(testId);
    res.render("hsk-questions", { title: `Câu hỏi - ${test.title}`, test, questions });
  },

  async createQuestion(req, res) {
    try {
      const { testId } = req.params;
      const b = req.body;
      let options = [];
      let correct_answer = "";
      let matching_pairs = null, ordering_items = null, rewrite_instruction = null;

      if (b.question_type === "multiple_choice") {
        // Gom các lựa chọn thành mảng
        options = [b.option_A, b.option_B, b.option_C, b.option_D].filter(Boolean);
        correct_answer = b.correct_answer;
        // Truyền options dưới dạng mảng vào model, model sẽ lưu JSON.stringify(options)
      } else if (b.question_type === "fill_blank" || b.question_type === "cloze") {
        // Xử lý các ô trống động
        let count = 1;
        let blanks = [];
        let answers = [];
        while (b[`option_${count}_A`] || b[`option_${count}_B`] || b[`option_${count}_C`] || b[`option_${count}_D`]) {
          blanks.push([
            b[`option_${count}_A`] || "",
            b[`option_${count}_B`] || "",
            b[`option_${count}_C`] || "",
            b[`option_${count}_D`] || ""
          ]);
          answers.push(b[`correct_answer_${count}`] || "");
          count++;
        }
        options = blanks;
        correct_answer = answers.join(',');
      } else if (b.question_type === "matching") {
        matching_pairs = b.matching_pairs ? b.matching_pairs.split('\n').map(line => {
          const [left, right] = line.split('-').map(s => s.trim());
          return { left, right };
        }) : null;
        correct_answer = b.correct_answer || "";
      } else if (b.question_type === "ordering") {
        ordering_items = b.ordering_items ? b.ordering_items.split('\n').map(s => s.trim()).filter(Boolean) : null;
        correct_answer = b.correct_answer || "";
      } else if (b.question_type === "rewrite") {
        rewrite_instruction = b.rewrite_instruction || "";
        correct_answer = b.correct_answer || "";
      } else if (b.question_type === "true_false") {
        correct_answer = b.correct_answer || "";
      }

      await hskModel.createQuestion(testId, {
        skill_type: b.skill_type,
        question_type: b.question_type,
        question_text: b.question_text,
        audio_url: b.audio_url || null,
        image_url: b.image_url || null,
        options,
        correct_answer,
        explanation: b.explanation || null,
        difficulty_level: b.difficulty_level || "easy",
        points: parseInt(b.points || 1),
        order_in_test: parseInt(b.order_in_test || 0),
        matching_pairs,
        ordering_items,
        rewrite_instruction
      });
      res.redirect(`/admin/hsk/${testId}/questions`);
    } catch (e) {
      console.error(e);
      res.status(500).render("error", { message: "Không thêm được câu hỏi" });
    }
  },

  async updateQuestion(req, res) {
    try {
      const { testId, questionId } = req.params;
      const b = req.body;
      const payload = {
        question_type: b.question_type,
        question_text: b.question_text,
        audio_url: b.audio_url || null,
        image_url: b.image_url || null,
        correct_answer: b.correct_answer || null,
        explanation: b.explanation || null,
        difficulty_level: b.difficulty_level || "easy",
        points: parseInt(b.points || 1),
        order_in_test: parseInt(b.order_in_test || 0),
        rewrite_instruction: b.rewrite_instruction || null
      };
      if (b.options_text !== undefined) {
        payload.options = (b.options_text || "").split("\n").map(s => s.trim()).filter(Boolean);
      }
      if (b.matching_pairs) {
        payload.matching_pairs = b.matching_pairs.split('\n').map(line => {
          const [left, right] = line.split('-').map(s => s.trim());
          return { left, right };
        });
      }
      if (b.ordering_items) {
        payload.ordering_items = b.ordering_items.split('\n').map(s => s.trim()).filter(Boolean);
      }
      await hskModel.updateQuestion(questionId, payload);
      res.redirect(`/admin/hsk/${testId}/questions`);
    } catch (e) {
      console.error(e);
      res.status(500).render("error", { message: "Không sửa được câu hỏi" });
    }
  },

  async deleteQuestion(req, res) {
    try {
      const { testId, questionId } = req.params;
      await hskModel.deleteQuestion(questionId);
      res.redirect(`/admin/hsk/${testId}/questions`);
    } catch (e) {
      console.error(e);
      res.status(500).render("error", { message: "Không xóa được câu hỏi" });
    }
  },

  async reorderQuestions(req, res) {
    try {
      const { testId } = req.params;
      const orders = JSON.parse(req.body.orders || "[]");
      await hskModel.reorderQuestions(testId, orders);
      res.redirect(`/admin/hsk/${testId}/questions`);
    } catch (e) {
      console.error(e);
      res.status(500).render("error", { message: "Không sắp xếp được câu hỏi" });
    }
  }
};
