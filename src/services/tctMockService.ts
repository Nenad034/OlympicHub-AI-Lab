/**
 * TCT Mock Service
 * Simulira TCT API odgovore dok čekamo B2B aktivaciju
 * 
 * Podaci su bazirani na Postman kolekciji i dokumentaciji
 */

// Simulirani delay za realističnost
const mockDelay = (ms: number = 500) => new Promise(resolve => setTimeout(resolve, ms));

// Mock response wrapper
const mockResponse = <T>(data: T) => ({
    data,
    error: null,
    success: true,
});

// ============ Mock Data ============

const mockNationalities = [
    { id: "324528", nationality: "Afghanistan", code: "AF" },
    { id: "324529", nationality: "Albania", code: "AL" },
    { id: "324530", nationality: "Algeria", code: "DZ" },
    { id: "324667", nationality: "Serbia", code: "RS" },
    { id: "324668", nationality: "Croatia", code: "HR" },
    { id: "324669", nationality: "Bosnia and Herzegovina", code: "BA" },
];

const mockGeography = [
    { location_id: "647124", location_name: "Egypt", country_id: "647124", location_type: "country", code: "EG" },
    { location_id: "647125", location_name: "Red Sea", country_id: "647124", location_type: "region", location_parent: "647124" },
    { location_id: "647126", location_name: "Hurghada", country_id: "647124", location_type: "city", location_parent: "647125" },
    { location_id: "647127", location_name: "Sharm El Sheikh", country_id: "647124", location_type: "city", location_parent: "647125" },
    { location_id: "647128", location_name: "Turkey", country_id: "647128", location_type: "country", code: "TR" },
    { location_id: "647129", location_name: "Antalya", country_id: "647128", location_type: "region", location_parent: "647128" },
];

const mockAirports = [
    { code: "BEG", name: "Belgrade Nikola Tesla", country: "Serbia", country_id: "324667", continent: "EU" },
    { code: "HRG", name: "Hurghada International", country: "Egypt", country_id: "647124", continent: "AF" },
    { code: "SSH", name: "Sharm El Sheikh International", country: "Egypt", country_id: "647124", continent: "AF" },
    { code: "AYT", name: "Antalya", country: "Turkey", country_id: "647128", continent: "AS" },
];

const mockHotelCategories = [
    { category: 0, category_description: "Uncategorized" },
    { category: 1, category_description: "1 Star" },
    { category: 2, category_description: "2 Stars" },
    { category: 3, category_description: "3 Stars" },
    { category: 4, category_description: "4 Stars" },
    { category: 5, category_description: "5 Stars" },
];

const mockMealPlans = [
    { meal_plan: "RO", meal_plan_description: "Room Only" },
    { meal_plan: "BB", meal_plan_description: "Bed and Breakfast" },
    { meal_plan: "HB", meal_plan_description: "Half Board" },
    { meal_plan: "FB", meal_plan_description: "Full Board" },
    { meal_plan: "AI", meal_plan_description: "All Inclusive" },
];

const mockHotels = [
    {
        id: "1001",
        hotel_id: "1001",
        name: "Sunrise Grand Select Crystal Bay Resort",
        city: "Hurghada",
        destination: "Red Sea",
        country: "EG",
        category: "5",
        address: "Safaga Road, Hurghada, Egypt",
        geoCodes: { lat: "27.1783", long: "33.8116" },
        description_en: "Luxurious 5-star resort with private beach, multiple pools, and all-inclusive service.",
        photos: [
            { type: "MAIN", url: "https://via.placeholder.com/800x600?text=Sunrise+Grand+Select" },
        ],
    },
    {
        id: "1002",
        hotel_id: "1002",
        name: "Steigenberger Aqua Magic",
        city: "Hurghada",
        destination: "Red Sea",
        country: "EG",
        category: "5",
        address: "Hurghada, Egypt",
        geoCodes: { lat: "27.2583", long: "33.8116" },
        description_en: "Family-friendly resort with water park and aqua park.",
        photos: [
            { type: "MAIN", url: "https://via.placeholder.com/800x600?text=Steigenberger+Aqua+Magic" },
        ],
    },
    {
        id: "1003",
        hotel_id: "1003",
        name: "Rixos Premium Seagate",
        city: "Sharm El Sheikh",
        destination: "Sinai",
        country: "EG",
        category: "5",
        address: "Nabq Bay, Sharm El Sheikh, Egypt",
        geoCodes: { lat: 28.0836, long: 34.3894 },
        description_en: "Ultra all-inclusive resort with private beach and world-class spa.",
        photos: [
            { type: "MAIN", url: "https://via.placeholder.com/800x600?text=Rixos+Premium" },
        ],
    },
];

