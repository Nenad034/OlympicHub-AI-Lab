import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
    ArrowLeft,
    Plus,
    Trash2,
    Save,
    X,
    Building,
    Bed,
    Users,
    ChevronRight,
    Sparkles,
    Baby,
    Home,
    Settings,
    Layout
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { loadFromCloud, saveToCloud } from '../utils/storageUtils';
import { useToast } from '../components/ui/Toast';

interface RoomUnit {
    id: string;
    unitName: string;
    unitType: string;
    maxOccupancy: number;
    osnovniKreveti: number;
    pomocniKreveti: number;
    allowChildSharingBed: boolean;
    basePrice?: number;
    description?: string;
}

interface Hotel {
    id: string;
    name: string;
    units: RoomUnit[];
}

const HotelRooms: React.FC = () => {
    const { hotelSlug } = useParams<{ hotelSlug: string }>();
    const navigate = useNavigate();
    const { success, error } = useToast();

    const [hotel, setHotel] = useState<Hotel | null>(null);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [newRoom, setNewRoom] = useState<Partial<RoomUnit>>({
        unitName: '',
        unitType: 'Double Room',
        maxOccupancy: 2,
        osnovniKreveti: 2,
        pomocniKreveti: 0,
        allowChildSharingBed: true,
    });

    useEffect(() => {
        const loadHotel = async () => {
            setLoading(true);
            const { data } = await loadFromCloud('properties');
            let hotels: any[] = data as any[] || [];

            const foundHotel = hotels.find(h => {
                const slug = h.name.toLowerCase()
                    .replace(/\s+/g, '-')
                    .replace(/[^a-z0-9-]/g, '');
                return slug === hotelSlug || h.id.toString() === hotelSlug;
            });

            if (foundHotel) {
                setHotel(foundHotel);
            }
            setLoading(false);
        };
        loadHotel();
    }, [hotelSlug]);

    const handleAddRoom = async () => {
        if (!hotel || !newRoom.unitName) return;

        const updatedRoom = {
            ...newRoom,
            id: Date.now().toString(),
        } as RoomUnit;

        const updatedHotel = {
            ...hotel,
            units: [...hotel.units, updatedRoom]
        };

        try {
            const { data: allHotels } = await loadFromCloud('properties');
            let hotels: any[] = allHotels as any[] || [];

            const updatedList = hotels.map(h => (h.id === hotel.id ? updatedHotel : h));

            await saveToCloud('properties', updatedList);
            localStorage.setItem('olympic_hub_hotels', JSON.stringify(updatedList));

            setHotel(updatedHotel);
            setIsAddModalOpen(false);
            setNewRoom({
                unitName: '',
                unitType: 'Double Room',
                maxOccupancy: 2,
                osnovniKreveti: 2,
                pomocniKreveti: 0,
                allowChildSharingBed: true
            });
            success('Soba dodata', `Soba ${updatedRoom.unitName} je uspešno dodata.`);
        } catch (err) {
            error('Greška', 'Nije moguće dodati sobu.');
        }
    };

    const handleDeleteRoom = async (roomId: string) => {
        if (!hotel) return;

        const updatedUnits = hotel.units.filter(u => u.id !== roomId);
        const updatedHotel = { ...hotel, units: updatedUnits };

        try {
            const { data: allHotels } = await loadFromCloud('properties');
            let hotels: any[] = allHotels as any[] || [];

            const updatedList = hotels.map(h => (h.id === hotel.id ? updatedHotel : h));

            await saveToCloud('properties', updatedList);
            localStorage.setItem('olympic_hub_hotels', JSON.stringify(updatedList));

            setHotel(updatedHotel);
            success('Soba obrisana', 'Soba je uklonjena iz hotela.');
        } catch (err) {
            error('Greška', 'Nije moguće obrisati sobu.');
        }
    };

    const filteredUnits = hotel?.units.filter(u =>
        u.unitName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.unitType.toLowerCase().includes(searchQuery.toLowerCase())
    ) || [];

    if (loading) return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: 'var(--accent)' }}>
            <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }}>
                <Sparkles size={48} />
            </motion.div>
        </div>
    );

    return (
        <div className="module-container fade-in" style={{
            background: 'radial-gradient(circle at 50% 100%, rgba(139, 92, 246, 0.03) 0%, transparent 50%)',
            minHeight: 'calc(100vh - 80px)',
            padding: '20px'
        }}>
            {/* Header - Orchestrator Theme */}
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
                        onClick={() => navigate(`/production/hotels/${hotelSlug}`)}
                        className="btn-icon circle"
                        style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)' }}
                    >
                        <ArrowLeft size={20} />
                    </motion.button>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                            <h1 style={{ fontSize: '28px', fontWeight: '900', margin: 0, background: 'linear-gradient(to bottom, #fff, #94a3b8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                                Upravljanje Jedinicama
                            </h1>
                            <div style={{ background: 'rgba(139, 92, 246, 0.2)', border: '1px solid rgba(139, 92, 246, 0.4)', padding: '4px 8px', borderRadius: '6px', fontSize: '10px', fontWeight: 800, color: '#a78bfa' }}>
                                {hotel?.units.length || 0} AKTIVNIH TIPOVA
                            </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                            <Building size={14} /> <span>{hotel ? hotel.name : 'Učitavanje...'}</span>
                            <ChevronRight size={12} /> <span style={{ color: 'var(--accent)' }}>Smeštajni Kapaciteti</span>
                        </div>
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '12px' }}>
                    <button
                        className="btn-primary-action"
                        onClick={() => setIsAddModalOpen(true)}
                        style={{ height: '44px', borderRadius: '14px', background: 'var(--gradient-purple)', color: '#fff', border: 'none', padding: '0 24px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 20px rgba(139, 92, 246, 0.3)' }}
                    >
                        <Plus size={18} /> Dodaj Tip Sobe
                    </button>
                    <button
                        className="btn-glass"
                        style={{ height: '44px', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.1)' }}
                    >
                        <Settings size={18} /> Konfiguracija
                    </button>
                </div>
            </div>

            {/* Room List Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '24px' }}>
                <AnimatePresence>
                    {filteredUnits.map((room) => (
                        <motion.div
                            key={room.id}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            whileHover={{ y: -5 }}
                            style={{
                                background: 'rgba(30, 41, 59, 0.4)',
                                backdropFilter: 'blur(12px)',
                                border: '1px solid rgba(255,255,255,0.05)',
                                borderRadius: '24px',
                                overflow: 'hidden',
                                position: 'relative'
                            }}
                        >
                            {/* Card Header Gradient */}
                            <div style={{ height: '6px', background: 'var(--gradient-purple)' }}></div>

                            <div style={{ padding: '24px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
                                    <div>
                                        <h3 style={{ fontSize: '18px', fontWeight: '800', margin: 0, color: '#fff' }}>{room.unitName}</h3>
                                        <div style={{ fontSize: '12px', color: 'rgba(167, 139, 250, 0.8)', fontWeight: 600, marginTop: '2px' }}>{room.unitType}</div>
                                    </div>
                                    <button
                                        onClick={() => handleDeleteRoom(room.id)}
                                        style={{ background: 'rgba(239, 68, 68, 0.1)', border: 'none', color: '#ef4444', padding: '8px', borderRadius: '10px', cursor: 'pointer' }}
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
                                    <div style={{ background: 'rgba(255,255,255,0.03)', padding: '12px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                        <div style={{ fontSize: '10px', color: 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '4px' }}>STRUKTURA KREVETA</div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '800', fontSize: '16px' }}>
                                            <Bed size={16} color="var(--accent)" /> {room.osnovniKreveti} + {room.pomocniKreveti}
                                        </div>
                                    </div>
                                    <div style={{ background: 'rgba(255,255,255,0.03)', padding: '12px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                        <div style={{ fontSize: '10px', color: 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '4px' }}>MAX KAPACITET</div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '800', fontSize: '16px' }}>
                                            <Users size={16} color="#10b981" /> {room.maxOccupancy} Pers.
                                        </div>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', alignContent: 'center', gap: '12px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', padding: '6px 12px', background: room.allowChildSharingBed ? 'rgba(16, 185, 129, 0.1)' : 'rgba(255,255,255,0.03)', color: room.allowChildSharingBed ? '#10b981' : 'var(--text-secondary)', borderRadius: '20px', fontWeight: 600, border: `1px solid ${room.allowChildSharingBed ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255,255,255,0.05)'}` }}>
                                        <Baby size={14} /> {room.allowChildSharingBed ? 'Dete deli krevet dozvoljeno' : 'Samo sopstveni krevet'}
                                    </div>
                                </div>
                            </div>

                            {/* Decorative Sparkle */}
                            <div style={{ position: 'absolute', right: '10px', bottom: '10px', opacity: 0.1 }}>
                                <Sparkles size={40} color="var(--accent)" />
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>

                {/* Ghost Card for Add */}
                <motion.div
                    whileHover={{ scale: 1.02 }}
                    onClick={() => setIsAddModalOpen(true)}
                    style={{
                        background: 'rgba(255,255,255,0.02)',
                        border: '2px dashed rgba(255,255,255,0.1)',
                        borderRadius: '24px',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '12px',
                        minHeight: '200px',
                        cursor: 'pointer',
                        color: 'var(--text-secondary)',
                        transition: 'all 0.2s'
                    }}
                >
                    <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(0,0,0,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Plus size={24} />
                    </div>
                    <span style={{ fontWeight: 700, fontSize: '14px' }}>DODAJ NOVI TIP SOBE</span>
                </motion.div>
            </div>

            {/* Premium Add Room Modal */}
            {isAddModalOpen && (
                <div style={{
                    position: 'fixed', inset: 0,
                    background: 'rgba(0,0,0,0.8)',
                    backdropFilter: 'blur(8px)',
                    zIndex: 1000,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    padding: '20px'
                }}>
                    <motion.div
                        initial={{ opacity: 0, y: 50, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        style={{
                            background: 'var(--bg-card)',
                            width: '100%', maxWidth: '500px',
                            borderRadius: '32px',
                            border: '1px solid rgba(255,255,255,0.1)',
                            overflow: 'hidden',
                            boxShadow: '0 20px 50px rgba(0,0,0,0.5)'
                        }}
                    >
                        <div style={{ background: 'var(--gradient-purple)', height: '80px', padding: '0 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: '#fff' }}>
                                <div style={{ width: '40px', height: '40px', background: 'rgba(255,255,255,0.2)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <Home size={24} />
                                </div>
                                <h2 style={{ fontSize: '20px', fontWeight: '800', margin: 0 }}>Nova Jedinica</h2>
                            </div>
                            <button onClick={() => setIsAddModalOpen(false)} style={{ background: 'rgba(0,0,0,0.2)', border: 'none', color: '#fff', padding: '8px', borderRadius: '50%', cursor: 'pointer' }}>
                                <X size={20} />
                            </button>
                        </div>

                        <div style={{ padding: '32px' }}>
                            <div style={{ display: 'grid', gap: '20px' }}>
                                <div>
                                    <label style={{ fontSize: '11px', fontWeight: '800', color: 'var(--text-secondary)', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>Puni Naziv Sobe</label>
                                    <input
                                        type="text"
                                        value={newRoom.unitName}
                                        onChange={e => setNewRoom({ ...newRoom, unitName: e.target.value })}
                                        style={{ width: '100%', padding: '16px', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border)', borderRadius: '16px', color: '#fff', fontSize: '15px' }}
                                        placeholder="npr. Dvokrevetna Superior Soba"
                                    />
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                    <div>
                                        <label style={{ fontSize: '11px', fontWeight: '800', color: 'var(--text-secondary)', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>Osnovni Kreveti</label>
                                        <input
                                            type="number"
                                            value={newRoom.osnovniKreveti}
                                            onChange={e => {
                                                const val = parseInt(e.target.value) || 0;
                                                setNewRoom({ ...newRoom, osnovniKreveti: val, maxOccupancy: val + (newRoom.pomocniKreveti || 0) });
                                            }}
                                            style={{ width: '100%', padding: '16px', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border)', borderRadius: '16px', color: '#fff', fontSize: '15px' }}
                                        />
                                    </div>
                                    <div>
                                        <label style={{ fontSize: '11px', fontWeight: '800', color: 'var(--text-secondary)', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>Pomoćni Kreveti</label>
                                        <input
                                            type="number"
                                            value={newRoom.pomocniKreveti}
                                            onChange={e => {
                                                const val = parseInt(e.target.value) || 0;
                                                setNewRoom({ ...newRoom, pomocniKreveti: val, maxOccupancy: (newRoom.osnovniKreveti || 0) + val });
                                            }}
                                            style={{ width: '100%', padding: '16px', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border)', borderRadius: '16px', color: '#fff', fontSize: '15px' }}
                                        />
                                    </div>
                                </div>

                                <div style={{ background: 'rgba(139, 92, 246, 0.05)', padding: '16px', borderRadius: '16px', border: '1px solid rgba(139, 92, 246, 0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div>
                                        <div style={{ fontSize: '13px', fontWeight: 700 }}>Dete deli ležaj?</div>
                                        <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Mogućnost dodatne osobe (0-7g) bez kreveta</div>
                                    </div>
                                    <input
                                        type="checkbox"
                                        checked={newRoom.allowChildSharingBed}
                                        onChange={e => setNewRoom({ ...newRoom, allowChildSharingBed: e.target.checked })}
                                        style={{ width: '20px', height: '20px', accentColor: 'var(--accent)' }}
                                    />
                                </div>
                            </div>

                            <div style={{ marginTop: '32px', display: 'flex', gap: '12px' }}>
                                <button
                                    onClick={() => setIsAddModalOpen(false)}
                                    style={{ flex: 1, padding: '16px', borderRadius: '16px', background: 'transparent', border: '1px solid var(--border)', color: '#fff', fontWeight: 700, cursor: 'pointer' }}
                                >
                                    Otkaži
                                </button>
                                <button
                                    onClick={handleAddRoom}
                                    style={{ flex: 2, padding: '16px', borderRadius: '16px', background: 'var(--gradient-purple)', border: 'none', color: '#fff', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                                >
                                    <Save size={18} /> Dodaj
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </div>
    );
};

export default HotelRooms;
