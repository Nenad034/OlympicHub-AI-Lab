/**
 * Ski Resort Live Data Types
 */

export interface SkiResort {
    id: string;
    name: string;
    country: string;
    region: string;
    status: 'open' | 'closed' | 'scheduled';
    lastUpdated: string;
    localizedName?: string;

    // Snow Report
    snowReport: {
        summitDepth: number; // cm
        baseDepth: number;   // cm
        newSnow24h: number;  // cm
        newSnow48h: number;  // cm
        lastSnowfallDate: string;
        snowCondition: string; // e.g., "Powder", "Packed Powder", "Hard"
    };

    // Mountain Status
    mountainStatus: {
        liftsTotal: number;
        liftsOpen: number;
        trailsTotal: number;
        trailsOpen: number;
        nightSkiing: boolean;
        snowMaking: boolean;

        // Detailed OpenSkiMap Stats
        stats?: {
            runs: {
                totalCount: number;
                totalLengthKm: number;
                byDifficulty: {
                    [key: string]: {
                        count: number;
                        lengthKm: number;
                    };
                };
            };
            lifts: {
                totalCount: number;
                byType: {
                    [key: string]: {
                        count: number;
                    };
                };
            };
        };
    };

    // Weather by Elevation
    weather: {
        summit: ElevationWeather;
        mid: ElevationWeather;
        base: ElevationWeather;
    };

    // Activities from OpenSkiMap
    activities?: string[];

    // Coordinates
    location: {
        lat: number;
        lng: number;
    };
    mapImageUrl?: string;
    websiteUrl?: string;
    description?: string;
    gallery?: string[];
    keyHighlights?: string[];
    skiPassPrices?: {
        seasons: {
            name: string;
            dates: string;
            prices: {
                duration: string;
                adult: { price: number; label: string };
                youth: { price: number; label: string };
                child: { price: number; label: string };
            }[];
        }[];
    };
}

export interface ElevationWeather {
    temp: number;      // Celsius
    feelsLike: number;
    windSpeed: number; // km/h
    windDir: string;
    conditions: string; // e.g., "Sunny", "Snowing", "Fog"
    visibility: number; // meters
}

export interface SkiSearchResponse {
    resorts: SkiResort[];
}
