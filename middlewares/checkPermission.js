export const checkPermission = (requiredPermission) => {
  return async (req, res, next) => {
    try {
      const user = req.authData;

      if (!user) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
      }

      const rolePermissions =
        user.role_id?.permissions?.map((permission) => permission.key) || [];

      const userPermissions =
        user.permissions?.map((permission) => permission.key) || [];

      const allPermissions = [...rolePermissions, ...userPermissions];

      if (!allPermissions.includes(requiredPermission)) {
        return res.status(403).json({
          success: false,
          message: "Forbidden: missing permission",
          requiredPermission,
        });
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};