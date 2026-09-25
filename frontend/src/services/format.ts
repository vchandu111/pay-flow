const CURRENCY_SYMBOLS: Record<string, string> = { INR: '₹', USD: '$', EUR: '€' };

export function formatMoney(amount: string, currency: string): string {
  const symbol = CURRENCY_SYMBOLS[currency] ?? `${currency} `;
  return `${symbol}${amount}`;
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}
