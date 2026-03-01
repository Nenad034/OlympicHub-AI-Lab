import type { GiataMulticodesRequest, GiataMulticodesResponse, GiataDriveRequest, GiataDriveResponse, GiataMatchResult } from '../types/giataTypes';

export class GiataApiService {
    private apiKey: string | null;

    constructor() {
        this.apiKey = import.meta.env.VITE_GIATA_API_KEY || null;
    }

    /**
     * MOCK: Simulated Multicodes Matching API Call
     * Normalno bismo gađali: https://multicodes.giatamedia.com/webservice/rest/1.0/properties/
     */
    async mapProviderCode(provider: string, providerCode: string): Promise<GiataMatchResult | null> {
        console.log(`[GIATA Multicodes] Tražim mapiranje za dobavljača: ${provider}, kod: ${providerCode}`);

        if (!this.apiKey) {
            console.warn('[GIATA Multicodes] Nema API ključa, koristim MOCK podatke.');
        }

        // Simulacija mrežnog kašnjenja (npr. latencija u pretrazi baze)
        await new Promise(resolve => setTimeout(resolve, 350));

        // Mock podaci - U realnosti ovde pravimo HTTP GET/POST zahtev sa Bearer tokenom (API Key)
        if (providerCode === '123' || providerCode === 'hotel123' || providerCode.includes('test')) {
            return {
                giataId: 101234,
                name: 'Grifid Noa',
                destination: 'Golden Sands',
                country: 'Bulgaria',
                confidence: 99.8
            };
        }

        if (providerCode === '456') {
            return {
                giataId: 215432,
                name: 'Acropolis View Hotel',
                destination: 'Athens',
                country: 'Greece',
                confidence: 98.5
            };
        }

        return null; // Nije pronađeno
    }

    /**
     * MOCK: Simulated Drive Content API Call
     * Normalno bismo gađali: https://giatadrive.com/api/v1/properties/{giataId}
     */
    async getPropertyContent(giataId: number, language: string = 'en'): Promise<GiataDriveResponse | null> {
        console.log(`[GIATA Drive API] Povlačim sadržaj za GIATA ID: ${giataId} (${language})`);

        if (!this.apiKey) {
            console.warn('[GIATA Drive API] Nema API ključa, koristim MOCK podatke.');
        }

        await new Promise(resolve => setTimeout(resolve, 500));

        // Mock response za Grifid Noa
        if (giataId === 101234) {
            return {
                giataId: 101234,
                name: 'Grifid Noa',
                category: 5,
                address: {
                    street: 'Golden Sands Resort',
                    city: 'Varna',
                    zip: '9007',
                    country: 'Bulgaria',
                    coordinates: {
                        lat: 43.2847,
                        lng: 28.0416
                    }
                },
                images: [
                    { url: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80', heroImage: true, category: 'exterior' },
                    { url: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80', heroImage: false, category: 'room' },
                    { url: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80', heroImage: false, category: 'pool' }
                ],
                texts: [
                    {
                        language: 'en',
                        description: 'Grifid Noa is a luxury 5-star premium all-inclusive resort located directly on the beach in Golden Sands.',
                        amenities: ['Free WiFi', 'Spa & Wellness', 'Outdoor Pool', 'Gourmet Restaurant', 'Private Beach']
                    },
                    {
                        language: 'sr',
                        description: 'Grifid Noa je luksuzni Premium All Inclusive rizort sa 5 zvezdica, lociran direktno na plaži u Zlatnim Pjascima.',
                        amenities: ['Besplatan WiFi', 'Spa i Wellness', 'Otvoreni bazen', 'Gurmanski restoran', 'Privatna plaža']
                    }
                ]
            };
        }

        // Mock response za Acropolis View
        if (giataId === 215432) {
            return {
                giataId: 215432,
                name: 'Acropolis View Hotel',
                category: 3,
                address: {
                    street: 'Webster 10',
                    city: 'Athens',
                    zip: '11742',
                    country: 'Greece',
                    coordinates: {
                        lat: 37.9715,
                        lng: 23.7257
                    }
                },
                images: [
                    { url: 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80', heroImage: true, category: 'exterior' }
                ],
                texts: [
                    {
                        language: 'en',
                        description: 'A cozy hotel with spectacular views of the Acropolis, located in the historic center of Athens.',
                        amenities: ['Free WiFi', 'Rooftop Terrace', 'Air Conditioning']
                    }
                ]
            };
        }

        return null;
    }
}

// Singleton instanca servisa
const giataApiService = new GiataApiService();
export default giataApiService;
