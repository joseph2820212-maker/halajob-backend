import express from "express";
import { authUser } from "../middlewares/userAuth.js";
import CreateJobRoleController from "../controllers/app/Jobs/CreateJobRoleController.js";
import CreateJobController from "../controllers/app/Jobs/CreateJobController.js";
import GetJobControllerById from "../controllers/app/Jobs/GetJobController.js";
import UpdateJobController from "../controllers/app/Jobs/UpdateJobController.js";
import GetJobController from "../controllers/app/JobData/GetJobController.js";
import GetPopularController from "../controllers/app/JobData/GetPopularController.js";

const router = express.Router();

router.get("/job-role", authUser, CreateJobRoleController.whatIsMyRole);
router.post("/create", authUser, CreateJobController.create);
router.post("/update/:id", authUser, UpdateJobController.update);
router.get("/get-single-job/:id", authUser, GetJobControllerById.getById);

// App job search APIs: authenticated because ranking, saved/applied/seen flags, and recommendations depend on employee profile.
router.get("/get", authUser, GetJobController.get);
router.get("/get-filters", authUser, GetJobController.getFilters);
router.get("/get-by-id/:id", authUser, GetJobController.getById);

router.get("/get-popular", authUser, GetPopularController.get);

export default router;
