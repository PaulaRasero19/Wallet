import { Currency, ExchangeRates } from "../types/finflow";

export function formatMoney(value: number, currency: Currency = "UYU", showSign = true) {
  const sign = value < 0 ? "-" : value > 0 ? "+" : "";
  const absoluteValue = Math.abs(value);
  const symbol = currency === "UYU" ? "$U " : currency === "USD" ? "US$ " : "€ ";

  return `${showSign ? sign : ""}${symbol}${absoluteValue.toLocaleString("es-UY", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;
}

export function formatCompactMoney(value: number, currency: Currency = "UYU", showSign = false) {
  const sign = value < 0 ? "-" : value > 0 ? "+" : "";
  const absoluteValue = Math.abs(Math.round(value));
  const symbol = currency === "UYU" ? "$U " : currency === "USD" ? "US$ " : "€ ";

  return `${showSign ? sign : ""}${symbol}${absoluteValue.toLocaleString("es-UY", {
    maximumFractionDigits: 0,
    minimumFractionDigits: 0
  })}`;
}

export function percentage(value: number, total: number) {
  if (total <= 0) return 0;
  return Math.min(100, Math.round((value / total) * 100));
}

export function toBaseCurrency(value: number, currency: Currency, exchangeRates: ExchangeRates) {
  return value * exchangeRates[currency];
}

export function formatUYU(value: number, showSign = true) {
  return formatMoney(value, "UYU", showSign);
}
