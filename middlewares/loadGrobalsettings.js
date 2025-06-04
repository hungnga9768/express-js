const themeadmin= require("../app/models/setting")
async function loadGlobalSettings(req, res, next) {
  try {
    const logoSettingsArray = await themeadmin.getcontent('logo');
    const titlewebadmin = await themeadmin.getcontent('site_name');
      res.locals.logo = logoSettingsArray.value; 
      res.locals.nameWeb= titlewebadmin.value; 
  } catch (error) {
    console.error("Lỗi khi lấy logo:", error);
    res.locals.logo = '/path/to/default-logo.png';
  }
  next();
}
module.exports = loadGlobalSettings;