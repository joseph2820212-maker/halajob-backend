# Hala Job — Codex Handout to Reach 9.5/10

**Area:** Legal / Help / Support / Privacy / Accessibility / Reporting  
**Branch basis:** `codex/gate-a-mobile-ui-lock` latest inspected package `60e0d4b`  
**Target:** Raise this slice from about **8.1/10** to **9.5/10 release-ready** for a Syria-first launch.  
**Founder decision:** Do not let lawyer review block product/UI completion, but do not pretend legal text is final for production.

---

## 0. Non-negotiables

1. **Do not change the locked UI theme.**
   - Keep the navy/cream/orange design contract.
   - Do not introduce new colors, white cards, green, emoji, or raw unapproved headers.

2. **Do not add unrelated product modules.**
   - This handout is only for Legal, Help, Support, Privacy, Accessibility, Reports, and related admin operations.

3. **Do not delete `legalReviewStatus`.**
   - Change how it gates launch.
   - Staging/owner-review builds may show draft legal pages.
   - Production must require lawyer-approved required legal pages.

4. **Do not randomly rewrite legal wording.**
   - Codex may add missing structure, placeholders, metadata, gates, admin workflows, and legal-review TODO sections.
   - Final legal wording must remain marked for Syrian lawyer review until approved.

5. **Do not hide functions behind messy secondary placement.**
   - Help, Support, Privacy, Accessibility, Report Concern, Legal Center, and Data Rights must be easy to find on both web and mobile.

---

## 1. Current situation summary

The latest inspected code is substantially better than earlier packages:

- Web help article detail is wired.
- Web privacy export/delete/cancel is wired.
- Web accessibility request is wired.
- Web report reasons use fixed choices.
- Mobile report reasons use ticked/radio rows instead of an uncontrolled dropdown.
- Mobile legal/help screens use the locked native chrome.
- Mobile Settings has direct account export/delete actions.
- Admin company support tickets have status/reply/close actions.
- Content package and email templates pass checks.
- Route wiring check reports `331/331` matched in the latest package.

Remaining release blockers:

- Required legal pages are still marked `needs_lawyer_review`.
- Syria-specific launch legal schedule is not complete enough.
- Admin support is still stronger for company tickets than for general seeker/campus/user tickets.
- Web/mobile support still needs a full user support inbox: list tickets, view ticket, reply, close, status history.
- Mobile Help needs full article-detail screens, not only category summaries.
- Mobile Privacy Center / Settings data-rights flow needs unification.
- Mobile accessibility request flow needs to be first-class.
- Contextual reports must carry `targetType` and `targetId` when opened from a job, company, application, profile, message, resource, or content page.
- SYP currency handling needs a clean Syria-first decision.
- Some web tests were failing in the latest inspected package and must be fixed before claiming green status.

---

## 2. Target state: 9.5/10 definition

This slice reaches **9.5/10** when:

1. A Syrian user can easily find legal pages, help articles, FAQ, support, privacy/data rights, accessibility, and reporting from both web and mobile.
2. A user can create, view, reply to, and close support tickets on web and mobile.
3. Admin can manage both general user support and company support without tickets disappearing into separate unmonitored models.
4. Legal reports from context include enough evidence and target metadata for admin action.
5. Privacy/data rights flows use the strongest existing account export/delete/cancel endpoints, not only generic requests.
6. Accessibility requests exist on web and mobile and have admin follow-up status.
7. Legal content has staging visibility but production approval gates.
8. Syria-specific legal risk is surfaced in a clear launch legal schedule for lawyer review.
9. Tests prove the behavior and fail if any required module becomes hidden, duplicated incorrectly, or unwired.
10. All relevant web/backend checks are green, and mobile static/widget checks exist even if final manual device checks are handled separately.

---

## 3. Legal review gate: revised rule

### 3.1 Keep legal review status

Keep this field or equivalent:

```js
legalReviewStatus: "needs_lawyer_review" | "lawyer_approved" | "rejected" | "revision_requested"
```

Do **not** remove it from the data model, seed data, admin UI, or launch checks.

