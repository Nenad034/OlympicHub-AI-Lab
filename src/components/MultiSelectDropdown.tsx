import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

interface Option {
    value: string;
    label: string;
}

interface MultiSelectDropdownProps {
    options: Option[];
    selected: string[];
    onChange: (selected: string[]) => void;
    placeholder: string;
}

export const MultiSelectDropdown: React.FC<MultiSelectDropdownProps> = ({ options, selected, onChange, placeholder }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
                setSearchTerm('');
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        if (isOpen && searchInputRef.current) {
            searchInputRef.current.focus();
        }
    }, [isOpen]);

    const toggleOption = (value: string) => {
        if (value === 'all') {
            if (selected.includes('all')) return;
            onChange(['all']);
        } else {
            let newSelected = [...selected];
            if (newSelected.includes('all')) {
                newSelected = [];
            }

            if (newSelected.includes(value)) {
                newSelected = newSelected.filter(v => v !== value);
            } else {
                newSelected.push(value);
            }

            if (newSelected.length === 0) {
                onChange(['all']);
            } else {
                onChange(newSelected);
            }
        }
    };

    const getDisplayLabel = () => {
        if (selected.includes('all') || selected.length === 0) return placeholder;
        if (selected.length === 1) {
            const opt = options.find(o => o.value === selected[0]);
            return opt ? opt.label : placeholder;
        }
        return `${selected.length} odabrana`;
    };

    const filteredOptions = options.filter(o =>
        o.value !== 'all' && o.label.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="multi-select-container" ref={dropdownRef} style={{ position: 'relative', width: '100%' }}>
            <div
                className="multi-select-trigger"
                onClick={() => setIsOpen(!isOpen)}
                style={{
                    padding: '8px 12px',
                    borderRadius: '8px',
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border)',
                    cursor: 'pointer',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    fontSize: '13px',
                    color: selected.includes('all') ? 'var(--text-secondary)' : 'var(--text-primary)',
                    height: '42px',
                    transition: 'all 0.2s'
                }}
            >
                <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontWeight: 500 }}>
                    {getDisplayLabel()}
                </span>
                <ChevronDown size={14} style={{ opacity: 0.5, transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
            </div>

            {isOpen && (
                <div className="multi-select-dropdown" style={{
                    position: 'absolute',
                    top: 'calc(100% + 6px)',
                    left: 0,
                    right: 0,
                    background: 'var(--bg-dark)',
                    border: '1px solid var(--border)',
                    borderRadius: '12px',
                    boxShadow: '0 15px 40px rgba(0,0,0,0.5)',
                    zIndex: 200,
                    maxHeight: '350px',
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden'
                }}>
                    {/* Search Input Box */}
                    <div style={{ padding: '8px', borderBottom: '1px solid var(--border)', background: 'rgba(0,0,0,0.2)' }}>
                        <input
                            ref={searchInputRef}
                            type="text"
                            placeholder="Pretraži..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{
                                width: '100%',
                                height: '34px',
                                background: 'var(--bg-card)',
                                border: '1px solid var(--border)',
                                borderRadius: '6px',
                                padding: '0 10px',
                                fontSize: '13px',
                                color: 'var(--text-primary)',
                                outline: 'none'
                            }}
                        />
                    </div>

                    <div style={{ overflowY: 'auto', padding: '6px', flex: 1 }}>
                        {/* "Select All" / "All" Option */}
                        {!searchTerm && (
                            <div
                                className="multi-select-option"
                                onClick={() => toggleOption('all')}
                                style={{
                                    padding: '10px 12px',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '12px',
                                    borderRadius: '8px',
                                    background: selected.includes('all') ? 'var(--accent-glow)' : 'transparent',
                                    color: selected.includes('all') ? 'var(--accent)' : 'var(--text-secondary)',
                                    fontSize: '13px',
                                    marginBottom: '4px',
                                    fontWeight: selected.includes('all') ? 600 : 400
                                }}
                            >
                                <div style={{
                                    width: '18px', height: '18px', borderRadius: '4px',
                                    border: selected.includes('all') ? 'none' : '1px solid var(--border)',
                                    background: selected.includes('all') ? 'var(--accent)' : 'transparent',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    flexShrink: 0
                                }}>
                                    {selected.includes('all') && <Check size={12} color="white" />}
                                </div>
                                <span>{placeholder}</span>
                            </div>
                        )}

                        {filteredOptions.length > 0 ? (
                            filteredOptions.map(option => {
                                const isSelected = selected.includes(option.value);
                                return (
                                    <div
                                        key={option.value}
                                        className="multi-select-option"
                                        onClick={() => toggleOption(option.value)}
                                        style={{
                                            padding: '10px 12px',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '12px',
                                            borderRadius: '8px',
                                            background: isSelected ? 'var(--accent-glow)' : 'transparent',
                                            color: isSelected ? 'var(--accent)' : 'var(--text-primary)',
                                            fontSize: '13px',
                                            marginBottom: '2px',
                                            fontWeight: isSelected ? 600 : 400
                                        }}
                                    >
                                        <div style={{
                                            width: '18px', height: '18px', borderRadius: '4px',
                                            border: isSelected ? 'none' : '1px solid var(--border)',
                                            background: isSelected ? 'var(--accent)' : 'transparent',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            flexShrink: 0
                                        }}>
                                            {isSelected && <Check size={12} color="white" />}
                                        </div>
                                        <span>{option.label}</span>
                                    </div>
                                );
                            })
                        ) : searchTerm ? (
                            <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '13px', opacity: 0.6 }}>
                                Nije pronađen nijedan rezultat
                            </div>
                        ) : null}
                    </div>
                </div>
            )}
        </div>
    );
};

