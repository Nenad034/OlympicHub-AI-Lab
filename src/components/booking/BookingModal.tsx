import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { X, Calendar as CalendarIcon, Phone, Mail, User, ShieldCheck, CreditCard, Info, AlertTriangle, CheckCircle2, ChevronRight, BedDouble, Utensils, Plane, Users } from 'lucide-react';
import { toIcaoLatin } from '../../utils/textUtils';
import { GuestForm } from './GuestForm';
import { BookingSummary } from './BookingSummary';
import type { BookingData, GenericGuest, BookingState } from '../../types/booking.types';
import { validateAllGuests, hasValidationErrors } from '../../utils/bookingValidation';
import './BookingModal.css';
import solvexBookingService from '../../services/solvex/solvexBookingService';
import type { SolvexTourist, SolvexService } from '../../types/solvex.types';


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
            phone: '',
            gender: 'M'
        },
        additionalGuests: [],
        specialRequests: '',
        termsAccepted: false,
        isSubmitting: false,
        validationErrors: {},
        errorDetails: null
    });

    const [currentStep, setCurrentStep] = useState<'details' | 'confirmation'>('details');

    // Initialize additional guests when modal opens
    useEffect(() => {
        const title = bookingData?.serviceName || bookingData?.hotelName;
        console.log('[BookingModal] Effect triggered. isOpen:', isOpen, 'Data:', title);
        if (isOpen && bookingData) {
            console.log('[BookingModal] Initializing guests for:', title);
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
                    nationality: '',
                    gender: 'M'
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
        if (currentStep === 'details') {
            const errors = validateAllGuests(state.mainGuest, state.additionalGuests, bookingData.children);
            if (hasValidationErrors(errors)) {
                setState(prev => ({ ...prev, validationErrors: errors }));
                return;
            }

            if (!state.termsAccepted) {
                alert('Morate prihvatiti uslove rezervacije');
                return;
            }

            setCurrentStep('confirmation');
            // Scroll to top of modal content
            const content = document.querySelector('.booking-modal-content');
            if (content) content.scrollTop = 0;
            return;
        }

        setState(prev => ({ ...prev, isSubmitting: true }));

        try {
            const guests = [state.mainGuest, ...state.additionalGuests];

            // IF SOLVEX, handle direct booking
            const isSolvex = provider.toLowerCase().includes('solvex');
            console.log(`[BookingModal] Provider: ${provider}, isSolvex: ${isSolvex}`);

            if (isSolvex) {
                console.log('[BookingModal] Handling direct Solvex booking...');

                const solvexResult = bookingData.providerData;
                if (!solvexResult) throw new Error('Missing Solvex provider data');

                // 1. Map guests to SolvexTourists
                // import { toIcaoLatin } from '../../utils/textUtils'; // Removed from here

                // ... inside handle submit ...
                const solvexTourists: SolvexTourist[] = guests.map((g, i) => ({
                    id: i + 1,
                    firstNameLat: toIcaoLatin(g.firstName),
                    surNameLat: toIcaoLatin(g.lastName),
                    birthDate: `${g.dateOfBirth}T00:00:00`,
                    sex: g.gender === 'F' ? 'Female' : 'Male', // Map M/F to Solvex sex
                    ageType: i < bookingData.adults ? 'Adult' : 'Child',
                    isMain: i === 0
                }));

                // 2. Map service
                const solvexService: SolvexService = {
                    id: 0,
                    type: 'HotelService',
                    externalId: 0,
                    hotelId: solvexResult.hotel.id,
                    nMen: bookingData.adults,
                    startDate: `${bookingData.checkIn}T00:00:00`,
                    duration: bookingData.nights || 0,
                    room: {
                        roomTypeId: solvexResult.room.roomType.id,
                        roomCategoryId: solvexResult.room.roomCategory.id,
                        roomAccommodationId: solvexResult.room.roomAccommodation.id
                    },
                    pansionId: solvexResult.pansion.id
                };

                // 3. Perform Final Booking (CreateReservation)
                console.log('[BookingModal] Performing CreateReservation...');
                const saveResult = await solvexBookingService.createReservation({
                    services: [solvexService],
                    tourists: solvexTourists,
                    countryId: solvexResult.hotel.country.id,
                    cityId: solvexResult.hotel.city.id
                });

                if (saveResult.success && saveResult.data) {
                    const payload = {
                        selectedResult: {
                            name: bookingData.serviceName || bookingData.hotelName || 'Usluga',
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
                            checkOut: bookingData.checkOut || '',
                            nights: bookingData.nights || 0,
                            adults: bookingData.adults,
                            children: bookingData.children
                        },
                        prefilledGuests: guests,
                        specialRequests: state.specialRequests,
                        confirmationText: 'Putnik je saglasan sa uslovima otkaza i promene aranžmana kao i sa Opštim Uslovima agencije.',
                        confirmationTimestamp: new Date().toLocaleString('sr-RS'),
                        externalBookingId: saveResult.data.externalId.toString(),
                        externalBookingCode: saveResult.data.name
                    };

                    localStorage.setItem('pending_booking', JSON.stringify(payload));
                    console.log('[BookingModal] Saved pending_booking for Dossier:', payload);

                    await onSuccess(
                        saveResult.data.name,
                        '',
                        saveResult.data.externalId.toString(),
                        'Solvex'
                    );
                    // Close only after success callback runs
                    onClose();
                    return;
                } else {
                    throw new Error(saveResult.error || 'Neuspešan upis rezervacije u Solvex sistem. Proverite podatke putnika.');
                }
            }

            // Fallback: Default flow (save to localStorage and open Architect)
            const payload = {
                selectedResult: {
                    name: bookingData.serviceName || bookingData.hotelName || 'Usluga',
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
                    checkOut: bookingData.checkOut || '',
                    nights: bookingData.nights || 0,
                    adults: bookingData.adults,
                    children: bookingData.children
                },
                prefilledGuests: guests,
                specialRequests: state.specialRequests,
                confirmationText: 'Putnik je saglasan sa uslovima otkaza i promene aranžmana kao i sa Opštim Uslovima agencije.',
                confirmationTimestamp: new Date().toLocaleString('sr-RS')
            };

            localStorage.setItem('pending_booking', JSON.stringify(payload));
            window.open('/reservation-architect?loadFrom=pending_booking', '_blank');
            onClose();
        } catch (error) {
            console.error('Booking error:', error);
            const errorMessage = error instanceof Error ? error.message : 'Nepoznata greška';
            // Set error details for the custom error modal
            setState(prev => ({ ...prev, errorDetails: errorMessage }));
            onError(errorMessage);
        } finally {
            setState(prev => ({ ...prev, isSubmitting: false }));
        }
    };

    if (!isOpen) {
        return null;
    }

    const displayTitle = bookingData.serviceName || bookingData.hotelName || 'Rezervacija';
    console.log('[BookingModal] RENDERING MODAL UI for:', displayTitle);

    const modalContent = (
        <div className="booking-modal-overlay" onClick={onClose} style={{ zIndex: 20000000 }}>
            <div className="booking-modal" onClick={(e) => e.stopPropagation()} style={{ zIndex: 20000001 }}>
                <div className="booking-modal-header">
                    <div>
                        <h2>Podaci za Rezervaciju</h2>
                        <p className="hotel-name">{displayTitle}</p>
                        <p className="hotel-location">{bookingData.location}</p>
                    </div>
                    <button className="close-button" onClick={onClose}><X size={24} /></button>
                </div>

                <div className="booking-modal-content">
                    {/* CUSTOM ERROR MODAL OVERLAY */}
                    {state.errorDetails && (
                        <div className="error-overlay" style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '100%',
                            height: '100%',
                            background: 'rgba(0,0,0,0.85)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            zIndex: 20000005,
                            backdropFilter: 'blur(5px)'
                        }}>
                            <div className="error-card" style={{
                                background: '#1e1e1e',
                                width: '90%',
                                maxWidth: '500px',
                                padding: '24px',
                                borderRadius: '16px',
                                border: '1px solid #ef4444',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '16px',
                                boxShadow: '0 20px 50px rgba(0,0,0,0.5)'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '16px' }}>
                                    <AlertTriangle size={32} color="#ef4444" />
                                    <h3 style={{ margin: 0, color: '#ef4444', fontSize: '20px' }}>Greška pri rezervaciji</h3>
                                </div>

                                <p style={{ color: '#cbd5e1', fontSize: '14px', margin: 0 }}>
                                    Dogodila se greška prilikom komunikacije sa sistemom. Molimo Vas iskopirajte detalje greške i prosledite tehničkoj podršci.
                                </p>

                                <textarea
                                    readOnly
                                    value={state.errorDetails || ''}
                                    style={{
                                        background: '#334155',
                                        color: '#f8fafc',
                                        border: '1px solid #475569',
                                        borderRadius: '8px',
                                        padding: '12px',
                                        fontFamily: 'monospace',
                                        fontSize: '12px',
                                        minHeight: '150px',
                                        resize: 'vertical',
                                        width: '100%',
                                        boxSizing: 'border-box'
                                    }}
                                />

                                <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '8px' }}>
                                    <button
                                        onClick={() => {
                                            navigator.clipboard.writeText(state.errorDetails || '');
                                            alert('Greška kopirana u privremenu memoriju!');
                                        }}
                                        style={{
                                            background: '#3b82f6',
                                            color: '#fff',
                                            border: 'none',
                                            padding: '10px 20px',
                                            borderRadius: '8px',
                                            cursor: 'pointer',
                                            fontWeight: 600
                                        }}
                                    >
                                        Kopiraj grešku
                                    </button>
                                    <button
                                        onClick={() => setState(prev => ({ ...prev, errorDetails: null }))}
                                        style={{
                                            background: 'rgba(255,255,255,0.1)',
                                            color: '#fff',
                                            border: '1px solid rgba(255,255,255,0.2)',
                                            padding: '10px 20px',
                                            borderRadius: '8px',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        Zatvori
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {currentStep === 'details' ? (
                        <>
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
                        </>
                    ) : (
                        <div className="confirmation-step animate-fade-in">
                            <div className="ferrari-confirmation-card">
                                <div className="cf-header">
                                    <ShieldCheck size={32} className="shield-icon" />
                                    <h3>Finalna Potvrda Rezervacije</h3>
                                </div>

                                <p className="cf-main-text">
                                    Potvrđujem da želim da izvršim rezervaciju i saglasan sam sa uslovima otkaza i promene putovanja
                                    kao i <strong>Opštim uslovima agencije Olympic Travel</strong>.
                                </p>

                                <div className="cancellation-policy-box">
                                    <h4>POLITIKA OTKAZA I PROMENE:</h4>
                                    <table className="policy-table">
                                        <thead>
                                            <tr>
                                                <th>Period otkazivanja</th>
                                                <th>Trošak (od ukupne cene)</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            <tr>
                                                <td>30 ili više dana pre puta</td>
                                                <td>10%</td>
                                            </tr>
                                            <tr>
                                                <td>29 - 21 dan pre puta</td>
                                                <td>20%</td>
                                            </tr>
                                            <tr>
                                                <td>20 - 15 dana pre puta</td>
                                                <td>30%</td>
                                            </tr>
                                            <tr>
                                                <td>14 - 8 dana pre puta</td>
                                                <td>50%</td>
                                            </tr>
                                            <tr>
                                                <td>7 - 0 dana pre puta</td>
                                                <td>100%</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                    <p className="policy-note">* Promena datuma ili imena putnika se tretira kao otkaz rezervacije ukoliko je do polaska ostalo manje od 30 dana.</p>
                                </div>

                                <a href="https://www.olympictravel.rs/opsti-uslovi-putovanja" target="_blank" rel="noopener noreferrer" className="terms-link-v4">
                                    Pročitajte kompletne Opšte Uslove Putovanja →
                                </a>
                            </div>
                        </div>
                    )}
                </div>

                <div className="booking-modal-footer">
                    {currentStep === 'details' ? (
                        <>
                            <button className="btn-cancel" onClick={onClose}>Otkaži</button>
                            <button className="btn-submit" onClick={handleSubmit}>Nastavi na Potvrdu</button>
                        </>
                    ) : (
                        <>
                            <button className="btn-cancel" onClick={() => setCurrentStep('details')}>Vrati se na unos</button>
                            <button className="btn-submit btn-confirm-final" onClick={handleSubmit} disabled={state.isSubmitting}>
                                {state.isSubmitting ? 'Procesuiram...' : 'Potvrđujem Rezervaciju'}
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );

    // Render using Portal to bypass all parent z-index contexts
    return ReactDOM.createPortal(modalContent, document.body);
};
