import express from 'express';
import fs from 'fs';
import path from 'path';

import authRoute from './authRoute.js';
import exselRoute from './exselRoute.js';
import keywordRoute from './keywordRoute.js';
import dashboardRoute from './DashboardRoute.js';
import dashboardController from '../controllers/dash/adminDashboardController.js';
import adminModerationController from '../controllers/dash/adminModerationController.js';
import adminOperationsController from '../controllers/dash/adminOperationsController.js';
import adminSearchController from '../controllers/dash/adminSearchController.js';
import resourceController from '../controllers/dash/adminResourceController.js';
import TrustAdminController from '../controllers/trust/TrustAdminController.js';
import AiAdminController from '../controllers/ai/AiAdminController.js';
import campusController from '../controllers/app/campus/campusController.js';
import cvRoute from './cvRoute.js';
import { createDashResourceRouter } from './dashResourceRouteFactory.js';
import multer from '../utils/multer.js';
import { isAdmin } from '../middlewares/isAdmin.js';
import { checkPermission, checkResourcePermission } from '../middlewares/checkPermission.js';

const FILES_DIRECTORY = path.resolve(process.env.FILES_DIRECTORY || './uploads');
const router = express.Router();
const upload = multer;
const can = checkPermission;

const PUBLIC_IMAGE_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.svg']);
const DOCUMENT_EXTENSIONS = new Set(['.pdf']);

const sendDashboardFile = ({ allowDocuments = false } = {}) => (req, res) => {
  const fileName = req.params.name;

  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');

  if (!fileName || fileName.includes('..') || fileName.includes('/') || fileName.includes('\\')) {
    return res.status(400).json({ status: false, message: 'invalid_file_name' });
  }

  const extension = path.extname(fileName).toLowerCase();
  const isDocument = DOCUMENT_EXTENSIONS.has(extension);

  if (!allowDocuments && !PUBLIC_IMAGE_EXTENSIONS.has(extension)) {
    return res.status(403).json({ status: false, message: 'file_access_forbidden' });
  }

  res.setHeader('X-Content-Type-Options', 'nosniff');
  if (extension === '.svg') {
    res.setHeader('Content-Security-Policy', "default-src 'none'; img-src data:; style-src 'unsafe-inline'");
  }

  const baseDirectory = isDocument ? path.join(FILES_DIRECTORY, 'files') : FILES_DIRECTORY;
  const filePath = path.resolve(baseDirectory, fileName);

  if (!filePath.startsWith(path.resolve(baseDirectory) + path.sep)) {
    return res.status(400).json({ status: false, message: 'invalid_file_name' });
  }

  fs.access(filePath, fs.constants.F_OK, (err) => {
    if (err) return res.status(404).json({ status: false, message: 'file_not_found' });
    return res.sendFile(filePath, (sendErr) => {
      if (sendErr && !res.headersSent) {
        return res.status(500).json({ status: false, message: 'failed_to_send_file' });
      }
      return undefined;
    });
  });
};

/* ----------------------------- Public dashboard auth/files ----------------------------- */
router.use('/auth', authRoute);
router.get('/image/:name', sendDashboardFile());
router.get('/image/uploads/:name', sendDashboardFile());

/* ----------------------------- Protected dashboard area ----------------------------- */
router.use(isAdmin);

router.get('/file/:name', sendDashboardFile({ allowDocuments: true }));

router.use('/dashboard', can('dashboard.view'), dashboardRoute);
router.use('/statistics', can('dashboard.view'), dashboardRoute);
router.use('/project_status/global', can('dashboard.view'), dashboardRoute);
router.get('/tracking', can('dashboard.view'), dashboardController.tracking);
router.get('/activity', can('dashboard.view'), dashboardController.tracking);
router.get('/search/global', can('dashboard.search'), adminSearchController.globalSearch);
router.get('/global-search', can('dashboard.search'), adminSearchController.globalSearch);

/* ----------------------------- AI administration ----------------------------- */
router.get('/ai/features', can('ai.view'), AiAdminController.listFeatures);
router.get('/ai/limits', can('ai.view'), AiAdminController.listLimits);
router.post('/ai/limits', can('ai.manage'), upload.none(), AiAdminController.upsertLimit);
router.patch('/ai/limits/:id', can('ai.manage'), upload.none(), AiAdminController.updateLimit);
router.delete('/ai/limits/:id', can('ai.manage'), AiAdminController.deactivateLimit);
router.get('/ai/requests', can('ai.view'), AiAdminController.listRequests);
router.get('/ai/requests/:id', can('ai.view'), AiAdminController.getRequest);
router.get('/ai/summary', can('ai.view'), AiAdminController.summary);
router.get('/ai/usage/summary', can('ai.view'), AiAdminController.summary);

