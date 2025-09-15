const Banner = require("../../models/banner");
const Settings = require("../../models/setting");
const Vocabulary = require("../../models/vocabulary");
const Khoahoc = require("../../models/khoahoc");
const HSK = require("../../models/hsk");
const Game = require("../../models/game");
const fs = require("fs");
const { listItems } = require("../../utils/listItemsAPI");
const pool = require("../../../connect-mysql");
const cloudinaryHelper = require("../../utils/cloudinaryHelper");

// Cache for SEO data
const seoCache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Cache invalidation function
function invalidateCache(pattern = null) {
  if (pattern) {
    for (const key of seoCache.keys()) {
      if (key.includes(pattern)) {
        seoCache.delete(key);
      }
    }
  } else {
    seoCache.clear();
  }
}

// Clean expired cache entries
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of seoCache.entries()) {
    if (now - value.timestamp > CACHE_TTL) {
      seoCache.delete(key);
    }
  }
}, CACHE_TTL);

module.exports = {
  // Cache management
  invalidateCache,
  
  async index(req, res) {
    await listItems(Banner, req, res);
  },
  
  // API /api/config - Trả về TẤT CẢ config từ database (có cache)
  async getConfig(req, res) {
    try {
      const cacheKey = 'global_config';
      const cached = seoCache.get(cacheKey);
      
      if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        return res.json({
          success: true,
          data: cached.data
        });
      }
      
      // Lấy TẤT CẢ settings không phân trang
      const [configs] = await pool.query("SELECT * FROM settings ORDER BY id ASC");
      
      // Convert public_id thành URL cho các trường image
      const processedConfigs = configs.map(config => {
        const imageKeys = ['logo', 'favicon', 'seo_image', 'vocabulary_image', 'courses_image', 'hsk-tests_image', 'games_image'];
        if (imageKeys.includes(config.key) && config.value && !config.value.startsWith('http')) {
          return {
            ...config,
            value: cloudinaryHelper.getImageUrl(config.value)
          };
        }
        return config;
      });
      
      // Cache the result
      seoCache.set(cacheKey, {
        data: processedConfigs,
        timestamp: Date.now()
      });
      
      res.json({
        success: true,
        data: processedConfigs
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error fetching config',
        error: error.message
      });
    }
  },

  // API /api/seo/{pageType} - SEO cho từng loại trang (tối ưu với cache)
  async getPageSEO(req, res) {
    try {
      const { pageType } = req.params;
      const cacheKey = `page_seo_${pageType}`;
      const cached = seoCache.get(cacheKey);
      
      if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        return res.json({
          success: true,
          data: cached.data
        });
      }
      
      // Tối ưu: Lấy tất cả SEO keys trong 1 query thay vì N queries
      const seoKeys = [
        `${pageType}_title`,
        `${pageType}_description`, 
        `${pageType}_keywords`,
        `${pageType}_image`
      ];
      
      const placeholders = seoKeys.map(() => '?').join(',');
      const [settings] = await pool.query(
        `SELECT \`key\`, value FROM settings WHERE \`key\` IN (${placeholders})`,
        seoKeys
      );
      
      const seoData = {};
      settings.forEach(setting => {
        const fieldName = setting.key.replace(`${pageType}_`, '');
        // Convert public_id thành URL nếu là image field
        if (fieldName === 'image' && setting.value && !setting.value.startsWith('http')) {
          seoData[fieldName] = cloudinaryHelper.getImageUrl(setting.value);
        } else {
          seoData[fieldName] = setting.value;
        }
      });
      
      if (Object.keys(seoData).length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Page SEO not found'
        });
      }
      
      // Thêm structured_data
      seoData.structured_data = getDefaultStructuredData();
      
      // Cache the result
      seoCache.set(cacheKey, {
        data: seoData,
        timestamp: Date.now()
      });
      
      res.json({
        success: true,
        data: seoData
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error fetching page SEO',
        error: error.message
      });
    }
  },

  // API /api/{contentType}/{id}/seo - SEO cho từng content cụ thể (tối ưu với cache)
  async getContentSEO(req, res) {
    try {
      const { contentType, id } = req.params;
      const cacheKey = `content_seo_${contentType}_${id}`;
      const cached = seoCache.get(cacheKey);
      
      if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        return res.json({
          success: true,
          data: cached.data
        });
      }
      
      // Validate content type
      const validTypes = ['vocabulary', 'course', 'hsk', 'game'];
      if (!validTypes.includes(contentType)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid content type'
        });
      }
      
      // Get content data based on content type
      const content = await getContentById(contentType, id);
      
      if (!content) {
        return res.status(404).json({
          success: false,
          message: 'Content not found'
        });
      }
      
      // Generate SEO data based on content
      const seoData = generateContentSEO(contentType, content);
      
      // Cache the result
      seoCache.set(cacheKey, {
        data: seoData,
        timestamp: Date.now()
      });
      
      res.json({
        success: true,
        data: seoData
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error fetching content SEO',
        error: error.message
      });
    }
  },

  // API /api/sitemap - Dynamic sitemap (tối ưu với cache)
  async getSitemap(req, res) {
    try {
      const cacheKey = 'sitemap_data';
      const cached = seoCache.get(cacheKey);
      
      if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        return res.json({
          success: true,
          data: cached.data
        });
      }
      
      // Tối ưu: Lấy tất cả URLs trong 1 query
      const sitemapKeys = [
        'home_url',
        'vocabulary_url', 
        'courses_url',
        'hsk_tests_url',
        'games_url'
      ];
      
      const placeholders = sitemapKeys.map(() => '?').join(',');
      const [settings] = await pool.query(
        `SELECT \`key\`, value FROM settings WHERE \`key\` IN (${placeholders})`,
        sitemapKeys
      );
      
      const urls = settings.map(setting => {
        try {
          const urlData = JSON.parse(setting.value || '{}');
          return {
            url: urlData.url || '',
            lastmod: urlData.lastmod || new Date().toISOString().split('T')[0],
            changefreq: urlData.changefreq || 'weekly',
            priority: urlData.priority || 0.5
          };
        } catch (error) {
          return {
            url: '',
            lastmod: new Date().toISOString().split('T')[0],
            changefreq: 'weekly',
            priority: 0.5
          };
        }
      }).filter(url => url.url); // Filter out empty URLs
      
      // Cache the result
      seoCache.set(cacheKey, {
        data: urls,
        timestamp: Date.now()
      });
      
      res.json({
        success: true,
        data: urls
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error fetching sitemap',
        error: error.message
      });
    }
  }
};

