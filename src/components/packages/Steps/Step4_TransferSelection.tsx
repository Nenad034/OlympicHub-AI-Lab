import React, { useState, useEffect } from 'react';
import {
    Car, Plus, Trash2, ArrowRight, Info, Check,
    AlertCircle, Loader2, MapPin, Calendar, Clock,
    Users, Briefcase, Sparkles
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
        id: 'v2',
        name: 'Premium Van',
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

    useEffect(() => {
        // Simulate API call for transfers based on itinerary
        if (basicInfo && hotels.length > 0) {
            const offers: TransferSelectionData[] = [];
            const firstDest = basicInfo.destinations[0];
            const firstHotel = hotels[0];

            // Offer 1: Airport to Hotel
            offers.push({
                transfer: {
                    id: 't-in',
                    type: 'airport_hotel',
                    from: `Aerodrom ${firstDest.city}`,
                    to: firstHotel.hotel.name,
                    distance: 15,
                    duration: 30,
                    vehicles: VEHICLE_TEMPLATES
                },
                vehicle: VEHICLE_TEMPLATES[0],
                date: firstDest.checkIn,
                time: '14:30',
                totalPrice: VEHICLE_TEMPLATES[0].price
            });

            // Offer 2: Premium Option
            offers.push({
                transfer: {
                    id: 't-in-premium',
                    type: 'airport_hotel',
                    from: `Aerodrom ${firstDest.city}`,
                    to: firstHotel.hotel.name,
                    distance: 15,
                    duration: 30,
                    vehicles: VEHICLE_TEMPLATES
                },
                vehicle: VEHICLE_TEMPLATES[1],
                date: firstDest.checkIn,
                time: '14:30',
                totalPrice: VEHICLE_TEMPLATES[1].price
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

    return (
        <div className="step-content animate-fade-in">
            {/* 1. SECTION HEADER */}
            <div className="flex justify-between items-end mb-10">
                <div>
                    <h3 className="text-3xl font-black text-white uppercase tracking-tighter flex items-center gap-4">
                        <Car size={32} className="text-indigo-400" /> Dostupni Transferi
                    </h3>
                    <p className="text-slate-500 font-bold uppercase text-xs tracking-[0.2em] mt-2">Personalizovane opcije prevoza za vaše putovanje</p>
                </div>
                <div className="text-right">
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1">Ukupno transfera</span>
                    <div className="bg-indigo-500/10 border border-indigo-500/20 px-6 py-2 rounded-xl text-indigo-400 font-black">
                        {selectedTransfers.length} ODABRANO
                    </div>
                </div>
            </div>

            {/* 2. TRANSFERS GRID */}
            {isLoading ? (
                <div className="loading-state py-20 text-center">
                    <Loader2 size={48} className="spin text-indigo-500 mb-6 inline-block" />
                    <p className="text-slate-400 font-black uppercase text-xs tracking-widest">Preuzimamo ponude transfera...</p>
                </div>
            ) : (
                <div className="grid gap-6">
                    {availableOffers.map((offer, idx) => {
                        const isSelected = selectedTransfers.some(t => t.transfer.id === offer.transfer.id && t.vehicle.id === offer.vehicle.id);
                        return (
                            <div
                                key={idx}
                                className={`hotel-result-card-premium horizontal !h-[200px] ${isSelected ? 'selected-border' : ''}`}
                                onClick={() => handleToggleTransfer(offer)}
                            >
                                <div className="hotel-card-image !w-[300px]">
                                    <img src={offer.vehicle.image} alt={offer.vehicle.name} />
                                    <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-md px-3 py-1 rounded-lg text-[10px] font-black text-white uppercase tracking-widest">
                                        {offer.transfer.type.replace('_', ' ')}
                                    </div>
                                </div>

                                <div className="hotel-card-content !p-8 !flex-row">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-4 mb-4">
                                            <span className="text-xl font-black text-white uppercase tracking-tight">{offer.transfer.from}</span>
                                            <ArrowRight size={16} className="text-indigo-400" />
                                            <span className="text-xl font-black text-white uppercase tracking-tight">{offer.transfer.to}</span>
                                        </div>

                                        <div className="flex gap-6">
                                            <div className="flex items-center gap-2 text-slate-500">
                                                <Car size={14} />
                                                <span className="text-xs font-bold text-slate-300 uppercase">{offer.vehicle.name}</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-slate-500">
                                                <Users size={14} />
                                                <span className="text-xs font-bold text-slate-300 uppercase">{offer.vehicle.capacity.passengers} PAX</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-slate-500">
                                                <Calendar size={14} />
                                                <span className="text-xs font-bold text-slate-300 uppercase">{offer.date}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="w-px bg-white/5 h-full mx-8"></div>

                                    <div className="flex flex-col justify-center items-end min-w-[140px]">
                                        <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Fiksna cena</div>
                                        <div className="text-3xl font-black text-indigo-400 mb-4">{offer.totalPrice.toFixed(2)}€</div>

                                        <button
                                            className={`nav-btn primary !h-12 !px-8 w-full ${isSelected ? 'bg-green-600 shadow-green-900/50' : ''}`}
                                        >
                                            {isSelected ? <><Check size={16} /> ODABRANO</> : 'ODABERI'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}

                    {availableOffers.length === 0 && (
                        <div className="no-results py-20 text-center border border-dashed border-white/10 rounded-3xl">
                            <Info size={40} className="text-slate-600 mb-4 inline-block" />
                            <p className="text-slate-500 font-bold uppercase text-xs tracking-widest">Trenutno nema dostupnih transfera za ovu rutu</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default Step4_TransferSelection;
