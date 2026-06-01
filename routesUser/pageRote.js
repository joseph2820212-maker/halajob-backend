import express from "express";
import PageController from "../controllers/app/pages/pagesController.js";

const router = express.Router();

router.get("/get", PageController.get);
router.get("/details/:key", PageController.details);

export default router;