import ReturnAppData from "../../../helper/ReturnAppData/index.js";
import { resolveAppAccount } from "../../../services/appAccount.service.js";

function buildPublicUrl(base, rel) {
  if (!base) return rel;
  const cleaned = rel?.replace(/^\/+/, "") || "";
  return base.endsWith("/") ? base + cleaned : `${base}/${cleaned}`;
}

async function ensureEmployeeForUser(user) {
  const account = await resolveAppAccount(user, { createMissingEmployee: true });
  if (account.accountType !== "employee" || !account.employee?._id) {
    const err = new Error("APP_ACCOUNT_NOT_EMPLOYEE");
    err.statusCode = 403;
    throw err;
  }
  return account.employee;
}

function buildEmployeeResponse(employee) {
  return {
    id: employee._id,
    profile_headline: employee.profile_headline,
    current_job_title: employee.current_job_title,
    about_me: employee.about_me,
    profile_completion: employee.profile_completion,
    candidate_stage: employee.candidate_stage,
    is_student: employee.is_student,
    graduation_year: employee.graduation_year,
    experience_years: employee.experience_years,
    experience_level_id: employee.experience_level_id,
    latest_work_experience: employee.latest_work_experience,
    experience: employee.experience,
    education: employee.education,
    skills: employee.skills,
    languages: employee.languages,
    licenses: employee.licenses,
    testimony: employee.testimony,
    cvs: employee.cvs,
    job_names: employee.job_names,
    job_types: employee.job_types,
    preferred_work_modes: employee.preferred_work_modes,
    preferred_countries: employee.preferred_countries,
    expected_salary: employee.expected_salary,
    notice_period_id: employee.notice_period_id,
    work_location: employee.work_location,
    profile_visibility: employee.profile_visibility,
    is_can_move: employee.is_can_move,
    is_free_for_work: employee.is_free_for_work,
    links: employee.links,
    status: employee.status,
    accepted: employee.accepted,
  };
}

const profile = async (req, res, next) => {
  const user = req.user;
  const lan = (req.get("lan") || "en").toLowerCase();

  try {
    const employee = await ensureEmployeeForUser(user);

    if (employee.status === false) {
      return ReturnAppData.getError({
        res,
        status: 403,
        message: lan === "ar" ? "حسابك غير مفعل او تم حظره" : "Your account is inactive or blocked",
      });
    }

    const response = {
      user: {
        id: user._id,
        first_name: user.first_name,
        mid_name: user.mid_name,
        last_name: user.last_name,
        full_name: [user.first_name, user.mid_name, user.last_name].filter(Boolean).join(" "),
        image: user.image ? buildPublicUrl(process.env.PUBLIC_BASE_URL, user.image) : null,
        phone_country: user.phone_country,
        phone_code: user.phone_code,
        phone_national: user.phone_national,
        gender: user.gender,
        birthday: user.birthday || null,
      },
      employee: buildEmployeeResponse(employee),
    };

    return ReturnAppData.getData({ res, data: response });
  } catch (err) {
    console.error("employee profile error:", err);
    return ReturnAppData.getError({
      res,
      status: err.statusCode || 500,
      message:
        err.message === "EMPLOYEE_ROLE_NOT_FOUND"
          ? lan === "ar"
            ? "تعذر تحديد صلاحية الموظف."
            : "Unable to resolve employee role."
          : err.message === "APP_ACCOUNT_NOT_EMPLOYEE"
          ? lan === "ar"
            ? "هذا الإجراء متاح للموظفين فقط."
            : "This action is available for employee accounts only."
          : lan === "ar"
          ? "حدث خطأ غير متوقع."
          : "Internal server error.",
    });
  }
};

export default { profile };
