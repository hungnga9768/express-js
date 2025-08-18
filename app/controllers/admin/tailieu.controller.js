const dsTailieu = require("../../models/tailieu");
const fs = require("fs");
const path = require("path");
const cloudinaryService = require("../../services/cloudinaryService");
module.exports = {
  // Trang danh sách baitap với phân trang & tìm kiếm
  async index(req, res) {
    const search = req.query.search || "";
    const Page = parseInt(req.query.page) || 1;
    const limit = 10;
    const totalRow = await dsTailieu.getTotalRow(search);
    const totalPage = Math.max(Math.ceil(totalRow / limit), 1);
    const offset = (Page - 1) * limit;
    const data = await dsTailieu.getAll(search, offset, limit);
    res.render("ds-tailieu", {
      data,
      totalPage,
      Page,
      search,
      title: "Danh sách tài liệu",
    });
  },

  // Trang form thêm tài liệu
  async showAddForm(req, res) {
    res.render("add-tailieu", {
      title: "Thêm mới tài liệu",
      message: ""
    });
  },
  // Xử lý thêm khóa học
  async create(req, res) {
    try {
      const {
        title,
        description,
        content_type,
        content_url,
        difficulty_level,
        hsk_level,
        category,
        word_count,
        duration,
        is_free,
        price,
        selected_image,
        old_thumbnail_url,
      } = req.body;
      // Kiểm tra trùng tên

      // Xác định thumbnail_url theo thứ tự ưu tiên:
      // 1. Upload file mới (req.file)
      // 2. Chọn ảnh có sẵn (selected_image)
      // 3. anh mac dinh
      let thumbnail_url;
      if (req.file) {
        thumbnail_url = await (async () => {
        const result = await cloudinaryService.uploadImage(req.file.path, 'tailieu-thumbnails');
        if (result.success) {
          // Xóa file cũ trên Cloudinary nếu có (khi update)
          if (old_thumbnail_url && old_thumbnail_url.includes('cloudinary.com')) {
            try {
              // Sử dụng helper để trích xuất public_id chính xác
              const cloudinaryHelper = require('../../utils/cloudinaryHelper');
              const oldPublicId = cloudinaryHelper.extractPublicId(old_thumbnail_url);
              
                          const deleteResult = await cloudinaryService.deleteFile(oldPublicId);
            if (!deleteResult.success) {
              console.error('❌ Lỗi khi xóa file cũ:', deleteResult.error);
            }
            } catch (deleteError) {
              console.error('❌ Exception khi xóa file cũ:', deleteError);
            }
          }
          return result.public_id;
        } else {
          console.error('Lỗi upload lên Cloudinary:', result.error);
          throw new Error('Không thể upload file lên Cloudinary: ' + result.error);
        }
      })();
      } else if (selected_image) {
        // Nếu chọn ảnh từ Cloudinary, xóa file cũ nếu có
        if (old_thumbnail_url && old_thumbnail_url.includes('cloudinary.com')) {
          try {
            const oldPublicId = old_thumbnail_url.split('/').pop().split('.')[0];
            await cloudinaryService.deleteFile(oldPublicId);
    
          } catch (deleteError) {
            console.error('Lỗi khi xóa file cũ:', deleteError);
          }
        }
        thumbnail_url = selected_image;
      } else {
        thumbnail_url = old_thumbnail_url;
      }

      const dataUpdate = {
        title,
        description,
        content_type,
        content_url,
        difficulty_level,
        hsk_level,
        category,
        word_count: word_count === "" ? null : parseInt(word_count),
        duration: duration === "" ? null : parseInt(duration),
        is_free,
        price,
        thumbnail_url,
      };
      await dsTailieu.create(dataUpdate);
      res.redirect("/admin/tailieu/danhsach");
    } catch (err) {
      console.error("Lỗi thêm tai lieu", err);
      res.send("Lỗi thêm tai lieu");
    }
  },
  //show form cập nhật tài liệu
  async showEditForm(req, res) {
    const id = req.params.id;
    const document = await dsTailieu.getById(id);

    if (!document) {
      return res.render("error", { message: "Không tìm thấy tài liệu" });
    }
    res.render("edit-tailieu", {
      title: "Chỉnh sửa tài liệu",
      document
    });
  },
  // Xử lý cập nhật tài liệu
  async update(req, res) {
    try {
      const id = req.params.id;
      const {
        title,
        description,
        content_type,
        content_url,
        difficulty_level,
        hsk_level,
        category,
        word_count,
        duration,
        is_free,
        price,
        selected_image,
        old_thumbnail_url,
      } = req.body;
      // Kiểm tra trùng tên
      const isDuplicate = await dsTailieu.checkDuplicateTitle(title, id);
      if (isDuplicate) {
        return res.send("Tên tiêu đề đã tồn tại bởi người dùng khác.");
      }
      
      // Lấy thông tin tài liệu cũ để xóa file
      const oldDocument = await dsTailieu.getById(id);
      
      // Xác định thumbnail_url theo thứ tự ưu tiên:
      // 1. Upload file mới (req.file)
      // 2. Chọn ảnh có sẵn (selected_image)
      // 3. Giữ ảnh cũ (old_thumbnail_url)
      let thumbnail_url;
      if (req.file) {
        const result = await cloudinaryService.uploadImage(req.file.path, 'tailieu-thumbnails');
        if (result.success) {
          // Xóa file cũ trên Cloudinary nếu có
          if (oldDocument && oldDocument.thumbnail_url) {
            try {
              // Sử dụng helper để trích xuất public_id
              const cloudinaryHelper = require('../../utils/cloudinaryHelper');
              const oldPublicId = cloudinaryHelper.extractPublicId(oldDocument.thumbnail_url);
              
              const deleteResult = await cloudinaryService.deleteFile(oldPublicId);
              if (!deleteResult.success) {
                console.error('❌ Lỗi khi xóa file cũ:', deleteResult.error);
              }
            } catch (deleteError) {
              console.error('❌ Exception khi xóa file cũ:', deleteError);
            }
          }
          thumbnail_url = result.public_id;
        } else {
          console.error('Lỗi upload lên Cloudinary:', result.error);
          throw new Error('Không thể upload file lên Cloudinary: ' + result.error);
        }
      } else if (selected_image) {
        // Nếu chọn ảnh từ Cloudinary, xóa file cũ nếu có
        if (oldDocument && oldDocument.thumbnail_url && oldDocument.thumbnail_url !== selected_image && selected_image) {
          try {
            // Sử dụng helper để trích xuất public_id chính xác
            const cloudinaryHelper = require('../../utils/cloudinaryHelper');
            const oldPublicId = cloudinaryHelper.extractPublicId(oldDocument.thumbnail_url);
            
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
        thumbnail_url = selected_image;
      } else {
        thumbnail_url = old_thumbnail_url;
      }

      const dataUpdate = {
        title,
        description,
        content_type,
        content_url,
        difficulty_level,
        hsk_level,
        category,
        word_count: word_count === "" ? null : parseInt(word_count),
        duration: duration === "" ? null : parseInt(duration),
        is_free,
        price,
        thumbnail_url,
      };

      await dsTailieu.update(id, dataUpdate);
      res.redirect("/admin/tailieu/danhsach");
    } catch (err) {
      console.error("Lỗi cập nhật:", err);
      res.send("Cập nhật thất bại");
    }
  },

  // Xử lý xóa khóa học
  async remove(req, res) {
    const id = req.params.id; //lấy req id trên urlurl
    try {
      await dsTailieu.delete(id); //gọi model xử lí

      res.redirect("/admin/tailieu/danhsach");
    } catch (err) {
      console.error("Lỗi xóa:", err);
      res.status(500).send("Xóa thất bại");
    }
  },
};
