# Search / Matching Integration

تمت إضافة طبقة تكامل بين الوظائف والشركات والموظفين بدون كسر البنية القديمة.

## الملفات الجديدة

- `models/JobEmployeeMatchModel.js`
- `services/search/normalizeSearch.js`
- `services/search/buildJobProjection.js`
- `services/search/buildEmployeeProjection.js`
- `services/search/buildCompanyProjection.js`
- `services/search/rebuildSearchData.js`
- `services/matching/jobEmployeeMatching.js`
- `scripts/rebuildSearchIntegration.js`

## الحقول الجديدة

### Job

- `search_projection.company`
- `search_projection.requirements`
- `search_projection.ranking`
- `search_projection.matching`

### Employee

- `matching_profile`

### Company

- `company_projection`

## التشغيل الأولي بعد النشر

```bash
npm run rebuild:search
```

هذا الأمر يعيد بناء:

1. Company Projection
2. Employee Matching Profile
3. Job Search Projection
4. Job/Employee Matches

## Endpoints مضافة

### Employee

```http
GET /employee/global/jobs/recommended
POST /employee/global/profile/rebuild-search-filters
```

### Company

```http
GET /company/global/jobs/:jobId/recommended-employees
POST /company/global/profile/rebuild-search-filters
```

> قد يختلف prefix حسب طريقة تركيب routes في `app.js`.

## طريقة الربط

- عند تعديل الشركة: يتم تحديث `company_projection` وإعادة بناء projections لوظائف الشركة.
- عند إنشاء/تعديل/نشر وظيفة: يتم تحديث `search_projection` ثم حساب المطابقات إن كانت منشورة ومقبولة وفعالة.
- عند تعديل بيانات الموظف المهمة: يتم تحديث `search_filters` و `matching_profile` ثم إعادة حساب المطابقات.

## ملاحظة أداء

حساب المطابقات يعمل الآن مباشرة داخل request. إذا كبر عدد الوظائف أو الموظفين، انقل تنفيذ:

- `rebuildMatchForJob`
- `rebuildMatchForEmployee`

إلى Queue مثل BullMQ.
