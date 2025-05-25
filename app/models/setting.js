const db = require("../../connect-mysql");

const util = require("util");
const query = util.promisify(db.query).bind(db);

module.exports = {
  async getDs() {
    let sql = "SELECT * FROM banners";
    return await query(sql);
  },

  async getAll(search, offset, limit) {
    let sql = "SELECT * FROM banners";
    if (search) sql += ` WHERE title LIKE '%${search}%'`; // nếu có từ khóa
    sql += ` ORDER BY id DESC LIMIT ${offset}, ${limit}`; // phân trang
    return await query(sql);
  },

  //  Lấy tổng số dòng (dùng để phân trang)
  async getTotalRow(search) {
    let sql = "SELECT COUNT(*) AS totalRow FROM banners";
    if (search) sql += ` WHERE title LIKE '%${search}%'`; // điều kiện tìm kiếm
    const result = await query(sql);
    return result[0].totalRow; // trả về tổng số dòng
  },

  //  Lấy chi tiết 1 khóa học theo ID
  async getById(id) {
    const result = await query("SELECT * FROM banners WHERE id = ?", [id]);
    return result[0]; // trả về 1 object duy nhất
  },

  //  Thêm khóa học mới
  async create(doc) {
    const sql = `
      INSERT INTO banners (title, description, content_type, content_url, difficulty_level, hsk_level, category, word_count,duration,thumbnail_url,is_free,price)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const values = [
      doc.title,
      doc.description,
      doc.content_type,
      doc.content_url,
      doc.difficulty_level,
      doc.hsk_level,
      doc.category,
      doc.word_count,
      doc.duration,
      doc.thumbnail_url,
      doc.is_free,
      doc.price,
    ];
    return await query(sql, values);
  },

  //  Cập nhật khóa học
  async update(id, data) {
    const sql = `UPDATE banners SET ? WHERE id = ?`;
    return await query(sql, [data, id]);
  },

  // Xóa khóa học
  async delete(id) {
    return await query("DELETE FROM banners WHERE id = ?", [id]);
  },

  // Kiểm tra trùng tiêu đề khi sửa
  async checkDuplicateTitle(title, id) {
    const result = await query(
      `SELECT * FROM banners WHERE title = ? AND id != ?`,
      [title, id]
    );
    return result.length > 0;
  },
};