/* ----------------------------- Operations logs / review readers ----------------------------- */
router.get('/audit-logs', can('audit.view'), adminOperationsController.listAuditLogs);
router.get('/operations/audit-logs', can('audit.view'), adminOperationsController.listAuditLogs);
router.get('/translations', can('translations.view'), adminOperationsController.listTranslations);
router.get('/translation-logs', can('translations.view'), adminOperationsController.listTranslations);
router.get('/notifications/logs', can('notifications.view'), adminOperationsController.listNotificationLogs);
router.get('/notification-logs', can('notifications.view'), adminOperationsController.listNotificationLogs);

/* ----------------------------- Moderation / operations queues ----------------------------- */
router.get('/moderation/company-requests', can('companies.moderate'), adminModerationController.listCompanyRequests);
router.get('/company-requests', can('companies.moderate'), adminModerationController.listCompanyRequests);
router.post('/company-requests/:id/approve', can('companies.moderate'), upload.none(), adminModerationController.approveCompanyRequest);
router.post('/company-requests/:id/reject', can('companies.moderate'), upload.none(), adminModerationController.rejectCompanyRequest);
router.patch('/company-requests/:id/approve', can('companies.moderate'), upload.none(), adminModerationController.approveCompanyRequest);
router.patch('/company-requests/:id/reject', can('companies.moderate'), upload.none(), adminModerationController.rejectCompanyRequest);

router.get('/moderation/jobs', can('jobs.moderate'), adminModerationController.listJobReviewQueue);
router.get('/job-approvals', can('jobs.moderate'), adminModerationController.listJobReviewQueue);
router.post('/jobs/:id/approve', can('jobs.moderate'), upload.none(), adminModerationController.approveJob);
router.post('/jobs/:id/reject', can('jobs.moderate'), upload.none(), adminModerationController.rejectJob);
router.patch('/jobs/:id/approve', can('jobs.moderate'), upload.none(), adminModerationController.approveJob);
router.patch('/jobs/:id/reject', can('jobs.moderate'), upload.none(), adminModerationController.rejectJob);

router.get('/trust/review-queue', can('trust.view'), TrustAdminController.reviewQueue);
router.post('/trust/jobs/:jobId/mark-safe', can('trust.manage'), upload.none(), TrustAdminController.markJobSafe);
router.patch('/trust/jobs/:jobId/mark-safe', can('trust.manage'), upload.none(), TrustAdminController.markJobSafe);
router.post('/trust/jobs/:jobId/suspend', can('trust.manage'), upload.none(), TrustAdminController.suspendJob);
router.patch('/trust/jobs/:jobId/suspend', can('trust.manage'), upload.none(), TrustAdminController.suspendJob);
router.post('/trust/jobs/:jobId/request-documents', can('trust.manage'), upload.none(), TrustAdminController.requestDocuments);
router.patch('/trust/jobs/:jobId/request-documents', can('trust.manage'), upload.none(), TrustAdminController.requestDocuments);

router.get('/operations/talent-requests', can('talentrequests.manage'), adminModerationController.listTalentRequests);
router.get('/talent-requests', can('talentrequests.manage'), adminModerationController.listTalentRequests);
router.patch('/talent-requests/:id/status', can('talentrequests.manage'), upload.none(), adminModerationController.updateTalentRequestStatus);
router.post('/talent-requests/:id/status', can('talentrequests.manage'), upload.none(), adminModerationController.updateTalentRequestStatus);

router.post('/subscriptions/seed-free', can('subscriptions.manage'), upload.none(), adminModerationController.seedFreePlan);
router.get('/subscriptions/companies/:companyId', can('subscriptions.manage'), adminModerationController.getCompanySubscription);
router.post('/subscriptions/companies/:companyId/assign-plan', can('subscriptions.manage'), upload.none(), adminModerationController.assignSubscriptionPlan);

/* ----------------------------- Legacy upload/import routes ----------------------------- */
router.use('/exsel', exselRoute);
router.use('/excel', exselRoute);
router.use('/import', exselRoute);

/* ----------------------------- Special routes ----------------------------- */
router.use('/Keyword', keywordRoute);
router.use('/keyword', keywordRoute);
router.use('/cv', cvRoute);
router.use('/cv-template', createDashResourceRouter('cvtemplates'));
router.use('/cv-templates', createDashResourceRouter('cvtemplates'));