const mockSearchResults = {
    status: true,
    audit: { hotels: 3, solutions: 15, rooms: 15 },
    search_session: 999001,
    search_code: "MOCK_SEARCH_001",
    groups: [
        {
            id: "17373",
            hid: "1001",
            hid_undeduplicated: "1001",
            code: "MOCK001",
            price: 850.00,
            cur: "EUR",
            refundable: "1",
            hotel_name: "Sunrise Grand Select Crystal Bay Resort",
            hotel_stars: 5,
            hotel_city: "Hurghada",
            hotel_country: "Egypt",
            hotel_image: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=80",
            hotel_description: "Luxury 5-star all-inclusive resort with private beach, infinity pools, and world-class spa.",
            cxl_policy: [
                { price: 0, description: "Free cancellation", from: "2026-01-04", until: "2026-02-01" },
            ],
            rooms: { "1": "2001" },
        },
        {
            id: "17374",
            hid: "1002",
            hid_undeduplicated: "1002",
            code: "MOCK002",
            price: 920.00,
            cur: "EUR",
            refundable: "1",
            hotel_name: "Steigenberger Aqua Magic",
            hotel_stars: 5,
            hotel_city: "Hurghada",
            hotel_country: "Egypt",
            hotel_image: "https://images.unsplash.com/photo-1582719508461-905c673771fd?w=800&q=80",
            hotel_description: "Family-friendly resort with incredible water park, aqua slides, and kids clubs.",
            cxl_policy: [
                { price: 0, description: "Free cancellation", from: "2026-01-04", until: "2026-02-01" },
            ],
            rooms: { "1": "2002" },
        },
        {
            id: "17375",
            hid: "1003",
            hid_undeduplicated: "1003",
            code: "MOCK003",
            price: 1150.00,
            cur: "EUR",
            refundable: "0",
            hotel_name: "Rixos Premium Seagate",
            hotel_stars: 5,
            hotel_city: "Sharm El Sheikh",
            hotel_country: "Egypt",
            hotel_image: "https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800&q=80",
            hotel_description: "Ultra all-inclusive beachfront resort with premium dining and exclusive spa experiences.",
            cxl_policy: [
                { price: 1150.00, description: "Non-refundable", from: "2026-01-04", until: "2026-02-15" },
            ],
            rooms: { "1": "2003" },
        },
    ],
    rooms: {
        "2001": { id: "2001", name: "Deluxe Room Sea View", meal: "All Inclusive", meal_code: "AI" },
        "2002": { id: "2002", name: "Family Room", meal: "All Inclusive", meal_code: "AI" },
        "2003": { id: "2003", name: "Premium Suite", meal: "Ultra All Inclusive", meal_code: "UAI" },
    },
};

