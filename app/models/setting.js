const db = require("../../connect-mysql");

const util = require("util");
const query = util.promisify(db.query).bind(db);

module.exports = {
  /// bảng setting
  async getAll(search, offset, limit) {
    let sql = "SELECT * FROM settings";
    if (search) sql += ` WHERE note LIKE '%${search}%'`; // nếu có từ khóa
    sql += ` ORDER BY id DESC LIMIT ${offset}, ${limit}`; // phân trang
    return await query(sql);
  },
  async getTotalRow(search) {
    let sql = "SELECT COUNT(*) AS totalRow FROM settings";
    if (search) sql += ` WHERE note LIKE '%${search}%'`; // điều kiện tìm kiếm
    const result = await query(sql);
    return result[0].totalRow; // trả về tổng số dòng
  },
  async getById(id) {
    const result = await query("SELECT * FROM settings  WHERE id = ?", [id]);
    return result[0]; // trả về 1 object duy nhất
  },
  async update(id, data) {
    const sql = `UPDATE settings SET ? WHERE id = ?`;
    return await query(sql, [data, id]);
  },
};
