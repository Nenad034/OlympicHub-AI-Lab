export interface HotelRoom {
    id: string;
    name: string;
    description?: string;
    price: number;
    currency: string;
    mealPlan?: string;
    mealPlanName?: string;
    availability: 'available' | 'on_request' | 'unavailable';
    maxAdults: number;
    maxChildren: number;
    images?: string[];
    cancellationPolicyRequestParams?: any;
    tariff?: { id: number; name?: string };
    providerRoomId?: string;
    originalData?: any;
}

export interface HotelSearchResult {
    id: string;
    provider: string;
    type: 'hotel';
    name: string;
    location: string;
    country?: string;
    stars?: number;
    price: number;
    currency: string;
    images: string[];
    description?: string;
    mealPlan?: string;
    mealPlans: string[];
    availability: 'available' | 'on_request' | 'unavailable';
    rooms?: HotelRoom[];
    allocationResults?: Record<number, HotelRoom[]>;
    salesCount?: number;
    originalData?: any;
}

export interface Destination {
    id: string;
    name: string;
    type: 'destination' | 'hotel' | 'country';
    country?: string;
    stars?: number;
    provider?: string;
}

export interface RoomAllocation {
    adults: number;
    children: number;
    childrenAges: number[];
}

export interface SearchQuery {
    destinations: Destination[];
    checkIn: string;
    checkOut: string;
    rooms: RoomAllocation[];
    flexibleDays?: number;
    budgetType?: 'total' | 'person';
    budgetFrom?: number;
    budgetTo?: number;
    nationality?: string;
    mealPlan?: string;
}
