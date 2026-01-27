import React, { useEffect, useState } from 'react';
import {
    Map as MapIcon, Check, Plane, Hotel, Car, Ticket,
    ArrowRight, Euro, Calendar, Users, Info,
    ChevronDown, ChevronUp, FileText, Code, Mail
} from 'lucide-react';
import { generatePackagePDF, generatePackageHTML } from '../../../utils/packageExport';
import type {
    BasicInfoData,
    FlightSelectionData,
    HotelSelectionData,
    TransferSelectionData,
    ExtraSelectionData
} from '../../../types/packageSearch.types';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default leaflet markers
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

interface Step6Props {
    basicInfo: BasicInfoData | null;
    flights: FlightSelectionData | null;
    hotels: HotelSelectionData[];
    transfers: TransferSelectionData[];
    extras: ExtraSelectionData[];
    totalPrice: number;
    onBack: () => void;
    onConfirm: () => void;
    onEditStep?: (step: number) => void;
}

const MapAutoBounds: React.FC<{ positions: [number, number][] }> = ({ positions }) => {
    const map = useMap();
    useEffect(() => {
        if (positions.length > 0) {
            const bounds = L.latLngBounds(positions);
            map.fitBounds(bounds, { padding: [50, 50] });
        }
    }, [positions, map]);
    return null;
};

// Helper to calculate bearing between two points
const calculateBearing = (start: [number, number], end: [number, number]) => {
    const startLat = (start[0] * Math.PI) / 180;
    const startLng = (start[1] * Math.PI) / 180;
    const endLat = (end[0] * Math.PI) / 180;
    const endLng = (end[1] * Math.PI) / 180;

    const y = Math.sin(endLng - startLng) * Math.cos(endLat);
    const x = Math.cos(startLat) * Math.sin(endLat) -
        Math.sin(startLat) * Math.cos(endLat) * Math.cos(endLng - startLng);
    const brng = (Math.atan2(y, x) * 180) / Math.PI;
    return (brng + 360) % 360;
};

// Component to render arrows along the route
const RouteArrows: React.FC<{ positions: [number, number][] }> = ({ positions }) => {
    if (positions.length < 2) return null;

    return (
        <>
            {positions.slice(0, -1).map((start, i) => {
                const end = positions[i + 1];
                const bearing = calculateBearing(start, end);
                const mid: [number, number] = [
                    (start[0] + end[0]) / 2,
                    (start[1] + end[1]) / 2
                ];

                const arrowIcon = L.divIcon({
                    className: 'route-arrow-icon',
                    html: `<div style="transform: rotate(${bearing}deg); color: #ef4444; display: flex; align-items: center; justify-content: center;">
                             <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                               <path d="M12 3l-10 18h20z" />
                             </svg>
                           </div>`,
                    iconSize: [12, 12],
                    iconAnchor: [6, 6]
                });

                return (
                    <Marker
                        key={`arrow-${i}`}
                        position={mid}
                        icon={arrowIcon}
                        interactive={false}
                    />
                );
            })}
        </>
    );
};

