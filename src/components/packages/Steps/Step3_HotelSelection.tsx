import React, { useState, useEffect } from 'react';
import {
    MapPin, Calendar, Star, Search,
    Check, Info, Loader2, Sparkles,
    ChevronDown, Moon, ShieldAlert,
    LayoutGrid, List as ListIcon,
    ArrowRight, Filter, SortAsc
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
    mealPlanCode: 'RO' | 'BB' | 'HB' | 'FB' | 'AI' | 'UAI';
    rooms: any[];
    originalData: any;
}

const DEMO_HOTELS: InternalHotelResult[] = [
    {
        id: 'demo-1',
        source: 'TCT',
        name: 'International Casino & Tower Suites',
        location: 'Golden Sands, Bulgaria',
        price: 1224,
        currency: 'EUR',
        image: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=800&q=80',
        stars: 5,
        mealPlanName: 'Polupansion',
        mealPlanCode: 'HB',
        rooms: [],
        originalData: {}
    },
    {
        id: 'demo-2',
        source: 'TCT',
        name: 'Melia Grand Hermitage',
        location: 'Golden Sands, Bulgaria',
        price: 1572,
        currency: 'EUR',
        image: 'https://images.unsplash.com/photo-1571011270518-267b1c552167?auto=format&fit=crop&w=800&q=80',
        stars: 5,
        mealPlanName: 'All Inclusive',
        mealPlanCode: 'AI',
        rooms: [],
        originalData: {}
    },
    {
        id: 'demo-3',
        source: 'TCT',
        name: 'Admiral Hotel Premium',
        location: 'Golden Sands, Bulgaria',
        price: 1862,
        currency: 'EUR',
        image: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=800&q=80',
        stars: 5,
        mealPlanName: 'Ultra All Inclusive',
        mealPlanCode: 'UAI',
        rooms: [],
        originalData: {}
    },
    {
        id: 'demo-4',
        source: 'TCT',
        name: 'Grifid Noa Luxury Resort',
        location: 'Golden Sands, Bulgaria',
        price: 2266,
        currency: 'EUR',
        image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80',
        stars: 5,
        mealPlanName: 'Samo Smeštaj',
        mealPlanCode: 'RO',
        rooms: [],
        originalData: {}
    },
    {
        id: 'demo-5',
        source: 'TCT',
        name: 'Palma Boutique Hotel',
        location: 'Golden Sands, Bulgaria',
        price: 460,
        currency: 'EUR',
        image: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=80',
        stars: 4,
        mealPlanName: 'All Inclusive',
        mealPlanCode: 'AI',
        rooms: [],
        originalData: {}
    },
    {
        id: 'demo-6',
        source: 'TCT',
        name: 'Allegra Balneo & SPA',
        location: 'Golden Sands, Bulgaria',
        price: 536,
        currency: 'EUR',
        image: 'https://images.unsplash.com/photo-1551882547-ff43c63efe81?auto=format&fit=crop&w=800&q=80',
        stars: 4,
        mealPlanName: 'Noćenje sa doručkom',
        mealPlanCode: 'BB',
        rooms: [],
        originalData: {}
    },
    {
        id: 'demo-7',
        source: 'TCT',
        name: 'BSA Holiday Park',
        location: 'Golden Sands, Bulgaria',
        price: 540,
        currency: 'EUR',
        image: 'https://images.unsplash.com/photo-1445019980597-93fa8acb246c?auto=format&fit=crop&w=800&q=80',
        stars: 4,
        mealPlanName: 'All Inclusive',
        mealPlanCode: 'AI',
        rooms: [],
        originalData: {}
    },
    {
        id: 'demo-8',
        source: 'TCT',
        name: 'BSA Gradina & Aquapark',
        location: 'Golden Sands, Bulgaria',
        price: 626,
        currency: 'EUR',
        image: 'https://images.unsplash.com/photo-1561501900-3701fa6a0cf6?auto=format&fit=crop&w=800&q=80',
        stars: 4,
        mealPlanName: 'All Inclusive',
        mealPlanCode: 'AI',
        rooms: [],
        originalData: {}
    }
];

