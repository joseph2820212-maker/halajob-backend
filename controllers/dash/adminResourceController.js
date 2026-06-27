import mongoose from 'mongoose';
import bcryptjs from 'bcryptjs';
import ReturnDashData from '../../helper/ReturnDashData/index.js';
import { writeAuditLog } from '../../services/auditLog.service.js';
import { ensureCompanySubscription } from '../../services/subscriptions/companySubscription.service.js';
import { rebuildJobIntegration } from '../../services/search/rebuildSearchData.js';
import {
  AppSettingsModel,
  ApplicationStatusHistoryModel,
  BannerModel,
  ColorModel,
  CompanyMemberModel,
  CompanyModel,
  CompanyReviewModel,
  CountryModel,
  CurrencyModel,
  CvTemplateModel,
  EducationLevelModel,
  EmployeeCvModel,
  EmployeeModel,
  ExperienceLevelModel,
  FcmTokenModel,
  FontModel,
  IndustryModel,
  InterviewModel,
  JobEmployeeMatchModel,
  JobInvitationModel,
  JobMatchModel,
  JobNameModel,
  JobReportModel,
  JobSalaryModel,
  JobServiceModel,
  JobTypeModel,
  JobZainTalentRequestModel,
  KeywordModel,
  LanguageModel,
  NotificationModel,
  PageModel,
  PermissionModel,
  ResumeModel,
  RoleModel,
  SearchHistoryModel,
  SubscriptionPlanModel,
  CompanySubscriptionModel,
  UniversityModel,
  SkillModel,
  UserApplyingJobModel,
  UserModel,
  UserOutSideApplyingJobModel,
  UserRatingJobModel,
  UserReviewJobModel,
  UserResumeModel,
  UserSavedJobModel,
  UserShowJobModel,
  WorkLocationTypeModel,
  WorkModeModel,
  WorkTimeTypeModel,
  jobsModel,
} from '../../models/index.js';

const normalizeKey = (value = '') => String(value).toLowerCase().replace(/[\s_\-\/]+/g, '');
const SAFE_USER_SELECT =
  '-password -passcode -another_device_code -passcode_expires_at -another_device_expires_at -otp_last_sent_at -pending_device -device';
const SAFE_USER_HIDDEN_FIELDS = SAFE_USER_SELECT.split(' ');
const USER_REFERENCE_POPULATE_PATHS = new Set([
  'user',
  'user_id',
  'owner_user_id',
  'changed_by',
  'employee_user_id',
  'scheduled_by',
  'reviewed_by',
  'requested_by_user_id',
  'assigned_by',
]);

const baseSearch = [
  'name',
  'key',
  'title',
  'title_ar',
  'title_en',
  'email',
  'first_name',
  'last_name',
  'company_name',
  'company_email',
  'job_name',
  'description',
  'code',
];

