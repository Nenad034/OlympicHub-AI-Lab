import React, { useState, useRef, useEffect } from 'react';
import { Globe, ChevronDown, X } from 'lucide-react';
import { countries } from '../data/countries';

interface CountrySearchProps {
    value: string;       // The country name
    onChange: (countryName: string, countryCode: string | null) => void;
    placeholder?: string;
    className?: string;
}

const CountrySearch: React.FC<CountrySearchProps> = ({
    value,
    onChange,
    placeholder = '— Izaberite ili pretražite državu —',
    className = ''
}) => {
    const [query, setQuery] = useState('');
    const [isOpen, setIsOpen] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Close on outside click
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
                setIsOpen(false);
                setQuery('');
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const filtered = query.length > 0
        ? countries.filter(c => c.name.toLowerCase().includes(query.toLowerCase()))
        : countries;

    const handleSelect = (name: string, code: string) => {
        onChange(name, code);
        setIsOpen(false);
        setQuery('');
    };

    const handleClear = (e: React.MouseEvent) => {
        e.stopPropagation();
        onChange('', null);
        setQuery('');
    };

    const handleOpen = () => {
        setIsOpen(true);
        setTimeout(() => inputRef.current?.focus(), 50);
    };

    return (
        <div ref={wrapperRef} style={{ position: 'relative', width: '100%' }}>
            {/* Trigger button */}
            <div
                onClick={handleOpen}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    height: '40px',
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border)',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    padding: '0 12px',
                    gap: '8px',
                    transition: 'border-color 0.2s',
                    ...(isOpen && { borderColor: 'var(--accent)', boxShadow: '0 0 0 3px var(--accent-glow)' })
                }}
            >
                <Globe size={14} style={{ color: 'var(--accent)', flexShrink: 0 }} />
                <span style={{
                    flex: 1,
                    fontSize: '13px',
                    color: value ? 'var(--text-primary)' : 'var(--text-secondary)',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                }}>
                    {value || placeholder}
                </span>
                {value && (
                    <X
                        size={14}
                        onClick={handleClear}
                        style={{ color: 'var(--text-secondary)', cursor: 'pointer', flexShrink: 0 }}
                    />
                )}
                <ChevronDown
                    size={14}
                    style={{
                        color: 'var(--text-secondary)',
                        flexShrink: 0,
                        transform: isOpen ? 'rotate(180deg)' : 'none',
                        transition: 'transform 0.2s'
                    }}
                />
            </div>

            {/* Dropdown */}
            {isOpen && (
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
                    display: 'flex',
                    flexDirection: 'column',
                    maxHeight: '320px'
                }}>
                    {/* Search input inside dropdown */}
                    <div style={{ padding: '10px 12px', borderBottom: '1px solid rgba(255,255,255,0.07)', flexShrink: 0 }}>
                        <input
                            ref={inputRef}
                            type="text"
                            value={query}
                            onChange={e => setQuery(e.target.value)}
                            placeholder="Pretraži državu..."
                            style={{
                                width: '100%',
                                height: '34px',
                                background: 'rgba(255,255,255,0.05)',
                                border: '1px solid rgba(255,255,255,0.1)',
                                borderRadius: '8px',
                                padding: '0 10px',
                                color: 'var(--text-primary)',
                                fontSize: '13px',
                                outline: 'none',
                                boxSizing: 'border-box'
                            }}
                        />
                    </div>

                    {/* Results list */}
                    <div style={{ overflowY: 'auto', flex: 1 }}>
                        {filtered.length === 0 ? (
                            <div style={{ padding: '20px', textAlign: 'center', fontSize: '13px', color: 'var(--text-secondary)' }}>
                                Nema rezultata
                            </div>
                        ) : (
                            filtered.map((c, i) => (
                                <div
                                    key={c.code}
                                    onMouseDown={() => handleSelect(c.name, c.code)}
                                    style={{
                                        padding: '10px 14px',
                                        cursor: 'pointer',
                                        fontSize: '13px',
                                        color: c.name === value ? 'var(--accent)' : 'var(--text-primary)',
                                        fontWeight: c.name === value ? 700 : 400,
                                        background: c.name === value ? 'rgba(59,130,246,0.08)' : 'transparent',
                                        borderBottom: i < filtered.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                                        transition: 'background 0.12s',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px'
                                    }}
                                    onMouseEnter={e => { if (c.name !== value) e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
                                    onMouseLeave={e => { e.currentTarget.style.background = c.name === value ? 'rgba(59,130,246,0.08)' : 'transparent'; }}
                                >
                                    <span style={{ fontSize: '11px', color: 'var(--text-secondary)', width: '28px', flexShrink: 0, fontFamily: 'monospace' }}>{c.code}</span>
                                    {c.name}
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default CountrySearch;
