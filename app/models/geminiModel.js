// backend/models/geminiModel.js
const { GoogleGenerativeAI } = require("@google/generative-ai");
const config = require("../../config/gemini"); // Import cấu hình

const genAI = new GoogleGenerativeAI(config.GEMINI_API_KEY);
// Đảm bảo model mặc định của bạn là 'gemini-1.5-flash' trong config/gemini.js
// hoặc bạn có thể chỉ định trực tiếp ở đây:
// const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
const model = genAI.getGenerativeModel({ model: config.DEFAULT_GEMINI_MODEL }); // Giả định DEFAULT_GEMINI_MODEL là 'gemini-1.5-flash'

class GeminiModel {
  /**
   * Khởi tạo một phiên chat mới hoặc tiếp tục phiên chat với lịch sử đã cho.
   * @param {Array} historyForGemini - Lịch sử cuộc trò chuyện (định dạng Gemini API: user/model) từ frontend/database.
   * @param {string} systemInstructionContent - Chuỗi hướng dẫn hệ thống cho AI (initial_prompt).
   * @returns {object} - Đối tượng chat session của Gemini.
   */
  startChatSession(historyForGemini = [], systemInstructionContent = null) {
    const chatOptions = {
      history: historyForGemini, // Lịch sử này chỉ chứa user/model messages
      generationConfig: {
        maxOutputTokens: config.MAX_OUTPUT_TOKENS,
      },
    };

    // Nếu có systemInstructionContent, thêm nó vào tham số systemInstruction
    if (systemInstructionContent) {
      // systemInstruction cần được gói gọn trong object Content
      chatOptions.systemInstruction = {
        parts: [{ text: systemInstructionContent }],
      };
    }

    return model.startChat(chatOptions);
  }

  /**
   * Gửi tin nhắn đến Gemini và nhận phản hồi.
   * @param {string} message - Tin nhắn hiện tại từ người dùng (dạng chuỗi).
   * @param {object} chatSession - Phiên chat đã khởi tạo (đối tượng chat từ startChatSession).
   * @returns {Promise<string>} - Phản hồi văn bản từ Gemini.
   */
  async sendMessageToGemini(message, chatSession) {
    if (!chatSession) {
      throw new Error(
        "Chat session chưa được khởi tạo. Vui lòng gọi startChatSession trước."
      );
    }
    // Tin nhắn mới cần được gói gọn trong mảng parts
    const result = await chatSession.sendMessage([{ text: message }]);
    const response = await result.response;
    return response.text();
  }
}

// Export một instance của GeminiModel để sử dụng như một singleton
module.exports = new GeminiModel();