/* ----------------------------- Legacy resource aliases used by old dashboard ----------------------------- */
router.use('/Role', createDashResourceRouter('roles'));
router.use('/roles', createDashResourceRouter('roles'));
router.use('/Permission', createDashResourceRouter('permissions'));
router.use('/permissions', createDashResourceRouter('permissions'));
router.use('/User', createDashResourceRouter('users'));
router.use('/Users', createDashResourceRouter('users'));
router.use('/users', createDashResourceRouter('users'));
router.use('/Admin', createDashResourceRouter('admins'));
router.use('/Admins', createDashResourceRouter('admins'));
router.use('/admins', createDashResourceRouter('admins'));
router.use('/Employee', createDashResourceRouter('employees'));
router.use('/Employees', createDashResourceRouter('employees'));
router.use('/employees', createDashResourceRouter('employees'));
router.use('/Company', createDashResourceRouter('companies'));
router.use('/Companies', createDashResourceRouter('companies'));
router.use('/companies', createDashResourceRouter('companies'));
router.use('/CompanyReview', createDashResourceRouter('companyreviews'));
router.use('/company-reviews', createDashResourceRouter('companyreviews'));
router.use('/Industry', createDashResourceRouter('industries'));
router.use('/industries', createDashResourceRouter('industries'));

router.use('/Job', createDashResourceRouter('jobs'));
router.use('/Jobs', createDashResourceRouter('jobs'));
router.use('/jobs', createDashResourceRouter('jobs'));
router.use('/JobName', createDashResourceRouter('jobnames'));
router.use('/job-names', createDashResourceRouter('jobnames'));
router.use('/JobService', createDashResourceRouter('jobservices'));
router.use('/job-services', createDashResourceRouter('jobservices'));
router.use('/JobType', createDashResourceRouter('jobtypes'));
router.use('/job-types', createDashResourceRouter('jobtypes'));
router.use('/JobSalary', createDashResourceRouter('jobsalaries'));
router.use('/job-salaries', createDashResourceRouter('jobsalaries'));
router.use('/WorkTime', createDashResourceRouter('worktime'));
router.use('/work-times', createDashResourceRouter('worktime'));
router.use('/WorkMode', createDashResourceRouter('workmodes'));
router.use('/work-modes', createDashResourceRouter('workmodes'));
router.use('/WorkLocation', createDashResourceRouter('worklocations'));
router.use('/work-locations', createDashResourceRouter('worklocations'));


router.use('/ApplicationHistory', createDashResourceRouter('applicationhistory'));
router.use('/application-history', createDashResourceRouter('applicationhistory'));
router.use('/OutsideApplication', createDashResourceRouter('outsideapplications'));
router.use('/outside-applications', createDashResourceRouter('outsideapplications'));
router.use('/JobMatch', createDashResourceRouter('jobmatches'));
router.use('/job-matches', createDashResourceRouter('jobmatches'));
router.use('/JobEmployeeMatch', createDashResourceRouter('jobemployeematches'));
router.use('/job-employee-matches', createDashResourceRouter('jobemployeematches'));
router.use('/Rating', createDashResourceRouter('ratings'));
router.use('/ratings', createDashResourceRouter('ratings'));
router.use('/Review', createDashResourceRouter('reviews'));
router.use('/reviews', createDashResourceRouter('reviews'));
router.use('/SavedJob', createDashResourceRouter('savedjobs'));
router.use('/saved-jobs', createDashResourceRouter('savedjobs'));
router.use('/ShownJob', createDashResourceRouter('shownjobs'));
router.use('/shown-jobs', createDashResourceRouter('shownjobs'));
router.use('/EmployeeCv', createDashResourceRouter('employeecvs'));
router.use('/employee-cvs', createDashResourceRouter('employeecvs'));
router.use('/UserResume', createDashResourceRouter('userresumes'));
router.use('/user-resumes', createDashResourceRouter('userresumes'));
router.use('/Application', createDashResourceRouter('applications'));
router.use('/Applications', createDashResourceRouter('applications'));
router.use('/applications', createDashResourceRouter('applications'));
router.use('/Interview', createDashResourceRouter('interviews'));
router.use('/Interviews', createDashResourceRouter('interviews'));
router.use('/interviews', createDashResourceRouter('interviews'));
router.use('/Invitation', createDashResourceRouter('invitations'));
router.use('/Invitations', createDashResourceRouter('invitations'));
router.use('/invitations', createDashResourceRouter('invitations'));
router.use('/Report', createDashResourceRouter('jobreports'));
router.use('/Reports', createDashResourceRouter('jobreports'));
router.use('/JobReport', createDashResourceRouter('jobreports'));
router.use('/reports', createDashResourceRouter('jobreports'));
router.use('/TalentRequest', createDashResourceRouter('talentrequests'));
router.use('/talent-requests', createDashResourceRouter('talentrequests'));
router.use('/University', createDashResourceRouter('universities'));
router.use('/Universities', createDashResourceRouter('universities'));
router.use('/universities', createDashResourceRouter('universities'));
router.get('/campus/universities', can('universities.read'), campusController.listUniversities);
router.post('/campus/universities', can('universities.manage'), upload.none(), campusController.createUniversity);
router.patch('/campus/universities/:id/status', can('universities.manage'), upload.none(), campusController.updateUniversityStatus);

