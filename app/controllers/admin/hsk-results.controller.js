const hskResultsModel = require("../../models/hsk-results");

module.exports = {
  // Danh sách kết quả thi
  async index(req, res) {
    try {
      const { userId = "", testId = "", status = "", page = 1, limit = 20 } = req.query;
      const offset = (parseInt(page) - 1) * parseInt(limit);
      
      const [rows, total] = await Promise.all([
        hskResultsModel.getResults({ 
          userId: userId || null, 
          testId: testId || null, 
          status: status || null, 
          offset, 
          limit: parseInt(limit) 
        }),
        hskResultsModel.getResultsTotal({ 
          userId: userId || null, 
          testId: testId || null, 
          status: status || null 
        })
      ]);
      
      const totalPages = Math.max(1, Math.ceil(total / parseInt(limit)));
      
      res.render("hsk-results", {
        title: "Quản lý Kết quả thi HSK",
        data: rows,
        userId, testId, status,
        Page: parseInt(page),
        totalPage: totalPages
      });
    } catch (e) {
      console.error(e);
      res.status(500).render("error", { message: "Lỗi tải danh sách kết quả thi" });
    }
  },

  // Chi tiết kết quả thi
  async show(req, res) {
    try {
      const { id } = req.params;
      const result = await hskResultsModel.getResultById(id);
      if (!result) return res.status(404).render("error", { message: "Không tìm thấy kết quả thi" });
      
      const userAnswers = await hskResultsModel.getUserAnswers(id);
      
      res.render("hsk-result-detail", {
        title: `Chi tiết kết quả thi - ${result.test_title}`,
        result,
        userAnswers
      });
    } catch (e) {
      console.error(e);
      res.status(500).render("error", { message: "Lỗi tải chi tiết kết quả thi" });
    }
  },

  // Chấm điểm thủ công
  async gradeWriting(req, res) {
    try {
      const { resultId, questionId } = req.params;
      const { score, feedback } = req.body;
      
      await hskResultsModel.gradeWritingManually(resultId, questionId, parseInt(score), feedback);
      req.flash('success', 'Chấm điểm thành công!');
      res.redirect(`/admin/hsk-results/${resultId}`);
    } catch (e) {
      console.error(e);
      req.flash('error', 'Không chấm điểm được');
      res.redirect(`/admin/hsk-results/${req.params.resultId}`);
    }
  },

  // Export kết quả thi
  async exportResults(req, res) {
    try {
      const { userId, testId, status, startDate, endDate } = req.query;
      const csvData = await hskResultsModel.exportResultsToCSV({
        userId: userId || null,
        testId: testId || null,
        status: status || null,
        startDate: startDate || null,
        endDate: endDate || null
      });
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="hsk-results-${Date.now()}.csv"`);
      
      // Convert to CSV string
      const csvString = this.convertToCSV(csvData);
      res.send(csvString);
    } catch (e) {
      console.error(e);
      req.flash('error', 'Không export được kết quả thi');
      res.redirect("/admin/hsk-results");
    }
  },

  // Thống kê kết quả
  async statistics(req, res) {
    try {
      const { startDate, endDate, groupBy = 'month' } = req.query;
      const stats = await hskResultsModel.getResultsStats({
        startDate: startDate || null,
        endDate: endDate || null,
        groupBy
      });
      
      res.render("hsk-results-stats", {
        title: "Thống kê Kết quả thi HSK",
        stats,
        startDate,
        endDate,
        groupBy
      });
    } catch (e) {
      console.error(e);
      res.status(500).render("error", { message: "Lỗi tải thống kê" });
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
  }
};
