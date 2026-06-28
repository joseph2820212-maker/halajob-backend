import express from "express";
import contentController from "../controllers/public/contentController.js";

const router = express.Router();

// Public, unauthenticated content APIs (legal, help, FAQ). Safe to cache.
router.get("/content/pages", contentController.listPages);
router.get("/content/pages/:key", contentController.getPage);
router.get("/legal/:key", contentController.getPage); // alias for legal/policy pages
router.get("/help/categories", contentController.listHelpCategories);
router.get("/help/articles", contentController.listHelpArticles);
router.get("/help/articles/:key", contentController.getHelpArticle);
router.get("/faq", contentController.listFaq);

export default router;
