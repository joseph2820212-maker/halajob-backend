import { CompanyModel, RoleModel } from "../../../models/index.js";
import ReturnAppData from "../../../helper/ReturnAppData/index.js";
import path from "path";
import fs from "fs/promises";
import { existsSync } from "fs";

const UPLOADS_ROOT = path.resolve("uploads");
const DOCS_DIR = "files"; // مستعمل عادةً للـ pdf/doc
const DEFAULT_DIR = "";   // صور/مرفقات أخرى في جذر uploads

// يحدد مجلد التخزين بحسب الامتداد
const getDirForFilename = (filename = "") => {
  const ext = path.extname(filename).toLowerCase();
  // اعتبر pdf و docx و doc ضمن مجلد الملفات
  const inDocs = [".pdf", ".doc", ".docx"].includes(ext);
  return inDocs ? DOCS_DIR : DEFAULT_DIR;
};

// يبني مسار الملف على القرص
const buildFilePath = (filename) => {
  const safe = path.basename(filename); // منع التلاعب بالمسار
  const dir = getDirForFilename(safe);
  return path.join(UPLOADS_ROOT, dir, safe);
};

// يبني رابط الوصول العام
const buildPublicUrl = (filename) => {
  const safe = path.basename(filename);
  const base = process.env.FILE_BASE_URL?.replace(/\/+$/, "") || "";
  const pathPart =  safe;
  return `${base}?filename${pathPart}`;
};

const joinRequest = async (req, res, next) => {
  try {
    const user = req.user;
    const lan = req.get("lan") || "en";
    let company = await CompanyModel.findOne({ user_id: user._id });

    if (!company) {
      return ReturnAppData.createError({
        res,
        message: lan === "ar" ? "يجب ارسال ملفات اولا" : "Files must be sent first",
      });
    }

    if (company.can_upload === false) {
      return ReturnAppData.createError({
        res,
        message: lan === "ar" ? "طلبكم قيد المراجعة" : "Your application is under review",
      });
    }

    if (!Array.isArray(company.files) || company.files.length < 1) {
      return ReturnAppData.createError({
        res,
        message: lan === "ar" ? "يجب ارسال ملف على الاقل" : "You must send at least one file",
      });
    }

 const { company_name, company_email } = req.body;

// تحقق من الحقول المطلوبة
if (!company_name || !company_email) {
  return ReturnAppData.createError({
    res,
    status: 400,
    message: lan === "ar" ? "هنالك بعض البيانات المفقودة" : "There's some missing data.",
  });
}

// تحقق من صيغة البريد
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
if (!emailRegex.test(company_email)) {
  return ReturnAppData.createError({
    res,
    status: 400,
    message: lan === "ar" ? "البريد الإلكتروني غير صالح" : "Invalid email format",
  });
}

// تحقق من فريدية اسم الشركة
const existingCompanyByName = await CompanyModel.findOne({ company_name });
if (existingCompanyByName) {
  return ReturnAppData.createError({
    res,
    status: 400,
    message: lan === "ar" ? "اسم الشركة مستخدم بالفعل" : "Company name already exists",
  });
}

// تحقق من فريدية البريد الإلكتروني
const existingCompanyByEmail = await CompanyModel.findOne({ company_email: company_email.toLowerCase() });
if (existingCompanyByEmail) {
  return ReturnAppData.createError({
    res,
    status: 400,
    message: lan === "ar" ? "البريد الإلكتروني مستخدم بالفعل" : "Company email already exists",
  });
}
    company.company_name = company_name;
    company.company_email = company_email;
    company.can_upload = false; // بانتظار الموافقة
    await company.save();

    return ReturnAppData.createData({
      res,
      message:
        lan === "ar"
          ? "تم انشاء حساب شركة يرجى انتظار الموافقة"
          : "A company account has been created, Please wait for approval",
    });
  } catch (err) {
    next(err);
  }
};

