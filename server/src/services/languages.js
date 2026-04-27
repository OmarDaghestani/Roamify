/** ISO 3166-1 alpha-2 → short language note for travelers */
const byCountry = {
  PT: "Portuguese; English widely spoken in tourist areas.",
  ES: "Spanish; English in major cities and resorts.",
  FR: "French; English variable outside Paris.",
  IT: "Italian; English common in cities.",
  DE: "German; English common in Berlin and business hubs.",
  GR: "Greek; English common on islands and Athens.",
  JP: "Japanese; English limited outside cities—translation apps help.",
  TH: "Thai; English in tourist zones.",
  MX: "Spanish; English in Cancún and major cities.",
  US: "English; Spanish common in many regions.",
  GB: "English.",
  NL: "Dutch; English very common.",
  IE: "English and Irish.",
  HR: "Croatian; English common along the coast.",
  TR: "Turkish; English in Istanbul and resorts.",
  MA: "Arabic (Darija), French; English in Marrakech/Fez tourist areas.",
  IS: "Icelandic; English nearly universal.",
  NO: "Norwegian; English widely spoken.",
  SE: "Swedish; English widely spoken.",
  DK: "Danish; English widely spoken.",
  AT: "German; English in Vienna and ski towns.",
  CH: "German/French/Italian depending on region; English in cities.",
  BE: "Dutch/French; English common in Brussels.",
  PL: "Polish; English growing in cities.",
  CZ: "Czech; English in Prague.",
  HU: "Hungarian; English in Budapest.",
  VN: "Vietnamese; English in Hanoi/HCMC tourist areas.",
  ID: "Indonesian (Bahasa); English in Bali.",
  AU: "English.",
  NZ: "English and Te Reo Māori.",
  CA: "English and French (Quebec).",
  CR: "Spanish; English in eco-tourism areas.",
  CL: "Spanish; English limited outside Santiago.",
  AR: "Spanish; English in Buenos Aires tourist spots.",
  BR: "Portuguese; English limited—apps recommended.",
  CO: "Spanish; English in Medellín/Cartagena tourist zones.",
  EG: "Arabic; English in Cairo/Luxor tourist areas.",
  ZA: "English widely; Afrikaans and local languages.",
  KE: "Swahili and English; English common for safaris.",
};

export function languageNoteForCountry(countryCode) {
  if (!countryCode) return "Research common phrases; translation apps recommended.";
  const code = String(countryCode).toUpperCase();
  return byCountry[code] || "English or local phrasebook recommended; verify entry language requirements.";
}
