import { ensureFreeSubscriptionPlan } from "../services/subscriptions/companySubscription.service.js";

export const seedSubscriptionPlans = async () => {
  const plan = await ensureFreeSubscriptionPlan();
  console.log(`✅ Subscription plan ready: ${plan.key}`);
};

export default seedSubscriptionPlans;
