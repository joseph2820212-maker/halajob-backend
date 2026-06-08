import mongoose from "mongoose";

const { Schema } = mongoose;

const InvoiceItemSchema = new Schema(
  {
    title: { type: String, trim: true, required: true },
    description: { type: String, trim: true, default: "" },
    quantity: { type: Number, default: 1, min: 1 },
    unit_price: { type: Number, default: 0, min: 0 },
    total: { type: Number, default: 0, min: 0 },
  },
  { _id: false }
);

const CompanyInvoiceSchema = new Schema(
  {
    invoice_no: { type: String, trim: true, unique: true, sparse: true, index: true },
    company_id: { type: Schema.Types.ObjectId, ref: "companies", required: true, index: true },
    subscription_id: { type: Schema.Types.ObjectId, ref: "company_subscriptions", default: null, index: true },
    plan_id: { type: Schema.Types.ObjectId, ref: "subscription_plans", default: null, index: true },
    plan_key: { type: String, trim: true, lowercase: true, default: "" },
    status: {
      type: String,
      enum: ["draft", "pending", "paid", "cancelled", "refunded", "failed", "overdue"],
      default: "pending",
      index: true,
    },
    amount: { type: Number, default: 0, min: 0 },
    tax_amount: { type: Number, default: 0, min: 0 },
    discount_amount: { type: Number, default: 0, min: 0 },
    total_amount: { type: Number, default: 0, min: 0 },
    currency_code: { type: String, trim: true, uppercase: true, default: "USD" },
    billing_period: { type: String, trim: true, default: "" },
    issued_at: { type: Date, default: Date.now, index: true },
    due_at: { type: Date, default: null, index: true },
    paid_at: { type: Date, default: null, index: true },
    cancelled_at: { type: Date, default: null },
    payment_method: { type: String, trim: true, default: "" },
    transaction_ref: { type: String, trim: true, default: "" },
    items: { type: [InvoiceItemSchema], default: [] },
    notes: { type: String, trim: true, default: "" },
    metadata: { type: Schema.Types.Mixed, default: {} },
  },
  { collection: "company_invoices", timestamps: true }
);

CompanyInvoiceSchema.pre("validate", async function (next) {
  try {
    if (!this.invoice_no) {
      const year = new Date().getFullYear();
      const count = await this.constructor.countDocuments({ invoice_no: new RegExp(`^INV-${year}-`) });
      this.invoice_no = `INV-${year}-${String(count + 1).padStart(5, "0")}`;
    }
    if (!this.total_amount) {
      const itemsTotal = (this.items || []).reduce((sum, item) => sum + Number(item.total || item.quantity * item.unit_price || 0), 0);
      this.amount = Number(this.amount || itemsTotal || 0);
      this.total_amount = Math.max(0, Number(this.amount || 0) + Number(this.tax_amount || 0) - Number(this.discount_amount || 0));
    }
    if (this.status === "paid" && !this.paid_at) this.paid_at = new Date();
    if (this.status === "cancelled" && !this.cancelled_at) this.cancelled_at = new Date();
    next();
  } catch (error) {
    next(error);
  }
});

CompanyInvoiceSchema.index({ company_id: 1, status: 1, issued_at: -1 });
CompanyInvoiceSchema.index({ company_id: 1, due_at: 1 });

const CompanyInvoiceModel = mongoose.model("company_invoices", CompanyInvoiceSchema);
export default CompanyInvoiceModel;
