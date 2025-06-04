const jwt = require("jsonwebtoken");
const userModel = require("../../models/user");
const bcrypt = require('bcryptjs'); // phương thức mã hóa sản phẩm
const saltRounds = 10; //số vòng mã hóa sản phẩm vòng càng cao thì chạy chậm
const fs = require("fs");
const path = require("path");
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
      console.log(email, firstName, lastName);
      const user = {
        username: firstName + lastName,
        full_name: firstName + " " + lastName,
        email,
        password_hash,
        profile_picture: "/dist/img/avatar4.png",
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
    const id = req.body.user_id;
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
      return res.status(400).json({ message: 'Không có file nào được tải lên hoặc file không hợp lệ.' });
    }
    const userId = req.user?.user_id;
    if (!userId) {
      // Xóa file vừa tải lên để tránh rác server
      fs.unlinkSync(req.file.path);
      return res.status(401).json({ message: 'Xác thực người dùng thất bại.' });
    }

    // req.file.filename là tên file multer đã lưu
    const profilePictureUrl =  "/images/" + req.file.filename;
    // (Tùy chọn) Xóa ảnh đại diện cũ của người dùng trên server nếu có
    const currentUser = await userModel.getById(userId); // Lấy thông tin user hiện tại
    if (currentUser && currentUser.length > 0 && currentUser.profile_picture) {
      const oldAvatarPath = path.join(__dirname, '..', 'public', currentUser.profile_picture);
      if (fs.existsSync(oldAvatarPath)) {
        // Đảm bảo không xóa nhầm thư mục hoặc file mặc định
        if (!currentUser.profile_picture.includes('default-avatar.png')) { // Ví dụ tên ảnh mặc định
             try {
                fs.unlinkSync(oldAvatarPath);
                console.log('Đã xóa ảnh đại diện cũ:', oldAvatarPath);
             } catch (unlinkErr) {
                console.error('Lỗi khi xóa ảnh cũ:', unlinkErr);
             }
        }
      }
    }

    // Cập nhật đường dẫn ảnh mới vào database cho user
    await userModel.updateProfilePicture(userId, profilePictureUrl); // Bạn cần tạo hàm này trong model

    res.status(200).json({
      message: 'Cập nhật ảnh đại diện thành công!',
      profilePictureUrl: profilePictureUrl
    });

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
        return res.status(400).json({ message: error.message });
    }
    if (error.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ message: 'File quá lớn, tối đa 2MB.' });
    }
    res.status(500).json({ message: 'Lỗi server khi cập nhật ảnh đại diện.' });
  }
  },
  //hamm doi ten
  async  userprofilefullname(req, res) {
  try {
   const userId = req.user?.user_id;
    const  fullName  = req.body.fullName; 
    if (!userId) {
      return res.status(401).json({ message: 'Xác thực người dùng thất bại hoặc không tìm thấy ID người dùng.' });
    }
    if (!fullName || typeof fullName !== 'string' || fullName.trim() === '') {
      return res.status(400).json({ message: 'Họ tên không được để trống.' });
    }
    const result = await userModel.updateProfileFullName(userId, fullName);
    if (result) {
      return res.status(200).json({
        message: "Cập nhật họ tên thành công!",
        data: { 
          userId: userId,
          fullName: fullName
        }
      });
    } else {
      return res.status(404).json({ message: 'Không tìm thấy người dùng hoặc không có gì thay đổi.' });
    }
  } catch (error) {
    console.error("Lỗi khi cập nhật họ tên người dùng:", error);
    return res.status(500).json({ message: 'Đã có lỗi xảy ra ở phía server khi cập nhật họ tên.' });
  }
},
  // Giả sử ở đầu file controller, bạn đã require các module cần thiết:
// const userModel = require('../models/userModel'); // Đường dẫn tới model của bạn
// const bcryptjs = require('bcryptjs'); // Thư viện hash mật khẩu

async  userprofilechangepassword(req, res) {
  try {
    const userId = req.user?.user_id; 
   
    const { currentPassword, newPassword} = req.body;
    if (!userId) {
      return res.status(401).json({ message: 'Xác thực người dùng thất bại.' });
    }
    if (newPassword.length < 8) { 
      return res.status(400).json({ message: 'Mật khẩu mới phải có ít nhất 8 ký tự.' });
    }
    if (currentPassword === newPassword) {
      return res.status(400).json({ message: 'Mật khẩu mới phải khác mật khẩu hiện tại.' });
    }

   
    const user = await userModel.getById(userId); 
    if (!user) {
      return res.status(404).json({ message: 'Không tìm thấy người dùng.' });
    }

    // 3. So sánh mật khẩu hiện tại người dùng nhập với password_hash đã lưu
    const isPasswordMatch = await bcrypt.compare(currentPassword, user.password_hash);
    if (!isPasswordMatch) {
      return res.status(400).json({ message: 'Mật khẩu hiện tại không chính xác.' });
    }
    const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);

   
    const updateResult = await userModel.userprofilechangepassword(userId, newPasswordHash);

    if (updateResult && updateResult.affectedRows > 0) {
      return res.status(200).json({ message: "Đổi mật khẩu thành công! Vui lòng đăng nhập lại với mật khẩu mới." });
    } else {
      // Lỗi không mong muốn khi cập nhật (ví dụ user_id không tồn tại dù đã kiểm tra)
      console.error(`Không thể cập nhật mật khẩu cho user ID ${userId} dù mật khẩu hiện tại đúng.`);
      return res.status(500).json({ message: 'Không thể cập nhật mật khẩu do lỗi không xác định từ server.' });
    }

  } catch (error) {
    console.error("Lỗi khi đổi mật khẩu người dùng:", error);
    return res.status(500).json({ message: 'Đã có lỗi xảy ra ở phía server khi đổi mật khẩu.' });
  }
}

// module.exports = { userprofilechangepassword }; // Ví dụ cách export
};
