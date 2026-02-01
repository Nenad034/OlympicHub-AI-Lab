import React, { useState, useEffect } from 'react';
import {
    MapPin, Calendar, Users, Star,
    Settings2, Search, Plus, X,
    Minus, ChevronDown, Check
} from 'lucide-react';
import { ModernCalendar } from '../../../components/ModernCalendar';
import { formatDate } from '../../../utils/dateUtils';
import './SmartSearchV2.css';
import './Step1Additions.css';
import type {
    BasicInfoData,
    DestinationInput,
    TravelerCount
} from '../../../types/packageSearch.types';

interface Step1Props {
    basicInfo: BasicInfoData | null;
    onUpdate: (data: BasicInfoData) => void;
    onNext: () => void;
}

const CATEGORY_OPTIONS = ["Sve kategorije", "5 Zvezdica", "4 Zvezdice", "3 Zvezdice"];
const SERVICE_OPTIONS = ["Sve usluge", "Najam (RO)", "Noćenje/Doručak (BB)", "Polupansion (HB)", "Pun pansion (FB)", "All Inclusive (AI)"];

const Step1_BasicInfo: React.FC<Step1Props> = ({ basicInfo, onUpdate, onNext }) => {
    // Local State
    const [destinations, setDestinations] = useState<DestinationInput[]>(
        basicInfo?.destinations.map(d => ({
            ...d,
            travelers: d.travelers || { adults: 2, children: 0, childrenAges: [] }
        })) || [
            {
                id: '1',
                city: '',
                country: '',
                countryCode: '',
                airportCode: '',
                checkIn: '',
                checkOut: '',
                nights: 0,
                travelers: { adults: 2, children: 0, childrenAges: [] }
            }
        ]
    );

    const [selectedCategory, setSelectedCategory] = useState(CATEGORY_OPTIONS[0]);
    const [selectedService, setSelectedService] = useState(SERVICE_OPTIONS[0]);
    const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
    const [showServiceDropdown, setShowServiceDropdown] = useState(false);
    const [activeCalendar, setActiveCalendar] = useState<{ index: number } | null>(null);

    // Sync with parent
    useEffect(() => {
        onUpdate({
            destinations,
            travelers: destinations[0]?.travelers || { adults: 2, children: 0, childrenAges: [] }, // Use first as primary for legacy compat
            budget: basicInfo?.budget,
            currency: basicInfo?.currency || 'EUR',
            startDate: destinations[0]?.checkIn || '',
            endDate: destinations[destinations.length - 1]?.checkOut || '',
            totalDays: destinations.reduce((sum, d) => sum + (d.nights || 0), 0)
        });
    }, [destinations]);

    const addDestination = () => {
        if (destinations.length >= 3) return;
        const lastDest = destinations[destinations.length - 1];
        const newDest: DestinationInput = {
            id: String(Date.now()),
            city: '',
            country: '',
            countryCode: '',
            airportCode: '',
            checkIn: lastDest?.checkOut || '',
            checkOut: '',
            nights: 0,
            travelers: { ...lastDest.travelers } // Inherit previous destination's travelers
        };
        setDestinations([...destinations, newDest]);
    };

    const removeDestination = (idx: number) => {
        if (destinations.length <= 1) return;
        setDestinations(destinations.filter((_, i) => i !== idx));
    };

    const updateTravelersPerDest = (idx: number, field: 'adults' | 'children', val: number) => {
        const updated = [...destinations];
        const dest = updated[idx];
        const currentCount = dest.travelers;
        const newVal = Math.max(field === 'adults' ? 1 : 0, val);

        const newTravelers = { ...currentCount, [field]: newVal };

        if (field === 'children') {
            const currentAges = Array.isArray(currentCount.childrenAges) ? currentCount.childrenAges : [];
            if (newVal > currentCount.children) {
                newTravelers.childrenAges = [...currentAges, ...Array(newVal - currentCount.children).fill(0)];
            } else {
                newTravelers.childrenAges = currentAges.slice(0, newVal);
            }
        }

        updated[idx] = { ...dest, travelers: newTravelers };
        setDestinations(updated);
    };

    const updateChildAgePerDest = (destIdx: number, childIdx: number, age: number) => {
        const updated = [...destinations];
        const dest = updated[destIdx];
        const ages = dest.travelers.childrenAges ? [...dest.travelers.childrenAges] : [];
        ages[childIdx] = age;
        updated[destIdx] = { ...dest, travelers: { ...dest.travelers, childrenAges: ages } };
        setDestinations(updated);
    };

    const updateDestination = (idx: number, field: keyof DestinationInput, value: any) => {
        const updated = [...destinations];
        updated[idx] = { ...updated[idx], [field]: value };
        setDestinations(updated);
    };

    const handleDateChange = (idx: number, start: string, end: string) => {
        const updated = [...destinations];
        updated[idx].checkIn = start;
        updated[idx].checkOut = end;

        if (start && end) {
            const s = new Date(start);
            const e = new Date(end);
            const nights = Math.ceil((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24));
            updated[idx].nights = nights;
        }

        setDestinations(updated);
        setActiveCalendar(null);
    };

    return (
        <div className="step-content">
            <div className="search-card-frame animate-fade-in">

                {/* MULTI-DESTINATION ROWS */}
                <div className="space-y-4 mb-8">
                    {destinations.map((dest, idx) => (
                        <div key={dest.id} className="destination-row-ss">
                            <div className="destination-header-ss">
                                <div className="destination-number-badge">{idx + 1}</div>
                                <h3 className="text-indigo-300 font-extrabold text-xs uppercase tracking-[2px]">
                                    Destinacija {idx + 1}
                                </h3>
                                {destinations.length > 1 && (
                                    <button
                                        className="ml-auto w-8 h-8 rounded-full flex items-center justify-center bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white transition-all duration-300"
                                        onClick={() => removeDestination(idx)}
                                    >
                                        <X size={14} />
                                    </button>
                                )}
                            </div>

                            <div className="destination-grid-ss">
                                {/* Destination Input */}
                                <div className="form-field">
                                    <label className="field-label-ss">
                                        <MapPin size={12} /> GRAD / SMEŠTAJ
                                    </label>
                                    <input
                                        type="text"
                                        className="ss-input-box !bg-slate-900/40"
                                        placeholder="Gde putujete?"
                                        value={dest.city}
                                        onChange={(e) => updateDestination(idx, 'city', e.target.value)}
                                    />
                                </div>

                                {/* Date Range */}
                                <div className="form-field relative">
                                    <label className="field-label-ss">
                                        <Calendar size={12} /> TERMIN
                                    </label>
                                    <div
                                        className="ss-input-box !bg-slate-900/40 cursor-pointer hover:border-indigo-500/50 transition-colors flex items-center gap-2"
                                        onClick={() => setActiveCalendar({ index: idx })}
                                    >
                                        <Calendar size={14} className="text-indigo-400" />
                                        <span className={`text-[13px] font-bold ${dest.checkIn && dest.checkOut ? 'text-white' : 'text-slate-500'}`}>
                                            {dest.checkIn && dest.checkOut
                                                ? `${formatDate(dest.checkIn)} - ${formatDate(dest.checkOut)}`
                                                : 'Odaberite datume'
                                            }
                                        </span>
                                    </div>
                                </div>

                                {/* Nights Display */}
                                <div className="form-field">
                                    <label className="field-label-ss">
                                        <Star size={12} /> NOĆI
                                    </label>
                                    <div className="ss-input-box !bg-indigo-500/10 !border-indigo-500/20 cursor-default flex items-center justify-center">
                                        <span className="text-lg font-black text-indigo-400">
                                            {dest.nights || 0}
                                        </span>
                                    </div>
                                </div>

                                {/* Adults Counter */}
                                <div className="form-field">
                                    <label className="field-label-ss"><Users size={12} /> ODRASLI</label>
                                    <div className="row-counter-ss">
                                        <button className="row-counter-btn" onClick={() => updateTravelersPerDest(idx, 'adults', dest.travelers.adults - 1)}>
                                            <Minus size={14} />
                                        </button>
                                        <span className="row-counter-val">{dest.travelers.adults}</span>
                                        <button className="row-counter-btn" onClick={() => updateTravelersPerDest(idx, 'adults', dest.travelers.adults + 1)}>
                                            <Plus size={14} />
                                        </button>
                                    </div>
                                </div>

                                {/* Children Counter */}
                                <div className="form-field relative">
                                    <label className="field-label-ss"><Users size={12} /> DECA</label>
                                    <div className="row-counter-ss">
                                        <button className="row-counter-btn" onClick={() => updateTravelersPerDest(idx, 'children', dest.travelers.children - 1)}>
                                            <Minus size={14} />
                                        </button>
                                        <span className="row-counter-val">{dest.travelers.children}</span>
                                        <button className="row-counter-btn" onClick={() => updateTravelersPerDest(idx, 'children', dest.travelers.children + 1)}>
                                            <Plus size={14} />
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Child Ages row */}
                            {dest.travelers.children > 0 && (
                                <div className="child-ages-row-ss animate-fade-in">
                                    {dest.travelers.childrenAges?.map((age, cIdx) => (
                                        <div key={cIdx} className="child-age-item-ss">
                                            <label className="text-[9px] font-black text-slate-500 uppercase">Dete {cIdx + 1}</label>
                                            <select
                                                className="age-select-ss"
                                                value={age}
                                                onChange={(e) => updateChildAgePerDest(idx, cIdx, parseInt(e.target.value))}
                                            >
                                                {Array.from({ length: 18 }, (_, i) => (
                                                    <option key={i} value={i}>{i} god</option>
                                                ))}
                                            </select>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}

                    {destinations.length < 3 && (
                        <div className="flex justify-center pt-2">
                            <button
                                className="add-destination-btn-ss group"
                                onClick={addDestination}
                            >
                                <Plus size={16} className="group-hover:rotate-90 transition-transform" />
                                Dodaj destinaciju
                            </button>
                        </div>
                    )}
                </div>

                {/* FILTERS SECTION */}
                <div className="grid grid-cols-2 gap-4 mb-8">
                    <div className="form-field relative">
                        <label className="field-label-ss"><Star size={12} /> KATEGORIJA</label>
                        <div
                            className="ss-input-box cursor-pointer flex items-center justify-between"
                            onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
                        >
                            <span className="text-sm font-bold">{selectedCategory}</span>
                            <ChevronDown size={18} className={`text-indigo-400 transition-transform duration-300 ${showCategoryDropdown ? 'rotate-180' : ''}`} />
                        </div>
                        {showCategoryDropdown && (
                            <div className="dropdown-menu-ss">
                                {CATEGORY_OPTIONS.map(opt => (
                                    <div
                                        key={opt}
                                        className="dropdown-item-ss"
                                        onClick={() => { setSelectedCategory(opt); setShowCategoryDropdown(false); }}
                                    >
                                        {opt}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="form-field relative">
                        <label className="field-label-ss"><Settings2 size={12} /> TIP USLUGE</label>
                        <div
                            className="ss-input-box cursor-pointer flex items-center justify-between"
                            onClick={() => setShowServiceDropdown(!showServiceDropdown)}
                        >
                            <span className="text-sm font-bold">{selectedService}</span>
                            <ChevronDown size={18} className={`text-indigo-400 transition-transform duration-300 ${showServiceDropdown ? 'rotate-180' : ''}`} />
                        </div>
                        {showServiceDropdown && (
                            <div className="dropdown-menu-ss">
                                {SERVICE_OPTIONS.map(opt => (
                                    <div
                                        key={opt}
                                        className="dropdown-item-ss"
                                        onClick={() => { setSelectedService(opt); setShowServiceDropdown(false); }}
                                    >
                                        {opt}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* SUMMARY ITINERARY */}
                <div className="summary-card-ss mb-8">
                    <div className="flex items-center justify-between mb-4 px-2">
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]"></div>
                            <h3 className="text-sm font-black text-white uppercase tracking-widest">ITINERER RUTE</h3>
                        </div>
                        <div className="flex items-baseline gap-1">
                            <span className="text-indigo-400 font-black text-lg">
                                {destinations.reduce((sum, d) => sum + (d.nights || 0), 0)}
                            </span>
                            <span className="text-[10px] text-slate-500 font-bold uppercase">noći ukupno</span>
                        </div>
                    </div>

                    <div className="space-y-2">
                        {destinations.filter(d => d.city).map((d, idx) => (
                            <div key={d.id} className="itinerary-item-ss animate-fade-in">
                                <div className="itinerary-left-ss">
                                    <div className="itinerary-node-ss">{idx + 1}</div>
                                    <div className="itinerary-info-ss">
                                        <h4>{d.city}</h4>
                                        <p>
                                            {formatDate(d.checkIn)} — {formatDate(d.checkOut)}
                                            <span className="mx-2 text-slate-700">|</span>
                                            {d.travelers.adults} odr, {d.travelers.children} dec
                                        </p>
                                    </div>
                                </div>
                                <div className="itinerary-right-ss">
                                    <span className="itinerary-nights-ss">{d.nights} noći</span>
                                </div>
                            </div>
                        ))}
                        {destinations.filter(d => d.city).length === 0 && (
                            <div className="text-center py-6 border-2 border-dashed border-white/5 rounded-2xl text-slate-600 font-bold text-xs uppercase tracking-widest">
                                RUTA NIJE DEFINISANA
                            </div>
                        )}
                    </div>
                </div>

                {/* SEARCH BUTTON */}
                <button
                    className="search-btn-ss-primary"
                    onClick={onNext}
                >
                    <Search size={20} />
                    POKRENI PRETRAGU PAKETA
                </button>
            </div>

            {/* CALENDAR OVERLAY */}
            {activeCalendar !== null && (
                <ModernCalendar
                    startDate={destinations[activeCalendar.index]?.checkIn || ''}
                    endDate={destinations[activeCalendar.index]?.checkOut || ''}
                    onChange={(start, end) => handleDateChange(activeCalendar.index, start, end)}
                    onClose={() => setActiveCalendar(null)}
                />
            )}
        </div>
    );
};

export default Step1_BasicInfo;
