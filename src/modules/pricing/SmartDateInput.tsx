import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Calendar as CalendarIcon } from 'lucide-react';
import { ModernSingleCalendar } from '../../components/ModernSingleCalendar';

interface SmartDateInputProps {
    value: string; // YYYY-MM-DD
    onChange: (value: string) => void;
    label?: string;
    style?: React.CSSProperties;
}

const SmartDateInput: React.FC<SmartDateInputProps> = ({ value, onChange, label, style }) => {
    const [textValue, setTextValue] = useState('');
    const [showCalendar, setShowCalendar] = useState(false);
    const [calendarPos, setCalendarPos] = useState({ top: 0, left: 0 });
    const containerRef = useRef<HTMLDivElement>(null);
    const iconRef = useRef<HTMLButtonElement>(null);

    useEffect(() => {
        if (value && value.length === 10) {
            const [y, m, d] = value.split('-');
            setTextValue(`${d}.${m}.${y}`);
        } else if (!value) {
            setTextValue('');
        }
    }, [value]);

    const formatToDots = (raw: string) => {
        const cleaned = raw.replace(/[^0-9]/g, '');
        if (cleaned.length === 8) {
            const d = cleaned.slice(0, 2);
            const m = cleaned.slice(2, 4);
            const y = cleaned.slice(4, 8);
            return `${d}.${m}.${y}`;
        }
        return raw;
    };

    const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        const digitsOnly = val.replace(/[^0-9]/g, '').slice(0, 8);
        setTextValue(digitsOnly);

        if (digitsOnly.length === 8) {
            const d = digitsOnly.slice(0, 2);
            const m = digitsOnly.slice(2, 4);
            const y = digitsOnly.slice(4, 8);
            const iso = `${y}-${m}-${d}`;
            if (!isNaN(Date.parse(iso))) {
                onChange(iso);
            }
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            const formatted = formatToDots(textValue);
            setTextValue(formatted);
            e.currentTarget.blur();
        }
    };

    const handleBlur = () => {
        const formatted = formatToDots(textValue);
        setTextValue(formatted);
    };

    const handleFocus = () => {
        const digits = textValue.replace(/[^0-9]/g, '');
        if (digits.length === 8) {
            setTextValue(digits);
        }
    };

    const toggleCalendar = () => {
        if (!showCalendar && iconRef.current) {
            const rect = iconRef.current.getBoundingClientRect();
            // Position shifted so the right edge of calendar aligns with right edge of icon/input
            // We'll pass the position to ModernSingleCalendar which uses position: fixed
            setCalendarPos({
                top: rect.bottom + 8,
                left: rect.right - 320
            });
        }
        setShowCalendar(!showCalendar);
    };

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                // Also check if clicking inside the portal-ed calendar
                const portal = document.querySelector('.modern-single-calendar-popup');
                if (portal && portal.contains(event.target as Node)) return;
                setShowCalendar(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div
            ref={containerRef}
            className="smart-date-container"
            style={{ display: 'flex', flexDirection: 'column', gap: '4px', width: '100%', position: 'relative' }}
        >
            {label && <label style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase' }}>{label}</label>}
            <div style={{
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                width: '100%'
            }}>
                <input
                    type="text"
                    value={textValue}
                    onChange={handleTextChange}
                    onKeyDown={handleKeyDown}
                    onBlur={handleBlur}
                    onFocus={handleFocus}
                    placeholder="DDMMYYYY"
                    style={{
                        width: '100%',
                        height: '42px',
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--text-primary)',
                        textAlign: 'center',
                        fontSize: '13px',
                        fontWeight: 600,
                        outline: 'none',
                        padding: '0 40px',
                        ...style
                    }}
                />
                <button
                    ref={iconRef}
                    onClick={toggleCalendar}
                    type="button"
                    style={{
                        position: 'absolute',
                        right: '12px',
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--accent)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '4px',
                        transition: 'transform 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
                    onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                >
                    <CalendarIcon size={18} />
                </button>
            </div>

            {showCalendar && createPortal(
                <ModernSingleCalendar
                    selectedDate={value}
                    position={calendarPos}
                    onChange={(date) => {
                        onChange(date);
                        setShowCalendar(false);
                    }}
                    onClose={() => setShowCalendar(false)}
                />,
                document.body
            )}
        </div>
    );
};

export default SmartDateInput;
