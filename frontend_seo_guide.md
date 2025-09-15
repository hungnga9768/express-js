# 🚀 HƯỚNG DẪN FRONTEND SỬ DỤNG API SEO

## 📋 **TỔNG QUAN**

Hệ thống SEO cung cấp 4 API chính để frontend có thể lấy metadata SEO cho website:

1. **GET /api/config** - Cấu hình SEO toàn cục
2. **GET /api/seo/{pageType}** - SEO cho trang chính
3. **GET /api/{contentType}/{id}/seo** - SEO cho nội dung cụ thể
4. **GET /api/sitemap** - Sitemap động

---

## 🔧 **1. API CONFIG - CẤU HÌNH TOÀN CỤC**

### **Mục đích:**
Lấy tất cả cấu hình SEO từ database (site name, title chính, description chính, etc.)

### **Cách sử dụng:**
```javascript
// Lấy config SEO
async function getSEOConfig() {
  try {
    const response = await fetch('/api/config');
    const result = await response.json();
    
    if (result.success) {
      return result.data;
    } else {
      throw new Error(result.message);
    }
  } catch (error) {
    console.error('Error fetching SEO config:', error);
    return null;
  }
}

// Sử dụng
const config = await getSEOConfig();
if (config) {
  const siteName = config.find(item => item.key === 'site_name')?.value;
  const seoTitle = config.find(item => item.key === 'seo_title')?.value;
  const seoDescription = config.find(item => item.key === 'seo_description')?.value;
  
  // Set cho trang chủ
  document.title = seoTitle || siteName;
  document.querySelector('meta[name="description"]').content = seoDescription;
}
```

### **Response mẫu:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "key": "site_name",
      "value": "Làng Hán Ngữ",
      "note": "Tên website"
    },
    {
      "id": 2,
      "key": "seo_title",
      "value": "Học Tiếng Trung Online - Làng Hán Ngữ | HSK 1-9",
      "note": "Title SEO chính"
    }
  ]
}
```

---

## 🔧 **2. API PAGE SEO - SEO CHO TRANG CHÍNH**

### **Mục đích:**
Lấy SEO data cho các trang chính (vocabulary, courses, hsk-tests, games)

### **Cách sử dụng:**
```javascript
// Lấy SEO cho trang từ vựng
async function getPageSEO(pageType) {
  try {
    const response = await fetch(`/api/seo/${pageType}`);
    const result = await response.json();
    
    if (result.success) {
      return result.data;
    } else {
      throw new Error(result.message);
    }
  } catch (error) {
    console.error(`Error fetching ${pageType} SEO:`, error);
    return null;
  }
}

// Sử dụng cho trang từ vựng
const vocabularySEO = await getPageSEO('vocabulary');
if (vocabularySEO) {
  // Set meta tags
  document.title = vocabularySEO.title;
  document.querySelector('meta[name="description"]').content = vocabularySEO.description;
  document.querySelector('meta[name="keywords"]').content = vocabularySEO.keywords;
  
  // Set Open Graph
  document.querySelector('meta[property="og:title"]').content = vocabularySEO.title;
  document.querySelector('meta[property="og:description"]').content = vocabularySEO.description;
  document.querySelector('meta[property="og:image"]').content = vocabularySEO.image;
  
  // Set structured data
  const script = document.createElement('script');
  script.type = 'application/ld+json';
  script.textContent = JSON.stringify(vocabularySEO.structured_data);
  document.head.appendChild(script);
}
```

### **Các pageType hỗ trợ:**
- `vocabulary` - Trang từ vựng
- `courses` - Trang khóa học
- `hsk-tests` - Trang đề thi HSK
- `games` - Trang game

### **Response mẫu:**
```json
{
  "success": true,
  "data": {
    "title": "Từ vựng tiếng Trung HSK 1-9 - Làng Hán Ngữ",
    "description": "Học từ vựng tiếng Trung theo cấp độ HSK từ 1 đến 9",
    "keywords": "từ vựng tiếng trung, HSK, học từ vựng",
    "image": "https://yourdomain.com/images/vocabulary-og.jpg",
    "structured_data": {
      "@type": "EducationalOrganization",
      "name": "Làng Hán Ngữ"
    }
  }
}
```

---

## 🔧 **3. API CONTENT SEO - SEO CHO NỘI DUNG CỤ THỂ**

### **Mục đích:**
Lấy SEO data cho từng nội dung cụ thể (từ vựng, khóa học, đề thi, game cụ thể)

### **Cách sử dụng:**
```javascript
// Lấy SEO cho nội dung cụ thể
async function getContentSEO(contentType, id) {
  try {
    const response = await fetch(`/api/${contentType}/${id}/seo`);
    const result = await response.json();
    
    if (result.success) {
      return result.data;
    } else {
      throw new Error(result.message);
    }
  } catch (error) {
    console.error(`Error fetching ${contentType} ${id} SEO:`, error);
    return null;
  }
}

