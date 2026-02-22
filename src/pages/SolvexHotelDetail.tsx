import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { ArrowLeft, Loader2, MapPin, Star, Info, FileText, CheckCircle2 } from 'lucide-react';
import { useThemeStore } from '../stores';
import { getProxiedImageUrl } from '../utils/imageProxy';

const SolvexHotelDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { lang } = useThemeStore();
    const [hotelData, setHotelData] = React.useState<any>(null);
    const [loading, setLoading] = React.useState(true);

    React.useEffect(() => {
        const fetchHotel = async () => {
            if (!id) return;
            setLoading(true);
            try {
                const solvexId = id.startsWith('solvex_') ? id : `solvex_${id.replace('solvex-', '')}`;
                const { data, error } = await supabase
                    .from('properties')
                    .select('*')
                    .eq('id', solvexId)
                    .single();

                if (data) {
                    setHotelData(data);
                }
            } catch (err) {
                console.error('Error fetching hotel details:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchHotel();
    }, [id]);

    if (loading) {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', gap: '20px', color: 'var(--text-secondary)' }}>
                <Loader2 size={48} className="animate-spin" />
                <p>{lang === 'sr' ? 'Učitavanje podataka...' : 'Loading hotel data...'}</p>
            </div>
        );
    }

    if (!hotelData) {
        return (
            <div style={{ padding: '100px 20px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                <Info size={64} style={{ marginBottom: '20px', opacity: 0.3 }} />
                <h2>{lang === 'sr' ? 'Hotel nije pronađen' : 'Hotel not found'}</h2>
                <p>Nismo uspeli da pronađemo detaljne podatke za ovaj objekat u našoj bazi.</p>
                <button onClick={() => navigate(-1)} style={{ marginTop: '20px', padding: '10px 20px', borderRadius: '8px', background: 'var(--accent)', color: 'white', border: 'none', cursor: 'pointer' }}>Nazad</button>
            </div>
        );
    }

    const { name, images, propertyAmenities, last_sync } = hotelData;
    const description = (hotelData as any).content?.description || 'Nema dostupnog opisa.';
    const starRating = (hotelData as any).originalPropertyData?.starRating || 0;

    return (
        <div className="hotel-detail-container" style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto', color: 'var(--text-primary)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                <button
                    onClick={() => navigate(-1)}
                    style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '16px' }}
                >
                    <ArrowLeft size={20} />
                    {lang === 'sr' ? 'Nazad' : 'Back'}
                </button>
                {last_sync && (
                    <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', fontWeight: 600 }}>
                        LAST SYNC: {new Date(last_sync).toLocaleString()}
                    </div>
                )}
            </div>

            <div className="detail-header" style={{ marginBottom: '40px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '15px' }}>
                    <span style={{ background: 'linear-gradient(135deg, #e91e63 0%, #c2185b 100%)', color: 'white', padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold' }}>
                        SOLVEX OFFICIAL
                    </span>
                    <div style={{ display: 'flex', gap: '2px', color: '#fbbf24' }}>
                        {Array(starRating > 0 ? starRating : 3).fill(0).map((_, i) => <Star key={i} size={16} fill="currentColor" />)}
                    </div>
                </div>
                <h1 style={{ fontSize: '42px', fontWeight: 900, margin: '0 0 10px 0', letterSpacing: '-1px' }}>{name}</h1>
                <p style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)', fontSize: '18px' }}>
                    <MapPin size={20} style={{ color: '#3b82f6' }} /> Bulgaria
                </p>
            </div>

            {/* Gallery */}
            {images && images.length > 0 && (
                <div className="gallery-grid" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '15px', height: '500px', marginBottom: '40px', borderRadius: '24px', overflow: 'hidden' }}>
                    <div style={{ position: 'relative' }}>
                        <img src={getProxiedImageUrl(images[0])} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt={name} />
                    </div>
                    <div style={{ display: 'grid', gridTemplateRows: '1fr 1fr', gap: '15px' }}>
                        <img src={getProxiedImageUrl(images[1] || images[0])} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" />
                        <div style={{ position: 'relative' }}>
                            <img src={getProxiedImageUrl(images[2] || images[0])} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" />
                            {images.length > 3 && (
                                <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '24px', fontWeight: 'bold' }}>
                                    +{images.length - 3}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '40px' }}>
                <div className="description-section">
                    <h2 style={{ fontSize: '24px', fontWeight: 800, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <FileText size={24} style={{ color: '#3b82f6' }} /> {lang === 'sr' ? 'O Objektu' : 'About Property'}
                    </h2>
                    <div
                        className="description-text"
                        style={{ lineHeight: '1.8', fontSize: '16px', color: 'rgba(255,255,255,0.7)', textAlign: 'justify' }}
                        dangerouslySetInnerHTML={{ __html: description }}
                    />

                    {propertyAmenities && propertyAmenities.length > 0 && (
                        <div style={{ marginTop: '40px' }}>
                            <h2 style={{ fontSize: '24px', fontWeight: 800, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <CheckCircle2 size={24} style={{ color: '#10b981' }} /> {lang === 'sr' ? 'Sadržaji i Ponuda' : 'Facilities & Offer'}
                            </h2>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '15px' }}>
                                {propertyAmenities.map((amenity: string, idx: number) => (
                                    <div key={idx} style={{ background: 'rgba(255,255,255,0.03)', padding: '12px 20px', borderRadius: '12px', border: '1px solid var(--border)', fontSize: '14px', fontWeight: 500 }}>
                                        {amenity}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <div className="info-sidebar">
                    <div style={{ background: 'var(--bg-card)', padding: '30px', borderRadius: '24px', border: '1px solid var(--border)', position: 'sticky', top: '20px' }}>
                        <h3 style={{ margin: '0 0 20px 0', fontSize: '18px', fontWeight: 800 }}>Dostupnost</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '15px', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '12px', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
                                <span style={{ color: '#3b82f6', fontWeight: 600 }}>Status</span>
                                <span style={{ fontWeight: 800 }}>LIVE API</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '15px', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '12px', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                                <span style={{ color: '#10b981', fontWeight: 600 }}>Provajder</span>
                                <span style={{ fontWeight: 800 }}>Solvex B2B</span>
                            </div>
                        </div>

                        <button
                            onClick={() => navigate('/b2b/search')}
                            style={{ width: '100%', marginTop: '30px', padding: '15px', borderRadius: '12px', background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)', color: 'white', border: 'none', fontWeight: 800, cursor: 'pointer', boxShadow: '0 4px 15px rgba(37, 99, 235, 0.3)' }}
                        >
                            PRETRAŽI CENE
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SolvexHotelDetail;
