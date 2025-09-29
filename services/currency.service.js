// services/currency.service.js
import axios from "axios";
import cron from "node-cron";
import { CurrencyModel } from "../models/index.js";

/* جميع عملات الدول العربية (ISO 4217) */
const ARAB_CURRENCY_CODES = [
  "AED","BHD","DZD","EGP","IQD","JOD","KWD","LBP","LYD","MAD","MRU",
  "OMR","QAR","SAR","SDG","SOS","SYP","TND","YER","DJF","KMF"
];

/* قائمة أكواد العملات */
export const getCodes = () => {
  const base = (Intl.supportedValuesOf?.("currency")) || ["USD","EUR","GBP","JPY","CNY"];
  return Array.from(new Set([...base, ...ARAB_CURRENCY_CODES])).sort();
};

/* أسماء العملات */
const dnEN = Intl?.DisplayNames ? new Intl.DisplayNames("en", { type: "currency" }) : null;
const dnAR = Intl?.DisplayNames ? new Intl.DisplayNames("ar", { type: "currency" }) : null;
const safeName = (dn, code) => {
  const n = dn?.of?.(code);
  return (typeof n === "string" && n.trim()) ? n : code;
};

/* تمييز الغامض: رموز إنجليزية مميزة */
const EN_SYMBOL_OVERRIDE = {
  USD: "US$",
  CAD: "CA$",
  AUD: "A$",
  NZD: "NZ$",
  HKD: "HK$",
  SGD: "S$",
  MXN: "MX$",
  TWD: "NT$",
  BZD: "BZ$",
  TTD: "TT$",
  NAD: "N$",
  JMD: "J$",
  XCD: "EC$",
  ZWL: "Z$",
  ARS: "AR$",
  CLP: "CLP$",
  COP: "COL$",
  DOP: "RD$",
  UYU: "UY$",
  BRL: "R$",
  INR: "₹",
  CNY: "CN¥",
  JPY: "JP¥",
  KRW: "₩",
  RUB: "₽",
  TRY: "₺"
};

/* رموز عربية مطبّعة للعملات العربية */
const AR_SYMBOL_OVERRIDE = {
  AED: "د.إ",
  SAR: "ر.س",
  QAR: "ر.ق",
  OMR: "ر.ع.",
  BHD: "د.ب.",
  KWD: "د.ك",
  JOD: "د.أ",
  EGP: "ج.م",
  LYD: "د.ل",
  TND: "د.ت",
  DZD: "د.ج",
  MAD: "د.م",
  MRU: "UM",   // أوقية موريتانية الحديثة
  LBP: "ل.ل",
  SYP: "ل.س",
  IQD: "د.ع",
  YER: "ر.ي",
  SDG: "ج.س",
  DJF: "Fdj",
  KMF: "CF",
  SOS: "Sh"
};

/* اشتقاق الرموز بدقة */
function deriveSymbols(code) {
  const pick = fmt => {
    try {
      const parts = new Intl.NumberFormat(fmt.locale, {
        style: "currency",
        currency: code,
        currencyDisplay: fmt.display
      }).formatToParts(1);
      return parts.find(p => p.type === "currency")?.value || null;
    } catch { return null; }
  };

  // إنجليزي قياسي + ضيق
  const enSymbolRaw   = pick({ locale: "en", display: "symbol" });
  const enNarrowRaw   = pick({ locale: "en", display: "narrowSymbol" });

  const symbol_en     = EN_SYMBOL_OVERRIDE[code] || enSymbolRaw || code;
  const narrow_symbol = EN_SYMBOL_OVERRIDE[code] || enNarrowRaw || symbol_en;

  // عربي مخصص مع رجوع إلى الـIntl عند غياب override
  const arRaw = pick({ locale: "ar", display: "symbol" });
  const symbol_ar = AR_SYMBOL_OVERRIDE[code] || arRaw || symbol_en;

  return { symbol_en, symbol_ar, narrow_symbol };
}

/* مزوّدات أسعار */
const PROVIDERS = [
  async (base) => {
    const { data } = await axios.get("https://api.exchangerate.host/latest", {
      params: { base },
      timeout: 8000
    });
    if (data?.rates) return data.rates;
    throw new Error("exchangerate.host bad payload");
  },
  async (base) => {
    // كان ينقص اقتباس/Template Literal
    const { data } = await axios.get(`https://open.er-api.com/v6/latest/${base}`, {
      timeout: 8000
    });
    if (data?.result === "success" && data?.rates) return data.rates;
    throw new Error("open.er-api.com bad payload");
  },
  async (base) => {
    const { data } = await axios.get("https://api.frankfurter.app/latest", {
      params: { from: base },
      timeout: 8000
    });
    if (data?.rates) return data.rates;
    throw new Error("frankfurter.app bad payload");
  },
];

/* جلب الأسعار */
async function fetchRates(base = "USD") {
  const errs = [];
  for (const fn of PROVIDERS) {
    try {
      const rates = await fn(base);
      return { base, rates };
    } catch (e) { errs.push(e.message); }
  }
  throw new Error("rates fetch failed: " + errs.join(" | "));
}

/* تحديث وحفظ */
export async function refreshCurrencies(base = "USD") {
  const codes = getCodes();
  const { rates } = await fetchRates(base);
  const now = new Date();

  const ops = codes.map(code => {
    const rate = code === base ? 1 : (typeof rates?.[code] === "number" ? rates[code] : null);
    const { symbol_en, symbol_ar, narrow_symbol } = deriveSymbols(code);

    return {
      updateOne: {
        filter: { code }, // لا تمنع التحديث إلا إذا كان لديك سياسة is_auto
        update: {
          $set: {
            code,
            name_en: safeName(dnEN, code),
            name_ar: safeName(dnAR, code),
            symbol_en,
            symbol_ar,
            narrow_symbol,
            rate_base: base,
            rate,
            rate_updated_at: now,
            updatedAt: now,
          },
        },
        upsert: true,
      },
    };
  });

  await CurrencyModel.bulkWrite(ops, { ordered: false });
  return { updated: codes.length, base };
}

/* جدولة */
export function scheduleCurrencyRefresh() {
  cron.schedule(
    "0 3 * * *",
    () => { refreshCurrencies("USD").catch(console.error); },
    { timezone: "Europe/Berlin" }
  );
  refreshCurrencies("USD").catch(console.error);
}
