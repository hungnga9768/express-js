const Course = require("../../models/khoahoc");
const Lesson = require("../../models/baihoc");
const { listItems } = require("../../utils/listItemsAPI");
const cloudinaryService = require("../../services/cloudinaryService");

module.exports = {
  async index(req, res) {
    await listItems(Course, req, res);
  },

  // ==================== PUBLIC API METHODS ====================
  
  // Lấy chi tiết khóa học
  async getCourseById(req, res) {
    try {
      const { id } = req.params;
      const user_id = req.user?.user_id; // Lấy user_id từ req.user nếu có
      const course = await Course.getById(id);
      
      if (!course) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy khóa học'
        });
      }

      // Lấy thống kê khóa học
      const stats = await Course.getCourseStats(id);
      
      // Nếu user đã đăng nhập, kiểm tra trạng thái đăng ký
      let enrollmentStatus = null;
      if (user_id) {
        const enrollment = await Course.checkEnrollment(user_id, id);
        if (enrollment) {
          enrollmentStatus = {
            is_enrolled: true,
            enrollment_date: enrollment.enrollment_date,
            completion_percentage: enrollment.completion_percentage || 0
          };
        } else {
          enrollmentStatus = {
            is_enrolled: false
          };
        }
      }
      
      res.json({
        success: true,
        data: {
          ...course,
          stats,
          enrollment_status: enrollmentStatus
        }
      });
    } catch (error) {
      console.error('Error getting course:', error);
      res.status(500).json({
        success: false,
        message: 'Có lỗi xảy ra khi lấy thông tin khóa học'
      });
    }
  },

  // Lấy danh sách bài học của khóa học
  async getCourseLessons(req, res) {
    try {
      const { id } = req.params;
      const { user_id } = req.user || {};
      
      const lessons = await Lesson.getcourseId(id);
      
      // Nếu user đã đăng nhập, lấy trạng thái học tập
      if (user_id) {
        const progress = await Course.getUserLessonProgress(user_id, id);
        const lessonsWithProgress = lessons.map(lesson => {
          const lessonProgress = progress.find(p => p.lesson_id === lesson.lesson_id);
          return {
            ...lesson,
            is_completed: lessonProgress ? lessonProgress.completion_status === 'completed' : false,
            last_accessed: lessonProgress ? lessonProgress.last_accessed : null
          };
        });
        
        return res.json({
          success: true,
          data: lessonsWithProgress
        });
      }
      
      res.json({
        success: true,
        data: lessons
      });
    } catch (error) {
      console.error('Error getting course lessons:', error);
      res.status(500).json({
        success: false,
        message: 'Có lỗi xảy ra khi lấy danh sách bài học'
      });
    }
  },

  // Tìm kiếm khóa học
  async searchCourses(req, res) {
    try {
      const { q, hsk_level, page = 1, limit = 10 } = req.query;
      
      const courses = await Course.searchCourses({
        query: q,
        hsk_level,
        page: parseInt(page),
        limit: parseInt(limit)
      });
      
      res.json({
        success: true,
        data: courses
      });
    } catch (error) {
      console.error('Error searching courses:', error);
      res.status(500).json({
        success: false,
        message: 'Có lỗi xảy ra khi tìm kiếm khóa học'
      });
    }
  },

  // Lấy khóa học theo cấp độ HSK
  async getCoursesByHSKLevel(req, res) {
    try {
      const { hsk_level } = req.params;
      const { page = 1, limit = 10 } = req.query;
      
      // Validate HSK level
      const validHSKLevels = ['hsk1', 'hsk2', 'hsk3', 'hsk4', 'hsk5', 'hsk6'];
      if (!validHSKLevels.includes(hsk_level)) {
        return res.status(400).json({
          success: false,
          message: 'Cấp độ HSK không hợp lệ. Các cấp độ hợp lệ: hsk1, hsk2, hsk3, hsk4, hsk5, hsk6'
        });
      }
      
      const courses = await Course.getCoursesByHSKLevel(hsk_level, {
        page: parseInt(page),
        limit: parseInt(limit)
      });
      
      res.json({
        success: true,
        data: courses
      });
    } catch (error) {
      console.error('Error getting courses by HSK level:', error);
      res.status(500).json({
        success: false,
        message: 'Có lỗi xảy ra khi lấy khóa học theo cấp độ HSK'
      });
    }
  },

  // ==================== PROTECTED API METHODS ====================
  
  // Đăng ký khóa học
  async enrollCourse(req, res) {
    try {
      const { id } = req.params;
      const user_id = req.user.user_id;
      
      // Kiểm tra khóa học có tồn tại không
      const course = await Course.getById(id);
      if (!course) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy khóa học'
        });
      }
      
      // Kiểm tra đã đăng ký chưa
      const existingEnrollment = await Course.checkEnrollment(user_id, id);
      if (existingEnrollment) {
        return res.status(400).json({
          success: false,
          message: 'Bạn đã đăng ký khóa học này rồi'
        });
      }
      
      // Đăng ký khóa học
      await Course.enrollUser(user_id, id);
      
      res.json({
        success: true,
        message: 'Đăng ký khóa học thành công'
      });
    } catch (error) {
      console.error('Error enrolling course:', error);
      res.status(500).json({
        success: false,
        message: 'Có lỗi xảy ra khi đăng ký khóa học'
      });
    }
  },

  // Lấy danh sách khóa học đã đăng ký
  async getEnrolledCourses(req, res) {
    try {
      const user_id = req.user.user_id;
      const { page = 1, limit = 10 } = req.query;
      
      // Debug: Log thông tin
      console.log(`🔍 [DEBUG] Getting enrolled courses for user_id: ${user_id}, page: ${page}, limit: ${limit}`);
      
      const courses = await Course.getEnrolledCourses(user_id, {
        page: parseInt(page),
        limit: parseInt(limit)
      });
      
      // Debug: Log kết quả
      console.log(`🔍 [DEBUG] Found ${courses.length} enrolled courses:`, courses.map(c => c.course_id));
      
      res.json({
        success: true,
        data: courses
      });
    } catch (error) {
      console.error('Error getting enrolled courses:', error);
      res.status(500).json({
        success: false,
        message: 'Có lỗi xảy ra khi lấy danh sách khóa học đã đăng ký'
      });
    }
  },

  // Hủy đăng ký khóa học
  async unenrollCourse(req, res) {
    try {
      const { id } = req.params;
      const user_id = req.user.user_id;
      
      await Course.unenrollUser(user_id, id);
      
      res.json({
        success: true,
        message: 'Hủy đăng ký khóa học thành công'
      });
    } catch (error) {
      console.error('Error unenrolling course:', error);
      res.status(500).json({
        success: false,
        message: 'Có lỗi xảy ra khi hủy đăng ký khóa học'
      });
    }
  },

  // Lấy tiến độ khóa học
  async getCourseProgress(req, res) {
    try {
      const { id } = req.params;
      const user_id = req.user.user_id;
      
      const progress = await Course.getCourseProgress(user_id, id);
      
      res.json({
        success: true,
        data: progress
      });
    } catch (error) {
      console.error('Error getting course progress:', error);
      res.status(500).json({
        success: false,
        message: 'Có lỗi xảy ra khi lấy tiến độ khóa học'
      });
    }
  },

  // Hoàn thành bài học
  async completeLesson(req, res) {
    try {
      const { id: course_id, lessonId: lesson_id } = req.params;
      const user_id = req.user.user_id;
      
      await Course.completeLesson(user_id, course_id, lesson_id);
      
      res.json({
        success: true,
        message: 'Đánh dấu hoàn thành bài học thành công'
      });
    } catch (error) {
      console.error('Error completing lesson:', error);
      res.status(500).json({
        success: false,
        message: 'Có lỗi xảy ra khi hoàn thành bài học'
      });
    }
  },

  // Lấy trạng thái bài học
  async getLessonStatus(req, res) {
    try {
      const { id: course_id, lessonId: lesson_id } = req.params;
      const user_id = req.user.user_id;
      
      const status = await Course.getLessonStatus(user_id, course_id, lesson_id);
      
      res.json({
        success: true,
        data: status
      });
    } catch (error) {
      console.error('Error getting lesson status:', error);
      res.status(500).json({
        success: false,
        message: 'Có lỗi xảy ra khi lấy trạng thái bài học'
      });
    }
  },

  // Thêm đánh giá khóa học
  async addCourseReview(req, res) {
    try {
      const { id } = req.params;
      const user_id = req.user.user_id;
      const { rating, review_text } = req.body;
      
      await Course.addReview(user_id, id, rating, review_text);
      
      res.json({
        success: true,
        message: 'Thêm đánh giá thành công'
      });
    } catch (error) {
      console.error('Error adding review:', error);
      res.status(500).json({
        success: false,
        message: 'Có lỗi xảy ra khi thêm đánh giá'
      });
    }
  },

  // Lấy đánh giá khóa học
  async getCourseReviews(req, res) {
    try {
      const { id } = req.params;
      const { page = 1, limit = 10 } = req.query;
      
      const reviews = await Course.getReviews(id, {
        page: parseInt(page),
        limit: parseInt(limit)
      });
      
      res.json({
        success: true,
        data: reviews
      });
    } catch (error) {
      console.error('Error getting reviews:', error);
      res.status(500).json({
        success: false,
        message: 'Có lỗi xảy ra khi lấy đánh giá'
      });
    }
  },

  // ==================== ADMIN API METHODS ====================
  
  showAddForm(req, res) {
    res.render("add-khoahoc", { title: "Thêm khóa học" });
  },

  // Xử lý thêm khóa học
  async create(req, res) {
    try {
      const {
        title,
        description,
        difficulty_level,
        estimated_duration,
        is_free,
        price,
      } = req.body;

      const result = await cloudinaryService.uploadImage(req.file.path, 'khoahoc-thumbnails');
      if (result.success) {
        const thumbnail_url = result.public_id;
      } else {
        console.error('Lỗi upload lên Cloudinary:', result.error);
        throw new Error('Không thể upload file lên Cloudinary: ' + result.error);
      }

      const newCourse = {
        title,
        description,
        difficulty_level,
        estimated_duration,
        is_free,
        price,
        thumbnail_url,
      };

      await Course.create(newCourse);
      res.redirect("/admin/khoahoc/danhsach");
    } catch (err) {
      console.error("Lỗi thêm khóa học:", err);
      res.send("Lỗi thêm khóa học");
    }
  },

  // Trang form chỉnh sửa khóa học
  async showEditForm(req, res) {
    const id = req.params.id;
    const course = await Course.getById(id);
    if (!course) {
      return res.render("error", { message: "Không tìm thấy khóa học" });
    }
    res.render("edit-khoahoc", { title: "Chỉnh sửa khóa học", course });
  },

  // Xử lý cập nhật khóa học
  async update(req, res) {
    try {
      const id = req.params.id;
      const {
        title,
        description,
        difficulty_level,
        estimated_duration,
        is_free,
        price,
      } = req.body;

      const isDuplicate = await Course.checkDuplicateTitle(title, id);
      if (isDuplicate) {
        return res.send("Khóa học với tiêu đề này đã tồn tại.");
      }

      const dataUpdate = {
        title,
        description,
        difficulty_level,
        estimated_duration,
        is_free,
        price,
      };

      if (req.file) {
        // Lấy thông tin khóa học cũ để xóa file
        const oldCourse = await Course.getById(id);
        if (oldCourse && oldCourse.thumbnail_url && oldCourse.thumbnail_url.includes('cloudinary.com')) {
          try {
            const oldPublicId = oldCourse.thumbnail_url.split('/').pop().split('.')[0];
            await cloudinaryService.deleteFile(oldPublicId);
    
          } catch (deleteError) {
            console.error('Lỗi khi xóa file cũ:', deleteError);
          }
        }
        
        const result = await cloudinaryService.uploadImage(req.file.path, 'khoahoc-thumbnails');
        if (result.success) {
          dataUpdate.thumbnail_url = result.public_id;
        } else {
          console.error('Lỗi upload lên Cloudinary:', result.error);
          throw new Error('Không thể upload file lên Cloudinary: ' + result.error);
        }
      }

      await Course.update(id, dataUpdate);
      res.redirect("/admin/khoahoc/danhsach");
    } catch (err) {
      console.error("Lỗi cập nhật:", err);
      res.send("Cập nhật thất bại");
    }
  },

  // Xử lý xóa khóa học
  async remove(req, res) {
    const id = req.params.id;
    try {
      await Course.delete(id);

      res.redirect("/admin/khoahoc/danhsach");
    } catch (err) {
      console.error("Lỗi xóa:", err);
      res.status(500).send("Xóa thất bại");
    }
  },
};
