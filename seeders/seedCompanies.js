import bcrypt from "bcryptjs";

import {
  UserModel,
  RoleModel,
  CompanyModel,
  CountryModel,
  IndustryModel,
} from "../models/index.js";

const PASSWORD = "Company@123456";

const companies = [
  {
    company_name: "TechNova Solutions",
    slug: "technova-solutions",
    company_email: "company1@gmail.com",
    owner_first_name: "Khaled",
    owner_mid_name: "Samir",
    owner_last_name: "Hassan",
    gender: "male",
    industry_name: "Information Technology",
    company_type: "Private",
    company_size: 85,
    company_size_type: "medium",
    created_year: 2018,
    company_country: "Syria",
    company_city: "Damascus",
    timezone: "Asia/Damascus",
    description:
      "Tech company specialized in building web platforms, dashboards and scalable backend systems.",
    mission:
      "To help businesses grow through reliable and modern software solutions.",
    vision:
      "To become one of the leading software companies in the region.",
    culture:
      "Collaborative, innovative and focused on continuous improvement.",
    specialties: ["Web Development", "Backend APIs", "SaaS", "Cloud"],
    benefits: ["Flexible hours", "Remote work", "Training budget"],
    hr_name: "Maya Nasser",
    hr_email: "hr1@technova.com",
  },
  {
    company_name: "GreenSoft Labs",
    slug: "greensoft-labs",
    company_email: "company2@gmail.com",
    owner_first_name: "Sara",
    owner_mid_name: "Ali",
    owner_last_name: "Hamdan",
    gender: "female",
    industry_name: "Software Development",
    company_type: "Startup",
    company_size: 22,
    company_size_type: "startup",
    created_year: 2021,
    company_country: "Syria",
    company_city: "Aleppo",
    timezone: "Asia/Damascus",
    description:
      "Startup focused on mobile apps, food-tech platforms and digital products.",
    mission:
      "To create simple digital products that solve real customer problems.",
    vision:
      "To build a strong product-driven technology brand.",
    culture:
      "Fast moving, creative and product focused.",
    specialties: ["Mobile Apps", "Flutter", "Product Design", "UI UX"],
    benefits: ["Hybrid work", "Learning sessions", "Career growth"],
    hr_name: "Omar Darwish",
    hr_email: "hr2@greensoft.com",
  },
  {
    company_name: "CloudBridge Systems",
    slug: "cloudbridge-systems",
    company_email: "company3@gmail.com",
    owner_first_name: "Omar",
    owner_mid_name: "Khaled",
    owner_last_name: "Darwish",
    gender: "male",
    industry_name: "Cloud Services",
    company_type: "Private",
    company_size: 140,
    company_size_type: "large",
    created_year: 2015,
    company_country: "UAE",
    company_city: "Dubai",
    timezone: "Asia/Dubai",
    description:
      "Cloud and DevOps company providing infrastructure automation, monitoring and deployment services.",
    mission:
      "To simplify cloud adoption for companies of all sizes.",
    vision:
      "To become a trusted cloud engineering partner in MENA.",
    culture:
      "Engineering excellence, ownership and automation first.",
    specialties: ["DevOps", "Docker", "Kubernetes", "CI/CD"],
    benefits: ["Health insurance", "Remote work", "Certifications"],
    hr_name: "Lina Maher",
    hr_email: "hr3@cloudbridge.com",
  },
  {
    company_name: "DataMind Analytics",
    slug: "datamind-analytics",
    company_email: "company4@gmail.com",
    owner_first_name: "Rama",
    owner_mid_name: "Adnan",
    owner_last_name: "Shami",
    gender: "female",
    industry_name: "Data Analytics",
    company_type: "Private",
    company_size: 55,
    company_size_type: "medium",
    created_year: 2019,
    company_country: "Jordan",
    company_city: "Amman",
    timezone: "Asia/Amman",
    description:
      "Analytics company helping businesses understand data through dashboards, reports and AI insights.",
    mission:
      "To turn business data into clear and useful decisions.",
    vision:
      "To lead analytics transformation for modern companies.",
    culture:
      "Data-driven, accurate and customer focused.",
    specialties: ["BI Dashboards", "SQL", "Machine Learning", "Reporting"],
    benefits: ["Training budget", "Flexible work", "Performance bonuses"],
    hr_name: "Tariq Mansour",
    hr_email: "hr4@datamind.com",
  },
  {
    company_name: "SecureNet Cyber",
    slug: "securenet-cyber",
    company_email: "company5@gmail.com",
    owner_first_name: "Yousef",
    owner_mid_name: "Fadi",
    owner_last_name: "Qassem",
    gender: "male",
    industry_name: "Cyber Security",
    company_type: "Private",
    company_size: 35,
    company_size_type: "small",
    created_year: 2020,
    company_country: "Saudi Arabia",
    company_city: "Riyadh",
    timezone: "Asia/Riyadh",
    description:
      "Cyber security company specialized in penetration testing, monitoring and security consulting.",
    mission:
      "To protect businesses from modern digital threats.",
    vision:
      "To be a trusted cyber security partner for enterprises.",
    culture:
      "Security-first, precise and research oriented.",
    specialties: ["Penetration Testing", "SOC", "Security Audit", "Monitoring"],
    benefits: ["Certifications", "Remote work", "Annual bonus"],
    hr_name: "Noor Haddad",
    hr_email: "hr5@securenet.com",
  },
];

