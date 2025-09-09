const themeadmin = require("../app/models/setting")

async function loadGlobalSettings(req, res, next) {
  try {
    const logoSettingsArray = await themeadmin.getcontent('logo');
    const titlewebadmin = await themeadmin.getcontent('site_name');
    
    // Xử lý logo
    if (logoSettingsArray && logoSettingsArray.value) {
      res.locals.logo = logoSettingsArray.value;
    } else {
      res.locals.logo = '/dist/img/AdminLTELogo.png';
    }
    
    // Xử lý tên website
    if (titlewebadmin && titlewebadmin.value) {
      res.locals.nameWeb = titlewebadmin.value;
    } else {
      res.locals.nameWeb = 'Làng Hán Ngữ';
    }
    
    console.log('Logo loaded:', res.locals.logo);
    console.log('Website name loaded:', res.locals.nameWeb);
    
  } catch (error) {
    console.error("Lỗi khi lấy logo:", error);
    res.locals.logo = '/dist/img/AdminLTELogo.png';
    res.locals.nameWeb = 'Làng Hán Ngữ';
  }
  next();
}

module.exports = loadGlobalSettings;