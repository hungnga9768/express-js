

use web_hoctiengtrung;
CREATE TABLE Users (
    user_id INT PRIMARY KEY AUTO_INCREMENT,        -- ID người dùng (tự động tăng)
    username VARCHAR(50) UNIQUE NOT NULL,         -- Tên đăng nhập (duy nhất)
    email VARCHAR(100) UNIQUE NOT NULL,           -- Email (duy nhất)
    password_hash VARCHAR(255) NOT NULL,          -- Mật khẩu đã mã hóa
    full_name VARCHAR(100),                       -- Họ và tên đầy đủ
    profile_picture VARCHAR(255),                 -- Đường dẫn ảnh đại diện
    registration_date DATETIME DEFAULT CURRENT_TIMESTAMP, -- Ngày đăng ký
    last_login DATETIME,                          -- Lần đăng nhập cuối
    account_status ENUM('active', 'suspended', 'banned') DEFAULT 'active', -- Trạng thái tài khoản
    subscription_type ENUM('free', 'premium', 'vip') DEFAULT 'free', -- Loại tài khoản
    subscription_expiry DATE                      -- Ngày hết hạn gói
) COMMENT 'Bảng lưu thông tin người dùng';
CREATE TABLE Courses (
    course_id INT PRIMARY KEY AUTO_INCREMENT,      -- ID khóa học
    title VARCHAR(100) NOT NULL,                  -- Tên khóa học
    description TEXT,                             -- Mô tả chi tiết
    thumbnail_url VARCHAR(255),                   -- Ảnh bìa khóa học
    difficulty_level ENUM('beginner', 'intermediate', 'advanced'), -- Độ khó
    estimated_duration INT,                       -- Thời lượng ước tính (giờ)
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP, -- Ngày tạo khóa học
    is_free BOOLEAN DEFAULT FALSE,                -- Có miễn phí không
    price DECIMAL(10,2),                          -- Giá khóa học
    instructor_id INT,                            -- ID giảng viên
    FOREIGN KEY (instructor_id) REFERENCES Users(user_id),
    CONSTRAINT CHK_Price CHECK (is_free = TRUE OR price > 0) -- Ràng buộc giá
) COMMENT 'Bảng thông tin các khóa học';
CREATE TABLE Lessons (
    lesson_id INT PRIMARY KEY AUTO_INCREMENT,     -- ID bài học
    course_id INT NOT NULL,                       -- ID khóa học chứa bài này
    title VARCHAR(100) NOT NULL,                  -- Tiêu đề bài học
    description TEXT,                             -- Mô tả bài học
    content_type ENUM('video', 'text', 'quiz', 'interactive'), -- Loại nội dung
    content_url VARCHAR(255),                     -- Đường dẫn nội dung
    duration INT, 
     module_order INT;                                -- Thời lượng (phút)
    display_order INT,                            -- Thứ tự hiển thị
    is_preview BOOLEAN DEFAULT FALSE,             -- Có xem trước được không
    FOREIGN KEY (course_id) REFERENCES Courses(course_id) ON DELETE CASCADE
) COMMENT 'Bảng bài học trong các khóa học';
CREATE TABLE Vocabulary (
    word_id INT PRIMARY KEY AUTO_INCREMENT,       -- ID từ vựng
    simplified_chinese VARCHAR(50) NOT NULL,      -- Chữ giản thể
    traditional_chinese VARCHAR(50),              -- Chữ phồn thể (nếu có)
    pinyin VARCHAR(100) NOT NULL,                 -- Phiên âm pinyin
    english_meaning VARCHAR(255) NOT NULL,        -- Nghĩa tiếng Anh
    part_of_speech VARCHAR(50),                   -- Loại từ (danh từ, động từ...)
    hsk_level INT,                                -- Cấp độ HSK (1-6)
    example_sentence_chinese TEXT,                -- Ví dụ câu tiếng Trung
    example_sentence_pinyin TEXT,                 -- Ví dụ câu pinyin
    example_sentence_english TEXT,                -- Ví dụ câu tiếng Anh
    audio_url VARCHAR(255)                        -- File phát âm mẫu
) COMMENT 'Bảng từ vựng tiếng Trung';
CREATE TABLE CourseVocabulary (
    course_id INT NOT NULL,                       -- ID khóa học
    word_id INT NOT NULL,                         -- ID từ vựng
    PRIMARY KEY (course_id, word_id),             -- Khóa chính kết hợp
    FOREIGN KEY (course_id) REFERENCES Courses(course_id) ON DELETE CASCADE,
    FOREIGN KEY (word_id) REFERENCES Vocabulary(word_id) ON DELETE CASCADE
) COMMENT 'Bảng liên kết từ vựng với khóa học';
CREATE TABLE Grammar (
    grammar_id INT PRIMARY KEY AUTO_INCREMENT,    -- ID điểm ngữ pháp
    title VARCHAR(100) NOT NULL,                  -- Tên cấu trúc ngữ pháp
    structure TEXT NOT NULL,                      -- Công thức ngữ pháp
    explanation TEXT,                             -- Giải thích chi tiết
    example_chinese TEXT,                         -- Ví dụ tiếng Trung
    example_pinyin TEXT,                          -- Ví dụ pinyin
    example_english TEXT,                         -- Ví dụ tiếng Anh
    difficulty_level ENUM('beginner', 'intermediate', 'advanced'), -- Độ khó
    hsk_level INT                                 -- Cấp độ HSK áp dụng
) COMMENT 'Bảng các điểm ngữ pháp tiếng Trung';

