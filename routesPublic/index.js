import express from "express";
import contentController from "../controllers/public/contentController.js";
import companyPublicController from "../controllers/public/companyPublicController.js";
import SettingsCenterController from "../controllers/settings/SettingsCenterController.js";
import SalaryInsightsRoute from "./SalaryInsightsRoute.js";

const router = express.Router();

// Public, unauthenticated content APIs (legal, help, FAQ). Safe to cache.
router.get("/client-settings", SettingsCenterController.getClientSettings);
router.get("/settings/client", SettingsCenterController.getClientSettings);
router.use("/salary-insights", SalaryInsightsRoute);
router.get("/companies", companyPublicController.listCompanies);
router.get("/companies/:slugOrId", companyPublicController.getCompany);
router.get("/companies/:slugOrId/jobs", companyPublicController.getCompanyJobs);
router.get("/companies/:slugOrId/reviews", companyPublicController.getCompanyReviews);
router.get("/content/pages", contentController.listPages);
router.get("/content/pages/:key", contentController.getPage);
router.get("/legal/:key", contentController.getPage); // alias for legal/policy pages
router.get("/help/categories", contentController.listHelpCategories);
router.get("/help/articles", contentController.listHelpArticles);
router.get("/help/articles/:key", contentController.getHelpArticle);
router.get("/faq", contentController.listFaq);

export default router;
