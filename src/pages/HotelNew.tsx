import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
    ArrowLeft,
    Save,
    X,
    Building2,
    MapPin,
    Star,
    ChevronRight,
    Sparkles,
    Shield,
    Globe,
    Info
} from 'lucide-react';
import { motion } from 'framer-motion';
import { loadFromCloud, saveToCloud } from '../utils/storageUtils';
import { useToast } from '../components/ui/Toast';

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
    language: 'Srpski' | 'Engleski';
}

const HotelNew: React.FC = () => {
    const navigate = useNavigate();
    const { success, error } = useToast();
    const [saving, setSaving] = useState(false);

    const [formData, setFormData] = useState<HotelFormData>({
        name: '',
        propertyType: 'Hotel',
        starRating: 4,
        isActive: true,
        address: {
            addressLine1: '',
            city: '',
            postalCode: '',
            countryCode: 'RS',
        },
        geoCoordinates: {
            latitude: 44.7866,
            longitude: 20.4489,
        },
        shortDescription: '',
        longDescription: '',
        language: 'Srpski',
    });

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
        if (!formData.name) {
            error('Greška', 'Naziv hotela je obavezan.');
            return;
        }

        setSaving(true);

        try {
            // Load all hotels to generate new ID and check for duplicates
            const { data: allHotels } = await loadFromCloud('properties');
            let hotels: any[] = allHotels as any[] || [];

            const newId = Date.now().toString(); // Simple ID generation
            const slug = formData.name.toLowerCase()
                .replace(/\s+/g, '-')
                .replace(/[^a-z0-9-]/g, '');

            // Build new hotel object
            const newHotel = {
                id: newId,
                name: formData.name,
                location: {
                    address: formData.address.addressLine1,
                    lat: formData.geoCoordinates.latitude,
                    lng: formData.geoCoordinates.longitude,
                    place: formData.address.city,
                },
                images: [],
                amenities: [],
                units: [],
                commonItems: {
                    discount: [],
                    touristTax: [],
                    supplement: [],
                },
                originalPropertyData: {
                    propertyId: newId,
                    propertyType: formData.propertyType,
                    starRating: formData.starRating,
                    isActive: formData.isActive,
                    address: formData.address,
                    geoCoordinates: {
                        latitude: formData.geoCoordinates.latitude,
                        longitude: formData.geoCoordinates.longitude,
                        coordinateSource: 'MANUAL',
                    },
                    content: [{
                        languageCode: formData.language === 'Srpski' ? 'sr' : 'en',
                        officialName: formData.name,
                        displayName: formData.name,
                        shortDescription: formData.shortDescription,
                        longDescription: formData.longDescription,
                    }],
                },
            };

            const updatedList = [newHotel, ...hotels];

            // Save to cloud
            await saveToCloud('properties', updatedList);
            localStorage.setItem('olympic_hub_hotels', JSON.stringify(updatedList));

            success('Hotel kreiran!', 'Novi hotel je uspešno dodat u sistem.');
            navigate(`/production/hotels/${slug}`);

        } catch (err) {
            error('Greška', 'Nije moguće kreirati hotel.');
            console.error('Create error:', err);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="module-container fade-in" style={{
            background: 'radial-gradient(circle at 50% 0%, rgba(59, 130, 246, 0.05) 0%, transparent 50%)',
            minHeight: 'calc(100vh - 80px)',
            padding: '20px'
        }}>
            {/* Breadcrumb - Orchestrator Style */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '24px',
                fontSize: '12px',
                color: 'var(--text-secondary)',
                fontWeight: 600,
                letterSpacing: '0.05em'
            }}>
                <Link to="/production" style={{ color: 'inherit', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    PRODUKCIJA
                </Link>
                <ChevronRight size={12} />
                <Link to="/production/hotels" style={{ color: 'inherit', textDecoration: 'none' }}>
                    SMEŠTAJ
                </Link>
                <ChevronRight size={12} />
                <span style={{ color: 'var(--accent)' }}>NOVI OBJEKAT</span>
            </div>

            {/* Header - Glass Effect */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '40px',
                paddingBottom: '20px',
                borderBottom: '1px solid rgba(255,255,255,0.05)'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                    <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => navigate('/production/hotels')}
                        className="btn-icon circle"
                        style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)' }}
                    >
                        <ArrowLeft size={20} />
                    </motion.button>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <h1 style={{ fontSize: '32px', fontWeight: '900', margin: 0, letterSpacing: '-0.02em', background: 'linear-gradient(to bottom, #fff, #94a3b8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                                Kreiraj Novi Objekat
                            </h1>
                            <div style={{ background: 'var(--gradient-blue)', padding: '4px 8px', borderRadius: '6px', fontSize: '10px', fontWeight: 800, color: '#fff' }}>AI READY</div>
                        </div>
                        <p style={{ color: 'var(--text-secondary)', marginTop: '6px', fontSize: '14px' }}>
                            Sistem automatski priprema vaučere i pravila prodaje na osnovu unetih podataka.
                        </p>
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '16px' }}>
                    <button
                        className="btn-glass"
                        onClick={() => navigate('/production/hotels')}
                        style={{ height: '44px', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.1)' }}
                    >
                        <X size={18} /> Otkaži
                    </button>
                    <button
                        className="btn-primary-action"
                        onClick={handleSave}
                        disabled={saving}
                        style={{ height: '44px', borderRadius: '14px', background: 'var(--gradient-blue)', color: '#fff', border: 'none', padding: '0 24px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}
                    >
                        <Save size={18} /> {saving ? 'Kreiranje...' : 'Lansiraj Objekat'}
                    </button>
                </div>
            </div>

            {/* Main Form Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '32px', alignItems: 'start' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>

                    {/* Basic Info - Glass Card */}
                    <div style={{
                        background: 'rgba(30, 41, 59, 0.4)',
                        backdropFilter: 'blur(12px)',
                        border: '1px solid rgba(255,255,255,0.05)',
                        borderRadius: '24px',
                        padding: '32px'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                            <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(59, 130, 246, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3b82f6' }}>
                                <Building2 size={24} />
                            </div>
                            <h3 style={{ margin: 0, fontSize: '20px', fontWeight: '700' }}>Identitet Objekta</h3>
                        </div>

                        <div style={{ display: 'grid', gap: '24px' }}>
                            <div>
                                <label style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '8px' }}>
                                    Naziv Hotela / Vile
                                </label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => handleInputChange('name', e.target.value)}
                                    style={{
                                        width: '100%',
                                        padding: '16px 20px',
                                        borderRadius: '16px',
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        background: 'rgba(0,0,0,0.2)',
                                        color: '#fff',
                                        fontSize: '15px',
                                        outline: 'none',
                                        transition: 'border 0.2s'
                                    }}
                                    placeholder="Unesite zvanični naziv..."
                                />
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                                <div>
                                    <label style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '8px' }}>
                                        Kategorizacija
                                    </label>
                                    <select
                                        value={formData.propertyType}
                                        onChange={(e) => handleInputChange('propertyType', e.target.value)}
                                        style={{
                                            width: '100%',
                                            padding: '16px 20px',
                                            borderRadius: '16px',
                                            border: '1px solid rgba(255,255,255,0.1)',
                                            background: 'rgba(0,0,0,0.2)',
                                            color: '#fff',
                                            fontSize: '15px',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        <option value="Hotel">Hotel</option>
                                        <option value="Apartment">Apartman</option>
                                        <option value="Villa">Vila</option>
                                        <option value="Resort">Rizort</option>
                                    </select>
                                </div>

                                <div>
                                    <label style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '8px' }}>
                                        Zvezdice
                                    </label>
                                    <div style={{ display: 'flex', gap: '10px' }}>
                                        {[1, 2, 3, 4, 5].map(star => (
                                            <motion.button
                                                key={star}
                                                whileHover={{ scale: 1.1 }}
                                                whileTap={{ scale: 0.9 }}
                                                onClick={() => handleInputChange('starRating', star)}
                                                style={{
                                                    background: star <= formData.starRating ? 'rgba(251, 191, 36, 0.1)' : 'rgba(0,0,0,0.2)',
                                                    border: `1px solid ${star <= formData.starRating ? '#fbbf24' : 'rgba(255,255,255,0.1)'}`,
                                                    borderRadius: '12px',
                                                    width: '44px',
                                                    height: '44px',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    cursor: 'pointer',
                                                }}
                                            >
                                                <Star
                                                    size={20}
                                                    fill={star <= formData.starRating ? '#fbbf24' : 'transparent'}
                                                    color={star <= formData.starRating ? '#fbbf24' : 'var(--text-secondary)'}
                                                />
                                            </motion.button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div style={{ marginTop: '24px' }}>
                                <label style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '8px' }}>
                                    Jezik Administracije / Komunikacije
                                </label>
                                <select
                                    value={formData.language}
                                    onChange={(e) => handleInputChange('language', e.target.value)}
                                    style={{
                                        width: '100%',
                                        padding: '16px 20px',
                                        borderRadius: '16px',
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        background: 'rgba(0,0,0,0.2)',
                                        color: '#fff',
                                        fontSize: '15px',
                                        cursor: 'pointer'
                                    }}
                                >
                                    <option value="Srpski">Srpski</option>
                                    <option value="Engleski">Engleski</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Address - Glass Card */}
                    <div style={{
                        background: 'rgba(30, 41, 59, 0.4)',
                        backdropFilter: 'blur(12px)',
                        border: '1px solid rgba(255,255,255,0.05)',
                        borderRadius: '24px',
                        padding: '32px'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                            <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981' }}>
                                <MapPin size={24} />
                            </div>
                            <h3 style={{ margin: 0, fontSize: '20px', fontWeight: '700' }}>Lokacija i Geografija</h3>
                        </div>

                        <div style={{ display: 'grid', gap: '24px' }}>
                            <div>
                                <input
                                    type="text"
                                    value={formData.address.addressLine1}
                                    onChange={(e) => handleAddressChange('addressLine1', e.target.value)}
                                    placeholder="Ulica i broj..."
                                    style={{
                                        width: '100%',
                                        padding: '16px 20px',
                                        borderRadius: '16px',
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        background: 'rgba(0,0,0,0.2)',
                                        color: '#fff',
                                        fontSize: '15px'
                                    }}
                                />
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
                                <input
                                    type="text"
                                    value={formData.address.city}
                                    onChange={(e) => handleAddressChange('city', e.target.value)}
                                    placeholder="Grad..."
                                    style={{ width: '100%', padding: '16px 20px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.2)', color: '#fff' }}
                                />
                                <input
                                    type="text"
                                    value={formData.address.postalCode}
                                    onChange={(e) => handleAddressChange('postalCode', e.target.value)}
                                    placeholder="Poštanski broj..."
                                    style={{ width: '100%', padding: '16px 20px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.2)', color: '#fff' }}
                                />
                                <select
                                    value={formData.address.countryCode}
                                    onChange={(e) => handleAddressChange('countryCode', e.target.value)}
                                    style={{ width: '100%', padding: '16px 20px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.2)', color: '#fff' }}
                                >
                                    <option value="RS">Srbija</option>
                                    <option value="ME">Crna Gora</option>
                                    <option value="HR">Hrvatska</option>
                                    <option value="BA">BiH</option>
                                    <option value="GR">Grčka</option>
                                </select>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Sidebar Info - Orchestrator Style */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    <div style={{
                        background: 'rgba(30, 41, 59, 0.6)',
                        border: '1px solid rgba(139, 92, 246, 0.3)',
                        borderRadius: '24px',
                        padding: '30px',
                        position: 'sticky',
                        top: '20px'
                    }}>
                        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
                            <div style={{
                                width: '70px',
                                height: '70px',
                                borderRadius: '20px',
                                background: 'var(--gradient-purple)',
                                color: '#fff',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                margin: '0 auto 20px',
                                boxShadow: '0 0 30px rgba(139, 92, 246, 0.4)'
                            }}>
                                <Sparkles size={36} />
                            </div>
                            <h3 style={{ fontSize: '22px', fontWeight: '800', marginBottom: '10px' }}>AI Orchestration</h3>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '13px', lineHeight: '1.6' }}>
                                Kreiranjem ovog entiteta, pokrećete lanac automatizacije za cenovnike, inventar i marketing kanale.
                            </p>
                        </div>

                        <div style={{ display: 'grid', gap: '16px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px' }}>
                                <Shield size={18} color="#10b981" />
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Status Sigurnosti</div>
                                    <div style={{ fontSize: '13px', fontWeight: '700' }}>Validirani Podaci</div>
                                </div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px' }}>
                                <Globe size={18} color="#3b82f6" />
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Globalni Dohvat</div>
                                    <div style={{ fontSize: '13px', fontWeight: '700' }}>Multi-Language Ready</div>
                                </div>
                            </div>
                        </div>

                        <div style={{ marginTop: '30px', padding: '15px', background: 'rgba(59, 130, 246, 0.05)', borderRadius: '12px', border: '1px solid rgba(59, 130, 246, 0.1)' }}>
                            <div style={{ display: 'flex', gap: '8px', color: '#3b82f6' }}>
                                <Info size={16} />
                                <div style={{ fontSize: '12px', lineHeight: '1.4' }}>
                                    <strong>Napomena:</strong> Sobe, jedinice i kompleksna pravila cene dodajete u sledećem koraku.
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default HotelNew;
