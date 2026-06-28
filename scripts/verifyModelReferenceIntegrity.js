import assert from "node:assert/strict";
import mongoose from "mongoose";
import {
  CityModel,
  CompanyModel,
  CountryModel,
  EmployeeModel,
} from "../models/index.js";

const refFor = (model, path) => model.schema.path(path)?.options?.ref;

assert.equal(CountryModel.collection.name, "countries", "CountryModel should own the countries collection");
assert.equal(CityModel.collection.name, "countries", "CityModel should be a semantic alias over the countries collection");
assert.ok(mongoose.modelNames().includes("cities"), "cities model must be registered for populate(city_id)");

const expectedCityRefs = [
  [CompanyModel, "city_id"],
  [CompanyModel, "company_locations.city_id"],
  [CompanyModel, "search_filters.location.city_id"],
  [EmployeeModel, "current_city_id"],
];

for (const [model, path] of expectedCityRefs) {
  assert.equal(refFor(model, path), "cities", `${model.modelName}.${path} should reference cities`);
}

assert.equal(refFor(CompanyModel, "country_id"), "countries", "CompanyModel.country_id should reference countries");
assert.equal(refFor(CompanyModel, "company_locations.country_id"), "countries", "CompanyModel.company_locations.country_id should reference countries");
assert.equal(refFor(CompanyModel, "search_filters.location.country_id"), "countries", "CompanyModel.search_filters.location.country_id should reference countries");
assert.equal(refFor(EmployeeModel, "current_country_id"), "countries", "EmployeeModel.current_country_id should reference countries");

// --- Comprehensive: every static `ref` must resolve to a registered model ---
// (importing models/index.js above registers all models). Walks arrays and
// nested subdocuments; dynamic refPath refs are intentionally skipped.
const registered = new Set(mongoose.modelNames());
const brokenRefs = [];

const checkSchema = (schema, modelName, prefix = "") => {
  schema.eachPath((pathName, schemaType) => {
    const full = prefix ? `${prefix}.${pathName}` : pathName;
    const ref = schemaType.options?.ref;
    if (typeof ref === "string" && !registered.has(ref)) {
      brokenRefs.push(`${modelName}.${full} -> "${ref}"`);
    }
    const casterRef = schemaType.caster?.options?.ref;
    if (typeof casterRef === "string" && !registered.has(casterRef)) {
      brokenRefs.push(`${modelName}.${full}[] -> "${casterRef}"`);
    }
    const subSchema = schemaType.schema || schemaType.caster?.schema;
    if (subSchema) checkSchema(subSchema, modelName, full);
  });
};

for (const name of mongoose.modelNames()) {
  checkSchema(mongoose.model(name).schema, name);
}

assert.equal(
  brokenRefs.length,
  0,
  `Broken model refs (target model not registered):\n  ${brokenRefs.join("\n  ")}`
);

console.log(`[model-reference-integrity] ok (${registered.size} models, all refs resolve)`);
