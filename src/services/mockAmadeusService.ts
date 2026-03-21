/**
 * Mock Amadeus Service for Testing
 * Provides realistic flight and dynamic package data
 */

export const mockFlights = [
  {
    id: 'fl-mock-1',
    provider: 'Air Serbia',
    type: 'flight',
    name: 'JU 540 • Air Serbia',
    location: 'BEG (Beograd) → HRG (Hurgada)',
    price: 345,
    currency: 'EUR',
    data: { airline: 'Air Serbia', flightNumber: 'JU 540', departure: '06:30', arrival: '10:15', duration: '3h 45m', cabin: 'Economy' }
  },
  {
    id: 'fl-mock-2',
    provider: 'Turkish Airlines',
    type: 'flight',
    name: 'TK 1082 • Turkish Airlines',
    location: 'BEG (Beograd) → AYT (Antalija)',
    price: 289,
    currency: 'EUR',
    data: { airline: 'Turkish Airlines', flightNumber: 'TK 1082', departure: '09:15', arrival: '12:45', duration: '2h 30m', cabin: 'Economy' }
  },
  {
    id: 'fl-mock-3',
    provider: 'Lufthansa',
    type: 'flight',
    name: 'LH 1411 • Lufthansa',
    location: 'BEG (Beograd) → FRA (Frankfurt)',
    price: 210,
    currency: 'EUR',
    data: { airline: 'Lufthansa', flightNumber: 'LH 1411', departure: '13:45', arrival: '15:35', duration: '1h 50m', cabin: 'Economy' }
  },
  {
    id: 'fl-mock-4',
    provider: 'Austrian',
    type: 'flight',
    name: 'OS 738 • Austrian Airlines',
    location: 'BEG (Beograd) → VIE (Beč)',
    price: 155,
    currency: 'EUR',
    data: { airline: 'Austrian Airlines', flightNumber: 'OS 738', departure: '18:20', arrival: '19:35', duration: '1h 15m', cabin: 'Economy' }
  },
  {
    id: 'fl-mock-5',
    provider: 'Qatar Airways',
    type: 'flight',
    name: 'QR 232 • Qatar Airways',
    location: 'BEG (Beograd) → DOH (Doha)',
    price: 560,
    currency: 'EUR',
    data: { airline: 'Qatar Airways', flightNumber: 'QR 232', departure: '12:05', arrival: '18:15', duration: '5h 10m', cabin: 'Economy' }
  }
];

export const mockDynamicPackages = [
  {
    id: 'pkg-mock-1',
    provider: 'Amadeus + Solvex',
    type: 'package',
    name: 'Steigenberger AL DAU Beach (Paket)',
    location: 'Hurgada, Egipat',
    price: 890,
    currency: 'EUR',
    stars: 5,
    mealPlan: 'All Inclusive',
    data: { hotelName: 'Steigenberger AL DAU Beach', flightInfo: 'JU 540 Air Serbia', nights: 7, mealPlan: 'All Inclusive', transferIncluded: true }
  },
  {
    id: 'pkg-mock-2',
    provider: 'Amadeus + Solvex',
    type: 'package',
    name: 'Zornitsa Sands (Dinamika)',
    location: 'Sveti Vlas, Bugarska',
    price: 540,
    currency: 'EUR',
    stars: 5,
    mealPlan: 'Ultra All Inclusive',
    data: { hotelName: 'Zornitsa Sands', flightInfo: 'JU 930 Air Serbia', nights: 10, mealPlan: 'Ultra All Inclusive', transferIncluded: true }
  },
  {
    id: 'pkg-mock-3',
    provider: 'Amadeus + Solvex',
    type: 'package',
    name: 'Hotel Mitsis Laguna Resort (Paket)',
    location: 'Hersonissos, Krit',
    price: 1250,
    currency: 'EUR',
    stars: 5,
    mealPlan: 'Ultra All Inclusive',
    data: { hotelName: 'Mitsis Laguna Resort', flightInfo: 'A3 981 Aegean', nights: 7, mealPlan: 'Ultra All Inclusive', transferIncluded: true }
  },
  {
    id: 'pkg-mock-4',
    provider: 'Amadeus + Solvex',
    type: 'package',
    name: 'Rixos Premium Tekirova (Dinamika)',
    location: 'Kemer, Turska',
    price: 1420,
    currency: 'EUR',
    stars: 5,
    mealPlan: 'All Inclusive',
    data: { hotelName: 'Rixos Premium Tekirova', flightInfo: 'TK 1082 Turkish', nights: 14, mealPlan: 'All Inclusive', transferIncluded: true }
  },
  {
    id: 'pkg-mock-5',
    provider: 'Amadeus + Solvex',
    type: 'package',
    name: 'Hilton Dubai Jumeirah (Paket)',
    location: 'Dubai, UAE',
    price: 1850,
    currency: 'EUR',
    stars: 5,
    mealPlan: 'Half Board',
    data: { hotelName: 'Hilton Dubai Jumeirah', flightInfo: 'QR 232 Qatar', nights: 5, mealPlan: 'Half Board', transferIncluded: false }
  }
];

export async function getMockFlightResults(params: any) {
    console.log("[MockAmadeus] Fetching flight results for:", params);
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    return mockFlights;
}

export async function getMockPackageResults(params: any) {
    console.log("[MockAmadeus] Fetching dynamic packages for:", params);
    await new Promise(resolve => setTimeout(resolve, 2000));
    return mockDynamicPackages;
}
