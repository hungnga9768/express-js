# Backend SEO Implementation Guide

## 📋 Tổng quan

Hướng dẫn này mô tả cách backend cần implement để hỗ trợ SEO cho frontend Vue.js.

## 🎯 API Endpoints cần tạo

### 1. Global SEO Config

**Endpoint**: `GET /api/config`

**Mục đích**: Cung cấp config SEO global cho toàn bộ website

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "key": "site_name",
      "value": "Làng Hán Ngữ"
    },
    {
      "key": "seo_title", 
      "value": "Học Tiếng Trung Online - Làng Hán Ngữ | HSK 1-9"
    },
    {
      "key": "seo_description",
      "value": "Học tiếng Trung online hiệu quả với HSK 1-9, từ vựng, ngữ pháp và giao tiếp"
    },
    {
      "key": "seo_keywords",
      "value": "học tiếng trung, hán ngữ, HSK, từ vựng, ngữ pháp, giao tiếp"
    },
    {
      "key": "seo_image",
      "value": "https://yourdomain.com/images/og-image.jpg"
    },
    {
      "key": "primary_color",
      "value": "#dc8cdb"
    },
    {
      "key": "gradient-start",
      "value": "rgb(103, 167, 97)"
    },
    {
      "key": "gradient-end", 
      "value": "rgb(201, 112, 11)"
    },
    {
      "key": "text_color",
      "value": "#020202"
    }
  ]
}
```

### 2. Page-specific SEO

**Endpoint**: `GET /api/seo/{page_type}`

**Mục đích**: Cung cấp SEO data cho từng loại trang

**Parameters**:
- `page_type`: Loại trang (vocabulary, courses, hsk-tests, games, etc.)

**Response**:
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

### 3. Content-specific SEO

**Endpoint**: `GET /api/{content_type}/{id}/seo`

**Mục đích**: SEO cho từng content cụ thể (vocabulary, course, test, etc.)

**Ví dụ**: `GET /api/vocabulary/123/seo`

**Response**:
```json
{
  "success": true,
  "data": {
    "title": "Từ vựng: 你好 (nǐ hǎo) - HSK 1 | Làng Hán Ngữ",
    "description": "Học từ vựng 你好 (nǐ hǎo) - chào hỏi trong tiếng Trung, thuộc HSK 1. Có phát âm, nghĩa và ví dụ",
    "keywords": "你好, nǐ hǎo, chào hỏi, HSK 1, từ vựng tiếng trung, học tiếng trung",
    "image": "https://yourdomain.com/images/vocab-hello.jpg",
    "url": "https://yourdomain.com/vocabulary/123",
    "structured_data": {
      "@type": "LearningResource",
      "name": "你好 (nǐ hǎo)",
      "description": "Từ vựng chào hỏi cơ bản trong tiếng Trung",
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

### 4. Dynamic Sitemap

**Endpoint**: `GET /api/sitemap`

**Mục đích**: Cung cấp sitemap động cho search engines

**Response**:
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
      "url": "https://yourdomain.com/vocabulary/123",
      "lastmod": "2024-01-01",
      "changefreq": "monthly", 
      "priority": 0.7
    }
  ]
}
```

## 🗄️ Database Schema

### 1. SEO Config Table

```sql
CREATE TABLE seo_config (
  id INT PRIMARY KEY AUTO_INCREMENT,
  key VARCHAR(100) UNIQUE NOT NULL,
  value TEXT NOT NULL,
  description TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Insert default config
INSERT INTO seo_config (key, value, description) VALUES
('site_name', 'Làng Hán Ngữ', 'Tên website'),
('seo_title', 'Học Tiếng Trung Online - Làng Hán Ngữ | HSK 1-9', 'Title SEO chính'),
('seo_description', 'Học tiếng Trung online hiệu quả với HSK 1-9, từ vựng, ngữ pháp và giao tiếp', 'Mô tả SEO'),
('seo_keywords', 'học tiếng trung, hán ngữ, HSK, từ vựng, ngữ pháp, giao tiếp', 'Keywords SEO'),
('seo_image', 'https://yourdomain.com/images/og-image.jpg', 'Hình ảnh cho social sharing'),
('primary_color', '#dc8cdb', 'Màu chính của website'),
('gradient-start', 'rgb(103, 167, 97)', 'Màu gradient bắt đầu'),
('gradient-end', 'rgb(201, 112, 11)', 'Màu gradient kết thúc'),
('text_color', '#020202', 'Màu chữ chính');
```

### 2. Page SEO Table

```sql
CREATE TABLE page_seo (
  id INT PRIMARY KEY AUTO_INCREMENT,
  page_type VARCHAR(50) NOT NULL,
  page_id INT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  keywords TEXT NOT NULL,
  image_url VARCHAR(500),
  structured_data JSON,
  url VARCHAR(500),
  lastmod DATE,
  changefreq ENUM('always', 'hourly', 'daily', 'weekly', 'monthly', 'yearly', 'never') DEFAULT 'weekly',
  priority DECIMAL(2,1) DEFAULT 0.5,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_page_type (page_type),
  INDEX idx_page_id (page_id)
);

-- Insert default page SEO
INSERT INTO page_seo (page_type, title, description, keywords, priority) VALUES
('vocabulary', 'Từ vựng tiếng Trung HSK 1-9 - Làng Hán Ngữ', 'Học từ vựng tiếng Trung theo cấp độ HSK từ 1 đến 9 với phát âm và nghĩa', 'từ vựng tiếng trung, HSK, học từ vựng, phát âm', 0.9),
('courses', 'Khóa học tiếng Trung - Làng Hán Ngữ', 'Các khóa học tiếng Trung từ cơ bản đến nâng cao, phù hợp mọi trình độ', 'khóa học tiếng trung, học tiếng trung online, khóa học HSK', 0.9),
('hsk-tests', 'Đề thi HSK - Luyện thi HSK 1-9', 'Luyện thi HSK với đề thi thử từ cấp độ 1 đến 9, đánh giá trình độ tiếng Trung', 'đề thi HSK, luyện thi HSK, thi HSK online, HSK 1-9', 0.8),
('games', 'Game học tiếng Trung - Làng Hán Ngữ', 'Học tiếng Trung qua game vui nhộn, tăng hứng thú học tập', 'game học tiếng trung, học tiếng trung vui, game HSK', 0.7);
```

## 🔧 Implementation Examples

### PHP/Laravel

```php
<?php

// ConfigController.php
class ConfigController extends Controller
{
    public function getConfig()
    {
        $configs = DB::table('seo_config')->get();
        
        return response()->json([
            'success' => true,
            'data' => $configs
        ]);
    }
}

// SEOController.php
class SEOController extends Controller
{
    public function getPageSEO($pageType)
    {
        $seo = DB::table('page_seo')
            ->where('page_type', $pageType)
            ->first();
            
        if (!$seo) {
            return response()->json([
                'success' => false,
                'message' => 'Page SEO not found'
            ], 404);
        }
        
        return response()->json([
            'success' => true,
            'data' => $seo
        ]);
    }
    
    public function getContentSEO($contentType, $id)
    {
        // Get content data
        $content = DB::table($contentType . 's')->find($id);
        
        if (!$content) {
            return response()->json([
                'success' => false,
                'message' => 'Content not found'
            ], 404);
        }
        
        // Generate SEO data based on content
        $seoData = $this->generateContentSEO($contentType, $content);
        
        return response()->json([
            'success' => true,
            'data' => $seoData
        ]);
    }
    
    private function generateContentSEO($contentType, $content)
    {
        switch ($contentType) {
            case 'vocabulary':
                return [
                    'title' => "Từ vựng: {$content->simplified_chinese} ({$content->pinyin}) - HSK {$content->hsk_level} | Làng Hán Ngữ",
                    'description' => "Học từ vựng {$content->simplified_chinese} ({$content->pinyin}) - {$content->vietnamese_meaning}, thuộc HSK {$content->hsk_level}",
                    'keywords' => "{$content->simplified_chinese}, {$content->pinyin}, HSK {$content->hsk_level}, từ vựng tiếng trung",
                    'image' => "https://yourdomain.com/images/vocab-{$content->id}.jpg",
                    'url' => "https://yourdomain.com/vocabulary/{$content->id}",
                    'structured_data' => [
                        '@type' => 'LearningResource',
                        'name' => $content->simplified_chinese,
                        'description' => $content->vietnamese_meaning,
                        'educationalLevel' => "HSK {$content->hsk_level}",
                        'learningResourceType' => 'Vocabulary',
                        'inLanguage' => 'zh-CN'
                    ]
                ];
                
            case 'course':
                return [
                    'title' => "Khóa học: {$content->name} - Làng Hán Ngữ",
                    'description' => "Khóa học {$content->name} - {$content->description}",
                    'keywords' => "khóa học {$content->name}, học tiếng trung online, {$content->level}",
                    'image' => "https://yourdomain.com/images/course-{$content->id}.jpg",
                    'url' => "https://yourdomain.com/courses/{$content->id}",
                    'structured_data' => [
                        '@type' => 'Course',
                        'name' => $content->name,
                        'description' => $content->description,
                        'provider' => [
                            '@type' => 'Organization',
                            'name' => 'Làng Hán Ngữ'
                        ]
                    ]
                ];
        }
    }
    
    public function getSitemap()
    {
        $urls = DB::table('page_seo')
            ->select('url', 'lastmod', 'changefreq', 'priority')
            ->whereNotNull('url')
            ->get();
            
        return response()->json([
            'success' => true,
            'data' => $urls
        ]);
    }
}
```

### Node.js/Express

```javascript
// configController.js
const getConfig = async (req, res) => {
  try {
    const configs = await db.query('SELECT * FROM seo_config');
    
    res.json({
      success: true,
      data: configs.rows
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching config'
    });
  }
};

// seoController.js
const getPageSEO = async (req, res) => {
  try {
    const { pageType } = req.params;
    
    const seo = await db.query(
      'SELECT * FROM page_seo WHERE page_type = $1',
      [pageType]
    );
    
    if (seo.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Page SEO not found'
      });
    }
    
    res.json({
      success: true,
      data: seo.rows[0]
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching page SEO'
    });
  }
};

