/**
 * Helper to map room codes to full descriptions
 */
export const getRoomDescription = (code: string) => {
    if (!code) return '';
    const c = code.toUpperCase().trim();
    if (c === 'DBL') return 'Dvokrevetna soba (DBL)';
    if (c === 'SGL') return 'Jednokrevetna soba (SGL)';
    if (c === 'TRP') return 'Trokrevetna soba (TRP)';
    if (c === 'QDPL') return 'Četvorokrevetna soba (QDPL)';
    if (c === 'APP') return 'Apartman (APP)';
    if (c === 'STUDIO') return 'Studio';
    if (c === 'FAM') return 'Porodična soba (FAM)';
    return code; // Fallback to original
};

/**
 * Helper to map meal plan codes to full descriptions
 */
export const getMealPlanDescription = (plan: string) => {
    if (!plan) return '';
    const p = plan.toUpperCase().trim();

    // If it already follows the pattern "CODE - Name", keep it but maybe standardise
    if (p.includes(' - ')) return p;

    if (p === 'HB' || p === 'POLUPANSION') return 'HB - Polupansion';
    if (p === 'BB' || p === 'NOĆENJE SA DORUČKOM') return 'BB - Noćenje sa Doručkom';
    if (p === 'FB' || p === 'PUN PANSION') return 'FB - Pun Pansion';
    if (p === 'AI' || p === 'ALL INCLUSIVE') return 'AI - All Inclusive';
    if (p === 'UAI' || p === 'ULTRA ALL INCLUSIVE') return 'UAI - Ultra All Inclusive';
    if (p === 'RO' || p === 'NAJAM') return 'RO - Najam (Bez Ishrane)';
    if (p === 'PA') return 'PA - Pun Pansion';
    if (p === 'PP') return 'PP - Polupansion';
    if (p === 'ND') return 'ND - Noćenje sa Doručkom';

    return plan; // Fallback
};