const resources = {
  roles: {
    model: RoleModel,
    searchFields: ['name', 'title_ar', 'title_en'],
    defaultSort: 'role_number',
    populate: [{ path: 'permissions' }],
  },
  permissions: {
    model: PermissionModel,
    searchFields: ['key', 'group', 'action', 'title_ar', 'title_en'],
    defaultSort: 'group action',
  },
  users: {
    model: UserModel,
    searchFields: ['first_name', 'mid_name', 'last_name', 'email', 'phone_e164', 'phone_national'],
    defaultSort: '-createdAt',
    populate: [{ path: 'role_id' }, { path: 'permissions' }],
    hiddenFields: SAFE_USER_HIDDEN_FIELDS,
  },
  admins: {
    model: UserModel,
    searchFields: ['first_name', 'mid_name', 'last_name', 'email', 'phone_e164', 'phone_national'],
    defaultSort: '-createdAt',
    populate: [{ path: 'role_id' }, { path: 'permissions' }],
    hiddenFields: SAFE_USER_HIDDEN_FIELDS,
    preFilter: async () => {
      const dashRoles = await RoleModel.find({ log_to: 'dash' }).select('_id').lean();
      return { role_id: { $in: dashRoles.map((role) => role._id) } };
    },
  },
  employees: {
    model: EmployeeModel,
    searchFields: ['profile_headline', 'current_job_title', 'about_me', 'candidate_stage', 'matching_profile.searchable_text', 'matching_profile.searchable_tokens', 'matching_profile.normalized_skills', 'matching_profile.normalized_titles', 'skills.title'],
    defaultSort: '-createdAt',
    populate: [{ path: 'user_id' }, { path: 'experience_level_id' }],
  },
  companies: {
    model: CompanyModel,
    searchFields: ['company_name', 'company_email', 'slug', 'company_city', 'company_country', 'industry_name', 'description', 'specialties', 'company_projection.searchable_text', 'company_projection.searchable_tokens'],
    defaultSort: '-createdAt',
    populate: [{ path: 'owner_user_id' }, { path: 'industry_id' }, { path: 'country_id' }, { path: 'city_id' }],
  },
  companymembers: { model: CompanyMemberModel, defaultSort: '-createdAt', populate: [{ path: 'company_id' }, { path: 'user_id' }] },
  companyreviews: { model: CompanyReviewModel, searchFields: ['message', 'status'], defaultSort: '-createdAt', populate: [{ path: 'user_id' }, { path: 'company_id' }] },
  industries: { model: IndustryModel, searchFields: ['name', 'key', 'title_ar', 'title_en'], defaultSort: 'sort_order title_en' },
  jobs: {
    model: jobsModel,
    searchFields: ['job_name', 'description', 'ref', 'city', 'address', 'countries', 'cities', 'job_keywords', 'keywords_norm', 'phrases_norm', 'skills_required.title', 'skills_optional.title', 'languages.name', 'job_services.title', 'search_index.text_norm', 'search_index.tokens', 'search_projection.company.name', 'salary.currency_code'],
    defaultSort: '-createdAt',
    populate: [{ path: 'company_id' }, { path: 'user_id' }, { path: 'job_type_id' }, { path: 'job_time_id' }, { path: 'job_salary_id' }, { path: 'work_mode_id' }],
  },
  jobnames: { model: JobNameModel, searchFields: ['title_ar', 'title_en', 'sector_ar', 'sector_en', 'dedupeKey'], defaultSort: 'title_en' },
  jobservices: { model: JobServiceModel, searchFields: ['name', 'title_ar', 'title_en'], defaultSort: 'sort_order title_en' },
  jobtypes: { model: JobTypeModel, searchFields: ['name', 'title_ar', 'title_en'], defaultSort: 'sort_order title_en' },
  jobsalaries: { model: JobSalaryModel, searchFields: ['name', 'title_ar', 'title_en'], defaultSort: 'sort_order title_en' },
  worktime: { model: WorkTimeTypeModel, searchFields: ['name', 'title_ar', 'title_en'], defaultSort: 'sort_order title_en' },
  worktimes: { model: WorkTimeTypeModel, searchFields: ['name', 'title_ar', 'title_en'], defaultSort: 'sort_order title_en' },
  workmodes: { model: WorkModeModel, searchFields: ['key', 'title_ar', 'title_en'], defaultSort: 'sort_order title_en' },
  worklocations: { model: WorkLocationTypeModel, searchFields: ['name', 'title_ar', 'title_en'], defaultSort: 'sort_order title_en' },
  applications: { model: UserApplyingJobModel, searchFields: ['first_name', 'last_name', 'email', 'phone_national', 'status', 'cover_letter'], defaultSort: '-createdAt', populate: [{ path: 'user_id' }, { path: 'employee_id' }, { path: 'job_id' }, { path: 'company_id' }, { path: 'country_id' }] },
  applicationhistory: { model: ApplicationStatusHistoryModel, defaultSort: '-createdAt', populate: [{ path: 'application_id' }, { path: 'job_id' }, { path: 'company_id' }, { path: 'changed_by' }] },
  interviews: { model: InterviewModel, searchFields: ['type', 'status', 'meet_link', 'office_address'], defaultSort: '-start_at', populate: [{ path: 'application_id' }, { path: 'job_id' }, { path: 'company_id' }, { path: 'employee_user_id' }, { path: 'scheduled_by' }] },
  invitations: { model: JobInvitationModel, defaultSort: '-createdAt', populate: [{ path: 'job_id' }, { path: 'company_id' }, { path: 'employee_id' }, { path: 'user_id' }] },
  jobreports: { model: JobReportModel, searchFields: ['reason', 'message', 'status'], defaultSort: '-createdAt', populate: [{ path: 'user_id' }, { path: 'job_id' }, { path: 'company_id' }, { path: 'reviewed_by' }] },
  jobmatches: { model: JobMatchModel, defaultSort: '-createdAt', populate: [{ path: 'job_id' }, { path: 'employee_id' }] },
  jobemployeematches: { model: JobEmployeeMatchModel, defaultSort: '-score', populate: [{ path: 'job_id' }, { path: 'employee_id' }] },
  talentrequests: { model: JobZainTalentRequestModel, searchFields: ['title', 'description', 'required_skills', 'preferred_skills', 'countries', 'cities', 'status', 'priority', 'admin_note'], defaultSort: '-createdAt', populate: [{ path: 'company_id' }, { path: 'job_id' }, { path: 'requested_by_user_id', select: 'first_name mid_name last_name email' }] },
  universities: { model: UniversityModel, searchFields: ['name', 'name_en', 'city', 'country', 'email_domain', 'career_center_email', 'status'], defaultSort: '-createdAt', populate: [{ path: 'partners.company_id' }] },
  outsideapplications: { model: UserOutSideApplyingJobModel, defaultSort: '-createdAt', populate: [{ path: 'user_id' }, { path: 'job_id' }] },
  ratings: { model: UserRatingJobModel, defaultSort: '-createdAt', populate: [{ path: 'user_id' }, { path: 'job_id' }] },
  reviews: { model: UserReviewJobModel, searchFields: ['message'], defaultSort: '-createdAt', populate: [{ path: 'user_id' }, { path: 'job_id' }] },
  savedjobs: { model: UserSavedJobModel, defaultSort: '-createdAt', populate: [{ path: 'user_id' }, { path: 'job_id' }] },
  shownjobs: { model: UserShowJobModel, defaultSort: '-createdAt', populate: [{ path: 'user_id' }, { path: 'job_id' }] },
  countries: { model: CountryModel, searchFields: ['country_code', 'country_name_ar', 'country_name_en', 'city_name_ar', 'city_name_en'], defaultSort: 'country_name_en city_name_en' },
  currencies: { model: CurrencyModel, searchFields: ['code', 'name_ar', 'name_en', 'symbol_ar', 'symbol_en'], defaultSort: 'code' },
  languages: { model: LanguageModel, searchFields: ['name', 'title_ar', 'title_en'], defaultSort: 'title_en' },
  skills: { model: SkillModel, searchFields: ['key', 'title_ar', 'title_en', 'category'], defaultSort: 'title_en' },
  educationlevels: { model: EducationLevelModel, searchFields: ['key', 'title_ar', 'title_en'], defaultSort: 'sort_order title_en' },
  experiencelevels: { model: ExperienceLevelModel, searchFields: ['key', 'title_ar', 'title_en'], defaultSort: 'sort_order title_en' },
  colors: { model: ColorModel, searchFields: ['title_ar', 'title_en', 'code'], defaultSort: 'title_en' },
  fonts: { model: FontModel, searchFields: ['title_ar', 'title_en'], defaultSort: 'title_en' },
  resumes: { model: ResumeModel, searchFields: ['title_ar', 'title_en'], defaultSort: '-createdAt', populate: [{ path: 'employee_id' }, { path: 'color_id' }, { path: 'font_id' }] },
  userresumes: { model: UserResumeModel, defaultSort: '-createdAt', populate: [{ path: 'user_id' }, { path: 'resume_id' }, { path: 'color_id' }, { path: 'font_id' }] },
  employeecvs: { model: EmployeeCvModel, searchFields: ['title', 'template_key', 'lang'], defaultSort: '-createdAt', populate: [{ path: 'employee_id' }, { path: 'template_id' }] },
  cvtemplates: { model: CvTemplateModel, searchFields: ['key', 'title_ar', 'title_en', 'description_ar', 'description_en'], defaultSort: 'sort_order title_en' },
  banners: { model: BannerModel, searchFields: ['title_ar', 'title_en'], defaultSort: '-createdAt' },
  pages: { model: PageModel, searchFields: ['key', 'title_ar', 'title_en', 'description_ar', 'description_en'], defaultSort: '-createdAt' },
  keywords: { model: KeywordModel, searchFields: ['type'], defaultSort: '-createdAt' },
  notifications: { model: NotificationModel, searchFields: ['title', 'screen', 'order_id'], defaultSort: '-createdAt', populate: [{ path: 'user_id' }] },
  fcmtokens: {
    model: FcmTokenModel,
    searchFields: ['platform', 'brand', 'model_name'],
    defaultSort: '-createdAt',
    populate: [{ path: 'user' }],
    hiddenFields: ['-token', '-device_id', '-model_id', '-build_id'],
  },
  searchhistory: { model: SearchHistoryModel, searchFields: ['query', 'type'], defaultSort: '-createdAt', populate: [{ path: 'user_id' }] },
  settings: { model: AppSettingsModel, searchFields: ['key'], defaultSort: '-createdAt' },
  subscriptionplans: {
    model: SubscriptionPlanModel,
    searchFields: ['key', 'title_ar', 'title_en', 'description_ar', 'description_en', 'billing_period'],
    defaultSort: 'sort_order title_en',
  },
  companysubscriptions: {
    model: CompanySubscriptionModel,
    searchFields: ['plan_key', 'status', 'admin_note'],
    defaultSort: '-createdAt',
    populate: [{ path: 'company_id' }, { path: 'plan_id' }, { path: 'assigned_by', select: 'first_name mid_name last_name email' }],
  },
};

