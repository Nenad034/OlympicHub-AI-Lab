/**
 * Price Aggregator Service
 * Aggregates prices from multiple providers (Solvex, TCT, OpenGreece, ORS, Mars)
 * and competitor scraping data
 */

import { supabase } from '../../supabaseClient';
import type {
    PriceSearchParams,
    ProviderPrice,
    CompetitorPrice,
    PriceAggregationResult,
    PriceIntelligenceLog,
    YieldApiResponse
} from './types';

// Import existing provider services
import { searchHotels as searchSolvex } from '../solvex/solvexHotelService';
import { searchHotelsSync as searchTCT } from '../tctApiService';
import { searchHotels as searchOpenGreece } from '../opengreece/opengreeceService';

export class PriceAggregatorService {
    /**
     * Aggregates prices from all enabled providers
     */
    async aggregatePrices(params: PriceSearchParams): Promise<YieldApiResponse<PriceAggregationResult>> {
        try {
            console.log('🔍 [Price Aggregator] Starting price aggregation...', params);

            // 1. Fetch prices from all providers in parallel
            const providerResults = await Promise.allSettled([
                this.fetchSolvexPrices(params),
                this.fetchTCTPrices(params),
                this.fetchOpenGreecePrices(params),
                // Add more providers as needed
            ]);

            // 2. Collect successful results
            const providerPrices: ProviderPrice[] = [];
            providerResults.forEach((result, index) => {
                if (result.status === 'fulfilled' && result.value) {
                    providerPrices.push(...result.value);
                } else if (result.status === 'rejected') {
                    console.warn(`Provider ${index} failed:`, result.reason);
                }
            });

            if (providerPrices.length === 0) {
                return {
                    success: false,
                    error: 'No prices found from any provider'
                };
            }

            // 3. Fetch competitor prices (if available)
            const competitorPrices = await this.fetchCompetitorPrices(params);

            // 4. Find lowest price
            const lowestProviderPrice = providerPrices.reduce((min, current) =>
                current.price < min.price ? current : min
            );

            // 5. Calculate competitor average
            const competitorAvg = competitorPrices.length > 0
                ? competitorPrices.reduce((sum, c) => sum + c.price, 0) / competitorPrices.length
                : 0;

            // 6. Calculate recommended markup
            const recommendedMarkup = await this.calculateRecommendedMarkup(
                lowestProviderPrice.price,
                competitorAvg,
                params
            );

            const recommendedSellingPrice = lowestProviderPrice.price * (1 + recommendedMarkup / 100);
            const priceAdvantage = competitorAvg > 0 ? competitorAvg - recommendedSellingPrice : 0;

            // 7. Log to database
            await this.logPriceIntelligence({
                service_type: 'hotel',
                hotel_name: params.hotel_name,
                destination: params.destination,
                check_in: params.check_in,
                check_out: params.check_out,
                search_params: params,
                provider_prices: providerPrices,
                competitor_prices: competitorPrices,
                lowest_provider: lowestProviderPrice.provider,
                lowest_price: lowestProviderPrice.price,
                competitor_avg_price: competitorAvg,
                price_advantage: priceAdvantage
            });

            // 8. Return aggregated result
            const result: PriceAggregationResult = {
                hotel_name: params.hotel_name || 'Unknown',
                destination: params.destination || 'Unknown',
                check_in: params.check_in || '',
                check_out: params.check_out || '',
                provider_prices: providerPrices,
                competitor_prices: competitorPrices,
                lowest_price: lowestProviderPrice.price,
                lowest_provider: lowestProviderPrice.provider,
                recommended_markup: recommendedMarkup,
                recommended_selling_price: recommendedSellingPrice,
                price_advantage: priceAdvantage
            };

            console.log('✅ [Price Aggregator] Aggregation complete:', result);

            return {
                success: true,
                data: result
            };

        } catch (error) {
            console.error('❌ [Price Aggregator] Error:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }

    /**
     * Fetch prices from Solvex
     */
    private async fetchSolvexPrices(params: PriceSearchParams): Promise<ProviderPrice[]> {
        try {
            // Call your existing Solvex service
            // This is a placeholder - adapt to your actual Solvex implementation
            const results: ProviderPrice[] = [];

            // Example: If you have a search function that returns hotels
            // const solvexResults = await searchSolvex({ ... });
            // results.push({
            //     provider: 'solvex',
            //     price: solvexResults.price,
            //     currency: 'EUR',
            //     available: true
            // });

            return results;
        } catch (error) {
            console.error('[Solvex] Fetch error:', error);
            return [];
        }
    }

    /**
     * Fetch prices from TCT
     */
    private async fetchTCTPrices(params: PriceSearchParams): Promise<ProviderPrice[]> {
        try {
            const results: ProviderPrice[] = [];

            // Example TCT integration
            // const tctResults = await searchTCT({ ... });
            // results.push({
            //     provider: 'tct',
            //     price: tctResults.price,
            //     currency: 'EUR',
            //     available: true
            // });

            return results;
        } catch (error) {
            console.error('[TCT] Fetch error:', error);
            return [];
        }
    }

    /**
     * Fetch prices from OpenGreece
     */
    private async fetchOpenGreecePrices(params: PriceSearchParams): Promise<ProviderPrice[]> {
        try {
            const results: ProviderPrice[] = [];

            // Example OpenGreece integration
            // const ogResults = await searchOpenGreece({ ... });
            // results.push({
            //     provider: 'opengreece',
            //     price: ogResults.price,
            //     currency: 'EUR',
            //     available: true
            // });

            return results;
        } catch (error) {
            console.error('[OpenGreece] Fetch error:', error);
            return [];
        }
    }

    /**
     * Fetch competitor prices from database
     */
    private async fetchCompetitorPrices(params: PriceSearchParams): Promise<CompetitorPrice[]> {
        try {
            const { data, error } = await supabase
                .from('competitor_prices')
                .select('*')
                .eq('destination', params.destination || '')
                .gte('check_in', params.check_in || '')
                .lte('check_in', params.check_out || '')
                .eq('is_available', true)
                .order('scraped_at', { ascending: false })
                .limit(50);

            if (error) throw error;

            return (data || []) as CompetitorPrice[];
        } catch (error) {
            console.error('[Competitor Prices] Fetch error:', error);
            return [];
        }
    }

    /**
     * Calculate recommended markup based on market conditions
     */
    private async calculateRecommendedMarkup(
        baseCost: number,
        competitorAvg: number,
        params: PriceSearchParams
    ): Promise<number> {
        try {
            // Fetch yield settings
            const { data: settings } = await supabase
                .from('yield_settings')
                .select('*')
                .eq('setting_type', 'global')
                .eq('active', true)
                .single();

            const defaultMarkup = settings?.default_markup_percent || 15;
            const minMarkup = settings?.min_markup_percent || 5;
            const maxMarkup = settings?.max_markup_percent || 30;

            // If no competitor data, use default
            if (!competitorAvg || competitorAvg === 0) {
                return defaultMarkup;
            }

            // Calculate competitive markup
            let recommendedMarkup = defaultMarkup;

            // If competitors are cheaper, reduce markup
            const competitorMarkup = ((competitorAvg - baseCost) / baseCost) * 100;

            if (competitorMarkup < defaultMarkup) {
                // Undercut competitor by configured percentage
                const undercutBy = settings?.undercut_competitor_by_percent || 2;
                recommendedMarkup = Math.max(competitorMarkup - undercutBy, minMarkup);
            }

            // Ensure within bounds
            recommendedMarkup = Math.max(minMarkup, Math.min(maxMarkup, recommendedMarkup));

            console.log(`💰 [Markup Calculator] Base: ${baseCost}, Competitor: ${competitorAvg}, Recommended: ${recommendedMarkup}%`);

            return Math.round(recommendedMarkup * 100) / 100;

        } catch (error) {
            console.error('[Markup Calculator] Error:', error);
            return 15; // Fallback to default
        }
    }

    /**
     * Log price intelligence to database
     */
    private async logPriceIntelligence(log: Partial<PriceIntelligenceLog>): Promise<void> {
        try {
            const { error } = await supabase
                .from('price_intelligence_log')
                .insert({
                    ...log,
                    timestamp: new Date().toISOString()
                });

            if (error) throw error;

            console.log('📊 [Price Intelligence] Logged successfully');
        } catch (error) {
            console.error('[Price Intelligence] Log error:', error);
        }
    }

    /**
     * Get price history for a hotel
     */
    async getPriceHistory(hotelName: string, days: number = 30): Promise<YieldApiResponse<PriceIntelligenceLog[]>> {
        try {
            const dateFrom = new Date();
            dateFrom.setDate(dateFrom.getDate() - days);

            const { data, error } = await supabase
                .from('price_intelligence_log')
                .select('*')
                .eq('hotel_name', hotelName)
                .gte('timestamp', dateFrom.toISOString())
                .order('timestamp', { ascending: false });

            if (error) throw error;

            return {
                success: true,
                data: (data || []) as PriceIntelligenceLog[]
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
export const priceAggregator = new PriceAggregatorService();
