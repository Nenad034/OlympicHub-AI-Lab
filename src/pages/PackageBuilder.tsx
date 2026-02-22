import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    MapPin, Calendar, Users, Plane, Hotel,
    Car, Ticket, Clock, Euro, ChevronRight,
    Package as PackageIcon, ArrowRight, Check,
    CreditCard, Building, Link as LinkIcon, QrCode,
    Shield, Info, AlertCircle, ChevronLeft
} from 'lucide-react';
import { packageMockService } from '../services/packageMockService';
import type { DynamicPackage } from '../types/package.types';
import { paymentService } from '../services/paymentService';
import './PackageBuilder.css';

type BuilderStep = 'overview' | 'passengers' | 'payment' | 'confirmation';

const PackageBuilder: React.FC = () => {
    const navigate = useNavigate();
    const [package_, setPackage] = useState<DynamicPackage | null>(null);
    const [selectedDay, setSelectedDay] = useState<number>(1);
    const [currentStep, setCurrentStep] = useState<BuilderStep>('overview');
    const [paymentMethod, setPaymentMethod] = useState<string>('card');

    // Passenger State (Simplified for demo)
    const [passengerData, setPassengerData] = useState<any[]>([]);

    // Load sample package on mount
    useEffect(() => {
        const samplePackage = packageMockService.generateSamplePackage();
        setPackage(samplePackage);

        // Initialize passenger data slots
        const slots = Array.from({ length: samplePackage.travelers }, (_, i) => ({
            id: i + 1,
            firstName: '',
            lastName: '',
            passport: ''
        }));
        setPassengerData(slots);
    }, []);

    if (!package_) {
        return <div className="loading">Loading package...</div>;
    }

    const currentDayItinerary = package_.itinerary.find(d => d.day === selectedDay);

    // Format time
    const formatTime = (time: string) => {
        return time.substring(0, 5); // HH:MM
    };

    // Format date
    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('sr-RS', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    };

    const handleNextStep = () => {
        if (currentStep === 'overview') setCurrentStep('passengers');
        else if (currentStep === 'passengers') setCurrentStep('payment');
        else if (currentStep === 'payment') setCurrentStep('confirmation');

        window.scrollTo(0, 0);
    };

    const handlePrevStep = () => {
        if (currentStep === 'passengers') setCurrentStep('overview');
        else if (currentStep === 'payment') setCurrentStep('passengers');

        window.scrollTo(0, 0);
    };

    return (
        <div className="package-builder-page">
            {/* Multi-step Progress Bar */}
            <div className="builder-stepper">
                <div className="stepper-content">
                    {['Overview', 'Passengers', 'Payment', 'Confirmation'].map((step, idx) => {
                        const stepKey = step.toLowerCase() as BuilderStep;
                        const isActive = currentStep === stepKey;
                        const isCompleted = ['overview', 'passengers', 'payment', 'confirmation'].indexOf(currentStep) > idx;

                        return (
                            <div key={step} className={`step-item ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''}`}>
                                <div className="step-circle">{isCompleted ? <Check size={16} /> : idx + 1}</div>
                                <span>{step}</span>
                                {idx < 3 && <div className="step-line" />}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Header (Only on Overview) */}
            {currentStep === 'overview' && (
                <div className="package-header">
                    <div className="package-header-content">
                        <div className="package-icon">
                            <PackageIcon size={40} />
                        </div>
                        <div className="package-title-section">
                            <h1>{package_.name}</h1>
                            <p>{package_.description}</p>
                            <div className="package-meta">
                                <span><Calendar size={16} /> {package_.duration} dana</span>
                                <span><Users size={16} /> {package_.travelers} putnika</span>
                                <span><MapPin size={16} /> {package_.destinations.length} destinacije</span>
                            </div>
                        </div>
                        <div className="package-price-badge">
                            <div className="price-total">{package_.pricing.total.toFixed(2)} €</div>
                            <div className="price-per-person">{package_.pricing.perPerson.toFixed(2)} € po osobi</div>
                        </div>
                    </div>
                </div>
            )}

            <div className="package-content">
                {currentStep === 'overview' && (
                    <div className="animate-fade-in">
                        {/* Destinations Overview */}
                        <div className="destinations-overview">
                            <h3>
                                <MapPin size={20} />
                                Destinacije
                            </h3>
                            <div className="destinations-flow">
                                {package_.destinations.map((dest, idx) => (
                                    <React.Fragment key={dest.id}>
                                        <div className="destination-card">
                                            <div className="dest-flag">{dest.countryCode}</div>
                                            <div className="dest-info">
                                                <h4>{dest.city}</h4>
                                                <p>{dest.nights} noći</p>
                                                <span className="dest-dates">
                                                    {formatDate(dest.arrivalDate)} - {formatDate(dest.departureDate)}
                                                </span>
                                            </div>
                                        </div>
                                        {idx < package_.destinations.length - 1 && (
                                            <ArrowRight size={24} className="dest-arrow" />
                                        )}
                                    </React.Fragment>
                                ))}
                            </div>
                        </div>

                        {/* Itinerary & Components */}
                        <div className="day-selector-section">
                            <h3><Calendar size={20} /> Itinerar</h3>
                            <div className="day-selector">
                                {package_.itinerary.map(day => (
                                    <button
                                        key={day.day}
                                        className={`day-btn ${selectedDay === day.day ? 'active' : ''}`}
                                        onClick={() => setSelectedDay(day.day)}
                                    >
                                        <span className="day-number">Dan {day.day}</span>
                                        <span className="day-date">{formatDate(day.date)}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {currentDayItinerary && (
                            <div className="day-itinerary">
                                <div className="day-header">
                                    <h2>Dan {currentDayItinerary.day} - {currentDayItinerary.dayOfWeek}</h2>
                                    <div className="day-location"><MapPin size={18} /> {currentDayItinerary.destination}</div>
                                </div>
                                <div className="activities-timeline">
                                    {currentDayItinerary.activities.map((activity, idx) => (
                                        <div key={activity.id} className="activity-card">
                                            <div className="activity-time"><Clock size={16} /> {formatTime(activity.time)}</div>
                                            <div className="activity-icon-wrapper"><span className="activity-icon">{activity.icon}</span></div>
                                            <div className="activity-content">
                                                <h4>{activity.title}</h4>
                                                <p>{activity.description}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="package-actions">
                            <button className="btn-secondary" onClick={() => navigate('/packages')}>Nazad na listu</button>
                            <button className="btn-primary" onClick={handleNextStep}>Podaci o putnicima <ChevronRight size={20} /></button>
                        </div>
                    </div>
                )}

                {currentStep === 'passengers' && (
                    <div className="animate-fade-in">
                        <div className="passengers-header">
                            <h2><Users size={24} /> Podaci o Putnicima</h2>
                            <p>Molimo unesite podatke za {package_.travelers} putnika</p>
                        </div>

                        <div className="passengers-grid">
                            {passengerData.map((p, idx) => (
                                <div key={p.id} className="passenger-input-card">
                                    <div className="p-header">Putnik {idx + 1}</div>
                                    <div className="p-form">
                                        <div className="p-field">
                                            <label>Ime</label>
                                            <input type="text" placeholder="Marko" />
                                        </div>
                                        <div className="p-field">
                                            <label>Prezime</label>
                                            <input type="text" placeholder="Marković" />
                                        </div>
                                        <div className="p-field">
                                            <label>Broj pasoša</label>
                                            <input type="text" placeholder="001234567" />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="package-actions">
                            <button className="btn-secondary" onClick={handlePrevStep}><ChevronLeft size={20} /> Nazad</button>
                            <button className="btn-primary" onClick={handleNextStep}>Izbor plaćanja <ChevronRight size={20} /></button>
                        </div>
                    </div>
                )}

                {currentStep === 'payment' && (
                    <div className="animate-fade-in">
                        <div className="payment-selection-header">
                            <h2><CreditCard size={24} /> Način Plaćanja</h2>
                            <p>Izaberite jedan od podržanih načina plaćanja za vaš paket</p>
                        </div>

                        <div className="payment-methods-grid">
                            <div className={`payment-card ${paymentMethod === 'card' ? 'active' : ''}`} onClick={() => setPaymentMethod('card')}>
                                <div className="card-icon card-blue"><CreditCard size={24} /></div>
                                <div className="card-info">
                                    <h4>Platna Kartica</h4>
                                    <p>Online plaćanje (Visa, MasterCard, Dina)</p>
                                </div>
                                <div className="card-check"><Check size={16} /></div>
                            </div>

                            <div className={`payment-card ${paymentMethod === 'bank' ? 'active' : ''}`} onClick={() => setPaymentMethod('bank')}>
                                <div className="card-icon card-purple"><Building size={24} /></div>
                                <div className="card-info">
                                    <h4>Profitna / Virman</h4>
                                    <p>Uplata na račun (e-banking ili pošta)</p>
                                </div>
                                <div className="card-check"><Check size={16} /></div>
                            </div>

                            <div className={`payment-card ${paymentMethod === 'link' ? 'active' : ''}`} onClick={() => setPaymentMethod('link')}>
                                <div className="card-icon card-green"><LinkIcon size={24} /></div>
                                <div className="card-info">
                                    <h4>Link za Plaćanje</h4>
                                    <p>Pošaljite siguran link klijentu na email/SMS</p>
                                </div>
                                <div className="card-check"><Check size={16} /></div>
                            </div>

                            <div className={`payment-card ${paymentMethod === 'qr' ? 'active' : ''}`} onClick={() => setPaymentMethod('qr')}>
                                <div className="card-icon card-red"><QrCode size={24} /></div>
                                <div className="card-info">
                                    <h4>IPS QR Kod</h4>
                                    <p>Skeniraj i plati aplikacijom banke (NBS)</p>
                                </div>
                                <div className="card-check"><Check size={16} /></div>
                            </div>
                        </div>

                        <div className="payment-details-footer">
                            <div className="summary-mini">
                                <span>Ukupan iznos:</span>
                                <strong>{package_.pricing.total.toFixed(2)} €</strong>
                            </div>
                            <div className="security-note">
                                <Shield size={16} />
                                <span>Sva plaćanja su kriptovana i procesuiraju se preko sigurnih gateway-a.</span>
                            </div>
                        </div>

                        <div className="package-actions">
                            <button className="btn-secondary" onClick={handlePrevStep}><ChevronLeft size={20} /> Nazad</button>
                            <button className="btn-primary btn-confirm" onClick={handleNextStep}><Check size={20} /> Potvrdi i Plati</button>
                        </div>
                    </div>
                )}

                {currentStep === 'confirmation' && (
                    <div className="animate-fade-in confirmation-view">
                        <div className="success-lottie-placeholder">
                            <div className="success-circle"><Check size={48} /></div>
                        </div>
                        <h2>Rezervacija Uspešna!</h2>
                        <p>Vaš paket je uspešno rezervisan. Detalji su poslati na vaš email.</p>

                        <div className="confirmation-summary-card">
                            <div className="c-row"><span>Rezervacija ID:</span> <strong>#OH-{Math.floor(100000 + Math.random() * 900000)}</strong></div>
                            <div className="c-row"><span>Status:</span> <span className="status-badge-green">POTVRĐENO</span></div>
                            <div className="c-row"><span>Vreme:</span> <strong>{new Date().toLocaleString('sr-RS')}</strong></div>
                        </div>

                        <div className="package-actions">
                            <button className="btn-primary" onClick={() => navigate('/packages')}>Povratak na listu</button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PackageBuilder;
