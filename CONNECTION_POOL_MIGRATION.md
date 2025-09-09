# Chuyển đổi từ Single Connection sang Connection Pool

## Tổng quan
Dự án đã được chuyển đổi từ việc sử dụng single MySQL connection sang connection pool để cải thiện hiệu suất và khả năng xử lý đồng thời.

## Những thay đổi đã thực hiện

### 1. File `connect-mysql.js`
- **Trước**: Sử dụng `mysql.createConnection()` để tạo single connection
- **Sau**: Sử dụng `mysql2/promise` để tạo connection pool với cấu hình tối giản:
  - `connectionLimit: 10` - Số lượng connection tối đa trong pool
  - `queueLimit: 0` - Không giới hạn số lượng request chờ
  - `waitForConnections: true` - Chờ connection có sẵn

**Lưu ý quan trọng**: Sử dụng `mysql2/promise` thay vì `mysql2` thông thường để có promise API sẵn sàng

### 2. Tất cả các Model trong `app/models/`
Các model sau đã được cập nhật:
- `admin.js`
- `baihoc.js`
- `baitap.js`
- `banner.js`
- `chatHistoryModel.js`
- `flashcard.js`
- `game.js`
- `grammar.js`
- `hsk.js`
- `hsk-results.js`
- `khoahoc.js`
- `pronunciationPractice.js`
- `setting.js`
- `settingchatai.js`
- `tailieu.js`
- `user.js`
- `vocabulary.js`

#### Thay đổi trong mỗi model:
- **Trước**: 
  ```javascript
  const db = require("../../connect-mysql");
  const util = require("util");
  const query = util.promisify(db.query).bind(db);
  ```
- **Sau (phiên bản đầu)**: 
  ```javascript
  const { query } = require("../../connect-mysql");
  ```
- **Sau (phiên bản tối ưu)**: 
  ```javascript
  const pool = require("../../connect-mysql");
  // Sử dụng: pool.query(sql, params)
  ```

## Lợi ích của Connection Pool

### 1. Hiệu suất cao hơn
- Không cần tạo connection mới cho mỗi request
- Tái sử dụng connection đã có sẵn
- Giảm thời gian chờ kết nối

### 2. Khả năng xử lý đồng thời tốt hơn
- Hỗ trợ nhiều request cùng lúc
- Quản lý connection một cách hiệu quả
- Tránh tình trạng quá tải connection

### 3. Độ tin cậy cao hơn
- Tự động xử lý connection bị lỗi
- Tự động kết nối lại khi cần thiết
- Quản lý timeout và retry

### 4. Tối ưu hóa tài nguyên
- Giới hạn số lượng connection đồng thời
- Giải phóng connection không sử dụng
- Cân bằng tải giữa các connection

## Cách sử dụng

### Import trong model:
```javascript
const pool = require("../../connect-mysql");
```

### Sử dụng trong function:
```javascript
async function getData() {
  try {
    const result = await pool.query("SELECT * FROM table_name");
    return result;
  } catch (error) {
    console.error("Error:", error);
    throw error;
  }
}
```

### Sử dụng execute cho prepared statements:
```javascript
async function insertData(data) {
  try {
    const sql = "INSERT INTO table_name (col1, col2) VALUES (?, ?)";
    const result = await pool.execute(sql, [data.col1, data.col2]);
    return result;
  } catch (error) {
    console.error("Error:", error);
    throw error;
  }
}
```

## Lưu ý quan trọng

1. **Không cần thay đổi logic code**: Tất cả các function async/await vẫn hoạt động bình thường
2. **Tự động quản lý connection**: Pool sẽ tự động quản lý việc mở/đóng connection
3. **Error handling**: Các lỗi kết nối sẽ được xử lý tự động
4. **Performance**: Hiệu suất sẽ được cải thiện đáng kể với nhiều user đồng thời
5. **Cấu hình tối giản**: Sử dụng cấu hình cơ bản để tránh các cảnh báo và lỗi
6. **mysql2/promise**: Sử dụng trực tiếp promise API, không cần `.promise()` hoặc `util.promisify`

## Kiểm tra hoạt động

Để kiểm tra xem connection pool đã hoạt động:
1. Khởi động ứng dụng
2. Kiểm tra console log: "Kết nối thành công tới MySQL (Connection Pool)"
3. Không còn cảnh báo về cấu hình không hợp lệ
4. Thực hiện một số request để test hiệu suất

## Troubleshooting

Nếu gặp vấn đề:
1. Kiểm tra file `.env` có đầy đủ thông tin database
2. Kiểm tra MySQL server có đang chạy không
3. Kiểm tra console log để xem thông báo lỗi
4. Đảm bảo package `mysql2` đã được cài đặt

## Cấu hình hiện tại

Connection pool hiện tại sử dụng cấu hình tối giản và an toàn:
- **connectionLimit**: 10 (số connection tối đa)
- **queueLimit**: 0 (không giới hạn request chờ)
- **waitForConnections**: true (chờ connection có sẵn)

Cấu hình này đảm bảo:
- ✅ Không có cảnh báo về option không hợp lệ
- ✅ Hiệu suất tối ưu cho hầu hết ứng dụng
- ✅ Dễ dàng mở rộng và tùy chỉnh trong tương lai
- ✅ Sử dụng mysql2/promise trực tiếp (không cần .promise())

## So sánh hiệu suất

| Phương pháp | Hiệu suất | Độ phức tạp | Khả năng mở rộng |
|-------------|-----------|--------------|-------------------|
| Single Connection | Thấp | Đơn giản | Hạn chế |
| Connection Pool + util.promisify | Trung bình | Trung bình | Tốt |
| Connection Pool + mysql2 | Tốt | Đơn giản | Tốt |
| **Connection Pool + mysql2/promise** | **Cao nhất** | **Đơn giản nhất** | **Tốt nhất** |

**Kết luận**: Sử dụng `mysql2/promise` với connection pool là phương pháp tối ưu nhất!
