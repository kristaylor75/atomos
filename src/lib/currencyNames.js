/**
 * Returns a localized currency name using the browser's Intl.DisplayNames API.
 * Falls back to the English label from ALL_CURRENCIES if the API is unavailable.
 */
export function getCurrencyName(code, lang, fallback) {
  try {
    const displayNames = new Intl.DisplayNames([lang], { type: 'currency' });
    const name = displayNames.of(code.toUpperCase());
    // Intl returns the code itself when it can't find a name — use fallback instead
    if (name && name !== code.toUpperCase()) return name;
  } catch {}
  return fallback;
}