import React, { useState } from 'react';
import {
    Check, ChevronDown, Clock, Search, Tag,
    Landmark, Ticket, Utensils, Star, Compass,
    MapPin, Sparkles, Loader2, RotateCcw, Trash2, Plus
} from 'lucide-react';
import './SmartSearchV2.css';
import type {
    BasicInfoData,
    ExtraSelectionData,
    Extra
} from '../../../types/packageSearch.types';

interface Step5Props {
    basicInfo: BasicInfoData | null;
    data: ExtraSelectionData[];
    onUpdate: (data: ExtraSelectionData[]) => void;
    onNext: () => void;
    onBack: () => void;
}

const EXTRA_TEMPLATES: Extra[] = [
    // RIM (ROMA)
    {
        id: 'e-rim-1',
        name: 'Koloseum i Rimski Forum',
        category: 'tour',
        destination: 'Rim',
        description: 'Preskočite redove i istražite srce antičkog Rima sa stručnim vodičem.',
        duration: '3h',
        included: ['Ulaznica bez čekanja', 'Vodič', 'Slušalice'],
        excluded: ['Prevoz'],
        images: ['https://images.unsplash.com/photo-1552832230-c0197dd311b5?auto=format&fit=crop&q=80&w=600'],
        price: 45,
        currency: 'EUR',
        availability: { days: ['Everyday'], times: ['09:00', '14:00'] }
    },
    {
        id: 'e-rim-2',
        name: 'Vatikanski Muzeji i Sikstinska Kapela',
        category: 'ticket',
        destination: 'Rim',
        description: 'Uživajte u neprocenjivim umetničkim delima i Mikelanđelovim remek-delima.',
        duration: '4h',
        included: ['Ulaznica', 'Audio vodič'],
        excluded: ['Vodič uživo', 'Prevoz'],
        images: ['https://images.unsplash.com/photo-1531572753322-ad063cecc140?auto=format&fit=crop&q=80&w=600'],
        price: 35,
        currency: 'EUR',
        availability: { days: ['Everyday'], times: ['10:00', '13:00'] }
    },
    // BERLIN
    {
        id: 'e-ber-1',
        name: 'Berlin TV Tower: Ulaznica za vidikovac',
        category: 'ticket',
        destination: 'berlin',
        description: 'Najbolji pogled na Berlin sa 203 metra visine uz čašu šampanjca.',
        duration: '1.5h',
        included: ['Fast track ulaznica', 'Welcome drink'],
        excluded: ['Hrana'],
        images: ['https://images.unsplash.com/photo-1560969184-10fe8719e047?auto=format&fit=crop&q=80&w=600'],
        price: 28,
        currency: 'EUR',
        availability: { days: ['Everyday'], times: ['09:00 - 22:00'] }
    },
    {
        id: 'e-ber-2',
        name: 'Alternativni Berlin Walking Tour',
        category: 'tour',
        destination: 'berlin',
        description: 'Otkrijte uličnu umetnost, skvotove i modernu kulturu Berlina.',
        duration: '3.5h',
        included: ['Lokalni vodič', 'Street art map'],
        excluded: ['Javni prevoz'],
        images: ['https://images.unsplash.com/photo-1599946347341-6cd394723cd1?auto=format&fit=crop&q=80&w=600'],
        price: 20,
        currency: 'EUR',
        availability: { days: ['Tue', 'Thu', 'Sat'], times: ['11:00'] }
    },
    // PARIZ
    {
        id: 'e1',
        name: 'Panorama Grada i Večera',
        category: 'tour',
        destination: 'Pariz',
        description: 'Uživajte u predivnom pogledu na grad sa Ajfelovog tornja uz vrhunsku večeru.',
        duration: '4h',
        included: ['Večera', 'Ulaznica za toranj', 'Vodič'],
        excluded: ['Prevoz do tornja'],
        images: ['https://images.unsplash.com/photo-1543349689-9a4d426bee8e?auto=format&fit=crop&q=80&w=600'],
        price: 85,
        currency: 'EUR',
        availability: { days: ['Mon', 'Wed', 'Fri'], times: ['19:00'] }
    },
    {
        id: 'e2',
        name: 'Muzej Luvr - Masterpiece Tour',
        category: 'tour',
        destination: 'Pariz',
        description: 'Vodič kroz najveći muzej na svetu uz fokus na Mona Lizu i Veneru Milosku.',
        duration: '2.5h',
        included: ['Skip the line ulaznica', 'Licencirani vodič'],
        excluded: ['Popodnevni čaj'],
        images: ['https://images.unsplash.com/photo-1499856871958-5b9627545d1a?auto=format&fit=crop&q=80&w=600'],
        price: 65,
        currency: 'EUR',
        availability: { days: ['Everyday'], times: ['10:00', '14:30'] }
    }
];