// ==================== HELPER FUNCTIONS ====================

// Get content by ID based on type
async function getContentById(contentType, id) {
  switch (contentType) {
    case 'vocabulary':
      return await Vocabulary.getById(id);
    case 'course':
      return await Khoahoc.getById(id);
    case 'hsk':
      return await HSK.getTestById(id);
    case 'game':
      return await Game.getGameById(id);
    default:
      return null;
  }
}

// Get default structured data
function getDefaultStructuredData() {
  return {
    "@type": "EducationalOrganization",
    "name": "Làng Hán Ngữ",
    "description": "Nền tảng học tiếng Trung online",
    "url": process.env.BASE_URL || "https://yourdomain.com",
    "logo": `${process.env.BASE_URL || "https://yourdomain.com"}/images/logo.png`
  };
}

// Get page-specific SEO image
function getPageSeoImage(type) {
  const baseUrl = process.env.BASE_URL || 'https://yourdomain.com';
  switch (type) {
    case 'vocabulary':
      return `${baseUrl}/images/vocabulary-og.jpg`;
    case 'course':
      return `${baseUrl}/images/courses-og.jpg`;
    case 'hsk':
      return `${baseUrl}/images/hsk-tests-og.jpg`;
    case 'game':
      return `${baseUrl}/images/games-og.jpg`;
    default:
      return `${baseUrl}/images/og-image.jpg`;
  }
}

// Clean text helper
function cleanText(text) {
  if (!text) return '';
  return text.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
}

