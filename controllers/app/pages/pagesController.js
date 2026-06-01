import { PageModel } from "../../../models/index.js";

const getLocale = (req) => {
  const locale = req.get("lan") || req.get("lang") || "ar";
  return locale === "en" ? "en" : "ar";
};

const getLocalizedValue = (item, locale, field) => {
  const arValue = item?.[`${field}_ar`] || "";
  const enValue = item?.[`${field}_en`] || "";

  return locale === "ar" ? arValue || enValue : enValue || arValue;
};

/**
 * GET /user/v1/pages/get
 * يرجع كل الصفحات الثابتة بدون content
 */
const get = async (req, res, next) => {
  try {
    const locale = getLocale(req);

    const filter = {
      status: true,
    };

    /**
     * اختياري:
     * إذا أردت ترجع صفحات iOS فقط عند الطلب:
     * /pages/get?is_ios=true
     */
    if (req.query.is_ios !== undefined) {
      filter.is_ios = String(req.query.is_ios) === "true";
    }

    const pages = await PageModel.find(filter)
      .select({
        key: 1,
        image: 1,
        title_ar: 1,
        title_en: 1,
        description_ar: 1,
        description_en: 1,
        is_ios: 1,
        status: 1,
        createdAt: 1,
        updatedAt: 1,
      })
      .sort({ createdAt: 1 })
      .lean();

    return res.json({
      status: true,
      data: pages.map((page) => ({
        id: page._id,
        key: page.key,

        image: page.image || null,

        title: getLocalizedValue(page, locale, "title"),
        description: getLocalizedValue(page, locale, "description"),

        title_ar: page.title_ar || "",
        title_en: page.title_en || "",

        description_ar: page.description_ar || "",
        description_en: page.description_en || "",

        is_ios: Boolean(page.is_ios),
      })),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /user/v1/pages/details/:key
 * يرجع صفحة واحدة بالتفصيل
 */
const details = async (req, res, next) => {
  try {
    const locale = getLocale(req);
    const key = String(req.params.key || "").trim();

    if (!key) {
      return res.status(400).json({
        status: false,
        message: locale === "ar" ? "مفتاح الصفحة مطلوب." : "Page key is required.",
      });
    }

    const page = await PageModel.findOne({
      key,
      status: true,
    }).lean();

    if (!page) {
      return res.status(404).json({
        status: false,
        message: locale === "ar" ? "الصفحة غير موجودة." : "Page not found.",
      });
    }

    const content = Array.isArray(page.content)
      ? page.content.map((item) => ({
          type: item.type,

          value: locale === "ar"
            ? item.value_ar || item.value_en || ""
            : item.value_en || item.value_ar || "",

          value_ar: item.value_ar || "",
          value_en: item.value_en || "",
        }))
      : [];

    return res.json({
      status: true,
      data: {
        id: page._id,
        key: page.key,

        image: page.image || null,

        title: getLocalizedValue(page, locale, "title"),
        description: getLocalizedValue(page, locale, "description"),

        title_ar: page.title_ar || "",
        title_en: page.title_en || "",

        description_ar: page.description_ar || "",
        description_en: page.description_en || "",

        content,

        is_ios: Boolean(page.is_ios),
        status: Boolean(page.status),

        createdAt: page.createdAt,
        updatedAt: page.updatedAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

export default {
  get,
  details,
};