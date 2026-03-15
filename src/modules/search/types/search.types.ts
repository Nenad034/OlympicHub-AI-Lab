export type SearchType = 'hotel' | 'flight' | 'package';

export interface Destination {
  id: string;
  name: string;
  country: string;
  type: 'city' | 'hotel' | 'airport' | 'region';
}

export interface RoomConfig {
  adults: number;
  children: number;
  childrenAges: number[];
}

export interface ModernSearchState {
  type: SearchType;
  query: string;
  destination: Destination | null;
  dates: {
    from: string;
    to: string;
    nights: number;
  };
  pax: RoomConfig[];
  accommodationType: string[];
  includeFlights: boolean;
  includeTransfers: boolean;
  status: 'idle' | 'searching' | 'results' | 'booking';
}

export interface SearchResult {
  id: string;
  name: string;
  location: string;
  stars: number;
  price: number;
  image: string;
  provider: string;
  rating: number;
  category: string;
  tags: string[];
}