// Sử dụng cho từ vựng cụ thể
const vocabularyId = 123;
const vocabularySEO = await getContentSEO('vocabulary', vocabularyId);
if (vocabularySEO) {
  // Set meta tags
  document.title = vocabularySEO.title;
  document.querySelector('meta[name="description"]').content = vocabularySEO.description;
  document.querySelector('meta[name="keywords"]').content = vocabularySEO.keywords;
  
  // Set Open Graph
  document.querySelector('meta[property="og:title"]').content = vocabularySEO.title;
  document.querySelector('meta[property="og:description"]').content = vocabularySEO.description;
  document.querySelector('meta[property="og:image"]').content = vocabularySEO.image;
  document.querySelector('meta[property="og:url"]').content = vocabularySEO.url;
  
  // Set structured data
  const script = document.createElement('script');
  script.type = 'application/ld+json';
  script.textContent = JSON.stringify(vocabularySEO.structured_data);
  document.head.appendChild(script);
}
```

### **Các contentType hỗ trợ:**
- `vocabulary` - Từ vựng cụ thể
- `course` - Khóa học cụ thể
- `hsk` - Đề thi HSK cụ thể
- `game` - Game cụ thể

### **Response mẫu:**
```json
{
  "success": true,
  "data": {
    "title": "Từ vựng: 你好 (nǐ hǎo) - HSK 1 | Làng Hán Ngữ",
    "description": "Học từ vựng 你好 (nǐ hǎo) - xin chào, thuộc HSK 1",
    "keywords": "你好, nǐ hǎo, HSK 1, từ vựng tiếng trung",
    "image": "https://yourdomain.com/images/vocab-123.jpg",
    "url": "https://yourdomain.com/vocabulary/123",
    "structured_data": {
      "@type": "LearningResource",
      "name": "你好",
      "description": "xin chào",
      "educationalLevel": "HSK 1"
    }
  }
}
```

---

## 🔧 **4. API SITEMAP - SITEMAP ĐỘNG**

### **Mục đích:**
Lấy danh sách URL để tạo sitemap XML

### **Cách sử dụng:**
```javascript
// Lấy sitemap data
async function getSitemap() {
  try {
    const response = await fetch('/api/sitemap');
    const result = await response.json();
    
    if (result.success) {
      return result.data;
    } else {
      throw new Error(result.message);
    }
  } catch (error) {
    console.error('Error fetching sitemap:', error);
    return null;
  }
}

// Tạo sitemap XML
async function generateSitemapXML() {
  const sitemapData = await getSitemap();
  if (!sitemapData) return null;
  
  let sitemap = '<?xml version="1.0" encoding="UTF-8"?>';
  sitemap += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">';
  
  sitemapData.forEach(url => {
    sitemap += '<url>';
    sitemap += `<loc>${url.url}</loc>`;
    sitemap += `<lastmod>${url.lastmod}</lastmod>`;
    sitemap += `<changefreq>${url.changefreq}</changefreq>`;
    sitemap += `<priority>${url.priority}</priority>`;
    sitemap += '</url>';
  });
  
  sitemap += '</urlset>';
  return sitemap;
}

// Sử dụng
const sitemapXML = await generateSitemapXML();
if (sitemapXML) {
  // Có thể lưu vào file hoặc trả về cho crawler
  console.log(sitemapXML);
}
```

### **Response mẫu:**
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
    }
  ]
}
```

---

## 🎯 **VÍ DỤ TÍCH HỢP HOÀN CHỈNH**

### **Trang từ vựng (danh sách):**
```javascript
// Trang /vocabulary
async function setupVocabularyPageSEO() {
  const seoData = await getPageSEO('vocabulary');
  if (seoData) {
    document.title = seoData.title;
    document.querySelector('meta[name="description"]').content = seoData.description;
    document.querySelector('meta[name="keywords"]').content = seoData.keywords;
    document.querySelector('meta[property="og:image"]').content = seoData.image;
  }
}
```

### **Trang từ vựng cụ thể:**
```javascript
// Trang /vocabulary/123
async function setupVocabularyDetailSEO(vocabularyId) {
  const seoData = await getContentSEO('vocabulary', vocabularyId);
  if (seoData) {
    document.title = seoData.title;
    document.querySelector('meta[name="description"]').content = seoData.description;
    document.querySelector('meta[name="keywords"]').content = seoData.keywords;
    document.querySelector('meta[property="og:image"]').content = seoData.image;
    document.querySelector('meta[property="og:url"]').content = seoData.url;
    
    // Thêm structured data
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify(seoData.structured_data);
    document.head.appendChild(script);
  }
}
```