const uploadFile = async (req, res, next) => {
  try {
    const user = req.user;
    const lan = req.get("lan") || "en";
    let company = await CompanyModel.findOne({ user_id: user._id });

    const file = req.file;
    if (!file || !file.filename) {
      return ReturnAppData.createError({
        res,
        status: 400,
        message: lan === "ar" ? "لم يتم ارسال أي ملف" : "No file sent",
      });
    }

    // إن كانت الشركة موجودة لكنها غير مسموح لها بالرفع حالياً
    if (company && company.can_upload === false) {
      // تنظيف الملف المرفوع لأننا لن نعتمده
      const toDelete = buildFilePath(file.filename);
      if (existsSync(toDelete)) {
        try {
          await fs.unlink(toDelete);
        } catch (_) {}
      }
      return ReturnAppData.createError({
        res,
        status: 403,
        message: lan === "ar" ? "لا يمكن إضافة الملف حالياً" : "You cannot upload files right now",
      });
    }

    // إن لم تكن هناك شركة، ننشئ واحدة مع الملف
    if (!company) {
      const role = await RoleModel.findOne({ role_number: 3 });
      company = await CompanyModel.create({
        user_id: user._id,
        role_id: role?._id,
        status: false,
        can_upload: true, // يسمح بالرفع مبدئياً إلى أن يتم طلب الانضمام
        files: [file.filename],
      });
    } else {
      // لدينا شركة ومسموح لها بالرفع
      company.files = Array.isArray(company.files) ? company.files : [];
      company.files.push(file.filename);
      await company.save();
    }

    return ReturnAppData.createData({
      res,
      status: 201,
      data: {
        url: buildPublicUrl(file.filename),
        filename: file.filename,
      },
      message: lan === "ar" ? "تم إضافة الملف بنجاح" : "The file was added successfully",
    });
  } catch (err) {
    console.log('====================================');
    console.log(err);
    console.log('====================================');
    next(err);
  }
};

/**
 * حذف ملف بالاسم من قاعدة البيانات والقرص
 * req.params.filename أو req.body.filename
 */
const deleteFile = async (req, res, next) => {
  try {
    const user = req.user;
    const lan = req.get("lan") || "en";
    const filename = path.basename(req.query.filename || req.body?.filename || "");

    if (!filename) {
      return ReturnAppData.createError({
        res,
        status: 400,
        message: lan === "ar" ? "اسم الملف مفقود" : "Filename is required",
      });
    }

    const company = await CompanyModel.findOne({ user_id: user._id });
    if (!company) {
      return ReturnAppData.createError({
        res,
        status: 404,
        message: lan === "ar" ? "الحساب غير موجود" : "Company not found",
      });
    }

    if (!Array.isArray(company.files) || !company.files.includes(filename)) {
      return ReturnAppData.createError({
        res,
        status: 404,
        message: lan === "ar" ? "الملف غير موجود" : "File not found",
      });
    }

    // احذف من القرص
    const filePath = buildFilePath(filename);
    if (existsSync(filePath)) {
      await fs.unlink(filePath).catch(() => {});
    }

    // احذف من قاعدة البيانات
    company.files = company.files.filter((f) => f !== filename);
    await company.save();

    return ReturnAppData.createData({
      res,
      message: lan === "ar" ? "تم حذف الملف" : "File deleted",
    });
  } catch (err) {
    next(err);
  }
};

/**
 * إرجاع روابط جميع الملفات للمستخدم الحالي
 */
const getFileLinks = async (req, res, next) => {
  try {
    const user = req.user;
    const lan = req.get("lan") || "en";
    const company = await CompanyModel.findOne({ user_id: user._id });

    if (!company) {
      return ReturnAppData.createError({
        res,
        status: 404,
        message: lan === "ar" ? "الحساب غير موجود" : "Company not found",
      });
    }

    const files = Array.isArray(company.files) ? company.files : [];
    const links = files.map((name) => ({
      filename: name,
      url: buildPublicUrl(name),
    }));

    return ReturnAppData.createData({
      res,
      data: { files: links },
      message: lan === "ar" ? "تم جلب الروابط" : "Links fetched",
    });
  } catch (err) {
    next(err);
  }
};

/**
 * إرسال/تحميل ملف للعميل (download)
 * req.params.filename أو req.query.filename
 */
const downloadFile = async (req, res, next) => {
  try {
    const user = req.user;
    const lan = req.get("lan") || "en";
    const filename = path.basename(req.params.filename || req.query.filename || "");

    if (!filename) {
      return ReturnAppData.createError({
        res,
        status: 400,
        message: lan === "ar" ? "اسم الملف مفقود" : "Filename is required",
      });
    }

    const company = await CompanyModel.findOne({ user_id: user._id });
    if (!company || !Array.isArray(company.files) || !company.files.includes(filename)) {
      return ReturnAppData.createError({
        res,
        status: 404,
        message: lan === "ar" ? "الملف غير موجود" : "File not found",
      });
    }

    const filePath = buildFilePath(filename);
    if (!existsSync(filePath)) {
      return ReturnAppData.createError({
        res,
        status: 404,
        message: lan === "ar" ? "الملف غير موجود على الخادم" : "File not found on server",
      });
    }

    // download مع اسم الملف الأصلي
    return res.download(filePath, filename, (err) => {
      if (err) next(err);
    });
  } catch (err) {
    next(err);
  }
};

export default {
  joinRequest,
  uploadFile,
  deleteFile,
  getFileLinks,
  downloadFile,
};