const aliases = {
  role: 'roles',
  permission: 'permissions',
  user: 'users',
  admin: 'admins',
  employee: 'employees',
  company: 'companies',
  companyreview: 'companyreviews',
  companyreviews: 'companyreviews',
  companymember: 'companymembers',
  companymembers: 'companymembers',
  industry: 'industries',
  industries: 'industries',
  job: 'jobs',
  jobs: 'jobs',
  jobname: 'jobnames',
  jobnames: 'jobnames',
  jopname: 'jobnames',
  jobservice: 'jobservices',
  jopservice: 'jobservices',
  jobtype: 'jobtypes',
  joptype: 'jobtypes',
  jobsalary: 'jobsalaries',
  jopsalary: 'jobsalaries',
  worktime: 'worktime',
  worktimetype: 'worktime',
  workmode: 'workmodes',
  worklocation: 'worklocations',
  application: 'applications',
  applications: 'applications',
  applicationstatushistory: 'applicationhistory',
  interview: 'interviews',
  invitation: 'invitations',
  jobreport: 'jobreports',
  report: 'jobreports',
  reports: 'jobreports',
  jobmatch: 'jobmatches',
  jobemployeematch: 'jobemployeematches',
  talentrequest: 'talentrequests',
  talentrequests: 'talentrequests',
  university: 'universities',
  universities: 'universities',
  outsideapplication: 'outsideapplications',
  useroutsideapplyingjob: 'outsideapplications',
  rating: 'ratings',
  review: 'reviews',
  savedjob: 'savedjobs',
  shownjob: 'shownjobs',
  country: 'countries',
  currency: 'currencies',
  language: 'languages',
  skill: 'skills',
  educationlevel: 'educationlevels',
  experiencelevel: 'experiencelevels',
  color: 'colors',
  font: 'fonts',
  resume: 'resumes',
  cvtemplate: 'cvtemplates',
  cvtemplates: 'cvtemplates',
  banner: 'banners',
  banners: 'banners',
  page: 'pages',
  pages: 'pages',
  keyword: 'keywords',
  notification: 'notifications',
  fcmtoken: 'fcmtokens',
  search: 'searchhistory',
  searchhistory: 'searchhistory',
  appsettings: 'settings',
  setting: 'settings',
  subscriptionplan: 'subscriptionplans',
  subscriptionplans: 'subscriptionplans',
  plan: 'subscriptionplans',
  plans: 'subscriptionplans',
  companysubscription: 'companysubscriptions',
  companysubscriptions: 'companysubscriptions',
  subscription: 'companysubscriptions',
  subscriptions: 'companysubscriptions',
};

