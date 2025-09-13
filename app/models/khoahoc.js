// Kết nối MySQL
const pool = require("../../connect-mysql");

// Export object chứa các hàm xử lý database liên quan đến courses
module.exports = {
  async getDs() {
    let sql = "SELECT * FROM courses";
    const [rows] = await pool.query(sql);
    return rows;
  },
  //  Lấy danh sách khóa học (có phân trang và tìm kiếm)
  async getAll(search, offset, limit) {
    let sql = "SELECT * FROM courses";
    if (search && search.trim()) sql += " WHERE title LIKE ?"; // nếu có từ khóa
    
    // Xử lý offset và limit an toàn
    const safeOffset = parseInt(offset) || 0;
    const safeLimit = parseInt(limit) || 10;
    
    sql += " ORDER BY course_id DESC LIMIT ?, ?"; // phân trang với prepared statement
    const params = search && search.trim() ? [`%${search.trim()}%`, safeOffset, safeLimit] : [safeOffset, safeLimit];
    const [rows] = await pool.query(sql, params);
    return rows;
  },

  //  Lấy tổng số dòng (dùng để phân trang)
  async getTotalRow(search) {
    let sql = "SELECT COUNT(*) AS totalRow FROM courses";
    if (search && search.trim()) {
      sql += " WHERE title LIKE ?"; // điều kiện tìm kiếm với prepared statement
      const [result] = await pool.query(sql, [`%${search.trim()}%`]);
      return result[0].totalRow; // trả về tổng số dòng
    } else {
      const [result] = await pool.query(sql);
      return result[0].totalRow; // trả về tổng số dòng
    }
  },

  //  Lấy chi tiết 1 khóa học theo ID
  async getById(id) {
    const [result] = await pool.query("SELECT * FROM courses WHERE course_id = ?", [
      id,
    ]);
    return result[0]; // trả về 1 object duy nhất
  },

  //  Thêm khóa học mới
  async create(course) {
    const sql = `
      INSERT INTO courses (title, description, thumbnail_url, difficulty_level, estimated_duration, is_free, price)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    const values = [
      course.title,
      course.description,
      course.thumbnail_url,
      course.difficulty_level,
      course.estimated_duration,
      course.is_free,
      course.price,
    ];
    const [rows] = await pool.query(sql, values);
    return rows.insertId; // Trả về ID của khóa học vừa tạo
  },

  //  Cập nhật khóa học
  async update(id, data) {
    const sql = `UPDATE courses SET ? WHERE course_id = ?`;
    const [rows] = await pool.query(sql, [data, id]);
    return rows.affectedRows; // Trả về số dòng bị ảnh hưởng
  },

  // Xóa khóa học
  async delete(id) {
    const [result] = await pool.query("DELETE FROM courses WHERE course_id = ?", [id]);
    return result.affectedRows; // Trả về số dòng bị xóa
  },

  // Kiểm tra trùng tiêu đề khi sửa
  async checkDuplicateTitle(title, id) {
    const [result] = await pool.query(
      `SELECT * FROM courses WHERE title = ? AND course_id != ?`,
      [title, id]
    );
    return result.length > 0;
  },

  // ==================== NEW LEARNING FEATURES ====================

  // Lấy thống kê khóa học
  async getCourseStats(courseId) {
    try {
      // Số học viên đăng ký
      const [enrollmentCount] = await pool.query(
        "SELECT COUNT(*) as count FROM courseenrollments WHERE course_id = ?",
        [courseId]
      );

      // Số bài học
      const [lessonCount] = await pool.query(
        "SELECT COUNT(*) as count FROM lessons WHERE course_id = ?",
        [courseId]
      );

      // Đánh giá trung bình
      const [avgRating] = await pool.query(
        "SELECT AVG(rating) as avg_rating, COUNT(*) as review_count FROM coursereviews WHERE course_id = ?",
        [courseId]
      );

      return {
        enrollment_count: enrollmentCount[0].count,
        lesson_count: lessonCount[0].count,
        avg_rating: avgRating[0].avg_rating || 0,
        review_count: avgRating[0].review_count
      };
    } catch (error) {
      console.error('Error getting course stats:', error);
      throw error;
    }
  },

  // Tìm kiếm khóa học
  async searchCourses({ query, hsk_level, page, limit }) {
    try {
      let sql = "SELECT * FROM courses WHERE 1=1";
      const params = [];

      if (query) {
        sql += " AND (title LIKE ? OR description LIKE ?)";
        params.push(`%${query}%`, `%${query}%`);
      }

      if (hsk_level) {
        sql += " AND difficulty_level = ?";
        params.push(hsk_level);
      }

      sql += " ORDER BY course_id DESC LIMIT ? OFFSET ?";
      const offset = (page - 1) * limit;
      params.push(limit, offset);

      const [rows] = await pool.query(sql, params);
      return rows;
    } catch (error) {
      console.error('Error searching courses:', error);
      throw error;
    }
  },

  // Lấy khóa học theo cấp độ HSK
  async getCoursesByHSKLevel(hsk_level, { page, limit }) {
    try {
      const sql = "SELECT * FROM courses WHERE difficulty_level = ? ORDER BY course_id DESC LIMIT ? OFFSET ?";
      const offset = (page - 1) * limit;
      const [rows] = await pool.query(sql, [hsk_level, limit, offset]);
      return rows;
    } catch (error) {
      console.error('Error getting courses by HSK level:', error);
      throw error;
    }
  },

  // Kiểm tra đăng ký khóa học
  async checkEnrollment(userId, courseId) {
    try {
      const [result] = await pool.query(
        "SELECT * FROM courseenrollments WHERE user_id = ? AND course_id = ?",
        [userId, courseId]
      );
      return result[0] || null; // Trả về object enrollment hoặc null
    } catch (error) {
      console.error('Error checking enrollment:', error);
      throw error;
    }
  },

  // Đăng ký khóa học
  async enrollUser(userId, courseId) {
    try {
      const sql = "INSERT INTO courseenrollments (user_id, course_id) VALUES (?, ?)";
      await pool.query(sql, [userId, courseId]);
    } catch (error) {
      console.error('Error enrolling user:', error);
      throw error;
    }
  },

  // Lấy danh sách khóa học đã đăng ký
  async getEnrolledCourses(userId, { page, limit }) {
    try {
      const sql = `
        SELECT c.*, ce.enrollment_date, ce.completion_percentage
        FROM courses c
        JOIN courseenrollments ce ON c.course_id = ce.course_id
        WHERE ce.user_id = ?
        ORDER BY ce.enrollment_date DESC
        LIMIT ? OFFSET ?
      `;
      const offset = (page - 1) * limit;
      const [rows] = await pool.query(sql, [userId, limit, offset]);
      return rows;
    } catch (error) {
      console.error('Error getting enrolled courses:', error);
      throw error;
    }
  },

  // Hủy đăng ký khóa học
  async unenrollUser(userId, courseId) {
    try {
      const sql = "DELETE FROM courseenrollments WHERE user_id = ? AND course_id = ?";
      await pool.query(sql, [userId, courseId]);
    } catch (error) {
      console.error('Error unenrolling user:', error);
      throw error;
    }
  },

  // Lấy tiến độ khóa học
  async getCourseProgress(userId, courseId) {
    try {
      // Lấy thông tin đăng ký
      const [enrollment] = await pool.query(
        "SELECT * FROM courseenrollments WHERE user_id = ? AND course_id = ?",
        [userId, courseId]
      );

      // Lấy TỔNG SỐ BÀI HỌC trong khóa học (không phụ thuộc vào progress)
      const [totalLessonsResult] = await pool.query(
        "SELECT COUNT(*) as total FROM lessons WHERE course_id = ?",
        [courseId]
      );
      const totalLessons = totalLessonsResult[0].total;

      // Lấy tiến độ các bài học đã có progress
      const [lessonProgress] = await pool.query(
        `SELECT lp.*, l.title as lesson_title, l.duration
         FROM learningprogress lp
         JOIN lessons l ON lp.lesson_id = l.lesson_id
         WHERE lp.user_id = ? AND lp.course_id = ?
         ORDER BY l.display_order`,
        [userId, courseId]
      );

      // Tính tiến độ
      const completedLessons = lessonProgress.filter(lp => lp.completion_status === 'completed').length;
      const inProgressLessons = lessonProgress.filter(lp => lp.completion_status === 'in_progress').length;
      const notStartedLessons = totalLessons - completedLessons - inProgressLessons; // Tính từ tổng số bài học
      const completionPercentage = totalLessons > 0 ? (completedLessons / totalLessons) * 100 : 0;

      // Tìm lần truy cập cuối cùng
      const lastAccessed = lessonProgress.length > 0 
        ? new Date(Math.max(...lessonProgress.map(lp => new Date(lp.last_accessed || 0))))
        : null;

      // Format lại dữ liệu theo API guide
      const formattedLessonProgress = lessonProgress.map(lp => ({
        lesson_id: lp.lesson_id,
        title: lp.lesson_title,
        completion_status: lp.completion_status,
        completion_date: lp.completion_date,
        score: lp.score
      }));

      return {
        course_id: parseInt(courseId),
        enrollment_date: enrollment[0]?.enrollment_date || null,
        completion_percentage: completionPercentage,
        total_lessons: totalLessons,
        completed_lessons: completedLessons,
        in_progress_lessons: inProgressLessons,
        not_started_lessons: notStartedLessons,
        last_accessed: lastAccessed,
        lessons_progress: formattedLessonProgress
      };
    } catch (error) {
      console.error('Error getting course progress:', error);
      throw error;
    }
  },

  // Lấy tiến độ bài học của user
  async getUserLessonProgress(userId, courseId) {
    try {
      const sql = `
        SELECT lp.*, l.title as lesson_title
        FROM learningprogress lp
        JOIN lessons l ON lp.lesson_id = l.lesson_id
        WHERE lp.user_id = ? AND lp.course_id = ?
        ORDER BY l.display_order
      `;
      const [rows] = await pool.query(sql, [userId, courseId]);
      return rows;
    } catch (error) {
      console.error('Error getting user lesson progress:', error);
      throw error;
    }
  },

  // Hoàn thành bài học
  async completeLesson(userId, courseId, lessonId) {
    try {
      const sql = `
        INSERT INTO learningprogress (user_id, course_id, lesson_id, completion_status, completion_date, last_accessed)
        VALUES (?, ?, ?, 'completed', NOW(), NOW())
        ON DUPLICATE KEY UPDATE 
        completion_status = 'completed',
        completion_date = NOW(),
        last_accessed = NOW()
      `;
      await pool.query(sql, [userId, courseId, lessonId]);
      
      // Cập nhật completion_percentage trong courseenrollments
      await this.updateCourseCompletionPercentage(userId, courseId);
    } catch (error) {
      console.error('Error completing lesson:', error);
      throw error;
    }
  },

  // Cập nhật completion_percentage trong courseenrollments
  async updateCourseCompletionPercentage(userId, courseId) {
    try {
      // Tính tổng số bài học đã hoàn thành
      const [completedResult] = await pool.query(
        `SELECT COUNT(*) as completed_count 
         FROM learningprogress 
         WHERE user_id = ? AND course_id = ? AND completion_status = 'completed'`,
        [userId, courseId]
      );
      
      // Tính tổng số bài học trong khóa học
      const [totalResult] = await pool.query(
        `SELECT COUNT(*) as total_count 
         FROM lessons 
         WHERE course_id = ?`,
        [courseId]
      );
      
      const completedCount = completedResult[0].completed_count;
      const totalCount = totalResult[0].total_count;
      const completionPercentage = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;
      
      // Cập nhật completion_percentage
      await pool.query(
        `UPDATE courseenrollments 
         SET completion_percentage = ? 
         WHERE user_id = ? AND course_id = ?`,
        [completionPercentage, userId, courseId]
      );
    } catch (error) {
      console.error('Error updating course completion percentage:', error);
      throw error;
    }
  },

  // Lấy trạng thái bài học
  async getLessonStatus(userId, courseId, lessonId) {
    try {
      const [result] = await pool.query(
        "SELECT * FROM learningprogress WHERE user_id = ? AND course_id = ? AND lesson_id = ?",
        [userId, courseId, lessonId]
      );
      return result[0] || null;
    } catch (error) {
      console.error('Error getting lesson status:', error);
      throw error;
    }
  },

  // Thêm đánh giá khóa học
  async addReview(userId, courseId, rating, reviewText) {
    try {
      const sql = `
        INSERT INTO coursereviews (course_id, user_id, rating, review_text)
        VALUES (?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE 
        rating = VALUES(rating),
        review_text = VALUES(review_text),
        review_date = NOW()
      `;
      await pool.query(sql, [courseId, userId, rating, reviewText]);
    } catch (error) {
      console.error('Error adding review:', error);
      throw error;
    }
  },

  // Lấy đánh giá khóa học
  async getReviews(courseId, { page, limit }) {
    try {
      // Lấy tổng số reviews
      const [totalResult] = await pool.query(
        "SELECT COUNT(*) as total FROM coursereviews WHERE course_id = ?",
        [courseId]
      );
      const totalReviews = totalResult[0].total;

      // Lấy reviews với thông tin user
      const sql = `
        SELECT cr.*, u.username, u.full_name, u.profile_picture
        FROM coursereviews cr
        JOIN users u ON cr.user_id = u.user_id
        WHERE cr.course_id = ?
        ORDER BY cr.review_date DESC
        LIMIT ? OFFSET ?
      `;
      const offset = (page - 1) * limit;
      const [rows] = await pool.query(sql, [courseId, limit, offset]);

      // Lấy thống kê rating
      const [ratingStats] = await pool.query(
        `SELECT 
          AVG(rating) as average_rating,
          COUNT(*) as total_reviews,
          SUM(CASE WHEN rating = 5 THEN 1 ELSE 0 END) as rating_5,
          SUM(CASE WHEN rating = 4 THEN 1 ELSE 0 END) as rating_4,
          SUM(CASE WHEN rating = 3 THEN 1 ELSE 0 END) as rating_3,
          SUM(CASE WHEN rating = 2 THEN 1 ELSE 0 END) as rating_2,
          SUM(CASE WHEN rating = 1 THEN 1 ELSE 0 END) as rating_1
        FROM coursereviews 
        WHERE course_id = ?`,
        [courseId]
      );

      return {
        reviews: rows,
        pagination: {
          current_page: page,
          per_page: limit,
          total_reviews: totalReviews,
          total_pages: Math.ceil(totalReviews / limit)
        },
        summary: {
          average_rating: parseFloat(ratingStats[0].average_rating || 0).toFixed(1),
          total_reviews: ratingStats[0].total_reviews,
          rating_distribution: {
            "5": ratingStats[0].rating_5,
            "4": ratingStats[0].rating_4,
            "3": ratingStats[0].rating_3,
            "2": ratingStats[0].rating_2,
            "1": ratingStats[0].rating_1
          }
        }
      };
    } catch (error) {
      console.error('Error getting reviews:', error);
      throw error;
    }
  },

  // Cập nhật tiến độ bài học
  async updateLessonProgress(userId, courseId, lessonId, status) {
    try {
      const sql = `
        INSERT INTO learningprogress (user_id, course_id, lesson_id, completion_status, last_accessed)
        VALUES (?, ?, ?, ?, NOW())
        ON DUPLICATE KEY UPDATE 
        completion_status = VALUES(completion_status),
        last_accessed = NOW()
      `;
      await pool.query(sql, [userId, courseId, lessonId, status]);
    } catch (error) {
      console.error('Error updating lesson progress:', error);
      throw error;
    }
  },

  // Cập nhật điểm số bài học
  async updateLessonScore(userId, courseId, lessonId, score) {
    try {
      const sql = `
        UPDATE learningprogress 
        SET score = ? 
        WHERE user_id = ? AND course_id = ? AND lesson_id = ?
      `;
      await pool.query(sql, [score, userId, courseId, lessonId]);
    } catch (error) {
      console.error('Error updating lesson score:', error);
      throw error;
    }
  },

  // Thêm ghi chú bài học
  async addLessonNote(userId, courseId, lessonId, noteText) {
    try {
      const sql = `
        INSERT INTO LessonNotes (user_id, course_id, lesson_id, note_text, created_at)
        VALUES (?, ?, ?, ?, NOW())
      `;
      await pool.query(sql, [userId, courseId, lessonId, noteText]);
    } catch (error) {
      console.error('Error adding lesson note:', error);
      throw error;
    }
  },

  // Lấy ghi chú bài học
  async getLessonNotes(userId, courseId, lessonId) {
    try {
      const sql = `
        SELECT * FROM LessonNotes 
        WHERE user_id = ? AND course_id = ? AND lesson_id = ?
        ORDER BY created_at DESC
      `;
      const [rows] = await pool.query(sql, [userId, courseId, lessonId]);
      return rows;
    } catch (error) {
      console.error('Error getting lesson notes:', error);
      throw error;
    }
  },

  // Cập nhật ghi chú bài học
  async updateLessonNote(noteId, userId, noteText) {
    try {
      const sql = `
        UPDATE LessonNotes 
        SET note_text = ?, updated_at = NOW()
        WHERE note_id = ? AND user_id = ?
      `;
      const [result] = await pool.query(sql, [noteText, noteId, userId]);
      return result.affectedRows > 0;
    } catch (error) {
      console.error('Error updating lesson note:', error);
      throw error;
    }
  },

  // Xóa ghi chú bài học
  async deleteLessonNote(noteId, userId) {
    try {
      const sql = `
        DELETE FROM LessonNotes 
        WHERE note_id = ? AND user_id = ?
      `;
      const [result] = await pool.query(sql, [noteId, userId]);
      return result.affectedRows > 0;
    } catch (error) {
      console.error('Error deleting lesson note:', error);
      throw error;
    }
  },

  // Lấy tất cả ghi chú của user
  async getUserNotes(userId, { page = 1, limit = 10 }) {
    try {
      const sql = `
        SELECT ln.*, l.title as lesson_title, c.title as course_title
        FROM LessonNotes ln
        JOIN Lessons l ON ln.lesson_id = l.lesson_id
        JOIN Courses c ON ln.course_id = c.course_id
        WHERE ln.user_id = ?
        ORDER BY ln.created_at DESC
        LIMIT ? OFFSET ?
      `;
      const offset = (page - 1) * limit;
      const [rows] = await pool.query(sql, [userId, limit, offset]);
      return rows;
    } catch (error) {
      console.error('Error getting user notes:', error);
      throw error;
    }
  },

  // Tìm kiếm ghi chú
  async searchNotes(userId, searchText, { page = 1, limit = 10 }) {
    try {
      const sql = `
        SELECT ln.*, l.title as lesson_title, c.title as course_title
        FROM LessonNotes ln
        JOIN Lessons l ON ln.lesson_id = l.lesson_id
        JOIN Courses c ON ln.course_id = c.course_id
        WHERE ln.user_id = ? AND ln.note_text LIKE ?
        ORDER BY ln.created_at DESC
        LIMIT ? OFFSET ?
      `;
      const offset = (page - 1) * limit;
      const [rows] = await pool.query(sql, [userId, `%${searchText}%`, limit, offset]);
      return rows;
    } catch (error) {
      console.error('Error searching notes:', error);
      throw error;
    }
  },
};
