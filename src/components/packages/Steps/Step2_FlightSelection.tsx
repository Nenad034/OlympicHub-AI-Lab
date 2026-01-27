import React, { useState, useEffect, useMemo } from 'react';
import {
    Plane, Search, Loader2, Clock,
    Briefcase, ChevronDown, ChevronUp, Check,
    AlertCircle, Info, MapPin
} from 'lucide-react';
import flightSearchManager from '../../../services/flight/flightSearchManager';
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
    onBack
}) => {
    // 1. Calculate Hops based on ITINERARY
    const hops = useMemo(() => {
        if (!basicInfo) return [];

        const result: FlightHop[] = [];
        const origin = 'BEG'; // Standard hub
        const originCity = 'Beograd';

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
    }, []);

    // Effect to trigger search when active hop changes
    useEffect(() => {
        if (hops.length > 0 && !hopOffers[activeHopIndex]) {
            searchForHop(activeHopIndex);
        }
    }, [activeHopIndex, hops]);

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

        // Prepare updated data for onUpdate
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
            }, 500);
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
    const isAllComplete = hops.every((_, i) => selectedOffers[i]);

    return (
        <div className="step-content">
            <div className="step-header">
                <h2><Plane size={24} /> Izbor Letova</h2>
                <p>Izaberite letove za svaku deonicu vašeg putovanja</p>
            </div>

            {/* Destination Leg Tabs */}
            <div className="destination-tabs flight-tabs">
                {hops.map((hop, idx) => {
                    const isSelected = !!selectedOffers[idx];
                    const isActive = activeHopIndex === idx;
                    return (
                        <button
                            key={hop.id}
                            className={`dest-tab ${isActive ? 'active' : ''} ${isSelected ? 'complete' : ''}`}
                            onClick={() => setActiveHopIndex(idx)}
                        >
                            <span className="dest-city">{hop.fromCity} ✈️ {hop.toCity}</span>
                            <span className="dest-status">
                                {isSelected ? (
                                    <><Check size={12} /> Izabrano</>
                                ) : (
                                    formatDate(hop.date)
                                )}
                            </span>
                        </button>
                    );
                })}
            </div>

            {/* Current Search Info */}
            <div className="current-dest-info">
                <div className="info-item">
                    <MapPin size={16} />
                    <span><strong>{currentHop?.fromCity}</strong> ({currentHop?.from}) &rarr; <strong>{currentHop?.toCity}</strong> ({currentHop?.to})</span>
                </div>
                <div className="info-item">
                    <Clock size={16} />
                    <span>{formatDate(currentHop?.date || '')}</span>
                </div>
                <div className="info-item price-summary">
                    <span>Ukupno za letove: <strong>{Object.values(selectedOffers).reduce((s, o) => s + (o?.price.total || 0), 0).toFixed(2)} €</strong></span>
                </div>
            </div>

            {isLoading ? (
                <div className="loading-state">
                    <Loader2 size={48} className="animate-spin" />
                    <p>Pretražujemo letove za {currentHop?.fromCity} &rarr; {currentHop?.toCity}...</p>
                </div>
            ) : error ? (
                <div className="no-results">
                    <AlertCircle size={48} color="#ef4444" />
                    <p>{error}</p>
                    <button onClick={() => searchForHop(activeHopIndex)} className="retry-btn">Pokušaj ponovo</button>
                </div>
            ) : currentOffers.length > 0 ? (
                <div className="flight-offers-list">
                    {currentOffers.map(offer => {
                        const isOfferSelected = selectedOffers[activeHopIndex]?.id === offer.id;
                        return (
                            <div
                                key={offer.id}
                                className={`flight-offer-card ${isOfferSelected ? 'selected' : ''}`}
                                onClick={() => handleSelectOffer(offer)}
                            >
                                <div className="offer-main">
                                    <div className="offer-slices">
                                        {offer.slices.map((slice: FlightSlice, idx) => (
                                            <div key={idx} className="slice-row">
                                                <div className="carrier-info">
                                                    <div className="airline-logo-placeholder">
                                                        {slice.segments[0].carrierCode}
                                                    </div>
                                                </div>
                                                <div className="time-info">
                                                    <span className="time">{formatTime(slice.departure)}</span>
                                                    <span className="airport">{slice.origin.city}</span>
                                                </div>
                                                <div className="route-viz">
                                                    <span className="duration">{formatDuration(slice.duration)}</span>
                                                    <div className="line">
                                                        <div className="plane-icon"><Plane size={14} /></div>
                                                    </div>
                                                    <span className="stops">
                                                        {slice.segments.length > 1
                                                            ? `${slice.segments.length - 1} presedanje`
                                                            : 'Direktan let'}
                                                    </span>
                                                </div>
                                                <div className="time-info">
                                                    <span className="time">{formatTime(slice.arrival)}</span>
                                                    <span className="airport">{slice.destination.city}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="offer-price-action">
                                        <div className="price-tag">
                                            <span className="amount">{offer.price.total.toFixed(2)}</span>
                                            <span className="currency">€</span>
                                        </div>
                                        <button
                                            className={`select-offer-btn ${isOfferSelected ? 'selected' : ''}`}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleSelectOffer(offer);
                                            }}
                                        >
                                            {isOfferSelected ? (
                                                <><Check size={18} /> Izabrano</>
                                            ) : (
                                                'Izaberi'
                                            )}
                                        </button>
                                    </div>
                                </div>

                                <div className="offer-footer">
                                    <div className="baggage-info">
                                        <Briefcase size={14} />
                                        <span>Ručni prtljag uključen</span>
                                    </div>
                                    <button
                                        className="details-toggle"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setExpandedOfferId(expandedOfferId === offer.id ? null : offer.id);
                                        }}
                                    >
                                        {expandedOfferId === offer.id ? (
                                            <><ChevronUp size={16} /> Manje informacija</>
                                        ) : (
                                            <><ChevronDown size={16} /> Više informacija</>
                                        )}
                                    </button>
                                </div>

                                {expandedOfferId === offer.id && (
                                    <div className="offer-details-expanded" onClick={e => e.stopPropagation()}>
                                        {offer.slices.map((slice: FlightSlice, sIdx) => (
                                            <div key={sIdx} className="segment-details">
                                                <div className="segment-header">
                                                    Deonica {sIdx + 1} - {formatDate(slice.departure)}
                                                </div>
                                                {slice.segments.map((seg: FlightSegment, segIdx) => (
                                                    <div key={segIdx} className="segment-info">
                                                        <div className="segment-time-line">
                                                            <div className="dot"></div>
                                                            <div className="content">
                                                                <strong>{formatTime(seg.departure)}</strong> {seg.origin.city}
                                                            </div>
                                                        </div>
                                                        <div className="segment-middle-line">
                                                            <div className="v-line"></div>
                                                            <div className="content">
                                                                <div className="flight-num">
                                                                    {seg.carrierName} {seg.flightNumber} • {seg.aircraft || 'Avion'}
                                                                </div>
                                                                <div className="duration">
                                                                    Trajanje: {formatDuration(seg.duration)}
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="segment-time-line">
                                                            <div className="dot"></div>
                                                            <div className="content">
                                                                <strong>{formatTime(seg.arrival)}</strong> {seg.destination.city}
                                                            </div>
                                                        </div>
                                                        {segIdx < slice.segments.length - 1 && (
                                                            <div className="layover">
                                                                <Clock size={14} />
                                                                Pauza: {formatDuration((new Date(slice.segments[segIdx + 1].departure).getTime() - new Date(seg.arrival).getTime()) / 60000)}
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            ) : null}

            <div className="flight-actions">
                <button className="step-back-btn" onClick={onBack}>Nazad</button>
                <div className="step-info-summary">
                    {hops.filter((_, i) => selectedOffers[i]).length} od {hops.length} letova izabrano
                </div>
                {activeHopIndex < hops.length - 1 && selectedOffers[activeHopIndex] ? (
                    <button
                        className="step-next-btn"
                        onClick={() => setActiveHopIndex(activeHopIndex + 1)}
                        style={{ marginTop: 0, width: 'auto' }}
                    >
                        Sledeći Let
                    </button>
                ) : (
                    <button
                        className="step-next-btn"
                        onClick={onNext}
                        disabled={!isAllComplete}
                        style={{ marginTop: 0, width: 'auto' }}
                    >
                        Nastavi na Hotele
                    </button>
                )}
            </div>
        </div>
    );
};

export default Step2_FlightSelection;

