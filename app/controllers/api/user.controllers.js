const jwt = require("jsonwebtoken");
const userModel = require("../../models/user");
const bcrypt = require('bcryptjs'); // phương thức mã hóa sản phẩm
const saltRounds = 10; //số vòng mã hóa sản phẩm vòng càng cao thì chạy chậm
const fs = require("fs");
const path = require("path");
const cloudinaryService = require("../../services/cloudinaryService");
require("dotenv").config();
const passport = require("passport");
const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET;
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET;

module.exports = {
  async Login(req, res, next) {
    passport.authenticate(
      "user-local",
      { session: false },
      (err, user, info) => {
        if (err) {
          // Xử lý lỗi từ Passport strategy (ví dụ: lỗi DB)
          console.error("Lỗi trong Passport callback:", err);
          return res
            .status(500)
            .json({ message: "Lỗi máy chủ khi đăng nhập." });
        }
        if (!user) {
          // Passport trả về user = false nếu xác thực thất bại
          // info.message chứa thông báo lỗi từ strategy ('Email không tồn tại', 'Mật khẩu không đúng')
          return res
            .status(401)
            .json({ message: info.message || "Đăng nhập thất bại." });
        }

        // Nếu Passport xác thực thành công (user không phải false)
        // 'user' BÂY GIỜ LÀ ĐỐI TƯỢNG NGƯỜI DÙNG, KHÔNG PHẢI MẢNG.
        // Vì vậy, TRUY CẬP TRỰC TIẾP CÁC THUỘC TÍNH CỦA 'user'.

        const userInfo = {
          user_id: user.user_id,
          username: user.username,
          email: user.email,
          full_name: user.full_name,
          profile_picture: user.profile_picture,
        };
        const accessToken = jwt.sign(userInfo, ACCESS_TOKEN_SECRET, {
          expiresIn: "15m",
        });
        const refreshToken = jwt.sign(userInfo, REFRESH_TOKEN_SECRET, {
          expiresIn: "7d",
        });

        res.cookie("refreshToken", refreshToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production", // Nên dùng biến môi trường cho secure
          sameSite: "strict",
          maxAge: 7 * 24 * 60 * 60 * 1000,
        });

        // ✅ CẬP NHẬT LAST_LOGIN
        userModel.updateLastLogin(user.user_id)
          .then(() => {
            console.log(`Updated last_login for user ID: ${user.user_id}`);
          })
          .catch((error) => {
            console.error("Error updating last_login:", error);
            // Không throw error để không ảnh hưởng đến login
          });

        res.status(200).json({
          message: "Đăng nhập thành công",
          accessToken,
          user: userInfo,
        });
      }
    )(req, res, next);
  },
  refreshToken(req, res) {
    const token = req.cookies?.refreshToken;

    if (!token) {
      return res.status(401).json({ message: "Không có refresh token" });
    }

    jwt.verify(token, REFRESH_TOKEN_SECRET, (err, user) => {
      if (err) {
        return res.status(403).json({ message: "Refresh token không hợp lệ" });
      }

      const userInfo = {
        user_id: user.user_id,
        username: user.username,
        email: user.email,
        full_name: user.full_name,
      };

      const accessToken = jwt.sign(userInfo, ACCESS_TOKEN_SECRET, {
        expiresIn: "15m",
      });

      return res.status(200).json({ accessToken });
    });
  },

  checkLogin: (req, res) => {
    return res.status(200).json({
      message: "Đã đăng nhập",
      user: req.user,
    });
  },


  async create(req, res) {
    try {
      const { email, firstName, lastName } = req.body;
      const password_hash = await bcrypt.hash(req.body.password, saltRounds);

      // ✅ SỬ DỤNG AVATAR MẶC ĐỊNH TỪ CLOUDINARY
      const defaultAvatar = 'user-avatars/nsdnrdmxydko5ujvs8x2';
      const avatarUrl = cloudinaryService.getImageUrl(defaultAvatar, {
        width: 200,
        height: 200,
        crop: 'fill',
        gravity: 'face'
      });

      const user = {
        username: firstName + lastName,
        full_name: firstName + " " + lastName,
        email,
        password_hash,
        profile_picture: avatarUrl, // ✅ URL Cloudinary thay vì local path
        account_status: "active", // ✅ Mặc định active
        subscription_type: "free", // ✅ Mặc định free
        subscription_expiry: null, // ✅ Không có hạn
      };
      
      const isDuplicate = await userModel.checkDuplicateUsernameOrEmail(
        user.username,
        email
      );
      if (isDuplicate) {
        return res.status(409).json({
          message: "Tên đăng nhập hoặc email đã tồn tại bởi người dùng khác.",
          data: "hihi",
        });
      }
      await userModel.create(user);
      res.status(200).json({ message: "Đăng ký thành công", data: user });
    } catch (err) {
      console.error("lỗi đăng ký nguòi dùng:", err);
      return res.status(400).json({ err });
    }
  },

  logout(req, res) {
    res.clearCookie("refreshToken");
    res.status(200).json({ message: "Đăng xuất thành công" });
  },