CREATE TABLE Exercises (
    exercise_id INT PRIMARY KEY AUTO_INCREMENT,
    exercise_set_id INT,
    exercise_type ENUM('multiple_choice', 'fill_blank', 'matching', 'writing'),
    question TEXT NOT NULL,
    options JSON,
    correct_answer TEXT,
    explanation TEXT, 
    FOREIGN KEY (exercise_set_id) REFERENCES ExerciseSets(exercise_set_id) ON DELETE CASCADE
) COMMENT 'Các câu hỏi thuộc một nhóm bài tập';
CREATE TABLE ExerciseSets (
    exercise_set_id INT PRIMARY KEY AUTO_INCREMENT,
    lesson_id INT,
    title VARCHAR(255),
    description TEXT,
    FOREIGN KEY (lesson_id) REFERENCES Lessons(lesson_id) ON DELETE CASCADE
) COMMENT 'Bảng chứa các nhóm bài tập (bài kiểm tra, bài luyện)';

CREATE TABLE PronunciationPractice (
    practice_id INT PRIMARY KEY AUTO_INCREMENT,   -- ID bài luyện phát âm
    user_id INT NOT NULL,                         -- ID người dùng
    word_id INT,                                  -- ID từ vựng (nếu có)
    grammar_id INT,                               -- ID ngữ pháp (nếu có)
    audio_recording_url VARCHAR(255) NOT NULL,    -- File ghi âm của người dùng
    submission_time DATETIME DEFAULT CURRENT_TIMESTAMP, -- Thời gian nộp bài
    accuracy_score DECIMAL(5,2),                  -- Điểm chính xác (%)
    feedback TEXT,                                -- Nhận xét tự động
    tone_analysis JSON,                           -- Phân tích các thanh điệu
    pronunciation_errors JSON,                    -- Các lỗi phát âm
    FOREIGN KEY (user_id) REFERENCES Users(user_id),
    FOREIGN KEY (word_id) REFERENCES Vocabulary(word_id),
    FOREIGN KEY (grammar_id) REFERENCES Grammar(grammar_id)
) COMMENT 'Bảng lưu bài luyện phát âm của người dùng';
-- Bảng 1: Đề thi HSK
CREATE TABLE HSKTests (
    test_id INT PRIMARY KEY AUTO_INCREMENT,                    -- ID duy nhất của đề thi
    hsk_level INT NOT NULL CHECK (hsk_level BETWEEN 1 AND 6),  -- Cấp độ HSK (từ 1 đến 6)
    title VARCHAR(100) NOT NULL,                               -- Tên hoặc tiêu đề của đề thi
    description TEXT,                                          -- Mô tả chi tiết về đề thi
    total_questions INT NOT NULL,                              -- Tổng số câu hỏi trong đề
    time_limit INT,                                            -- Thời gian làm bài cho phép (tính bằng phút)
    passing_score INT NOT NULL,                                -- Điểm tối thiểu để đạt
    randomize_questions TINYINT(1) NOT NULL DEFAULT 0          -- Cờ bật/tắt xáo trộn câu hỏi (0: không, 1: có)
) COMMENT 'Bảng đề thi HSK các cấp độ';

