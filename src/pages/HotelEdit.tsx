import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    ArrowLeft,
    Save,
    X,
    Building2,
    MapPin,
    Star,
    ChevronRight,
    Plus,
    Trash2,
    Upload,
    Globe,
    AlertCircle
} from 'lucide-react';
import { loadFromCloud, saveToCloud, updateLocalHotelCache } from '../utils/storageUtils';
import { useToast } from '../components/ui/Toast';

// Hotel type
interface Hotel {
    id: number | string;
    name: string;
    location: {
        address: string;
        lat: number;
        lng: number;
        place: string;
    };
    images: { url: string }[];
    amenities: { name: string; values: any }[];
    units: any[];
    commonItems: {
        discount: any[];
        touristTax: any[];
        supplement: any[];
    };
    originalPropertyData?: any;
}

// Form state type
interface HotelFormData {
    name: string;
    propertyType: string;
    starRating: number;
    isActive: boolean;
    address: {
        addressLine1: string;
        city: string;
        postalCode: string;
        countryCode: string;
    };
    geoCoordinates: {
        latitude: number;
        longitude: number;
    };
    shortDescription: string;
    longDescription: string;
}

const HotelEdit: React.FC = () => {
    const { hotelSlug } = useParams<{ hotelSlug: string }>();
    const navigate = useNavigate();
    const { success, error } = useToast();

    const [hotel, setHotel] = useState<Hotel | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState<HotelFormData>({
        name: '',
        propertyType: 'Hotel',
        starRating: 4,
        isActive: false,
        address: {
            addressLine1: '',
            city: '',
            postalCode: '',
            countryCode: 'RS',
        },
        geoCoordinates: {
            latitude: 0,
            longitude: 0,
        },
        shortDescription: '',
        longDescription: '',
    });

    // Load hotel data
    useEffect(() => {
        const loadHotel = async () => {
            setLoading(true);

            const { success: loadSuccess, data } = await loadFromCloud('properties');
            let hotels: Hotel[] = [];

            if (loadSuccess && data && data.length > 0) {
                hotels = data as Hotel[];
            } else {
                const saved = localStorage.getItem('olympic_hub_hotels');
                if (saved) hotels = JSON.parse(saved);
            }

            const foundHotel = hotels.find(h => {
                const slug = h.name.toLowerCase()
                    .replace(/\s+/g, '-')
                    .replace(/[^a-z0-9-]/g, '');
                return slug === hotelSlug || h.id.toString() === hotelSlug;
            });

            if (foundHotel) {
                setHotel(foundHotel);
                setFormData({
                    name: foundHotel.name,
                    propertyType: foundHotel.originalPropertyData?.propertyType || 'Hotel',
                    starRating: foundHotel.originalPropertyData?.starRating || 4,
                    isActive: foundHotel.originalPropertyData?.isActive || false,
                    address: {
                        addressLine1: foundHotel.location.address,
                        city: foundHotel.location.place,
                        postalCode: foundHotel.originalPropertyData?.address?.postalCode || '',
                        countryCode: foundHotel.originalPropertyData?.address?.countryCode || 'RS',
                    },
                    geoCoordinates: {
                        latitude: foundHotel.location.lat,
                        longitude: foundHotel.location.lng,
                    },
                    shortDescription: foundHotel.originalPropertyData?.content?.[0]?.shortDescription || '',
                    longDescription: foundHotel.originalPropertyData?.content?.[0]?.longDescription || '',
                });
            }

            setLoading(false);
        };

        loadHotel();
    }, [hotelSlug]);

    const handleInputChange = (field: string, value: any) => {
        setFormData(prev => ({
            ...prev,
            [field]: value,
        }));
    };

    const handleAddressChange = (field: string, value: string) => {
        setFormData(prev => ({
            ...prev,
            address: {
                ...prev.address,
                [field]: value,
            },
        }));
    };

    const handleSave = async () => {
        if (!hotel) return;

        setSaving(true);

        try {
            // Build updated hotel object
            const updatedHotel: Hotel = {
                ...hotel,
                name: formData.name,
                location: {
                    ...hotel.location,
                    address: formData.address.addressLine1,
                    place: formData.address.city,
                    lat: formData.geoCoordinates.latitude,
                    lng: formData.geoCoordinates.longitude,
                },
                originalPropertyData: {
                    ...hotel.originalPropertyData,
                    propertyType: formData.propertyType,
                    starRating: formData.starRating,
                    isActive: formData.isActive,
                    address: formData.address,
                    geoCoordinates: {
                        latitude: formData.geoCoordinates.latitude,
                        longitude: formData.geoCoordinates.longitude,
                        coordinateSource: 'MAP_PIN',
                    },
                    content: [{
                        languageCode: 'sr',
                        officialName: formData.name,
                        displayName: formData.name,
                        shortDescription: formData.shortDescription,
                        longDescription: formData.longDescription,
                    }],
                },
            };

            // Load all hotels
            const { data: allHotels } = await loadFromCloud('properties');
            let hotels: Hotel[] = allHotels as Hotel[] || [];

            // Update the specific hotel
            const updatedList = hotels.map(h =>
                h.id === hotel.id ? updatedHotel : h
            );

            // Save to cloud
            await saveToCloud('properties', updatedList);
            updateLocalHotelCache(updatedList);

            success('Hotel sačuvan!', 'Promene su uspešno sačuvane.');

            // Navigate back to hotel detail
            const newSlug = formData.name.toLowerCase()
                .replace(/\s+/g, '-')
                .replace(/[^a-z0-9-]/g, '');
            navigate(`/production/hotels/${newSlug}`);

        } catch (err) {
            error('Greška', 'Nije moguće sačuvati promene.');
            console.error('Save error:', err);
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="module-container fade-in" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '50vh' }}>
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 1 }}
                    style={{ color: 'var(--accent)' }}
                >
                    <Building2 size={48} />
                </motion.div>
            </div>
        );
    }

    if (!hotel) {
        return (
            <div className="module-container fade-in">
                <div style={{ textAlign: 'center', padding: '60px' }}>
                    <AlertCircle size={64} style={{ color: '#ef4444', marginBottom: '16px' }} />
                    <h2>Hotel nije pronađen</h2>
                    <button
                        className="btn-primary-action"
                        onClick={() => navigate('/production/hotels')}
                        style={{ marginTop: '24px' }}
                    >
                        <ArrowLeft size={18} /> Nazad na listu
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="module-container fade-in">
            {/* Breadcrumb */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '24px',
                fontSize: '14px',
                color: 'var(--text-secondary)'
            }}>
                <Link to="/production" style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>
                    Produkcija
                </Link>
                <ChevronRight size={14} />
                <Link to="/production/hotels" style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>
                    Smeštaj
                </Link>
                <ChevronRight size={14} />
                <Link
                    to={`/production/hotels/${hotelSlug}`}
                    style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}
                >
                    {hotel.name}
                </Link>
                <ChevronRight size={14} />
                <span style={{ color: 'var(--accent)' }}>Uređivanje</span>
            </div>

            {/* Header */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '32px'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <button
                        onClick={() => navigate(`/production/hotels/${hotelSlug}`)}
                        className="btn-icon circle"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h1 style={{ fontSize: '28px', fontWeight: '700', margin: 0 }}>
                            Uređivanje: {hotel.name}
                        </h1>
                        <p style={{ color: 'var(--text-secondary)', marginTop: '4px' }}>
                            Izmenite podatke o hotelu
                        </p>
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '12px' }}>
                    <button
                        className="btn-glass"
                        onClick={() => navigate(`/production/hotels/${hotelSlug}`)}
                    >
                        <X size={18} /> Otkaži
                    </button>
                    <button
                        className="btn-primary-action"
                        onClick={handleSave}
                        disabled={saving}
                    >
                        <Save size={18} /> {saving ? 'Čuvanje...' : 'Sačuvaj'}
                    </button>
                </div>
            </div>

            {/* Form */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
                {/* Main Form */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    {/* Basic Info */}
                    <div style={{
                        background: 'var(--bg-card)',
                        border: '1px solid var(--border)',
                        borderRadius: '16px',
                        padding: '24px'
                    }}>
                        <h3 style={{ marginBottom: '20px' }}>Osnovne Informacije</h3>

                        <div style={{ display: 'grid', gap: '16px' }}>
                            <div>
                                <label style={{ fontSize: '13px', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                                    Naziv Hotela *
                                </label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => handleInputChange('name', e.target.value)}
                                    style={{
                                        width: '100%',
                                        padding: '12px 16px',
                                        borderRadius: '10px',
                                        border: '1px solid var(--border)',
                                        background: 'var(--bg-main)',
                                        color: 'var(--text-primary)',
                                        fontSize: '14px',
                                    }}
                                    placeholder="Unesite naziv hotela"
                                />
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                <div>
                                    <label style={{ fontSize: '13px', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                                        Tip Objekta
                                    </label>
                                    <select
                                        value={formData.propertyType}
                                        onChange={(e) => handleInputChange('propertyType', e.target.value)}
                                        style={{
                                            width: '100%',
                                            padding: '12px 16px',
                                            borderRadius: '10px',
                                            border: '1px solid var(--border)',
                                            background: 'var(--bg-main)',
                                            color: 'var(--text-primary)',
                                            fontSize: '14px',
                                        }}
                                    >
                                        <option value="Hotel">Hotel</option>
                                        <option value="Apartment">Apartman</option>
                                        <option value="Villa">Vila</option>
                                        <option value="Resort">Rizort</option>
                                        <option value="Hostel">Hostel</option>
                                        <option value="Pension">Pansion</option>
                                    </select>
                                </div>

                                <div>
                                    <label style={{ fontSize: '13px', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                                        Broj Zvezdica
                                    </label>
                                    <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                                        {[1, 2, 3, 4, 5].map(star => (
                                            <button
                                                key={star}
                                                onClick={() => handleInputChange('starRating', star)}
                                                style={{
                                                    background: star <= formData.starRating ? '#fbbf24' : 'var(--bg-main)',
                                                    border: '1px solid var(--border)',
                                                    borderRadius: '8px',
                                                    padding: '8px',
                                                    cursor: 'pointer',
                                                }}
                                            >
                                                <Star
                                                    size={20}
                                                    fill={star <= formData.starRating ? '#fbbf24' : 'transparent'}
                                                    color={star <= formData.starRating ? '#fbbf24' : 'var(--text-secondary)'}
                                                />
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '12px',
                                    cursor: 'pointer',
                                    padding: '12px',
                                    background: formData.isActive ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                                    borderRadius: '10px',
                                    border: `1px solid ${formData.isActive ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
                                }}>
                                    <input
                                        type="checkbox"
                                        checked={formData.isActive}
                                        onChange={(e) => handleInputChange('isActive', e.target.checked)}
                                        style={{ width: '20px', height: '20px' }}
                                    />
                                    <span style={{ fontWeight: '600', color: formData.isActive ? '#10b981' : '#ef4444' }}>
                                        {formData.isActive ? 'Hotel je Aktivan' : 'Hotel je Neaktivan'}
                                    </span>
                                </label>
                            </div>
                        </div>
                    </div>

                    {/* Address */}
                    <div style={{
                        background: 'var(--bg-card)',
                        border: '1px solid var(--border)',
                        borderRadius: '16px',
                        padding: '24px'
                    }}>
                        <h3 style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <MapPin size={20} /> Adresa i Lokacija
                        </h3>

                        <div style={{ display: 'grid', gap: '16px' }}>
                            <div>
                                <label style={{ fontSize: '13px', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                                    Adresa
                                </label>
                                <input
                                    type="text"
                                    value={formData.address.addressLine1}
                                    onChange={(e) => handleAddressChange('addressLine1', e.target.value)}
                                    style={{
                                        width: '100%',
                                        padding: '12px 16px',
                                        borderRadius: '10px',
                                        border: '1px solid var(--border)',
                                        background: 'var(--bg-main)',
                                        color: 'var(--text-primary)',
                                        fontSize: '14px',
                                    }}
                                    placeholder="Ulica i broj"
                                />
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '16px' }}>
                                <div>
                                    <label style={{ fontSize: '13px', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                                        Grad
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.address.city}
                                        onChange={(e) => handleAddressChange('city', e.target.value)}
                                        style={{
                                            width: '100%',
                                            padding: '12px 16px',
                                            borderRadius: '10px',
                                            border: '1px solid var(--border)',
                                            background: 'var(--bg-main)',
                                            color: 'var(--text-primary)',
                                            fontSize: '14px',
                                        }}
                                    />
                                </div>
                                <div>
                                    <label style={{ fontSize: '13px', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                                        Poštanski Broj
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.address.postalCode}
                                        onChange={(e) => handleAddressChange('postalCode', e.target.value)}
                                        style={{
                                            width: '100%',
                                            padding: '12px 16px',
                                            borderRadius: '10px',
                                            border: '1px solid var(--border)',
                                            background: 'var(--bg-main)',
                                            color: 'var(--text-primary)',
                                            fontSize: '14px',
                                        }}
                                    />
                                </div>
                                <div>
                                    <label style={{ fontSize: '13px', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                                        Država
                                    </label>
                                    <select
                                        value={formData.address.countryCode}
                                        onChange={(e) => handleAddressChange('countryCode', e.target.value)}
                                        style={{
                                            width: '100%',
                                            padding: '12px 16px',
                                            borderRadius: '10px',
                                            border: '1px solid var(--border)',
                                            background: 'var(--bg-main)',
                                            color: 'var(--text-primary)',
                                            fontSize: '14px',
                                        }}
                                    >
                                        <option value="RS">Srbija</option>
                                        <option value="ME">Crna Gora</option>
                                        <option value="HR">Hrvatska</option>
                                        <option value="BA">BiH</option>
                                        <option value="SI">Slovenija</option>
                                        <option value="AT">Austrija</option>
                                        <option value="GR">Grčka</option>
                                        <option value="TR">Turska</option>
                                        <option value="EG">Egipat</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Description */}
                    <div style={{
                        background: 'var(--bg-card)',
                        border: '1px solid var(--border)',
                        borderRadius: '16px',
                        padding: '24px'
                    }}>
                        <h3 style={{ marginBottom: '20px' }}>Opis</h3>

                        <div style={{ display: 'grid', gap: '16px' }}>
                            <div>
                                <label style={{ fontSize: '13px', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                                    Kratak Opis
                                </label>
                                <textarea
                                    value={formData.shortDescription}
                                    onChange={(e) => handleInputChange('shortDescription', e.target.value)}
                                    rows={3}
                                    style={{
                                        width: '100%',
                                        padding: '12px 16px',
                                        borderRadius: '10px',
                                        border: '1px solid var(--border)',
                                        background: 'var(--bg-main)',
                                        color: 'var(--text-primary)',
                                        fontSize: '14px',
                                        resize: 'vertical',
                                    }}
                                    placeholder="Kratak opis za pretrage i listinge"
                                />
                            </div>

                            <div>
                                <label style={{ fontSize: '13px', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                                    Detaljan Opis (HTML podržan)
                                </label>
                                <textarea
                                    value={formData.longDescription}
                                    onChange={(e) => handleInputChange('longDescription', e.target.value)}
                                    rows={8}
                                    style={{
                                        width: '100%',
                                        padding: '12px 16px',
                                        borderRadius: '10px',
                                        border: '1px solid var(--border)',
                                        background: 'var(--bg-main)',
                                        color: 'var(--text-primary)',
                                        fontSize: '14px',
                                        resize: 'vertical',
                                        fontFamily: 'monospace',
                                    }}
                                    placeholder="<p>Detaljan opis hotela...</p>"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Sidebar */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    {/* Quick Actions */}
                    <div style={{
                        background: 'var(--bg-card)',
                        border: '1px solid var(--border)',
                        borderRadius: '16px',
                        padding: '24px'
                    }}>
                        <h3 style={{ marginBottom: '16px' }}>Brze Akcije</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <button className="btn-glass" style={{ justifyContent: 'flex-start', width: '100%' }}>
                                <Upload size={16} /> Dodaj Slike
                            </button>
                            <button className="btn-glass" style={{ justifyContent: 'flex-start', width: '100%' }}>
                                <Plus size={16} /> Dodaj Sobe
                            </button>
                            <button className="btn-glass" style={{ justifyContent: 'flex-start', width: '100%' }}>
                                <Globe size={16} /> Web Pregled
                            </button>
                        </div>
                    </div>

                    {/* Info */}
                    <div style={{
                        background: 'var(--bg-card)',
                        border: '1px solid var(--border)',
                        borderRadius: '16px',
                        padding: '24px'
                    }}>
                        <h3 style={{ marginBottom: '16px' }}>Informacije</h3>
                        <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                            <p><strong>ID:</strong> {hotel.id}</p>
                            <p><strong>Jedinice:</strong> {hotel.units.length}</p>
                            <p><strong>Slike:</strong> {hotel.images.length}</p>
                        </div>
                    </div>

                    {/* Danger Zone */}
                    <div style={{
                        background: 'rgba(239, 68, 68, 0.05)',
                        border: '1px solid rgba(239, 68, 68, 0.2)',
                        borderRadius: '16px',
                        padding: '24px'
                    }}>
                        <h3 style={{ marginBottom: '16px', color: '#ef4444' }}>Opasna Zona</h3>
                        <button
                            className="btn-glass"
                            style={{
                                justifyContent: 'flex-start',
                                width: '100%',
                                borderColor: 'rgba(239, 68, 68, 0.3)',
                                color: '#ef4444'
                            }}
                        >
                            <Trash2 size={16} /> Obriši Hotel
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default HotelEdit;
