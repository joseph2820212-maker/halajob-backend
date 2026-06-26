import assert from "node:assert/strict";
import {
  SUPPORTED_LAUNCH_CURRENCIES,
  SUPPORTED_LAUNCH_WORK_MODES,
  assertLaunchJobLocation,
  assertSupportedLaunchCurrencyCode,
  assertSupportedLaunchWorkModeKey,
  launchCurrencyQuery,
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

assert.deepEqual(SUPPORTED_LAUNCH_CURRENCIES, ["USD", "EUR", "GBP"]);
assert.deepEqual(SUPPORTED_LAUNCH_WORK_MODES, ["onsite", "remote", "hybrid"]);

assert.equal(assertSupportedLaunchCurrencyCode("usd"), "USD");
assert.equal(assertSupportedLaunchCurrencyCode("EUR"), "EUR");
assert.equal(assertSupportedLaunchCurrencyCode(" gbp "), "GBP");
rejects(() => assertSupportedLaunchCurrencyCode("SAR"), "unsupported_salary_currency");
rejects(() => assertSupportedLaunchCurrencyCode("AED"), "unsupported_salary_currency");

assert.deepEqual(launchCurrencyQuery(), { code: { $in: ["USD", "EUR", "GBP"] } });

assert.equal(normalizeLaunchWorkModeKey("On Site"), "onsite");
assert.equal(normalizeLaunchWorkModeKey("work from home"), "remote");
assert.equal(assertSupportedLaunchWorkModeKey("mixed"), "hybrid");
rejects(() => assertSupportedLaunchWorkModeKey("flexible"), "unsupported_work_mode");

assert.deepEqual(launchWorkModeQuery(), {
  key: { $in: ["onsite", "remote", "hybrid"] },
});

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

console.log("Global launch contract verified.");
