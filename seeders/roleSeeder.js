import dotenv from 'dotenv';
import { PermissionModel, RoleModel } from '../models/index.js';
import { ALL_DASH_PERMISSIONS, PERMISSIONS } from '../constants/permissions.js';

dotenv.config();

const getPermissionsIds = async (keys = []) => {
  const permissions = await PermissionModel.find({ key: { $in: keys.filter(Boolean) } }).select('_id key').lean();
  return permissions.map((permission) => permission._id);
};

export const seedRoles = async () => {
  try {
    const adminPermissions = await getPermissionsIds(ALL_DASH_PERMISSIONS);
    const serviceEmployeePermissions = await getPermissionsIds([
      PERMISSIONS.DASHBOARD_READ,
      PERMISSIONS.DASHBOARD_TRACKING,
      PERMISSIONS.GLOBAL_SEARCH,
      PERMISSIONS.USERS_READ,
      PERMISSIONS.COMPANIES_READ,
      PERMISSIONS.COMPANIES_UPDATE,
      PERMISSIONS.COMPANY_REQUESTS_READ,
      PERMISSIONS.COMPANY_REQUESTS_APPROVE,
      PERMISSIONS.EMPLOYEES_READ,
      PERMISSIONS.JOBS_READ,
      PERMISSIONS.JOBS_UPDATE,
      PERMISSIONS.JOB_APPROVALS_READ,
      PERMISSIONS.JOB_APPROVALS_APPROVE,
      PERMISSIONS.APPLICATIONS_READ,
      PERMISSIONS.INTERVIEWS_READ,
      PERMISSIONS.INVITATIONS_READ,
      PERMISSIONS.TALENT_REQUESTS_READ,
      PERMISSIONS.TALENT_REQUESTS_UPDATE,
      PERMISSIONS.REPORTS_READ,
      PERMISSIONS.REPORTS_UPDATE,
      PERMISSIONS.REVIEWS_READ,
      PERMISSIONS.REVIEWS_UPDATE,
      PERMISSIONS.LOOKUPS_READ,
      PERMISSIONS.CONTENT_READ,
      PERMISSIONS.SUBSCRIPTIONS_READ,
      PERMISSIONS.COMPANY_SUBSCRIPTIONS_READ,
    ]);
    const roles = [
      {
        name: 'admin',
        role_number: 1,
        log_to: 'dash',
        title_ar: 'مدير النظام',
        title_en: 'System Admin',
        is_system: true,
        permissions: adminPermissions,
      },
      {
        name: 'our_employee',
        role_number: 2,
        log_to: 'dash',
        title_ar: 'موظف النظام',
        title_en: 'Dashboard Employee',
        is_system: true,
        permissions: serviceEmployeePermissions,
      },
      {
        name: 'company',
        role_number: 3,
        log_to: 'company',
        title_ar: 'شركة',
        title_en: 'Company',
        is_system: true,
        permissions: [],
      },
      {
        name: 'employee',
        role_number: 4,
        log_to: 'employee',
        title_ar: 'موظف',
        title_en: 'Employee',
        is_system: true,
        permissions: [],
      },
    ];

    for (const role of roles) {
      await RoleModel.updateOne(
        { name: role.name },
        { $set: { ...role, status: true } },
        { upsert: true }
      );
    }

    console.log('✅ Roles seeded successfully');
  } catch (error) {
    console.error('❌ Seeder error:', error);
    throw error;
  }
};