export const getResourceConfig = (resourceName = '') => {
  const normalized = normalizeKey(resourceName);
  const key = aliases[normalized] || normalized;
  const config = resources[key];
  if (!config) return null;
  return { key, ...config };
};

const toInt = (value, fallback, { min = 1, max = 500 } = {}) => {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(Math.max(parsed, min), max);
};

const escapeRegex = (value = '') => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const normalizeSearchTerm = (value = '') =>
  String(value || '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06ED]/g, '')
    .replace(/[\u0622\u0623\u0625]/g, 'ا')
    .replace(/\u0649/g, 'ي')
    .replace(/\u0640/g, '')
    .replace(/[^a-z0-9\u0600-\u06FF]+/gi, ' ')
    .trim();

const splitSearchTokens = (value = '') => [
  ...new Set(normalizeSearchTerm(value).split(/\s+/).map((x) => x.trim()).filter((x) => x.length >= 2)),
];

const toBoolean = (value) => {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value !== 0;
  if (typeof value === 'string') return ['true', '1', 'yes', 'y', 'active'].includes(value.trim().toLowerCase());
  return value;
};


const dangerousPayloadKeys = new Set(['__proto__', 'prototype', 'constructor', '__v']);

const isSafePayloadKey = (key = '') => {
  const value = String(key || '').trim();
  if (!value) return false;
  if (dangerousPayloadKeys.has(value)) return false;
  if (value.startsWith('$')) return false;
  return true;
};

const sanitizeParsedValue = (value) => {
  if (Array.isArray(value)) return value.map((item) => sanitizeParsedValue(item));
  if (!isPlainNestedObject(value)) return value;

  return Object.entries(value).reduce((acc, [key, nestedValue]) => {
    if (!isSafePayloadKey(key)) return acc;
    acc[key] = sanitizeParsedValue(nestedValue);
    return acc;
  }, {});
};

const setDeepValue = (target, path, value) => {
  const parts = String(path || '').split('.').map((part) => part.trim()).filter(Boolean);
  if (!parts.length || parts.some((part) => !isSafePayloadKey(part))) return;

  let cursor = target;
  parts.forEach((part, index) => {
    const isLast = index === parts.length - 1;
    if (isLast) {
      cursor[part] = sanitizeParsedValue(value);
      return;
    }
    if (!cursor[part] || typeof cursor[part] !== 'object' || Array.isArray(cursor[part])) {
      cursor[part] = {};
    }
    cursor = cursor[part];
  });
};

const shouldDropEmptyValue = (key, value) => {
  if (value !== '') return false;
  return ['password', 'confirm_password', 'password_confirmation'].includes(String(key));
};

const parseMaybeJson = (value) => {
  if (typeof value !== 'string') return value;
  const trimmed = value.trim();
  if (!trimmed) return value;
  if ((trimmed.startsWith('{') && trimmed.endsWith('}')) || (trimmed.startsWith('[') && trimmed.endsWith(']'))) {
    try {
      return JSON.parse(trimmed);
    } catch {
      return value;
    }
  }
  return value;
};

const normalizePayload = async (req, config) => {
  const payload = {};

  Object.entries(req.body || {}).forEach(([key, value]) => {
    if (['password_confirmation', 'confirm_password'].includes(key)) return;
    if (shouldDropEmptyValue(key, value)) return;

    const keyParts = String(key).split('.').map((part) => part.trim()).filter(Boolean);
    if (!keyParts.length || keyParts.some((part) => !isSafePayloadKey(part))) return;

    const parsed = sanitizeParsedValue(parseMaybeJson(value));
    if (String(key).includes('.')) setDeepValue(payload, key, parsed);
    else payload[key] = parsed;
  });

  const files = req.files || (req.file ? [req.file] : []);
  for (const file of files) {
    const rel = file.path ? file.path.replace(/\\/g, '/') : file.filename;
    const field = file.fieldname || 'file';

    if (field === 'image' || field === 'cover_image' || field === 'logo') payload[field] = rel;
    else if (field === 'file') payload.file = rel;
    else payload[field] = rel;
  }

  if (payload.email) payload.email = String(payload.email).trim().toLowerCase();
  if (payload.password) payload.password = await bcryptjs.hash(String(payload.password), 10);

  if (config.model === UserModel) {
    if (!payload.phone_national && payload.phone) {
      payload.phone_national = String(payload.phone).replace(/\D+/g, '').slice(-12);
    }
    if (payload.phone_code && !String(payload.phone_code).startsWith('+')) payload.phone_code = `+${payload.phone_code}`;
    if (!payload.phone_code) payload.phone_code = '+963';
    if (!payload.phone_country) payload.phone_country = 'SY';
    if (!payload.phone_national && payload.phone_e164) payload.phone_national = String(payload.phone_e164).replace(/\D+/g, '').slice(-9);
    if (!payload.phone_national) payload.phone_national = `9${Date.now().toString().slice(-8)}`;
    if (!payload.phone_e164) payload.phone_e164 = `${payload.phone_code}${payload.phone_national}`;
    if (!payload.phone) payload.phone = payload.phone_e164;
    if (!payload.gender) payload.gender = 'male';
  }

  return payload;
};


const isPlainNestedObject = (value) => value && typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date) && !(value?._bsontype === 'ObjectID');

