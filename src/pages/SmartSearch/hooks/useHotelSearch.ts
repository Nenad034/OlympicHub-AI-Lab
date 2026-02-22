import { useState, useCallback } from 'react';
import { performSmartSearch, type SmartSearchResult } from '../../../services/smartSearchService';
import type { Destination, RoomAllocation, SearchQuery } from '../../../types/hotel';

interface UseHotelSearchProps {
    onSearchComplete?: (results: SmartSearchResult[], key: string) => void;
}

export function useHotelSearch({ onSearchComplete }: UseHotelSearchProps = {}) {
    const [isSearching, setIsSearching] = useState(false);
    const [searchResults, setSearchResults] = useState<SmartSearchResult[]>([]);
    const [searchPerformed, setSearchPerformed] = useState(false);
    const [searchError, setSearchError] = useState<string | null>(null);

    const handleSearch = useCallback(async (query: SearchQuery) => {
        if (!query.destinations || query.destinations.length === 0) {
            setSearchError('Molimo izaberite destinaciju.');
            return;
        }

        setIsSearching(true);
        setSearchError(null);
        setSearchResults([]);

        try {
            const results = await performSmartSearch({
                searchType: 'hotel',
                destinations: query.destinations.map(d => ({
                    id: d.id,
                    name: d.name,
                    type: d.type as any,
                    country: d.country,
                    provider: d.provider
                })),
                checkIn: query.checkIn,
                checkOut: query.checkOut,
                rooms: query.rooms.map(r => ({
                    adults: r.adults,
                    children: r.children,
                    childrenAges: r.childrenAges
                })),
                nationality: query.nationality || 'RS',
                mealPlan: query.mealPlan || 'all'
            });

            // Handle budget filtering if set
            let filteredResults = results;
            if (query.budgetFrom || query.budgetTo) {
                const bFrom = query.budgetFrom || 0;
                const bTo = query.budgetTo || 9999999;

                filteredResults = results.filter(r => {
                    const totalTravelers = query.rooms.reduce((acc, room) => acc + room.adults + room.children, 0);
                    const cmpValue = query.budgetType === 'total' ? r.price : r.price / totalTravelers;
                    return cmpValue >= bFrom && cmpValue <= bTo;
                });
            }

            setSearchResults(filteredResults);
            setSearchPerformed(true);

            const searchKey = `${query.destinations.map(d => d.id).join('-')}-${query.checkIn}-${query.checkOut}`;
            if (onSearchComplete) {
                onSearchComplete(filteredResults, searchKey);
            }

            return filteredResults;

        } catch (error: any) {
            console.error('SmartSearch Error:', error);
            setSearchError(error.message || 'Došlo je do greške prilikom pretrage hotela.');
            return [];
        } finally {
            setIsSearching(false);
        }
    }, [onSearchComplete]);

    return {
        isSearching,
        searchResults,
        searchPerformed,
        searchError,
        handleSearch
    };
}
