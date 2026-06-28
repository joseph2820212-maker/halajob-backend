# Hala Job — Structured Content Source of Truth (Gate 2)

This directory is the **single source of truth** for legal, privacy, help, and FAQ
content. It is bilingual (English + Arabic) and structured into content blocks so
mobile, web, and admin can render it consistently. Gate 3 seeds it into
`ContentPageModel` / `HelpCategoryModel` / `HelpArticleModel` / `FaqItemModel`.

> All legal/policy wording here is **professional draft content for review**, not
> legal advice. Every legal page carries `legalReviewStatus: "needs_lawyer_review"`
> and must be approved by a qualified lawyer before public launch.

## Layout
```
content/
  pages/      legal + privacy + public + billing + disclaimer pages (ContentPage)
  help/       help categories + articles (HelpCategory / HelpArticle)
  faq/        FAQ items grouped by audience (FaqItem)
```

## ContentPage shape (per item)
```jsonc
{
  "key": "terms_and_conditions",          // unique stable key (back-compat with PageModel)
  "category": "legal",                     // legal|privacy|trust|company|campus|help|public|billing
  "audience": ["public"],                  // public|seeker|employer|campus_student|university_admin|admin
  "title": { "en": "...", "ar": "..." },
  "summary": { "en": "...", "ar": "..." },
  "contentBlocks": [
    { "type": "heading|paragraph|bullet_list|notice|warning|legal_disclaimer",
      "text": { "en": "...", "ar": "..." },
      "items": [{ "en": "...", "ar": "..." }],   // for list types
      "severity": "info|warning|legal|danger|success",
      "sortOrder": 1 }
  ],
  "version": "2026.06.28",
  "requiresAcknowledgement": false,
  "legalReviewStatus": "needs_lawyer_review",
  "ownerDepartment": "legal"
}
```

## Quality rules (enforced by Gate 6 scripts)
- Both `en` and `ar` present for every title/summary/block.
- No `JobZain`/`jobzain`, no `TODO`/`lorem`/`coming soon` in content.
- Every legal page has a version and `legalReviewStatus`.