const mockPackageDepartures = {
    status: true,
    code: 0,
    packageDepartures: {
        "BEG": {
            "HRG": {
                "2026-02-15": { price: "650.00", durations: ["7", "10", "14"] },
                "2026-02-22": { price: "680.00", durations: ["7", "10"] },
                "2026-03-01": { price: "720.00", durations: ["7"] },
            },
            "SSH": {
                "2026-02-15": { price: "700.00", durations: ["7", "10"] },
                "2026-03-01": { price: "750.00", durations: ["7"] },
            },
        },
    },
    departureAirports: {
        "BEG": {
            airportName: "Belgrade Nikola Tesla",
            airportCode: "BEG",
            cityName: "Belgrade",
            countryName: "Serbia",
        },
    },
    arrivalAirports: {
        "HRG": {
            airportName: "Hurghada International",
            airportCode: "HRG",
            cityName: "Hurghada",
            countryName: "Egypt",
        },
        "SSH": {
            airportName: "Sharm El Sheikh International",
            airportCode: "SSH",
            cityName: "Sharm El Sheikh",
            countryName: "Egypt",
        },
    },
};

// ============ Mock API Functions ============

export async function testConnection() {
    await mockDelay(300);
    console.log('🧪 Mock: Testing connection...');
    return mockResponse({ data: mockNationalities, responseToken: "mock-token-001" });
}

export async function getNationalities() {
    await mockDelay(400);
    console.log('🧪 Mock: Getting nationalities...');
    return mockResponse({ data: mockNationalities, responseToken: "mock-token-002" });
}

export async function getGeography() {
    await mockDelay(500);
    console.log('🧪 Mock: Getting geography...');
    return mockResponse({ data: mockGeography, responseToken: "mock-token-003" });
}

export async function getAirports() {
    await mockDelay(450);
    console.log('🧪 Mock: Getting airports...');
    return mockResponse({ data: mockAirports, responseToken: "mock-token-004" });
}

export async function getHotelCategories() {
    await mockDelay(300);
    console.log('🧪 Mock: Getting hotel categories...');
    return mockResponse({ data: mockHotelCategories, responseToken: "mock-token-005" });
}

export async function getHotelMealPlans() {
    await mockDelay(300);
    console.log('🧪 Mock: Getting meal plans...');
    return mockResponse({ data: mockMealPlans, responseToken: "mock-token-006" });
}

export async function getHotelInformation(params: any) {
    await mockDelay(600);
    console.log('🧪 Mock: Getting hotel information...', params);

    let filteredHotels = mockHotels;

    if (params.city) {
        filteredHotels = filteredHotels.filter(h =>
            h.city.toLowerCase().includes(params.city.toLowerCase())
        );
    }

    return mockResponse({
        status: true,
        count: filteredHotels.length,
        items: filteredHotels,
        responseToken: "mock-token-007",
    });
}

