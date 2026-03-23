import React, { useState } from 'react';
import { useSearchStore } from './stores/useSearchStore';
import { useThemeStore } from '../../stores';
import { SearchTabs } from './components/SearchTabs/SearchTabs';
import { PaxSummaryBanner } from './components/PaxSummaryBanner/PaxSummaryBanner';
import { HotelSearchForm } from './components/HotelSearchForm/HotelSearchForm';
import { FlightSearchForm } from './components/FlightSearchForm/FlightSearchForm';
import { CharterSearchForm } from './components/CharterSearchForm/CharterSearchForm';
import { CarSearchForm } from './components/CarSearchForm/CarSearchForm';
import { TransferSearchForm } from './components/TransferSearchForm/TransferSearchForm';
import { PackageWizard } from './components/PackageWizard/PackageWizard';
import { PackageLiveStack } from './components/PackageLiveStack';
import { HotelCard, type ViewMode } from './components/HotelCard/HotelCard';
import { FlightCard } from './components/FlightCard/FlightCard';
import { CharterCard } from './components/CharterCard/CharterCard';
import { CarCard } from './components/CarCard/CarCard';
import { TransferCard } from './components/TransferCard/TransferCard';
import { FilterBar } from './components/FilterBar/FilterBar';
import { FilterSidebar } from './components/FilterSidebar/FilterSidebar';
import { HotelRoomWizard } from './components/HotelRoomWizard/HotelRoomWizard';
import { SmartConcierge } from './components/SmartConcierge/SmartConcierge';
import { ItineraryExport } from './components/ItineraryExport/ItineraryExport';
import { PackageBasketBar } from './components/PackageBasketBar/PackageBasketBar';
import { MOCK_HOTEL_RESULTS } from './data/mockResults';
import { MOCK_FLIGHT_RESULTS } from './data/mockFlights';
import { MOCK_CHARTER_RESULTS } from './data/mockCharters';
import { MOCK_CAR_RESULTS, CAR_CATEGORIES } from './data/mockCars';
import { MOCK_TRANSFER_RESULTS } from './data/mockTransfers';
import { MOCK_TOUR_RESULTS, TOUR_CATEGORIES } from './data/mockTours';
import { MOCK_ACTIVITY_RESULTS, ACTIVITY_CATEGORIES } from './data/mockActivities';
import { TourSearchForm } from './components/TourSearchForm/TourSearchForm';
import { TourCard } from './components/TourCard/TourCard';
import { ActivitySearchForm } from './components/ActivitySearchForm/ActivitySearchForm';
import { ActivityCard } from './components/ActivityCard/ActivityCard';
import { MOCK_CRUISE_RESULTS, CRUISE_REGIONS } from './data/mockCruises';
import { CruiseSearchForm } from './components/CruiseSearchForm/CruiseSearchForm';
import { CruiseCard } from './components/CruiseCard/CruiseCard';
import { PackageBasket } from './components/PackageBasket/PackageBasket';
import { DynamicPackageCheckout } from './components/DynamicPackageCheckout/DynamicPackageCheckout';
import { 
    IconHotelV6, IconFlightV6, IconPackageV6, IconTransferV6, 
    IconActivityV6, IconCruiseV6, IconCharterV6, IconTourV6 
} from './components/V6ModuleIcons';
import { SavedOffersPanel } from './components/SavedOffersPanel';
import type { HotelSearchResult, FlightSearchResult } from './types';
import './styles/PrimeSmartSearch.css';

// ─────────────────────────────────────────────────────────────
// SKELETON
// ─────────────────────────────────────────────────────────────
const SkeletonGrid: React.FC = () => (
    <div className="v6-results-grid" aria-busy="true" aria-label="Učitavaju se rezultati...">
        {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="v6-skeleton-card" aria-hidden="true" style={{ animationDelay: `${i * 0.06}s` }}>
                <div className="v6-skeleton-img" />
                <div className="v6-skeleton-body">
                    <div className="v6-skeleton-line v6-w-80" />
                    <div className="v6-skeleton-line v6-w-60" />
                    <div className="v6-skeleton-line v6-w-40" />
                    <div style={{ marginTop: '12px' }}>
                        <div className="v6-skeleton-line v6-w-60" style={{ height: '24px' }} />
                        <div className="v6-skeleton-line v6-w-80" style={{ height: '36px', marginTop: '8px' }} />
                    </div>
                </div>
            </div>
        ))}
    </div>
);

