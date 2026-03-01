import type { SkiResort, SkiSearchResponse } from '../types/skiTypes';

class SkiApiService {
    private static instance: SkiApiService;

    private constructor() { }

    public static getInstance(): SkiApiService {
        if (!SkiApiService.instance) {
            SkiApiService.instance = new SkiApiService();
        }
        return SkiApiService.instance;
    }

    /**
     * Pretraga ski centara i live stanja
     */
    public async searchResorts(query: string = ''): Promise<SkiSearchResponse> {
        console.log(`❄️ [SkiAPI] Fetching live data for: ${query || 'All major centers'}`);

        // Simuacija kašnjenja mreže
        await new Promise(resolve => setTimeout(resolve, 1000));

        const mockResorts: SkiResort[] = [
            {
                id: 'kopaonik',
                name: 'Kopaonik',
                country: 'Serbia',
                region: 'Central Serbia',
                status: 'open',
                lastUpdated: new Date().toISOString(),
                snowReport: {
                    summitDepth: 120,
                    baseDepth: 45,
                    newSnow24h: 15,
                    newSnow48h: 22,
                    lastSnowfallDate: '2026-03-01',
                    snowCondition: 'Powder'
                },
                mountainStatus: {
                    liftsTotal: 25,
                    liftsOpen: 24,
                    trailsTotal: 36,
                    trailsOpen: 34,
                    nightSkiing: true,
                    snowMaking: true
                },
                weather: {
                    summit: { temp: -8, feelsLike: -14, windSpeed: 35, windDir: 'NW', conditions: 'Light Snow', visibility: 800 },
                    mid: { temp: -5, feelsLike: -9, windSpeed: 20, windDir: 'NW', conditions: 'Cloudy', visibility: 2000 },
                    base: { temp: -2, feelsLike: -4, windSpeed: 10, windDir: 'W', conditions: 'Cloudy', visibility: 5000 }
                },
                location: { lat: 43.2858, lng: 20.8122 }
            },
            {
                id: 'bansko',
                name: 'Bansko',
                country: 'Bulgaria',
                region: 'Pirin Mountain',
                status: 'open',
                lastUpdated: new Date().toISOString(),
                snowReport: {
                    summitDepth: 180,
                    baseDepth: 60,
                    newSnow24h: 5,
                    newSnow48h: 5,
                    lastSnowfallDate: '2026-02-27',
                    snowCondition: 'Packed Powder'
                },
                mountainStatus: {
                    liftsTotal: 14,
                    liftsOpen: 12,
                    trailsTotal: 18,
                    trailsOpen: 15,
                    nightSkiing: true,
                    snowMaking: true
                },
                weather: {
                    summit: { temp: -6, feelsLike: -10, windSpeed: 25, windDir: 'N', conditions: 'Clear', visibility: 10000 },
                    mid: { temp: -3, feelsLike: -5, windSpeed: 15, windDir: 'N', conditions: 'Clear', visibility: 10000 },
                    base: { temp: 1, feelsLike: 0, windSpeed: 5, windDir: 'NW', conditions: 'Sunny', visibility: 15000 }
                },
                location: { lat: 41.8333, lng: 23.4833 }
            },
            {
                id: 'valthorens',
                name: 'Val Thorens',
                country: 'France',
                region: 'Les Trois Vallées',
                status: 'open',
                lastUpdated: new Date().toISOString(),
                snowReport: {
                    summitDepth: 320,
                    baseDepth: 180,
                    newSnow24h: 40,
                    newSnow48h: 65,
                    lastSnowfallDate: '2026-03-01',
                    snowCondition: 'Fresh Powder'
                },
                mountainStatus: {
                    liftsTotal: 31,
                    liftsOpen: 22, // some closed due to wind/snow
                    trailsTotal: 88,
                    trailsOpen: 65,
                    nightSkiing: false,
                    snowMaking: true
                },
                weather: {
                    summit: { temp: -15, feelsLike: -25, windSpeed: 65, windDir: 'SW', conditions: 'Heavy Snow', visibility: 200 },
                    mid: { temp: -10, feelsLike: -18, windSpeed: 40, windDir: 'SW', conditions: 'Snow', visibility: 500 },
                    base: { temp: -7, feelsLike: -12, windSpeed: 20, windDir: 'S', conditions: 'Snow', visibility: 1000 }
                },
                location: { lat: 45.2980, lng: 6.5800 }
            }
        ];

        const filtered = query
            ? mockResorts.filter(r => r.name.toLowerCase().includes(query.toLowerCase()) || r.country.toLowerCase().includes(query.toLowerCase()))
            : mockResorts;

        return { resorts: filtered };
    }
}

export const skiApiService = SkiApiService.getInstance();
export default skiApiService;
