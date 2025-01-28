require("dotenv").config();
const { Translate } = require("@google-cloud/translate").v2;
const path = require("path");

const serviceAccountPath = path.join(__dirname, "../translateApiCredentials.json");
console.log("Service Account Path:", serviceAccountPath);
process.env.GOOGLE_APPLICATION_CREDENTIALS = serviceAccountPath;
const translate = new Translate({});

async function getSupportedLanguages() {
    try {
      const [languages] = await translate.getLanguages();
      return languages;
    } catch (error) {
      console.error("Error fetching supported languages:", error.message);
      throw error;
    }
  } 

  async function translateText(text, targetLanguage) {
    try {
      if (!text || typeof text !== "string") {
        throw new Error("The text to translate must be a non-empty string.");
      }
      if (!targetLanguage || typeof targetLanguage !== "string") {
        throw new Error("A valid target language code is required.");
      }
  
      const options = { model: "nmt", to: targetLanguage };
      const [translation] = await translate.translate(text, options);
      return translation;
    } catch (error) {
      console.error("Error translating text:", error.message);
      throw error;
    }
  }

  function countryCodeToEmoji(countryCode) {
    if (!countryCode || typeof countryCode !== "string") {
      throw new Error("Invalid country code.");
    }
    
    const codePoints = countryCode
      .toUpperCase()
      .split("")
      .map((char) => 127397 + char.charCodeAt(0));
  
    return String.fromCodePoint(...codePoints);
  }

  async function getFlagMap() {
    const supportedLanguages = await getSupportedLanguages();
    const flagMap = new Map(
      supportedLanguages
        .map((language) => {
            if (!languageToCountry[language.code]) {
                return null;
            }
            const emoji = countryCodeToEmoji(languageToCountry[language.code]);
            return [emoji, language ]
        })
        .filter(Boolean)
    );
    return flagMap;
  }
  const languageToCountry = {
    am: "ET", // Amharic → Ethiopia
    ar: "SA", // Arabic → Saudi Arabia
    az: "AZ", // Azerbaijani → Azerbaijan
    be: "BY", // Belarusian → Belarus
    bg: "BG", // Bulgarian → Bulgaria
    bn: "BD", // Bengali → Bangladesh
    cs: "CZ", // Czech → Czech Republic
    da: "DK", // Danish → Denmark
    de: "DE", // German → Germany
    el: "GR", // Greek → Greece
    en: "US", // English → United States
    es: "ES", // Spanish → Spain
    et: "EE", // Estonian → Estonia
    fa: "IR", // Persian → Iran
    fi: "FI", // Finnish → Finland
    fr: "FR", // French → France
    ga: "IE", // Irish → Ireland
    he: "IL", // Hebrew → Israel
    hi: "IN", // Hindi → India
    hr: "HR", // Croatian → Croatia
    hu: "HU", // Hungarian → Hungary
    hy: "AM", // Armenian → Armenia
    id: "ID", // Indonesian → Indonesia
    is: "IS", // Icelandic → Iceland
    it: "IT", // Italian → Italy
    ja: "JP", // Japanese → Japan
    ka: "GE", // Georgian → Georgia
    kk: "KZ", // Kazakh → Kazakhstan
    km: "KH", // Khmer → Cambodia
    ko: "KR", // Korean → South Korea
    ky: "KG", // Kyrgyz → Kyrgyzstan
    lo: "LA", // Lao → Laos
    lt: "LT", // Lithuanian → Lithuania
    lv: "LV", // Latvian → Latvia
    mk: "MK", // Macedonian → North Macedonia
    mn: "MN", // Mongolian → Mongolia
    ms: "MY", // Malay → Malaysia
    mt: "MT", // Maltese → Malta
    my: "MM", // Burmese → Myanmar
    ne: "NP", // Nepali → Nepal
    nl: "NL", // Dutch → Netherlands
    no: "NO", // Norwegian → Norway
    pl: "PL", // Polish → Poland
    pt: "PT", // Portuguese → Portugal
    ro: "RO", // Romanian → Romania
    ru: "RU", // Russian → Russia
    si: "LK", // Sinhala → Sri Lanka
    sk: "SK", // Slovak → Slovakia
    sl: "SI", // Slovenian → Slovenia
    sq: "AL", // Albanian → Albania
    sr: "RS", // Serbian → Serbia
    sv: "SE", // Swedish → Sweden
    sw: "TZ", // Swahili → Tanzania
    th: "TH", // Thai → Thailand
    tr: "TR", // Turkish → Turkey
    uk: "UA", // Ukrainian → Ukraine
    ur: "PK", // Urdu → Pakistan
    uz: "UZ", // Uzbek → Uzbekistan
    vi: "VN", // Vietnamese → Vietnam
    zh: "CN", // Chinese → China
    zu: "ZA", // Zulu → South Africa
  };
  

module.exports = {
    getFlagMap,
    translateText
}

