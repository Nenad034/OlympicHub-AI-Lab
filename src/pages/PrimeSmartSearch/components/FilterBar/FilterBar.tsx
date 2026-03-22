import React from 'react';
import { useSearchStore } from '../../stores/useSearchStore';

type SortOption = {
    value: 'smart' | 'price_asc' | 'price_desc' | 'stars_desc' | 'rating_desc';
    label: string;
};

const SORT_OPTIONS: SortOption[] = [
    { value: 'smart',       label: '✨ Preporučeno' },
    { value: 'price_asc',   label: '💰 Cena: rastuće' },
    { value: 'price_desc',  label: '💰 Cena: opadajuće' },
    { value: 'stars_desc',  label: '⭐ Zvezdice' },
    { value: 'rating_desc', label: '👍 Ocena gostiju' },
];

const STAR_FILTERS = ['3', '4', '5'];

const MEAL_FILTERS = [
    { code: 'RO', label: 'Samo soba' },
    { code: 'BB', label: 'Doručak' },
    { code: 'HB', label: 'Polupansion' },
    { code: 'FB', label: 'Puni pansion' },
    { code: 'AI', label: 'All Inclusive' },
];

export const FilterBar: React.FC = () => {
    const {
        filters,
        sortBy,
        updateFilter,
        setSortBy,
        resetFilters,
        results,
        isSearching,
    } = useSearchStore();

    // Ne prikazuj bar dok nema izvršene pretrage
    if (isSearching || results.length === 0) return null;

    const toggleStar = (star: string) => {
        const current = filters.stars;
        if (current.includes('all')) {
            updateFilter('stars', [star]);
        } else if (current.includes(star)) {
            const next = current.filter(s => s !== star);
            updateFilter('stars', next.length === 0 ? ['all'] : next);
        } else {
            updateFilter('stars', [...current, star]);
        }
    };

    const toggleMeal = (code: string) => {
        const current = filters.mealPlans;
        if (current.includes('all')) {
            updateFilter('mealPlans', [code]);
        } else if (current.includes(code)) {
            const next = current.filter(c => c !== code);
            updateFilter('mealPlans', next.length === 0 ? ['all'] : next);
        } else {
            updateFilter('mealPlans', [...current, code]);
        }
    };

    const hasActiveFilters =
        !filters.stars.includes('all') ||
        !filters.mealPlans.includes('all') ||
        filters.onlyInstantBook;

    return (
        <div
            className="v6-filter-bar"
            role="toolbar"
            aria-label="Filteri i sortiranje"
        >
            {/* ── Zvezdice ──────────────────────────── */}
            <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--v6-text-muted)', marginRight: '4px' }}>
                    ZVEZDE
                </span>
                {STAR_FILTERS.map(star => (
                    <button
                        key={star}
                        className={`v6-filter-chip ${
                            !filters.stars.includes('all') && filters.stars.includes(star)
                                ? 'v6-active'
                                : ''
                        }`}
                        onClick={() => toggleStar(star)}
                        aria-pressed={!filters.stars.includes('all') && filters.stars.includes(star)}
                        aria-label={`${star} zvezdice`}
                    >
                        {'⭐'.repeat(parseInt(star))}
                    </button>
                ))}
            </div>

            {/* ── Separator ─────────────────────────── */}
            <div style={{ width: '1px', height: '24px', background: 'var(--v6-border)', flexShrink: 0 }} />

            {/* ── Usluga (Obrok) ────────────────────── */}
            <div style={{ display: 'flex', gap: '4px', alignItems: 'center', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--v6-text-muted)', marginRight: '4px' }}>
                    USLUGA
                </span>
                {MEAL_FILTERS.map(meal => (
                    <button
                        key={meal.code}
                        className={`v6-filter-chip ${
                            !filters.mealPlans.includes('all') && filters.mealPlans.includes(meal.code)
                                ? 'v6-active'
                                : ''
                        }`}
                        onClick={() => toggleMeal(meal.code)}
                        aria-pressed={!filters.mealPlans.includes('all') && filters.mealPlans.includes(meal.code)}
                    >
                        {meal.label}
                    </button>
                ))}
            </div>

            {/* ── Separator ─────────────────────────── */}
            <div style={{ width: '1px', height: '24px', background: 'var(--v6-border)', flexShrink: 0 }} />

            {/* ── Samo Odmah ────────────────────────── */}
            <button
                className={`v6-filter-chip ${filters.onlyInstantBook ? 'v6-active' : ''}`}
                onClick={() => updateFilter('onlyInstantBook', !filters.onlyInstantBook)}
                aria-pressed={filters.onlyInstantBook}
            >
                ⚡ Samo odmah
            </button>

            {/* ── Spacer ────────────────────────────── */}
            <div className="v6-filter-bar-spacer" />

            {/* ── Reset ─────────────────────────────── */}
            {hasActiveFilters && (
                <button
                    className="v6-filter-chip"
                    onClick={resetFilters}
                    style={{ borderColor: '#dc2626', color: '#dc2626' }}
                    aria-label="Poništi sve filtere"
                >
                    ✕ Poništi filtere
                </button>
            )}

            {/* ── Rezultati Count ───────────────────── */}
            <span style={{
                fontSize: 'var(--v6-fs-xs)',
                color: 'var(--v6-text-muted)',
                fontWeight: 600,
                whiteSpace: 'nowrap',
            }}>
                {results.length} {results.length === 1 ? 'hotel' : results.length < 5 ? 'hotela' : 'hotela'}
            </span>

            {/* ── Sortiranje ────────────────────────── */}
            <select
                className="v6-sort-select"
                value={sortBy}
                onChange={e => setSortBy(e.target.value as typeof sortBy)}
                aria-label="Sortiranje rezultata"
            >
                {SORT_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
            </select>
        </div>
    );
};

export default FilterBar;
