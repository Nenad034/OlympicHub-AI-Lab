// Nationalities list for booking forms
// ISO 3166-1 alpha-2 country codes

export interface Nationality {
    code: string;
    name: string; // Serbian name
    nameEn: string; // English name
}

export const NATIONALITIES: Nationality[] = [
    // Balkan countries (most common for our users)
    { code: 'RS', name: 'Srbija', nameEn: 'Serbia' },
    { code: 'HR', name: 'Hrvatska', nameEn: 'Croatia' },
    { code: 'BA', name: 'Bosna i Hercegovina', nameEn: 'Bosnia and Herzegovina' },
    { code: 'ME', name: 'Crna Gora', nameEn: 'Montenegro' },
    { code: 'MK', name: 'Severna Makedonija', nameEn: 'North Macedonia' },
    { code: 'SI', name: 'Slovenija', nameEn: 'Slovenia' },
    { code: 'AL', name: 'Albanija', nameEn: 'Albania' },


    // Neighboring countries
    { code: 'BG', name: 'Bugarska', nameEn: 'Bulgaria' },
    { code: 'RO', name: 'Rumunija', nameEn: 'Romania' },
    { code: 'GR', name: 'Grčka', nameEn: 'Greece' },
    { code: 'HU', name: 'Mađarska', nameEn: 'Hungary' },
    { code: 'TR', name: 'Turska', nameEn: 'Turkey' },

    // Western Europe (popular destinations)
    { code: 'DE', name: 'Nemačka', nameEn: 'Germany' },
    { code: 'AT', name: 'Austrija', nameEn: 'Austria' },
    { code: 'CH', name: 'Švajcarska', nameEn: 'Switzerland' },
    { code: 'IT', name: 'Italija', nameEn: 'Italy' },
    { code: 'FR', name: 'Francuska', nameEn: 'France' },
    { code: 'ES', name: 'Španija', nameEn: 'Spain' },
    { code: 'PT', name: 'Portugalija', nameEn: 'Portugal' },
    { code: 'GB', name: 'Velika Britanija', nameEn: 'United Kingdom' },
    { code: 'IE', name: 'Irska', nameEn: 'Ireland' },
    { code: 'NL', name: 'Holandija', nameEn: 'Netherlands' },
    { code: 'BE', name: 'Belgija', nameEn: 'Belgium' },
    { code: 'LU', name: 'Luksemburg', nameEn: 'Luxembourg' },

    // Nordic countries
    { code: 'SE', name: 'Švedska', nameEn: 'Sweden' },
    { code: 'NO', name: 'Norveška', nameEn: 'Norway' },
    { code: 'DK', name: 'Danska', nameEn: 'Denmark' },
    { code: 'FI', name: 'Finska', nameEn: 'Finland' },
    { code: 'IS', name: 'Island', nameEn: 'Iceland' },

    // Eastern Europe
    { code: 'PL', name: 'Poljska', nameEn: 'Poland' },
    { code: 'CZ', name: 'Češka', nameEn: 'Czech Republic' },
    { code: 'SK', name: 'Slovačka', nameEn: 'Slovakia' },
    { code: 'UA', name: 'Ukrajina', nameEn: 'Ukraine' },
    { code: 'BY', name: 'Belorusija', nameEn: 'Belarus' },
    { code: 'RU', name: 'Rusija', nameEn: 'Russia' },
    { code: 'LT', name: 'Litvanija', nameEn: 'Lithuania' },
    { code: 'LV', name: 'Letonija', nameEn: 'Latvia' },
    { code: 'EE', name: 'Estonija', nameEn: 'Estonia' },
    { code: 'MD', name: 'Moldavija', nameEn: 'Moldova' },

    // Americas
    { code: 'US', name: 'Sjedinjene Američke Države', nameEn: 'United States' },
    { code: 'CA', name: 'Kanada', nameEn: 'Canada' },
    { code: 'MX', name: 'Meksiko', nameEn: 'Mexico' },
    { code: 'BR', name: 'Brazil', nameEn: 'Brazil' },
    { code: 'AR', name: 'Argentina', nameEn: 'Argentina' },
    { code: 'CL', name: 'Čile', nameEn: 'Chile' },

    // Asia
    { code: 'CN', name: 'Kina', nameEn: 'China' },
    { code: 'JP', name: 'Japan', nameEn: 'Japan' },
    { code: 'KR', name: 'Južna Koreja', nameEn: 'South Korea' },
    { code: 'IN', name: 'Indija', nameEn: 'India' },
    { code: 'TH', name: 'Tajland', nameEn: 'Thailand' },
    { code: 'SG', name: 'Singapur', nameEn: 'Singapore' },
    { code: 'MY', name: 'Malezija', nameEn: 'Malaysia' },
    { code: 'ID', name: 'Indonezija', nameEn: 'Indonesia' },
    { code: 'PH', name: 'Filipini', nameEn: 'Philippines' },
    { code: 'VN', name: 'Vijetnam', nameEn: 'Vietnam' },
    { code: 'AE', name: 'Ujedinjeni Arapski Emirati', nameEn: 'United Arab Emirates' },
    { code: 'SA', name: 'Saudijska Arabija', nameEn: 'Saudi Arabia' },
    { code: 'IL', name: 'Izrael', nameEn: 'Israel' },

    // Oceania
    { code: 'AU', name: 'Australija', nameEn: 'Australia' },
    { code: 'NZ', name: 'Novi Zeland', nameEn: 'New Zealand' },

    // Africa
    { code: 'ZA', name: 'Južnoafrička Republika', nameEn: 'South Africa' },
    { code: 'EG', name: 'Egipat', nameEn: 'Egypt' },
    { code: 'MA', name: 'Maroko', nameEn: 'Morocco' },
    { code: 'TN', name: 'Tunis', nameEn: 'Tunisia' },
];

/**
 * Get nationality name by code
 */
export const getNationalityByCode = (code: string): Nationality | undefined => {
    return NATIONALITIES.find(n => n.code === code);
};

/**
 * Search nationalities by name (Serbian or English)
 */
export const searchNationalities = (query: string): Nationality[] => {
    const lowerQuery = query.toLowerCase();
    return NATIONALITIES.filter(
        n => n.name.toLowerCase().includes(lowerQuery) ||
            n.nameEn.toLowerCase().includes(lowerQuery)
    );
};
