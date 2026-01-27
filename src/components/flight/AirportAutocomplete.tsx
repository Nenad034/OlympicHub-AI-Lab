import React, { useState, useRef, useEffect } from 'react';
import { MapPin, Search, X } from 'lucide-react';
import { searchAirports, getAirportByCode, type Airport } from '../../data/airports';
import './AirportAutocomplete.css';

interface AirportAutocompleteProps {
    value: string; // IATA code
    onChange: (code: string) => void;
    label?: string;
    placeholder?: string;
}

const AirportAutocomplete: React.FC<AirportAutocompleteProps> = ({
    value,
    onChange,
    label,
    placeholder = 'Unesite grad ili aerodrom'
}) => {
    const [inputValue, setInputValue] = useState('');
    const [isOpen, setIsOpen] = useState(false);
    const [suggestions, setSuggestions] = useState<Airport[]>([]);
    const [selectedIndex, setSelectedIndex] = useState(-1);
    const wrapperRef = useRef<HTMLDivElement>(null);

    // Update input value when value prop changes
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

    // Close dropdown when clicking outside
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

        // Search airports
        const results = searchAirports(newValue);
        setSuggestions(results);
        setIsOpen(results.length > 0);
        setSelectedIndex(-1);
    };

    const handleSelect = (airport: Airport) => {
        setInputValue(`${airport.city} (${airport.code})`);
        onChange(airport.code);
        setIsOpen(false);
        setSuggestions([]);
    };

    const handleClear = () => {
        setInputValue('');
        onChange('');
        setSuggestions([]);
        setIsOpen(false);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (!isOpen) return;

        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                setSelectedIndex(prev =>
                    prev < suggestions.length - 1 ? prev + 1 : prev
                );
                break;
            case 'ArrowUp':
                e.preventDefault();
                setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
                break;
            case 'Enter':
                e.preventDefault();
                if (selectedIndex >= 0 && suggestions[selectedIndex]) {
                    handleSelect(suggestions[selectedIndex]);
                }
                break;
            case 'Escape':
                setIsOpen(false);
                break;
        }
    };

    return (
        <div className="airport-autocomplete" ref={wrapperRef}>
            {label && (
                <label className="airport-label">
                    <MapPin size={14} />
                    {label}
                </label>
            )}

            <div className="airport-input-wrapper">
                <Search size={16} className="search-icon" />
                <input
                    type="text"
                    className="airport-input"
                    value={inputValue}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                    onFocus={() => {
                        if (suggestions.length > 0) {
                            setIsOpen(true);
                        }
                    }}
                    placeholder={placeholder}
                />
                {inputValue && (
                    <button
                        type="button"
                        className="clear-btn"
                        onClick={handleClear}
                    >
                        <X size={16} />
                    </button>
                )}
            </div>

            {isOpen && suggestions.length > 0 && (
                <div className="airport-dropdown">
                    {suggestions.map((airport, index) => (
                        <div
                            key={airport.code}
                            className={`airport-option ${index === selectedIndex ? 'selected' : ''}`}
                            onClick={() => handleSelect(airport)}
                            onMouseEnter={() => setSelectedIndex(index)}
                        >
                            <div className="airport-option-main">
                                <span className="airport-city">{airport.city}</span>
                                <span className="airport-code">({airport.code})</span>
                            </div>
                            <div className="airport-option-details">
                                <span className="airport-country">{airport.country}</span>
                                <span className="airport-name">{airport.name}</span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default AirportAutocomplete;
