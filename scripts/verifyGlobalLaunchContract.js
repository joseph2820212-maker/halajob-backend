import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  SUPPORTED_LAUNCH_CURRENCIES,
  SUPPORTED_LAUNCH_WORK_MODES,
  assertLaunchJobLocation,
  assertSupportedLaunchCurrencyCode,
  assertSupportedLaunchWorkModeKey,
  launchCurrencyQuery,
  launchWorkModeDefinition,
  launchWorkModeQuery,
  normalizeLaunchWorkModeKey,
} from "../services/globalLaunchContract.service.js";

const rejects = (fn, code) => {
  try {
    fn();
  } catch (error) {
    assert.equal(error.code, code);
    assert.equal(error.statusCode, 422);
    return;
  }

  throw new Error(`Expected ${code} to be rejected`);
};

assert.deepEqual(SUPPORTED_LAUNCH_CURRENCIES, ["SYP", "USD", "EUR"]);
assert.deepEqual(SUPPORTED_LAUNCH_WORK_MODES, ["onsite", "remote", "hybrid"]);

assert.equal(assertSupportedLaunchCurrencyCode("usd"), "USD");
assert.equal(assertSupportedLaunchCurrencyCode("EUR"), "EUR");
assert.equal(assertSupportedLaunchCurrencyCode(" syp "), "SYP");
rejects(() => assertSupportedLaunchCurrencyCode("GBP"), "unsupported_salary_currency");
rejects(() => assertSupportedLaunchCurrencyCode("SAR"), "unsupported_salary_currency");
rejects(() => assertSupportedLaunchCurrencyCode("AED"), "unsupported_salary_currency");

assert.deepEqual(launchCurrencyQuery(), { code: { $in: ["SYP", "USD", "EUR"] } });

assert.equal(normalizeLaunchWorkModeKey("On Site"), "onsite");
assert.equal(normalizeLaunchWorkModeKey("حضوري"), "onsite");
assert.equal(normalizeLaunchWorkModeKey("work from home"), "remote");
assert.equal(normalizeLaunchWorkModeKey("عن بعد"), "remote");
assert.equal(assertSupportedLaunchWorkModeKey("mixed"), "hybrid");
assert.equal(assertSupportedLaunchWorkModeKey("هجين"), "hybrid");
rejects(() => assertSupportedLaunchWorkModeKey("flexible"), "unsupported_work_mode");

assert.deepEqual(launchWorkModeQuery(), {
  key: { $in: ["onsite", "remote", "hybrid"] },
});
assert.equal(launchWorkModeDefinition("onsite").title_ar, "حضوري");
assert.equal(launchWorkModeDefinition("remote").title_ar, "عن بعد");
assert.equal(launchWorkModeDefinition("hybrid").title_ar, "هجين");
assert.deepEqual(launchWorkModeDefinition("remote").keywords_ar, [
  "عن بعد",
  "من المنزل",
  "عمل من المنزل",
  "اونلاين",
]);

assert.doesNotThrow(() => assertLaunchJobLocation({ workModeKey: "remote" }));
assert.doesNotThrow(() =>
  assertLaunchJobLocation({ workModeKey: "onsite", city: "London" })
);
assert.doesNotThrow(() =>
  assertLaunchJobLocation({ workModeKey: "hybrid", cities: ["Manchester"] })
);
rejects(
  () => assertLaunchJobLocation({ workModeKey: "onsite" }),
  "city_required_for_work_mode"
);
rejects(
  () => assertLaunchJobLocation({ workModeKey: "hybrid", cities: [] }),
  "city_required_for_work_mode"
);

const companyHelperSource = readFileSync(
  "controllers/companyDash/information/companyInformationHelperController.js",
  "utf8"
);
const employeeHelperSource = readFileSync(
  "controllers/employeeDash/information/informationHelperController.js",
  "utf8"
);

for (const [label, source] of [
  ["company helper", companyHelperSource],
  ["employee helper", employeeHelperSource],
]) {
  assert.match(source, /launchCurrencyQuery/);
  assert.match(source, /launchWorkModeQuery/);
  assert.match(
    source,
    /extraQuery:\s*\(\)\s*=>\s*launchCurrencyQuery\(\)/,
    `${label} must filter visible currency helpers to USD/EUR/GBP`
  );
  assert.match(
    source,
    /extraQuery:\s*\(\)\s*=>\s*launchWorkModeQuery\(\)/,
    `${label} must filter visible work-mode helpers to onsite/remote/hybrid`
  );
}

console.log("Global launch contract verified.");
