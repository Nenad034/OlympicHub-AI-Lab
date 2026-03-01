// ============================================================
// Worldpay Access API - TypeScript Tipovi
// REST API (JSON), moderna generacija - "Access Worldpay"
// ============================================================

// ─── Autentifikacija ─────────────────────────────────────────

export interface WorldpayCredentials {
    username: string;       // Vaš Worldpay username (Merchant Service Entity/MSE)
    password: string;       // API lozinka
    merchantCode: string;   // Merchant Entity Code - identifikuje vašu firmu
    environment: 'sandbox' | 'production';
}

// ─── Kartično plaćanje (Payments API) ─────────────────────────

export interface WorldpayPaymentCard {
    type: 'Plain';          // 'Plain' za direktan unos kartica (Direct API)
    number: string;         // Broj kartice
    expiryMonth: number;    // Mesec isteka (1-12)
    expiryYear: number;     // Godina isteka (4 cifre)
    cvv?: string;           // CVV kod
    holderName?: string;    // Ime vlasnika kartice
}

export interface WorldpayPaymentToken {
    type: 'NetworkToken' | 'Recurring';
    value: string;          // Token dobijen nakon prve naplate ili tokenizacije
}

export type WorldpayPaymentInstrument = WorldpayPaymentCard | WorldpayPaymentToken;

export interface WorldpayPayerInfo {
    billingAddress?: {
        address1: string;
        address2?: string;
        city: string;
        state?: string;
        postalCode: string;
        countryCode: string;   // ISO 3166-1 alpha-2 (npr. 'RS', 'DE', 'GB')
    };
    email?: string;
    shopperName?: string;
}

// ─── Zahtev za plaćanje ────────────────────────────────────────

export interface WorldpayPaymentRequest {
    transactionReference: string;      // Jedinstveni ID transakcije (vaš interni ID)
    merchant: {
        entity: string;                // merchantCode/entity koji ste dobili od Worldpay-a
    };
    instruction: {
        narrative: {
            line1: string;             // Opis koji se prikazuje na izvodu kartice (maks 22 znaka)
            line2?: string;
        };
        value: {
            currency: string;          // ISO 4217 (npr. 'EUR', 'GBP', 'USD')
            amount: number;            // Iznos u centima (npr. €100.00 => 10000)
        };
        paymentInstrument: WorldpayPaymentInstrument;
    };
    customer?: WorldpayPayerInfo;
}

// ─── Odgovor od plaćanje ───────────────────────────────────────

export type WorldpayOutcome =
    | 'authorized'           // Uspešna autorizacija
    | 'refused'              // Odbijeno od banke
    | 'fraud'                // Zaustavljeno zbog prijevare
    | 'sent_for_settlement'  // Poslato na poravnanje
    | 'cancelled'            // Otkazano
    | 'expired';             // Isteklo

export interface WorldpayPaymentResponse {
    outcome: WorldpayOutcome;
    transactionReference: string;
    issuer?: {
        authorizationCode?: string;
    };
    scheme?: {
        reference?: string;       // Referenca platne sheme (Visa/Mastercard)
    };
    riskFactors?: Array<{
        type: string;
        risk: 'notChecked' | 'notMatched' | 'matched' | 'partialMatch';
    }>;
    fraud?: {
        score?: number;
        outcome?: string;
    };
    _links?: {
        [key: string]: { href: string };
    };
}

// ─── Tokenizacija ─────────────────────────────────────────────

export interface WorldpayTokenizeRequest {
    reusable: boolean;                // Da li se token može koristiti više puta
    paymentInstrument: WorldpayPaymentCard;
    description?: string;
}

export interface WorldpayTokenResponse {
    tokenId: string;                  // Dobijeni token za buduće naplate
    description?: string;
    paymentInstrument: {
        type: string;
        last4Digits: string;
        expiryMonth: number;
        expiryYear: number;
        cardBrand: 'VISA' | 'MASTERCARD' | 'AMEX' | 'DISCOVER' | 'JCB' | string;
        holderName?: string;
    };
}

// ─── Refundacija (povrat novca) ────────────────────────────────

export interface WorldpayRefundRequest {
    value: {
        amount: number;             // Iznos refundacije u centima
        currency: string;
    };
    reference?: string;
}

export interface WorldpayRefundResponse {
    outcome: 'sent_for_refund' | 'refused';
    lastEvent: string;
}

// ─── Webhook Event ────────────────────────────────────────────

export interface WorldpayWebhookEvent {
    eventId: string;
    eventTimestamp: string;           // ISO 8601 timestamp
    eventDetails: {
        type: 'payment' | 'refund' | 'token' | 'payout';
        subType?: string;
        outcome: string;
        lastUpdated: string;
        links: {
            [key: string]: { href: string };
        };
    };
}

// ─── Interni model za naš ERP ────────────────────────────────

export interface WorldpayTransactionRecord {
    internalId: string;               // ID rezervacije u našem sistemu
    worldpayRef: string;              // transactionReference iz Worldpay-a
    amount: number;                   // U centima
    currency: string;
    status: WorldpayOutcome;
    cardLastFour?: string;
    cardBrand?: string;
    timestamp: string;
    refundedAmount?: number;
}