const flattenPayload = (input = {}, prefix = '', output = {}) => {
  Object.entries(input || {}).forEach(([key, value]) => {
    const path = prefix ? `${prefix}.${key}` : key;
    if (isPlainNestedObject(value)) flattenPayload(value, path, output);
    else output[path] = value;
  });
  return output;
};

const sanitizeUpdatePayload = (payload = {}) => {
  const flattened = flattenPayload(payload);
  return Object.entries(flattened).reduce((acc, [key, value]) => {
    const parts = String(key).split('.').map((part) => part.trim()).filter(Boolean);
    if (!parts.length || parts.some((part) => !isSafePayloadKey(part))) return acc;
    acc[key] = value;
    return acc;
  }, {});
};

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(String(id || ''));

const parseObjectIds = (value) => {
  const values = Array.isArray(value) ? value : String(value || '').split(/[\s,;]+/);
  return values
    .flatMap((entry) => (Array.isArray(entry) ? entry : String(entry || '').split(/[\s,;]+/)))
    .map((id) => String(id).trim())
    .filter(isValidObjectId);
};

const stripControlFields = (payload = {}) => {
  ['_id', 'id', 'ids', 'resource', 'force'].forEach((key) => {
    delete payload[key];
  });
  return payload;
};

const auditActorId = (req) => req.admin?._id || req.user?._id || null;

const auditEntityType = (config) => {
  if (config.model === UserModel) return 'user';
  if (config.model === CompanyModel) return 'company';
  if (config.model === jobsModel) return 'job';
  if (config.model === UserApplyingJobModel) return 'application';
  if (config.model === InterviewModel) return 'interview';
  if (config.model === CompanyMemberModel) return 'company_member';
  if (config.model === CompanyReviewModel || config.model === UserReviewJobModel) return 'other';
  if (config.model === JobReportModel) return 'other';
  if (config.model === CompanySubscriptionModel || config.model === SubscriptionPlanModel) return 'subscription';
  if (config.model === NotificationModel) return 'notification';
  return 'other';
};

const auditCompanyId = (config, doc = {}) => {
  if (!doc) return null;
  if (config.model === CompanyModel) return doc._id || null;
  return doc.company_id?._id || doc.company_id || null;
};

const writeAdminResourceAudit = async ({ req, config, action, doc = null, entityId = null, oldValue = null, newValue = null, metadata = {} }) => {
  await writeAuditLog({
    req,
    companyId: auditCompanyId(config, doc),
    actorUserId: auditActorId(req),
    actorType: 'admin',
    action,
    entityType: auditEntityType(config),
    entityId: entityId || doc?._id || null,
    oldValue,
    newValue,
    metadata: {
      resource: config.key,
      model: config.model?.modelName || '',
      ...metadata,
    },
  });
};

const isSortableSchemaPath = (field, config) => field === '_id' || Boolean(config.model.schema.path(field));

