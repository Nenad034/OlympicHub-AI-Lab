import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Building2, Loader2 } from 'lucide-react';

interface CitySearchProps {
    value: string;
    countryCode: string | null; // ISO 2-letter code
    onChange: (city: string) => void;
    placeholder?: string;
    className?: string;
}

interface NominatimCity {
    place_id: number;
    display_name: string;
    name: string;
    address: {
        city?: string;
        town?: string;
        village?: string;
        municipality?: string;
        county?: string;
    };
}

const CitySearch: React.FC<CitySearchProps> = ({
    value,
    countryCode,
    onChange,
    placeholder = 'Unesite ili pretražite grad...',
    className = ''
}) => {
    const [inputValue, setInputValue] = useState(value);
    const [suggestions, setSuggestions] = useState<NominatimCity[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const wrapperRef = useRef<HTMLDivElement>(null);

    // Sync external value
    useEffect(() => { setInputValue(value); }, [value]);

    // Close on outside click
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const searchCities = useCallback(async (query: string) => {
        if (query.length < 2) {
            setSuggestions([]);
            setIsOpen(false);
            return;
        }

        setIsLoading(true);
        try {
            // Build URL: if we have a country code restrict to it
            const countryParam = countryCode ? `&countrycodes=${countryCode.toLowerCase()}` : '';
            const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}${countryParam}&addressdetails=1&limit=8&dedupe=1&featuretype=city`;

            const res = await fetch(url, {
                headers: { 'Accept-Language': 'sr,hr,bs,en' }
            });
            const data: NominatimCity[] = await res.json();

            // Filter to only city-type results, extract clean city names
            const cities = data.filter(d =>
                d.address.city || d.address.town || d.address.village || d.address.municipality
            );

            setSuggestions(cities);
            setIsOpen(cities.length > 0);
        } catch (e) {
            console.error('City search error:', e);
            setSuggestions([]);
        } finally {
            setIsLoading(false);
        }
    }, [countryCode]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setInputValue(val);
        onChange(val);

        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => searchCities(val), 400);
    };

    const handleSelect = (city: NominatimCity) => {
        const cityName = city.address.city || city.address.town || city.address.village || city.address.municipality || city.name;
        setInputValue(cityName);
        setIsOpen(false);
        setSuggestions([]);
        onChange(cityName);
    };

    return (
        <div ref={wrapperRef} style={{ position: 'relative', width: '100%' }}>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                {isLoading
                    ? <Loader2 size={14} style={{ position: 'absolute', left: '14px', color: 'var(--accent)', zIndex: 5, pointerEvents: 'none', animation: 'spin 1s linear infinite' }} />
                    : <Building2 size={14} style={{ position: 'absolute', left: '14px', color: 'var(--text-secondary)', zIndex: 5, pointerEvents: 'none' }} />
                }
                <input
                    type="text"
                    value={inputValue}
                    onChange={handleInputChange}
                    placeholder={!countryCode ? 'Najpre izaberite državu...' : placeholder}
                    className={className}
                    autoComplete="off"
                    disabled={false}
                    style={{ paddingLeft: '40px', width: '100%', height: '40px' }}
                    onFocus={() => suggestions.length > 0 && setIsOpen(true)}
                />
            </div>

            {isOpen && suggestions.length > 0 && (
                <div style={{
                    position: 'absolute',
                    top: 'calc(100% + 4px)',
                    left: 0,
                    right: 0,
                    background: 'var(--bg-card)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '14px',
                    boxShadow: '0 16px 48px rgba(0,0,0,0.5)',
                    zIndex: 9999,
                    overflow: 'hidden',
                    maxHeight: '240px',
                    overflowY: 'auto'
                }}>
                    {suggestions.map((city, i) => {
                        const cityName = city.address.city || city.address.town || city.address.village || city.address.municipality || city.name;
                        const region = city.address.county || city.address.municipality || '';
                        return (
                            <div
                                key={city.place_id}
                                onMouseDown={() => handleSelect(city)}
                                style={{
                                    padding: '10px 14px',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '10px',
                                    borderBottom: i < suggestions.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
                                    transition: 'background 0.15s',
                                }}
                                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}
                                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                            >
                                <Building2 size={12} style={{ color: 'var(--accent)', flexShrink: 0 }} />
                                <div>
                                    <span style={{ fontSize: '13px', color: 'var(--text-primary)', fontWeight: 600 }}>{cityName}</span>
                                    {region && cityName !== region && (
                                        <span style={{ fontSize: '11px', color: 'var(--text-secondary)', marginLeft: '6px' }}>{region}</span>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default CitySearch;
