import ReturnAppData from "../helper/ReturnAppData/index.js";
import { accountMessage, resolveAppAccount } from "../services/appAccount.service.js";

const lang = (req) => String(req.get("lan") || "en").toLowerCase();

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
