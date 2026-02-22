import { supabase } from '../../supabaseClient';

export interface Pricelist {
    id?: string;
    title: string;
    supplier_id?: string;
    property_id?: string;
    service_type: string;
    global_margin_percent: number;
    global_margin_amount: number;
    contract_number?: string;
    status: 'draft' | 'active' | 'archived';
    calculation_model: string;
    created_at?: string;
    updated_at?: string;
}

export interface PricePeriod {
    id?: string;
    pricelist_id: string;
    date_from: string;
    date_to: string;
    room_type_name: string;
    net_price: number;
    provision_percent: number;
    days_of_week: boolean[];
    min_stay: number;
    max_stay?: number;
}

export const pricingService = {
    async createPricelist(pricelist: Pricelist) {
        const { data, error } = await supabase
            .from('pricelists')
            .insert([pricelist])
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async addPricePeriods(periods: PricePeriod[]) {
        const { data, error } = await supabase
            .from('price_periods')
            .insert(periods)
            .select();

        if (error) throw error;
        return data;
    },

    async getPricelists() {
        const { data, error } = await supabase
            .from('pricelists')
            .select(`
                *,
                price_periods (*)
            `)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data;
    },

    async deletePricelist(id: string) {
        const { error } = await supabase
            .from('pricelists')
            .delete()
            .eq('id', id);

        if (error) throw error;
    }
};
