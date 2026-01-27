import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { X } from 'lucide-react';
import { GuestForm } from './GuestForm';
import { BookingSummary } from './BookingSummary';
import type { BookingData, GenericGuest, BookingState } from '../../types/booking.types';
import { validateAllGuests, hasValidationErrors } from '../../utils/bookingValidation';
import './BookingModal.css';

interface BookingModalProps {
    isOpen: boolean;
    onClose: () => void;
    provider: 'solvex' | 'tct' | 'opengreece';
    bookingData: BookingData;
    onSuccess: (bookingId: string, cisCode?: string, refCode?: string, provider?: string) => void;
    onError: (error: string) => void;
}

export const BookingModal: React.FC<BookingModalProps> = ({
    isOpen,
    onClose,
    provider,
    bookingData,
    onSuccess,
    onError
}) => {
    const navigate = useNavigate();
    const [state, setState] = useState<BookingState>({
        mainGuest: {
            firstName: '',
            lastName: '',
            dateOfBirth: '',
            passportNumber: '',
            nationality: '',
            email: '',
            phone: ''
        },
        additionalGuests: [],
        specialRequests: '',
        termsAccepted: false,
        isSubmitting: false,
        validationErrors: {}
    });

    // Initialize additional guests when modal opens
    useEffect(() => {
        if (isOpen && bookingData) {
            const adl = parseInt(bookingData.adults.toString()) || 1;
            const chd = parseInt(bookingData.children.toString()) || 0;
            const totalGuests = adl + chd;
            const additionalGuestsCount = Math.max(0, totalGuests - 1);

            const initialAdditionalGuests: GenericGuest[] = Array.from(
                { length: additionalGuestsCount },
                () => ({
                    firstName: '',
                    lastName: '',
                    dateOfBirth: '',
                    passportNumber: '',
                    nationality: ''
                })
            );

            setState(prev => ({
                ...prev,
                additionalGuests: initialAdditionalGuests,
                validationErrors: {}
            }));
        }
    }, [isOpen, bookingData?.adults, bookingData?.children]);

    const handleMainGuestChange = (data: GenericGuest) => {
        setState(prev => ({ ...prev, mainGuest: data, validationErrors: { ...prev.validationErrors, 0: {} } }));
    };

    const handleAdditionalGuestChange = (index: number, data: GenericGuest) => {
        setState(prev => {
            const newAdditionalGuests = [...prev.additionalGuests];
            newAdditionalGuests[index] = data;
            return { ...prev, additionalGuests: newAdditionalGuests, validationErrors: { ...prev.validationErrors, [index + 1]: {} } };
        });
    };

    const handleSubmit = async () => {
        const errors = validateAllGuests(state.mainGuest, state.additionalGuests, bookingData.children);
        if (hasValidationErrors(errors)) {
            setState(prev => ({ ...prev, validationErrors: errors }));
            return;
        }

        if (!state.termsAccepted) {
            alert('Morate prihvatiti uslove rezervacije');
            return;
        }

        setState(prev => ({ ...prev, isSubmitting: true }));

        try {
            const guests = [state.mainGuest, ...state.additionalGuests];

            const payload = {
                selectedResult: {
                    name: bookingData.hotelName,
                    location: bookingData.location,
                    source: provider.toUpperCase(),
                    price: bookingData.totalPrice,
                    stars: bookingData.stars,
                    mealPlan: bookingData.mealPlan || '',
                    originalData: bookingData.providerData
                },
                selectedRoom: {
                    name: bookingData.roomType,
                    price: bookingData.totalPrice
                },
                searchParams: {
                    checkIn: bookingData.checkIn,
                    checkOut: bookingData.checkOut,
                    nights: bookingData.nights,
                    adults: bookingData.adults,
                    children: bookingData.children
                },
                prefilledGuests: guests,
                specialRequests: state.specialRequests
            };

            // Save to localStorage for the new tab to pick up
            localStorage.setItem('pending_booking', JSON.stringify(payload));

            // Open in new tab
            window.open('/reservation-architect?loadFrom=pending_booking', '_blank');

            onClose();
        } catch (error) {
            console.error('Booking error:', error);
            onError(error instanceof Error ? error.message : 'Unknown error');
        } finally {
            setState(prev => ({ ...prev, isSubmitting: false }));
        }
    };

    if (!isOpen) return null;

    return (
        <div className="booking-modal-overlay" onClick={onClose}>
            <div className="booking-modal" onClick={(e) => e.stopPropagation()}>
                <div className="booking-modal-header">
                    <div>
                        <h2>Podaci za Rezervaciju</h2>
                        <p className="hotel-name">{bookingData.hotelName}</p>
                        <p className="hotel-location">{bookingData.location}</p>
                    </div>
                    <button className="close-button" onClick={onClose}><X size={24} /></button>
                </div>

                <div className="booking-modal-content">
                    <BookingSummary
                        bookingData={bookingData}
                        guests={[state.mainGuest, ...state.additionalGuests]}
                        specialRequests={state.specialRequests}
                    />

                    <GuestForm
                        guestNumber={1}
                        isMainGuest={true}
                        isChild={false}
                        guestData={state.mainGuest}
                        onChange={handleMainGuestChange}
                        errors={state.validationErrors[0]}
                    />

                    {state.additionalGuests.map((guest, index) => (
                        <GuestForm
                            key={index}
                            guestNumber={index + 2}
                            isMainGuest={false}
                            isChild={index + 2 > bookingData.adults}
                            guestData={guest}
                            onChange={(data) => handleAdditionalGuestChange(index, data)}
                            errors={state.validationErrors[index + 1]}
                        />
                    ))}

                    <div className="special-requests-section">
                        <label>📝 Napomene (opciono)</label>
                        <textarea
                            value={state.specialRequests}
                            onChange={(e) => setState({ ...state, specialRequests: e.target.value })}
                            placeholder="Dodatni zahtevi..."
                            rows={3}
                        />
                    </div>

                    <div className="terms-section">
                        <label className="terms-checkbox">
                            <input type="checkbox" checked={state.termsAccepted} onChange={(e) => setState({ ...state, termsAccepted: e.target.checked })} />
                            <span>Prihvatam uslove rezervacije i politiku privatnosti</span>
                        </label>
                    </div>
                </div>

                <div className="booking-modal-footer">
                    <button className="btn-cancel" onClick={onClose}>Otkaži</button>
                    <button className="btn-submit" onClick={handleSubmit} disabled={state.isSubmitting}>
                        {state.isSubmitting ? 'Slanje...' : 'Potvrdi i idi u Dosije'}
                    </button>
                </div>
            </div>
        </div>
    );
};