// ─────────────────────────────────────────────────────────────
// PLACEHOLDER ZA OSTALE TABOVE
// ─────────────────────────────────────────────────────────────
const ComingSoonForm: React.FC<{ emoji: string; title: string; desc: string }> = ({ emoji, title, desc }) => (
    <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '14px',
        padding: '20px',
        background: 'var(--v6-bg-section)',
        borderRadius: 'var(--v6-radius-md)',
        border: '1px dashed var(--v6-border)',
    }}>
        <span style={{ fontSize: '32px' }}>{emoji}</span>
        <div>
            <div style={{ fontSize: 'var(--v6-fs-md)', fontWeight: 700, color: 'var(--v6-text-primary)' }}>{title}</div>
            <div style={{ fontSize: 'var(--v6-fs-xs)', color: 'var(--v6-text-muted)', marginTop: '4px' }}>
                {desc} · <em>Implementacija u sledećoj fazi</em>
            </div>
        </div>
    </div>
);

const TabForm: React.FC<{ activeTab: string }> = ({ activeTab }) => {
    switch (activeTab) {
        case 'hotel':        return <HotelSearchForm />;
        case 'flight':       return <FlightSearchForm />;
        case 'charter':      return <CharterSearchForm />;
        case 'car':          return <CarSearchForm />;
        case 'transfer':     return <TransferSearchForm />;
        case 'tour':         return <TourSearchForm />;
        case 'things-to-do': return <ActivitySearchForm />;
        case 'cruise':       return <CruiseSearchForm />;
        case 'package':      return null;
        default:             return <HotelSearchForm />;
    }
};

// ─────────────────────────────────────────────────────────────
// UI COMPONENTS (Shared)
// ─────────────────────────────────────────────────────────────
const ViewToggleBar: React.FC<{ viewMode: ViewMode; onChange: (m: ViewMode) => void }> = ({ viewMode: vm, onChange }) => (
    <div className="v6-view-toggle-bar">
        <button
            id="v6-view-list-btn"
            className={`v6-view-toggle-btn ${vm === 'list' ? 'v6-vtb-active' : ''}`}
            onClick={() => onChange('list')}
            title="List prikaz"
        >
            ☰ List
        </button>
        <button
            id="v6-view-grid-btn"
            className={`v6-view-toggle-btn ${vm === 'grid' ? 'v6-vtb-active' : ''}`}
            onClick={() => onChange('grid')}
            title="Grid prikaz"
        >
            ⊞ Grid
        </button>
        <button
            id="v6-view-notepad-btn"
            className={`v6-view-toggle-btn ${vm === 'notepad' ? 'v6-vtb-active' : ''}`}
            onClick={() => onChange('notepad')}
            title="Notepad prikaz"
        >
            📋 Notepad
        </button>
    </div>
);

