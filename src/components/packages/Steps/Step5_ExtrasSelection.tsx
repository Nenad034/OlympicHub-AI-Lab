import React, { useState } from 'react';
import {
    Ticket, Search, Plus, Trash2, Info, Check,
    AlertCircle, Image as ImageIcon, Star, MapPin,
    Clock, Tag, Sparkles, Music, Utensils,
    Music2, Compass, ChevronDown
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
    {
        id: 'e1',
        name: 'Panorama Grada i Večera',
        category: 'tour',
        destination: 'Pariz',
        description: 'Uživajte u predivnom pogledu na grad sa Ajfelovog tornja uz vrhunsku večeru.',
        duration: '4h',
        included: ['Večera', 'Ulaznica za toranj', 'Vodič'],
        excluded: ['Prevoz do tornja'],
        images: ['https://images.unsplash.com/photo-1543349689-9a4d426bee8e?auto=format&fit=crop&q=80&w=400'],
        price: 85,
        currency: 'EUR',
        availability: { days: ['Mon', 'Wed', 'Fri'], times: ['19:00'] }
    },
    {
        id: 'e2',
        name: 'Restoran Le Jules Verne',
        category: 'restaurant',
        destination: 'Pariz',
        description: 'Gastronomsko iskustvo na drugom spratu Ajfelovog tornja sa 1 Michelin zvezdicom.',
        duration: '2.5h',
        included: ['Rezervacija stola', 'Welcome Drink'],
        excluded: ['Meni po izboru', 'Vino'],
        images: ['https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=400'],
        price: 150,
        currency: 'EUR',
        availability: { days: ['Everyday'], times: ['12:00', '19:00', '21:00'] }
    }
];

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

    const displayExtras = EXTRA_TEMPLATES.filter(e =>
        e.destination.toLowerCase() === currentDest?.city.toLowerCase() &&
        (searchQuery === '' || e.name.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    return (
        <div className="step-content animate-fade-in">

            {/* 1. SMART SEARCH STYLE TOOLBAR */}
            <div className="search-card-frame mb-12 border-dashed border-indigo-500/20">
                <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center gap-3">
                        <div className="bg-indigo-500/20 p-2 rounded-lg text-indigo-400"><Compass size={20} /></div>
                        <div>
                            <h4 className="text-white font-black text-sm uppercase tracking-widest">Dodatne Aktivnosti</h4>
                            <p className="text-[10px] text-slate-500 font-bold uppercase">Pretražite izlete, restorane ili koncerte</p>
                        </div>
                    </div>
                </div>

                <div className="ss-params-row grid-cols-4 items-end">
                    <div className="form-field col-span-2">
                        <label className="field-label-ss"><Search size={14} /> NAZIV USLUGE</label>
                        <input
                            type="text"
                            className="ss-input-box"
                            placeholder="npr. Luvr Muzej, Hard Rock Cafe, Koncert..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <div className="form-field">
                        <label className="field-label-ss"><Tag size={14} /> KATEGORIJA</label>
                        <div className="ss-input-box justify-between">
                            <span>Sve kategorije</span>
                            <ChevronDown size={16} />
                        </div>
                    </div>
                    <div className="form-field">
                        <button className="nav-btn primary w-full !h-14">
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
                        <MapPin size={14} className="text-indigo-400" />
                        <span>Dodaci: {dest.city}</span>
                        {selectedExtras.filter(e => e.extra.destination === dest.city).length > 0 &&
                            <span className="ml-2 font-black text-xs text-indigo-400">({selectedExtras.filter(e => e.extra.destination === dest.city).length})</span>
                        }
                    </button>
                ))}
            </div>

            {/* 3. EXTRAS GRID */}
            <div className="grid gap-6">
                <div className="flex justify-between items-end mb-2">
                    <h3 className="text-xl font-black text-white flex items-center gap-3 uppercase">
                        <Sparkles size={22} className="text-yellow-400" /> Preporučeno u gradu {currentDest?.city}
                    </h3>
                </div>

                <div className="grid gap-6">
                    {displayExtras.map(extra => {
                        const isSelected = selectedExtras.some(e => e.extra.id === extra.id);
                        return (
                            <div
                                key={extra.id}
                                className={`hotel-result-card-premium horizontal !h-[180px] ${isSelected ? 'selected-border' : ''}`}
                                onClick={() => handleToggleExtra(extra)}
                            >
                                <div className="hotel-card-image !w-[260px]">
                                    <img src={extra.images[0] || 'https://images.unsplash.com/photo-1543349689-9a4d426bee8e?auto=format&fit=crop&q=80&w=400'} alt="" />
                                    <div className="absolute top-4 left-4 flex gap-2">
                                        {extra.category === 'restaurant' ? (
                                            <div className="bg-orange-600 px-3 py-1 rounded-lg text-[9px] font-black text-white uppercase"><Utensils size={10} className="inline mr-1" /> Restoran</div>
                                        ) : (
                                            <div className="bg-indigo-600 px-3 py-1 rounded-lg text-[9px] font-black text-white uppercase"><Compass size={10} className="inline mr-1" /> Izlet</div>
                                        )}
                                    </div>
                                </div>

                                <div className="hotel-card-content !flex-row !p-8">
                                    <div className="flex-1">
                                        <h4 className="text-xl font-black text-white mb-2 uppercase">{extra.name}</h4>
                                        <p className="text-slate-500 text-xs font-bold line-clamp-2 uppercase leading-relaxed">{extra.description}</p>
                                        <div className="flex gap-4 mt-4">
                                            <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase">
                                                <Clock size={12} className="text-indigo-400" /> {extra.duration}
                                            </div>
                                            <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase">
                                                <Tag size={12} className="text-indigo-400" /> {extra.price}€ / PAX
                                            </div>
                                        </div>
                                    </div>

                                    <div className="w-px bg-white/5 h-full mx-8"></div>

                                    <div className="flex flex-col justify-center items-end min-w-[120px]">
                                        <div className="text-3xl font-black text-indigo-400 mb-4">
                                            {(extra.price * (basicInfo?.travelers.adults || 1)).toFixed(2)}€
                                        </div>
                                        <button
                                            className={`nav-btn primary !h-12 !px-8 w-full ${isSelected ? 'bg-green-600 shadow-green-900/50' : ''}`}
                                        >
                                            {isSelected ? <><Check size={16} /> DODATO</> : 'DODAJ'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default Step5_ExtrasSelection;
