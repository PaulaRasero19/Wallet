export function formatCurrency(value) {
  const absValue = Math.abs(value);
  const formatted = new Intl.NumberFormat("es-UY", {
    maximumFractionDigits: 0
  }).format(absValue);

  return `${value < 0 ? "-" : ""}$${formatted}`;
}

export function getProgress(current, total) {
  if (!total) {
    return 0;
  }

  return Math.min(Math.round((current / total) * 100), 100);
}
