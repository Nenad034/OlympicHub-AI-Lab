import React from 'react';
import type { BookingData, GenericGuest } from '../../types/booking.types';
import { formatDateForDisplay } from '../../utils/bookingValidation';
import './BookingSummary.css';

interface BookingSummaryProps {
    bookingData: BookingData;
    guests: GenericGuest[];
    specialRequests: string;
}

export const BookingSummary: React.FC<BookingSummaryProps> = ({
    bookingData,
    guests,
    specialRequests
}) => {
    // Calculate total guests
    const totalGuests = bookingData.adults + bookingData.children;
    const filledGuests = guests.filter(g => g.firstName && g.lastName).length;

    return (
        <div className="booking-summary">
            <div className="booking-summary-header">
                <h3>📅 Detalji Rezervacije</h3>
            </div>

            <div className="booking-summary-grid">
                {/* Check-in */}
                <div className="summary-item">
                    <span className="summary-label">Check-in:</span>
                    <span className="summary-value">
                        {formatDateForDisplay(bookingData.checkIn)}
                    </span>
                </div>

                {/* Check-out */}
                <div className="summary-item">
                    <span className="summary-label">Check-out:</span>
                    <span className="summary-value">
                        {formatDateForDisplay(bookingData.checkOut)}
                    </span>
                </div>

                {/* Duration */}
                <div className="summary-item">
                    <span className="summary-label">Trajanje:</span>
                    <span className="summary-value">
                        {bookingData.nights} {bookingData.nights === 1 ? 'noć' : 'noći'}
                    </span>
                </div>

                {/* Room Type */}
                <div className="summary-item">
                    <span className="summary-label">Tip sobe:</span>
                    <span className="summary-value">{bookingData.roomType}</span>
                </div>

                {/* Guests */}
                <div className="summary-item">
                    <span className="summary-label">Broj gostiju:</span>
                    <span className="summary-value">
                        {bookingData.adults} {bookingData.adults === 1 ? 'odrasli' : 'odraslih'}
                        {bookingData.children > 0 && (
                            <> + {bookingData.children} {bookingData.children === 1 ? 'dete' : 'dece'}</>
                        )}
                    </span>
                </div>

                {/* Price */}
                <div className="summary-item summary-price">
                    <span className="summary-label">Ukupna cena:</span>
                    <span className="summary-value price">
                        {bookingData.totalPrice.toFixed(2)} {bookingData.currency}
                    </span>
                </div>
            </div>

            {/* Progress Indicator */}
            <div className="booking-progress">
                <div className="progress-bar">
                    <div
                        className="progress-fill"
                        style={{ width: `${(filledGuests / totalGuests) * 100}%` }}
                    />
                </div>
                <span className="progress-text">
                    {filledGuests} / {totalGuests} putnika popunjeno
                </span>
            </div>
        </div>
    );
};
