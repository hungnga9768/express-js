# 🚀 DEMO CÁC API SEO - RESPONSE EXAMPLES

## 📋 **DANH SÁCH API SEO**

### 1. **GET /api/config** - Global SEO Config
**Mục đích:** Lấy tất cả cấu hình SEO từ database

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
    }
  ]
}
```

---

### 2. **GET /api/seo/{pageType}** - Page-specific SEO
**Mục đích:** Lấy SEO cho từng loại trang (vocabulary, courses, hsk-tests, games)

**Ví dụ: GET /api/seo/vocabulary**
```json
{
  "success": true,
  "data": {
    "title": "Từ vựng tiếng Trung HSK 1-9 - Làng Hán Ngữ",
    "description": "Học từ vựng tiếng Trung theo cấp độ HSK từ 1 đến 9 với phát âm và nghĩa",
    "keywords": "từ vựng tiếng trung, HSK, học từ vựng, phát âm",
    "image": "https://yourdomain.com/images/vocabulary-og.jpg",
    "structured_data": {
      "@type": "EducationalOrganization",
      "name": "Làng Hán Ngữ",
      "description": "Nền tảng học tiếng Trung online",
      "url": "https://yourdomain.com",
      "logo": "https://yourdomain.com/images/logo.png"
    }
  }
}
```

**Ví dụ: GET /api/seo/courses**
```json
{
  "success": true,
  "data": {
    "title": "Khóa học tiếng Trung - Làng Hán Ngữ",
    "description": "Các khóa học tiếng Trung từ cơ bản đến nâng cao, phù hợp mọi trình độ",
    "keywords": "khóa học tiếng trung, học tiếng trung online, khóa học HSK",
    "image": "https://yourdomain.com/images/courses-og.jpg",
    "structured_data": {
      "@type": "EducationalOrganization",
      "name": "Làng Hán Ngữ",
      "description": "Nền tảng học tiếng Trung online",
      "url": "https://yourdomain.com",
      "logo": "https://yourdomain.com/images/logo.png"
    }
  }
}
```

---

### 3. **GET /api/{contentType}/{id}/seo** - Content-specific SEO
**Mục đích:** Tự động tạo SEO cho từng nội dung cụ thể

**Ví dụ: GET /api/vocabulary/123/seo**
```json
{
  "success": true,
  "data": {
    "title": "Từ vựng: 你好 (nǐ hǎo) - HSK 1 | Làng Hán Ngữ",
    "description": "Học từ vựng 你好 (nǐ hǎo) - xin chào, thuộc HSK 1. Có phát âm, nghĩa và ví dụ",
    "keywords": "你好, nǐ hǎo, HSK 1, từ vựng tiếng trung, học tiếng trung",
    "image": "https://yourdomain.com/images/vocab-123.jpg",
    "url": "https://yourdomain.com/vocabulary/123",
    "structured_data": {
      "@type": "LearningResource",
      "name": "你好",
      "description": "xin chào",
      "educationalLevel": "HSK 1",
      "learningResourceType": "Vocabulary",
      "inLanguage": "zh-CN",
      "provider": {
        "@type": "Organization",
        "name": "Làng Hán Ngữ"
      }
    }
  }
}
```

**Ví dụ: GET /api/course/456/seo**
```json
{
  "success": true,
  "data": {
    "title": "Khóa học: HSK 1 Cơ Bản - Làng Hán Ngữ",
    "description": "Khóa học HSK 1 Cơ Bản - Học tiếng Trung từ đầu với giáo viên bản ngữ",
    "keywords": "khóa học HSK 1 Cơ Bản, học tiếng trung online, HSK",
    "image": "https://yourdomain.com/images/course-456.jpg",
    "url": "https://yourdomain.com/courses/456",
    "structured_data": {
      "@type": "Course",
      "name": "HSK 1 Cơ Bản",
      "description": "Học tiếng Trung từ đầu với giáo viên bản ngữ",
      "provider": {
        "@type": "Organization",
        "name": "Làng Hán Ngữ"
      },
      "courseMode": "online",
      "educationalLevel": "Beginner"
    }
  }
}
```

**Ví dụ: GET /api/hsk/789/seo**
```json
{
  "success": true,
  "data": {
    "title": "Đề thi HSK 2 - Làng Hán Ngữ",
    "description": "Đề thi thử HSK 2 - Luyện thi HSK online với đáp án chi tiết",
    "keywords": "đề thi HSK 2, luyện thi HSK, thi HSK online",
    "image": "https://yourdomain.com/images/hsk-789.jpg",
    "url": "https://yourdomain.com/hsk/tests/789",
    "structured_data": {
      "@type": "Assessment",
      "name": "Đề thi HSK 2",
      "description": "Luyện thi HSK online với đáp án chi tiết",
      "assesses": "Trình độ tiếng Trung HSK 2",
      "provider": {
        "@type": "Organization",
        "name": "Làng Hán Ngữ"
      }
    }
  }
}
```

**Ví dụ: GET /api/game/101/seo**
```json
{
  "success": true,
  "data": {
    "title": "Game: Ghép Từ HSK 1 - Làng Hán Ngữ",
    "description": "Game học tiếng Trung Ghép Từ HSK 1 - Học tiếng Trung qua game vui nhộn",
    "keywords": "game Ghép Từ HSK 1, game học tiếng trung, học tiếng trung vui",
    "image": "https://yourdomain.com/images/game-101.jpg",
    "url": "https://yourdomain.com/games/101",
    "structured_data": {
      "@type": "Game",
      "name": "Ghép Từ HSK 1",
      "description": "Học tiếng Trung qua game vui nhộn",
      "provider": {
        "@type": "Organization",
        "name": "Làng Hán Ngữ"
      }
    }
  }
}
```

---

### 4. **GET /api/sitemap** - Dynamic Sitemap
**Mục đích:** Tạo sitemap động từ database

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "url": "https://yourdomain.com/",
      "lastmod": "2024-01-01",
      "changefreq": "daily",
      "priority": 1.0
    },
    {
      "url": "https://yourdomain.com/vocabulary",
      "lastmod": "2024-01-01",
      "changefreq": "weekly",
      "priority": 0.9
    },
    {
      "url": "https://yourdomain.com/courses",
      "lastmod": "2024-01-01",
      "changefreq": "weekly",
      "priority": 0.9
    },
    {
      "url": "https://yourdomain.com/hsk/tests",
      "lastmod": "2024-01-01",
      "changefreq": "weekly",
      "priority": 0.8
    },
    {
      "url": "https://yourdomain.com/games",
      "lastmod": "2024-01-01",
      "changefreq": "weekly",
      "priority": 0.7
    }
  ]
}
```

