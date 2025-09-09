// config/passport.js
const LocalStrategy = require("passport-local").Strategy;
const User = require("../app/models/user"); // Model cho người dùng thông thường
const Admin = require("../app/models/admin"); // Model cho admin
const bcrypt = require('bcryptjs');
const GoogleStrategy = require("passport-google-oauth20");
module.exports = function (passport) {
  //  cho người dùng thông thường
  passport.use(
    "user-local", // Đổi tên strategy
    new LocalStrategy(
      { usernameField: "email" },
      async (email, password, done) => {
        try {
          const user = await User.check_emaill(email);
          if (!user) {
            return done(null, false, {
              message: "Email người dùng không tồn tại.",
            });
          }
          if (!user.password_hash)
            return done(null, false, {
              message: "Dữ liệu người dùng không hợp lệ.",
            });

          const isMatch = await bcrypt.compare(password, user.password_hash);
          if (isMatch) {
            return done(null, user);
          } else {
            return done(null, false, {
              message: "Mật khẩu người dùng không đúng.",
            });
          }
        } catch (err) {
          console.error("Lỗi trong User Passport Local Strategy:", err);
          return done(err);
        }
      }
    )
  );

  //  cho admin
  passport.use(
    "admin-local", // Đổi tên strategy khác
    new LocalStrategy(
      { usernameField: "email" },
      async (email, password, done) => {
        try {
          const admin = await Admin.check_emaill(email); // Dùng model Admin
          if (!admin) {
            return done(null, false, {
              message: "Email quản trị viên không tồn tại.",
            });
          }
          if (!admin.password_hash)
            return done(null, false, {
              message: "Dữ liệu quản trị viên không hợp lệ.",
            });

          const isMatch = await bcrypt.compare(password, admin.password_hash);
          if (isMatch) {
            return done(null, admin);
          } else {
            return done(null, false, {
              message: "Mật khẩu quản trị viên không đúng.",
            });
          }
        } catch (err) {
          console.error("Lỗi trong Admin Passport Local Strategy:", err);
          return done(err);
        }
      }
    )
  );

  // config/passport.js (Phần GoogleStrategy)
  // ...
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: "/api/auth/google/callback",
        scope: ["profile", "email"],
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          const userEmail =
            profile.emails && profile.emails.length > 0
              ? profile.emails[0].value
              : null;

          // 1. Tìm người dùng theo google_id
          let user = await User.check_google_id(profile.id);

          if (user) {
            // Người dùng đã tồn tại với google_id này (đã đăng nhập Google trước đó)
            return done(null, user);
          } else if (userEmail) {
            // 2. Nếu google_id không tồn tại, kiểm tra xem email có tồn tại không
            let existingUser = await User.check_emaill(userEmail); // Giả sử hàm này tìm kiếm theo email

            if (existingUser) {
              // Email đã tồn tại (người dùng đã đăng ký bằng email/mật khẩu trước đó)

              // Rất quan trọng: Liên kết tài khoản Google này với tài khoản đã có
              // Cập nhật google_id cho người dùng hiện tại
              await User.update_google_id_for_user(
                existingUser.user_id,
                profile.id
              ); // Hàm này sẽ được tạo ở Bước 1 dưới đây

              // Trả về người dùng đã được cập nhật
              // Bạn có thể cần lấy lại thông tin user sau khi update nếu User.update_google_id_for_user
              // chỉ là một truy vấn update đơn thuần và không trả về đối tượng user đầy đủ.
              const updatedUser = await User.check_userid(
                existingUser.user_id
              );
              if (updatedUser) {
                return done(null, updatedUser);
              } else {
                return done(null, false, {
                  message: "Lỗi khi cập nhật và lấy lại thông tin người dùng.",
                });
              }
            } else {
              // 3. Email cũng không tồn tại, đây là người dùng hoàn toàn mới
              const newUser = {
                username:
                  profile.displayName ||
                  (userEmail ? userEmail.split("@")[0] : "user"),
                email: userEmail,
                google_id: profile.id,
                full_name: profile.displayName,
                profile_picture:
                  profile.photos && profile.photos.length > 0
                    ? profile.photos[0].value
                    : null,
                // Các trường khác với giá trị mặc định nếu cần
                account_status: "active",
                subscription_type: "free",
                subscription_expiry: null, // hoặc ngày hết hạn mặc định
              };

              const createdUser = await User.create_google_user(newUser);
              if (createdUser) {
                return done(null, createdUser); // create_google_user đã trả về đối tượng user hoàn chỉnh
              } else {
                return done(null, false, {
                  message: "Không thể tạo tài khoản người dùng từ Google.",
                });
              }
            }
          } else {
            // Trường hợp không có email từ Google (rất hiếm)
            return done(null, false, {
              message: "Không thể lấy email từ tài khoản Google.",
            });
          }
        } catch (err) {
          console.error("Lỗi trong Passport Google Strategy:", err);
          return done(err);
        }
      }
    )
  );
  // ... các phần serializeUser, deserializeUser còn lại
  // serializeUser và deserializeUser vẫn cần tồn tại, có thể để đơn giản
  passport.serializeUser((user, done) => {
    done(null, user.user_id);
  });
  passport.deserializeUser(async (id, done) => {
    // Có thể cần logic để kiểm tra trong cả User và Admin models
    try {
      let foundUser = await User.check_userid(id);
      if (foundUser) {
        return done(null, foundUser);
      }
      let foundAdmin = await Admin.check_userid(id);
      if (foundAdmin) {
        return done(null, foundAdmin);
      }
      return done(null, false);
    } catch (err) {
      done(err, null);
    }
  });
};
