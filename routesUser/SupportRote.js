import express from "express";
import { authUser } from "../middlewares/userAuth.js";
import validate from "../middlewares/validate.js";
import schemas from "../validations/userContent.validation.js";
import SupportController from "../controllers/app/Support/SupportController.js";

const router = express.Router();

router.post("/tickets", authUser, express.json(), validate(schemas.supportCreateTicketSchema), SupportController.createTicket);
router.get("/tickets", authUser, SupportController.listMyTickets);
router.get("/tickets/:id", authUser, SupportController.getTicket);
router.post("/tickets/:id/messages", authUser, express.json(), validate(schemas.supportAddMessageSchema), SupportController.addMessage);
router.patch("/tickets/:id/close", authUser, validate(schemas.supportTicketIdParamSchema), SupportController.closeTicket);
router.post("/tickets/:id/close", authUser, validate(schemas.supportTicketIdParamSchema), SupportController.closeTicket);

export default router;
