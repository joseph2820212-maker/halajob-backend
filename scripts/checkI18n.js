import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();

const files = [
  'mobile/lib/l10n/app_ar.arb',
  'mobile/lib/l10n/app_localizations_ar.dart',
  'mobile/lib/src/l10n/hala_job_localizations.dart',
  'web/src/shared/i18n.ts',
];

const mojibakePattern = /[ÃÂØÙ�]|\\u00(?:c3|c2|d8|d9)|\\ufffd/i;
const arabicPattern = /[\u0600-\u06ff]/;
const hardcodedEnglishHeaderPattern =
  /headers\.set\(['"](?:x-language|lan)['"],\s*['"]en['"]\)/;

const failures = [];

for (const file of files) {
  const fullPath = path.join(root, file);
  if (!fs.existsSync(fullPath)) {
    failures.push(`${file}: missing translation resource`);
    continue;
  }

  const content = fs.readFileSync(fullPath, 'utf8');
  if (mojibakePattern.test(content)) {
    failures.push(`${file}: contains corrupted Arabic/mojibake characters`);
  }
  if (!arabicPattern.test(content)) {
    failures.push(`${file}: does not contain Arabic text`);
  }
}

for (const file of [
  'mobile/lib/src/core/network/app_api_client.dart',
  'mobile/lib/src/features/auth/auth_service.dart',
]) {
  const fullPath = path.join(root, file);
  if (!fs.existsSync(fullPath)) {
    failures.push(`${file}: missing mobile API client`);
    continue;
  }

  const content = fs.readFileSync(fullPath, 'utf8');
  if (hardcodedEnglishHeaderPattern.test(content)) {
    failures.push(`${file}: hardcodes x-language/lan to English`);
  }
}

if (failures.length) {
  console.error('i18n check failed:');
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log('i18n check passed: Arabic resources are present and not mojibake.');
