import React, { useState, useEffect, useMemo } from 'react';
import {
    Plane, Search, Loader2, Clock,
    Briefcase, ChevronDown, ChevronUp, Check,
    AlertCircle, Info, MapPin, ArrowRight,
    Calendar, Globe
} from 'lucide-react';
import flightSearchManager from '../../../services/flight/flightSearchManager';
import './SmartSearchV2.css';
import type {
    BasicInfoData,
    FlightSelectionData
} from '../../../types/packageSearch.types';
import type {
    UnifiedFlightOffer,
    FlightSearchParams,
    FlightSlice,
    FlightSegment
} from '../../../types/flight.types';

interface Step2Props {
    basicInfo: BasicInfoData | null;
    data: FlightSelectionData | null;
    onUpdate: (data: FlightSelectionData) => void;
    onNext: () => void;
    onBack: () => void;
    prefetchedOffers?: Record<number, UnifiedFlightOffer[]>;
}

interface FlightHop {
    id: string;
    from: string;
    fromCity: string;
    to: string;
    toCity: string;
    date: string;
    type: 'outbound' | 'internal' | 'return';
}

const Step2_FlightSelection: React.FC<Step2Props> = ({
    basicInfo,
    data,
    onUpdate,
    onNext,
    onBack,
    prefetchedOffers
}) => {
    // 1. Calculate Hops based on ITINERARY
    const hops = useMemo(() => {
        if (!basicInfo) return [];

        const result: FlightHop[] = [];
        const origin = basicInfo.originCode || 'BEG';
        const originCity = basicInfo.originCity || 'Beograd (BEG)';

        // Leg 1: Origin to First Destination
        result.push({
            id: 'hop-0',
            from: origin,
            fromCity: originCity,
            to: basicInfo.destinations[0].airportCode || basicInfo.destinations[0].city,
            toCity: basicInfo.destinations[0].city,
            date: basicInfo.destinations[0].checkIn,
            type: 'outbound'
        });

        // Intermediate Legs: Between Destinations
        for (let i = 1; i < basicInfo.destinations.length; i++) {
            result.push({
                id: `hop-${i}`,
                from: basicInfo.destinations[i - 1].airportCode || basicInfo.destinations[i - 1].city,
                fromCity: basicInfo.destinations[i - 1].city,
                to: basicInfo.destinations[i].airportCode || basicInfo.destinations[i].city,
                toCity: basicInfo.destinations[i].city,
                date: basicInfo.destinations[i].checkIn,
                type: 'internal'
            });
        }

        // Final Leg: Last Destination back to Origin
        const lastDest = basicInfo.destinations[basicInfo.destinations.length - 1];
        result.push({
            id: `hop-final`,
            from: lastDest.airportCode || lastDest.city,
            fromCity: lastDest.city,
            to: origin,
            toCity: originCity,
            date: lastDest.checkOut,
            type: 'return'
        });

        return result;
    }, [basicInfo]);

    const [activeHopIndex, setActiveHopIndex] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const [hopOffers, setHopOffers] = useState<Record<number, UnifiedFlightOffer[]>>({});
    const [selectedOffers, setSelectedOffers] = useState<Record<number, UnifiedFlightOffer | null>>({});
    const [expandedOfferId, setExpandedOfferId] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Initial load: Load existing data if available
    useEffect(() => {
        if (data && data.multiCityFlights.length > 0) {
            const initialSelected: Record<number, UnifiedFlightOffer> = {};
            data.multiCityFlights.forEach((offer, idx) => {
                initialSelected[idx] = offer;
            });
            setSelectedOffers(initialSelected);
        }
    }, [data]);

    // Effect to trigger search when active hop changes
    useEffect(() => {
        if (hops.length > 0 && !hopOffers[activeHopIndex]) {
            // Check prefetch first
            if (prefetchedOffers && prefetchedOffers[activeHopIndex]) {
                setHopOffers(prev => ({ ...prev, [activeHopIndex]: prefetchedOffers[activeHopIndex] }));
                // console.log(`[Step2] Using prefetched data for hop ${activeHopIndex}`);
            } else {
                searchForHop(activeHopIndex);
            }
        }
    }, [activeHopIndex, hops, hopOffers, prefetchedOffers]);

    const searchForHop = async (index: number) => {
        const hop = hops[index];
        if (!hop || !basicInfo) return;

        setIsLoading(true);
        setError(null);

        const searchParams: FlightSearchParams = {
            origin: hop.from,
            destination: hop.to,
            departureDate: hop.date,
            adults: basicInfo.travelers.adults,
            children: basicInfo.travelers.children,
            childrenAges: basicInfo.travelers.childrenAges || [],
            cabinClass: 'economy',
            currency: 'EUR'
        };

        try {
            const response = await flightSearchManager.searchFlights(searchParams);
            setHopOffers(prev => ({ ...prev, [index]: response.offers }));

            if (response.offers.length === 0) {
                setError(`Nijedan let nije pronađen za relaciju ${hop.fromCity} - ${hop.toCity}.`);
            }
        } catch (err) {
            console.error('Flight search failed:', err);
            setError('Došlo je do greške prilikom pretrage letova. Molimo pokušajte ponovo.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSelectOffer = (offer: UnifiedFlightOffer) => {
        const newSelected = { ...selectedOffers, [activeHopIndex]: offer };
        setSelectedOffers(newSelected);

        const allSelected = Object.values(newSelected).filter((o): o is UnifiedFlightOffer => o !== null);
        const totalPrice = allSelected.reduce((sum, o) => sum + o.price.total, 0);

        onUpdate({
            outboundFlight: newSelected[0] || null,
            returnFlight: newSelected[hops.length - 1] || null,
            multiCityFlights: hops.map((_, i) => newSelected[i] || null).filter((o): o is UnifiedFlightOffer => o !== null),
            totalPrice
        });

        // Automatically move to next leg if available
        if (activeHopIndex < hops.length - 1) {
            setTimeout(() => {
                setActiveHopIndex(activeHopIndex + 1);
            }, 300);
        }
    };

    const formatDuration = (minutes: number) => {
        const h = Math.floor(minutes / 60);
        const m = minutes % 60;
        return `${h}h ${m}m`;
    };

    const formatTime = (dateStr: string) => {
        return new Date(dateStr).toLocaleTimeString('sr-RS', {
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('sr-RS', {
            day: '2-digit',
            month: 'short'
        });
    };

    const currentHop = hops[activeHopIndex];
    const currentOffers = hopOffers[activeHopIndex] || [];

    return (
        <div className="step-content animate-fade-in">
            {/* 1. DEONICE (Search Tabs Style) */}
            <div className="search-tabs mb-10">
                {hops.map((hop, idx) => (
                    <button
                        key={idx}
                        className={`tab-btn ${activeHopIndex === idx ? 'active' : ''} ${selectedOffers[idx] ? 'complete' : ''}`}
                        onClick={() => setActiveHopIndex(idx)}
                    >
                        <Plane size={14} style={{ color: activeHopIndex === idx ? 'white' : '#818cf8' }} />
                        <span className="font-bold">{hop.fromCity}</span>
                        <ArrowRight size={12} style={{ opacity: 0.4 }} />
                        <span className="font-bold">{hop.toCity}</span>
                        {selectedOffers[idx] && <Check size={14} style={{ marginLeft: '8px', color: '#4ade80' }} />}
                    </button>
                ))}
            </div>

            {/* 2. CONTEXT BANNER */}
            <div className="info-summary-card mb-8" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 2rem' }}>
                <div style={{ display: 'flex', gap: '2rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <Calendar size={18} style={{ color: '#818cf8' }} />
                        <span style={{ fontSize: '0.85rem', fontWeight: 900, color: 'white', textTransform: 'uppercase', letterSpacing: '1px' }}>
                            {formatDate(currentHop?.date || '')}
                        </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <Globe size={18} style={{ color: '#818cf8' }} />
                        <span style={{ fontSize: '0.85rem', fontWeight: 900, color: 'white', textTransform: 'uppercase', letterSpacing: '1px' }}>
                            {currentHop?.fromCity} &rarr; {currentHop?.toCity}
                        </span>
                    </div>
                </div>
                <div style={{ fontSize: '0.7rem', fontWeight: 900, color: '#818cf8', textTransform: 'uppercase', letterSpacing: '0.2em' }}>
                    Odaberi let za deonicu #{activeHopIndex + 1}
                </div>
            </div>

            {/* 3. FLIGHT OFFERS */}
            {isLoading ? (
                <div className="loading-state" style={{ padding: '4rem 0', textAlign: 'center' }}>
                    <Loader2 size={48} className="spin" style={{ color: '#6366f1', marginBottom: '1.5rem', display: 'inline-block' }} />
                    <p style={{ color: '#94a3b8', fontWeight: 900, textTransform: 'uppercase', fontSize: '0.85rem', letterSpacing: '2px' }}>Tražimo najbolje letove...</p>
                </div>
            ) : error ? (
                <div className="error-banner" style={{ padding: '2.5rem', textAlign: 'center', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '20px' }}>
                    <AlertCircle size={40} style={{ color: '#ef4444', marginBottom: '1rem', display: 'inline-block' }} />
                    <p style={{ color: 'white', fontWeight: 'bold', fontSize: '1.1rem', marginBottom: '1.5rem' }}>{error}</p>
                    <button onClick={() => searchForHop(activeHopIndex)} className="nav-btn primary" style={{ padding: '0 2.5rem' }}>Pokušaj ponovo</button>
                </div>
            ) : (
                <div style={{ display: 'grid', gap: '1.5rem' }}>
                    {currentOffers.map(offer => {
                        const isSelected = selectedOffers[activeHopIndex]?.id === offer.id;
                        return (
                            <div
                                key={offer.id}
                                className={`flight-offer-card-ss ${isSelected ? 'selected-border' : ''}`}
                                onClick={() => handleSelectOffer(offer)}
                            >
                                <div className="card-main-layout">
                                    {/* Left: Flight Path */}
                                    <div className="flight-main-section-ss">
                                        <div className="airline-info-ss">
                                            <div className="airline-logo-box-ss">
                                                <span className="carrier-code">{offer.slices[0].segments[0].carrierCode}</span>
                                                <span className="flight-num">{offer.slices[0].segments[0].flightNumber}</span>
                                            </div>
                                        </div>

                                        <div className="flight-path-ss">
                                            <div className="path-point-ss">
                                                <div className="path-time-ss">{formatTime(offer.slices[0].departure)}</div>
                                                <div className="path-city-ss">{offer.slices[0].origin.city}</div>
                                            </div>

                                            <div className="path-visual-ss">
                                                <div className="path-duration-ss">{formatDuration(offer.slices[0].duration)}</div>
                                                <div className="path-line-ss">
                                                    <div className="path-icon-ss">
                                                        <Plane size={16} style={{ transform: 'rotate(90deg)' }} />
                                                    </div>
                                                </div>
                                                <div className="path-stops-ss">
                                                    {offer.slices[0].segments.length > 1 ? `${offer.slices[0].segments.length - 1} PRESEDANJE` : 'DIREKTAN LET'}
                                                </div>
                                            </div>

                                            <div className="path-point-ss">
                                                <div className="path-time-ss">{formatTime(offer.slices[0].arrival)}</div>
                                                <div className="path-city-ss">{offer.slices[0].destination.city}</div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Right: Pricing & CTA */}
                                    <div className="flight-price-sidebar-ss">
                                        <div className="price-label-ss">Cena deonice</div>
                                        <div className="price-value-ss">{offer.price.total.toFixed(2)}€</div>

                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', width: '100%' }}>
                                            <button
                                                className={`nav-btn primary ${isSelected ? 'success' : ''}`}
                                                style={{ height: '56px', width: '100%', justifyContent: 'center' }}
                                            >
                                                {isSelected ? <><Check size={18} /> IZABRANO</> : 'IZABERI LET'}
                                            </button>

                                            <button
                                                className="details-trigger-ss"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setExpandedOfferId(expandedOfferId === offer.id ? null : offer.id);
                                                }}
                                            >
                                                {expandedOfferId === offer.id ? 'SAKRIJ DETALJE' : 'DETALJI LETA +'}
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* Expanded Details */}
                                {expandedOfferId === offer.id && (
                                    <div className="flight-expanded-details-ss" onClick={e => e.stopPropagation()}>
                                        <h4 style={{ fontSize: '0.7rem', fontWeight: 900, color: '#818cf8', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '1rem' }}>
                                            PLAN LETA I DETALJI
                                        </h4>
                                        <div style={{ display: 'grid', gap: '2rem' }}>
                                            {offer.slices[0].segments.map((seg, idx) => (
                                                <div key={idx} className="segment-row-ss">
                                                    <div className="segment-dot-ss"></div>
                                                    <div className="segment-content-ss">
                                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                                            <div style={{ fontSize: '0.9rem', fontWeight: 900, color: 'white' }}>
                                                                {formatTime(seg.departure)} — {seg.origin.city} ({seg.origin.iataCode})
                                                            </div>
                                                            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b' }}>
                                                                {seg.carrierName} {seg.flightNumber}
                                                            </div>
                                                        </div>
                                                        <p style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                                                            Trajanje: {formatDuration(seg.duration)} • Avion: {seg.aircraft || 'Commercial Jet'}
                                                        </p>
                                                        <div style={{ fontSize: '0.9rem', fontWeight: 900, color: 'white', marginTop: '1rem' }}>
                                                            {formatTime(seg.arrival)} — {seg.destination.city} ({seg.destination.iataCode})
                                                        </div>

                                                        {idx < offer.slices[0].segments.length - 1 && (
                                                            <div className="layover-badge-ss">
                                                                <Clock size={14} />
                                                                PAUZA NA AERODROMU: {formatDuration((new Date(offer.slices[0].segments[idx + 1].departure).getTime() - new Date(seg.arrival).getTime()) / 60000)}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default Step2_FlightSelection;
