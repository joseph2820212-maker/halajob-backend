import fs from "fs";
import path from "path";

const CV_ROOT = path.resolve(process.cwd(), "cv");
const UPLOADS_ROOT = path.resolve(process.cwd(), "uploads");
const ALLOWED_ROOTS = [CV_ROOT, UPLOADS_ROOT];

const isInsideRoot = (filePath) => {
  const resolved = path.resolve(filePath);
  return ALLOWED_ROOTS.some((root) => resolved === root || resolved.startsWith(`${root}${path.sep}`));
};

const existsFile = (filePath) => {
  try {
    return Boolean(filePath && isInsideRoot(filePath) && fs.existsSync(filePath) && fs.statSync(filePath).isFile());
  } catch {
    return false;
  }
};

const safeFileName = (value = "cv.pdf") => {
  const name = path.basename(String(value || "cv.pdf")).replace(/[\r\n"\\/]+/g, "_");
  return name || "cv.pdf";
};

const stripUrlToPath = (value = "") => {
  const raw = String(value || "").trim();
  if (!raw) return "";

  try {
    if (/^https?:\/\//i.test(raw)) {
      return decodeURIComponent(new URL(raw).pathname || "");
    }
  } catch {
    return raw;
  }

  return decodeURIComponent(raw.split("?")[0].split("#")[0]);
};

const extContentType = (filePath = "") => {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === ".pdf") return "application/pdf";
  if (ext === ".doc") return "application/msword";
  if (ext === ".docx") return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
  if (ext === ".txt") return "text/plain; charset=utf-8";
  return "application/octet-stream";
};

const normalizeRawCvValue = (value) => {
  if (!value) return "";
  if (typeof value === "string") return value;
  return value.filePath || value.file_path || value.url || value.file || value.path || value.fileName || "";
};

export const sanitizeCvMeta = (entry = {}) => ({
  id: entry.id || entry.cv_id || entry._id || entry.source || "",
  source: entry.source || "employee_cv",
  title: entry.title || entry.fileName || "CV",
  fileName: safeFileName(entry.fileName || entry.title || "cv.pdf"),
  template_key: entry.template_key || "",
  status: entry.status || "active",
  createdAt: entry.createdAt || null,
});

export const collectApplicationCvEntries = (application = {}) => {
  const entries = [];

  if (application?.cv) {
    entries.push({
      id: "application",
      source: "application_cv",
      title: "Application CV",
      fileName: safeFileName(application.cv),
      raw: application.cv,
      status: "active",
    });
  }

  const employeeCvs = (application?.employee_id?.cvs || application?.employee?.cvs || []).filter(
    (cv) => !cv?.status || cv.status === "active"
  );

  for (const cv of employeeCvs) {
    const raw = normalizeRawCvValue(cv);
    if (!raw) continue;

    entries.push({
      id: String(cv?._id || cv?.id || raw),
      source: "employee_cv",
      title: cv?.title || cv?.fileName || "Employee CV",
      fileName: safeFileName(cv?.fileName || raw),
      template_key: cv?.template_key || "",
      status: cv?.status || "active",
      createdAt: cv?.createdAt || null,
      raw,
    });
  }

  const seen = new Set();
  return entries.filter((entry) => {
    const key = String(entry.raw || entry.id || "");
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

export const sanitizeCvEntries = (entries = []) => entries.map(sanitizeCvMeta);

export const sanitizeEmployeeCvs = (cvs = []) =>
  (cvs || [])
    .filter((cv) => !cv?.status || cv.status === "active")
    .map((cv) =>
      sanitizeCvMeta({
        id: String(cv?._id || cv?.id || ""),
        source: "employee_cv",
        title: cv?.title || cv?.fileName || "Employee CV",
        fileName: cv?.fileName || cv?.url || cv?.file || "cv.pdf",
        template_key: cv?.template_key || "",
        status: cv?.status || "active",
        createdAt: cv?.createdAt || null,
      })
    );

export const findCvEntry = (entries = [], selector = {}) => {
  const cvId = String(selector.cv_id || selector.cvId || selector.id || "").trim();
  const source = String(selector.source || "").trim();
  const index = Number(selector.cv_index ?? selector.index ?? -1);

  if (cvId) {
    const found = entries.find((entry) => String(entry.id || "") === cvId);
    if (found) return found;
  }

  if (source) {
    const found = entries.find((entry) => String(entry.source || "") === source);
    if (found) return found;
  }

  if (Number.isInteger(index) && index >= 0 && entries[index]) return entries[index];

  return entries[0] || null;
};

export const resolveCvFilePath = (cvValue) => {
  const raw = normalizeRawCvValue(cvValue);
  if (!raw) return null;

  const candidates = [];
  const rawPath = stripUrlToPath(raw).replace(/\\/g, "/");

  if (path.isAbsolute(rawPath)) candidates.push(rawPath);

  const clean = rawPath.replace(/^\/+/, "");
  const baseName = safeFileName(clean || raw);

  if (clean.startsWith("cv/")) candidates.push(path.join(process.cwd(), clean));
  if (clean.startsWith("uploads/")) candidates.push(path.join(process.cwd(), clean));
  if (clean.startsWith("tmp/cv/")) candidates.push(path.join(UPLOADS_ROOT, clean));

  const dashImageMatch = clean.match(/(?:^|\/)image(?:\/uploads)?\/([^/]+)$/);
  if (dashImageMatch?.[1]) {
    const name = safeFileName(dashImageMatch[1]);
    candidates.push(path.join(UPLOADS_ROOT, name));
    candidates.push(path.join(UPLOADS_ROOT, "files", name));
  }

  candidates.push(path.join(CV_ROOT, baseName));
  candidates.push(path.join(CV_ROOT, "cvUpload", baseName));
  candidates.push(path.join(UPLOADS_ROOT, "files", baseName));
  candidates.push(path.join(UPLOADS_ROOT, baseName));

  return [...new Set(candidates.map((item) => path.resolve(item)))].find(existsFile) || null;
};

export const sendCvFile = async ({ res, cvEntry, fallbackName = "cv.pdf", inline = false }) => {
  const filePath = resolveCvFilePath(cvEntry?.raw || cvEntry);
  if (!filePath) return false;

  const fileName = safeFileName(cvEntry?.fileName || fallbackName || filePath);
  res.setHeader("Content-Type", extContentType(filePath));
  res.setHeader("Content-Disposition", `${inline ? "inline" : "attachment"}; filename*=UTF-8''${encodeURIComponent(fileName)}`);
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Cache-Control", "private, no-store, max-age=0");

  return new Promise((resolve, reject) => {
    res.sendFile(filePath, (error) => {
      if (error) reject(error);
      else resolve(true);
    });
  });
};

const crcTable = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n += 1) {
    let c = n;
    for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c >>> 0;
  }
  return table;
})();

const crc32 = (buffer) => {
  let crc = 0xffffffff;
  for (const byte of buffer) crc = crcTable[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
};

const dosDateTime = (dateValue = new Date()) => {
  const date = new Date(dateValue);
  const year = Math.max(date.getFullYear(), 1980);
  const dosTime = (date.getHours() << 11) | (date.getMinutes() << 5) | Math.floor(date.getSeconds() / 2);
  const dosDate = ((year - 1980) << 9) | ((date.getMonth() + 1) << 5) | date.getDate();
  return { dosTime, dosDate };
};

const u16 = (value) => {
  const b = Buffer.alloc(2);
  b.writeUInt16LE(value & 0xffff, 0);
  return b;
};

const u32 = (value) => {
  const b = Buffer.alloc(4);
  b.writeUInt32LE(value >>> 0, 0);
  return b;
};

const uniqueZipName = (used, desired) => {
  const clean = safeFileName(desired || "cv.pdf");
  const ext = path.extname(clean) || ".pdf";
  const base = path.basename(clean, ext);
  let name = clean;
  let index = 2;
  while (used.has(name)) {
    name = `${base}-${index}${ext}`;
    index += 1;
  }
  used.add(name);
  return name;
};

export const createZipBuffer = async (files = []) => {
  const localParts = [];
  const centralParts = [];
  const usedNames = new Set();
  let offset = 0;

  for (const file of files) {
    const filePath = resolveCvFilePath(file.raw || file);
    if (!filePath) continue;

    const content = await fs.promises.readFile(filePath);
    const name = uniqueZipName(usedNames, file.zipName || file.fileName || filePath);
    const nameBuffer = Buffer.from(name, "utf8");
    const checksum = crc32(content);
    const { dosTime, dosDate } = dosDateTime(file.modifiedAt || new Date());

    const localHeader = Buffer.concat([
      u32(0x04034b50),
      u16(20),
      u16(0x0800),
      u16(0),
      u16(dosTime),
      u16(dosDate),
      u32(checksum),
      u32(content.length),
      u32(content.length),
      u16(nameBuffer.length),
      u16(0),
      nameBuffer,
    ]);

    localParts.push(localHeader, content);

    const centralHeader = Buffer.concat([
      u32(0x02014b50),
      u16(20),
      u16(20),
      u16(0x0800),
      u16(0),
      u16(dosTime),
      u16(dosDate),
      u32(checksum),
      u32(content.length),
      u32(content.length),
      u16(nameBuffer.length),
      u16(0),
      u16(0),
      u16(0),
      u16(0),
      u32(0),
      u32(offset),
      nameBuffer,
    ]);

    centralParts.push(centralHeader);
    offset += localHeader.length + content.length;
  }

  const centralSize = centralParts.reduce((sum, part) => sum + part.length, 0);
  const endRecord = Buffer.concat([
    u32(0x06054b50),
    u16(0),
    u16(0),
    u16(centralParts.length),
    u16(centralParts.length),
    u32(centralSize),
    u32(offset),
    u16(0),
  ]);

  return Buffer.concat([...localParts, ...centralParts, endRecord]);
};

export const makeZipEntryName = ({ application, cvEntry, index = 1 }) => {
  const first = application?.user_id?.first_name || application?.first_name || "applicant";
  const last = application?.user_id?.last_name || application?.last_name || "";
  const appId = String(application?._id || "").slice(-6) || String(index);
  const name = [first, last].filter(Boolean).join("_").replace(/[^a-zA-Z0-9\u0600-\u06FF_-]+/g, "_");
  const fileName = safeFileName(cvEntry?.fileName || `cv-${index}.pdf`);
  const ext = path.extname(fileName) || ".pdf";
  const base = path.basename(fileName, ext).replace(/[^a-zA-Z0-9\u0600-\u06FF_-]+/g, "_");
  return `${index}_${name}_${appId}_${base}${ext}`;
};
