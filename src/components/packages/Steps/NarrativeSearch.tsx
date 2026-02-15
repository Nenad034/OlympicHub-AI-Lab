import React, { useState, useEffect, useRef } from 'react';
import './NarrativeSearch.css';
import { createPortal } from 'react-dom';
import { ModernCalendar } from '../../../components/ModernCalendar';
import { formatDate } from '../../../utils/dateUtils';
import type { BasicInfoData, DestinationInput } from '../../../types/packageSearch.types';
import { X, Search, Users, Baby } from 'lucide-react';
import solvexDictionaryService from '../../../services/solvex/solvexDictionaryService';

interface NarrativeSearchProps {
    basicInfo: BasicInfoData | null;
    onUpdate: (data: BasicInfoData) => void;
    onNext: (data: BasicInfoData) => void;
}

type ActiveField = 'destination' | 'date' | 'nights' | 'travelers' | null;

export const NarrativeSearch: React.FC<NarrativeSearchProps> = ({ basicInfo, onUpdate, onNext }) => {
    // Local state for the "Sentence"
    // We init from basicInfo but simplified for the demo
    const [activeField, setActiveField] = useState<ActiveField>(null);
    const [destination, setDestination] = useState<string>(basicInfo?.destinations[0]?.city || '');
    const [checkIn, setCheckIn] = useState<string>(basicInfo?.destinations[0]?.checkIn || '');
    const [checkOut, setCheckOut] = useState<string>(basicInfo?.destinations[0]?.checkOut || '');
    const [nights, setNights] = useState<number>(basicInfo?.destinations[0]?.nights || 7);
    const [adults, setAdults] = useState<number>(basicInfo?.travelers?.adults || 2);
    const [children, setChildren] = useState<number>(basicInfo?.travelers?.children || 0);
    const [childrenAges, setChildrenAges] = useState<number[]>(basicInfo?.travelers?.childrenAges || []);
    const [suggestions, setSuggestions] = useState<any[]>([]);

    const [selectedDestination, setSelectedDestination] = useState<any>(basicInfo?.destinations[0] || null);

    const containerRef = useRef<HTMLDivElement>(null);

    // Sync back to parent when values change
    useEffect(() => {
        // Construct standard data format for parent compatibility
        // USE REAL DATA FROM selectedDestination if available
        const standardDest: DestinationInput = {
            id: selectedDestination?.id || 'narrative-1',
            city: selectedDestination?.name || destination, // Use name from object if valid
            country: selectedDestination?.country_name || '',
            countryCode: selectedDestination?.country_code || '',
            airportCode: '',
            checkIn: checkIn,
            checkOut: checkOut,
            nights: nights,
            travelers: { adults, children, childrenAges },
            category: ["Sve kategorije"], // Defaults for now
            service: ["Sve usluge"],
            flexibleDays: 0,
            // Pass provider info if available
            type: selectedDestination?.type || 'destination'
        };

        const newData: BasicInfoData = {
            destinations: [standardDest],
            travelers: { adults, children, childrenAges },
            budget: basicInfo?.budget,
            nationality: basicInfo?.nationality || 'RS',
            currency: 'EUR',
            startDate: checkIn,
            endDate: checkOut,
            totalDays: nights
        };

        onUpdate(newData);
    }, [destination, selectedDestination, checkIn, checkOut, nights, adults, children, childrenAges]);

    // Click outside to close popovers
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (activeField && containerRef.current && !containerRef.current.contains(event.target as Node)) {
                // If clicking calendar portal, don't close. Simplified check:
                if ((event.target as HTMLElement).closest('.modern-calendar-overlay')) return;
                setActiveField(null);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [activeField]);

    // Fetch Suggestions Effect
    useEffect(() => {
        const fetchSuggestions = async () => {
            if (destination.length >= 3) {
                // Don't search if we haven't changed the input from the selected destination name
                if (selectedDestination && destination === selectedDestination.name) return;

                try {
                    const results = await solvexDictionaryService.searchDestinations(destination);
                    setSuggestions(results || []);
                } catch (e) {
                    console.error(e);
                }
            } else {
                setSuggestions([]);
            }
        };
        const debounce = setTimeout(fetchSuggestions, 300);
        return () => clearTimeout(debounce);
    }, [destination, selectedDestination]);

    const handleDateSelect = (start: string, end: string) => {
        // ModernCalendar returns YYYY-MM-DD strings
        setCheckIn(start);
        setCheckOut(end);
        if (start && end) {
            const s = new Date(start);
            const e = new Date(end);
            const n = Math.ceil((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24));
            setNights(n);
        }
        setActiveField(null);
    };

    const handleNightsChange = (delta: number) => {
        const newNights = Math.max(1, Math.min(30, nights + delta));
        setNights(newNights);

        // If checkIn exists, update checkOut
        if (checkIn) {
            const s = new Date(checkIn);
            s.setDate(s.getDate() + newNights);
            setCheckOut(s.toISOString().split('T')[0]);
        }
    };

    return (
        <div className={`narrative-wrapper ${activeField ? 'has-active-field' : ''} field-active-${activeField || 'none'}`}>
            <div className="narrative-background-glow"></div>

            <div className="narrative-container" ref={containerRef}>
                <div className="narrative-sentence">
                    Odaberite Državu, destinaciju ili hotel u
                    <span
                        className={`narrative-input ${activeField === 'destination' ? 'active' : ''}`}
                        onClick={(e) => {
                            e.stopPropagation();
                            setActiveField(activeField === 'destination' ? null : 'destination');
                        }}
                    >
                        {selectedDestination?.name || destination || "Bilo gde"}
                        {activeField === 'destination' && (
                            <div className="narrative-popover" onClick={e => e.stopPropagation()}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                                    <Search size={18} color="rgba(255,255,255,0.5)" />
                                    <span style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase' }}>Gde želite da idete?</span>
                                </div>
                                <input
                                    autoFocus
                                    className="narrative-search-input"
                                    placeholder="npr. Grčka, Turska, Kopaonik..."
                                    value={destination}
                                    onChange={(e) => {
                                        setDestination(e.target.value);
                                        // Clear selection if user types
                                        if (selectedDestination && e.target.value !== selectedDestination.name) {
                                            setSelectedDestination(null);
                                        }
                                    }}
                                    onClick={(e) => e.stopPropagation()}
                                />
                                {suggestions.length > 0 ? (
                                    <div className="narrative-suggestions-list">
                                        {suggestions.map((s: any) => (
                                            <div
                                                key={s.id}
                                                className="narrative-suggestion-item"
                                                onClick={() => {
                                                    setDestination(s.name);
                                                    setSelectedDestination(s); // STORE FULL OBJECT
                                                    setActiveField(null);
                                                }}
                                            >
                                                <span style={{ opacity: 0.7 }}>{s.type === 'hotel' ? '🏨' : '📍'}</span>
                                                <div>
                                                    <div style={{ fontWeight: 'bold' }}>{s.name}</div>
                                                    <div style={{ fontSize: '0.8rem', opacity: 0.6 }}>{s.type === 'hotel' ? s.stars + '★ ' + s.country_name : s.country_name}</div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div style={{ marginTop: '15px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                        {['Grčka', 'Bugarska', 'Turska', 'Egipat', 'Maldivi', 'Zlatibor'].map(place => (
                                            <button
                                                key={place}
                                                onClick={() => {
                                                    setDestination(place);
                                                    // For hardcoded, likely no ID, or we mock one. 
                                                    // Ideally check if these exist in basic dictionary or just set text
                                                    setSelectedDestination({ id: 'mock-' + place, name: place, type: 'destination' });
                                                    setActiveField(null);
                                                }}
                                                style={{
                                                    background: 'rgba(255,255,255,0.1)',
                                                    border: '1px solid rgba(255,255,255,0.2)',
                                                    borderRadius: '20px',
                                                    padding: '5px 12px',
                                                    color: 'white',
                                                    cursor: 'pointer',
                                                    fontSize: '0.85rem'
                                                }}
                                            >
                                                {place}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </span>
                    <br />
                    polazak
                    <span
                        className={`narrative-input ${activeField === 'date' ? 'active' : ''}`}
                        onClick={() => setActiveField(activeField === 'date' ? null : 'date')}
                    >
                        {checkIn ? formatDate(checkIn) : "bilo kad"}
                    </span>
                    na
                    <span
                        className={`narrative-input ${activeField === 'nights' ? 'active' : ''}`}
                        onClick={() => setActiveField(activeField === 'nights' ? null : 'nights')}
                    >
                        {nights} noći
                        {activeField === 'nights' && (
                            <div className="narrative-popover" onClick={e => e.stopPropagation()}>
                                <div className="narrative-number-control">
                                    <button className="narrative-btn-round" onClick={() => handleNightsChange(-1)}>-</button>
                                    <span className="narrative-value">{nights}</span>
                                    <button className="narrative-btn-round" onClick={() => handleNightsChange(1)}>+</button>
                                </div>
                                <div style={{ textAlign: 'center', marginTop: '10px', fontSize: '0.9rem', color: '#94a3b8' }}>Trajanje putovanja</div>
                            </div>
                        )}
                    </span>
                    .
                    <br />
                    Putuje nas
                    <span
                        className={`narrative-input ${activeField === 'travelers' ? 'active' : ''}`}
                        onClick={() => setActiveField(activeField === 'travelers' ? null : 'travelers')}
                    >
                        {adults + children}
                        {activeField === 'travelers' && (
                            <div className="narrative-popover" onClick={e => e.stopPropagation()} style={{ width: '280px', padding: '1.25rem' }}>
                                <div className="narrative-number-control" style={{ marginBottom: '8px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
                                        <Users size={18} color="#4facfe" />
                                        <span style={{ fontSize: '0.95rem', fontWeight: '500' }}>Odrasli</span>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <button className="narrative-btn-round compact" onClick={() => setAdults(Math.max(1, adults - 1))}>-</button>
                                        <span className="narrative-value compact">{adults}</span>
                                        <button className="narrative-btn-round compact" onClick={() => setAdults(Math.min(10, adults + 1))}>+</button>
                                    </div>
                                </div>
                                <div className="narrative-number-control">
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
                                        <Baby size={18} color="#4facfe" />
                                        <span style={{ fontSize: '0.95rem', fontWeight: '500' }}>Deca</span>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <button className="narrative-btn-round compact" onClick={() => {
                                            if (children > 0) {
                                                setChildren(children - 1);
                                                setChildrenAges(prev => prev.slice(0, -1));
                                            }
                                        }}>-</button>
                                        <span className="narrative-value compact">{children}</span>
                                        <button className="narrative-btn-round compact" onClick={() => {
                                            if (children < 4) {
                                                setChildren(children + 1);
                                                setChildrenAges(prev => [...prev, 7]);
                                            }
                                        }}>+</button>
                                    </div>
                                </div>

                                {children > 0 && (
                                    <div style={{ marginTop: '12px', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '10px' }}>
                                        <div style={{ fontSize: '0.85rem', marginBottom: '8px', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                            <span>Urast dece:</span>
                                        </div>
                                        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                                            {childrenAges.map((age, idx) => (
                                                <input
                                                    key={idx}
                                                    type="number"
                                                    value={age}
                                                    onChange={(e) => {
                                                        const val = parseInt(e.target.value);
                                                        const newAges = [...childrenAges];
                                                        newAges[idx] = Math.max(0, Math.min(17, isNaN(val) ? 0 : val));
                                                        setChildrenAges(newAges);
                                                    }}
                                                    className="narrative-search-input compact"
                                                    style={{ width: '50px', padding: '6px', textAlign: 'center', fontSize: '0.85rem' }}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <div style={{ marginTop: '15px', display: 'flex', justifyContent: 'center' }}>
                                    <button
                                        className="narrative-confirm-btn"
                                        style={{ width: '100%', padding: '8px 20px', fontSize: '0.9rem' }}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setActiveField(null);
                                        }}
                                    >
                                        POTVRDI
                                    </button>
                                </div>
                            </div>
                        )}
                    </span>
                </div>

                <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'center' }}>
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
                            travelers: { adults, children, childrenAges },
                            category: ["Sve kategorije"],
                            service: ["Sve usluge"],
                            flexibleDays: 0,
                            type: selectedDestination?.type || 'destination'
                        };

                        const newData: BasicInfoData = {
                            destinations: [standardDest],
                            travelers: { adults, children, childrenAges },
                            budget: basicInfo?.budget,
                            nationality: basicInfo?.nationality || 'RS',
                            currency: 'EUR',
                            startDate: checkIn,
                            endDate: checkOut,
                            totalDays: nights
                        };
                        onNext(newData);
                    }}>
                        Pronađi moje putovanje
                    </button>
                </div>
            </div>

            {/* Render Calendar Portal when "date" is active */}
            {activeField === 'date' && createPortal(
                <ModernCalendar
                    startDate={checkIn}
                    endDate={checkOut}
                    onChange={handleDateSelect}
                    onClose={() => setActiveField(null)}
                />,
                document.getElementById('portal-root') || document.body
            )}
        </div>
    );
};
