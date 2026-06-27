const normalizePermission = (permission) => {
  if (!permission) return null;
  if (typeof permission === 'string') return permission.trim().toLowerCase();
  return String(permission.key || '').trim().toLowerCase() || null;
};

const toPermissionList = (permissions) => {
  const list = Array.isArray(permissions) ? permissions : [permissions];
  return list.map(normalizePermission).filter(Boolean);
};

const hasPermission = (user, requiredPermissions) => {
  const required = toPermissionList(requiredPermissions);
  if (!required.length) return true;

  const roleName = String(user.role_id?.name || '').toLowerCase();
  const roleNumber = Number(user.role_id?.role_number);
  if (['admin', 'super_admin', 'super-admin'].includes(roleName) || roleNumber === 1) {
    return true;
  }

  const rolePermissions = (user.role_id?.permissions || [])
    .map(normalizePermission)
    .filter(Boolean);

  const userPermissions = (user.permissions || [])
    .map(normalizePermission)
    .filter(Boolean);

  const allPermissions = new Set([...rolePermissions, ...userPermissions]);
  if (allPermissions.has('*') || allPermissions.has('admin.*')) return true;

  return required.some((permission) => {
    if (allPermissions.has(permission)) return true;
    const [group] = permission.split('.');
    return allPermissions.has(`${group}.*`);
  });
};

const deny = (res, requiredPermission) =>
  res.status(403).json({
    status: false,
    message: 'Forbidden: missing permission',
    requiredPermission,
  });

const normalizeResource = (value = '') => String(value).toLowerCase().replace(/[\s_\-\/]+/g, '');

export const checkPermission = (requiredPermission) => {
  return async function checkPermissionMiddleware(req, res, next) {
    try {
      const user = req.authData || req.admin || req.user;

      if (!user) {
        return res.status(401).json({
          status: false,
          message: 'Unauthorized',
        });
      }

      if (!hasPermission(user, requiredPermission)) {
        return deny(res, Array.isArray(requiredPermission) ? requiredPermission[0] : requiredPermission);
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

export const checkResourcePermission = (action, resourceParam = 'resource') => {
  return async function checkResourcePermissionMiddleware(req, res, next) {
    try {
      const resource = normalizeResource(req.params?.[resourceParam] || '');
      if (!resource) {
        return deny(res, `resources.${action}`);
      }

      const moderationFallbacks = ['approve', 'reject'].includes(action) ? [`${resource}.moderate`] : [];
      return checkPermission([
        `${resource}.${action}`,
        ...moderationFallbacks,
        `${resource}.manage`,
        `resources.${action}`,
        'resources.manage',
      ])(req, res, next);
    } catch (error) {
      next(error);
    }
  };
};

export { hasPermission };
