const Lesson = require("../../models/baihoc");
const Course = require("../../models/khoahoc");
const { listItems } = require("../../utils/listItemsAPI");

module.exports = {
  async index(req, res) {
    await listItems(Lesson, req, res);
  },

  // ==================== PUBLIC API METHODS ====================
  
  // Lấy chi tiết bài học
  async getLessonById(req, res) {
    try {
      const { id } = req.params;
      const lesson = await Lesson.getById(id);
      
      if (!lesson) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy bài học'
        });
      }

      // Xử lý content_url để trả về thông tin phù hợp
      const processedLesson = {
        ...lesson,
        content_info: processContentUrl(lesson.content_url, lesson.content_type)
      };
      
      res.json({
        success: true,
        data: processedLesson
      });
    } catch (error) {
      console.error('Error getting lesson:', error);
      res.status(500).json({
        success: false,
        message: 'Có lỗi xảy ra khi lấy thông tin bài học'
      });
    }
  },

  // Lấy danh sách bài học theo khóa học
  async getLessonsByCourse(req, res) {
    try {
      const { courseId } = req.params;
      const { user_id } = req.user || {};
      
      const lessons = await Lesson.getcourseId(courseId);
      
      // Nếu user đã đăng nhập, lấy trạng thái học tập
      if (user_id) {
        const progress = await Course.getUserLessonProgress(user_id, courseId);
        const lessonsWithProgress = lessons.map(lesson => {
          const lessonProgress = progress.find(p => p.lesson_id === lesson.lesson_id);
          return {
            ...lesson,
            is_completed: lessonProgress ? lessonProgress.completion_status === 'completed' : false,
            last_accessed: lessonProgress ? lessonProgress.last_accessed : null,
            content_info: processContentUrl(lesson.content_url, lesson.content_type)
          };
        });
        
        return res.json({
          success: true,
          data: lessonsWithProgress
        });
      }
      
      // Xử lý content_url cho mỗi bài học
      const processedLessons = lessons.map(lesson => ({
        ...lesson,
        content_info: processContentUrl(lesson.content_url, lesson.content_type)
      }));
      
      res.json({
        success: true,
        data: processedLessons
      });
    } catch (error) {
      console.error('Error getting lessons by course:', error);
      res.status(500).json({
        success: false,
        message: 'Có lỗi xảy ra khi lấy danh sách bài học'
      });
    }
  },

  // ==================== PROTECTED API METHODS ====================
  
  // Bắt đầu học bài học
  async startLesson(req, res) {
    try {
      const { id } = req.params;
      const user_id = req.user.user_id;
      
      // Kiểm tra bài học có tồn tại không
      const lesson = await Lesson.getById(id);
      if (!lesson) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy bài học'
        });
      }
      
      // Cập nhật trạng thái bắt đầu học
      await Course.updateLessonProgress(user_id, lesson.course_id, id, 'in_progress');
      
      res.json({
        success: true,
        message: 'Bắt đầu học bài học thành công',
        data: {
          lesson_id: id,
          status: 'in_progress',
          start_time: new Date()
        }
      });
    } catch (error) {
      console.error('Error starting lesson:', error);
      res.status(500).json({
        success: false,
        message: 'Có lỗi xảy ra khi bắt đầu bài học'
      });
    }
  },

  // Hoàn thành bài học
  async completeLesson(req, res) {
    try {
      const { id } = req.params;
      const user_id = req.user.user_id;
      
      // Xử lý body một cách an toàn
      let score, time_spent;
      if (req.body && typeof req.body === 'object') {
        score = req.body.score;
        time_spent = req.body.time_spent;
      }
      
      // Kiểm tra bài học có tồn tại không
      const lesson = await Lesson.getById(id);
      if (!lesson) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy bài học'
        });
      }
      
      // Hoàn thành bài học
      await Course.completeLesson(user_id, lesson.course_id, id);
      
      // Cập nhật điểm số nếu có
      if (score !== undefined) {
        await Course.updateLessonScore(user_id, lesson.course_id, id, score);
      }
      
      res.json({
        success: true,
        message: 'Hoàn thành bài học thành công',
        data: {
          lesson_id: id,
          status: 'completed',
          completion_time: new Date(),
          score: score || null
        }
      });
    } catch (error) {
      console.error('Error completing lesson:', error);
      res.status(500).json({
        success: false,
        message: 'Có lỗi xảy ra khi hoàn thành bài học'
      });
    }
  },

  // Lấy tiến độ bài học
  async getLessonProgress(req, res) {
    try {
      const { id } = req.params;
      const user_id = req.user.user_id;
      
      const lesson = await Lesson.getById(id);
      if (!lesson) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy bài học'
        });
      }
      
      const progress = await Course.getLessonStatus(user_id, lesson.course_id, id);
      
      res.json({
        success: true,
        data: progress
      });
    } catch (error) {
      console.error('Error getting lesson progress:', error);
      res.status(500).json({
        success: false,
        message: 'Có lỗi xảy ra khi lấy tiến độ bài học'
      });
    }
  },

  // Thêm ghi chú cho bài học
  async addLessonNote(req, res) {
    try {
      const { id } = req.params;
      const user_id = req.user.user_id;
      
      // Xử lý body một cách an toàn
      let note_text;
      if (req.body && typeof req.body === 'object') {
        note_text = req.body.note_text;
      }
      
      const lesson = await Lesson.getById(id);
      if (!lesson) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy bài học'
        });
      }
      
      await Course.addLessonNote(user_id, lesson.course_id, id, note_text);
      
      res.json({
        success: true,
        message: 'Thêm ghi chú thành công'
      });
    } catch (error) {
      console.error('Error adding lesson note:', error);
      res.status(500).json({
        success: false,
        message: 'Có lỗi xảy ra khi thêm ghi chú'
      });
    }
  },

  // Lấy ghi chú bài học
  async getLessonNotes(req, res) {
    try {
      const { id } = req.params;
      const user_id = req.user.user_id;
      
      const lesson = await Lesson.getById(id);
      if (!lesson) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy bài học'
        });
      }
      
      const notes = await Course.getLessonNotes(user_id, lesson.course_id, id);
      
      res.json({
        success: true,
        data: notes
      });
    } catch (error) {
      console.error('Error getting lesson notes:', error);
      res.status(500).json({
        success: false,
        message: 'Có lỗi xảy ra khi lấy ghi chú'
      });
    }
  },

  // Cập nhật ghi chú bài học
  async updateLessonNote(req, res) {
    try {
      const { id: lessonId, noteId } = req.params;
      const user_id = req.user.user_id;
      
      // Xử lý body một cách an toàn
      let note_text;
      if (req.body && typeof req.body === 'object') {
        note_text = req.body.note_text;
      }
      
      const lesson = await Lesson.getById(lessonId);
      if (!lesson) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy bài học'
        });
      }
      
      const updated = await Course.updateLessonNote(noteId, user_id, note_text);
      
      if (updated) {
        res.json({
          success: true,
          message: 'Cập nhật ghi chú thành công'
        });
      } else {
        res.status(404).json({
          success: false,
          message: 'Không tìm thấy ghi chú hoặc không có quyền cập nhật'
        });
      }
    } catch (error) {
      console.error('Error updating lesson note:', error);
      res.status(500).json({
        success: false,
        message: 'Có lỗi xảy ra khi cập nhật ghi chú'
      });
    }
  },

  // Xóa ghi chú bài học
  async deleteLessonNote(req, res) {
    try {
      const { id: lessonId, noteId } = req.params;
      const user_id = req.user.user_id;
      
      const lesson = await Lesson.getById(lessonId);
      if (!lesson) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy bài học'
        });
      }
      
      const deleted = await Course.deleteLessonNote(noteId, user_id);
      
      if (deleted) {
        res.json({
          success: true,
          message: 'Xóa ghi chú thành công'
        });
      } else {
        res.status(404).json({
          success: false,
          message: 'Không tìm thấy ghi chú hoặc không có quyền xóa'
        });
      }
    } catch (error) {
      console.error('Error deleting lesson note:', error);
      res.status(500).json({
        success: false,
        message: 'Có lỗi xảy ra khi xóa ghi chú'
      });
    }
  },

  // Lấy tất cả ghi chú của user
  async getUserNotes(req, res) {
    try {
      const user_id = req.user.user_id;
      const { page = 1, limit = 10 } = req.query;
      
      const notes = await Course.getUserNotes(user_id, {
        page: parseInt(page),
        limit: parseInt(limit)
      });
      
      res.json({
        success: true,
        data: notes
      });
    } catch (error) {
      console.error('Error getting user notes:', error);
      res.status(500).json({
        success: false,
        message: 'Có lỗi xảy ra khi lấy ghi chú'
      });
    }
  },

  // Tìm kiếm ghi chú
  async searchNotes(req, res) {
    try {
      const user_id = req.user.user_id;
      const { q, page = 1, limit = 10 } = req.query;
      
      if (!q) {
        return res.status(400).json({
          success: false,
          message: 'Từ khóa tìm kiếm không được để trống'
        });
      }
      
      const notes = await Course.searchNotes(user_id, q, {
        page: parseInt(page),
        limit: parseInt(limit)
      });
      
      res.json({
        success: true,
        data: notes
      });
    } catch (error) {
      console.error('Error searching notes:', error);
      res.status(500).json({
        success: false,
        message: 'Có lỗi xảy ra khi tìm kiếm ghi chú'
      });
    }
  },

  // ==================== ADMIN API METHODS ====================
  
  // Xử lý thêm bài học
  async create(req, res) {
    try {
      const {
        course_id,
        title,
        description,
        content_type,
        content_url,
        duration,
        display_order,
        is_preview,
      } = req.body;

      const newLesson = {
        course_id,
        title,
        description,
        content_type,
        content_url,
        duration,
        display_order,
        is_preview,
      };

      await Lesson.create(newLesson);
      res.redirect("/admin/baihoc/danhsach");
    } catch (err) {
      console.error("Lỗi thêm bài học:", err);
      res.send("Lỗi thêm bài học");
    }
  },

  // Xử lý cập nhật bài học
  async update(req, res) {
    try {
      const id = req.params.id;
      const {
        course_id,
        title,
        description,
        content_type,
        content_url,
        duration,
        display_order,
        is_preview,
      } = req.body;

      const isDuplicate = await Lesson.checkDuplicateTitle(title, id);
      if (isDuplicate) {
        return res.send("Bài học với tiêu đề này đã tồn tại.");
      }

      const dataUpdate = {
        course_id,
        title,
        description,
        content_type,
        content_url,
        duration,
        display_order,
        is_preview,
      };

      await Lesson.update(id, dataUpdate);
      res.redirect("/admin/baihoc/danhsach");
    } catch (err) {
      console.error("Lỗi cập nhật:", err);
      res.send("Cập nhật thất bại");
    }
  },

  // Xử lý xóa bài học
  async remove(req, res) {
    const id = req.params.id;
    try {
      await Lesson.delete(id);
      res.redirect("/admin/baihoc/danhsach");
    } catch (err) {
      console.error("Lỗi xóa:", err);
      res.status(500).send("Xóa thất bại");
    }
  },
};

