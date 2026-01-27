import React, { useState } from 'react';
import {
    Plane,
    Hotel,
    Bus,
    MapPin,
    ShoppingCart,
    Check,
    X,
    ChevronRight,
    ChevronLeft,
    Package,
    Euro,
    Users,
    Calendar
} from 'lucide-react';
import './DynamicPackageBuilder.css';

type PackageStep = 'transport' | 'accommodation' | 'services';

interface TransportOption {
    id: string;
    type: 'flight' | 'bus';
    from: string;
    to: string;
    departureDate: string;
    returnDate?: string;
    price: number;
    currency: string;
    supplier: string;
    details: {
        carrier?: string;
        flightNumber?: string;
        departureTime?: string;
        arrivalTime?: string;
    };
}

interface AccommodationOption {
    id: string;
    name: string;
    location: string;
    checkIn: string;
    checkOut: string;
    roomType: string;
    boardType: string;
    price: number;
    currency: string;
    supplier: string;
    stars: number;
}

interface ServiceOption {
    id: string;
    name: string;
    type: 'excursion' | 'transfer' | 'restaurant' | 'ticket';
    date: string;
    price: number;
    currency: string;
    supplier: string;
    description: string;
}

interface PackageCart {
    transport?: TransportOption;
    accommodation?: AccommodationOption;
    services: ServiceOption[];
}

interface DynamicPackageBuilderProps {
    activeTabs: string[];
    selectedSuppliers: string[];
    onComplete: (packageData: PackageCart) => void;
    onCancel: () => void;
}