const randomItem = (arr = []) =>
  arr[Math.floor(Math.random() * arr.length)] || null;

const buildCompanySearchFilters = ({
  company,
  industry,
  country,
  city,
  stats,
}) => {
  const profileText = [
    company.company_name,
    company.slug,
    company.industry_name,
    company.company_type,
    company.company_size_type,
    company.company_country,
    company.company_city,
    company.description,
    company.mission,
    company.vision,
    company.culture,
    ...(company.specialties || []),
    ...(company.benefits || []),
  ]
    .filter(Boolean)
    .map((item) => String(item).trim().toLowerCase());

  return {
    text: {
      profile: profileText,
      all: profileText,
    },

    identity: {
      company_name: company.company_name,
      slug: company.slug,
      industry_id: industry?._id || null,
      industry_name: company.industry_name || industry?.name_en || "",
      company_type: company.company_type,
      company_size_type: company.company_size_type,
      specialties: company.specialties || [],
      benefits: company.benefits || [],
    },

    location: {
      country_id: country?._id || null,
      city_id: city?._id || null,
      country_code: country?.code || "",
      country_name_ar: country?.name_ar || "",
      country_name_en: country?.name_en || company.company_country,
      city_name_ar: city?.name_ar || "",
      city_name_en: city?.name_en || company.company_city,
      company_country: company.company_country,
      company_city: company.company_city,
      timezone: company.timezone || "UTC",
    },

    hiring: {
      is_hiring: true,
      can_upload: true,
      free_post_balance: stats.free_post_balance,
      jobs_count: stats.jobs_count,
      active_jobs_count: stats.active_jobs_count,
    },

    trust: {
      status: true,
      accepted: true,
      is_verified: true,
      rating_avg: stats.rating_avg,
      rating_count: stats.rating_count,
      profile_completion: 90,
    },

    stats: {
      employees_count: stats.employees_count,
      views_count: stats.views_count,
      followers_count: stats.followers_count,
    },
  };
};

