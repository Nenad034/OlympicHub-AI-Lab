import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    MapPin, Calendar, Users, Plane, Hotel,
    Car, Ticket, Clock, Euro, ChevronRight,
    Package as PackageIcon, ArrowRight, Check
} from 'lucide-react';
import { packageMockService } from '../services/packageMockService';
import type { DynamicPackage } from '../types/package.types';
import './PackageBuilder.css';

const PackageBuilder: React.FC = () => {
    const navigate = useNavigate();
    const [package_, setPackage] = useState<DynamicPackage | null>(null);
    const [selectedDay, setSelectedDay] = useState<number>(1);

    // Load sample package on mount
    useEffect(() => {
        const samplePackage = packageMockService.generateSamplePackage();
        setPackage(samplePackage);
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

    return (
        <div className="package-builder-page">
            {/* Header */}
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

            <div className="package-content">
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

                {/* Day Selector */}
                <div className="day-selector-section">
                    <h3>
                        <Calendar size={20} />
                        Itinerar Dan-po-Dan
                    </h3>
                    <div className="day-selector">
                        {package_.itinerary.map(day => (
                            <button
                                key={day.day}
                                className={`day-btn ${selectedDay === day.day ? 'active' : ''}`}
                                onClick={() => setSelectedDay(day.day)}
                            >
                                <span className="day-number">Dan {day.day}</span>
                                <span className="day-date">{formatDate(day.date)}</span>
                                <span className="day-destination">{day.destination}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Day Itinerary */}
                {currentDayItinerary && (
                    <div className="day-itinerary">
                        <div className="day-header">
                            <h2>Dan {currentDayItinerary.day} - {currentDayItinerary.dayOfWeek}</h2>
                            <p className="day-date-full">{formatDate(currentDayItinerary.date)}</p>
                            <div className="day-location">
                                <MapPin size={18} />
                                {currentDayItinerary.destination}
                            </div>
                        </div>

                        <div className="activities-timeline">
                            {currentDayItinerary.activities.map((activity, idx) => (
                                <div key={activity.id} className="activity-card">
                                    <div className="activity-time">
                                        <Clock size={16} />
                                        {formatTime(activity.time)}
                                    </div>
                                    <div className="activity-icon-wrapper">
                                        <span className="activity-icon">{activity.icon}</span>
                                        {idx < currentDayItinerary.activities.length - 1 && (
                                            <div className="activity-connector"></div>
                                        )}
                                    </div>
                                    <div className="activity-content">
                                        <h4>{activity.title}</h4>
                                        <p>{activity.description}</p>
                                        {activity.duration && (
                                            <span className="activity-duration">
                                                <Clock size={14} />
                                                {activity.duration}
                                            </span>
                                        )}
                                        {activity.location && (
                                            <span className="activity-location">
                                                <MapPin size={14} />
                                                {activity.location}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Package Components Summary */}
                <div className="components-summary">
                    <div className="component-card">
                        <div className="component-header">
                            <Plane size={24} />
                            <h3>Letovi</h3>
                            <span className="component-count">{package_.flights.length}</span>
                        </div>
                        <div className="component-items">
                            {package_.flights.map(flight => (
                                <div key={flight.id} className="component-item">
                                    <div className="item-main">
                                        <span className="item-route">{flight.origin} → {flight.destination}</span>
                                        <span className="item-detail">{flight.flightNumber} • {flight.airlineName}</span>
                                    </div>
                                    <span className="item-price">{flight.price} €</span>
                                </div>
                            ))}
                        </div>
                        <div className="component-total">
                            Ukupno: {package_.pricing.flights.toFixed(2)} €
                        </div>
                    </div>

                    <div className="component-card">
                        <div className="component-header">
                            <Hotel size={24} />
                            <h3>Hoteli</h3>
                            <span className="component-count">{package_.hotels.length}</span>
                        </div>
                        <div className="component-items">
                            {package_.hotels.map(hotel => (
                                <div key={hotel.id} className="component-item">
                                    <div className="item-main">
                                        <span className="item-route">{hotel.hotelName}</span>
                                        <span className="item-detail">{hotel.nights} noći • {hotel.mealPlanName}</span>
                                    </div>
                                    <span className="item-price">{hotel.price} €</span>
                                </div>
                            ))}
                        </div>
                        <div className="component-total">
                            Ukupno: {package_.pricing.hotels.toFixed(2)} €
                        </div>
                    </div>

                    <div className="component-card">
                        <div className="component-header">
                            <Car size={24} />
                            <h3>Transferi</h3>
                            <span className="component-count">{package_.transfers.length}</span>
                        </div>
                        <div className="component-items">
                            {package_.transfers.map(transfer => (
                                <div key={transfer.id} className="component-item">
                                    <div className="item-main">
                                        <span className="item-route">{transfer.from} → {transfer.to}</span>
                                        <span className="item-detail">{transfer.vehicleName}</span>
                                    </div>
                                    <span className="item-price">{transfer.price} €</span>
                                </div>
                            ))}
                        </div>
                        <div className="component-total">
                            Ukupno: {package_.pricing.transfers.toFixed(2)} €
                        </div>
                    </div>

                    <div className="component-card">
                        <div className="component-header">
                            <Ticket size={24} />
                            <h3>Dodatne Usluge</h3>
                            <span className="component-count">{package_.extras.length}</span>
                        </div>
                        <div className="component-items">
                            {package_.extras.map(extra => (
                                <div key={extra.id} className="component-item">
                                    <div className="item-main">
                                        <span className="item-route">{extra.name}</span>
                                        <span className="item-detail">{extra.destination} • {extra.quantity}x</span>
                                    </div>
                                    <span className="item-price">{extra.totalPrice} €</span>
                                </div>
                            ))}
                        </div>
                        <div className="component-total">
                            Ukupno: {package_.pricing.extras.toFixed(2)} €
                        </div>
                    </div>
                </div>

                {/* Price Breakdown */}
                <div className="price-breakdown-section">
                    <h3>
                        <Euro size={20} />
                        Detalji Cene
                    </h3>
                    <div className="price-breakdown">
                        <div className="price-row">
                            <span>Letovi ({package_.travelers} putnika):</span>
                            <span>{package_.pricing.flights.toFixed(2)} €</span>
                        </div>
                        <div className="price-row">
                            <span>Hoteli ({package_.hotels.reduce((sum, h) => sum + h.nights, 0)} noći):</span>
                            <span>{package_.pricing.hotels.toFixed(2)} €</span>
                        </div>
                        <div className="price-row">
                            <span>Transferi ({package_.transfers.length}x):</span>
                            <span>{package_.pricing.transfers.toFixed(2)} €</span>
                        </div>
                        <div className="price-row">
                            <span>Dodatne usluge:</span>
                            <span>{package_.pricing.extras.toFixed(2)} €</span>
                        </div>
                        <div className="price-row subtotal">
                            <span>Međuzbir:</span>
                            <span>{package_.pricing.subtotal.toFixed(2)} €</span>
                        </div>
                        <div className="price-row">
                            <span>Takse i naknade:</span>
                            <span>{package_.pricing.taxes.toFixed(2)} €</span>
                        </div>
                        <div className="price-row total">
                            <span>UKUPNO:</span>
                            <span>{package_.pricing.total.toFixed(2)} €</span>
                        </div>
                        <div className="price-per-person-row">
                            <span>Po osobi ({package_.travelers} putnika):</span>
                            <span>{package_.pricing.perPerson.toFixed(2)} €</span>
                        </div>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="package-actions">
                    <button className="btn-secondary" onClick={() => navigate('/packages')}>
                        Nazad na listu
                    </button>
                    <button className="btn-primary">
                        <Check size={20} />
                        Potvrdi Paket
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PackageBuilder;
