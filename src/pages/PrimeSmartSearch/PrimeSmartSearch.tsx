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
import { HotelCard } from './components/HotelCard/HotelCard';
import { FlightCard } from './components/FlightCard/FlightCard';
import { CharterCard } from './components/CharterCard/CharterCard';
import { CarCard } from './components/CarCard/CarCard';
import { TransferCard } from './components/TransferCard/TransferCard';
import { FilterBar } from './components/FilterBar/FilterBar';
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
// EMPTY STATES
// ─────────────────────────────────────────────────────────────
const TopOffers: React.FC<{ activeTab: string }> = ({ activeTab }) => {
    // Helper to pick top 3 items
    const topHotels = MOCK_HOTEL_RESULTS.slice(0, 3);
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
                    {renderOfferHeader("Najtraženiji hoteli", "Istražite najpopularnije destinacije po specijalnim cenama", "Preporuka")}
                    <div className="search-results-container">
                        {topHotels.map((hotel, idx) => (
                            <HotelCard key={hotel.id} hotel={hotel} index={idx} onViewOptions={() => {}} />
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
                    <div className="search-results-container">
                        {topTours.map((tour, idx) => (
                            <TourCard key={tour.id} tour={tour} index={idx} />
                        ))}
                    </div>
                </div>
            )}

            {(activeTab !== 'hotel' && activeTab !== 'flight' && activeTab !== 'package') && (
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
    } = useSearchStore();

    const { theme } = useThemeStore();

    // Panel stanja
    const [showRoomWizard, setShowRoomWizard] = useState(false);
    const [showExport, setShowExport] = useState(false);
    const [carCategoryFilter, setCarCategoryFilter] = useState('all');
    const [transferDirection, setTransferDirection] = useState<'one-way' | 'round-trip'>('one-way');

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
                    className="v6-form-zone"
                id={`v6-panel-${activeTab}`}
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



            {/* ═══════════════════════════════════════════════
                PAX SUMMARY BANNER
            ═══════════════════════════════════════════════ */}
            <PaxSummaryBanner />

            {/* ═══════════════════════════════════════════════
                ALERTS
            ═══════════════════════════════════════════════ */}
            {alerts.length > 0 && (
                <div className="v6-alerts-zone" role="region" aria-label="Obaveštenja">
                    {alerts.map(alert => (
                        <div
                            key={alert.id}
                            className={`v6-alert v6-alert-${alert.severity} v6-fade-in`}
                            role="alert"
                            aria-live="polite"
                        >
                            <span aria-hidden="true">{alert.severity === 'warning' ? '⚠️' : 'ℹ️'}</span>
                            <span style={{ flex: 1 }}>{alert.message}</span>
                            <button className="v6-alert-dismiss" onClick={() => dismissAlert(alert.id)} aria-label="Zatvori">✕</button>
                        </div>
                    ))}
                </div>
            )}

            {/* ═══════════════════════════════════════════════
                FILTER BAR (pojavljuje se samo kad ima rezultata)
            ═══════════════════════════════════════════════ */}
            <FilterBar />

            {/* ═══════════════════════════════════════════════
                RESULTS ZONA — Nezavisni skrol
            ═══════════════════════════════════════════════ */}
            <div
                className="v6-results-zone"
                role="region"
                aria-label="Rezultati pretrage"
                aria-live="polite"
            >
                {/* ══ PACKAGE WIZARD — Zauzima celu results zonu ══ */}
                {activeTab === 'package' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
                        <div style={{ background: 'var(--bg-surface)', borderRadius: 'var(--radius-lg)', border: '1.5px solid var(--border-color)', overflow: 'hidden', boxShadow: 'var(--shadow-md)' }}>
                            <PackageWizard onComplete={handlePackageComplete} />
                        </div>
                        {!searchPerformed && !isSearching && <TopOffers activeTab="package" />}
                    </div>
                )}

                {/* ══ HOTEL + FLIGHT rezultati ══ */}
                {activeTab !== 'package' && isSearching && <SkeletonGrid />}
                {activeTab !== 'package' && !isSearching && !searchPerformed && <TopOffers activeTab={activeTab} />}

                {/* Hotel rezultati */}
                {activeTab === 'hotel' && !isSearching && searchPerformed && results.length === 0 && <NoResults />}
                {activeTab === 'hotel' && !isSearching && searchPerformed && results.length > 0 && (
                    <div className="search-results-container" role="list">
                        {results.map((hotel, idx) => (
                            <div key={hotel.id} role="listitem">
                                <HotelCard hotel={hotel} index={idx} onViewOptions={handleViewOptions} />
                            </div>
                        ))}
                    </div>
                )}

                {/* Flight rezultati */}
                {activeTab === 'flight' && !isSearching && searchPerformed && flightResults.length === 0 && <NoResults />}
                {activeTab === 'flight' && !isSearching && searchPerformed && flightResults.length > 0 && (
                    <div className="search-results-container" role="list">
                        <div style={{ padding: '16px 20px', background: 'var(--bg-app)', borderRadius: '16px', border: '1px solid var(--border-color)', fontSize: '12px', color: 'var(--text-muted)', display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '4px' }}>
                            <span style={{ color: 'var(--brand-accent)' }}>✈️</span>
                            <span><strong>{flightResults.length} letova</strong> pronađeno · Cene uključuju sve takse · Sortirano po preporuci</span>
                        </div>
                        {flightResults.map((flight, idx) => (
                            <div key={flight.id} role="listitem">
                                <FlightCard flight={flight} index={idx} paxTotal={1} onBook={handleBookFlight} />
                            </div>
                        ))}
                    </div>
                )}

                {/* Charter rezultati — kalendarskim tabelarni prikaz */}
                {activeTab === 'charter' && !isSearching && searchPerformed && charterResults.length === 0 && <NoResults />}
                {activeTab === 'charter' && !isSearching && searchPerformed && charterResults.length > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', width: '100%' }} role="list" aria-label={`${charterResults.length} čarter relacija`}>
                        {/* Banner */}
                        <div style={{ padding: '12px 16px', background: 'var(--v6-bg-section)', borderRadius: 'var(--v6-radius-md)', border: '1px solid var(--v6-border)', fontSize: 'var(--v6-fs-xs)', color: 'var(--v6-text-muted)', display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
                            <span>🎫 <strong style={{ color: 'var(--v6-text-primary)' }}>{charterResults.length} čarter relacija</strong> pronađeno</span>
                            <span style={{ color: 'var(--v6-border)' }}>|</span>
                            <span style={{ color: 'var(--v6-color-prime)', fontWeight: 600 }}>🏆 {charterResults.filter(c => c.isPrime).length} PRIME allotment</span>
                            <span style={{ color: 'var(--v6-border)' }}>|</span>
                            <span>Cene su po osobi · Kliknite na relaciju da vidite polaske</span>
                        </div>
                        {charterResults.map((charter, idx) => (
                            <div key={charter.id} role="listitem">
                                <CharterCard charter={charter} index={idx} />
                            </div>
                        ))}
                    </div>
                )}

                {/* ══ RENT-A-CAR rezultati ══ */}
                {activeTab === 'car' && !isSearching && searchPerformed && carResults.length === 0 && <NoResults />}
                {activeTab === 'car' && !isSearching && searchPerformed && carResults.length > 0 && (() => {
                    const filtered = carCategoryFilter === 'all'
                        ? carResults
                        : carResults.filter(c => c.category === carCategoryFilter);
                    const days = 7; // TODO: iz CarSearchParams
                    return (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', width: '100%' }}>
                            {/* Banner + Category Filter */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', padding: '14px 16px', background: 'var(--v6-bg-section)', borderRadius: 'var(--v6-radius-md)', border: '1px solid var(--v6-border)' }}>
                                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center', fontSize: 'var(--v6-fs-xs)', color: 'var(--v6-text-muted)' }}>
                                    <span>🚗 <strong style={{ color: 'var(--v6-text-primary)' }}>{carResults.length} vozila</strong> dostupno</span>
                                    <span style={{ color: 'var(--v6-border)' }}>|</span>
                                    <span style={{ color: 'var(--v6-color-prime)', fontWeight: 600 }}>🏆 {carResults.filter(c => c.isPrime).length} PRIME</span>
                                    <span style={{ color: 'var(--v6-border)' }}>|</span>
                                    <span>Cene za {days} dana najma · Sortiranje: Preporučeno</span>
                                </div>
                                {/* Category Filter Pill-ovi */}
                                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                                    {CAR_CATEGORIES.map(cat => (
                                        <button key={cat.value} type="button" onClick={() => setCarCategoryFilter(cat.value)}
                                            style={{
                                                padding: '5px 12px',
                                                border: `1.5px solid ${carCategoryFilter === cat.value ? 'var(--v6-accent)' : 'var(--v6-border)'}`,
                                                borderRadius: '999px',
                                                background: carCategoryFilter === cat.value ? 'var(--v6-accent)' : 'var(--v6-bg-main)',
                                                color: carCategoryFilter === cat.value ? 'var(--v6-accent-text)' : 'var(--v6-text-secondary)',
                                                fontSize: '12px', fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--v6-font)',
                                                transition: 'all 0.15s',
                                            }}>
                                            {cat.emoji} {cat.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            {/* Vozila lista */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }} role="list" aria-label={`${filtered.length} vozila`}>
                                {filtered.length === 0 && (
                                    <div style={{ padding: '24px', textAlign: 'center', color: 'var(--v6-text-muted)', fontSize: 'var(--v6-fs-sm)' }}>
                                        Nema vozila u kategoriji <strong>{carCategoryFilter}</strong>. Pokušajte drugu kategoriju.
                                    </div>
                                )}
                                {filtered.map((car, idx) => (
                                    <div key={car.id} role="listitem">
                                        <CarCard car={car} days={days} index={idx} />
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                })()}

                {/* ══ TRANSFER rezultati ══ */}
                {activeTab === 'transfer' && !isSearching && searchPerformed && transferResults.length === 0 && <NoResults />}
                {activeTab === 'transfer' && !isSearching && searchPerformed && transferResults.length > 0 && (() => {
                    const TRANSFER_TYPES = [
                        { value: 'all',     label: 'Svi', emoji: '🚌' },
                        { value: 'vip',     label: 'VIP', emoji: '🚘' },
                        { value: 'private', label: 'Privatni', emoji: '🚐' },
                        { value: 'shared',  label: 'Deljeni', emoji: '🚌' },
                        { value: 'shuttle', label: 'Shuttle', emoji: '🚍' },
                    ];
                    return (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', width: '100%' }}>
                            {/* Banner + Filter */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', padding: '14px 16px', background: 'var(--v6-bg-section)', borderRadius: 'var(--v6-radius-md)', border: '1px solid var(--v6-border)' }}>
                                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center', fontSize: 'var(--v6-fs-xs)', color: 'var(--v6-text-muted)' }}>
                                    <span>🚌 <strong style={{ color: 'var(--v6-text-primary)' }}>{transferResults.length} opcija</strong> dostupno</span>
                                    <span style={{ color: 'var(--v6-border)' }}>|</span>
                                    <span style={{ color: 'var(--v6-color-prime)', fontWeight: 600 }}>🏆 {transferResults.filter(t => t.isPrime).length} PRIME (vlastiti park)</span>
                                    <span style={{ color: 'var(--v6-border)' }}>|</span>
                                    <span>Cene su fiksne — bez taksimetra · Sortiranje: Preporučeno</span>
                                    {/* Direction toggle */}
                                    <div style={{ marginLeft: 'auto', display: 'flex', gap: '6px' }}>
                                        {(['one-way', 'round-trip'] as const).map(d => (
                                            <button key={d} type="button" onClick={() => setTransferDirection(d)}
                                                style={{ padding: '4px 12px', fontSize: '11px', fontWeight: 700, borderRadius: '999px', cursor: 'pointer', fontFamily: 'var(--v6-font)', transition: 'all 0.15s',
                                                    border: `1.5px solid ${transferDirection === d ? 'var(--v6-accent)' : 'var(--v6-border)'}`,
                                                    background: transferDirection === d ? 'var(--v6-accent)' : 'var(--v6-bg-main)',
                                                    color: transferDirection === d ? 'var(--v6-accent-text)' : 'var(--v6-text-secondary)',
                                                }}>
                                                {d === 'one-way' ? '→ Jedan pravac' : '⇄ Povratni'}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                {/* Type Filter Pill-ovi */}
                                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                                    {TRANSFER_TYPES.map(t => {
                                        const count = t.value === 'all' ? transferResults.length : transferResults.filter(r => r.vehicle.category === t.value).length;
                                        if (count === 0 && t.value !== 'all') return null;
                                        const isActive = t.value === 'all'
                                            ? !TRANSFER_TYPES.slice(1).some(tt => tt.value === 'all')
                                            : false; // handled via URL state in future
                                        return (
                                            <span key={t.value} style={{ padding: '4px 12px', fontSize: '12px', fontWeight: 600, borderRadius: '999px', border: '1px solid var(--v6-border)', background: 'var(--v6-bg-main)', color: 'var(--v6-text-secondary)' }}>
                                                {t.emoji} {t.label} ({count})
                                            </span>
                                        );
                                    })}
                                </div>
                            </div>
                            {/* Transfer lista */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }} role="list" aria-label={`${transferResults.length} transfera`}>
                                {transferResults.map((tr, idx) => (
                                    <div key={tr.id} role="listitem">
                                        <TransferCard transfer={tr} direction={transferDirection} index={idx} />
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                })()}

                {/* ══ PUTOVANJA (TOURS) rezultati ══ */}
                {activeTab === 'tour' && !isSearching && searchPerformed && tourResults.length === 0 && <NoResults />}
                {activeTab === 'tour' && !isSearching && searchPerformed && tourResults.length > 0 && (() => {
                    return (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', width: '100%' }}>
                            {/* Banner + Filter */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', padding: '14px 16px', background: 'var(--v6-bg-section)', borderRadius: 'var(--v6-radius-md)', border: '1px solid var(--v6-border)' }}>
                                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center', fontSize: 'var(--v6-fs-xs)', color: 'var(--v6-text-muted)' }}>
                                    <span>🌍 <strong style={{ color: 'var(--v6-text-primary)' }}>{tourResults.length} putovanja</strong> dostupno</span>
                                    <span style={{ color: 'var(--v6-border)' }}>|</span>
                                    <span style={{ color: 'var(--v6-color-prime)', fontWeight: 600 }}>🏆 {tourResults.filter(t => t.isPrime).length} PRIME (naša organizacija)</span>
                                    <span style={{ color: 'var(--v6-border)' }}>|</span>
                                    <span>Prikazane cene su po osobi · Sortiranje: Najbolje ocenjeno</span>
                                </div>
                                {/* Tip Filter Pill-ovi */}
                                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                                    {TOUR_CATEGORIES.map(cat => {
                                        const count = cat.value === 'all' ? tourResults.length : tourResults.filter(r => r.category === cat.value).length;
                                        if (count === 0 && cat.value !== 'all') return null;
                                        return (
                                            <span key={cat.value} style={{ padding: '4px 12px', fontSize: '12px', fontWeight: 600, borderRadius: '999px', border: '1px solid var(--v6-border)', background: 'var(--v6-bg-main)', color: 'var(--v6-text-secondary)' }}>
                                                {cat.emoji} {cat.label} ({count})
                                            </span>
                                        );
                                    })}
                                </div>
                            </div>
                            {/* Tour lista */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }} role="list" aria-label={`${tourResults.length} putovanja`}>
                                {tourResults.map((tour, idx) => (
                                    <div key={tour.id} role="listitem">
                                        <TourCard tour={tour} index={idx} />
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                })()}

                {/* ══ IZLETI I AKTIVNOSTI rezultati ══ */}
                {activeTab === 'things-to-do' && !isSearching && searchPerformed && activityResults.length === 0 && <NoResults />}
                {activeTab === 'things-to-do' && !isSearching && searchPerformed && activityResults.length > 0 && (() => {
                    return (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', width: '100%' }}>
                            {/* Banner + Filter */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', padding: '14px 16px', background: 'var(--v6-bg-section)', borderRadius: 'var(--v6-radius-md)', border: '1px solid var(--v6-border)' }}>
                                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center', fontSize: 'var(--v6-fs-xs)', color: 'var(--v6-text-muted)' }}>
                                    <span>🎟️ <strong style={{ color: 'var(--v6-text-primary)' }}>{activityResults.length} aktivnosti</strong> spremnih za provod</span>
                                    <span style={{ color: 'var(--v6-border)' }}>|</span>
                                    <span style={{ color: 'var(--v6-color-prime)', fontWeight: 600 }}>🏆 {activityResults.filter(t => t.isPrime).length} PRIME Ponude</span>
                                    <span style={{ color: 'var(--v6-border)' }}>|</span>
                                    <span>Besplatno otkazivanje u ponudi na sve</span>
                                </div>
                                {/* Tip Filter Pill-ovi */}
                                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                                    {ACTIVITY_CATEGORIES.map(cat => {
                                        const count = cat.value === 'all' ? activityResults.length : activityResults.filter(r => r.category === cat.value).length;
                                        if (count === 0 && cat.value !== 'all') return null;
                                        return (
                                            <span key={cat.value} style={{ padding: '4px 12px', fontSize: '12px', fontWeight: 600, borderRadius: '999px', border: '1px solid var(--v6-border)', background: 'var(--v6-bg-main)', color: 'var(--v6-text-secondary)' }}>
                                                {cat.emoji} {cat.label} ({count})
                                            </span>
                                        );
                                    })}
                                </div>
                            </div>
                            {/* Activities lista */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }} role="list" aria-label={`${activityResults.length} aktivnosti`}>
                                {activityResults.map((act, idx) => (
                                    <div key={act.id} role="listitem">
                                        <ActivityCard activity={act} pax={2} index={idx} />
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                })()}

                {/* ══ KRSTARENJA rezultati ══ */}
                {activeTab === 'cruise' && !isSearching && searchPerformed && cruiseResults.length === 0 && <NoResults />}
                {activeTab === 'cruise' && !isSearching && searchPerformed && cruiseResults.length > 0 && (() => {
                    return (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', width: '100%' }}>
                            {/* Banner + Filter */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', padding: '14px 16px', background: 'var(--v6-bg-section)', borderRadius: 'var(--v6-radius-md)', border: '1px solid var(--v6-border)' }}>
                                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center', fontSize: 'var(--v6-fs-xs)', color: 'var(--v6-text-muted)' }}>
                                    <span>🚢 <strong style={{ color: 'var(--v6-text-primary)' }}>{cruiseResults.length} plovidbe</strong> su pronađene</span>
                                    <span style={{ color: 'var(--v6-border)' }}>|</span>
                                    <span style={{ color: 'var(--v6-color-prime)', fontWeight: 600 }}>🏆 {cruiseResults.filter(t => t.isPrime).length} PRIME Ponude</span>
                                    <span style={{ color: 'var(--v6-border)' }}>|</span>
                                    <span>Sadrže unutrašnje, prozorske i balkonske kabine</span>
                                </div>
                                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                                    {CRUISE_REGIONS.map(cat => {
                                        const count = cat.value === 'all' ? cruiseResults.length : cruiseResults.filter(r => r.regionName.toLowerCase().includes(cat.label.toLowerCase())).length;
                                        if (count === 0 && cat.value !== 'all') return null;
                                        return (
                                            <span key={cat.value} style={{ padding: '4px 12px', fontSize: '12px', fontWeight: 600, borderRadius: '999px', border: '1px solid var(--v6-border)', background: 'var(--v6-bg-main)', color: 'var(--v6-text-secondary)' }}>
                                                {cat.emoji} {cat.label} ({count})
                                            </span>
                                        );
                                    })}
                                </div>
                            </div>
                            
                            {/* Cruises lista */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }} role="list" aria-label={`${cruiseResults.length} krstarenja`}>
                                {cruiseResults.map((cruise, idx) => (
                                    <div key={cruise.id} role="listitem">
                                        <CruiseCard cruise={cruise} pax={2} index={idx} />
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                })()}

            </div>

            {/* ══ PACKAGE BASKET (Korpa za paket) DNO EKRANA ══ */}
            <PackageBasket />

            {/* ══ CHECKOUT KASA (Full screen modal narudžbine) ══ */}
            {showPackageCheckout && <DynamicPackageCheckout />}

            {/* ═══════════════════════════════════════════════
                MODALNI OVERLAYS
            ═══════════════════════════════════════════════ */}

            {/* Room Wizard (Classic Clarity) */}
            {showRoomWizard && selectedHotel && (
                <HotelRoomWizard
                    hotel={selectedHotel}
                    onClose={handleCloseWizard}
                    onBook={handleBook}
                />
            )}

            {/* Itinerary Export & Share — radi i za hotel i za package */}
            {showExport && (
                <ItineraryExport
                    hotel={selectedHotel ?? undefined}
                    onClose={() => setShowExport(false)}
                />
            )}


            {/* ═══════════════════════════════════════════════
                SMART CONCIERGE (floating bubbles)
                Aktivira se kada korisnik izabere hotel
            ═══════════════════════════════════════════════ */}
            <SmartConcierge activeHotelCity={conciergeCity} />

            {/* SAVED OFFERS PANEL (Faza 6) */}
            <SavedOffersPanel />
        </div>
    );
};

export default PrimeSmartSearch;
