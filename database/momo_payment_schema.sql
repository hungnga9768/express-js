-- ===============================================
-- MOMO PAYMENT SYSTEM - DATABASE SCHEMA
-- ===============================================

-- 1. BẢNG GÓI SUBSCRIPTION (User chọn gói này)
CREATE TABLE IF NOT EXISTS `subscription_plans` (
  `id` int NOT NULL AUTO_INCREMENT,
  `plan_code` varchar(20) NOT NULL UNIQUE COMMENT 'Mã gói: 1month, 6months, 1year',
  `name` varchar(100) NOT NULL COMMENT 'Tên hiển thị: Premium 1 Tháng',
  `duration_months` int NOT NULL COMMENT 'Số tháng: 1, 6, 12',
  `price` decimal(10,2) NOT NULL COMMENT 'Giá tiền VND',
  `original_price` decimal(10,2) NULL COMMENT 'Giá gốc (nếu có giảm giá)',
  `discount_percent` decimal(5,2) DEFAULT 0 COMMENT 'Phần trăm giảm giá',
  `description` text COMMENT 'Mô tả gói',
  `features` JSON COMMENT 'Danh sách tính năng',
  `is_active` tinyint(1) DEFAULT 1 COMMENT '1=active, 0=inactive',
  `sort_order` int DEFAULT 0 COMMENT 'Thứ tự hiển thị',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_active` (`is_active`),
  INDEX `idx_sort` (`sort_order`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='Bảng gói subscription Premium';

-- 2. BẢNG ĐỢN HÀNG MOMO
CREATE TABLE IF NOT EXISTS `momo_orders` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `order_id` varchar(50) NOT NULL UNIQUE COMMENT 'Mã đơn hàng unique',
  `plan_id` int NOT NULL COMMENT 'ID gói subscription',
  `partner_ref_id` varchar(50) COMMENT 'Reference ID gửi cho MoMo',
  `amount` decimal(10,2) NOT NULL COMMENT 'Số tiền thanh toán',
  `momo_order_id` varchar(100) COMMENT 'Order ID từ MoMo',
  `momo_trans_id` varchar(100) COMMENT 'Transaction ID từ MoMo',
  `status` enum('pending','processing','completed','failed','expired','cancelled') DEFAULT 'pending',
  `payment_url` text COMMENT 'URL thanh toán từ MoMo',
  `qr_code_url` text COMMENT 'QR Code URL từ MoMo',
  `deeplink` text COMMENT 'Deep link mở MoMo app',
  `result_code` int COMMENT 'Mã kết quả từ MoMo webhook',
  `message` text COMMENT 'Thông báo từ MoMo',
  `pay_type` varchar(20) COMMENT 'Loại thanh toán: qr, webpay, napas',
  `signature` text COMMENT 'Chữ ký từ MoMo',
  `request_id` varchar(50) COMMENT 'Request ID duy nhất',
  `order_info` text COMMENT 'Thông tin đơn hàng',
  `extra_data` text COMMENT 'Dữ liệu thêm',
  `expire_time` datetime COMMENT 'Thời gian hết hạn đơn hàng',
  `completed_at` datetime NULL COMMENT 'Thời gian hoàn thành',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_user_id` (`user_id`),
  INDEX `idx_status` (`status`),
  INDEX `idx_order_id` (`order_id`),
  INDEX `idx_momo_trans` (`momo_trans_id`),
  INDEX `idx_created` (`created_at`),
  CONSTRAINT `momo_orders_user_fk` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE,
  CONSTRAINT `momo_orders_plan_fk` FOREIGN KEY (`plan_id`) REFERENCES `subscription_plans` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='Bảng đơn hàng thanh toán MoMo';

-- 3. BẢNG WEBHOOK NOTIFICATIONS
CREATE TABLE IF NOT EXISTS `momo_webhooks` (
  `id` int NOT NULL AUTO_INCREMENT,
  `order_id` varchar(50) NOT NULL COMMENT 'Mã đơn hàng',
  `partner_code` varchar(50) COMMENT 'Partner code từ MoMo',
  `access_key` varchar(100) COMMENT 'Access key từ MoMo',
  `request_id` varchar(50) COMMENT 'Request ID',
  `amount` decimal(10,2) NOT NULL COMMENT 'Số tiền',
  `order_info` text COMMENT 'Thông tin đơn hàng',
  `partner_ref_id` varchar(50) COMMENT 'Partner reference ID',
  `momo_trans_id` varchar(100) COMMENT 'MoMo transaction ID',
  `result_code` int NOT NULL COMMENT 'Mã kết quả: 0=success',
  `message` text COMMENT 'Thông báo từ MoMo',
  `pay_type` varchar(20) COMMENT 'Loại thanh toán',
  `response_time` bigint COMMENT 'Response time từ MoMo',
  `extra_data` text COMMENT 'Dữ liệu thêm',
  `signature` text NOT NULL COMMENT 'Chữ ký xác thực',
  `is_processed` tinyint(1) DEFAULT 0 COMMENT '1=đã xử lý, 0=chưa xử lý',
  `processed_at` datetime NULL COMMENT 'Thời gian xử lý',
  `error_message` text COMMENT 'Lỗi khi xử lý (nếu có)',
  `raw_data` JSON COMMENT 'Raw data từ webhook',
  `received_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_order_id` (`order_id`),
  INDEX `idx_result_code` (`result_code`),
  INDEX `idx_processed` (`is_processed`),
  INDEX `idx_received` (`received_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='Bảng webhook notifications từ MoMo';

-- 4. BẢNG LỊCH SỬ SUBSCRIPTION
CREATE TABLE IF NOT EXISTS `subscription_history` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `order_id` varchar(50) COMMENT 'Mã đơn hàng',
  `plan_id` int NOT NULL,
  `action` enum('activate','extend','expire','cancel') NOT NULL,
  `old_subscription_type` varchar(20) COMMENT 'Loại subscription cũ',
  `new_subscription_type` varchar(20) COMMENT 'Loại subscription mới',
  `old_expiry_date` datetime COMMENT 'Ngày hết hạn cũ',
  `new_expiry_date` datetime COMMENT 'Ngày hết hạn mới',
  `duration_months` int COMMENT 'Số tháng gia hạn',
  `amount_paid` decimal(10,2) COMMENT 'Số tiền đã thanh toán',
  `notes` text COMMENT 'Ghi chú',
  `created_by` varchar(50) DEFAULT 'system' COMMENT 'Ai thực hiện: system/admin/user',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_user_id` (`user_id`),
  INDEX `idx_action` (`action`),
  INDEX `idx_created` (`created_at`),
  CONSTRAINT `subscription_history_user_fk` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE,
  CONSTRAINT `subscription_history_plan_fk` FOREIGN KEY (`plan_id`) REFERENCES `subscription_plans` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='Lịch sử thay đổi subscription';

-- ===============================================
-- INSERT DỮ LIỆU MẪU
-- ===============================================

-- INSERT CÁC GÓI SUBSCRIPTION
INSERT INTO `subscription_plans` (`plan_code`, `name`, `duration_months`, `price`, `original_price`, `discount_percent`, `description`, `features`, `sort_order`) VALUES
('1month', 'Premium 1 Tháng', 1, 299000.00, 299000.00, 0, 'Gói Premium cơ bản 1 tháng', 
 '["100 tin nhắn chat/ngày", "100 lần dịch/ngày", "Luyện nghe không giới hạn", "Tạo flashcard riêng", "HSK không giới hạn"]', 1),

('6months', 'Premium 6 Tháng', 6, 1499000.00, 1794000.00, 15, 'Gói Premium 6 tháng - Tiết kiệm 15%', 
 '["100 tin nhắn chat/ngày", "100 lần dịch/ngày", "Luyện nghe không giới hạn", "Tạo flashcard riêng", "HSK không giới hạn", "Ưu đãi 15%"]', 2),

('1year', 'Premium 1 Năm', 12, 2699000.00, 3588000.00, 25, 'Gói Premium 1 năm - Tiết kiệm 25%', 
 '["100 tin nhắn chat/ngày", "100 lần dịch/ngày", "Luyện nghe không giới hạn", "Tạo flashcard riêng", "HSK không giới hạn", "Ưu đãi 25%", "Hỗ trợ ưu tiên"]', 3);

-- ===============================================
-- TẠO INDEXES BỔ SUNG ĐỂ TỐI ƯU PERFORMANCE
-- ===============================================

-- Index cho user lookup nhanh
CREATE INDEX `idx_users_subscription` ON `users` (`subscription_type`, `subscription_expiry`);

-- Index cho tìm kiếm orders theo thời gian
CREATE INDEX `idx_momo_orders_date_status` ON `momo_orders` (`created_at`, `status`);

-- Index cho webhook processing
CREATE INDEX `idx_webhook_processing` ON `momo_webhooks` (`is_processed`, `result_code`, `received_at`);
