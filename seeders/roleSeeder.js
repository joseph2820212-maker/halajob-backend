import mongoose from "mongoose";
import dotenv from "dotenv";
import {
  RoleModel,
  PermissionModel,
} from "../models/index.js";

import { PERMISSIONS } from "../constants/permissions.js";

dotenv.config();

export const seedRoles = async () => {
  try {
    // =========================
    // Permissions
    // =========================

    const allPermissions = await PermissionModel.find({
      key: { $in: Object.values(PERMISSIONS) },
    });

    const getPermissionsIds = (keys = []) => {
      return allPermissions
        .filter((permission) => keys.includes(permission.key))
        .map((permission) => permission._id);
    };

    // =========================
    // Roles
    // =========================

    const roles = [
      {
        name: "admin",
        role_number: 1,

        log_to: "dash",

        title_ar: "مدير النظام",
        title_en: "System Admin",

        is_system: true,

        permissions: getPermissionsIds([
          PERMISSIONS.USERS_READ,
          PERMISSIONS.USERS_CREATE,
          PERMISSIONS.USERS_UPDATE,
          PERMISSIONS.USERS_DELETE,

          PERMISSIONS.ROLES_READ,
          PERMISSIONS.ROLES_CREATE,
          PERMISSIONS.ROLES_UPDATE,
          PERMISSIONS.ROLES_DELETE,

          PERMISSIONS.PERMISSIONS_READ,
          PERMISSIONS.PERMISSIONS_CREATE,
          PERMISSIONS.PERMISSIONS_UPDATE,
          PERMISSIONS.PERMISSIONS_DELETE,

          PERMISSIONS.DASHBOARD_READ,
        ]),
      },

      {
        name: "our_employee",
        role_number: 2,

        log_to: "dash",

        title_ar: "موظف النظام",
        title_en: "Dashboard Employee",

        is_system: true,

        permissions: getPermissionsIds([
          PERMISSIONS.USERS_READ,
          PERMISSIONS.DASHBOARD_READ,
        ]),
      },

      {
        name: "company",
        role_number: 3,

        log_to: "company",

        title_ar: "شركة",
        title_en: "Company",

        is_system: true,

        permissions: [],
      },

      {
        name: "employee",
        role_number: 4,

        log_to: "employee",

        title_ar: "موظف",
        title_en: "Employee",

        is_system: true,

        permissions: [],
      },
    ];

    // =========================
    // Insert / Update
    // =========================

    for (const role of roles) {
      await RoleModel.updateOne(
        { name: role.name },
        {
          $set: {
            log_to: role.log_to,

            role_number: role.role_number,

            title_ar: role.title_ar,
            title_en: role.title_en,

            permissions: role.permissions,

            is_system: role.is_system,

            status: true,
          },
        },
        {
          upsert: true,
        }
      );
    }

    console.log("✅ Roles seeded successfully");
  } catch (error) {
    console.error("❌ Seeder error:", error);
    throw error;
  }
};