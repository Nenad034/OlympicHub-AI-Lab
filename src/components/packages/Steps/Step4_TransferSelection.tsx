import React, { useState, useEffect } from 'react';
import {
    Car, Plus, Trash2, ArrowRight, Info, Check,
    AlertCircle, Loader2, MapPin, Calendar, Clock,
    Users, Briefcase, Sparkles, ChevronDown
} from 'lucide-react';
import './SmartSearchV2.css';
import type {
    BasicInfoData,
    FlightSelectionData,
    HotelSelectionData,
    TransferSelectionData,
    Transfer,
    TransferVehicle
} from '../../../types/packageSearch.types';

interface Step4Props {
    basicInfo: BasicInfoData | null;
    flights: FlightSelectionData | null;
    hotels: HotelSelectionData[];
    data: TransferSelectionData[];
    onUpdate: (data: TransferSelectionData[]) => void;
    onNext: () => void;
    onBack: () => void;
}

const VEHICLE_TEMPLATES: TransferVehicle[] = [
    {
        id: 'v1',
        name: 'Standard Sedan',
        type: 'sedan',
        capacity: { passengers: 3, luggage: 2 },
        amenities: ['Klima', 'Wi-Fi'],
        image: 'https://images.unsplash.com/photo-1550355291-bbee04a92027?auto=format&fit=crop&q=80&w=400',
        price: 25,
        currency: 'EUR'
    },
    {
        id: 'v1-return',
        name: 'Standard Sedan (Povratni)',
        type: 'sedan',
        capacity: { passengers: 3, luggage: 2 },
        amenities: ['Klima', 'Wi-Fi'],
        image: 'https://images.unsplash.com/photo-1550355291-bbee04a92027?auto=format&fit=crop&q=80&w=400',
        price: 25,
        currency: 'EUR'
    },
    {
        id: 'v2',
        name: 'Premium Van',
        type: 'van',
        capacity: { passengers: 7, luggage: 6 },
        amenities: ['Klima', 'Wi-Fi', 'Voda', 'Kožna sedišta'],
        image: 'https://images.unsplash.com/photo-1559416523-140dd386f38f?auto=format&fit=crop&q=80&w=400',
        price: 45,
        currency: 'EUR'
    },
    {
        id: 'v2-return',
        name: 'Premium Van (Povratni)',
        type: 'van',
        capacity: { passengers: 7, luggage: 6 },
        amenities: ['Klima', 'Wi-Fi', 'Voda', 'Kožna sedišta'],
        image: 'https://images.unsplash.com/photo-1559416523-140dd386f38f?auto=format&fit=crop&q=80&w=400',
        price: 45,
        currency: 'EUR'
    }
];

