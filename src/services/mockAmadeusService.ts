/**
 * Mock Amadeus Service for Testing
 * Provides realistic flight and dynamic package data
 */

export const mockFlights = [
  {
    id: 'fl-mock-1',
    provider: 'Amadeus',
    type: 'flight',
    name: 'JU 540 • Air Serbia',
    location: 'BEG (Beograd) → HRG (Hurgada)',
    price: 345,
    currency: 'EUR',
    data: {
      airline: 'Air Serbia',
      flightNumber: 'JU 540',
      departure: '06:30',
      arrival: '10:15',
      duration: '3h 45m',
      cabin: 'Economy'
    }
  },
  {
    id: 'fl-mock-2',
    provider: 'Amadeus',
    type: 'flight',
    name: 'TK 1082 • Turkish Airlines',
    location: 'BEG (Beograd) → AYT (Antalija)',
    price: 289,
    currency: 'EUR',
    data: {
      airline: 'Turkish Airlines',
      flightNumber: 'TK 1082',
      departure: '09:15',
      arrival: '12:45',
      duration: '2h 30m',
      cabin: 'Economy'
    }
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
    data: {
        hotelName: 'Steigenberger AL DAU Beach',
        flightInfo: 'JU 540 Air Serbia',
        nights: 7,
        mealPlan: 'All Inclusive',
        transferIncluded: true
    }
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
    data: {
        hotelName: 'Zornitsa Sands',
        flightInfo: 'JU 930 Air Serbia',
        nights: 10,
        mealPlan: 'Ultra All Inclusive',
        transferIncluded: true
    }
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
