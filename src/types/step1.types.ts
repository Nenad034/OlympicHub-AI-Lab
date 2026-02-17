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
    roomAllocations?: TravelerCount[];
    category?: string[]; // e.g. ["5 Zvezdica", "4 Zvezdice"]
    service?: string[];  // e.g. ["All Inclusive"]
    flexibleDays?: number;
    includedGuide?: {
        title: string;
        desc: string;
        tip: string;
        image: string;
    };
    type?: 'destination' | 'hotel';
}

export interface BasicInfoData {
    destinations: DestinationInput[];
    travelers: TravelerCount;
    roomAllocations?: TravelerCount[];
    budget?: number;
    budgetFrom?: number;
    budgetTo?: number;
    budgetType?: 'person' | 'total';
    nationality?: string;
    currency: string;
    startDate: string;
    endDate: string;
    totalDays: number;
}