const DynamicPackageBuilder: React.FC<DynamicPackageBuilderProps> = ({
    activeTabs,
    selectedSuppliers,
    onComplete,
    onCancel
}) => {
    const [currentStep, setCurrentStep] = useState<PackageStep>('transport');
    const [cart, setCart] = useState<PackageCart>({ services: [] });
    const [passengers, setPassengers] = useState(2);

    // Mock data - ovo će biti zamenjeno sa pravim API pozivima
    const mockTransportOptions: TransportOption[] = [
        {
            id: 'flight-1',
            type: 'flight',
            from: 'Belgrade (BEG)',
            to: 'Athens (ATH)',
            departureDate: '2026-07-15',
            returnDate: '2026-07-22',
            price: 250,
            currency: 'EUR',
            supplier: 'Amadeus',
            details: {
                carrier: 'Air Serbia',
                flightNumber: 'JU500',
                departureTime: '08:00',
                arrivalTime: '10:30'
            }
        },
        {
            id: 'bus-1',
            type: 'bus',
            from: 'Belgrade',
            to: 'Athens',
            departureDate: '2026-07-15',
            returnDate: '2026-07-22',
            price: 120,
            currency: 'EUR',
            supplier: 'Ručni Unos',
            details: {
                carrier: 'Olympic Travel Bus',
                departureTime: '22:00',
                arrivalTime: '14:00+1'
            }
        }
    ];

    const mockAccommodationOptions: AccommodationOption[] = [
        {
            id: 'hotel-1',
            name: 'Athens Luxury Resort',
            location: 'Athens, Greece',
            checkIn: '2026-07-15',
            checkOut: '2026-07-22',
            roomType: 'Double Room',
            boardType: 'All Inclusive',
            price: 840,
            currency: 'EUR',
            supplier: 'TCT',
            stars: 5
        },
        {
            id: 'hotel-2',
            name: 'Acropolis View Hotel',
            location: 'Athens, Greece',
            checkIn: '2026-07-15',
            checkOut: '2026-07-22',
            roomType: 'Standard Room',
            boardType: 'Half Board',
            price: 560,
            currency: 'EUR',
            supplier: 'Open Greece',
            stars: 4
        }
    ];

    const mockServiceOptions: ServiceOption[] = [
        {
            id: 'service-1',
            name: 'Acropolis Tour',
            type: 'excursion',
            date: '2026-07-16',
            price: 45,
            currency: 'EUR',
            supplier: 'Ručni Unos',
            description: 'Guided tour of the Acropolis with professional guide'
        },
        {
            id: 'service-2',
            name: 'Airport Transfer',
            type: 'transfer',
            date: '2026-07-15',
            price: 30,
            currency: 'EUR',
            supplier: 'Ručni Unos',
            description: 'Private transfer from Athens Airport to hotel'
        },
        {
            id: 'service-3',
            name: 'Sunset Dinner Cruise',
            type: 'restaurant',
            date: '2026-07-18',
            price: 85,
            currency: 'EUR',
            supplier: 'Ručni Unos',
            description: 'Romantic dinner cruise with live music'
        }
    ];

    const addToCart = (type: 'transport' | 'accommodation' | 'service', item: any) => {
        if (type === 'transport') {
            setCart({ ...cart, transport: item });
        } else if (type === 'accommodation') {
            setCart({ ...cart, accommodation: item });
        } else if (type === 'service') {
            setCart({ ...cart, services: [...cart.services, item] });
        }
    };

    const removeFromCart = (type: 'transport' | 'accommodation' | 'service', itemId?: string) => {
        if (type === 'transport') {
            setCart({ ...cart, transport: undefined });
        } else if (type === 'accommodation') {
            setCart({ ...cart, accommodation: undefined });
        } else if (type === 'service' && itemId) {
            setCart({ ...cart, services: cart.services.filter(s => s.id !== itemId) });
        }
    };

    const calculateTotal = () => {
        let total = 0;
        if (cart.transport) total += cart.transport.price * passengers;
        if (cart.accommodation) total += cart.accommodation.price;
        cart.services.forEach(service => {
            total += service.price * passengers;
        });
        return total;
    };

    const canProceed = () => {
        if (currentStep === 'transport') return !!cart.transport;
        if (currentStep === 'accommodation') return !!cart.accommodation;
        return true; // Services are optional
    };

    const handleNext = () => {
        if (currentStep === 'transport') {
            setCurrentStep('accommodation');
        } else if (currentStep === 'accommodation') {
            setCurrentStep('services');
        }
    };

    const handleBack = () => {
        if (currentStep === 'services') {
            setCurrentStep('accommodation');
        } else if (currentStep === 'accommodation') {
            setCurrentStep('transport');
        }
    };

    const handleComplete = () => {
        onComplete(cart);
    };

    const STEPS = [
        { id: 'transport' as PackageStep, label: 'Prevoz', icon: <Plane size={20} />, required: true },
        { id: 'accommodation' as PackageStep, label: 'Smeštaj', icon: <Hotel size={20} />, required: true },
        { id: 'services' as PackageStep, label: 'Dodatno', icon: <MapPin size={20} />, required: false }
    ];

    const currentStepIndex = STEPS.findIndex(s => s.id === currentStep);

    return (
        <div className="package-builder-container">
            {/* Progress Steps */}
            <div className="package-steps-header">
                {STEPS.map((step, idx) => (
                    <React.Fragment key={step.id}>
                        <div className={`package-step ${currentStep === step.id ? 'active' : ''} ${idx < currentStepIndex ? 'completed' : ''}`}>
                            <div className="step-circle">
                                {idx < currentStepIndex ? <Check size={20} /> : step.icon}
                            </div>
                            <div className="step-info">
                                <span className="step-label">{step.label}</span>
                                {step.required && <span className="required-badge">Obavezno</span>}
                            </div>
                        </div>
                        {idx < STEPS.length - 1 && <div className="step-connector"></div>}
                    </React.Fragment>
                ))}
            </div>

            {/* Main Content Area */}
            <div className="package-builder-content">
                {/* Left: Options List */}
                <div className="options-panel">
                    <div className="panel-header">
                        <h3>
                            {currentStep === 'transport' && 'Izaberite Prevoz'}
                            {currentStep === 'accommodation' && 'Izaberite Smeštaj'}
                            {currentStep === 'services' && 'Dodatne Usluge (Opciono)'}
                        </h3>
                        <p className="panel-subtitle">
                            {currentStep === 'transport' && 'Letovi i autobusi od izabranih dobavljača'}
                            {currentStep === 'accommodation' && 'Hoteli i apartmani za izabrani period'}
                            {currentStep === 'services' && 'Izleti, transferi i ostale usluge'}
                        </p>
                    </div>

                    <div className="options-list">
                        {/* Transport Options */}
                        {currentStep === 'transport' && mockTransportOptions.map(option => (
                            <div key={option.id} className={`option-card ${cart.transport?.id === option.id ? 'selected' : ''}`}>
                                <div className="option-header">
                                    <div className="option-icon">
                                        {option.type === 'flight' ? <Plane size={24} /> : <Bus size={24} />}
                                    </div>
                                    <div className="option-title">
                                        <h4>{option.details.carrier}</h4>
                                        <p>{option.from} → {option.to}</p>
                                    </div>
                                    <div className="option-price">
                                        <span className="price-amount">{option.price} {option.currency}</span>
                                        <span className="price-per">po osobi</span>
                                    </div>
                                </div>
                                <div className="option-details">
                                    <div className="detail-row">
                                        <Calendar size={14} />
                                        <span>Polazak: {option.departureDate} u {option.details.departureTime}</span>
                                    </div>
                                    {option.returnDate && (
                                        <div className="detail-row">
                                            <Calendar size={14} />
                                            <span>Povratak: {option.returnDate} u {option.details.arrivalTime}</span>
                                        </div>
                                    )}
                                    <div className="detail-row">
                                        <Package size={14} />
                                        <span>Dobavljač: {option.supplier}</span>
                                    </div>
                                </div>
                                <button
                                    className={`option-action-btn ${cart.transport?.id === option.id ? 'remove' : 'add'}`}
                                    onClick={() => cart.transport?.id === option.id ? removeFromCart('transport') : addToCart('transport', option)}
                                >
                                    {cart.transport?.id === option.id ? (
                                        <><X size={16} /> Ukloni</>
                                    ) : (
                                        <><Check size={16} /> Izaberi</>
                                    )}
                                </button>
                            </div>
                        ))}

                        {/* Accommodation Options */}
                        {currentStep === 'accommodation' && mockAccommodationOptions.map(option => (
                            <div key={option.id} className={`option-card ${cart.accommodation?.id === option.id ? 'selected' : ''}`}>
                                <div className="option-header">
                                    <div className="option-icon">
                                        <Hotel size={24} />
                                    </div>
                                    <div className="option-title">
                                        <h4>{option.name}</h4>
                                        <p>{'⭐'.repeat(option.stars)} {option.location}</p>
                                    </div>
                                    <div className="option-price">
                                        <span className="price-amount">{option.price} {option.currency}</span>
                                        <span className="price-per">ukupno</span>
                                    </div>
                                </div>
                                <div className="option-details">
                                    <div className="detail-row">
                                        <Calendar size={14} />
                                        <span>{option.checkIn} - {option.checkOut}</span>
                                    </div>
                                    <div className="detail-row">
                                        <Hotel size={14} />
                                        <span>{option.roomType} • {option.boardType}</span>
                                    </div>
                                    <div className="detail-row">
                                        <Package size={14} />
                                        <span>Dobavljač: {option.supplier}</span>
                                    </div>
                                </div>
                                <button
                                    className={`option-action-btn ${cart.accommodation?.id === option.id ? 'remove' : 'add'}`}
                                    onClick={() => cart.accommodation?.id === option.id ? removeFromCart('accommodation') : addToCart('accommodation', option)}
                                >
                                    {cart.accommodation?.id === option.id ? (
                                        <><X size={16} /> Ukloni</>
                                    ) : (
                                        <><Check size={16} /> Izaberi</>
                                    )}
                                </button>
                            </div>
                        ))}

                        {/* Service Options */}
                        {currentStep === 'services' && mockServiceOptions.map(option => {
                            const isSelected = cart.services.some(s => s.id === option.id);
                            return (
                                <div key={option.id} className={`option-card ${isSelected ? 'selected' : ''}`}>
                                    <div className="option-header">
                                        <div className="option-icon">
                                            <MapPin size={24} />
                                        </div>
                                        <div className="option-title">
                                            <h4>{option.name}</h4>
                                            <p>{option.description}</p>
                                        </div>
                                        <div className="option-price">
                                            <span className="price-amount">{option.price} {option.currency}</span>
                                            <span className="price-per">po osobi</span>
                                        </div>
                                    </div>
                                    <div className="option-details">
                                        <div className="detail-row">
                                            <Calendar size={14} />
                                            <span>Datum: {option.date}</span>
                                        </div>
                                        <div className="detail-row">
                                            <Package size={14} />
                                            <span>Dobavljač: {option.supplier}</span>
                                        </div>
                                    </div>
                                    <button
                                        className={`option-action-btn ${isSelected ? 'remove' : 'add'}`}
                                        onClick={() => isSelected ? removeFromCart('service', option.id) : addToCart('service', option)}
                                    >
                                        {isSelected ? (
                                            <><X size={16} /> Ukloni</>
                                        ) : (
                                            <><Check size={16} /> Dodaj</>
                                        )}
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Right: Cart Summary */}
                <div className="cart-panel">
                    <div className="cart-header">
                        <ShoppingCart size={20} />
                        <h3>Vaš Paket</h3>
                    </div>

                    {/* Passengers Selector */}
                    <div className="passengers-selector">
                        <label>Broj putnika:</label>
                        <div className="passenger-controls">
                            <button onClick={() => setPassengers(Math.max(1, passengers - 1))}>-</button>
                            <span>{passengers}</span>
                            <button onClick={() => setPassengers(passengers + 1)}>+</button>
                        </div>
                    </div>

                    {/* Cart Items */}
                    <div className="cart-items">
                        {cart.transport && (
                            <div className="cart-item">
                                <div className="cart-item-header">
                                    <Plane size={16} />
                                    <span>Prevoz</span>
                                    <button onClick={() => removeFromCart('transport')}><X size={14} /></button>
                                </div>
                                <div className="cart-item-details">
                                    <p>{cart.transport.details.carrier}</p>
                                    <p className="cart-item-price">{cart.transport.price * passengers} EUR</p>
                                </div>
                            </div>
                        )}

                        {cart.accommodation && (
                            <div className="cart-item">
                                <div className="cart-item-header">
                                    <Hotel size={16} />
                                    <span>Smeštaj</span>
                                    <button onClick={() => removeFromCart('accommodation')}><X size={14} /></button>
                                </div>
                                <div className="cart-item-details">
                                    <p>{cart.accommodation.name}</p>
                                    <p className="cart-item-price">{cart.accommodation.price} EUR</p>
                                </div>
                            </div>
                        )}

                        {cart.services.map(service => (
                            <div key={service.id} className="cart-item">
                                <div className="cart-item-header">
                                    <MapPin size={16} />
                                    <span>{service.name}</span>
                                    <button onClick={() => removeFromCart('service', service.id)}><X size={14} /></button>
                                </div>
                                <div className="cart-item-details">
                                    <p>{service.description}</p>
                                    <p className="cart-item-price">{service.price * passengers} EUR</p>
                                </div>
                            </div>
                        ))}

                        {!cart.transport && !cart.accommodation && cart.services.length === 0 && (
                            <div className="cart-empty">
                                <ShoppingCart size={48} />
                                <p>Korpa je prazna</p>
                                <span>Izaberite komponente za Vaš paket</span>
                            </div>
                        )}
                    </div>

                    {/* Cart Total */}
                    <div className="cart-total">
                        <div className="total-row">
                            <span>Ukupno:</span>
                            <span className="total-amount">{calculateTotal()} EUR</span>
                        </div>
                        <div className="total-info">
                            <Users size={14} />
                            <span>{passengers} putnik{passengers > 1 ? 'a' : ''}</span>
                        </div>
                    </div>

                    {/* Navigation Buttons */}
                    <div className="cart-actions">
                        {currentStepIndex > 0 && (
                            <button className="btn-back" onClick={handleBack}>
                                <ChevronLeft size={16} /> Nazad
                            </button>
                        )}
                        {currentStepIndex < STEPS.length - 1 ? (
                            <button
                                className="btn-next"
                                onClick={handleNext}
                                disabled={!canProceed()}
                            >
                                Dalje <ChevronRight size={16} />
                            </button>
                        ) : (
                            <button
                                className="btn-complete"
                                onClick={handleComplete}
                                disabled={!cart.transport || !cart.accommodation}
                            >
                                <Check size={16} /> Kreiraj Paket
                            </button>
                        )}
                    </div>

                    <button className="btn-cancel" onClick={onCancel}>
                        Otkaži
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DynamicPackageBuilder;