### 3.2 Do not block staging/product completion

For local, staging, owner-review, and test builds:

- Legal pages may render even when `legalReviewStatus = needs_lawyer_review`.
- Admin/staging UI must show a clear badge:
  - `Draft — pending lawyer review`
  - `Lawyer approved`
  - `Revision requested`
- Public staging may show draft pages, but the environment must not represent them as final production legal terms.

### 3.3 Production gate

For production launch:

- Required legal pages must be `lawyer_approved`.
- Launch readiness check must fail if any required page is not approved.
- The failure must print a clear list of missing approvals.

Required production legal pages:

- Terms of Service
- Candidate / Job Seeker Terms
- Employer / Company Terms
- University / Campus Terms, if campus is enabled at launch
- Privacy Policy
- Data Rights / Data Requests Policy
- Cookie Policy
- Community Guidelines
- Safety & Reporting Policy
- Acceptable Use Policy
- Communication / WhatsApp Policy
- Fees / Payments / Refund Policy, if paid plans or paid services are enabled
- Legal Requests / Disclosure Policy
- Accessibility Statement
- Contact / Complaints Policy

### 3.4 Suggested environment variable

Add or reuse an environment variable such as:

```bash
LEGAL_CONTENT_ENFORCEMENT_MODE=staging|production
```

Behavior:

- `staging`: allow drafts; show draft badges.
- `production`: require approvals; fail launch gate if missing.

---

## 4. Syria-first legal schedule for lawyer review

This is not legal advice. It is the engineering/product checklist that should be given to a Syrian-qualified lawyer before production approval.

### 4.1 Employment-service classification

Ask the lawyer to confirm whether Hala Job is legally treated as:

1. a software job board / marketplace only,
2. a private employment agency,
3. a recruitment/supply agency,
4. a hybrid platform needing specific operating terms or registration.

Why this matters:

- Syrian Labour Law No. 17/2010 covers labour relations and includes provisions around authorizing private employment agencies and agencies for supply/recruitment of workers.
- Hala Job must be careful not to promise guaranteed jobs, hiring outcomes, wages, immigration status, or employer compliance unless verified.

Product/legal wording should say clearly:

- Hala Job connects candidates, employers, and campus partners.
- Hala Job is not the employer unless explicitly stated.
- Employers are responsible for job accuracy, hiring decisions, contracts, wages, workplace safety, and legal compliance.
- Candidates are responsible for truthful profiles, CVs, documents, and application information.
- Universities/campus partners are responsible for student-verification data they provide.

### 4.2 Syrian personal-data protection

Ask the lawyer to approve the Privacy Policy against Syria's electronic personal-data protection framework.

The Privacy Policy should clearly explain:

- who controls the data,
- what data Hala Job collects,
- why it collects it,
- how long it keeps it,
- who it shares it with,
- whether data is transferred outside Syria,
- how users can request access/export/correction/deletion,
- how CVs, identity documents, student documents, employer documents, and support/report evidence are handled,
- how account deletion affects applications, audit logs, legal reports, and employer records,
- how security incidents and legal requests are handled.

### 4.3 Data minimization for Syria context

Syria-first launch should minimize unnecessary sensitive data.

Codex should ensure Help/Support/Report/Privacy copy and forms do not encourage users to submit unnecessary sensitive information unless needed.

Add helper text near support/report uploads:

> Do not upload national ID, passport, medical, family, political, religious, or highly sensitive documents unless they are specifically required for this request.

For student verification and employer verification, if documents are required:

- explain why,
- show who can see them,
- show retention period or deletion rule,
- restrict access to authorized admin roles,
- audit all downloads/views.

### 4.4 WhatsApp and off-platform communication

Because the app has manual WhatsApp sharing/communication surfaces, add a clear Communications Policy:

- Hala Job may provide optional contact methods such as WhatsApp links.
- Users should not send money, passwords, OTPs, private documents, or sensitive personal data via unofficial channels.
- Hala Job cannot fully monitor or secure off-platform conversations.
- Report suspicious job offers, payment requests, harassment, fake companies, or unsafe communication.
- Employer contact details should only be shown according to privacy/contact preferences and platform rules.