const getContentSEO = async (req, res) => {
  try {
    const { contentType, id } = req.params;
    
    // Get content data
    const content = await db.query(
      `SELECT * FROM ${contentType}s WHERE id = $1`,
      [id]
    );
    
    if (content.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Content not found'
      });
    }
    
    // Generate SEO data
    const seoData = generateContentSEO(contentType, content.rows[0]);
    
    res.json({
      success: true,
      data: seoData
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching content SEO'
    });
  }
};

const generateContentSEO = (contentType, content) => {
  switch (contentType) {
    case 'vocabulary':
      return {
        title: `Từ vựng: ${content.simplified_chinese} (${content.pinyin}) - HSK ${content.hsk_level} | Làng Hán Ngữ`,
        description: `Học từ vựng ${content.simplified_chinese} (${content.pinyin}) - ${content.vietnamese_meaning}, thuộc HSK ${content.hsk_level}`,
        keywords: `${content.simplified_chinese}, ${content.pinyin}, HSK ${content.hsk_level}, từ vựng tiếng trung`,
        image: `https://yourdomain.com/images/vocab-${content.id}.jpg`,
        url: `https://yourdomain.com/vocabulary/${content.id}`,
        structured_data: {
          '@type': 'LearningResource',
          name: content.simplified_chinese,
          description: content.vietnamese_meaning,
          educationalLevel: `HSK ${content.hsk_level}`,
          learningResourceType: 'Vocabulary',
          inLanguage: 'zh-CN'
        }
      };
  }
};
```

## 🛣️ Routes

### PHP/Laravel

```php
// routes/api.php
Route::get('/config', [ConfigController::class, 'getConfig']);
Route::get('/seo/{pageType}', [SEOController::class, 'getPageSEO']);
Route::get('/{contentType}/{id}/seo', [SEOController::class, 'getContentSEO']);
Route::get('/sitemap', [SEOController::class, 'getSitemap']);
```

### Node.js/Express

```javascript
// routes/api.js
router.get('/config', getConfig);
router.get('/seo/:pageType', getPageSEO);
router.get('/:contentType/:id/seo', getContentSEO);
router.get('/sitemap', getSitemap);
```

## 📝 Structured Data Examples

### Vocabulary
```json
{
  "@type": "LearningResource",
  "name": "你好",
  "description": "Chào hỏi cơ bản",
  "educationalLevel": "HSK 1",
  "learningResourceType": "Vocabulary",
  "inLanguage": "zh-CN",
  "provider": {
    "@type": "Organization",
    "name": "Làng Hán Ngữ"
  }
}
```

### Course
```json
{
  "@type": "Course",
  "name": "Khóa học HSK 1",
  "description": "Khóa học tiếng Trung cơ bản HSK 1",
  "provider": {
    "@type": "Organization",
    "name": "Làng Hán Ngữ"
  },
  "courseMode": "online",
  "educationalLevel": "Beginner"
}
```

### Test
```json
{
  "@type": "Assessment",
  "name": "Đề thi HSK 1",
  "description": "Đề thi thử HSK 1",
  "assesses": "Trình độ tiếng Trung HSK 1",
  "provider": {
    "@type": "Organization",
    "name": "Làng Hán Ngữ"
  }
}
```

## 🚀 Testing

### Test API endpoints:

```bash
# Test config endpoint
curl -X GET "https://yourdomain.com/api/config"

# Test page SEO
curl -X GET "https://yourdomain.com/api/seo/vocabulary"

# Test content SEO
curl -X GET "https://yourdomain.com/api/vocabulary/123/seo"

# Test sitemap
curl -X GET "https://yourdomain.com/api/sitemap"
```

## 📋 Checklist

- [ ] Tạo database tables (seo_config, page_seo)
- [ ] Implement API endpoints
- [ ] Insert default SEO data
- [ ] Test all endpoints
- [ ] Generate structured data cho từng content type
- [ ] Setup sitemap generation
- [ ] Test với frontend

## 🔗 Frontend Integration

Frontend sẽ sử dụng các API này để:

1. Load global SEO config khi app khởi động
2. Load page-specific SEO khi chuyển trang
3. Load content-specific SEO khi xem chi tiết
4. Generate sitemap.xml từ API
5. Apply structured data cho search engines

## 📞 Support

Nếu có vấn đề gì, hãy liên hệ team frontend để được hỗ trợ!
