import React, { useState, useEffect, useRef } from 'react';
import './NarrativeSearch.css';
import { createPortal } from 'react-dom';
import { ModernCalendar } from '../../../components/ModernCalendar';
import { formatDate } from '../../../utils/dateUtils';
import type { BasicInfoData, DestinationInput, TravelerCount } from '../../../types/packageSearch.types';
import { X, Search, Users, Baby } from 'lucide-react';
import solvexDictionaryService from '../../../services/solvex/solvexDictionaryService';

interface NarrativeSearchProps {
    basicInfo: BasicInfoData | null;
    onUpdate: (data: BasicInfoData) => void;
    onNext: (data: BasicInfoData) => void;
}

type ActiveField = 'destination' | 'date' | 'nights' | 'travelers' | null;

const NATIONALITY_OPTIONS = [
    { code: 'RS', name: 'Srbija' },
    { code: 'BA', name: 'Bosna i Hercegovina' },
    { code: 'ME', name: 'Crna Gora' },
    { code: 'MK', name: 'Severna Makedonija' },
    { code: 'HR', name: 'Hrvatska' },
    { code: 'BG', name: 'Bugarska' },
    { code: 'RO', name: 'Rumunija' },
    { code: 'HU', name: 'Mađarska' },
    { code: 'GR', name: 'Grčka' },
    { code: 'AL', name: 'Albanija' },
    { code: 'TR', name: 'Turska' },
    { code: 'DE', name: 'Nemačka' },
    { code: 'AT', name: 'Austrija' },
    { code: 'CH', name: 'Švajcarska' },
    { code: 'RU', name: 'Rusija' },
    { code: 'US', name: 'SAD' },
    { code: 'GB', name: 'Velika Britanija' },
    { code: 'IT', name: 'Italija' },
    { code: 'FR', name: 'Francuska' },
    { code: 'ES', name: 'Španija' },
];

const COUNTRY_DESTINATIONS: Record<string, string[]> = {
    'Bugarska': ['Sunčev Breg', 'Zlatni Pjasci', 'Nesebar', 'Varna', 'Bansko', 'Borovec'],
    'Grčka': ['Tasos', 'Lefkada', 'Halkidiki', 'Krit', 'Rodos', 'Krf', 'Zakintos', 'Paralija'],
    'Egipat': ['Hurgada', 'Šarm El Šeik', 'Marsa Alam', 'Kairo'],
    'Turska': ['Antalija', 'Alanja', 'Belek', 'Kemer', 'Side', 'Kušadasi', 'Bodrum', 'Marmaris'],
    'Crna Gora': ['Budva', 'Bečići', 'Kotor', 'Herceg Novi', 'Ulcinj', 'Petrovac']
};

