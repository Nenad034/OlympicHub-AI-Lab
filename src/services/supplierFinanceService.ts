import { supabase } from '../supabaseClient';
import type {
    SupplierObligation,
    SupplierPaymentRule,
    SupplierTransaction,
    SupplierVCCSettings,
    SupplierFinanceDashboardStats
} from '../types/supplierFinance.types';
import { calculateObligationPriority } from '../utils/supplierFinanceUtils';

export const supplierFinanceService = {
    /**
     * Fetch all supplier obligations with calculated priority
     */
    async getObligations(): Promise<{ success: boolean; data?: SupplierObligation[]; error?: string }> {
        try {
            const { data, error } = await supabase
                .from('supplier_obligations')
                .select('*')
                .order('priority_score', { ascending: false });

            if (error) throw error;

            // Recalculate priority scores in real-time if necessary or use DB values
            const enrichedData = (data || []).map((ob: any) => ({
                ...ob,
                priority_score: calculateObligationPriority(ob)
            }));

            return { success: true, data: enrichedData };
        } catch (error: any) {
            console.error('[Finance Service] Error fetching obligations:', error);
            return { success: false, error: error.message };
        }
    },

    /**
     * Create or update an obligation
     */
    async saveObligation(obligation: Partial<SupplierObligation>): Promise<{ success: boolean; data?: SupplierObligation; error?: string }> {
        try {
            const priority_score = calculateObligationPriority(obligation);
            const { data, error } = await supabase
                .from('supplier_obligations')
                .upsert([{ ...obligation, priority_score }])
                .select()
                .single();

            if (error) throw error;
            return { success: true, data };
        } catch (error: any) {
            console.error('[Finance Service] Error saving obligation:', error);
            return { success: false, error: error.message };
        }
    },

    /**
     * Record a new transaction
     */
    async recordTransaction(transaction: Partial<SupplierTransaction>): Promise<{ success: boolean; error?: string }> {
        try {
            // 1. Save Transaction
            const { error: txError } = await supabase
                .from('supplier_transactions')
                .insert([transaction]);

            if (txError) throw txError;

            // 2. Update Obligation Status
            const { error: obError } = await supabase
                .from('supplier_obligations')
                .update({ status: 'paid' })
                .eq('id', transaction.obligation_id);

            if (obError) throw obError;

            return { success: true };
        } catch (error: any) {
            console.error('[Finance Service] Error recording transaction:', error);
            return { success: false, error: error.message };
        }
    },

    /**
     * Fetch payment rules for a supplier
     */
    async getSupplierRules(supplierId: string): Promise<SupplierPaymentRule[]> {
        const { data } = await supabase
            .from('supplier_payment_rules')
            .select('*')
            .eq('supplier_id', supplierId)
            .eq('is_active', true);

        return data || [];
    },

    /**
     * Get Dashboard Stats
     */
    async getDashboardStats(): Promise<SupplierFinanceDashboardStats> {
        const { data: obligations } = await this.getObligations();
        const obs = obligations || [];

        return {
            totalUnpaid: obs.filter(o => o.status === 'unpaid').reduce((sum, o) => sum + o.net_amount, 0),
            urgentCount: obs.filter(o => o.priority_score >= 80 && o.status === 'unpaid').length,
            executedToday: 0, // Would need transaction date filter
            pendingVCC: obs.filter(o => o.payment_method_preferred === 'vcc' && o.status === 'unpaid').length,
            fxRiskLoss: 0 // Would need exchange rate comparison logic
        };
    }
};
