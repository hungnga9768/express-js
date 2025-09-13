const subscriptionPlanModel = require("../../models/subscriptionPlan");

/**
 * Subscription Plan Controller - Admin Panel
 * Quản lý CRUD operations cho subscription plans
 */
module.exports = {
  
  /**
   * Hiển thị danh sách subscription plans (admin)
   */
  async index(req, res) {
    try {
      const { search, page = 1, limit = 20, isActive } = req.query;
      const limitNum = Math.min(parseInt(limit), 100); // Max 100 items per page
      const offset = (page - 1) * limitNum;

      // Parse isActive filter - mặc định hiển thị tất cả plans để admin có thể quản lý
      let activeFilter = null; // Mặc định hiển thị tất cả plans
      if (isActive === '1') activeFilter = 1;
      if (isActive === '0') activeFilter = 0;
      if (isActive === '') activeFilter = null; // Hiển thị tất cả khi chọn "Tất cả"

      const [plans, totalRows, statistics] = await Promise.all([
        subscriptionPlanModel.getAll(search, offset, limitNum, activeFilter),
        subscriptionPlanModel.getTotalRow(search, activeFilter),
        subscriptionPlanModel.getStatistics()
      ]);

      const totalPages = Math.ceil(totalRows / limitNum);
      const currentPage = Math.min(Math.max(parseInt(page), 1), totalPages);

      res.render("ds-subscription-plans", {
        title: "Quản lý Subscription Plans",
        data: plans,
        statistics: statistics,
        pagination: {
          currentPage,
          totalPages,
          totalItems: totalRows,
          itemsPerPage: limitNum
        },
        search: search || "",
        isActive: isActive || "",
        limit: limit || "20",
        success: req.query.success || null,
        error: req.query.error || null,
        user: req.user || null
      });
    } catch (error) {
      console.error("Error in subscription plan index:", error);
      res.status(500).render("error", { 
        title: "Lỗi",
        message: "Lỗi khi tải danh sách subscription plans",
        error: error.message
      });
    }
  },

  /**
   * Hiển thị form tạo subscription plan
   */
  createForm(req, res) {
    const defaultFeatures = [
      "100 tin nhắn chat/ngày",
      "100 lần dịch/ngày", 
      "Luyện nghe không giới hạn",
      "Tạo flashcard riêng",
      "HSK không giới hạn"
    ];

    res.render("add-subscription-plan", {
      title: "Thêm Subscription Plan mới",
      defaultFeatures: defaultFeatures,
      durationOptions: [
        { value: 1, text: "1 tháng" },
        { value: 3, text: "3 tháng" },
        { value: 6, text: "6 tháng" },
        { value: 12, text: "12 tháng" },
        { value: 24, text: "24 tháng" }
      ],
      user: req.user || null
    });
  },

  /**
   * Tạo subscription plan mới
   */
  async create(req, res) {
    try {
      const {
        plan_code,
        name,
        duration_months,
        price,
        original_price,
        discount_percent,
        description,
        features,
        is_active,
        sort_order
      } = req.body;

      // Validation
      if (!plan_code || !name || !duration_months || !price) {
        return res.render("add-subscription-plan", {
          title: "Thêm Subscription Plan mới",
          error: "Các trường bắt buộc không được để trống",
          data: req.body,
          defaultFeatures: [
            "100 tin nhắn chat/ngày",
            "100 lần dịch/ngày", 
            "Luyện nghe không giới hạn",
            "Tạo flashcard riêng",
            "HSK không giới hạn"
          ],
          durationOptions: [
            { value: 1, text: "1 tháng" },
            { value: 3, text: "3 tháng" },
            { value: 6, text: "6 tháng" },
            { value: 12, text: "12 tháng" },
            { value: 24, text: "24 tháng" }
          ],
          user: req.user || null
        });
      }

      // Validate plan_code format
      if (!/^[a-zA-Z0-9_-]+$/.test(plan_code)) {
        return res.render("add-subscription-plan", {
          title: "Thêm Subscription Plan mới",
          error: "Plan code chỉ được chứa chữ, số, dấu gạch dưới và gạch ngang",
          data: req.body,
          defaultFeatures: [
            "100 tin nhắn chat/ngày",
            "100 lần dịch/ngày", 
            "Luyện nghe không giới hạn",
            "Tạo flashcard riêng",
            "HSK không giới hạn"
          ],
          durationOptions: [
            { value: 1, text: "1 tháng" },
            { value: 3, text: "3 tháng" },
            { value: 6, text: "6 tháng" },
            { value: 12, text: "12 tháng" },
            { value: 24, text: "24 tháng" }
          ],
          user: req.user || null
        });
      }

      // Parse features
      let parsedFeatures = [];
      if (features) {
        if (typeof features === 'string') {
          // Features từ textarea (mỗi dòng một feature)
          parsedFeatures = features.split('\n')
            .map(f => f.trim())
            .filter(f => f.length > 0);
        } else if (Array.isArray(features)) {
          parsedFeatures = features.filter(f => f.trim().length > 0);
        }
      }

      const planData = {
        plan_code: plan_code.trim(),
        name: name.trim(),
        duration_months: parseInt(duration_months),
        price: parseFloat(price),
        original_price: original_price ? parseFloat(original_price) : null,
        discount_percent: discount_percent ? parseFloat(discount_percent) : 0,
        description: description ? description.trim() : null,
        features: parsedFeatures,
        is_active: is_active ? 1 : 0,
        sort_order: sort_order ? parseInt(sort_order) : 0
      };

      await subscriptionPlanModel.create(planData);

      res.redirect("/admin/subscription-plans?success=Thêm subscription plan thành công");
    } catch (error) {
      console.error("Error creating subscription plan:", error);
      res.render("add-subscription-plan", {
        title: "Thêm Subscription Plan mới",
        error: error.message || "Lỗi khi tạo subscription plan",
        data: req.body,
        defaultFeatures: [
          "100 tin nhắn chat/ngày",
          "100 lần dịch/ngày", 
          "Luyện nghe không giới hạn",
          "Tạo flashcard riêng",
          "HSK không giới hạn"
        ],
        durationOptions: [
          { value: 1, text: "1 tháng" },
          { value: 3, text: "3 tháng" },
          { value: 6, text: "6 tháng" },
          { value: 12, text: "12 tháng" },
          { value: 24, text: "24 tháng" }
        ],
        user: req.user || null
      });
    }
  },

  /**
   * Hiển thị form chỉnh sửa
   */
  async editForm(req, res) {
    try {
      const { id } = req.params;
      const plan = await subscriptionPlanModel.getById(id);

      if (!plan) {
        return res.status(404).render("error", { 
          title: "Không tìm thấy",
          message: "Không tìm thấy subscription plan" 
        });
      }

      res.render("edit-subscription-plan", {
        title: "Chỉnh sửa Subscription Plan",
        plan: plan,
        durationOptions: [
          { value: 1, text: "1 tháng" },
          { value: 3, text: "3 tháng" },
          { value: 6, text: "6 tháng" },
          { value: 12, text: "12 tháng" },
          { value: 24, text: "24 tháng" }
        ],
        user: req.user || null
      });
    } catch (error) {
      console.error("Error in subscription plan edit form:", error);
      res.status(500).render("error", { 
        title: "Lỗi",
        message: "Lỗi khi tải form chỉnh sửa",
        error: error.message
      });
    }
  },

  /**
   * Cập nhật subscription plan
   */
  async update(req, res) {
    try {
      const { id } = req.params;
      const {
        plan_code,
        name,
        duration_months,
        price,
        original_price,
        discount_percent,
        description,
        features,
        is_active,
        sort_order
      } = req.body;

      // Validation
      if (!plan_code || !name || !duration_months || !price) {
        return res.status(400).json({
          success: false,
          message: "Các trường bắt buộc không được để trống"
        });
      }

      // Validate plan_code format
      if (!/^[a-zA-Z0-9_-]+$/.test(plan_code)) {
        return res.status(400).json({
          success: false,
          message: "Plan code chỉ được chứa chữ, số, dấu gạch dưới và gạch ngang"
        });
      }

      // Parse features
      let parsedFeatures = [];
      if (features) {
        if (typeof features === 'string') {
          // Features từ textarea (mỗi dòng một feature)
          parsedFeatures = features.split('\n')
            .map(f => f.trim())
            .filter(f => f.length > 0);
        } else if (Array.isArray(features)) {
          parsedFeatures = features.filter(f => f.trim().length > 0);
        }
      }

      const planData = {
        plan_code: plan_code.trim(),
        name: name.trim(),
        duration_months: parseInt(duration_months),
        price: parseFloat(price),
        original_price: original_price ? parseFloat(original_price) : null,
        discount_percent: discount_percent ? parseFloat(discount_percent) : 0,
        description: description ? description.trim() : null,
        features: parsedFeatures,
        is_active: is_active ? 1 : 0,
        sort_order: sort_order ? parseInt(sort_order) : 0
      };

      const success = await subscriptionPlanModel.update(id, planData);

      if (success) {
        res.json({
          success: true,
          message: "Cập nhật subscription plan thành công"
        });
      } else {
        res.status(400).json({
          success: false,
          message: "Không thể cập nhật subscription plan"
        });
      }
    } catch (error) {
      console.error("Error updating subscription plan:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Lỗi khi cập nhật subscription plan"
      });
    }
  },

  /**
   * Xóa subscription plan
   */
  async delete(req, res) {
    const timestamp = new Date().toISOString();
    const userId = req.user?.id || 'unknown';
    const userEmail = req.user?.email || 'unknown';
    
    console.log(`🗑️ [${timestamp}] DELETE REQUEST RECEIVED`);
    console.log(`📋 [${timestamp}] Method: ${req.method}, URL: ${req.originalUrl}`);
    console.log(`👤 [${timestamp}] User: ${userEmail} (ID: ${userId})`);
    console.log(`📦 [${timestamp}] Request body:`, req.body);
    
    try {
      const { id } = req.params;
      
      console.log(`🎯 [${timestamp}] Attempting to delete plan with ID: ${id}`);
      console.log(`📝 [${timestamp}] AUDIT: User ${userEmail} (${userId}) attempting to delete plan ${id}`);
      
      const result = await subscriptionPlanModel.delete(id);
      console.log(`✅ [${timestamp}] Delete operation result:`, result);

      console.log(`📝 [${timestamp}] AUDIT: Plan ${id} successfully deleted by user ${userEmail} (${userId})`);

      res.json({
        success: true,
        message: "Đã xóa gói thành công"
      });
      
      console.log(`🎉 [${timestamp}] Successfully processed delete request for plan ${id}`);
      
    } catch (error) {
      console.error(`❌ [${timestamp}] Error deleting subscription plan:`, error.message);
      console.log(`📝 [${timestamp}] AUDIT: Delete attempt failed for plan ${req.params.id} by user ${userEmail} (${userId}) - ${error.message}`);
      
      res.status(400).json({
        success: false,
        message: error.message || "Lỗi khi xóa subscription plan"
      });
    }
  },

  /**
   * Toggle trạng thái active/inactive
   */
  async toggleActive(req, res) {
    try {
      const { id } = req.params;
      const { is_active } = req.body;
      
      console.log(`🔄 Toggle active request - Plan ID: ${id}, New status: ${is_active}`);
      
      // Nếu có giá trị is_active từ frontend, sử dụng nó
      if (is_active !== undefined) {
        const success = await subscriptionPlanModel.setActiveStatus(id, is_active);
        
        if (success) {
          const action = is_active ? 'kích hoạt' : 'tạm dừng';
          res.json({
            success: true,
            message: `Đã ${action} gói thành công`
          });
        } else {
          res.status(400).json({
            success: false,
            message: "Không thể cập nhật trạng thái"
          });
        }
      } else {
        // Fallback: toggle như cũ
        const success = await subscriptionPlanModel.toggleActive(id);
        
        if (success) {
          res.json({
            success: true,
            message: "Cập nhật trạng thái thành công"
          });
        } else {
          res.status(400).json({
            success: false,
            message: "Không thể cập nhật trạng thái"
          });
        }
      }
    } catch (error) {
      console.error("Error toggling plan status:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi khi cập nhật trạng thái"
      });
    }
  },

  /**
   * Cập nhật thứ tự hiển thị (drag & drop)
   */
  async updateSortOrder(req, res) {
    try {
      const { planUpdates } = req.body;

      if (!Array.isArray(planUpdates)) {
        return res.status(400).json({
          success: false,
          message: "Dữ liệu không hợp lệ"
        });
      }

      await subscriptionPlanModel.updateSortOrder(planUpdates);

      res.json({
        success: true,
        message: "Cập nhật thứ tự hiển thị thành công"
      });
    } catch (error) {
      console.error("Error updating sort order:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi khi cập nhật thứ tự hiển thị"
      });
    }
  },

  /**
   * Lấy chi tiết subscription plan theo ID (cho API)
   */
  async getById(req, res) {
    try {
      const { id } = req.params;
      const plan = await subscriptionPlanModel.getById(id);

      if (!plan) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy subscription plan"
        });
      }

      res.json({
        success: true,
        data: plan
      });
    } catch (error) {
      console.error("Error getting subscription plan by ID:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi khi lấy thông tin subscription plan"
      });
    }
  },

  /**
   * Bulk operations - Toggle active/inactive nhiều plans
   */
  async bulkToggleActive(req, res) {
    try {
      const { ids, isActive } = req.body;

      if (!Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({
          success: false,
          message: "Vui lòng chọn ít nhất một plan"
        });
      }

      const affectedRows = await subscriptionPlanModel.bulkToggleActive(ids, isActive ? 1 : 0);

      res.json({
        success: true,
        message: `Đã cập nhật ${affectedRows} subscription plan(s)`,
        affectedRows: affectedRows
      });
    } catch (error) {
      console.error("Error bulk toggling plans:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi khi cập nhật trạng thái plans"
      });
    }
  },

  /**
   * Bulk delete nhiều plans
   */
  async bulkDelete(req, res) {
    try {
      const { ids } = req.body;

      if (!Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({
          success: false,
          message: "Vui lòng chọn ít nhất một plan"
        });
      }

      const affectedRows = await subscriptionPlanModel.bulkDelete(ids);

      res.json({
        success: true,
        message: `Đã xóa ${affectedRows} subscription plan(s)`,
        affectedRows: affectedRows
      });
    } catch (error) {
      console.error("Error bulk deleting plans:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Lỗi khi xóa plans"
      });
    }
  },

  /**
   * Export subscription plans ra CSV
   */
  async exportToCSV(req, res) {
    try {
      const { isActive } = req.query;
      let activeFilter = null;
      if (isActive === '1') activeFilter = 1;
      if (isActive === '0') activeFilter = 0;

      const plans = await subscriptionPlanModel.getAll("", 0, 1000, activeFilter);

      // Tạo nội dung CSV
      let csvContent = "id,plan_code,name,duration_months,price,original_price,discount_percent,description,features,is_active,sort_order,created_at\n";

      plans.forEach(plan => {
        const row = [
          plan.id,
          `"${plan.plan_code || ''}"`,
          `"${plan.name || ''}"`,
          plan.duration_months || '',
          plan.price || '',
          plan.original_price || '',
          plan.discount_percent || '',
          `"${(plan.description || '').replace(/"/g, '""')}"`,
          `"${JSON.stringify(plan.features).replace(/"/g, '""')}"`,
          plan.is_active,
          plan.sort_order || '',
          plan.created_at || ''
        ].join(',');
        csvContent += row + '\n';
      });

      // Set headers cho download
      const activeText = activeFilter === 1 ? '_active' : activeFilter === 0 ? '_inactive' : '';
      const filename = `subscription_plans${activeText}_${new Date().toISOString().split('T')[0]}.csv`;
      
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(csvContent);

    } catch (error) {
      console.error("Error exporting subscription plans:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi khi export subscription plans"
      });
    }
  },

};
