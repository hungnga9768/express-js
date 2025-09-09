const express = require("express");
const router = express.Router();
const pool = require("../../connect-mysql");
const geminiModel = require("../../app/models/geminiModel");

// ===== SPEECH PRACTICE (PHÁT ÂM + LUYỆN NGHE) =====

// 1. Lấy câu hỏi ngẫu nhiên (dùng chung cho cả phát âm và luyện nghe)
router.get("/question", async (req, res) => {
  try {
    const { level = 'all' } = req.query;
    
    // Lấy từ vựng theo cấp độ
    let sql, params;
    if (level === 'all') {
      sql = `
        SELECT 
          word_id,
          simplified_chinese,
          pinyin,
          english_meaning,
          hsk_level,
          example_sentence_chinese,
          example_sentence_pinyin,
          example_sentence_english
        FROM vocabulary 
        WHERE example_sentence_chinese IS NOT NULL 
        AND example_sentence_chinese != ''
        ORDER BY RAND() 
        LIMIT 1
      `;
      params = [];
    } else {
      const hskLevel = parseInt(level);
      sql = `
        SELECT 
          word_id,
          simplified_chinese,
          pinyin,
          english_meaning,
          hsk_level,
          example_sentence_chinese,
          example_sentence_pinyin,
          example_sentence_english
        FROM vocabulary 
        WHERE hsk_level = ? 
        AND example_sentence_chinese IS NOT NULL 
        AND example_sentence_chinese != ''
        ORDER BY RAND() 
        LIMIT 1
      `;
      params = [hskLevel];
    }
    
    const [rows] = await pool.query(sql, params);
    
    if (rows.length === 0) {
      return res.json({
        success: false,
        message: "Không tìm thấy câu hỏi"
      });
    }
    
    const word = rows[0];
    
    // Tạo câu hoàn chỉnh với AI
    const sentenceData = await generateCompleteSentence(word);
    
    res.json({
      success: true,
      data: {
        word_id: word.word_id,
        target_word: word.simplified_chinese,
        target_word_pinyin: word.pinyin,
        target_word_meaning: word.english_meaning,
        hsk_level: word.hsk_level,
        target_sentence: sentenceData.sentence,
        target_sentence_pinyin: sentenceData.sentence_pinyin,
        target_sentence_meaning: sentenceData.sentence_meaning
      }
    });
    
  } catch (error) {
    console.error("❌ Error getting question:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi khi lấy câu hỏi",
      error: error.message
    });
  }
});

// 2. Chấm điểm phát âm
router.post("/pronunciation/check", async (req, res) => {
  try {
    const { 
      user_speech, 
      target_sentence, 
      target_sentence_pinyin,
      target_word,
      target_word_pinyin 
    } = req.body;

    if (!user_speech || !target_sentence || !target_sentence_pinyin) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng cung cấp user_speech, target_sentence và target_sentence_pinyin"
      });
    }

    console.log(`🎤 Checking pronunciation: "${user_speech}" vs "${target_sentence}"`);

    // Chấm điểm phát âm bằng Gemini AI
    const result = await checkSentencePronunciation(
      user_speech, 
      target_sentence, 
      target_sentence_pinyin,
      target_word,
      target_word_pinyin
    );

    res.json({
      success: true,
      data: {
        user_speech: user_speech,
        target_sentence: target_sentence,
        target_sentence_pinyin: target_sentence_pinyin,
        target_word: target_word,
        target_word_pinyin: target_word_pinyin,
        score: result.score,
        is_correct: result.is_correct,
        feedback: result.feedback,
        errors: result.errors,
        word_accuracy: result.word_accuracy,
        sentence_accuracy: result.sentence_accuracy,
        type: "pronunciation"
      }
    });

  } catch (error) {
    console.error("❌ Error checking pronunciation:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi khi chấm điểm phát âm",
      error: error.message
    });
  }
});

// 3. Chấm điểm luyện nghe
router.post("/listening/check", async (req, res) => {
  try {
    const { 
      user_input, 
      target_sentence, 
      target_sentence_pinyin,
      target_word,
      target_word_pinyin 
    } = req.body;

    if (!user_input || !target_sentence || !target_sentence_pinyin) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng cung cấp user_input, target_sentence và target_sentence_pinyin"
      });
    }

    console.log(`🎧 Checking listening: "${user_input}" vs "${target_sentence}"`);

    // Chấm điểm luyện nghe bằng Gemini AI
    const result = await checkListeningComprehension(
      user_input, 
      target_sentence, 
      target_sentence_pinyin,
      target_word,
      target_word_pinyin
    );

    res.json({
      success: true,
      data: {
        user_input: user_input,
        target_sentence: target_sentence,
        target_sentence_pinyin: target_sentence_pinyin,
        target_word: target_word,
        target_word_pinyin: target_word_pinyin,
        score: result.score,
        is_correct: result.is_correct,
        feedback: result.feedback,
        errors: result.errors,
        word_accuracy: result.word_accuracy,
        sentence_accuracy: result.sentence_accuracy,
        type: "listening"
      }
    });

  } catch (error) {
    console.error("❌ Error checking listening:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi khi chấm điểm luyện nghe",
      error: error.message
    });
  }
});

// ===== HELPER FUNCTIONS =====

