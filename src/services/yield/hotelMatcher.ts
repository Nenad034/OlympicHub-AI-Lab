/**
 * Hotel Matcher Service
 * Fuzzy matching and deduplication of hotels from different sources
 * Uses Levenshtein distance and similarity scoring
 */

import { supabase } from '../../supabaseClient';
import type { HotelMatch, HotelVariant, YieldApiResponse } from './types';

export class HotelMatcherService {
    private readonly SIMILARITY_THRESHOLD = 0.75; // 75% similarity required

    /**
     * Calculate Levenshtein distance between two strings
     */
    private levenshteinDistance(str1: string, str2: string): number {
        const len1 = str1.length;
        const len2 = str2.length;
        const matrix: number[][] = [];

        for (let i = 0; i <= len1; i++) {
            matrix[i] = [i];
        }

        for (let j = 0; j <= len2; j++) {
            matrix[0][j] = j;
        }

        for (let i = 1; i <= len1; i++) {
            for (let j = 1; j <= len2; j++) {
                const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
                matrix[i][j] = Math.min(
                    matrix[i - 1][j] + 1,      // deletion
                    matrix[i][j - 1] + 1,      // insertion
                    matrix[i - 1][j - 1] + cost // substitution
                );
            }
        }

        return matrix[len1][len2];
    }

    /**
     * Calculate similarity score (0-1) between two hotel names
     */
    calculateSimilarity(name1: string, name2: string): number {
        // Normalize names
        const normalized1 = this.normalizeHotelName(name1);
        const normalized2 = this.normalizeHotelName(name2);

        // Calculate Levenshtein distance
        const distance = this.levenshteinDistance(normalized1, normalized2);
        const maxLength = Math.max(normalized1.length, normalized2.length);

        // Convert to similarity score (0-1)
        const similarity = 1 - (distance / maxLength);

        return Math.round(similarity * 100) / 100;
    }

    /**
     * Normalize hotel name for comparison
     */
    private normalizeHotelName(name: string): string {
        return name
            .toLowerCase()
            .replace(/hotel/gi, '')
            .replace(/resort/gi, '')
            .replace(/\d+\*/g, '') // Remove star ratings (e.g., "5*")
            .replace(/&amp;/g, '&')
            .replace(/[^\w\s&]/g, '') // Remove special characters except &
            .replace(/\s+/g, ' ') // Normalize whitespace
            .trim();
    }

