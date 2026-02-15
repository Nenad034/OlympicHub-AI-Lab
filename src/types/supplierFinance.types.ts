/**
 * Supplier Finance Module Types
 * Handles Accounts Payable (AP), Payment Rules, and Transactions
 */

export type ObligationStatus = 'unpaid' | 'processing' | 'paid' | 'disputed' | 'refund_pending';

export type PaymentMethod = 'bank' | 'vcc' | 'cash' | 'compensation';

export type RuleType = 'DaysBeforeArrival' | 'DaysAfterBooking' | 'EndOfMonthPlusDays' | 'Manual';

export type RuleApplyTo = 'FreeCancellationDate' | 'CheckInDate' | 'BookingDate';

export interface SupplierObligation {
    id: string;
    reservation_id: string;
    cis_code: string;
    supplier_id: string;

    // Financials
    net_amount: number;
    currency: string;
    exchange_rate_at_booking?: number;

    // Deadlines
    cancellation_deadline?: string;
    payment_deadline?: string;

    // Status & Score
    status: ObligationStatus;
    priority_score: number;

    // Methods
    payment_method_preferred: PaymentMethod;

    // Metadata
    notes?: string;
    created_at: string;
    updated_at: string;
}

export interface SupplierPaymentRule {
    id: string;
    supplier_id: string;
    rule_name: string;
    rule_type: RuleType;
    rule_value: number;
    apply_to: RuleApplyTo;
    is_active: boolean;
    created_at: string;
}

export interface SupplierTransaction {
    id: string;
    obligation_id: string;
    amount_paid: number;
    currency: string;
    payment_method: string;
    bank_name?: string;
    transaction_ref?: string;
    vcc_id?: string;
    executed_by?: string;
    executed_at: string;
}

export interface SupplierVCCSettings {
    id: string;
    supplier_id: string;
    auto_generate: boolean;
    trigger_days_before: number;
    max_limit_percent: number;
    provider_config?: any;
    updated_at: string;
}

export interface SupplierFinanceDashboardStats {
    totalUnpaid: number;
    urgentCount: number; // Score > 80
    executedToday: number;
    pendingVCC: number;
    fxRiskLoss: number;
}
