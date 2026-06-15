import Register from "./RegisterController.js";
import Login from "./LoginController.js";
import ReturnAppData from "../../../helper/ReturnAppData/index.js";
import { UniversityModel } from "../../../models/index.js";

const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const getLang = (req) => String(req.get("lan") || "en").toLowerCase();

const getDomain = (email = "") => String(email).trim().toLowerCase().split("@")[1] || "";

const isAcademicDomain = (domain = "") =>
  domain.endsWith(".edu") ||
  domain.includes(".edu.") ||
  domain.endsWith(".ac") ||
  domain.includes(".ac.");

const campusRegister = async (req, res, next) => {
  const lan = getLang(req);
  const studentEmail = String(req.body?.student_email || req.body?.email || "").trim().toLowerCase();
  const domain = getDomain(studentEmail);

  if (!emailRe.test(studentEmail)) {
    return ReturnAppData.createError({
      res,
      status: 400,
      message: lan === "ar" ? "البريد الجامعي غير صحيح." : "Student email is invalid.",
    });
  }

  if (!isAcademicDomain(domain)) {
    return ReturnAppData.createError({
      res,
      status: 400,
      message:
        lan === "ar"
          ? "يجب استخدام بريد جامعي مثل .edu أو .ac للتسجيل في وضع الجامعات."
          : "Campus registration requires a university email such as .edu or .ac.",
    });
  }

  const university = await UniversityModel.findOne({
    email_domain: domain,
    status: { $ne: "suspended" },
  }).lean();

  req.body.email = req.body.email || studentEmail;
  req.body.candidate_stage = req.body.candidate_stage || "student";
  req.body.is_student = true;
  req.body.student_profile = {
    ...(req.body.student_profile || {}),
    university: req.body.university || university?.name || req.body.student_profile?.university || "",
  };
  req.body.registration_profile = {
    ...(req.body.registration_profile || {}),
    university: req.body.university || university?.name || req.body.registration_profile?.university || "",
    student_email: studentEmail,
  };

  return Register.register(req, res, next);
};

const universityLogin = async (req, res, next) => {
  const domain = getDomain(req.body?.email);
  const university = domain
    ? await UniversityModel.findOne({
        $or: [{ email_domain: domain }, { career_center_email: String(req.body?.email || "").toLowerCase() }],
        status: { $ne: "suspended" },
      }).lean()
    : null;

  req.campusUniversity = university || null;
  return Login.login(req, res, next);
};

export default { campusRegister, universityLogin };
