export function formatNumber(value: number) {
  return new Intl.NumberFormat("ar", { maximumFractionDigits: 0 }).format(value);
}

export function formatDate(value: string) {
  return new Intl.DateTimeFormat("ar", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }).format(new Date(value));
}

export function formatAmount(value: number) {
  return new Intl.NumberFormat("ar", { maximumFractionDigits: 0 }).format(value);
}
