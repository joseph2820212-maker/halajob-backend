import { getCompanyUserIdOrFail, success, fail, paginate, isValidObjectId } from "../../../helper/companyDash/companyDashHelpers.js";
import { CompanyInvoiceModel } from "../../../models/index.js";
import { getCompanySubscriptionSummary } from "../../../services/subscriptions/companySubscription.service.js";

export const getMySubscription = async (req, res, next) => {
  try {
    const companyData = await getCompanyUserIdOrFail(req, res);
    if (!companyData) return;
    const data = await getCompanySubscriptionSummary(companyData.company._id);
    return success(res, data, "company_subscription");
  } catch (error) {
    next(error);
  }
};



export const getMyInvoices = async (req, res, next) => {
  try {
    const companyData = await getCompanyUserIdOrFail(req, res);
    if (!companyData) return;
    const filter = { company_id: companyData.company._id };
    if (req.query.status) filter.status = String(req.query.status).trim();
    if (req.query.from || req.query.to) {
      filter.issued_at = {};
      if (req.query.from) filter.issued_at.$gte = new Date(req.query.from);
      if (req.query.to) filter.issued_at.$lte = new Date(req.query.to);
    }
    const result = await paginate(CompanyInvoiceModel, filter, req, {
      sort: { issued_at: -1, _id: -1 },
      populate: [{ path: "subscription_id" }, { path: "plan_id" }],
      lean: true,
    });
    return success(res, result.items, "company_invoices", 200, result.meta);
  } catch (error) {
    next(error);
  }
};

export const getMyInvoiceDetails = async (req, res, next) => {
  try {
    const companyData = await getCompanyUserIdOrFail(req, res);
    if (!companyData) return;
    if (!isValidObjectId(req.params.invoiceId)) return fail(res, "invalid_invoice_id", 400);
    const invoice = await CompanyInvoiceModel.findOne({ _id: req.params.invoiceId, company_id: companyData.company._id })
      .populate([{ path: "subscription_id" }, { path: "plan_id" }])
      .lean();
    if (!invoice) return fail(res, "invoice_not_found", 404);
    return success(res, invoice, "company_invoice_details");
  } catch (error) {
    next(error);
  }
};

export const getBillingSummary = async (req, res, next) => {
  try {
    const companyData = await getCompanyUserIdOrFail(req, res);
    if (!companyData) return;
    const [subscription, totals] = await Promise.all([
      getCompanySubscriptionSummary(companyData.company._id),
      CompanyInvoiceModel.aggregate([
        { $match: { company_id: companyData.company._id } },
        { $group: { _id: "$status", count: { $sum: 1 }, total_amount: { $sum: "$total_amount" } } },
      ]).catch(() => []),
    ]);
    return success(res, { subscription, invoices_by_status: totals }, "company_billing_summary");
  } catch (error) {
    next(error);
  }
};
export default { getMySubscription, getMyInvoices, getMyInvoiceDetails, getBillingSummary };
