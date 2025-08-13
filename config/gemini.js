require("dotenv").config();
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
  console.error("Lỗi: GEMINI_API_KEY không được định nghĩa trong file .env");
  process.exit(1);
}

module.exports = {
  GEMINI_API_KEY,

  DEFAULT_GEMINI_MODEL: "gemini-2.0-flash",
  MAX_OUTPUT_TOKENS: 500,
};
