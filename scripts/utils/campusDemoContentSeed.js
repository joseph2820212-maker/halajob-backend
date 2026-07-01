import fs from "node:fs";
import CampusContentModel from "../../models/CampusContentModel.js";

export const CAMPUS_DEMO_CONTENT_KEY = "default";
export const CAMPUS_DEMO_CONTENT_SOURCE = "demo-seed";
export const CAMPUS_DEMO_CONTENT_VERSION = "campus-content-v2";

const CAMPUS_CONTENT_PATH = new URL("../../data/campusContent.json", import.meta.url);

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

export function readCampusDemoContent() {
  return JSON.parse(fs.readFileSync(CAMPUS_CONTENT_PATH, "utf8"));
}

export async function seedCampusDemoContent({
  key = CAMPUS_DEMO_CONTENT_KEY,
  source = CAMPUS_DEMO_CONTENT_SOURCE,
} = {}) {
  const payload = readCampusDemoContent();
  return CampusContentModel.findOneAndUpdate(
    { key },
    {
      $set: {
        status: "published",
        version: CAMPUS_DEMO_CONTENT_VERSION,
        source,
        payload,
        seeded_at: new Date(),
      },
    },
    { new: true, upsert: true, setDefaultsOnInsert: true },
  );
}

export async function teardownCampusDemoContent({
  key = CAMPUS_DEMO_CONTENT_KEY,
} = {}) {
  return CampusContentModel.deleteOne({
    key,
    source: CAMPUS_DEMO_CONTENT_SOURCE,
  });
}

export async function verifyCampusDemoContentSeeded({
  key = CAMPUS_DEMO_CONTENT_KEY,
} = {}) {
  const doc = await CampusContentModel.findOne({
    key,
    status: "published",
  }).lean();

  if (!doc) {
    throw new Error(`Campus demo content "${key}" is not seeded.`);
  }

  const payload = clone(doc.payload || {});
  const opportunityCompanies = (payload.opportunities || []).map((item) =>
    String(item.company || ""),
  );
  const eventTitles = (payload.events || []).map((item) =>
    String(item.title || ""),
  );
  const resourceTitles = (payload.resources || []).map((item) =>
    String(item.title || ""),
  );

  if (!opportunityCompanies.includes("Nexa Retail")) {
    throw new Error("Campus demo content is missing the Nexa Retail opportunity.");
  }
  if (!eventTitles.includes("CV Office Hours")) {
    throw new Error("Campus demo content is missing the CV Office Hours event.");
  }
  if (!resourceTitles.includes("CV lab for students")) {
    throw new Error("Campus demo content is missing the CV lab resource.");
  }

  return {
    doc,
    payload,
    counts: {
      opportunities: (payload.opportunities || []).length,
      applications: (payload.applications || []).length,
      events: (payload.events || []).length,
      resources: (payload.resources || []).length,
    },
  };
}