router.use('/Country', createDashResourceRouter('countries'));
router.use('/countries', createDashResourceRouter('countries'));
router.use('/Currency', createDashResourceRouter('currencies'));
router.use('/currencies', createDashResourceRouter('currencies'));
router.use('/Language', createDashResourceRouter('languages'));
router.use('/languages', createDashResourceRouter('languages'));
router.use('/Skill', createDashResourceRouter('skills'));
router.use('/skills', createDashResourceRouter('skills'));
router.use('/EducationLevel', createDashResourceRouter('educationlevels'));
router.use('/education-levels', createDashResourceRouter('educationlevels'));
router.use('/ExperienceLevel', createDashResourceRouter('experiencelevels'));
router.use('/experience-levels', createDashResourceRouter('experiencelevels'));

router.use('/Color', createDashResourceRouter('colors'));
router.use('/colors', createDashResourceRouter('colors'));
router.use('/Font', createDashResourceRouter('fonts'));
router.use('/fonts', createDashResourceRouter('fonts'));
router.use('/Resume', createDashResourceRouter('resumes'));
router.use('/resumes', createDashResourceRouter('resumes'));
router.use('/Banner', createDashResourceRouter('banners'));
router.use('/Banners', createDashResourceRouter('banners'));
router.use('/banners', createDashResourceRouter('banners'));
router.use('/Page', createDashResourceRouter('pages'));
router.use('/Pages', createDashResourceRouter('pages'));
router.use('/pages', createDashResourceRouter('pages'));
router.use('/Notification', createDashResourceRouter('notifications'));
router.use('/notifications', createDashResourceRouter('notifications'));
router.use('/FcmToken', createDashResourceRouter('fcmtokens'));
router.use('/fcm-tokens', createDashResourceRouter('fcmtokens'));
router.use('/SearchHistory', createDashResourceRouter('searchhistory'));
router.use('/search-history', createDashResourceRouter('searchhistory'));

router.use('/SubscriptionPlan', createDashResourceRouter('subscriptionplans'));
router.use('/SubscriptionPlans', createDashResourceRouter('subscriptionplans'));
router.use('/subscription-plans', createDashResourceRouter('subscriptionplans'));
router.use('/CompanySubscription', createDashResourceRouter('companysubscriptions'));
router.use('/CompanySubscriptions', createDashResourceRouter('companysubscriptions'));
router.use('/company-subscriptions', createDashResourceRouter('companysubscriptions'));
router.use('/Settings', createDashResourceRouter('settings'));
router.use('/settings', createDashResourceRouter('settings'));

/* ----------------------------- Generic API for new dashboard screens ----------------------------- */
router.get('/resources/:resource', checkResourcePermission('read'), resourceController.list());
router.get('/resources/:resource/:id', checkResourcePermission('read'), resourceController.getOne());
router.post('/resources/:resource/bulk-update', checkResourcePermission('update'), upload.none(), resourceController.bulkUpdate());
router.patch('/resources/:resource/bulk-update', checkResourcePermission('update'), upload.none(), resourceController.bulkUpdate());
router.post('/resources/:resource', checkResourcePermission('create'), upload.any(), resourceController.create());
router.put('/resources/:resource/:id', checkResourcePermission('update'), upload.any(), resourceController.update());
router.patch('/resources/:resource/:id', checkResourcePermission('update'), upload.any(), resourceController.update());
router.delete('/resources/:resource/:id', checkResourcePermission('delete'), resourceController.remove());
router.post('/resources/:resource/:id/approve', checkResourcePermission('approve'), upload.none(), resourceController.approve());
router.post('/resources/:resource/:id/reject', checkResourcePermission('reject'), upload.none(), resourceController.reject());

export default router;
