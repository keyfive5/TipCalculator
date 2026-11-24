/**
 * Currency formatting and the tip math. All math runs in integer minor units
 * (cents, pence, …) so totals never drift by a floating-point penny.
 */

export const MAX_INTEGER_DIGITS = 7;

const formatterCache = new Map<string, Intl.NumberFormat>();

function formatter(locale: string, currency: string, fractionDigits: number) {
  const key = `${locale}|${currency}|${fractionDigits}`;
  let f = formatterCache.get(key);
  if (!f) {
    try {
      f = new Intl.NumberFormat(locale, {
        style: 'currency',
        currency,
        minimumFractionDigits: fractionDigits,
        maximumFractionDigits: fractionDigits,
      });
    } catch {
      f = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: fractionDigits,
        maximumFractionDigits: fractionDigits,
      });
    }
    formatterCache.set(key, f);
  }
  return f;
}

/** Number of minor-unit digits the currency uses (USD 2, JPY 0, …). */
export function currencyFractionDigits(currency: string): number {
  const zero = ['JPY', 'KRW', 'VND', 'CLP', 'ISK', 'HUF', 'TWD', 'IDR', 'UGX', 'PYG', 'XAF', 'XOF'];
  if (zero.includes(currency)) return 0;
  const three = ['BHD', 'KWD', 'OMR', 'JOD', 'TND'];
  if (three.includes(currency)) return 3;
  return 2;
}

export function decimalSeparator(locale: string): string {
  try {
    const s = (1.5).toLocaleString(locale);
    const sep = s.replace(/\d/g, '');
    return sep.length === 1 ? sep : '.';
  } catch {
    return '.';
  }
}

export type Money = {
  locale: string;
  currency: string;
  fractionDigits: number;
};

/** Format an amount given in minor units. */
export function formatMinor(minor: number, m: Money, opts?: { trimZeroCents?: boolean }) {
  const scale = 10 ** m.fractionDigits;
  const value = minor / scale;
  const fd = opts?.trimZeroCents && minor % scale === 0 ? 0 : m.fractionDigits;
  return formatter(m.locale, m.currency, fd).format(value);
}

/**
 * Format the raw keypad string ("1234.5") exactly as typed, with grouping and
 * the currency symbol in the right place for the locale ("$1,234.5", "1.234,5 €").
 */
export function formatRawInput(raw: string, m: Money): string {
  const [intPart, decPart] = raw.split('.');
  const intValue = Number(intPart || '0');
  const base = formatter(m.locale, m.currency, 0).format(intValue);
  if (decPart === undefined) return base;
  // Insert the separator + typed decimals right after the last digit.
  let lastDigit = -1;
  for (let i = base.length - 1; i >= 0; i--) {
    if (/\d/.test(base[i])) {
      lastDigit = i;
      break;
    }
  }
  if (lastDigit === -1) return base;
  const sep = decimalSeparator(m.locale);
  return base.slice(0, lastDigit + 1) + sep + decPart + base.slice(lastDigit + 1);
}

/** Apply a keypad press to the raw input string. Returns the same string if rejected. */
export function applyKey(raw: string, key: string, fractionDigits: number): string {
  if (key === 'back') return raw.slice(0, -1);
  if (key === 'clear') return '';
  if (key === '.') {
    if (fractionDigits === 0 || raw.includes('.')) return raw;
    return (raw === '' ? '0' : raw) + '.';
  }
  if (!/^\d$/.test(key)) return raw;
  const [intPart, decPart] = raw.split('.');
  if (decPart !== undefined) {
    if (decPart.length >= fractionDigits) return raw;
    return raw + key;
  }
  if (intPart === '0') return key === '0' ? raw : key;
  if (intPart.length >= MAX_INTEGER_DIGITS) return raw;
  return raw + key;
}

export function rawToMinor(raw: string, fractionDigits: number): number {
  if (!raw) return 0;
  const [i, d = ''] = raw.split('.');
  const scale = 10 ** fractionDigits;
  const dec = (d + '0'.repeat(fractionDigits)).slice(0, fractionDigits);
  return Number(i || '0') * scale + Number(dec || '0');
}

