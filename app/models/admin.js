const pool = require("../../connect-mysql");

module.exports = {
  // Kiểm tra admin theo email (dùng cho đăng nhập)
  async check_emaill(email) {
    const sql = "SELECT * FROM admins WHERE email = ?";
    const [rows] = await pool.query(sql, [email]);
    return rows[0]; // Trả về admin đầu tiên tìm thấy hoặc undefined
  },

  // Lấy danh sách tất cả admin
  async getDs() {
    let sql = "SELECT * FROM admins";
    const [rows] = await pool.query(sql);
    return rows;
  },

  // Lấy danh sách admin (có phân trang và tìm kiếm)
  async getAll(search, offset, limit) {
    let sql = "SELECT * FROM admins";
    if (search && search.trim()) sql += " WHERE username LIKE ?"; // nếu có từ khóa
    
    // Xử lý offset và limit an toàn
    const safeOffset = parseInt(offset) || 0;
    const safeLimit = parseInt(limit) || 10;
    
    sql += " ORDER BY admin_id DESC LIMIT ?, ?"; // phân trang với prepared statement
    const params = search && search.trim() ? [`%${search.trim()}%`, safeOffset, safeLimit] : [safeOffset, safeLimit];
    const [rows] = await pool.query(sql, params);
    return rows;
  },

  // Lấy tổng số dòng (dùng để phân trang)
  async getTotalRow(search) {
    let sql = "SELECT COUNT(*) AS totalRow FROM admins";
    if (search && search.trim()) {
      sql += " WHERE username LIKE ?"; // điều kiện tìm kiếm với prepared statement
      const [result] = await pool.query(sql, [`%${search.trim()}%`]);
      return result[0].totalRow; // trả về tổng số dòng
    } else {
      const [result] = await pool.query(sql);
      return result[0].totalRow; // trả về tổng số dòng
    }
  },

  // Lấy chi tiết 1 admin theo ID
  async getById(id) {
    const [result] = await pool.query("SELECT * FROM admins WHERE admin_id = ?", [id]);
    return result[0]; // trả về 1 object duy nhất
  },

  //  Thêm admin mới
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
    const [result] = await pool.query(sql, values);
    return result.insertId; // Trả về ID của admin vừa tạo
  },

  //  Cập nhật admin
  async update(id, data) {
    const sql = `UPDATE admins SET ? WHERE admin_id = ?`;
    const [result] = await pool.query(sql, [data, id]);
    return result.affectedRows; // Trả về số dòng bị ảnh hưởng
  },

  // Xóa admin
  async delete(id) {
    const [result] = await pool.query("DELETE FROM admins WHERE admin_id = ?", [id]);
    return result.affectedRows; // Trả về số dòng bị xóa
  },

  // Kiểm tra trùng username hoặc email khi sửa admin
  async checkDuplicateUsernameOrEmailUpdate(username, email, userId) {
    const [result] = await pool.query(
      `SELECT * FROM admins WHERE (username = ? OR email = ?) AND admin_id != ?`,
      [username, email, userId]
    );
    return result.length > 0; // Kiểm tra xem có kết quả trả về không
  },
  
  // Kiểm tra trùng username hoặc email khi tạo admin mới
  async checkDuplicateUsernameOrEmail(username, email) {
    const [result] = await pool.query(
      "SELECT * FROM admins WHERE username = ? OR email = ?",
      [username, email]
    );
    return result.length > 0; // Kiểm tra xem có kết quả trả về không
  },

  // Phương thức để kiểm tra admin_id (BẮT BUỘC cho deserializeUser)
  async check_userid(id) {
    const sql = "SELECT * FROM admins WHERE admin_id = ?";
    const [rows] = await pool.query(sql, [id]);
    return rows[0]; // Trả về admin đầu tiên tìm thấy hoặc undefined
  },
};