export async function searchHotelsSync(params: any) {
    await mockDelay(1500);
    console.log('🧪 Mock: Searching hotels (sync)...', params);

    const loc = (params.location || '').toLowerCase();
    let filteredGroups = [...mockSearchResults.groups];

    // If searching for Rodos/Rhodes, provide specific results
    if (loc.includes('rodos') || loc.includes('rhodes')) {
        filteredGroups = [
            {
                id: "18001",
                hid: "2001",
                hid_undeduplicated: "2001",
                code: "MOCK_RODOS_001",
                price: 1240.00,
                cur: "EUR",
                refundable: "1",
                hotel_name: "Mitsis Alila Resort & Spa",
                hotel_stars: 5,
                hotel_city: "Rhodes (Rodos)",
                hotel_country: "Greece",
                hotel_image: "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&q=80&w=800",
                hotel_description: "Ekskluzivni ultra all-inclusive resort na samoj plaži sa neverovatnim bazenima i uslugom.",
                cxl_policy: [
                    { price: 0, description: "Besplatno otkazivanje", from: "2026-01-04", until: "2026-06-01" },
                ],
                rooms: { "1": "3001" },
            },
            {
                id: "18002",
                hid: "2002",
                hid_undeduplicated: "2002",
                code: "MOCK_RODOS_002",
                price: 890.00,
                cur: "EUR",
                refundable: "1",
                hotel_name: "Sheraton Rhodes Resort",
                hotel_stars: 5,
                hotel_city: "Rhodes",
                hotel_country: "Greece",
                hotel_image: "https://images.unsplash.com/photo-1512918728675-ed5a9ecdebfd?auto=format&fit=crop&q=80&w=800",
                hotel_description: "Savršen porodični hotel sa pogledom na Egejsko more i vrhunskim sadržajima.",
                cxl_policy: [
                    { price: 0, description: "Besplatno otkazivanje", from: "2026-01-04", until: "2026-06-01" },
                ],
                rooms: { "1": "3002" },
            }
        ];
    } else if (loc.includes('milano') || loc.includes('milan')) {
        filteredGroups = [
            {
                id: "19001",
                hid: "3001",
                hid_undeduplicated: "3001",
                code: "MOCK_MILAN_001",
                price: 450.00,
                cur: "EUR",
                refundable: "1",
                hotel_name: "Hotel Spadari Al Duomo",
                hotel_stars: 4,
                hotel_city: "Milano",
                hotel_country: "Italy",
                hotel_image: "https://images.unsplash.com/photo-1541971875076-8f97cd827d06?auto=format&fit=crop&q=80&w=800",
                hotel_description: "Šarmantan butik hotel u samom srcu Milana, na par koraka od Duoma.",
                cxl_policy: [{ price: 0, description: "Besplatno otkazivanje", from: "2026-01-04", until: "2026-06-01" }],
                geoCodes: { lat: 45.4641, long: 9.1919 },
                rooms: { "1": "4001" },
            },
            {
                id: "19002",
                hid: "3002",
                hid_undeduplicated: "3002",
                code: "MOCK_MILAN_002",
                price: 780.00,
                cur: "EUR",
                refundable: "1",
                hotel_name: "Excelsior Hotel Gallia",
                hotel_stars: 5,
                hotel_city: "Milano",
                hotel_country: "Italy",
                hotel_image: "https://images.unsplash.com/photo-1551882547-ff43c61f3630?auto=format&fit=crop&q=80&w=800",
                hotel_description: "Legendarni luksuzni hotel koji spaja italijanski dizajn i vrhunsku uslugu.",
                cxl_policy: [{ price: 0, description: "Besplatno otkazivanje", from: "2026-01-04", until: "2026-06-01" }],
                geoCodes: { lat: 45.4849, long: 9.2036 },
                rooms: { "1": "4002" },
            }
        ];
    } else if (loc.includes('pariz') || loc.includes('paris')) {
        filteredGroups = [
            {
                id: "20001",
                hid: "4001",
                hid_undeduplicated: "4001",
                code: "MOCK_PARIS_001",
                price: 520.00,
                cur: "EUR",
                refundable: "1",
                hotel_name: "Hôtel Plaza Athénée",
                hotel_stars: 5,
                hotel_city: "Paris",
                hotel_country: "France",
                hotel_image: "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&q=80&w=800",
                hotel_description: "Ikonični hotel na Aveniji Montenj, sinonim za pariski luksuz i stil.",
                cxl_policy: [{ price: 0, description: "Besplatno otkazivanje", from: "2026-01-04", until: "2026-06-01" }],
                geoCodes: { lat: 48.8661, long: 2.3023 },
                rooms: { "1": "5001" },
            },
            {
                id: "20002",
                hid: "4002",
                hid_undeduplicated: "4002",
                code: "MOCK_PARIS_002",
                price: 290.00,
                cur: "EUR",
                refundable: "1",
                hotel_name: "Le Meurice",
                hotel_stars: 5,
                hotel_city: "Paris",
                hotel_country: "France",
                hotel_image: "https://images.unsplash.com/photo-1499856871958-5b9627545d1a?auto=format&fit=crop&q=80&w=800",
                hotel_description: "Hotel u kojem se umetnost susreće sa luksuzom, sa pogledom na vrt Tuileries.",
                cxl_policy: [{ price: 0, description: "Besplatno otkazivanje", from: "2026-01-04", until: "2026-06-01" }],
                geoCodes: { lat: 48.8650, long: 2.3283 },
                rooms: { "1": "5002" },
            }
        ];
    } else if (loc && !loc.includes('hurghada') && !loc.includes('hurgada') && !loc.includes('sharm')) {
        // For other locations, provide a variety or just keep Hurghada for demo
        // For Rodos search specifically, we handled above.
    }

    return mockResponse({
        ...mockSearchResults,
        groups: filteredGroups,
        audit: { hotels: filteredGroups.length, solutions: filteredGroups.length * 5, rooms: filteredGroups.length * 2 }
    });
}

