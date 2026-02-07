import { supabase } from '../../supabaseClient';

// ============================================
// TYPES
// ============================================

export interface Pricelist {
    id?: string;
    title: string;
    internal_code?: string;
    product: {
        service: string;
        prefix: string;
        type: string;
        view: string;
        name: string;
    };
    booking_from?: string;
    booking_to?: string;
    stay_from?: string;
    stay_to?: string;
    status?: 'draft' | 'active' | 'archived';
    property_id?: string;
    created_by?: string;
    created_at?: string;
    updated_at?: string;
}

export interface PricePeriod {
    id?: string;
    pricelist_id?: string;
    date_from: string;
    date_to: string;
    basis: 'PER_PERSON_DAY' | 'PER_ROOM_DAY' | 'PER_UNIT_STAY';
    net_price: number;
    provision_percent: number;
    gross_price?: number;
    currency?: string;
    min_stay: number;
    max_stay?: number | null;
    release_days: number;
    min_adults: number;
    max_adults: number;
    min_children: number;
    max_children: number;
    arrival_days: number[];
    sort_order?: number;
}

export interface PriceRule {
    id?: string;
    pricelist_id?: string;
    rule_type: 'SUPPLEMENT' | 'DISCOUNT' | 'TAX';
    title: string;
    net_price?: number;
    provision_percent?: number;
    percent_value?: number;
    fixed_value?: number;
    days_before_arrival?: number;
    child_age_from?: number | null;
    child_age_to?: number | null;
    min_adults?: number | null;
    min_children?: number | null;
    is_mandatory?: boolean;
    sort_order?: number;
}

// ============================================
// PRICELIST CRUD
// ============================================

/**
 * Kreira novi cenovnik sa svim periodima i pravilima
 */
export async function createPricelist(
    pricelist: Pricelist,
    periods: PricePeriod[],
    rules: PriceRule[]
): Promise<{ data: Pricelist | null; error: any }> {
    try {
        // 1. Insert pricelist
        const { data: pricelistData, error: pricelistError } = await supabase
            .from('pricelists')
            .insert({
                title: pricelist.title,
                internal_code: pricelist.internal_code,
                product: pricelist.product,
                booking_from: pricelist.booking_from,
                booking_to: pricelist.booking_to,
                stay_from: pricelist.stay_from,
                stay_to: pricelist.stay_to,
                status: pricelist.status || 'draft',
                property_id: pricelist.property_id,
                created_by: pricelist.created_by
            })
            .select()
            .single();

        if (pricelistError) throw pricelistError;

        const pricelistId = pricelistData.id;

        // 2. Insert periods
        if (periods.length > 0) {
            const periodsToInsert = periods.map((p, idx) => ({
                pricelist_id: pricelistId,
                date_from: p.date_from,
                date_to: p.date_to,
                basis: p.basis,
                net_price: p.net_price,
                provision_percent: p.provision_percent,
                currency: p.currency || 'EUR',
                min_stay: p.min_stay,
                max_stay: p.max_stay,
                release_days: p.release_days,
                min_adults: p.min_adults,
                max_adults: p.max_adults,
                min_children: p.min_children,
                max_children: p.max_children,
                arrival_days: p.arrival_days,
                sort_order: idx
            }));

            const { error: periodsError } = await supabase
                .from('price_periods')
                .insert(periodsToInsert);

            if (periodsError) throw periodsError;
        }

        // 3. Insert rules
        if (rules.length > 0) {
            const rulesToInsert = rules.map((r, idx) => ({
                pricelist_id: pricelistId,
                rule_type: r.rule_type,
                title: r.title,
                net_price: r.net_price,
                provision_percent: r.provision_percent,
                percent_value: r.percent_value,
                fixed_value: r.fixed_value,
                days_before_arrival: r.days_before_arrival,
                child_age_from: r.child_age_from,
                child_age_to: r.child_age_to,
                min_adults: r.min_adults,
                min_children: r.min_children,
                is_mandatory: r.is_mandatory || false,
                sort_order: idx
            }));

            const { error: rulesError } = await supabase
                .from('price_rules')
                .insert(rulesToInsert);

            if (rulesError) throw rulesError;
        }

        return { data: pricelistData, error: null };
    } catch (error) {
        console.error('Error creating pricelist:', error);
        return { data: null, error };
    }
}

/**
 * Učitava listu svih cenovnika (summary view)
 */
export async function getPricelists(status?: string): Promise<{ data: Pricelist[]; error: any }> {
    let query = supabase
        .from('pricelists')
        .select('*');

    if (status) {
        query = query.eq('status', status);
    }

    const { data, error } = await query.order('updated_at', { ascending: false });
    return { data: data || [], error };
}

/**
 * Učitava kompletan cenovnik sa periodima i pravilima
 */
export async function getPricelistWithDetails(id: string): Promise<{
    pricelist: Pricelist | null;
    periods: PricePeriod[];
    rules: PriceRule[];
    error: any;
}> {
    try {
        // Fetch pricelist
        const { data: pricelist, error: plError } = await supabase
            .from('pricelists')
            .select('*')
            .eq('id', id)
            .single();

        if (plError) throw plError;

        // Fetch periods
        const { data: periods, error: perError } = await supabase
            .from('price_periods')
            .select('*')
            .eq('pricelist_id', id)
            .order('sort_order', { ascending: true });

        if (perError) throw perError;

        // Fetch rules
        const { data: rules, error: ruleError } = await supabase
            .from('price_rules')
            .select('*')
            .eq('pricelist_id', id)
            .order('sort_order', { ascending: true });

        if (ruleError) throw ruleError;

        return {
            pricelist,
            periods: periods || [],
            rules: rules || [],
            error: null
        };
    } catch (error) {
        console.error('Error fetching pricelist details:', error);
        return { pricelist: null, periods: [], rules: [], error };
    }
}

/**
 * Ažurira status cenovnika
 */
export async function updatePricelistStatus(
    id: string,
    status: 'draft' | 'active' | 'archived'
): Promise<{ error: any }> {
    const { error } = await supabase
        .from('pricelists')
        .update({ status })
        .eq('id', id);

    return { error };
}

/**
 * Briše cenovnik (cascade briše periode i pravila)
 */
export async function deletePricelist(id: string): Promise<{ error: any }> {
    const { error } = await supabase
        .from('pricelists')
        .delete()
        .eq('id', id);

    return { error };
}

/**
 * Duplicira cenovnik
 */
export async function duplicatePricelist(id: string, newTitle: string): Promise<{ data: Pricelist | null; error: any }> {
    const { pricelist, periods, rules, error } = await getPricelistWithDetails(id);

    if (error || !pricelist) {
        return { data: null, error: error || new Error('Pricelist not found') };
    }

    // Remove IDs and update title
    const newPricelist: Pricelist = {
        ...pricelist,
        id: undefined,
        title: newTitle,
        status: 'draft',
        created_at: undefined,
        updated_at: undefined
    };

    const newPeriods = periods.map(p => ({ ...p, id: undefined, pricelist_id: undefined }));
    const newRules = rules.map(r => ({ ...r, id: undefined, pricelist_id: undefined }));

    return createPricelist(newPricelist, newPeriods, newRules);
}
