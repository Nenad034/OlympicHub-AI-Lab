/**
 * Utility for handling meal plan transformations based on supplements.
 * Ensures clarity for hotels and clients by showing the final meal plan first,
 * followed by the original plan + supplement breakdown in parentheses.
 */

export const getEffectiveMealPlan = (mealPlan?: string): string => {
    if (!mealPlan) return "No Meals";

    const plan = mealPlan.trim();
    const upperPlan = plan.toUpperCase();

    // Mapping of short codes to full labels for the audit note
    const mealLabels: Record<string, string> = {
        'RO': 'RO',
        'RR': 'RO',
        'BB': 'BB',
        'HB': 'HB',
        'FB': 'FB',
        'AI': 'All Inclusive',
        'UAI': 'Ultra All Inclusive'
    };

    // Logic for HB supplement
    if (upperPlan.includes('BB') && (upperPlan.includes('HB SUPPL') || upperPlan.includes('DOPLATA ZA HB') || upperPlan.includes('+ HB'))) {
        return `HB (BB + doplata za HB)`;
    }

    // Logic for FB supplement from HB
    if (upperPlan.includes('HB') && (upperPlan.includes('FB SUPPL') || upperPlan.includes('DOPLATA ZA FB') || upperPlan.includes('+ FB'))) {
        return `FB (HB + doplata za FB)`;
    }

    // Logic for AI supplement from HB/BB
    if ((upperPlan.includes('BB') || upperPlan.includes('HB')) && (upperPlan.includes('AI SUPPL') || upperPlan.includes('DOPLATA ZA AI') || upperPlan.includes('+ AI'))) {
        return `All Inclusive (${plan.includes('BB') ? 'BB' : 'HB'} + doplata za AI)`;
    }

    // Default return if no supplement pattern is matched
    return plan;
};
