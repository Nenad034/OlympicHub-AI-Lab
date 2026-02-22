export interface HotelService {
    id: string;
    code: string;
    name: string;
    description?: string;
}

export const HOTEL_SERVICES: HotelService[] = [
    { id: 'ro', code: 'RO', name: 'Samo noćenje (Room Only)' },
    { id: 'rent', code: 'Rent', name: 'Najam (Rent)' },
    { id: 'bb', code: 'BB', name: 'Noćenje i doručak (Bed & Breakfast)' },
    { id: 'hb', code: 'HB', name: 'Polupansion (Half Board)' },
    { id: 'fb', code: 'FB', name: 'Pun Pansion (Full Board)' },
    { id: 'all', code: 'All', name: 'All Inclusive' },
    { id: 'all_light', code: 'AllL', name: 'All Inclusive Light' },
    { id: 'all_ultra', code: 'AllU', name: 'All Inclusive Ultra' },
];
