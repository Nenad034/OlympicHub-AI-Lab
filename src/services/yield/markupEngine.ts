/**
 * Markup Engine Service
 * Calculates dynamic markup proposals and manages approval workflow
 */

import { supabase } from '../../supabaseClient';
import type {
    MarkupProposal,
    MarkupCalculationFactors,
    MarkupHistory,
    YieldSettings,
    YieldApiResponse
} from './types';

export class MarkupEngineService {
    /**
     * Create a new markup proposal
     */
    async createProposal(
        serviceType: 'hotel' | 'package' | 'charter' | 'transfer',
        baseCost: number,
        competitorAvgPrice?: number,
        hotelName?: string,
        destination?: string,
        calculationFactors?: Partial<MarkupCalculationFactors>
    ): Promise<YieldApiResponse<MarkupProposal>> {
        try {
            console.log('💰 [Markup Engine] Creating proposal...');

            // 1. Get yield settings
            const settings = await this.getYieldSettings();

            // 2. Calculate proposed markup
            const proposedMarkup = await this.calculateDynamicMarkup(
                baseCost,
                competitorAvgPrice,
                calculationFactors,
                settings
            );

            const proposedSellingPrice = baseCost * (1 + proposedMarkup / 100);

            // 3. Determine if auto-approval is possible
            const currentMarkup = settings.default_markup_percent;
            const markupDifference = Math.abs(proposedMarkup - currentMarkup);
            const autoApprove = markupDifference <= settings.auto_approve_threshold_percent;

            // 4. Create proposal
            const proposal: Partial<MarkupProposal> = {
                service_type: serviceType,
                hotel_name: hotelName,
                destination: destination,
                base_cost: baseCost,
                competitor_avg_price: competitorAvgPrice,
                current_markup_percent: currentMarkup,
                current_selling_price: baseCost * (1 + currentMarkup / 100),
                proposed_markup_percent: proposedMarkup,
                proposed_selling_price: proposedSellingPrice,
                calculation_factors: calculationFactors as any,
                status: autoApprove ? 'approved' : 'pending',
                proposed_by: 'system',
                proposed_at: new Date().toISOString(),
                auto_approved: autoApprove,
                auto_approval_reason: autoApprove
                    ? `Markup change (${markupDifference.toFixed(2)}%) is within auto-approval threshold (${settings.auto_approve_threshold_percent}%)`
                    : undefined,
                valid_from: new Date().toISOString(),
                valid_until: this.calculateValidUntil()
            };

            const { data, error } = await supabase
                .from('markup_proposals')
                .insert(proposal)
                .select()
                .single();

            if (error) throw error;

            const createdProposal = data as MarkupProposal;

            // 5. If auto-approved, create history entry
            if (autoApprove) {
                await this.createHistoryEntry(createdProposal, 'auto_approval');
            }

            console.log(`✅ [Markup Engine] Proposal created: ${proposedMarkup}% (${autoApprove ? 'Auto-approved' : 'Pending'})`);

            return {
                success: true,
                data: createdProposal,
                message: autoApprove ? 'Proposal auto-approved' : 'Proposal pending approval'
            };

        } catch (error) {
            console.error('❌ [Markup Engine] Error creating proposal:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }

    /**
     * Calculate dynamic markup based on market conditions
     */
    private async calculateDynamicMarkup(
        baseCost: number,
        competitorAvgPrice?: number,
        factors?: Partial<MarkupCalculationFactors>,
        settings?: YieldSettings
    ): Promise<number> {
        if (!settings) {
            settings = await this.getYieldSettings();
        }

        let markup = settings.default_markup_percent;

        // 1. Competitor-based adjustment
        if (competitorAvgPrice && competitorAvgPrice > 0) {
            const competitorMarkup = ((competitorAvgPrice - baseCost) / baseCost) * 100;

            if (settings.match_competitor_price) {
                // Match competitor price exactly
                markup = competitorMarkup;
            } else {
                // Undercut competitor by configured percentage
                markup = competitorMarkup - settings.undercut_competitor_by_percent;
            }
        }

        // 2. Seasonal adjustment
        if (factors?.season) {
            switch (factors.season) {
                case 'high':
                    markup *= 1.1; // +10% in high season
                    break;
                case 'low':
                    markup *= 0.9; // -10% in low season
                    break;
            }
        }

        // 3. Demand adjustment
        if (factors?.demand) {
            switch (factors.demand) {
                case 'high':
                    markup *= 1.05; // +5% for high demand
                    break;
                case 'low':
                    markup *= 0.95; // -5% for low demand
                    break;
            }
        }

        // 4. Risk adjustment (days to departure)
        if (factors?.days_to_departure !== undefined) {
            if (factors.days_to_departure < 7) {
                markup *= 0.8; // -20% for last minute (increase sales urgency)
            } else if (factors.days_to_departure < 14) {
                markup *= 0.9; // -10% for near departure
            }
        }

        // 5. Ensure within bounds
        markup = Math.max(settings.min_markup_percent, Math.min(settings.max_markup_percent, markup));

        return Math.round(markup * 100) / 100;
    }

    /**
     * Approve a markup proposal
     */
    async approveProposal(
        proposalId: string,
        userId: string,
        notes?: string
    ): Promise<YieldApiResponse<MarkupProposal>> {
        try {
            const { data, error } = await supabase
                .from('markup_proposals')
                .update({
                    status: 'approved',
                    reviewed_by: userId,
                    reviewed_at: new Date().toISOString(),
                    review_notes: notes
                })
                .eq('id', proposalId)
                .select()
                .single();

            if (error) throw error;

            const proposal = data as MarkupProposal;

            // Create history entry
            await this.createHistoryEntry(proposal, 'manual_approval');

            console.log(`✅ [Markup Engine] Proposal ${proposalId} approved`);

            return {
                success: true,
                data: proposal,
                message: 'Proposal approved successfully'
            };

        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }

    /**
     * Reject a markup proposal
     */
    async rejectProposal(
        proposalId: string,
        userId: string,
        notes?: string
    ): Promise<YieldApiResponse<MarkupProposal>> {
        try {
            const { data, error } = await supabase
                .from('markup_proposals')
                .update({
                    status: 'rejected',
                    reviewed_by: userId,
                    reviewed_at: new Date().toISOString(),
                    review_notes: notes
                })
                .eq('id', proposalId)
                .select()
                .single();

            if (error) throw error;

            console.log(`❌ [Markup Engine] Proposal ${proposalId} rejected`);

            return {
                success: true,
                data: data as MarkupProposal,
                message: 'Proposal rejected'
            };

        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }

    /**
     * Create history entry for markup change
     */
    private async createHistoryEntry(
        proposal: MarkupProposal,
        changeReason: string
    ): Promise<void> {
        try {
            const history: Partial<MarkupHistory> = {
                proposal_id: proposal.id,
                service_type: proposal.service_type,
                service_id: proposal.service_id,
                hotel_name: proposal.hotel_name,
                old_markup_percent: proposal.current_markup_percent,
                new_markup_percent: proposal.proposed_markup_percent,
                old_price: proposal.current_selling_price,
                new_price: proposal.proposed_selling_price,
                change_reason: changeReason,
                trigger_data: proposal.calculation_factors,
                changed_by: proposal.reviewed_by || 'system',
                changed_at: new Date().toISOString()
            };

            const { error } = await supabase
                .from('markup_history')
                .insert(history);

            if (error) throw error;

            console.log('📝 [Markup Engine] History entry created');

        } catch (error) {
            console.error('[Markup Engine] Error creating history:', error);
        }
    }

    /**
     * Get pending proposals
     */
    async getPendingProposals(): Promise<YieldApiResponse<MarkupProposal[]>> {
        try {
            const { data, error } = await supabase
                .from('markup_proposals')
                .select('*')
                .eq('status', 'pending')
                .order('proposed_at', { ascending: false });

            if (error) throw error;

            return {
                success: true,
                data: (data || []) as MarkupProposal[]
            };

        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }

    /**
     * Get markup history
     */
    async getMarkupHistory(limit: number = 50): Promise<YieldApiResponse<MarkupHistory[]>> {
        try {
            const { data, error } = await supabase
                .from('markup_history')
                .select('*')
                .order('changed_at', { ascending: false })
                .limit(limit);

            if (error) throw error;

            return {
                success: true,
                data: (data || []) as MarkupHistory[]
            };

        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }

    /**
     * Get yield settings
     */
    private async getYieldSettings(): Promise<YieldSettings> {
        const { data, error } = await supabase
            .from('yield_settings')
            .select('*')
            .eq('setting_type', 'global')
            .eq('active', true)
            .single();

        if (error || !data) {
            // Return default settings
            return {
                setting_type: 'global',
                default_markup_percent: 15,
                min_markup_percent: 5,
                max_markup_percent: 30,
                auto_approve_threshold_percent: 5,
                match_competitor_price: false,
                undercut_competitor_by_percent: 2,
                scraping_frequency: 'daily',
                scraping_enabled: true,
                notify_on_price_change: true,
                notify_on_competitor_lower_price: true,
                active: true
            };
        }

        return data as YieldSettings;
    }

    /**
     * Update yield settings
     */
    async updateYieldSettings(settings: Partial<YieldSettings>): Promise<YieldApiResponse<YieldSettings>> {
        try {
            const { data, error } = await supabase
                .from('yield_settings')
                .update(settings)
                .eq('setting_type', 'global')
                .select()
                .single();

            if (error) throw error;

            return {
                success: true,
                data: data as YieldSettings,
                message: 'Settings updated successfully'
            };

        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }

    /**
     * Calculate valid_until timestamp (24 hours from now)
     */
    private calculateValidUntil(): string {
        const validUntil = new Date();
        validUntil.setHours(validUntil.getHours() + 24);
        return validUntil.toISOString();
    }

    /**
     * Expire old proposals
     */
    async expireOldProposals(): Promise<YieldApiResponse<number>> {
        try {
            const now = new Date().toISOString();

            const { data, error } = await supabase
                .from('markup_proposals')
                .update({ status: 'expired' })
                .eq('status', 'pending')
                .lt('valid_until', now)
                .select('id');

            if (error) throw error;

            const expiredCount = data?.length || 0;

            console.log(`⏰ [Markup Engine] Expired ${expiredCount} old proposals`);

            return {
                success: true,
                data: expiredCount,
                message: `Expired ${expiredCount} proposals`
            };

        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }
}

// Singleton instance
export const markupEngine = new MarkupEngineService();
