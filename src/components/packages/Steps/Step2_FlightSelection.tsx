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
    }, [data]);

    // Effect to trigger search when active hop changes
    useEffect(() => {
        if (hops.length > 0 && !hopOffers[activeHopIndex]) {
            searchForHop(activeHopIndex);
        }
    }, [activeHopIndex, hops, hopOffers]);

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
                        <Plane size={14} className={activeHopIndex === idx ? 'text-white' : 'text-indigo-400'} />
                        <span className="font-bold">{hop.fromCity}</span>
                        <ArrowRight size={12} className="opacity-40" />
                        <span className="font-bold">{hop.toCity}</span>
                        {selectedOffers[idx] && <Check size={14} className="ml-2 text-green-400" />}
                    </button>
                ))}
            </div>

            {/* 2. CONTEXT BANNER */}
            <div className="info-summary-card mb-8 flex justify-between items-center py-4 px-8">
                <div className="flex gap-8">
                    <div className="flex items-center gap-3">
                        <Calendar size={18} className="text-indigo-400" />
                        <span className="text-sm font-black text-white uppercase tracking-widest">
                            {formatDate(currentHop?.date || '')}
                        </span>
                    </div>
                    <div className="flex items-center gap-3">
                        <Globe size={18} className="text-indigo-400" />
                        <span className="text-sm font-black text-white uppercase tracking-widest">
                            {currentHop?.fromCity} &rarr; {currentHop?.toCity}
                        </span>
                    </div>
                </div>
                <div className="text-xs font-black text-indigo-400 uppercase tracking-[0.2em]">
                    Odaberi let za deonicu #{activeHopIndex + 1}
                </div>
            </div>

            {/* 3. FLIGHT OFFERS */}
            {isLoading ? (
                <div className="loading-state py-20 text-center">
                    <Loader2 size={48} className="spin text-indigo-500 mb-6 inline-block" />
                    <p className="text-slate-400 font-black uppercase text-sm tracking-widest">Tražimo najbolje letove...</p>
                </div>
            ) : error ? (
                <div className="error-banner p-10 text-center bg-red-500/10 border border-red-500/20 rounded-2xl">
                    <AlertCircle size={40} className="text-red-500 mb-4 inline-block" />
                    <p className="text-white font-bold text-lg mb-6">{error}</p>
                    <button onClick={() => searchForHop(activeHopIndex)} className="nav-btn primary !px-10">Pokušaj ponovo</button>
                </div>
            ) : (
                <div className="grid gap-6">
                    {currentOffers.map(offer => {
                        const isSelected = selectedOffers[activeHopIndex]?.id === offer.id;
                        return (
                            <div
                                key={offer.id}
                                className={`hotel-result-card-premium horizontal !h-auto ${isSelected ? 'selected-border' : ''}`}
                                onClick={() => handleSelectOffer(offer)}
                            >
                                <div className="hotel-card-content !flex-row !p-0 w-full">
                                    {/* Left: Flight Path */}
                                    <div className="flex-1 p-8 border-r border-white/5">
                                        {offer.slices.map((slice, sIdx) => (
                                            <div key={sIdx} className="flex items-center gap-10">
                                                <div className="w-16 h-16 bg-white/5 rounded-2xl flex flex-col items-center justify-center border border-white/10">
                                                    <span className="text-[10px] font-black text-indigo-400 uppercase">{slice.segments[0].carrierCode}</span>
                                                    <span className="text-xs font-bold text-white mt-1">{slice.segments[0].flightNumber}</span>
                                                </div>

                                                <div className="flex-1 flex items-center justify-between gap-10">
                                                    <div className="text-center">
                                                        <div className="text-3xl font-black text-white">{formatTime(slice.departure)}</div>
                                                        <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">{slice.origin.city}</div>
                                                    </div>

                                                    <div className="flex-1 relative flex flex-col items-center">
                                                        <div className="text-[10px] font-black text-indigo-300 uppercase tracking-widest mb-3">{formatDuration(slice.duration)}</div>
                                                        <div className="w-full h-[2px] bg-slate-700 relative">
                                                            <Plane size={16} className="absolute left-1/2 -translate-x-1/2 top-[-7px] text-indigo-500 rotate-90" />
                                                        </div>
                                                        <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-3">
                                                            {slice.segments.length > 1 ? `${slice.segments.length - 1} PRESEDANJE` : 'DIREKTAN LET'}
                                                        </div>
                                                    </div>

                                                    <div className="text-center">
                                                        <div className="text-3xl font-black text-white">{formatTime(slice.arrival)}</div>
                                                        <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">{slice.destination.city}</div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Right: Pricing & CTA */}
                                    <div className="w-80 p-8 bg-black/20 flex flex-col justify-center items-center text-center">
                                        <div className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-2">Cena deonice</div>
                                        <div className="text-4xl font-black text-indigo-400 mb-6">{offer.price.total.toFixed(2)}€</div>

                                        <div className="flex flex-col gap-3 w-full">
                                            <button
                                                className={`nav-btn primary !h-14 !px-0 w-full ${isSelected ? 'bg-green-600 shadow-green-900/50 hover:bg-green-500' : ''}`}
                                            >
                                                {isSelected ? <><Check size={18} /> IZABRANO</> : 'IZABERI LET'}
                                            </button>

                                            <button
                                                className="text-[10px] font-black text-slate-500 uppercase tracking-widest hover:text-white transition-colors"
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
                                    <div className="w-full p-8 border-t border-white/5 bg-black/10 animate-slide-down" onClick={e => e.stopPropagation()}>
                                        <h4 className="text-xs font-black text-indigo-400 uppercase tracking-widest mb-6 border-b border-white/5 pb-4">PLAN LETA I DETALJI</h4>
                                        <div className="grid gap-8">
                                            {offer.slices[0].segments.map((seg, idx) => (
                                                <div key={idx} className="flex gap-10 items-start">
                                                    <div className="w-2 h-2 rounded-full bg-indigo-500 mt-2 shadow-[0_0_15px_#6366f1]"></div>
                                                    <div className="flex-1">
                                                        <div className="flex justify-between mb-2">
                                                            <div className="text-sm font-black text-white">{formatTime(seg.departure)} — {seg.origin.city} ({seg.origin.code})</div>
                                                            <div className="text-xs font-bold text-slate-500">{seg.carrierName} {seg.flightNumber}</div>
                                                        </div>
                                                        <p className="text-xs text-slate-400">Trajanje: {formatDuration(seg.duration)} • Avion: {seg.aircraft || 'Commercial Jet'}</p>
                                                        <div className="text-sm font-black text-white mt-4">{formatTime(seg.arrival)} — {seg.destination.city} ({seg.destination.code})</div>

                                                        {idx < offer.slices[0].segments.length - 1 && (
                                                            <div className="mt-6 p-4 bg-orange-500/10 border border-orange-500/20 rounded-xl text-center">
                                                                <span className="text-[10px] font-black text-orange-400 uppercase tracking-widest">
                                                                    PAUZA NA AERODROMU: {formatDuration((new Date(offer.slices[0].segments[idx + 1].departure).getTime() - new Date(seg.arrival).getTime()) / 60000)}
                                                                </span>
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
