import React from 'react';
import type { BookingData, GenericGuest } from '../../types/booking.types';
import { formatDateForDisplay } from '../../utils/bookingValidation';
import { currencyManager } from '../../utils/currencyManager';
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
                <div className="booking-summary-item">
                    <span className="booking-summary-label">Check-in:</span>
                    <span className="booking-summary-value">
                        {formatDateForDisplay(bookingData.checkIn)}
                    </span>
                </div>

                {/* Check-out */}
                <div className="booking-summary-item">
                    <span className="booking-summary-label">Check-out:</span>
                    <span className="booking-summary-value">
                        {formatDateForDisplay(bookingData.checkOut || '')}
                    </span>
                </div>

                {/* Duration */}
                <div className="booking-summary-item">
                    <span className="booking-summary-label">Trajanje:</span>
                    <span className="booking-summary-value">
                        {bookingData.nights} {bookingData.nights === 1 ? 'noć' : 'noći'}
                    </span>
                </div>

                {/* Room Type */}
                <div className="booking-summary-item full-width" style={{ gridColumn: '1 / -1', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '10px', marginTop: '5px' }}>
                    <span className="booking-summary-label">Smeštajne jedinice:</span>
                    <div className="booking-summary-value" style={{ marginTop: '5px' }}>
                        {bookingData.allSelectedRooms && bookingData.allSelectedRooms.length > 0 ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                {bookingData.allSelectedRooms.map((room, idx) => (
                                    <div key={idx} style={{ background: 'rgba(255,255,255,0.03)', padding: '8px 12px', borderRadius: '8px', fontSize: '0.9rem', border: '1px solid rgba(255,255,255,0.05)' }}>
                                        <span style={{ color: 'var(--accent)', fontWeight: 800, marginRight: '8px' }}>SOBA {idx + 1}:</span>
                                        <strong>{room.name}</strong>
                                        <span style={{ opacity: 0.6, marginLeft: '8px' }}>• {room.mealPlan || bookingData.mealPlan}</span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <strong>{bookingData.roomType}</strong>
                        )}
                    </div>
                </div>

                {/* Meal Plan */}
                <div className="booking-summary-item">
                    <span className="booking-summary-label">Usluga:</span>
                    <span className="booking-summary-value">{bookingData.mealPlan}</span>
                </div>

                {/* Guests */}
                <div className="booking-summary-item">
                    <span className="booking-summary-label">Broj gostiju:</span>
                    <span className="booking-summary-value">
                        {bookingData.adults} {bookingData.adults === 1 ? 'odrasli' : 'odraslih'}
                        {bookingData.children > 0 && (
                            <> + {bookingData.children} {bookingData.children === 1 ? 'dete' : 'dece'}</>
                        )}
                    </span>
                </div>

                <div className="booking-summary-item booking-summary-price" style={{
                    gridColumn: '1 / -1',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-end',
                    padding: '15px 20px',
                    background: 'rgba(255,255,255,0.03)',
                    marginTop: '10px',
                    border: '1px solid rgba(142, 36, 172, 0.2)',
                    borderRadius: '12px'
                }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                        <span className="booking-summary-value price" style={{ fontSize: '28px', color: 'white', fontWeight: 800 }}>
                            {currencyManager.formatEur(bookingData.totalPrice)}
                        </span>
                        {bookingData.currency === 'EUR' && (
                            <span style={{ color: '#94a3b8', fontSize: '14px', marginTop: '-4px', fontWeight: 600 }}>
                                ≈ {currencyManager.formatRsd(currencyManager.convertToRsd(bookingData.totalPrice))}
                            </span>
                        )}
                    </div>
                    <span className="booking-summary-label" style={{ fontSize: '11px', marginTop: '8px', opacity: 0.6, letterSpacing: '1px' }}>UKUPNA CENA ARANŽMANA</span>
                    <div style={{
                        marginTop: '12px',
                        fontSize: '12px',
                        color: '#8e24ac',
                        fontWeight: 700,
                        display: 'flex',
                        gap: '10px',
                        alignItems: 'center',
                        textTransform: 'uppercase',
                        letterSpacing: '1px',
                        background: 'rgba(142, 36, 172, 0.1)',
                        padding: '4px 10px',
                        borderRadius: '20px'
                    }}>
                        <span>{bookingData.allSelectedRooms?.length || 1} {(bookingData.allSelectedRooms?.length || 1) === 1 ? 'SOBA' : 'SOBE'}</span>
                        <span style={{ opacity: 0.3 }}>|</span>
                        <span>{bookingData.adults + bookingData.children} OSOBA</span>
                    </div>
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