// ─────────────────────────────────────────────────────────────
// EMPTY STATES
// ─────────────────────────────────────────────────────────────
const TopOffers: React.FC<{ 
    activeTab: string; 
    hotelViewMode: ViewMode; 
    setHotelViewMode: (m: ViewMode) => void;
    tourViewMode: ViewMode;
    setTourViewMode: (m: ViewMode) => void;
}> = ({ activeTab, hotelViewMode, setHotelViewMode, tourViewMode, setTourViewMode }) => {
    // Pick more items for exploration
    const topHotels = MOCK_HOTEL_RESULTS.slice(0, 11);
    const topFlights = MOCK_FLIGHT_RESULTS.slice(0, 3);
    const topTours = MOCK_TOUR_RESULTS.slice(0, 3);

    const renderOfferHeader = (title: string, subtitle: string, badgeText?: string) => (
        <div className="v6-offer-section-header">
            <div className="v6-offer-title-group">
                <h2>{title}</h2>
                <p>{subtitle}</p>
            </div>
            {badgeText && (
                <div className="badge-luxury">
                    <span>✨</span> {badgeText}
                </div>
            )}
        </div>
    );

    return (
        <div className="v6-top-offers-dashboard v6-fade-in">
            {activeTab === 'hotel' && (
                <div className="v6-fade-in-up">
                    
                    <div className={hotelViewMode === 'list' ? 'v6-results-list-wrapper' : hotelViewMode === 'grid' ? 'v6-results-grid-wrapper' : 'v6-results-notepad-wrapper'}>
                        {hotelViewMode === 'notepad' && (
                            <div className="v6-notepad-header">
                                <span>#</span><span>Hotel</span><span>Lokacija</span><span>Usluga</span><span>Ocena</span><span>Status</span><span>Cena</span><span></span>
                            </div>
                        )}
                        {topHotels.map((hotel, idx) => (
                            <HotelCard key={hotel.id} hotel={hotel} index={idx} onViewOptions={() => {}} viewMode={hotelViewMode} />
                        ))}
                    </div>
                </div>
            )}

            {activeTab === 'flight' && (
                <div className="v6-fade-in-up">
                    {renderOfferHeader("Najpovoljniji letovi", "Putujte svetom sa najpouzdanijim avio kompanijama", "Best Value")}
                    <div className="search-results-container">
                        {topFlights.map((flight, idx) => (
                            <FlightCard key={flight.id} flight={flight} index={idx} paxTotal={1} onBook={() => {}} />
                        ))}
                    </div>
                </div>
            )}

            {activeTab === 'package' && (
                <div className="v6-fade-in-up">
                    {renderOfferHeader("Trendi Paketi", "Kompletna letovanja i gradske ture uz maksimalnu uštedu", "Prime Selection")}
                    
                    <div className={tourViewMode === 'list' ? 'v6-results-list-wrapper' : tourViewMode === 'grid' ? 'v6-results-grid-wrapper' : 'v6-results-notepad-wrapper'}>
                        {tourViewMode === 'notepad' && (
                            <div className="v6-notepad-header">
                                <span>#</span><span>Paket</span><span>Destinacija</span><span>Trajanje</span><span>Ocena</span><span>Status</span><span>Cena</span><span></span>
                            </div>
                        )}
                        {topTours.map((tour, idx) => (
                            <TourCard key={tour.id} tour={tour} index={idx} viewMode={tourViewMode} />
                        ))}
                    </div>
                </div>
            )}

            {activeTab === 'tour' && (
                <div className="v6-fade-in-up">
                    {renderOfferHeader("Preporučena Putovanja", "Doživite nezaboravne trenutke na našim organizovanim turama", "Prime Selection")}
                    
                    <div className={tourViewMode === 'list' ? 'v6-results-list-wrapper' : tourViewMode === 'grid' ? 'v6-results-grid-wrapper' : 'v6-results-notepad-wrapper'}>
                        {tourViewMode === 'notepad' && (
                            <div className="v6-notepad-header">
                                <span>#</span><span>Paket</span><span>Destinacija</span><span>Trajanje</span><span>Ocena</span><span>Status</span><span>Cena</span><span></span>
                            </div>
                        )}
                        {topTours.map((tour, idx) => (
                            <TourCard key={tour.id} tour={tour} index={idx} viewMode={tourViewMode} />
                        ))}
                    </div>
                </div>
            )}

            {(activeTab !== 'hotel' && activeTab !== 'flight' && activeTab !== 'package' && activeTab !== 'tour') && (
                <div className="v6-empty-state">
                    <div className="v6-empty-state-icon">✨</div>
                    <div className="v6-empty-title">Otkrijte nove horizonte</div>
                    <div className="v6-empty-subtitle">Pretražite našu bazu za najbolje cene čartera, rent-a-car i transfer usluga.</div>
                </div>
            )}
        </div>
    );
};

