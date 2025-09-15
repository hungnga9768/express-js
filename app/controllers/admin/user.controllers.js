const userModel = require("../../models/user");
const bcrypt = require('bcryptjs');; // phương thức mã hóa sản phẩm
const saltRounds = 10; //số vòng mã hóa sản phẩm vòng càng cao thì chạy chậm
const fs = require("fs");
const path = require("path");
const cloudinaryService = require("../../services/cloudinaryService");
module.exports = {
  // Trang danh sách khóa học với phân trang & tìm kiếm
  async index(req, res) {
    const search = req.query.search || "";
    const page = parseInt(req.query.page) || 1;
    const limit = 10;
    const totalRow = await userModel.getTotalRow(search);
    const totalPage = Math.ceil(totalRow / limit);
    const baihocPage = Math.min(Math.max(page, 1), totalPage);
    const offset = (baihocPage - 1) * limit;
    const data = await userModel.getAll(search, offset, limit);
    res.render("ds-users", {
      data,
      totalPage,
      baihocPage,
      search,
      title: "Danh sách người dùng",
    });
  },

  // Trang form thêm user
  async showAddForm(req, res) {
    res.render("add-user", { title: "Thêm mới người dùng" });
  },

  // Xử lý thêm user
  async create(req, res) {
    try {
      const {
        username,
        email,
        full_name,
        account_status,
        subscription_type,
        selected_image,
      } = req.body;
      // mã hóa mật khẩu trước khi thêm
      const password_hash = await bcrypt.hash(
        req.body.password_hash,
        saltRounds
      );
      let profile_picture;
      if (req.file) {
        // Upload lên Cloudinary - CHỈ LƯU TRÊN CLOUDINARY
        const result = await cloudinaryService.uploadImage(req.file.path, 'user-avatars');
        if (result.success) {

          profile_picture = result.public_id; // Lưu public_id thay vì URL
        } else {
          console.error('Lỗi upload lên Cloudinary:', result.error);
          throw new Error('Không thể upload file lên Cloudinary: ' + result.error);
        }
      } else if (selected_image) {
        profile_picture = selected_image;
      } else {
        profile_picture = null; // Không có ảnh
      } // ảnh mặc định
      const subscription_expiry = req.body.subscription_expiry || null;
      const user = {
        username,
        email,
        password_hash,
        full_name,
        profile_picture,
        account_status,
        subscription_type,
        subscription_expiry,
      };
      const isDuplicate = await userModel.checkDuplicateUsernameOrEmail(
        username,
        email
      );
      if (isDuplicate) {
        return res.send(
          "Tên đăng nhập hoặc email đã tồn tại bởi người dùng khác."
        );
      }
      await userModel.create(user);
      res.redirect("/admin/user/danhsach");
    } catch (err) {
      console.error("Lỗi thêm khóa học:", err);
      return res.send({ err });
    }
  },

  // Trang form chỉnh sửa user
  async showEditForm(req, res) {
    const id = req.params.id;
    const user = await userModel.getById(id);
    if (!user) {
      return res.render("error", { message: "Không tìm thấy bài học" });
    }
    res.render("edit-user", {
      title: "Sửa thông tin người dùng",
      user
    });
  },
  // Trang form update user
  async update(req, res) {
    try {
      const id = req.params.id;
      const {
        username,
        email,
        password_hash,
        full_name,
        account_status,
        subscription_type,
        selected_image,
      } = req.body;
      const subscription_expiry = req.body.subscription_expiry || null;
      const isDuplicate = await userModel.checkDuplicateUsernameOrEmailUpdate(
        username,
        email,
        id
      );
      if (isDuplicate) {
        return res.send(
          "Tên đăng nhập hoặc email đã tồn tại bởi người dùng khác."
        );
      }
      
      // Lấy thông tin user cũ để xóa file
      const oldUser = await userModel.getById(id);
      
      const dataUpdate = {
        username,
        email,
        full_name,
        account_status,
        subscription_type,
        subscription_expiry,
      };
      // mã hóa mật khẩu trước khi thêm
      if (password_hash && password_hash.trim() !== "") {
        dataUpdate.password_hash = await bcrypt.hash(password_hash, saltRounds);
      }
      if (req.file) {
        // Upload lên Cloudinary - CHỈ LƯU TRÊN CLOUDINARY
        const result = await cloudinaryService.uploadImage(req.file.path, 'user-avatars');
        if (result.success) {
          // Xóa file cũ trên Cloudinary nếu có
          if (oldUser && oldUser.profile_picture) {
            try {
              // Sử dụng helper để trích xuất public_id
              const cloudinaryHelper = require('../../utils/cloudinaryHelper');
              const oldPublicId = cloudinaryHelper.extractPublicId(oldUser.profile_picture);
              
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
          dataUpdate.profile_picture = result.public_id; // Lưu public_id thay vì URL
        } else {
          console.error('Lỗi upload lên Cloudinary:', result.error);
          throw new Error('Không thể upload file lên Cloudinary: ' + result.error);
        }
      } else if (selected_image) {
        // Nếu chọn ảnh từ Cloudinary, xóa file cũ nếu có
        if (oldUser && oldUser.profile_picture && oldUser.profile_picture !== selected_image && selected_image) {
          try {
            // Sử dụng helper để trích xuất public_id
            const cloudinaryHelper = require('../../utils/cloudinaryHelper');
            const oldPublicId = cloudinaryHelper.extractPublicId(oldUser.profile_picture);
            
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
        dataUpdate.profile_picture = selected_image;
      } else {
        dataUpdate.profile_picture = oldUser.profile_picture;
      }
      await userModel.update(id, dataUpdate);
      
      // 🔄 Clear cache nếu subscription thay đổi
      if (oldUser.subscription_type !== subscription_type) {
        const { clearUserCache } = require('../../../middlewares/subscription');
        const { resetUserUsageOnSubscriptionChange } = require('../../../utils/subscription');
        
        // Clear cache của user
        clearUserCache(id);
        console.log(`🔄 Cache cleared for user ${id} after subscription change`);
        
        // Reset usage nếu cần thiết
        if (oldUser.subscription_type && oldUser.subscription_type !== subscription_type) {
          try {
            const resetResult = await resetUserUsageOnSubscriptionChange(
              id, 
              oldUser.subscription_type, 
              subscription_type
            );
            console.log(`🔄 Subscription changed for user ${id}: ${oldUser.subscription_type} → ${subscription_type}`);
            console.log(`🔄 Reset result:`, resetResult);
          } catch (resetError) {
            console.error('Error resetting usage:', resetError);
          }
        }
      }
      
      res.redirect("/admin/user/danhsach");
    } catch (err) {
      console.error("Lỗi cập nhật:", err);
      res.send("Cập nhật thất bại");
    }
  },

  // Xử lý xóa user
  async remove(req, res) {
    const id = req.params.id; //lấy req id trên urlurl
    try {
      await userModel.delete(id); //gọi model xử lí

      res.redirect("/admin/user/danhsach");
    } catch (err) {
      console.error("Lỗi xóa:", err);
      res.status(500).send("Xóa thất bại");
    }
  },
};
