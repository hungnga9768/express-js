// backend/controllers/api/gemini.controller.js
const geminiModel = require("../../models/geminiModel");
const ChatTopicModel = require("../../models/settingchatai"); // Đã đổi tên model cho rõ ràng
const ChatHistoryModel = require("../../models/chatHistoryModel");
const { v4: uuidv4 } = require("uuid");

class ChatController {
  // ham goi chat ai
  async handleChat(req, res) {
    try {
      const { message, topicInternalName, sessionId } = req.body;
      const userId = req.user.user_id; // Giả định req.user.id nếu bạn có middleware Auth

      if (!message) {
        return res.status(400).json({ error: "Tin nhắn không được để trống." });
      }

      let currentSessionId = sessionId;
      let initialPromptContent = null; // Chuỗi hướng dẫn hệ thống
      let historyForGemini = []; // Lịch sử chat thực tế (user/model) để gửi tới Gemini

      // 1. Lấy Initial Prompt từ database (nếu có topicInternalName)
      if (topicInternalName) {
        const selectedTopic = await ChatTopicModel.findByInternalName(
          topicInternalName
        );
        if (selectedTopic && selectedTopic.initial_prompt) {
          initialPromptContent = selectedTopic.initial_prompt;
          console.log(
            "Initial Prompt từ DB (System Instruction):",
            initialPromptContent.substring(0, 50) + "..."
          );
        } else {
          console.warn(
            `Không tìm thấy chủ đề hoặc initial_prompt cho internal_name: ${topicInternalName}.`
          );
        }
      } else {
        console.warn(
          "Không có topicInternalName được cung cấp. AI sẽ trả lời chung chung."
        );
      }

      // 2. Xử lý Session ID và Lấy/Tạo lịch sử
      if (!currentSessionId) {
        // Đây là tin nhắn đầu tiên của một phiên mới: tạo sessionId mới
        currentSessionId = uuidv4();

        // Lưu ý: Không cần lưu initialPromptContent vào chat_history ở đây
        // nếu bạn chỉ dùng nó qua system_instruction của Gemini API.
        // historyForGemini vẫn rỗng ở đây vì chưa có tin nhắn nào được lưu.
      } else {
        // Phiên đã có: lấy toàn bộ lịch sử từ database
        const dbHistory = await ChatHistoryModel.getHistoryBySessionId(
          currentSessionId
        );
        // Lọc bỏ bất kỳ tin nhắn nào có role 'system' (từ các lần lưu cũ)
        // vì chúng ta sẽ dùng systemInstruction riêng biệt.
        historyForGemini = dbHistory.filter((entry) => entry.role !== "system");
      }

      // 3. Lưu tin nhắn của người dùng hiện tại vào database
      await ChatHistoryModel.saveMessage({
        userId: userId,
        sessionId: currentSessionId,
        role: "user", // Lưu vai trò 'user' trong DB
        content: message,
        topicInternalName: topicInternalName,
      });

      // 4. Khởi tạo phiên chat với Gemini
      // Truyền lịch sử chat thực tế và systemInstructionContent riêng biệt
      const chat = geminiModel.startChatSession(
        historyForGemini,
        initialPromptContent
      );

      // 5. Gửi tin nhắn hiện tại của người dùng đến Gemini và nhận phản hồi
      // Tin nhắn người dùng hiện tại được gửi riêng biệt trong sendMessageToGemini
      const reply = await geminiModel.sendMessageToGemini(message, chat);

      // 6. Lưu phản hồi của AI vào database
      await ChatHistoryModel.saveMessage({
        userId: userId,
        sessionId: currentSessionId,
        role: "model", // Lưu vai trò 'model' trong DB
        content: reply,
        topicInternalName: topicInternalName,
      });

      // 7. Gửi phản hồi về client cùng với sessionId mới (hoặc hiện tại)
      res.json({ reply: reply, sessionId: currentSessionId });
    } catch (error) {
      let errorMessage = "Đã xảy ra lỗi khi xử lý yêu cầu chat.";
      if (error.response && error.response.data && error.response.data.error) {
        errorMessage = error.response.data.error.message || errorMessage;
      } else if (error.message) {
        errorMessage = error.message;
      }
      res.status(500).json({ error: errorMessage });
    }
  }

  // ... (các hàm getUserChatSessions, getChatHistoryDetail) ...
  async getchattopics(req, res) {
    try {
      const chattopics = await ChatTopicModel.getAll("", 0, 10000);

      const data = chattopics
        .filter((i) => i.is_active !== 0)
        .map((i) => ({
          id: i.id,
          name: i.name,
          internal_name: i.internal_name,
          description: i.description,
          is_active: i.is_active,
          avatar_url: i.avatar_url,
        }));
      console.log(data);
      res
        .status(200)
        .json({ data: data, message: "lấy danh sách chatbot thành công" });
    } catch (err) {
      console.log(err);
    }
  }
  //get các seesion cho bản chat
  async getChatHistoryDetail(req, res) {
    const { sessionId } = req.params;
    const userId = req.user.user_id; // Điều chỉnh theo cách bạn thiết lập userId trong req
    try {
      const history = await ChatHistoryModel.getHistoryBySessionId(
        sessionId,
        userId
      );
      res.status(200).json({
        message: `Lịch sử chat cho phiên ${sessionId} đã được lấy thành công.`,
        data: history,
      });
    } catch (error) {
      console.error("Lỗi trong ChatController (getChatHistoryDetail):", error);
      const statusCode = error.statusCode || 500;
      res
        .status(statusCode)
        .json({ error: error.message || "Lỗi máy chủ khi lấy lịch sử chat." });
    }
  }
  async getUserChatSessions(req, res) {
    // userId được đặt bởi middleware xác thực (req.user.id hoặc req.userId)
    const userId = req.user.user_id; // Điều chỉnh theo cách bạn thiết lập userId trong req
    console.log(userId);
    try {
      const sessions = await ChatHistoryModel.getSessionsByUserId(userId);
      if (sessions.length === 0) {
        return res.status(200).json({
          // Trả về 200 OK nhưng data rỗng nếu không có phiên
          message: "Không tìm thấy phiên chat nào cho người dùng này.",
          data: [],
        });
      }
      res.status(200).json({
        message: "Lấy danh sách phiên chat thành công",
        data: sessions,
      });
    } catch (error) {
      console.error("Lỗi trong ChatController (getUserChatSessions):", error);
      res
        .status(500)
        .json({ error: "Lỗi máy chủ khi lấy danh sách phiên chat." });
    }
  }
}

module.exports = new ChatController();
