import assert from "node:assert/strict";
import { readRepoFile } from "./utils/repoPaths.js";

const read = (file) => readRepoFile(file);

const webI18n = read("web/src/shared/i18n.ts");
const webApi = read("web/src/shared/api.ts");
const webApiTest = read("web/src/shared/api.test.ts");
const webSmokeTest = read("web/src/tests/app-smoke.test.tsx");
const mobileL10n = read("mobile/lib/src/l10n/hala_job_localizations.dart");
const mobileApp = read("mobile/lib/src/app.dart");
const mobileLanguage = read("mobile/lib/src/core/localization/app_language.dart");
const mobileSessionStore = read("mobile/lib/src/session/session_store.dart");
const mobileAuth = read("mobile/lib/src/features/auth/auth_service.dart");
const mobileDashboard = read("mobile/lib/src/features/dashboard/dashboard_screen.dart");
const mobileCompany = read("mobile/lib/src/features/company/company_dashboard_screen.dart");
const mobileUniversity = read("mobile/lib/src/features/university/university_dashboard_screen.dart");

function assertContains(source, needle, label) {
  assert.ok(source.includes(needle), `${label} missing: ${needle}`);
}

function assertNotContains(source, needle, label) {
  assert.ok(!source.includes(needle), `${label} should not contain: ${needle}`);
}

function countOccurrences(source, needle) {
  let count = 0;
  let index = 0;
  while (index < source.length) {
    const next = source.indexOf(needle, index);
    if (next === -1) break;
    count += 1;
    index = next + needle.length;
  }
  return count;
}

function assertCountAtLeast(source, needle, minimum, label) {
  const actual = countOccurrences(source, needle);
  assert.ok(
    actual >= minimum,
    `${label} expected at least ${minimum} occurrence(s) of ${needle}, found ${actual}`,
  );
}

const criticalMobileKeys = [
  "appTitle",
  "language",
  "english",
  "arabic",
  "settings",
  "notifications",
  "profile",
  "signOut",
  "accountAndSettings",
  "aiHiringTools",
  "campusTesterMode",
  "verificationCodeSent",
];

const criticalWebUiKeys = [
  "Sign in",
  "Company portal",
  "Campus student access",
  "Admin panel",
  "CV Builder",
  "Salary insights",
  "Manual WhatsApp",
  "AI tools",
];

assertContains(webI18n, 'export type Lang = "ar" | "en";', "web i18n languages");
assertContains(webI18n, 'value === "ar" || value === "en"', "web language guard");
assertContains(webI18n, "preferredLangFromLanguages", "web browser language selection");
assertContains(webI18n, 'localStorage.getItem("jz_lang")', "web persisted language");
assertContains(webI18n, 'localStorage.setItem("jz_lang", detected)', "web persisted language");
assertContains(webI18n, "export const translateUi", "web UI translation helper");
for (const key of criticalWebUiKeys) {
  assertContains(webI18n, `"${key}"`, "web Arabic UI copy");
}

assertContains(webApi, 'localStorage.getItem("jz_lang") || "ar"', "web API language fallback");
assertContains(webApi, 'config.headers["x-language"] = lang;', "web x-language header");
assertContains(webApi, "config.headers.lan = lang;", "web legacy language header");
assertContains(webApiTest, 'expect(header(requests[0].headers, "x-language")).toBe("en");', "web API language test");
assertContains(webApiTest, 'expect(header(requests[0].headers, "lan")).toBe("en");', "web API legacy language test");
assertContains(webSmokeTest, 'document.documentElement.dir).toBe("rtl")', "web RTL smoke test");
assertContains(webSmokeTest, 'localStorage.getItem("jz_lang")).toBe("ar")', "web language persistence smoke test");

assertContains(
  mobileL10n,
  "static const supportedLocales = <Locale>[Locale('en'), Locale('ar')];",
  "mobile supported locales",
);
assertContains(mobileL10n, "static bool isSupportedCode(String code)", "mobile supported code guard");
assertContains(mobileL10n, "static Locale localeForCode(String? code)", "mobile locale fallback");
assertContains(mobileL10n, "bool get isArabic => locale.languageCode == 'ar';", "mobile Arabic guard");
assertContains(mobileL10n, "String t(String key)", "mobile keyed localization");
assertContains(mobileL10n, "String ui(String englishText)", "mobile UI phrase localization");
assertContains(mobileL10n, "'en': <String, String>{", "mobile English localization map");
assertContains(mobileL10n, "'ar': <String, String>{", "mobile Arabic localization map");
for (const key of criticalMobileKeys) {
  assertCountAtLeast(mobileL10n, `'${key}':`, 2, "mobile English/Arabic key parity");
}
assertContains(mobileL10n, "'AI hiring tools':", "mobile Arabic UI phrase map");
assertContains(mobileL10n, "'Manual WhatsApp':", "mobile Arabic UI phrase map");

assertContains(mobileApp, "AppLanguage.setCurrentCode(_locale.languageCode);", "mobile startup language state");
assertContains(mobileApp, "AppLanguage.setCurrentCode(restoredLocale.languageCode);", "mobile restored language state");
assertContains(mobileApp, "await widget.sessionStore.saveLocaleCode(nextLocale.languageCode);", "mobile language persistence");
assertContains(mobileApp, "supportedLocales: HalaJobLocalizations.supportedLocales", "mobile MaterialApp locales");
assertContains(mobileApp, "HalaJobLocalizations.delegate", "mobile localization delegate");
assertContains(mobileLanguage, "static const _supportedCodes = {'en', 'ar'};", "mobile language service");
assertContains(mobileSessionStore, "static const _localeKey = 'hala_locale_v1';", "mobile stored locale key");
assertContains(mobileSessionStore, "static const _supportedLocaleCodes = {'en', 'ar'};", "mobile stored locale guard");

assertCountAtLeast(mobileAuth, "request.headers.set('x-language', languageCode);", 3, "mobile x-language headers");
assertCountAtLeast(mobileAuth, "request.headers.set('lan', languageCode);", 3, "mobile legacy language headers");
assertContains(mobileAuth, "final languageCode = AppLanguage.currentCode;", "mobile request language source");

assertContains(mobileDashboard, "'settings-language-en'", "seeker/campus language control");
assertContains(mobileDashboard, "'settings-language-ar'", "seeker/campus language control");
assertContains(mobileCompany, "'company-settings-language-en'", "company language control");
assertContains(mobileCompany, "'company-settings-language-ar'", "company language control");
assertContains(mobileUniversity, "'university-settings-language-en'", "university language control");
assertContains(mobileUniversity, "'university-settings-language-ar'", "university language control");
assertNotContains(mobileL10n, "Locale('fr')", "mobile launch language scope");
assertNotContains(webI18n, 'value === "fr"', "web launch language scope");

console.log(
  "Bilingual UI/payload contract verified for English/Arabic web helpers, web request headers, mobile localization keys, mobile persisted locale controls, and mobile request language headers.",
);
