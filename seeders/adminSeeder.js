import bcrypt from "bcryptjs";
import { UserModel, RoleModel } from "../models/index.js";

const admins = [
 {
  first_name: "jobzain",
  mid_name: null,
  last_name: "admin",
  email: "admin@gmail.com",
  password: "Admin@123456",
  lan: "en",
  gender: "male",
  status: true,
  phone: "+963999999999",
  phone_e164: "+963999999999",
  phone_country: "SY",
  phone_code: "+963",
  phone_national: "999999999",
  permissions: [],
  device: [],
 },
];

export const seedAdmins = async () => {
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