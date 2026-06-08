import { PermissionModel } from '../models/index.js';
import { PERMISSIONS } from '../constants/permissions.js';

const titleize = (key = '') => key.replace(/\./g, ' ').replace(/_/g, ' ');

const permissionDefinitions = Object.values(PERMISSIONS).map((key) => {
  const [group = 'general', action = 'manage'] = key.split('.');
  return {
    key,
    group,
    action,
    title_ar: titleize(key),
    title_en: titleize(key),
    description_ar: titleize(key),
    description_en: titleize(key),
    status: true,
  };
});

export const seedPermissions = async () => {
  for (const permission of permissionDefinitions) {
    await PermissionModel.updateOne(
      { key: permission.key },
      { $set: permission },
      { upsert: true }
    );
  }

  console.log('✅ Permissions seeded successfully');
};
