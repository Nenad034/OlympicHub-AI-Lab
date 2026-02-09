export interface TravelerCount {
    adults: number;
    children: number;
    childrenAges?: number[];
}

export interface DestinationInput {
    id: string;
    city: string;
    country: string;
    countryCode: string;
    airportCode: string;
    checkIn: string;  // ISO date
    checkOut: string; // ISO date
    nights: number;
    travelers: TravelerCount;
    category?: string[]; // e.g. ["5 Zvezdica", "4 Zvezdice"]
    service?: string[];  // e.g. ["All Inclusive"]
    flexibleDays?: number;
    includedGuide?: {
        title: string;
        desc: string;
        tip: string;
        image: string;
    };
}

export interface BasicInfoData {
    destinations: DestinationInput[];
    travelers: TravelerCount;
    budget?: number;
    currency: string;
    startDate: string;
    endDate: string;
    totalDays: number;
}
