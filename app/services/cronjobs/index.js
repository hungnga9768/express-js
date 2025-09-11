// File thực hiện định kỳ hàm startCronJobs có chức năng xóa lịch sử tin nhắn không dùng sau 15 ngày để giải phóng

const cron = require("node-cron");
const { 
  deleteOldChatSessions, 
  getOldChatSessionsCount, 
  getChatStatistics 
} = require("../chatCleanupService");
const {
  deleteExpiredPasswordResetTokens,
  getPasswordResetTokenStats,
  checkAndCleanupTokens
} = require("../passwordResetCleanupService");

function startCronJobs() {
  console.log("🚀 [CronJobs] Khởi động các tác vụ định kỳ...");
  
  // Lên lịch xóa các phiên chat cũ mỗi đêm vào lúc 02:00 sáng
  cron.schedule("0 2 * * *", async () => {
    try {
      console.log("⏰ [CronJobs] Bắt đầu tác vụ dọn dẹp chat hàng ngày...");
      
      // Kiểm tra số lượng phiên chat cũ trước khi xóa
      const oldSessionsCount = await getOldChatSessionsCount();
      console.log(`📊 [CronJobs] Tìm thấy ${oldSessionsCount} phiên chat cũ`);
      
      if (oldSessionsCount > 0) {
        // Thực hiện xóa
        const deletedCount = await deleteOldChatSessions();
        console.log(`✅ [CronJobs] Hoàn thành dọn dẹp: đã xóa ${deletedCount} phiên chat`);
      } else {
        console.log("ℹ️ [CronJobs] Không có phiên chat cũ nào cần xóa");
      }
      
      // Lấy thống kê sau khi dọn dẹp
      const stats = await getChatStatistics();
      console.log(`📈 [CronJobs] Thống kê sau dọn dẹp:`, stats);
      
    } catch (error) {
      console.error("❌ [CronJobs] Lỗi trong tác vụ dọn dẹp chat:", error);
    }
  });
  
  console.log("✅ [CronJobs] Đã lên lịch dọn dẹp chat hàng ngày lúc 02:00");
  
  // Lên lịch dọn dẹp token reset password hết hạn mỗi giờ
  cron.schedule("0 * * * *", async () => {
    try {
      console.log("⏰ [CronJobs] Bắt đầu tác vụ dọn dẹp token reset password hàng giờ...");
      
      // Kiểm tra và dọn dẹp token hết hạn
      const result = await checkAndCleanupTokens(10); // Cleanup nếu có >= 10 token hết hạn
      
      if (result.triggered) {
        console.log(`✅ [CronJobs] Hoàn thành dọn dẹp token: đã xóa ${result.deletedCount} token hết hạn`);
        console.log(`📊 [CronJobs] Còn lại ${result.remainingExpired} token hết hạn`);
      } else {
        console.log(`ℹ️ [CronJobs] Không cần dọn dẹp token (chỉ có ${result.remainingExpired} token hết hạn)`);
      }
      
    } catch (error) {
      console.error("❌ [CronJobs] Lỗi trong tác vụ dọn dẹp token:", error);
    }
  });
  
  console.log("✅ [CronJobs] Đã lên lịch dọn dẹp token reset password hàng giờ");
  
  // Lên lịch dọn dẹp token reset password hàng ngày vào lúc 03:00 sáng (sau chat cleanup)
  cron.schedule("0 3 * * *", async () => {
    try {
      console.log("⏰ [CronJobs] Bắt đầu tác vụ dọn dẹp token reset password hàng ngày...");
      
      // Dọn dẹp tất cả token hết hạn
      const deletedCount = await deleteExpiredPasswordResetTokens();
      console.log(`✅ [CronJobs] Hoàn thành dọn dẹp token hàng ngày: đã xóa ${deletedCount} token hết hạn`);
      
      // Lấy thống kê sau khi dọn dẹp
      const stats = await getPasswordResetTokenStats();
      console.log(`📈 [CronJobs] Thống kê token sau dọn dẹp:`, {
        total: stats.total_tokens,
        active: stats.active_tokens,
        expired: stats.expired_tokens
      });
      
    } catch (error) {
      console.error("❌ [CronJobs] Lỗi trong tác vụ dọn dẹp token hàng ngày:", error);
    }
  });
  
  console.log("✅ [CronJobs] Đã lên lịch dọn dẹp token reset password hàng ngày lúc 03:00");
}
module.exports = {
  startCronJobs,
};