### 4.5 Job-advertisement and employer responsibility

Employer Terms and Safety Policy should require:

- no fake jobs,
- no illegal fees charged to candidates unless clearly lawful and approved,
- no discrimination or harassment,
- no misleading salary/benefits,
- no request for money, gift cards, banking passwords, OTPs, or unrelated documents,
- clear job location, role, working model, salary/pay range where available, and contract type,
- truthful company identity.

Add report reasons that map to admin workflow:

- fake job / scam,
- asks for money,
- misleading salary or role,
- unsafe or abusive communication,
- discrimination or harassment,
- suspicious document request,
- privacy concern,
- illegal or restricted content,
- other.

### 4.6 Sanctions/payment/compliance note

If the company, hosting, payment processor, analytics provider, email/SMS provider, or any entity is outside Syria, lawyer/operations must verify sanctions and provider compliance.

Engineering requirement:

- Do not hard-code claims that all payments, premium services, or international transfers are available in Syria.
- Add config-driven enable/disable for paid plans, card payments, international payments, and premium services.
- Legal pages should say that some services may be unavailable because of provider, payment, compliance, or legal restrictions.

### 4.7 Arabic/English legal language

For Syria-first launch:

- Arabic should be treated as the primary legal user language if the app targets Syrian users broadly.
- English can exist as support text.
- Admin should track legal approval per language.

Recommended model:

```js
legalReview: {
  ar: { status: "needs_lawyer_review", reviewedBy, reviewedAt, version },
  en: { status: "needs_lawyer_review", reviewedBy, reviewedAt, version }
}
```

If that is too large for now, add at least a TODO and a launch check that required production pages have Arabic and English content present.

---

## 5. Web requirements

### 5.1 Public Legal Center

Routes that must exist and remain reachable:

- `/legal`
- `/legal/:key`
- `/terms`
- `/privacy`
- `/cookies` or `/cookie-policy`
- `/community-guidelines`
- `/accessibility`
- `/report`
- `/support`
- `/help`
- `/faq`
- `/contact`

Required UX states:

- loading,
- not found,
- unavailable/draft in production,
- network error,
- last updated date,
- version,
- legal review badge in admin/staging.

### 5.2 Web Help Center

The web Help Center must support:

- categories list,
- category article list,
- full article detail,
- FAQ,
- search if already available or a clean placeholder if not,
- contact support CTA,
- report concern CTA,
- privacy/data rights CTA.

Every article card must open a full detail page.

### 5.3 Web Support Inbox

Authenticated users must be able to:

- create a support ticket,
- list my tickets,
- open ticket detail,
- reply to ticket,
- close ticket,
- see status,
- see created/updated timestamps,
- see admin replies.

Unauthenticated users may use a contact/support form, but authenticated support should be tied to account history.

### 5.4 Web Privacy Center

Web Privacy Center must include:

- export my account data,
- request account deletion,
- cancel deletion request,
- request correction/access/marketing opt-out,
- accessibility request,
- history/status of requests if backend supports it,
- clear warning before deletion.

Export must use the direct export endpoint, not only a generic privacy request.

Deletion must use the direct delete-request endpoint, not only a generic privacy request.

### 5.5 Web Report Concern

Report forms must support both generic and contextual reports.

Generic report:

```json
{
  "targetType": "general",
  "targetId": null,
  "reason": "...",
  "description": "..."
}
```

Contextual report from job/company/application/profile/message/resource/content:

```json
{
  "targetType": "job",
  "targetId": "real-id-here",
  "reason": "fake_job",
  "description": "..."
}
```

Do not drop target metadata.

---

## 6. Mobile requirements

### 6.1 Mobile Legal Center

Mobile must have a clear Legal Center reachable from Settings/More/Help:

- Legal Center list,
- legal page detail,
- last updated/version,
- draft badge in staging/admin mode,
- production fallback if page not approved.

Use locked native chrome only.

### 6.2 Mobile Help Center