---

## 🎯 **CÁCH FRONTEND SỬ DỤNG**

### **1. Global SEO (Trang chủ)**
```javascript
// Lấy config SEO cho trang chủ
const response = await fetch('/api/config');
const { data } = await response.json();

// Tìm các key cần thiết
const siteName = data.find(item => item.key === 'site_name')?.value;
const seoTitle = data.find(item => item.key === 'seo_title')?.value;
const seoDescription = data.find(item => item.key === 'seo_description')?.value;
```

### **2. Page-specific SEO**
```javascript
// Lấy SEO cho trang từ vựng
const response = await fetch('/api/seo/vocabulary');
const { data } = await response.json();

// Sử dụng trong <head>
document.title = data.title;
document.querySelector('meta[name="description"]').content = data.description;
document.querySelector('meta[name="keywords"]').content = data.keywords;
document.querySelector('meta[property="og:image"]').content = data.image;
```

### **3. Content-specific SEO**
```javascript
// Lấy SEO cho từ vựng cụ thể
const response = await fetch('/api/vocabulary/123/seo');
const { data } = await response.json();

// Tự động tạo meta tags
document.title = data.title;
document.querySelector('meta[name="description"]').content = data.description;
document.querySelector('meta[name="keywords"]').content = data.keywords;
document.querySelector('meta[property="og:image"]').content = data.image;
document.querySelector('meta[property="og:url"]').content = data.url;

// Thêm structured data
const script = document.createElement('script');
script.type = 'application/ld+json';
script.textContent = JSON.stringify(data.structured_data);
document.head.appendChild(script);
```

### **4. Dynamic Sitemap**
```javascript
// Tạo sitemap XML
const response = await fetch('/api/sitemap');
const { data } = await response.json();

let sitemap = '<?xml version="1.0" encoding="UTF-8"?>';
sitemap += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">';

data.forEach(url => {
  sitemap += '<url>';
  sitemap += `<loc>${url.url}</loc>`;
  sitemap += `<lastmod>${url.lastmod}</lastmod>`;
  sitemap += `<changefreq>${url.changefreq}</changefreq>`;
  sitemap += `<priority>${url.priority}</priority>`;
  sitemap += '</url>';
});

sitemap += '</urlset>';
```

---

## 🔥 **TÍNH NĂNG NỔI BẬT**

✅ **Tự động tạo SEO** cho từng nội dung cụ thể  
✅ **Structured Data** theo chuẩn Schema.org  
✅ **Dynamic Sitemap** từ database  
✅ **Admin interface** thân thiện để quản lý  
✅ **Hỗ trợ đa ngôn ngữ** (tiếng Việt)  
✅ **Tối ưu cho SEO** với meta tags đầy đủ  
✅ **Flexible** - dễ mở rộng thêm content types  

**Hệ thống SEO này sẽ giúp website của bạn có ranking tốt trên Google!** 🚀
