import React, { useState, useEffect } from 'react';
import {
    MapPin, Calendar, Star, Search,
    Check, Info, Loader2, Sparkles,
    ChevronDown, Moon, ShieldAlert,
    Image as ImageIcon
} from 'lucide-react';
import { tctApi } from '../../../services/tctApi';
import './SmartSearchV2.css';
import type {
    BasicInfoData,
    HotelSelectionData,
    Hotel
} from '../../../types/packageSearch.types';

interface Step3Props {
    basicInfo: BasicInfoData | null;
    data: HotelSelectionData[];
    onUpdate: (data: HotelSelectionData[]) => void;
    onNext: () => void;
    onBack: () => void;
}

interface InternalHotelResult {
    id: string;
    source: 'TCT' | 'OpenGreece';
    name: string;
    location: string;
    price: number;
    currency: string;
    image: string;
    stars: number;
    mealPlanName: string;
    mealPlanCode: 'RO' | 'BB' | 'HB' | 'FB' | 'AI';
    rooms: any[];
    originalData: any;
}

const Step3_HotelSelection: React.FC<Step3Props> = ({
    basicInfo,
    data,
    onUpdate,
    onNext,
    onBack
}) => {
    const [activeDestIndex, setActiveDestIndex] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const [results, setResults] = useState<InternalHotelResult[]>([]);
    const [selectedHotels, setSelectedHotels] = useState<HotelSelectionData[]>(data || []);
    const [searchPerformed, setSearchPerformed] = useState<Record<number, boolean>>({});

    const currentDest = basicInfo?.destinations[activeDestIndex];

    useEffect(() => {
        if (currentDest) {
            handleSearch();
        }
    }, [activeDestIndex]);

    const handleSearch = async () => {
        if (!currentDest || !basicInfo) return;
        setIsLoading(true);
        try {
            const response = await tctApi.searchHotelsSync({
                location: currentDest.city,
                checkin: currentDest.checkIn,
                checkout: currentDest.checkOut,
                rooms: [{
                    adults: basicInfo.travelers.adults,
                    children: basicInfo.travelers.children,
                    children_ages: basicInfo.travelers.childrenAges || []
                }],
                search_type: 'city',
                currency: 'EUR'
            });

            if (response.success && response.data?.hotels) {
                const normalized = response.data.hotels.map((h: any) => ({
                    id: String(h.hotel_id || h.hid),
                    source: 'TCT' as const,
                    name: h.hotel_name || h.name,
                    location: h.address || currentDest.city,
                    price: h.min_rate || 0,
                    currency: 'EUR',
                    image: h.images?.[0] || '',
                    stars: parseInt(h.stars) || 0,
                    mealPlanName: h.meal_plan || 'N/A',
                    mealPlanCode: (h.meal_plan_code || 'RO') as any,
                    rooms: h.rooms || [],
                    originalData: h
                }));
                setResults(normalized);
                setSearchPerformed(prev => ({ ...prev, [activeDestIndex]: true }));
            }
        } catch (error) {
            console.error('Hotel search failed:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSelectHotel = (hotelResult: InternalHotelResult) => {
        if (!currentDest) return;
        const selection: HotelSelectionData = {
            destinationId: currentDest.id,
            hotel: {
                id: hotelResult.id,
                name: hotelResult.name,
                stars: hotelResult.stars,
                address: hotelResult.location,
                city: currentDest.city,
                country: currentDest.country,
                images: [hotelResult.image],
                description: hotelResult.name,
                amenities: [],
                rooms: [],
                reviews: { rating: 0, count: 0 },
                latitude: 0,
                longitude: 0
            },
            room: {
                id: 'r1',
                name: hotelResult.rooms?.[0]?.name || 'Standard Room',
                capacity: { adults: 2, children: 0 },
                bedType: 'Double',
                size: 0,
                amenities: [],
                mealPlans: [],
                images: [],
                description: ''
            },
            mealPlan: {
                id: 'm1',
                code: hotelResult.mealPlanCode,
                name: hotelResult.mealPlanName,
                price: 0,
                description: ''
            },
            checkIn: currentDest.checkIn,
            checkOut: currentDest.checkOut,
            nights: currentDest.nights,
            totalPrice: hotelResult.price
        };
        const updated = [...selectedHotels];
        updated[activeDestIndex] = selection;
        setSelectedHotels(updated);
        onUpdate(updated);

        // Auto move to next destination if more exist
        if (activeDestIndex < (basicInfo?.destinations.length || 0) - 1) {
            setTimeout(() => setActiveDestIndex(activeDestIndex + 1), 300);
        }
    };

    return (
        <div className="step-content animate-fade-in">

            {/* 1. FROZEN SEARCH FORM (Identical to Step 1) */}
            <div className="search-card-frame mb-12 opacity-90 border-dashed border-indigo-500/30">
                <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center gap-3">
                        <div className="bg-indigo-500/20 p-2 rounded-lg"><ShieldAlert size={20} className="text-indigo-400" /></div>
                        <div>
                            <h4 className="text-white font-black text-sm uppercase tracking-widest">Pretraga Smeštaja</h4>
                            <p className="text-[10px] text-slate-500 font-bold uppercase">Datumi su fiksirani prema planu putovanja</p>
                        </div>
                    </div>
                </div>

                <div className="form-field mb-8">
                    <label className="field-label-ss">DESTINACIJA ILI SMEŠTAJ</label>
                    <div className="ss-input-box bg-slate-800/20 cursor-not-allowed">
                        <div className="ss-chips-container">
                            <div className="ss-chip !bg-indigo-500/20 !border-indigo-500/40">
                                {currentDest?.city}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="ss-params-row grid-cols-5">
                    <div className="form-field">
                        <label className="field-label-ss"><Calendar size={14} /> CHECK-IN</label>
                        <div className="ss-input-box bg-slate-800/20 text-slate-400 cursor-not-allowed font-bold">
                            {currentDest?.checkIn}
                        </div>
                    </div>
                    <div className="form-field">
                        <label className="field-label-ss"><Calendar size={14} /> CHECK-OUT</label>
                        <div className="ss-input-box bg-slate-800/20 text-slate-400 cursor-not-allowed font-bold">
                            {currentDest?.checkOut}
                        </div>
                    </div>
                    <div className="form-field">
                        <label className="field-label-ss"><Moon size={14} /> NOĆENJA</label>
                        <div className="ss-input-box bg-slate-800/20 text-indigo-400 font-black justify-center">
                            {currentDest?.nights}
                        </div>
                    </div>
                    <div className="form-field">
                        <label className="field-label-ss"><Star size={14} /> KATEGORIJA</label>
                        <div className="ss-input-box justify-between">
                            <span>Sve kategorije</span>
                            <ChevronDown size={16} />
                        </div>
                    </div>
                    <div className="form-field">
                        <label className="field-label-ss"><Search size={14} /> FILTER</label>
                        <input type="text" className="ss-input-box" placeholder="Ime hotela..." />
                    </div>
                </div>
            </div>

            {/* 2. DESTINATION NAVIGATION TABS */}
            <div className="search-tabs mb-10">
                {basicInfo?.destinations.map((dest, idx) => (
                    <button
                        key={idx}
                        className={`tab-btn ${activeDestIndex === idx ? 'active' : ''} ${selectedHotels[idx] ? 'complete' : ''}`}
                        onClick={() => setActiveDestIndex(idx)}
                    >
                        <MapPin size={14} className="text-indigo-400" />
                        <span>Smeštaj: {dest.city}</span>
                        {selectedHotels[idx] && <Check size={14} className="ml-2 text-green-400" />}
                    </button>
                ))}
            </div>

            {/* 3. HOTEL BANNER RESULTS */}
            {isLoading ? (
                <div className="loading-state py-20 text-center">
                    <Loader2 size={48} className="spin text-indigo-500 mb-6 inline-block" />
                    <p className="text-slate-400 font-black uppercase text-sm tracking-widest">Tražimo najbolje hotele u gradu {currentDest?.city}...</p>
                </div>
            ) : (
                <div className="grid gap-6">
                    <div className="flex justify-between items-end mb-2">
                        <h3 className="text-xl font-black text-white flex items-center gap-3 uppercase tracking-tighter">
                            <Sparkles size={22} className="text-yellow-400" /> Predloženi Smeštaj
                        </h3>
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                            Prikazano {results.length} rezultata
                        </span>
                    </div>

                    <div className="grid gap-6">
                        {results.slice(0, 8).map(hotel => {
                            const isSelected = selectedHotels[activeDestIndex]?.hotel.id === hotel.id;
                            return (
                                <div
                                    key={hotel.id}
                                    className={`hotel-result-card-premium horizontal !h-[260px] ${isSelected ? 'selected-border' : ''}`}
                                    onClick={() => handleSelectHotel(hotel)}
                                >
                                    <div className="hotel-card-image !w-[380px]">
                                        <img src={hotel.image || "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&q=80&w=800"} alt="" />
                                        <div className="hotel-stars-badge">
                                            {Array(hotel.stars).fill(0).map((_, i) => <Star key={i} size={10} fill="currentColor" />)}
                                        </div>
                                        {isSelected && (
                                            <div className="absolute inset-0 bg-indigo-600/40 backdrop-blur-sm flex items-center justify-center">
                                                <div className="bg-white text-indigo-600 px-6 py-2 rounded-xl font-black text-xs uppercase shadow-xl tracking-widest">IZABRAN SMEŠTAJ</div>
                                            </div>
                                        )}
                                    </div>
                                    <div className="hotel-card-content !p-10">
                                        <div className="flex justify-between items-start">
                                            <div className="flex-1">
                                                <h4 className="text-2xl font-black text-white mb-2 uppercase tracking-tight">{hotel.name}</h4>
                                                <div className="flex items-center gap-2 text-slate-500 text-xs font-bold uppercase tracking-widest">
                                                    <MapPin size={12} className="text-indigo-400" /> {hotel.location}
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Cena po osobi</div>
                                                <div className="text-4xl font-black text-indigo-400 tracking-tighter">{(hotel.price / 2).toFixed(2)}€</div>
                                                <div className="text-[10px] font-bold text-slate-500 uppercase mt-1">Ukupno: {hotel.price.toFixed(2)}€</div>
                                            </div>
                                        </div>

                                        <div className="flex justify-between items-end mt-auto">
                                            <div className="flex gap-4">
                                                <div className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 flex items-center gap-3">
                                                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                                                    <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">{hotel.mealPlanName}</span>
                                                </div>
                                                <div className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 flex items-center gap-3">
                                                    <Info size={14} className="text-indigo-400" />
                                                    <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Besplatno otkazivanje</span>
                                                </div>
                                            </div>

                                            <button
                                                className={`nav-btn primary !h-14 !px-12 ${isSelected ? 'bg-green-600 shadow-green-900/50' : ''}`}
                                            >
                                                {isSelected ? <><Check size={20} /> POTVRĐENO</> : 'IZABERI SMEŠTAJ'}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
};

export default Step3_HotelSelection;
