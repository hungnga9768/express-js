-- Bảng tracking usage hàng ngày
CREATE TABLE IF NOT EXISTS `daily_usage` (
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
CREATE TABLE IF NOT EXISTS `subscription_limits` (
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
('premium', 'flashcard', -1, 'Không giới hạn tạo flashcard')
ON DUPLICATE KEY UPDATE daily_limit=VALUES(daily_limit), description=VALUES(description);
