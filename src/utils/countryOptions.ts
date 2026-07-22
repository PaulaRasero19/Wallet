import { Currency } from "../types/finflow";

export type CountryOption = {
  code: string;
  currency: Currency;
  name: string;
};

export type CurrencyOption = {
  code: Currency;
  name: string;
  symbol: string;
};

export const currencyOptions: CurrencyOption[] = [
  { code: "UYU", name: "Peso uruguayo", symbol: "$U" },
  { code: "USD", name: "Dólar estadounidense", symbol: "US$" },
  { code: "EUR", name: "Euro", symbol: "€" }
];

const countryCodes = [
  "AF", "AX", "AL", "DZ", "AS", "AD", "AO", "AI", "AQ", "AG", "AR", "AM", "AW", "AU", "AT", "AZ",
  "BS", "BH", "BD", "BB", "BY", "BE", "BZ", "BJ", "BM", "BT", "BO", "BQ", "BA", "BW", "BV", "BR",
  "IO", "BN", "BG", "BF", "BI", "CV", "KH", "CM", "CA", "KY", "CF", "TD", "CL", "CN", "CX", "CC",
  "CO", "KM", "CG", "CD", "CK", "CR", "CI", "HR", "CU", "CW", "CY", "CZ", "DK", "DJ", "DM", "DO",
  "EC", "EG", "SV", "GQ", "ER", "EE", "SZ", "ET", "FK", "FO", "FJ", "FI", "FR", "GF", "PF", "TF",
  "GA", "GM", "GE", "DE", "GH", "GI", "GR", "GL", "GD", "GP", "GU", "GT", "GG", "GN", "GW", "GY",
  "HT", "HM", "VA", "HN", "HK", "HU", "IS", "IN", "ID", "IR", "IQ", "IE", "IM", "IL", "IT", "JM",
  "JP", "JE", "JO", "KZ", "KE", "KI", "KP", "KR", "KW", "KG", "LA", "LV", "LB", "LS", "LR", "LY",
  "LI", "LT", "LU", "MO", "MG", "MW", "MY", "MV", "ML", "MT", "MH", "MQ", "MR", "MU", "YT", "MX",
  "FM", "MD", "MC", "MN", "ME", "MS", "MA", "MZ", "MM", "NA", "NR", "NP", "NL", "NC", "NZ", "NI",
  "NE", "NG", "NU", "NF", "MK", "MP", "NO", "OM", "PK", "PW", "PS", "PA", "PG", "PY", "PE", "PH",
  "PN", "PL", "PT", "PR", "QA", "RE", "RO", "RU", "RW", "BL", "SH", "KN", "LC", "MF", "PM", "VC",
  "WS", "SM", "ST", "SA", "SN", "RS", "SC", "SL", "SG", "SX", "SK", "SI", "SB", "SO", "ZA", "GS",
  "SS", "ES", "LK", "SD", "SR", "SJ", "SE", "CH", "SY", "TW", "TJ", "TZ", "TH", "TL", "TG", "TK",
  "TO", "TT", "TN", "TR", "TM", "TC", "TV", "UG", "UA", "AE", "GB", "US", "UM", "UY", "UZ", "VU",
  "VE", "VN", "VG", "VI", "WF", "EH", "YE", "ZM", "ZW"
];

const fallbackNames: Record<string, string> = {
  AR: "Argentina",
  BR: "Brasil",
  CL: "Chile",
  CO: "Colombia",
  ES: "España",
  MX: "México",
  PE: "Perú",
  US: "Estados Unidos",
  UY: "Uruguay"
};

const euroCountries = new Set([
  "AD", "AT", "BE", "CY", "DE", "EE", "ES", "FI", "FR", "GR", "HR", "IE", "IT", "LT", "LU", "LV",
  "MC", "ME", "MT", "NL", "PT", "SI", "SK", "SM", "VA"
]);

export function currencyForCountry(code: string): Currency {
  const normalized = code.toUpperCase();

  if (normalized === "UY") return "UYU";
  if (euroCountries.has(normalized)) return "EUR";
  return "USD";
}

export function buildCountryOptions(locale = "es"): CountryOption[] {
  const displayNames = typeof Intl !== "undefined" && "DisplayNames" in Intl
    ? new (Intl as typeof Intl & { DisplayNames: new (locales: string[], options: { type: "region" }) => { of: (code: string) => string | undefined } }).DisplayNames([locale], { type: "region" })
    : null;

  return countryCodes
    .map((code) => ({
      code,
      currency: currencyForCountry(code),
      name: displayNames?.of(code) || fallbackNames[code] || code
    }))
    .sort((left, right) => left.name.localeCompare(right.name, locale));
}