// Tạo câu hoàn chỉnh với AI
async function generateCompleteSentence(word) {
  try {
    const systemInstruction = `Bạn là chuyên gia tạo câu tiếng Trung.
Tạo một câu hoàn chỉnh chứa từ "${word.simplified_chinese}" (${word.pinyin}) - ${word.english_meaning}.
Cấp độ HSK: ${word.hsk_level}

Yêu cầu:
- Câu phải tự nhiên, có nghĩa
- Phù hợp với cấp độ HSK ${word.hsk_level}
- Chứa từ "${word.simplified_chinese}"
- Có pinyin đầy đủ cho cả câu
- Có bản dịch tiếng Việt

Trả về JSON:
{
  "sentence": "câu tiếng Trung",
  "sentence_pinyin": "pinyin của câu",
  "sentence_meaning": "nghĩa tiếng Việt"
}`;

    const prompt = `Tạo câu chứa từ "${word.simplified_chinese}" (${word.pinyin}) - ${word.english_meaning}. Dịch sang tiếng Việt.`;
    
    const geminiResponse = await geminiModel.generateSingleResponse(prompt, systemInstruction);
    
    // Parse JSON
    const jsonMatch = geminiResponse.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    } else {
      throw new Error("Không parse được JSON");
    }

  } catch (error) {
    console.error("❌ Gemini error:", error);
    
    // Fallback: sử dụng example sentence có sẵn
    return {
      sentence: word.example_sentence_chinese || `${word.simplified_chinese}很好`,
      sentence_pinyin: word.example_sentence_pinyin || `${word.pinyin} hěn hǎo`,
      sentence_meaning: word.example_sentence_english || `${word.english_meaning} rất tốt`
    };
  }
}

// Chấm điểm phát âm câu hoàn chỉnh với Gemini AI
async function checkSentencePronunciation(userSpeech, targetSentence, targetSentencePinyin, targetWord, targetWordPinyin) {
  try {
    const systemInstruction = `Bạn là chuyên gia chấm điểm phát âm tiếng Trung.
So sánh:
- Người dùng phát âm: "${userSpeech}"
- Câu mục tiêu: "${targetSentence}" (${targetSentencePinyin})
- Từ chính: "${targetWord}" (${targetWordPinyin})

Đánh giá phát âm:
1. Phát âm từ chính "${targetWord}"
2. Phát âm cả câu
3. Ngữ điệu và nhịp điệu
4. Thanh điệu từng từ
5. Độ rõ ràng và tự nhiên

Trả về JSON:
{
  "score": điểm từ 0-100,
  "is_correct": true/false,
  "feedback": "nhận xét chi tiết về phát âm",
  "errors": ["lỗi phát âm 1", "lỗi phát âm 2"],
  "word_accuracy": điểm từ chính (0-100),
  "sentence_accuracy": điểm cả câu (0-100)
}`;

    const prompt = `Chấm điểm phát âm câu: "${userSpeech}" vs "${targetSentence}" (${targetSentencePinyin})`;
    
    const geminiResponse = await geminiModel.generateSingleResponse(prompt, systemInstruction);
    
    // Parse JSON
    const jsonMatch = geminiResponse.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    } else {
      throw new Error("Không parse được JSON");
    }

  } catch (error) {
    console.error("❌ Gemini error:", error);
    
    // Fallback đơn giản
    const isCorrect = userSpeech === targetSentence;
    return {
      score: isCorrect ? 100 : Math.floor(Math.random() * 60) + 40,
      is_correct: isCorrect,
      feedback: isCorrect ? "Phát âm chính xác!" : "Cần luyện tập thêm",
      errors: isCorrect ? [] : ["Phát âm chưa chính xác"],
      word_accuracy: isCorrect ? 100 : Math.floor(Math.random() * 60) + 40,
      sentence_accuracy: isCorrect ? 100 : Math.floor(Math.random() * 60) + 40
    };
  }
}

// Chấm điểm luyện nghe với Gemini AI
async function checkListeningComprehension(userInput, targetSentence, targetSentencePinyin, targetWord, targetWordPinyin) {
  try {
    const systemInstruction = `Bạn là chuyên gia chấm điểm luyện nghe tiếng Trung.
So sánh:
- Người dùng nghe được: "${userInput}"
- Câu mục tiêu: "${targetSentence}" (${targetSentencePinyin})
- Từ chính: "${targetWord}" (${targetWordPinyin})

Đánh giá khả năng nghe:
1. Độ chính xác của từ chính "${targetWord}"
2. Độ chính xác của cả câu
3. Khả năng phân biệt âm thanh
4. Khả năng hiểu ngữ cảnh
5. Khả năng nghe các từ phụ (de, le, ma, etc.)

Trả về JSON:
{
  "score": điểm từ 0-100,
  "is_correct": true/false,
  "feedback": "nhận xét chi tiết về khả năng nghe",
  "errors": ["lỗi nghe 1", "lỗi nghe 2"],
  "word_accuracy": điểm từ chính (0-100),
  "sentence_accuracy": điểm cả câu (0-100)
}`;

    const prompt = `Chấm điểm luyện nghe: "${userInput}" vs "${targetSentence}" (${targetSentencePinyin})`;
    
    const geminiResponse = await geminiModel.generateSingleResponse(prompt, systemInstruction);
    
    // Parse JSON
    const jsonMatch = geminiResponse.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    } else {
      throw new Error("Không parse được JSON");
    }

  } catch (error) {
    console.error("❌ Gemini error:", error);
    
    // Fallback đơn giản
    const isCorrect = userInput === targetSentence;
    return {
      score: isCorrect ? 100 : Math.floor(Math.random() * 60) + 40,
      is_correct: isCorrect,
      feedback: isCorrect ? "Nghe chính xác!" : "Cần luyện nghe thêm",
      errors: isCorrect ? [] : ["Nghe chưa chính xác"],
      word_accuracy: isCorrect ? 100 : Math.floor(Math.random() * 60) + 40,
      sentence_accuracy: isCorrect ? 100 : Math.floor(Math.random() * 60) + 40
    };
  }
}

module.exports = router;
