// controllers/jop Salary.controller.js

import ReturnDashData from "../../helper/ReturnDashData/index.js";
import { JopSalaryModel } from "../../models/index.js";

/**
 * CREATE
 */
const create = async (req, res, next) => {
  try {
    const payload = { ...req.body };

    if (payload.keyword) {
      if (typeof payload.keyword === "string") {
        payload.keyword = payload.keyword
          .split(",")
          .map(k => k.trim())
          .filter(Boolean);
      } else if (Array.isArray(payload.keyword)) {
        payload.keyword = payload.keyword.map(k => String(k).trim()).filter(Boolean);
      }
      // إزالة التكرارات
      payload.keyword = [...new Set(payload.keyword)];
    }

    // ✅ مهم: لا تخزن null/"" في name_ar
    if (payload.name_ar == null || String(payload.name_ar).trim() === "") {
      delete payload.name_ar; // احذف الحقل ليُعتبر غير موجود
    } else {
      payload.name_ar = String(payload.name_ar).trim();
    }

    // تحقق من الاسم (لو عندك فهرس فريد على name)
    if (payload.name) {
      const exists = await JopSalaryModel.findOne({ name: payload.name });
      if (exists) {
        return ReturnDashData.createError({
          res,
          message: "jop Salary with this name already exists",
        });
      }
    }

    const doc = await JopSalaryModel.create(payload);
    return ReturnDashData.createData({ res, data: doc });

  } catch (err) {
   console.log(err);
   
    // ✅ هندلة خطأ E11000 بشكل واضح
    if (err && err.code === 11000) {
      const field = err.keyPattern ? Object.keys(err.keyPattern)[0] : 'unique field';
      const value = err.keyValue ? JSON.stringify(err.keyValue) : '';
      return ReturnDashData.createError({
        res,
        message: `Duplicate value for unique field "${field}" ${value}`.trim(),
        other: { code: err.code },
      });
    }
    return ReturnDashData.createError({
      res,
      message: err.message || "Create failed",
      other: { code: err.code },
    });
  }
};



/**
 * UPDATE
 * توقع: /jop Salarys/:id
 */
const update = async (req, res, next) => {
  try {
    const { id } = req.params;
   
    // نبني payload من الجسم وننظفه/نطبّعه
    const payload = { ...req.body };
   console.log(req.body);

    // ✅ تحويل keyword إلى Array واستبدال القديمة بالجديدة
    if (payload.keyword !== undefined) {
      if (typeof payload.keyword === "string") {
        payload.keyword = payload.keyword
          .split(",")
          .map(k => k.trim())
          .filter(Boolean);
      } else if (Array.isArray(payload.keyword)) {
        payload.keyword = payload.keyword
          .map(k => String(k).trim())
          .filter(Boolean);
      } else {
        // أي نوع آخر → تجاهله أو اجعله مصفوفة فارغة حسب ما تريده
        payload.keyword = [];
      }
      // إزالة التكرارات
      payload.keyword = [...new Set(payload.keyword)];
    }

    // ✅ تنسيق الحقول النصية (اختياري لكن مفيد)
    if (payload.name !== undefined) {
      payload.name = String(payload.name).trim();
      if (!payload.name) delete payload.name;
    }
    if (payload.title_ar !== undefined) {
      payload.title_ar = String(payload.title_ar).trim();
      if (!payload.title_ar) delete payload.title_ar;
    }
    if (payload.title_en !== undefined) {
      payload.title_en = String(payload.title_en).trim();
      if (!payload.title_en) delete payload.title_en;
    }

    const doc = await JopSalaryModel.findByIdAndUpdate(
      id,
      { $set: payload }, // نستبدل القيم المقدمة (ومنها keyword الجديدة)
      {
        new: true,
        runValidators: true,
        context: "query", // مهم مع unique/validators معينة
      }
    );

    if (!doc) {
      return ReturnDashData.updateError({
        res,
        message: "jop Salary not found",
      });
    }

    return ReturnDashData.updateData({ res, data: doc });

  } catch (err) {
    // 🔁 توضيح أفضل لخطأ الفريد
    if (err && err.code === 11000) {
      const field = err.keyPattern ? Object.keys(err.keyPattern)[0] : "unique field";
      const value = err.keyValue ? JSON.stringify(err.keyValue) : "";
      return ReturnDashData.updateError({
        res,
        message: `Duplicate value for unique field "${field}" ${value}`.trim(),
        other: { code: err.code },
      });
    }

    return ReturnDashData.updateError({
      res,
      message: err.message || "Update failed",
      other: { code: err.code },
    });
  }
};


/**
 * GET (List with pagination & filters)
 * أمثلة باراميترز:
 *   ?page=1&limit=10&sort=-createdAt&search=admin
 */
 const get = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 10,
      sort = "-createdAt",
      search = "",
    } = req.query;

    const filter = {};
    if (search) {
      // مثال: البحث بالاسم (عدّل حسب حقولك)
      filter.name = { $regex: search, $options: "i" };
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [items, total] = await Promise.all([
      JopSalaryModel.find(filter).sort(sort).skip(skip).limit(Number(limit)),
      JopSalaryModel.countDocuments(filter),
    ]);

    return ReturnDashData.getData({
      res,
      data: items,
      other: {
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit)),
        },
      },
    });
  } catch (err) {
    return ReturnDashData.getError({
      res,
      message: err.message || "Get failed",
    });
  }
};

/**
 * GET ONE
 * توقع: /jop Salarys/:id
 */
 const getOne = async (req, res, next) => {
  try {
    const { id } = req.params;
    const doc = await JopSalaryModel.findById(id);
    if (!doc) {
      return ReturnDashData.getError({
        res,
        message: "jop Salary not found",
      });
    }
    return ReturnDashData.getData({ res, data: doc });
  } catch (err) {
    return ReturnDashData.getError({
      res,
      message: err.message || "Get one failed",
    });
  }
};

/**
 * DELETE
 * توقع: /jop Salarys/:id
 */
 const remove = async (req, res, next) => {
  try {
    const { id } = req.params;
    const doc = await JopSalaryModel.findByIdAndDelete(id);
    if (!doc) {
      return ReturnDashData.deleteError({
        res,
        message: "jop Salary not found",
      });
    }
    return ReturnDashData.deleteData({
      res,
      other: { id },
    });
  } catch (err) {
    return ReturnDashData.deleteError({
      res,
      message: err.message || "Delete failed",
    });
  }
};

export default {
 create,
 update,
 get,
 getOne,
 remove
}