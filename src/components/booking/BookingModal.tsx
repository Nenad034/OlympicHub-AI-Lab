import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { X, Calendar as CalendarIcon, Phone, Mail, User, ShieldCheck, CreditCard, Info, AlertTriangle, CheckCircle2, ChevronRight, BedDouble, Utensils, Plane, Users, Lock, Shield } from 'lucide-react';
import { toIcaoLatin } from '../../utils/textUtils';
import { GuestForm } from './GuestForm';
import { BookingSummary } from './BookingSummary';
import type { BookingData, GenericGuest, BookingState } from '../../types/booking.types';
import { validateAllGuests, hasValidationErrors } from '../../utils/bookingValidation';
import { currencyManager } from '../../utils/currencyManager';
import './BookingModal.css';
import solvexBookingService from '../../integrations/solvex/api/solvexBookingService';
import type { SolvexTourist, SolvexService } from '../../integrations/solvex/types/solvex.types';
import { generateCisCode } from '../../services/reservationService';
import { performSmartSearch } from '../../services/smartSearchService';
import type { SmartSearchResult } from '../../services/smartSearchService';
import { useThemeStore } from '../../stores';

interface BookingModalProps {
    isOpen: boolean;
    onClose: () => void;
    provider: 'solvex' | 'tct' | 'opengreece';
    bookingData: BookingData;
    onSuccess: (bookingId: string, cisCode?: string, refCode?: string, provider?: string) => void;
    onError: (error: string) => void;
}

