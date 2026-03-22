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
            <div className="v6-input-v6-styled" style={{ cursor: 'text' }}>
                <div className="v6-inner-icon">{icon}</div>
                <input
                    type="text"
                    className="v6-select-v6" // Using same class for consistent font but it's an input
                    style={{ border: 'none', background: 'transparent', width: '100%', outline: 'none', padding: 0 }}
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
                <div style={{
                    position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 1100,
                    background: 'white', border: '2px solid #1e293b', borderRadius: '12px',
                    marginTop: '4px', boxShadow: '0 10px 30px rgba(0,0,0,0.1)', overflow: 'hidden'
                }}>
                    {suggestions.map((s, idx) => (
                        <div 
                            key={s.code}
                            onClick={() => handleSelect(s)}
                            onMouseEnter={() => setSelectedIndex(idx)}
                            style={{
                                padding: '12px 16px', cursor: 'pointer', borderBottom: '1px solid #f1f5f9',
                                background: idx === selectedIndex ? '#f8fafc' : 'transparent',
                                display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                            }}
                        >
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                <span style={{ fontWeight: 800, color: '#1e293b', fontSize: '14px' }}>{s.city}</span>
                                <span style={{ fontSize: '12px', color: '#64748b' }}>{s.name}</span>
                            </div>
                            <span style={{ fontWeight: 900, color: '#1e293b', background: '#f1f5f9', padding: '4px 8px', borderRadius: '6px', fontSize: '12px' }}>{s.code}</span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default AirportAutocomplete;
