export const NOTIFICATION_TEXT = {
  job_applied: {
    ar: { title: 'طلب توظيف جديد', body: 'قام {candidate} بالتقديم على وظيفة {job}.' },
    en: { title: 'New job application', body: '{candidate} applied for {job}.' },
  },
  job_saved: {
    ar: { title: 'تم حفظ وظيفتك', body: 'قام أحد المرشحين بحفظ وظيفة {job}.' },
    en: { title: 'Your job was saved', body: 'A candidate saved {job}.' },
  },
  job_reviewed: {
    ar: { title: 'مراجعة جديدة على وظيفة', body: 'تمت إضافة مراجعة على وظيفة {job}.' },
    en: { title: 'New job review', body: 'A review was added for {job}.' },
  },
  job_rated: {
    ar: { title: 'تقييم جديد على وظيفة', body: 'تم تقييم وظيفة {job}.' },
    en: { title: 'New job rating', body: '{job} received a new rating.' },
  },

  job_deadline_company_72h: {
    ar: { title: 'تذكير بانتهاء الوظيفة', body: 'ستنتهي وظيفة {job} خلال 72 ساعة. راجع الطلبات قبل انتهاء المهلة.' },
    en: { title: 'Job deadline reminder', body: '{job} will expire in 72 hours. Review applications before the deadline.' },
  },
  job_deadline_company_24h: {
    ar: { title: 'تنبيه: الوظيفة تنتهي قريبًا', body: 'ستنتهي وظيفة {job} خلال 24 ساعة.' },
    en: { title: 'Job expires soon', body: '{job} will expire in 24 hours.' },
  },
  saved_job_deadline_employee_72h: {
    ar: { title: 'وظيفة محفوظة تنتهي قريبًا', body: 'وظيفة {job} التي حفظتها ستنتهي خلال 72 ساعة. تقدم الآن إن كانت مناسبة لك.' },
    en: { title: 'Saved job expires soon', body: 'Your saved job {job} expires in 72 hours. Apply now if it fits you.' },
  },
  saved_job_deadline_employee_24h: {
    ar: { title: 'آخر فرصة للتقديم', body: 'وظيفة {job} التي حفظتها ستنتهي خلال 24 ساعة.' },
    en: { title: 'Last chance to apply', body: 'Your saved job {job} expires in 24 hours.' },
  },
  job_auto_closed_company: {
    ar: { title: 'تم إغلاق الوظيفة تلقائيًا', body: 'تم إغلاق وظيفة {job} تلقائيًا بسبب انتهاء الموعد.' },
    en: { title: 'Job closed automatically', body: '{job} was automatically closed because its deadline expired.' },
  },
  job_auto_closed_employee: {
    ar: { title: 'تم إغلاق وظيفة تقدمت لها', body: 'تم إغلاق وظيفة {job} بعد انتهاء موعدها. يمكنك متابعة حالة طلبك من صفحة الطلبات.' },
    en: { title: 'A job you applied to was closed', body: '{job} was closed after its deadline. You can track your application status.' },
  },
  job_created: {
    ar: { title: 'تم إنشاء الوظيفة', body: 'تم إنشاء وظيفة {job} وهي بانتظار المراجعة إن لزم الأمر.' },
    en: { title: 'Job created', body: '{job} was created and may be waiting for review.' },
  },
  job_updated: {
    ar: { title: 'تم تحديث الوظيفة', body: 'تم تحديث بيانات وظيفة {job}.' },
    en: { title: 'Job updated', body: '{job} was updated.' },
  },
  job_deleted: {
    ar: { title: 'تم حذف الوظيفة', body: 'تم حذف وظيفة {job}.' },
    en: { title: 'Job deleted', body: '{job} was deleted.' },
  },
  job_stopped: {
    ar: { title: 'تم إيقاف الوظيفة', body: 'تم إيقاف نشر وظيفة {job}.' },
    en: { title: 'Job paused', body: '{job} was paused.' },
  },
  job_published: {
    ar: { title: 'تم نشر الوظيفة', body: 'أصبحت وظيفة {job} منشورة الآن.' },
    en: { title: 'Job published', body: '{job} is now published.' },
  },
  application_status_waiting: {
    ar: { title: 'طلبك بانتظار المراجعة', body: 'طلبك على وظيفة {job} بانتظار مراجعة الشركة.' },
    en: { title: 'Application is waiting', body: 'Your application for {job} is waiting for company review.' },
  },
  application_status_screening: {
    ar: { title: 'طلبك قيد الفرز', body: 'بدأت الشركة بمراجعة طلبك على وظيفة {job}.' },
    en: { title: 'Application under review', body: 'The company started reviewing your application for {job}.' },
  },
  application_status_shortlisted: {
    ar: { title: 'تم ترشيحك مبدئيًا', body: 'تم وضع طلبك على وظيفة {job} ضمن القائمة المختصرة.' },
    en: { title: 'You were shortlisted', body: 'Your application for {job} was shortlisted.' },
  },
  application_status_interview: {
    ar: { title: 'تمت دعوتك لمقابلة', body: 'تم نقل طلبك على وظيفة {job} إلى مرحلة المقابلة.' },
    en: { title: 'Interview stage', body: 'Your application for {job} moved to interview stage.' },
  },
  application_status_offer: {
    ar: { title: 'لديك عرض وظيفي', body: 'وصل عرض جديد مرتبط بوظيفة {job}.' },
    en: { title: 'You have a job offer', body: 'A new offer is available for {job}.' },
  },
  application_status_accepted: {
    ar: { title: 'تم قبول طلبك', body: 'تم قبول طلبك على وظيفة {job}.' },
    en: { title: 'Application accepted', body: 'Your application for {job} was accepted.' },
  },
  application_status_hired: {
    ar: { title: 'تم اعتمادك للوظيفة', body: 'تم اعتمادك في وظيفة {job}.' },
    en: { title: 'You were hired', body: 'You were hired for {job}.' },
  },
  application_status_rejected: {
    ar: { title: 'تم رفض الطلب', body: 'نأسف، تم رفض طلبك على وظيفة {job}.' },
    en: { title: 'Application rejected', body: 'Your application for {job} was rejected.' },
  },
  application_status_withdrawn_company: {
    ar: { title: 'تم سحب طلب', body: 'قام {candidate} بسحب طلبه على وظيفة {job}.' },
    en: { title: 'Application withdrawn', body: '{candidate} withdrew the application for {job}.' },
  },
  application_status_auto_cancel: {
    ar: { title: 'تم إلغاء الطلب', body: 'تم إلغاء طلبك على وظيفة {job} تلقائيًا.' },
    en: { title: 'Application cancelled', body: 'Your application for {job} was automatically cancelled.' },
  },
  interview_scheduled: {
    ar: { title: 'تم تحديد مقابلة', body: 'تم تحديد مقابلة لوظيفة {job}.' },
    en: { title: 'Interview scheduled', body: 'An interview was scheduled for {job}.' },
  },
  interview_updated: {
    ar: { title: 'تم تعديل موعد المقابلة', body: 'تم تحديث تفاصيل مقابلتك لوظيفة {job}.' },
    en: { title: 'Interview updated', body: 'Your interview for {job} was updated.' },
  },
  interview_cancelled: {
    ar: { title: 'تم إلغاء المقابلة', body: 'تم إلغاء المقابلة المرتبطة بوظيفة {job}.' },
    en: { title: 'Interview cancelled', body: 'The interview for {job} was cancelled.' },
  },
  interview_response_company: {
    ar: { title: 'رد جديد على المقابلة', body: 'قام {candidate} بتحديث رده على مقابلة وظيفة {job}.' },
    en: { title: 'Interview response updated', body: '{candidate} updated the response for {job} interview.' },
  },
  job_invitation_sent: {
    ar: { title: 'دعوة عمل جديدة', body: 'أرسلت لك شركة {company} دعوة للتقديم على وظيفة {job}.' },
    en: { title: 'New job invitation', body: '{company} invited you to apply for {job}.' },
  },
  job_invitation_cancelled: {
    ar: { title: 'تم إلغاء دعوة العمل', body: 'تم إلغاء الدعوة المرتبطة بوظيفة {job}.' },
    en: { title: 'Job invitation cancelled', body: 'The invitation for {job} was cancelled.' },
  },
  job_invitation_response_company: {
    ar: { title: 'رد على عرض العمل', body: 'قام {candidate} بالرد على عرض وظيفة {job}.' },
    en: { title: 'Job invitation response', body: '{candidate} responded to the invitation for {job}.' },
  },
  campus_verification_approved: {
    en: { title: 'Campus status approved', body: 'Your student status at {university} was approved.' },
  },
  campus_verification_rejected: {
    en: { title: 'Campus verification rejected', body: 'Your student verification for {university} was rejected. {reason}' },
  },
  campus_verification_more_information_requested: {
    en: { title: 'Campus verification needs information', body: '{university} needs more information to verify your student status. {reason}' },
  },
  campus_event_registered: {
    en: { title: 'Campus event saved', body: 'You registered for {event}.' },
  },
  campus_event_reminder: {
    en: { title: 'Campus event reminder', body: '{event} is coming up. Check the event details before it starts.' },
  },
  company_viewed_profile: {
    en: { title: 'A company viewed your profile', body: '{company} viewed your profile.' },
  },
  new_matching_job: {
    en: { title: 'New matching job', body: '{job} looks like a good match for your profile.' },
  },
  cv_export_ready: {
    en: { title: 'CV export ready', body: 'Your CV export is ready to download.' },
  },
  ai_result_ready: {
    en: { title: 'AI result ready', body: 'Your {feature} result is ready to review.' },
  },
  profile_completion_tip: {
    ar: { title: 'أكمل ملفك الشخصي', body: 'إكمال قسم {section} يزيد فرص ظهورك للشركات.' },
    en: { title: 'Complete your profile', body: 'Completing {section} improves your visibility to companies.' },
  },
};

