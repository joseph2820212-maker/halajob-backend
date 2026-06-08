export const checkPermission = (requiredPermission) => {
  return async (req, res, next) => {
    try {
      const user = req.authData || req.admin || req.user;

      if (!user) {
        return res.status(401).json({
          status: false,
          message: 'Unauthorized',
        });
      }

      const roleName = String(user.role_id?.name || '').toLowerCase();
      if (roleName === 'admin') return next();

      const normalizePermission = (permission) => {
        if (!permission) return null;
        if (typeof permission === 'string') return permission;
        return permission.key || null;
      };

      const rolePermissions = (user.role_id?.permissions || [])
        .map(normalizePermission)
        .filter(Boolean);

      const userPermissions = (user.permissions || [])
        .map(normalizePermission)
        .filter(Boolean);

      const allPermissions = new Set([...rolePermissions, ...userPermissions]);

      if (!allPermissions.has(requiredPermission) && !allPermissions.has('*')) {
        return res.status(403).json({
          status: false,
          message: 'Forbidden: missing permission',
          requiredPermission,
        });
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};
