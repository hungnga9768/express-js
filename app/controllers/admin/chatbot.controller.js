const chatModel = require("../../models/settingchatai");
const fs = require("fs");
const path = require("path");
const cloudinaryService = require("../../services/cloudinaryService");
module.exports = {
  async index(req, res) {
    const search = req.query.search || "";
    const page = parseInt(req.query.page) || 1;
    const limit = 10;
    const totalRow = await chatModel.getTotalRow(search);
    const totalPage = Math.max(Math.ceil(totalRow / limit), 1);
    const Page = Math.min(Math.max(page, 1), totalPage);
    const offset = (Page - 1) * limit;
    const data = await chatModel.getAll(search, offset, limit);
    res.render("ds-settingchatai", {
      data,
      totalPage,
      Page,
      search,
      title: "quản lý Ai",
    });
  },
  async showAddForm(req, res) {
    res.render("add-chatbot", {
      title: "Thêm mới trợ lý AI",
      message: ""
    });
  },
  // Xử lý thêm khóa học
  async create(req, res) {
    try {
      const {
        name,
        internal_name,
        initial_prompt,
        description,
        selected_image,
        old_thumbnail_url,
      } = req.body;
      console.log(req.body.name);
      const is_active = req.body.is_active === "1" ? 1 : 0;
      let avatar_url;
      if (req.file) {
        avatar_url = await (async () => {
        const result = await cloudinaryService.uploadImage(req.file.path, 'chatbot-avatars');
        if (result.success) {
          // Xóa file cũ trên Cloudinary nếu có (khi update)
          if (old_thumbnail_url && old_thumbnail_url.includes('cloudinary.com')) {
            try {
              // Sử dụng helper để trích xuất public_id chính xác
              const cloudinaryHelper = require('../../utils/cloudinaryHelper');
              const oldPublicId = cloudinaryHelper.extractPublicId(old_thumbnail_url);
              
              console.log('🔍 Thông tin xóa file cũ chatbot (create):');
              console.log('   Avatar cũ:', old_thumbnail_url);
              console.log('   Public ID để xóa:', oldPublicId);
              
              const deleteResult = await cloudinaryService.deleteFile(oldPublicId);
              if (deleteResult.success) {
                console.log('✅ Đã xóa file cũ trên Cloudinary:', oldPublicId);
              } else {
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
      } else if (selected_image && selected_image.trim() !== '') {
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
        avatar_url = selected_image;
      } else {
        // Nếu không có file upload và không có selected_image, sử dụng giá trị mặc định
        avatar_url = old_thumbnail_url || null;
      }
      const createChatbot = {
        name,
        internal_name,
        initial_prompt,
        description,
        is_active,
        avatar_url,
      };

      await chatModel.create(createChatbot);
      res.redirect("/admin/chatbot/danhsach");
    } catch (err) {
      console.error("Lỗi thêm tro ly ai", err);
      res.send("Lỗi thêm tro li ai");
    }
  },
  async showEditForm(req, res) {
    const id = req.params.id;
    const chat = await chatModel.getById(id);
    if (!chat) {
      return res.render("error", { message: "Không tìm thấy tài liệu" });
    }
    res.render("edit-settingchatai", {
      title: "Chỉnh sửa trợ lý AI",
      chat
    });
  },
  async update(req, res) {
    try {
      const id = req.params.id;
      const {
        name,
        internal_name,
        initial_prompt,
        description,
        selected_image,
        old_thumbnail_url,
      } = req.body;
      
      // Debug logging
      console.log('🔧 Chatbot update request:', {
        id,
        selected_image: selected_image || 'null',
        old_thumbnail_url: old_thumbnail_url || 'null',
        hasFile: !!req.file
      });
      const is_active = req.body.is_active === "1" ? 1 : 0;
      const checktitle = await chatModel.checkDuplicateTitle(name, id);
      if (checktitle) {
        return res.send(`Tên ${name} đã bị trùng `);
      }
      
      // Lấy thông tin chatbot cũ để xóa file
      const oldChatbot = await chatModel.getById(id);
      let avatar_url;
      if (req.file) {
        const result = await cloudinaryService.uploadImage(req.file.path, 'chatbot-avatars');
        if (result.success) {
          // Xóa file cũ trên Cloudinary nếu có
          if (oldChatbot && oldChatbot.avatar_url) {
            try {
              // Sử dụng helper để trích xuất public_id chính xác
              const cloudinaryHelper = require('../../utils/cloudinaryHelper');
              const oldPublicId = cloudinaryHelper.extractPublicId(oldChatbot.avatar_url);
              
              const deleteResult = await cloudinaryService.deleteFile(oldPublicId);
              if (!deleteResult.success) {
                console.error('❌ Lỗi khi xóa file cũ:', deleteResult.error);
              }
            } catch (deleteError) {
              console.error('❌ Exception khi xóa file cũ:', deleteError);
            }
          }
          avatar_url = result.public_id;
        } else {
          console.error('Lỗi upload lên Cloudinary:', result.error);
          throw new Error('Không thể upload file lên Cloudinary: ' + result.error);
        }
      } else if (selected_image && selected_image.trim() !== '') {
        // Nếu chọn ảnh từ Cloudinary, xóa file cũ nếu có
        if (oldChatbot && oldChatbot.avatar_url && oldChatbot.avatar_url !== selected_image && selected_image) {
          try {
            // Sử dụng helper để trích xuất public_id chính xác
            const cloudinaryHelper = require('../../utils/cloudinaryHelper');
            const oldPublicId = cloudinaryHelper.extractPublicId(oldChatbot.avatar_url);
            
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
        avatar_url = selected_image;
      } else {
        // Nếu không có file upload và không có selected_image, giữ nguyên ảnh cũ từ database
        avatar_url = oldChatbot.avatar_url;
        console.log('🔧 Giữ nguyên avatar cũ:', avatar_url);
      }
      
      console.log('🔧 Final avatar_url:', avatar_url);
      const dataUpdate = {
        name,
        internal_name,
        initial_prompt,
        description,
        is_active,
        avatar_url,
      };

      await chatModel.update(id, dataUpdate);
      res.redirect("/admin/chatbot/danhsach");
    } catch (err) {
      console.error("Lỗi cập nhật:", err);
      res.send("Cập nhật thất bại");
    }
  },
  async remove(req, res) {
    const id = req.params.id;
    try {
      await chatModel.delete(id);
      res.redirect("/admin/chatbot/danhsach");
    } catch (err) {
      console.error("Lỗi xóa:", err);
      res.status(500).send("Xóa thất bại");
    }
  },
};