const Step6_ReviewConfirm: React.FC<Step6Props> = ({
    basicInfo,
    flights,
    hotels,
    transfers,
    extras,
    totalPrice,
    onBack,
    onConfirm,
    onEditStep
}) => {
    const [showBreakdown, setShowBreakdown] = useState(true);

    const handleSendEmail = () => {
        alert('Plan putovanja je spreman i biće poslat na vašu mejl adresu.');
    };

    const handleExportPDF = () => {
        if (!basicInfo) return;
        generatePackagePDF({
            basicInfo,
            flights: flights || undefined,
            hotels,
            transfers,
            extras,
            totalPrice
        } as any);
    };

    const handleExportHTML = () => {
        if (!basicInfo) return;
        generatePackageHTML({
            basicInfo,
            flights: flights || undefined,
            hotels,
            transfers,
            extras,
            totalPrice
        } as any);
    };

    // Calculate component subtotals
    const flightPrice = flights?.totalPrice || 0;
    const hotelPrice = hotels.reduce((sum, h) => sum + h.totalPrice, 0);
    const transferPrice = transfers.reduce((sum, t) => sum + t.totalPrice, 0);
    const extraPrice = extras.reduce((sum, e) => sum + e.totalPrice, 0);

    // BEG coordinates for itinerary start/end
    const begPos: [number, number] = [44.8181, 20.3091];

    // Coordinate fallback for common cities to ensure map looks good even with imperfect data
    const cityCoords: Record<string, [number, number]> = {
        'beograd': [44.8181, 20.3091],
        'belgrade': [44.8181, 20.3091],
        'milano': [45.4642, 9.1899],
        'milan': [45.4642, 9.1899],
        'pariz': [48.8566, 2.3522],
        'paris': [48.8566, 2.3522],
        'rodos': [36.4452, 28.2278],
        'rhodes': [36.4452, 28.2278],
        'hurgada': [27.2579, 33.8116],
        'hurghada': [27.2579, 33.8116],
        'sharm el sheikh': [27.9158, 34.3299],
        'rim': [41.9028, 12.4964],
        'rome': [41.9028, 12.4964],
        'beč': [48.2082, 16.3738],
        'vienna': [48.2082, 16.3738]
    };

    const getCityCoords = (city: string): [number, number] | null => {
        const normalized = city.toLowerCase().trim();
        return cityCoords[normalized] || null;
    };

    // Prepare map markers
    const hotelMarkers = hotels.map(h => {
        const fallback = getCityCoords(h.hotel.city);
        return {
            id: h.hotel.id,
            name: h.hotel.name,
            city: h.hotel.city,
            type: 'hotel',
            position: [
                h.hotel.latitude || (fallback ? fallback[0] : 0),
                h.hotel.longitude || (fallback ? fallback[1] : 0)
            ] as [number, number]
        };
    }).filter(m => m.position[0] !== 0);

    const allMarkers = [
        { id: 'beg-start', name: 'Beograd (Aerodrom Nikola Tesla)', city: 'Beograd', type: 'airport', position: begPos },
        ...hotelMarkers,
        { id: 'beg-end', name: 'Beograd (Aerodrom Nikola Tesla)', city: 'Beograd', type: 'airport', position: begPos }
    ];

    // Prepare route line including start/end from Belgrade
    const routeCoordinates = [
        begPos,
        ...hotelMarkers.map(m => m.position),
        begPos
    ];

    const handleEdit = (step: number) => {
        if (onEditStep) onEditStep(step);
    };

    return (
        <div className="step-content">
            <div className="step-header">
                <h2><MapIcon size={24} /> Pregled i Potvrda</h2>
                <p>Proverite sve detalje vašeg paketa pre kreiranja</p>
            </div>

            <div className="review-container">
                {/* Visual Route Map */}
                <div className="review-map-section">
                    <div className="map-wrapper">
                        <MapContainer
                            center={begPos}
                            zoom={5}
                            style={{ height: '400px', width: '100%', borderRadius: '12px' }}
                        >
                            <TileLayer
                                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                            />
                            <MapAutoBounds positions={routeCoordinates} />

                            <Marker position={begPos}>
                                <Popup>
                                    <strong>Beograd</strong><br />
                                    Aerodrom Nikola Tesla (BEG)
                                </Popup>
                            </Marker>

                            {hotelMarkers.map(marker => (
                                <Marker key={marker.id} position={marker.position}>
                                    <Popup>
                                        <strong>{marker.city}</strong><br />
                                        {marker.name}
                                    </Popup>
                                </Marker>
                            ))}

                            {routeCoordinates.length > 1 && (
                                <>
                                    <Polyline positions={routeCoordinates} color="#667eea" weight={2} />
                                    <RouteArrows positions={routeCoordinates} />
                                </>
                            )}
                        </MapContainer>
                    </div>
                </div>

                <div className="review-grid">
                    {/* Left Column: Components Summary */}
                    <div className="review-details">
                        {/* Flights Summary */}
                        {flights && (
                            <div className="summary-card">
                                <div className="card-header">
                                    <div className="header-title">
                                        <Plane size={20} />
                                        <span>Letovi</span>
                                    </div>
                                    <div className="header-actions">
                                        <span className="price">{flightPrice.toFixed(2)} €</span>
                                        <button className="edit-btn" onClick={() => handleEdit(2)}>Izmeni</button>
                                    </div>
                                </div>
                                <div className="card-body">
                                    {/* Standard flights */}
                                    {flights.outboundFlight?.slices.map((slice, idx) => (
                                        <div key={`out-${idx}`} className="slice-summary-detailed">
                                            <div className="slice-main">
                                                <span>Odlazak:</span>
                                                <strong>{slice.origin.city} ({slice.origin.iataCode}) → {slice.destination.city} ({slice.destination.iataCode})</strong>
                                                <span className="date">{new Date(slice.departure).toLocaleDateString()}</span>
                                            </div>
                                            <div className="slice-airports">
                                                {slice.origin.name} → {slice.destination.name}
                                            </div>
                                        </div>
                                    ))}
                                    {flights.returnFlight?.slices.map((slice, idx) => (
                                        <div key={`ret-${idx}`} className="slice-summary-detailed">
                                            <div className="slice-main">
                                                <span>Povratak:</span>
                                                <strong>{slice.origin.city} ({slice.origin.iataCode}) → {slice.destination.city} ({slice.destination.iataCode})</strong>
                                                <span className="date">{new Date(slice.departure).toLocaleDateString()}</span>
                                            </div>
                                            <div className="slice-airports">
                                                {slice.origin.name} → {slice.destination.name}
                                            </div>
                                        </div>
                                    ))}
                                    {/* Multi-city flights */}
                                    {flights.multiCityFlights?.map((offer, idx) => (
                                        <div key={`multi-${idx}`} className="slice-summary-detailed">
                                            <div className="slice-main">
                                                <span>Let {idx + 1}:</span>
                                                <strong>{offer.slices[0].origin.city} ({offer.slices[0].origin.iataCode}) → {offer.slices[0].destination.city} ({offer.slices[0].destination.iataCode})</strong>
                                                <span className="date">{new Date(offer.slices[0].departure).toLocaleDateString()}</span>
                                            </div>
                                            <div className="slice-airports">
                                                {offer.slices[0].origin.name} → {offer.slices[0].destination.name}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Hotels Summary */}
                        {hotels.length > 0 && (
                            <div className="summary-card">
                                <div className="card-header">
                                    <div className="header-title">
                                        <Hotel size={20} />
                                        <span>Smeštaj ({hotels.length})</span>
                                    </div>
                                    <div className="header-actions">
                                        <span className="price">{hotelPrice.toFixed(2)} €</span>
                                        <button className="edit-btn" onClick={() => handleEdit(3)}>Izmeni</button>
                                    </div>
                                </div>
                                <div className="card-body">
                                    {hotels.map((h, idx) => (
                                        <div key={idx} className="hotel-summary-detailed">
                                            <div className="hotel-header-line">
                                                <strong>{h.hotel.name}</strong>
                                                <span className="city-tag">{h.hotel.city}</span>
                                                <span className="date-tag">{h.checkIn} - {h.checkOut}</span>
                                            </div>
                                            <div className="hotel-meta">
                                                <span>{h.nights} noći • {h.mealPlan.name} • {h.room.name}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Transfers Summary */}
                        {transfers.length > 0 && (
                            <div className="summary-card">
                                <div className="card-header">
                                    <div className="header-title">
                                        <Car size={20} />
                                        <span>Transferi</span>
                                    </div>
                                    <div className="header-actions">
                                        <span className="price">{transferPrice.toFixed(2)} €</span>
                                        <button className="edit-btn" onClick={() => handleEdit(4)}>Izmeni</button>
                                    </div>
                                </div>
                                <div className="card-body">
                                    {transfers.map((t, idx) => (
                                        <div key={`t-${idx}`} className="list-item-detailed">
                                            <div className="item-main">
                                                <div className="dot"></div>
                                                <span>{t.transfer.from} → {t.transfer.to}</span>
                                                <span className="date-tag">{t.date}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Extras Summary */}
                        {extras.length > 0 && (
                            <div className="summary-card">
                                <div className="card-header">
                                    <div className="header-title">
                                        <Ticket size={20} />
                                        <span>Dodatne Usluge</span>
                                    </div>
                                    <div className="header-actions">
                                        <span className="price">{extraPrice.toFixed(2)} €</span>
                                        <button className="edit-btn" onClick={() => handleEdit(5)}>Izmeni</button>
                                    </div>
                                </div>
                                <div className="card-body">
                                    {extras.map((e, idx) => (
                                        <div key={`e-${idx}`} className="list-item-detailed">
                                            <div className="item-main">
                                                <div className="dot green"></div>
                                                <span>{e.extra.name} ({e.extra.destination})</span>
                                                <span className="date-tag">{e.date}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Right Column: Pricing & Final Action */}
                    <div className="review-sidebar">
                        <div className="price-breakdown-card">
                            <h3>Ukupna Cena</h3>

                            <div className="breakdown-rows">
                                <div className="row">
                                    <span>Letovi</span>
                                    <span>{flightPrice.toFixed(2)} €</span>
                                </div>
                                <div className="row">
                                    <span>Hoteli</span>
                                    <span>{hotelPrice.toFixed(2)} €</span>
                                </div>
                                <div className="row">
                                    <span>Transferi</span>
                                    <span>{transferPrice.toFixed(2)} €</span>
                                </div>
                                <div className="row">
                                    <span>Dodatne usluge</span>
                                    <span>{extraPrice.toFixed(2)} €</span>
                                </div>
                                <div className="row total">
                                    <span>UKUPNO</span>
                                    <span>{totalPrice.toFixed(2)} €</span>
                                </div>
                            </div>

                            <div className="package-meta-info">
                                <div className="meta-item">
                                    <Users size={16} />
                                    <span>{basicInfo?.travelers.adults} odraslih, {basicInfo?.travelers.children} dece</span>
                                </div>
                                <div className="meta-item">
                                    <Calendar size={16} />
                                    <span>{basicInfo?.totalDays} dana ({basicInfo?.startDate} - {basicInfo?.endDate})</span>
                                </div>
                            </div>

                            <div className="package-exports">
                                <h3>Izvoz/Slanje</h3>
                                <div className="export-buttons">
                                    <button className="export-action-btn" onClick={handleExportPDF}>
                                        <FileText size={18} />
                                        <span>PDF</span>
                                    </button>
                                    <button className="export-action-btn" onClick={handleExportHTML}>
                                        <Code size={18} />
                                        <span>HTML</span>
                                    </button>
                                    <button className="export-action-btn" onClick={handleSendEmail}>
                                        <Mail size={18} />
                                        <span>Mejl</span>
                                    </button>
                                </div>
                            </div>

                            <button className="create-package-btn" onClick={onConfirm}>
                                <Check size={20} />
                                Kreiraj Paket
                            </button>

                            <p className="terms-hint">
                                <Info size={14} />
                                Klikom na dugme kreirate nacrt paketa koji možete dalje uređivati ili poslati klijentu.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

        </div>
    );
};

export default Step6_ReviewConfirm;