### **Trang khóa học cụ thể:**
```javascript
// Trang /courses/456
async function setupCourseDetailSEO(courseId) {
  const seoData = await getContentSEO('course', courseId);
  if (seoData) {
    document.title = seoData.title;
    document.querySelector('meta[name="description"]').content = seoData.description;
    document.querySelector('meta[name="keywords"]').content = seoData.keywords;
    document.querySelector('meta[property="og:image"]').content = seoData.image;
    document.querySelector('meta[property="og:url"]').content = seoData.url;
    
    // Thêm structured data
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify(seoData.structured_data);
    document.head.appendChild(script);
  }
}
```

---

## 🛠️ **UTILITY FUNCTIONS**

### **Helper function để set meta tags:**
```javascript
// Utility function để set meta tags
function setMetaTags(seoData) {
  if (!seoData) return;
  
  // Set title
  if (seoData.title) {
    document.title = seoData.title;
  }
  
  // Set description
  if (seoData.description) {
    setMetaContent('description', seoData.description);
  }
  
  // Set keywords
  if (seoData.keywords) {
    setMetaContent('keywords', seoData.keywords);
  }
  
  // Set Open Graph
  if (seoData.title) {
    setMetaProperty('og:title', seoData.title);
  }
  if (seoData.description) {
    setMetaProperty('og:description', seoData.description);
  }
  if (seoData.image) {
    setMetaProperty('og:image', seoData.image);
  }
  if (seoData.url) {
    setMetaProperty('og:url', seoData.url);
  }
  
  // Set structured data
  if (seoData.structured_data) {
    setStructuredData(seoData.structured_data);
  }
}

// Helper functions
function setMetaContent(name, content) {
  let meta = document.querySelector(`meta[name="${name}"]`);
  if (!meta) {
    meta = document.createElement('meta');
    meta.name = name;
    document.head.appendChild(meta);
  }
  meta.content = content;
}

function setMetaProperty(property, content) {
  let meta = document.querySelector(`meta[property="${property}"]`);
  if (!meta) {
    meta = document.createElement('meta');
    meta.setAttribute('property', property);
    document.head.appendChild(meta);
  }
  meta.content = content;
}

function setStructuredData(data) {
  // Remove existing structured data
  const existingScript = document.querySelector('script[type="application/ld+json"]');
  if (existingScript) {
    existingScript.remove();
  }
  
  // Add new structured data
  const script = document.createElement('script');
  script.type = 'application/ld+json';
  script.textContent = JSON.stringify(data);
  document.head.appendChild(script);
}
```

---

## 🚀 **CÁCH SỬ DỤNG TRONG CÁC FRAMEWORK**

### **React:**
```jsx
import { useEffect, useState } from 'react';

function VocabularyPage({ vocabularyId }) {
  const [seoData, setSeoData] = useState(null);
  
  useEffect(() => {
    async function loadSEO() {
      if (vocabularyId) {
        const data = await getContentSEO('vocabulary', vocabularyId);
        setSeoData(data);
      } else {
        const data = await getPageSEO('vocabulary');
        setSeoData(data);
      }
    }
    loadSEO();
  }, [vocabularyId]);
  
  useEffect(() => {
    if (seoData) {
      setMetaTags(seoData);
    }
  }, [seoData]);
  
  return (
    <div>
      {/* Your component content */}
    </div>
  );
}
```

### **Vue.js:**
```javascript
export default {
  async mounted() {
    if (this.$route.params.id) {
      const seoData = await getContentSEO('vocabulary', this.$route.params.id);
      if (seoData) {
        setMetaTags(seoData);
      }
    } else {
      const seoData = await getPageSEO('vocabulary');
      if (seoData) {
        setMetaTags(seoData);
      }
    }
  }
}
```

### **Next.js:**
```javascript
export async function getServerSideProps({ params }) {
  const vocabularyId = params.id;
  
  if (vocabularyId) {
    const seoData = await getContentSEO('vocabulary', vocabularyId);
    return { props: { seoData } };
  } else {
    const seoData = await getPageSEO('vocabulary');
    return { props: { seoData } };
  }
}

export default function VocabularyPage({ seoData }) {
  useEffect(() => {
    if (seoData) {
      setMetaTags(seoData);
    }
  }, [seoData]);
  
  return (
    <div>
      {/* Your component content */}
    </div>
  );
}
```

---

## ⚠️ **LƯU Ý QUAN TRỌNG**

1. **Error Handling:** Luôn xử lý lỗi khi gọi API
2. **Loading State:** Hiển thị loading khi đang fetch SEO data
3. **Fallback:** Có SEO data mặc định khi API lỗi
4. **Performance:** Cache SEO data để tránh gọi API nhiều lần
5. **SEO Best Practices:** Đảm bảo meta tags được set đúng cách

---

## 🎉 **KẾT LUẬN**

Với 4 API SEO này, frontend có thể:
- ✅ Tự động set meta tags cho mọi trang
- ✅ Tạo structured data cho Google
- ✅ Tạo sitemap động
- ✅ Tối ưu SEO cho từng nội dung cụ thể

**Hệ thống SEO hoàn chỉnh và dễ sử dụng!** 🚀