export const seedCompanies = async () => {
  const companyRole = await RoleModel.findOne({ log_to: "company" });

  if (!companyRole) {
    throw new Error("company role not found. Please run roles seeder first.");
  }

  const [countries, industries] = await Promise.all([
    CountryModel.find().limit(30),
    IndustryModel.find().limit(30),
  ]);

  const hashedPassword = await bcrypt.hash(PASSWORD, 10);

  for (let index = 0; index < companies.length; index++) {
    const company = companies[index];

    const phoneNational = `988777${String(index).padStart(4, "0")}`;
    const phoneCode = "+963";
    const phoneE164 = `${phoneCode}${phoneNational}`;

    const country = randomItem(countries);
    const city = randomItem(countries);
    const industry =
      industries.find(
        (item) =>
          item?.name_en?.toLowerCase() === company.industry_name.toLowerCase()
      ) || randomItem(industries);

    const user = await UserModel.findOneAndUpdate(
      { email: company.company_email },
      {
        $set: {
          first_name: company.owner_first_name,
          mid_name: company.owner_mid_name,
          last_name: company.owner_last_name,
          email: company.company_email,
          gender: company.gender,
          phone_country: "SY",
          phone_code: phoneCode,
          phone: phoneE164,
          phone_e164: phoneE164,
          phone_national: phoneNational,
          lan: "en",
          status: true,
          permissions: [],
          device: [],
          password: hashedPassword,
          role_id: companyRole._id,
        },
      },
      {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true,
      }
    );

    const stats = {
      jobs_count: 4 + index,
      active_jobs_count: 2 + index,
      employees_count: company.company_size,
      views_count: 300 + index * 120,
      followers_count: 40 + index * 25,
      free_post_balance: 5,
      rating_avg: Number((4 + Math.random()).toFixed(1)),
      rating_count: 8 + index * 3,
    };

    const companyPayload = {
      role_id: companyRole._id,
      owner_user_id: user._id,

      company_name: company.company_name,
      slug: company.slug,
      company_email: company.company_email,

      image: `/uploads/companies/company-${index + 1}.png`,
      cover_image: `/uploads/companies/company-cover-${index + 1}.png`,

      gallery: [
        {
          type: "image",
          url: `/uploads/companies/gallery-${index + 1}-1.png`,
          title: "Office workspace",
        },
        {
          type: "image",
          url: `/uploads/companies/gallery-${index + 1}-2.png`,
          title: "Team culture",
        },
      ],

      files: [`/uploads/companies/company-profile-${index + 1}.pdf`],

      permissions: [],

      profile_completion: 90,

      created_year: company.created_year,
      description: company.description,
      mission: company.mission,
      vision: company.vision,
      culture: company.culture,

      benefits: company.benefits,
      specialties: company.specialties,

      industry_id: industry?._id || null,
      industry_name: company.industry_name,

      company_size: company.company_size,
      company_size_type: company.company_size_type,
      company_type: company.company_type,

      country_id: country?._id || null,
      city_id: city?._id || null,
      company_country: company.company_country,
      company_city: company.company_city,
      company_address: `${company.company_city}, ${company.company_country}`,
      timezone: company.timezone || "UTC",

      location: {
        latitude: 33.5138 + index * 0.01,
        longitude: 36.2765 + index * 0.01,
      },

      company_contact: [phoneE164, company.hr_email],
      company_phone: phoneE164,
      company_phone_code: phoneCode,
      company_website: `https://${company.slug}.com`,

      social_links: [
        {
          type: "linkedin",
          url: `https://linkedin.com/company/${company.slug}`,
        },
        {
          type: "website",
          url: `https://${company.slug}.com`,
        },
        {
          type: "facebook",
          url: `https://facebook.com/${company.slug}`,
        },
      ],

      hr_name: company.hr_name,
      hr_email: company.hr_email,
      hr_phone: phoneE164,


      is_hiring: true,

      jobs_count: stats.jobs_count,
      active_jobs_count: stats.active_jobs_count,
      employees_count: stats.employees_count,
      views_count: stats.views_count,
      followers_count: stats.followers_count,

      status: true,
      accepted: true,
      is_verified: true,
      verified_at: new Date(),
      verified_by: user._id,

      verification_documents: [
        {
          type: "commercial_register",
          file: `/uploads/companies/documents/company-${index + 1}-register.pdf`,
          status: "approved",
          note: "Approved by system seed.",
        },
      ],

      can_upload: true,
      free_post_balance: stats.free_post_balance,

      rating_avg: stats.rating_avg,
      rating_count: stats.rating_count,
    };

    companyPayload.search_filters = buildCompanySearchFilters({
      company: companyPayload,
      industry,
      country,
      city,
      stats,
    });

    await CompanyModel.findOneAndUpdate(
      { company_email: company.company_email },
      {
        $set: companyPayload,
      },
      {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true,
      }
    );

    console.log(`Seeded company: ${company.company_email}`);
  }

  console.log("Companies seeded successfully");
};

export default seedCompanies;