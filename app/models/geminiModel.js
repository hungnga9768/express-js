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

startTranslationSession(sourceLang, targetLang, systemInstructionContent = null) {
    let instruction = systemInstructionContent;
    if (!instruction) {
      // Câu lệnh dịch đã được sửa
      instruction = `Bạn là một trợ lý dịch thuật chuyên nghiệp. Nhiệm vụ của bạn là dịch văn bản được cung cấp từ ${sourceLang} sang ${targetLang} một cách chính xác, tự nhiên và giữ nguyên ý nghĩa gốc. Chỉ cung cấp bản dịch, không thêm bất kỳ lời giải thích hay bình luận nào khác.`;
    }
    const chatOptions = {
      generationConfig: {
        maxOutputTokens: config.MAX_OUTPUT_TOKENS,
      },
      systemInstruction: {
        parts: [{ text: instruction }],
      },
    };
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
 async generateSingleResponse(promptTextForUserRole, systemInstructionText = null) {
  const history = promptTextForUserRole
    ? [{ role: "user", parts: [{ text: promptTextForUserRole }] }]
    : [];

  const chatSessionToUse = this.startChatSession(history, systemInstructionText);

  let messageToSend = " "; // Mặc định

  // Xử lý trường hợp không có prompt chính từ người dùng
  if (!promptTextForUserRole) {
    if (systemInstructionText) {
      // Có system instruction nhưng không có user prompt cụ thể.
      // Hiện tại, bạn đang ném lỗi ở đây. Đây là một lựa chọn thiết kế.
      // Nếu muốn nó vẫn chạy, bạn có thể đặt messageToSend thành một trigger khác.
      // Ví dụ: messageToSend = "Please proceed based on the system instruction.";
      throw new Error("promptTextForUserRole is required for this function to generate a response, even with a system instruction.");
    } else {
      // Không có cả user prompt lẫn system instruction.
      throw new Error("Cannot generate a response without any prompt or system instruction.");
    }
  }
  // Nếu có promptTextForUserRole, messageToSend sẽ là " " để kích hoạt phản hồi.

  const result = await chatSessionToUse.sendMessage(messageToSend);
  return result.response.text();
}
}

// Export một instance của GeminiModel để sử dụng như một singleton
module.exports = new GeminiModel();
