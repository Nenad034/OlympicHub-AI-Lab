import React, { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, X } from 'lucide-react';
import { ModernCalendar } from './ModernCalendar';
import './DateRangeInput.css';

interface DateRangeInputProps {
    label: string;
    startValue: string;
    endValue: string;
    onChange: (start: string, end: string) => void;
    placeholder?: string;
}

const DateRangeInput: React.FC<DateRangeInputProps> = ({
    startValue,
    endValue,
    onChange
}) => {
    const [displayStart, setDisplayStart] = useState('');
    const [displayEnd, setDisplayEnd] = useState('');
    const [isCalendarOpen, setIsCalendarOpen] = useState(false);

    // Format ISO (yyyy-mm-dd) to Display (dd/mm/yyyy)
    const toDisplay = (iso: string) => {
        if (!iso) return '';
        const parts = iso.split('-');
        if (parts.length !== 3) return '';
        const [y, m, d] = parts;
        return `${d}/${m}/${y}`;
    };

    useEffect(() => {
        setDisplayStart(toDisplay(startValue));
        setDisplayEnd(toDisplay(endValue));
    }, [startValue, endValue]);

    return (
        <div className="date-range-input-container">
            <div className="date-inputs">
                <div className="input-with-icon-wrapper" style={{ flex: 1, minWidth: '220px' }}>
                    <div
                        className="date-picker-text-input"
                        onClick={() => setIsCalendarOpen(true)}
                        style={{
                            cursor: 'pointer',
                            width: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '10px 16px',
                            background: 'var(--bg-card)',
                            border: '1px solid var(--border)',
                            borderRadius: '10px',
                            color: (displayStart || displayEnd) ? 'var(--text-primary)' : 'var(--text-secondary)',
                            fontSize: '13px'
                        }}
                    >
                        <span>
                            {displayStart && displayEnd
                                ? `${displayStart} - ${displayEnd}`
                                : (displayStart ? displayStart : "Izaberite period...")}
                        </span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            {(displayStart || displayEnd) && (
                                <X
                                    size={14}
                                    onClick={(e) => { e.stopPropagation(); onChange('', ''); }}
                                    style={{ color: 'var(--fil-danger)', opacity: 0.7 }}
                                />
                            )}
                            <CalendarIcon size={16} />
                        </div>
                    </div>
                </div>
            </div>

            {isCalendarOpen && (
                <ModernCalendar
                    startDate={startValue}
                    endDate={endValue}
                    onChange={(start, end) => {
                        onChange(start, end);
                    }}
                    onClose={() => setIsCalendarOpen(false)}
                    allowPast={true}
                />
            )}
        </div>
    );
};

export default DateRangeInput;
