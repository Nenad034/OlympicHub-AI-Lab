import { useState, useCallback, useMemo } from 'react';
import { performSmartSearch, type SmartSearchResult } from '../../../services/smartSearchService';
import type { Destination, SearchQuery } from '../../../types/hotel';

interface UseHotelSearchProps {
    onSearchComplete?: (results: SmartSearchResult[], key: string) => void;
}

export function useHotelSearch({ onSearchComplete }: UseHotelSearchProps = {}) {
    const [searchState, setSearchState] = useState({
        isSearching: false,
        rawSearchResults: [] as SmartSearchResult[],
        searchPerformed: false,
        searchError: null as string | null,
        lastQuery: null as SearchQuery | null,
    });

    // searchResults is derived directly from useMemo
    const searchResults = useMemo(() => {
        const { rawSearchResults, lastQuery } = searchState;

        if (!lastQuery?.budgetFrom && !lastQuery?.budgetTo) {
            return rawSearchResults;
        }

        const bFrom = lastQuery.budgetFrom || 0;
        const bTo = lastQuery.budgetTo || 9999999;

        return rawSearchResults.filter(r => {
            const totalTravelers = lastQuery.rooms.reduce((acc, room) => acc + room.adults + room.children, 0);
            const cmpValue = lastQuery.budgetType === 'total' ? r.price : r.price / totalTravelers;
            return cmpValue >= bFrom && cmpValue <= bTo;
        });
    }, [searchState.rawSearchResults, searchState.lastQuery]);

    const handleSearch = useCallback(async (query: SearchQuery) => {
        if (!query.destinations || query.destinations.length === 0) {
            setSearchState(s => ({ ...s, searchError: 'Molimo izaberite destinaciju.' }));
            return;
        }

        setSearchState(s => ({ ...s, isSearching: true, searchError: null }));

        try {
            const rawResults = await performSmartSearch({
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
                mealPlan: query.mealPlan || 'all',
                budgetFrom: query.budgetFrom,
                budgetTo: query.budgetTo,
                budgetType: query.budgetType,
            });

            // Synchronous filtering calculation for immediate onSearchComplete callback compatibility
            let filteredResultsForCallback = rawResults;
            if (query.budgetFrom || query.budgetTo) {
                const bFrom = query.budgetFrom || 0;
                const bTo = query.budgetTo || 9999999;

                filteredResultsForCallback = rawResults.filter(r => {
                    const totalTravelers = query.rooms.reduce((acc, room) => acc + room.adults + room.children, 0);
                    const cmpValue = query.budgetType === 'total' ? r.price : r.price / totalTravelers;
                    return cmpValue >= bFrom && cmpValue <= bTo;
                });
            }
            
            setSearchState(s => ({
                ...s,
                rawSearchResults: rawResults,
                searchPerformed: true,
                lastQuery: query,
            }));

            const searchKey = `${query.destinations.map(d => d.id).join('-')}-${query.checkIn}-${query.checkOut}`;
            if (onSearchComplete) {
                onSearchComplete(filteredResultsForCallback, searchKey);
            }

            return rawResults;

        } catch (error: any) {
            console.error('SmartSearch Error:', error);
            setSearchState(s => ({ ...s, searchError: error.message || 'Došlo je do greške prilikom pretrage hotela.' }));
            return [];
        } finally {
            // Fix 1: Ensure isSearching is false on all exit paths
            setSearchState(s => ({ ...s, isSearching: false }));
        }
    }, [onSearchComplete]);

    return {
        isSearching: searchState.isSearching,
        searchResults: searchResults, // Fix 2: Directly from useMemo
        searchPerformed: searchState.searchPerformed,
        searchError: searchState.searchError,
        handleSearch
    };
}
