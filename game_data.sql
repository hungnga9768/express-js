-- Thêm dữ liệu mẫu cho bảng Games
INSERT INTO Games (game_id, name, description, game_type, difficulty_level, thumbnail_url, is_active) VALUES
(1, 'Flashcard Master', 'Ghi nhớ từ vựng qua phương pháp lặp lại ngắt quãng', 'vocabulary', 'beginner', '/images/games/flashcard-master.jpg', TRUE),
(2, 'Pinyin Puzzle', 'Ghép âm pinyin tương ứng với chữ Hán', 'pronunciation', 'beginner', '/images/games/pinyin-puzzle.jpg', TRUE),
(3, 'Sentence Builder', 'Xây dựng câu hoàn chỉnh từ các từ đã học', 'grammar', 'intermediate', '/images/games/sentence-builder.jpg', TRUE),
(4, 'Listening Warrior', 'Luyện kỹ năng nghe hiểu và nhận diện thanh điệu', 'listening', 'intermediate', '/images/games/listening-warrior.jpg', TRUE),
(5, 'HSK Speed Run', 'Ôn tập từ vựng HSK dưới áp lực thời gian', 'vocabulary', 'advanced', '/images/games/hsk-speed-run.jpg', TRUE);

-- Thêm dữ liệu mẫu cho bảng Achievements
INSERT INTO Achievements (achievement_id, name, description, icon_url, criteria) VALUES
(1, 'vocabulary_master', 'Từ Vựng Vàng', 'Học thuộc 100 từ vựng', '/images/badges/vocabulary-master.png', '{"type": "flashcard_count", "value": 100}'),
(2, 'pinyin_expert', 'Chuyên Gia Pinyin', 'Hoàn thành 50 câu hỏi pinyin với độ chính xác 90%', '/images/badges/pinyin-expert.png', '{"type": "pinyin_accuracy", "value": 90, "count": 50}'),
(3, 'sentence_architect', 'Kiến Trúc Sư Câu', 'Xây dựng 30 câu hoàn chỉnh', '/images/badges/sentence-architect.png', '{"type": "sentence_count", "value": 30}'),
(4, 'listening_champion', 'Nhà Vô Địch Nghe', 'Hoàn thành 40 bài luyện nghe', '/images/badges/listening-champion.png', '{"type": "listening_count", "value": 40}'),
(5, 'hsk_master', 'Bậc Thầy HSK', 'Đạt điểm cao trong HSK Speed Run', '/images/badges/hsk-master.png', '{"type": "hsk_score", "value": 90}'),
(6, 'speed_demon', 'Tốc Độ Bàn Thờ', 'Hoàn thành game trong thời gian kỷ lục', '/images/badges/speed-demon.png', '{"type": "speed_record", "value": 300}'),
(7, 'perfect_score', 'Điểm Số Hoàn Hảo', 'Đạt 100% độ chính xác trong bất kỳ game nào', '/images/badges/perfect-score.png', '{"type": "perfect_accuracy", "value": 100}'),
(8, 'daily_streak', 'Chuỗi Hàng Ngày', 'Chơi game liên tục 7 ngày', '/images/badges/daily-streak.png', '{"type": "daily_streak", "value": 7}');

-- Thêm dữ liệu mẫu cho bảng GameRewards
INSERT INTO GameRewards (reward_id, game_id, name, description, reward_type, reward_value, icon_url) VALUES
(1, 1, 'XP Flashcard', 'Điểm kinh nghiệm cho Flashcard Master', 'xp', 100, '/images/rewards/xp-flashcard.png'),
(2, 1, 'Badge Từ Vựng Vàng', 'Huy hiệu cho việc học 100 từ vựng', 'badge', 1, '/images/rewards/badge-vocabulary.png'),
(3, 2, 'XP Pinyin', 'Điểm kinh nghiệm cho Pinyin Puzzle', 'xp', 150, '/images/rewards/xp-pinyin.png'),
(4, 2, 'Badge Chuyên Gia Pinyin', 'Huy hiệu cho độ chính xác pinyin cao', 'badge', 1, '/images/rewards/badge-pinyin.png'),
(5, 3, 'XP Grammar', 'Điểm kinh nghiệm cho Sentence Builder', 'xp', 200, '/images/rewards/xp-grammar.png'),
(6, 3, 'Badge Kiến Trúc Sư', 'Huy hiệu cho việc xây dựng câu', 'badge', 1, '/images/rewards/badge-grammar.png'),
(7, 4, 'XP Listening', 'Điểm kinh nghiệm cho Listening Warrior', 'xp', 180, '/images/rewards/xp-listening.png'),
(8, 4, 'Badge Nhà Vô Địch Nghe', 'Huy hiệu cho kỹ năng nghe', 'badge', 1, '/images/rewards/badge-listening.png'),
(9, 5, 'XP HSK', 'Điểm kinh nghiệm cho HSK Speed Run', 'xp', 250, '/images/rewards/xp-hsk.png'),
(10, 5, 'Badge Bậc Thầy HSK', 'Huy hiệu cho thành tích HSK', 'badge', 1, '/images/rewards/badge-hsk.png');

