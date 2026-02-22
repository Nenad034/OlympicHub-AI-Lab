/**
 * Payment System Strategy - ClickToTravel Hub
 * 
 * Defines the core types for online payments, link generation, and status tracking.
 */

export type PaymentProvider = 'Stripe' | 'Corvus' | 'AllSecure' | 'BankTransfer' | 'AgentLink' | 'IPS_QR';

export type PaymentStatus = 'pending' | 'processing' | 'paid' | 'failed' | 'refunded' | 'expired';

export interface IPS_QR_Data {
    account: string; // npr. 160-0000000001234-56
    name: string; // npr. OLYMPIC TRAVEL DOO
    amount: number;
    currency: string;
    purpose: string;
    reference: string;
}

export interface PaymentTransaction {
    id: string;
    bookingId: string;
    dossierId: string;
    amount: number;
    currency: string;
    provider: PaymentProvider;
    status: PaymentStatus;
    providerTransactionId?: string;
    paymentMethod: string; // e.g., 'Visa 4242', 'Link'
    payerEmail: string;
    createdAt: string;
    updatedAt: string;
    metadata?: Record<string, any>;
}

export interface PaymentLink {
    id: string;
    paymentId: string;
    url: string;
    expiresAt: string;
    isSingleUse: boolean;
    isActive: boolean;
    shortCode: string; // For nice URLs like clicktotravel.rs/pay/xyz
}

export interface PaymentGatewayConfig {
    provider: PaymentProvider;
    apiKey: string;
    merchantId?: string;
    isTestMode: boolean;
    webhookSecret?: string;
}

export interface CreatePaymentRequest {
    bookingId: string;
    amount: number;
    currency: string;
    customerEmail: string;
    customerName: string;
    description: string;
    metadata?: Record<string, any>;
}

export interface PaymentSystemResponse {
    success: boolean;
    transactionId?: string;
    status: PaymentStatus;
    redirectUrl?: string; // For 3D Secure or External payment pages
    error?: string;
}
