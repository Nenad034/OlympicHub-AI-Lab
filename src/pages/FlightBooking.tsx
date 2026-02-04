import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
    ArrowLeft, User, Mail, Phone, Calendar, CreditCard,
    Building, MapPin, Check, AlertCircle, Plane, Clock,
    Users, Briefcase, Info, Shield, Loader2, Link as LinkIcon, QrCode
} from 'lucide-react';
import type { UnifiedFlightOffer, PassengerDetails, FlightBookingRequest } from '../types/flight.types';
import type { FlightLeg } from '../components/flight/MultiCityFlightForm';
import { flightMockService } from '../services/flightMockService';
import { getFlightProviderManager } from '../services/providers/FlightProviderManager';
import './FlightBooking.css';

const FlightBooking: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const offer: UnifiedFlightOffer | undefined = location.state?.offer;
    const searchParams = location.state?.searchParams;
    const tripType = location.state?.tripType || 'round-trip';
    const multiCityLegs = location.state?.multiCityLegs;

    // Redirect if no offer
    useEffect(() => {
        if (!offer) {
            navigate('/flights');
        }
    }, [offer, navigate]);

    // Booking State
    const [currentStep, setCurrentStep] = useState<'passengers' | 'payment' | 'confirmation'>('passengers');
    const [isProcessing, setIsProcessing] = useState(false);
    const [bookingResult, setBookingResult] = useState<any>(null);

    // Passengers State
    const [passengers, setPassengers] = useState<PassengerDetails[]>([]);

    // Payment State
    const [paymentMethod, setPaymentMethod] = useState<'credit_card' | 'bank_transfer' | 'agent_link' | 'ips_qr'>('credit_card');
    const [cardDetails, setCardDetails] = useState({
        cardNumber: '',
        cardHolder: '',
        expiryMonth: '',
        expiryYear: '',
        cvv: ''
    });

    // Initialize passengers
    useEffect(() => {
        if (searchParams) {
            const initialPassengers: PassengerDetails[] = [];

            // Adults
            for (let i = 0; i < searchParams.adults; i++) {
                initialPassengers.push({
                    type: 'adult',
                    firstName: '',
                    lastName: '',
                    dateOfBirth: '',
                    gender: 'M',
                    email: i === 0 ? '' : undefined,
                    phone: i === 0 ? '' : undefined
                });
            }

            // Children
            for (let i = 0; i < searchParams.children; i++) {
                initialPassengers.push({
                    type: 'child',
                    firstName: '',
                    lastName: '',
                    dateOfBirth: '',
                    gender: 'M'
                });
            }

            setPassengers(initialPassengers);
        }
    }, [searchParams]);

    // Update passenger
    const updatePassenger = (index: number, field: string, value: any) => {
        setPassengers(prev => {
            const updated = [...prev];
            updated[index] = { ...updated[index], [field]: value };
            return updated;
        });
    };

    // Validate passengers
    const validatePassengers = (): boolean => {
        for (const passenger of passengers) {
            if (!passenger.firstName || !passenger.lastName || !passenger.dateOfBirth) {
                alert('Molimo popunite sve podatke o putnicima');
                return false;
            }
            if (passenger.type === 'adult' && passengers.indexOf(passenger) === 0) {
                if (!passenger.email || !passenger.phone) {
                    alert('Molimo unesite email i telefon prvog putnika');
                    return false;
                }
            }
        }
        return true;
    };

    // Validate payment
    const validatePayment = (): boolean => {
        if (paymentMethod === 'credit_card') {
            if (!cardDetails.cardNumber || !cardDetails.cardHolder ||
                !cardDetails.expiryMonth || !cardDetails.expiryYear || !cardDetails.cvv) {
                alert('Molimo popunite sve podatke o kartici');
                return false;
            }
        }
        return true;
    };

    // Handle next step
    const handleNext = () => {
        if (currentStep === 'passengers') {
            if (validatePassengers()) {
                setCurrentStep('payment');
            }
        } else if (currentStep === 'payment') {
            if (validatePayment()) {
                handleBooking();
            }
        }
    };

    // Handle booking
    const handleBooking = async () => {
        setIsProcessing(true);

        try {
            const bookingRequest: FlightBookingRequest = {
                offerId: offer!.id,
                provider: offer!.provider,
                bookingToken: offer!.bookingToken,
                passengers,
                payment: {
                    method: paymentMethod,
                    cardNumber: cardDetails.cardNumber,
                    cardHolderName: cardDetails.cardHolder,
                    expiryMonth: cardDetails.expiryMonth,
                    expiryYear: cardDetails.expiryYear,
                    cvv: cardDetails.cvv
                }
            };

            let result;
            if (offer?.provider === 'Kyte') {
                result = await getFlightProviderManager().bookFlight(bookingRequest);
            } else {
                result = await flightMockService.bookFlight(bookingRequest);
            }

            if (result.success) {
                setBookingResult(result);
                setCurrentStep('confirmation');
            } else {
                alert('Rezervacija nije uspela: ' + result.message);
            }
        } catch (error) {
            console.error('Booking error:', error);
            alert('Greška pri rezervaciji. Molimo pokušajte ponovo.');
        } finally {
            setIsProcessing(false);
        }
    };

    // Format time
    const formatTime = (isoString: string) => {
        return new Date(isoString).toLocaleTimeString('sr-RS', {
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // Format date
    const formatDate = (isoString: string) => {
        return new Date(isoString).toLocaleDateString('sr-RS', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    };

    if (!offer) return null;

    return (
        <div className="flight-booking-page">
            {/* Header */}
            <div className="booking-header">
                <div className="header-actions">
                    <button className="back-btn" onClick={() => navigate('/flights')}>
                        <ArrowLeft size={20} />
                        Nazad na pretragu
                    </button>
                    <button
                        className="edit-flights-btn"
                        onClick={() => navigate('/flights', {
                            state: {
                                searchParams,
                                tripType,
                                multiCityLegs
                            }
                        })}
                    >
                        <Calendar size={20} />
                        Izmeni letove
                    </button>
                </div>
                <h1>Rezervacija Leta</h1>
            </div>

            <div className="booking-container">
                {/* Left Column - Flight Summary */}
                <div className="flight-summary-card">
                    <h3>
                        <Plane size={20} />
                        Detalji Leta
                    </h3>

                    {/* If multi-city legs are available, display them */}
                    {tripType === 'multi-city' && multiCityLegs ? (
                        multiCityLegs.map((leg: FlightLeg, idx: number) => (
                            <div key={leg.id} className="summary-slice">
                                <div className="summary-header">
                                    <span className="summary-label">Let {idx + 1}</span>
                                    <span className="summary-date">{formatDate(leg.departureDate)}</span>
                                </div>

                                <div className="summary-route">
                                    <div className="summary-airport">
                                        <span className="summary-code">{leg.origin}</span>
                                        <span className="summary-city">{/* City name from airport code */}</span>
                                    </div>
                                    <div className="summary-arrow">→</div>
                                    <div className="summary-airport">
                                        <span className="summary-code">{leg.destination}</span>
                                        <span className="summary-city">{/* City name from airport code */}</span>
                                    </div>
                                </div>

                                <div className="summary-details">
                                    <span>Multi-city let</span>
                                </div>
                            </div>
                        ))
                    ) : (
                        /* Regular slices from API */
                        offer.slices.map((slice, idx) => {
                            // Determine label based on number of slices
                            let sliceLabel = '';
                            if (offer.slices.length === 1) {
                                sliceLabel = 'Jednosmerni let';
                            } else if (offer.slices.length === 2) {
                                sliceLabel = idx === 0 ? 'Odlazak' : 'Povratak';
                            } else {
                                // Multi-city
                                sliceLabel = `Let ${idx + 1}`;
                            }

                            return (
                                <div key={idx} className="summary-slice">
                                    <div className="summary-header">
                                        <span className="summary-label">{sliceLabel}</span>
                                        <span className="summary-date">{formatDate(slice.departure)}</span>
                                    </div>

                                    <div className="summary-route">
                                        <div className="summary-airport">
                                            <span className="summary-code">{slice.origin.iataCode}</span>
                                            <span className="summary-city">{slice.origin.city}</span>
                                            <span className="summary-time">{formatTime(slice.departure)}</span>
                                        </div>
                                        <div className="summary-arrow">→</div>
                                        <div className="summary-airport">
                                            <span className="summary-code">{slice.destination.iataCode}</span>
                                            <span className="summary-city">{slice.destination.city}</span>
                                            <span className="summary-time">{formatTime(slice.arrival)}</span>
                                        </div>
                                    </div>

                                    <div className="summary-details">
                                        <span>{slice.segments[0].carrierName}</span>
                                        <span>{slice.stops === 0 ? 'Direktan' : `${slice.stops} presedanje`}</span>
                                    </div>

                                    {/* Show all segments for this slice if there are stops */}
                                    {slice.segments.length > 1 && (
                                        <div className="segment-details">
                                            <div className="segment-header">Detalji leta:</div>
                                            {slice.segments.map((segment, segIdx) => (
                                                <div key={segIdx} className="segment-item">
                                                    <span className="segment-number">{segIdx + 1}.</span>
                                                    <span>{segment.origin.iataCode} → {segment.destination.iataCode}</span>
                                                    <span className="segment-carrier">{segment.carrierCode} {segment.flightNumber}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            );
                        })
                    )}

                    {/* Price Summary */}
                    <div className="price-summary">
                        <div className="price-row">
                            <span>Osnovna cena:</span>
                            <span>{offer.price.base.toFixed(2)} {offer.price.currency}</span>
                        </div>
                        <div className="price-row">
                            <span>Takse:</span>
                            <span>{offer.price.taxes.toFixed(2)} {offer.price.currency}</span>
                        </div>
                        <div className="price-row total">
                            <span>Ukupno:</span>
                            <span>{offer.price.total.toFixed(2)} {offer.price.currency}</span>
                        </div>
                    </div>
                </div>

                {/* Right Column - Booking Form */}
                <div className="booking-form-card">
                    {/* Progress Steps */}
                    <div className="booking-steps">
                        <div className={`step ${currentStep === 'passengers' ? 'active' : 'completed'}`}>
                            <div className="step-number">1</div>
                            <span>Putnici</span>
                        </div>
                        <div className={`step ${currentStep === 'payment' ? 'active' : currentStep === 'confirmation' ? 'completed' : ''}`}>
                            <div className="step-number">2</div>
                            <span>Plaćanje</span>
                        </div>
                        <div className={`step ${currentStep === 'confirmation' ? 'active' : ''}`}>
                            <div className="step-number">3</div>
                            <span>Potvrda</span>
                        </div>
                    </div>

                    {/* Step Content */}
                    {currentStep === 'passengers' && (
                        <div className="passengers-section">
                            <h3>
                                <Users size={20} />
                                Podaci o Putnicima
                            </h3>

                            {passengers.map((passenger, index) => (
                                <div key={index} className="passenger-form">
                                    <div className="passenger-header">
                                        <User size={16} />
                                        <span>Putnik {index + 1}</span>
                                        <span className="passenger-type">
                                            ({passenger.type === 'adult' ? 'Odrasli' : 'Dete'})
                                        </span>
                                    </div>

                                    <div className="form-grid">
                                        <div className="form-group">
                                            <label>Ime *</label>
                                            <input
                                                type="text"
                                                value={passenger.firstName}
                                                onChange={e => updatePassenger(index, 'firstName', e.target.value)}
                                                placeholder="Marko"
                                            />
                                        </div>

                                        <div className="form-group">
                                            <label>Prezime *</label>
                                            <input
                                                type="text"
                                                value={passenger.lastName}
                                                onChange={e => updatePassenger(index, 'lastName', e.target.value)}
                                                placeholder="Marković"
                                            />
                                        </div>

                                        <div className="form-group">
                                            <label>Datum rođenja *</label>
                                            <input
                                                type="date"
                                                value={passenger.dateOfBirth}
                                                onChange={e => updatePassenger(index, 'dateOfBirth', e.target.value)}
                                            />
                                        </div>

                                        <div className="form-group">
                                            <label>Pol *</label>
                                            <select
                                                value={passenger.gender}
                                                onChange={e => updatePassenger(index, 'gender', e.target.value)}
                                            >
                                                <option value="M">Muški</option>
                                                <option value="F">Ženski</option>
                                            </select>
                                        </div>

                                        {index === 0 && (
                                            <>
                                                <div className="form-group">
                                                    <label>Email *</label>
                                                    <input
                                                        type="email"
                                                        value={passenger.email || ''}
                                                        onChange={e => updatePassenger(index, 'email', e.target.value)}
                                                        placeholder="marko@example.com"
                                                    />
                                                </div>

                                                <div className="form-group">
                                                    <label>Telefon *</label>
                                                    <input
                                                        type="tel"
                                                        value={passenger.phone || ''}
                                                        onChange={e => updatePassenger(index, 'phone', e.target.value)}
                                                        placeholder="+381 60 123 4567"
                                                    />
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </div>
                            ))}

                            <div className="info-box">
                                <Info size={16} />
                                <span>Podaci moraju biti identični sa dokumentima koje ćete koristiti za putovanje.</span>
                            </div>

                            <button className="next-btn" onClick={handleNext}>
                                Nastavi na plaćanje
                                <ArrowLeft size={16} style={{ transform: 'rotate(180deg)' }} />
                            </button>
                        </div>
                    )}

                    {currentStep === 'payment' && (
                        <div className="payment-section">
                            <h3>
                                <CreditCard size={20} />
                                Način Plaćanja
                            </h3>

                            {/* Payment Method Selection */}
                            <div className="payment-methods">
                                <button
                                    className={`payment-method-btn ${paymentMethod === 'credit_card' ? 'active' : ''}`}
                                    onClick={() => setPaymentMethod('credit_card')}
                                >
                                    <CreditCard size={20} />
                                    <span>Kreditna/Debitna Kartica</span>
                                </button>
                                <button
                                    className={`payment-method-btn ${paymentMethod === 'bank_transfer' ? 'active' : ''}`}
                                    onClick={() => setPaymentMethod('bank_transfer')}
                                >
                                    <Building size={20} />
                                    <span>Bankarska Transakcija</span>
                                </button>
                                <button
                                    className={`payment-method-btn ${paymentMethod === 'agent_link' ? 'active' : ''}`}
                                    onClick={() => setPaymentMethod('agent_link')}
                                >
                                    <LinkIcon size={20} />
                                    <span>Link za Plaćanje</span>
                                </button>
                                <button
                                    className={`payment-method-btn ${paymentMethod === 'ips_qr' ? 'active' : ''}`}
                                    onClick={() => setPaymentMethod('ips_qr')}
                                >
                                    <QrCode size={20} />
                                    <span>IPS QR Kod (NBS)</span>
                                </button>
                            </div>

                            {/* Credit Card Form */}
                            {paymentMethod === 'credit_card' && (
                                <div className="card-form">
                                    <div className="form-group full-width">
                                        <label>Broj kartice *</label>
                                        <input
                                            type="text"
                                            value={cardDetails.cardNumber}
                                            onChange={e => setCardDetails(prev => ({ ...prev, cardNumber: e.target.value }))}
                                            placeholder="1234 5678 9012 3456"
                                            maxLength={19}
                                        />
                                    </div>

                                    <div className="form-group full-width">
                                        <label>Ime na kartici *</label>
                                        <input
                                            type="text"
                                            value={cardDetails.cardHolder}
                                            onChange={e => setCardDetails(prev => ({ ...prev, cardHolder: e.target.value }))}
                                            placeholder="MARKO MARKOVIC"
                                        />
                                    </div>

                                    <div className="form-row">
                                        <div className="form-group">
                                            <label>Mesec *</label>
                                            <select
                                                value={cardDetails.expiryMonth}
                                                onChange={e => setCardDetails(prev => ({ ...prev, expiryMonth: e.target.value }))}
                                            >
                                                <option value="">MM</option>
                                                {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                                                    <option key={m} value={String(m).padStart(2, '0')}>
                                                        {String(m).padStart(2, '0')}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        <div className="form-group">
                                            <label>Godina *</label>
                                            <select
                                                value={cardDetails.expiryYear}
                                                onChange={e => setCardDetails(prev => ({ ...prev, expiryYear: e.target.value }))}
                                            >
                                                <option value="">YYYY</option>
                                                {Array.from({ length: 10 }, (_, i) => new Date().getFullYear() + i).map(y => (
                                                    <option key={y} value={y}>{y}</option>
                                                ))}
                                            </select>
                                        </div>

                                        <div className="form-group">
                                            <label>CVV *</label>
                                            <input
                                                type="text"
                                                value={cardDetails.cvv}
                                                onChange={e => setCardDetails(prev => ({ ...prev, cvv: e.target.value }))}
                                                placeholder="123"
                                                maxLength={4}
                                            />
                                        </div>
                                    </div>

                                    <div className="security-badge">
                                        <Shield size={16} />
                                        <span>Vaši podaci su zaštićeni SSL enkripcijom</span>
                                    </div>
                                </div>
                            )}

                            {/* Agent Link Info */}
                            {paymentMethod === 'agent_link' && (
                                <div className="bank-transfer-info">
                                    <div className="info-box">
                                        <LinkIcon size={16} />
                                        <div>
                                            <p><strong>Link za klijenta:</strong></p>
                                            <p>Sistem će generisati siguran link koji možete poslati klijentu.</p>
                                            <p>Rezervacija će biti aktivna 30 minuta čekajući uplatu.</p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* IPS QR Info */}
                            {paymentMethod === 'ips_qr' && (
                                <div className="bank-transfer-info">
                                    <div className="info-box">
                                        <QrCode size={16} />
                                        <div>
                                            <p><strong>Brzo plaćanje (NBS):</strong></p>
                                            <p>Prikazaćemo IPS QR kod koji klijent skenira aplikacijom banke.</p>
                                            <p>Instant potvrda uplate u realnom vremenu.</p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="payment-actions">
                                <button className="back-btn-secondary" onClick={() => setCurrentStep('passengers')}>
                                    <ArrowLeft size={16} />
                                    Nazad
                                </button>
                                <button className="pay-btn" onClick={handleNext} disabled={isProcessing}>
                                    {isProcessing ? (
                                        <>
                                            <Loader2 size={16} className="spin" />
                                            Obrađujem...
                                        </>
                                    ) : (
                                        <>
                                            <CreditCard size={16} />
                                            Potvrdi i plati {offer.price.total.toFixed(2)} {offer.price.currency}
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    )}

                    {currentStep === 'confirmation' && bookingResult && (
                        <div className="confirmation-section">
                            <div className="success-icon">
                                <Check size={48} />
                            </div>

                            <h2>Rezervacija Uspešna!</h2>
                            <p>Vaša rezervacija je potvrđena. Detalji su poslati na email.</p>

                            <div className="confirmation-details">
                                <div className="detail-row">
                                    <span>Broj rezervacije:</span>
                                    <strong>{bookingResult.bookingReference}</strong>
                                </div>
                                <div className="detail-row">
                                    <span>PNR:</span>
                                    <strong>{bookingResult.pnr}</strong>
                                </div>
                                <div className="detail-row">
                                    <span>Status:</span>
                                    <span className="status-confirmed">Potvrđeno</span>
                                </div>

                                {/* Payment Link Display */}
                                {paymentMethod === 'agent_link' && (
                                    <div className="payment-link-result" style={{ marginTop: '20px', padding: '15px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', border: '1px dashed var(--accent)' }}>
                                        <p style={{ margin: '0 0 10px 0', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Link za plaćanje (pošaljite klijentu):</p>
                                        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                            <input
                                                type="text"
                                                readOnly
                                                value={`https://pay.olympichub.com/PAY-${bookingResult.bookingReference}`}
                                                style={{ flex: 1, background: 'var(--bg-dark)', border: '1px solid var(--border)', padding: '8px', borderRadius: '4px', color: 'var(--text-primary)' }}
                                            />
                                            <button
                                                onClick={() => navigator.clipboard.writeText(`https://pay.olympichub.com/PAY-${bookingResult.bookingReference}`)}
                                                className="copy-btn"
                                                style={{ background: 'var(--accent)', color: 'white', border: 'none', padding: '8px 12px', borderRadius: '4px', cursor: 'pointer' }}
                                            >
                                                Kopiraj
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {/* IPS QR Display */}
                                {paymentMethod === 'ips_qr' && (
                                    <div className="ips-qr-result" style={{ marginTop: '20px', textAlign: 'center', padding: '20px', background: 'white', borderRadius: '12px', width: 'fit-content', margin: '20px auto' }}>
                                        <QrCode size={150} color="black" />
                                        <p style={{ color: 'black', marginTop: '10px', fontWeight: 'bold' }}>Skeniraj za plaćanje</p>
                                    </div>
                                )}
                            </div>

                            <div className="confirmation-actions">
                                <button className="primary-btn" onClick={() => navigate('/flights')}>
                                    Pretraži nove letove
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default FlightBooking;
