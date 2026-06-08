import { buildDashboardTarget } from './dashboardRoutes.js';

// Backward compatibility for old calls: screen('applications.status') returns a stable route key.
// New code should use buildDashboardTarget/notifyUser to get full URL + route metadata.
export default function screen(key = 'dashboard', audience = 'employee', params = {}) {
  return buildDashboardTarget(audience, key, params).route_key;
}
