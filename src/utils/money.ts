export function formatMoney(value: number) {
  const sign = value < 0 ? "-" : value > 0 ? "+" : "";
  const absoluteValue = Math.abs(value);

  return `${sign}$${absoluteValue.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;
}

export function percentage(value: number, total: number) {
  if (total <= 0) return 0;
  return Math.min(100, Math.round((value / total) * 100));
}
