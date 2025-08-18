const vocabularyModel = require("../../models/vocabulary");
const { listItems } = require("../../utils/listItemsAPI");
const multer = require("multer");
const csv = require("csv-parser");
const fs = require("fs");
const cloudinaryService = require("../../services/cloudinaryService");

module.exports = {
  // Hiển thị danh sách từ vựng (admin)
  async index(req, res) {
    try {
      const { search, page = 1, limit = 20, hskLevel } = req.query;
      const offset = (page - 1) * limit;

      const [vocabulary, totalRows] = await Promise.all([
        vocabularyModel.getAll(search, offset, parseInt(limit), hskLevel),
        vocabularyModel.getTotalRow(search, hskLevel)
      ]);

      const totalPages = Math.ceil(totalRows / limit);
      const currentPage = Math.min(Math.max(parseInt(page), 1), totalPages);

      res.render("ds-vocabulary", {
        title: "Quản lý từ vựng",
        data: vocabulary,
        pagination: {
          currentPage,
          totalPages,
          totalItems: totalRows,
          itemsPerPage: parseInt(limit)
        },
        search: search || "",
        hskLevel: hskLevel || "",
        success: req.query.success || null,
        error: req.query.error || null
      });
    } catch (error) {
      console.error("Error in vocabulary index:", error);
      res.status(500).render("error", { 
        message: "Lỗi khi tải danh sách từ vựng" 
      });
    }
  },

  // Hiển thị form tạo từ vựng
  createForm(req, res) {
    res.render("add-vocabulary", {
      title: "Thêm từ vựng mới",
      hskLevels: [1, 2, 3, 4, 5, 6],
      partsOfSpeech: [
        "noun", "verb", "adjective", "adverb", 
        "pronoun", "preposition", "conjunction", "interjection"
      ]
    });
  },

  // Tạo từ vựng mới
  async create(req, res) {
    try {
      const {
        simplified_chinese,
        traditional_chinese,
        pinyin,
        english_meaning,
        part_of_speech,
        hsk_level,
        example_sentence_chinese,
        example_sentence_pinyin,
        example_sentence_english
      } = req.body;

      // Validation
      if (!simplified_chinese || !pinyin || !english_meaning) {
        return res.render("add-vocabulary", {
          title: "Thêm từ vựng mới",
          error: "Các trường bắt buộc không được để trống",
          data: req.body,
          hskLevels: [1, 2, 3, 4, 5, 6],
          partsOfSpeech: [
            "noun", "verb", "adjective", "adverb", 
            "pronoun", "preposition", "conjunction", "interjection"
          ]
        });
      }

      // Kiểm tra trùng lặp
      const isDuplicate = await vocabularyModel.checkDuplicate(simplified_chinese);
      if (isDuplicate) {
        return res.render("add-vocabulary", {
          title: "Thêm từ vựng mới",
          error: "Từ vựng này đã tồn tại",
          data: req.body,
          hskLevels: [1, 2, 3, 4, 5, 6],
          partsOfSpeech: [
            "noun", "verb", "adjective", "adverb", 
            "pronoun", "preposition", "conjunction", "interjection"
          ]
        });
      }

      // Xử lý upload audio nếu có
      let audio_url = null;
      if (req.file) {
        const result = await cloudinaryService.uploadAudio(req.file.path, 'vocabulary-audio');
        if (result.success) {
          audio_url = result.public_id;
        } else {
          console.error('Lỗi upload audio lên Cloudinary:', result.error);
          throw new Error('Không thể upload audio lên Cloudinary: ' + result.error);
        }
      }

      const vocabData = {
        simplified_chinese,
        traditional_chinese: traditional_chinese || null,
        pinyin,
        english_meaning,
        part_of_speech: part_of_speech || null,
        hsk_level: parseInt(hsk_level) || 1,
        example_sentence_chinese: example_sentence_chinese || null,
        example_sentence_pinyin: example_sentence_pinyin || null,
        example_sentence_english: example_sentence_english || null,
        audio_url
      };

      await vocabularyModel.create(vocabData);

      res.redirect("/admin/vocabulary?success=Thêm từ vựng thành công");
    } catch (error) {
      console.error("Error creating vocabulary:", error);
      res.render("add-vocabulary", {
        title: "Thêm từ vựng mới",
        error: "Lỗi khi tạo từ vựng",
        data: req.body,
        hskLevels: [1, 2, 3, 4, 5, 6],
        partsOfSpeech: [
          "noun", "verb", "adjective", "adverb", 
          "pronoun", "preposition", "conjunction", "interjection"
        ]
      });
    }
  },

  // Hiển thị form chỉnh sửa
  async editForm(req, res) {
    try {
      const { id } = req.params;
      const vocabulary = await vocabularyModel.getById(id);

      if (!vocabulary) {
        return res.status(404).render("error", { 
          message: "Không tìm thấy từ vựng" 
        });
      }

      res.render("edit-vocabulary", {
        title: "Chỉnh sửa từ vựng",
        vocabulary,
        hskLevels: [1, 2, 3, 4, 5, 6],
        partsOfSpeech: [
          "noun", "verb", "adjective", "adverb", 
          "pronoun", "preposition", "conjunction", "interjection"
        ]
      });
    } catch (error) {
      console.error("Error in vocabulary edit form:", error);
      res.status(500).render("error", { 
        message: "Lỗi khi tải form chỉnh sửa" 
      });
    }
  },

  // Cập nhật từ vựng
  async update(req, res) {
    try {
      const { id } = req.params;
      const {
        simplified_chinese,
        traditional_chinese,
        pinyin,
        english_meaning,
        part_of_speech,
        hsk_level,
        example_sentence_chinese,
        example_sentence_pinyin,
        example_sentence_english
      } = req.body;

      // Validation
      if (!simplified_chinese || !pinyin || !english_meaning) {
        return res.status(400).json({
          success: false,
          message: "Các trường bắt buộc không được để trống"
        });
      }

      // Kiểm tra trùng lặp (trừ từ hiện tại)
      const isDuplicate = await vocabularyModel.checkDuplicate(simplified_chinese, id);
      if (isDuplicate) {
        return res.status(400).json({
          success: false,
          message: "Từ vựng này đã tồn tại"
        });
      }

      // Lấy thông tin từ vựng cũ để xóa audio
      const oldVocabulary = await vocabularyModel.getById(id);
      
      // Xử lý upload audio nếu có
      let audio_url = null;
      if (req.file) {
        const result = await cloudinaryService.uploadAudio(req.file.path, 'vocabulary-audio');
        if (result.success) {
                     // Xóa audio cũ trên Cloudinary nếu có
           if (oldVocabulary && oldVocabulary.audio_url) {
            try {
              // Sử dụng helper để trích xuất public_id chính xác
              const cloudinaryHelper = require('../../utils/cloudinaryHelper');
              const oldPublicId = cloudinaryHelper.extractPublicId(oldVocabulary.audio_url);
              
              // Kiểm tra xem có phải là public_id hợp lệ không
              if (oldPublicId) {
                const deleteResult = await cloudinaryService.deleteFile(oldPublicId, 'video');
                if (!deleteResult.success) {
                  console.error('❌ Lỗi khi xóa audio cũ:', deleteResult.error);
                }
              }
            } catch (deleteError) {
              console.error('❌ Exception khi xóa audio cũ:', deleteError);
            }
          }
          audio_url = result.public_id;
        } else {
          console.error('Lỗi upload audio lên Cloudinary:', result.error);
          throw new Error('Không thể upload audio lên Cloudinary: ' + result.error);
        }
      } else if (selected_audio) {
                 // Nếu chọn audio từ Cloudinary, xóa audio cũ nếu có
         if (oldVocabulary && oldVocabulary.audio_url && oldVocabulary.audio_url !== selected_audio && selected_audio) {
          try {
            // Sử dụng helper để trích xuất public_id chính xác
            const cloudinaryHelper = require('../../utils/cloudinaryHelper');
            const oldPublicId = cloudinaryHelper.extractPublicId(oldVocabulary.audio_url);
            
            // Kiểm tra xem có phải là public_id hợp lệ không
            if (oldPublicId) {
              const deleteResult = await cloudinaryService.deleteFile(oldPublicId, 'video');
              if (!deleteResult.success) {
                console.error('❌ Lỗi khi xóa audio cũ:', deleteResult.error);
              }
            }
          } catch (deleteError) {
            console.error('❌ Exception khi xóa audio cũ:', deleteError);
          }
        }
        audio_url = selected_audio;
      } else {
        audio_url = oldVocabulary.audio_url;
      }

      const vocabData = {
        simplified_chinese,
        traditional_chinese: traditional_chinese || null,
        pinyin,
        english_meaning,
        part_of_speech: part_of_speech || null,
        hsk_level: parseInt(hsk_level) || 1,
        example_sentence_chinese: example_sentence_chinese || null,
        example_sentence_pinyin: example_sentence_pinyin || null,
        example_sentence_english: example_sentence_english || null,
        audio_url
      };

      const success = await vocabularyModel.update(id, vocabData);

      if (success) {
        res.json({
          success: true,
          message: "Cập nhật từ vựng thành công"
        });
      } else {
        res.status(400).json({
          success: false,
          message: "Không thể cập nhật từ vựng"
        });
      }
    } catch (error) {
      console.error("Error updating vocabulary:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi khi cập nhật từ vựng"
      });
    }
  },

  // Xóa từ vựng
  async delete(req, res) {
    try {
      const { id } = req.params;
      const success = await vocabularyModel.delete(id);

      if (success) {
        res.json({
          success: true,
          message: "Xóa từ vựng thành công"
        });
      } else {
        res.status(400).json({
          success: false,
          message: "Không thể xóa từ vựng"
        });
      }
    } catch (error) {
      console.error("Error deleting vocabulary:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi khi xóa từ vựng"
      });
    }
  },

  // Hiển thị form import từ vựng
  importForm(req, res) {
    res.render("import-vocabulary", {
      title: "Import từ vựng từ file CSV",
      error: req.query.error || null,
      success: req.query.success || null
    });
  },

  // Xử lý import từ vựng từ CSV
  async importFromCSV(req, res) {
    try {
      if (!req.file) {
        return res.redirect("/admin/vocabulary/import?error=Vui lòng chọn file CSV");
      }

      const results = [];
      const errors = [];
      let importedCount = 0;
      let duplicateCount = 0;

      // Đọc file CSV
      fs.createReadStream(req.file.path)
        .pipe(csv())
        .on('data', (data) => results.push(data))
        .on('end', async () => {
          try {
            // Xử lý từng dòng CSV
            for (let i = 0; i < results.length; i++) {
              const row = results[i];
              const rowNumber = i + 2; // +2 vì CSV bắt đầu từ dòng 2

              try {
                // Validate dữ liệu
                if (!row.simplified_chinese || !row.pinyin || !row.english_meaning) {
                  errors.push(`Dòng ${rowNumber}: Thiếu thông tin bắt buộc`);
                  continue;
                }

                // Kiểm tra trùng lặp
                const isDuplicate = await vocabularyModel.checkDuplicate(row.simplified_chinese);
                if (isDuplicate) {
                  duplicateCount++;
                  continue;
                }

                // Chuẩn bị dữ liệu
                const vocabData = {
                  simplified_chinese: row.simplified_chinese.trim(),
                  traditional_chinese: row.traditional_chinese ? row.traditional_chinese.trim() : null,
                  pinyin: row.pinyin.trim(),
                  english_meaning: row.english_meaning.trim(),
                  part_of_speech: row.part_of_speech ? row.part_of_speech.trim() : null,
                  hsk_level: row.hsk_level ? parseInt(row.hsk_level) : 1,
                  example_sentence_chinese: row.example_sentence_chinese ? row.example_sentence_chinese.trim() : null,
                  example_sentence_pinyin: row.example_sentence_pinyin ? row.example_sentence_pinyin.trim() : null,
                  example_sentence_english: row.example_sentence_english ? row.example_sentence_english.trim() : null
                };

                // Tạo từ vựng
                await vocabularyModel.create(vocabData);
                importedCount++;

              } catch (rowError) {
                errors.push(`Dòng ${rowNumber}: ${rowError.message}`);
              }
            }

            // Xóa file tạm
            fs.unlinkSync(req.file.path);

            // Redirect với thông báo
            let  message = `Import thành công ${importedCount} từ vựng`;
            if (duplicateCount > 0) {
              message += `, ${duplicateCount} từ bị trùng lặp`;
            }
            if (errors.length > 0) {
              message += `, ${errors.length} lỗi`;
            }

            res.redirect(`/admin/vocabulary/import?success=${encodeURIComponent(message)}`);

          } catch (processError) {
            console.error("Error processing CSV:", processError);
            // Xóa file tạm
            if (fs.existsSync(req.file.path)) {
              fs.unlinkSync(req.file.path);
            }
            res.redirect("/admin/vocabulary/import?error=Lỗi khi xử lý file CSV");
          }
        });

    } catch (error) {
      console.error("Error importing vocabulary:", error);
      // Xóa file tạm nếu có lỗi
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      res.redirect("/admin/vocabulary/import?error=Lỗi khi import từ vựng");
    }
  },

  // Export từ vựng ra CSV
  async exportToCSV(req, res) {
    try {
      const { hskLevel } = req.query;
      let vocabulary;

      if (hskLevel) {
        vocabulary = await vocabularyModel.getByHSKLevel(parseInt(hskLevel));
      } else {
        vocabulary = await vocabularyModel.getAll("", 0, 10000); // Lấy tất cả
      }

      // Tạo nội dung CSV
      let csvContent = "simplified_chinese,traditional_chinese,pinyin,english_meaning,part_of_speech,hsk_level,example_sentence_chinese,example_sentence_pinyin,example_sentence_english\n";

      vocabulary.forEach(vocab => {
        const row = [
          `"${vocab.simplified_chinese || ''}"`,
          `"${vocab.traditional_chinese || ''}"`,
          `"${vocab.pinyin || ''}"`,
          `"${vocab.english_meaning || ''}"`,
          `"${vocab.part_of_speech || ''}"`,
          vocab.hsk_level || '',
          `"${vocab.example_sentence_chinese || ''}"`,
          `"${vocab.example_sentence_pinyin || ''}"`,
          `"${vocab.example_sentence_english || ''}"`
        ].join(',');
        csvContent += row + '\n';
      });

      // Set headers cho download
      const filename = hskLevel ? `vocabulary_hsk${hskLevel}_${new Date().toISOString().split('T')[0]}.csv` : `vocabulary_all_${new Date().toISOString().split('T')[0]}.csv`;
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(csvContent);

    } catch (error) {
      console.error("Error exporting vocabulary:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi khi export từ vựng"
      });
    }
  },

  // Lấy chi tiết từ vựng theo ID (cho API)
  async getById(req, res) {
    try {
      const { id } = req.params;
      const vocabulary = await vocabularyModel.getById(id);

      if (!vocabulary) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy từ vựng"
        });
      }

      res.json({
        success: true,
        data: vocabulary
      });
    } catch (error) {
      console.error("Error getting vocabulary by ID:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi khi lấy thông tin từ vựng"
      });
    }
  }
};