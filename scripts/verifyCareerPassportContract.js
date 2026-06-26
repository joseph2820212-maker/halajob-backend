import assert from "node:assert/strict";
import {
  sanitizeCareerPassportScore,
  sanitizeCareerPassportSnapshotForShare,
} from "../services/careerPassport.service.js";

const sanitized = sanitizeCareerPassportSnapshotForShare(
  {
    identity: {
      user_id: "user-1",
      employee_id: "employee-1",
      name: "Demo Candidate",
      headline: "Graduate analyst",
      profile_photo: "https://private.example/photo.png",
      badges: {
        student_verified: true,
        education_added: true,
        cv_added: true,
      },
    },
    education: {
      university: "Hala University",
      major: "Business",
      records: [
        {
          id: "education-1",
          level: "Bachelor",
          study: "Business",
          institution: "Hala University",
          start_date: "2022-01-01T00:00:00.000Z",
        },
      ],
    },
    experience_projects: {
      projects: [
        {
          id: "project-1",
          name: "Campus hiring dashboard",
          description: "Student placement project",
          technologies: ["Flutter", "Node"],
        },
      ],
      links: [{ id: "link-1", title: "Portfolio", url: "https://example.com" }],
    },
    skills: {
      hard_skills: ["Sales", "CRM"],
      languages: ["English", "Arabic"],
    },
    cv_assets: {
      uploaded_count: 2,
      generated_count: 1,
      active_cv: {
        id: "cv-1",
        title: "Main CV",
        file_name: "main.pdf",
        url: "https://private.example/cv.pdf",
        status: "active",
      },
      cvs: [
        {
          id: "cv-1",
          title: "Main CV",
          file_name: "main.pdf",
          url: "https://private.example/cv.pdf",
          status: "active",
        },
      ],
    },
    readiness: {
      profile_completion: 82,
      application_count: 3,
      employability_score: {
        total: 84,
        source: "rule_based_v1",
        generated_by_ai: false,
        explanation: "Ready for employer review.",
        components: [
          {
            key: "cv_quality",
            label: "CV quality",
            weight: 20,
            score: 75,
            explanation: "CV evidence is present.",
          },
        ],
        strengths: ["Profile is mostly complete."],
        next_actions: ["Add more role-relevant skills."],
      },
    },
    privacy: {
      visibility: "companies_only",
      share_enabled: true,
      share_token: "secret-share-token",
      share_expires_at: "2026-12-31T00:00:00.000Z",
    },
  },
  { viewerType: "company" }
);

assert.equal(sanitized.identity.name, "Demo Candidate");
assert.equal(sanitized.identity.badges.student_verified, true);
assert.equal(sanitized.identity.user_id, undefined);
assert.equal(sanitized.identity.employee_id, undefined);
assert.equal(sanitized.identity.profile_photo, undefined);
assert.equal(sanitized.privacy.share_token, undefined);
assert.equal(sanitized.privacy.viewer_type, "company");
assert.equal(sanitized.cv_assets.active_cv.title, "Main CV");
assert.equal(sanitized.cv_assets.active_cv.url, undefined);
assert.equal(sanitized.cv_assets.active_cv.id, undefined);
assert.equal(sanitized.cv_assets.cvs[0].url, undefined);
assert.equal(sanitized.cv_assets.cvs[0].id, undefined);
assert.equal(sanitized.education.records[0].id, undefined);
assert.equal(sanitized.experience_projects.projects[0].id, undefined);
assert.deepEqual(sanitized.skills.hard_skills, ["Sales", "CRM"]);
assert.equal(sanitized.readiness.employability_score.total, 84);
assert.equal(
  sanitized.readiness.employability_score.components[0].label,
  "CV quality"
);

const score = sanitizeCareerPassportScore({
  total: 140,
  generatedByAi: true,
  nextActions: ["One", "One", "Two"],
});

assert.equal(score.total, 100);
assert.equal(score.generated_by_ai, true);
assert.deepEqual(score.next_actions, ["One", "Two"]);

console.log("Career Passport sharing contract verified.");
