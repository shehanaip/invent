export const DEFAULT_SETTINGS = {
  company: "INVENT Ltd",
  email: "admin@invent.com",
  currency: "BDT",
  tax: 15,
  notifications: true,
  autoBackup: true,
  lowStockAlert: true,
  language: "English",
  timezone: "Asia/Dhaka",
  theme: "dark",
};

export const RATE_CACHE_KEY = "inventExchangeRates";

export function readSettings() {
  try {
    const parsed = JSON.parse(localStorage.getItem("inventSettings") || "{}");
    const saved =
      parsed && typeof parsed === "object" && !Array.isArray(parsed)
        ? parsed
        : {};
    delete saved.password;
    return { ...DEFAULT_SETTINGS, ...saved };
  } catch (error) {
    console.error("Could not read saved settings:", error);
    return { ...DEFAULT_SETTINGS };
  }
}

function getTimeZone(settings) {
  const timeZone = settings?.timezone || DEFAULT_SETTINGS.timezone;
  try {
    new Intl.DateTimeFormat("en", { timeZone });
    return timeZone;
  } catch {
    return DEFAULT_SETTINGS.timezone;
  }
}

export function getLocale(language = "English") {
  if (language === "বাংলা") return "bn-BD";
  if (language === "Hindi") return "hi-IN";
  return "en-BD";
}

export function formatCurrency(amount, settings, rates) {
  const currency = settings?.currency || "BDT";
  const value = Number(amount);

  if (!Number.isFinite(value)) return "—";

  const rate = currency === "BDT" ? 1 : Number(rates?.[currency]);
  if (!Number.isFinite(rate) || rate <= 0) return "Rate unavailable";

  const locale = getLocale(settings?.language);
  const converted = value * rate;
  if (currency === "BDT") {
    const formatted = new Intl.NumberFormat(locale, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(converted);
    return locale === "bn-BD" ? `${formatted} ৳` : `৳${formatted}`;
  }

  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(converted);
}

function parseDate(value) {
  if (!value) return null;
  const dateOnly = /^\d{4}-\d{2}-\d{2}$/.test(value);
  const date = new Date(dateOnly ? `${value}T12:00:00Z` : value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function formatDate(value, settings, options = {}) {
  const date = parseDate(value);
  if (!date) return "—";

  return new Intl.DateTimeFormat(getLocale(settings?.language), {
    dateStyle: "medium",
    timeZone: getTimeZone(settings),
    ...options,
  }).format(date);
}

export function formatDateTime(value, settings, options = {}) {
  const date = parseDate(value);
  if (!date) return "—";

  return new Intl.DateTimeFormat(getLocale(settings?.language), {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: getTimeZone(settings),
    ...options,
  }).format(date);
}

export function formatTime(value, settings) {
  const date = parseDate(value);
  if (!date) return value || "—";

  return new Intl.DateTimeFormat(getLocale(settings?.language), {
    timeStyle: "short",
    timeZone: getTimeZone(settings),
  }).format(date);
}
