import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import './ModernCalendar.css';

interface ModernCalendarProps {
    startDate: string | null;
    endDate: string | null;
    onChange: (start: string, end: string) => void;
    onClose: () => void;
}

export const ModernCalendar: React.FC<ModernCalendarProps> = ({ startDate, endDate, onChange, onClose }) => {
    const [viewDate, setViewDate] = useState(startDate ? new Date(startDate) : new Date());
    const [selStart, setSelStart] = useState<Date | null>(startDate ? new Date(startDate) : null);
    const [selEnd, setSelEnd] = useState<Date | null>(endDate ? new Date(endDate) : null);

    const monthNames = ["Januar", "Februar", "Mart", "April", "Maj", "Jun", "Jul", "Avgust", "Septembar", "Oktobar", "Novembar", "Decembar"];
    const dayNames = ["PO", "UT", "SR", "ČE", "PE", "SU", "NE"];

    const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
    const getFirstDayOfMonth = (year: number, month: number) => (new Date(year, month, 1).getDay() + 6) % 7;

    const handlePrevMonth = () => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
    const handleNextMonth = () => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));

    // Fix: Use local date components to avoid UTC offsets shifting dates
    const toLocalIso = (d: Date) => {
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const handleDayClick = (date: Date) => {
        // Normalizing date to avoid time issues
        const clicked = new Date(date.getFullYear(), date.getMonth(), date.getDate());

        if (!selStart || (selStart && selEnd)) {
            setSelStart(clicked);
            setSelEnd(null);
        } else {
            // Completing the range
            if (clicked < selStart) {
                onChange(toLocalIso(clicked), toLocalIso(selStart));
            } else {
                onChange(toLocalIso(selStart), toLocalIso(clicked));
            }
            setTimeout(onClose, 200);
        }
    };

    const renderMonth = (offset: number) => {
        const year = viewDate.getFullYear();
        const month = viewDate.getMonth() + offset;
        const currentMonthDate = new Date(year, month, 1);
        const displayYear = currentMonthDate.getFullYear();
        const displayMonth = currentMonthDate.getMonth();

        const totalDays = getDaysInMonth(displayYear, displayMonth);
        const firstDay = getFirstDayOfMonth(displayYear, displayMonth);

        const days = [];
        for (let i = 0; i < firstDay; i++) days.push(<div key={`empty-${i}`} className="calendar-day empty"></div>);

        for (let i = 1; i <= totalDays; i++) {
            const date = new Date(displayYear, displayMonth, i);
            const time = date.getTime();

            let className = "calendar-day";

            // Selection logic
            const sTime = selStart?.getTime();
            const eTime = selEnd?.getTime();

            if (sTime === time || eTime === time) className += " selected";
            if (sTime && eTime && time > sTime && time < eTime) className += " in-range";

            days.push(
                <div
                    key={i}
                    className={className}
                    onClick={() => handleDayClick(date)}
                >
                    {i}
                </div>
            );
        }

        return (
            <div className="calendar-month">
                <div className="month-header">
                    {monthNames[displayMonth]} {displayYear}
                </div>
                <div className="calendar-weekdays">
                    {dayNames.map(d => <div key={d}>{d}</div>)}
                </div>
                <div className="calendar-grid">
                    {days}
                    {/* Pad with empty cells to ensure 6 rows (42 cells) for fixed height */}
                    {Array.from({ length: 42 - days.length }).map((_, i) => (
                        <div key={`empty-end-${i}`} className="calendar-day empty"></div>
                    ))}
                </div>
            </div>
        );
    };

    return (
        <div className="modern-calendar-overlay" onClick={onClose}>
            <div className="modern-calendar-popup wide" onClick={e => e.stopPropagation()} style={{ paddingBottom: '60px', padding: '32px' }}>
                <button
                    onClick={onClose}
                    style={{ position: 'absolute', top: '10px', right: '10px', background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer', zIndex: 100 }}
                >
                    <X size={20} />
                </button>

                <button className="cal-nav prev" onClick={handlePrevMonth}><ChevronLeft size={20} /></button>
                <div className="months-container">
                    {renderMonth(0)}
                    <div className="month-divider"></div>
                    {renderMonth(1)}
                </div>
                <button className="cal-nav next" onClick={handleNextMonth}><ChevronRight size={20} /></button>

                <div style={{ position: 'absolute', bottom: '20px', left: '0', right: '0', display: 'flex', justifyContent: 'center' }}>
                    <button
                        onClick={() => { onChange('', ''); onClose(); }}
                        style={{
                            background: 'rgba(239, 68, 68, 0.1)',
                            border: '1px solid rgba(239, 68, 68, 0.3)',
                            borderRadius: '20px',
                            color: '#ef4444',
                            fontSize: '12px',
                            fontWeight: 600,
                            padding: '6px 16px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px'
                        }}
                    >
                        <X size={14} /> Poništi filter datuma
                    </button>
                </div>
            </div>
        </div>
    );
};
