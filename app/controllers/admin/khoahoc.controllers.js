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
};
