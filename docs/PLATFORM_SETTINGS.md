# Platform Settings

Platform settings centralize feature flags and launch controls. AI tools are optional/beta and must not be required for Syria launch.

## Main Backend Surfaces

- Models: `PlatformSettingsModel`, `CompanySettingsModel`, `UniversitySettingsModel`, `UserSettingsModel`.
- Controllers: `controllers/settings/`.
- Service: `services/settings/platformSettings.service.js`.
- Admin route surfaces under platform settings.
- Public client route: `GET /public/v1/client-settings`.
- Compatibility alias: `GET /public/v1/settings/client` for older mobile/web clients.
- User/company/university settings use role-scoped permissions.
- Full admin platform settings require `settings.view` or `settings.manage`;
  `dashboard.view` alone can read dashboard summaries but not launch controls.

Use `loadPlatformSettings()`, `getPlatformSetting()`, and
`isFeatureEnabled()` for new launch-gated behavior. Do not copy platform
defaults into controllers or UI-specific code.

## Launch Defaults

- `FEATURE_AI_TOOLS_ENABLED=false`.
- DB-backed platform settings are authoritative when present. When the default
  platform settings record is missing a value, the backend falls back to the
  matching `FEATURE_*` environment variable before using the Syria launch
  default.
- Client defaults keep `security.otp_digits=5`.
- CV studio, resource library, interview prep, saved searches, salary insights,
  campus career center, video interviews, talent-pool CRM, and employer branding
  default on because they are launch product surfaces.
- AI tools default off and must be shown only when both compiled and client
  platform flags allow them.
- Official WhatsApp provider disabled unless operations explicitly enables it.
- Manual WhatsApp sharing remains enabled because it does not require provider
  integration.
- SMS provider disabled until a real provider is configured.
- Feature flags should fail closed for confusing or non-launch-critical features.

## UI Surfaces

- Seeker: `settings`.
- Company: `team/settings`.
- Campus: `settings`.
- Admin: `platform settings`.

## Verification

Run:

```bash
npm run test:integration:auth-context
npm run test:route-validation
npm run test:integration:syria-product
```

These checks cover scoped settings access, route validation, and launch feature contracts.
