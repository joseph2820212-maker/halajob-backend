import express from "express";
import controller from "../controllers/companyDash/companyTalentPoolController.js";
import { requireCompanyPermission } from "../helper/companyDash/companyDashHelpers.js";
import validate from "../middlewares/validate.js";
import companySchemas from "../validations/company.validation.js";
import multer from "../utils/multer.js";

const upload = multer;
const router = express.Router();

router.get("/", requireCompanyPermission("ats.view"), upload.none(), validate(companySchemas.talentPoolListSchema), controller.listTalentPool);
router.get("/search", requireCompanyPermission("ats.view"), upload.none(), validate(companySchemas.talentPoolListSchema), controller.searchTalentPool);
router.post("/candidates", requireCompanyPermission("ats.view"), upload.none(), validate(companySchemas.talentPoolCandidateCreateSchema), controller.saveCandidate);
router.get("/candidates/:id", requireCompanyPermission("ats.view"), upload.none(), validate(companySchemas.talentPoolCandidateSchema), controller.getCandidateDetails);
router.patch("/candidates/:id", requireCompanyPermission("ats.notes.add"), upload.none(), validate(companySchemas.talentPoolCandidateUpdateSchema), controller.updateCandidate);
router.delete("/candidates/:id", requireCompanyPermission("ats.notes.add"), upload.none(), validate(companySchemas.talentPoolCandidateSchema), controller.archiveCandidate);
router.post("/candidates/:id/notes", requireCompanyPermission("ats.notes.add"), upload.none(), validate(companySchemas.talentPoolCandidateNoteSchema), controller.addCandidateNote);
router.get("/candidates/:id/notes", requireCompanyPermission("ats.view"), upload.none(), validate(companySchemas.talentPoolCandidateSchema), controller.listCandidateNotes);
router.post("/candidates/:id/tags", requireCompanyPermission("ats.notes.add"), upload.none(), validate(companySchemas.talentPoolCandidateTagsSchema), controller.addCandidateTags);
router.delete("/candidates/:id/tags/:tag", requireCompanyPermission("ats.notes.add"), upload.none(), validate(companySchemas.talentPoolCandidateTagDeleteSchema), controller.removeCandidateTag);
router.post("/candidates/:id/invite-to-job", requireCompanyPermission("ats.messages.send"), upload.none(), validate(companySchemas.talentPoolCandidateInviteSchema), controller.inviteCandidateToJob);
router.post("/candidates/:id/do-not-contact", requireCompanyPermission("ats.notes.add"), upload.none(), validate(companySchemas.talentPoolDoNotContactSchema), controller.markDoNotContact);

export default router;
