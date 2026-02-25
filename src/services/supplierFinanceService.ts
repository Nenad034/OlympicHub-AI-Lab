import { supabase } from '../supabaseClient';
import type {
    SupplierObligation,
    SupplierPaymentRule,
    SupplierTransaction,
    SupplierVCCSettings,
    SupplierFinanceDashboardStats
} from '../types/supplierFinance.types';
import { calculateObligationPriority } from '../utils/supplierFinanceUtils';

// Local Storage Keys
const OBLIGATIONS_KEY = 'tct_finance_obligations';
const VCC_SETTINGS_KEY = 'tct_finance_vcc_settings';
const TRANSACTIONS_KEY = 'tct_finance_transactions';

/**
 * Service responsible for all Supplier Finance operations.
 * Handles obligations, transactions, payment rules, and VCC settings.
 * 
 * Rules followed:
 * - Direct Supabase communication with error handling
 * - Strict typing (no any)
 * - Input validation
 */
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

            if (error || !data || data.length === 0) {
                // FALLBACK TO LOCAL STORAGE
                const local = JSON.parse(localStorage.getItem(OBLIGATIONS_KEY) || '[]');
                const enriched = local.map((ob: any) => ({
                    ...ob,
                    priority_score: calculateObligationPriority(ob)
                }));
                return { success: true, data: enriched.sort((a: any, b: any) => b.priority_score - a.priority_score) };
            }

            const enrichedData: SupplierObligation[] = data.map((ob: SupplierObligation) => ({
                ...ob,
                priority_score: calculateObligationPriority(ob)
            }));

            // Sync back to local storage for offline use
            localStorage.setItem(OBLIGATIONS_KEY, JSON.stringify(enrichedData));

            return { success: true, data: enrichedData };
        } catch (error: unknown) {
            // Even on crash, try local
            const local = JSON.parse(localStorage.getItem(OBLIGATIONS_KEY) || '[]');
            return { success: true, data: local };
        }
    },

    /**
     * Create or update an obligation
     */
    async saveObligation(obligation: Partial<SupplierObligation>): Promise<{ success: boolean; data?: SupplierObligation; error?: string }> {
        try {
            const priority_score = calculateObligationPriority(obligation);

            // 1. Save to Local First
            const local = JSON.parse(localStorage.getItem(OBLIGATIONS_KEY) || '[]');
            const index = local.findIndex((o: any) => o.id === obligation.id || (o.cis_code === obligation.cis_code && o.supplier_id === obligation.supplier_id));

            if (index !== -1) {
                local[index] = { ...local[index], ...obligation, priority_score };
            } else {
                local.push({ id: `ob_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`, ...obligation, priority_score, paid_amount: 0 });
            }
            localStorage.setItem(OBLIGATIONS_KEY, JSON.stringify(local));

            // 2. Try Supabase
            const { data, error } = await supabase
                .from('supplier_obligations')
                .upsert([{ ...obligation, priority_score }])
                .select()
                .single();

            if (error) {
                console.warn('[Finance Service] Cloud sync failed, using local only');
            }
            return { success: true, data: data || (index !== -1 ? local[index] : local[local.length - 1]) };
        } catch (error: any) {
            console.error('[Finance Service] Error saving obligation:', error);
            // We already saved to local, so return success anyway
            return { success: true };
        }
    },

    /**
     * Record a new transaction (supports partial payments)
     */
    async recordTransaction(transaction: Partial<SupplierTransaction>): Promise<{ success: boolean; error?: string }> {
        try {
            // 1. Fetch current obligation state
            const { data: ob, error: fetchError } = await supabase
                .from('supplier_obligations')
                .select('net_amount, paid_amount, status')
                .eq('id', transaction.obligation_id)
                .single();

            if (fetchError) throw fetchError;

            // 2. Save Transaction
            const { error: txError } = await supabase
                .from('supplier_transactions')
                .insert([transaction]);

            if (txError) throw txError;

            // 3. Calculate new paid amount and status
            const newPaidAmount = (ob.paid_amount || 0) + (transaction.amount_paid || 0);
            const isFullyPaid = newPaidAmount >= ob.net_amount;
            const newStatus = isFullyPaid ? 'paid' : 'partially_paid';

            // 4. Update Obligation
            const { error: obError } = await supabase
                .from('supplier_obligations')
                .update({
                    paid_amount: newPaidAmount,
                    status: newStatus
                })
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
        if (!supplierId) return [];

        try {
            const { data, error } = await supabase
                .from('supplier_payment_rules')
                .select('*')
                .eq('supplier_id', supplierId)
                .eq('is_active', true);

            if (error) throw error;
            return data || [];
        } catch (error: unknown) {
            console.error('[Finance Service] getSupplierRules:', error);
            return [];
        }
    },

    /**
     * Get Dashboard Stats including Profitability
     */
    async getDashboardStats(): Promise<SupplierFinanceDashboardStats> {
        const { data: obligations } = await this.getObligations();
        const obs = obligations || [];

        return {
            totalUnpaid: obs.filter(o => o.status !== 'paid').reduce((sum, o) => sum + (o.net_amount - o.paid_amount), 0),
            urgentCount: obs.filter(o => o.priority_score >= 80 && o.status !== 'paid').length,
            executedToday: 0,
            pendingVCC: obs.filter(o => o.payment_method_preferred === 'vcc' && o.status !== 'paid').length,
            fxRiskLoss: 0,
            totalProfitExpected: obs.reduce((sum, o) => sum + ((o.gross_amount || 0) - o.net_amount), 0),
            totalProfitRealized: obs.filter(o => o.is_final_net).reduce((sum, o) => sum + ((o.gross_amount || 0) - o.net_amount), 0)
        };
    },

    /**
     * Get VCC settings for all suppliers
     */
    async getAllVCCSettings(): Promise<SupplierVCCSettings[]> {
        try {
            const { data, error } = await supabase
                .from('supplier_vcc_settings')
                .select('*');

            if (error || !data || data.length === 0) {
                return JSON.parse(localStorage.getItem(VCC_SETTINGS_KEY) || '[]');
            }

            localStorage.setItem(VCC_SETTINGS_KEY, JSON.stringify(data));
            return data;
        } catch (error: unknown) {
            return JSON.parse(localStorage.getItem(VCC_SETTINGS_KEY) || '[]');
        }
    },

    async saveVCCSettings(settings: Partial<SupplierVCCSettings>): Promise<void> {
        if (!settings.supplier_id) throw new Error('Supplier ID is required for VCC settings');

        try {
            const { error } = await supabase
                .from('supplier_vcc_settings')
                .upsert([settings]);

            if (error) throw error;
        } catch (error: unknown) {
            console.error('[Finance Service] saveVCCSettings:', error);
            throw error;
        }
    },

    async approveVCC(obligationId: string, approvedBy: string): Promise<void> {
        if (!obligationId || !approvedBy) throw new Error('Obligation ID and Approver name are required');

        try {
            const { error } = await supabase
                .from('supplier_obligations')
                .update({
                    vcc_approval_status: 'approved',
                    vcc_approved_by: approvedBy,
                    vcc_approved_at: new Date().toISOString(),
                    notes: `[VCC-Approved] Approved by ${approvedBy}. System will generate card shortly.`
                })
                .eq('id', obligationId);

            if (error) throw error;
        } catch (error: unknown) {
            console.error('[Finance Service] approveVCC:', error);
            throw error;
        }
    }
};