Add full article detail. Required flow:

```text
Help Center
└─ Category
   └─ Article list
      └─ Full article detail
```

Add or wire:

- `LegalHelpService.helpArticle(key)`
- `HelpArticleDetailScreen`
- route/navigation from article row to detail screen

Article detail should show:

- title,
- summary,
- body/content,
- related category,
- contact support CTA,
- report issue CTA if relevant.

### 6.3 Mobile Support Inbox

Mobile must support the same user support lifecycle:

- create ticket,
- list my tickets,
- ticket detail,
- reply,
- close,
- status/history.

Approved placement:

```text
More / Help & Support
├─ Help Center
├─ My Support Tickets
├─ Contact Support
├─ Report Concern
├─ Privacy & Data Rights
├─ Accessibility Request
└─ Legal Center
```

Do not bury support ticket history only inside Settings.

### 6.4 Mobile Privacy & Data Rights

Unify Privacy Center and Settings.

Mobile must use direct endpoints for:

- account export,
- account deletion request,
- cancel deletion request.

Generic privacy requests should remain for:

- access question,
- correction,
- marketing opt-out,
- other privacy concern.

Add deletion warning:

- explain what is deleted,
- explain what may be retained for legal/security/audit reasons,
- require confirmation.

### 6.5 Mobile Accessibility Request

Add a first-class mobile form:

```text
Accessibility Request
├─ What do you need help with?
├─ Device/platform
├─ Preferred contact method
├─ Message
└─ Submit
```

Wire to:

```text
/user/v1/privacy/accessibility
```

### 6.6 Mobile Contextual Reports

All report buttons opened from context must pass real metadata.

Examples:

- Job detail → `targetType=job`, `targetId=job.id`
- Company profile → `targetType=company`, `targetId=company.id`
- Application detail → `targetType=application`, `targetId=application.id`
- Message/thread → `targetType=message` or `application_message`, `targetId=message.id`
- Resource/article → `targetType=content` or `resource`, `targetId=resource.id`

Keep generic report from Help Center as `targetType=general`.

---

## 7. Admin requirements

### 7.1 Split admin support queues clearly

Admin Support/Legal must show two distinct queues:

1. **User Support**
   - seeker support tickets,
   - campus student support tickets,
   - university user tickets if applicable,
   - general logged-in user tickets.

2. **Company Support**
   - company/employer support tickets.

Do not let general user tickets disappear because the admin UI only queries company support.

Required admin actions for both queues:

- open ticket,
- reply,
- assign owner if supported,
- update status,
- update priority,
- close/reopen,
- view audit trail,
- filter by status, role, category, priority, date.

### 7.2 Legal reports admin workflow

Admin legal reports must have statuses:

- `open`,
- `in_review`,
- `request_info`,
- `escalated`,
- `resolved`,
- `rejected`.

Admin should see:

- target type,
- target ID,
- target title/name if resolvable,
- reporter,
- reason,
- description,
- created date,
- status,
- internal notes,
- action history.

### 7.3 Privacy requests admin workflow

Admin privacy requests must show:

- requester,
- type,
- status,
- created date,
- due date if applicable,
- admin notes,
- completion/rejection reason,
- link to export/deletion task if applicable.

Statuses:

- `received`,
- `in_progress`,
- `waiting_for_user`,
- `completed`,
- `rejected`,
- `cancelled`.

### 7.4 Accessibility requests admin workflow

Admin accessibility requests must show:

- requester,
- contact method,
- issue category,
- message,
- platform/device,
- status,
- resolution notes.

Statuses:

- `received`,
- `in_progress`,
- `resolved`,
- `closed`.

### 7.5 Legal content approval admin workflow

Admin/content team must be able to see:

- page key,
- language,
- title,
- last updated,
- legal review status,
- reviewer,
- reviewed date,
- version,
- production publish eligibility.

Only authorized admin role should mark `lawyer_approved`.

Add audit log for approval changes.

---

## 8. Content requirements

### 8.1 Keep existing content, but add missing Syria-first schedule

