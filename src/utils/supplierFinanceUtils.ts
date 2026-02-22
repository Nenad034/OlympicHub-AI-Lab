import type { SupplierObligation, SupplierPaymentRule } from '../types/supplierFinance.types';

/**
 * Calculates the priority score (0-100) for a supplier obligation.
 * 
 * Logic:
 * - 60% Weight: Time until payment deadline.
 * - 20% Weight: Amount (higher amount = higher risk/priority).
 * - 20% Weight: Special flags (VCC, Early Bird, etc - simplified for now).
 */
export function calculateObligationPriority(obligation: Partial<SupplierObligation>): number {
    if (!obligation.payment_deadline) return 0;

    const today = new Date();
    const deadline = new Date(obligation.payment_deadline);
    const diffTime = deadline.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    let score = 0;

    // 1. Time Pressure (max 85 points)
    if (diffDays <= -1) score += 85; // Overdue
    else if (diffDays === 0) score += 80; // Today
    else if (diffDays <= 1) score += 70;
    else if (diffDays <= 3) score += 50;
    else if (diffDays <= 7) score += 30;
    else if (diffDays <= 14) score += 15;

    // 2. Amount Factor (max 20 points)
    const amount = obligation.net_amount || 0;
    if (amount > 10000) score += 20;
    else if (amount > 5000) score += 15;
    else if (amount > 1000) score += 10;
    else if (amount > 200) score += 5;

    // 3. Status Modifiers
    if (obligation.status === 'disputed') score += 10; // High attention
    if (obligation.status === 'refund_pending') score = 5; // Low priority for payment

    return Math.min(score, 100);
}

/**
 * Calculates the recommended payment deadline based on supplier rules
 */
export function calculateRecommendedDeadline(
    bookingDate: Date,
    checkInDate: Date,
    freeCancellationDate: Date | null,
    rules: SupplierPaymentRule[]
): Date {
    // Default fallback: 7 days before check-in or cancellation date if exists
    let recommendedDate = freeCancellationDate
        ? new Date(freeCancellationDate.getTime() - (1000 * 60 * 60 * 24)) // 1 day before penalty
        : new Date(checkInDate.getTime() - (7 * 1000 * 60 * 60 * 24)); // 7 days before check-in

    // Apply active rules
    const activeRule = rules.find(r => r.is_active);
    if (activeRule) {
        switch (activeRule.rule_type) {
            case 'EndOfMonthPlusDays':
                // Everything from Month N paid by Day X of Month N+1
                const nextMonth = new Date(bookingDate.getFullYear(), bookingDate.getMonth() + 1, activeRule.rule_value);
                recommendedDate = nextMonth;
                break;
            case 'DaysBeforeArrival':
                recommendedDate = new Date(checkInDate.getTime() - (activeRule.rule_value * 1000 * 60 * 60 * 24));
                break;
            case 'DaysAfterBooking':
                recommendedDate = new Date(bookingDate.getTime() + (activeRule.rule_value * 1000 * 60 * 60 * 24));
                break;
        }
    }

    return recommendedDate;
}

/**
 * Formats currency amount for display
 */
export function formatFinanceAmount(amount: number, currency: string = 'EUR'): string {
    return new Intl.NumberFormat('sr-RS', {
        style: 'currency',
        currency: currency,
    }).format(amount);
}
