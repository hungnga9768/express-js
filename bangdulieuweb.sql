-- MySQL dump 10.13  Distrib 8.0.41, for Win64 (x86_64)
--
-- Host: 127.0.0.1    Database: web_hoctiengtrung
-- ------------------------------------------------------
-- Server version	8.0.41

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `achievements`
--

DROP TABLE IF EXISTS `achievements`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `achievements` (
  `achievement_id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `description` text,
  `icon_url` varchar(255) DEFAULT NULL,
  `criteria` json NOT NULL,
  PRIMARY KEY (`achievement_id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='Bảng các thành tích trong hệ thống';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `admins`
--

DROP TABLE IF EXISTS `admins`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `admins` (
  `admin_id` int NOT NULL AUTO_INCREMENT,
  `username` varchar(50) NOT NULL,
  `email` varchar(100) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `full_name` varchar(100) NOT NULL,
  `avatar` varchar(255) DEFAULT NULL,
  `role` enum('super_admin','content_manager','support') NOT NULL,
  `last_login` datetime DEFAULT NULL,
  `status` enum('active','inactive') DEFAULT 'active',
  `created_by` int DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`admin_id`),
  UNIQUE KEY `username` (`username`),
  UNIQUE KEY `email` (`email`),
  KEY `created_by` (`created_by`),
  CONSTRAINT `admins_ibfk_1` FOREIGN KEY (`created_by`) REFERENCES `admins` (`admin_id`)
) ENGINE=InnoDB AUTO_INCREMENT=27 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='Bảng lưu thông tin quản trị viên của hệ thống';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `banners`
--

