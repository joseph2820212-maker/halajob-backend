# Payments And Subscriptions Launch Decision

Date: 2026-06-28
Branch: `codex/gate-a-mobile-ui-lock`

This branch supports manual/admin-managed company subscriptions. It does not
implement or enable online card checkout, payment-provider webhooks, refund
flows, or automatic failed-payment handling.

## Current Implemented Model

Company users with `billing.manage` can:

- read the current company subscription
- read billing summary totals
- list company-owned invoices
- read a company-owned invoice detail
- submit a plan-change request that creates a support ticket and audit log

Dashboard admins with `subscriptions.manage` can:

- seed the system free plan
- read a company's subscription summary
- assign a subscription plan to a company
- cancel the previous active/trialing subscription when assigning a new plan
- sync the company subscription snapshot used by company/job feature checks

The subscription service also enforces feature flags, usage limits, job approval
policy, and usage counters used by company workflows such as interviews,
invitations, CV downloads, exports, and job posting limits.

## Verified Evidence

The current local integration suite covers:

- company owner reads own subscription
- billing member reads billing summary and invoices
- seeker/user without company context is denied
- company member without `billing.manage` is denied
- cross-company invoice detail is denied
- invalid invoice IDs return a clean client error
- plan-change request creates a support ticket and audit log
- dashboard admin reads company subscription
- limited dashboard admin without permission is denied
- free-plan seeding works
- admin plan assignment updates the company subscription snapshot
- missing plan assignment fails clearly

Primary command:

```bash
npm run test:integration:subscriptions
```

Related command group:

```bash
npm run test:integration:company-permissions
npm run test:integration:hiring-workflows
npm run test:integration:admin-support
npm run test:integration:admin-permissions
```

## Launch Option A: Manual/Admin Subscriptions

This is the branch's supported launch path unless the owner chooses an online
payment provider before launch.

Owner acceptance required:

- companies request a plan from the product instead of entering card details
- admins assign the plan after commercial approval
- invoices are internal/manual records
- the UI does not claim card checkout or automatic online payment is available
- public docs and sales/support copy say online payment provider setup is pending

If this model is accepted, the subscription gate is code-complete for launch
subject to production account QA, seeded plan setup, and live support/admin
workflow testing.

## Launch Option B: Online Payments Before Launch

This is externally blocked until the owner selects and provides a real provider
setup.

Owner decisions and credentials needed:

- payment provider, for example Stripe, PayPal, Tap, HyperPay, or another target
- merchant account country and allowed settlement currencies
- public/private API keys and webhook signing secret
- checkout success/cancel URLs
- tax/VAT and invoice receipt requirements
- refund, cancellation, and failed-payment policy
- production and sandbox accounts for verification

Implementation required after provider selection:

- backend provider adapter
- checkout session creation
- webhook signature validation
- webhook idempotency and replay protection
- payment status sync into invoices/subscriptions
- automatic subscription activation or downgrade rules
- failed-payment and cancellation handling
- refund handling if applicable
- integration tests for success, failure, replay, invalid signature, and retry
- live sandbox/provider proof

No release should claim online payments are complete until the provider webhook
suite and live sandbox proof pass.

