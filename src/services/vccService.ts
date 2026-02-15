/**
 * VCC Service - Virtual Credit Card Integration
 * 
 * This service simulates integration with VCC providers (e.g., Stripe, Airwallex, Paxxa).
 * In a production environment, these would be real API calls.
 */

export interface VCCDetails {
    id: string;
    cardNumber: string;
    expiryMonth: string;
    expiryYear: string;
    cvv: string;
    cardHolder: string;
    limit: number;
    currency: string;
    provider: string;
}

export const vccService = {
    /**
     * Simulates generation of a Virtual Credit Card
     */
    async generateCard(amount: number, currency: string, supplierName: string): Promise<VCCDetails> {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Generate mock card details
        const cardId = `VCC-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;
        const cardNumber = `4444 ${Math.floor(1000 + Math.random() * 9000)} ${Math.floor(1000 + Math.random() * 9000)} ${Math.floor(1000 + Math.random() * 9000)}`;

        const now = new Date();
        const expMonth = String((now.getMonth() + 2) % 12 || 12).padStart(2, '0');
        const expYear = String(now.getFullYear() + 1).slice(-2);

        return {
            id: cardId,
            cardNumber,
            expiryMonth: expMonth,
            expiryYear: expYear,
            cvv: Math.floor(100 + Math.random() * 900).toString(),
            cardHolder: `OLYMPIC ADMIN - ${supplierName.toUpperCase()}`,
            limit: amount,
            currency,
            provider: 'Stripe Issuing (Mock)'
        };
    },

    /**
     * Simulates notification to supplier with VCC details
     */
    async sendToSupplier(vcc: VCCDetails, supplierEmail: string): Promise<boolean> {
        console.log(`[VCC Service] Sending card ${vcc.id} details to ${supplierEmail}`);
        await new Promise(resolve => setTimeout(resolve, 1000));
        return true;
    }
};
