const trimSlash = (value = '') => String(value || '').replace(/^\/+|\/+$/g, '');

export const DASHBOARD_BASE_URLS = {
  employee: process.env.EMPLOYEE_DASHBOARD_URL || 'https://employee.jobzain.com/',
  company: process.env.COMPANY_DASHBOARD_URL || 'https://company.jobzain.com/',
};

export const EMPLOYEE_DASHBOARD_ROUTES = {
  dashboard: '',
  'profile.education': 'profile/education',
  'profile.experience': 'profile/experience',
  'profile.skills': 'profile/skills',
  'profile.languages': 'profile/languages',
  'profile.licenses': 'profile/licenses',
  'profile.testimony': 'profile/testimony',
  'profile.job_names': 'profile/job-names',
  'profile.job_types': 'profile/job-types',
  'profile.min_salary': 'profile/min-salary',
  'profile.work_flags': 'profile/work-flags',
  'profile.work_mode': 'profile/work-mode',
  'profile.countries': 'profile/countries',
  'profile.about_me': 'profile/about-me',
  'profile.latest_work_experience': 'profile/latest-work-experience',
  'profile.work_location': 'profile/work-location',
  'profile.links': 'profile/links',
  'profile.personal_info': 'profile/personal-info',
  'profile.student_status': 'profile/student-status',
  'profile.views': 'profile/views',
  'profile.company_views': 'profile/company-views',
  'profile.blocked_companies': 'profile/blocked-companies',
  'cvs.my': 'cvs/my-cvs',
  'cvs.build': 'cvs/build',
  'cvs.upload': 'cvs/upload',
  'jobs.browse': 'jobs/browse',
  'jobs.saved': 'jobs/saved',
  'jobs.recommended': 'jobs/recommended',
  'jobs.alerts': 'jobs/alerts',
  'applications.applied': 'applications/applied',
  'applications.status': 'applications/status',
  'applications.interviews': 'applications/interviews',
  'applications.offers': 'applications/offers',
  'applications.rejected': 'applications/rejected',
  'campus.dashboard': 'campus',
  'campus.verification': 'campus/verification',
  'campus.events': 'campus/events',
  'campus.resources': 'campus/resources',
  'companies.followers': 'companies/followers',
  'companies.profile_views': 'companies/profile-views',
  'companies.ratings': 'companies/ratings',
  'messages.inbox': 'messages/inbox',
  'messages.companies': 'messages/companies',
  'settings.account': 'settings/account',
  'settings.privacy': 'settings/privacy',
  'settings.notifications': 'settings/notifications',
  'settings.security': 'settings/security',
};

export const COMPANY_DASHBOARD_ROUTES = {
  dashboard: '',
  'profile.personal_info': 'profile/personal-info',
  'profile.company_info': 'profile/company-info',
  'profile.industry': 'profile/industry',
  'profile.company_size': 'profile/company-size',
  'profile.company_type': 'profile/company-type',
  'profile.description': 'profile/description',
  'profile.mission': 'profile/mission',
  'profile.vision': 'profile/vision',
  'profile.culture': 'profile/culture',
  'profile.benefits': 'profile/benefits',
  'profile.specialties': 'profile/specialties',
  'profile.languages': 'profile/languages',
  'profile.contact_information': 'profile/contact-information',
  'profile.social_links': 'profile/social_links',
  'profile.location': 'profile/location',
  'profile.logo': 'profile/logo',
  'profile.cover_image': 'profile/cover-image',
  'jobs.post': 'jobs/post-job',
  'jobs.list': 'jobs/jobs-list',
  'jobs.details': 'jobs/job_details/:id',
  'applications.applied': 'applications/applied',
  'applications.status': 'applications/status',
  'applications.interviews': 'applications/interviews',
  'applications.offers': 'applications/offers',
  'find_employees.find_for_job': 'find-employees/find-for-job',
  'find_employees.system_helper': 'find-employees/system-helper',
  'find_employees.team_help': 'find-employees/ask_hala_job_team_help-for-active-job',
};

const ROUTE_MAP = {
  employee: EMPLOYEE_DASHBOARD_ROUTES,
  company: COMPANY_DASHBOARD_ROUTES,
};

export function resolveRoutePath(audience = 'employee', routeKey = 'dashboard', params = {}) {
  const map = ROUTE_MAP[audience] || ROUTE_MAP.employee;
  const rawPath = map[routeKey] ?? routeKey ?? '';

  return trimSlash(
    String(rawPath).replace(/:([A-Za-z0-9_]+)/g, (_, name) => {
      const value = params[name] ?? params[`${name}Id`] ?? params.id ?? '';
      return encodeURIComponent(String(value || ''));
    })
  );
}

export function buildDashboardUrl(audience = 'employee', routeKey = 'dashboard', params = {}) {
  const base = DASHBOARD_BASE_URLS[audience] || DASHBOARD_BASE_URLS.employee;
  const path = resolveRoutePath(audience, routeKey, params);
  const normalizedBase = base.endsWith('/') ? base : `${base}/`;
  return path ? `${normalizedBase}${path}` : normalizedBase;
}

export function buildDashboardTarget(audience = 'employee', routeKey = 'dashboard', params = {}) {
  const route_path = resolveRoutePath(audience, routeKey, params);
  const target_url = buildDashboardUrl(audience, routeKey, params);
  return {
    audience,
    route_key: routeKey || 'dashboard',
    route_path,
    target_url,
    url: target_url,
  };
}

export default {
  DASHBOARD_BASE_URLS,
  EMPLOYEE_DASHBOARD_ROUTES,
  COMPANY_DASHBOARD_ROUTES,
  buildDashboardTarget,
  buildDashboardUrl,
  resolveRoutePath,
};
