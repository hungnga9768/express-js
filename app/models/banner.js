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
  async create(banner) {
    const sql = `
      INSERT INTO banners (title, description, image_url, link_url, display_order, is_active)
      VALUES (?, ?, ?, ?, ?, ?)
    `;
    const values = [
      banner.title,
      banner.description,
      banner.image_url,
      banner.link_url,
      banner.display_order,
      banner.is_active,
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