const buildSort = (requestedSort, config) => {
  const fallback = config.defaultSort || '-createdAt';
  if (!requestedSort) return fallback;
  if (typeof requestedSort !== 'string') return fallback;

  const tokens = requestedSort
    .split(/[\s,]+/)
    .map((token) => token.trim())
    .filter(Boolean)
    .filter((token) => /^-?[A-Za-z0-9_.]+$/.test(token))
    .filter((token) => isSortableSchemaPath(token.replace(/^-/, ''), config));

  return tokens.length ? tokens.join(' ') : fallback;
};

const addSchemaQueryFilters = (filter, query, config) => {
  const reserved = new Set([
    'page',
    'limit',
    'sort',
    'search',
    'keyword',
    'q',
    'from',
    'to',
    'fields',
    'populate',
    'ids',
    'resource',
  ]);

  Object.entries(query || {}).forEach(([key, rawValue]) => {
    if (reserved.has(key) || rawValue === undefined || rawValue === null || rawValue === '') return;
    if (!config.model.schema.path(key)) return;

    if (Array.isArray(rawValue)) {
      filter[key] = { $in: rawValue };
    } else if (['true', 'false', '1', '0', true, false].includes(rawValue)) {
      filter[key] = toBoolean(rawValue);
    } else if (isValidObjectId(rawValue) && String(config.model.schema.path(key).instance).toLowerCase() === 'objectid') {
      filter[key] = rawValue;
    } else {
      filter[key] = rawValue;
    }
  });
};

const buildFilter = async (req, config) => {
  const filter = config.preFilter ? await config.preFilter(req) : {};
  const query = req.query || {};
  const search = String(query.search || query.keyword || query.q || '').trim();

  if (query.ids) {
    const ids = String(query.ids)
      .split(',')
      .map((id) => id.trim())
      .filter(isValidObjectId);
    if (ids.length) filter._id = { $in: ids };
  }

  const createdFrom = query.from || query.created_from || query.createdAt_from;
  const createdTo = query.to || query.created_to || query.createdAt_to;
  if (createdFrom || createdTo) {
    filter.createdAt = {};
    if (createdFrom) filter.createdAt.$gte = new Date(createdFrom);
    if (createdTo) filter.createdAt.$lte = new Date(createdTo);
  }

  if (query.updated_from || query.updated_to) {
    filter.updatedAt = {};
    if (query.updated_from) filter.updatedAt.$gte = new Date(query.updated_from);
    if (query.updated_to) filter.updatedAt.$lte = new Date(query.updated_to);
  }

  if (search) {
    const searchFields = (config.searchFields || baseSearch).filter((field) => config.model.schema.path(field));
    const escaped = escapeRegex(search);
    const regex = { $regex: escaped, $options: 'i' };
    const tokens = splitSearchTokens(search);
    const tokenRegexes = tokens.slice(0, 8).map((token) => ({ $regex: escapeRegex(token), $options: 'i' }));
    const clauses = [];

    if (isValidObjectId(search)) clauses.push({ _id: search });

    searchFields.forEach((field) => {
      clauses.push({ [field]: regex });
      if (tokenRegexes.length > 1) clauses.push({ [field]: { $in: tokenRegexes } });
    });

    if (config.key === 'employees') {
      const userRegex = new RegExp(escaped, 'i');
      const users = await UserModel.find({
        $or: [
          { first_name: userRegex },
          { mid_name: userRegex },
          { last_name: userRegex },
          { email: userRegex },
          { phone: userRegex },
          { phone_e164: userRegex },
          { phone_national: userRegex },
        ],
      }).select('_id').limit(500).lean();
      const userIds = users.map((user) => user._id);
      if (userIds.length) clauses.push({ user_id: { $in: userIds } });
    }

    if (config.key === 'companies') {
      const userRegex = new RegExp(escaped, 'i');
      const users = await UserModel.find({
        $or: [{ first_name: userRegex }, { mid_name: userRegex }, { last_name: userRegex }, { email: userRegex }],
      }).select('_id').limit(500).lean();
      const userIds = users.map((user) => user._id);
      if (userIds.length) clauses.push({ owner_user_id: { $in: userIds } });
    }

    if (clauses.length) filter.$or = clauses;
  }

  addSchemaQueryFilters(filter, query, config);

  return filter;
};

const normalizePopulate = (populate) => {
  if (!populate || typeof populate !== 'object') return populate;
  if (!USER_REFERENCE_POPULATE_PATHS.has(populate.path) || populate.select) return populate;
  return { ...populate, select: SAFE_USER_SELECT };
};

const applyPopulate = (query, config) => {
  const populates = config.populate || [];
  populates.forEach((populate) => query.populate(normalizePopulate(populate)));
  return query;
};

const selectHiddenFields = (query, config) => {
  if (config.hiddenFields?.length) query.select(config.hiddenFields.join(' '));
  return query;
};

const loadResponseDoc = async (config, doc) => {
  if (!doc?._id || !config.hiddenFields?.length) return doc;
  return selectHiddenFields(applyPopulate(config.model.findById(doc._id), config), config).lean();
};

const sendNotFound = (res, resource) =>
  ReturnDashData.getError({
    res,
    status: 404,
    message: `${resource}_not_found`,
  });

