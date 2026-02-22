import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    ArrowLeft,
    Building2,
    MapPin,
    Bed,
    Star,
    Edit,
    Globe,
    ChevronRight,
    DollarSign,
    Users,
    Coffee,
    Image,
    FileText,
    Settings,
    Share2
} from 'lucide-react';
import { loadFromCloud } from '../utils/storageUtils';
import { getProxiedImageUrl } from '../utils/imageProxy';


// Types (should be shared from a types file)
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

const HotelDetail: React.FC = () => {
    const { hotelSlug } = useParams<{ hotelSlug: string }>();
    const navigate = useNavigate();
    const [hotel, setHotel] = useState<Hotel | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'overview' | 'rooms' | 'prices' | 'photos' | 'settings'>('overview');

    useEffect(() => {
        const loadHotel = async () => {
            setLoading(true);

            // Load from cloud or localStorage
            const { success, data } = await loadFromCloud('properties');
            let hotels: Hotel[] = [];

            // Helper to map DB data to Frontend structure
            const mapBackendToFrontendHotel = (dbHotel: any): Hotel => {
                // If it already matches the shape (legacy local data), return as is
                if (dbHotel.location && dbHotel.location.place && dbHotel.units) {
                    return dbHotel;
                }

                // Map Supabase/Solvex structure to Frontend Hotel interface
                return {
                    id: dbHotel.id,
                    name: dbHotel.name,
                    location: {
                        address: dbHotel.address?.addressLine || '',
                        place: dbHotel.address?.city || '',
                        lat: dbHotel.geoCoordinates?.latitude || 0,
                        lng: dbHotel.geoCoordinates?.longitude || 0
                    },
                    images: (dbHotel.images || []).map((img: any) => ({
                        ...img,
                        url: getProxiedImageUrl(img.url)
                    })),
                    amenities: dbHotel.propertyAmenities || [],
                    units: [], // We don't have units in properties table
                    commonItems: {
                        discount: [],
                        touristTax: [],
                        supplement: []
                    },
                    originalPropertyData: dbHotel
                };
            };

            if (success && data && data.length > 0) {
                hotels = data.map(mapBackendToFrontendHotel);
            } else {
                const saved = localStorage.getItem('olympic_hub_hotels');
                if (saved) {
                    const parsed = JSON.parse(saved);
                    hotels = parsed.map(mapBackendToFrontendHotel);
                }
            }

            // Find hotel by slug (converted from name)
            const foundHotel = hotels.find(h => {
                const slug = h.name.toLowerCase()
                    .replace(/\s+/g, '-')
                    .replace(/[^a-z0-9-]/g, '');
                return slug === hotelSlug || h.id.toString() === hotelSlug;
            });

            setHotel(foundHotel || null);
            setLoading(false);
        };

        loadHotel();
    }, [hotelSlug]);

    if (loading) {
        return (
            <div className="module-container fade-in" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '50vh' }}>
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 1. }}
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
                    <h2 style={{ color: 'var(--text-primary)', marginBottom: '16px' }}>Hotel nije pronađen</h2>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>
                        Hotel sa URL-om "{hotelSlug}" ne postoji u sistemu.
                    </p>
                    <button
                        className="btn-primary-action"
                        onClick={() => navigate('/production/hotels')}
                    >
                        <ArrowLeft size={18} /> Nazad na listu hotela
                    </button>
                </div>
            </div>
        );
    }

    const starRating = hotel.originalPropertyData?.starRating || 0;
    const isActive = hotel.originalPropertyData?.isActive || false;
    const propertyType = hotel.originalPropertyData?.propertyType || 'Hotel';

    const tabs = [
        { id: 'overview', label: 'Pregled', icon: <FileText size={16} /> },
        { id: 'rooms', label: 'Sobe', icon: <Bed size={16} /> },
        { id: 'prices', label: 'Cenovnik', icon: <DollarSign size={16} /> },
        { id: 'photos', label: 'Galerija', icon: <Image size={16} /> },
        { id: 'settings', label: 'Podešavanja', icon: <Settings size={16} /> },
    ];

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
                <span style={{ color: 'var(--accent)' }}>{hotel.name}</span>
            </div>

            {/* Header */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                marginBottom: '32px'
            }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '20px' }}>
                    <button
                        onClick={() => navigate('/production/hotels')}
                        className="btn-icon circle"
                    >
                        <ArrowLeft size={20} />
                    </button>

                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                            <h1 style={{ fontSize: '28px', fontWeight: '700', margin: 0 }}>{hotel.name}</h1>
                            {starRating > 0 && (
                                <div style={{ display: 'flex', gap: '2px' }}>
                                    {[...Array(starRating)].map((_, i) => (
                                        <Star key={i} size={18} fill="#fbbf24" strokeWidth={0} />
                                    ))}
                                </div>
                            )}
                            <span
                                style={{
                                    padding: '4px 12px',
                                    borderRadius: '20px',
                                    fontSize: '12px',
                                    fontWeight: '600',
                                    background: isActive ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                                    color: isActive ? '#10b981' : '#ef4444'
                                }}
                            >
                                {isActive ? 'Aktivan' : 'Neaktivan'}
                            </span>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', color: 'var(--text-secondary)' }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <MapPin size={14} /> {hotel.location.place}, {hotel.location.address}
                            </span>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <Building2 size={14} /> {propertyType}
                            </span>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <Bed size={14} /> {hotel.units.length} jedinica
                            </span>
                        </div>
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '12px' }}>
                    <button className="btn-glass" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Share2 size={18} /> Deli
                    </button>
                    <button className="btn-glass" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Globe size={18} /> Web Pregled
                    </button>
                    <button
                        className="btn-primary-action"
                        style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                        onClick={() => navigate(`/production/hotels/${hotelSlug}/edit`)}
                    >
                        <Edit size={18} /> Uredi
                    </button>
                </div>
            </div>

            {/* Hero Image */}
            {hotel.images && hotel.images.length > 0 && (
                <div style={{
                    borderRadius: '16px',
                    overflow: 'hidden',
                    marginBottom: '32px',
                    height: '300px',
                    background: `linear-gradient(to bottom, transparent 60%, rgba(0,0,0,0.7)), url(${hotel.images[0].url})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center'
                }}>
                </div>
            )}

            {/* Tabs */}
            <div style={{
                display: 'flex',
                gap: '4px',
                marginBottom: '32px',
                background: 'var(--bg-card)',
                padding: '4px',
                borderRadius: '12px',
                border: '1px solid var(--border)',
                width: 'fit-content'
            }}>
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            padding: '10px 20px',
                            border: 'none',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontWeight: '600',
                            fontSize: '14px',
                            background: activeTab === tab.id ? 'var(--accent)' : 'transparent',
                            color: activeTab === tab.id ? '#fff' : 'var(--text-secondary)',
                            transition: 'all 0.2s'
                        }}
                    >
                        {tab.icon} {tab.label}
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            {activeTab === 'overview' && (
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
                    {/* Main Content */}
                    <div>
                        {/* Quick Stats */}
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(4, 1fr)',
                            gap: '16px',
                            marginBottom: '24px'
                        }}>
                            {[
                                { label: 'Jedinice', value: hotel.units.length, icon: <Bed size={20} />, color: '#3b82f6' },
                                { label: 'Popusti', value: hotel.commonItems.discount.length, icon: <DollarSign size={20} />, color: '#10b981' },
                                { label: 'Dodaci', value: hotel.commonItems.supplement.length, icon: <Coffee size={20} />, color: '#f59e0b' },
                                { label: 'Porezi', value: hotel.commonItems.touristTax.length, icon: <FileText size={20} />, color: '#8b5cf6' },
                            ].map((stat, i) => (
                                <div
                                    key={i}
                                    style={{
                                        background: 'var(--bg-card)',
                                        border: '1px solid var(--border)',
                                        borderRadius: '12px',
                                        padding: '20px',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: '8px'
                                    }}
                                >
                                    <div style={{
                                        width: '40px',
                                        height: '40px',
                                        borderRadius: '10px',
                                        background: `${stat.color}20`,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: stat.color
                                    }}>
                                        {stat.icon}
                                    </div>
                                    <span style={{ fontSize: '24px', fontWeight: '700' }}>{stat.value}</span>
                                    <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{stat.label}</span>
                                </div>
                            ))}
                        </div>

                        {/* Description */}
                        <div style={{
                            background: 'var(--bg-card)',
                            border: '1px solid var(--border)',
                            borderRadius: '16px',
                            padding: '24px'
                        }}>
                            <h3 style={{ marginBottom: '16px' }}>Opis Objekta</h3>
                            <div
                                style={{ color: 'var(--text-secondary)', lineHeight: '1.7' }}
                                dangerouslySetInnerHTML={{
                                    __html: hotel.originalPropertyData?.content?.[0]?.longDescription ||
                                        '<p>Opis nije dostupan. Kliknite na "Uredi" da dodate opis.</p>'
                                }}
                            />
                        </div>
                    </div>

                    {/* Sidebar */}
                    <div>
                        {/* Location Card */}
                        <div style={{
                            background: 'var(--bg-card)',
                            border: '1px solid var(--border)',
                            borderRadius: '16px',
                            padding: '24px',
                            marginBottom: '16px'
                        }}>
                            <h3 style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <MapPin size={18} /> Lokacija
                            </h3>
                            <div style={{
                                background: '#1a1f2e',
                                borderRadius: '12px',
                                height: '150px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: 'var(--text-secondary)',
                                marginBottom: '16px'
                            }}>
                                Mapa dolazi uskoro
                            </div>
                            <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                                <p style={{ margin: '0 0 8px' }}><strong>Adresa:</strong> {hotel.location.address}</p>
                                <p style={{ margin: '0 0 8px' }}><strong>Mesto:</strong> {hotel.location.place}</p>
                                <p style={{ margin: 0 }}><strong>Koordinate:</strong> {hotel.location.lat.toFixed(4)}, {hotel.location.lng.toFixed(4)}</p>
                            </div>
                        </div>

                        {/* Amenities */}
                        <div style={{
                            background: 'var(--bg-card)',
                            border: '1px solid var(--border)',
                            borderRadius: '16px',
                            padding: '24px'
                        }}>
                            <h3 style={{ marginBottom: '16px' }}>Sadržaj</h3>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                {hotel.amenities.slice(0, 10).map((a, i) => (
                                    <span
                                        key={i}
                                        style={{
                                            padding: '6px 12px',
                                            background: 'rgba(59, 130, 246, 0.1)',
                                            color: '#3b82f6',
                                            borderRadius: '20px',
                                            fontSize: '12px',
                                            fontWeight: '500'
                                        }}
                                    >
                                        {a.name}
                                    </span>
                                ))}
                                {hotel.amenities.length === 0 && (
                                    <span style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
                                        Nema definisanog sadržaja
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'rooms' && (
                <div>
                    <h3 style={{ marginBottom: '20px' }}>Smeštajne Jedinice ({hotel.units.length})</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                        {hotel.units.map((unit, i) => (
                            <motion.div
                                key={unit.id || i}
                                className="module-card"
                                whileHover={{ y: -4 }}
                                style={{ cursor: 'pointer' }}
                            >
                                <div className="module-icon" style={{ background: 'linear-gradient(135deg, #3b82f6, #2563eb)' }}>
                                    <Bed size={24} />
                                </div>
                                <h4 style={{ margin: '12px 0 8px' }}>{unit.name}</h4>
                                <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>
                                    Tip: {unit.type}
                                </p>
                                <div style={{ display: 'flex', gap: '12px', marginTop: '12px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                                    <span><Users size={12} /> {unit.basicBeds} osn. + {unit.extraBeds} dod.</span>
                                </div>
                            </motion.div>
                        ))}
                        {hotel.units.length === 0 && (
                            <div style={{
                                gridColumn: '1 / -1',
                                textAlign: 'center',
                                padding: '40px',
                                color: 'var(--text-secondary)'
                            }}>
                                Nema definisanih jedinica. Kliknite na "Uredi" da dodate sobe.
                            </div>
                        )}
                    </div>
                </div>
            )}

            {activeTab === 'prices' && (
                <div style={{
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border)',
                    borderRadius: '16px',
                    padding: '40px 24px',
                    textAlign: 'center',
                    color: 'var(--text-secondary)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '20px'
                }}>
                    <div style={{
                        width: '80px',
                        height: '80px',
                        borderRadius: '24px',
                        background: 'rgba(139, 92, 246, 0.1)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#8b5cf6',
                        marginBottom: '8px'
                    }}>
                        <DollarSign size={40} />
                    </div>
                    <div>
                        <h3 style={{ marginBottom: '8px', color: 'var(--text-primary)' }}>Price AI Management</h3>
                        <p style={{ maxWidth: '400px', margin: '0 auto', fontSize: '14px', lineHeight: '1.6' }}>
                            Aktivirajte pametni asistent za upravljanje cenovnicima, analizu tržišta i automatsko predviđanje prihoda.
                        </p>
                    </div>
                    <button
                        className="btn-primary-action"
                        style={{ background: 'var(--gradient-purple)', border: 'none' }}
                        onClick={() => navigate(`/production/hotels/${hotelSlug}/prices`)}
                    >
                        Pristupi AI Cenovniku <ChevronRight size={18} />
                    </button>
                </div>
            )}

            {activeTab === 'photos' && (
                <div>
                    <h3 style={{ marginBottom: '20px' }}>Galerija ({hotel.images.length} fotografija)</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
                        {hotel.images.map((img, i) => (
                            <div
                                key={i}
                                style={{
                                    borderRadius: '12px',
                                    overflow: 'hidden',
                                    aspectRatio: '4/3'
                                }}
                            >
                                <img
                                    src={img.url}
                                    alt={`Photo ${i + 1}`}
                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                />
                            </div>
                        ))}
                        {hotel.images.length === 0 && (
                            <div style={{
                                gridColumn: '1 / -1',
                                textAlign: 'center',
                                padding: '40px',
                                color: 'var(--text-secondary)'
                            }}>
                                Nema fotografija. Kliknite na "Uredi" da dodate slike.
                            </div>
                        )}
                    </div>
                </div>
            )}

            {activeTab === 'settings' && (
                <div style={{
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border)',
                    borderRadius: '16px',
                    padding: '24px'
                }}>
                    <h3 style={{ marginBottom: '20px' }}>Podešavanja Objekta</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        <div>
                            <label style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px', display: 'block' }}>ID Objekta</label>
                            <input
                                type="text"
                                value={hotel.id.toString()}
                                readOnly
                                style={{
                                    width: '100%',
                                    padding: '12px',
                                    borderRadius: '8px',
                                    border: '1px solid var(--border)',
                                    background: 'var(--bg-main)',
                                    color: 'var(--text-primary)'
                                }}
                            />
                        </div>
                        <div>
                            <label style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px', display: 'block' }}>Status</label>
                            <select
                                style={{
                                    width: '100%',
                                    padding: '12px',
                                    borderRadius: '8px',
                                    border: '1px solid var(--border)',
                                    background: 'var(--bg-main)',
                                    color: 'var(--text-primary)'
                                }}
                            >
                                <option value="active">Aktivan</option>
                                <option value="inactive">Neaktivan</option>
                            </select>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default HotelDetail;
