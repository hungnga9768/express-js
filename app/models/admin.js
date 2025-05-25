const db = require("../../connect-mysql");
const util = require("util");
const query = util.promisify(db.query).bind(db);
module.exports = {
  // 检查有电子邮箱吗
  async check_emaill(email) {
    const sql = "SELECT * FROM admins WHERE email = ?";
    return await query(sql, [email]);
  },
  async getDs() {
    let sql = "SELECT * FROM admins";
    return await query(sql);
  },
  //  Lấy danh sách khóa học (có phân trang và tìm kiếm)
  async getAll(search, offset, limit) {
    let sql = "SELECT * FROM admins";
    if (search) sql += ` WHERE username LIKE '%${search}%'`; // nếu có từ khóa
    sql += ` ORDER BY admin_id DESC LIMIT ${offset}, ${limit}`; // phân trang
    return await query(sql);
  },

  //  Lấy tổng số dòng (dùng để phân trang)
  async getTotalRow(search) {
    let sql = "SELECT COUNT(*) AS totalRow FROM admins";
    if (search) sql += ` WHERE username LIKE '%${search}%'`; // điều kiện tìm kiếm
    const result = await query(sql);
    return result[0].totalRow; // trả về tổng số dòng
  },

  //  Lấy chi tiết 1 khóa học theo ID
  async getById(id) {
    const result = await query("SELECT * FROM admins WHERE admin_id = ?", [id]);
    return result[0]; // trả về 1 object duy nhất
  },

  //  Thêm khóa học mới
  async create(user) {
    const sql = `
      INSERT INTO admins (username, email, password_hash, full_name, avatar, role, status)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    const values = [
      user.username,
      user.email,
      user.password_hash,
      user.full_name,
      user.avatar,
      user.role,
      user.status,
    ];
    return await query(sql, values);
  },

  //  Cập nhật khóa học
  async update(id, data) {
    const sql = `UPDATE admins SET ? WHERE admin_id = ?`;
    return await query(sql, [data, id]);
  },

  // Xóa khóa học
  async delete(id) {
    return await query("DELETE FROM admins WHERE admin_id = ?", [id]);
  },

  // Kiểm tra trùng tiêu đề khi sửa
  async checkDuplicateUsernameOrEmailUpdate(username, email, userId) {
    return new Promise((resolve, reject) => {
      db.query(
        `SELECT * FROM admins WHERE (username = ? OR email = ?) AND admin_id != ?`,
        [username, email, userId],
        (err, rows) => {
          if (err) return reject(err);
          resolve(rows.length > 0); // Kiểm tra xem có kết quả trả về không
        }
      );
    });
  },
  // Kiểm tra trùng tiêu đề khi create
  async checkDuplicateUsernameOrEmail(username, email) {
    return new Promise((resolve, reject) => {
      db.query(
        "SELECT * FROM admins WHERE username = ? OR email = ?",
        [username, email],
        (err, rows) => {
          if (err) return reject(err);

          resolve(rows.length > 0); // Kiểm tra xem có kết quả trả về không
        }
      );
    });
  },
};