Do not replace all content. Add a Syria launch legal review schedule page or admin-only checklist.

Suggested page key:

```text
syria-launch-legal-schedule
```

Sections:

- Platform classification: job board vs employment agency.
- Candidate terms review.
- Employer terms review.
- University/campus terms review.
- Data protection and privacy review.
- CV/document handling review.
- WhatsApp/off-platform communication review.
- Reporting/safety/escalation review.
- Payment/subscription availability review.
- Sanctions/provider availability review.
- Arabic/English legal-language approval.

### 8.2 Add missing user-facing policy language areas

Add or ensure clear content exists for:

- no guaranteed employment,
- employer responsibility for job posts and hiring compliance,
- candidate responsibility for truthful information,
- university/campus responsibility for verification data,
- safe communication rules,
- no payment requests to candidates,
- privacy/data requests,
- support response expectations,
- report abuse/suspicious jobs,
- account deletion/export,
- accessibility support,
- off-platform WhatsApp caution,
- sanctions/provider/service availability caveat,
- SYP/pricing availability caveat if payments are not fully enabled.

### 8.3 Content status rule

For production:

- public legal pages with `needs_lawyer_review` should not be served as final legal policy.
- if a required legal page is not approved, production launch gate must fail before deploy.

For staging:

- drafts may be visible with a badge.

---

## 9. Currency / Syria-first payments requirement

Current issue:

- Parts of the app appear to use SYP.
- The global launch contract may only allow USD/EUR/GBP.

Decision required:

- If launching in Syria first, SYP should be treated as first-class display currency where salary/pay is relevant.
- If payments/subscriptions are not enabled in Syria at launch, disable paid plan purchase flows and state that paid services are not yet available.

Engineering tasks:

- Add SYP to allowed display currencies if missing.
- Keep salaries separate from subscription payments.
- Do not imply payment support in Syria unless the provider/legal team confirms it.
- Add tests for SYP salary display and disabled payment purchase when payments are off.

---

## 10. Testing requirements

### 10.1 Web tests

Add/keep tests proving:

- `/help` renders categories.
- Category opens article list.
- Article opens full article detail.
- `/legal` renders legal index.
- `/legal/:key` renders page detail and version/date.
- `/support` can create support ticket.
- Authenticated support can list tickets.
- Ticket detail can reply and close.
- `/privacy` can export/delete/cancel via direct endpoints.
- `/accessibility` submits accessibility request.
- `/report` submits generic report.
- Report from job/company/application submits target type and ID.
- Draft legal badge appears in staging.
- Production launch gate fails if required pages are not lawyer-approved.

### 10.2 Mobile tests

Add static/widget tests proving:

- Help Center has category → article list → article detail.
- Legal Center list opens legal page detail.
- Support has My Tickets, Create Ticket, Ticket Detail, Reply, Close.
- Privacy/Data Rights has Export, Delete, Cancel Delete, Generic Privacy Request.
- Accessibility request screen exists and submits.
- Report from job carries `targetType=job` and real `targetId`.
- Report from company carries `targetType=company` and real `targetId`.
- Legal/help/support screens use approved mobile chrome.
- No raw unapproved app bar/header introduced.

### 10.3 Admin tests

Add tests proving:

- Admin sees User Support queue.
- Admin sees Company Support queue.
- Admin can reply/status/close user support ticket.
- Admin can reply/status/close company support ticket.
- Admin legal reports show target metadata.
- Admin privacy requests show status/actions.
- Admin accessibility requests show status/actions.
- Only authorized admin can mark legal page `lawyer_approved`.
- Approval status changes are audited.

### 10.4 Backend/integration reliability

Fix tests so they are reproducible in CI and fresh checkout.

Problem to avoid:

- DB-backed tests that fail because `mongodb-memory-server` tries to download a MongoDB binary at test time and the environment blocks network.

Acceptable fixes:

- cache the binary in CI,
- use a pinned local test MongoDB service,
- provide a documented fallback test mode,
- skip only with explicit reason and separate coverage elsewhere.

---

## 11. Acceptance commands

Codex must provide command output for:

```bash
npm ci --ignore-scripts
npm run check:syntax
npm run check:imports
npm run check:permissions
npm run check:secrets
npm run check:i18n
npm run check:content
npm run check:emails
npm run check:web-routes
npm run test:mobile-ui-contract
npm run test:mobile-routes
npm run test:bilingual-ui-payload
npm run test:function-placement-map
npm run test:ui-actions
npm run test:critical-launch-blockers
npm --prefix web ci --ignore-scripts
npm --prefix web run build
npm --prefix web test -- --run
```

If Flutter is available in Codex environment:

```bash
cd mobile
flutter analyze
flutter test
```

Do not include manual real-device checks in the release score, per founder instruction. Manual device issues can be fixed separately.

---

## 12. Implementation order

Recommended commit sequence:

### Commit 1 — Fix current failing tests

- Fix existing failing web campus tests from the latest package.
- Do not change legal/help/support behavior in this commit.

### Commit 2 — Legal review gate

- Keep `legalReviewStatus`.
- Add staging/production enforcement mode.
- Add production required-page approval check.
- Add admin/staging draft badges.
- Add tests.

### Commit 3 — Web support lifecycle

- Add authenticated My Support Tickets.
- Add ticket detail/reply/close.
- Add empty/error/loading states.
- Add tests.

### Commit 4 — Mobile Help article detail

- Add full article endpoint usage.
- Add `HelpArticleDetailScreen`.
- Add navigation and tests.

### Commit 5 — Mobile support lifecycle

- Add My Tickets.
- Add ticket detail/reply/close.
- Add tests.

### Commit 6 — Admin support split

- Add User Support queue using the correct general support backend route/model.
- Keep Company Support queue separate.
- Add status/reply/close for both.
- Add tests.

### Commit 7 — Privacy/Data Rights unification

- Web and mobile direct export/delete/cancel.
- Generic privacy requests remain for correction/access/opt-out.
- Add request history/status where possible.
- Add tests.

### Commit 8 — Accessibility requests

- Add mobile accessibility request form.
- Ensure web accessibility request remains wired.
- Add admin accessibility queue/actions.
- Add tests.

### Commit 9 — Contextual reports

- Pass `targetType` and `targetId` from all contextual report buttons.
- Add admin target metadata display.
- Add legal report status workflow.
- Add tests.

### Commit 10 — Syria legal schedule + content polish

- Add Syria Launch Legal Schedule page/checklist.
- Add missing policy sections as draft/pending review.
- Add Arabic/English completeness check or TODO gate.
- Add SYP/payment availability clarification.
- Add tests.

### Commit 11 — Final proof and docs refresh

- Run all acceptance commands.
- Update handover with exact commit hash and test output.
- Mark remaining lawyer approval as production launch dependency, not product/UI blocker.

---

## 13. Final scoring rubric

After implementation, score this slice as follows:

| Area | 9.5 Target |
|---|---|
| Backend routes | All required routes exist and are tested |
| Web public pages | Legal/help/faq/support/privacy/accessibility/report complete |
| Mobile pages | Same lifecycle as web, with native locked chrome |
| User support | Create/list/detail/reply/close on web and mobile |
| Admin support | User + company queues both actionable |
| Legal reports | Contextual metadata + admin workflow |
| Privacy/data rights | Export/delete/cancel/access/correction/opt-out clear |
| Accessibility | Web/mobile forms + admin workflow |
| Legal status | Staging drafts allowed; production lawyer approval required |
| Syria context | Legal schedule and content gaps clearly surfaced |
| Tests | Placement, wiring, admin, and launch gates covered |

Do not claim 9.5 until all rows are satisfied.

---

## 14. Final instruction to Codex

Take the current 8.1/10 Legal / Help / Support implementation and finish it to 9.5/10.

Do not change the visual theme.
Do not delete legal review status.
Do not add unrelated features.
Do not block staging work on lawyer review.
Do enforce lawyer approval for production launch.

Make the product honest, easy to navigate, Syria-first, support-operable, privacy-aware, and test-proven.

