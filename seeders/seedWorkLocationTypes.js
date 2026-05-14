import dotenv from "dotenv";
import { WorkLocationTypeModel } from "../models/index.js";
import normalizeArabicKeyword from "../helper/normalizeArabicKeyword.js";

dotenv.config();

const seedWorkLocationTypes = async () => {
 try {
  const workLocationTypes = [
   {
    name: "office",

    title_ar: "مكتب",
    title_en: "Office",

    keyword: [
     "مكتب",
     "مقر الشركة",
     "شركة",
     "مبنى اداري",
     "مكان العمل",
     "دوام مكتبي",
    ],
   },

   {
    name: "home",

    title_ar: "منزل",
    title_en: "Home",

    keyword: [
     "منزل",
     "بيت",
     "من البيت",
     "من المنزل",
     "عمل منزلي",
    ],
   },

   {
    name: "remote",

    title_ar: "عن بعد",
    title_en: "Remote",

    keyword: [
     "عن بعد",
     "ريموت",
     "اونلاين",
     "اون لاين",
     "عمل عبر الانترنت",
     "عمل عن بعد",
    ],
   },

   {
    name: "field",

    title_ar: "ميداني",
    title_en: "Field",

    keyword: [
     "ميداني",
     "خارج المكتب",
     "زيارات",
     "مندوب",
     "تنقل",
     "في الموقع",
    ],
   },

   {
    name: "client_site",

    title_ar: "موقع العميل",
    title_en: "Client Site",

    keyword: [
     "موقع العميل",
     "عند العميل",
     "ضمن موقع العميل",
     "زيارة عميل",
    ],
   },

   {
    name: "factory",

    title_ar: "مصنع",
    title_en: "Factory",

    keyword: [
     "مصنع",
     "معمل",
     "خط انتاج",
     "منشاة صناعية",
    ],
   },

   {
    name: "warehouse",

    title_ar: "مستودع",
    title_en: "Warehouse",

    keyword: [
     "مستودع",
     "مخزن",
     "مخازن",
     "مركز تخزين",
    ],
   },

   {
    name: "store",

    title_ar: "متجر",
    title_en: "Store",

    keyword: [
     "متجر",
     "محل",
     "سوبرماركت",
     "معرض",
     "نقطة بيع",
    ],
   },

   {
    name: "restaurant",

    title_ar: "مطعم",
    title_en: "Restaurant",

    keyword: [
     "مطعم",
     "كافيه",
     "مقهى",
     "ضيافة",
     "مطبخ",
    ],
   },

   {
    name: "hospital",

    title_ar: "منشاة صحية",
    title_en: "Healthcare Facility",

    keyword: [
     "مشفى",
     "مستشفى",
     "عيادة",
     "مركز صحي",
     "مستوصف",
    ],
   },

   {
    name: "school",

    title_ar: "منشاة تعليمية",
    title_en: "Educational Facility",

    keyword: [
     "مدرسة",
     "جامعة",
     "معهد",
     "كلية",
     "مركز تعليمي",
    ],
   },

   {
    name: "construction_site",

    title_ar: "ورشة او موقع بناء",
    title_en: "Construction Site",

    keyword: [
     "ورشة",
     "موقع بناء",
     "انشاءات",
     "موقع عمل",
     "مقاولات",
    ],
   },

   {
    name: "coworking_space",

    title_ar: "مساحة عمل مشتركة",
    title_en: "Coworking Space",

    keyword: [
     "مساحة عمل مشتركة",
     "كو ووركينغ",
     "مكتب مشترك",
     "مكاتب مشتركة",
    ],
   },

   {
    name: "branch",

    title_ar: "فرع",
    title_en: "Branch",

    keyword: [
     "فرع",
     "مقر فرعي",
     "فرع الشركة",
     "مكتب فرعي",
    ],
   },

   {
    name: "multiple_locations",

    title_ar: "عدة مواقع",
    title_en: "Multiple Locations",

    keyword: [
     "عدة مواقع",
     "اكثر من موقع",
     "متعدد المواقع",
     "تنقل بين المواقع",
    ],
   },

   {
    name: "outdoor",

    title_ar: "خارجي",
    title_en: "Outdoor",

    keyword: [
     "خارجي",
     "في الخارج",
     "هواء طلق",
     "خارج المبنى",
    ],
   },

   {
    name: "hybrid",

    title_ar: "مختلط",
    title_en: "Hybrid",

    keyword: [
     "مختلط",
     "هجين",
     "من المنزل والمكتب",
     "حضوري وعن بعد",
    ],
   },

   {
    name: "mobile",

    title_ar: "متنقل",
    title_en: "Mobile",

    keyword: [
     "متنقل",
     "تنقل",
     "عمل متنقل",
     "بدون موقع ثابت",
    ],
   },
  ];

  for (const workLocationType of workLocationTypes) {
   await WorkLocationTypeModel.updateOne(
    {
     name: workLocationType.name,
    },
    {
     $set: {
      name: workLocationType.name,

      title_ar: workLocationType.title_ar,
      title_en: workLocationType.title_en,
      keyword: workLocationType.keyword.map(normalizeArabicKeyword),
     },
    },
    {
     upsert: true,
    }
   );
  }

  console.log("✅ Work location types seeded successfully");
 } catch (error) {
  console.error("❌ Work location types seeder error:", error);
  throw error;
 }
};

export { seedWorkLocationTypes }