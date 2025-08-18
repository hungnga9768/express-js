const Course = require("../../models/khoahoc");
const { listItems } = require("../../utils/listItemsAPI");
const cloudinaryService = require("../../services/cloudinaryService");

module.exports = {
  async index(req, res) {
    await listItems(Course, req, res);
  },

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
