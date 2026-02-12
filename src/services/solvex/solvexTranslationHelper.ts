/**
 * Solvex Translation Helper
 * Provides heuristic-based translation for common hotel amenities and phrases
 * to save AI tokens.
 */

const TRANSLATION_MAP: Record<string, string> = {
    // Basic Amenities
    "Outdoor swimming pool": "Otvoreni bazen",
    "Indoor swimming pool": "Zatvoreni bazen",
    "Children's pool": "Dečiji bazen",
    "Air conditioning": "Klima uređaj",
    "Free Wi-Fi": "Besplatan Wi-Fi",
    "Wi-Fi in public areas": "Wi-Fi u javnim prostorima",
    "Parking": "Parking",
    "Safe at the reception": "Sef na recepciji",
    "Fitness center": "Fitnes centar",
    "Spa & Wellness center": "Spa i Wellness centar",
    "Main restaurant": "Glavni restoran",
    "Lobby bar": "Lobi bar",
    "Pool bar": "Bar pored bazena",
    "Beach towels": "Peškiri za plažu",
    "Sun loungers": "Ležaljke",
    "Parasols": "Suncobrani",
    "Pets not allowed": "Kućni ljubimci nisu dozvoljeni",
    "Room service": "Sobna usluga",
    "Laundry": "Usluga pranja veša",

    // Room features
    "Satellite TV": "Satelitska TV",
    "Mini-bar": "Mini-bar",
    "Hairdryer": "Fen za kosu",
    "Telephone": "Telefon",
    "Balcony": "Balkon",
    "Shower": "Tuš kabina",
    "Sea view": "Pogled na more",
    "Park view": "Pogled na park",
    "Pool view": "Pogled na bazen",

    // Locations & General
    "Located in": "Nalazi se u",
    "metres from the beach": "metara od plaže",
    "central part of": "centralnom delu",
    "built in": "izgrađen",
    "renovated in": "renoviran",
    "Summer 2025": "Leto 2025",
    "Summer 2026": "Leto 2026",

    // Policies
    "Check-in time": "Vreme prijave",
    "Check-out time": "Vreme odjave",
    "No smoking": "Zabranjeno pušenje",
};

/**
 * Heuristically translate html/text content from Solvex
 * 1. Strips HTML tags (optional or preserves if requested)
 * 2. Matches exact phrases from dictionary
 * 3. Returns translated text
 */
export const heuristicTranslate = (text: string, stripHtml = true): string => {
    if (!text) return "";

    let processed = text;

    // Replace phrases from dictionary
    Object.entries(TRANSLATION_MAP).forEach(([en, sr]) => {
        const regex = new RegExp(en, 'gi');
        processed = processed.replace(regex, sr);
    });

    if (stripHtml) {
        // Basic HTML strip
        processed = processed.replace(/<[^>]*>?/gm, '');
        // Clean up multiple spaces/newlines
        processed = processed.replace(/\s+/g, ' ').trim();
    }

    return processed;
};

/**
 * Extracts a "Short Description" from a longer Solvex description
 * aiming for ~300 characters
 */
export const extractShortDescription = (text: string): string => {
    const clean = heuristicTranslate(text, true);
    if (clean.length <= 300) return clean;

    // Take first few sentences
    const sentences = clean.match(/[^.!?]+[.!?]+/g) || [clean];
    let short = "";
    for (const s of sentences) {
        if ((short + s).length <= 300) {
            short += s + " ";
        } else {
            break;
        }
    }

    return short.trim() || clean.substring(0, 297) + "...";
};