export async function searchHotels(params: any) {
    await mockDelay(800);
    console.log('🧪 Mock: Initiating hotel search...', params);
    return mockResponse({
        status: true,
        message: "Search started",
        search_session: 999001,
        search_code: "MOCK_SEARCH_001",
        responseToken: "mock-token-008",
    });
}

export async function getHotelResults(params: any) {
    await mockDelay(1000);
    console.log('🧪 Mock: Getting hotel results...', params);
    return mockResponse(mockSearchResults);
}

export async function getHotelValuation(params: any) {
    await mockDelay(700);
    console.log('🧪 Mock: Getting hotel valuation...', params);

    const group = mockSearchResults.groups.find(g => g.id === params.id);

    return mockResponse({
        status: true,
        error_code: 0,
        cxl_policy: group?.cxl_policy || [],
        solution_price: group?.price || 0,
        currency: group?.cur || "EUR",
        responseToken: "mock-token-009",
    });
}

export async function getHotelDetails(params: any) {
    await mockDelay(600);
    console.log('🧪 Mock: Getting hotel details...', params);

    const hotel = mockHotels.find(h => h.id === params.hid_undeduplicated);

    return mockResponse({
        status: true,
        hotel: hotel ? [hotel] : [],
        hotelImages: hotel?.photos || [],
        responseToken: "mock-token-010",
    });
}

export async function bookHotel(params: any) {
    await mockDelay(1200);
    console.log('🧪 Mock: Booking hotel...', params);
    return mockResponse({
        status: true,
        error_code: 0,
        code: `MOCK_BOOKING_${Date.now()}`,
        message: "The rooms have been booked (MOCK)",
        responseToken: "mock-token-011",
    });
}

export async function getBookingDetails(params: any) {
    await mockDelay(500);
    console.log('🧪 Mock: Getting booking details...', params);
    return mockResponse({
        status: true,
        code: params.code,
        hotel_name: "Sunrise Grand Select Crystal Bay Resort",
        price: "850.00",
        currency: "EUR",
        responseToken: "mock-token-012",
    });
}

export async function cancelBooking(code: string) {
    await mockDelay(800);
    console.log('🧪 Mock: Cancelling booking...', code);
    return mockResponse({
        status: true,
        message: "The booking has been cancelled (MOCK)",
        responseToken: "mock-token-013",
    });
}

export async function getPackageDepartures(query: string = 'all') {
    await mockDelay(700);
    console.log('🧪 Mock: Getting package departures...', query);
    return mockResponse(mockPackageDepartures);
}

// ============ Export Mock API ============

// Mock config (always configured in mock mode)
const mockConfig = {
    baseUrl: 'https://imc-dev.tct.travel (MOCK)',
    username: 'mock-user',
    password: '***MOCK***',
    apiSource: 'B2B',
};

const isConfigured = () => true; // Mock is always "configured"

export const tctMockApi = {
    // Configuration
    config: mockConfig,
    isConfigured,

    // API Functions
    testConnection,
    getNationalities,
    getGeography,
    getAirports,
    getHotelCategories,
    getHotelMealPlans,
    getHotelInformation,
    searchHotelsSync,
    searchHotels,
    getHotelResults,
    getHotelValuation,
    getHotelDetails,
    bookHotel,
    getBookingDetails,
    cancelBooking,
    getPackageDepartures,
};

export default tctMockApi;
