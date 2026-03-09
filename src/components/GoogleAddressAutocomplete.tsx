import React, { useState, useRef, useEffect, useCallback } from 'react';
import { MapPin, Loader2 } from 'lucide-react';
import './GoogleAddressAutocomplete.css';

interface NominatimResult {
    place_id: number;
    display_name: string;
    lat: string;
    lon: string;
    address: {
        road?: string;
        house_number?: string;
        city?: string;
        town?: string;
        village?: string;
        state?: string;
        country?: string;
        postcode?: string;
    };
}

interface GoogleAddressAutocompleteProps {
    value: string;
    onChange: (address: string, placeDetails?: any) => void;
    placeholder?: string;
    className?: string;
    label?: string;
}

export const GoogleAddressAutocomplete: React.FC<GoogleAddressAutocompleteProps> = ({
    value,
    onChange,
    placeholder = 'Unesite adresu...',
    className = '',
    label
}) => {
    const [inputValue, setInputValue] = useState(value);
    const [suggestions, setSuggestions] = useState<NominatimResult[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const [noResults, setNoResults] = useState(false);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const wrapperRef = useRef<HTMLDivElement>(null);

    // Sync external value changes
    useEffect(() => {
        setInputValue(value);
    }, [value]);

    // Close dropdown on outside click
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const searchAddress = useCallback(async (query: string) => {
        if (query.length < 3) {
            setSuggestions([]);
            setIsOpen(false);
            setNoResults(false);
            return;
        }

        setIsLoading(true);
        setNoResults(false);
        try {
            // Global search — works for company names, addresses, landmarks etc.
            const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&addressdetails=1&limit=8&dedupe=1`;
            const res = await fetch(url, {
                headers: { 'Accept-Language': 'sr,hr,bs,en' }
            });
            const data: NominatimResult[] = await res.json();
            setSuggestions(data);
            setIsOpen(data.length > 0);
            setNoResults(data.length === 0);
        } catch (e) {
            console.error('Nominatim search error:', e);
            setSuggestions([]);
            setNoResults(true);
        } finally {
            setIsLoading(false);
        }
    }, []);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setInputValue(val);
        onChange(val); // update parent with raw text

        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => searchAddress(val), 450);
    };

    const handleSelect = (result: NominatimResult) => {
        const addr = result.display_name;
        setInputValue(addr);
        setIsOpen(false);
        setNoResults(false);
        setSuggestions([]);

        // Build a placeDetails-compatible object for handleAddressChange in SupplierAdmin
        const placeDetails = {
            formatted_address: addr,
            address_components: [
                { types: ['locality'], long_name: result.address.city || result.address.town || result.address.village || '' },
                { types: ['country'], long_name: result.address.country || '' },
                { types: ['postal_code'], long_name: result.address.postcode || '' },
                { types: ['route'], long_name: result.address.road || '' },
            ],
            geometry: {
                location: {
                    lat: () => parseFloat(result.lat),
                    lng: () => parseFloat(result.lon),
                }
            }
        };

        onChange(addr, placeDetails);
    };

    return (
        <div ref={wrapperRef} className="google-address-autocomplete" style={{ position: 'relative' }}>
            {label && <label>{label}</label>}
            <div className="address-input-wrapper" style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                {isLoading
                    ? <Loader2 size={16} className="address-icon" style={{ position: 'absolute', left: '16px', color: 'var(--accent)', zIndex: 5, pointerEvents: 'none', animation: 'spin 1s linear infinite' }} />
                    : <MapPin size={18} className="address-icon" style={{ position: 'absolute', left: '16px', color: 'var(--accent)', zIndex: 5, pointerEvents: 'none' }} />
                }
                <input
                    type="text"
                    value={inputValue}
                    onChange={handleInputChange}
                    placeholder={placeholder}
                    className={className}
                    autoComplete="off"
                    style={{ paddingLeft: '48px', width: '100%', height: '40px' }}
                    onFocus={() => suggestions.length > 0 && setIsOpen(true)}
                />
            </div>

            {/* "No results" hint */}
            {noResults && inputValue.length >= 3 && !isLoading && (
                <div style={{ marginTop: '4px', fontSize: '11px', color: 'var(--text-secondary)', paddingLeft: '4px' }}>
                    Nema rezultata — unesite adresu ručno u polja ispod.
                </div>
            )}

            {/* Suggestions dropdown */}
            {isOpen && suggestions.length > 0 && (
                <div style={{
                    position: 'absolute',
                    top: 'calc(100% + 4px)',
                    left: 0,
                    right: 0,
                    background: 'var(--bg-card)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '16px',
                    boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
                    zIndex: 9999,
                    overflow: 'hidden',
                    maxHeight: '300px',
                    overflowY: 'auto'
                }}>
                    {suggestions.map((result, i) => {
                        const parts = result.display_name.split(',');
                        const main = parts.slice(0, 2).join(',').trim();
                        const detail = parts.slice(2).join(',').trim();
                        return (
                            <div
                                key={result.place_id}
                                onMouseDown={() => handleSelect(result)}
                                style={{
                                    padding: '12px 16px',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'flex-start',
                                    gap: '12px',
                                    borderBottom: i < suggestions.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
                                    transition: 'background 0.15s',
                                }}
                                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}
                                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                            >
                                <MapPin size={14} style={{ color: 'var(--accent)', flexShrink: 0, marginTop: '3px' }} />
                                <div>
                                    <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-primary)', lineHeight: '1.4', fontWeight: 600 }}>
                                        {main}
                                    </p>
                                    {detail && (
                                        <p style={{ margin: '2px 0 0 0', fontSize: '11px', color: 'var(--text-secondary)' }}>
                                            {detail}
                                        </p>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                    <div style={{ padding: '8px 16px', fontSize: '10px', color: 'var(--text-secondary)', textAlign: 'right', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                        © OpenStreetMap contributors
                    </div>
                </div>
            )}
        </div>
    );
};

export default GoogleAddressAutocomplete;
