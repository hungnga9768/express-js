const pool = require("../../connect-mysql");

/**
 * Subscription Plan Model - Quản lý database operations cho subscription plans
 */
module.exports = {
  
  /**
   * Lấy danh sách subscription plans (có phân trang và tìm kiếm)
   */
  async getAll(search, offset = 0, limit = 20, isActive = null) {
    let sql = `
      SELECT 
        id, plan_code, name, duration_months, price, original_price, 
        discount_percent, description, features, is_active, sort_order,
        created_at, updated_at,
        ROUND(price / duration_months, 0) as price_per_month,
        CASE 
          WHEN original_price IS NOT NULL AND original_price > price 
          THEN (original_price - price) 
          ELSE 0 
        END as savings_amount
      FROM subscription_plans 
      WHERE 1=1
    `;
    const params = [];

    if (search) {
      sql += ` AND (name LIKE ? OR plan_code LIKE ? OR description LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    if (isActive !== null) {
      sql += ` AND is_active = ?`;
      params.push(isActive);
    }

    sql += ` ORDER BY is_active DESC, sort_order ASC, duration_months ASC LIMIT ?, ?`;
    params.push(offset, limit);

    const [rows] = await pool.query(sql, params);
    
    // Parse features JSON
    return rows.map(plan => ({
      ...plan,
      features: this.parseFeatures(plan.features),
      price: parseFloat(plan.price),
      original_price: plan.original_price ? parseFloat(plan.original_price) : null,
      discount_percent: parseFloat(plan.discount_percent),
      savings_amount: parseFloat(plan.savings_amount),
      price_per_month: parseInt(plan.price_per_month)
    }));
  },

  /**
   * Lấy tổng số subscription plans
   */
  async getTotalRow(search, isActive = null) {
    let sql = "SELECT COUNT(*) AS totalRow FROM subscription_plans WHERE 1=1";
    const params = [];

    if (search) {
      sql += ` AND (name LIKE ? OR plan_code LIKE ? OR description LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    if (isActive !== null) {
      sql += ` AND is_active = ?`;
      params.push(isActive);
    }

    const [result] = await pool.query(sql, params);
    return result[0].totalRow;
  },

  /**
   * Lấy subscription plan theo ID
   */
  async getById(id) {
    const [rows] = await pool.query(
      "SELECT * FROM subscription_plans WHERE id = ?", 
      [id]
    );
    
    if (rows[0]) {
      return {
        ...rows[0],
        features: this.parseFeatures(rows[0].features),
        price: parseFloat(rows[0].price),
        original_price: rows[0].original_price ? parseFloat(rows[0].original_price) : null,
        discount_percent: parseFloat(rows[0].discount_percent)
      };
    }
    return null;
  },

  /**
   * Lấy subscription plan theo plan_code
   */
  async getByPlanCode(planCode) {
    const [rows] = await pool.query(
      "SELECT * FROM subscription_plans WHERE plan_code = ?", 
      [planCode]
    );
    
    if (rows[0]) {
      return {
        ...rows[0],
        features: this.parseFeatures(rows[0].features),
        price: parseFloat(rows[0].price),
        original_price: rows[0].original_price ? parseFloat(rows[0].original_price) : null,
        discount_percent: parseFloat(rows[0].discount_percent)
      };
    }
    return null;
  },

  /**
   * Lấy tất cả plans active (cho user selection)
   */
  async getActivePlans() {
    const [rows] = await pool.query(`
      SELECT 
        id, plan_code, name, duration_months, price, original_price, 
        discount_percent, description, features, sort_order,
        ROUND(price / duration_months, 0) as price_per_month,
        CASE 
          WHEN original_price IS NOT NULL AND original_price > price 
          THEN (original_price - price) 
          ELSE 0 
        END as savings_amount
      FROM subscription_plans 
      WHERE is_active = 1 
      ORDER BY sort_order ASC, duration_months ASC
    `);
    
    return rows.map(plan => ({
      ...plan,
      features: this.parseFeatures(plan.features),
      price: parseFloat(plan.price),
      original_price: plan.original_price ? parseFloat(plan.original_price) : null,
      discount_percent: parseFloat(plan.discount_percent),
      savings_amount: parseFloat(plan.savings_amount),
      price_per_month: parseInt(plan.price_per_month)
    }));
  },

  /**
   * Tạo subscription plan mới
   */
  async create(planData) {
    // Kiểm tra plan_code trùng lặp
    const existing = await this.getByPlanCode(planData.plan_code);
    if (existing) {
      throw new Error('Plan code đã tồn tại');
    }

    const sql = `
      INSERT INTO subscription_plans (
        plan_code, name, duration_months, price, original_price, 
        discount_percent, description, features, is_active, sort_order
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    const values = [
      planData.plan_code,
      planData.name,
      parseInt(planData.duration_months),
      parseFloat(planData.price),
      planData.original_price ? parseFloat(planData.original_price) : null,
      parseFloat(planData.discount_percent) || 0,
      planData.description || null,
      this.safeStringifyFeatures(planData.features),
      planData.is_active !== undefined ? planData.is_active : 1,
      parseInt(planData.sort_order) || 0
    ];

    const [result] = await pool.query(sql, values);
    return result.insertId;
  },

  /**
   * Cập nhật subscription plan
   */
  async update(id, planData) {
    // Kiểm tra plan_code trùng lặp (trừ plan hiện tại)
    if (planData.plan_code) {
      const existing = await this.checkDuplicate(planData.plan_code, id);
      if (existing) {
        throw new Error('Plan code đã tồn tại');
      }
    }

    const sql = `
      UPDATE subscription_plans SET
        plan_code = ?, name = ?, duration_months = ?, price = ?, 
        original_price = ?, discount_percent = ?, description = ?, 
        features = ?, is_active = ?, sort_order = ?, updated_at = NOW()
      WHERE id = ?
    `;
    
    const values = [
      planData.plan_code,
      planData.name,
      parseInt(planData.duration_months),
      parseFloat(planData.price),
      planData.original_price ? parseFloat(planData.original_price) : null,
      parseFloat(planData.discount_percent) || 0,
      planData.description || null,
      this.safeStringifyFeatures(planData.features),
      planData.is_active !== undefined ? planData.is_active : 1,
      parseInt(planData.sort_order) || 0,
      id
    ];

    const [result] = await pool.query(sql, values);
    return result.affectedRows > 0;
  },

  /**
   * Xóa subscription plan (chỉ cho phép xóa nếu không có dữ liệu liên quan)
   */
  async delete(id) {
    const timestamp = new Date().toISOString();
    console.log(`🔍 [${timestamp}] Attempting to delete plan ${id}...`);
    
    // Kiểm tra tất cả các bảng liên quan
    const [orders] = await pool.query(
      'SELECT COUNT(*) as count FROM momo_orders WHERE plan_id = ?',
      [id]
    );

    const [history] = await pool.query(
      'SELECT COUNT(*) as count FROM subscription_history WHERE plan_id = ?',
      [id]
    );

    const totalRelated = orders[0].count + history[0].count;
    console.log(`📊 [${timestamp}] Found ${orders[0].count} orders and ${history[0].count} history records using plan ${id}`);

    if (totalRelated > 0) {
      // Có dữ liệu liên quan, không cho phép xóa
      console.log(`❌ [${timestamp}] DELETE BLOCKED - Plan ${id} has ${totalRelated} related records`);
      console.log(`📝 [${timestamp}] AUDIT: Delete attempt blocked for plan ${id} - ${totalRelated} related records exist`);
      
      let errorMsg = `Không thể xóa gói này vì đang có dữ liệu liên quan:`;
      if (orders[0].count > 0) errorMsg += ` ${orders[0].count} đơn hàng`;
      if (history[0].count > 0) errorMsg += ` ${history[0].count} lịch sử đăng ký`;
      errorMsg += `. Vui lòng tạm dừng gói thay vì xóa.`;
      
      throw new Error(errorMsg);
    } else {
      // Không có dữ liệu liên quan, có thể xóa an toàn
      console.log(`✅ [${timestamp}] No related data found, proceeding with deletion`);
      
      // Lấy thông tin plan trước khi xóa để log
      const [planInfo] = await pool.query(
        'SELECT plan_code, name FROM subscription_plans WHERE id = ?',
        [id]
      );
      
      const [result] = await pool.query('DELETE FROM subscription_plans WHERE id = ?', [id]);
      
      if (result.affectedRows > 0) {
        console.log(`🗑️ [${timestamp}] Plan deleted successfully: ${planInfo[0]?.name || 'Unknown'} (${planInfo[0]?.plan_code || 'Unknown'})`);
        console.log(`📝 [${timestamp}] AUDIT: Plan ${id} permanently deleted - ${planInfo[0]?.name || 'Unknown'} (${planInfo[0]?.plan_code || 'Unknown'})`);
        return true;
      } else {
        console.log(`⚠️ [${timestamp}] No rows affected - plan ${id} may not exist`);
        return false;
      }
    }
  },

  /**
   * Kích hoạt/vô hiệu hóa plan
   */
  async toggleActive(id) {
    const [result] = await pool.query(
      'UPDATE subscription_plans SET is_active = !is_active, updated_at = NOW() WHERE id = ?',
      [id]
    );
    return result.affectedRows > 0;
  },

  /**
   * Set trạng thái active/inactive theo giá trị cụ thể
   */
  async setActiveStatus(id, isActive) {
    const [result] = await pool.query(
      'UPDATE subscription_plans SET is_active = ?, updated_at = NOW() WHERE id = ?',
      [isActive ? 1 : 0, id]
    );
    return result.affectedRows > 0;
  },

  /**
   * Cập nhật thứ tự hiển thị
   */
  async updateSortOrder(planUpdates) {
    const connection = await pool.getConnection();
    await connection.beginTransaction();
    
    try {
      for (const update of planUpdates) {
        await connection.query(
          'UPDATE subscription_plans SET sort_order = ?, updated_at = NOW() WHERE id = ?',
          [update.sort_order, update.id]
        );
      }
      
      await connection.commit();
      return true;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  },

  /**
   * Kiểm tra plan_code trùng lặp
   */
  async checkDuplicate(planCode, excludeId = null) {
    let sql = 'SELECT id FROM subscription_plans WHERE plan_code = ?';
    const params = [planCode];
    
    if (excludeId) {
      sql += ' AND id != ?';
      params.push(excludeId);
    }

    const [rows] = await pool.query(sql, params);
    return rows.length > 0;
  },

  /**
   * Lấy thống kê subscription plans
   */
  async getStatistics() {
    const [stats] = await pool.query(`
      SELECT 
        COUNT(*) as total_plans,
        SUM(CASE WHEN is_active = 1 THEN 1 ELSE 0 END) as active_plans,
        AVG(price) as avg_price,
        MIN(price) as min_price,
        MAX(price) as max_price,
        AVG(duration_months) as avg_duration
      FROM subscription_plans
    `);

    // Lấy top selling plans (từ orders)
    const [topPlans] = await pool.query(`
      SELECT 
        sp.id, sp.name, sp.plan_code,
        COUNT(mo.id) as order_count,
        SUM(CASE WHEN mo.status = 'completed' THEN mo.amount ELSE 0 END) as total_revenue,
        AVG(mo.amount) as avg_order_value
      FROM subscription_plans sp
      LEFT JOIN momo_orders mo ON sp.id = mo.plan_id
      WHERE sp.is_active = 1
      GROUP BY sp.id, sp.name, sp.plan_code
      ORDER BY order_count DESC, total_revenue DESC
      LIMIT 5
    `);

    return {
      summary: {
        total_plans: stats[0].total_plans,
        active_plans: stats[0].active_plans,
        inactive_plans: stats[0].total_plans - stats[0].active_plans,
        avg_price: parseFloat(stats[0].avg_price) || 0,
        min_price: parseFloat(stats[0].min_price) || 0,
        max_price: parseFloat(stats[0].max_price) || 0,
        avg_duration: parseFloat(stats[0].avg_duration) || 0
      },
      top_plans: topPlans.map(plan => ({
        ...plan,
        total_revenue: parseFloat(plan.total_revenue) || 0,
        avg_order_value: parseFloat(plan.avg_order_value) || 0
      }))
    };
  },

  /**
   * Safe stringify features để tránh lỗi JSON
   */
  safeStringifyFeatures(features) {
    try {
      if (!features) return JSON.stringify([]);
      
      // Nếu đã là string hợp lệ, trả về luôn
      if (typeof features === 'string') {
        JSON.parse(features); // Test parse
        return features;
      }
      
      // Nếu là array, stringify
      if (Array.isArray(features)) {
        return JSON.stringify(features);
      }
      
      // Fallback
      return JSON.stringify([]);
    } catch (error) {
      // Nếu có lỗi, trả về array rỗng
      return JSON.stringify([]);
    }
  },

  /**
   * Parse features JSON với fallback
   */
  parseFeatures(featuresData) {
    if (!featuresData) return [];
    
    try {
      const cleanFeatures = featuresData.toString().trim();
      
      // Kiểm tra nếu là string rỗng hoặc null
      if (!cleanFeatures || cleanFeatures === 'null' || cleanFeatures === 'undefined') {
        return [];
      }
      
      const features = JSON.parse(cleanFeatures);
      
      if (Array.isArray(features)) {
        return features;
      }
    } catch (error) {
      // Im lặng xử lý lỗi, không log để tránh spam console
      // console.warn('JSON parse error for features:', error);
    }
    
    // Fallback features
    return [
      "100 tin nhắn chat/ngày",
      "100 lần dịch/ngày", 
      "Luyện nghe không giới hạn",
      "Tạo flashcard riêng",
      "HSK không giới hạn"
    ];
  },

  /**
   * Bulk operations
   */
  async bulkToggleActive(ids, isActive) {
    const placeholders = ids.map(() => '?').join(',');
    const [result] = await pool.query(
      `UPDATE subscription_plans SET is_active = ?, updated_at = NOW() WHERE id IN (${placeholders})`,
      [isActive, ...ids]
    );
    return result.affectedRows;
  },

  async bulkDelete(ids) {
    // Kiểm tra có đơn hàng pending không
    const placeholders = ids.map(() => '?').join(',');
    const [orders] = await pool.query(
      `SELECT COUNT(*) as count FROM momo_orders WHERE plan_id IN (${placeholders}) AND status IN ("pending", "processing")`,
      ids
    );

    if (orders[0].count > 0) {
      throw new Error('Một số plan đang có đơn hàng pending/processing');
    }

    // Soft delete
    const [result] = await pool.query(
      `UPDATE subscription_plans SET is_active = 0, updated_at = NOW() WHERE id IN (${placeholders})`,
      ids
    );
    return result.affectedRows;
  }
};