// Giả sử userModel đã được require/import đúng cách
// const userModel = require('../models/userModel'); // Ví dụ

async  getprofile(req, res) {
  try {
    const id = req.user?.user_id;
    if (!id) {
      return res.status(400).json({ message: "Thiếu thông tin user_id" });
    }
    const userData = await userModel.getById(id); 
    if (!userData) {
      return res.status(404).json({ message: "Không tìm thấy người dùng với ID cung cấp" });
    }
    const userProfileData = {
        user_id: userData.user_id,
        username: userData.username,
        email: userData.email,
        full_name: userData.full_name,
        profile_picture: userData.profile_picture,
        registration_date: userData.registration_date,
        last_login: userData.last_login,
        account_status: userData.account_status,
        subscription_type: userData.subscription_type,
        subscription_expiry: userData.subscription_expiry
    };
    res.status(200).json({
      message: "Lấy thông tin người dùng thành công",
      data: userProfileData 
    });
  } catch (error) {
    console.error("Lỗi khi lấy thông tin người dùng:", error); 
    res.status(500).json({ message: "Đã có lỗi xảy ra ở phía server khi lấy thông tin người dùng." });
  }
},

async userprofileavatar (req, res) {
  
   try {
    if (!req.file) {
      return res.status(400).json({ 
        success: false,
        message: 'Không có file nào được tải lên hoặc file không hợp lệ.' 
      });
    }
    const userId = req.user?.user_id;
    if (!userId) {
      // Xóa file vừa tải lên để tránh rác server
      fs.unlinkSync(req.file.path);
      return res.status(401).json({ 
        success: false,
        message: 'Xác thực người dùng thất bại.' 
      });
    }

    // Lấy thông tin user hiện tại để xóa file cũ
    const currentUser = await userModel.getById(userId);
    
    console.log('🔍 [DEBUG] User avatar info:');
    console.log('   User ID:', userId);
    console.log('   Current avatar:', currentUser?.profile_picture);
    console.log('   Has cloudinary URL:', currentUser?.profile_picture?.includes('cloudinary.com'));
    console.log('   Is default avatar:', currentUser?.profile_picture?.includes('nsdnrdmxydko5ujvs8x2'));
    
    // Upload file mới lên Cloudinary (sử dụng folder chung user-avatars)
    const result = await cloudinaryService.uploadImage(req.file.path, 'user-avatars');
    if (result.success) {
      const profilePictureUrl = result.public_id;
      
      // ✅ XÓA FILE CŨ SAU KHI UPLOAD THÀNH CÔNG (GIỐNG ADMIN CONTROLLER)
      if (currentUser && currentUser.profile_picture) {
        try {
          // ✅ KIỂM TRA KHÔNG PHẢI AVATAR MẶC ĐỊNH
          if (!currentUser.profile_picture.includes('nsdnrdmxydko5ujvs8x2')) {
            // ✅ SỬ DỤNG HELPER ĐỂ TRÍCH XUẤT PUBLIC_ID CHÍNH XÁC
            const cloudinaryHelper = require('../../utils/cloudinaryHelper');
            const oldPublicId = cloudinaryHelper.extractPublicId(currentUser.profile_picture);
            
            console.log('🔍 Thông tin xóa file cũ user avatar:');
            console.log('   Avatar cũ:', currentUser.profile_picture);
            console.log('   Public ID để xóa:', oldPublicId);
            
            const deleteResult = await cloudinaryService.deleteFile(oldPublicId);
            if (deleteResult.success) {
              console.log(`✅ [${new Date().toISOString()}] Deleted old avatar: ${oldPublicId}`);
            } else {
              console.error(`❌ [${new Date().toISOString()}] Failed to delete old avatar:`, deleteResult.error);
            }
          } else {
            console.log(`⚠️  [${new Date().toISOString()}] Skipped deleting default avatar`);
          }
        } catch (deleteError) {
          console.error('❌ Exception khi xóa ảnh cũ trên Cloudinary:', deleteError);
        }
      } else {
        console.log('ℹ️  [DEBUG] No old avatar to delete - user has no avatar');
      }
      
      // Cập nhật đường dẫn ảnh mới vào database cho user
      await userModel.updateProfilePicture(userId, profilePictureUrl);

      res.status(200).json({
        success: true,
        message: 'Cập nhật ảnh đại diện thành công!',
        data: {
          userId: userId,
          profilePictureUrl: profilePictureUrl,
          updatedAt: new Date().toISOString()
        }
      });
    } else {
      console.error('Lỗi upload lên Cloudinary:', result.error);
      throw new Error('Không thể upload file lên Cloudinary: ' + result.error);
    }

  } catch (error) {
    console.error('Lỗi khi upload ảnh đại diện:', error);
    // Nếu có lỗi sau khi file đã được multer lưu, có thể cần xóa file đó đi
    if (req.file && req.file.path && fs.existsSync(req.file.path)) {
        try {
            fs.unlinkSync(req.file.path);
        } catch (cleanupErr) {
            console.error('Lỗi dọn dẹp file sau khi upload thất bại:', cleanupErr);
        }
    }
    if (error.message.includes('Định dạng file không được hỗ trợ')) {
        return res.status(400).json({ 
          success: false,
          message: error.message 
        });
    }
    if (error.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ 
          success: false,
          message: 'File quá lớn, tối đa 2MB.' 
        });
    }
    res.status(500).json({ 
      success: false,
      message: 'Lỗi server khi cập nhật ảnh đại diện.' 
    });
  }
  },
  //hamm doi ten
  async userprofilefullname(req, res) {
    try {
      const userId = req.user?.user_id;
      const { fullName } = req.body;

      // 1. Validation cơ bản
      if (!userId) {
        return res.status(401).json({ 
          success: false,
          message: 'Xác thực người dùng thất bại hoặc không tìm thấy ID người dùng.' 
        });
      }

      if (!fullName || typeof fullName !== 'string' || fullName.trim() === '') {
        return res.status(400).json({ 
          success: false,
          message: 'Họ tên không được để trống.' 
        });
      }

      // 2. Kiểm tra độ dài họ tên
      if (fullName.trim().length < 2) {
        return res.status(400).json({ 
          success: false,
          message: 'Họ tên phải có ít nhất 2 ký tự.' 
        });
      }

      if (fullName.trim().length > 100) {
        return res.status(400).json({ 
          success: false,
          message: 'Họ tên không được vượt quá 100 ký tự.' 
        });
      }

      // 3. Kiểm tra ký tự đặc biệt (linh hoạt hơn)
      const nameRegex = /^[a-zA-ZÀÁÂÃÈÉÊÌÍÒÓÔÕÙÚĂĐĨŨƠàáâãèéêìíòóôõùúăđĩũơƯĂÂÊÔưăâêô0-9\s\.\-'()]+$/;
      if (!nameRegex.test(fullName.trim())) {
        return res.status(400).json({ 
          success: false,
          message: 'Họ tên chứa ký tự không hợp lệ. Chỉ được chứa chữ cái, số, khoảng trắng, dấu chấm, gạch ngang, dấu nháy đơn và dấu ngoặc đơn.' 
        });
      }

      // 4. Cập nhật họ tên
      const result = await userModel.updateProfileFullName(userId, fullName.trim());

      if (result) {
        return res.status(200).json({
          success: true,
          message: "Cập nhật họ tên thành công!",
          data: { 
            userId: userId,
            fullName: fullName.trim(),
            updatedAt: new Date().toISOString()
          }
        });
      } else {
        return res.status(404).json({ 
          success: false,
          message: 'Không tìm thấy người dùng hoặc không có gì thay đổi.' 
        });
      }

    } catch (error) {
      console.error("Lỗi khi cập nhật họ tên người dùng:", error);
      return res.status(500).json({ 
        success: false,
        message: 'Đã có lỗi xảy ra ở phía server khi cập nhật họ tên.' 
      });
    }
  },
  // Giả sử ở đầu file controller, bạn đã require các module cần thiết:
// const userModel = require('../models/userModel'); // Đường dẫn tới model của bạn
// const bcryptjs = require('bcryptjs'); // Thư viện hash mật khẩu

  async userprofilechangepassword(req, res) {
    try {
      const userId = req.user?.user_id;
      const { currentPassword, newPassword } = req.body;

      // 1. Validation cơ bản
      if (!userId) {
        return res.status(401).json({ 
          success: false,
          message: 'Xác thực người dùng thất bại.' 
        });
      }

      if (!currentPassword || !newPassword) {
        return res.status(400).json({ 
          success: false,
          message: 'Vui lòng nhập đầy đủ mật khẩu hiện tại và mật khẩu mới.' 
        });
      }

      if (newPassword.length < 8) {
        return res.status(400).json({ 
          success: false,
          message: 'Mật khẩu mới phải có ít nhất 8 ký tự.' 
        });
      }

      if (currentPassword === newPassword) {
        return res.status(400).json({ 
          success: false,
          message: 'Mật khẩu mới phải khác mật khẩu hiện tại.' 
        });
      }

      // 2. Kiểm tra mật khẩu mạnh
      const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/;
      if (!passwordRegex.test(newPassword)) {
        return res.status(400).json({ 
          success: false,
          message: 'Mật khẩu mới phải chứa ít nhất 1 chữ thường, 1 chữ hoa, 1 số và 1 ký tự đặc biệt.' 
        });
      }

      // 3. Lấy thông tin user
      const user = await userModel.getById(userId);
      if (!user) {
        return res.status(404).json({ 
          success: false,
          message: 'Không tìm thấy người dùng.' 
        });
      }

      // 4. Kiểm tra mật khẩu hiện tại
      const isPasswordMatch = await bcrypt.compare(currentPassword, user.password_hash);
      if (!isPasswordMatch) {
        return res.status(400).json({ 
          success: false,
          message: 'Mật khẩu hiện tại không chính xác.' 
        });
      }

      // 5. Hash mật khẩu mới
      const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);

      // 6. Cập nhật mật khẩu
      console.log(`Attempting to update password for user ID: ${userId}`);
      const updateResult = await userModel.userprofilechangepassword(userId, newPasswordHash);
      console.log(`Update result:`, updateResult);

      if (updateResult) {
        return res.status(200).json({ 
          success: true,
          message: "Đổi mật khẩu thành công! Vui lòng đăng nhập lại với mật khẩu mới.",
          data: {
            userId: userId,
            updatedAt: new Date().toISOString()
          }
        });
      } else {
        console.error(`Không thể cập nhật mật khẩu cho user ID ${userId}`);
        return res.status(500).json({ 
          success: false,
          message: 'Không thể cập nhật mật khẩu. Vui lòng thử lại sau.' 
        });
      }

    } catch (error) {
      console.error("Lỗi khi đổi mật khẩu người dùng:", error);
      return res.status(500).json({ 
        success: false,
        message: 'Đã có lỗi xảy ra ở phía server. Vui lòng thử lại sau.' 
      });
    }
  }

// module.exports = { userprofilechangepassword }; // Ví dụ cách export
};
