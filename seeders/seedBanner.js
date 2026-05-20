import fs from "fs";
import path from "path";
import dotenv from "dotenv";

import { BannerModel } from "../models/index.js";
import { processUploadImage } from "../services/imageService.js";

dotenv.config();

const BANNERS_DIR = path.join(process.cwd(), "seeders/banner");

const allowedImages = [".png", ".jpg", ".jpeg", ".webp", ".svg"];

const TMP_DIR = path.join(process.cwd(), "uploads/tmp/seed-banners");

const ensureDir = (dir) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
};

const buildMulterLikeFile = async (fileName) => {
  ensureDir(TMP_DIR);

  const originalPath = path.join(BANNERS_DIR, fileName);
  const ext = path.extname(fileName);
  const safeBaseName = path
    .basename(fileName, ext)
    .replace(/[^a-zA-Z0-9_-]/g, "_");

  const tempFileName = `${Date.now()}-${safeBaseName}${ext}`;
  const tempPath = path.join(TMP_DIR, tempFileName);

  await fs.promises.copyFile(originalPath, tempPath);

  return {
    path: tempPath,
    originalname: fileName,
    filename: tempFileName,
  };
};

const buildTitle = (fileName) => {
 const name = path
  .basename(fileName, path.extname(fileName))
  .replace(/[-_]/g, " ")
  .trim();

 return {
  title_ar: name || "بنر",
  title_en: name || "Banner",
 };
};

export const seedBanners = async () => {
 try {
  if (!fs.existsSync(BANNERS_DIR)) {
   throw new Error(`Banner folder not found: ${BANNERS_DIR}`);
  }

  const files = fs
   .readdirSync(BANNERS_DIR)
   .filter((file) => allowedImages.includes(path.extname(file).toLowerCase()));

  console.log(`Found ${files.length} banner images`);

  if (!files.length) return;

  await BannerModel.deleteMany({});

  for (const fileName of files) {
  const file = await buildMulterLikeFile(fileName);

   const imagePath = await processUploadImage(file, {
    targetDir: "banner",
    webpQuality: 82,
   });

   if (!imagePath) {
    console.log(`⚠️ Skipped banner, image not processed: ${fileName}`);
    continue;
   }

   const title = buildTitle(fileName);
   await BannerModel.deleteMany();
   await BannerModel.create({
    title_ar: title.title_ar,
    title_en: title.title_en,
    image: imagePath,
   });

   console.log(`✅ Seeded banner: ${fileName}`);
  }

  console.log("✅ Banner seeding completed");
 } catch (error) {
  console.error("❌ Banner seeder error:", error);
  throw error;
 }
};

export default seedBanners;