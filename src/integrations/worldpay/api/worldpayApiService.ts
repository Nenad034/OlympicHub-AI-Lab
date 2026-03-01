import type {
    WorldpayCredentials,
    WorldpayPaymentRequest,
    WorldpayPaymentResponse,
    WorldpayTokenizeRequest,
    WorldpayTokenResponse,
    WorldpayRefundRequest,
    WorldpayRefundResponse,
    WorldpayTransactionRecord,
} from '../types/worldpayTypes';

// ─── Worldpay API Endpointi ───────────────────────────────────
const ENDPOINTS = {
    sandbox: 'https://try.access.worldpay.com',
    production: 'https://access.worldpay.com',
};

export class WorldpayApiService {
    private credentials: WorldpayCredentials | null = null;
    private baseUrl: string = ENDPOINTS.sandbox;

    // ─── Inicijalizacija ───────────────────────────────────────

    configure(credentials: WorldpayCredentials) {
        this.credentials = credentials;
        this.baseUrl = credentials.environment === 'production'
            ? ENDPOINTS.production
            : ENDPOINTS.sandbox;
    }

    isConfigured(): boolean {
        return !!(this.credentials?.username && this.credentials?.password && this.credentials?.merchantCode);
    }

    private getAuthHeader(): string {
        if (!this.credentials) throw new Error('Worldpay nije konfigurisan. Pozovite configure() najpre.');
        const encoded = btoa(`${this.credentials.username}:${this.credentials.password}`);
        return `Basic ${encoded}`;
    }

    // ─── Simulacija kašnjenja (Mock) ──────────────────────────

    private async mockDelay(ms: number = 400) {
        await new Promise(resolve => setTimeout(resolve, ms));
    }

    // ─── Plaćanje (Authorization) ────────────────────────────
    /**
     * Autorizuje plaćanje karticom ili tokenom.
     * Live endpoint: POST /payments/authorizations
     */
    async authorizePayment(request: WorldpayPaymentRequest): Promise<WorldpayPaymentResponse> {
        console.log('[Worldpay] Autorizujem plaćanje:', request.transactionReference);
        await this.mockDelay(600);

        /* --- MOCK LOGIKA --- */
        // U realnosti: fetch(`${this.baseUrl}/payments/authorizations`, { method: 'POST', headers: {...}, body: JSON.stringify(request) })

        const cardNumber = (request.instruction.paymentInstrument as any).number;

        // Simulacija scenarija na osnovu broja kartice:
        if (cardNumber?.endsWith('0002')) {
            return { outcome: 'refused', transactionReference: request.transactionReference };
        }
        if (cardNumber?.endsWith('0003')) {
            return { outcome: 'fraud', transactionReference: request.transactionReference, fraud: { score: 85, outcome: 'high_risk' } };
        }

        // Uspešna autorizacija (default)
        return {
            outcome: 'authorized',
            transactionReference: request.transactionReference,
            issuer: { authorizationCode: `AUTH${Math.floor(Math.random() * 900000 + 100000)}` },
            scheme: { reference: `WP${Date.now()}` },
            riskFactors: [
                { type: 'cvc', risk: 'matched' },
                { type: 'avs', risk: 'matched' },
            ],
        };
    }

    // ─── Tokenizacija Kartice ─────────────────────────────────
    /**
     * Kreira token za karticu radi bezbednog čuvanja i buduće naplate.
     * Live endpoint: POST /tokens
     */
    async tokenizeCard(request: WorldpayTokenizeRequest): Promise<WorldpayTokenResponse> {
        console.log('[Worldpay] Tokenizujem karticu...');
        await this.mockDelay(400);

        const last4 = request.paymentInstrument.number.slice(-4);
        const brand = request.paymentInstrument.number.startsWith('4') ? 'VISA' : 'MASTERCARD';

        return {
            tokenId: `tok_${Date.now()}_${Math.random().toString(36).substring(7)}`,
            description: request.description || `${brand} ***${last4}`,
            paymentInstrument: {
                type: 'ObfuscatedCard',
                last4Digits: last4,
                expiryMonth: request.paymentInstrument.expiryMonth,
                expiryYear: request.paymentInstrument.expiryYear,
                cardBrand: brand,
                holderName: request.paymentInstrument.holderName,
            },
        };
    }

    // ─── Refundacija ──────────────────────────────────────────
    /**
     * Inicira potpunu ili delimičnu refundaciju.
     * Live endpoint: POST /payments/{transactionReference}/refunds
     */
    async refundPayment(transactionRef: string, request: WorldpayRefundRequest): Promise<WorldpayRefundResponse> {
        console.log('[Worldpay] Procesiranje refundacije za:', transactionRef, `${request.value.amount / 100} ${request.value.currency}`);
        await this.mockDelay(500);

        return {
            outcome: 'sent_for_refund',
            lastEvent: 'SentForRefund',
        };
    }

    // ─── Simulacija: Lista transakcija (interni mock) ─────────

    getMockTransactions(): WorldpayTransactionRecord[] {
        return [
            {
                internalId: 'REZ-2025-001',
                worldpayRef: 'WP1706783200001',
                amount: 129000,
                currency: 'EUR',
                status: 'sent_for_settlement',
                cardLastFour: '4242',
                cardBrand: 'VISA',
                timestamp: '2025-02-01T10:23:00Z',
            },
            {
                internalId: 'REZ-2025-002',
                worldpayRef: 'WP1706783200002',
                amount: 85000,
                currency: 'EUR',
                status: 'authorized',
                cardLastFour: '5555',
                cardBrand: 'MASTERCARD',
                timestamp: '2025-02-03T14:11:00Z',
            },
            {
                internalId: 'REZ-2025-003',
                worldpayRef: 'WP1706783200003',
                amount: 45000,
                currency: 'EUR',
                status: 'refused',
                cardLastFour: '0002',
                cardBrand: 'VISA',
                timestamp: '2025-02-05T09:45:00Z',
            },
            {
                internalId: 'REZ-2025-004',
                worldpayRef: 'WP1706783200004',
                amount: 210000,
                currency: 'EUR',
                status: 'sent_for_settlement',
                cardLastFour: '1234',
                cardBrand: 'MASTERCARD',
                timestamp: '2025-02-10T16:55:00Z',
                refundedAmount: 25000,
            },
        ];
    }
}

// Singleton instanca
const worldpayApiService = new WorldpayApiService();
export default worldpayApiService;
