import express from "express";
import { authUser } from "../middlewares/userAuth.js";
import AccountContextController from "../controllers/app/Me/AccountContextController.js";

const router = express.Router();

router.get("/contexts", authUser, AccountContextController.listContexts);
router.post("/active-context", authUser, express.json(), AccountContextController.setActiveContext);
router.get("/permissions", authUser, AccountContextController.permissions);

export default router;