    /**
     * Find matching hotels across different sources
     */
    async findMatches(
        hotelName: string,
        source: string,
        location?: string,
        stars?: number
    ): Promise<YieldApiResponse<HotelMatch | null>> {
        try {
            console.log(`🔍 [Hotel Matcher] Finding matches for: ${hotelName} (${source})`);

            // 1. Check if this hotel already has a master record
            const existingMatch = await this.findExistingMatch(hotelName, source);
            if (existingMatch) {
                console.log('✅ [Hotel Matcher] Found existing match:', existingMatch.master_hotel_name);
                return {
                    success: true,
                    data: existingMatch
                };
            }

            // 2. Search for similar hotels in the database
            const { data: allMatches, error } = await supabase
                .from('hotel_matches')
                .select('*');

            if (error) throw error;

            // 3. Find best match using fuzzy matching
            let bestMatch: HotelMatch | null = null;
            let bestScore = 0;

            ((allMatches || []) as HotelMatch[]).forEach((match: HotelMatch) => {
                const score = this.calculateSimilarity(hotelName, match.master_hotel_name);

                // Also check variants
                (match.variants || []).forEach((variant: HotelVariant) => {
                    const variantScore = this.calculateSimilarity(hotelName, variant.name);
                    if (variantScore > score && variantScore > bestScore) {
                        bestScore = variantScore;
                        bestMatch = match;
                    }
                });

                if (score > bestScore) {
                    bestScore = score;
                    bestMatch = match;
                }
            });

            // 4. If similarity is above threshold, return existing match
            if (bestMatch && bestScore >= this.SIMILARITY_THRESHOLD) {
                console.log(`✅ [Hotel Matcher] Match found: ${bestMatch.master_hotel_name} (${bestScore * 100}% similar)`);

                // Add this variant to the match if not already present
                await this.addVariantToMatch(bestMatch.id!, source, hotelName, bestScore);

                return {
                    success: true,
                    data: bestMatch
                };
            }

            // 5. No match found - create new master record
            console.log('🆕 [Hotel Matcher] No match found, creating new master record');

            const newMatch = await this.createMasterRecord(hotelName, source, location, stars);

            return {
                success: true,
                data: newMatch
            };

        } catch (error) {
            console.error('❌ [Hotel Matcher] Error:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }

    /**
     * Find existing match for a hotel from a specific source
     */
    private async findExistingMatch(hotelName: string, source: string): Promise<HotelMatch | null> {
        try {
            const { data, error } = await supabase
                .from('hotel_matches')
                .select('*')
                .contains('variants', [{ source, name: hotelName }]);

            if (error) throw error;

            return data && data.length > 0 ? (data[0] as HotelMatch) : null;
        } catch (error) {
            console.error('[Hotel Matcher] Find existing error:', error);
            return null;
        }
    }

    /**
     * Create a new master hotel record
     */
    private async createMasterRecord(
        hotelName: string,
        source: string,
        location?: string,
        stars?: number
    ): Promise<HotelMatch> {
        const newMatch: Partial<HotelMatch> = {
            master_hotel_name: hotelName,
            master_hotel_location: location,
            master_hotel_stars: stars,
            variants: [{
                source,
                name: hotelName,
                similarity_score: 1.0
            }],
            matching_algorithm: 'fuzzy',
            confidence_score: 1.0,
            manually_verified: false
        };

        const { data, error } = await supabase
            .from('hotel_matches')
            .insert(newMatch)
            .select()
            .single();

        if (error) throw error;

        return data as HotelMatch;
    }

    /**
     * Add a variant to an existing match
     */
    private async addVariantToMatch(
        matchId: string,
        source: string,
        name: string,
        similarityScore: number
    ): Promise<void> {
        try {
            // Fetch current match
            const { data: currentMatch, error: fetchError } = await supabase
                .from('hotel_matches')
                .select('variants')
                .eq('id', matchId)
                .single();

            if (fetchError) throw fetchError;

            const variants = currentMatch.variants as HotelVariant[];

            // Check if variant already exists
            const variantExists = variants.some(v => v.source === source && v.name === name);
            if (variantExists) return;

            // Add new variant
            variants.push({
                source,
                name,
                similarity_score: similarityScore
            });

            // Update match
            const { error: updateError } = await supabase
                .from('hotel_matches')
                .update({ variants })
                .eq('id', matchId);

            if (updateError) throw updateError;

            console.log(`✅ [Hotel Matcher] Added variant: ${name} (${source})`);

        } catch (error) {
            console.error('[Hotel Matcher] Add variant error:', error);
        }
    }

    /**
     * Deduplicate a list of hotels from different sources
     */
    async deduplicateHotels(
        hotels: Array<{
            name: string;
            source: string;
            price: number;
            location?: string;
            stars?: number;
        }>
    ): Promise<Array<{
        master_name: string;
        sources: string[];
        lowest_price: number;
        all_prices: Array<{ source: string; price: number }>;
    }>> {
        const grouped = new Map<string, any>();

        for (const hotel of hotels) {
            const matchResult = await this.findMatches(
                hotel.name,
                hotel.source,
                hotel.location,
                hotel.stars
            );

            if (matchResult.success && matchResult.data) {
                const masterName = matchResult.data.master_hotel_name;

                if (!grouped.has(masterName)) {
                    grouped.set(masterName, {
                        master_name: masterName,
                        sources: [],
                        lowest_price: Infinity,
                        all_prices: []
                    });
                }

                const group = grouped.get(masterName);
                group.sources.push(hotel.source);
                group.all_prices.push({ source: hotel.source, price: hotel.price });
                group.lowest_price = Math.min(group.lowest_price, hotel.price);
            }
        }

        return Array.from(grouped.values());
    }

    /**
     * Manually verify a hotel match
     */
    async verifyMatch(matchId: string, userId: string): Promise<YieldApiResponse<void>> {
        try {
            const { error } = await supabase
                .from('hotel_matches')
                .update({
                    manually_verified: true,
                    verified_by: userId,
                    verified_at: new Date().toISOString()
                })
                .eq('id', matchId);

            if (error) throw error;

            return {
                success: true,
                message: 'Match verified successfully'
            };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }

    /**
     * Get all hotel matches
     */
    async getAllMatches(): Promise<YieldApiResponse<HotelMatch[]>> {
        try {
            const { data, error } = await supabase
                .from('hotel_matches')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;

            return {
                success: true,
                data: (data || []) as HotelMatch[]
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
export const hotelMatcher = new HotelMatcherService();
