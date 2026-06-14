/**
 * Hebrew translations for WC 2026 venues (USA / Canada / Mexico).
 * Keys match the English stadium/city strings from API-Football.
 */

const STADIUM_HE: Record<string, string> = {
  // USA
  "MetLife Stadium": "מטלייף סטדיום",
  "AT&T Stadium": "AT&T סטדיום",
  "SoFi Stadium": "סופיי סטדיום",
  "Rose Bowl Stadium": "רוז בול",
  "Rose Bowl": "רוז בול",
  "Levi's Stadium": "ליוויס סטדיום",
  "Arrowhead Stadium": "ארוהד סטדיום",
  "Hard Rock Stadium": "הארד רוק סטדיום",
  "Mercedes-Benz Stadium": "מרצדס-בנץ סטדיום",
  "Lincoln Financial Field": "לינקולן פייננשל פילד",
  "Gillette Stadium": "ג'ילט סטדיום",
  "Lumen Field": "לומן פילד",
  "NRG Stadium": "NRG סטדיום",
  // Canada
  "BC Place": "BC פלייס",
  "BMO Field": "BMO פילד",
  // Mexico
  "Estadio Azteca": "אצטקה",
  "Estadio BBVA": "BBVA",
  "Estadio Akron": "אקרון",
};

const CITY_HE: Record<string, string> = {
  "East Rutherford": "ניו ג'רזי",
  "Inglewood": "לוס אנג'לס",
  "Arlington": "ארלינגטון",
  "Houston": "יוסטון",
  "Pasadena": "פסדנה",
  "Santa Clara": "סנטה קלרה",
  "Kansas City": "קנזס סיטי",
  "Miami Gardens": "מיאמי",
  "Miami": "מיאמי",
  "Atlanta": "אטלנטה",
  "Philadelphia": "פילדלפיה",
  "Foxborough": "בוסטון",
  "Seattle": "סיאטל",
  "Mexico City": "מקסיקו סיטי",
  "Monterrey": "מונטריי",
  "Vancouver": "ונקובר",
  "Toronto": "טורונטו",
  "Guadalajara": "גוודלחרה",
};

export function stadiumHe(name?: string | null): string | null {
  if (!name) return null;
  return STADIUM_HE[name] ?? null;
}

export function cityHe(name?: string | null): string | null {
  if (!name) return null;
  return CITY_HE[name] ?? null;
}
