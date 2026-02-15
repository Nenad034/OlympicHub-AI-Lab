import React, { useState, useEffect } from 'react';
import { getCountries, searchDestinations } from '../../../services/solvex/solvexDictionaryService';
import { ChevronRight, ArrowLeft, Calendar as CalendarIcon, Users as UsersIcon, Search } from 'lucide-react';
import './ImmersiveSearch.css';
import { ModernCalendar } from '../../ModernCalendar';

// Define the steps
type Step = 'country' | 'destination' | 'dates' | 'travelers' | 'experiences' | 'confirm';

interface ImmersiveSearchProps {
    onSearch: (data: any) => void;
}

const COMMON_COUNTRIES = [
    { id: 1, name: 'Bugarska', code: 'BG' },
    { id: 2, name: 'Grčka', code: 'GR' },
    { id: 3, name: 'Turska', code: 'TR' },
    { id: 4, name: 'Egipat', code: 'EG' },
    { id: 5, name: 'Crna Gora', code: 'ME' },
    { id: 6, name: 'Italija', code: 'IT' },
    { id: 7, name: 'Tunis', code: 'TN' },
    { id: 8, name: 'Španija', code: 'ES' },
];

export const ImmersiveSearch: React.FC<ImmersiveSearchProps> = ({ onSearch }) => {
    const [step, setStep] = useState<Step>('country');
    const [selectedCountry, setSelectedCountry] = useState<{ id: number, name: string } | null>(null);
    const [availableDestinations, setAvailableDestinations] = useState<any[]>([]);
    const [selectedDestinations, setSelectedDestinations] = useState<any[]>([]);
    const [isLoadingDestinations, setIsLoadingDestinations] = useState(false);
    const [showAllDestinations, setShowAllDestinations] = useState(false);
    const [destinationSearchTerm, setDestinationSearchTerm] = useState('');
    const [isSearchingDestinations, setIsSearchingDestinations] = useState(false);

    // Date & pax state
    const [checkIn, setCheckIn] = useState<string>('');
    const [checkOut, setCheckOut] = useState<string>('');
    const [nights, setNights] = useState<number>(7);
    const [rooms, setRooms] = useState(1);
    const [roomAllocations, setRoomAllocations] = useState<{ adults: number, children: number, childrenAges: number[] }[]>([
        { adults: 2, children: 0, childrenAges: [] }
    ]);

    // Sync nights and dates
    useEffect(() => {
        if (checkIn && checkOut) {
            const start = new Date(checkIn);
            const end = new Date(checkOut);
            const diffTime = end.getTime() - start.getTime();
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            if (diffDays !== nights && diffDays > 0) {
                setNights(diffDays);
            }
        }
    }, [checkIn, checkOut]);

    const handleNightsChange = (delta: number) => {
        const newNights = Math.max(1, nights + delta);
        setNights(newNights);

        if (checkIn) {
            const start = new Date(checkIn);
            const end = new Date(start);
            end.setDate(start.getDate() + newNights);
            setCheckOut(end.toISOString().split('T')[0]);
        }
    };

    // Validate/Update room allocations when rooms count changes
    useEffect(() => {
        if (roomAllocations.length < rooms) {
            // Add rooms
            const newRooms = [...roomAllocations];
            for (let i = roomAllocations.length; i < rooms; i++) {
                newRooms.push({ adults: 2, children: 0, childrenAges: [] });
            }
            setRoomAllocations(newRooms);
        } else if (roomAllocations.length > rooms) {
            // Remove rooms
            setRoomAllocations(roomAllocations.slice(0, rooms));
        }
    }, [rooms]);

    // Helper to update specific room
    const updateRoom = (index: number, field: 'adults' | 'children', delta: number) => {
        const newAllocations = [...roomAllocations];
        const room = newAllocations[index];

        if (field === 'adults') {
            room.adults = Math.max(1, room.adults + delta);
        } else {
            room.children = Math.max(0, room.children + delta);
            // Adjust ages array size
            if (room.childrenAges.length < room.children) {
                while (room.childrenAges.length < room.children) room.childrenAges.push(5);
            } else if (room.childrenAges.length > room.children) {
                room.childrenAges = room.childrenAges.slice(0, room.children);
            }
        }
        setRoomAllocations(newAllocations);
    };

    // Helper for child age
    const updateChildAge = (roomIndex: number, childIndex: number, newAge: number) => {
        const newAllocations = [...roomAllocations];
        newAllocations[roomIndex].childrenAges[childIndex] = newAge;
        setRoomAllocations(newAllocations);
    };

    // New fields
    // New fields
    const [selectedCategories, setSelectedCategories] = useState<string[]>([]); // Mandatory multiple
    const [selectedServices, setSelectedServices] = useState<string[]>([]);   // Optional multiple
    const [nationality, setNationality] = useState('RS'); // Mandatory
    const [budgetFrom, setBudgetFrom] = useState('');     // Optional
    const [budgetTo, setBudgetTo] = useState('');         // Optional

    const [activeCalendar, setActiveCalendar] = useState<'in' | 'out' | null>(null);

    // Load destinations when country is selected
    useEffect(() => {
        if (selectedCountry) {
            setIsLoadingDestinations(true);
            // Fetch cities for this country
            // Utilizing existing service but simplified for this view
            const fetchCities = async () => {
                // Simulate fetching or use real service
                // For demo/UX speed we might want to hardcode popular ones or fetch quickly
                // Let's use searchDestinations with country name to get its cities
                const results = await searchDestinations(selectedCountry.name);
                // Filter to ensure reliability
                const cities = results.filter(r => r.type === 'city' || r.type === 'hotel'); // Mostly cities

                // Hack: if empty (api limit/error), provide defaults for major countries
                if (cities.length === 0) {
                    if (selectedCountry.name === 'Bugarska') setAvailableDestinations([
                        { id: 33, name: 'Zlatni Pjasci', type: 'city' },
                        { id: 68, name: 'Sunčev Breg', type: 'city' },
                        { id: 1, name: 'Nesebar', type: 'city' },
                        { id: 9, name: 'Bansko', type: 'city' },
                        { id: 6, name: 'Borovec', type: 'city' },
                        { id: 10, name: 'Pamporovo', type: 'city' }
                    ]);
                    else if (selectedCountry.name === 'Grčka') setAvailableDestinations([
                        { id: 101, name: 'Halkidiki', type: 'city' },
                        { id: 102, name: 'Tasos', type: 'city' },
                        { id: 103, name: 'Olimpska Regija', type: 'city' },
                        { id: 104, name: 'Krf', type: 'city' },
                        { id: 105, name: 'Rodos', type: 'city' }
                    ]);
                    else if (selectedCountry.name === 'Turska') setAvailableDestinations([
                        { id: 201, name: 'Antalija', type: 'city' },
                        { id: 202, name: 'Kemer', type: 'city' },
                        { id: 203, name: 'Belek', type: 'city' },
                        { id: 204, name: 'Side', type: 'city' },
                        { id: 205, name: 'Alanja', type: 'city' }
                    ]);
                    else if (selectedCountry.name === 'Egipat') setAvailableDestinations([
                        { id: 301, name: 'Hurgada', type: 'city' },
                        { id: 302, name: 'Šarm el Šeik', type: 'city' }
                    ]);
                    else {
                        setAvailableDestinations(results);
                    }
                } else {
                    setAvailableDestinations(cities);
                }

                // Sort alphabetically by name
                setAvailableDestinations(prev => [...prev].sort((a, b) => a.name.localeCompare(b.name)));

                setIsLoadingDestinations(false);
            };
            fetchCities();
        }
    }, [selectedCountry]);

    const filteredDestinations = availableDestinations.filter(d =>
        d.name.toLowerCase().includes(destinationSearchTerm.toLowerCase())
    );

    const displayedDestinations = isSearchingDestinations
        ? filteredDestinations
        : (showAllDestinations ? availableDestinations : availableDestinations.slice(0, 10));

    const handleCountrySelect = (country: { id: number, name: string }) => {
        if (selectedCountry?.id === country.id) {
            setSelectedCountry(null); // Toggle off
        } else {
            setSelectedCountry(country);
            setStep('destination');
        }
    };

    const handleDestinationToggle = (dest: any) => {
        const isSelected = selectedDestinations.find(d => d.id === dest.id);
        if (isSelected) {
            setSelectedDestinations(prev => prev.filter(d => d.id !== dest.id));
        } else {
            if (selectedDestinations.length < 3) {
                setSelectedDestinations(prev => [...prev, dest]);
            }
        }
    };

    const handleDateSelect = (dateStr: string) => {
        if (activeCalendar === 'in') {
            setCheckIn(dateStr);
            if (nights) {
                const start = new Date(dateStr);
                const end = new Date(start);
                end.setDate(start.getDate() + nights);
                setCheckOut(end.toISOString().split('T')[0]);
            }
            setActiveCalendar('out');
        } else {
            setCheckOut(dateStr);
            setActiveCalendar(null);
        }
    };

    const handleFinalSearch = () => {
        // Construct search data
        const searchData = {
            destinations: selectedDestinations.length > 0 ? selectedDestinations : [
                // Fallback to country ID mapping if no specific city selected
                { id: selectedCountry?.id, name: selectedCountry?.name, type: 'country' }
            ],
            checkIn: checkIn || new Date().toISOString().split('T')[0], // Fallback today
            checkOut: checkOut || new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
            rooms,
            // Sum up total travelers for compatibility, but also pass room details if needed
            adults: roomAllocations.reduce((sum, r) => sum + r.adults, 0),
            children: roomAllocations.reduce((sum, r) => sum + r.children, 0),
            childrenAges: roomAllocations.flatMap(r => r.childrenAges),
            roomAllocations, // Pass full structure

            // New structure
            categories: selectedCategories,
            services: selectedServices,
            nationality,
            budget: {
                from: budgetFrom ? Number(budgetFrom) : undefined,
                to: budgetTo ? Number(budgetTo) : undefined
            }
        };

        // Basic validation for mandatory fields
        if (selectedCategories.length === 0) {
            alert('Molimo izaberite bar jednu kategoriju (Zvezdice).');
            return;
        }
        if (!nationality) {
            alert('Molimo unesite nacionalnost.');
            return;
        }

        onSearch(searchData);
    };

    // Toggles
    const toggleCategory = (cat: string) => {
        if (selectedCategories.includes(cat)) {
            setSelectedCategories(prev => prev.filter(c => c !== cat));
        } else {
            setSelectedCategories(prev => [...prev, cat]);
        }
    };

    const toggleService = (srv: string) => {
        if (selectedServices.includes(srv)) {
            setSelectedServices(prev => prev.filter(s => s !== srv));
        } else {
            setSelectedServices(prev => [...prev, srv]);
        }
    };

    return (
        <div className="immersive-wrapper">
            {/* Background Particles could go here */}

            {/* STEP 1: COUNTRY */}
            {step === 'country' && (
                <div className="immersive-step-container">
                    <h2 className="immersive-title">Gde želite da putujete?</h2>
                    <div className="immersive-tags-grid">
                        {COMMON_COUNTRIES.map(country => (
                            <div
                                key={country.id}
                                className={`immersive-tag country ${selectedCountry?.id === country.id ? 'selected' : ''}`}
                                onClick={() => handleCountrySelect(country)}
                            >
                                {country.name}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* STEP 2: DESTINATIONS */}
            {step === 'destination' && (
                <div className="immersive-step-container">
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '2rem', gap: '1rem' }}>
                        <button className="immersive-back-btn" onClick={() => { setStep('country'); setSelectedCountry(null); setSelectedDestinations([]); }}>
                            <ArrowLeft size={20} /> Nazad
                        </button>
                        <h2 className="immersive-title" style={{ margin: 0 }}>
                            {selectedCountry?.name}: Izaberite do 3 destinacije
                        </h2>
                    </div>

                    {isLoadingDestinations ? (
                        <div style={{ color: 'white', opacity: 0.7 }}>Učitavam destinacije...</div>
                    ) : (
                        <div className="immersive-tags-grid">
                            {/* Show Search Input if requested */}
                            {isSearchingDestinations && (
                                <div style={{ width: '100%', marginBottom: '1rem', display: 'flex', justifyContent: 'center' }}>
                                    <input
                                        type="text"
                                        autoFocus
                                        placeholder="Upišite naziv destinacije..."
                                        className="immersive-input"
                                        style={{ maxWidth: '300px', textAlign: 'center' }}
                                        value={destinationSearchTerm}
                                        onChange={(e) => setDestinationSearchTerm(e.target.value)}
                                    />
                                </div>
                            )}

                            {displayedDestinations.map(dest => (
                                <div
                                    key={dest.id}
                                    className={`immersive-tag ${selectedDestinations.find(d => d.id === dest.id) ? 'selected' : ''}`}
                                    onClick={() => handleDestinationToggle(dest)}
                                >
                                    {dest.name}
                                </div>
                            ))}

                            {/* "Pretraži..." trigger if not searching and we have more items */}
                            {!isSearchingDestinations && availableDestinations.length > 10 && (
                                <div
                                    className="immersive-tag search-trigger"
                                    onClick={() => setIsSearchingDestinations(true)}
                                    style={{ borderStyle: 'dashed', opacity: 0.8 }}
                                >
                                    <Search size={16} style={{ marginRight: 6 }} /> Pretraži ostalo...
                                </div>
                            )}
                        </div>
                    )}

                    <div className="immersive-actions" style={{ opacity: 1 }}> {/* Always visible here */}
                        <button className="immersive-next-btn" onClick={() => setStep('dates')}>
                            Dalje <ChevronRight size={20} style={{ marginLeft: 5 }} />
                        </button>
                    </div>
                </div>
            )}

            {/* STEP 3: DATES */}
            {step === 'dates' && (
                <div className="immersive-step-container" style={{ position: 'relative' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '2rem', gap: '1.5rem' }}>
                        <button className="immersive-back-btn" onClick={() => setStep('destination')}>
                            <ArrowLeft size={20} /> Nazad
                        </button>
                        <h2 className="immersive-title" style={{ margin: 0 }}>Izaberite trajanje</h2>
                    </div>

                    <div className="immersive-inputs-grid-expanded" style={{ maxWidth: '750px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                            <div className="immersive-section-row" style={{ gridTemplateColumns: '1fr 0.6fr 1fr' }}>
                                <div className="immersive-input-group">
                                    <label className="immersive-label"><CalendarIcon size={16} style={{ marginRight: 8, display: 'inline' }} /> Datum Polaska</label>
                                    <div className="immersive-date-display" onClick={() => setActiveCalendar('in')}>
                                        {checkIn ? new Date(checkIn).toLocaleDateString('sr-RS') : 'Izaberite datum'}
                                    </div>
                                </div>

                                <div className="immersive-input-group" style={{ alignItems: 'center', justifyContent: 'center' }}>
                                    <label className="immersive-label">Noćenja</label>
                                    <div className="immersive-counter">
                                        <button onClick={() => handleNightsChange(-1)}>-</button>
                                        <span style={{ fontSize: '1.5rem', minWidth: '40px', textAlign: 'center' }}>{nights}</span>
                                        <button onClick={() => handleNightsChange(1)}>+</button>
                                    </div>
                                </div>

                                <div className="immersive-input-group">
                                    <label className="immersive-label"><CalendarIcon size={16} style={{ marginRight: 8, display: 'inline' }} /> Datum Povratka</label>
                                    <div className="immersive-date-display" onClick={() => setActiveCalendar('out')}>
                                        {checkOut ? new Date(checkOut).toLocaleDateString('sr-RS') : 'Izaberite datum'}
                                    </div>
                                </div>
                            </div>

                            {checkIn && checkOut && (
                                <div style={{ textAlign: 'center', color: 'rgba(0, 242, 254, 0.8)', fontSize: '1.1rem', background: 'rgba(0, 242, 254, 0.1)', padding: '0.8rem', borderRadius: '15px' }}>
                                    Boravak od <strong>{new Date(checkIn).toLocaleDateString('sr-RS')}</strong> do <strong>{new Date(checkOut).toLocaleDateString('sr-RS')}</strong> ({nights} {nights === 1 ? 'noćenje' : 'noćenja'})
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Calendar Popover */}
                    {activeCalendar && (
                        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 100, background: '#0f172a', padding: '1rem', borderRadius: '20px', boxShadow: '0 0 50px rgba(0,0,0,0.8)', border: '1px solid rgba(255,255,255,0.1)' }}>
                            <ModernCalendar
                                startDate={checkIn || null}
                                endDate={checkOut || null}
                                onChange={(start, end) => {
                                    if (start) setCheckIn(start);
                                    if (end) setCheckOut(end);
                                    if (start && end) setActiveCalendar(null);
                                }}
                                onClose={() => setActiveCalendar(null)}
                            />
                        </div>
                    )}

                    <div className="immersive-actions" style={{ opacity: 1, marginTop: '3rem' }}>
                        <button className="immersive-next-btn" onClick={() => setStep('travelers')}>
                            Dalje <ChevronRight size={20} style={{ marginLeft: 5 }} />
                        </button>
                    </div>
                </div>
            )}

            {/* STEP 4: TRAVELERS (Rooms & Pax) */}
            {step === 'travelers' && (
                <div className="immersive-step-container">
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '3rem', gap: '1.5rem' }}>
                        <button className="immersive-back-btn" onClick={() => setStep('dates')}>
                            <ArrowLeft size={20} /> Nazad
                        </button>
                        <h2 className="immersive-title" style={{ margin: 0 }}>Ko putuje?</h2>
                    </div>

                    <div className="immersive-inputs-grid-expanded">
                        <div className="immersive-section-row" style={rooms > 1 ? { gridTemplateColumns: '1fr' } : {}}>
                            <div style={{ display: 'flex', gap: '1.5rem', width: '100%', flexDirection: rooms > 1 ? 'column' : 'row' }}>
                                {/* Rooms Counter Column */}
                                <div className="immersive-input-group" style={{ height: 'auto', alignSelf: 'flex-start', minWidth: '200px' }}>
                                    <label className="immersive-label">Broj Soba</label>
                                    <div className="immersive-counter">
                                        <button onClick={() => setRooms(Math.max(1, rooms - 1))}>-</button>
                                        <span>{rooms}</span>
                                        <button onClick={() => setRooms(rooms + 1)}>+</button>
                                    </div>
                                </div>

                                {/* Travelers Per Room Column */}
                                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                    {roomAllocations.map((room, index) => (
                                        <div key={index} className="immersive-input-group" style={{ height: 'auto' }}>
                                            <label className="immersive-label">
                                                <UsersIcon size={16} style={{ marginRight: 8, display: 'inline' }} />
                                                Putnici - Soba {index + 1}
                                            </label>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                                <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
                                                    <div className="immersive-counter">
                                                        <span className="counter-label">Odrasli:</span>
                                                        <button onClick={() => updateRoom(index, 'adults', -1)}>-</button>
                                                        <span>{room.adults}</span>
                                                        <button onClick={() => updateRoom(index, 'adults', 1)}>+</button>
                                                    </div>
                                                    <div className="immersive-counter">
                                                        <span className="counter-label">Deca:</span>
                                                        <button onClick={() => updateRoom(index, 'children', -1)}>-</button>
                                                        <span>{room.children}</span>
                                                        <button onClick={() => updateRoom(index, 'children', 1)}>+</button>
                                                    </div>
                                                </div>

                                                {/* Child Ages if any */}
                                                {room.children > 0 && (
                                                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap', marginTop: '0.5rem', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '0.5rem' }}>
                                                        <span className="counter-label" style={{ fontSize: '0.8rem' }}>Uzrast dece:</span>
                                                        {room.childrenAges.map((age, cIndex) => (
                                                            <input
                                                                key={cIndex}
                                                                type="number"
                                                                className="immersive-input"
                                                                style={{ width: '40px', padding: '0', textAlign: 'center', fontSize: '1rem' }}
                                                                value={age}
                                                                min={0}
                                                                max={17}
                                                                onChange={(e) => updateChildAge(index, cIndex, parseInt(e.target.value) || 0)}
                                                            />
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="immersive-actions" style={{ opacity: 1, marginTop: '3rem' }}>
                        <button className="immersive-next-btn" onClick={() => setStep('experiences')}>
                            Dalje <ChevronRight size={20} style={{ marginLeft: 5 }} />
                        </button>
                    </div>
                </div>
            )}

            {/* STEP 5: EXPERIENCES (Category, Service, Budget) */}
            {step === 'experiences' && (
                <div className="immersive-step-container">
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '2rem', gap: '1.5rem' }}>
                        <button className="immersive-back-btn" onClick={() => setStep('travelers')}>
                            <ArrowLeft size={20} /> Nazad
                        </button>
                        <h2 className="immersive-title" style={{ margin: 0 }}>Detalji putovanja</h2>
                    </div>

                    <div className="immersive-inputs-grid-expanded">
                        {/* CATEGORY */}
                        <div className="immersive-input-group">
                            <label className="immersive-label">Kategorija (Zvezdice) <span className="req">*</span></label>
                            <div className="immersive-tags-row">
                                {['2', '3', '4', '5'].map(star => (
                                    <div
                                        key={star}
                                        className={`immersive-filter-tag ${selectedCategories.includes(star) ? 'selected' : ''}`}
                                        onClick={() => toggleCategory(star)}
                                    >
                                        {star} ★
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* SERVICE */}
                        <div className="immersive-input-group">
                            <label className="immersive-label">Usluga <span className="opt">(Opciono)</span></label>
                            <div className="immersive-tags-row">
                                {[
                                    { code: 'RO', label: 'Najam' },
                                    { code: 'BB', label: 'Noćenje sa doručkom' },
                                    { code: 'HB', label: 'Polupansion' },
                                    { code: 'AI', label: 'All Inclusive' },
                                    { code: 'UAI', label: 'Ultra AI' }
                                ].map(srv => (
                                    <div
                                        key={srv.code}
                                        className={`immersive-filter-tag ${selectedServices.includes(srv.code) ? 'selected' : ''}`}
                                        onClick={() => toggleService(srv.code)}
                                    >
                                        {srv.label}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* NATIONALITY & BUDGET */}
                        <div className="immersive-section-row">
                            <div className="immersive-input-group">
                                <label className="immersive-label">Nacionalnost <span className="req">*</span></label>
                                <select
                                    className="immersive-select"
                                    value={nationality}
                                    onChange={(e) => setNationality(e.target.value)}
                                >
                                    <option value="RS">Srbija</option>
                                    <option value="BA">Bosna i Hercegovina</option>
                                    <option value="ME">Crna Gora</option>
                                    <option value="HR">Hrvatska</option>
                                    <option value="MK">Makedonija</option>
                                    <option value="EU">EU Pasoš</option>
                                    <option value="Other">Ostalo</option>
                                </select>
                            </div>
                            <div className="immersive-input-group">
                                <label className="immersive-label">Budžet (EUR) <span className="opt">(Opciono)</span></label>
                                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                    <input
                                        type="number"
                                        className="immersive-input"
                                        placeholder="Od"
                                        value={budgetFrom}
                                        onChange={(e) => setBudgetFrom(e.target.value)}
                                    />
                                    <span style={{ color: 'rgba(255,255,255,0.5)' }}>-</span>
                                    <input
                                        type="number"
                                        className="immersive-input"
                                        placeholder="Do"
                                        value={budgetTo}
                                        onChange={(e) => setBudgetTo(e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="immersive-actions" style={{ opacity: 1, marginTop: '3rem' }}>
                        <button className="narrative-action-btn" onClick={handleFinalSearch}>
                            PRONAĐI PUTOVANJE <Search size={24} style={{ marginLeft: 10 }} />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};