-- Bảng 2: Câu hỏi trong đề thi HSK
CREATE TABLE HSKQuestions (
    question_id INT PRIMARY KEY AUTO_INCREMENT,                             -- ID duy nhất của câu hỏi
    test_id INT NOT NULL,                                                   -- ID của đề thi chứa câu hỏi này
    question_type ENUM('listening', 'reading', 'writing') NOT NULL,         -- Loại kỹ năng của câu hỏi (Nghe, Đọc, Viết)
    question_text TEXT,                                                     -- Nội dung chi tiết của câu hỏi
    audio_url VARCHAR(255),                                                 -- Đường dẫn đến file âm thanh (nếu là câu hỏi Nghe)
    image_url VARCHAR(255),                                                 -- Đường dẫn đến file hình ảnh (nếu có)
    options JSON,                                                           -- Các lựa chọn trả lời (dạng JSON cho câu trắc nghiệm)
    correct_answer TEXT NOT NULL,                                           -- Đáp án đúng của câu hỏi
    explanation TEXT,                                                       -- Giải thích chi tiết cho đáp án
    difficulty_level ENUM('easy', 'medium', 'hard'),                        -- Mức độ khó của câu hỏi
    points INT NOT NULL DEFAULT 1,                                          -- Điểm số cho câu hỏi này
    order_in_test INT NOT NULL DEFAULT 0,                                   -- Thứ tự hiển thị của câu hỏi trong đề thi
    FOREIGN KEY (test_id) REFERENCES HSKTests(test_id) ON DELETE CASCADE,
    INDEX ix_hskq_test_order (test_id, order_in_test)                       -- Index để tăng tốc truy vấn và sắp xếp
) COMMENT 'Bảng câu hỏi trong đề thi HSK';
ALTER TABLE HSKQuestions
  MODIFY question_type ENUM(
    'listening', 'reading', 'writing',
    'multiple_choice', 'fill_blank', 'matching', 'true_false', 'ordering', 'rewrite'
  ) NOT NULL;

-- Thêm trường cho dữ liệu đặc biệt (ví dụ cho matching và ordering)
ALTER TABLE HSKQuestions
  ADD COLUMN matching_pairs JSON NULL,
  ADD COLUMN ordering_items JSON NULL,
  ADD COLUMN rewrite_instruction TEXT NULL;
-- Bảng 3: Kết quả thi của người dùng
CREATE TABLE HSKResults (
    result_id INT PRIMARY KEY AUTO_INCREMENT,                               -- ID duy nhất của một lần làm bài
    user_id INT NOT NULL,                                                   -- ID của người dùng làm bài
    test_id INT NOT NULL,                                                   -- ID của đề thi đã làm
    status ENUM('in_progress','submitted','graded') NOT NULL DEFAULT 'in_progress', -- Trạng thái của bài thi
    started_at DATETIME NULL,                                               -- Thời điểm bắt đầu làm bài
    ended_at DATETIME NULL,                                                 -- Thời điểm nộp bài
    attempt_date DATETIME DEFAULT CURRENT_TIMESTAMP,                        -- Ngày làm bài (có thể giữ lại hoặc thay bằng started_at)
    listening_score INT,                                                    -- Điểm phần thi Nghe
    reading_score INT,                                                      -- Điểm phần thi Đọc
    writing_score INT,                                                      -- Điểm phần thi Viết
    total_score INT NOT NULL,                                               -- Tổng điểm cuối cùng
    passed BOOLEAN NOT NULL,                                                -- Kết quả Đạt hay Không đạt
    time_spent INT,                                                        -- Tổng thời gian đã làm bài (tính bằng phút)
    total_questions INT NULL,                                               -- Snapshot: Tổng số câu hỏi của đề tại thời điểm thi
    time_limit INT NULL,                                                    -- Snapshot: Thời gian làm bài của đề tại thời điểm thi
    FOREIGN KEY (user_id) REFERENCES Users(user_id),
    FOREIGN KEY (test_id) REFERENCES HSKTests(test_id)
) COMMENT 'Bảng lưu kết quả thi HSK của người dùng';