export const EVENT_ROUTE = {
  job_applied: { audience: 'company', routeKey: 'applications.applied' },
  job_saved: { audience: 'company', routeKey: 'jobs.details' },
  job_reviewed: { audience: 'company', routeKey: 'jobs.details' },
  job_rated: { audience: 'company', routeKey: 'jobs.details' },

  job_deadline_company_72h: { audience: 'company', routeKey: 'jobs.details' },
  job_deadline_company_24h: { audience: 'company', routeKey: 'jobs.details' },
  saved_job_deadline_employee_72h: { audience: 'employee', routeKey: 'jobs.saved' },
  saved_job_deadline_employee_24h: { audience: 'employee', routeKey: 'jobs.saved' },
  job_auto_closed_company: { audience: 'company', routeKey: 'jobs.details' },
  job_auto_closed_employee: { audience: 'employee', routeKey: 'applications.status' },
  job_created: { audience: 'company', routeKey: 'jobs.details' },
  job_updated: { audience: 'company', routeKey: 'jobs.details' },
  job_deleted: { audience: 'company', routeKey: 'jobs.list' },
  job_stopped: { audience: 'company', routeKey: 'jobs.list' },
  job_published: { audience: 'company', routeKey: 'jobs.details' },
  application_status_waiting: { audience: 'employee', routeKey: 'applications.status' },
  application_status_screening: { audience: 'employee', routeKey: 'applications.status' },
  application_status_shortlisted: { audience: 'employee', routeKey: 'applications.status' },
  application_status_interview: { audience: 'employee', routeKey: 'applications.interviews' },
  application_status_offer: { audience: 'employee', routeKey: 'applications.offers' },
  application_status_accepted: { audience: 'employee', routeKey: 'applications.status' },
  application_status_hired: { audience: 'employee', routeKey: 'applications.status' },
  application_status_rejected: { audience: 'employee', routeKey: 'applications.rejected' },
  application_status_withdrawn_company: { audience: 'company', routeKey: 'applications.status' },
  application_status_auto_cancel: { audience: 'employee', routeKey: 'applications.status' },
  interview_scheduled: { audience: 'employee', routeKey: 'applications.interviews' },
  interview_updated: { audience: 'employee', routeKey: 'applications.interviews' },
  interview_cancelled: { audience: 'employee', routeKey: 'applications.interviews' },
  interview_response_company: { audience: 'company', routeKey: 'applications.interviews' },
  job_invitation_sent: { audience: 'employee', routeKey: 'applications.offers' },
  job_invitation_cancelled: { audience: 'employee', routeKey: 'applications.offers' },
  job_invitation_response_company: { audience: 'company', routeKey: 'applications.offers' },
  campus_verification_approved: { audience: 'employee', routeKey: 'campus.verification' },
  campus_verification_rejected: { audience: 'employee', routeKey: 'campus.verification' },
  campus_verification_more_information_requested: { audience: 'employee', routeKey: 'campus.verification' },
  campus_event_registered: { audience: 'employee', routeKey: 'campus.events' },
  campus_event_reminder: { audience: 'employee', routeKey: 'campus.events' },
  company_viewed_profile: { audience: 'employee', routeKey: 'profile.company_views' },
  new_matching_job: { audience: 'employee', routeKey: 'jobs.recommended' },
  cv_export_ready: { audience: 'employee', routeKey: 'cvs.my' },
  ai_result_ready: { audience: 'employee', routeKey: 'dashboard' },
  profile_completion_tip: { audience: 'employee', routeKey: 'profile.personal_info' },
};

const getByLang = (entry, lang = 'en') => entry?.[lang] || entry?.en || entry?.ar || {};

export function renderNotificationText(eventKey, lang = 'en', params = {}) {
  const text = getByLang(NOTIFICATION_TEXT[eventKey], lang);
  const apply = (value = '') => String(value).replace(/\{(\w+)\}/g, (_, key) => {
    const replacement = params[key];
    return replacement === undefined || replacement === null || replacement === '' ? '' : String(replacement);
  }).replace(/\s+/g, ' ').trim();

  return {
    title: apply(text.title || eventKey),
    body: apply(text.body || ''),
  };
}

export function routeForEvent(eventKey, fallback = {}) {
  return EVENT_ROUTE[eventKey] || fallback || {};
}

export default {
  NOTIFICATION_TEXT,
  EVENT_ROUTE,
  renderNotificationText,
  routeForEvent,
};
