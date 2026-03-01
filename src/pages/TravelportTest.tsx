import React, { useState } from 'react';
import {
    Plane, Globe, MapPin, Calendar, Users, Search,
    CheckCircle, XCircle, Clock, CreditCard, ArrowRight,
    RefreshCw, Info, AlertTriangle, Zap, Shield, Ticket
} from 'lucide-react';
import travelportApiService from '../integrations/travelport/api/travelportApiService';
import type {
    TravelportCredentials,
    AirSearchResponse,
    OrderResponse
} from '../integrations/travelport/types/travelportTypes';
import './HotelbedsTest.css'; // Reusing established test page styles

type TabType = 'config' | 'search' | 'booking';

const TravelportTest: React.FC = () => {
    const [activeTab, setActiveTab] = useState<TabType>('config');

    // --- Configuration ---
    const [credentials, setCredentials] = useState<TravelportCredentials>({
        clientId: '',
        clientSecret: '',
        environment: 'test',
    });
    const [isConfigured, setIsConfigured] = useState(false);
    const [configStatus, setConfigStatus] = useState<'idle' | 'success' | 'error'>('idle');

    // --- Search ---
    const [searchParams, setSearchParams] = useState({
        origin: 'BEG',
        destination: 'JFK',
        departureDate: '2026-07-15',
        passengers: 1
    });
    const [searchResults, setSearchResults] = useState<AirSearchResponse | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    // --- Booking ---
    const [bookingResult, setBookingResult] = useState<OrderResponse | null>(null);

    // --- Error ---
    const [error, setError] = useState<string | null>(null);

    const handleConfigure = () => {
        if (!credentials.clientId || !credentials.clientSecret) {
            setConfigStatus('error');
            setError('Client ID i Client Secret su obavezni!');
            return;
        }
        travelportApiService.configure(credentials);
        setIsConfigured(true);
        setConfigStatus('success');
        setError(null);
    };

    const handleConfigureDemo = () => {
        const demo: TravelportCredentials = {
            clientId: 'DEMO_TP_CLIENT_123',
            clientSecret: 'DEMO_TP_SECRET_ABC',
            environment: 'test',
        };
        setCredentials(demo);
        travelportApiService.configure(demo);
        setIsConfigured(true);
        setConfigStatus('success');
        setError(null);
    };

    const handleSearch = async () => {
        setError(null);
        setIsLoading(true);
        setSearchResults(null);
        try {
            const results = await travelportApiService.searchAir({
                origin: searchParams.origin,
                destination: searchParams.destination,
                departureDate: searchParams.departureDate,
                passengers: { adults: searchParams.passengers }
            });
            setSearchResults(results);
        } catch (e: any) {
            setError(e.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleBook = async (offerId: string) => {
        setError(null);
        setIsLoading(true);
        try {
            const result = await travelportApiService.createOrder({
                offerId,
                passengers: [
                    {
                        firstName: 'MARKO',
                        lastName: 'MARKOVIC',
                        dateOfBirth: '1985-05-20',
                        gender: 'M',
                        email: 'marko@clicktotravel.rs',
                        phone: '+381641234567'
                    }
                ]
            });
            setBookingResult(result);
        } catch (e: any) {
            setError(e.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="hb-test-page">
            <div className="hb-header" style={{ background: 'linear-gradient(135deg, #00adef 0%, #0072bc 100%)' }}>
                <div className="hb-header-left">
                    <div className="hb-logo" style={{ background: '#fff' }}>
                        <Plane size={36} color="#00adef" />
                    </div>
                    <div>
                        <h1 style={{ color: '#fff' }}>Travelport+ (Galileo)</h1>
                        <p style={{ color: '#e0f4ff' }}>JSON Air APIs v11 — Modern Flight Integration</p>
                    </div>
                </div>
                <div className="hb-header-right">
                    <div className={`hb-status-pill ${isConfigured ? 'configured' : 'unconfigured'}`}>
                        {isConfigured ? <CheckCircle size={14} /> : <XCircle size={14} />}
                        <span>{isConfigured ? 'Konfigurisan' : 'Nije konfigurisan'}</span>
                    </div>
                    <div className="hb-env-badge">
                        <Shield size={14} />
                        <span>{credentials.environment === 'test' ? 'SANDBOX' : 'PRODUCTION'}</span>
                    </div>
                </div>
            </div>

            {error && (
                <div className="hb-error-banner">
                    <AlertTriangle size={16} />
                    <span>{error}</span>
                    <button onClick={() => setError(null)}><XCircle size={14} /></button>
                </div>
            )}

            <div className="hb-tabs">
                <button className={`hb-tab-btn ${activeTab === 'config' ? 'active' : ''}`} onClick={() => setActiveTab('config')}>
                    <Shield size={16} /> Config
                </button>
                <button className={`hb-tab-btn ${activeTab === 'search' ? 'active' : ''}`} onClick={() => setActiveTab('search')}>
                    <Search size={16} /> Air Search
                </button>
                <button className={`hb-tab-btn ${activeTab === 'booking' ? 'active' : ''}`} onClick={() => setActiveTab('booking')}>
                    <Ticket size={16} /> Orders / PNR
                </button>
            </div>

            <div className="hb-content">
                {activeTab === 'config' && (
                    <div className="hb-section">
                        <h2>API Konfiguracija — OAuth 2.0 Auth</h2>
                        <div className="hb-info-box">
                            <Info size={16} />
                            <div>
                                <strong>Travelport Identity Services</strong>
                                <p>Od januara 2026. obavezan je OAuth 2.0. Pristup zahteva Client ID i Client Secret za dobijanje privremenog Bearer tokena.</p>
                            </div>
                        </div>
                        <div className="hb-config-grid">
                            <div className="hb-form-group">
                                <label>Client ID</label>
                                <input className="hb-input" value={credentials.clientId} onChange={e => setCredentials({ ...credentials, clientId: e.target.value })} />
                            </div>
                            <div className="hb-form-group">
                                <label>Client Secret</label>
                                <input className="hb-input" type="password" value={credentials.clientSecret} onChange={e => setCredentials({ ...credentials, clientSecret: e.target.value })} />
                            </div>
                        </div>
                        <div className="hb-config-actions">
                            <button className="hb-btn primary" onClick={handleConfigure}><Zap size={16} /> Konfiguriši</button>
                            <button className="hb-btn secondary" onClick={handleConfigureDemo}><RefreshCw size={16} /> Demo Mod</button>
                        </div>
                    </div>
                )}

                {activeTab === 'search' && (
                    <div className="hb-section">
                        <h2>Pretraga Letova (JSON v11)</h2>
                        <div className="hb-search-card">
                            <div className="hb-search-grid">
                                <div className="hb-form-group">
                                    <label>Origin</label>
                                    <input className="hb-input" value={searchParams.origin} onChange={e => setSearchParams({ ...searchParams, origin: e.target.value.toUpperCase() })} />
                                </div>
                                <div className="hb-form-group">
                                    <label>Destination</label>
                                    <input className="hb-input" value={searchParams.destination} onChange={e => setSearchParams({ ...searchParams, destination: e.target.value.toUpperCase() })} />
                                </div>
                                <div className="hb-form-group">
                                    <label>Date</label>
                                    <input className="hb-input" type="date" value={searchParams.departureDate} onChange={e => setSearchParams({ ...searchParams, departureDate: e.target.value })} />
                                </div>
                                <div className="hb-form-group">
                                    <label>Passengers</label>
                                    <input className="hb-input" type="number" value={searchParams.passengers} onChange={e => setSearchParams({ ...searchParams, passengers: +e.target.value })} />
                                </div>
                            </div>
                            <button className="hb-btn primary full-width" onClick={handleSearch} disabled={isLoading || !isConfigured}>
                                {isLoading ? <RefreshCw className="spin" size={16} /> : <Search size={16} />} Pretraži Ponude
                            </button>
                        </div>

                        {searchResults && (
                            <div className="hb-results">
                                {searchResults.offers.map(offer => (
                                    <div key={offer.id} className="hb-hotel-card">
                                        <div className="hb-hotel-top">
                                            <div className="hb-hotel-info">
                                                <div className="hb-hotel-stars">
                                                    <span className="hb-api-badge flights">{offer.platingCarrier}</span>
                                                </div>
                                                <h3>{offer.segments[0].origin} → {offer.segments[offer.segments.length - 1].destination}</h3>
                                                <p className="hb-hotel-dest">
                                                    {offer.segments.length > 1 ? `${offer.segments.length - 1} konekcija(e)` : 'Direktan let'}
                                                </p>
                                            </div>
                                            <div className="hb-hotel-price">
                                                <div className="hb-price-from">UKUPNO</div>
                                                <div className="hb-price-main">{offer.totalPrice} {offer.currency}</div>
                                                <button className="hb-btn-sm primary" onClick={() => handleBook(offer.id)}>Rezerviši <ArrowRight size={14} /></button>
                                            </div>
                                        </div>
                                        <div className="hb-hotel-rooms">
                                            {offer.segments.map(seg => (
                                                <div key={seg.id} className="hb-room-row">
                                                    <div className="hb-room-info">
                                                        <span className="hb-room-name">{seg.carrier}{seg.flightNumber} | {seg.aircraft}</span>
                                                        <span className="hb-room-code">Dep: {seg.departureTime.split('T')[1]} | Arr: {seg.arrivalTime.split('T')[1]}</span>
                                                    </div>
                                                    <span className="hb-board-badge" style={{ background: '#e0f4ff', color: '#0072bc' }}>{seg.cabin} ({seg.bookingCode})</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'booking' && (
                    <div className="hb-section">
                        <h2>Rezervacije i PNR — Order Create</h2>
                        {bookingResult ? (
                            <div className="hb-success-box">
                                <CheckCircle size={24} color="#10b981" />
                                <div>
                                    <strong>Rezervacija uspesna!</strong>
                                    <p>PNR: <span className="hb-ref-code">{bookingResult.pnr}</span></p>
                                    <p>Order ID: <code>{bookingResult.orderId}</code></p>
                                </div>
                            </div>
                        ) : (
                            <div className="hb-info-box">
                                <Ticket size={24} />
                                <p>Ovde će biti prikazani detalji potvrđenog PNR-a nakon uspešne rezervacije na "Search" tabu.</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default TravelportTest;
