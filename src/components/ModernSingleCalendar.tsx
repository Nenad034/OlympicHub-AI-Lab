import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import './ModernCalendar.css';

interface ModernSingleCalendarProps {
    selectedDate: string | null; // YYYY-MM-DD
    onChange: (date: string) => void;
    onClose: () => void;
    position?: { top: number; left: number };
}

export const ModernSingleCalendar: React.FC<ModernSingleCalendarProps> = ({ selectedDate, onChange, onClose, position }) => {
    const [viewDate, setViewDate] = useState(selectedDate ? new Date(selectedDate) : new Date());

    const monthNames = ["Januar", "Februar", "Mart", "April", "Maj", "Jun", "Jul", "Avgust", "Septembar", "Oktobar", "Novembar", "Decembar"];
    const dayNames = ["PO", "UT", "SR", "ČE", "PE", "SU", "NE"];

    const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
    const getFirstDayOfMonth = (year: number, month: number) => (new Date(year, month, 1).getDay() + 6) % 7;

    const handlePrevMonth = () => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
    const handleNextMonth = () => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));

    const toLocalIso = (d: Date) => {
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const handleDayClick = (date: Date) => {
        onChange(toLocalIso(date));
        setTimeout(onClose, 150);
    };

    const renderMonthDays = (year: number, month: number) => {
        const totalDays = getDaysInMonth(year, month);
        const firstDay = getFirstDayOfMonth(year, month);

        const days = [];
        for (let i = 0; i < firstDay; i++) days.push(<div key={`empty-${i}`} className="calendar-day empty"></div>);

        for (let i = 1; i <= totalDays; i++) {
            const date = new Date(year, month, i);
            const iso = toLocalIso(date);
            const isSelected = iso === selectedDate;

            days.push(
                <div
                    key={i}
                    className={`calendar-day ${isSelected ? 'selected' : ''}`}
                    onClick={() => handleDayClick(date)}
                >
                    {i}
                </div>
            );
        }

        return (
            <div className="calendar-month-content">
                <div className="calendar-weekdays">
                    {dayNames.map(d => <div key={d}>{d}</div>)}
                </div>
                <div className="calendar-grid">
                    {days}
                    {Array.from({ length: 42 - days.length }).map((_, i) => (
                        <div key={`empty-end-${i}`} className="calendar-day empty"></div>
                    ))}
                </div>
            </div>
        );
    };

    const calendarStyle: React.CSSProperties = {
        position: position ? 'fixed' : 'absolute',
        top: position ? `${position.top}px` : '100%',
        left: position ? `${position.left}px` : 'auto',
        right: position ? 'auto' : 0,
        zIndex: 10001,
        background: 'var(--editor-bg, #0f172a)',
        border: '1px solid var(--editor-border, #334155)',
        borderRadius: '16px',
        padding: '24px',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
        backdropFilter: 'blur(16px)',
        width: '320px',
        marginTop: position ? 0 : '10px',
        color: 'white'
    };

    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();

    return (
        <div
            className="modern-single-calendar-popup"
            style={calendarStyle}
            onClick={e => e.stopPropagation()}
        >
            <div style={{ position: 'relative' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <button
                        onClick={handlePrevMonth}
                        type="button"
                        style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: 'white', cursor: 'pointer', padding: '6px', display: 'flex' }}
                    >
                        <ChevronLeft size={18} />
                    </button>
                    <div style={{ fontSize: '15px', fontWeight: 700 }}>
                        {monthNames[month]} {year}
                    </div>
                    <button
                        onClick={handleNextMonth}
                        type="button"
                        style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: 'white', cursor: 'pointer', padding: '6px', display: 'flex' }}
                    >
                        <ChevronRight size={18} />
                    </button>
                </div>
                {renderMonthDays(year, month)}
            </div>
        </div>
    );
};
