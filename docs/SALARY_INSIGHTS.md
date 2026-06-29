# Salary Insights

Salary insights use `JobModel.salary` as the canonical salary source. Do not misuse `JobSalaryModel` for launch analytics.

## Main Backend Surfaces

- Model: `SalaryInsightAggregateModel`.
- Services: `services/salaryInsights/`.
- Routes:
  - Public: `/public/v1/salary-insights`.
  - Seeker/campus: `/user/v1/salary-insights`.
  - Company: `/company/v1/salary-insights`.
  - Admin: `/dash/v1/salary-insights`.

## Product Rules

- Hidden or null salaries must not pollute public aggregates.
- Results expose ranges/confidence, not private company salary records.
- Company salary guidance can be used before posting a job.
- Admin can rebuild aggregates.

## Verification

Run:

```bash
npm run test:integration:salary-insights
```

This covers visible salary aggregation, hidden/null exclusion, median/confidence, company fair/below/above checks, public/user/company/admin routes, cache rebuild, and private company data redaction.