const list = (resourceName) => async (req, res) => {
  try {
    const config = getResourceConfig(resourceName || req.params.resource);
    if (!config) return ReturnDashData.getError({ res, status: 404, message: 'resource_not_found' });

    const page = toInt(req.query.page, 1);
    const limit = toInt(req.query.limit, 10, { min: 1, max: 200 });
    const skip = (page - 1) * limit;
    const sort = buildSort(req.query.sort, config);
    const filter = await buildFilter(req, config);

    const findQuery = selectHiddenFields(applyPopulate(config.model.find(filter), config), config)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean();

    const [items, total] = await Promise.all([
      findQuery,
      config.model.countDocuments(filter),
    ]);

    return ReturnDashData.getData({
      res,
      data: items,
      other: {
        resource: config.key,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
          has_next: page * limit < total,
          has_prev: page > 1,
        },
      },
    });
  } catch (err) {
    return ReturnDashData.getError({ res, status: 400, message: err.message || 'get_failed' });
  }
};

const getOne = (resourceName) => async (req, res) => {
  try {
    const config = getResourceConfig(resourceName || req.params.resource);
    if (!config) return ReturnDashData.getError({ res, status: 404, message: 'resource_not_found' });

    const id = req.params.id || req.query.id || req.body?.id;
    if (!isValidObjectId(id)) return ReturnDashData.getError({ res, status: 400, message: 'invalid_id' });

    const doc = await selectHiddenFields(applyPopulate(config.model.findById(id), config), config).lean();
    if (!doc) return sendNotFound(res, config.key);

    return ReturnDashData.getData({ res, data: doc, other: { resource: config.key } });
  } catch (err) {
    return ReturnDashData.getError({ res, status: 400, message: err.message || 'get_one_failed' });
  }
};

const create = (resourceName) => async (req, res) => {
  try {
    const config = getResourceConfig(resourceName || req.params.resource);
    if (!config) return ReturnDashData.getError({ res, status: 404, message: 'resource_not_found' });

    const payload = await normalizePayload(req, config);
    const doc = await config.model.create(payload);
    const responseDoc = await loadResponseDoc(config, doc);
    await writeAdminResourceAudit({
      req,
      config,
      action: 'admin_resource_created',
      doc,
      newValue: payload,
    });

    return ReturnDashData.createData({ res, data: responseDoc, other: { resource: config.key } });
  } catch (err) {
    return ReturnDashData.createError({
      res,
      status: 400,
      message: err.message || 'create_failed',
      other: { code: err.code },
    });
  }
};

const update = (resourceName) => async (req, res) => {
  try {
    const config = getResourceConfig(resourceName || req.params.resource);
    if (!config) return ReturnDashData.getError({ res, status: 404, message: 'resource_not_found' });

    const id = req.params.id || req.body?.id || req.query.id;
    if (!isValidObjectId(id)) return ReturnDashData.updateError({ res, status: 400, message: 'invalid_id' });

    const payload = stripControlFields(await normalizePayload(req, config));

    if (config.model === CompanyModel && (payload.accepted === true || payload.accepted === 'true' || payload.accepted === 1 || payload.accepted === '1')) {
      payload.accepted = true;
      payload.status = true;
      if (typeof payload.can_upload === 'undefined') payload.can_upload = false;
    }

    if (config.model === jobsModel && (payload.is_accepted === true || payload.is_accepted === 'true' || payload.is_accepted === 1 || payload.is_accepted === '1')) {
      payload.is_accepted = true;
      payload.status = true;
      if (!payload.publish_status) payload.publish_status = 'published';
    }

    const updatePayload = sanitizeUpdatePayload(payload);
    if (!Object.keys(updatePayload).length) {
      return ReturnDashData.updateError({ res, status: 400, message: 'no_update_fields' });
    }

    const doc = await config.model.findByIdAndUpdate(id, updatePayload, { new: true, runValidators: true });
    if (!doc) return ReturnDashData.updateError({ res, status: 404, message: `${config.key}_not_found` });

    if (config.model === CompanyModel && doc.accepted === true && doc.status === true) {
      const companyRole =
        (await RoleModel.findOne({ role_number: 3, log_to: 'company', status: true })) ||
        (await RoleModel.findOne({ log_to: 'company', status: true })) ||
        (await RoleModel.findOne({ role_number: 3 }));
      if (companyRole?._id && doc.owner_user_id) {
        await UserModel.findByIdAndUpdate(doc.owner_user_id, { $set: { role_id: companyRole._id, status: true } });
        if (String(doc.role_id || '') !== String(companyRole._id)) {
          doc.role_id = companyRole._id;
          await doc.save();
        }
      }
      await ensureCompanySubscription(doc._id, { assigned_by: req.admin?._id || req.user?._id || null });
    }

    if (config.model === jobsModel && doc.publish_status === 'published') {
      await rebuildJobIntegration(doc._id, { rebuildMatches: true }).catch(() => null);
    }
    const responseDoc = await loadResponseDoc(config, doc);
    await writeAdminResourceAudit({
      req,
      config,
      action: req.auditActionOverride || 'admin_resource_updated',
      doc,
      newValue: updatePayload,
    });

    return ReturnDashData.updateData({ res, data: responseDoc, other: { resource: config.key } });
  } catch (err) {
    return ReturnDashData.updateError({
      res,
      status: 400,
      message: err.message || 'update_failed',
      other: { code: err.code },
    });
  }
};