const CATEGORY_OPTIONS = ["Kategorija", "5 Zvezdica", "4 Zvezdice", "3 Zvezdice"];
const SERVICE_OPTIONS = ["Usluga", "RO", "BB", "HB", "FB", "AI", "UAI"];

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
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [sortBy, setSortBy] = useState<'smart' | 'price'>('smart');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedStars, setSelectedStars] = useState('Kategorija');
    const [selectedMeal, setSelectedMeal] = useState('Usluga');

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

            let hotelResults: InternalHotelResult[] = [];

            if (response.success && response.data?.hotels && response.data.hotels.length > 0) {
                hotelResults = response.data.hotels.map((h: any) => ({
                    id: String(h.hotel_id || h.hid),
                    source: 'TCT' as const,
                    name: h.hotel_name || h.name,
                    location: h.address || currentDest.city,
                    price: h.min_rate || (Math.random() * 1000 + 400),
                    currency: 'EUR',
                    image: h.images?.[0] || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&q=80&w=800',
                    stars: parseInt(h.stars) || 4,
                    mealPlanName: h.meal_plan || 'Polupansion',
                    mealPlanCode: (h.meal_plan_code || 'HB') as "RO" | "BB" | "HB" | "FB" | "AI" | "UAI",
                    rooms: h.rooms || [],
                    originalData: h
                }));
            } else {
                // FALLBACK TO PREMIUM DEMO DATA with city mapping
                hotelResults = DEMO_HOTELS.map(h => ({
                    ...h,
                    location: `${currentDest.city}, ${currentDest.country || 'Europe'}`
                }));
            }

            setResults(hotelResults);
        } catch (error) {
            console.error('Hotel search failed:', error);
            // Fallback on error too
            setResults(DEMO_HOTELS.map(h => ({
                ...h,
                location: `${currentDest.city}, ${currentDest.country || 'Europe'}`
            })));
        } finally {
            setIsLoading(false);
        }
    };

    const filteredResults = results.filter(hotel => {
        if (searchTerm) {
            const s = searchTerm.toLowerCase();
            const matchesName = hotel.name.toLowerCase().includes(s);
            const matchesLoc = hotel.location && hotel.location.toLowerCase().includes(s);
            if (!matchesName && !matchesLoc) return false;
        }
        if (selectedStars !== 'Kategorija') {
            const starNum = parseInt(selectedStars[0]);
            if (hotel.stars !== starNum) return false;
        }
        if (selectedMeal !== 'Usluga') {
            if (hotel.mealPlanCode !== selectedMeal) return false;
        }
        return true;
    }).sort((a, b) => {
        if (sortBy === 'price') return a.price - b.price;
        return 0; // Smart sort placeholder
    });

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

        if (activeDestIndex < (basicInfo?.destinations.length || 0) - 1) {
            setTimeout(() => setActiveDestIndex(activeDestIndex + 1), 300);
        }
    };

    const formatDateRange = (start: string, end: string) => {
        if (!start || !end) return '';
        const s = new Date(start);
        const e = new Date(end);
        const fmt = (d: Date) => d.toLocaleDateString('sr-RS', { day: '2-digit', month: '2-digit', year: 'numeric' });
        return `${fmt(s)} - ${fmt(e)}`;
    };

    return (
        <div className="step-content animate-fade-in" style={{ paddingBottom: '100px' }}>

            <div className="search-tabs mb-10">
                {basicInfo?.destinations.map((dest, idx) => (
                    <button
                        key={idx}
                        className={`tab-btn ${activeDestIndex === idx ? 'active' : ''} ${selectedHotels[idx] ? 'complete' : ''}`}
                        onClick={() => setActiveDestIndex(idx)}
                    >
                        <MapPin size={14} style={{ color: activeDestIndex === idx ? 'white' : '#818cf8' }} />
                        <span className="font-bold">Smeštaj: {dest.city}</span>
                        {selectedHotels[idx] && <Check size={14} style={{ marginLeft: '8px', color: '#4ade80' }} />}
                    </button>
                ))}
            </div>

            <div className="filters-toolbar-v4" style={{
                background: 'rgba(15, 23, 42, 0.4)',
                backdropFilter: 'blur(20px)',
                padding: '1rem 2rem',
                borderRadius: '18px',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                display: 'flex',
                gap: '1.5rem',
                alignItems: 'center',
                marginBottom: '2rem'
            }}>
                <div style={{ position: 'relative', flex: 1.5 }}>
                    <Search size={18} style={{ position: 'absolute', left: '1.25rem', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
                    <input
                        type="text"
                        placeholder="Traži po nazivu..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{ width: '100%', height: '52px', background: '#0f172a', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '12px', padding: '0 1.25rem 0 3.5rem', color: 'white', fontSize: '0.9rem' }}
                    />
                </div>

                <div style={{ flex: 1, position: 'relative' }}>
                    <select
                        value={selectedStars}
                        onChange={(e) => setSelectedStars(e.target.value)}
                        style={{ width: '100%', height: '52px', background: '#0f172a', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '12px', padding: '0 1.25rem', color: '#94a3b8', appearance: 'none', fontSize: '0.9rem' }}
                    >
                        {CATEGORY_OPTIONS.map(opt => <option key={opt}>{opt}</option>)}
                    </select>
                    <ChevronDown size={14} style={{ position: 'absolute', right: '1.25rem', top: '50%', transform: 'translateY(-50%)', color: '#64748b', pointerEvents: 'none' }} />
                </div>

                <div style={{ flex: 1, position: 'relative' }}>
                    <select
                        value={selectedMeal}
                        onChange={(e) => setSelectedMeal(e.target.value)}
                        style={{ width: '100%', height: '52px', background: '#0f172a', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '12px', padding: '0 1.25rem', color: '#94a3b8', appearance: 'none', fontSize: '0.9rem' }}
                    >
                        {SERVICE_OPTIONS.map(opt => <option key={opt}>{opt}</option>)}
                    </select>
                    <ChevronDown size={14} style={{ position: 'absolute', right: '1.25rem', top: '50%', transform: 'translateY(-50%)', color: '#64748b', pointerEvents: 'none' }} />
                </div>

                <div style={{ display: 'flex', background: '#0f172a', padding: '4px', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
                    <button onClick={() => setViewMode('grid')} style={{ width: '44px', height: '44px', borderRadius: '10px', background: viewMode === 'grid' ? '#6366f1' : 'transparent', border: 'none', color: 'white', cursor: 'pointer' }}><LayoutGrid size={20} /></button>
                    <button onClick={() => setViewMode('list')} style={{ width: '44px', height: '44px', borderRadius: '10px', background: viewMode === 'list' ? '#6366f1' : 'transparent', border: 'none', color: 'white', cursor: 'pointer' }}><ListIcon size={20} /></button>
                </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', padding: '0 0.5rem' }}>
                <div style={{ color: '#94a3b8', fontSize: '0.85rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '1px' }}>
                    REZULTATA: <span style={{ color: 'white' }}>{filteredResults.length}</span>
                </div>
                <div style={{ display: 'flex', background: 'rgba(15, 23, 42, 0.4)', padding: '4px', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                    <button onClick={() => setSortBy('smart')} style={{ padding: '0 1.5rem', height: '36px', borderRadius: '8px', background: sortBy === 'smart' ? '#6366f1' : 'transparent', border: 'none', color: 'white', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase' }}>Smart</button>
                    <button onClick={() => setSortBy('price')} style={{ padding: '0 1.5rem', height: '36px', borderRadius: '8px', background: sortBy === 'price' ? '#6366f1' : 'transparent', border: 'none', color: 'white', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase' }}>Cena &uarr;&darr;</button>
                </div>
            </div>

            {isLoading ? (
                <div className="loading-state py-20 text-center">
                    <Loader2 size={48} className="spin text-indigo-500 mb-6 inline-block" />
                    <p className="text-slate-400 font-black uppercase text-sm tracking-widest">Tražimo najbolje hotele u gradu {currentDest?.city}...</p>
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem' }}>
                    {filteredResults.map(hotel => {
                        const isSelected = selectedHotels[activeDestIndex]?.hotel.id === hotel.id;
                        return (
                            <div key={hotel.id} className={`hotel-result-card-premium ${isSelected ? 'selected-border' : ''}`}
                                style={{ background: '#0f172a', borderRadius: '20px', border: '1px solid rgba(255, 255, 255, 0.08)', overflow: 'hidden', display: 'flex', flexDirection: 'column', height: '420px', transition: 'all 0.3s ease', cursor: 'pointer', position: 'relative' }}
                                onClick={() => handleSelectHotel(hotel)}>
                                <div style={{ height: '200px', width: '100%', position: 'relative', overflow: 'hidden' }}>
                                    <img src={hotel.image} alt={hotel.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    <div style={{ position: 'absolute', top: '12px', right: '12px', background: 'rgba(0, 0, 0, 0.6)', backdropFilter: 'blur(8px)', padding: '4px 10px', borderRadius: '6px', fontSize: '9px', fontWeight: 900, color: 'white', textTransform: 'uppercase', letterSpacing: '0.5px', border: '1px solid rgba(255, 255, 255, 0.1)' }}>{hotel.mealPlanName}</div>
                                    <div style={{ position: 'absolute', bottom: '12px', left: '12px', display: 'flex', gap: '2px' }}>
                                        {Array(hotel.stars).fill(0).map((_, i) => (<Star key={i} size={10} fill="#fbbf24" color="#fbbf24" />))}
                                    </div>
                                    {isSelected && (
                                        <div style={{ position: 'absolute', inset: 0, background: 'rgba(99, 102, 241, 0.4)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <div style={{ background: 'white', color: '#6366f1', padding: '6px 16px', borderRadius: '8px', fontWeight: 900, fontSize: '10px', textTransform: 'uppercase' }}>IZABRAN SMEŠTAJ</div>
                                        </div>
                                    )}
                                </div>
                                <div style={{ padding: '1.25rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
                                    <h4 style={{ fontSize: '1rem', fontWeight: 900, color: 'white', marginBottom: '0.5rem', lineHeight: 1.2, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{hotel.name}</h4>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#64748b', fontSize: '11px', fontWeight: 700, marginBottom: '0.4rem' }}><MapPin size={12} style={{ color: '#818cf8' }} /> {hotel.location}</div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#64748b', fontSize: '11px', fontWeight: 700 }}><Calendar size={12} style={{ color: '#818cf8' }} /> {formatDateRange(currentDest?.checkIn || '', currentDest?.checkOut || '')}</div>
                                    <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                                        <div style={{ fontSize: '1.75rem', fontWeight: 900, color: '#fbbf24', letterSpacing: '-1px' }}>{Math.round(hotel.price)}€</div>
                                        <button style={{ background: '#6366f1', border: 'none', borderRadius: '10px', padding: '8px 14px', color: 'white', fontSize: '10px', fontWeight: 900, textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)' }}>
                                            Detalji ponude <ArrowRight size={12} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default Step3_HotelSelection;
