// Pricing Rules Generator - Kombinatorika

import type { PersonCategory, BedOccupant, PricingRule, RoomTypePricing } from '../types/pricing.types';
import type { RoomType } from '../types/property.types';

// Re-export types for convenience
export type { PersonCategory, BedOccupant, PricingRule, RoomTypePricing } from '../types/pricing.types';

/**
 * Generates all pricing rules for a room type based on occupancy variants and person categories
 */
export function generatePricingRules(
    roomType: RoomType,
    personCategories: PersonCategory[],
    includePermutations: boolean = false
): PricingRule[] {
    const rules: PricingRule[] = [];

    if (!roomType.allowedOccupancyVariants || roomType.allowedOccupancyVariants.length === 0) {
        return rules;
    }

    // For each occupancy variant from RoomsStep
    for (const variantKey of roomType.allowedOccupancyVariants) {
        // Parse: "2ADL_1CHD" → { adults: 2, children: 1 }
        const { adults, children } = parseVariantKey(variantKey);

        if (children === 0) {
            // No children - only adults
            const bedAssignment = createBedAssignment(
                roomType.osnovniKreveti || 0,
                roomType.pomocniKreveti || 0,
                adults,
                []
            );

            rules.push(createPricingRule(bedAssignment));
        } else {
            // Generate all combinations of child categories
            const childCategories = personCategories.filter(c => c.code.startsWith('CHD'));
            const childCombinations = generateCombinations(
                childCategories,
                children,
                includePermutations
            );

            for (const childCombo of childCombinations) {
                const bedAssignment = createBedAssignment(
                    roomType.osnovniKreveti || 0,
                    roomType.pomocniKreveti || 0,
                    adults,
                    childCombo
                );

                rules.push(createPricingRule(bedAssignment));
            }
        }
    }

    return rules;
}

/**
 * Parse variant key like "2ADL_1CHD" into { adults: 2, children: 1 }
 */
function parseVariantKey(key: string): { adults: number; children: number } {
    const match = key.match(/(\d+)ADL_(\d+)CHD/);
    if (!match) {
        return { adults: 0, children: 0 };
    }
    return {
        adults: parseInt(match[1], 10),
        children: parseInt(match[2], 10)
    };
}

/**
 * Create bed assignment following Excel logic:
 * - ADL fill basic beds first, then extra beds
 * - CHD fill remaining basic beds, then extra beds
 */
function createBedAssignment(
    osnovni: number,
    pomocni: number,
    adults: number,
    childCategories: PersonCategory[]
): BedOccupant[] {
    const assignment: BedOccupant[] = [];
    let adultsPlaced = 0;
    let childrenPlaced = 0;

    // Fill basic beds
    for (let i = 0; i < osnovni; i++) {
        if (adultsPlaced < adults) {
            assignment.push({
                bedType: 'osnovni',
                bedIndex: i,
                personCategory: 'ADL'
            });
            adultsPlaced++;
        } else if (childrenPlaced < childCategories.length) {
            assignment.push({
                bedType: 'osnovni',
                bedIndex: i,
                personCategory: childCategories[childrenPlaced].code as any
            });
            childrenPlaced++;
        }
    }

    // Fill extra beds
    for (let i = 0; i < pomocni; i++) {
        if (adultsPlaced < adults) {
            assignment.push({
                bedType: 'pomocni',
                bedIndex: i,
                personCategory: 'ADL'
            });
            adultsPlaced++;
        } else if (childrenPlaced < childCategories.length) {
            assignment.push({
                bedType: 'pomocni',
                bedIndex: i,
                personCategory: childCategories[childrenPlaced].code as any
            });
            childrenPlaced++;
        }
    }

    return assignment;
}

/**
 * Generate combinations or permutations of child categories
 */
function generateCombinations(
    categories: PersonCategory[],
    count: number,
    includePermutations: boolean
): PersonCategory[][] {
    if (count === 0) return [[]];
    if (categories.length === 0) return [];

    if (includePermutations) {
        return generatePermutationsWithRepetition(categories, count);
    } else {
        return generateCombinationsWithRepetition(categories, count);
    }
}

/**
 * Generate combinations with repetition (order doesn't matter)
 * Example: [CHD1, CHD2] with count=2 → [[CHD1,CHD1], [CHD1,CHD2], [CHD2,CHD2]]
 */
function generateCombinationsWithRepetition(
    categories: PersonCategory[],
    count: number
): PersonCategory[][] {
    if (count === 0) return [[]];
    if (categories.length === 0) return [];

    const result: PersonCategory[][] = [];

    function backtrack(start: number, current: PersonCategory[]) {
        if (current.length === count) {
            result.push([...current]);
            return;
        }

        for (let i = start; i < categories.length; i++) {
            current.push(categories[i]);
            backtrack(i, current); // i, not i+1, allows repetition
            current.pop();
        }
    }

    backtrack(0, []);
    return result;
}

/**
 * Generate permutations with repetition (order matters)
 * Example: [CHD1, CHD2] with count=2 → [[CHD1,CHD1], [CHD1,CHD2], [CHD2,CHD1], [CHD2,CHD2]]
 */
function generatePermutationsWithRepetition(
    categories: PersonCategory[],
    count: number
): PersonCategory[][] {
    if (count === 0) return [[]];
    if (categories.length === 0) return [];

    const result: PersonCategory[][] = [];

    function backtrack(current: PersonCategory[]) {
        if (current.length === count) {
            result.push([...current]);
            return;
        }

        for (const category of categories) {
            current.push(category);
            backtrack(current);
            current.pop();
        }
    }

    backtrack([]);
    return result;
}

/**
 * Create a pricing rule from bed assignment
 */
function createPricingRule(bedAssignment: BedOccupant[]): PricingRule {
    const id = generateRuleId(bedAssignment);

    return {
        id,
        isActive: true,
        bedAssignment,
        basePrice: 0,
        discounts: [],
        surcharges: [],
        finalPrice: 0
    };
}

/**
 * Generate unique ID for a pricing rule based on bed assignment
 */
function generateRuleId(bedAssignment: BedOccupant[]): string {
    return bedAssignment
        .map(b => `${b.bedType[0]}${b.bedIndex}_${b.personCategory}`)
        .join('_');
}

/**
 * Calculate final price for a rule
 */
export function calculateFinalPrice(rule: PricingRule): number {
    let price = rule.basePrice;

    // Apply discounts
    if (rule.discounts) {
        for (const discount of rule.discounts) {
            if (discount.amount) {
                price -= discount.amount;
            } else if (discount.percentage) {
                price -= (price * discount.percentage) / 100;
            }
        }
    }

    // Apply surcharges
    if (rule.surcharges) {
        for (const surcharge of rule.surcharges) {
            if (surcharge.amount) {
                price += surcharge.amount;
            } else if (surcharge.percentage) {
                price += (price * surcharge.percentage) / 100;
            }
        }
    }

    return Math.max(0, price); // Price can't be negative
}
