// File thực hiện định kỳ hàm startCronJobs có chức năng xóa lịch sử tin nhắn không dùng sau 15 ngày để giải phóng

const cron = require("node-cron");
const { 
  deleteOldChatSessions, 
  getOldChatSessionsCount, 
  getChatStatistics 
} = require("../chatCleanupService");

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
}
module.exports = {
  startCronJobs,
};
