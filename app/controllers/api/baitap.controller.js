const baitap = require("../../models/baitap");

module.exports = {
  // Trang danh sách khóa học với phân trang & tìm kiếm
  async index(req, res) {
    try {
      const rows = await baitap.getExerciseSetsWithQuestions();
      console.log(rows);

      // Gom nhóm các bài tập theo exercise_set_id
      const result = [];
      const map = {};

      for (const row of rows) {
        if (!map[row.exercise_set_id]) {
          map[row.exercise_set_id] = {
            exercise_set_id: row.exercise_set_id,
            lesson_id: row.lesson_id,
            title: row.title,
            description: row.description,
            questions: [],
          };
          result.push(map[row.exercise_set_id]);
        }

        if (row.exercise_id) {
          map[row.exercise_set_id].questions.push({
            exercise_id: row.exercise_id,
            exercise_type: row.exercise_type,
            question: row.question,
            options: (() => {
              if (!row.options) return null;
              if (typeof row.options === "string") {
                try {
                  return JSON.parse(row.options);
                } catch {
                  return row.options.split(",");
                }
              }
              return row.options;
            })(),
            correct_answer: row.correct_answer,
            explanation: row.explanation,
          });
        }
      }

      res.status(200).json({
        code: 200,
        message: "Thành công",
        data: result,
      });
    } catch (err) {
      console.error("Lỗi khi lấy bài tập:", err);
      res.status(500).send("Lỗi server");
    }
  },
};
