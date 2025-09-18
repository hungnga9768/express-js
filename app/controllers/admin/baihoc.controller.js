const Course = require("../../models/baihoc");
const dsKhoahoc = require("../../models/khoahoc");
const baitap = require("../../models/baitap");
const lessonVocabulary = require("../../models/lesson-vocabulary");

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

  // ========================================
  // LESSON EXERCISES MANAGEMENT
  // ========================================

  // Lấy bài tập theo lesson (cho tab bài tập)
  async getExercisesByLesson(req, res) {
    try {
      const { lessonId } = req.params;
      
      if (!lessonId) {
        return res.status(400).json({
          success: false,
          message: "Lesson ID là bắt buộc"
        });
      }

      const exercises = await baitap.getByLesson(lessonId);
      
      // Thêm thống kê số câu hỏi cho mỗi bài tập
      const exercisesWithStats = await Promise.all(
        exercises.map(async (exercise) => {
          const questions = await baitap.getWithQuestions(exercise.set_id);
          return {
            ...exercise,
            question_count: questions.length
          };
        })
      );
      
      res.json({
        success: true,
        data: exercisesWithStats,
        message: "Đã tải bài tập theo lesson thành công"
      });
    } catch (error) {
      console.error("Lỗi khi lấy bài tập theo lesson:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi server khi lấy bài tập",
        error: error.message
      });
    }
  },

  // ========================================
  // LESSON VOCABULARY MANAGEMENT
  // ========================================

  // Lấy từ vựng theo lesson
  async getVocabularyByLesson(req, res) {
    try {
      const { lessonId } = req.params;
      
      if (!lessonId) {
        return res.status(400).json({
          success: false,
          message: "Lesson ID là bắt buộc"
        });
      }

      const vocabulary = await lessonVocabulary.getVocabularyByLesson(lessonId);
      
      res.json({
        success: true,
        data: vocabulary,
        message: "Đã tải từ vựng theo lesson thành công"
      });
    } catch (error) {
      console.error("Lỗi khi lấy từ vựng theo lesson:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi server khi lấy từ vựng",
        error: error.message
      });
    }
  },

  // Thêm từ vựng vào lesson
  async addVocabularyToLesson(req, res) {
    try {
      const { lessonId, wordId } = req.params;
      
      if (!lessonId || !wordId) {
        return res.status(400).json({
          success: false,
          message: "Lesson ID và Word ID là bắt buộc"
        });
      }

      // Kiểm tra xem từ đã tồn tại trong lesson chưa
      const existing = await lessonVocabulary.checkVocabularyInLesson(lessonId, wordId);
      if (existing) {
        return res.status(400).json({
          success: false,
          message: "Từ vựng đã tồn tại trong bài học này"
        });
      }

      await lessonVocabulary.addVocabularyToLesson(lessonId, wordId);
      
      res.status(201).json({
        success: true,
        message: "Đã thêm từ vựng vào bài học thành công"
      });
    } catch (error) {
      console.error("Lỗi khi thêm từ vựng vào lesson:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi server khi thêm từ vựng",
        error: error.message
      });
    }
  },

  // Xóa từ vựng khỏi lesson
  async removeVocabularyFromLesson(req, res) {
    try {
      const { lessonId, wordId } = req.params;
      
      if (!lessonId || !wordId) {
        return res.status(400).json({
          success: false,
          message: "Lesson ID và Word ID là bắt buộc"
        });
      }

      const result = await lessonVocabulary.removeVocabularyFromLesson(lessonId, wordId);
      
      if (result.affectedRows === 0) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy từ vựng trong bài học này"
        });
      }
      
      res.json({
        success: true,
        message: "Đã xóa từ vựng khỏi bài học thành công"
      });
    } catch (error) {
      console.error("Lỗi khi xóa từ vựng khỏi lesson:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi server khi xóa từ vựng",
        error: error.message
      });
    }
  },

  // Tìm kiếm từ vựng
  async searchVocabulary(req, res) {
    try {
      const { q } = req.query;
      
      if (!q || q.trim().length < 2) {
        return res.status(400).json({
          success: false,
          message: "Từ khóa tìm kiếm phải có ít nhất 2 ký tự"
        });
      }

      const vocabulary = await lessonVocabulary.searchVocabulary(q.trim());
      
      res.json({
        success: true,
        data: vocabulary,
        message: "Tìm kiếm từ vựng thành công"
      });
    } catch (error) {
      console.error("Lỗi khi tìm kiếm từ vựng:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi server khi tìm kiếm từ vựng",
        error: error.message
      });
    }
  },

  // ========================================
  // LESSON STATISTICS & OVERVIEW
  // ========================================

  // Lấy thống kê tổng quan của lesson
  async getLessonOverview(req, res) {
    try {
      const { lessonId } = req.params;
      
      if (!lessonId) {
        return res.status(400).json({
          success: false,
          message: "Lesson ID là bắt buộc"
        });
      }

      // Lấy thông tin lesson
      const lesson = await Course.getById(lessonId);
      if (!lesson) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy bài học"
        });
      }

      // Lấy thống kê bài tập
      const exercises = await baitap.getByLesson(lessonId);
      const exerciseCount = exercises.length;
      
      let totalQuestions = 0;
      for (const exercise of exercises) {
        const questions = await baitap.getWithQuestions(exercise.set_id);
        totalQuestions += questions.length;
      }

      // Lấy thống kê từ vựng
      const vocabularyStats = await lessonVocabulary.getVocabularyStats(lessonId);

      const overview = {
        lesson: {
          lesson_id: lesson.lesson_id,
          title: lesson.title,
          content_type: lesson.content_type,
          duration: lesson.duration,
          is_preview: lesson.is_preview
        },
        exercises: {
          total_sets: exerciseCount,
          total_questions: totalQuestions
        },
        vocabulary: vocabularyStats
      };
      
      res.json({
        success: true,
        data: overview,
        message: "Đã tải thống kê lesson thành công"
      });
    } catch (error) {
      console.error("Lỗi khi lấy thống kê lesson:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi server khi lấy thống kê",
        error: error.message
      });
    }
  }
};
