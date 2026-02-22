import React, { useState, useEffect } from 'react';
import { Sparkles, Plus, Trash2, AlertCircle, ImageIcon } from 'lucide-react';
import type { StepProps } from '../types';
import type { PropertyImage } from '../../../types/property.types';

const ImagesStep: React.FC<StepProps> = ({ data, onChange }) => {
    const [websiteUrl, setWebsiteUrl] = useState((data as any).website || 'https://www.example-hotel.com');

    useEffect(() => {
        const val = (data as any).website;
        if (val) setWebsiteUrl(val);
    }, [data]);

    const [isFetching, setIsFetching] = useState(false);

    // Manual States
    const [imageUrl, setImageUrl] = useState('');
    const [imageCategory, setImageCategory] = useState<'Exterior' | 'Lobby' | 'Room' | 'Bathroom' | 'Pool' | 'Restaurant' | 'View' | 'Amenity'>('Exterior');
    const [selectedRoomType, setSelectedRoomType] = useState<string>('');
    const [imageCaption, setImageCaption] = useState('');
    const [imageAlt, setImageAlt] = useState('');
    const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

    // Auto-update Alt Text suggestion when Category changes
    useEffect(() => {
        const hotelName = (data as any).name || 'Hotel';
        if (!imageAlt || imageAlt.includes(hotelName)) {
            setImageAlt(`${hotelName} - ${imageCategory}`);
        }
    }, [imageCategory, (data as any).name]);

    const handleFetchImages = () => {
        if (!websiteUrl) return;
        setIsFetching(true);
        setTimeout(() => {
            // Mock Fetch with diverse images
            const fetchedImages: PropertyImage[] = [
                { url: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&q=80&w=1000', category: 'Exterior', caption: 'Fasada Objekta', sortOrder: 1 },
                { url: 'https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&q=80&w=1000', category: 'Lobby', caption: 'Lobby i Recepcija', sortOrder: 2 },
                { url: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&q=80&w=1000', category: 'Restaurant', caption: 'Restoran', sortOrder: 3 },
                { url: 'https://images.unsplash.com/photo-1576354302919-96748cb8299e?auto=format&fit=crop&q=80&w=1000', category: 'Room', caption: 'Standardna Soba', sortOrder: 4 },
                { url: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&q=80&w=1000', category: 'Room', caption: 'Pogled iz sobe', sortOrder: 5 },
                { url: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&q=80&w=1000', category: 'Bathroom', caption: 'Kupatilo', sortOrder: 6 },
                { url: 'https://images.unsplash.com/photo-1572331165267-854da2b00cc6?auto=format&fit=crop&q=80&w=1000', category: 'Pool', caption: 'Bazen', sortOrder: 7 },
                { url: 'https://images.unsplash.com/photo-1540497077202-7c8a3999166f?auto=format&fit=crop&q=80&w=1000', category: 'Amenity', caption: 'Teretana', sortOrder: 8 },
            ];

            const currentCount = data.images?.length || 0;
            const hotelName = (data as any).name || 'Hotel';

            const preparedImages = fetchedImages.map((img, i) => ({
                ...img,
                altText: `${hotelName} - ${img.category} - ${img.caption}`,
                sortOrder: currentCount + i + 1
            }));

            onChange({ images: [...(data.images || []), ...preparedImages] });
            setIsFetching(false);
        }, 2000);
    };

    const addImage = () => {
        if (!imageUrl.trim()) return;
        const newImage: PropertyImage = {
            url: imageUrl,
            category: imageCategory,
            roomTypeId: selectedRoomType || undefined,
            sortOrder: (data.images?.length || 0) + 1,
            caption: imageCaption || undefined,
            altText: imageAlt || undefined
        };
        onChange({ images: [...(data.images || []), newImage] });
        setImageUrl('');
        setImageCaption('');
        setImageAlt(''); // Reset will trigger effect to refill
        setSelectedRoomType('');
    };

    const deleteImage = (index: number) => {
        const newImages = data.images?.filter((_, i) => i !== index) || [];
        onChange({ images: newImages });
    };

    const handleDragStart = (e: React.DragEvent, index: number) => {
        setDraggedIndex(index);
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragOver = (e: React.DragEvent, index: number) => {
        e.preventDefault();
        if (draggedIndex === null || draggedIndex === index) return;
    };

    const handleDrop = (e: React.DragEvent, dropIndex: number) => {
        e.preventDefault();
        if (draggedIndex === null || draggedIndex === dropIndex) return;

        const newImages = [...(data.images || [])];
        const draggedItem = newImages[draggedIndex];

        newImages.splice(draggedIndex, 1);
        newImages.splice(dropIndex, 0, draggedItem);

        const reordered = newImages.map((img, idx) => ({
            ...img,
            sortOrder: idx + 1
        }));

        onChange({ images: reordered });
        setDraggedIndex(null);
    };

    return (
        <div>
            <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
            <div className="form-section">
                <h3 className="form-section-title">Galerija Slika</h3>

                <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 3fr) minmax(0, 2fr)', gap: '24px', marginBottom: '32px' }}>
                    {/* Column 1: Auto Fetch */}
                    <div style={{
                        background: 'var(--bg-dark)',
                        border: '1px solid var(--border)',
                        borderRadius: '16px',
                        padding: '24px',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.02)'
                    }}>
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
                                <div style={{ padding: '8px', background: 'rgba(59, 130, 246, 0.08)', borderRadius: '8px', color: 'var(--accent)' }}>
                                    <Sparkles size={18} />
                                </div>
                                <h4 style={{ margin: 0, fontSize: '15px', fontWeight: '600', color: 'var(--text-primary)' }}>Preuzimanje sa Sajta</h4>
                            </div>

                            <div className="form-group">
                                <label className="form-label">Link ka sajtu hotela</label>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <input
                                        className="form-input"
                                        placeholder="https://www.hotel.com"
                                        value={websiteUrl}
                                        onChange={e => setWebsiteUrl(e.target.value)}
                                        style={{ background: 'var(--bg-sidebar)' }}
                                    />
                                    <button
                                        className="btn-primary-glow"
                                        onClick={handleFetchImages}
                                        disabled={isFetching}
                                        style={{ whiteSpace: 'nowrap', padding: '0 20px' }}
                                    >
                                        {isFetching ? '...' : 'Preuzmi'}
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div style={{ marginTop: '20px', background: 'rgba(59, 130, 246, 0.05)', border: '1px solid rgba(59,130,246,0.1)', color: 'var(--accent)', padding: '12px', borderRadius: '10px', fontSize: '12px', lineHeight: '1.5' }}>
                            <div style={{ display: 'flex', gap: '8px', marginBottom: '4px', fontWeight: '600' }}>
                                <AlertCircle size={14} style={{ marginTop: '1px' }} />
                                Demo Mod Aktiviran
                            </div>
                            Sistem će koristiti demo slike zbog CORS ograničenja browsera. U produkciji bi ovo preuzimalo prave slike sa sajta.
                        </div>
                    </div>

                    {/* Column 2: Quick Manual Add */}
                    <div style={{
                        background: 'var(--bg-card)',
                        border: '1px solid var(--border)',
                        borderRadius: '16px',
                        padding: '24px'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
                            <div style={{ padding: '8px', background: 'rgba(16, 185, 129, 0.08)', borderRadius: '8px', color: 'var(--accent-green)' }}>
                                <Plus size={18} />
                            </div>
                            <h4 style={{ margin: 0, fontSize: '15px', fontWeight: '600', color: 'var(--text-primary)' }}>Brzi Ručni Unos</h4>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <input type="url" className="form-input" placeholder="https://image-url.com..." value={imageUrl} onChange={e => setImageUrl(e.target.value)} style={{ background: 'var(--bg-sidebar)' }} />

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                <select className="form-select" value={imageCategory} onChange={e => setImageCategory(e.target.value as any)} style={{ background: 'var(--bg-sidebar)' }}>
                                    <option value="Exterior">Exterior</option>
                                    <option value="Lobby">Lobby</option>
                                    <option value="Room">Room</option>
                                    <option value="Pool">Pool</option>
                                    <option value="Restaurant">Restaurant</option>
                                    <option value="Bathroom">Bathroom</option>
                                    <option value="View">View</option>
                                    <option value="Amenity">Amenity</option>
                                </select>
                                <button className="btn-secondary" onClick={addImage} disabled={!imageUrl} style={{ justifyContent: 'center', background: 'var(--bg-sidebar)', color: 'var(--text-primary)' }}>Dodaj Sliku</button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Gallery Grid */}
                {data.images && data.images.length > 0 ? (
                    <div className="image-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '16px' }}>
                        {data.images.map((image, index) => (
                            <div
                                key={index}
                                draggable
                                onDragStart={(e) => handleDragStart(e, index)}
                                onDragOver={(e) => handleDragOver(e, index)}
                                onDrop={(e) => handleDrop(e, index)}
                                style={{
                                    background: 'var(--bg-card)',
                                    borderRadius: '12px',
                                    overflow: 'hidden',
                                    border: '1px solid var(--border)',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    cursor: 'grab',
                                    opacity: draggedIndex === index ? 0.4 : 1,
                                    transform: draggedIndex === index ? 'scale(0.95)' : 'scale(1)',
                                    transition: 'all 0.2s',
                                    boxShadow: draggedIndex === index ? 'none' : '0 2px 4px rgba(0,0,0,0.05)'
                                }}
                            >
                                <div style={{ height: '160px', background: `url(${image.url}) center/cover`, position: 'relative' }}>
                                    <div style={{ position: 'absolute', top: 8, left: 8, background: 'rgba(15, 23, 42, 0.8)', color: '#fff', fontSize: '10px', padding: '2px 6px', borderRadius: '4px' }}>
                                        {image.category}
                                    </div>
                                    <button onClick={(e) => { e.preventDefault(); deleteImage(index); }} style={{ position: 'absolute', top: 8, right: 8, background: 'rgba(239, 68, 68, 0.9)', color: '#fff', border: 'none', borderRadius: '4px', padding: '4px', cursor: 'pointer' }}>
                                        <Trash2 size={12} />
                                    </button>
                                    <div style={{ position: 'absolute', bottom: 0, right: 0, background: 'var(--bg-card)', color: 'var(--text-primary)', fontSize: '10px', padding: '2px 6px', borderTopLeftRadius: '4px', fontWeight: 'bold' }}>
                                        #{index + 1}
                                    </div>
                                </div>
                                <div style={{ padding: '12px', flex: 1 }}>
                                    {image.caption && <p style={{ fontSize: '12px', fontWeight: 500, margin: '0 0 4px 0' }}>{image.caption}</p>}
                                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '4px' }}>{image.url.substring(0, 30)}...</div>
                                    {image.altText && (
                                        <div style={{ fontSize: '10px', color: 'var(--accent)', background: 'rgba(59, 130, 246, 0.1)', padding: '4px', borderRadius: '4px', display: 'inline-block' }}>
                                            SEO: {image.altText.substring(0, 35)}{image.altText.length > 35 ? '...' : ''}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div style={{ padding: '40px', textAlign: 'center', border: '2px dashed var(--border)', borderRadius: '12px', color: 'var(--text-secondary)' }}>
                        <ImageIcon size={32} style={{ opacity: 0.3 }} />
                        <p>Nema slika. Koristite opciju za preuzimanje sa sajta.</p>
                    </div>
                )}
            </div>

            <div style={{ marginTop: '24px', padding: '12px', background: 'rgba(255, 193, 7, 0.1)', border: '1px solid rgba(255, 193, 7, 0.3)', borderRadius: '8px', display: 'flex', gap: '12px' }}>
                <AlertCircle size={16} color="#ffc107" />
                <span style={{ fontSize: '12px', color: '#ffc107' }}>Booking.com zahteva slike min. 1280px širine. Sistem automatski filtrira slike niskog kvaliteta.</span>
            </div>
        </div>
    );
};

export default ImagesStep;
