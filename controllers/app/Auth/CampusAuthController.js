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
  try {
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
    req.body.device = req.body.device && typeof req.body.device === "object"
      ? req.body.device
      : {
          brand: req.body["device[brand]"] || "web",
          model_name: req.body["device[model_name]"] || "browser",
          model_id: req.body["device[model_id]"] || "web-browser",
          is_device: req.body["device[is_device]"] || false,
        };
    req.body.student_profile = {
      ...(req.body.student_profile || {}),
      university: req.body.university || university?.name || req.body.student_profile?.university || "",
      university_id: university?._id || req.body.student_profile?.university_id || null,
      student_email: studentEmail,
      student_email_verified: false,
    };
    req.body.registration_profile = {
      ...(req.body.registration_profile || {}),
      university: req.body.university || university?.name || req.body.registration_profile?.university || "",
      student_email: studentEmail,
    };

    return Register.register(req, res, next);
  } catch (error) {
    next(error);
  }
};

const universityLogin = async (req, res, next) => {
  const lan = getLang(req);
  try {
    const email = String(req.body?.email || "").trim().toLowerCase();
    const domain = getDomain(email);

    if (!emailRe.test(email)) {
      return ReturnAppData.createError({
        res,
        status: 400,
        message: lan === "ar" ? "البريد الجامعي غير صحيح." : "University email is invalid.",
      });
    }

    const university = email
      ? await UniversityModel.findOne({
          career_center_email: email,
          status: { $ne: "suspended" },
        }).lean()
      : null;

    if (!university) {
      return ReturnAppData.createError({
        res,
        status: 403,
        message:
          lan === "ar"
            ? "دخول الجامعة يتطلب بريد مركز مهني مسجل."
            : "University login requires a registered career-center email.",
      });
    }

    req.campusUniversity = university || null;
    return Login.login(req, res, next);
  } catch (error) {
    next(error);
  }
};

export default { campusRegister, universityLogin };
