import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { formatDate } from '../utils/dateUtils';
import { useThemeStore } from '../stores';
import './ExpediaCalendar.css';

interface ExpediaCalendarProps {
    startDate: string | null;
    endDate: string | null;
    onChange: (start: string, end: string, flexibleDays?: number) => void;
    onClose: () => void;
    initialFlexibleDays?: number;
}

export const ExpediaCalendar: React.FC<ExpediaCalendarProps> = ({ 
    startDate, 
    endDate, 
    onChange, 
    onClose,
    initialFlexibleDays = 0
}) => {
    const [viewDate, setViewDate] = useState(startDate ? new Date(startDate) : new Date());
    const [selStart, setSelStart] = useState<Date | null>(startDate ? new Date(startDate) : null);
    const [selEnd, setSelEnd] = useState<Date | null>(endDate ? new Date(endDate) : null);
    const [activeTab, setActiveTab] = useState<'exact' | 'flexible'>('exact');
    const [flexibleDays, setFlexibleDays] = useState(initialFlexibleDays);
    const { theme } = useThemeStore();

    const monthNames = ["Januar", "Februar", "Mart", "April", "Maj", "Jun", "Jul", "Avgust", "Septembar", "Oktobar", "Novembar", "Decembar"];
    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
    const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

    const handlePrevMonth = () => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
    const handleNextMonth = () => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));

    const toLocalIso = (d: Date) => {
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const handleDayClick = (date: Date) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (date < today) return;

        if (!selStart || (selStart && selEnd)) {
            setSelStart(date);
            setSelEnd(null);
        } else {
            if (date < selStart) {
                setSelEnd(selStart);
                setSelStart(date);
                onChange(toLocalIso(date), toLocalIso(selStart), flexibleDays);
            } else {
                setSelEnd(date);
                onChange(toLocalIso(selStart), toLocalIso(date), flexibleDays);
            }
        }
    };

    const flexOptions = [
        { label: 'Exact dates', value: 0 },
        { label: '± 1 day', value: 1 },
        { label: '± 2 days', value: 2 },
        { label: '± 3 days', value: 3 },
        { label: '± 7 days', value: 7 },
    ];

    const renderMonth = (offset: number) => {
        const d = new Date(viewDate.getFullYear(), viewDate.getMonth() + offset, 1);
        const year = d.getFullYear();
        const month = d.getMonth();
        const totalDays = getDaysInMonth(year, month);
        const firstDay = getFirstDayOfMonth(year, month);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const days = [];
        for (let i = 0; i < firstDay; i++) days.push(<div key={`empty-${i}`} className="exp-day empty"></div>);

        for (let i = 1; i <= totalDays; i++) {
            const date = new Date(year, month, i);
            const time = date.getTime();
            const isPast = date < today;
            const sTime = selStart?.getTime();
            const eTime = selEnd?.getTime();

            let className = "exp-day";
            if (isPast) className += " disabled";
            if (sTime === time || eTime === time) className += " selected";
            if (sTime && eTime && time > sTime && time < eTime) className += " in-range";

            // Expedia style corner rounding for ranges
            if (sTime && eTime && sTime === time) className += " range-start";
            if (sTime && eTime && eTime === time) className += " range-end";

            days.push(
                <div key={i} className={className} onClick={() => !isPast && handleDayClick(date)}>
                    {i}
                </div>
            );
        }

        return (
            <div className="exp-month">
                <div className="exp-month-title">{monthNames[month]} {year}</div>
                <div className="exp-grid-header">
                    {dayNames.map(nd => <div key={nd} className="exp-weekday">{nd}</div>)}
                </div>
                <div className="exp-days-grid">{days}</div>
            </div>
        );
    };

    return createPortal(
        <div className="expedia-calendar-overlay" onClick={onClose}>
            <div className={`v6-prime-hub ${theme === 'navy' ? 'v6-dark' : ''} expedia-calendar-popup`} onClick={e => e.stopPropagation()}>
                <button className="exp-close-x" onClick={onClose}><X size={20} /></button>
                
                <div className="exp-cal-tabs">
                    <div 
                        className={`exp-cal-tab ${activeTab === 'exact' ? 'active' : ''}`}
                        onClick={() => { setActiveTab('exact'); setFlexibleDays(0); }}
                    >
                        Calendar
                    </div>
                    <div 
                        className={`exp-cal-tab ${activeTab === 'flexible' ? 'active' : ''}`}
                        onClick={() => { setActiveTab('flexible'); if(flexibleDays === 0) setFlexibleDays(1); }}
                    >
                        Flexible dates
                    </div>
                </div>

                <div className="exp-months-wrap">
                    <button className="exp-nav-btn prev" onClick={handlePrevMonth}><ChevronLeft size={18} /></button>
                    {renderMonth(0)}
                    {renderMonth(1)}
                    <button className="exp-nav-btn next" onClick={handleNextMonth}><ChevronRight size={18} /></button>
                </div>

                <div className="exp-cal-footer">
                    <div className="exp-pills-row">
                        {flexOptions.map(opt => (
                            <button 
                                key={opt.value} 
                                className={`exp-pill ${flexibleDays === opt.value ? 'active' : ''}`}
                                onClick={() => {
                                    setFlexibleDays(opt.value);
                                    if (opt.value > 0) setActiveTab('flexible');
                                    else setActiveTab('exact');
                                    if (selStart && selEnd) {
                                        onChange(toLocalIso(selStart), toLocalIso(selEnd), opt.value);
                                    }
                                }}
                            >
                                {opt.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
};
