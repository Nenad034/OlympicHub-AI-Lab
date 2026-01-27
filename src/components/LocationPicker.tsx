import React, { useState, useEffect } from 'react';
import { Globe, Navigation, Building2 } from 'lucide-react';
import { countries } from '../data/countries';

export interface LocationData {
    address: string;
    addressLine2?: string;
    city: string;
    postalCode: string;
    countryCode: string;
    stateProvince?: string;
    latitude: number;
    longitude: number;
    googlePlaceId?: string;
}

interface LocationPickerProps {
    data: LocationData;
    onChange: (data: LocationData) => void;
    searchQuery?: string; // Optional initial search query (e.g. hotel name)
}

const LocationPicker: React.FC<LocationPickerProps> = ({ data, onChange, searchQuery }) => {
    const [mapLink, setMapLink] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [autoSearchTerm, setAutoSearchTerm] = useState(searchQuery || '');

    // Google Maps Link Parser
    const parseMapLink = () => {
        if (!mapLink) return;

        // Pattern 1: @lat,lng
        const atMatch = mapLink.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
        if (atMatch) {
            updateCoordinates(parseFloat(atMatch[1]), parseFloat(atMatch[2]));
            return;
        }

        // Pattern 2: search/lat,lng or place/lat,lng
        const pathMatch = mapLink.match(/\/(-?\d+\.\d+),(-?\d+\.\d+)/);
        if (pathMatch) {
            updateCoordinates(parseFloat(pathMatch[1]), parseFloat(pathMatch[2]));
        }
    };

    const updateCoordinates = (lat: number, lng: number) => {
        onChange({ ...data, latitude: lat, longitude: lng });
    };

    // Auto-search logic using Nominatim (OpenStreetMap)
    // Auto-search logic using Nominatim (OpenStreetMap)
    const handleAutoSearch = async (shouldUpdateAddressFields: boolean) => {
        let query = '';

        if (shouldUpdateAddressFields && autoSearchTerm) {
            query = autoSearchTerm;
        } else {
            const countryName = countries.find(c => c.code === data.countryCode)?.name || '';
            query = [data.address, data.city, data.postalCode, countryName].filter(Boolean).join(', ');
        }

        if (!query) return;

        setIsSearching(true);
        try {
            // Request address details
            let response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1&addressdetails=1&accept-language=sr-Latn`);
            let results = await response.json();

            // Fallback logic
            if ((!results || results.length === 0) && !shouldUpdateAddressFields && data.city && data.countryCode) {
                const countryName = countries.find(c => c.code === data.countryCode)?.name || '';
                const fallbackQuery = `${data.city}, ${countryName}`;
                response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(fallbackQuery)}&limit=1&accept-language=sr-Latn`);
                results = await response.json();
            }

            if (results && results.length > 0) {
                const result = results[0];
                const lat = parseFloat(result.lat);
                const lng = parseFloat(result.lon);

                const updates: any = {
                    latitude: lat,
                    longitude: lng
                };

                // Only update address text fields if searching by term (Smart Search)
                if (shouldUpdateAddressFields && result.address) {
                    const addr = result.address;
                    const city = addr.city || addr.town || addr.village || addr.municipality || '';
                    const road = addr.road || addr.pedestrian || addr.street || '';
                    const houseNumber = addr.house_number || '';
                    const fullAddress = houseNumber ? `${road} ${houseNumber}` : road;
                    const postalCode = addr.postcode || '';
                    const countryCode = (addr.country_code || '').toUpperCase();

                    if (fullAddress) updates.address = fullAddress;
                    if (city) updates.city = city;
                    if (postalCode) updates.postalCode = postalCode;
                    if (countryCode) updates.countryCode = countryCode;
                }

                onChange({
                    ...data,
                    ...updates
                });
            }
        } catch (error) {
            console.error("Geocoding error:", error);
        } finally {
            setIsSearching(false);
        }
    };

    // Effect for Smart Search Term (Updates Map AND Address Fields)
    useEffect(() => {
        const timer = setTimeout(() => {
            if (autoSearchTerm) {
                handleAutoSearch(true);
            }
        }, 1500);
        return () => clearTimeout(timer);
    }, [autoSearchTerm]);

    // Effect for Manual Address Fields (Updates Map ONLY)
    useEffect(() => {
        const timer = setTimeout(() => {
            // Only trigger if NO autoSearchTerm is active (to avoid conflict)
            if (!autoSearchTerm) {
                handleAutoSearch(false);
            }
        }, 1500);
        return () => clearTimeout(timer);
    }, [data.city, data.countryCode, data.address, data.postalCode]);

    return (
        <div className="location-picker">
            {/* Automatic Search Section */}
            <div className="form-section">
                <h3 className="form-section-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Globe size={20} className="text-accent" /> Pametna Lokacija
                </h3>

                <div className="form-group">
                    <label className="form-label">Naziv Objekta / Pojam za pretragu</label>
                    <div style={{ position: 'relative' }}>
                        <Building2 size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                        <input
                            type="text"
                            className="form-input"
                            style={{ paddingLeft: '36px', width: '100%' }}
                            placeholder="Započnite kucanje naziva hotela..."
                            value={autoSearchTerm}
                            onChange={(e) => setAutoSearchTerm(e.target.value)}
                        />
                        {isSearching && (
                            <div style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)' }}>
                                <div className="spinner" style={{ width: '16px', height: '16px', border: '2px solid var(--border)', borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
                            </div>
                        )}
                    </div>
                    <small style={{ color: 'var(--text-secondary)', marginTop: '4px' }}>
                        Mapa će se automatski ažurirati dok kucate naziv ili menjate grad.
                    </small>
                </div>
            </div>

            {/* Map Preview - Fixed Conditional Rendering */}
            {(data.latitude !== 0 || data.longitude !== 0) && (
                <div style={{ marginBottom: '32px', borderRadius: '16px', overflow: 'hidden', border: '1px solid var(--border)', height: '300px', background: 'var(--bg-card)', position: 'relative' }}>
                    <iframe
                        width="100%"
                        height="100%"
                        frameBorder="0"
                        scrolling="no"
                        marginHeight={0}
                        marginWidth={0}
                        title="Location Preview"
                        src={`https://maps.google.com/maps?q=${data.latitude},${data.longitude}&z=15&output=embed`}
                        style={{ filter: 'grayscale(0.2) contrast(1.1)' }}
                    ></iframe>
                    <div style={{ position: 'absolute', bottom: '12px', right: '12px', background: 'var(--bg-card)', padding: '6px 12px', borderRadius: '8px', border: '1px solid var(--border)', fontSize: '11px', fontWeight: 'bold' }}>
                        <Navigation size={10} style={{ marginRight: '4px', verticalAlign: 'middle' }} />
                        {data.latitude?.toFixed(6)}, {data.longitude?.toFixed(6)}
                    </div>
                </div>
            )}

            {/* Address Fields */}
            <div className="form-section">
                <h3 className="form-section-title">Adresa i Detalji</h3>
                <div className="form-grid">
                    {/* Country - Custom Dropdown */}
                    <div className="form-group">
                        <label className="form-label required">Država</label>
                        <select
                            className="form-select"
                            value={data.countryCode}
                            onChange={(e) => onChange({ ...data, countryCode: e.target.value })}
                        >
                            <option value="">Odaberite državu...</option>
                            {countries.map(c => (
                                <option key={c.code} value={c.code}>{c.name}</option>
                            ))}
                        </select>
                    </div>

                    <div className="form-group">
                        <label className="form-label required">Grad</label>
                        <input
                            type="text"
                            className="form-input"
                            value={data.city}
                            onChange={(e) => onChange({ ...data, city: e.target.value })}
                            placeholder="Unesite grad..."
                        />
                    </div>

                    <div className="form-group span-2">
                        <label className="form-label required">Ulica i Broj</label>
                        <input
                            type="text"
                            className="form-input"
                            value={data.address}
                            onChange={(e) => onChange({ ...data, address: e.target.value })}
                            placeholder="npr. Knez Mihailova 12"
                        />
                    </div>

                    <div className="form-group span-2">
                        <label className="form-label">Dodatak Adrese</label>
                        <input
                            type="text"
                            className="form-input"
                            value={data.addressLine2 || ''}
                            onChange={(e) => onChange({ ...data, addressLine2: e.target.value })}
                            placeholder="Sprat, stan, zgrada..."
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label required">Poštanski Broj</label>
                        <input
                            type="text"
                            className="form-input"
                            value={data.postalCode}
                            onChange={(e) => onChange({ ...data, postalCode: e.target.value })}
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Regija / Pokrajina</label>
                        <input
                            type="text"
                            className="form-input"
                            value={data.stateProvince || ''}
                            onChange={(e) => onChange({ ...data, stateProvince: e.target.value })}
                        />
                    </div>
                </div>
            </div>

            {/* Google Link Backup */}
            <div className="form-section" style={{ borderTop: '1px solid var(--border)', paddingTop: '24px' }}>
                <div className="form-group">
                    <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>Ručni Link (Backup)</span>
                        <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 'normal' }}>Ako automatska pretraga ne nađe tačnu lokaciju</span>
                    </label>
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <input
                            type="text"
                            className="form-input"
                            placeholder="Nalepite Google Maps link..."
                            value={mapLink}
                            onChange={(e) => setMapLink(e.target.value)}
                            style={{ flex: 1 }}
                        />
                        <button type="button" className="btn-secondary" onClick={parseMapLink}>Učitaj</button>
                    </div>
                </div>
            </div>

            <style>{`
                @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }

                .form-section-title {
                    font-size: 14px;
                    font-weight: 700;
                    color: #fff;
                    margin-bottom: 20px;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }

                .form-group {
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                    margin-bottom: 20px;
                }

                .form-label {
                    font-size: 12px;
                    color: var(--text-secondary);
                    font-weight: 600;
                    margin-left: 8px;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }

                .form-input, .form-select {
                    width: 100%;
                    background: rgba(255, 255, 255, 0.03);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    padding: 16px 24px;
                    border-radius: 100px;
                    color: var(--text-primary);
                    outline: none;
                    transition: 0.3s;
                    font-size: 14px;
                }

                .form-input:focus, .form-select:focus {
                    border-color: var(--accent);
                    background: rgba(0, 92, 197, 0.1);
                    box-shadow: 0 0 0 4px rgba(0, 92, 197, 0.1);
                }

                .form-select {
                    appearance: none;
                    background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23ffffff' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e");
                    background-repeat: no-repeat;
                    background-position: right 16px center;
                    background-size: 16px;
                }

                .btn-secondary {
                    background: rgba(255, 255, 255, 0.05);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    color: var(--text-primary);
                    padding: 0 24px;
                    border-radius: 100px;
                    cursor: pointer;
                    font-weight: 600;
                    font-size: 13px;
                    transition: 0.3s;
                    white-space: nowrap;
                }

                .btn-secondary:hover {
                    background: rgba(255, 255, 255, 0.1);
                    transform: translateY(-1px);
                }
            `}</style>
        </div>
    );
};

export default LocationPicker;
