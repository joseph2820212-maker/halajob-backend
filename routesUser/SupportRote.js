import express from "express";
import { authUser } from "../middlewares/userAuth.js";
import SupportController from "../controllers/app/Support/SupportController.js";

const router = express.Router();

router.get("/tickets", authUser, SupportController.listMyTickets);
router.post("/tickets", authUser, express.json(), SupportController.createTicket);
router.get("/tickets/:id", authUser, SupportController.getTicket);
router.post("/tickets/:id/messages", authUser, express.json(), SupportController.addMessage);
router.patch("/tickets/:id/close", authUser, SupportController.closeTicket);
router.post("/tickets/:id/close", authUser, SupportController.closeTicket);

export default router;
