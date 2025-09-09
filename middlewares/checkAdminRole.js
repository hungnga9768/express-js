/**
 * Middleware kiểm tra phân quyền admin
 * @param {Array} requiredRoles - Mảng các role được phép truy cập
 * @returns {Function} Middleware function
 */
function checkAdminRole(requiredRoles) {
  return (req, res, next) => {
    // Kiểm tra xem user đã đăng nhập chưa
    if (!req.user || !req.user.admin_id) {
      return res.status(401).render('error', {
        title: 'Chưa đăng nhập',
        message: 'Chưa đăng nhập hoặc phiên đăng nhập đã hết hạn',
        error: { status: 401 }
      });
    }

    // Kiểm tra xem user có role không
    if (!req.user.role) {
      return res.status(403).render('error', {
        title: 'Không có quyền',
        message: 'Tài khoản không có quyền truy cập',
        error: { status: 403 }
      });
    }

    // Kiểm tra xem role có trong danh sách được phép không
    if (!requiredRoles.includes(req.user.role)) {
      const roleNames = {
        'super_admin': 'Quản trị viên',
        'content_manager': 'Quản lý nội dung', 
        'support': 'Nhân viên hỗ trợ'
      };
      
      const currentRoleName = roleNames[req.user.role] || req.user.role;
      const requiredRoleNames = requiredRoles.map(role => roleNames[role] || role).join(' hoặc ');
      
      return res.status(403).render('error', {
        title: 'Không có quyền truy cập',
        message: `Bạn không có quyền truy cập chức năng này. Yêu cầu quyền: ${requiredRoleNames}. Quyền hiện tại: ${currentRoleName}`,
        error: { status: 403 }
      });
    }

    // Nếu tất cả đều OK, tiếp tục
    next();
  };
}

/**
 * Middleware kiểm tra quyền super_admin
 */
function requireSuperAdmin(req, res, next) {
  return checkAdminRole(['super_admin'])(req, res, next);
}

/**
 * Middleware kiểm tra quyền content_manager trở lên
 */
function requireContentManager(req, res, next) {
  return checkAdminRole(['super_admin', 'content_manager'])(req, res, next);
}

/**
 * Middleware kiểm tra quyền support trở lên (tất cả admin)
 */
function requireAnyAdmin(req, res, next) {
  return checkAdminRole(['super_admin', 'content_manager', 'support'])(req, res, next);
}

/**
 * Middleware kiểm tra quyền chỉnh sửa admin khác
 * Chỉ super_admin mới được chỉnh sửa admin khác
 */
function requireAdminEditPermission(req, res, next) {
  const targetAdminId = parseInt(req.params.id) || parseInt(req.body.admin_id);
  const currentAdminId = req.user.admin_id;

  // Nếu đang chỉnh sửa chính mình, cho phép
  if (targetAdminId === currentAdminId) {
    return next();
  }

  // Nếu chỉnh sửa admin khác, cần quyền super_admin
  return requireSuperAdmin(req, res, next);
}

/**
 * Middleware kiểm tra quyền xóa admin
 * Chỉ super_admin mới được xóa admin khác
 */
function requireAdminDeletePermission(req, res, next) {
  const targetAdminId = parseInt(req.params.id);
  const currentAdminId = req.user.admin_id;

  // Không được xóa chính mình
  if (targetAdminId === currentAdminId) {
    return res.status(403).render('error', {
      title: 'Không thể thực hiện',
      message: 'Không thể xóa tài khoản của chính mình',
      error: { status: 403 }
    });
  }

  // Cần quyền super_admin để xóa admin khác
  return requireSuperAdmin(req, res, next);
}

module.exports = {
  checkAdminRole,
  requireSuperAdmin,
  requireContentManager,
  requireAnyAdmin,
  requireAdminEditPermission,
  requireAdminDeletePermission
};
