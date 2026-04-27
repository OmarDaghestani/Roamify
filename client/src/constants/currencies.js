/**
 * Common ISO 4217 codes for travel budgets. If a saved code is missing, the UI prepends it.
 * @type {{ code: string, label: string }[]}
 */
export const CURRENCY_OPTIONS = [
  { code: "USD", label: "USD — US dollar" },
  { code: "EUR", label: "EUR — Euro" },
  { code: "GBP", label: "GBP — British pound" },
  { code: "JPY", label: "JPY — Japanese yen" },
  { code: "CHF", label: "CHF — Swiss franc" },
  { code: "CAD", label: "CAD — Canadian dollar" },
  { code: "AUD", label: "AUD — Australian dollar" },
  { code: "NZD", label: "NZD — New Zealand dollar" },
  { code: "SEK", label: "SEK — Swedish krona" },
  { code: "NOK", label: "NOK — Norwegian krone" },
  { code: "DKK", label: "DKK — Danish krone" },
  { code: "PLN", label: "PLN — Polish złoty" },
  { code: "CZK", label: "CZK — Czech koruna" },
  { code: "HUF", label: "HUF — Hungarian forint" },
  { code: "RON", label: "RON — Romanian leu" },
  { code: "TRY", label: "TRY — Turkish lira" },
  { code: "ILS", label: "ILS — Israeli shekel" },
  { code: "AED", label: "AED — UAE dirham" },
  { code: "SAR", label: "SAR — Saudi riyal" },
  { code: "INR", label: "INR — Indian rupee" },
  { code: "SGD", label: "SGD — Singapore dollar" },
  { code: "HKD", label: "HKD — Hong Kong dollar" },
  { code: "CNY", label: "CNY — Chinese yuan" },
  { code: "KRW", label: "KRW — South Korean won" },
  { code: "THB", label: "THB — Thai baht" },
  { code: "MYR", label: "MYR — Malaysian ringgit" },
  { code: "IDR", label: "IDR — Indonesian rupiah" },
  { code: "PHP", label: "PHP — Philippine peso" },
  { code: "VND", label: "VND — Vietnamese dong" },
  { code: "MXN", label: "MXN — Mexican peso" },
  { code: "BRL", label: "BRL — Brazilian real" },
  { code: "ARS", label: "ARS — Argentine peso" },
  { code: "CLP", label: "CLP — Chilean peso" },
  { code: "COP", label: "COP — Colombian peso" },
  { code: "ZAR", label: "ZAR — South African rand" },
  { code: "EGP", label: "EGP — Egyptian pound" },
  { code: "MAD", label: "MAD — Moroccan dirham" },
  { code: "NGN", label: "NGN — Nigerian naira" },
  { code: "KES", label: "KES — Kenyan shilling" },
];

const codes = new Set(CURRENCY_OPTIONS.map((o) => o.code));

/**
 * Options for a `<select>`, including `currentCode` when it is a valid 3-letter code not in the preset list.
 */
export function currencySelectOptions(currentCode) {
  const raw = String(currentCode ?? "USD")
    .trim()
    .toUpperCase()
    .slice(0, 3);
  const extra =
    /^[A-Z]{3}$/.test(raw) && !codes.has(raw) ? [{ code: raw, label: `${raw} — saved` }] : [];
  return [...extra, ...CURRENCY_OPTIONS];
}

/** Value for `<select>`: must match an option code (falls back to USD). */
export function currencySelectValue(currentCode) {
  const opts = currencySelectOptions(currentCode);
  const raw = String(currentCode ?? "")
    .trim()
    .toUpperCase()
    .slice(0, 3);
  if (/^[A-Z]{3}$/.test(raw) && opts.some((o) => o.code === raw)) return raw;
  return opts.find((o) => o.code === "USD")?.code ?? "USD";
}
