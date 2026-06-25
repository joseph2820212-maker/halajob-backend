import express from "express";
import { authUser } from "../middlewares/userAuth.js";
import { requireAppAccount } from "../middlewares/appAccountGuard.js";
import campusController from "../controllers/app/campus/campusController.js";
import campusMobileController from "../controllers/app/campus/campusMobileController.js";
import ApplyingJobController from "../controllers/app/JobData/ApplyingJobController.js";
import multer from "../utils/multer.js";

const router = express.Router();
const upload = multer;
const campusMobileGuard = [authUser, requireAppAccount("employee"), campusMobileController.requireCampusStudent];

router.get("/dashboard", campusMobileGuard, campusMobileController.dashboard);
router.get("/dashboard/overview", campusMobileGuard, campusMobileController.dashboard);
router.get("/content", campusMobileGuard, campusMobileController.content);
router.get("/events", campusMobileGuard, campusMobileController.events);

router.get("/opportunities", campusMobileGuard, campusMobileController.opportunities);
router.get("/opportunities/:id/readiness", campusMobileGuard, campusMobileController.requireCampusOpportunity, ApplyingJobController.getApplyReadiness);
router.get("/opportunities/:id", campusMobileGuard, campusMobileController.opportunityDetails);
router.post("/opportunities/:id/apply", campusMobileGuard, campusMobileController.requireCampusOpportunity, upload.none(), ApplyingJobController.applyJob);
router.post("/opportunities/:id/apply-external", campusMobileGuard, campusMobileController.requireCampusOpportunity, upload.none(), campusMobileController.applyExternalOpportunity);
router.post("/opportunities/:id/save", campusMobileGuard, upload.none(), campusMobileController.saveOpportunity);
router.delete("/opportunities/:id/save", campusMobileGuard, campusMobileController.unsaveOpportunity);
router.post("/opportunities/:id/toggle-save", campusMobileGuard, upload.none(), campusMobileController.toggleSaveOpportunity);

router.get("/applications", campusMobileGuard, campusMobileController.applications);
router.get("/applications/:id", campusMobileGuard, campusMobileController.applicationDetails);
router.post("/applications/:id/messages", campusMobileGuard, upload.none(), campusMobileController.sendApplicationMessage);
router.patch("/applications/:id/cancel", campusMobileGuard, upload.none(), campusMobileController.cancelApplication);
router.post("/applications/:id/cancel", campusMobileGuard, upload.none(), campusMobileController.cancelApplication);

router.get("/resources", campusController.resources);
router.get("/overview", authUser, campusController.overview);
router.get("/profile", campusMobileGuard, campusController.profile);
router.post("/profile", campusMobileGuard, upload.none(), campusController.updateProfile);
router.put("/profile", campusMobileGuard, upload.none(), campusController.updateProfile);
router.patch("/profile", campusMobileGuard, upload.none(), campusController.updateProfile);
router.post("/events/:eventId/register", campusMobileGuard, upload.none(), campusController.registerEvent);
router.patch("/events/:eventId/cancel", campusMobileGuard, upload.none(), campusMobileController.cancelEventRegistration);
router.post("/events/:eventId/cancel", campusMobileGuard, upload.none(), campusMobileController.cancelEventRegistration);
router.get("/university/overview", authUser, campusController.userUniversityOverview);
router.get("/university/opportunities", authUser, campusController.userUniversityOpportunities);
router.post("/university/opportunities", authUser, upload.none(), campusController.createUniversityOpportunityRequest);
router.get("/university/students", authUser, campusController.userUniversityStudents);
router.get("/university/partners", authUser, campusController.userUniversityPartners);

export default router;
