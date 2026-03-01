import type {
    TravelportCredentials,
    AirSearchRequest,
    AirSearchResponse,
    CreateOrderRequest,
    OrderResponse
} from '../types/travelportTypes';

class TravelportApiService {
    private static instance: TravelportApiService;
    private config: TravelportCredentials | null = null;
    private accessToken: string | null = null;

    private constructor() { }

    public static getInstance(): TravelportApiService {
        if (!TravelportApiService.instance) {
            TravelportApiService.instance = new TravelportApiService();
        }
        return TravelportApiService.instance;
    }

    public configure(config: TravelportCredentials): void {
        this.config = config;
        console.log(`🚀 [Travelport] Configured for ${config.environment} environment`);
    }

    public isConfigured(): boolean {
        return this.config !== null;
    }

    public getEnvironment(): string {
        return this.config?.environment || 'none';
    }

    /**
     * Autentifikacija (Mock)
     * U produkciji poziva OAuth 2.0 endpoint
     */
    private async getAuthToken(): Promise<string> {
        if (this.accessToken) return this.accessToken;

        // Simuacija mrežnog kašnjenja
        await new Promise(resolve => setTimeout(resolve, 800));

        this.accessToken = `mock_tp_token_${Math.random().toString(36).substr(2)}`;
        return this.accessToken;
    }

    /**
     * Pretraga letova (JSON Air API v11)
     */
    public async searchAir(request: AirSearchRequest): Promise<AirSearchResponse> {
        console.log('✈️ [Travelport] Searching flights...', request);

        await this.getAuthToken();
        await new Promise(resolve => setTimeout(resolve, 1500));

        // Mock rezultati
        return {
            traceId: `TRACE-${Date.now()}`,
            offers: [
                {
                    id: 'offer-1',
                    totalPrice: 450.00,
                    basePrice: 380.00,
                    taxes: 70.00,
                    currency: 'EUR',
                    platingCarrier: 'LH',
                    segments: [
                        {
                            id: 'seg-1',
                            origin: request.origin,
                            destination: 'FRA',
                            departureTime: `${request.departureDate}T08:00:00`,
                            arrivalTime: `${request.departureDate}T10:30:00`,
                            carrier: 'LH',
                            flightNumber: '1411',
                            aircraft: 'A320',
                            duration: '2h 30m',
                            bookingCode: 'Q',
                            cabin: 'Economy'
                        },
                        {
                            id: 'seg-2',
                            origin: 'FRA',
                            destination: request.destination,
                            departureTime: `${request.departureDate}T12:00:00`,
                            arrivalTime: `${request.departureDate}T14:45:00`,
                            carrier: 'LH',
                            flightNumber: '400',
                            aircraft: 'B747',
                            duration: '8h 45m',
                            bookingCode: 'Q',
                            cabin: 'Economy'
                        }
                    ]
                },
                {
                    id: 'offer-2',
                    totalPrice: 520.00,
                    basePrice: 450.00,
                    taxes: 70.00,
                    currency: 'EUR',
                    platingCarrier: 'OS',
                    segments: [
                        {
                            id: 'seg-3',
                            origin: request.origin,
                            destination: 'VIE',
                            departureTime: `${request.departureDate}T07:15:00`,
                            arrivalTime: `${request.departureDate}T08:20:00`,
                            carrier: 'OS',
                            flightNumber: '772',
                            aircraft: 'E195',
                            duration: '1h 05m',
                            bookingCode: 'L',
                            cabin: 'Economy'
                        },
                        {
                            id: 'seg-4',
                            origin: 'VIE',
                            destination: request.destination,
                            departureTime: `${request.departureDate}T10:45:00`,
                            arrivalTime: `${request.departureDate}T13:30:00`,
                            carrier: 'OS',
                            flightNumber: '087',
                            aircraft: 'B777',
                            duration: '8h 45m',
                            bookingCode: 'L',
                            cabin: 'Economy'
                        }
                    ]
                }
            ]
        };
    }

    /**
     * Kreiranje rezervacije (Order Create)
     */
    public async createOrder(request: CreateOrderRequest): Promise<OrderResponse> {
        console.log('📝 [Travelport] Creating order...', request);

        await this.getAuthToken();
        await new Promise(resolve => setTimeout(resolve, 2000));

        return {
            orderId: `TP-${Date.now()}`,
            pnr: 'Q7X9WZ',
            status: 'Confirmed',
            offers: [] // U realnom API-ju vraća potvrđeni itinerer
        };
    }

    /**
     * Otkazivanje PNR-a (Conceptual)
     */
    public async cancelOrder(orderId: string): Promise<boolean> {
        console.log(`❌ [Travelport] Cancelling order ${orderId}`);
        await this.getAuthToken();
        await new Promise(resolve => setTimeout(resolve, 1000));
        return true;
    }
}

export const travelportApiService = TravelportApiService.getInstance();
export default travelportApiService;