const remove = (resourceName) => async (req, res) => {
  try {
    const config = getResourceConfig(resourceName || req.params.resource);
    if (!config) return ReturnDashData.getError({ res, status: 404, message: 'resource_not_found' });

    const id = req.params.id || req.body?.id || req.query.id;
    if (!isValidObjectId(id)) return ReturnDashData.deleteError({ res, status: 400, message: 'invalid_id' });

    const canSoftDelete = config.model.schema.path('status');
    const forceDelete = req.query.force === 'true' || req.body?.force === true || req.body?.force === 'true';

    const doc = canSoftDelete && !forceDelete
      ? await config.model.findByIdAndUpdate(id, { status: false }, { new: true })
      : await config.model.findByIdAndDelete(id);

    if (!doc) return ReturnDashData.deleteError({ res, status: 404, message: `${config.key}_not_found` });
    await writeAdminResourceAudit({
      req,
      config,
      action: forceDelete ? 'admin_resource_deleted' : 'admin_resource_disabled',
      doc,
      entityId: id,
      metadata: {
        soft_deleted: Boolean(canSoftDelete && !forceDelete),
      },
    });

    return ReturnDashData.deleteData({
      res,
      other: {
        id,
        resource: config.key,
        soft_deleted: Boolean(canSoftDelete && !forceDelete),
      },
    });
  } catch (err) {
    return ReturnDashData.deleteError({ res, status: 400, message: err.message || 'delete_failed' });
  }
};

const bulkUpdate = (resourceName) => async (req, res) => {
  try {
    const config = getResourceConfig(resourceName || req.params.resource);
    if (!config) return ReturnDashData.getError({ res, status: 404, message: 'resource_not_found' });

    const ids = parseObjectIds(req.body?.ids);

    if (!ids.length) return ReturnDashData.updateError({ res, status: 400, message: 'ids_required' });

    const payload = stripControlFields(await normalizePayload(req, config));
    const updatePayload = sanitizeUpdatePayload(payload);
    if (!Object.keys(updatePayload).length) {
      return ReturnDashData.updateError({ res, status: 400, message: 'no_update_fields' });
    }

    const result = await config.model.updateMany({ _id: { $in: ids } }, { $set: updatePayload }, { runValidators: true });
    await writeAdminResourceAudit({
      req,
      config,
      action: 'admin_resource_bulk_updated',
      newValue: updatePayload,
      metadata: {
        ids,
        matched: result.matchedCount || result.n || 0,
        modified: result.modifiedCount || result.nModified || 0,
      },
    });

    return ReturnDashData.updateData({
      res,
      data: result,
      other: { resource: config.key },
    });
  } catch (err) {
    return ReturnDashData.updateError({ res, status: 400, message: err.message || 'bulk_update_failed' });
  }
};

const approve = (resourceName) => async (req, res) => {
  const config = getResourceConfig(resourceName || req.params.resource);
  if (!config) return ReturnDashData.getError({ res, status: 404, message: 'resource_not_found' });

  req.body = {
    ...(req.body || {}),
    status: true,
  };

  if (config.model === CompanyModel) req.body.accepted = true;
  if (config.model === jobsModel) {
    req.body.is_accepted = true;
    req.body.publish_status = 'published';
  }
  if (config.model === JobReportModel) {
    req.body.status = 'resolved';
    req.body.reviewed_by = req.admin?._id || req.user?._id;
    req.body.reviewed_at = new Date();
  }
  if (config.model === CompanyReviewModel || config.model === UserReviewJobModel) req.body.status = 'published';
  req.auditActionOverride = 'admin_resource_approved';

  return update(resourceName)(req, res);
};

const reject = (resourceName) => async (req, res) => {
  const config = getResourceConfig(resourceName || req.params.resource);
  if (!config) return ReturnDashData.getError({ res, status: 404, message: 'resource_not_found' });

  req.body = {
    ...(req.body || {}),
    status: false,
  };

  if (config.model === CompanyModel) req.body.accepted = false;
  if (config.model === jobsModel) {
    req.body.is_accepted = false;
    req.body.publish_status = 'rejected';
  }
  if (config.model === JobReportModel) {
    req.body.status = 'rejected';
    req.body.reviewed_by = req.admin?._id || req.user?._id;
    req.body.reviewed_at = new Date();
  }
  if (config.model === CompanyReviewModel || config.model === UserReviewJobModel) req.body.status = 'rejected';
  req.auditActionOverride = 'admin_resource_rejected';

  return update(resourceName)(req, res);
};

export default {
  list,
  get: list,
  getOne,
  create,
  update,
  remove,
  delete: remove,
  bulkUpdate,
  approve,
  reject,
};
