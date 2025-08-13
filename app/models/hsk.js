const db = require("../../connect-mysql");
const util = require("util");
const query = util.promisify(db.query).bind(db);

module.exports = {
  async getTests({ search, level, offset = 0, limit = 20 }) {
    let sql = "SELECT * FROM hsktests WHERE 1=1";
    const vals = [];
    if (level) {
      sql += " AND hsk_level = ?";
      vals.push(level);
    }
    if (search) {
      sql += " AND (title LIKE ? OR description LIKE ?)";
      vals.push(`%${search}%`, `%${search}%`);
    }
    sql += " ORDER BY test_id DESC LIMIT ?, ?";
    vals.push(offset, limit);
    return await query(sql, vals);
  },
  async getTestsTotal({ search, level }) {
    let sql = "SELECT COUNT(*) as total FROM hsktests WHERE 1=1";
    const vals = [];
    if (level) {
      sql += " AND hsk_level = ?";
      vals.push(level);
    }
    if (search) {
      sql += " AND (title LIKE ? OR description LIKE ?)";
      vals.push(`%${search}%`, `%${search}%`);
    }
    const r = await query(sql, vals);
    return r[0]?.total || 0;
  },
  async getTestById(id) {
    const r = await query("SELECT * FROM hsktests WHERE test_id = ?", [id]);
    return r[0];
  },
  async createTest(data) {
    const sql = `
      INSERT INTO hsktests (hsk_level, title, description, total_questions, time_limit, passing_score, randomize_questions)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    const vals = [
      data.hsk_level,
      data.title,
      data.description || null,
      data.total_questions || 0,
      data.time_limit || null,
      data.passing_score || 0,
      data.randomize_questions ? 1 : 0,
    ];
    return await query(sql, vals);
  },
  async updateTest(id, data) {
    const sql = "UPDATE hsktests SET ? WHERE test_id = ?";
    return await query(sql, [data, id]);
  },
  async deleteTest(id) {
    return await query("DELETE FROM hsktests WHERE test_id = ?", [id]);
  },
  async setRandomize(id, value) {
    return await query(
      "UPDATE hsktests SET randomize_questions = ? WHERE test_id = ?",
      [value ? 1 : 0, id]
    );
  },

  async getQuestionsByTest(testId) {
    const sql = `
      SELECT question_id, test_id, question_type, question_text, audio_url, image_url,
             options, correct_answer, explanation, difficulty_level, points, order_in_test
      FROM hskquestions
      WHERE test_id = ?
      ORDER BY order_in_test, question_id
    `;
    const rows = await query(sql, [testId]);
    return rows.map((r) => {
      try {
        r.options = r.options ? JSON.parse(r.options) : [];
      } catch {
        r.options = [];
      }
      return r;
    });
  },
  async getQuestionById(qid) {
    const r = await query("SELECT * FROM hskquestions WHERE question_id = ?", [
      qid,
    ]);
    if (!r[0]) return null;
    try {
      r[0].options = r[0].options ? JSON.parse(r[0].options) : [];
    } catch {
      r[0].options = [];
    }
    return r[0];
  },
  async createQuestion(testId, q) {
    const sql = `
      INSERT INTO HSKQuestions (
        test_id, skill_type, question_type, question_text, audio_url, image_url,
        options, correct_answer, explanation, difficulty_level, points, order_in_test,
        matching_pairs, ordering_items, rewrite_instruction
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const vals = [
      testId, q.skill_type, q.question_type, q.question_text || null, q.audio_url || null, q.image_url || null,
      JSON.stringify(q.options), q.correct_answer || "", q.explanation || null, q.difficulty_level || "easy",
      q.points || 1, q.order_in_test || 0,
      q.matching_pairs ? JSON.stringify(q.matching_pairs) : null,
      q.ordering_items ? JSON.stringify(q.ordering_items) : null,
      q.rewrite_instruction || null
    ];
    return await query(sql, vals);
  },

  async updateQuestion(qid, q) {
    const data = { ...q };
    if (Array.isArray(q.options)) data.options = JSON.stringify(q.options);
    if (Array.isArray(q.matching_pairs))
      data.matching_pairs = JSON.stringify(q.matching_pairs);
    if (Array.isArray(q.ordering_items))
      data.ordering_items = JSON.stringify(q.ordering_items);
    return await query("UPDATE hskquestions SET ? WHERE question_id = ?", [
      data,
      qid,
    ]);
  },
  async deleteQuestion(qid) {
    return await query("DELETE FROM hskquestions WHERE question_id = ?", [qid]);
  },
  async reorderQuestions(testId, orders) {
    const updates = orders.map((o) =>
      query(
        "UPDATE hskquestions SET order_in_test = ? WHERE question_id = ? AND test_id = ?",
        [o.order_in_test, o.question_id, testId]
      )
    );
    await Promise.all(updates);
    return true;
  },
};
