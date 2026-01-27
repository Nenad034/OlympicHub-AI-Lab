import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import './CustomDatePicker.css';

interface CustomDatePickerProps {
    selectedDate: string;
    onDateSelect: (date: string) => void;
    minDate?: string;
    label?: string;
    returnDate?: string; // Optional return date for range display
}

const CustomDatePicker: React.FC<CustomDatePickerProps> = ({
    selectedDate,
    onDateSelect,
    minDate,
    label,
    returnDate
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [currentMonth, setCurrentMonth] = useState(() => {
        const date = selectedDate ? new Date(selectedDate) : new Date();
        return new Date(date.getFullYear(), date.getMonth(), 1);
    });

    const monthNames = [
        'Јануар', 'Фебруар', 'Март', 'Април', 'Мај', 'Јун',
        'Јул', 'Август', 'Септембар', 'Октобар', 'Новембар', 'Децембар'
    ];

    const dayNames = ['П', 'У', 'С', 'Ч', 'П', 'С', 'Н'];

    const getDaysInMonth = (date: Date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();
        const startingDayOfWeek = (firstDay.getDay() + 6) % 7; // Adjust so Monday is 0

        const days: (number | null)[] = [];

        // Add empty cells for days before the first day of the month
        for (let i = 0; i < startingDayOfWeek; i++) {
            days.push(null);
        }

        // Add all days of the month
        for (let i = 1; i <= daysInMonth; i++) {
            days.push(i);
        }

        return days;
    };

    const handlePrevMonth = () => {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
    };

    const handleNextMonth = () => {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
    };

    const handleDateClick = (day: number) => {
        const selected = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
        const dateString = selected.toISOString().split('T')[0];

        // Check if date is before minDate
        if (minDate && dateString < minDate) {
            return;
        }

        onDateSelect(dateString);
        setIsOpen(false);
    };

    const isDateDisabled = (day: number): boolean => {
        if (!minDate) return false;
        const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
        const dateString = date.toISOString().split('T')[0];
        return dateString < minDate;
    };

    const isDateSelected = (day: number): boolean => {
        if (!selectedDate) return false;
        const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
        const dateString = date.toISOString().split('T')[0];
        return dateString === selectedDate;
    };

    const isReturnDate = (day: number): boolean => {
        if (!returnDate) return false;
        const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
        const dateString = date.toISOString().split('T')[0];
        return dateString === returnDate;
    };

    const isInRange = (day: number): boolean => {
        if (!selectedDate || !returnDate) return false;
        const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
        const dateString = date.toISOString().split('T')[0];
        return dateString > selectedDate && dateString < returnDate;
    };

    const formatDisplayDate = (dateStr: string) => {
        if (!dateStr) return 'Изаберите датум';
        const date = new Date(dateStr);
        const day = date.getDate();
        const month = monthNames[date.getMonth()].toLowerCase();
        return `${day}. ${month}`;
    };

    const days = getDaysInMonth(currentMonth);

    return (
        <div className="custom-date-picker">
            {label && <label className="date-picker-label">{label}</label>}

            <button
                type="button"
                className="date-picker-trigger"
                onClick={() => setIsOpen(!isOpen)}
            >
                <span className="selected-date-display">
                    {formatDisplayDate(selectedDate)}
                </span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                    <line x1="16" y1="2" x2="16" y2="6"></line>
                    <line x1="8" y1="2" x2="8" y2="6"></line>
                    <line x1="3" y1="10" x2="21" y2="10"></line>
                </svg>
            </button>

            {isOpen && (
                <>
                    <div className="date-picker-overlay" onClick={() => setIsOpen(false)} />
                    <div className="date-picker-dropdown">
                        <div className="calendar-header">
                            <button
                                type="button"
                                className="month-nav-btn"
                                onClick={handlePrevMonth}
                            >
                                <ChevronLeft size={20} />
                            </button>

                            <div className="current-month-display">
                                <span className="month-name">
                                    {monthNames[currentMonth.getMonth()].toLowerCase()}
                                </span>
                            </div>

                            <button
                                type="button"
                                className="month-nav-btn"
                                onClick={handleNextMonth}
                            >
                                <ChevronRight size={20} />
                            </button>
                        </div>

                        <div className="calendar-grid">
                            {/* Day names header */}
                            {dayNames.map((day, idx) => (
                                <div key={idx} className="day-name">
                                    {day}
                                </div>
                            ))}

                            {/* Calendar days */}
                            {days.map((day, idx) => (
                                <div key={idx} className="calendar-cell">
                                    {day !== null && (
                                        <button
                                            type="button"
                                            className={`day-button 
                                                ${isDateSelected(day) ? 'selected departure' : ''} 
                                                ${isReturnDate(day) ? 'selected return' : ''}
                                                ${isInRange(day) ? 'in-range' : ''}
                                                ${isDateDisabled(day) ? 'disabled' : ''}`}
                                            onClick={() => !isDateDisabled(day) && handleDateClick(day)}
                                            disabled={isDateDisabled(day)}
                                        >
                                            {day}
                                            {isDateSelected(day) && <span className="date-label">Полазак</span>}
                                            {isReturnDate(day) && <span className="date-label">Повратак</span>}
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>

                        <div className="calendar-footer">
                            <button
                                type="button"
                                className="calendar-done-btn"
                                onClick={() => setIsOpen(false)}
                            >
                                Готово
                            </button>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default CustomDatePicker;
