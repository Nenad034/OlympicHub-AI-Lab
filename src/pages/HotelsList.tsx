import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    ArrowLeft,
    Building2,
    Plus,
    MapPin,
    Bed,
    Search,
    LayoutGrid,
    List,
    Star,
    Tag,
    Power,
    ChevronRight,
    Globe,
    Download,
    RefreshCw,
    CloudCheck
} from 'lucide-react';
import { loadFromCloud, saveToCloud } from '../utils/storageUtils';
import { sanitizeInput } from '../utils/securityUtils';
import { getProxiedImageUrl } from '../utils/imageProxy';

// Types
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

// Helper to create URL-friendly slug
const createSlug = (name: string): string => {
    return name.toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '');
};

const HotelsList: React.FC = () => {
    const navigate = useNavigate();
    const [hotels, setHotels] = useState<Hotel[]>([]);
    const [displayType, setDisplayType] = useState<'grid' | 'list'>('grid');
    const [searchQuery, setSearchQuery] = useState('');
    const [isSyncing, setIsSyncing] = useState(false);
    const [loading, setLoading] = useState(true);



    // Helper to map DB data to Frontend structure
    const mapBackendToFrontendHotel = (dbHotel: any): Hotel => {
        const rawData = dbHotel.originalPropertyData || dbHotel;

        let cleanStars = 0;
        const starSource = rawData.starRating || rawData.stars || rawData.Stars || 0;

        if (starSource) {
            if (typeof starSource === 'number') {
                cleanStars = Math.round(starSource);
            } else {
                const digits = String(starSource).match(/\d+/);
                if (digits) cleanStars = parseInt(digits[0]);
            }
        }

        if (cleanStars === 0 && (rawData.name || dbHotel.name)) {
            const nameToSearch = rawData.name || dbHotel.name || "";
            const nameMatch = nameToSearch.match(/(\d)\s*\*+/);
            if (nameMatch) {
                cleanStars = parseInt(nameMatch[1]);
            }
        }

        cleanStars = isNaN(cleanStars) ? 0 : cleanStars;

        return {
            id: dbHotel.id || rawData.id,
            name: rawData.name || dbHotel.name, // Keep raw name for display here, or use unify if imported
            location: {
                address: rawData.address?.addressLine || '',
                place: rawData.address?.city || '',
                lat: rawData.geoCoordinates?.latitude || 0,
                lng: rawData.geoCoordinates?.longitude || 0
            },
            images: (rawData.images || []).map((img: any) => ({
                ...img,
                url: getProxiedImageUrl(img.url)
            })),
            amenities: rawData.propertyAmenities || [],
            units: Array.isArray(rawData.units) ? rawData.units : [],
            commonItems: rawData.commonItems || {
                discount: [],
                touristTax: [],
                supplement: []
            },
            originalPropertyData: { ...rawData, starRating: cleanStars }
        };
    };

    // Load hotels
    useEffect(() => {
        const loadHotels = async () => {
            setLoading(true);
            try {
                const { success, data } = await loadFromCloud('properties');

                if (success && data && data.length > 0) {
                    const mapped = data.map(mapBackendToFrontendHotel);
                    setHotels(mapped);
                } else {
                    const saved = localStorage.getItem('olympic_hub_hotels');
                    if (saved) {
                        const parsed = JSON.parse(saved);
                        const mapped = parsed.map(mapBackendToFrontendHotel);
                        setHotels(mapped);
                    }
                }
            } catch (err) {
                console.error("Failed to load hotels", err);
            } finally {
                setLoading(false);
            }
        };
        loadHotels();
    }, []);

    const filteredHotels = hotels.filter(h =>
        h.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        h.location.place.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const toggleStatus = async (e: React.MouseEvent, hotel: Hotel) => {
        e.stopPropagation();
        e.preventDefault();

        const currentData = hotel.originalPropertyData || {};
        const newStatus = !currentData.isActive;
        const updatedData = { ...currentData, isActive: newStatus };
        const updatedHotel = { ...hotel, originalPropertyData: updatedData };
        const updatedList = hotels.map(h => h.id === hotel.id ? updatedHotel : h);

        setHotels(updatedList);
        setIsSyncing(true);
        await saveToCloud('properties', updatedList);
        localStorage.setItem('olympic_hub_hotels', JSON.stringify(updatedList));
        setTimeout(() => setIsSyncing(false), 500);
    };

    const handleHotelClick = (hotel: Hotel) => {
        const slug = createSlug(hotel.name);
        navigate(`/production/hotels/${slug}`);
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

    return (
        <div className="module-container fade-in">
            {/* Breadcrumb */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '16px',
                fontSize: '14px',
                color: 'var(--text-secondary)'
            }}>
                <Link to="/production" style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>
                    Produkcija
                </Link>
                <ChevronRight size={14} />
                <span style={{ color: 'var(--accent)' }}>Smeštaj</span>
            </div>

            {/* Header */}
            <div className="top-section-bar">
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <button onClick={() => navigate('/production')} className="btn-icon circle">
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <h1 style={{ fontSize: '32px', fontWeight: '700', margin: 0 }}>Baza Smeštaja</h1>
                            {isSyncing ? (
                                <div className="sync-badge syncing">
                                    <RefreshCw size={14} className="spin" /> Syncing...
                                </div>
                            ) : (
                                <div className="sync-badge synced">
                                    <CloudCheck size={14} /> Cloud Active
                                </div>
                            )}
                        </div>
                        <p className="subtitle">Upravljanje hotelima i smeštajnim objektima</p>
                    </div>
                </div>

                <style>{`
          .sync-badge { display: flex; align-items: center; gap: 6px; padding: 4px 10px; border-radius: 20px; font-size: 11px; font-weight: 600; }
          .sync-badge.syncing { background: rgba(59, 130, 246, 0.1); color: #3b82f6; }
          .sync-badge.synced { background: rgba(16, 185, 129, 0.1); color: #10b981; }
          @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
          .spin { animation: spin 2s linear infinite; }
        `}</style>

                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    {/* View Toggle */}
                    <div style={{ display: 'flex', background: 'var(--bg-card)', padding: '4px', borderRadius: '12px', border: '1px solid var(--border)' }}>
                        <button
                            onClick={() => setDisplayType('grid')}
                            style={{
                                background: displayType === 'grid' ? 'var(--accent)' : 'transparent',
                                color: displayType === 'grid' ? '#fff' : 'var(--text-secondary)',
                                border: 'none',
                                borderRadius: '8px',
                                padding: '6px',
                                cursor: 'pointer',
                                display: 'flex'
                            }}
                        >
                            <LayoutGrid size={18} />
                        </button>
                        <button
                            onClick={() => setDisplayType('list')}
                            style={{
                                background: displayType === 'list' ? 'var(--accent)' : 'transparent',
                                color: displayType === 'list' ? '#fff' : 'var(--text-secondary)',
                                border: 'none',
                                borderRadius: '8px',
                                padding: '6px',
                                cursor: 'pointer',
                                display: 'flex'
                            }}
                        >
                            <List size={18} />
                        </button>
                    </div>

                    {/* Search */}
                    <div className="search-bar">
                        <Search size={18} />
                        <input
                            type="text"
                            placeholder="Pretraži objekte..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(sanitizeInput(e.target.value))}
                        />
                    </div>

                    <button className="btn-primary-action" onClick={() => navigate('/production/hotels/new')}>
                        <Plus size={18} /> Kreiraj Objekat
                    </button>
                    <button className="btn-secondary">
                        <Download size={18} /> Import
                    </button>
                </div>
            </div>

            {/* Hotels Grid */}
            {displayType === 'grid' ? (
                <div className="dashboard-grid" style={{ marginTop: '32px' }}>
                    {filteredHotels.map(h => (
                        <motion.div
                            key={h.id}
                            className="module-card"
                            whileHover={{ y: -4, scale: 1.02 }}
                            onClick={() => handleHotelClick(h)}
                            style={{ cursor: 'pointer', position: 'relative' }}
                        >
                            {/* Status Toggle */}
                            <div
                                style={{ position: 'absolute', top: '12px', right: '12px', zIndex: 10, cursor: 'pointer' }}
                                onClick={(e) => toggleStatus(e, h)}
                                title={h.originalPropertyData?.isActive ? 'Deaktiviraj Objekat' : 'Aktiviraj Objekat'}
                            >
                                {h.originalPropertyData?.isActive ? (
                                    <div style={{ background: '#dcfce7', padding: '6px', borderRadius: '50%', display: 'flex', boxShadow: '0 2px 5px rgba(0,0,0,0.1)' }}>
                                        <Power size={20} color="#16a34a" />
                                    </div>
                                ) : (
                                    <div style={{ background: '#fee2e2', padding: '6px', borderRadius: '50%', display: 'flex', boxShadow: '0 2px 5px rgba(0,0,0,0.1)' }}>
                                        <Power size={20} color="#dc2626" />
                                    </div>
                                )}
                            </div>

                            {/* Icon */}
                            <div className="module-icon" style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}>
                                <Building2 size={28} />
                            </div>

                            {/* Title & Stars */}
                            <h3 className="module-title">{h.name}</h3>
                            {h.originalPropertyData?.starRating ? (
                                <div style={{ display: 'flex', gap: '2px', marginBottom: '8px', alignItems: 'center' }}>
                                    {[...Array(h.originalPropertyData.starRating)].map((_, i) => (
                                        <Star key={i} size={14} fill="#fbbf24" strokeWidth={0} />
                                    ))}
                                </div>
                            ) : null}

                            {/* Location */}
                            <p className="module-desc">
                                <MapPin size={14} style={{ display: 'inline', marginRight: '6px', verticalAlign: 'middle' }} />
                                {h.location.place}, {h.location.address}
                            </p>

                            {/* Badges */}
                            <div style={{ marginTop: '16px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                <div className="info-badge">
                                    <Bed size={12} />
                                    {h.units.length} Jedinica
                                </div>
                                <div className="info-badge">
                                    <Tag size={12} />
                                    ID: {h.id}
                                </div>
                            </div>

                            {/* Actions */}
                            <div style={{ marginTop: 'auto', display: 'flex', gap: '8px' }}>
                                <button className="module-action" style={{ marginTop: 0, flex: 1 }}>
                                    Otvori <ChevronRight size={16} />
                                </button>
                                <div
                                    className="module-action"
                                    style={{ marginTop: 0, width: '46px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                    onClick={(e) => { e.stopPropagation(); /* preview */ }}
                                    title="Prikaži Web Stranicu"
                                >
                                    <Globe size={18} />
                                </div>
                            </div>
                        </motion.div>
                    ))}

                    {/* Add New Card */}
                    <motion.div
                        className="module-card add-new"
                        whileHover={{ y: -4, scale: 1.02 }}
                        onClick={() => navigate('/production/hotels/new')}
                        style={{ cursor: 'pointer' }}
                    >
                        <div className="add-icon">
                            <Plus size={48} />
                        </div>
                        <span className="add-text">Dodaj Novi Objekat</span>
                    </motion.div>
                </div>
            ) : (
                /* List View */
                <div style={{ marginTop: '32px', background: 'var(--bg-card)', borderRadius: '16px', border: '1px solid var(--border)', overflow: 'hidden' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ background: 'var(--bg-main)', borderBottom: '1px solid var(--border)' }}>
                                <th style={{ padding: '16px', textAlign: 'left', fontWeight: '600', fontSize: '13px' }}>Naziv</th>
                                <th style={{ padding: '16px', textAlign: 'left', fontWeight: '600', fontSize: '13px' }}>Lokacija</th>
                                <th style={{ padding: '16px', textAlign: 'center', fontWeight: '600', fontSize: '13px' }}>Jedinice</th>
                                <th style={{ padding: '16px', textAlign: 'center', fontWeight: '600', fontSize: '13px' }}>Status</th>
                                <th style={{ padding: '16px', textAlign: 'right', fontWeight: '600', fontSize: '13px' }}>Akcije</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredHotels.map(h => (
                                <tr
                                    key={h.id}
                                    style={{ borderBottom: '1px solid var(--border)', cursor: 'pointer' }}
                                    onClick={() => handleHotelClick(h)}
                                >
                                    <td style={{ padding: '16px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                            <div style={{
                                                width: '40px',
                                                height: '40px',
                                                borderRadius: '10px',
                                                background: 'linear-gradient(135deg,#10b981,#059669)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                color: '#fff'
                                            }}>
                                                <Building2 size={20} />
                                            </div>
                                            <div>
                                                <div style={{ fontWeight: '600' }}>{h.name}</div>
                                                {h.originalPropertyData?.starRating && (
                                                    <div style={{ display: 'flex', gap: '2px', marginTop: '4px' }}>
                                                        {[...Array(h.originalPropertyData.starRating)].map((_, i) => (
                                                            <Star key={i} size={12} fill="#fbbf24" strokeWidth={0} />
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </td>
                                    <td style={{ padding: '16px', color: 'var(--text-secondary)' }}>
                                        {h.location.place}, {h.location.address}
                                    </td>
                                    <td style={{ padding: '16px', textAlign: 'center' }}>{h.units.length}</td>
                                    <td style={{ padding: '16px', textAlign: 'center' }}>
                                        <span style={{
                                            padding: '4px 12px',
                                            borderRadius: '20px',
                                            fontSize: '12px',
                                            fontWeight: '600',
                                            background: h.originalPropertyData?.isActive ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                                            color: h.originalPropertyData?.isActive ? '#10b981' : '#ef4444'
                                        }}>
                                            {h.originalPropertyData?.isActive ? 'Aktivan' : 'Neaktivan'}
                                        </span>
                                    </td>
                                    <td style={{ padding: '16px', textAlign: 'right' }}>
                                        <button
                                            className="btn-glass"
                                            style={{ padding: '8px 16px' }}
                                            onClick={(e) => { e.stopPropagation(); handleHotelClick(h); }}
                                        >
                                            Otvori <ChevronRight size={14} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {filteredHotels.length === 0 && !loading && (
                <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-secondary)' }}>
                    <Building2 size={64} style={{ marginBottom: '16px', opacity: 0.3 }} />
                    <h3>Nema rezultata</h3>
                    <p>Nije pronađen nijedan objekat koji odgovara pretrazi.</p>
                </div>
            )}
        </div>
    );
};

export default HotelsList;