DROP TABLE IF EXISTS `banners`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `banners` (
  `id` int NOT NULL AUTO_INCREMENT,
  `title` varchar(255) NOT NULL,
  `description` text,
  `image_url` varchar(500) NOT NULL,
  `link_url` varchar(500) DEFAULT NULL,
  `display_order` int DEFAULT '0',
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=19 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `chat_history`
--

DROP TABLE IF EXISTS `chat_history`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `chat_history` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `session_id` varchar(255) NOT NULL,
  `role` enum('user','model','system') NOT NULL,
  `content` text NOT NULL,
  `timestamp` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `topic_internal_name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_user_session` (`user_id`,`session_id`),
  CONSTRAINT `chat_history_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=960 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `chat_topics`
--

DROP TABLE IF EXISTS `chat_topics`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `chat_topics` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Tên hiển thị của chủ đề (ví dụ: Ngữ pháp HSK 1)',
  `internal_name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `initial_prompt` text COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Chuỗi hướng dẫn ban đầu cho AI (System Instruction)',
  `description` text COLLATE utf8mb4_unicode_ci COMMENT 'Mô tả chi tiết về chủ đề',
  `avatar_url` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT '1' COMMENT 'Cờ bật/tắt chủ đề',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP COMMENT 'Thời điểm bản ghi được tạo',
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Thời điểm bản ghi được cập nhật lần cuối',
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`),
  UNIQUE KEY `internal_name` (`internal_name`)
) ENGINE=InnoDB AUTO_INCREMENT=26 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `chinese_documents`
--

DROP TABLE IF EXISTS `chinese_documents`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `chinese_documents` (
  `document_id` int NOT NULL AUTO_INCREMENT,
  `title` varchar(255) NOT NULL,
  `description` mediumtext,
  `content_type` enum('pdf','video','audio','text','image') NOT NULL,
  `content_url` varchar(255) NOT NULL,
  `difficulty_level` enum('beginner','intermediate','advanced') NOT NULL,
  `hsk_level` int DEFAULT NULL,
  `category` enum('grammar','vocabulary','reading','listening','writing') NOT NULL,
  `word_count` int DEFAULT NULL,
  `duration` int DEFAULT NULL COMMENT 'Thời lượng (phút) nếu là audio/video',
  `thumbnail_url` varchar(255) DEFAULT NULL,
  `is_free` tinyint(1) DEFAULT '0',
  `price` decimal(10,2) DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`document_id`),
  KEY `difficulty_level` (`difficulty_level`),
  KEY `hsk_level` (`hsk_level`),
  KEY `category` (`category`)
) ENGINE=InnoDB AUTO_INCREMENT=69 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `courseenrollments`
--

DROP TABLE IF EXISTS `courseenrollments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `courseenrollments` (
  `enrollment_id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `course_id` int NOT NULL,
  `enrollment_date` datetime DEFAULT CURRENT_TIMESTAMP,
  `completion_percentage` decimal(5,2) DEFAULT '0.00',
  PRIMARY KEY (`enrollment_id`),
  UNIQUE KEY `user_id` (`user_id`,`course_id`),
  KEY `course_id` (`course_id`),
  CONSTRAINT `courseenrollments_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE,
  CONSTRAINT `courseenrollments_ibfk_2` FOREIGN KEY (`course_id`) REFERENCES `courses` (`course_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=28 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='Bảng ghi danh khóa học của người dùng';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `coursereviews`
--

DROP TABLE IF EXISTS `coursereviews`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `coursereviews` (
  `review_id` int NOT NULL AUTO_INCREMENT,
  `course_id` int NOT NULL,
  `user_id` int NOT NULL,
  `rating` int NOT NULL,
  `review_text` text,
  `review_date` datetime DEFAULT CURRENT_TIMESTAMP,
  `is_approved` tinyint(1) DEFAULT '0',
  `helpful_count` int DEFAULT '0',
  PRIMARY KEY (`review_id`),
  UNIQUE KEY `course_id` (`course_id`,`user_id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `coursereviews_ibfk_1` FOREIGN KEY (`course_id`) REFERENCES `courses` (`course_id`) ON DELETE CASCADE,
  CONSTRAINT `coursereviews_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE,
  CONSTRAINT `coursereviews_chk_1` CHECK ((`rating` between 1 and 5))
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='Bảng đánh giá và nhận xét khóa học';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `courses`
--

DROP TABLE IF EXISTS `courses`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `courses` (
  `course_id` int NOT NULL AUTO_INCREMENT,
  `title` varchar(100) NOT NULL,
  `description` mediumtext,
  `thumbnail_url` varchar(255) DEFAULT NULL,
  `difficulty_level` enum('hsk1','hsk2','hsk3','hsk4','hsk5','hsk6') DEFAULT NULL,
  `estimated_duration` int DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `is_free` tinyint(1) DEFAULT '0',
  `price` decimal(10,2) DEFAULT NULL,
  PRIMARY KEY (`course_id`),
  CONSTRAINT `CHK_Price` CHECK (((`is_free` = true) or (`price` > 0)))
) ENGINE=InnoDB AUTO_INCREMENT=120 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='Bảng thông tin các khóa học';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `coursevocabulary`
--

DROP TABLE IF EXISTS `coursevocabulary`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `coursevocabulary` (
  `course_id` int NOT NULL,
  `word_id` int NOT NULL,
  PRIMARY KEY (`course_id`,`word_id`),
  KEY `word_id` (`word_id`),
  CONSTRAINT `coursevocabulary_ibfk_1` FOREIGN KEY (`course_id`) REFERENCES `courses` (`course_id`) ON DELETE CASCADE,
  CONSTRAINT `coursevocabulary_ibfk_2` FOREIGN KEY (`word_id`) REFERENCES `vocabulary` (`word_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='Bảng liên kết từ vựng với khóa học';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `exercises`
--

DROP TABLE IF EXISTS `exercises`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `exercises` (
  `exercise_id` int NOT NULL AUTO_INCREMENT,
  `exercise_set_id` int DEFAULT NULL,
  `exercise_type` enum('multiple_choice','fill_blank','matching','writing') DEFAULT NULL,
  `question` text NOT NULL,
  `options` json DEFAULT NULL,
  `correct_answer` varchar(255) DEFAULT NULL,
  `explanation` text,
  PRIMARY KEY (`exercise_id`),
  KEY `fk_exercise_set` (`exercise_set_id`),
  CONSTRAINT `fk_exercise_set` FOREIGN KEY (`exercise_set_id`) REFERENCES `exercisesets` (`exercise_set_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=50 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='Bảng các bài tập thực hành';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `exercisesets`
--

DROP TABLE IF EXISTS `exercisesets`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `exercisesets` (
  `exercise_set_id` int NOT NULL AUTO_INCREMENT,
  `lesson_id` int DEFAULT NULL,
  `title` varchar(255) DEFAULT NULL,
  `description` text,
  PRIMARY KEY (`exercise_set_id`),
  KEY `lesson_id` (`lesson_id`),
  CONSTRAINT `exercisesets_ibfk_1` FOREIGN KEY (`lesson_id`) REFERENCES `lessons` (`lesson_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=43 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='Bảng chứa các nhóm bài tập (bài kiểm tra, bài luyện)';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `feedbacks`
--

DROP TABLE IF EXISTS `feedbacks`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `feedbacks` (
  `feedback_id` int NOT NULL AUTO_INCREMENT,
  `user_id` int DEFAULT NULL,
  `content` text NOT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `status` enum('new','reviewed','archived') DEFAULT 'new',
  `handled_by` int DEFAULT NULL,
  PRIMARY KEY (`feedback_id`),
  KEY `user_id` (`user_id`),
  KEY `handled_by` (`handled_by`),
  CONSTRAINT `feedbacks_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`),
  CONSTRAINT `feedbacks_ibfk_2` FOREIGN KEY (`handled_by`) REFERENCES `admins` (`admin_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='Góp ý, phản hồi từ người dùng gửi lên cho hệ thống';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `flashcards`
--

DROP TABLE IF EXISTS `flashcards`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `flashcards` (
  `flashcard_id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `word_id` int DEFAULT NULL,
  `grammar_id` int DEFAULT NULL,
  `front_content` text NOT NULL,
  `back_content` text NOT NULL,
  `creation_date` datetime DEFAULT CURRENT_TIMESTAMP,
  `last_reviewed` datetime DEFAULT NULL,
  `next_review_date` datetime DEFAULT NULL,
  `difficulty_level` enum('easy','medium','hard') DEFAULT NULL,
  PRIMARY KEY (`flashcard_id`),
  KEY `user_id` (`user_id`),
  KEY `word_id` (`word_id`),
  KEY `grammar_id` (`grammar_id`),
  CONSTRAINT `flashcards_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE,
  CONSTRAINT `flashcards_ibfk_2` FOREIGN KEY (`word_id`) REFERENCES `vocabulary` (`word_id`) ON DELETE SET NULL,
  CONSTRAINT `flashcards_ibfk_3` FOREIGN KEY (`grammar_id`) REFERENCES `grammar` (`grammar_id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=189 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='Bảng thẻ học từ vựng/ngữ pháp';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `forumcategories`
--

DROP TABLE IF EXISTS `forumcategories`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `forumcategories` (
  `category_id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `description` text,
  `display_order` int DEFAULT NULL,
  PRIMARY KEY (`category_id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='Bảng các chuyên mục trong diễn đàn';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `forumposts`
--

DROP TABLE IF EXISTS `forumposts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `forumposts` (
  `post_id` int NOT NULL AUTO_INCREMENT,
  `topic_id` int NOT NULL,
  `user_id` int NOT NULL,
  `content` text NOT NULL,
  `posted_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `is_answer` tinyint(1) DEFAULT '0',
  `upvotes` int DEFAULT '0',
  `downvotes` int DEFAULT '0',
  PRIMARY KEY (`post_id`),
  KEY `topic_id` (`topic_id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `forumposts_ibfk_1` FOREIGN KEY (`topic_id`) REFERENCES `forumtopics` (`topic_id`) ON DELETE CASCADE,
  CONSTRAINT `forumposts_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='Bảng các bài viết trong chủ đề diễn đàn';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `forumtopics`
--

DROP TABLE IF EXISTS `forumtopics`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `forumtopics` (
  `topic_id` int NOT NULL AUTO_INCREMENT,
  `category_id` int NOT NULL,
  `user_id` int NOT NULL,
  `title` varchar(200) NOT NULL,
  `content` text NOT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `last_updated` datetime DEFAULT CURRENT_TIMESTAMP,
  `view_count` int DEFAULT '0',
  `is_pinned` tinyint(1) DEFAULT '0',
  `is_closed` tinyint(1) DEFAULT '0',
  PRIMARY KEY (`topic_id`),
  KEY `category_id` (`category_id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `forumtopics_ibfk_1` FOREIGN KEY (`category_id`) REFERENCES `forumcategories` (`category_id`) ON DELETE CASCADE,
  CONSTRAINT `forumtopics_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='Bảng các chủ đề thảo luận trong diễn đàn';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `gamegrammar`
--

DROP TABLE IF EXISTS `gamegrammar`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `gamegrammar` (
  `game_id` int NOT NULL,
  `grammar_id` int NOT NULL,
  PRIMARY KEY (`game_id`,`grammar_id`),
  KEY `grammar_id` (`grammar_id`),
  CONSTRAINT `gamegrammar_ibfk_1` FOREIGN KEY (`game_id`) REFERENCES `games` (`game_id`),
  CONSTRAINT `gamegrammar_ibfk_2` FOREIGN KEY (`grammar_id`) REFERENCES `grammar` (`grammar_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='Ngữ pháp sử dụng trong các game';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `gameimages`
--

DROP TABLE IF EXISTS `gameimages`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `gameimages` (
  `image_id` int NOT NULL AUTO_INCREMENT,
  `word_id` int NOT NULL,
  `image_url` varchar(255) NOT NULL,
  `is_correct_answer` tinyint(1) DEFAULT '0',
  PRIMARY KEY (`image_id`),
  KEY `word_id` (`word_id`),
  CONSTRAINT `gameimages_ibfk_1` FOREIGN KEY (`word_id`) REFERENCES `vocabulary` (`word_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='Ảnh minh họa từ vựng cho game';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `gameleaderboard`
--

DROP TABLE IF EXISTS `gameleaderboard`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `gameleaderboard` (
  `entry_id` int NOT NULL AUTO_INCREMENT,
  `game_id` int NOT NULL,
  `user_id` int NOT NULL,
  `score` int NOT NULL,
  `date_achieved` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`entry_id`),
  KEY `user_id` (`user_id`),
  KEY `game_id` (`game_id`,`score`),
  CONSTRAINT `gameleaderboard_ibfk_1` FOREIGN KEY (`game_id`) REFERENCES `games` (`game_id`),
  CONSTRAINT `gameleaderboard_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`)
) ENGINE=InnoDB AUTO_INCREMENT=242 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='Bảng xếp hạng các game';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `gamerewards`
--

DROP TABLE IF EXISTS `gamerewards`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `gamerewards` (
  `reward_id` int NOT NULL AUTO_INCREMENT,
  `game_id` int NOT NULL,
  `name` varchar(100) NOT NULL,
  `description` text,
  `reward_type` enum('xp','badge','coin','item') NOT NULL,
  `reward_value` int DEFAULT NULL,
  `icon_url` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`reward_id`),
  KEY `game_id` (`game_id`),
  CONSTRAINT `gamerewards_ibfk_1` FOREIGN KEY (`game_id`) REFERENCES `games` (`game_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='Phần thưởng có thể nhận được từ game';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `games`
--

DROP TABLE IF EXISTS `games`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `games` (
  `game_id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `description` text,
  `game_type` enum('vocabulary','grammar','listening','writing','pronunciation','image_quiz') NOT NULL,
  `difficulty_level` enum('beginner','intermediate','advanced') DEFAULT NULL,
  `thumbnail_url` varchar(255) DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`game_id`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='Danh sách các game trong hệ thống';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `gamesessions`
--

DROP TABLE IF EXISTS `gamesessions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `gamesessions` (
  `session_id` int NOT NULL AUTO_INCREMENT,
  `game_id` int NOT NULL,
  `user_id` int NOT NULL,
  `start_time` datetime DEFAULT CURRENT_TIMESTAMP,
  `end_time` datetime DEFAULT NULL,
  `score` int DEFAULT NULL,
  `duration_seconds` int DEFAULT NULL,
  PRIMARY KEY (`session_id`),
  KEY `game_id` (`game_id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `gamesessions_ibfk_1` FOREIGN KEY (`game_id`) REFERENCES `games` (`game_id`),
  CONSTRAINT `gamesessions_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`)
) ENGINE=InnoDB AUTO_INCREMENT=637 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='Lưu lịch sử các lượt chơi game';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `gamevocabulary`
--

DROP TABLE IF EXISTS `gamevocabulary`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `gamevocabulary` (
  `game_id` int NOT NULL,
  `word_id` int NOT NULL,
  `use_images` tinyint(1) DEFAULT '0' COMMENT 'TRUE nếu game dùng ảnh thay vì chữ',
  PRIMARY KEY (`game_id`,`word_id`),
  KEY `word_id` (`word_id`),
  CONSTRAINT `gamevocabulary_ibfk_1` FOREIGN KEY (`game_id`) REFERENCES `games` (`game_id`),
  CONSTRAINT `gamevocabulary_ibfk_2` FOREIGN KEY (`word_id`) REFERENCES `vocabulary` (`word_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='Từ vựng sử dụng trong các game';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `grammar`
--

DROP TABLE IF EXISTS `grammar`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `grammar` (
  `grammar_id` int NOT NULL AUTO_INCREMENT,
  `title` varchar(100) NOT NULL,
  `structure` text NOT NULL,
  `explanation` text,
  `example_chinese` text,
  `example_pinyin` text,
  `example_english` text,
  `difficulty_level` enum('beginner','intermediate','advanced') DEFAULT NULL,
  `hsk_level` int DEFAULT NULL,
  PRIMARY KEY (`grammar_id`)
) ENGINE=InnoDB AUTO_INCREMENT=20 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='Bảng các điểm ngữ pháp tiếng Trung';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `hskquestions`
--

DROP TABLE IF EXISTS `hskquestions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `hskquestions` (
  `question_id` int NOT NULL AUTO_INCREMENT,
  `test_id` int NOT NULL,
  `question_type` enum('listening','reading','writing','multiple_choice','fill_blank','matching','true_false','ordering','rewrite') NOT NULL,
  `question_text` text,
  `audio_url` varchar(255) DEFAULT NULL,
  `image_url` varchar(255) DEFAULT NULL,
  `options` json DEFAULT NULL,
  `correct_answer` text NOT NULL,
  `explanation` text,
  `difficulty_level` enum('easy','medium','hard') DEFAULT NULL,
  `points` int NOT NULL DEFAULT '1',
  `order_in_test` int NOT NULL DEFAULT '0',
  `matching_pairs` json DEFAULT NULL,
  `ordering_items` json DEFAULT NULL,
  `rewrite_instruction` text,
  `skill_type` enum('listening','reading','writing') NOT NULL DEFAULT 'reading',
  PRIMARY KEY (`question_id`),
  KEY `test_id` (`test_id`),
  KEY `ix_hskq_test_order` (`test_id`,`order_in_test`),
  CONSTRAINT `hskquestions_ibfk_1` FOREIGN KEY (`test_id`) REFERENCES `hsktests` (`test_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=137 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='Bảng câu hỏi trong đề thi HSK';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `hskresults`
--

DROP TABLE IF EXISTS `hskresults`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `hskresults` (
  `result_id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `test_id` int NOT NULL,
  `attempt_date` datetime DEFAULT CURRENT_TIMESTAMP,
  `listening_score` int DEFAULT NULL,
  `reading_score` int DEFAULT NULL,
  `writing_score` int DEFAULT NULL,
  `total_score` int NOT NULL,
  `is_passed` tinyint(1) DEFAULT '0',
  `time_spent` int DEFAULT '0',
  `status` enum('in_progress','submitted','graded') NOT NULL DEFAULT 'in_progress',
  `started_at` datetime DEFAULT NULL,
  `ended_at` datetime DEFAULT NULL,
  `total_questions` int DEFAULT NULL,
  `time_limit` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`result_id`),
  KEY `user_id` (`user_id`),
  KEY `test_id` (`test_id`),
  CONSTRAINT `hskresults_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`),
  CONSTRAINT `hskresults_ibfk_2` FOREIGN KEY (`test_id`) REFERENCES `hsktests` (`test_id`)
) ENGINE=InnoDB AUTO_INCREMENT=204 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='Bảng lưu kết quả thi HSK của người dùng';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `hsktests`
--

DROP TABLE IF EXISTS `hsktests`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `hsktests` (
  `test_id` int NOT NULL AUTO_INCREMENT,
  `hsk_level` int NOT NULL,
  `title` varchar(100) NOT NULL,
  `description` text,
  `total_questions` int NOT NULL,
  `time_limit` int DEFAULT NULL,
  `passing_score` int NOT NULL,
  `randomize_questions` tinyint(1) NOT NULL DEFAULT '0',
  `status` enum('draft','public','hidden') DEFAULT 'draft',
  `is_active` tinyint(1) DEFAULT '0',
  PRIMARY KEY (`test_id`),
  CONSTRAINT `hsktests_chk_1` CHECK ((`hsk_level` between 1 and 6))
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='Bảng đề thi HSK các cấp độ';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `hskuseranswers`
--

DROP TABLE IF EXISTS `hskuseranswers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `hskuseranswers` (
  `answer_id` int NOT NULL AUTO_INCREMENT,
  `result_id` int NOT NULL,
  `question_id` int NOT NULL,
  `user_answer` text,
  `is_correct` tinyint(1) NOT NULL,
  `score` int DEFAULT '0',
  `question_order` int DEFAULT '0',
  `time_spent` int DEFAULT '0',
  `feedback` text,
  `graded_at` datetime DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`answer_id`),
  UNIQUE KEY `uq_result_question` (`result_id`,`question_id`),
  KEY `ix_result_id` (`result_id`),
  KEY `ix_question_id` (`question_id`),
  CONSTRAINT `fk_hskua_question` FOREIGN KEY (`question_id`) REFERENCES `hskquestions` (`question_id`) ON DELETE CASCADE,
  CONSTRAINT `hskuseranswers_ibfk_1` FOREIGN KEY (`result_id`) REFERENCES `hskresults` (`result_id`) ON DELETE CASCADE,
  CONSTRAINT `hskuseranswers_ibfk_2` FOREIGN KEY (`question_id`) REFERENCES `hskquestions` (`question_id`)
) ENGINE=InnoDB AUTO_INCREMENT=201 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='Bảng lưu chi tiết từng câu trả lời của người dùng cho một lần thi';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `learningprogress`
--

DROP TABLE IF EXISTS `learningprogress`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `learningprogress` (
  `progress_id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `course_id` int NOT NULL,
  `lesson_id` int NOT NULL,
  `completion_status` enum('not_started','in_progress','completed') DEFAULT 'not_started',
  `last_accessed` datetime DEFAULT NULL,
  `completion_date` datetime DEFAULT NULL,
  `score` decimal(5,2) DEFAULT NULL,
  PRIMARY KEY (`progress_id`),
  UNIQUE KEY `user_id` (`user_id`,`lesson_id`),
  KEY `course_id` (`course_id`),
  KEY `lesson_id` (`lesson_id`),
  CONSTRAINT `learningprogress_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE,
  CONSTRAINT `learningprogress_ibfk_2` FOREIGN KEY (`course_id`) REFERENCES `courses` (`course_id`) ON DELETE CASCADE,
  CONSTRAINT `learningprogress_ibfk_3` FOREIGN KEY (`lesson_id`) REFERENCES `lessons` (`lesson_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=111 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='Bảng theo dõi tiến độ học tập';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `lessonnotes`
--

DROP TABLE IF EXISTS `lessonnotes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `lessonnotes` (
  `note_id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `course_id` int NOT NULL,
  `lesson_id` int NOT NULL,
  `note_text` text NOT NULL,
  `note_type` enum('general','vocabulary','grammar','pronunciation') DEFAULT 'general',
  `is_public` tinyint(1) DEFAULT '0',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`note_id`),
  KEY `user_id` (`user_id`),
  KEY `course_id` (`course_id`),
  KEY `lesson_id` (`lesson_id`),
  CONSTRAINT `lessonnotes_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE,
  CONSTRAINT `lessonnotes_ibfk_2` FOREIGN KEY (`course_id`) REFERENCES `courses` (`course_id`) ON DELETE CASCADE,
  CONSTRAINT `lessonnotes_ibfk_3` FOREIGN KEY (`lesson_id`) REFERENCES `lessons` (`lesson_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `lessons`
--

DROP TABLE IF EXISTS `lessons`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `lessons` (
  `lesson_id` int NOT NULL AUTO_INCREMENT,
  `course_id` int NOT NULL,
  `title` varchar(100) NOT NULL,
  `description` text,
  `content_type` enum('video','text','quiz','interactive') DEFAULT NULL,
  `content_url` varchar(255) DEFAULT NULL,
  `duration` int DEFAULT NULL,
  `display_order` int DEFAULT NULL,
  `is_preview` tinyint(1) DEFAULT '0',
  PRIMARY KEY (`lesson_id`),
  KEY `course_id` (`course_id`),
  CONSTRAINT `lessons_ibfk_1` FOREIGN KEY (`course_id`) REFERENCES `courses` (`course_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=685 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='Bảng bài học trong các khóa học';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `password_resets`
--

DROP TABLE IF EXISTS `password_resets`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `password_resets` (
  `id` int NOT NULL AUTO_INCREMENT,
  `email` varchar(100) NOT NULL,
  `token` varchar(255) NOT NULL,
  `expires_at` datetime NOT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `token` (`token`),
  KEY `idx_email` (`email`),
  KEY `idx_token` (`token`),
  KEY `idx_expires_at` (`expires_at`)
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `pronunciationanalytics`
--

DROP TABLE IF EXISTS `pronunciationanalytics`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `pronunciationanalytics` (
  `analytics_id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `date` date NOT NULL,
  `total_practices` int DEFAULT '0',
  `average_score` decimal(5,2) DEFAULT NULL,
  `tone_accuracy` json DEFAULT NULL,
  `improvement_rate` decimal(5,2) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`analytics_id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `pronunciationanalytics_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `pronunciationpractice`
--

DROP TABLE IF EXISTS `pronunciationpractice`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `pronunciationpractice` (
  `practice_id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `word_id` int DEFAULT NULL,
  `grammar_id` int DEFAULT NULL,
  `audio_recording_url` varchar(255) NOT NULL,
  `submission_time` datetime DEFAULT CURRENT_TIMESTAMP,
  `accuracy_score` decimal(5,2) DEFAULT NULL,
  `feedback` text,
  `tone_analysis` json DEFAULT NULL,
  `pronunciation_errors` json DEFAULT NULL,
  PRIMARY KEY (`practice_id`),
  KEY `user_id` (`user_id`),
  KEY `word_id` (`word_id`),
  KEY `grammar_id` (`grammar_id`),
  CONSTRAINT `pronunciationpractice_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`),
  CONSTRAINT `pronunciationpractice_ibfk_2` FOREIGN KEY (`word_id`) REFERENCES `vocabulary` (`word_id`),
  CONSTRAINT `pronunciationpractice_ibfk_3` FOREIGN KEY (`grammar_id`) REFERENCES `grammar` (`grammar_id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='Bảng lưu bài luyện phát âm của người dùng';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `settings`
--

DROP TABLE IF EXISTS `settings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `settings` (
  `id` int NOT NULL AUTO_INCREMENT,
  `key` varchar(100) NOT NULL,
  `value` text,
  `note` varchar(255) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `key` (`key`)
) ENGINE=InnoDB AUTO_INCREMENT=46 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `systemsettings`
--

DROP TABLE IF EXISTS `systemsettings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `systemsettings` (
  `setting_id` int NOT NULL AUTO_INCREMENT,
  `key_name` varchar(100) NOT NULL COMMENT 'Ví dụ: site_title, maintenance_mode',
  `key_value` text NOT NULL,
  `key_type` enum('string','number','boolean','json') DEFAULT 'string',
  `description` text,
  `updated_by` int DEFAULT NULL,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`setting_id`),
  UNIQUE KEY `key_name` (`key_name`),
  KEY `updated_by` (`updated_by`),
  CONSTRAINT `systemsettings_ibfk_1` FOREIGN KEY (`updated_by`) REFERENCES `admins` (`admin_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='Bảng lưu các thiết lập cấu hình hệ thống như tiêu đề web, chế độ bảo trì,...';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `userachievements`
--

DROP TABLE IF EXISTS `userachievements`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `userachievements` (
  `user_id` int NOT NULL,
  `achievement_id` int NOT NULL,
  `earned_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`user_id`,`achievement_id`),
  KEY `achievement_id` (`achievement_id`),
  CONSTRAINT `userachievements_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE,
  CONSTRAINT `userachievements_ibfk_2` FOREIGN KEY (`achievement_id`) REFERENCES `achievements` (`achievement_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='Bảng thành tích mà người dùng đã đạt được';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `useractivitylog`
--

DROP TABLE IF EXISTS `useractivitylog`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `useractivitylog` (
  `log_id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `activity_type` enum('login','course_start','lesson_complete','exercise_attempt','vocabulary_practice','pronunciation_practice','hsk_test_attempt','forum_post') NOT NULL,
  `activity_details` json DEFAULT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `user_agent` text,
  `timestamp` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`log_id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `useractivitylog_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='Bảng ghi nhận mọi hoạt động của người dùng';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `usergameprogress`
--

DROP TABLE IF EXISTS `usergameprogress`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `usergameprogress` (
  `progress_id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `game_id` int NOT NULL,
  `level` int DEFAULT '1',
  `current_xp` int DEFAULT '0',
  `unlocked_rewards` json DEFAULT NULL,
  `last_played` datetime DEFAULT NULL,
  PRIMARY KEY (`progress_id`),
  UNIQUE KEY `user_id` (`user_id`,`game_id`),
  KEY `game_id` (`game_id`),
  CONSTRAINT `usergameprogress_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`),
  CONSTRAINT `usergameprogress_ibfk_2` FOREIGN KEY (`game_id`) REFERENCES `games` (`game_id`)
) ENGINE=InnoDB AUTO_INCREMENT=646 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='Tiến trình game của từng người dùng';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `user_id` int NOT NULL AUTO_INCREMENT,
  `username` varchar(50) NOT NULL,
  `email` varchar(100) NOT NULL,
  `password_hash` varchar(255) DEFAULT NULL,
  `full_name` varchar(100) DEFAULT NULL,
  `profile_picture` varchar(255) DEFAULT NULL,
  `registration_date` datetime DEFAULT CURRENT_TIMESTAMP,
  `last_login` datetime DEFAULT NULL,
  `account_status` enum('active','suspended','banned') DEFAULT 'active',
  `subscription_type` enum('free','premium','vip') DEFAULT 'free',
  `subscription_expiry` date DEFAULT NULL,
  `google_id` varchar(255) DEFAULT NULL,
  `facebook_id` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`user_id`),
  UNIQUE KEY `username` (`username`),
  UNIQUE KEY `email` (`email`),
  UNIQUE KEY `google_id` (`google_id`),
  UNIQUE KEY `facebook_id` (`facebook_id`)
) ENGINE=InnoDB AUTO_INCREMENT=56 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='Bảng lưu thông tin người dùng';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `vocabulary`
--

DROP TABLE IF EXISTS `vocabulary`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `vocabulary` (
  `word_id` int NOT NULL AUTO_INCREMENT,
  `simplified_chinese` varchar(50) NOT NULL,
  `traditional_chinese` varchar(50) DEFAULT NULL,
  `pinyin` varchar(100) NOT NULL,
  `english_meaning` varchar(255) NOT NULL,
  `part_of_speech` varchar(50) DEFAULT NULL,
  `hsk_level` int DEFAULT NULL,
  `example_sentence_chinese` text,
  `example_sentence_pinyin` text,
  `example_sentence_english` text,
  `audio_url` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`word_id`)
) ENGINE=InnoDB AUTO_INCREMENT=11459 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='Bảng từ vựng tiếng Trung';
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-09-11 18:17:43
