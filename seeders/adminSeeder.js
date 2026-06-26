import bcrypt from "bcryptjs";
import { UserModel, RoleModel } from "../models/index.js";

const buildSeedAdmins = () => {
 const allowCreate = String(process.env.SEED_ADMIN_ALLOW_CREATE || "").trim().toLowerCase() === "true";
 const email = process.env.SEED_ADMIN_EMAIL;
 const password = process.env.SEED_ADMIN_PASSWORD;

 if (!allowCreate || !email || !password) return [];

 return [
  {
   first_name: process.env.SEED_ADMIN_FIRST_NAME || "admin",
   mid_name: null,
   last_name: process.env.SEED_ADMIN_LAST_NAME || "user",
   email,
   password,
   lan: "en",
   gender: "male",
   status: true,
   phone: process.env.SEED_ADMIN_PHONE_E164 || "+963999999999",
   phone_e164: process.env.SEED_ADMIN_PHONE_E164 || "+963999999999",
   phone_country: process.env.SEED_ADMIN_PHONE_COUNTRY || "SY",
   phone_code: process.env.SEED_ADMIN_PHONE_CODE || "+963",
   phone_national: process.env.SEED_ADMIN_PHONE_NATIONAL || "999999999",
   permissions: [],
   device: [],
  },
 ];
};

export const seedAdmins = async () => {
 const admins = buildSeedAdmins();
 if (!admins.length) {
  console.log("Admin seeding skipped. Set SEED_ADMIN_ALLOW_CREATE=true with SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD to create an admin.");
  return;
 }

 const adminRole = await RoleModel.findOne({ log_to: "dash" });

 if (!adminRole) {
  throw new Error("Admin role not found. Please run roles seeder first.");
 }

 for (const admin of admins) {
  const hashedPassword = await bcrypt.hash(admin.password, 10);

  await UserModel.updateOne(
   { email: admin.email },
   {
    $setOnInsert: {
     ...admin,
     password: hashedPassword,
     role_id: adminRole._id,
    },
   },
   { upsert: true }
  );
 }

 console.log("✅ Admins seeded successfully");
};
