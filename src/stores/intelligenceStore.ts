import { create } from 'zustand';

export interface MarketTrigger {
    id: string;
    type: 'weather' | 'politics' | 'economy' | 'search_trend';
    severity: 'low' | 'medium' | 'high';
    label: string;
    description: string;
    action: string;
    isActive: boolean;
}

export interface IntelligenceState {
    // Current environmental context
    weatherContext: {
        temp: number;
        condition: string;
        location: string;
        isExtreme: boolean;
    };

    marketSentiment: {
        riskLevel: 'safe' | 'caution' | 'high_risk';
        trendingKeywords: string[];
        economicTone: 'bullish' | 'bearish' | 'neutral';
    };

    behaviorContext: {
        viewedDestinations: Record<string, number>;
        lastViewed: string | null;
        userIntent: 'ski' | 'tropical' | 'city' | 'unknown';
    };

    // Active reflexes (The "Meka Zona")
    activeTriggers: MarketTrigger[];

    // Actions
    updateWeather: (weather: IntelligenceState['weatherContext']) => void;
    updateSentiment: (sentiment: Partial<IntelligenceState['marketSentiment']>) => void;
    trackDestinationView: (destination: string) => void;
    setUserIntent: (intent: 'ski' | 'tropical' | 'city' | 'unknown') => void;
    addTrigger: (trigger: MarketTrigger) => void;
    removeTrigger: (id: string) => void;
    clearTriggers: () => void;
}

export const useIntelligenceStore = create<IntelligenceState>((set) => ({
    weatherContext: {
        temp: 22,
        condition: 'Clear',
        location: 'Belgrade',
        isExtreme: false,
    },

    marketSentiment: {
        riskLevel: 'safe',
        trendingKeywords: [],
        economicTone: 'neutral',
    },

    behaviorContext: {
        viewedDestinations: {},
        lastViewed: null,
        userIntent: 'unknown',
    },

    activeTriggers: [],

    updateWeather: (weather) => set({ weatherContext: weather }),

    updateSentiment: (sentiment) => set((state) => ({
        marketSentiment: { ...state.marketSentiment, ...sentiment }
    })),

    trackDestinationView: (destination) => set((state) => {
        const count = (state.behaviorContext.viewedDestinations[destination] || 0) + 1;
        return {
            behaviorContext: {
                ...state.behaviorContext,
                viewedDestinations: {
                    ...state.behaviorContext.viewedDestinations,
                    [destination]: count
                },
                lastViewed: destination
            }
        };
    }),

    setUserIntent: (intent) => set((state) => ({
        behaviorContext: { ...state.behaviorContext, userIntent: intent }
    })),

    addTrigger: (trigger) => set((state) => ({
        activeTriggers: [
            ...state.activeTriggers.filter(t => t.id !== trigger.id),
            trigger
        ]
    })),

    removeTrigger: (id) => set((state) => ({
        activeTriggers: state.activeTriggers.filter(t => t.id !== id)
    })),

    clearTriggers: () => set({ activeTriggers: [] }),
}));
