# ✅ API /api/config ĐÃ HOẠT ĐỘNG!

## 🚀 **API Response Mẫu:**

**URL:** `http://localhost:3000/api/config`

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "key": "site_name",
      "value": "Làng Hán Ngữ",
      "note": "Tên website",
      "created_at": "2025-09-13T15:31:02.000Z",
      "updated_at": "2025-09-13T15:31:02.000Z"
    },
    {
      "id": 2,
      "key": "seo_title",
      "value": "Học Tiếng Trung Online - Làng Hán Ngữ | HSK 1-9",
      "note": "Title SEO chính",
      "created_at": "2025-09-13T15:31:02.000Z",
      "updated_at": "2025-09-13T15:31:02.000Z"
    },
    {
      "id": 3,
      "key": "seo_description",
      "value": "Nền tảng học tiếng Trung online hàng đầu Việt Nam với hệ thống HSK từ 1-9, từ vựng, khóa học và game tương tác",
      "note": "Mô tả SEO chính",
      "created_at": "2025-09-13T15:31:02.000Z",
      "updated_at": "2025-09-13T15:31:02.000Z"
    },
    {
      "id": 4,
      "key": "seo_keywords",
      "value": "học tiếng trung, hán ngữ, HSK, từ vựng tiếng trung, khóa học tiếng trung",
      "note": "Keywords SEO chính",
      "created_at": "2025-09-13T15:31:02.000Z",
      "updated_at": "2025-09-13T15:31:02.000Z"
    },
    {
      "id": 5,
      "key": "seo_image",
      "value": "https://yourdomain.com/images/og-image.jpg",
      "note": "Hình ảnh cho social sharing",
      "created_at": "2025-09-13T15:31:02.000Z",
      "updated_at": "2025-09-13T15:31:02.000Z"
    },
    {
      "id": 6,
      "key": "primary_color",
      "value": "#df3332",
      "note": "Màu chính",
      "created_at": "2025-05-25T14:29:33.000Z",
      "updated_at": "2025-09-12T20:58:57.000Z"
    },
    {
      "id": 7,
      "key": "gradient-start",
      "value": "#ff6b6b",
      "note": "Màu nền cho header 1",
      "created_at": "2025-05-25T14:29:33.000Z",
      "updated_at": "2025-09-12T20:57:21.000Z"
    },
    {
      "id": 8,
      "key": "gradient-end",
      "value": "#feca57",
      "note": "Màu nền cho header 2",
      "created_at": "2025-05-25T14:29:33.000Z",
      "updated_at": "2025-09-12T20:57:55.000Z"
    },
    {
      "id": 9,
      "key": "header_color",
      "value": "#ae6161",
      "note": "Màu thanh header (tuỳ chọn)",
      "created_at": "2025-05-25T14:29:33.000Z",
      "updated_at": "2025-05-25T21:09:49.000Z"
    },
    {
      "id": 10,
      "key": "text_color",
      "value": "#111827",
      "note": "Màu chữ chính",
      "created_at": "2025-05-25T14:29:33.000Z",
      "updated_at": "2025-08-16T20:23:52.000Z"
    },
    {
      "id": 11,
      "key": "maintenance_mode",
      "value": "1",
      "note": "Chế độ bảo trì (0 = hoạt động, 1 = bảo trì)",
      "created_at": "2025-05-25T11:52:52.000Z",
      "updated_at": "2025-05-25T14:13:42.000Z"
    },
    {
      "id": 12,
      "key": "logo",
      "value": "https://res.cloudinary.com/dviufwqfi/image/upload/v1234567890/logo.png",
      "note": "Logo chính của website",
      "created_at": "2025-09-13T15:31:02.000Z",
      "updated_at": "2025-09-13T06:10:09.000Z"
    },
    {
      "id": 13,
      "key": "vocabulary_title",
      "value": "Từ vựng tiếng Trung HSK 1-9 - Làng Hán Ngữ",
      "note": "Title trang từ vựng",
      "created_at": "2025-09-13T15:31:02.000Z",
      "updated_at": "2025-09-13T15:31:02.000Z"
    },
    {
      "id": 14,
      "key": "vocabulary_description",
      "value": "Học từ vựng tiếng Trung theo cấp độ HSK từ 1 đến 9 với phát âm và nghĩa",
      "note": "Mô tả trang từ vựng",
      "created_at": "2025-09-13T15:31:02.000Z",
      "updated_at": "2025-09-13T15:31:02.000Z"
    },
    {
      "id": 15,
      "key": "vocabulary_keywords",
      "value": "từ vựng tiếng trung, HSK, học từ vựng, phát âm",
      "note": "Keywords trang từ vựng",
      "created_at": "2025-09-13T15:31:02.000Z",
      "updated_at": "2025-09-13T15:31:02.000Z"
    },
    {
      "id": 16,
      "key": "vocabulary_image",
      "value": "https://yourdomain.com/images/vocabulary-og.jpg",
      "note": "Hình ảnh trang từ vựng",
      "created_at": "2025-09-13T15:31:02.000Z",
      "updated_at": "2025-09-13T15:31:02.000Z"
    },
    {
      "id": 17,
      "key": "courses_title",
      "value": "Khóa học tiếng Trung - Làng Hán Ngữ",
      "note": "Title trang khóa học",
      "created_at": "2025-09-13T15:31:02.000Z",
      "updated_at": "2025-09-13T15:31:02.000Z"
    },
    {
      "id": 18,
      "key": "courses_description",
      "value": "Các khóa học tiếng Trung từ cơ bản đến nâng cao, phù hợp mọi trình độ",
      "note": "Mô tả trang khóa học",
      "created_at": "2025-09-13T15:31:02.000Z",
      "updated_at": "2025-09-13T15:31:02.000Z"
    },
    {
      "id": 19,
      "key": "courses_keywords",
      "value": "khóa học tiếng trung, học tiếng trung online, khóa học HSK",
      "note": "Keywords trang khóa học",
      "created_at": "2025-09-13T15:31:02.000Z",
      "updated_at": "2025-09-13T15:31:02.000Z"
    },
    {
      "id": 20,
      "key": "courses_image",
      "value": "https://yourdomain.com/images/courses-og.jpg",
      "note": "Hình ảnh trang khóa học",
      "created_at": "2025-09-13T15:31:02.000Z",
      "updated_at": "2025-09-13T15:31:02.000Z"
    },
    {
      "id": 21,
      "key": "hsk-tests_title",
      "value": "Đề thi HSK - Luyện thi HSK 1-9",
      "note": "Title trang HSK tests",
      "created_at": "2025-09-13T15:31:02.000Z",
      "updated_at": "2025-09-13T15:31:02.000Z"
    },
    {
      "id": 22,
      "key": "hsk-tests_description",
      "value": "Luyện thi HSK với đề thi thử từ cấp độ 1 đến 9, đánh giá trình độ tiếng Trung",
      "note": "Mô tả trang HSK tests",
      "created_at": "2025-09-13T15:31:02.000Z",
      "updated_at": "2025-09-13T15:31:02.000Z"
    },
    {
      "id": 23,
      "key": "hsk-tests_keywords",
      "value": "đề thi HSK, luyện thi HSK, thi HSK online, HSK 1-9",
      "note": "Keywords trang HSK tests",
      "created_at": "2025-09-13T15:31:02.000Z",
      "updated_at": "2025-09-13T15:31:02.000Z"
    },
    {
      "id": 24,
      "key": "hsk-tests_image",
      "value": "https://yourdomain.com/images/hsk-tests-og.jpg",
      "note": "Hình ảnh trang HSK tests",
      "created_at": "2025-09-13T15:31:02.000Z",
      "updated_at": "2025-09-13T15:31:02.000Z"
    },
    {
      "id": 25,
      "key": "games_title",
      "value": "Game học tiếng Trung - Làng Hán Ngữ",
      "note": "Title trang games",
      "created_at": "2025-09-13T15:31:02.000Z",
      "updated_at": "2025-09-13T15:31:02.000Z"
    },
    {
      "id": 26,
      "key": "games_description",
      "value": "Học tiếng Trung qua game vui nhộn, tăng hứng thú học tập",
      "note": "Mô tả trang games",
      "created_at": "2025-09-13T15:31:02.000Z",
      "updated_at": "2025-09-13T15:31:02.000Z"
    },
    {
      "id": 27,
      "key": "games_keywords",
      "value": "game học tiếng trung, học tiếng trung vui, game HSK",
      "note": "Keywords trang games",
      "created_at": "2025-09-13T15:31:02.000Z",
      "updated_at": "2025-09-13T15:31:02.000Z"
    },
    {
      "id": 28,
      "key": "games_image",
      "value": "https://yourdomain.com/images/games-og.jpg",
      "note": "Hình ảnh trang games",
      "created_at": "2025-09-13T15:31:02.000Z",
      "updated_at": "2025-09-13T15:31:02.000Z"
    },
    {
      "id": 29,
      "key": "home_url",
      "value": "{\"url\": \"https://yourdomain.com/\", \"lastmod\": \"2024-01-01\", \"changefreq\": \"daily\", \"priority\": 1.0}",
      "note": "URL trang chủ",
      "created_at": "2025-09-13T15:31:02.000Z",
      "updated_at": "2025-09-13T15:31:02.000Z"
    },
    {
      "id": 30,
      "key": "vocabulary_url",
      "value": "{\"url\": \"https://yourdomain.com/vocabulary\", \"lastmod\": \"2024-01-01\", \"changefreq\": \"weekly\", \"priority\": 0.9}",
      "note": "URL trang từ vựng",
      "created_at": "2025-09-13T15:31:02.000Z",
      "updated_at": "2025-09-13T15:31:02.000Z"
    },
    {
      "id": 31,
      "key": "courses_url",
      "value": "{\"url\": \"https://yourdomain.com/courses\", \"lastmod\": \"2024-01-01\", \"changefreq\": \"weekly\", \"priority\": 0.9}",
      "note": "URL trang khóa học",
      "created_at": "2025-09-13T15:31:02.000Z",
      "updated_at": "2025-09-13T15:31:02.000Z"
    },
    {
      "id": 32,
      "key": "hsk_tests_url",
      "value": "{\"url\": \"https://yourdomain.com/hsk/tests\", \"lastmod\": \"2024-01-01\", \"changefreq\": \"weekly\", \"priority\": 0.8}",
      "note": "URL trang HSK tests",
      "created_at": "2025-09-13T15:31:02.000Z",
      "updated_at": "2025-09-13T15:31:02.000Z"
    },
    {
      "id": 33,
      "key": "games_url",
      "value": "{\"url\": \"https://yourdomain.com/games\", \"lastmod\": \"2024-01-01\", \"changefreq\": \"weekly\", \"priority\": 0.7}",
      "note": "URL trang games",
      "created_at": "2025-09-13T15:31:02.000Z",
      "updated_at": "2025-09-13T15:31:02.000Z"
    }
  ]
}
```

## 🎯 **CÁC LOẠI SETTINGS BAO GỒM:**

### **1. Site Config:**
- ✅ `site_name` - Tên website
- ✅ `logo` - Logo chính
- ✅ `maintenance_mode` - Chế độ bảo trì

### **2. Color Settings:**
- ✅ `primary_color` - Màu chính
- ✅ `gradient-start` - Màu gradient bắt đầu
- ✅ `gradient-end` - Màu gradient kết thúc
- ✅ `header_color` - Màu header
- ✅ `text_color` - Màu chữ

### **3. Global SEO:**
- ✅ `seo_title` - Title SEO chính
- ✅ `seo_description` - Mô tả SEO chính
- ✅ `seo_keywords` - Keywords SEO chính
- ✅ `seo_image` - Hình ảnh SEO chính

### **4. Page-specific SEO:**
- ✅ `vocabulary_title`, `vocabulary_description`, `vocabulary_keywords`, `vocabulary_image`
- ✅ `courses_title`, `courses_description`, `courses_keywords`, `courses_image`
- ✅ `hsk-tests_title`, `hsk-tests_description`, `hsk-tests_keywords`, `hsk-tests_image`
- ✅ `games_title`, `games_description`, `games_keywords`, `games_image`

### **5. Sitemap URLs:**
- ✅ `home_url` - URL trang chủ (JSON)
- ✅ `vocabulary_url` - URL trang từ vựng (JSON)
- ✅ `courses_url` - URL trang khóa học (JSON)
- ✅ `hsk_tests_url` - URL trang HSK tests (JSON)
- ✅ `games_url` - URL trang games (JSON)

## 🚀 **CÁCH FRONTEND SỬ DỤNG:**

```javascript
// Lấy TẤT CẢ config
const response = await fetch('/api/config');
const { data } = await response.json();

// Tìm config cần thiết
const siteName = data.find(item => item.key === 'site_name')?.value;
const seoTitle = data.find(item => item.key === 'seo_title')?.value;
const primaryColor = data.find(item => item.key === 'primary_color')?.value;
const logo = data.find(item => item.key === 'logo')?.value;

// Sử dụng
document.title = seoTitle || siteName;
document.documentElement.style.setProperty('--primary-color', primaryColor);
document.querySelector('link[rel="icon"]').href = logo;
```

## ✅ **KẾT QUẢ:**

**API `/api/config` giờ trả về TẤT CẢ settings từ database:**
- ✅ **Site config** (tên, logo, maintenance mode)
- ✅ **Color settings** (màu sắc, gradient)
- ✅ **Global SEO** (title, description, keywords, image)
- ✅ **Page-specific SEO** (cho từng trang)
- ✅ **Sitemap URLs** (cho sitemap động)

**Frontend có thể lấy mọi thông tin cần thiết từ 1 API duy nhất!** 🎉