const CATEGORY_OPTIONS = ["Sve kategorije", "Izleti i Ture", "Ulaznice", "Restorani", "Koncerti"];

const Step5_ExtrasSelection: React.FC<Step5Props> = ({
    basicInfo,
    data,
    onUpdate,
    onNext,
    onBack
}) => {
    const [selectedExtras, setSelectedExtras] = useState<ExtraSelectionData[]>(data || []);
    const [activeDestIndex, setActiveDestIndex] = useState(0);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategories, setSelectedCategories] = useState<string[]>(['Sve kategorije']);
    const [isSearching, setIsSearching] = useState(false);
    const [isCatDropdownOpen, setIsCatDropdownOpen] = useState(false);

    const currentDest = basicInfo?.destinations[activeDestIndex];

    const handleToggleExtra = (extra: Extra) => {
        const isSelected = selectedExtras.some(e => e.extra.id === extra.id);
        let updated;
        if (isSelected) {
            updated = selectedExtras.filter(e => e.extra.id !== extra.id);
        } else {
            const selection: ExtraSelectionData = {
                extra,
                date: currentDest?.checkIn || '',
                quantity: basicInfo?.travelers.adults || 1,
                totalPrice: extra.price * (basicInfo?.travelers.adults || 1)
            };
            updated = [...selectedExtras, selection];
        }
        setSelectedExtras(updated);
        onUpdate(updated);
    };

    const handleSearch = (e?: React.MouseEvent) => {
        if (e) e.preventDefault();
        setIsSearching(true);
        setTimeout(() => setIsSearching(false), 800);
    };

    const handleCategoryToggle = (opt: string) => {
        if (opt === 'Sve kategorije') {
            setSelectedCategories(['Sve kategorije']);
            return;
        }

        let updated = selectedCategories.filter(c => c !== 'Sve kategorije');
        if (updated.includes(opt)) {
            updated = updated.filter(c => c !== opt);
            if (updated.length === 0) updated = ['Sve kategorije'];
        } else {
            updated.push(opt);
        }
        setSelectedCategories(updated);
    };

    const displayExtras = EXTRA_TEMPLATES.filter(e => {
        const cityMatch = e.destination.toLowerCase() === (currentDest?.city?.toLowerCase() || '');
        const queryMatch = searchQuery === '' || e.name.toLowerCase().includes(searchQuery.toLowerCase());

        if (selectedCategories.includes('Sve kategorije')) return cityMatch && queryMatch;

        let catMatch = false;
        if (selectedCategories.includes('Izleti i Ture') && e.category === 'tour') catMatch = true;
        if (selectedCategories.includes('Ulaznice') && e.category === 'ticket') catMatch = true;
        if (selectedCategories.includes('Restorani') && e.category === 'restaurant') catMatch = true;

        return cityMatch && queryMatch && catMatch;
    });

    const getCategoryDisplayText = () => {
        if (selectedCategories.includes('Sve kategorije')) return 'Sve kategorije';
        if (selectedCategories.length === 1) return selectedCategories[0];
        return `${selectedCategories.length} Odabrano`;
    };

    return (
        <div className="step-content animate-fade-in" style={{ paddingBottom: '120px' }}>

            {/* 1. HORIZONTAL TOOLBAR */}
            <div className="search-card-frame mb-12" style={{
                background: 'rgba(15, 23, 42, 0.4)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                padding: '2rem 2.5rem',
                overflow: 'visible'
            }}>
                {/* Header Row */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                    <Compass size={20} className="text-indigo-400" />
                    <div>
                        <h4 className="text-white font-black text-sm uppercase tracking-widest leading-none">Dodatne Aktivnosti</h4>
                        <p className="text-[9px] text-slate-500 font-bold uppercase mt-1 opacity-60">Pretražite izlete i usluge za vaše putovanje</p>
                    </div>
                </div>

                {/* Fields Row */}
                <div style={{
                    display: 'flex',
                    flexDirection: 'row',
                    alignItems: 'flex-end',
                    gap: '20px',
                    width: '100%'
                }}>
                    <div style={{ flex: '2.5' }}>
                        <label className="field-label-ss" style={{ marginBottom: '10px', fontSize: '10px' }}>
                            <Search size={12} /> NAZIV USLUGE
                        </label>
                        <input
                            type="text"
                            className="ss-input-box"
                            style={{ width: '100%', height: '56px', background: '#0f172a' }}
                            placeholder="npr. Luvr Muzej, Hard Rock Cafe, Koncert..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    <div style={{ flex: '1.2', position: 'relative' }}>
                        <label className="field-label-ss" style={{ marginBottom: '10px', fontSize: '10px' }}>
                            <Tag size={12} /> KATEGORIJA
                        </label>
                        <div
                            className="input-box"
                            style={{
                                height: '56px',
                                background: '#0f172a',
                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                borderRadius: '12px',
                                cursor: 'pointer',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                padding: '0 1rem'
                            }}
                            onClick={() => setIsCatDropdownOpen(!isCatDropdownOpen)}
                        >
                            <span style={{ fontSize: '0.85rem', fontWeight: 800, color: selectedCategories.includes('Sve kategorije') ? '#64748b' : 'white', textTransform: 'uppercase' }}>
                                {getCategoryDisplayText()}
                            </span>
                            <ChevronDown
                                size={14}
                                className={`text-slate-500 transition-transform ${isCatDropdownOpen ? 'rotate-180' : ''}`}
                            />
                        </div>

                        {isCatDropdownOpen && (
                            <div className="vertical-filters-popover animate-fade-in-up" style={{ width: '100%', minWidth: '280px' }}>
                                <div className="vertical-filter-group">
                                    {CATEGORY_OPTIONS.map(opt => (
                                        <button
                                            key={opt}
                                            className={`v-filter-btn ${selectedCategories.includes(opt) ? 'active' : ''}`}
                                            onClick={() => handleCategoryToggle(opt)}
                                            style={{ border: 'none' }}
                                        >
                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                                                <span style={{ textTransform: 'uppercase' }}>{opt}</span>
                                                {selectedCategories.includes(opt) && <Check size={14} />}
                                            </div>
                                        </button>
                                    ))}
                                </div>

                                <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', padding: '10px', marginTop: '10px' }}>
                                    <button
                                        className="v-filter-btn active"
                                        style={{ width: '100%', justifyContent: 'center', background: '#6366f1' }}
                                        onClick={(e) => { e.stopPropagation(); setIsCatDropdownOpen(false); }}
                                    >
                                        ZATVORI
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    <div style={{ flex: '1' }}>
                        <button
                            type="button"
                            className={`nav-btn primary ${isSearching ? 'opacity-70' : ''}`}
                            style={{
                                width: '100%',
                                height: '56px',
                                margin: 0,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '11px',
                                fontWeight: 900,
                                fontStyle: 'italic',
                                background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                                boxShadow: '0 10px 20px -5px rgba(79, 70, 229, 0.4)'
                            }}
                            onClick={handleSearch}
                            disabled={isSearching}
                        >
                            {isSearching ? <Loader2 size={18} className="spin mr-2" /> : <Search size={16} className="mr-2" />}
                            TRAŽI USLUGE
                        </button>
                    </div>
                </div>
            </div>

            {/* 2. DESTINATION TABS */}
            <div className="search-tabs mb-10">
                {basicInfo?.destinations.map((dest, idx) => (
                    <button
                        key={idx}
                        className={`tab-btn ${activeDestIndex === idx ? 'active' : ''}`}
                        onClick={() => setActiveDestIndex(idx)}
                    >
                        <MapPin size={14} style={{ color: activeDestIndex === idx ? 'white' : '#818cf8' }} />
                        <span className="font-bold uppercase tracking-tight">Dodaci: {dest.city}</span>
                        {selectedExtras.filter(e => e.extra.destination.toLowerCase() === (dest.city?.toLowerCase() || '')).length > 0 &&
                            <div className="ml-3 bg-indigo-500 text-white w-5 h-5 rounded-full text-[10px] flex items-center justify-center font-black">
                                {selectedExtras.filter(e => e.extra.destination.toLowerCase() === (dest.city?.toLowerCase() || '')).length}
                            </div>
                        }
                    </button>
                ))}
            </div>

            {/* 3. EXTRAS GRID */}
            <div className="grid gap-6">
                <div className="flex justify-between items-end mb-2 px-2">
                    <h3 className="text-xl font-black text-white flex items-center gap-3 uppercase tracking-tighter">
                        <Sparkles size={22} className="text-yellow-400" /> Preporučeno u gradu {currentDest?.city}
                    </h3>
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{displayExtras.length} dostupnih usluga</span>
                </div>

                <div className="grid gap-4">
                    {displayExtras.map(extra => {
                        const isSelected = selectedExtras.some(e => e.extra.id === extra.id);
                        return (
                            <div
                                key={extra.id}
                                className={`flight-offer-card-ss ${isSelected ? 'selected-border' : ''}`}
                                onClick={() => handleToggleExtra(extra)}
                                style={{ minHeight: '160px', cursor: 'pointer' }}
                            >
                                <div className="card-main-layout">
                                    <div className="flight-main-section-ss" style={{ padding: '1.25rem' }}>
                                        <div className="flex gap-6 w-full">
                                            <div style={{ width: '200px', height: '120px', borderRadius: '14px', overflow: 'hidden', flexShrink: 0, position: 'relative' }}>
                                                <img src={extra.images[0]} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                <div style={{ position: 'absolute', top: '8px', left: '8px', display: 'flex', gap: '4px' }}>
                                                    {extra.category === 'tour' && <div className="bg-indigo-600 px-3 py-1 rounded-md text-[8px] font-black text-white uppercase flex items-center gap-1"><Landmark size={10} /> IZLET</div>}
                                                    {extra.category === 'ticket' && <div className="bg-emerald-600 px-3 py-1 rounded-md text-[8px] font-black text-white uppercase flex items-center gap-1"><Ticket size={10} /> ULAZNICA</div>}
                                                    {extra.category === 'restaurant' && <div className="bg-orange-600 px-3 py-1 rounded-md text-[8px] font-black text-white uppercase flex items-center gap-1"><Utensils size={10} /> RESTORAN</div>}
                                                </div>
                                            </div>

                                            <div className="flex-1">
                                                <h4 className="text-xl font-black text-white mb-2 uppercase tracking-tight">{extra.name}</h4>
                                                <p className="text-slate-500 text-[11px] font-bold uppercase leading-relaxed line-clamp-2" style={{ maxWidth: '90%' }}>{extra.description}</p>

                                                <div className="flex gap-4 mt-auto pt-4">
                                                    <div className="flex items-center gap-2 bg-white/5 px-2.5 py-1.5 rounded-lg border border-white/5">
                                                        <Clock size={12} className="text-indigo-400" />
                                                        <span style={{ fontSize: '10px', fontWeight: 900, color: '#94a3b8' }}>{extra.duration}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2 bg-white/5 px-2.5 py-1.5 rounded-lg border border-white/5">
                                                        <Tag size={12} className="text-indigo-400" />
                                                        <span style={{ fontSize: '10px', fontWeight: 900, color: '#94a3b8' }}>{extra.price}€ / OSOBI</span>
                                                    </div>
                                                    <div className="flex items-center gap-2 bg-white/5 px-2.5 py-1.5 rounded-lg border border-white/5">
                                                        <Check size={12} className="text-green-400" />
                                                        <span style={{ fontSize: '10px', fontWeight: 900, color: '#94a3b8' }}>INSTANT POTVRDA</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flight-price-sidebar-ss" style={{ width: '240px', padding: '1.5rem', borderLeft: '1px solid rgba(255,255,255,0.05)' }}>
                                        <div className="price-label-ss" style={{ fontSize: '9px' }}>UKUPNO ZA SVE PUTNIKE</div>
                                        <div className="price-value-ss" style={{ fontSize: '2rem', color: '#fbbf24' }}>
                                            {(extra.price * (basicInfo?.travelers.adults || 1)).toFixed(2)}€
                                        </div>

                                        <button
                                            className={`nav-btn primary !h-12 !text-[11px] w-full mt-4 ${isSelected ? 'bg-green-600 shadow-green-900/40' : ''}`}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleToggleExtra(extra);
                                            }}
                                        >
                                            {isSelected ? <><Check size={16} /> DODATO</> : 'DODAJ U PAKET'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}

                    {displayExtras.length === 0 && (
                        <div className="no-results py-24 text-center border border-dashed border-white/10 rounded-[30px]" style={{ background: 'rgba(15, 23, 42, 0.2)' }}>
                            <Compass size={48} className="text-slate-700 mb-4 inline-block opacity-20" />
                            <p className="text-slate-500 font-bold uppercase text-xs tracking-[0.2em] mb-6">Nema pronađenih usluga za odabrane kriterijume</p>
                            <button
                                className="nav-btn secondary !h-12 !px-8 !text-[10px] !bg-white/5 !border-white/10 hover:!bg-white/10"
                                onClick={() => { setSearchQuery(''); setSelectedCategories(['Sve kategorije']); }}
                                style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
                            >
                                <RotateCcw size={14} /> Resetuj filtere
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Step5_ExtrasSelection;