const isAvailabilityError = (error: string): boolean => {
    const errorLower = error.toLowerCase();
    const markers = [
        'quota', 'availability', 'sold out', 'places',
        'nema slobodnih', 'nedostatak kvote', 'nema dostupnosti',
        'unavailable', 'rasprodato', 'stop sales'
    ];
    return markers.some(marker => errorLower.includes(marker));
};

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
        cancellationConfirmed: false,
        cancellationTimestamp: null as string | null,
        errorDetails: null
    });

    const [currentStep, setCurrentStep] = useState<'details' | 'confirmation' | 'fallback'>('details');
    const [localBookingData, setLocalBookingData] = useState<BookingData>(bookingData);
    const [fallbackRooms, setFallbackRooms] = useState<SmartSearchResult[]>([]);
    const [isSearchingFallback, setIsSearchingFallback] = useState(false);

    // Update local booking data if prop changes (initially)
    useEffect(() => {
        if (bookingData) {
            setLocalBookingData(bookingData);
        }
    }, [bookingData]);

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

    // Theme sync
    useEffect(() => {
        if (isOpen) {
            const currentTheme = useThemeStore.getState().theme;
            if (currentTheme === 'light') {
                document.body.classList.add('light-theme');
            } else {
                document.body.classList.remove('light-theme');
            }
        }
    }, [isOpen]);

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

    const handleFallbackSearch = async () => {
        setIsSearchingFallback(true);
        setCurrentStep('fallback');
        try {
            console.log('[BookingModal] Searching for alternatives in:', localBookingData.hotelName);
            const results = await performSmartSearch({
                searchType: 'hotel',
                destinations: [{
                    id: localBookingData.providerData?.hotel?.id || localBookingData.hotelName || '',
                    name: localBookingData.hotelName || '',
                    type: 'hotel',
                    provider: 'Solvex'
                }],
                checkIn: localBookingData.checkIn,
                checkOut: localBookingData.checkOut || '',
                roomConfig: localBookingData.roomAllocations || [{ adults: localBookingData.adults, children: localBookingData.children, childrenAges: [] }],
                enabledProviders: { solvex: true }
            });

            // Filter to ensure we only have our hotel (in case broad search was returned)
            const hotelNameNormalized = (localBookingData.hotelName || '').toLowerCase();
            const sameHotel = results.filter(r =>
                r.name.toLowerCase().includes(hotelNameNormalized) ||
                hotelNameNormalized.includes(r.name.toLowerCase())
            );

            console.log('[BookingModal] Found alternatives:', sameHotel.length);
            setFallbackRooms(sameHotel);
        } catch (err) {
            console.error('Fallback search failed:', err);
        } finally {
            setIsSearchingFallback(false);
            setState(prev => ({ ...prev, isSubmitting: false }));
        }
    };

    const handleSelectReplacementRoom = (hotelResult: SmartSearchResult, room: any) => {
        console.log('[BookingModal] Selecting replacement room:', room.name);
        setLocalBookingData(prev => ({
            ...prev,
            roomType: room.name,
            totalPrice: room.price,
            mealPlan: room.mealPlan || prev.mealPlan,
            providerData: {
                ...prev.providerData,
                room: room.originalData || room
            }
        }));
        setCurrentStep('confirmation');
        setFallbackRooms([]);
    };

    const handleSubmit = async () => {
        if (state.isSubmitting) return;

        if (currentStep === 'details') {
            const errors = validateAllGuests(state.mainGuest, state.additionalGuests, localBookingData.children);
            if (hasValidationErrors(errors)) {
                setState(prev => ({ ...prev, validationErrors: errors }));
                return;
            }

            if (!state.termsAccepted) {
                alert('Morate prihvatiti uslove rezervacije');
                return;
            }

            setCurrentStep('confirmation');
            const content = document.querySelector('.booking-modal-content');
            if (content) content.scrollTop = 0;
            return;
        }

        if (currentStep === 'confirmation' && !state.cancellationConfirmed) {
            alert('Molimo potvrdite da ste upoznati sa otkaznim troškovima.');
            return;
        }

        setState(prev => ({ ...prev, isSubmitting: true }));

        try {
            const guests = [state.mainGuest, ...state.additionalGuests];
            const cisCode = generateCisCode();

            if (provider.toLowerCase().includes('solvex')) {
                const saveResult = await solvexBookingService.directBook({
                    hotel: localBookingData.providerData.hotel,
                    room: localBookingData.providerData.room,
                    checkIn: localBookingData.checkIn,
                    checkOut: localBookingData.checkOut || '',
                    guests: guests,
                    idempotencyKey: cisCode
                });

                if (saveResult.success && saveResult.data) {
                    const payload = {
                        selectedResult: {
                            name: localBookingData.serviceName || localBookingData.hotelName || 'Usluga',
                            location: localBookingData.location,
                            source: provider.toUpperCase(),
                            price: localBookingData.totalPrice,
                            stars: localBookingData.stars,
                            mealPlan: localBookingData.mealPlan || '',
                            originalData: localBookingData.providerData
                        },
                        selectedRoom: {
                            name: localBookingData.roomType,
                            price: localBookingData.totalPrice
                        },
                        searchParams: {
                            checkIn: localBookingData.checkIn,
                            checkOut: localBookingData.checkOut || '',
                            nights: localBookingData.nights || 0,
                            adults: localBookingData.adults,
                            children: localBookingData.children
                        },
                        prefilledGuests: guests,
                        specialRequests: state.specialRequests,
                        confirmationText: 'Putnik je saglasan sa uslovima otkaza i promene aranžmana kao i sa Opštim Uslovima agencije.',
                        confirmationTimestamp: new Date().toLocaleString('sr-RS'),
                        cisCode: cisCode,
                        externalBookingId: saveResult.data.externalId.toString(),
                        externalBookingCode: saveResult.data.name,
                        cancellationConfirmed: state.cancellationConfirmed,
                        cancellationTimestamp: state.cancellationTimestamp,
                        operatorName: 'System User'
                    };

                    localStorage.setItem('pending_booking', JSON.stringify(payload));
                    await onSuccess(saveResult.data.name, '', saveResult.data.externalId.toString(), 'Solvex');
                    onClose();
                    return;
                } else {
                    const errMsg = saveResult.error || 'Neuspešan upis rezervacije';
                    if (isAvailabilityError(errMsg)) {
                        await handleFallbackSearch();
                        return;
                    }
                    throw new Error(errMsg);
                }
            } else {
                // Generic handling for other providers
                const payload = {
                    selectedResult: {
                        name: localBookingData.serviceName || localBookingData.hotelName || 'Usluga',
                        location: localBookingData.location,
                        source: provider.toUpperCase(),
                        price: localBookingData.totalPrice,
                        stars: localBookingData.stars,
                        mealPlan: localBookingData.mealPlan || '',
                        originalData: localBookingData.providerData
                    },
                    selectedRoom: {
                        name: localBookingData.roomType,
                        price: localBookingData.totalPrice
                    },
                    searchParams: {
                        checkIn: localBookingData.checkIn,
                        checkOut: localBookingData.checkOut || '',
                        nights: localBookingData.nights || 0,
                        adults: localBookingData.adults,
                        children: localBookingData.children
                    },
                    prefilledGuests: guests,
                    specialRequests: state.specialRequests,
                    confirmationText: 'Putnik je saglasan sa uslovima otkaza i promene aranžmana kao i sa Opštim Uslovima agencije.',
                    confirmationTimestamp: new Date().toLocaleString('sr-RS'),
                    cisCode: cisCode,
                    cancellationConfirmed: state.cancellationConfirmed,
                    cancellationTimestamp: state.cancellationTimestamp,
                    operatorName: 'System User'
                };

                localStorage.setItem('pending_booking', JSON.stringify(payload));
                window.open('/reservation-architect?loadFrom=pending_booking', '_blank');
                onClose();
            }
        } catch (error) {
            console.error('Booking error:', error);
            const errorMessage = error instanceof Error ? error.message : 'Nepoznata greška';

            if (isAvailabilityError(errorMessage)) {
                await handleFallbackSearch();
                return;
            }

            setState(prev => ({ ...prev, errorDetails: errorMessage }));
            onError(errorMessage);
        } finally {
            setState(prev => ({ ...prev, isSubmitting: false }));
        }
    };

    if (!isOpen) return null;

    const totalExpectedGuests = localBookingData.adults + localBookingData.children;
    const isStateReady = totalExpectedGuests <= 1 || state.additionalGuests.length === (totalExpectedGuests - 1);

    if (!isStateReady) {
        return ReactDOM.createPortal(
            <div className="booking-modal-overlay" style={{ zIndex: 20000000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ background: '#1a2b3c', padding: '40px', borderRadius: '20px', textAlign: 'center', color: 'white', border: '1px solid rgba(255,255,255,0.1)' }}>
                    <div className="animate-spin" style={{ width: '30px', height: '30px', border: '3px solid rgba(255,255,255,0.1)', borderTopColor: '#8E24AC', borderRadius: '50%', margin: '0 auto 15px' }}></div>
                    <p>Inicijalizacija putnika...</p>
                </div>
            </div>,
            document.body
        );
    }

    const displayTitle = localBookingData.serviceName || localBookingData.hotelName || 'Rezervacija';

    const modalContent = (
        <div className="booking-modal-overlay" onClick={onClose} style={{ zIndex: 20000000 }}>
            <div className="booking-modal" onClick={(e) => e.stopPropagation()} style={{ zIndex: 20000001 }}>
                <div className="booking-modal-header">
                    <div>
                        <h2>Podaci za Rezervaciju</h2>
                        <p className="hotel-name">{displayTitle}</p>
                        <p className="hotel-location">{localBookingData.location}</p>
                    </div>
                    {!state.isSubmitting && (
                        <button className="close-button" onClick={onClose}><X size={24} /></button>
                    )}
                </div>

                {state.isSubmitting && (
                    <div className="processing-overlay">
                        <div className="processing-content">
                            <div className="processing-spinner"></div>
                            <h3 className="processing-title">Procesuiramo Vašu rezervaciju</h3>
                            <p className="processing-subtitle">
                                Komuniciramo sa sistemom dobavljača <strong>{provider.toUpperCase()}</strong>.
                            </p>
                        </div>
                    </div>
                )}

                <div className="booking-stepper">
                    <div className={`step-item ${currentStep === 'details' ? 'active' : ''}`}>
                        <div className="step-number">1</div>
                        <div className="step-label">Putnici</div>
                    </div>
                    <div className="step-divider" />
                    <div className={`step-item ${currentStep === 'confirmation' ? 'active' : ''}`}>
                        <div className="step-number">2</div>
                        <div className="step-label">Potvrda</div>
                    </div>
                    {currentStep === 'fallback' && (
                        <>
                            <div className="step-divider" />
                            <div className="step-item active error">
                                <div className="step-number">!</div>
                                <div className="step-label">Alternative</div>
                            </div>
                        </>
                    )}
                </div>

                <div className="booking-modal-content">
                    {state.errorDetails && (
                        <div className="error-overlay" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 20000005, backdropFilter: 'blur(5px)' }}>
                            <div className="error-card" style={{ background: '#1e1e1e', width: '90%', maxWidth: '500px', padding: '24px', borderRadius: '16px', border: '1px solid #ef4444', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <AlertTriangle size={32} color="#ef4444" />
                                    <h3 style={{ margin: 0, color: '#ef4444' }}>Greška pri rezervaciji</h3>
                                </div>
                                <textarea readOnly value={state.errorDetails || ''} style={{ background: '#334155', color: '#f8fafc', border: '1px solid #475569', borderRadius: '8px', padding: '12px', fontFamily: 'monospace', fontSize: '12px', minHeight: '150px', width: '100%' }} />
                                <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                                    <button onClick={() => setState(prev => ({ ...prev, errorDetails: null }))} style={{ background: 'rgba(255,255,255,0.1)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer' }}>Zatvori</button>
                                </div>
                            </div>
                        </div>
                    )}

                    {currentStep === 'fallback' ? (
                        <div className="fallback-step animate-fade-in">
                            <div className="fallback-header" style={{ background: 'rgba(239, 68, 68, 0.1)', padding: '24px', borderRadius: '16px', border: '1px solid rgba(239, 68, 68, 0.2)', marginBottom: '24px', display: 'flex', gap: '20px', alignItems: 'center' }}>
                                <div style={{ width: '64px', height: '64px', background: '#ef4444', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                                    <AlertTriangle size={36} />
                                </div>
                                <div className="fallback-text">
                                    <h3 style={{ margin: '0 0 6px 0', color: '#ef4444' }}>Ova soba je rasprodata!</h3>
                                    <p style={{ margin: 0, color: '#cbd5e1', fontSize: '14px' }}>Pronašli smo sledeće alternative u istom hotelu:</p>
                                </div>
                            </div>

                            {isSearchingFallback ? (
                                <div style={{ padding: '40px', textAlign: 'center' }}>
                                    <div className="processing-spinner" style={{ margin: '0 auto 15px' }}></div>
                                    <p>Pretražujemo alternative...</p>
                                </div>
                            ) : fallbackRooms.length > 0 ? (
                                <div className="fallback-list" style={{ display: 'grid', gap: '12px' }}>
                                    {fallbackRooms.map((hotel) => (
                                        Object.entries(hotel.allocationResults || {}).map(([roomIdx, rooms]) => (
                                            (rooms as any[]).map((room, rIdx) => (
                                                <div key={`${roomIdx}-${rIdx}`} className="fallback-room-card" onClick={() => handleSelectReplacementRoom(hotel, room)} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}>
                                                    <div>
                                                        <div style={{ fontWeight: 800 }}>{room.name}</div>
                                                        <div style={{ fontSize: '12px', color: '#94a3b8' }}>{room.mealPlan || hotel.mealPlan}</div>
                                                    </div>
                                                    <div style={{ textAlign: 'right' }}>
                                                        <div style={{ fontWeight: 900, color: '#3b82f6' }}>{currencyManager.formatRsd(room.price)}</div>
                                                        <div style={{ fontSize: '11px', color: room.price > localBookingData.totalPrice ? '#ef4444' : '#10b981' }}>
                                                            {room.price > localBookingData.totalPrice ? '+' : '-'}{currencyManager.formatRsd(Math.abs(room.price - localBookingData.totalPrice))}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))
                                        ))
                                    ))}
                                </div>
                            ) : (
                                <div style={{ textAlign: 'center', padding: '20px' }}>
                                    <p>Nema drugih slobodnih soba u ovom hotelu.</p>
                                    <button className="btn-cancel" onClick={onClose}>Zatvori</button>
                                </div>
                            )}
                        </div>
                    ) : currentStep === 'details' ? (
                        <div className="booking-details-step animate-fade-in">
                            <BookingSummary bookingData={localBookingData} guests={[state.mainGuest, ...state.additionalGuests]} specialRequests={state.specialRequests} />

                            {(() => {
                                let globalIndex = 0;
                                const allocations = localBookingData.roomAllocations || [{ adults: localBookingData.adults, children: localBookingData.children }];

                                return allocations.map((room, roomIdx) => {
                                    const roomGuests = [];
                                    const adultsCount = parseInt(room.adults.toString());
                                    const childrenCount = parseInt(room.children.toString());

                                    for (let i = 0; i < adultsCount + childrenCount; i++) {
                                        const currentIndex = globalIndex;
                                        const isMain = currentIndex === 0;
                                        const isChild = i >= adultsCount;
                                        const guestData = isMain ? state.mainGuest : state.additionalGuests[currentIndex - 1];

                                        roomGuests.push(
                                            <GuestForm key={currentIndex} guestNumber={currentIndex + 1} isMainGuest={isMain} isChild={isChild} guestData={guestData} onChange={isMain ? handleMainGuestChange : (data) => handleAdditionalGuestChange(currentIndex - 1, data)} errors={state.validationErrors[currentIndex]} />
                                        );
                                        globalIndex++;
                                    }

                                    return (
                                        <div key={roomIdx} className="room-data-group" style={{ marginBottom: '30px' }}>
                                            <div className="room-separator-header" style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 16px', background: 'rgba(142, 36, 172, 0.1)', borderRadius: '10px', marginBottom: '15px', borderLeft: '4px solid #8E24AC' }}>
                                                <BedDouble size={18} color="#8E24AC" />
                                                <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'white' }}>Soba {roomIdx + 1}</h3>
                                            </div>
                                            {roomGuests}
                                        </div>
                                    );
                                });
                            })()}

                            <div className="special-requests-section">
                                <label>📝 Napomene (opciono)</label>
                                <textarea value={state.specialRequests} onChange={(e) => setState({ ...state, specialRequests: e.target.value })} placeholder="Dodatni zahtevi..." rows={3} />
                            </div>

                            <div className="terms-section">
                                <label className="terms-checkbox">
                                    <input type="checkbox" checked={state.termsAccepted} onChange={(e) => setState({ ...state, termsAccepted: e.target.checked })} />
                                    <span>Prihvatam uslove rezervacije i politiku privatnosti</span>
                                </label>
                            </div>
                        </div>
                    ) : (
                        <div className="confirmation-step animate-fade-in">
                            <div className="ferrari-confirmation-card">
                                <h3>Finalna Potvrda Rezervacije</h3>
                                <p>Saglasan sam sa uslovima otkaza i <strong>Opštim uslovima agencije Olympic Travel</strong>.</p>

                                <div className="cancellation-confirmation-box" style={{ background: 'rgba(239, 68, 68, 0.1)', padding: '16px', borderRadius: '8px', border: '1px solid #ef4444', marginTop: '20px' }}>
                                    <div style={{ display: 'flex', gap: '10px' }}>
                                        <AlertTriangle size={24} color="#ef4444" />
                                        <h4 style={{ color: '#ef4444', margin: 0 }}>UPOZORENJE O PENALIMA</h4>
                                    </div>
                                    <label className="terms-checkbox" style={{ marginTop: '16px' }}>
                                        <input type="checkbox" checked={state.cancellationConfirmed} onChange={(e) => setState({ ...state, cancellationConfirmed: e.target.checked, cancellationTimestamp: e.target.checked ? new Date().toISOString() : null })} />
                                        <span style={{ color: 'white' }}>Prihvatam rizik od otkaznih troškova.</span>
                                    </label>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="trust-badges">
                        <div className="trust-badge"><Shield size={14} /> <span>Safe Booking</span></div>
                        <div className="trust-badge"><Lock size={14} /> <span>SSL Data</span></div>
                    </div>
                </div>

                <div className="booking-modal-footer">
                    {currentStep === 'details' ? (
                        <>
                            <button className="btn-cancel" onClick={onClose}>Otkaži</button>
                            <button className="btn-submit" onClick={handleSubmit}>Nastavi na Potvrdu</button>
                        </>
                    ) : currentStep === 'confirmation' ? (
                        <>
                            <button className="btn-cancel" onClick={() => setCurrentStep('details')}>Vrati se na unos</button>
                            <button className="btn-submit btn-confirm-final" onClick={handleSubmit} disabled={state.isSubmitting}>{state.isSubmitting ? 'Procesuiram...' : 'Potvrdi'}</button>
                        </>
                    ) : (
                        <button className="btn-cancel" onClick={() => setCurrentStep('details')}>Nazad na podatke</button>
                    )}
                </div>
            </div>
        </div>
    );

    return ReactDOM.createPortal(modalContent, document.body);
};