const Step4_TransferSelection: React.FC<Step4Props> = ({
    basicInfo,
    hotels,
    data,
    onUpdate,
    onNext,
    onBack
}) => {
    const [selectedTransfers, setSelectedTransfers] = useState<TransferSelectionData[]>(data || []);
    const [availableOffers, setAvailableOffers] = useState<TransferSelectionData[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeDestIndex, setActiveDestIndex] = useState(0);

    useEffect(() => {
        // Simulate API call for transfers based on itinerary
        if (basicInfo && hotels.length > 0) {
            const offers: TransferSelectionData[] = [];

            // Generate transfers for all destinations
            basicInfo.destinations.forEach((dest, destIdx) => {
                const hotel = hotels[destIdx];
                if (!hotel) return;

                // One way
                offers.push({
                    transfer: {
                        id: `t-in-${dest.id}`,
                        type: 'airport_hotel',
                        from: `Aerodrom ${dest.city}`,
                        to: hotel.hotel.name,
                        distance: 15,
                        duration: 30,
                        vehicles: VEHICLE_TEMPLATES
                    },
                    vehicle: VEHICLE_TEMPLATES[0],
                    date: dest.checkIn,
                    time: '14:30',
                    totalPrice: VEHICLE_TEMPLATES[0].price
                });

                // Premium one way
                offers.push({
                    transfer: {
                        id: `t-in-p-${dest.id}`,
                        type: 'airport_hotel',
                        from: `Aerodrom ${dest.city}`,
                        to: hotel.hotel.name,
                        distance: 15,
                        duration: 30,
                        vehicles: VEHICLE_TEMPLATES
                    },
                    vehicle: VEHICLE_TEMPLATES[2],
                    date: dest.checkIn,
                    time: '14:30',
                    totalPrice: VEHICLE_TEMPLATES[2].price
                });

                // Return
                offers.push({
                    transfer: {
                        id: `t-out-${dest.id}`,
                        type: 'hotel_airport',
                        from: hotel.hotel.name,
                        to: `Aerodrom ${dest.city}`,
                        distance: 15,
                        duration: 35,
                        vehicles: VEHICLE_TEMPLATES
                    },
                    vehicle: VEHICLE_TEMPLATES[1],
                    date: dest.checkOut,
                    time: '10:00',
                    totalPrice: VEHICLE_TEMPLATES[1].price
                });
            });

            setTimeout(() => {
                setAvailableOffers(offers);
                setIsLoading(false);
            }, 800);
        }
    }, [basicInfo, hotels]);

    const handleToggleTransfer = (offer: TransferSelectionData) => {
        const isSelected = selectedTransfers.some(t => t.transfer.id === offer.transfer.id && t.vehicle.id === offer.vehicle.id);
        let updated;
        if (isSelected) {
            updated = selectedTransfers.filter(t => !(t.transfer.id === offer.transfer.id && t.vehicle.id === offer.vehicle.id));
        } else {
            updated = [...selectedTransfers, offer];
        }
        setSelectedTransfers(updated);
        onUpdate(updated);
    };

    const currentDest = basicInfo?.destinations[activeDestIndex];
    const filteredOffers = availableOffers.filter(o =>
        o.transfer.from.includes(currentDest?.city || '') ||
        o.transfer.to.includes(currentDest?.city || '')
    );

    return (
        <div className="step-content animate-fade-in" style={{ paddingBottom: '100px' }}>
            {/* 1. DESTINATION NAVIGATION TABS */}
            <div className="search-tabs mb-10">
                {basicInfo?.destinations.map((dest, idx) => (
                    <button
                        key={idx}
                        className={`tab-btn ${activeDestIndex === idx ? 'active' : ''} ${selectedTransfers.some(t => t.transfer.from.includes(dest.city) || t.transfer.to.includes(dest.city)) ? 'complete' : ''}`}
                        onClick={() => setActiveDestIndex(idx)}
                    >
                        <Car size={14} style={{ color: activeDestIndex === idx ? 'white' : '#818cf8' }} />
                        <span className="font-bold">Transfer: {dest.city}</span>
                        {selectedTransfers.some(t => t.transfer.from.includes(dest.city) || t.transfer.to.includes(dest.city)) && <Check size={14} style={{ marginLeft: '8px', color: '#4ade80' }} />}
                    </button>
                ))}
            </div>

            {/* 2. SECTION HEADER */}
            <div className="flex justify-between items-end mb-8 px-2">
                <div>
                    <h3 className="text-2xl font-black text-white uppercase tracking-tighter flex items-center gap-3">
                        <Sparkles size={24} className="text-yellow-400" /> Dostupni Transferi u gradu {currentDest?.city}
                    </h3>
                    <p className="text-slate-500 font-bold uppercase text-[10px] tracking-widest mt-1">Izaberite privatni prevoz od ili do aerodroma</p>
                </div>
                <div className="text-right">
                    <div className="bg-slate-800/40 border border-white/5 px-4 py-2 rounded-xl">
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest mr-3">Odabrano:</span>
                        <span className="text-indigo-400 font-black">{selectedTransfers.length}</span>
                    </div>
                </div>
            </div>

            {/* 3. TRANSFERS LIST (AVIO STYLE) */}
            {isLoading ? (
                <div className="loading-state py-20 text-center">
                    <Loader2 size={48} className="spin text-indigo-500 mb-6 inline-block" />
                    <p className="text-slate-400 font-black uppercase text-xs tracking-widest">Preuzimamo ponude transfera...</p>
                </div>
            ) : (
                <div className="grid gap-4">
                    {filteredOffers.map((offer, idx) => {
                        const isSelected = selectedTransfers.some(t => t.transfer.id === offer.transfer.id && t.vehicle.id === offer.vehicle.id);
                        return (
                            <div
                                key={`${offer.transfer.id}-${offer.vehicle.id}`}
                                className={`flight-offer-card-ss ${isSelected ? 'selected-border' : ''}`}
                                onClick={() => handleToggleTransfer(offer)}
                                style={{ minHeight: '140px', cursor: 'pointer' }}
                            >
                                <div className="card-main-layout">
                                    {/* Left: Vehicle Image & Info */}
                                    <div className="flight-main-section-ss" style={{ padding: '1.25rem' }}>
                                        <div className="flex items-center gap-6 w-full">
                                            {/* Vehicle Image */}
                                            <div style={{ width: '120px', height: '80px', borderRadius: '12px', overflow: 'hidden', flexShrink: 0, position: 'relative' }}>
                                                <img src={offer.vehicle.image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                <div style={{ position: 'absolute', top: '5px', left: '5px', background: 'rgba(0,0,0,0.7)', padding: '2px 6px', borderRadius: '4px', fontSize: '8px', fontWeight: 900, color: 'white', textTransform: 'uppercase' }}>
                                                    {offer.transfer.type === 'airport_hotel' ? 'DOLAZAK' : 'ODLAZAK'}
                                                </div>
                                            </div>

                                            {/* Route Info */}
                                            <div className="flex-1">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <span style={{ fontSize: '0.85rem', fontWeight: 900, color: 'white', textTransform: 'uppercase' }}>{offer.transfer.from}</span>
                                                    <ArrowRight size={14} className="text-indigo-400" />
                                                    <span style={{ fontSize: '0.85rem', fontWeight: 900, color: 'white', textTransform: 'uppercase' }}>{offer.transfer.to}</span>
                                                </div>

                                                <div className="flex gap-4">
                                                    <div className="flex items-center gap-2 bg-white/5 px-2 py-1 rounded-md">
                                                        <Car size={12} className="text-indigo-400" />
                                                        <span style={{ fontSize: '10px', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase' }}>{offer.vehicle.name}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2 bg-white/5 px-2 py-1 rounded-md">
                                                        <Users size={12} className="text-indigo-400" />
                                                        <span style={{ fontSize: '10px', fontWeight: 800, color: '#94a3b8' }}>{offer.vehicle.capacity.passengers} PAX</span>
                                                    </div>
                                                    <div className="flex items-center gap-2 bg-white/5 px-2 py-1 rounded-md">
                                                        <Clock size={12} className="text-indigo-400" />
                                                        <span style={{ fontSize: '10px', fontWeight: 800, color: '#94a3b8' }}>{offer.transfer.duration} MIN</span>
                                                    </div>
                                                    <div className="flex items-center gap-2 bg-white/5 px-2 py-1 rounded-md">
                                                        <Calendar size={12} className="text-indigo-400" />
                                                        <span style={{ fontSize: '10px', fontWeight: 800, color: '#94a3b8' }}>{offer.date} @ {offer.time}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Right: Pricing & CTA */}
                                    <div className="flight-price-sidebar-ss" style={{ width: '220px', padding: '1.25rem', borderLeft: '1px solid rgba(255,255,255,0.05)' }}>
                                        <div className="price-label-ss" style={{ fontSize: '9px' }}>FIKSNA CENA</div>
                                        <div className="price-value-ss" style={{ fontSize: '1.75rem', color: '#fbbf24' }}>{offer.totalPrice.toFixed(2)}€</div>

                                        <button
                                            className={`nav-btn primary !h-10 !text-[10px] w-full mt-3 ${isSelected ? 'bg-green-600 shadow-green-900/40' : ''}`}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleToggleTransfer(offer);
                                            }}
                                        >
                                            {isSelected ? <><Check size={14} /> DODATO</> : 'DODAJ U PAKET'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}

                    {filteredOffers.length === 0 && (
                        <div className="no-results py-20 text-center border border-dashed border-white/10 rounded-3xl">
                            <Info size={40} className="text-slate-600 mb-4 inline-block" />
                            <p className="text-slate-500 font-bold uppercase text-[10px] tracking-widest">Trenutno nema dostupnih transfera za {currentDest?.city}</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default Step4_TransferSelection;
