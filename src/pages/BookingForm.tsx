import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
    ArrowLeft,
    Users,
    Calendar,
    ShieldCheck,
    Hotel,
    UserPlus,
    Trash2,
    CheckCircle2,
    AlertCircle,
    Loader2
} from 'lucide-react';
import type { Guest, BookingSubmission } from '../types/booking.types';
import { documentService } from '../services/documentService';
import './BookingForm.css';

const BookingForm: React.FC = () => {
    const { source, hotelCode } = useParams<{ source: string, hotelCode: string }>();
    const navigate = useNavigate();
    const location = useLocation();

    // Data passed from detail page
    const bookingContext = location.state?.bookingContext || null;

    const [guests, setGuests] = useState<Guest[]>([]);
    const [contactInfo, setContactInfo] = useState({
        firstName: '',
        lastName: '',
        email: '',
        phone: ''
    });
    const [specialRequests, setSpecialRequests] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [step, setStep] = useState(1); // 1: Guests, 2: Payment/Review, 3: Success
    const [lastBookingId, setLastBookingId] = useState<string>('');

    useEffect(() => {
        if (!bookingContext) {
            // If no context, we can't really book anything specific
            // For now, let's just use some defaults for testing if needed
        } else {
            // Pre-fill guests based on count
            const initialGuests: Guest[] = [];
            for (let i = 0; i < (bookingContext.adults || 2); i++) {
                initialGuests.push({
                    title: 'Mr',
                    firstName: '',
                    lastName: '',
                    nationality: 'RS',
                    isMainGuest: i === 0
                });
            }
            setGuests(initialGuests);
        }
    }, [bookingContext]);

    const handleGuestChange = (index: number, field: keyof Guest, value: string) => {
        const newGuests = [...guests];
        (newGuests[index] as any)[field] = value;

        // If it's the main guest, also update contact info
        if (index === 0) {
            if (field === 'firstName') setContactInfo(prev => ({ ...prev, firstName: value }));
            if (field === 'lastName') setContactInfo(prev => ({ ...prev, lastName: value }));
        }

        setGuests(newGuests);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        // Simulate API call
        setTimeout(() => {
            const bookingId = `OH-${Math.floor(Math.random() * 90000) + 10000}`;
            setLastBookingId(bookingId);
            setIsSubmitting(false);
            setStep(3);
        }, 2000);
    };

    const handleDownloadVoucher = () => {
        if (!bookingContext || !lastBookingId) return;

        const bookingData: BookingSubmission & { bookingId: string } = {
            source: source as 'TCT' | 'OpenGreece',
            hotelCode: hotelCode || '',
            hotelName: bookingContext.hotelName,
            checkIn: bookingContext.checkIn,
            checkOut: bookingContext.checkOut,
            rooms: [
                {
                    roomTypeCode: 'TBD',
                    roomName: bookingContext.roomName,
                    guests: guests,
                    price: bookingContext.price
                }
            ],
            totalPrice: {
                amount: bookingContext.price,
                currency: bookingContext.currency
            },
            contactInfo: contactInfo,
            specialRequests: specialRequests,
            status: 'CONFIRMED',
            bookingId: lastBookingId
        };

        documentService.generateVoucherPDF(bookingData);
    };

    const handleDownloadHTML = () => {
        if (!bookingContext || !lastBookingId) return;

        const bookingData: BookingSubmission & { bookingId: string } = {
            source: source as 'TCT' | 'OpenGreece',
            hotelCode: hotelCode || '',
            hotelName: bookingContext.hotelName,
            checkIn: bookingContext.checkIn,
            checkOut: bookingContext.checkOut,
            rooms: [
                {
                    roomTypeCode: 'TBD',
                    roomName: bookingContext.roomName,
                    guests: guests,
                    price: bookingContext.price
                }
            ],
            totalPrice: {
                amount: bookingContext.price,
                currency: bookingContext.currency
            },
            contactInfo: contactInfo,
            specialRequests: specialRequests,
            status: 'CONFIRMED',
            bookingId: lastBookingId
        };

        documentService.generateVoucherHTML(bookingData);
    };

    if (!bookingContext) {
        return (
            <div className="booking-error-state">
                <AlertCircle size={48} />
                <h2>Nedostaju podaci o ponudi</h2>
                <p>Molimo vas da prvo izaberete hotel i termin pretrage.</p>
                <button onClick={() => navigate('/hub')} className="btn-primary">Povratak na Hub</button>
            </div>
        );
    }

    return (
        <div className="booking-flow-container fade-in">
            <div className="booking-stepper">
                <div className={`step-item ${step >= 1 ? 'active' : ''}`}>1. Podaci o putnicima</div>
                <div className={`step-line ${step >= 2 ? 'active' : ''}`}></div>
                <div className={`step-item ${step >= 2 ? 'active' : ''}`}>2. Potvrda i Plaćanje</div>
                <div className={`step-line ${step >= 3 ? 'active' : ''}`}></div>
                <div className={`step-item ${step >= 3 ? 'active' : ''}`}>3. Uspeh</div>
            </div>

            <div className="booking-layout">
                <div className="booking-main">
                    {step === 1 && (
                        <div className="booking-card">
                            <div className="card-header">
                                <Users size={24} />
                                <h3>Informacije o putnicima</h3>
                            </div>

                            <form className="guests-form">
                                {guests.map((guest, idx) => (
                                    <div key={idx} className="guest-entry-v4">
                                        <div className="guest-header">
                                            <h4>Putnik {idx + 1} {guest.isMainGuest && <span className="main-badge">Nosilac</span>}</h4>
                                        </div>
                                        <div className="guest-grid">
                                            <div className="input-group">
                                                <label>Titula</label>
                                                <select value={guest.title} onChange={e => handleGuestChange(idx, 'title', e.target.value as any)}>
                                                    <option value="Mr">G-din</option>
                                                    <option value="Mrs">G-đa</option>
                                                    <option value="Ms">G-đica</option>
                                                </select>
                                            </div>
                                            <div className="input-group">
                                                <label>Ime</label>
                                                <input
                                                    type="text"
                                                    value={guest.firstName}
                                                    onChange={e => handleGuestChange(idx, 'firstName', e.target.value)}
                                                    placeholder="Unesite ime"
                                                />
                                            </div>
                                            <div className="input-group">
                                                <label>Prezime</label>
                                                <input
                                                    type="text"
                                                    value={guest.lastName}
                                                    onChange={e => handleGuestChange(idx, 'lastName', e.target.value)}
                                                    placeholder="Unesite prezime"
                                                />
                                            </div>
                                            <div className="input-group">
                                                <label>Državljanstvo</label>
                                                <input
                                                    type="text"
                                                    value={guest.nationality}
                                                    onChange={e => handleGuestChange(idx, 'nationality', e.target.value)}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                ))}

                                <div className="contact-details-section">
                                    <h3>Kontakt podaci</h3>
                                    <div className="guest-grid">
                                        <div className="input-group">
                                            <label>Email za potvrdu</label>
                                            <input
                                                type="email"
                                                value={contactInfo.email}
                                                onChange={e => setContactInfo({ ...contactInfo, email: e.target.value })}
                                            />
                                        </div>
                                        <div className="input-group">
                                            <label>Broj telefona</label>
                                            <input
                                                type="tel"
                                                value={contactInfo.phone}
                                                onChange={e => setContactInfo({ ...contactInfo, phone: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="special-requests-section">
                                    <label>Posebne napomene (opciono)</label>
                                    <textarea
                                        value={specialRequests}
                                        onChange={e => setSpecialRequests(e.target.value)}
                                        placeholder="Npr: Bračni krevet, kasni dolazak, alergije..."
                                    />
                                </div>

                                <div className="form-actions">
                                    <button type="button" className="btn-secondary" onClick={() => navigate(-1)}>Odustani</button>
                                    <button type="button" className="btn-primary" onClick={() => setStep(2)}>Nastavi na pregled</button>
                                </div>
                            </form>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="booking-card">
                            <div className="card-header">
                                <ShieldCheck size={24} />
                                <h3>Pregled rezervacije</h3>
                            </div>

                            <div className="review-content">
                                <div className="review-section">
                                    <h4>Putnici</h4>
                                    {guests.map((g, i) => (
                                        <div key={i} className="review-item">
                                            {g.title} {g.firstName} {g.lastName} ({g.nationality})
                                        </div>
                                    ))}
                                </div>

                                <div className="review-section">
                                    <h4>Kontakt</h4>
                                    <p>{contactInfo.email} | {contactInfo.phone}</p>
                                </div>

                                <div className="security-info-banner">
                                    <ShieldCheck size={20} />
                                    <span>Rezervacija se vrši putem sigurnog provajdera: <strong>{source}</strong>. Svi podaci su enkriptovani.</span>
                                </div>

                                <div className="form-actions">
                                    <button type="button" className="btn-secondary" onClick={() => setStep(1)}>Nazad na unos</button>
                                    <button
                                        type="button"
                                        className="btn-primary finalize"
                                        onClick={handleSubmit}
                                        disabled={isSubmitting}
                                    >
                                        {isSubmitting ? <Loader2 className="spin" /> : 'Potvrdi Rezervaciju'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {step === 3 && (
                        <div className="booking-card success-card ripple-effect">
                            <div className="success-lottie-container">
                                <CheckCircle2 size={80} color="#10b981" />
                            </div>
                            <h2>Rezervacija Uspešna!</h2>
                            <p>Vaš broj rezervacije je: <strong>{lastBookingId}</strong></p>
                            <div className="success-actions">
                                <button className="btn-print" onClick={handleDownloadVoucher}>Vaučer (PDF)</button>
                                <button className="btn-print html" onClick={handleDownloadHTML}>Vaučer (HTML)</button>
                                <button className="btn-primary" onClick={() => navigate('/hub')}>Povratak na Hub</button>
                            </div>
                        </div>
                    )}
                </div>

                <div className="booking-sidebar">
                    <div className="summary-card">
                        <h3>Sumarni pregled</h3>
                        <div className="hotel-brief">
                            <div className="brief-img">
                                <img src={bookingContext.image || "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&q=80&w=300"} alt="Hotel" />
                            </div>
                            <div className="brief-txt">
                                <strong>{bookingContext.hotelName}</strong>
                                <span><Calendar size={12} /> {bookingContext.nights} noći</span>
                            </div>
                        </div>

                        <div className="summary-details">
                            <div className="summary-line">
                                <span>Tip Sobe:</span>
                                <strong>{bookingContext.roomName}</strong>
                            </div>
                            <div className="summary-line">
                                <span>Check-in:</span>
                                <strong>{new Date(bookingContext.checkIn).toLocaleDateString('sr-RS')}</strong>
                            </div>
                            <div className="summary-line">
                                <span>Odralsli:</span>
                                <strong>{bookingContext.adults}</strong>
                            </div>
                            <div className="summary-total">
                                <span>Ukupna Cena:</span>
                                <span className="total-val">{bookingContext.price} {bookingContext.currency}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BookingForm;
