import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
    ArrowLeft,
    MapPin,
    Star,
    Globe,
    Phone,
    Mail,
    Info,
    CheckCircle2,
    Image as ImageIcon,
    Loader2,
    Calendar,
    Users,
    ShieldCheck
} from 'lucide-react';
import OpenGreeceAPI from '../services/opengreeceApiService';
import type { OpenGreeceHotelDetails, OpenGreeceRoom } from '../types/opengreece.types';
import './OpenGreeceDetail.css';

const OpenGreeceDetail: React.FC = () => {
    const { hotelCode } = useParams<{ hotelCode: string }>();
    const navigate = useNavigate();
    const location = useLocation();
    const [hotel, setHotel] = useState<OpenGreeceHotelDetails | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeImage, setActiveImage] = useState(0);

    // Availability data passed from search results
    const availabilityData = location.state?.availability || null;

    useEffect(() => {
        if (hotelCode) {
            loadHotelDetails(hotelCode);
        }
    }, [hotelCode]);

    const loadHotelDetails = async (code: string) => {
        setLoading(true);
        try {
            const response = await OpenGreeceAPI.getHotelDetails(code);
            if (response.success && response.data) {
                setHotel(response.data);
            } else {
                setError(response.errors?.map(e => e.message).join(', ') || 'Failed to load hotel details');
            }
        } catch (err) {
            setError(String(err));
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="og-detail-loading">
                <Loader2 className="spin" size={48} />
                <p>Učitavam detalje hotela...</p>
            </div>
        );
    }

    if (error || !hotel) {
        return (
            <div className="og-detail-error">
                <Info size={48} />
                <h2>Ups! Nešto nije u redu</h2>
                <p>{error || 'Hotel nije pronađen'}</p>
                <button onClick={() => navigate(-1)} className="btn-back">
                    <ArrowLeft size={18} /> Nazad na pretragu
                </button>
            </div>
        );
    }

    return (
        <div className="og-detail-page fade-in">
            <header className="og-detail-header">
                <button onClick={() => navigate(-1)} className="back-btn-overlay">
                    <ArrowLeft size={20} />
                </button>
                <div className="header-main-info">
                    <div className="title-section">
                        <h1>{hotel.hotelName}</h1>
                        <div className="stars-row">
                            {Array(4).fill(0).map((_, i) => (
                                <Star key={i} size={16} fill="#fbca28" color="#fbca28" />
                            ))}
                        </div>
                    </div>
                    <div className="location-row">
                        <MapPin size={16} />
                        <span>{hotel.address?.addressLine1}, {hotel.address?.cityName}, {hotel.address?.countryCode}</span>
                    </div>
                </div>
            </header>

            <main className="og-detail-content">
                <div className="content-left">
                    {/* Gallery Section */}
                    <section className="og-gallery">
                        <div className="main-image-container">
                            <img
                                src={hotel.images?.[activeImage]?.url || "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&q=80&w=1200"}
                                alt={hotel.hotelName}
                            />
                        </div>
                        <div className="thumbnails-grid">
                            {hotel.images?.slice(0, 6).map((img, idx) => (
                                <div
                                    key={idx}
                                    className={`thumb-item ${activeImage === idx ? 'active' : ''}`}
                                    onClick={() => setActiveImage(idx)}
                                >
                                    <img src={img.url} alt={`Gallery ${idx}`} />
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* Description Section */}
                    <section className="og-description">
                        <h3>O hotelu</h3>
                        <p>{hotel.description || 'Opis hotela trenutno nije dostupan.'}</p>
                    </section>

                    {/* Amenities Section */}
                    <section className="og-amenities">
                        <h3>Sadržaji i usluge</h3>
                        <div className="amenities-grid">
                            {hotel.amenities?.map((amenity, idx) => (
                                <div key={idx} className="amenity-item">
                                    <CheckCircle2 size={16} className="icon-check" />
                                    <span>{amenity}</span>
                                </div>
                            ))}
                            {(!hotel.amenities || hotel.amenities.length === 0) && (
                                <p className="no-data">Informacije o sadržajima nisu dostupne.</p>
                            )}
                        </div>
                    </section>
                </div>

                <div className="content-right">
                    {/* Availability & Booking Sidebar */}
                    {availabilityData ? (
                        <div className="og-booking-sidebar">
                            <div className="sidebar-card">
                                <h3>Vaša Ponuda</h3>
                                <div className="stay-info">
                                    <div className="info-item">
                                        <Calendar size={18} />
                                        <span>{new Date(availabilityData.checkIn).toLocaleDateString('sr-RS')} - {new Date(availabilityData.checkOut).toLocaleDateString('sr-RS')}</span>
                                    </div>
                                    <div className="info-item">
                                        <Users size={18} />
                                        <span>{availabilityData.adults} odraslih, {availabilityData.children} dece</span>
                                    </div>
                                </div>
                                <div className="rooms-selection">
                                    {availabilityData.rooms?.map((room: OpenGreeceRoom, idx: number) => (
                                        <div key={idx} className="room-offer-card">
                                            <div className="room-name">{room.roomName}</div>
                                            <div className="room-price-line">
                                                <span className="price">{room.rates[0]?.price.totalAmount} {room.rates[0]?.price.currency}</span>
                                                <button
                                                    className="btn-select-room"
                                                    onClick={() => navigate(`/booking/OpenGreece/${hotel.hotelCode}`, {
                                                        state: {
                                                            bookingContext: {
                                                                hotelName: hotel.hotelName,
                                                                roomName: room.roomName,
                                                                price: room.rates[0]?.price.totalAmount,
                                                                currency: room.rates[0]?.price.currency,
                                                                checkIn: availabilityData.checkIn,
                                                                checkOut: availabilityData.checkOut,
                                                                nights: availabilityData.nights,
                                                                adults: availabilityData.adults,
                                                                children: availabilityData.children,
                                                                image: hotel.images?.[0]?.url
                                                            }
                                                        }
                                                    })}
                                                >
                                                    Izaberi
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <div className="sidebar-footer">
                                    <div className="secure-badge">
                                        <ShieldCheck size={16} />
                                        <span>Sigurna rezervacija preko Open Greece API</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="og-contact-sidebar">
                            <div className="sidebar-card">
                                <h3>Kontakt informacije</h3>
                                <div className="contact-list">
                                    {hotel.contact?.phone && (
                                        <div className="contact-item">
                                            <Phone size={18} />
                                            <span>{hotel.contact.phone}</span>
                                        </div>
                                    )}
                                    {hotel.contact?.email && (
                                        <div className="contact-item">
                                            <Mail size={18} />
                                            <span>{hotel.contact.email}</span>
                                        </div>
                                    )}
                                    {hotel.contact?.website && (
                                        <div className="contact-item">
                                            <Globe size={18} />
                                            <a href={hotel.contact.website} target="_blank" rel="noopener noreferrer">Zvanični sajt</a>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default OpenGreeceDetail;
