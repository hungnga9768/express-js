const Course = require("../../models/khoahoc");
const Lessons = require("../../models/baihoc");
const fs = require("fs");
const path = require("path");
const cloudinaryService = require("../../services/cloudinaryService");
module.exports = {
  // Trang danh sách khóa học với phân trang & tìm kiếm
  async index(req, res) {
    const search = req.query.search || "";
    const page = parseInt(req.query.page) || 1;
    const limit = 10;

    const totalRow = await Course.getTotalRow(search);
    const totalPage = Math.ceil(totalRow / limit);
    const currentPage = Math.min(Math.max(page, 1), totalPage);
    const offset = (currentPage - 1) * limit;

    const data = await Course.getAll(search, offset, limit);

    res.render("danhsach", {
      title: "Danh sách khóa học",
      data,
      totalPage,
      currentPage,
      search,
    });
  },

  // Trang form thêm khóa học
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
        selected_image,
      } = req.body;

      let thumbnail_url;
      if (req.file) {
        // Upload lên Cloudinary - CHỈ LƯU TRÊN CLOUDINARY
        const result = await cloudinaryService.uploadImage(req.file.path, 'khoahoc-thumbnails');
        if (result.success) {
          thumbnail_url = result.public_id; // Lưu public_id thay vì URL
        } else {
          console.error('Lỗi upload lên Cloudinary:', result.error);
          throw new Error('Không thể upload file lên Cloudinary: ' + result.error);
        }
      } else if (selected_image) {
        thumbnail_url = selected_image;
      } else {
        thumbnail_url = null; // Không có ảnh
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
    const rawLessons = await Lessons.getcourseId(id);

    const groupedLessons = {};
    rawLessons.forEach((lesson) => {
      const module = lesson.display_order || 1;
      if (!groupedLessons[module]) {
        groupedLessons[module] = [];
      }
      groupedLessons[module].push(lesson);
    });
    res.render("edit-khoahoc", {
      title: "Chỉnh sửa khóa học",
      course,
      groupedLessons
    });
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
        selected_image,
      } = req.body;

      const isDuplicate = await Course.checkDuplicateTitle(title, id);
      if (isDuplicate) {
        return res.send("Khóa học với tiêu đề này đã tồn tại.");
      }

      // Lấy thông tin khóa học cũ để xóa file
      const oldCourse = await Course.getById(id);

      const dataUpdate = {
        title,
        description,
        difficulty_level,
        estimated_duration,
        is_free,
        price,
      };

      if (req.file) {
        // Upload lên Cloudinary - CHỈ LƯU TRÊN CLOUDINARY
        const result = await cloudinaryService.uploadImage(req.file.path, 'khoahoc-thumbnails');
        if (result.success) {
          // Xóa file cũ trên Cloudinary nếu có
          if (oldCourse && oldCourse.thumbnail_url) {
            try {
              // Sử dụng helper để trích xuất public_id
              const cloudinaryHelper = require('../../utils/cloudinaryHelper');
              const oldPublicId = cloudinaryHelper.extractPublicId(oldCourse.thumbnail_url);
              
              // Kiểm tra xem có phải là public_id hợp lệ không
              if (oldPublicId) {
                const deleteResult = await cloudinaryService.deleteFile(oldPublicId);
                if (!deleteResult.success) {
                  console.error('❌ Lỗi khi xóa file cũ:', deleteResult.error);
                }
              }
            } catch (deleteError) {
              console.error('❌ Exception khi xóa file cũ:', deleteError);
            }
          }
          dataUpdate.thumbnail_url = result.public_id; // Lưu public_id thay vì URL
        } else {
          console.error('Lỗi upload lên Cloudinary:', result.error);
          throw new Error('Không thể upload file lên Cloudinary: ' + result.error);
        }
      } else if (selected_image) {
        // Nếu chọn ảnh từ Cloudinary, xóa file cũ nếu có
        if (oldCourse && oldCourse.thumbnail_url && oldCourse.thumbnail_url !== selected_image && selected_image) {
          try {
            // Sử dụng helper để trích xuất public_id
            const cloudinaryHelper = require('../../utils/cloudinaryHelper');
            const oldPublicId = cloudinaryHelper.extractPublicId(oldCourse.thumbnail_url);
            
            // Kiểm tra xem có phải là public_id hợp lệ không
            if (oldPublicId) {
                          const deleteResult = await cloudinaryService.deleteFile(oldPublicId);
            if (!deleteResult.success) {
              console.error('❌ Lỗi khi xóa file cũ:', deleteResult.error);
            }
          }
          } catch (deleteError) {
            console.error('❌ Exception khi xóa file cũ:', deleteError);
          }
        }
        dataUpdate.thumbnail_url = selected_image;
      } else {
        dataUpdate.thumbnail_url = oldCourse.thumbnail_url;
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
  async updateMultipleCourses(req, res) {
    const { courses } = req.body;
    const results = [];

    for (const course of courses) {
      try {
        await Course.update(course.course_id, {
          title: course.title,
          difficulty_level: course.difficulty_level,
          estimated_duration: course.estimated_duration,
          price: course.price,
          is_free: course.is_free,
        });

        results.push({ course_id: course.course_id, success: true });
      } catch (err) {
        results.push({
          course_id: course.course_id,
          success: false,
          message: err.message,
        });
      }
    }

    res.json({ success: true, results });
  },

  // ========================================
  // API ENDPOINTS FOR LESSONS MANAGEMENT
  // ========================================

  // Lấy danh sách bài học theo khóa học
  async getLessonsByCourse(req, res) {
    try {
      const { courseId } = req.params;
      
      if (!courseId) {
        return res.status(400).json({
          success: false,
          message: "Course ID là bắt buộc"
        });
      }

      const lessons = await Lessons.getcourseId(courseId);
      
      res.json({
        success: true,
        data: lessons,
        message: "Đã tải bài học theo khóa học thành công"
      });
    } catch (error) {
      console.error("Lỗi khi lấy bài học theo khóa học:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi server khi lấy bài học",
        error: error.message
      });
    }
  },

  // Tạo bài học mới qua AJAX
  async createLessonViaAjax(req, res) {
    try {
      const { title, course_id, description, content_type } = req.body;
      
      if (!title || !course_id) {
        return res.status(400).json({
          success: false,
          message: "Tiêu đề và Course ID là bắt buộc"
        });
      }

      // Lấy display_order tiếp theo
      const existingLessons = await Lessons.getcourseId(course_id);
      const nextDisplayOrder = existingLessons.length > 0 
        ? Math.max(...existingLessons.map(l => l.display_order || 0)) + 1 
        : 1;

      const newLesson = {
        title,
        course_id,
        description: description || '',
        content_type: content_type || 'video',
        display_order: nextDisplayOrder,
        is_preview: 0
      };

      const result = await Lessons.create(newLesson);
      
      res.status(201).json({
        success: true,
        data: { lesson_id: result.insertId, ...newLesson },
        message: "Đã tạo bài học thành công"
      });
    } catch (error) {
      console.error("Lỗi khi tạo bài học:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi server khi tạo bài học",
        error: error.message
      });
    }
  },

  // Xóa bài học qua AJAX
  async deleteLessonViaAjax(req, res) {
    try {
      const { id } = req.params;
      
      if (!id) {
        return res.status(400).json({
          success: false,
          message: "Lesson ID là bắt buộc"
        });
      }

      const result = await Lessons.delete(id);
      
      if (result.affectedRows === 0) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy bài học"
        });
      }
      
      res.json({
        success: true,
        message: "Đã xóa bài học thành công"
      });
    } catch (error) {
      console.error("Lỗi khi xóa bài học:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi server khi xóa bài học",
        error: error.message
      });
    }
  }
};