-- Bảng 4: Chi tiết câu trả lời của người dùng
CREATE TABLE HSKUserAnswers (
    answer_id INT PRIMARY KEY AUTO_INCREMENT,         -- ID duy nhất của một câu trả lời
    result_id INT NOT NULL,                           -- ID của lần làm bài
    -- question_id INT NOT NULL,                         -- ID của câu hỏi được trả lời
    user_answer TEXT,                                 -- Nội dung câu trả lời của người dùng
    is_correct BOOLEAN NOT NULL,                      -- Ghi nhận câu trả lời này Đúng hay Sai
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, -- Thời điểm người dùng trả lời câu hỏi
    FOREIGN KEY (result_id) REFERENCES HSKResults(result_id) ON DELETE CASCADE,
    FOREIGN KEY (question_id) REFERENCES HSKQuestions(question_id),
    UNIQUE KEY uq_result_question (result_id, question_id), -- Đảm bảo mỗi câu hỏi chỉ được trả lời 1 lần trong 1 bài thi
    INDEX ix_result_id (result_id),                   -- Index để tăng tốc truy vấn theo kết quả
    INDEX ix_question_id (question_id)                -- Index để tăng tốc truy vấn theo câu hỏi
) COMMENT 'Bảng lưu chi tiết từng câu trả lời của người dùng cho một lần thi';
CREATE TABLE CourseEnrollments (
    enrollment_id INT PRIMARY KEY AUTO_INCREMENT, -- ID ghi danh
    user_id INT NOT NULL,                         -- ID người dùng
    course_id INT NOT NULL,                       -- ID khóa học
    enrollment_date DATETIME DEFAULT CURRENT_TIMESTAMP, -- Ngày ghi danh
    completion_percentage DECIMAL(5,2) DEFAULT 0, -- % hoàn thành
    FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (course_id) REFERENCES Courses(course_id) ON DELETE CASCADE,
    UNIQUE (user_id, course_id)                   -- Mỗi người chỉ ghi danh 1 lần
) COMMENT 'Bảng ghi danh khóa học của người dùng';
CREATE TABLE LearningProgress (
    progress_id INT PRIMARY KEY AUTO_INCREMENT,   -- ID tiến độ
    user_id INT NOT NULL,                         -- ID người dùng
    course_id INT NOT NULL,                       -- ID khóa học
    lesson_id INT NOT NULL,                       -- ID bài học
    completion_status ENUM('not_started', 'in_progress', 'completed') DEFAULT 'not_started', -- Trạng thái
    last_accessed DATETIME,                       -- Lần truy cập cuối
    completion_date DATETIME,                     -- Ngày hoàn thành
    score DECIMAL(5,2),                           -- Điểm (nếu có)
    FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (course_id) REFERENCES Courses(course_id) ON DELETE CASCADE,
    FOREIGN KEY (lesson_id) REFERENCES Lessons(lesson_id) ON DELETE CASCADE,
    UNIQUE (user_id, lesson_id)                   -- Mỗi bài học chỉ 1 bản ghi
) COMMENT 'Bảng theo dõi tiến độ học tập';
CREATE TABLE Flashcards (
    flashcard_id INT PRIMARY KEY AUTO_INCREMENT,  -- ID thẻ học
    user_id INT NOT NULL,                         -- ID người dùng
    word_id INT,                                  -- ID từ vựng (nếu có)
    grammar_id INT,                               -- ID ngữ pháp (nếu có)
    front_content TEXT NOT NULL,                  -- Mặt trước thẻ
    back_content TEXT NOT NULL,                   -- Mặt sau thẻ
    creation_date DATETIME DEFAULT CURRENT_TIMESTAMP, -- Ngày tạo
    last_reviewed DATETIME,                       -- Lần ôn tập cuối
    next_review_date DATETIME,                    -- Ngày ôn tập tiếp theo
    difficulty_level ENUM('easy', 'medium', 'hard'), -- Độ khó tự đánh giá
    FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (word_id) REFERENCES Vocabulary(word_id) ON DELETE SET NULL,
    FOREIGN KEY (grammar_id) REFERENCES Grammar(grammar_id) ON DELETE SET NULL
) COMMENT 'Bảng thẻ học từ vựng/ngữ pháp';
CREATE TABLE CourseReviews (
    review_id INT PRIMARY KEY AUTO_INCREMENT,     -- ID đánh giá
    course_id INT NOT NULL,                       -- ID khóa học
    user_id INT NOT NULL,                         -- ID người dùng
    rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5), -- Điểm đánh giá (1-5 sao)
    review_text TEXT,                             -- Nội dung đánh giá
    review_date DATETIME DEFAULT CURRENT_TIMESTAMP, -- Ngày đánh giá
    is_approved BOOLEAN DEFAULT FALSE,            -- Đã được duyệt chưa
    helpful_count INT DEFAULT 0,                  -- Số người thấy hữu ích
    FOREIGN KEY (course_id) REFERENCES Courses(course_id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE,
    UNIQUE (course_id, user_id)                   -- Mỗi người chỉ đánh giá 1 lần
) COMMENT 'Bảng đánh giá và nhận xét khóa học';
CREATE TABLE UserActivityLog (
    log_id INT PRIMARY KEY AUTO_INCREMENT,        -- ID bản ghi
    user_id INT NOT NULL,                         -- ID người dùng
    activity_type ENUM('login', 'course_start', 'lesson_complete', 'exercise_attempt', 
                      'vocabulary_practice', 'pronunciation_practice', 
                      'hsk_test_attempt', 'forum_post') NOT NULL, -- Loại hoạt động
    activity_details JSON,                        -- Chi tiết hoạt động (dạng JSON)
    ip_address VARCHAR(45),                       -- Địa chỉ IP
    user_agent TEXT,                              -- Thông tin trình duyệt/thiết bị
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP, -- Thời gian hoạt động
    FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE
) COMMENT 'Bảng ghi nhận mọi hoạt động của người dùng';
CREATE TABLE ForumCategories (
    category_id INT PRIMARY KEY AUTO_INCREMENT,   -- ID chuyên mục
    name VARCHAR(100) NOT NULL,                  -- Tên chuyên mục
    description TEXT,                             -- Mô tả chuyên mục
    display_order INT                             -- Thứ tự hiển thị
) COMMENT 'Bảng các chuyên mục trong diễn đàn';
CREATE TABLE ForumTopics (
    topic_id INT PRIMARY KEY AUTO_INCREMENT,      -- ID chủ đề
    category_id INT NOT NULL,                     -- ID chuyên mục
    user_id INT NOT NULL,                         -- ID người tạo
    title VARCHAR(200) NOT NULL,                  -- Tiêu đề chủ đề
    content TEXT NOT NULL,                        -- Nội dung chủ đề
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP, -- Ngày tạo
    last_updated DATETIME DEFAULT CURRENT_TIMESTAMP, -- Ngày cập nhật cuối
    view_count INT DEFAULT 0,                     -- Lượt xem
    is_pinned BOOLEAN DEFAULT FALSE,              -- Được ghim lên đầu
    is_closed BOOLEAN DEFAULT FALSE,              -- Đã đóng thảo luận
    FOREIGN KEY (category_id) REFERENCES ForumCategories(category_id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE
) COMMENT 'Bảng các chủ đề thảo luận trong diễn đàn';
CREATE TABLE ForumPosts (
    post_id INT PRIMARY KEY AUTO_INCREMENT,       -- ID bài viết
    topic_id INT NOT NULL,                        -- ID chủ đề
    user_id INT NOT NULL,                         -- ID người viết
    content TEXT NOT NULL,                        -- Nội dung bài viết
    posted_at DATETIME DEFAULT CURRENT_TIMESTAMP, -- Ngày đăng
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, -- Ngày cập nhật
    is_answer BOOLEAN DEFAULT FALSE,              -- Có phải là câu trả lời đúng
    upvotes INT DEFAULT 0,                        -- Số lượt upvote
    downvotes INT DEFAULT 0,                      -- Số lượt downvote
    FOREIGN KEY (topic_id) REFERENCES ForumTopics(topic_id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE
) COMMENT 'Bảng các bài viết trong chủ đề diễn đàn';
CREATE TABLE Achievements (
    achievement_id INT PRIMARY KEY AUTO_INCREMENT, -- ID thành tích
    name VARCHAR(100) NOT NULL,                  -- Tên thành tích
    description TEXT,                             -- Mô tả thành tích
    icon_url VARCHAR(255),                        -- Biểu tượng thành tích
    criteria JSON NOT NULL                        -- Tiêu chí đạt được (dạng JSON)
) COMMENT 'Bảng các thành tích trong hệ thống';
CREATE TABLE UserAchievements (
    user_id INT NOT NULL,                         -- ID người dùng
    achievement_id INT NOT NULL,                  -- ID thành tích
    earned_at DATETIME DEFAULT CURRENT_TIMESTAMP, -- Ngày đạt được
    PRIMARY KEY (user_id, achievement_id),        -- Khóa chính kết hợp
    FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (achievement_id) REFERENCES Achievements(achievement_id) ON DELETE CASCADE
) COMMENT 'Bảng thành tích mà người dùng đã đạt được';
CREATE TABLE Admins (
    admin_id INT PRIMARY KEY AUTO_INCREMENT,                               -- ID tự tăng cho mỗi admin
    username VARCHAR(50) UNIQUE NOT NULL,                                  -- Tên đăng nhập duy nhất
    email VARCHAR(100) UNIQUE NOT NULL,                                    -- Email quản trị (duy nhất)
    password_hash VARCHAR(255) NOT NULL,                                   -- Mật khẩu đã mã hóa (bảo mật)
    full_name VARCHAR(100) NOT NULL,                                       -- Họ và tên đầy đủ
    avatar VARCHAR(255),                                                   -- Đường dẫn ảnh đại diện (nếu có)
    role ENUM('super_admin', 'content_manager', 'support') NOT NULL,       -- Vai trò của quản trị viên
    last_login DATETIME,                                                   -- Thời điểm đăng nhập gần nhất
    status ENUM('active', 'inactive') DEFAULT 'active',                    -- Trạng thái hoạt động của tài khoản
    created_by INT,                                                        -- ID của admin đã tạo tài khoản này
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,                         -- Thời điểm tạo tài khoản
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, -- Thời điểm cập nhật cuối cùng

    FOREIGN KEY (created_by) REFERENCES Admins(admin_id)                   -- Ràng buộc: người tạo là admin khác
) COMMENT 'Bảng lưu thông tin quản trị viên của hệ thống';
CREATE TABLE AdminLogs (
    log_id INT PRIMARY KEY AUTO_INCREMENT,                                 -- ID tự tăng cho mỗi log
    admin_id INT NOT NULL,                                                 -- ID admin thực hiện hành động
    action VARCHAR(100) NOT NULL COMMENT 'Ví dụ: create_user, update_course', -- Tên hành động đã thực hiện
    entity_type VARCHAR(50) NOT NULL COMMENT 'users, courses,...',         -- Loại đối tượng bị tác động
    entity_id INT COMMENT 'ID của bản ghi bị ảnh hưởng',                   -- ID của bản ghi (nếu có)
    target_admin_id INT COMMENT 'Nếu hành động tác động tới admin khác',   -- ID của admin bị tác động (nếu có)
    ip_address VARCHAR(45),                                                -- IP người thực hiện
    user_agent TEXT,                                                       -- Trình duyệt hoặc thiết bị thực hiện
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,                         -- Thời gian ghi log

    FOREIGN KEY (admin_id) REFERENCES Admins(admin_id),                    -- Liên kết đến admin thực hiện
    FOREIGN KEY (target_admin_id) REFERENCES Admins(admin_id)              -- Liên kết đến admin bị tác động
) COMMENT 'Ghi lại toàn bộ hành động của quản trị viên trong hệ thống';
CREATE TABLE SystemSettings (
    setting_id INT PRIMARY KEY AUTO_INCREMENT,                             -- ID tự tăng cho mỗi cấu hình
    key_name VARCHAR(100) UNIQUE NOT NULL COMMENT 'Ví dụ: site_title, maintenance_mode', -- Tên khóa cấu hình
    key_value TEXT NOT NULL,                                               -- Giá trị của cấu hình
    key_type ENUM('string', 'number', 'boolean', 'json') DEFAULT 'string', -- Kiểu dữ liệu lưu (chuỗi, số, true/false, JSON)
    description TEXT,                                                      -- Mô tả thêm về cấu hình
    updated_by INT,                                                        -- ID của admin đã chỉnh sửa
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, -- Thời điểm cập nhật cấu hình

    FOREIGN KEY (updated_by) REFERENCES Admins(admin_id)                   -- Ràng buộc: người sửa là admin
) COMMENT 'Bảng lưu các thiết lập cấu hình hệ thống như tiêu đề web, chế độ bảo trì,...';
CREATE TABLE AdminPermissionsHistory (
    id INT PRIMARY KEY AUTO_INCREMENT,                                     -- ID tự tăng
    admin_id INT NOT NULL,                                                 -- ID của admin bị thay đổi quyền
    changed_by INT NOT NULL,                                               -- ID của admin thực hiện thay đổi
    old_role ENUM('super_admin', 'content_manager', 'support'),           -- Vai trò cũ của admin
    new_role ENUM('super_admin', 'content_manager', 'support'),           -- Vai trò mới sau khi thay đổi
    changed_at DATETIME DEFAULT CURRENT_TIMESTAMP,                         -- Thời gian thay đổi

    FOREIGN KEY (admin_id) REFERENCES Admins(admin_id),                    -- Admin bị thay đổi quyền
    FOREIGN KEY (changed_by) REFERENCES Admins(admin_id)                   -- Admin thực hiện thay đổi
) COMMENT 'Ghi lại lịch sử phân quyền giữa các quản trị viên';
CREATE TABLE Feedbacks (
    feedback_id INT PRIMARY KEY AUTO_INCREMENT,                            -- ID tự tăng
    user_id INT,                                                           -- Người dùng gửi phản hồi
    content TEXT NOT NULL,                                                 -- Nội dung góp ý
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,                         -- Thời điểm gửi góp ý
    status ENUM('new', 'reviewed', 'archived') DEFAULT 'new',             -- Trạng thái xử lý góp ý
    handled_by INT,                                                        -- Admin đã xử lý góp ý (nếu có)

    FOREIGN KEY (user_id) REFERENCES Users(user_id),                       -- Người gửi là người dùng
    FOREIGN KEY (handled_by) REFERENCES Admins(admin_id)                   -- Người xử lý là admin
) COMMENT 'Góp ý, phản hồi từ người dùng gửi lên cho hệ thống';
CREATE TABLE chinese_documents (
    document_id INT AUTO_INCREMENT PRIMARY KEY,                      -- ID tài liệu (tự tăng)
    title VARCHAR(255) NOT NULL,                                     -- Tiêu đề tài liệu
    description TEXT,                                                -- Mô tả ngắn về tài liệu
    content_type ENUM('pdf', 'video', 'audio', 'text', 'image') NOT NULL, -- Loại tài liệu
    content_url VARCHAR(255) NOT NULL,                               -- Đường dẫn tới nội dung chính (PDF/Video/Audio...)
    difficulty_level ENUM('beginner', 'intermediate', 'advanced') NOT NULL, -- Mức độ khó
    hsk_level INT,                                                   -- Cấp độ HSK liên quan (nếu có)
    category ENUM('grammar', 'vocabulary', 'reading', 'listening', 'writing') NOT NULL, -- Chủ đề tài liệu
    word_count INT,                                                  -- Số lượng từ (áp dụng cho tài liệu đọc, từ vựng)
    duration INT COMMENT 'Thời lượng (phút) nếu là audio/video',     -- Dành cho video/audio
    thumbnail_url VARCHAR(255),                                      -- Đường dẫn ảnh minh họa (thumbnail)
    is_free TINYINT(1) DEFAULT 0,                                    -- 1 = miễn phí, 0 = cần trả phí
    price DECIMAL(10,2),                                             -- Giá nếu là tài liệu trả phí
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,                   -- Ngày tạo
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, -- Ngày cập nhật 
    INDEX (difficulty_level),                                        -- Tăng tốc tìm kiếm theo mức độ
    INDEX (hsk_level),                                               -- Tăng tốc tìm kiếm theo HSK
    INDEX (category)                                                 -- Tăng tốc tìm kiếm theo chủ đề
);
CREATE TABLE banners (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL, --Tiêu đề banner
  description TEXT,
  image_url VARCHAR(500) NOT NULL,
    VARCHAR(500),
  display_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
CREATE TABLE settings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    `key` VARCHAR(100) NOT NULL UNIQUE,
    `value` TEXT,
    `note` VARCHAR(255) DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS chat_topics (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE COMMENT 'Tên hiển thị của chủ đề (ví dụ: Ngữ pháp HSK 1)',
    internal_name VARCHAR(255) NOT NULL UNIQUE COMMENT 'Tên nội bộ, dùng trong code (ví dụ: hsk1_grammar)',
    initial_prompt TEXT NOT NULL COMMENT 'Chuỗi hướng dẫn ban đầu cho AI (System Instruction)',
    description TEXT COMMENT 'Mô tả chi tiết về chủ đề', -- Đã bỏ DEFAULT ''
    is_active BOOLEAN DEFAULT TRUE COMMENT 'Cờ bật/tắt chủ đề',
    avatar_url VARCHAR(255) NULL AFTER description; -- ảnh ai
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT 'Thời điểm bản ghi được tạo',
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Thời điểm bản ghi được cập nhật lần cuối'
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE HSKTests
  ADD COLUMN randomize_questions TINYINT(1) NOT NULL DEFAULT 0;

ALTER TABLE HSKQuestions
  ADD COLUMN points INT NOT NULL DEFAULT 1,
  ADD COLUMN order_in_test INT NOT NULL DEFAULT 0,
  ADD INDEX ix_hskq_test_order (test_id, order_in_test);

ALTER TABLE HSKResults
  ADD COLUMN status ENUM('in_progress','submitted','graded') NOT NULL DEFAULT 'in_progress',
  ADD COLUMN started_at DATETIME NULL,
  ADD COLUMN ended_at DATETIME NULL,
  ADD COLUMN total_questions INT NULL,
  ADD COLUMN time_limit INT NULL;

ALTER TABLE HSKUserAnswers
  ADD COLUMN created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD UNIQUE KEY uq_result_question (result_id, question_id),
  ADD INDEX ix_result_id (result_id),
  ADD INDEX ix_question_id (question_id);
  CREATE TABLE Games (
    game_id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    game_type ENUM('vocabulary', 'grammar', 'listening', 'writing', 'pronunciation') NOT NULL,
    difficulty_level ENUM('beginner', 'intermediate', 'advanced'),
    thumbnail_url VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
) COMMENT 'Danh sách các game trong hệ thống';
CREATE TABLE GameSessions (
    session_id INT PRIMARY KEY AUTO_INCREMENT,
    game_id INT NOT NULL,
    user_id INT NOT NULL,
    start_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    end_time DATETIME,
    score INT,
    duration_seconds INT,
    FOREIGN KEY (game_id) REFERENCES Games(game_id),
    FOREIGN KEY (user_id) REFERENCES Users(user_id)
) COMMENT 'Lưu lịch sử các lượt chơi game';
CREATE TABLE GameLeaderboard (
    entry_id INT PRIMARY KEY AUTO_INCREMENT,
    game_id INT NOT NULL,
    user_id INT NOT NULL,
    score INT NOT NULL,
    date_achieved DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (game_id) REFERENCES Games(game_id),
    FOREIGN KEY (user_id) REFERENCES Users(user_id),
    INDEX (game_id, score) -- Index để tối ưu truy vấn xếp hạng
) COMMENT 'Bảng xếp hạng các game';
CREATE TABLE GameRewards (
    reward_id INT PRIMARY KEY AUTO_INCREMENT,
    game_id INT NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    reward_type ENUM('xp', 'badge', 'coin', 'item') NOT NULL,
    reward_value INT,
    icon_url VARCHAR(255),
    FOREIGN KEY (game_id) REFERENCES Games(game_id)
) COMMENT 'Phần thưởng có thể nhận được từ game';
CREATE TABLE UserGameProgress (
    progress_id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    game_id INT NOT NULL,
    level INT DEFAULT 1,
    current_xp INT DEFAULT 0,
    unlocked_rewards JSON, -- Danh sách reward_id đã mở khóa
    last_played DATETIME,
    FOREIGN KEY (user_id) REFERENCES Users(user_id),
    FOREIGN KEY (game_id) REFERENCES Games(game_id),
    UNIQUE (user_id, game_id)
) COMMENT 'Tiến trình game của từng người dùng';
CREATE TABLE GameVocabulary (
    game_id INT NOT NULL,
    word_id INT NOT NULL,
    PRIMARY KEY (game_id, word_id),
    FOREIGN KEY (game_id) REFERENCES Games(game_id),
    FOREIGN KEY (word_id) REFERENCES Vocabulary(word_id)
) COMMENT 'Từ vựng sử dụng trong các game';
CREATE TABLE GameGrammar (
    game_id INT NOT NULL,
    grammar_id INT NOT NULL,
    PRIMARY KEY (game_id, grammar_id),
    FOREIGN KEY (game_id) REFERENCES Games(game_id),
    FOREIGN KEY (grammar_id) REFERENCES Grammar(grammar_id)
) COMMENT 'Ngữ pháp sử dụng trong các game';
CREATE TABLE GameImages (
    image_id INT PRIMARY KEY AUTO_INCREMENT,
    word_id INT NOT NULL,
    image_url VARCHAR(255) NOT NULL,
    is_correct_answer BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (word_id) REFERENCES Vocabulary(word_id)
) COMMENT 'Ảnh minh họa từ vựng cho game';
ALTER TABLE Games 
MODIFY COLUMN game_type ENUM(
    'vocabulary', 
    'grammar', 
    'listening', 
    'writing', 
    'pronunciation',
    'image_quiz'  -- Game nhìn ảnh đoán từ
) NOT NULL;
ALTER TABLE GameVocabulary
ADD COLUMN use_images BOOLEAN DEFAULT FALSE COMMENT 'TRUE nếu game dùng ảnh thay vì chữ';