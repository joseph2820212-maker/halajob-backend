import {
  ContentPageModel,
  HelpCategoryModel,
  HelpArticleModel,
  FaqItemModel,
} from "../../models/index.js";
import PageModel from "../../models/PageModel.js";
import ReturnAppData from "../../helper/ReturnAppData/index.js";

const PAGE_PROJECTION = "-createdBy -updatedBy -__v";

// Map a legacy PageModel doc to the ContentPage-ish public shape (back-compat).
const fromLegacyPage = (p) => ({
  key: p.key,
  category: "legal",
  audience: ["public"],
  title: { en: p.title_en || "", ar: p.title_ar || "" },
  summary: { en: p.description_en || "", ar: p.description_ar || "" },
  contentBlocks: (p.content || []).map((b, i) => ({
    type: b.type === "title" ? "heading" : "paragraph",
    text: { en: b.value_en || "", ar: b.value_ar || "" },
    sortOrder: i,
  })),
  legacy: true,
});

const listPages = async (req, res, next) => {
  try {
    const filter = { status: "published" };
    if (req.query.category) filter.category = String(req.query.category);
    if (req.query.audience) filter.audience = String(req.query.audience);
    const pages = await ContentPageModel.find(filter).select(PAGE_PROJECTION).sort("category key").lean();
    return ReturnAppData.getData({ res, data: pages, message: "content_pages" });
  } catch (error) {
    return next(error);
  }
};

const getPage = async (req, res, next) => {
  try {
    const key = String(req.params.key || "").trim();
    let page = await ContentPageModel.findOne({ key, status: "published" }).select(PAGE_PROJECTION).lean();
    if (!page) {
      const legacy = await PageModel.findOne({ key, status: true }).lean();
      if (legacy) page = fromLegacyPage(legacy);
    }
    if (!page) return ReturnAppData.getError({ res, status: 404, message: "page_not_found" });
    return ReturnAppData.getData({ res, data: page, message: "content_page" });
  } catch (error) {
    return next(error);
  }
};

const listHelpCategories = async (req, res, next) => {
  try {
    const filter = { status: "published" };
    if (req.query.audience) filter.audience = String(req.query.audience);
    const categories = await HelpCategoryModel.find(filter).select("-__v").sort("sortOrder title.en").lean();
    return ReturnAppData.getData({ res, data: categories, message: "help_categories" });
  } catch (error) {
    return next(error);
  }
};

const listHelpArticles = async (req, res, next) => {
  try {
    const filter = { status: "published" };
    if (req.query.categoryKey) filter.categoryKey = String(req.query.categoryKey);
    if (req.query.audience) filter.audience = String(req.query.audience);
    const articles = await HelpArticleModel.find(filter)
      .select("key categoryKey audience title summary tags sortOrder")
      .sort("categoryKey sortOrder")
      .lean();
    return ReturnAppData.getData({ res, data: articles, message: "help_articles" });
  } catch (error) {
    return next(error);
  }
};

const getHelpArticle = async (req, res, next) => {
  try {
    const key = String(req.params.key || "").trim();
    const article = await HelpArticleModel.findOne({ key, status: "published" }).select("-__v").lean();
    if (!article) return ReturnAppData.getError({ res, status: 404, message: "article_not_found" });
    return ReturnAppData.getData({ res, data: article, message: "help_article" });
  } catch (error) {
    return next(error);
  }
};

const listFaq = async (req, res, next) => {
  try {
    const filter = { status: "published" };
    if (req.query.audience) filter.audience = String(req.query.audience);
    if (req.query.category) filter.category = String(req.query.category);
    const faq = await FaqItemModel.find(filter).select("-__v").sort("category sortOrder").lean();
    return ReturnAppData.getData({ res, data: faq, message: "faq_items" });
  } catch (error) {
    return next(error);
  }
};

export default {
  listPages,
  getPage,
  listHelpCategories,
  listHelpArticles,
  getHelpArticle,
  listFaq,
};