export const NarrativeSearch: React.FC<NarrativeSearchProps> = ({ basicInfo, onUpdate, onNext }) => {
    const handleNightsChange = (delta: number) => {
        const newNights = Math.max(1, Math.min(30, nights + delta));
        setNights(newNights);
        if (checkIn) {
            const s = new Date(checkIn);
            s.setDate(s.getDate() + newNights);
            setCheckOut(s.toISOString().split('T')[0]);
        }
    };
    const [activeField, setActiveField] = useState<ActiveField | 'rooms' | 'category' | 'service' | 'nationality' | 'budget'>(null);
    const [destination, setDestination] = useState<string>(basicInfo?.destinations[0]?.city || '');
    const [checkIn, setCheckIn] = useState<string>(basicInfo?.destinations[0]?.checkIn || '');
    const [checkOut, setCheckOut] = useState<string>(basicInfo?.destinations[0]?.checkOut || '');
    const [nights, setNights] = useState<number>(basicInfo?.destinations[0]?.nights || 7);

    // Multi-room state
    const [rooms, setRooms] = useState(basicInfo?.roomAllocations?.length || 1);
    const [roomAllocations, setRoomAllocations] = useState<TravelerCount[]>(
        basicInfo?.roomAllocations?.map(r => ({ ...r, childrenAges: r.childrenAges || [] })) || [{ adults: 2, children: 0, childrenAges: [] }]
    );

    // New immersive fields
    const [selectedCategories, setSelectedCategories] = useState<string[]>(basicInfo?.destinations[0]?.category || ['5']);
    const [selectedServices, setSelectedServices] = useState<string[]>(basicInfo?.destinations[0]?.service || ['all']);
    const [nationality, setNationality] = useState(basicInfo?.nationality || 'RS');
    const [budgetFrom, setBudgetFrom] = useState<string>(basicInfo?.budgetFrom?.toString() || '');
    const [budgetTo, setBudgetTo] = useState<string>(basicInfo?.budgetTo?.toString() || '');

    const [activeCountryTag, setActiveCountryTag] = useState<string | null>(null);

    const [suggestions, setSuggestions] = useState<any[]>([]);
    const [selectedDestination, setSelectedDestination] = useState<any>(basicInfo?.destinations[0] || null);
    const containerRef = useRef<HTMLDivElement>(null);

    // Sync roomAllocations length with rooms count
    useEffect(() => {
        if (roomAllocations.length < rooms) {
            const newRooms = [...roomAllocations];
            while (newRooms.length < rooms) {
                newRooms.push({ adults: 2, children: 0, childrenAges: [] });
            }
            setRoomAllocations(newRooms);
        } else if (roomAllocations.length > rooms) {
            setRoomAllocations(roomAllocations.slice(0, rooms));
        }
    }, [rooms]);

    // Sync back to parent
    useEffect(() => {
        const standardDest: DestinationInput = {
            id: selectedDestination?.id || 'narrative-1',
            city: selectedDestination?.name || destination,
            country: selectedDestination?.country_name || '',
            countryCode: selectedDestination?.country_code || '',
            airportCode: '',
            checkIn: checkIn,
            checkOut: checkOut,
            nights: nights,
            travelers: roomAllocations[0], // For legacy compatibility
            roomAllocations: roomAllocations, // NEW
            category: selectedCategories,
            service: selectedServices,
            flexibleDays: 0,
            type: selectedDestination?.type || 'destination'
        };

        const newData: BasicInfoData = {
            destinations: [standardDest],
            travelers: roomAllocations[0],
            roomAllocations: roomAllocations,
            budgetFrom: budgetFrom ? Number(budgetFrom) : undefined,
            budgetTo: budgetTo ? Number(budgetTo) : undefined,
            nationality: nationality,
            currency: 'EUR',
            startDate: checkIn,
            endDate: checkOut,
            totalDays: nights
        };

        onUpdate(newData);
    }, [destination, selectedDestination, checkIn, checkOut, nights, roomAllocations, selectedCategories, selectedServices, nationality, budgetFrom, budgetTo]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (activeField && containerRef.current && !containerRef.current.contains(event.target as Node)) {
                if ((event.target as HTMLElement).closest('.modern-calendar-overlay')) return;
                setActiveField(null);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [activeField]);

    useEffect(() => {
        const fetchSuggestions = async () => {
            if (destination.length >= 2) {
                if (selectedDestination && destination === selectedDestination.name) return;
                try {
                    const results = await solvexDictionaryService.searchDestinations(destination);
                    setSuggestions(results || []);
                } catch (e) { console.error(e); }
            } else { setSuggestions([]); }
        };
        const debounce = setTimeout(fetchSuggestions, 300);
        return () => clearTimeout(debounce);
    }, [destination, selectedDestination]);

    const handleDateSelect = (start: string, end: string) => {
        setCheckIn(start);
        setCheckOut(end);
        if (start && end) {
            const s = new Date(start);
            const e = new Date(end);
            setNights(Math.ceil((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24)));
        }
        setActiveField(null);
    };

    const updateRoom = (index: number, field: 'adults' | 'children', delta: number) => {
        const newAllocations = [...roomAllocations];
        const room = { ...newAllocations[index] };
        if (field === 'adults') room.adults = Math.max(1, room.adults + delta);
        else {
            room.children = Math.max(0, Math.min(4, room.children + delta));
            const ages = room.childrenAges || [];
            if (ages.length < room.children) {
                while (ages.length < room.children) ages.push(7);
            } else if (ages.length > room.children) {
                room.childrenAges = ages.slice(0, room.children);
            } else {
                room.childrenAges = ages;
            }
        }
        newAllocations[index] = room;
        setRoomAllocations(newAllocations);
    };

    const updateChildAge = (roomIndex: number, childIndex: number, age: number) => {
        const newAllocations = [...roomAllocations];
        const room = { ...newAllocations[roomIndex] };
        const ages = [...(room.childrenAges || [])];
        ages[childIndex] = Math.max(0, Math.min(17, age));
        room.childrenAges = ages;
        newAllocations[roomIndex] = room;
        setRoomAllocations(newAllocations);
    };

    const toggleCategory = (cat: string) => {
        setSelectedCategories(prev => prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]);
    };

    const toggleService = (srv: string) => {
        setSelectedServices(prev => prev.includes(srv) ? prev.filter(s => s !== srv) : [...prev, srv]);
    };

    return (
        <div className={`narrative-wrapper ${activeField ? 'has-active-field' : ''} field-active-${activeField || 'none'}`}>
            <div className="narrative-background-glow"></div>

            <div className={`narrative-container ${activeField ? 'panel-is-open' : ''}`} ref={containerRef}>
                <div className="narrative-sentence">
                    Tražim smeštaj u
                    <span className={`narrative-input ${activeField === 'destination' ? 'active' : ''}`} onClick={() => setActiveField('destination')}>
                        {selectedDestination?.name || destination || "Bilo gde"}
                    </span>
                    polazak
                    <span className={`narrative-input ${activeField === 'date' ? 'active' : ''}`} onClick={() => setActiveField('date')}>
                        {checkIn ? formatDate(checkIn) : "bilo kad"}
                    </span>
                    na
                    <span className={`narrative-input ${activeField === 'nights' ? 'active' : ''}`} onClick={() => setActiveField('nights')}>
                        {nights} noći
                    </span>
                    .
                    <br />
                    Rezerviši mi
                    <span className={`narrative-input ${activeField === 'rooms' ? 'active' : ''}`} onClick={() => setActiveField('rooms')}>
                        {rooms} {rooms === 1 ? 'sobu' : 'sobe'}
                    </span>
                    za ukupno
                    <span className={`narrative-input ${activeField === 'travelers' ? 'active' : ''}`} onClick={() => setActiveField('travelers')}>
                        {roomAllocations.reduce((acc, r) => acc + r.adults + r.children, 0)} osoba
                    </span>
                    .
                    <br />
                    Želim hotel sa
                    <span className={`narrative-input ${activeField === 'category' ? 'active' : ''}`} onClick={() => setActiveField('category')}>
                        {selectedCategories.includes('all') ? 'sve' : selectedCategories.join(', ')} ★
                    </span>
                    i uslugom
                    <span className={`narrative-input ${activeField === 'service' ? 'active' : ''}`} onClick={() => setActiveField('service')}>
                        {selectedServices.includes('all') ? 'bilo kojom' : selectedServices.map(s => s === 'AI' ? 'All Incl.' : s).join(', ')}
                    </span>
                    .
                    <br />
                    Putnici su
                    <span className={`narrative-input ${activeField === 'nationality' ? 'active' : ''}`} onClick={() => setActiveField('nationality')}>
                        {NATIONALITY_OPTIONS.find(n => n.code === nationality)?.name || 'RS'}
                    </span>
                    nacionalnosti, sa budžetom do
                    <span className={`narrative-input ${activeField === 'budget' ? 'active' : ''}`} onClick={() => setActiveField('budget')}>
                        {budgetTo || 'neograničeno'} EUR
                    </span>
                    .
                </div>

                {/* MODAL / POPOVER PANEL - CENTERED */}
                {activeField && activeField !== 'date' && (
                    <div className="narrative-centered-panel animate-popover-in">
                        <button className="panel-close-btn" onClick={() => setActiveField(null)}><X size={20} /></button>

                        {activeField === 'destination' && (
                            <div className="panel-content">
                                <h3>Gde želite da putujete?</h3>
                                <div className="panel-search-box">
                                    <Search size={20} />
                                    <input autoFocus placeholder="npr. Bugarska, Turska, Tasos..." value={destination} onChange={(e) => {
                                        setDestination(e.target.value);
                                        setActiveCountryTag(null);
                                        if (selectedDestination && e.target.value !== selectedDestination.name) setSelectedDestination(null);
                                    }} />
                                    {destination && (
                                        <button className="clear-input-btn" onClick={() => { setDestination(''); setSuggestions([]); setSelectedDestination(null); setActiveCountryTag(null); }}>
                                            <X size={16} />
                                        </button>
                                    )}
                                </div>
                                <div className="panel-suggestions">
                                    {suggestions.map(s => (
                                        <div key={s.id} className="panel-suggestion-item" onClick={() => { setDestination(s.name); setSelectedDestination(s); setActiveField(null); }}>
                                            <span>{s.type === 'hotel' ? '🏨' : '📍'}</span>
                                            <div>
                                                <strong>{s.name}</strong>
                                                <small>{s.country_name}</small>
                                            </div>
                                        </div>
                                    ))}
                                    {suggestions.length === 0 && (
                                        <div className="destination-tags-wrapper">
                                            <div className="panel-quick-tags country-tags">
                                                {Object.keys(COUNTRY_DESTINATIONS).map(t => (
                                                    <button
                                                        key={t}
                                                        className={activeCountryTag === t ? 'active' : ''}
                                                        onClick={() => setActiveCountryTag(activeCountryTag === t ? null : t)}
                                                    >
                                                        {t}
                                                    </button>
                                                ))}
                                            </div>

                                            {activeCountryTag && (
                                                <div className="panel-quick-tags destination-tags animate-fade-in">
                                                    {COUNTRY_DESTINATIONS[activeCountryTag].map(d => (
                                                        <button
                                                            key={d}
                                                            className="dest-tag"
                                                            onClick={() => {
                                                                setDestination(d);
                                                                setSelectedDestination({
                                                                    id: 'm-' + d,
                                                                    name: d,
                                                                    type: 'destination',
                                                                    country_name: activeCountryTag
                                                                });
                                                                setActiveField(null);
                                                            }}
                                                        >
                                                            {d}
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {activeField === 'nights' && (
                            <div className="panel-content">
                                <h3>Trajanje putovanja</h3>
                                <div className="panel-counter-large">
                                    <button onClick={() => handleNightsChange(-1)}>-</button>
                                    <span>{nights}</span>
                                    <button onClick={() => handleNightsChange(1)}>+</button>
                                </div>
                                <p className="panel-hint">Broj noćenja u izabranom smeštaju</p>
                            </div>
                        )}

                        {activeField === 'rooms' && (
                            <div className="panel-content">
                                <h3>Broj smeštajnih jedinica</h3>
                                <div className="panel-counter-large">
                                    <button onClick={() => setRooms(Math.max(1, rooms - 1))}>-</button>
                                    <span>{rooms}</span>
                                    <button onClick={() => setRooms(Math.min(5, rooms + 1))}>+</button>
                                </div>
                                <p className="panel-hint">Odaberite koliko soba ili apartmana vam je potrebno</p>
                            </div>
                        )}

                        {activeField === 'travelers' && (
                            <div className="panel-content">
                                <h3>Konfiguracija putnika po sobama</h3>
                                <div className="panel-rooms-scroll">
                                    {roomAllocations.map((room, rIdx) => (
                                        <div key={rIdx} className="panel-room-card">
                                            <div className="room-header">SOBA {rIdx + 1}</div>
                                            <div className="room-controls">
                                                <div className="control-item">
                                                    <span>Odrasli</span>
                                                    <div className="counter-small">
                                                        <button onClick={() => updateRoom(rIdx, 'adults', -1)}>-</button>
                                                        <span>{room.adults}</span>
                                                        <button onClick={() => updateRoom(rIdx, 'adults', 1)}>+</button>
                                                    </div>
                                                </div>
                                                <div className="control-item">
                                                    <span>Deca</span>
                                                    <div className="counter-small">
                                                        <button onClick={() => updateRoom(rIdx, 'children', -1)}>-</button>
                                                        <span>{room.children}</span>
                                                        <button onClick={() => updateRoom(rIdx, 'children', 1)}>+</button>
                                                    </div>
                                                </div>
                                            </div>
                                            {room.children > 0 && (
                                                <div className="room-ages">
                                                    {(room.childrenAges || []).map((age, cIdx) => (
                                                        <input key={cIdx} type="number" value={age} onChange={(e) => updateChildAge(rIdx, cIdx, parseInt(e.target.value) || 0)} placeholder="God" />
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {activeField === 'category' && (
                            <div className="panel-content">
                                <h3>Kategorizacija hotela</h3>
                                <div className="panel-selection-grid">
                                    {['2', '3', '4', '5'].map(star => (
                                        <button key={star} className={`panel-select-btn ${selectedCategories.includes(star) ? 'active' : ''}`} onClick={() => toggleCategory(star)}>
                                            {star} ★
                                        </button>
                                    ))}
                                </div>
                                <p className="panel-hint">Izaberite jednu ili više kategorija</p>
                            </div>
                        )}

                        {activeField === 'service' && (
                            <div className="panel-content">
                                <h3>Usluga u hotelu</h3>
                                <div className="panel-selection-grid wide">
                                    {[
                                        { code: 'RO', label: 'Najam' },
                                        { code: 'BB', label: 'Noćenje/Doručak' },
                                        { code: 'HB', label: 'Polupansion' },
                                        { code: 'AI', label: 'All Inclusive' },
                                        { code: 'UAI', label: 'Ultra All Incl.' }
                                    ].map(s => (
                                        <button key={s.code} className={`panel-select-btn ${selectedServices.includes(s.code) ? 'active' : ''}`} onClick={() => toggleService(s.code)}>
                                            {s.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {activeField === 'nationality' && (
                            <div className="panel-content">
                                <h3>Nacionalnost putnika</h3>
                                <div className="panel-list-scroll">
                                    {NATIONALITY_OPTIONS.map(n => (
                                        <button key={n.code} className={`panel-list-item ${nationality === n.code ? 'active' : ''}`} onClick={() => { setNationality(n.code); setActiveField(null); }}>
                                            {n.name}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {activeField === 'budget' && (
                            <div className="panel-content">
                                <h3>Vaš maksimalni budžet</h3>
                                <div className="panel-budget-input">
                                    <input type="number" placeholder="npr. 1500" value={budgetTo} onChange={(e) => setBudgetTo(e.target.value)} />
                                    <span>EUR</span>
                                </div>
                                <div className="panel-quick-tags">
                                    {['500', '1000', '2000', '5000'].map(v => (
                                        <button key={v} onClick={() => setBudgetTo(v)}>{v}€</button>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="panel-footer">
                            <button className="narrative-confirm-btn" onClick={() => setActiveField(null)}>POTVRDI IZBOR</button>
                        </div>
                    </div>
                )}

                <div className="narrative-footer">
                    <button className="narrative-action-btn" onClick={() => {
                        const standardDest: DestinationInput = {
                            id: selectedDestination?.id || 'narrative-1',
                            city: selectedDestination?.name || destination,
                            country: selectedDestination?.country_name || '',
                            countryCode: selectedDestination?.country_code || '',
                            airportCode: '',
                            checkIn: checkIn,
                            checkOut: checkOut,
                            nights: nights,
                            travelers: roomAllocations[0],
                            roomAllocations: roomAllocations,
                            category: selectedCategories,
                            service: selectedServices,
                            flexibleDays: 0,
                            type: selectedDestination?.type || 'destination'
                        };
                        const newData: BasicInfoData = {
                            destinations: [standardDest],
                            travelers: roomAllocations[0],
                            roomAllocations: roomAllocations,
                            budgetFrom: budgetFrom ? Number(budgetFrom) : undefined,
                            budgetTo: budgetTo ? Number(budgetTo) : undefined,
                            nationality: nationality,
                            currency: 'EUR',
                            startDate: checkIn,
                            endDate: checkOut,
                            totalDays: nights
                        };
                        onNext(newData);
                    }}>
                        PRONAĐI MOJE PUTOVANJE <Search size={20} style={{ marginLeft: '10px' }} />
                    </button>
                </div>
            </div>

            {activeField === 'date' && createPortal(
                <ModernCalendar startDate={checkIn} endDate={checkOut} onChange={handleDateSelect} onClose={() => setActiveField(null)} />,
                document.getElementById('portal-root') || document.body
            )}
        </div>
    );
};