export type TipInput = {
  billMinor: number;
  tipPct: number;
  people: number;
  roundUp: boolean;
  excludeTax: boolean;
  taxRate: number;
  fractionDigits: number;
};

export type TipResult = {
  baseMinor: number; // amount the tip is calculated on
  tipMinor: number;
  totalMinor: number;
  /** What each person pays (the higher share when it doesn't divide evenly). */
  shareMinor: number;
  /** How many people pay one minor unit less than shareMinor (uneven split). */
  lowerCount: number;
  effectivePct: number;
  adjusted: boolean; // rounding changed the tip
};

export function computeTip(i: TipInput): TipResult {
  const people = Math.max(1, Math.floor(i.people));
  const baseMinor =
    i.excludeTax && i.taxRate > 0 ? Math.round(i.billMinor / (1 + i.taxRate / 100)) : i.billMinor;
  let tipMinor = Math.round((baseMinor * i.tipPct) / 100);
  let totalMinor = i.billMinor + tipMinor;
  let shareMinor: number;
  let lowerCount = 0;
  let adjusted = false;

  if (i.roundUp && totalMinor > 0) {
    // Round each person's share up to a whole unit (or 100 for zero-decimal currencies).
    const step = i.fractionDigits === 0 ? 100 : 10 ** i.fractionDigits;
    shareMinor = Math.ceil(totalMinor / people / step - 1e-9) * step;
    const roundedTotal = shareMinor * people;
    adjusted = roundedTotal !== totalMinor;
    totalMinor = roundedTotal;
    tipMinor = totalMinor - i.billMinor;
  } else {
    const floor = Math.floor(totalMinor / people);
    const remainder = totalMinor - floor * people;
    shareMinor = remainder > 0 ? floor + 1 : floor;
    lowerCount = remainder > 0 ? people - remainder : 0;
  }

  const effectivePct = baseMinor > 0 ? (tipMinor / baseMinor) * 100 : i.tipPct;
  return { baseMinor, tipMinor, totalMinor, shareMinor, lowerCount, effectivePct, adjusted };
}

export function formatPct(p: number): string {
  const r = Math.round(p * 10) / 10;
  return `${Number.isInteger(r) ? r.toFixed(0) : r.toFixed(1)}%`;
}

export const CURRENCIES: { code: string; name: string }[] = [
  { code: 'USD', name: 'US Dollar' },
  { code: 'EUR', name: 'Euro' },
  { code: 'GBP', name: 'British Pound' },
  { code: 'CAD', name: 'Canadian Dollar' },
  { code: 'AUD', name: 'Australian Dollar' },
  { code: 'NZD', name: 'New Zealand Dollar' },
  { code: 'JPY', name: 'Japanese Yen' },
  { code: 'CHF', name: 'Swiss Franc' },
  { code: 'MXN', name: 'Mexican Peso' },
  { code: 'BRL', name: 'Brazilian Real' },
  { code: 'INR', name: 'Indian Rupee' },
  { code: 'PKR', name: 'Pakistani Rupee' },
  { code: 'AED', name: 'UAE Dirham' },
  { code: 'SAR', name: 'Saudi Riyal' },
  { code: 'SGD', name: 'Singapore Dollar' },
  { code: 'HKD', name: 'Hong Kong Dollar' },
  { code: 'KRW', name: 'South Korean Won' },
  { code: 'CNY', name: 'Chinese Yuan' },
  { code: 'SEK', name: 'Swedish Krona' },
  { code: 'NOK', name: 'Norwegian Krone' },
  { code: 'DKK', name: 'Danish Krone' },
  { code: 'PLN', name: 'Polish Złoty' },
  { code: 'TRY', name: 'Turkish Lira' },
  { code: 'ZAR', name: 'South African Rand' },
  { code: 'THB', name: 'Thai Baht' },
  { code: 'PHP', name: 'Philippine Peso' },
  { code: 'ILS', name: 'Israeli Shekel' },
];
