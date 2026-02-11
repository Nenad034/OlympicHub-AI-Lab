export type Language = 'sr' | 'en';

export interface Translations {
    dashboard: string;
    apps: string;
    production: string;
    sales: string;
    marketing: string;
    settings: string;
    searchPlaceholder: string;
    welcomeBack: string;
    hubDesc: string;
    activeTools: string;
    sectors: string;
    system: string;
    openModule: string;
    aiAssistant: string;
    aiDesc: string;
    startChat: string;
    quickActions: string;
    recentActivity: string;
    viewAll: string;
    language: string;
    userLevel: string;
    viewOnly: string;
    editView: string;
    uploadExcel: string;
    aiAnalysis: string;
    filters: string;
    back: string;
    loadedFile: string;
    noData: string;
    rowsCount: string;
    totalValue: string;
    reservations: string;
    // Settings & Backups
    apiKeys: string;
    geminiKey: string;
    saveSettings: string;
    pointOfReturn: string;
    createBackup: string;
    restore: string;
    backupHistory: string;
    dangerZone: string;
    rollbackSuccess: string;
    snapshotCreated: string;
    // Trip Counselor
    tripCounselor: string;
    tripCounselorShort: string;
    smartQueryLabel: string;
    smartQueryPlaceholder: string;
    checkIn: string;
    checkOut: string;
    nights: string;
    flexibility: string;
    rooms: string;
    adults: string;
    children: string;
    childAge: string;
    searchOffers: string;
    accommodation: string;
    flight: string;
    transfer: string;
    travels: string;
    cruises: string;
    fixed: string;
    softZone: string;
    intelligence: string;
    baselineMode: string;
    activeReflexes: string;
    priceGuard: string;
    coolCation: string;
    financialEmpathy: string;
    safeHarbor: string;
    priceLocked: string;
    guardianAngel: string;
    coldCation: string;
    location: string;
    temperature: string;
    condition: string;
    riskLevel: string;
    economicTone: string;
    trendingSignals: string;
    reflexAction: string;
    dynamicImpact: string;
    sensors: string;
    sentiment: string;
}

