import React, { useMemo } from 'react';
import './FlightDateCarousel.css';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface FlightDateCarouselProps {
    selectedDate: string; // ISO string 'YYYY-MM-DD'
    basePrice: number;    // Reference price to generate realistic variations
    currency: string;
    onDateSelect: (date: string) => void;
    daysRange?: number;   // Number of days before/after to show (default 3)
}

interface DatePriceItem {
    date: string;
    price: number;
    isLowest: boolean;
}

const FlightDateCarousel: React.FC<FlightDateCarouselProps> = ({
    selectedDate,
    basePrice,
    currency,
    onDateSelect,
    daysRange = 3
}) => {

    // Generate dates around selected date with simulated prices
    const dates = useMemo(() => {
        const result: DatePriceItem[] = [];
        const baseDate = new Date(selectedDate);

        // Generate range: -daysRange to +daysRange
        for (let i = -daysRange; i <= daysRange; i++) {
            const date = new Date(baseDate);
            date.setDate(baseDate.getDate() + i);

            // Skip past dates (before today)
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            if (date < today) continue;

            // Simulate price variation
            // In a real app, this would come from an API "lowest fare search"
            // Deterministic pseudo-random based on date string to keep consistent render
            const dateStr = date.toISOString().split('T')[0];
            const randomFactor = 1 + (Math.sin(date.getTime()) * 0.2); // +/- 20%
            const price = Math.round(basePrice * randomFactor);

            result.push({
                date: dateStr,
                price: price,
                isLowest: false // Will calculate below
            });
        }

        // Sort by date just in case
        result.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

        // Identify lowest price
        if (result.length > 0) {
            const minPrice = Math.min(...result.map(d => d.price));
            result.forEach(d => {
                if (d.price === minPrice) d.isLowest = true;
            });
        }

        return result;
    }, [selectedDate, basePrice, daysRange]);

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        // Force Latin Serbian locale
        return {
            day: date.toLocaleDateString('sr-Latn-RS', { weekday: 'short' }),
            full: date.toLocaleDateString('sr-Latn-RS', { day: 'numeric', month: 'short' })
        };
    };

    return (
        <div className="flight-date-carousel-container">
            {/* Header / Title if needed */}
            <div className="carousel-header" style={{ marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '0.9rem', fontWeight: 600, color: '#475569' }}>
                    📅 Fleksibilni datumi:
                </span>
                <span style={{ fontSize: '0.85rem', color: '#64748b' }}>
                    Pogledajte cene za okolne dane
                </span>
            </div>

            <div className="flight-date-carousel">
                {/* Optional: Left Nav Button could go here */}

                {dates.map((item) => {
                    const { day, full } = formatDate(item.date);
                    const isSelected = item.date === selectedDate;

                    return (
                        <div
                            key={item.date}
                            className={`date-carousel-item ${isSelected ? 'active' : ''}`}
                            onClick={() => onDateSelect(item.date)}
                        >
                            {/* Lowest Price Badge */}
                            {item.isLowest && (
                                <div className="lowest-badge">Najbolja cena</div>
                            )}

                            <span className="carousel-date-day">{day}</span>
                            <span className="carousel-date-full">{full}</span>
                            <span className={`carousel-price ${item.isLowest ? 'lowest' : ''}`}>
                                {item.price.toLocaleString('sr-Latn-RS')} {currency}
                            </span>
                        </div>
                    );
                })}

                {/* Optional: Right Nav Button could go here */}
            </div>
        </div>
    );
};

export default FlightDateCarousel;
