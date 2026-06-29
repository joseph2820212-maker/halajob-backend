import ReturnAppData from "../helper/ReturnAppData/index.js";
import { isFeatureEnabled } from "../services/settings/platformSettings.service.js";

// Server-side feature gate. Returns 404 when a platform feature flag is off, so a
// disabled feature (e.g. AI tools for the Syria-first launch) is genuinely
// unreachable from the API — not just hidden in the UI. Fails closed: if settings
// can't be loaded it uses the (false) fallback.
export const requireFeature = (featureKey, options = {}) => {
  return async function featureGuard(req, res, next) {
    try {
      const enabled = await isFeatureEnabled(featureKey, options.fallback === true);
      if (!enabled) {
        return ReturnAppData.getError({
          res,
          status: 404,
          message: options.message || "feature_not_available",
        });
      }
      return next();
    } catch (error) {
      return next(error);
    }
  };
};

export default requireFeature;