export const translations: Record<Language, Translations> = {
    sr: {
        dashboard: "Dashboard",
        apps: "Aplikacije",
        production: "Produkcija",
        sales: "Prodaja",
        marketing: "Marketing",
        settings: "Podešavanja",
        searchPlaceholder: "Pretraži aplikacije i module...",
        welcomeBack: "Dobrodošli nazad",
        hubDesc: "Vaš centralni Hub za upravljanje ClickToTravel poslovanjem.",
        activeTools: "Aktivni Alati",
        sectors: "Sektori",
        system: "Sistem",
        openModule: "Otvori Modul",
        aiAssistant: "AI Asistent",
        aiDesc: "Spreman za analizu vaših MARS podataka.",
        startChat: "Pokreni Chat",
        quickActions: "Brze Prečice",
        recentActivity: "Nedavna Aktivnost",
        viewAll: "Vidi sve",
        language: "Jezik",
        userLevel: "Nivo Pristupa",
        viewOnly: "Samo gledanje",
        editView: "Uređivanje i gledanje",
        uploadExcel: "Učitaj Excel",
        aiAnalysis: "AI Analiza",
        filters: "Filteri",
        back: "Nazad",
        loadedFile: "Učitan fajl",
        noData: "Nema podataka za prikaz",
        rowsCount: "Broj redova",
        totalValue: "Ukupna vrednost",
        reservations: "Rezervacije",
        apiKeys: "API Ključevi",
        geminiKey: "Gemini API Ključ",
        saveSettings: "Sačuvaj Podešavanja",
        pointOfReturn: "Tačka Povratka",
        createBackup: "Napravi Snapshot",
        restore: "Vrati verziju",
        backupHistory: "Istorija verzija",
        dangerZone: "Zona opreza",
        rollbackSuccess: "Sistem je uspešno vraćen na prethodnu verziju!",
        snapshotCreated: "Snapshot sistema je uspešno kreiran.",
        tripCounselor: "Savetnik za putovanja",
        tripCounselorShort: "Total Trip",
        smartQueryLabel: "Destinacija, Hotel... ili jednostavno napišite gde želite da putujete",
        smartQueryPlaceholder: "Npr: Porodični hotel u Grčkoj pored plaže do 2000€ ili samo 'Kopaonik'...",
        checkIn: "Polazak",
        checkOut: "Povratak",
        nights: "Noćenja",
        flexibility: "+/- dana",
        rooms: "Broj soba",
        adults: "Odrasli",
        children: "Deca",
        childAge: "Det",
        searchOffers: "Pretraži Ponude",
        accommodation: "Smeštaj",
        flight: "Avion",
        transfer: "Transfer",
        travels: "Putovanja",
        cruises: "Krstarenje",
        fixed: "Fiksno",
        softZone: "Meka Zona",
        intelligence: "Inteligencija",
        baselineMode: "Standarni Režim",
        activeReflexes: "Aktivni Refleksi",
        priceGuard: "Zaštita Cene",
        coolCation: "Osvežavajuća Ponuda",
        financialEmpathy: "Finansijska Podrška",
        safeHarbor: "Sigurna Luka",
        priceLocked: "Cena je zaključana",
        guardianAngel: "Anđeo Čuvar",
        coldCation: "Zimski Beg",
        location: "Lokacija",
        temperature: "Temperatura",
        condition: "Stanje",
        riskLevel: "Nivo Rizika",
        economicTone: "Ekonomski Ton",
        trendingSignals: "Signali u Trendu",
        reflexAction: "Akcija Refleksa",
        dynamicImpact: "Dinamički Uticaj na UI",
        sensors: "Ekološki Senzori",
        sentiment: "Tržišni Sentiment"
    },
    en: {
        dashboard: "Dashboard",
        apps: "Applications",
        production: "Production",
        sales: "Sales",
        marketing: "Marketing",
        settings: "Settings",
        searchPlaceholder: "Search apps and modules...",
        welcomeBack: "Welcome Back",
        hubDesc: "Your central Hub for managing ClickToTravel business.",
        activeTools: "Active Tools",
        sectors: "Sectors",
        system: "System",
        openModule: "Open Module",
        aiAssistant: "AI Assistant",
        aiDesc: "Ready to analyze your MARS data.",
        startChat: "Start Chat",
        quickActions: "Quick Actions",
        recentActivity: "Recent Activity",
        viewAll: "View all",
        language: "Language",
        userLevel: "Access Level",
        viewOnly: "View Only",
        editView: "Edit & View",
        uploadExcel: "Upload Excel",
        aiAnalysis: "AI Analysis",
        filters: "Filters",
        back: "Back",
        loadedFile: "Loaded file",
        noData: "No data to display",
        rowsCount: "Rows count",
        totalValue: "Total value",
        reservations: "Reservations",
        apiKeys: "API Keys",
        geminiKey: "Gemini API Key",
        saveSettings: "Save Settings",
        pointOfReturn: "Point of Return",
        createBackup: "Create Snapshot",
        restore: "Restore version",
        backupHistory: "Version history",
        dangerZone: "Danger Zone",
        rollbackSuccess: "System successfully restored to a previous version!",
        snapshotCreated: "System snapshot successfully created.",
        tripCounselor: "Trip Counselor",
        tripCounselorShort: "Total Trip",
        smartQueryLabel: "Destination, Hotel... or simply type where you want to travel",
        smartQueryPlaceholder: "E.g.: Family hotel in Greece near beach under 2000€ or just 'Kopaonik'...",
        checkIn: "Departure",
        checkOut: "Return",
        nights: "Nights",
        flexibility: "+/- days",
        rooms: "Rooms",
        adults: "Adults",
        children: "Children",
        childAge: "Child",
        searchOffers: "Search Offers",
        accommodation: "Accommodation",
        flight: "Flight",
        transfer: "Transfer",
        travels: "Travels",
        cruises: "Cruises",
        fixed: "Fixed",
        softZone: "Soft Zone",
        intelligence: "Intelligence",
        baselineMode: "Baseline Mode",
        activeReflexes: "Active Reflexes",
        priceGuard: "Price Guard",
        coolCation: "Cool-cation",
        financialEmpathy: "Financial Empathy",
        safeHarbor: "Safe Harbor",
        priceLocked: "Price is locked",
        guardianAngel: "Guardian Angel",
        coldCation: "Winter Escape",
        location: "Location",
        temperature: "Temperature",
        condition: "Condition",
        riskLevel: "Risk Level",
        economicTone: "Economic Tone",
        trendingSignals: "Trending Signals",
        reflexAction: "Reflex Action",
        dynamicImpact: "Dynamic UI Impact",
        sensors: "Environmental Sensors",
        sentiment: "Market Sentiment"
    }
};
