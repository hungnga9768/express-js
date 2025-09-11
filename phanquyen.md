FREE USER vs 💎 PREMIUM USER (Cập nhật cuối)
📚 NỘI DUNG HỌC TẬP:
Tính năng	FREE	PREMIUM
Bài học	✅ Full access	✅ Full access
Khóa học	✅ Full access	✅ Full access
Từ vựng	✅ Full access	✅ Full access
Đề thi HSK	5 bài/level	Không giới hạn
Games	✅ Full access	✅ Full access
Flashcard	❌ Không có	✅ Tạo flashcard riêng
🤖 CHAT AI & DỊCH:
Tính năng	FREE	PREMIUM
Tin nhắn/ngày	10 tin nhắn	100 tin nhắn
Dịch/ngày	20 lần	100 lần
Chức năng chat	Dịch cơ bản	Dịch + Giải thích + Ví dụ
Lịch sử chat	3 ngày	30 ngày
🎧 LUYỆN NGHE & PHÁT ÂM:
Tính năng	FREE	PREMIUM
Luyện nghe/ngày	20 lần	Không giới hạn
Phát âm/ngày	20 lần	Không giới hạn
Chức năng	Cơ bản	Nâng cao + AI feedback
📥 DOWNLOAD & TÀI LIỆU:
Tính năng	FREE	PREMIUM
Download PDF	✅ Full access	✅ Full access
Download Audio	✅ Full access	✅ Full access
Tài liệu	✅ Full access	✅ Full access
Export từ vựng	✅ Full access	✅ Full access
📊 TIẾN ĐỘ & THỐNG KÊ:
Tính năng	FREE	PREMIUM
Lưu tiến độ	✅ Full access	✅ Full access
Thống kê học tập	✅ Full access	✅ Full access
Báo cáo tuần	✅ Full access	✅ Full access
Mục tiêu học tập	✅ Full access	✅ Full access
🎮 GAMES & GIẢI TRÍ:
Tính năng	FREE	PREMIUM
Games	✅ Full access	✅ Full access
Lưu điểm cao	✅ Full access	✅ Full access
Leaderboard	✅ Full access	✅ Full access
Achievement	✅ Full access	✅ Full access
ĐIỂM KHÁC BIỆT CHÍNH:
FREE User:
✅ Học đầy đủ bài học + khóa học + từ vựng
✅ Download tài liệu đầy đủ
✅ Lưu tiến độ đầy đủ
✅ Thống kê đầy đủ
✅ Games đầy đủ
✅ HSK: 5 bài/level (HSK 1: 5 bài, HSK 2: 5 bài, ...)
✅ Luyện nghe: 20 lần/ngày
✅ Phát âm: 20 lần/ngày
❌ Chỉ 10 tin nhắn chat/ngày
❌ Chỉ 20 lần dịch/ngày
❌ Không có flashcard
PREMIUM User:
✅ Tất cả tính năng FREE
✅ 100 tin nhắn chat/ngày
✅ 100 lần dịch/ngày
✅ HSK: Không giới hạn bài thi
✅ Luyện nghe: Không giới hạn
✅ Phát âm: Không giới hạn
✅ Tạo flashcard riêng
💰 CHIẾN LƯỢC UPGRADE:
FREE → PREMIUM triggers:
User muốn chat AI nhiều hơn (10 → 100 tin nhắn)
User muốn dịch nhiều hơn (20 → 100 lần)
User muốn làm nhiều bài HSK hơn (5 → unlimited)
User muốn luyện nghe/phát âm nhiều hơn (20 → unlimited)
User muốn tạo flashcard riêng
⏰ THỜI GIAN TRIỂN KHAI:
Tuần 1: Implement chat limits (10 vs 100)
Tuần 2: Implement dịch limits (20 vs 100)
Tuần 3: Implement HSK limits (5 vs unlimited)
Tuần 4: Implement luyện nghe/phát âm limits (20 vs unlimited)
Tuần 5: Implement flashcard creation
Tuần 6: Testing & optimization
Tuần 7: Launch premium subscription làm sao làm lại dự án đi
-- Bảng tracking usage hàng ngày
CREATE TABLE `daily_usage` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `feature` varchar(50) NOT NULL COMMENT 'chat, translate, speech_practice, hsk_tests',
  `usage_count` int DEFAULT 0,
  `date` date NOT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `user_feature_date` (`user_id`, `feature`, `date`),
  KEY `user_id` (`user_id`),
  KEY `date` (`date`),
  CONSTRAINT `daily_usage_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='Bảng theo dõi usage hàng ngày của user';

-- Bảng subscription limits
CREATE TABLE `subscription_limits` (
  `id` int NOT NULL AUTO_INCREMENT,
  `subscription_type` enum('free','premium') NOT NULL,
  `feature` varchar(50) NOT NULL,
  `daily_limit` int NOT NULL COMMENT '-1 = unlimited',
  `description` text,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `subscription_feature` (`subscription_type`, `feature`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='Bảng giới hạn theo subscription';

-- Insert subscription limits
INSERT INTO `subscription_limits` (`subscription_type`, `feature`, `daily_limit`, `description`) VALUES
('free', 'chat', 10, 'Tin nhắn chat AI mỗi ngày'),
('premium', 'chat', 100, 'Tin nhắn chat AI mỗi ngày'),
('free', 'translate', 20, 'Lần dịch mỗi ngày'),
('premium', 'translate', 100, 'Lần dịch mỗi ngày'),
('free', 'speech_practice', 20, 'Lần luyện nghe/phát âm mỗi ngày'),
('premium', 'speech_practice', -1, 'Không giới hạn luyện nghe/phát âm'),
('free', 'hsk_tests', 5, 'Số bài HSK mỗi level'),
('premium', 'hsk_tests', -1, 'Không giới hạn bài HSK'),
('free', 'flashcard', 0, 'Không được tạo flashcard'),
('premium', 'flashcard', -1, 'Không giới hạn tạo flashcard');
