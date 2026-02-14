import { supabase } from '../supabaseClient';

export interface SmartOfferResponse {
    hotel_name: string;
    image_url: string;
    rating: number;
    price_total: string;
    booking_link: string;
    risk_score: 'Green' | 'Yellow' | 'Red';
}

/**
 * Fetches a personalized offer from the Decision Engine/Pricelist system.
 */
export async function get_smart_offer(
    destination: string,
    check_in: string,
    check_out: string
): Promise<SmartOfferResponse> {
    console.log(`🔍 [CONCIERGE] get_smart_offer for ${destination} (${check_in} to ${check_out})`);

    try {
        // Search for hotels in the pricelist
        const { data: pricelists, error } = await supabase
            .from('pricelists')
            .select('*, price_periods(*)')
            .ilike('location', `%${destination}%`)
            .eq('status', 'active')
            .limit(1);

        if (error || !pricelists || pricelists.length === 0) {
            // Fallback mock if nothing found
            return {
                hotel_name: "Hotel Mediterranean (Fallback)",
                image_url: "https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?auto=format&fit=crop&q=80&w=1000",
                rating: 5,
                price_total: "450 EUR",
                booking_link: "https://clicktotravel.ai/book/med-fallback",
                risk_score: 'Green'
            };
        }

        const hotel = pricelists[0];
        // Simple logic: if many periods or specific tags, it's Green. 
        // In a real system, this comes from a 'risk' column.
        const risk_score: 'Green' | 'Yellow' | 'Red' = hotel.title.toLowerCase().includes('exclusive') ? 'Green' : 'Yellow';

        return {
            hotel_name: hotel.title,
            image_url: hotel.image_url || "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&q=80&w=1000",
            rating: hotel.stars || 4,
            price_total: "Od " + (hotel.base_price || 399) + " EUR",
            booking_link: `https://clicktotravel.ai/book/${hotel.id}`,
            risk_score: risk_score
        };
    } catch (err) {
        console.error('Error in get_smart_offer:', err);
        return {
            hotel_name: "Error loading hotel",
            image_url: "",
            rating: 0,
            price_total: "N/A",
            booking_link: "#",
            risk_score: 'Red'
        };
    }
}

/**
 * Generates a "Flash Deal" discount for hesitant customers.
 */
export async function apply_dynamic_discount(hotel_id: string, urgency_level: 'low' | 'medium' | 'high') {
    console.log(`⚡ [CONCIERGE] apply_dynamic_discount for ${hotel_id} (urgency: ${urgency_level})`);

    const discounts = {
        low: { code: "SAVE5", percent: 5, expires_in: "1h" },
        medium: { code: "FLASH10", percent: 10, expires_in: "30min" },
        high: { code: "FINAL20", percent: 20, expires_in: "10min" }
    };

    return discounts[urgency_level];
}

/**
 * Returns technical safety details about VCC payments.
 */
export async function verify_vcc_security(supplier_name?: string) {
    console.log(`🔒 [CONCIERGE] verify_vcc_security for ${supplier_name || 'General'}`);

    return {
        technology: "Virtual Card Collaboration (VCC)",
        security_level: "High (PCI-DSS Level 1)",
        benefits: [
            "Jednokratni brojevi kartica",
            "Maksimalna zaštita od krađe podataka",
            "Trenutno poravnanje sa hotelom",
            "Bezbedno plaćanje u B2B sektoru"
        ]
    };
}

/**
 * Tools definition for Gemini function calling
 */
export const concierge_tools = [
    {
        functionDeclarations: [
            {
                name: "get_smart_offer",
                description: "Dohvata najbolje ponude hotela na osnovu destinacije i datuma. Koristi ovo kada korisnik traži ponudu ili preporuku.",
                parameters: {
                    type: "OBJECT",
                    properties: {
                        destination: { type: "STRING", description: "Grad ili regija (npr. 'Krf', 'Sarti', 'Zlatni Pjasci')" },
                        check_in: { type: "STRING", description: "Datum prijave u formatu YYYY-MM-DD" },
                        check_out: { type: "STRING", description: "Datum odjave u formatu YYYY-MM-DD" }
                    },
                    required: ["destination", "check_in", "check_out"]
                }
            },
            {
                name: "apply_dynamic_discount",
                description: "Generiše kod za popust za neodlučne korisnike.",
                parameters: {
                    type: "OBJECT",
                    properties: {
                        hotel_id: { type: "STRING", description: "Jedinstveni ID hotela" },
                        urgency_level: { type: "STRING", description: "Nivo hitnosti: low, medium, high" }
                    },
                    required: ["hotel_id", "urgency_level"]
                }
            },
            {
                name: "verify_vcc_security",
                description: "Dohvata informacije o bezbednosti plaćanja putem VCC tehnologije.",
                parameters: {
                    type: "OBJECT",
                    properties: {
                        supplier_name: { type: "STRING", description: "Opciono: ime dobavljača" }
                    }
                }
            }
        ]
    }
];
