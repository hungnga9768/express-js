//file thực hiện định kì  hàm startCronJobs  có chức năng xóa lịc sử tin nhắn không dùng sau 15 ngày để giải phóng

const cron = require("node-cron");
const { deleteOldChatSessions } = require("../../services/chatCleanupService"); // Điều chỉnh đường dẫn tương đối từ 'utils/cronjobs' đến 'services'

function startCronJobs() {
  // Lên lịch xóa các phiên chat cũ mỗi đêm vào lúc 02:00 sáng
  cron.schedule("0 2 * * *", async () => {
    await deleteOldChatSessions();
  });
}
module.exports = {
  startCronJobs,
};
