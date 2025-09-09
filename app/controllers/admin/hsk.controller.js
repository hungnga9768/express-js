const hskModel = require("../../models/hsk");
const cloudinaryService = require("../../services/cloudinaryService");
const cloudinaryHelper = require("../../utils/cloudinaryHelper");



module.exports = {
  async dashboard(req, res) {
    try {
      // Lấy thống kê tổng quan
      const statistics = await hskModel.getDashboardStats();
      const recent_tests = await hskModel.getRecentTests(5); // 5 đề thi gần đây
      
      res.render("hsk-dashboard", {
        title: "Dashboard HSK",
        statistics,
        recent_tests
      });
    } catch (e) {
      console.error(e);
      res.status(500).render("error", { message: "Lỗi tải dashboard HSK" });
    }
  },

  async index(req, res) {
    try {
      const { search = "", level = "", status = "", page = 1, limit = 20 } = req.query;
      const offset = (parseInt(page) - 1) * parseInt(limit);
      const [rows, total] = await Promise.all([
        hskModel.getTests({ search, level: level || null, status: status || null, offset, limit: parseInt(limit) }),
        hskModel.getTestsTotal({ search, level: level || null, status: status || null })
      ]);
      const totalPages = Math.max(1, Math.ceil(total / parseInt(limit)));
      res.render("ds-hsktests", {
        title: "Quản lý đề thi HSK",
        data: rows,
        search, level, status,
        Page: parseInt(page),
        totalPage: totalPages
      });
    } catch (e) {
      console.error(e);
      res.status(500).render("error", { message: "Lỗi tải danh sách đề thi" });
    }
  },

  async createForm(req, res) {
    res.render("add-hsktest", { title: "Thêm đề HSK", test: null });
  },

  async create(req, res) {
    try {
      const b = req.body;
      const payload = {
        hsk_level: parseInt(b.hsk_level),
        title: b.title,
        description: b.description || null,
        total_questions: parseInt(b.total_questions || 0),
        time_limit: b.time_limit ? parseInt(b.time_limit) : null,
        passing_score: parseInt(b.passing_score || 0),
        randomize_questions: b.randomize_questions ? 1 : 0,
        status: b.status || 'draft',
        is_active: b.is_active ? 1 : 0
      };
      const testId = await hskModel.createTest(payload);
      return res.redirect(`/admin/hsk/${testId}/questions?success=Tạo đề thi HSK thành công!`);
    } catch (e) {
      console.error(e);
      res.status(500).render("add-hsktest", { title: "Thêm đề HSK", error: "Không tạo được đề thi", test: req.body });
    }
  },

  async editForm(req, res) {
    const test = await hskModel.getTestById(req.params.id);
    if (!test) return res.status(404).render("error", { message: "Không tìm thấy đề" });
    res.render("add-hsktest", { title: "Sửa đề HSK", test });
  },

  async update(req, res) {
    try {
      const b = req.body;
      const payload = {
        hsk_level: parseInt(b.hsk_level),
        title: b.title,
        description: b.description || null,
        total_questions: parseInt(b.total_questions || 0),
        time_limit: b.time_limit ? parseInt(b.time_limit) : null,
        passing_score: parseInt(b.passing_score || 0),
        randomize_questions: b.randomize_questions ? 1 : 0,
        status: b.status || 'draft',
        is_active: b.is_active ? 1 : 0
      };
      await hskModel.updateTest(req.params.id, payload);
      res.redirect("/admin/hsk?success=Cập nhật đề thi HSK thành công!");
    } catch (e) {
      console.error(e);
      res.status(500).render("add-hsktest", { title: "Sửa đề HSK", error: "Không cập nhật được đề", test: { ...req.body, test_id: req.params.id } });
    }
  },

  async delete(req, res) {
    try {
      await hskModel.deleteTest(req.params.id);
      res.redirect("/admin/hsk?success=Xóa đề thi HSK thành công!");
    } catch (e) {
      console.error(e);
      res.status(500).render("error", { message: "Không xóa được đề" });
    }
  },

  // Toggle trộn câu hỏi
  async toggleRandomize(req, res) {
    try {
      const { id } = req.params;
      const { value } = req.body;
      await hskModel.updateTest(id, { randomize_questions: parseInt(value) });
      res.redirect("/admin/hsk?success=Cập nhật trạng thái trộn đề thành công!");
    } catch (e) {
      console.error(e);
      res.redirect("/admin/hsk?error=Không cập nhật được trạng thái trộn đề!");
    }
  },

  // Toggle trạng thái đề thi
  async toggleStatus(req, res) {
    try {
      const { id } = req.params;
      const { status } = req.body;
      await hskModel.updateTest(id, { status });
      res.redirect("/admin/hsk?success=Cập nhật trạng thái đề thi thành công!");
    } catch (e) {
      console.error(e);
      res.redirect("/admin/hsk?error=Không cập nhật được trạng thái đề thi!");
    }
  },

  // Toggle trạng thái hoạt động
  async toggleActive(req, res) {
    try {
      const { id } = req.params;
      const { value } = req.body;
      await hskModel.updateTest(id, { is_active: parseInt(value) });
      res.redirect("/admin/hsk?success=Cập nhật trạng thái hoạt động thành công!");
    } catch (e) {
      console.error(e);
      res.redirect("/admin/hsk?error=Không cập nhật được trạng thái hoạt động!");
    }
  },



  async questionsPage(req, res) {
    const testId = req.params.testId;
    const test = await hskModel.getTestById(testId);
    if (!test) return res.status(404).render("error", { message: "Không tìm thấy đề" });
    const questions = await hskModel.getQuestionsByTest(testId);
    
    // Lấy thông báo từ query parameters
    const messages = {
      success: req.query.success || null,
      error: req.query.error || null
    };
    
    res.render("hsk-questions", { 
      title: `Câu hỏi - ${test.title}`, 
      test, 
      questions,
      messages,
      isEditMode: false,
      editQuestion: null
    });
  },

  async editQuestionForm(req, res) {
    try {
      const { testId, questionId } = req.params;
      const test = await hskModel.getTestById(testId);
      if (!test) return res.status(404).render("error", { message: "Không tìm thấy đề" });
      
      const question = await hskModel.getQuestionById(questionId);
      if (!question) return res.status(404).render("error", { message: "Không tìm thấy câu hỏi" });
      

      
      // Parse JSON data nếu có (chỉ parse khi còn là string)
      if (question.options) {
        try {
          if (typeof question.options === 'string') {
            question.options = JSON.parse(question.options);
          }
        } catch (e) {
          question.options = [];
        }
      }
      
      if (question.matching_pairs) {
        try {
          if (typeof question.matching_pairs === 'string') {
            question.matching_pairs = JSON.parse(question.matching_pairs);
          }
        } catch (e) {
          question.matching_pairs = [];
        }
      }
      
      if (question.ordering_items) {
        try {
          if (typeof question.ordering_items === 'string') {
            question.ordering_items = JSON.parse(question.ordering_items);
          }
        } catch (e) {
          question.ordering_items = [];
        }
      }
      
      // Đảm bảo các field cơ bản có giá trị
      question.points = question.points || 1;
      question.order_in_test = question.order_in_test || 0;
      question.difficulty_level = question.difficulty_level || 'medium';
      question.explanation = question.explanation || '';
      

      
      // Lấy danh sách câu hỏi để hiển thị bên phải
      const questions = await hskModel.getQuestionsByTest(testId);
      
      res.render("hsk-questions", { 
        title: `Sửa câu hỏi - ${test.title}`, 
        test, 
        questions,
        messages: {},
        editQuestion: question,
        isEditMode: true
      });
    } catch (error) {
      console.error('Error in editQuestionForm:', error);
      res.status(500).render("error", { message: "Lỗi tải form sửa câu hỏi" });
    }
  },

  async previewQuestion(req, res) {
    try {
      const { testId, questionId } = req.params;


      const question = await hskModel.getQuestionById(questionId);
      if (!question) {
        return res.json({
          success: false,
          message: 'Không tìm thấy câu hỏi'
        });
      }

      // Kiểm tra xem câu hỏi có thuộc về test này không
      if (question.test_id != testId) {
        return res.json({
          success: false,
          message: 'Câu hỏi không thuộc về bài thi này'
        });
      }

      res.json({
        success: true,
        question: question
      });
    } catch (error) {
      console.error('❌ Error in previewQuestion:', error);
      res.json({
        success: false,
        message: 'Lỗi khi tải câu hỏi: ' + error.message
      });
    }
  },

  async createQuestion(req, res) {
    try {
      const { testId } = req.params;
      const b = req.body;
      
      // Debug log
      console.log('🔍 Debug createQuestion:', { testId, body: b, files: req.files });
      

      
      let options = [];
      let correct_answer = "";
      let matching_pairs = null, ordering_items = null, rewrite_instruction = null;

      if (b.question_type === "multiple_choice") {
        // Gom các lựa chọn thành mảng
        options = [b.option_A, b.option_B, b.option_C, b.option_D].filter(Boolean);
        correct_answer = b.correct_answer_multiple_choice;

      } else if (b.question_type === "fill_blank" || b.question_type === "cloze") {
        // Xử lý các ô trống động
        let blanks = [];
        let answers = [];
        
        // Kiểm tra có bao nhiêu chỗ trống được tạo
        let maxBlankIndex = 0;
        for (let i = 1; i <= 10; i++) { // Kiểm tra tối đa 10 chỗ trống
          if (b[`option_${i}_A`] || b[`option_${i}_B`] || b[`option_${i}_C`] || b[`option_${i}_D`]) {
            maxBlankIndex = i;
          }
        }
        
        // Xử lý từng chỗ trống
        for (let i = 1; i <= maxBlankIndex; i++) {
          const blankOptions = [
            b[`option_${i}_A`] || "",
            b[`option_${i}_B`] || "",
            b[`option_${i}_C`] || "",
            b[`option_${i}_D`] || ""
          ];
          
          // Chỉ thêm nếu có ít nhất 2 options
          if (blankOptions.filter(opt => opt.trim()).length >= 2) {
            blanks.push(blankOptions);
            answers.push(b[`correct_answer_${i}`] || "");
          }
        }
        
        options = blanks;
        correct_answer = answers.join(',');

      } else if (b.question_type === "matching") {
        // Xử lý matching pairs từ dynamic form
        const matchingPairs = [];
        const matchingAnswers = [];
        
        // Lấy tất cả matching_left và matching_right
        let pairIndex = 1;
        while (b[`matching_left_${pairIndex}`] && b[`matching_right_${pairIndex}`]) {
          const left = b[`matching_left_${pairIndex}`].trim();
          const right = b[`matching_right_${pairIndex}`].trim();
          
          if (left && right) {
            matchingPairs.push({ left, right });
            // Lấy đáp án tương ứng
            const answer = b[`matching_answer_${pairIndex}`];
            if (answer) {
              matchingAnswers.push(answer);
            }
          }
          pairIndex++;
        }
        
        matching_pairs = matchingPairs.length > 0 ? matchingPairs : null;
        correct_answer = matchingAnswers.length > 0 ? matchingAnswers.map((answer, index) => {
          const letter = String.fromCharCode(65 + index); // A, B, C, D, ...
          return `${letter}-${answer}`;
        }).join(',') : "";
        

      } else if (b.question_type === "ordering") {
        // Xử lý ordering items từ dynamic form
        const orderingItems = [];
        
        // Lấy tất cả ordering_item
        let itemIndex = 1;
        while (b[`ordering_item_${itemIndex}`]) {
          const item = b[`ordering_item_${itemIndex}`].trim();
          if (item) {
            orderingItems.push(item);
          }
          itemIndex++;
        }
        
        ordering_items = orderingItems.length > 0 ? orderingItems : null;
        correct_answer = b.correct_answer_text || "";
        

      } else if (b.question_type === "rewrite") {
        rewrite_instruction = b.rewrite_instruction || "";
        correct_answer = b.correct_answer_text || "";

      } else if (b.question_type === "true_false") {
        correct_answer = b.correct_answer_true_false || "";

      }

      // Xử lý upload media nếu có
      let audio_url = null;
      let image_url = null;
      
      // Chỉ xử lý file upload
      if (req.files) {
  
        const mediaResults = await cloudinaryService.uploadMedia(req.files);

        
        if (mediaResults.image && mediaResults.image.success) {
          image_url = mediaResults.image.public_id; // Lưu public_id
  
        }
        
        if (mediaResults.audio && mediaResults.audio.success) {
          audio_url = mediaResults.audio.public_id; // Lưu public_id
  
        }
      }

      const questionData = {
        test_id: testId, // Thêm test_id vào questionData
        skill_type: b.skill_type || 'listening', // Default value nếu không có
        question_type: b.question_type,
        question_text: b.question_text,
        audio_url,
        image_url,
        options,
        correct_answer,
        explanation: b.explanation || null,
        difficulty_level: b.difficulty_level || "easy",
        points: parseInt(b.points || 1),
        order_in_test: parseInt(b.order_in_test || 0),
        matching_pairs,
        ordering_items,
        rewrite_instruction
      };
      
      // Debug log questionData
      console.log('🔍 questionData:', questionData);
      

      
      const result = await hskModel.createQuestion(testId, questionData);

      
      // Redirect với thông báo thành công
      res.redirect(`/admin/hsk/${testId}/questions?success=Thêm câu hỏi thành công!`);
    } catch (e) {
      console.error('❌ Error creating question:', e);
      // Redirect với thông báo lỗi
      res.redirect(`/admin/hsk/${testId}/questions?error=Không thêm được câu hỏi: ${e.message}`);
    }
  },

  async updateQuestion(req, res) {
    
    
    const { testId, questionId } = req.params;
    
    
    
    if (!testId) {
      console.error('❌ testId is missing from params:', req.params);
      return res.redirect('/admin/hsk?error=testId is required');
    }
    
    try {
      const b = req.body;
      
      // Lấy thông tin câu hỏi cũ để xóa file
      const oldQuestion = await hskModel.getQuestionById(questionId);
      
      // Debug log để kiểm tra
      console.log('🔍 oldQuestion:', {
        questionId,
        image_url: oldQuestion?.image_url,
        audio_url: oldQuestion?.audio_url,
        hasImage: !!oldQuestion?.image_url,
        hasAudio: !!oldQuestion?.audio_url
      });
      
      // Xử lý media upload
      let audio_url = oldQuestion.audio_url || null;
      let image_url = oldQuestion.image_url || null;
      
      if (req.files) {
        console.log('🔍 req.files:', req.files);
        const mediaResults = await cloudinaryService.uploadMedia(req.files);
        console.log('🔍 mediaResults:', mediaResults);
        
        if (mediaResults.image && mediaResults.image.success) {
          // Xóa ảnh cũ trên Cloudinary nếu có
          if (oldQuestion && oldQuestion.image_url) {
            try {
              console.log('🔄 Đang xóa ảnh cũ:', oldQuestion.image_url);
              // oldQuestion.image_url đã là public_id, không cần extract
              const deleteResult = await cloudinaryService.deleteFile(oldQuestion.image_url);
              console.log('✅ Kết quả xóa ảnh cũ:', deleteResult);
            } catch (deleteError) {
              console.error('❌ Lỗi khi xóa ảnh cũ:', deleteError);
            }
          }
          image_url = mediaResults.image.public_id; // Lưu public_id
        }
        
        if (mediaResults.audio && mediaResults.audio.success) {
          // Xóa audio cũ trên Cloudinary nếu có
          if (oldQuestion && oldQuestion.audio_url) {
            try {
              console.log('🔄 Đang xóa audio cũ:', oldQuestion.audio_url);
              // oldQuestion.audio_url đã là public_id, không cần extract
              const deleteResult = await cloudinaryService.deleteFile(oldQuestion.audio_url, 'video');
              console.log('✅ Kết quả xóa audio cũ:', deleteResult);
            } catch (deleteError) {
              console.error('❌ Lỗi khi xóa audio cũ:', deleteError);
            }
          }
          audio_url = mediaResults.audio.public_id; // Lưu public_id
        }
      }
      
      // Xử lý correct_answer theo từng loại câu hỏi
      let correct_answer = "";
      let options = null;
      let matching_pairs = null;
      let ordering_items = null;
      let rewrite_instruction = null;
      
      if (b.question_type === "multiple_choice") {
        correct_answer = b.correct_answer_multiple_choice || "";
        options = [
          b.option_A || "",
          b.option_B || "",
          b.option_C || "",
          b.option_D || ""
        ].filter(opt => opt.trim());
      } else if (b.question_type === "matching") {
        // Xử lý matching pairs từ dynamic form
        const matchingPairs = [];
        const matchingAnswers = [];
        
        // Lấy tất cả matching_left và matching_right
        let pairIndex = 1;
        while (b[`matching_left_${pairIndex}`] && b[`matching_right_${pairIndex}`]) {
          const left = b[`matching_left_${pairIndex}`].trim();
          const right = b[`matching_right_${pairIndex}`].trim();
          
          if (left && right) {
            matchingPairs.push({ left, right });
            // Lấy đáp án tương ứng
            const answer = b[`matching_answer_${pairIndex}`];
            if (answer) {
              matchingAnswers.push(answer);
            }
          }
          pairIndex++;
        }
        
        matching_pairs = matchingPairs.length > 0 ? matchingPairs : null;
        correct_answer = matchingAnswers.length > 0 ? matchingAnswers.map((answer, index) => {
          const letter = String.fromCharCode(65 + index); // A, B, C, D, ...
          return `${letter}-${answer}`;
        }).join(',') : "";
      } else if (b.question_type === "ordering") {
        // Xử lý ordering items từ dynamic form
        const orderingItems = [];
        
        // Lấy tất cả ordering_item
        let itemIndex = 1;
        while (b[`ordering_item_${itemIndex}`]) {
          const item = b[`ordering_item_${itemIndex}`].trim();
          if (item) {
            orderingItems.push(item);
          }
          itemIndex++;
        }
        
        ordering_items = orderingItems.length > 0 ? orderingItems : null;
        correct_answer = b.correct_answer_text || "";
      } else if (b.question_type === "rewrite") {
        rewrite_instruction = b.rewrite_instruction || "";
        correct_answer = b.correct_answer_text || "";
      } else if (b.question_type === "true_false") {
        correct_answer = b.correct_answer_true_false || "";
      } else if (b.question_type === "fill_blank") {
        // Xử lý fill blank từ dynamic form
        const blanks = [];
        const answers = [];
        
        // Tìm tất cả các chỗ trống trong question_text
        const placeholders = b.question_text.match(/\((\d+)\)/g) || [];
        const blanksCount = placeholders.length;
        

        
        // Xử lý từng chỗ trống
        for (let i = 1; i <= blanksCount; i++) {
          const blankOptions = [
            b[`option_${i}_A`] || "",
            b[`option_${i}_B`] || "",
            b[`option_${i}_C`] || "",
            b[`option_${i}_D`] || ""
          ];
          
          // Chỉ thêm nếu có ít nhất 2 options
          if (blankOptions.filter(opt => opt.trim()).length >= 2) {
            blanks.push(blankOptions);
            answers.push(b[`correct_answer_${i}`] || "");
          }
        }
        
        options = blanks.length > 0 ? blanks : null;
        correct_answer = answers.join(',');
      }
      
      const payload = {
        question_type: b.question_type,
        question_text: b.question_text,
        audio_url,
        image_url,
        correct_answer: correct_answer || "", // Đảm bảo không bao giờ null
        explanation: b.explanation || null,
        difficulty_level: b.difficulty_level || "easy",
        points: parseInt(b.points || 1),
        order_in_test: parseInt(b.order_in_test || 0),
        rewrite_instruction: rewrite_instruction || null,
        options: options,
        matching_pairs: matching_pairs,
        ordering_items: ordering_items
      };

      await hskModel.updateQuestion(questionId, payload);
      
      res.redirect(`/admin/hsk/${testId}/questions?success=Cập nhật câu hỏi thành công!`);
    } catch (e) {
      console.error('❌ Error updating question:', e);
      res.redirect(`/admin/hsk/${testId}/questions?error=Không sửa được câu hỏi: ${e.message}`);
    }
  },

  async deleteQuestion(req, res) {
    try {
      const { testId, questionId } = req.params;
      
      // Lấy thông tin câu hỏi để xóa file
      const question = await hskModel.getQuestionById(questionId);
      if (question) {
        // Xóa ảnh trên Cloudinary nếu có
        if (question.image_url) {
          try {
            // question.image_url đã là public_id, không cần extract
            await cloudinaryService.deleteFile(question.image_url);
            console.log('✅ Đã xóa ảnh:', question.image_url);
    
          } catch (deleteError) {
            console.error('Lỗi khi xóa ảnh:', deleteError);
          }
        }
        
        // Xóa audio trên Cloudinary nếu có
        if (question.audio_url) {
          try {
            // question.audio_url đã là public_id, không cần extract
            await cloudinaryService.deleteFile(question.audio_url, 'video');
            console.log('✅ Đã xóa audio:', question.audio_url);
    
          } catch (deleteError) {
            console.error('Lỗi khi xóa audio:', deleteError);
          }
        }
      }
      
      await hskModel.deleteQuestion(questionId);
      res.redirect(`/admin/hsk/${testId}/questions?success=Xóa câu hỏi thành công!`);
    } catch (e) {
      console.error(e);
      res.redirect(`/admin/hsk/${testId}/questions?error=Không xóa được câu hỏi`);
    }
  },

  // Sắp xếp lại thứ tự câu hỏi
  async reorderQuestions(req, res) {
    try {
      const { testId } = req.params;
      const { orders } = req.body;
      
      console.log('📥 Received reorder request:', { 
        testId, 
        body: req.body,
        orders: orders,
        bodyType: typeof req.body,
        ordersType: typeof orders
      });
      
      if (!orders || !Array.isArray(orders)) {
        console.error('❌ Invalid orders data:', orders);
        return res.json({
          success: false,
          message: 'Dữ liệu thứ tự không hợp lệ'
        });
      }
      
      // Validate orders
      for (const order of orders) {
        if (!order.question_id || !order.order_in_test) {
          console.error('❌ Invalid order item:', order);
          return res.json({
            success: false,
            message: 'Dữ liệu thứ tự không đầy đủ'
          });
        }
      }
      
      console.log('✅ Validation passed, calling model...');
      const result = await hskModel.reorderQuestions(testId, orders);
      console.log('✅ Model result:', result);
      
      res.json({
        success: true,
        message: 'Đã cập nhật thứ tự câu hỏi thành công!'
      });
    } catch (error) {
      console.error('❌ Error reordering questions:', error);
      res.json({
        success: false,
        message: 'Không sắp xếp được câu hỏi: ' + error.message
      });
    }
  },



  // Export câu hỏi
  async exportQuestions(req, res) {
    try {
      const { testId } = req.params;
      const csvData = await hskModel.exportQuestionsToCSV(testId);
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="questions-${testId}.csv"`);
      
      // Convert to CSV string
      const csvString = this.convertToCSV(csvData);
      res.send(csvString);
    } catch (e) {
      console.error(e);
      res.redirect(`/admin/hsk/${req.params.testId}/questions?error=Không export được câu hỏi`);
    }
  },

  // Import câu hỏi
  async importQuestions(req, res) {
    try {
      const { testId } = req.params;
      const csvData = req.body.csvData; // Giả sử đã parse CSV
      await hskModel.importQuestionsFromCSV(testId, csvData);
      res.redirect(`/admin/hsk/${testId}/questions?success=Import câu hỏi thành công!`);
    } catch (e) {
      console.error(e);
      res.redirect(`/admin/hsk/${testId}/questions?error=Không import được câu hỏi`);
    }
  },

  // Helper: Convert data to CSV
  convertToCSV(data) {
    if (!data || data.length === 0) return '';
    
    const headers = Object.keys(data[0]);
    const csvRows = [headers.join(',')];
    
    for (const row of data) {
      const values = headers.map(header => {
        const value = row[header];
        return `"${String(value).replace(/"/g, '""')}"`;
      });
      csvRows.push(values.join(','));
    }
    
    return csvRows.join('\n');
  },

  // Helper: Validate question data
  validateQuestionData(questionData) {
    const errors = [];
    
    if (!questionData.question_text || questionData.question_text.trim().length < 5) {
      errors.push('Nội dung câu hỏi phải có ít nhất 5 ký tự');
    }
    
    if (questionData.question_type === 'multiple_choice') {
      if (!questionData.options || questionData.options.length < 2) {
        errors.push('Câu hỏi trắc nghiệm phải có ít nhất 2 lựa chọn');
      }
      if (!questionData.correct_answer) {
        errors.push('Phải chọn đáp án đúng cho câu hỏi trắc nghiệm');
      }
    }
    
    if (questionData.question_type === 'fill_blank') {
      // Kiểm tra có chỗ trống (1), (2), (3) hoặc ____
      const hasPlaceholders = questionData.question_text.includes('(') && questionData.question_text.includes(')') || 
                             questionData.question_text.includes('____');
      if (!hasPlaceholders) {
        errors.push('Câu hỏi điền từ phải có format: "(1)", "(2)", "(3)" hoặc "____" để đánh dấu chỗ trống');
      }
    }
    
    if (questionData.question_type === 'matching') {
      if (!questionData.matching_pairs || questionData.matching_pairs.length < 2) {
        errors.push('Câu hỏi ghép nối phải có ít nhất 2 cặp');
      }
    }
    
    if (questionData.question_type === 'ordering') {
      if (!questionData.ordering_items || questionData.ordering_items.length < 2) {
        errors.push('Câu hỏi sắp xếp phải có ít nhất 2 mục');
      }
    }
    
    if (questionData.question_type === 'rewrite') {
      if (!questionData.rewrite_instruction || questionData.rewrite_instruction.trim().length < 5) {
        errors.push('Hướng dẫn viết lại phải có ít nhất 5 ký tự');
      }
    }
    
    if (questionData.question_type === 'true_false') {
      if (!questionData.correct_answer || !['true', 'false'].includes(questionData.correct_answer)) {
        errors.push('Phải chọn đáp án đúng hoặc sai');
      }
    }
    
    return errors;
  },

  // Helper: Format question text for fill_blank
  formatFillBlankText(text, blanksCount) {
    let formattedText = text;
    for (let i = 1; i <= blanksCount; i++) {
      formattedText = formattedText.replace(`(${i})`, `(${i})`);
    }
    return formattedText;
  }
};
