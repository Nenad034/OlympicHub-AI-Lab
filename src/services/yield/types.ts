/**
 * Yield Management & Dynamic Pricing Types
 * Created: 2026-02-08
 */

// ============================================
// COMPETITOR PRICING TYPES
// ============================================

export interface CompetitorPrice {
    id?: string;
    competitor_name: 'travelland' | 'bigblue' | 'filiptravel';
    competitor_url: string;
    hotel_name: string;
    hotel_location?: string;
    hotel_stars?: number;
    destination: string;
    check_in: string; // YYYY-MM-DD
    check_out: string;
    nights: number;
    adults: number;
    children?: number;
    price: number;
    currency: string;
    meal_plan?: string;
    room_type?: string;
    scraped_at?: string;
    scrape_session_id?: string;
    is_available: boolean;
}

export interface CompetitorScrapingTarget {
    name: 'travelland' | 'bigblue' | 'filiptravel';
    url: string;
    enabled: boolean;
    selectors: {
        hotelName: string;
        price: string;
        availability: string;
        mealPlan?: string;
        roomType?: string;
    };
}

// ============================================
// PRICE INTELLIGENCE TYPES
// ============================================

export interface ProviderPrice {
    provider: 'solvex' | 'tct' | 'opengreece' | 'ors' | 'mars';
    price: number;
    currency: string;
    available: boolean;
    room_type?: string;
    meal_plan?: string;
    metadata?: Record<string, any>;
}

export interface PriceIntelligenceLog {
    id?: string;
    service_type: 'hotel' | 'package' | 'charter' | 'transfer';
    service_id?: string;
    hotel_name?: string;
    destination?: string;
    check_in?: string;
    check_out?: string;
    search_params?: Record<string, any>;
    provider_prices: ProviderPrice[];
    competitor_prices?: CompetitorPrice[];
    lowest_provider?: string;
    lowest_price?: number;
    competitor_avg_price?: number;
    price_advantage?: number; // Positive = we're cheaper, Negative = we're more expensive
    timestamp?: string;
    session_id?: string;
    user_id?: string;
}

// ============================================
// MARKUP PROPOSAL TYPES
// ============================================

export interface MarkupCalculationFactors {
    competitor_price?: number;
    season: 'low' | 'medium' | 'high';
    demand: 'low' | 'medium' | 'high';
    risk: 'low' | 'medium' | 'high';
    days_to_departure?: number;
    occupancy_rate?: number;
    historical_conversion_rate?: number;
}

export interface MarkupProposal {
    id?: string;
    service_type: 'hotel' | 'package' | 'charter' | 'transfer';
    service_id?: string;
    hotel_name?: string;
    destination?: string;

    // Pricing
    base_cost: number;
    competitor_avg_price?: number;
    current_markup_percent?: number;
    current_selling_price?: number;
    proposed_markup_percent: number;
    proposed_selling_price: number;

    // Calculation
    calculation_factors?: MarkupCalculationFactors;

    // Approval
    status: 'pending' | 'approved' | 'rejected' | 'expired';
    proposed_by?: string;
    proposed_at?: string;
    reviewed_by?: string;
    reviewed_at?: string;
    review_notes?: string;

    // Auto-approval
    auto_approved?: boolean;
    auto_approval_reason?: string;

    // Validity
    valid_from?: string;
    valid_until?: string;

    created_at?: string;
    updated_at?: string;
}

// ============================================
// MARKUP HISTORY TYPES
// ============================================

export interface MarkupHistory {
    id?: string;
    proposal_id?: string;
    service_type: 'hotel' | 'package' | 'charter' | 'transfer';
    service_id?: string;
    hotel_name?: string;
    old_markup_percent?: number;
    new_markup_percent?: number;
    old_price?: number;
    new_price?: number;
    change_reason: string;
    trigger_data?: Record<string, any>;
    changed_by?: string;
    changed_at?: string;
    sales_before?: number;
    sales_after?: number;
    revenue_impact?: number;
}

