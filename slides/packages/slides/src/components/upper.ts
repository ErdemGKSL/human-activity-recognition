/**
 * Uppercase in the deck's language. CSS `text-transform: uppercase` in Takumi
 * ignores the locale, which turns Turkish "Girdi" into "GIRDI" instead of
 * "GİRDİ" (i → İ, ı → I). Uppercasing the string itself also puts the capitals
 * into the exported PowerPoint text, where `text-transform` has no equivalent.
 */
export function upper(text: string, lang: string): string {
  return text.toLocaleUpperCase(lang);
}
