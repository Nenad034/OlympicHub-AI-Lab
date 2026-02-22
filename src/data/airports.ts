// Popular airports database
export interface Airport {
    code: string;
    city: string;
    country: string;
    name: string;
}

export const AIRPORTS: Airport[] = [
    // Srbija
    { code: 'BEG', city: 'Beograd', country: 'Srbija', name: 'Nikola Tesla Airport' },
    { code: 'INI', city: 'Niš', country: 'Srbija', name: 'Constantine the Great Airport' },

    // Francuska
    { code: 'CDG', city: 'Pariz', country: 'Francuska', name: 'Charles de Gaulle Airport' },
    { code: 'ORY', city: 'Pariz', country: 'Francuska', name: 'Orly Airport' },
    { code: 'NCE', city: 'Nica', country: 'Francuska', name: 'Côte d\'Azur Airport' },
    { code: 'LYS', city: 'Lion', country: 'Francuska', name: 'Lyon-Saint Exupéry Airport' },
    { code: 'MRS', city: 'Marseille', country: 'Francuska', name: 'Marseille Provence Airport' },

    // Italija
    { code: 'FCO', city: 'Rim', country: 'Italija', name: 'Leonardo da Vinci Airport' },
    { code: 'CIA', city: 'Rim', country: 'Italija', name: 'Ciampino Airport' },
    { code: 'MXP', city: 'Milano', country: 'Italija', name: 'Malpensa Airport' },
    { code: 'LIN', city: 'Milano', country: 'Italija', name: 'Linate Airport' },
    { code: 'VCE', city: 'Venecija', country: 'Italija', name: 'Marco Polo Airport' },
    { code: 'NAP', city: 'Napulj', country: 'Italija', name: 'Naples International Airport' },
    { code: 'BGY', city: 'Bergamo', country: 'Italija', name: 'Orio al Serio Airport' },

    // Španija
    { code: 'MAD', city: 'Madrid', country: 'Španija', name: 'Adolfo Suárez Madrid-Barajas' },
    { code: 'BCN', city: 'Barselona', country: 'Španija', name: 'Barcelona-El Prat Airport' },
    { code: 'AGP', city: 'Malaga', country: 'Španija', name: 'Málaga-Costa del Sol Airport' },
    { code: 'PMI', city: 'Palma de Majorka', country: 'Španija', name: 'Palma de Mallorca Airport' },
    { code: 'SVQ', city: 'Sevilja', country: 'Španija', name: 'Seville Airport' },
    { code: 'ALC', city: 'Alikante', country: 'Španija', name: 'Alicante-Elche Airport' },

    // Nemačka
    { code: 'FRA', city: 'Frankfurt', country: 'Nemačka', name: 'Frankfurt Airport' },
    { code: 'MUC', city: 'Minhen', country: 'Nemačka', name: 'Munich Airport' },
    { code: 'BER', city: 'Berlin', country: 'Nemačka', name: 'Berlin Brandenburg Airport' },
    { code: 'DUS', city: 'Diseldorf', country: 'Nemačka', name: 'Düsseldorf Airport' },
    { code: 'HAM', city: 'Hamburg', country: 'Nemačka', name: 'Hamburg Airport' },

    // Velika Britanija
    { code: 'LHR', city: 'London', country: 'Velika Britanija', name: 'Heathrow Airport' },
    { code: 'LGW', city: 'London', country: 'Velika Britanija', name: 'Gatwick Airport' },
    { code: 'STN', city: 'London', country: 'Velika Britanija', name: 'Stansted Airport' },
    { code: 'MAN', city: 'Mančester', country: 'Velika Britanija', name: 'Manchester Airport' },
    { code: 'EDI', city: 'Edinburg', country: 'Velika Britanija', name: 'Edinburgh Airport' },

    // Grčka
    { code: 'ATH', city: 'Atina', country: 'Grčka', name: 'Athens International Airport' },
    { code: 'SKG', city: 'Solun', country: 'Grčka', name: 'Thessaloniki Airport' },
    { code: 'HER', city: 'Heraklion', country: 'Grčka', name: 'Heraklion International Airport' },
    { code: 'RHO', city: 'Rodos', country: 'Grčka', name: 'Rhodes International Airport' },
    { code: 'CFU', city: 'Krf', country: 'Grčka', name: 'Corfu International Airport' },

    // Turska
    { code: 'IST', city: 'Istanbul', country: 'Turska', name: 'Istanbul Airport' },
    { code: 'SAW', city: 'Istanbul', country: 'Turska', name: 'Sabiha Gökçen Airport' },
    { code: 'AYT', city: 'Antalija', country: 'Turska', name: 'Antalya Airport' },
    { code: 'ESB', city: 'Ankara', country: 'Turska', name: 'Esenboğa Airport' },
    { code: 'ADB', city: 'Izmir', country: 'Turska', name: 'Adnan Menderes Airport' },

    // Holandija
    { code: 'AMS', city: 'Amsterdam', country: 'Holandija', name: 'Schiphol Airport' },

    // Švajcarska
    { code: 'ZRH', city: 'Cirih', country: 'Švajcarska', name: 'Zurich Airport' },
    { code: 'GVA', city: 'Ženeva', country: 'Švajcarska', name: 'Geneva Airport' },

    // Austrija
    { code: 'VIE', city: 'Beč', country: 'Austrija', name: 'Vienna International Airport' },

    // Belgija
    { code: 'BRU', city: 'Brisel', country: 'Belgija', name: 'Brussels Airport' },

    // Portugal
    { code: 'LIS', city: 'Lisabon', country: 'Portugal', name: 'Lisbon Portela Airport' },
    { code: 'OPO', city: 'Porto', country: 'Portugal', name: 'Francisco Sá Carneiro Airport' },

    // Hrvatska
    { code: 'ZAG', city: 'Zagreb', country: 'Hrvatska', name: 'Franjo Tuđman Airport' },
    { code: 'SPU', city: 'Split', country: 'Hrvatska', name: 'Split Airport' },
    { code: 'DBV', city: 'Dubrovnik', country: 'Hrvatska', name: 'Dubrovnik Airport' },

    // Crna Gora
    { code: 'TGD', city: 'Podgorica', country: 'Crna Gora', name: 'Podgorica Airport' },
    { code: 'TIV', city: 'Tivat', country: 'Crna Gora', name: 'Tivat Airport' },

    // Bosna i Hercegovina
    { code: 'SJJ', city: 'Sarajevo', country: 'Bosna i Hercegovina', name: 'Sarajevo International Airport' },

    // Severna Makedonija
    { code: 'SKP', city: 'Skoplje', country: 'Severna Makedonija', name: 'Skopje Alexander the Great Airport' },

    // UAE
    { code: 'DXB', city: 'Dubai', country: 'UAE', name: 'Dubai International Airport' },
    { code: 'AUH', city: 'Abu Dhabi', country: 'UAE', name: 'Abu Dhabi International Airport' },

    // USA
    { code: 'JFK', city: 'Njujork', country: 'USA', name: 'John F. Kennedy Airport' },
    { code: 'LAX', city: 'Los Anđeles', country: 'USA', name: 'Los Angeles International Airport' },
    { code: 'MIA', city: 'Majami', country: 'USA', name: 'Miami International Airport' },
    { code: 'ORD', city: 'Čikago', country: 'USA', name: 'O\'Hare International Airport' },

    // Egipat
    { code: 'CAI', city: 'Kairo', country: 'Egipat', name: 'Cairo International Airport' },
    { code: 'HRG', city: 'Hurgada', country: 'Egipat', name: 'Hurghada International Airport' },
    { code: 'SSH', city: 'Šarm el Šeik', country: 'Egipat', name: 'Sharm el-Sheikh Airport' },

    // Tunis
    { code: 'TUN', city: 'Tunis', country: 'Tunis', name: 'Tunis-Carthage Airport' },
    { code: 'DJE', city: 'Džerba', country: 'Tunis', name: 'Djerba-Zarzis Airport' },
];

// Search function
export const searchAirports = (query: string): Airport[] => {
    if (!query || query.length < 2) return [];

    const searchTerm = query.toLowerCase();

    return AIRPORTS.filter(airport =>
        airport.city.toLowerCase().includes(searchTerm) ||
        airport.code.toLowerCase().includes(searchTerm) ||
        airport.country.toLowerCase().includes(searchTerm) ||
        airport.name.toLowerCase().includes(searchTerm)
    ).slice(0, 10); // Limit to 10 results
};

// Get airport by code
export const getAirportByCode = (code: string): Airport | undefined => {
    return AIRPORTS.find(airport => airport.code === code);
};