// Helper function to generate content-specific SEO
function generateContentSEO(contentType, content) {
  const baseUrl = process.env.BASE_URL || 'https://yourdomain.com';
  
  switch (contentType) {
    case 'vocabulary':
      const vocabName = content.simplified_chinese || 'Từ vựng';
      const vocabPinyin = content.pinyin || '';
      const vocabMeaning = content.vietnamese_meaning || content.english_meaning || 'từ vựng tiếng Trung';
      const vocabLevel = content.hsk_level || '1';
      const vocabId = content.word_id || content.id || 'unknown';
      
      return {
        title: `Từ vựng: ${vocabName}${vocabPinyin ? ` (${vocabPinyin})` : ''} - HSK ${vocabLevel} | Làng Hán Ngữ`,
        description: `Học từ vựng ${vocabName}${vocabPinyin ? ` (${vocabPinyin})` : ''} - ${vocabMeaning}, thuộc HSK ${vocabLevel}. Có phát âm, nghĩa và ví dụ`,
        keywords: `${vocabName}, ${vocabPinyin}, HSK ${vocabLevel}, từ vựng tiếng trung, học tiếng trung`,
        image: getPageSeoImage('vocabulary'),
        url: `${baseUrl}/vocabulary/${vocabId}`,
        structured_data: {
          '@type': 'LearningResource',
          name: vocabName,
          description: vocabMeaning,
          educationalLevel: `HSK ${vocabLevel}`,
          learningResourceType: 'Vocabulary',
          inLanguage: 'zh-CN',
          provider: {
            '@type': 'Organization',
            name: 'Làng Hán Ngữ'
          }
        }
      };
      
    case 'course':
      const courseName = content.title || content.name || 'Khóa học tiếng Trung';
      const courseDesc = cleanText(content.description) || 'Học tiếng Trung hiệu quả';
      const courseLevel = content.difficulty_level || content.level || 'Beginner';
      const courseId = content.course_id || content.id || 'unknown';
      
      return {
        title: `Khóa học: ${courseName} - Làng Hán Ngữ`,
        description: `Khóa học ${courseName} - ${courseDesc}`,
        keywords: `khóa học ${courseName}, học tiếng trung online, ${courseLevel}`,
        image: getPageSeoImage('course'),
        url: `${baseUrl}/courses/${courseId}`,
        structured_data: {
          '@type': 'Course',
          name: courseName,
          description: courseDesc,
          provider: {
            '@type': 'Organization',
            name: 'Làng Hán Ngữ'
          },
          courseMode: 'online',
          educationalLevel: courseLevel
        }
      };
      
    case 'hsk':
      const hskTitle = content.title || `Đề thi HSK ${content.hsk_level || '1'}`;
      const hskDesc = cleanText(content.description) || 'Luyện thi HSK online';
      const hskLevel = content.hsk_level || '1';
      const hskId = content.test_id || content.id || 'unknown';
      
      return {
        title: `${hskTitle} - Làng Hán Ngữ`,
        description: `Đề thi thử ${hskTitle} - ${hskDesc}`,
        keywords: `đề thi HSK ${hskLevel}, luyện thi HSK, thi HSK online`,
        image: getPageSeoImage('hsk'),
        url: `${baseUrl}/hsk/tests/${hskId}`,
        structured_data: {
          '@type': 'Assessment',
          name: hskTitle,
          description: hskDesc,
          assesses: `Trình độ tiếng Trung HSK ${hskLevel}`,
          provider: {
            '@type': 'Organization',
            name: 'Làng Hán Ngữ'
          }
        }
      };
      
    case 'game':
      const gameName = content.name || 'Game học tiếng Trung';
      const gameDesc = cleanText(content.description) || 'Học tiếng Trung qua game vui nhộn';
      const gameId = content.game_id || content.id || 'unknown';
      
      return {
        title: `Game: ${gameName} - Làng Hán Ngữ`,
        description: `Game học tiếng Trung ${gameName} - ${gameDesc}`,
        keywords: `game ${gameName}, game học tiếng trung, học tiếng trung vui`,
        image: getPageSeoImage('game'),
        url: `${baseUrl}/games/${gameId}`,
        structured_data: {
          '@type': 'Game',
          name: gameName,
          description: gameDesc,
          provider: {
            '@type': 'Organization',
            name: 'Làng Hán Ngữ'
          }
        }
      };
      
    default:
      const defaultName = content.name || content.title || 'Content';
      const defaultDesc = cleanText(content.description) || 'Học tiếng Trung online';
      const defaultId = content.id || 'unknown';
      
      return {
        title: `${defaultName} - Làng Hán Ngữ`,
        description: defaultDesc,
        keywords: 'học tiếng trung, hán ngữ, HSK',
        image: getPageSeoImage(contentType),
        url: `${baseUrl}/${contentType}/${defaultId}`,
        structured_data: {
          '@type': 'LearningResource',
          name: defaultName,
          description: defaultDesc,
          provider: {
            '@type': 'Organization',
            name: 'Làng Hán Ngữ'
          }
        }
      };
  }
}
