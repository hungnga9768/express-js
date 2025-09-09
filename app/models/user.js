const pool = require("../../connect-mysql");

// Export object chứa các hàm xử lý database liên quan đến users
module.exports = {
  // Lấy người dùng theo email (dùng trong LocalStrategy)
  async check_emaill(email) {
    const sql = "SELECT * FROM users WHERE email = ?";
    const [rows] = await pool.query(sql, [email]);
    return rows[0]; // Trả về user đầu tiên tìm thấy hoặc undefined
  },

  // Lấy danh sách người dùng (có phân trang và tìm kiếm)
  async getAll(search, offset, limit) {
    let sql = "SELECT * FROM users";
    if (search && search.trim()) {
      sql += " WHERE username LIKE ?";
    }
    
    // Xử lý offset và limit an toàn
    const safeOffset = parseInt(offset) || 0;
    const safeLimit = parseInt(limit) || 10;
    
    sql += " ORDER BY user_id DESC LIMIT ?, ?";
    const params = search && search.trim() ? [`%${search.trim()}%`, safeOffset, safeLimit] : [safeOffset, safeLimit];
    const [rows] = await pool.query(sql, params);
    return rows;
  },

  // Lấy tổng số dòng (dùng để phân trang)
  async getTotalRow(search) {
    let sql = "SELECT COUNT(*) AS totalRow FROM users";
    if (search && search.trim()) {
      sql += " WHERE username LIKE ?";
      const [result] = await pool.query(sql, [`%${search.trim()}%`]);
      return result[0].totalRow;
    } else {
      const [result] = await pool.query(sql);
      return result[0].totalRow;
    }
  },

  // Lấy chi tiết 1 người dùng theo ID
  async getById(id) {
    const [rows] = await pool.query("SELECT * FROM users WHERE user_id = ?", [id]);
    return rows[0];
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
    const [result] = await pool.query(sql, values);
    return result.insertId; // Trả về ID của user vừa tạo
  },

  // Cập nhật người dùng
  async update(id, data) {
    const sql = "UPDATE users SET ? WHERE user_id = ?";
    const [result] = await pool.query(sql, [data, id]);
    return result.affectedRows; // Trả về số dòng bị ảnh hưởng
  },

  // Xóa người dùng
  async delete(id) {
    try {
      console.log(`Bắt đầu xóa user ID: ${id}`);
      
      // Bắt đầu transaction
      const connection = await pool.getConnection();
      await connection.beginTransaction();

      try {
        // Xóa các bản ghi liên quan trước (theo thứ tự để tránh foreign key constraint)
        
        // 1. Xóa HSK user answers trước (vì nó tham chiếu đến hskresults)
        const [hskAnswersResult] = await connection.query("DELETE FROM hskuseranswers WHERE result_id IN (SELECT result_id FROM hskresults WHERE user_id = ?)", [id]);
        console.log(`Đã xóa ${hskAnswersResult.affectedRows} bản ghi HSK user answers`);
        
        // 2. Xóa HSK results
        const [hskResultsResult] = await connection.query("DELETE FROM hskresults WHERE user_id = ?", [id]);
        console.log(`Đã xóa ${hskResultsResult.affectedRows} bản ghi HSK results`);
        
        // 3. Xóa game leaderboard
        const [gameLeaderboardResult] = await connection.query("DELETE FROM gameleaderboard WHERE user_id = ?", [id]);
        console.log(`Đã xóa ${gameLeaderboardResult.affectedRows} bản ghi game leaderboard`);
        
        // 4. Xóa game sessions
        const [gameSessionsResult] = await connection.query("DELETE FROM gamesessions WHERE user_id = ?", [id]);
        console.log(`Đã xóa ${gameSessionsResult.affectedRows} bản ghi game sessions`);
        
        // 5. Xóa user game progress
        const [userGameProgressResult] = await connection.query("DELETE FROM usergameprogress WHERE user_id = ?", [id]);
        console.log(`Đã xóa ${userGameProgressResult.affectedRows} bản ghi user game progress`);
        
        // 6. Xóa pronunciation practice
        const [pronunciationResult] = await connection.query("DELETE FROM pronunciationpractice WHERE user_id = ?", [id]);
        console.log(`Đã xóa ${pronunciationResult.affectedRows} bản ghi pronunciation practice`);
        
        // 7. Xóa course enrollments
        const [enrollmentsResult] = await connection.query("DELETE FROM courseenrollments WHERE user_id = ?", [id]);
        console.log(`Đã xóa ${enrollmentsResult.affectedRows} bản ghi course enrollments`);
        
        // 8. Xóa learning progress
        const [learningProgressResult] = await connection.query("DELETE FROM learningprogress WHERE user_id = ?", [id]);
        console.log(`Đã xóa ${learningProgressResult.affectedRows} bản ghi learning progress`);
        
        // 9. Xóa flashcards
        const [flashcardsResult] = await connection.query("DELETE FROM flashcards WHERE user_id = ?", [id]);
        console.log(`Đã xóa ${flashcardsResult.affectedRows} bản ghi flashcards`);
        
        // 10. Xóa course reviews
        const [reviewsResult] = await connection.query("DELETE FROM coursereviews WHERE user_id = ?", [id]);
        console.log(`Đã xóa ${reviewsResult.affectedRows} bản ghi course reviews`);
        
        // 11. Xóa user activity log
        const [activityLogResult] = await connection.query("DELETE FROM useractivitylog WHERE user_id = ?", [id]);
        console.log(`Đã xóa ${activityLogResult.affectedRows} bản ghi user activity log`);
        
        // 12. Xóa forum posts
        const [forumPostsResult] = await connection.query("DELETE FROM forumposts WHERE user_id = ?", [id]);
        console.log(`Đã xóa ${forumPostsResult.affectedRows} bản ghi forum posts`);
        
        // 13. Xóa forum topics
        const [forumTopicsResult] = await connection.query("DELETE FROM forumtopics WHERE user_id = ?", [id]);
        console.log(`Đã xóa ${forumTopicsResult.affectedRows} bản ghi forum topics`);
        
        // 14. Xóa user achievements
        const [achievementsResult] = await connection.query("DELETE FROM userachievements WHERE user_id = ?", [id]);
        console.log(`Đã xóa ${achievementsResult.affectedRows} bản ghi user achievements`);
        
        // 15. Xóa feedbacks
        const [feedbacksResult] = await connection.query("DELETE FROM feedbacks WHERE user_id = ?", [id]);
        console.log(`Đã xóa ${feedbacksResult.affectedRows} bản ghi feedbacks`);
        
        // 16. Xóa chat history (nếu có bảng này)
        try {
          const [chatHistoryResult] = await connection.query("DELETE FROM chat_history WHERE user_id = ?", [id]);
          console.log(`Đã xóa ${chatHistoryResult.affectedRows} bản ghi chat history`);
        } catch (e) {
          console.log("Bảng chat_history không tồn tại hoặc không có dữ liệu");
        }
        
        // 17. Xóa các bảng progress khác (nếu có)
        try {
          const [vocabProgressResult] = await connection.query("DELETE FROM vocabulary_progress WHERE user_id = ?", [id]);
          console.log(`Đã xóa ${vocabProgressResult.affectedRows} bản ghi vocabulary progress`);
        } catch (e) {
          console.log("Bảng vocabulary_progress không tồn tại hoặc không có dữ liệu");
        }
        
        try {
          const [grammarProgressResult] = await connection.query("DELETE FROM grammar_progress WHERE user_id = ?", [id]);
          console.log(`Đã xóa ${grammarProgressResult.affectedRows} bản ghi grammar progress`);
        } catch (e) {
          console.log("Bảng grammar_progress không tồn tại hoặc không có dữ liệu");
        }
        
        try {
          const [lessonProgressResult] = await connection.query("DELETE FROM lesson_progress WHERE user_id = ?", [id]);
          console.log(`Đã xóa ${lessonProgressResult.affectedRows} bản ghi lesson progress`);
        } catch (e) {
          console.log("Bảng lesson_progress không tồn tại hoặc không có dữ liệu");
        }
        
        try {
          const [gameScoresResult] = await connection.query("DELETE FROM game_scores WHERE user_id = ?", [id]);
          console.log(`Đã xóa ${gameScoresResult.affectedRows} bản ghi game scores`);
        } catch (e) {
          console.log("Bảng game_scores không tồn tại hoặc không có dữ liệu");
        }
        
        // Cuối cùng xóa user
        const [result] = await connection.query("DELETE FROM users WHERE user_id = ?", [id]);
        console.log(`Đã xóa user ID: ${id}`);
        
        // Commit transaction
        await connection.commit();
        connection.release();
        
        return result.affectedRows; // Trả về số dòng bị xóa
      } catch (error) {
        // Rollback nếu có lỗi
        await connection.rollback();
        connection.release();
        console.error("Lỗi trong transaction, đã rollback:", error);
        throw error;
      }
    } catch (error) {
      console.error("Lỗi khi xóa user:", error);
      throw error;
    }
  },

  // Kiểm tra trùng username hoặc email khi sửa
  async checkDuplicateUsernameOrEmailUpdate(username, email, userId) {
    const sql = "SELECT * FROM users WHERE (username = ? OR email = ?) AND user_id != ?";
    const [rows] = await pool.query(sql, [username, email, userId]);
    return rows.length > 0;
  },

  // Kiểm tra trùng username hoặc email khi tạo mới
  async checkDuplicateUsernameOrEmail(username, email) {
    const sql = "SELECT * FROM users WHERE username = ? OR email = ?";
    const [rows] = await pool.query(sql, [username, email]);
    return rows.length > 0;
  },

  // Phương thức để kiểm tra user_id (BẮT BUỘC cho deserializeUser)
  async check_userid(id) {
    const sql = "SELECT * FROM users WHERE user_id = ?";
    const [rows] = await pool.query(sql, [id]);
    return rows[0]; // Trả về user đầu tiên tìm thấy hoặc undefined
  },

  // Lấy người dùng theo google_id
  async check_google_id(id) {
    const [rows] = await pool.query("SELECT * FROM users WHERE google_id = ?", [id]);
    return rows[0]; // Trả về user đầu tiên tìm thấy hoặc undefined
  },

  // Thêm người dùng mới từ Google Profile
  async create_google_user(userData) {
    const {
      username,
      email,
      google_id,
      full_name,
      profile_picture,
      account_status = "active",
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
      const [insertResult] = await pool.query(sql, values);
      const insertId = insertResult.insertId;

      // Sau khi chèn, truy vấn lại để lấy toàn bộ thông tin người dùng vừa tạo
      const [rows] = await pool.query("SELECT * FROM users WHERE user_id = ?", [insertId]);

      if (rows && rows.length > 0) {
        return rows[0];
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
    const sql = "UPDATE users SET google_id = ? WHERE user_id = ?";
    try {
      const [updateResult] = await pool.query(sql, [googleId, userId]);
      return updateResult.affectedRows > 0;
    } catch (error) {
      console.error("Error updating google_id for user:", error);
      throw error;
    }
  },

  async updateProfilePicture(userId, profilePictureUrl) {
    const sql = "UPDATE users SET profile_picture = ? WHERE user_id = ?";
    try {
      const [updateResult] = await pool.query(sql, [profilePictureUrl, userId]);
      return updateResult.affectedRows > 0;
    } catch (error) {
      console.error("Error updating profile_picture for user:", error);
      throw error;
    }
  },

  async updateProfileFullName(userId, profileFullName) {
    const sql = "UPDATE users SET full_name = ? WHERE user_id = ?";
    try {
      const [updateResult] = await pool.query(sql, [profileFullName, userId]);
      return updateResult.affectedRows > 0;
    } catch (error) {
      console.error("Error updating profile_full_name for user:", error);
      throw error;
    }
  },

  async userprofilechangepassword(userId, password_hash) {
    const sql = "UPDATE users SET password_hash = ? WHERE user_id = ?";
    try {
      const [updateResult] = await pool.query(sql, [password_hash, userId]);
      return updateResult.affectedRows > 0;
    } catch (error) {
      console.error("Error updating password_hash for user:", error);
      throw error;
    }
  },
};