// Helper function để xử lý content_url
function processContentUrl(contentUrl, contentType) {
  if (!contentUrl) return null;
  
  // Xử lý YouTube URL
  if (contentUrl.includes('youtube.com') || contentUrl.includes('youtu.be')) {
    const videoId = extractYouTubeVideoId(contentUrl);
    return {
      type: 'youtube',
      video_id: videoId,
      embed_url: `https://www.youtube.com/embed/${videoId}`,
      original_url: contentUrl
    };
  }
  
  // Xử lý Google Drive URL
  if (contentUrl.includes('drive.google.com')) {
    const fileId = extractGoogleDriveFileId(contentUrl);
    return {
      type: 'google_drive',
      file_id: fileId,
      embed_url: `https://drive.google.com/file/d/${fileId}/preview`,
      original_url: contentUrl
    };
  }
  
  // Xử lý URL thông thường
  return {
    type: 'external',
    url: contentUrl,
    original_url: contentUrl
  };
}

// Helper function để trích xuất YouTube video ID
function extractYouTubeVideoId(url) {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
}

// Helper function để trích xuất Google Drive file ID
function extractGoogleDriveFileId(url) {
  const regExp = /\/d\/([a-zA-Z0-9-_]+)/;
  const match = url.match(regExp);
  return match ? match[1] : null;
}

