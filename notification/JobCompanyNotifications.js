import { candidateNameFrom, jobNameFrom, notifyUser } from './notificationService.js';

const getCompanyOwnerUserId = (value = {}) => {
  const company = value.company_id || value.company || {};
  return value.company_user_id || value.company_owner_user_id || value.owner_user_id || value.user_id || company.owner_user_id || company.user_id || null;
};

const notifyCompanyAboutJob = (eventKey, job = {}, extra = {}) => {
  const jobId = job._id || job.job_id || job.id || extra.job_id || '';
  return notifyUser({
    userId: getCompanyOwnerUserId({ ...job, ...extra }),
    eventKey,
    audience: 'company',
    routeKey: eventKey === 'job_deleted' || eventKey === 'job_stopped' ? 'jobs.list' : 'jobs.details',
    routeParams: { id: jobId, jobId },
    params: {
      job: jobNameFrom(job),
      candidate: candidateNameFrom(extra.application || extra),
    },
    data: {
      job_id: jobId,
      company_id: job.company_id?._id || job.company_id || extra.company_id || '',
      application_id: extra.application_id || extra.application?._id || '',
      employee_id: extra.employee_id || extra.application?.employee_id || '',
      candidate_user_id: extra.candidate_user_id || extra.application?.user_id || '',
      ...extra.data,
    },
    dedupeKey: extra.dedupeKey || null,
  });
};

export const job_seeker_saved_notification = (job, extra = {}) => notifyCompanyAboutJob('job_saved', job, extra);
export const Job_created_notification = (job, extra = {}) => notifyCompanyAboutJob('job_created', job, extra);
export const job_reviewed_notification = (job, extra = {}) => notifyCompanyAboutJob('job_reviewed', job, extra);
export const job_updated_notification = (job, extra = {}) => notifyCompanyAboutJob('job_updated', job, extra);
export const job_deleted_notification = (job, extra = {}) => notifyCompanyAboutJob('job_deleted', job, extra);
export const job_stopped_notification = (job, extra = {}) => notifyCompanyAboutJob('job_stopped', job, extra);
export const job_rated_notification = (job, extra = {}) => notifyCompanyAboutJob('job_rated', job, extra);

export const job_applied_notification = (job, application = {}) => notifyUser({
  userId: getCompanyOwnerUserId(job),
  eventKey: 'job_applied',
  audience: 'company',
  routeKey: 'applications.applied',
  routeParams: { id: job._id || job.id || application.job_id || '', jobId: job._id || application.job_id || '' },
  params: {
    job: jobNameFrom(job),
    candidate: candidateNameFrom(application),
  },
  data: {
    job_id: job._id || application.job_id || '',
    application_id: application._id || application.id || '',
    employee_id: application.employee_id || '',
    candidate_user_id: application.user_id || '',
    company_id: job.company_id?._id || job.company_id || application.company_id || '',
  },
  dedupeKey: application._id ? `application:${application._id}:created` : null,
});

export const application_withdrawn_company_notification = (application = {}, job = {}) => notifyUser({
  userId: getCompanyOwnerUserId(job),
  eventKey: 'application_status_withdrawn_company',
  audience: 'company',
  routeKey: 'applications.status',
  routeParams: { id: application.job_id || job._id || '', applicationId: application._id || '' },
  params: { job: jobNameFrom(job), candidate: candidateNameFrom(application) },
  data: {
    job_id: application.job_id || job._id || '',
    application_id: application._id || '',
    employee_id: application.employee_id || '',
    candidate_user_id: application.user_id || '',
    status: application.status || 'withdrawn',
  },
  dedupeKey: application._id ? `application:${application._id}:withdrawn` : null,
});

export const interview_response_company_notification = ({ interview = {}, application = {}, job = {}, candidate = {} } = {}) => notifyUser({
  userId: getCompanyOwnerUserId(job),
  eventKey: 'interview_response_company',
  audience: 'company',
  routeKey: 'applications.interviews',
  routeParams: { id: interview.job_id || job._id || '', interviewId: interview._id || '' },
  params: { job: jobNameFrom(job), candidate: candidateNameFrom(candidate || application) },
  data: {
    interview_id: interview._id || '',
    application_id: interview.application_id || application._id || '',
    job_id: interview.job_id || job._id || '',
    status: interview.status || '',
  },
  dedupeKey: interview._id ? `interview:${interview._id}:response:${interview.status}` : null,
});

export const job_invitation_response_company_notification = ({ invitation = {}, job = {}, candidate = {} } = {}) => notifyUser({
  userId: getCompanyOwnerUserId(job),
  eventKey: 'job_invitation_response_company',
  audience: 'company',
  routeKey: 'applications.offers',
  routeParams: { id: invitation._id || '', invitationId: invitation._id || '' },
  params: { job: jobNameFrom(job), candidate: candidateNameFrom(candidate || invitation) },
  data: {
    invitation_id: invitation._id || '',
    job_id: invitation.job_id || job._id || '',
    employee_id: invitation.employee_id || '',
    candidate_user_id: invitation.user_id || '',
    status: invitation.status || '',
  },
  dedupeKey: invitation._id ? `job_invitation:${invitation._id}:response:${invitation.status}` : null,
});

export default {
  job_seeker_saved_notification,
  Job_created_notification,
  job_reviewed_notification,
  job_applied_notification,
  job_updated_notification,
  job_deleted_notification,
  job_stopped_notification,
  job_rated_notification,
  application_withdrawn_company_notification,
  interview_response_company_notification,
  job_invitation_response_company_notification,
};