const NoResults: React.FC = () => (
    <div className="v6-empty-state v6-fade-in">
        <div className="v6-empty-state-icon">😔</div>
        <div className="v6-empty-title">Nema rezultata za zadatu pretragu</div>
        <div className="v6-empty-subtitle">
            Nema slobodnih mesta za izabrane termine. Pokušajte fleksibilne datume.
        </div>
    </div>
);

// ─────────────────────────────────────────────────────────────
// MAIN COMPONENT — PrimeSmartSearch V6 (Faza 5 Finalna)
// ─────────────────────────────────────────────────────────────
export const PrimeSmartSearch: React.FC = () => {
    const {
        activeTab,
        isSearching,
        searchPerformed,
        results,
        flightResults,
        charterResults,
        carResults,
        transferResults,
        tourResults,
        activityResults,
        cruiseResults,
        showPackageCheckout,
        alerts,
        dismissAlert,
        selectedHotel,
        setSelectedHotel,
        setResults,
        setFlightResults,
        setCharterResults,
        setCarResults,
        setTransferResults,
        setTourResults,
        setActivityResults,
        setCruiseResults,
        setSearchPerformed,
        setIsSearching,
        addToBasket,
        filters,
        sortBy,
        packageWizardStep,
    } = useSearchStore();

    const { theme } = useThemeStore();

    // Panel stanja
    const [showRoomWizard, setShowRoomWizard] = useState(false);
    const [showExport, setShowExport] = useState(false);
    const [carCategoryFilter, setCarCategoryFilter] = useState('all');
    const [transferDirection, setTransferDirection] = useState<'one-way' | 'round-trip'>('one-way');

    // View mode za hotel i paket tabove (nezavisni)
    const [hotelViewMode, setHotelViewMode] = useState<ViewMode>('list');
    const [tourViewMode, setTourViewMode] = useState<ViewMode>('list');

    const filteredHotels = React.useMemo(() => {
        if (activeTab !== 'hotel') return [];
        const base = results.filter(hotel => {
            // Name filter
            if (filters.hotelName && !hotel.name.toLowerCase().includes(filters.hotelName.toLowerCase())) {
                return false;
            }
            // Star filter
            if (filters.stars && !filters.stars.includes('all')) {
                if (!filters.stars.includes(hotel.stars.toString())) return false;
            }
            // Availability
            if (filters.availability && filters.availability.length > 0) {
                if (!filters.availability.includes(hotel.status)) return false;
            }
            // Only Refundable
            if (filters.onlyRefundable) {
                // Check if any room has a cancellation deadline
                return hotel.roomOptions?.some(opt => opt.mealPlans.some(mp => mp.isRefundable));
            }
            return true;
        });

        // Apply Sorting
        return [...base].sort((a, b) => {
            if (sortBy === 'price_asc') return a.lowestTotalPrice - b.lowestTotalPrice;
            if (sortBy === 'price_desc') return b.lowestTotalPrice - a.lowestTotalPrice;
            if (sortBy === 'stars_desc') return b.stars - a.stars;
            if (sortBy === 'rating_desc') return (b.rating || 0) - (a.rating || 0);
            
            // 'smart' (PRIME inventory first, then by priority)
            if (a.isPrime !== b.isPrime) return a.isPrime ? -1 : 1;
            return b.priority - a.priority;
        });
    }, [results, filters, activeTab, sortBy]);

    // Aktiviraj Smart Concierge za grad izabranog hotela
    const conciergeCity = selectedHotel?.location?.city ?? undefined;

    // ── Demo Hotel pretraga ────────────────────────────────
    const handleDemoHotelSearch = () => {
        setIsSearching(true);
        setResults([]);
        setTimeout(() => {
            setResults(MOCK_HOTEL_RESULTS);
            setIsSearching(false);
            setSearchPerformed(true);
        }, 1600);
    };

    // ── Demo Flight pretraga ───────────────────────────────
    const handleDemoFlightSearch = () => {
        setIsSearching(true);
        setFlightResults([]);
        setTimeout(() => {
            setFlightResults(MOCK_FLIGHT_RESULTS);
            setIsSearching(false);
            setSearchPerformed(true);
        }, 1800);
    };

    // ── Selekcija hotela → Room Wizard ─────────────────────
    const handleViewOptions = (hotel: HotelSearchResult) => {
        setSelectedHotel(hotel);
        setShowRoomWizard(true);
    };

    const handleCloseWizard = () => setShowRoomWizard(false);

    const handleBook = (_selections: unknown[]) => {
        handleCloseWizard();
        setShowExport(true);
    };

    // ── Odaberi let → Dodaj u korpu ────────────────────────
    const handleBookFlight = (flight: FlightSearchResult) => {
        addToBasket({
            id: `flight-${flight.id}`,
            type: 'flight',
            label: `✈ ${flight.airline}`,
            details: [
                `${flight.outbound.segments[0].origin} → ${flight.outbound.segments[flight.outbound.segments.length - 1].destination}`,
                flight.outbound.stops === 0 ? 'Direktno' : `${flight.outbound.stops} presedanje`,
                flight.outbound.fareBrand ?? '',
            ].filter(Boolean).join(' · '),
            pricePerUnit: Math.round(flight.totalPrice / Math.max(1, 1)),
            totalPrice: flight.totalPrice,
            currency: flight.currency,
            status: flight.outbound.status,
            icon: flight.airlineLogo,
            isRemovable: true,
        });
    };

    // ── Package Wizard komplet → Export ────────────────────
    const handlePackageComplete = (_total: number) => {
        setShowExport(true);
    };

    return (
        <div
            className={`v6-prime-hub v6-cockpit-layout ${theme === 'navy' ? 'v6-dark' : ''}`}
            role="main"
            aria-label="PrimeSmartSearch V6"
            data-testid="prime-smart-search-v6"
        >
            {/* ═══════════════════════════════════════════════
                HEADER ZONA — Sticky tabovi
            ═══════════════════════════════════════════════ */}
            <header className="v6-header-zone">
                <SearchTabs />
            </header>

            {/* ═══════════════════════════════════════════════
                FORMA ZONA (Prikazuje se samo ako ima sadržaja)
            ═══════════════════════════════════════════════ */}
            {activeTab !== 'package' && (
                <section
                    className="v6-form-zone v6-fade-in v6-wide-mode"
                    id={`v6-panel-${activeTab}`}
                    style={{ paddingLeft: '2.5%', paddingRight: '2.5%' }}
                    role="tabpanel"
                    aria-labelledby={`v6-tab-${activeTab}`}
                >
                <TabForm activeTab={activeTab} />

                {/* Demo dugme za Hotel tab */}
                {activeTab === 'hotel' && !searchPerformed && !isSearching && (
                    <div style={{ marginTop: '12px' }}>
                        <button
                            onClick={handleDemoHotelSearch}
                            id="v6-demo-hotel-btn"
                            style={{
                                background: 'none',
                                border: '1.5px dashed var(--v6-border)',
                                borderRadius: 'var(--v6-radius-md)',
                                padding: '8px 16px',
                                fontSize: '12px',
                                color: 'var(--v6-text-muted)',
                                cursor: 'pointer',
                                fontFamily: 'var(--v6-font)',
                                fontWeight: 600,
                            }}
                        >
                            🎯 Demo: Prikaži primer hotela →
                        </button>
                    </div>
                )}

                {/* Demo dugme za Charter tab */}
                {activeTab === 'charter' && !searchPerformed && !isSearching && (
                    <div style={{ marginTop: '12px' }}>
                        <button
                            onClick={() => {
                                setIsSearching(true);
                                setTimeout(() => {
                                    setCharterResults(MOCK_CHARTER_RESULTS);
                                    setIsSearching(false);
                                    setSearchPerformed(true);
                                }, 1400);
                            }}
                            id="v6-demo-charter-btn"
                            style={{ background: 'none', border: '1.5px dashed var(--v6-border)', borderRadius: 'var(--v6-radius-md)', padding: '8px 16px', fontSize: '12px', color: 'var(--v6-text-muted)', cursor: 'pointer', fontFamily: 'var(--v6-font)', fontWeight: 600 }}
                        >
                            🎫 Demo: Prikaži primer čartera (BEG→TIV + BEG→DBV) →
                        </button>
                    </div>
                )}

                {/* Demo dugme za Rent-a-Car tab */}
                {activeTab === 'car' && !searchPerformed && !isSearching && (
                    <div style={{ marginTop: '12px' }}>
                        <button
                            onClick={() => {
                                setIsSearching(true);
                                setTimeout(() => {
                                    setCarResults(MOCK_CAR_RESULTS);
                                    setIsSearching(false);
                                    setSearchPerformed(true);
                                }, 1300);
                            }}
                            id="v6-demo-car-btn"
                            style={{ background: 'none', border: '1.5px dashed var(--v6-border)', borderRadius: 'var(--v6-radius-md)', padding: '8px 16px', fontSize: '12px', color: 'var(--v6-text-muted)', cursor: 'pointer', fontFamily: 'var(--v6-font)', fontWeight: 600 }}
                        >
                            🚗 Demo: Prikaži primer vozila (BEG, Jul 5–12) →
                        </button>
                    </div>
                )}

                {/* Demo dugme za Transfer tab */}
                {activeTab === 'transfer' && !searchPerformed && !isSearching && (
                    <div style={{ marginTop: '12px' }}>
                        <button
                            onClick={() => {
                                setIsSearching(true);
                                setTimeout(() => {
                                    setTransferResults(MOCK_TRANSFER_RESULTS);
                                    setIsSearching(false);
                                    setSearchPerformed(true);
                                }, 1100);
                            }}
                            id="v6-demo-transfer-btn"
                            style={{ background: 'none', border: '1.5px dashed var(--v6-border)', borderRadius: 'var(--v6-radius-md)', padding: '8px 16px', fontSize: '12px', color: 'var(--v6-text-muted)', cursor: 'pointer', fontFamily: 'var(--v6-font)', fontWeight: 600 }}
                        >
                            🚌 Demo: Prikaži primer transfera (TIV → Budva) →
                        </button>
                    </div>
                )}

                {/* Demo dugme za Putovanja tab */}
                {activeTab === 'tour' && !searchPerformed && !isSearching && (
                    <div style={{ marginTop: '12px' }}>
                        <button
                            onClick={() => {
                                setIsSearching(true);
                                setTimeout(() => {
                                    setTourResults(MOCK_TOUR_RESULTS);
                                    setIsSearching(false);
                                    setSearchPerformed(true);
                                }, 1200);
                            }}
                            id="v6-demo-tour-btn"
                            style={{ background: 'none', border: '1.5px dashed var(--v6-border)', borderRadius: 'var(--v6-radius-md)', padding: '8px 16px', fontSize: '12px', color: 'var(--v6-text-muted)', cursor: 'pointer', fontFamily: 'var(--v6-font)', fontWeight: 600 }}
                        >
                            🌍 Demo: Prikaži primer putovanja (Bali, Rim, Pariz) →
                        </button>
                    </div>
                )}

                {/* Demo dugme za Izleti i Aktivnosti (Things to Do) tab */}
                {activeTab === 'things-to-do' && !searchPerformed && !isSearching && (
                    <div style={{ marginTop: '12px' }}>
                        <button
                            onClick={() => {
                                setIsSearching(true);
                                setTimeout(() => {
                                    setActivityResults(MOCK_ACTIVITY_RESULTS);
                                    setIsSearching(false);
                                    setSearchPerformed(true);
                                }, 900);
                            }}
                            id="v6-demo-activities-btn"
                            style={{ background: 'none', border: '1.5px dashed var(--v6-border)', borderRadius: 'var(--v6-radius-md)', padding: '8px 16px', fontSize: '12px', color: 'var(--v6-text-muted)', cursor: 'pointer', fontFamily: 'var(--v6-font)', fontWeight: 600 }}
                        >
                            🎟️ Demo: Prikaži primer izleta i aktivnosti (Boka, Tara, Skadar) →
                        </button>
                    </div>
                )}

                {/* Demo dugme za Krstarenja tab */}
                {activeTab === 'cruise' && !searchPerformed && !isSearching && (
                    <div style={{ marginTop: '12px' }}>
                        <button
                            onClick={() => {
                                setIsSearching(true);
                                setTimeout(() => {
                                    setCruiseResults(MOCK_CRUISE_RESULTS);
                                    setIsSearching(false);
                                    setSearchPerformed(true);
                                }, 1400);
                            }}
                            id="v6-demo-cruise-btn"
                            style={{ background: 'none', border: '1.5px dashed var(--v6-border)', borderRadius: 'var(--v6-radius-md)', padding: '8px 16px', fontSize: '12px', color: 'var(--v6-text-muted)', cursor: 'pointer', fontFamily: 'var(--v6-font)', fontWeight: 600 }}
                        >
                            🚢 Demo: Prikaži brodove i plovidbe (Mediteran, Karibi) →
                        </button>
                    </div>
                )}
                </section>
            )}

            {/* ═ SUMMARY BANNER ═ */}
            <PaxSummaryBanner />

            {/* ═ ALERTS ═ */}
            {alerts.length > 0 && (
                <div className="v6-alerts-zone" role="region" aria-label="Obaveštenja">
                    {alerts.map(alert => (
                        <div key={alert.id} className={`v6-alert v6-alert-${alert.severity} v6-fade-in`} role="alert" aria-live="polite">
                            <span aria-hidden="true">{alert.severity === 'warning' ? '⚠️' : 'ℹ️'}</span>
                            <span style={{ flex: 1 }}>{alert.message}</span>
                            <button className="v6-alert-dismiss" onClick={() => dismissAlert(alert.id)} aria-label="Zatvori">✕</button>
                        </div>
                    ))}
                </div>
            )}

            {/* ═ FILTER BAR (Conditional) ═ */}
            {activeTab !== 'hotel' && <FilterBar />}

            {/* ═ MAIN RESULTS ZONE ═ */}
            <div 
                className="v6-results-zone v6-wide-mode" 
                style={{ paddingLeft: '2.5%', paddingRight: '2.5%' }}
                role="region" 
                aria-label="Rezultati pretrage" 
                aria-live="polite"
            >
                {(activeTab === 'hotel') ? (
                    <div className="v6-search-results-page-layout" style={{ gridTemplateColumns: '300px 1fr' }}>
                        <div className="v6-sidebar-group" style={{ display: 'flex', flexDirection: 'column', gap: '16px', position: 'sticky', top: '120px' }}>
                            <div className="v6-toggle-bar-container-new" style={{ justifyContent: 'flex-start' }}>
                                <ViewToggleBar viewMode={hotelViewMode} onChange={setHotelViewMode} />
                            </div>
                            <FilterSidebar />
                        </div>

                        <div className="v6-results-content-area" style={{ marginTop: '0' }}>
                            {isSearching ? <SkeletonGrid /> : (
                                <>
                                    {!searchPerformed ? (
                                        <TopOffers 
                                            activeTab={activeTab} 
                                            hotelViewMode={hotelViewMode} setHotelViewMode={setHotelViewMode}
                                            tourViewMode={tourViewMode} setTourViewMode={setTourViewMode}
                                        />
                                    ) : (
                                        <>
                                            {filteredHotels.length === 0 ? <NoResults /> : (
                                                <div className={hotelViewMode === 'list' ? 'v6-results-list-wrapper' : hotelViewMode === 'grid' ? 'v6-results-grid-wrapper' : 'v6-results-notepad-wrapper'}>
                                                    {hotelViewMode === 'notepad' && (
                                                        <div className="v6-notepad-header">
                                                            <span>#</span><span>Hotel</span><span>Lokacija</span><span>Usluga</span><span>Ocena</span><span>Status</span><span>Cena</span><span></span>
                                                        </div>
                                                    )}
                                                    {filteredHotels.map((hotel, idx) => (
                                                        <HotelCard key={hotel.id} hotel={hotel} index={idx} onViewOptions={handleViewOptions} viewMode={hotelViewMode} />
                                                    ))}
                                                </div>
                                            )}
                                        </>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                ) : (
                    /* STANDARD CENTERED LAYOUT (Includes Packages, Flights, etc.) */
                    <div className="v6-standard-results-layout" style={{ maxWidth: 'none', margin: '0 auto', width: '100%' }}>
                        {isSearching ? <SkeletonGrid /> : (
                            <>
                                {activeTab === 'package' && (
                                    <PackageWizard onComplete={handlePackageComplete} />
                                 )}

                                {!searchPerformed && activeTab !== 'package' ? (
                                    <TopOffers 
                                        activeTab={activeTab} 
                                        hotelViewMode={hotelViewMode} setHotelViewMode={setHotelViewMode}
                                        tourViewMode={tourViewMode} setTourViewMode={setTourViewMode}
                                    />
                                ) : (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                        {activeTab === 'flight' && (
                                            flightResults.length === 0 ? <NoResults /> : (
                                                <div className="search-results-container">
                                                    {flightResults.map((flight, idx) => (
                                                        <FlightCard key={flight.id} flight={flight} index={idx} paxTotal={1} onBook={handleBookFlight} />
                                                    ))}
                                                </div>
                                            )
                                        )}
                                        {activeTab === 'charter' && (
                                            charterResults.length === 0 ? <NoResults /> : (
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                                                    {charterResults.map((charter, idx) => (
                                                        <CharterCard key={charter.id} charter={charter} index={idx} />
                                                    ))}
                                                </div>
                                            )
                                        )}
                                        {activeTab === 'car' && (
                                            carResults.length === 0 ? <NoResults /> : (
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                                                    {carResults.map((car, idx) => (
                                                        <CarCard key={car.id} car={car} days={7} index={idx} />
                                                    ))}
                                                </div>
                                            )
                                        )}
                                        {activeTab === 'transfer' && (
                                            transferResults.length === 0 ? <NoResults /> : (
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                                                    {transferResults.map((tr, idx) => (
                                                        <TransferCard key={tr.id} transfer={tr} direction={transferDirection} index={idx} />
                                                    ))}
                                                </div>
                                            )
                                        )}
                                        {activeTab === 'tour' && (
                                            tourResults.length === 0 ? <NoResults /> : (
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                                                    {tourResults.map((tour, idx) => (
                                                        <TourCard key={tour.id} tour={tour} index={idx} viewMode={tourViewMode} />
                                                    ))}
                                                </div>
                                            )
                                        )}
                                        {activeTab === 'cruise' && (
                                            cruiseResults.length === 0 ? <NoResults /> : (
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                                    {cruiseResults.map((cruise, idx) => (
                                                        <CruiseCard key={cruise.id} cruise={cruise} pax={2} index={idx} />
                                                    ))}
                                                </div>
                                            )
                                        )}
                                        {activeTab === 'things-to-do' && (
                                            activityResults.length === 0 ? <NoResults /> : (
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                                    {activityResults.map((act, idx) => (
                                                        <ActivityCard key={act.id} activity={act} pax={2} index={idx} />
                                                    ))}
                                                </div>
                                            )
                                        )}
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                )}
            </div>

            {/* ═ POST-RESULTS UTILITIES ═ */}
            <PackageBasket />
            {showPackageCheckout && <DynamicPackageCheckout />}

            {/* ═ MODALS ═ */}
            {showRoomWizard && selectedHotel && (
                <HotelRoomWizard hotel={selectedHotel} onClose={handleCloseWizard} onBook={handleBook} />
            )}
            {showExport && (
                <ItineraryExport hotel={selectedHotel ?? undefined} onClose={() => setShowExport(false)} />
            )}

            {/* ═ CONCIERGE ═ */}
            <SmartConcierge activeHotelCity={conciergeCity} />
            <SavedOffersPanel />
        </div>
    );
};

export default PrimeSmartSearch;
