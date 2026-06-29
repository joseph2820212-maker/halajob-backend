import logger from "../config/logger.js";
import { runDueSavedSearchAlerts } from "../services/jobAlerts/savedSearch.service.js";

export async function sendSavedSearchJobAlerts() {
  const result = await runDueSavedSearchAlerts({
    limit: Math.min(100, Math.max(1, Number.parseInt(process.env.SAVED_SEARCH_ALERTS_LIMIT, 10) || 20)),
  });
  logger.info("[saved-search-alerts] run complete", result);
  return result;
}

export default sendSavedSearchJobAlerts;
