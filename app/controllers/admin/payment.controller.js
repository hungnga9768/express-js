const PaymentModel = require("../../models/payment");

/**
 * Admin Payment Controller - MVC Pattern
 * Quản lý đơn hàng MoMo trong admin panel
 */
module.exports = {
  
  /**
   * Hiển thị danh sách đơn hàng
   * GET /admin/payments
   */
  async index(req, res) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;
      const status = req.query.status || '';
      const search = req.query.search || '';

      // Get transactions with business context
      const { transactions, total, totalPages } = await PaymentModel.getTransactions({
        page, limit, status, search
      });

      // Get business statistics
      const stats = await PaymentModel.getBusinessStats();

      // Generate error category summary for admin insights
      const errorSummary = module.exports.generateErrorSummary(transactions);

      res.render('ds-payments', {
        title: 'Quản lý Doanh thu & Thanh toán MoMo',
        data: transactions,
        stats: stats,
        errorSummary: errorSummary,
        currentPage: page,
        totalPages: totalPages,
        search: search,
        status: status,
        user: req.user || null,
        getMoMoResultCodeInfo: module.exports.getMoMoResultCodeInfo
      });

    } catch (error) {
      console.error('Error in payment index:', error);
      res.status(500).render('error', {
        title: 'Lỗi',
        message: 'Lỗi khi tải danh sách đơn hàng',
        error: error.message
      });
    }
  },

  /**
   * Xem chi tiết đơn hàng
   * GET /admin/payments/:id
   */
  async show(req, res) {
    try {
      const orderId = req.params.id;

      // Get order details
      const order = await PaymentModel.getOrderByOrderId(orderId);
      
      if (!order) {
        return res.status(404).render('error', {
          title: 'Không tìm thấy',
          message: 'Không tìm thấy đơn hàng',
          backUrl: '/admin/payments'
        });
      }

      // Get webhook logs and subscription history
      const [webhooks, history] = await Promise.all([
        PaymentModel.getWebhookLogs(orderId),
        PaymentModel.getSubscriptionHistory(order.user_id, 10)
      ]);

      // Prepare user object for view
      const orderUser = {
        user_id: order.user_id,
        username: order.username,
        email: order.email,
        full_name: order.full_name,
        profile_picture: order.profile_picture,
        subscription_type: order.subscription_type,
        subscription_expiry: order.subscription_expiry,
        registration_date: order.registration_date
      };

      res.render('payment-detail', {
        title: `Chi tiết đơn hàng ${orderId}`,
        order: order,
        orderUser: orderUser,
        webhooks: webhooks,
        history: history,
        user: req.user || null,
        getMoMoResultCodeInfo: module.exports.getMoMoResultCodeInfo
      });

    } catch (error) {
      console.error('Error in payment show:', error);
      res.status(500).render('error', {
        title: 'Lỗi',
        message: 'Lỗi khi tải chi tiết đơn hàng',
        error: error.message,
        backUrl: '/admin/payments'
      });
    }
  },

  /**
   * Thống kê thanh toán
   * GET /admin/payments/stats
   */
  async stats(req, res) {
    try {
      const period = req.query.period || '30'; // days

      // Get comprehensive business analytics
      const [overview, dailyRevenue, topPlans, recentOrders, topCustomers, paymentMethods] = await Promise.all([
        PaymentModel.getOverviewStats(period),
        PaymentModel.getDailyRevenue(period),
        PaymentModel.getTopSellingPlans(period),
        PaymentModel.getRecentOrders(10),
        PaymentModel.getTopCustomers(period, 10),
        PaymentModel.getPaymentMethodStats(period)
      ]);

      res.render('payment-stats', {
        title: 'Analytics & Business Intelligence - MoMo',
        period,
        overview,
        dailyRevenue,
        topPlans,
        planStats: topPlans, // Alias for view compatibility
        recentOrders,
        topCustomers,
        paymentMethods,
        user: req.user || null,
        getMoMoResultCodeInfo: module.exports.getMoMoResultCodeInfo
      });

    } catch (error) {
      console.error('Error in payment stats:', error);
      res.status(500).render('error', {
        title: 'Lỗi',
        message: 'Lỗi khi tải thống kê',
        error: error.message,
        backUrl: '/admin/payments'
      });
    }
  },

  /**
   * Xuất báo cáo CSV - Business Intelligence Export
   * GET /admin/payments/export
   */
  async export(req, res) {
    try {
      const { start_date, end_date, status, type = 'transactions' } = req.query;
      
      let csv, filename;
      
      if (type === 'business_summary') {
        // Business Summary Export
        const [overview, topPlans, topCustomers] = await Promise.all([
          PaymentModel.getOverviewStats(30),
          PaymentModel.getTopSellingPlans(30),
          PaymentModel.getTopCustomers(30, 20)
        ]);
        
        filename = `business_summary_${new Date().toISOString().split('T')[0]}.csv`;
        csv = this.generateBusinessSummaryCSV(overview, topPlans, topCustomers);
        
      } else {
        // Transaction Export
        const transactions = await PaymentModel.getOrdersForExport({
          start_date, end_date, status
        });
        
        filename = `momo_transactions_${new Date().toISOString().split('T')[0]}.csv`;
        csv = this.generateTransactionCSV(transactions);
      }

      // Set CSV headers
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
      res.send(csv);

    } catch (error) {
      console.error('Error in payment export:', error);
      res.status(500).render('error', {
        title: 'Lỗi Export',
        message: 'Không thể xuất báo cáo. Vui lòng thử lại.',
        error: error.message,
        backUrl: '/admin/payments'
      });
    }
  },

  /**
   * Helper: Generate Transaction CSV
   */
  generateTransactionCSV(transactions) {
    const headers = [
      'Transaction ID', 'MoMo Trans ID', 'Khách hàng', 'Email', 'Gói dịch vụ', 
      'Thời hạn', 'Số tiền', 'Doanh thu', 'Trạng thái', 'Phương thức', 
      'Ngày tạo', 'Ngày hoàn thành', 'Customer Type', 'Result Code'
    ];
    
    let csv = headers.join(',') + '\n';
    
    transactions.forEach(trans => {
      const row = [
        `"${trans.order_id}"`,
        `"${trans.trans_id || 'N/A'}"`,
        `"${trans.full_name || trans.username}"`,
        `"${trans.email}"`,
        `"${trans.plan_name}"`,
        `"${trans.duration_months} tháng"`,
        `"${trans.amount}"`,
        `"${trans.revenue_amount || 0}"`,
        `"${trans.status}"`,
        `"${trans.pay_type || 'N/A'}"`,
        `"${trans.created_at}"`,
        `"${trans.completed_at || 'N/A'}"`,
        `"${trans.subscription_type || 'Free'}"`,
        `"${trans.momo_result_code || 'N/A'}"`
      ];
      csv += row.join(',') + '\n';
    });
    
    return csv;
  },

  /**
   * Helper: Generate Business Summary CSV
   */
  generateBusinessSummaryCSV(overview, topPlans, topCustomers) {
    let csv = 'BUSINESS SUMMARY REPORT\n';
    csv += `Generated: ${new Date().toLocaleString('vi-VN')}\n\n`;
    
    // Overview Section
    csv += 'OVERVIEW STATS\n';
    csv += 'Metric,Value\n';
    csv += `"Total Revenue","${overview.total_revenue}"\n`;
    csv += `"Success Rate","${overview.success_rate}%"\n`;
    csv += `"Total Transactions","${overview.total_transactions}"\n`;
    csv += `"Successful Transactions","${overview.successful_transactions}"\n`;
    csv += `"Average Order Value","${overview.avg_order_value}"\n\n`;
    
    // Top Plans Section
    csv += 'TOP SELLING PLANS\n';
    csv += 'Plan Name,Total Revenue,Total Orders,Avg Revenue per Order\n';
    topPlans.forEach(plan => {
      csv += `"${plan.plan_name}","${plan.total_revenue}","${plan.total_orders}","${plan.avg_revenue}"\n`;
    });
    csv += '\n';
    
    // Top Customers Section
    csv += 'TOP CUSTOMERS\n';
    csv += 'Customer Name,Email,Total Spent,Total Orders,Customer Type\n';
    topCustomers.forEach(customer => {
      csv += `"${customer.full_name || customer.username}","${customer.email}","${customer.total_spent}","${customer.total_orders}","${customer.subscription_type}"\n`;
    });
    
    return csv;
  },

  /**
   * Get MoMo Result Code description based on official documentation
   */
  getMoMoResultCodeInfo(resultCode) {
    // Dựa theo tài liệu chính thức: https://developers.momo.vn/v3/vi/docs/payment/api/result-handling/resultcode
    const codes = {
      // ✅ SUCCESS - Final status  
      0: { type: 'success', message: 'Thành công', description: 'Thành công.', final: true, category: 'Success' },
      
      // 🔧 SYSTEM ERRORS
      10: { type: 'error', message: 'Hệ thống đang được bảo trì', description: 'Hệ thống đang được bảo trì.', final: false, category: 'System Error' },
      11: { type: 'error', message: 'Truy cập bị từ chối', description: 'Truy cập bị từ chối.', final: false, category: 'System Error' },
      12: { type: 'error', message: 'Phiên bản API không được hỗ trợ', description: 'Phiên bản API không được hỗ trợ cho yêu cầu này.', final: false, category: 'System Error' },
      47: { type: 'error', message: 'Yêu cầu bị từ chối vì thông tin không hợp lệ', description: 'Yêu cầu bị từ chối vì thông tin không hợp lệ trong danh sách dữ liệu khả dụng', final: false, category: 'System Error' },
      98: { type: 'error', message: 'QR Code tạo không thành công', description: 'QR Code tạo không thành công. Vui lòng thử lại sau.', final: true, category: 'System Error' },
      99: { type: 'error', message: 'Lỗi không xác định', description: 'Lỗi không xác định.', final: true, category: 'System Error' },
      1005: { type: 'failed', message: 'Giao dịch thất bại do url hoặc QR code đã hết hạn', description: 'Giao dịch thất bại do url hoặc QR code đã hết hạn.', final: true, category: 'System Error' },
      1007: { type: 'failed', message: 'Giao dịch bị từ chối vì tài khoản không tồn tại hoặc đang ở trạng thái ngưng hoạt động', description: 'Giao dịch bị từ chối vì tài khoản không tồn tại hoặc đang ở trạng thái ngưng hoạt động.', final: true, category: 'System Error' },
      1026: { type: 'failed', message: 'Giao dịch bị hạn chế theo thể lệ chương trình khuyến mãi', description: 'Giao dịch bị hạn chế theo thể lệ chương trình khuyến mãi.', final: true, category: 'System Error' },
      
      // 🚫 MERCHANT ERRORS
      13: { type: 'error', message: 'Xác thực doanh nghiệp thất bại', description: 'Xác thực doanh nghiệp thất bại.', final: false, category: 'Merchant Error' },
      20: { type: 'error', message: 'Yêu cầu sai định dạng', description: 'Yêu cầu sai định dạng.', final: false, category: 'Merchant Error' },
      21: { type: 'error', message: 'Yêu cầu bị từ chối vì số tiền giao dịch không hợp lệ', description: 'Yêu cầu bị từ chối vì số tiền giao dịch không hợp lệ.', final: false, category: 'Merchant Error' },
      22: { type: 'error', message: 'Số tiền giao dịch không hợp lệ', description: 'Số tiền giao dịch không hợp lệ.', final: false, category: 'Merchant Error' },
      40: { type: 'error', message: 'RequestId bị trùng', description: 'RequestId bị trùng.', final: false, category: 'Merchant Error' },
      41: { type: 'error', message: 'OrderId bị trùng', description: 'OrderId bị trùng.', final: false, category: 'Merchant Error' },
      42: { type: 'error', message: 'OrderId không hợp lệ hoặc không được tìm thấy', description: 'OrderId không hợp lệ hoặc không được tìm thấy.', final: false, category: 'Merchant Error' },
      43: { type: 'error', message: 'Yêu cầu bị từ chối vì xung đột trong quá trình xử lý giao dịch', description: 'Yêu cầu bị từ chối vì xung đột trong quá trình xử lý giao dịch.', final: false, category: 'Merchant Error' },
      45: { type: 'error', message: 'Trùng ItemId', description: 'Trùng ItemId', final: false, category: 'Merchant Error' },
      1003: { type: 'cancelled', message: 'Giao dịch bị đã bị hủy', description: 'Giao dịch bị đã bị hủy.', final: true, category: 'Merchant Error' },
      1017: { type: 'cancelled', message: 'Giao dịch bị hủy bởi đối tác', description: 'Giao dịch bị hủy bởi đối tác.', final: true, category: 'Merchant Error' },
      1080: { type: 'failed', message: 'Giao dịch hoàn tiền thất bại trong quá trình xử lý', description: 'Giao dịch hoàn tiền thất bại trong quá trình xử lý. Vui lòng thử lại trong khoảng thời gian ngắn, tốt hơn là sau một giờ.', final: true, category: 'Merchant Error' },
      1081: { type: 'failed', message: 'Giao dịch hoàn tiền bị từ chối. Giao dịch thanh toán ban đầu có thể đã được hoàn', description: 'Giao dịch hoàn tiền bị từ chối. Giao dịch thanh toán ban đầu có thể đã được hoàn.', final: true, category: 'Merchant Error' },
      1088: { type: 'failed', message: 'Giao dịch hoàn tiền bị từ chối. Giao dịch thanh toán ban đầu không được hỗ trợ hoàn tiền', description: 'Giao dịch hoàn tiền bị từ chối. Giao dịch thanh toán ban đầu không được hỗ trợ hoàn tiền.', final: true, category: 'Merchant Error' },
      2019: { type: 'failed', message: 'Yêu cầu bị từ chối vì orderGroupId không hợp lệ', description: 'Yêu cầu bị từ chối vì orderGroupId không hợp lệ.', final: true, category: 'Merchant Error' },
      
      // ⏳ PENDING STATES - Non-final (không có trong Final Status)
      1000: { type: 'pending', message: 'Giao dịch đã được khởi tạo, chờ người dùng xác nhận thanh toán', description: 'Giao dịch đã được khởi tạo, chờ người dùng xác nhận thanh toán.', final: false, category: 'Pending' },
      7000: { type: 'processing', message: 'Giao dịch đang được xử lý', description: 'Giao dịch đang được xử lý.', final: false, category: 'Pending' },
      7002: { type: 'processing', message: 'Giao dịch đang được xử lý bởi nhà cung cấp loại hình thanh toán', description: 'Giao dịch đang được xử lý bởi nhà cung cấp loại hình thanh toán.', final: false, category: 'Pending' },
      9000: { type: 'confirmed', message: 'Giao dịch đã được xác nhận thành công', description: 'Giao dịch đã được xác nhận thành công.', final: false, category: 'Pending' },
      
      // 👤 USER ERRORS - Final status
      1001: { type: 'failed', message: 'Giao dịch thanh toán thất bại do tài khoản người dùng không đủ tiền', description: 'Giao dịch thanh toán thất bại do tài khoản người dùng không đủ tiền.', final: true, category: 'User Error' },
      1002: { type: 'failed', message: 'Giao dịch bị từ chối do nhà phát hành tài khoản thanh toán', description: 'Giao dịch bị từ chối do nhà phát hành tài khoản thanh toán.', final: true, category: 'User Error' },
      1004: { type: 'failed', message: 'Giao dịch thất bại do số tiền thanh toán vượt quá hạn mức thanh toán của người dùng', description: 'Giao dịch thất bại do số tiền thanh toán vượt quá hạn mức thanh toán của người dùng.', final: true, category: 'User Error' },
      1006: { type: 'failed', message: 'Giao dịch thất bại do người dùng đã từ chối xác nhận thanh toán', description: 'Giao dịch thất bại do người dùng đã từ chối xác nhận thanh toán.', final: true, category: 'User Error' },
      4001: { type: 'failed', message: 'Giao dịch bị từ chối do tài khoản người dùng đang bị hạn chế', description: 'Giao dịch bị từ chối do tài khoản người dùng đang bị hạn chế.', final: true, category: 'User Error' },
      4002: { type: 'failed', message: 'Giao dịch bị từ chối do tài khoản người dùng chưa được xác thực với C06', description: 'Giao dịch bị từ chối do tài khoản người dùng chưa được xác thực với C06.', final: true, category: 'User Error' },
      4100: { type: 'failed', message: 'Giao dịch thất bại do người dùng không đăng nhập thành công', description: 'Giao dịch thất bại do người dùng không đăng nhập thành công.', final: true, category: 'User Error' }
    };
    
    return codes[resultCode] || { 
      type: 'unknown', 
      message: `Mã ${resultCode}`, 
      description: 'Mã lỗi không xác định trong hệ thống', 
      final: true, 
      category: 'Unknown' 
    };
  },

  /**
   * Generate error summary for admin insights
   */
  generateErrorSummary(transactions) {
    const summary = {
      categories: {},
      totalErrors: 0,
      pendingCount: 0,
      finalFailures: 0
    };

    transactions.forEach(transaction => {
      if (transaction.momo_result_code && transaction.momo_result_code !== 0) {
        const resultInfo = module.exports.getMoMoResultCodeInfo(transaction.momo_result_code);
        
        // Count by category
        if (!summary.categories[resultInfo.category]) {
          summary.categories[resultInfo.category] = {
            count: 0,
            codes: {},
            examples: []
          };
        }
        
        summary.categories[resultInfo.category].count++;
        summary.totalErrors++;
        
        // Count specific codes
        if (!summary.categories[resultInfo.category].codes[transaction.momo_result_code]) {
          summary.categories[resultInfo.category].codes[transaction.momo_result_code] = {
            count: 0,
            message: resultInfo.message
          };
        }
        summary.categories[resultInfo.category].codes[transaction.momo_result_code].count++;
        
        // Add example
        if (summary.categories[resultInfo.category].examples.length < 3) {
          summary.categories[resultInfo.category].examples.push({
            orderId: transaction.order_id,
            code: transaction.momo_result_code,
            message: resultInfo.message
          });
        }
        
        // Count final vs pending
        if (resultInfo.final) {
          summary.finalFailures++;
        } else {
          summary.pendingCount++;
        }
      }
    });

    return summary;
  },

  /**
   * API endpoint để kiểm tra trạng thái đơn hàng từ MoMo
   * POST /admin/payments/check-status
   */
  async checkStatus(req, res) {
    try {
      const { orderId } = req.body;
      
      if (!orderId) {
        return res.status(400).json({
          success: false,
          message: 'Order ID is required'
        });
      }

      // Get order details and query MoMo status
      const order = await PaymentModel.getOrderByOrderId(orderId);
      if (!order) {
        return res.status(404).json({
          success: false,
          message: 'Order not found'
        });
      }

      // TODO: Implement MoMo status check via MoMoService
      // const momoStatus = await MoMoService.queryPaymentStatus(orderId, order.request_id);
      
      res.json({
        success: true,
        order: order,
        message: 'Status check completed',
        // momoStatus: momoStatus
      });

    } catch (error) {
      console.error('Error checking payment status:', error);
      res.status(500).json({
        success: false,
        message: 'Error checking payment status',
        error: error.message
      });
    }
  }

};
