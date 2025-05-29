// app/models/user.js
// Kết nối MySQL
const db = require("../../connect-mysql"); // Đây là đối tượng kết nối DB của bạn
// Dùng util để hỗ trợ async/await cho truy vấn
const util = require("util");

// Promisify db.query và bind nó với đối tượng db
// Điều này giúp bạn có thể dùng await với query(sql, values)
const query = util.promisify(db.query).bind(db);

// Export object chứa các hàm xử lý database liên quan đến users
module.exports = {
  // --- Các phương thức HIỆN CÓ của bạn (đã được định dạng lại để rõ ràng) ---

  // Lấy người dùng theo email (dùng trong LocalStrategy)
  async check_emaill(email) {
    const sql = "SELECT * FROM users WHERE email = ?";
    const rows = await query(sql, [email]);
    return rows; // Trả về mảng các hàng tìm được
  },

  // Lấy danh sách người dùng (có phân trang và tìm kiếm)
  async getAll(search, offset, limit) {
    let sql = "SELECT * FROM users";
    if (search) sql += ` WHERE username LIKE '%${search}%'`; // nếu có từ khóa
    sql += ` ORDER BY user_id DESC LIMIT ${offset}, ${limit}`; // phân trang
    const rows = await query(sql);
    return rows;
  },

  // Lấy tổng số dòng (dùng để phân trang)
  async getTotalRow(search) {
    let sql = "SELECT COUNT(*) AS totalRow FROM users";
    if (search) sql += ` WHERE username LIKE '%${search}%'`; // điều kiện tìm kiếm
    const result = await query(sql);
    return result[0].totalRow; // trả về tổng số dòng
  },

  // Lấy chi tiết 1 người dùng theo ID
  async getById(id) {
    const rows = await query("SELECT * FROM users WHERE user_id = ?", [id]);
    return rows[0]; // trả về 1 object duy nhất
  },

  // Thêm người dùng mới (đăng ký thường)
  async create(user) {
    const sql = `
      INSERT INTO users (username, email, password_hash, full_name, profile_picture, account_status, subscription_type, subscription_expiry)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const values = [
      user.username,
      user.email,
      user.password_hash,
      user.full_name,
      user.profile_picture,
      user.account_status,
      user.subscription_type,
      user.subscription_expiry,
    ];
    const result = await query(sql, values); // Lấy phần tử đầu tiên của mảng kết quả
    return result; // Trả về đối tượng kết quả INSERT (có insertId)
  },

  // Cập nhật người dùng
  async update(id, data) {
    const sql = `UPDATE users SET ? WHERE user_id = ?`;
    const result = await query(sql, [data, id]); // Lấy phần tử đầu tiên của mảng kết quả
    return result; // Trả về đối tượng kết quả UPDATE (có affectedRows)
  },

  // Xóa người dùng
  async delete(id) {
    const result = await query("DELETE FROM users WHERE user_id = ?", [id]); // Lấy phần tử đầu tiên của mảng kết quả
    return result; // Trả về đối tượng kết quả DELETE (có affectedRows)
  },

  // Kiểm tra trùng username hoặc email khi sửa
  async checkDuplicateUsernameOrEmailUpdate(username, email, userId) {
    const sql = `SELECT * FROM users WHERE (username = ? OR email = ?) AND user_id != ?`;
    const rows = await query(sql, [username, email, userId]);
    return rows.length > 0; // Trả về true nếu có kết quả trùng
  },

  // Kiểm tra trùng username hoặc email khi tạo mới
  async checkDuplicateUsernameOrEmail(username, email) {
    const sql = "SELECT * FROM users WHERE username = ? OR email = ?";
    const rows = await query(sql, [username, email]);
    return rows.length > 0; // Trả về true nếu có kết quả trùng
  },

  // --- Các phương thức MỚI/CẬP NHẬT cho Google OAuth ---

  // Phương thức để kiểm tra user_id (BẮT BUỘC cho deserializeUser)
  // Đây là hàm bị thiếu gây ra lỗi 'User.check_userid is not a function'
  async check_userid(id) {
    const sql = "SELECT * FROM users WHERE user_id = ?";
    const rows = await query(sql, [id]);
    return rows; // Deserialize cần trả về một mảng hoặc một đối tượng user, tùy cách bạn xử lý
  },

  // Lấy người dùng theo google_id
  async check_google_id(id) {
    const rows = await query("SELECT * FROM users WHERE google_id = ?", [id]);
    return rows; // Trả về mảng các hàng tìm được
  },

  // Thêm người dùng mới từ Google Profile
  async create_google_user(userData) {
    const {
      username,
      email,
      google_id,
      full_name,
      profile_picture,
      account_status = "active", // Đảm bảo các giá trị mặc định được thiết lập
      subscription_type = "free",
      subscription_expiry = null,
    } = userData;

    const sql = `
      INSERT INTO users (username, email, google_id, full_name, profile_picture, account_status, subscription_type, subscription_expiry)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const values = [
      username,
      email,
      google_id,
      full_name,
      profile_picture,
      account_status,
      subscription_type,
      subscription_expiry,
    ];

    try {
      const [insertResult] = await query(sql, values); // Dùng query đã promisify
      const insertId = insertResult.insertId;

      // Sau khi chèn, truy vấn lại để lấy toàn bộ thông tin người dùng vừa tạo
      const [rows] = await query("SELECT * FROM users WHERE user_id = ?", [
        insertId,
      ]);

      if (rows && rows.length > 0) {
        return rows[0]; // Trả về đối tượng người dùng hoàn chỉnh
      } else {
        console.error("Failed to retrieve newly created user after INSERT.");
        return null;
      }
    } catch (error) {
      console.error("Error creating Google user:", error);
      throw error;
    }
  },

  // Cập nhật google_id cho người dùng đã tồn tại
  async update_google_id_for_user(userId, googleId) {
    const sql = `
      UPDATE users
      SET google_id = ?
      WHERE user_id = ?
    `;
    try {
      const updateResult = await query(sql, [googleId, userId]); // Dùng query đã promisify
      return updateResult.affectedRows > 0; // Trả về true nếu có hàng nào được cập nhật
    } catch (error) {
      console.error("Error updating google_id for user:", error);
      throw error;
    }
  },
};
