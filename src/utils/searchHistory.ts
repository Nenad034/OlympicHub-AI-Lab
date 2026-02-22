/**
 * Search History Utility
 * 
 * Handles persistence of hotel, flight and package searches to Supabase.
 */

import { supabase } from '../supabaseClient';

export interface SearchEntry {
    search_type: 'hotels' | 'flights' | 'packages' | 'services';
    search_params: any;
    results_count?: number;
    best_price?: number;
    providers_searched?: string[];
    user_id?: string;
}

export const searchHistory = {
    /**
     * Save a search attempt to the cloud
     */
    async logSearch(entry: SearchEntry) {
        try {
            const { error } = await supabase
                .from('search_history')
                .insert([{
                    ...entry,
                    created_at: new Date().toISOString()
                }]);

            if (error) throw error;
        } catch (error) {
            console.error('Failed to log search history:', error);
        }
    },

    /**
     * Get recent searches
     */
    async getRecent(limit = 20) {
        try {
            const { data, error } = await supabase
                .from('search_history')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(limit);

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Failed to fetch search history:', error);
            return [];
        }
    }
};

export default searchHistory;
