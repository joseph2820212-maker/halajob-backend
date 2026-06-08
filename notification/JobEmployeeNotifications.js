import { applicationStatusEventKey, jobNameFrom, notifyUser } from './notificationService.js';

const statusRouteKey = (status = '') => {
  const value = String(status || '').trim().toLowerCase();
  if (value === 'interview') return 'applications.interviews';
  if (value === 'offer') return 'applications.offers';
  if (value === 'rejected') return 'applications.rejected';
  return 'applications.status';
};

export async function changeJobStatus(status, job = {}) {
  const jobId = job.job_id || job._id || job.id || '';
  const applicationId = job.application_id || '';
  return notifyUser({
    userId: job.user_id,
    eventKey: applicationStatusEventKey(status),
    audience: 'employee',
    routeKey: statusRouteKey(status),
    routeParams: { id: jobId, jobId, applicationId },
    params: { job: jobNameFrom(job) },
    data: {
      job_id: jobId,
      application_id: applicationId,
      status,
    },
    dedupeKey: applicationId ? `application:${applicationId}:status:${status}` : null,
  });
}

export async function SendInterViewNotification(job = {}) {
  const jobId = job.job_id || job._id || job.id || '';
  const applicationId = job.application_id || '';

  return notifyUser({
    userId: job.user_id,
    eventKey: 'interview_scheduled',
    audience: 'employee',
    routeKey: 'applications.interviews',
    routeParams: { id: jobId, jobId, applicationId, interviewId: job.interview_id || '' },
    params: { job: jobNameFrom(job) },
    data: {
      job_id: jobId,
      application_id: applicationId,
      interview_id: job.interview_id || '',
      meet_link: job.meet_link || '',
      date: job.date ? new Date(job.date).toISOString() : '',
      start_at: job.start_at ? new Date(job.start_at).toISOString() : '',
      end_at: job.end_at ? new Date(job.end_at).toISOString() : '',
      interview_type: job.type || '',
      is_online: Boolean(job.is_online),
      is_on_app: Boolean(job.is_on_app),
      is_in_office: Boolean(job.is_in_office),
      office_address: job.office_address || '',
      note: job.note || '',
      longitude: job.longitude ?? '',
      latitude: job.latitude ?? '',
    },
    dedupeKey: job.interview_id ? `interview:${job.interview_id}:scheduled` : null,
  });
}

export async function SendInterviewUpdatedNotification(job = {}) {
  return notifyUser({
    userId: job.user_id,
    eventKey: 'interview_updated',
    audience: 'employee',
    routeKey: 'applications.interviews',
    routeParams: { id: job.job_id || job._id || '', interviewId: job.interview_id || '' },
    params: { job: jobNameFrom(job) },
    data: job,
    dedupeKey: job.interview_id ? `interview:${job.interview_id}:updated:${Date.now()}` : null,
  });
}

export async function SendInterviewCancelledNotification(job = {}) {
  return notifyUser({
    userId: job.user_id,
    eventKey: 'interview_cancelled',
    audience: 'employee',
    routeKey: 'applications.interviews',
    routeParams: { id: job.job_id || job._id || '', interviewId: job.interview_id || '' },
    params: { job: jobNameFrom(job) },
    data: job,
    dedupeKey: job.interview_id ? `interview:${job.interview_id}:cancelled` : null,
  });
}

export async function SendJobInvitationNotification(invitation = {}) {
  const job = invitation.job_id || invitation.job || {};
  const company = invitation.company || invitation.company_id || {};

  return notifyUser({
    userId: invitation.user_id,
    eventKey: 'job_invitation_sent',
    audience: 'employee',
    routeKey: 'applications.offers',
    routeParams: { id: invitation._id || invitation.id || '', invitationId: invitation._id || invitation.id || '' },
    params: {
      job: jobNameFrom(job),
      company: company.company_name || company.name || invitation.company_name || 'Company',
    },
    data: {
      invitation_id: invitation._id || invitation.id || '',
      job_id: job._id || invitation.job_id || '',
      company_id: company._id || invitation.company_id || '',
      status: invitation.status || 'sent',
    },
    dedupeKey: invitation._id ? `job_invitation:${invitation._id}:sent` : null,
  });
}

export async function SendJobInvitationCancelledNotification(invitation = {}) {
  const job = invitation.job_id || invitation.job || {};

  return notifyUser({
    userId: invitation.user_id,
    eventKey: 'job_invitation_cancelled',
    audience: 'employee',
    routeKey: 'applications.offers',
    routeParams: { id: invitation._id || invitation.id || '', invitationId: invitation._id || invitation.id || '' },
    params: { job: jobNameFrom(job) },
    data: {
      invitation_id: invitation._id || invitation.id || '',
      job_id: job._id || invitation.job_id || '',
      company_id: invitation.company_id || '',
      status: invitation.status || 'cancelled',
    },
    dedupeKey: invitation._id ? `job_invitation:${invitation._id}:cancelled` : null,
  });
}

export default {
  changeJobStatus,
  SendInterViewNotification,
  SendInterviewUpdatedNotification,
  SendInterviewCancelledNotification,
  SendJobInvitationNotification,
  SendJobInvitationCancelledNotification,
};
