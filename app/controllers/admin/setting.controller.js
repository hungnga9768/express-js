const Banner = require("../../models/banner");
const Settings = require("../../models/setting");
const fs = require("fs");
const path = require("path");
const cloudinaryService = require("../../services/cloudinaryService");
module.exports = {
  // Trang danh sách baitap với phân trang & tìm kiếm
  async index(req, res) {
    const search = req.query.search || "";
    const page = parseInt(req.query.page) || 1;
    const limit = 10;
    const totalRow = await Banner.getTotalRow(search);
    const totalPage = Math.max(Math.ceil(totalRow / limit), 1);
    const Page = Math.min(Math.max(page, 1), totalPage);
    const offset = (Page - 1) * limit;

    const data = await Banner.getAll(search, offset, limit);

    res.render("ds-banner", {
      data,
      totalPage,
      Page,
      search,
      title: "Danh sách banner",
    });
  },

  // Trang form thêm tài liệu
  async showAddForm(req, res) {
    res.render("add-banner", {
      title: "Thêm mới banner",
      message: ""
    });
  },
  // Xử lý thêm khóa học
  async create(req, res) {
    try {
      const {
        title,
        description,
        link_url,
        display_order,
        selected_image,
        old_thumbnail_url,
      } = req.body;
      const is_active = req.body.is_active === "1" ? 1 : 0;
      let image_url;
      if (req.file) {
        const result = await cloudinaryService.uploadImage(req.file.path, 'settings-images');
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
          image_url = result.public_id;
        } else {
          console.error('Lỗi upload lên Cloudinary:', result.error);
          throw new Error('Không thể upload file lên Cloudinary: ' + result.error);
        }
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
        image_url = selected_image;
      } else {
        image_url = old_thumbnail_url;
      }

      const dataUpdate = {
        title,
        description,
        link_url,
        display_order,
        is_active,
        image_url,
      };
      await Banner.create(dataUpdate);
      res.redirect("/admin/setting/banner/danhsach");
    } catch (err) {
      console.error("Lỗi thêm banner", err);
      res.send("Lỗi thêm banner");
    }
  },
  async showEditForm(req, res) {
    const id = req.params.id;
    const banner = await Banner.getById(id);

    if (!banner) {
      return res.render("error", { message: "Không tìm thấy tài liệu" });
    }
    res.render("edit-banner", {
      title: "Chỉnh sửa baner",
      banner
    });
  },
  // Xử lý cập nhật tài liệu
  async update(req, res) {
    try {
      const id = req.params.id;
      const {
        title,
        description,
        link_url,
        display_order,
        selected_image,
        old_thumbnail_url,
      } = req.body;
      const is_active = req.body.is_active === "1" ? 1 : 0;
      const checktitle = await Banner.checkDuplicateTitle(title, id);
      if (checktitle) {
        return res.send("Tên tiêu đề đã bị trùng ");
      }
      
      // Lấy thông tin banner cũ để xóa file
      const oldBanner = await Banner.getById(id);
      let image_url;
      if (req.file) {
        const result = await cloudinaryService.uploadImage(req.file.path, 'settings-images');
        if (result.success) {
          // Xóa file cũ trên Cloudinary nếu có
          if (oldBanner && oldBanner.image_url) {
            try {
              // Sử dụng helper để trích xuất public_id chính xác
              const cloudinaryHelper = require('../../utils/cloudinaryHelper');
              const oldPublicId = cloudinaryHelper.extractPublicId(oldBanner.image_url);
              
              const deleteResult = await cloudinaryService.deleteFile(oldPublicId);
              if (!deleteResult.success) {
                console.error('❌ Lỗi khi xóa file cũ:', deleteResult.error);
              }
            } catch (deleteError) {
              console.error('❌ Exception khi xóa file cũ:', deleteError);
            }
          }
          image_url = result.public_id;
        } else {
          console.error('Lỗi upload lên Cloudinary:', result.error);
          throw new Error('Không thể upload file lên Cloudinary: ' + result.error);
        }
      } else if (selected_image) {
        // Nếu chọn ảnh từ Cloudinary, xóa file cũ nếu có
        if (oldBanner && oldBanner.image_url && oldBanner.image_url !== selected_image && selected_image) {
          try {
            // Sử dụng helper để trích xuất public_id chính xác
            const cloudinaryHelper = require('../../utils/cloudinaryHelper');
            const oldPublicId = cloudinaryHelper.extractPublicId(oldBanner.image_url);
            
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
        image_url = selected_image;
      } else {
        image_url = old_thumbnail_url;
      }

      const dataUpdate = {
        title,
        description,
        link_url,
        display_order,
        is_active,
        image_url,
      };

      await Banner.update(id, dataUpdate);
      res.redirect("/admin/setting/banner/danhsach");
    } catch (err) {
      console.error("Lỗi cập nhật:", err);
      res.send("Cập nhật thất bại");
    }
  },

  // Xử lý xóa khóa học
  async remove(req, res) {
    const id = req.params.id; //lấy req id trên urlurl
    try {
      await Banner.delete(id); //gọi model xử lí

      res.redirect("/admin/setting/banner/danhsach");
    } catch (err) {
      console.error("Lỗi xóa:", err);
      res.status(500).send("Xóa thất bại");
    }
  },
  async indexSetttings(req, res) {
    const search = req.query.search || "";
    const page = parseInt(req.query.page) || 1;
    const limit = 100;

    const totalRow = await Settings.getTotalRow(search);
    const totalPage = Math.max(Math.ceil(totalRow / limit), 1);
    const Page = Math.min(Math.max(page, 1), totalPage);
    const offset = (Page - 1) * limit;

    const data = await Settings.getAll(search, offset, limit);

    res.render("ds-settings", {
      data,
      totalPage,
      Page,
      search,
      title: "Danh sách thiết lập websites",
    });
  },
  async showEditForSettings(req, res) {
    const id = req.params.id;
    const setting = await Settings.getById(id);

    if (!setting) {
      return res.render("error", { message: "Không tìm thấy tài liệu" });
    }
    res.render("edit-settings", {
      title: "Chỉnh sửa bố cục website",
      setting
    });
  },
  async updateSettings(req, res) {
    try {
      const id = req.params.id;
      const { selected_image, old_thumbnail_url, key } = req.body;

      let value;

      // Trường hợp là ảnh (logo hoặc favicon)
      if (key === "logo" || key === "favicon") {
        if (req.file) {
          const result = await cloudinaryService.uploadImage(req.file.path, 'settings-images');
          if (result.success) {
            value = result.public_id;
            
            // Xóa file cũ trên Cloudinary nếu có
            if (old_thumbnail_url && old_thumbnail_url.includes('cloudinary.com')) {
              try {
                const oldPublicId = old_thumbnail_url.split('/').pop().split('.')[0];
                await cloudinaryService.deleteFile(oldPublicId);
                console.log('Đã xóa file cũ trên Cloudinary:', oldPublicId);
              } catch (deleteError) {
                console.error('Lỗi khi xóa file cũ:', deleteError);
              }
            }
          } else {
            console.error('Lỗi upload lên Cloudinary:', result.error);
            throw new Error('Không thể upload file lên Cloudinary: ' + result.error);
          }
        } else if (selected_image) {
          // Nếu chọn ảnh từ Cloudinary, xóa file cũ nếu có
          if (old_thumbnail_url && old_thumbnail_url.includes('cloudinary.com')) {
            try {
              const oldPublicId = old_thumbnail_url.split('/').pop().split('.')[0];
              await cloudinaryService.deleteFile(oldPublicId);
              console.log('Đã xóa file cũ trên Cloudinary:', oldPublicId);
            } catch (deleteError) {
              console.error('Lỗi khi xóa file cũ:', deleteError);
            }
          }
          value = selected_image;
        } else if (old_thumbnail_url) {
          value = old_thumbnail_url;
        }
      } else {
        // Trường hợp là input hoặc textarea khác
        value = req.body.value;
      }

      const dataUpdate = { key, value };

      await Settings.update(id, dataUpdate);

      res.redirect("/admin/setting");
    } catch (err) {
      console.error("Lỗi cập nhật:", err);
      res.status(500).send("Lỗi cập nhật: " + err.message);
    }
  },
};
