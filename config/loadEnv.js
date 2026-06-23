import fs from "fs";
import path from "path";
import dotenv from "dotenv";

const nodeEnv = String(process.env.NODE_ENV || "").trim();
const originalEnvKeys = new Set(Object.keys(process.env));
const envFiles = [
  ".env",
  ".env.local",
  nodeEnv ? `.env.${nodeEnv}` : null,
  nodeEnv ? `.env.${nodeEnv}.local` : null,
].filter(Boolean);

for (const fileName of envFiles) {
  const filePath = path.resolve(process.cwd(), fileName);
  if (!fs.existsSync(filePath)) continue;

  const parsed = dotenv.parse(fs.readFileSync(filePath));
  for (const [key, value] of Object.entries(parsed)) {
    if (originalEnvKeys.has(key)) continue;
    process.env[key] = value;
  }
}
