import React, { useState, useEffect, useRef } from 'react';
import { Calendar as CalendarIcon } from 'lucide-react';
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
    // Local state for formatted display strings
    const [displayStart, setDisplayStart] = useState('');
    const [displayEnd, setDisplayEnd] = useState('');

    const startPickerRef = useRef<HTMLInputElement>(null);
    const endPickerRef = useRef<HTMLInputElement>(null);

    // Format ISO (yyyy-mm-dd) to Display (dd/mm/yyyy)
    const toDisplay = (iso: string) => {
        if (!iso) return '';
        const parts = iso.split('-');
        if (parts.length !== 3) return '';
        const [y, m, d] = parts;
        return `${d}/${m}/${y}`;
    };

    // Parse Display (dd/mm/yyyy) to ISO (yyyy-mm-dd)
    const fromDisplay = (display: string) => {
        const parts = display.split('/');
        if (parts.length === 3) {
            const [d, m, y] = parts;
            // Simple validation
            if (d.length === 2 && m.length === 2 && y.length === 4) {
                return `${y}-${m}-${d}`;
            }
        }
        return '';
    };

    // Sync local state when props change
    useEffect(() => {
        setDisplayStart(toDisplay(startValue));
    }, [startValue]);

    useEffect(() => {
        setDisplayEnd(toDisplay(endValue));
    }, [endValue]);

    const handleInputChange = (val: string, type: 'start' | 'end') => {
        // Auto-format ddmmyyyy to dd/mm/yyyy
        let cleaned = val.replace(/\D/g, '');
        if (cleaned.length > 8) cleaned = cleaned.slice(0, 8);

        let formatted = cleaned;
        if (cleaned.length > 2) formatted = cleaned.slice(0, 2) + '/' + cleaned.slice(2);
        if (cleaned.length > 4) formatted = formatted.slice(0, 5) + '/' + cleaned.slice(4);

        if (type === 'start') {
            setDisplayStart(formatted);
            const iso = fromDisplay(formatted);
            if (iso || formatted === '') onChange(iso, endValue);
        } else {
            setDisplayEnd(formatted);
            const iso = fromDisplay(formatted);
            if (iso || formatted === '') onChange(startValue, iso);
        }
    };

    return (
        <div className="date-range-input-container">
            <div className="date-inputs">
                {/* START DATE */}
                <div className="input-group">
                    <span className="input-label">Od:</span>
                    <div className="input-with-icon-wrapper">
                        <input
                            type="text"
                            value={displayStart}
                            placeholder="dd/mm/yyyy"
                            onChange={(e) => handleInputChange(e.target.value, 'start')}
                            className="date-picker-text-input"
                        />
                        <button
                            className="calendar-trigger-btn"
                            onClick={() => startPickerRef.current?.showPicker()}
                            type="button"
                        >
                            <CalendarIcon size={16} />
                        </button>
                        <input
                            type="date"
                            ref={startPickerRef}
                            value={startValue}
                            onChange={(e) => onChange(e.target.value, endValue)}
                            className="hidden-date-picker"
                        />
                    </div>
                </div>

                <div className="input-divider">
                    <span>do</span>
                </div>

                {/* END DATE */}
                <div className="input-group">
                    <span className="input-label">Do:</span>
                    <div className="input-with-icon-wrapper">
                        <input
                            type="text"
                            value={displayEnd}
                            placeholder="dd/mm/yyyy"
                            onChange={(e) => handleInputChange(e.target.value, 'end')}
                            className="date-picker-text-input"
                        />
                        <button
                            className="calendar-trigger-btn"
                            onClick={() => endPickerRef.current?.showPicker()}
                            type="button"
                        >
                            <CalendarIcon size={16} />
                        </button>
                        <input
                            type="date"
                            ref={endPickerRef}
                            value={endValue}
                            onChange={(e) => onChange(startValue, e.target.value)}
                            className="hidden-date-picker"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DateRangeInput;
