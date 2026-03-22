import React, { useState, useRef, useEffect } from 'react';
import { MapPin, Search, X } from 'lucide-react';
import { searchAirports, getAirportByCode, type Airport } from '../../data/airports';

interface AirportAutocompleteProps {
    value: string; // IATA code
    onChange: (code: string, city: string) => void;
    placeholder?: string;
    icon?: React.ReactNode;
}

const AirportAutocomplete: React.FC<AirportAutocompleteProps> = ({
    value,
    onChange,
    placeholder = 'Odakle?',
    icon = <MapPin size={18} />
}) => {
    const [inputValue, setInputValue] = useState('');
    const [isOpen, setIsOpen] = useState(false);
    const [suggestions, setSuggestions] = useState<Airport[]>([]);
    const [selectedIndex, setSelectedIndex] = useState(-1);
    const wrapperRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (value) {
            const airport = getAirportByCode(value);
            if (airport) {
                setInputValue(`${airport.city} (${airport.code})`);
            } else {
                setInputValue(value);
            }
        } else {
            setInputValue('');
        }
    }, [value]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = e.target.value;
        setInputValue(newValue);

        if (newValue.length >= 2) {
            const results = searchAirports(newValue);
            setSuggestions(results);
            setIsOpen(true);
        } else {
            setSuggestions([]);
            setIsOpen(false);
        }
        setSelectedIndex(-1);
    };

    const handleSelect = (airport: Airport) => {
        setInputValue(`${airport.city} (${airport.code})`);
        onChange(airport.code, airport.city);
        setIsOpen(false);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (!isOpen) return;
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setSelectedIndex(prev => prev < suggestions.length - 1 ? prev + 1 : prev);
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
        } else if (e.key === 'Enter') {
            if (selectedIndex >= 0 && suggestions[selectedIndex]) {
                handleSelect(suggestions[selectedIndex]);
            }
        } else if (e.key === 'Escape') {
            setIsOpen(false);
        }
    };

    return (
        <div className="v6-ctrl-box" ref={wrapperRef} style={{ position: 'relative', flex: 1 }}>
            <div className="v6-input-v6-styled" style={{ cursor: 'text', height: '52px' }}>
                <div className="v6-inner-icon">{icon}</div>
                <input
                    type="text"
                    className="v6-field-input-clean"
                    style={{ 
                        border: 'none', 
                        background: 'transparent', 
                        width: '100%', 
                        outline: 'none', 
                        padding: 0,
                        color: 'var(--text-main)',
                        fontWeight: 700,
                        fontSize: '15px'
                    }}
                    value={inputValue}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                    placeholder={placeholder}
                    onFocus={() => {
                        if (inputValue.length >= 2) setIsOpen(true);
                    }}
                />
                {inputValue && (
                    <button 
                        onClick={() => { setInputValue(''); onChange('', ''); }}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', opacity: 0.5 }}
                    >
                        <X size={14} />
                    </button>
                )}
            </div>

            {isOpen && suggestions.length > 0 && (
                <div 
                    className={`v6-prime-hub ${document.body.classList.contains('v6-dark') ? 'v6-dark' : ''}`}
                    style={{
                        position: 'absolute', top: 'calc(100% + 8px)', left: 0, right: 0, zIndex: 1100,
                        background: 'var(--bg-surface)', border: '1.5px solid var(--border-color)', borderRadius: '16px',
                        boxShadow: 'var(--shadow-md)', overflow: 'hidden',
                        animation: 'v6-pop-in 0.2s cubic-bezier(0.18, 0.89, 0.32, 1.28)'
                    }}
                >
                    <div style={{ padding: '10px 16px', fontSize: '11px', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid var(--border-color)' }}>
                        Pronađeni aerodromi
                    </div>
                    {suggestions.map((s, idx) => (
                        <div 
                            key={s.code}
                            onClick={() => handleSelect(s)}
                            onMouseEnter={() => setSelectedIndex(idx)}
                            style={{
                                padding: '14px 16px', cursor: 'pointer', borderBottom: idx === suggestions.length - 1 ? 'none' : '1px solid var(--border-color)',
                                background: idx === selectedIndex ? 'var(--bg-app)' : 'transparent',
                                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                transition: 'all 0.2s ease'
                            }}
                        >
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                <span style={{ fontWeight: 800, color: 'var(--text-main)', fontSize: '14px' }}>{s.city}</span>
                                <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 500 }}>{s.name}</span>
                            </div>
                            <span style={{ fontWeight: 900, color: 'var(--text-main)', background: 'var(--bg-app)', border: '1px solid var(--border-color)', padding: '6px 10px', borderRadius: '8px', fontSize: '13px', letterSpacing: '0.05em' }}>{s.code}</span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default AirportAutocomplete;
