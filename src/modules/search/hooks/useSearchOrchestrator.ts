import { useState, useCallback } from 'react';
import type { ModernSearchState, SearchType, Destination, RoomConfig } from '../types/search.types';

export const useSearchOrchestrator = () => {
  const [state, setState] = useState<ModernSearchState>({
    type: 'hotel',
    query: '',
    destination: null,
    dates: { from: '', to: '', nights: 1 },
    pax: [{ adults: 2, children: 0, childrenAges: [] }],
    accommodationType: [],
    includeFlights: false,
    includeTransfers: false,
    status: 'idle',
  });

  const updateType = (type: SearchType) => {
    setState(prev => ({ ...prev, type }));
  };

  const processQuery = useCallback(async (query: string) => {
    // This is where the AI logic would live
    // Parsing "7 days in Greece for 2 people with flight"
    console.log("AI Parsing Query:", query);
    
    // Mock parsing result:
    if (query.toLowerCase().includes('let') || query.toLowerCase().includes('avion')) {
      setState(prev => ({ ...prev, type: 'package', includeFlights: true }));
    }
  }, []);

  const setDestination = (destination: Destination) => {
    setState(prev => ({ ...prev, destination }));
  };

  const setDates = (from: string, to: string, nights: number) => {
    setState(prev => ({ ...prev, dates: { from, to, nights } }));
  };

  const startSearch = async () => {
    setState(prev => ({ ...prev, status: 'searching' }));
    // Simulate API delay
    await new Promise(r => setTimeout(r, 1500));
    setState(prev => ({ ...prev, status: 'results' }));
  };

  return {
    state,
    updateType,
    processQuery,
    setDestination,
    setDates,
    startSearch,
    setState
  };
};
