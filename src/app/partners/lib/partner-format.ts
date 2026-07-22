export function formatPartnerMoney(cents: number) {
  return new Intl.NumberFormat("en-US", {
    currency: "USD",
    style: "currency",
  }).format(cents / 100);
}

export function formatPartnerDate(value: string, includeTime = false) {
  return new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    hour: includeTime ? "numeric" : undefined,
    minute: includeTime ? "2-digit" : undefined,
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

export function formatStatus(value: string) {
  return value.replaceAll("_", " ").replace(/^./, (letter) => letter.toUpperCase());
}
