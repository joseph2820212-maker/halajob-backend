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

console.log("[model-reference-integrity] ok");
