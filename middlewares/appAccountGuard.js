import ReturnAppData from "../helper/ReturnAppData/index.js";
import { accountMessage, resolveAppAccount } from "../services/appAccount.service.js";

const lang = (req) => String(req.get("lan") || "en").toLowerCase();
const contextTypesForAccount = {
  employee: ["job_seeker", "student"],
  company: ["company_member", "company_admin"],
};

export const requireActiveContext = (allowedContextTypes, options = {}) => {
  const allowedTypes = Array.isArray(allowedContextTypes)
    ? allowedContextTypes
    : [allowedContextTypes].filter(Boolean);
  const allowedStatuses = options.allowedStatuses || ["active"];

  return async function activeContextGuard(req, res, next) {
    try {
      const activeContext = req.activeContext || {};
      const status = activeContext.status || "";
      const contextType = activeContext.context_type || "";

      if (!allowedTypes.includes(contextType) || !allowedStatuses.includes(status)) {
        return ReturnAppData.getError({
          res,
          status: 403,
          message: options.message || "active_context_required",
          other: {
            data: {
              expected_context_type: allowedTypes,
              active_context_type: contextType,
              active_context_id: activeContext.id || "",
              active_context_status: status,
            },
          },
        });
      }

      return next();
    } catch (error) {
      return next(error);
    }
  };
};

export const requireUniversityAdminContext = requireActiveContext(
  ["university_admin", "super_admin"],
  { message: "university_admin_context_required" }
);

export const requireCompanyContext = requireActiveContext(
  ["company_admin", "company_member"],
  { message: "company_context_required", allowedStatuses: ["active", "pending"] }
);

export const attachAppAccount = async (req, res, next) => {
  try {
    if (!req.user?._id) return next();
    req.appAccount = await resolveAppAccount(req.user);
    return next();
  } catch (error) {
    return next(error);
  }
};

export const requireAppAccount = (requiredType, options = {}) => async (req, res, next) => {
  try {
    const lan = lang(req);
    const account =
      req.appAccount ||
      (await resolveAppAccount(req.user, {
        createMissingEmployee: requiredType === "employee",
      }));

    req.appAccount = account;

    const activeContext = req.activeContext;
    const allowedContextTypes = contextTypesForAccount[requiredType] || [];
    if (activeContext?.context_type && allowedContextTypes.length) {
      if (!allowedContextTypes.includes(activeContext.context_type)) {
        return ReturnAppData.getError({
          res,
          status: 403,
          message: accountMessage(lan, requiredType, account.companyState),
          other: {
            data: {
              expected_account_type: requiredType,
              active_context_type: activeContext.context_type,
              active_context_id: activeContext.id,
            },
          },
        });
      }

      if (activeContext.status === "suspended" || activeContext.status === "removed") {
        return ReturnAppData.getError({
          res,
          status: 403,
          message: "active_context_not_available",
          other: {
            data: {
              active_context_type: activeContext.context_type,
              active_context_id: activeContext.id,
              active_context_status: activeContext.status,
            },
          },
        });
      }

      if (requiredType === "company" && options.mustBeApproved !== false && activeContext.status !== "active") {
        return ReturnAppData.getError({
          res,
          status: 403,
          message: accountMessage(lan, "company", account.companyState),
          other: {
            data: {
              expected_account_type: "company",
              active_context_type: activeContext.context_type,
              active_context_id: activeContext.id,
              active_context_status: activeContext.status,
            },
          },
        });
      }

      req.appAccount = {
        ...account,
        accountType: requiredType,
        activeContext,
        isEmployee: requiredType === "employee",
        isCompany: requiredType === "company",
      };
      return next();
    }

    if (account.accountType !== requiredType) {
      return ReturnAppData.getError({
        res,
        status: 403,
        message: accountMessage(lan, requiredType, account.companyState),
        other: {
          data: {
            expected_account_type: requiredType,
            current_account_type: account.accountType,
            role_type: account.roleType,
            company_state: account.companyState,
          },
        },
      });
    }

    if (requiredType === "company" && options.mustBeApproved !== false && account.companyState !== "approved") {
      return ReturnAppData.getError({
        res,
        status: 403,
        message: accountMessage(lan, "company", account.companyState),
        other: {
          data: {
            expected_account_type: "company",
            current_account_type: account.accountType,
            role_type: account.roleType,
            company_state: account.companyState,
          },
        },
      });
    }

    return next();
  } catch (error) {
    return next(error);
  }
};
