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
    };

    // Weather by Elevation
    weather: {
        summit: ElevationWeather;
        mid: ElevationWeather;
        base: ElevationWeather;
    };

    // Coordinates
    location: {
        lat: number;
        lng: number;
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