-- Thêm dữ liệu mẫu cho bảng Vocabulary (nếu chưa có)
INSERT INTO Vocabulary (simplified_chinese, traditional_chinese, pinyin, english_meaning, part_of_speech, hsk_level, example_sentence_chinese, example_sentence_pinyin, example_sentence_english, audio_url) VALUES
('你好', '你好', 'nǐ hǎo', 'Hello', 'interjection', 1, '你好！', 'nǐ hǎo!', 'Hello!', '/audio/ni_hao.mp3'),
('谢谢', '謝謝', 'xièxie', 'Thank you', 'interjection', 1, '谢谢！', 'xièxie!', 'Thank you!', '/audio/xiexie.mp3'),
('再见', '再見', 'zàijiàn', 'Goodbye', 'interjection', 1, '再见！', 'zàijiàn!', 'Goodbye!', '/audio/zaijian.mp3'),
('对不起', '對不起', 'duìbùqǐ', 'Sorry', 'interjection', 1, '对不起！', 'duìbùqǐ!', 'Sorry!', '/audio/duibuqi.mp3'),
('我', '我', 'wǒ', 'I, me', 'pronoun', 1, '我是学生。', 'wǒ shì xuéshēng.', 'I am a student.', '/audio/wo.mp3'),
('你', '你', 'nǐ', 'You', 'pronoun', 1, '你好吗？', 'nǐ hǎo ma?', 'How are you?', '/audio/ni.mp3'),
('他', '他', 'tā', 'He, him', 'pronoun', 1, '他是老师。', 'tā shì lǎoshī.', 'He is a teacher.', '/audio/ta.mp3'),
('她', '她', 'tā', 'She, her', 'pronoun', 1, '她是医生。', 'tā shì yīshēng.', 'She is a doctor.', '/audio/ta_female.mp3'),
('我们', '我們', 'wǒmen', 'We, us', 'pronoun', 1, '我们是朋友。', 'wǒmen shì péngyǒu.', 'We are friends.', '/audio/women.mp3'),
('你们', '你們', 'nǐmen', 'You (plural)', 'pronoun', 1, '你们好！', 'nǐmen hǎo!', 'Hello everyone!', '/audio/nimen.mp3');

-- Thêm dữ liệu mẫu cho bảng Grammar
INSERT INTO Grammar (title, structure, explanation, example_chinese, example_pinyin, example_english, difficulty_level, hsk_level) VALUES
('Câu khẳng định với 是', 'Subject + 是 + Object', 'Cấu trúc cơ bản để nói "A là B"', '我是学生。', 'wǒ shì xuéshēng.', 'I am a student.', 'beginner', 1),
('Câu hỏi với 吗', 'Statement + 吗', 'Thêm 吗 vào cuối câu để tạo câu hỏi', '你好吗？', 'nǐ hǎo ma?', 'How are you?', 'beginner', 1),
('Câu phủ định với 不', 'Subject + 不 + Verb', 'Thêm 不 trước động từ để phủ định', '我不是老师。', 'wǒ bù shì lǎoshī.', 'I am not a teacher.', 'beginner', 1),
('Đại từ nhân xưng', '我/你/他/她', 'Các đại từ nhân xưng cơ bản', '他是医生。', 'tā shì yīshēng.', 'He is a doctor.', 'beginner', 1),
('Số nhiều với 们', 'Pronoun + 们', 'Thêm 们 để chỉ số nhiều', '我们是朋友。', 'wǒmen shì péngyǒu.', 'We are friends.', 'beginner', 1);

-- Thêm dữ liệu mẫu cho bảng GameVocabulary
INSERT INTO GameVocabulary (game_id, word_id, use_images) VALUES
(1, 1, FALSE),
(1, 2, FALSE),
(1, 3, FALSE),
(1, 4, FALSE),
(1, 5, FALSE),
(2, 1, FALSE),
(2, 2, FALSE),
(2, 3, FALSE),
(2, 4, FALSE),
(2, 5, FALSE);

-- Thêm dữ liệu mẫu cho bảng GameGrammar
INSERT INTO GameGrammar (game_id, grammar_id) VALUES
(3, 1),
(3, 2),
(3, 3),
(3, 4),
(3, 5);
