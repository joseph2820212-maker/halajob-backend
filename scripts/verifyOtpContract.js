import { readRepoFile } from "./utils/repoPaths.js";

const read = readRepoFile;

const requiredPatterns = [
  ["services/passcodeHash.service.js", /const OTP_MIN = 10000;/],
  ["services/passcodeHash.service.js", /const OTP_MAX = 100000;/],
  ["services/passcodeHash.service.js", /crypto\.randomInt\(OTP_MIN,\s*OTP_MAX\)/],
  ["controllers/app/Auth/authController.js", /createPasscode = generatePasscode/],
  ["controllers/app/Auth/ForgotPasswordController.js", /generatePasscode\(\)/],
  ["controllers/app/Auth/LoginController.js", /createPasscode = generatePasscode/],
  ["controllers/app/Auth/RegisterController.js", /createPasscode = generatePasscode/],
  ["controllers/app/Auth/ResendOtpController.js", /createPasscode = generatePasscode/],
  ["controllers/app/campus/campusController.js", /randomInt\(10000,\s*100000\)/],
  ["validations/authValidations.js", /\\d\{5\}/],
  ["mobile/lib/src/features/auth/auth_screen.dart", /const _passcodeLength = 5;/],
  ["mobile/lib/src/features/auth/auth_screen.dart", /RegExp\(r'\^\\d\{5\}\$'\)/],
  ["mobile/lib/src/features/auth/auth_service.dart", /RegExp\(r'\^\\d\{5\}\$'\)/],
  ["mobile/test/widget_test.dart", /passcode != '12345'/],
];

const forbiddenPatterns = [
  ["services/passcodeHash.service.js", /const OTP_MIN = 100000;|const OTP_MAX = 1000000;/],
  ["controllers/app/Auth/authController.js", /randomInt\(100000,\s*1000000\)/],
  ["controllers/app/Auth/ForgotPasswordController.js", /randomInt\(100000,\s*1000000\)/],
  ["controllers/app/Auth/LoginController.js", /randomInt\(100000,\s*1000000\)/],
  ["controllers/app/Auth/RegisterController.js", /randomInt\(100000,\s*1000000\)/],
  ["controllers/app/Auth/ResendOtpController.js", /randomInt\(100000,\s*1000000\)/],
  ["controllers/app/campus/campusController.js", /randomInt\(100000,\s*1000000\)/],
  ["validations/authValidations.js", /\\d\{6\}/],
  ["mobile/lib/src/features/auth/auth_screen.dart", /_passcodeLength = 6|\\d\{6\}/],
  ["mobile/lib/src/features/auth/auth_service.dart", /\\d\{6\}/],
  ["mobile/test/widget_test.dart", /passcode != '123456'|passcode: '123456'/],
];

const failures = [];

for (const [relativePath, pattern] of requiredPatterns) {
  const src = read(relativePath);
  if (!pattern.test(src)) failures.push(`${relativePath} is missing required OTP contract pattern ${pattern}`);
}

for (const [relativePath, pattern] of forbiddenPatterns) {
  const src = read(relativePath);
  if (pattern.test(src)) failures.push(`${relativePath} contains forbidden 6-digit OTP pattern ${pattern}`);
}

if (failures.length) {
  console.error("OTP contract verification failed:");
  for (const failure of failures) console.error(`  - ${failure}`);
  process.exit(1);
}

console.log("OTP contract verification passed: backend generators and mobile inputs are aligned to 5 digits.");