// ============================================
// SCRAPING SESSION TYPES
// ============================================

export interface ScrapingSession {
    id?: string;
    session_type: 'scheduled' | 'manual' | 'on_demand';
    target_competitors: string[];
    destinations?: string[];
    date_ranges?: Array<{ check_in: string; check_out: string }>;
    status: 'running' | 'completed' | 'failed' | 'partial';
    started_at?: string;
    completed_at?: string;
    total_prices_scraped?: number;
    successful_scrapes?: number;
    failed_scrapes?: number;
    errors?: Array<{ competitor: string; error: string }>;
    duration_seconds?: number;
    triggered_by?: string;
    created_at?: string;
}

// ============================================
// HOTEL MATCHING TYPES
// ============================================

export interface HotelVariant {
    source: string;
    name: string;
    similarity_score: number;
}

export interface HotelMatch {
    id?: string;
    master_hotel_name: string;
    master_hotel_location?: string;
    master_hotel_stars?: number;
    variants: HotelVariant[];
    matching_algorithm: 'fuzzy' | 'manual' | 'ai';
    confidence_score?: number;
    manually_verified?: boolean;
    verified_by?: string;
    verified_at?: string;
    created_at?: string;
    updated_at?: string;
}

// ============================================
// YIELD SETTINGS TYPES
// ============================================

export interface YieldSettings {
    id?: string;
    setting_type: 'global' | 'seasonal' | 'destination_specific';
    default_markup_percent: number;
    min_markup_percent: number;
    max_markup_percent: number;
    auto_approve_threshold_percent: number;
    match_competitor_price: boolean;
    undercut_competitor_by_percent: number;
    scraping_frequency: 'hourly' | 'daily' | 'weekly';
    scraping_enabled: boolean;
    notify_on_price_change: boolean;
    notify_on_competitor_lower_price: boolean;
    active: boolean;
    created_at?: string;
    updated_at?: string;
}

// ============================================
// SEARCH & FILTER TYPES
// ============================================

export interface PriceSearchParams {
    destination?: string;
    hotel_name?: string;
    check_in?: string;
    check_out?: string;
    adults?: number;
    children?: number;
    providers?: string[];
    include_competitors?: boolean;
}

export interface MarkupProposalFilters {
    status?: ('pending' | 'approved' | 'rejected' | 'expired')[];
    service_type?: ('hotel' | 'package' | 'charter' | 'transfer')[];
    date_from?: string;
    date_to?: string;
    min_markup?: number;
    max_markup?: number;
}

// ============================================
// DASHBOARD STATISTICS TYPES
// ============================================

export interface YieldDashboardStats {
    total_proposals: number;
    pending_proposals: number;
    approved_today: number;
    rejected_today: number;

    avg_markup_percent: number;
    avg_competitor_advantage: number; // How much cheaper we are on average

    total_scraped_prices: number;
    last_scrape_time?: string;
    next_scrape_time?: string;

    active_hotels_tracked: number;
    competitors_monitored: number;
}

export interface CompetitorPriceComparison {
    hotel_name: string;
    destination: string;
    our_price: number;
    competitor_prices: Array<{
        competitor: string;
        price: number;
        difference: number;
        difference_percent: number;
    }>;
    lowest_competitor_price: number;
    our_advantage: number; // Positive = we're cheaper
}

// ============================================
// API RESPONSE TYPES
// ============================================

export interface YieldApiResponse<T> {
    success: boolean;
    data?: T;
    error?: string;
    message?: string;
}

export interface PriceAggregationResult {
    hotel_name: string;
    destination: string;
    check_in: string;
    check_out: string;
    provider_prices: ProviderPrice[];
    competitor_prices: CompetitorPrice[];
    lowest_price: number;
    lowest_provider: string;
    recommended_markup: number;
    recommended_selling_price: number;
    price_advantage: number;
}
