import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, MapPin, Calendar, Users, Star, ArrowRight, Activity, Bell } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const DESTINATIONS = [
    { id: 1, name: 'Hanioti, Kasandra', country: 'Grčka', rating: 4.8, price: 540, yield: 'high_demand', alert: 'Poslednje 3 sobe po ovoj ceni' },
    { id: 2, name: 'Pefkohori, Kasandra', country: 'Grčka', rating: 4.5, price: 420, yield: 'normal', alert: '' },
    { id: 3, name: 'Kopaonik', country: 'Srbija', rating: 4.9, price: 850, yield: 'trending', alert: 'Cena raste za 48h' }
];

const PublicBookingPortal: React.FC = () => {
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState('');

    return (
        <div style={{ minHeight: '100vh', background: '#0a0f18', color: 'white', fontFamily: 'Inter, sans-serif' }}>

            {/* Top Navigation */}
            <nav style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '24px 48px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ fontSize: '24px', fontWeight: 900, background: 'linear-gradient(90deg, #00e5ff, #3b82f6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', letterSpacing: '-1px' }}>
                    PrimeTravel
                </div>
                <div style={{ display: 'flex', gap: '32px', alignItems: 'center', fontSize: '14px', fontWeight: 600 }}>
                    <span style={{ cursor: 'pointer' }}>Destinacije</span>
                    <span style={{ cursor: 'pointer' }}>Last Minute</span>
                    <button style={{ background: 'rgba(0, 229, 255, 0.1)', color: '#00e5ff', border: '1px solid rgba(0, 229, 255, 0.3)', padding: '10px 24px', borderRadius: '30px', fontWeight: 800, cursor: 'pointer' }}>
                        MOJ SISTEM
                    </button>
                </div>
            </nav>

            {/* Hero Section */}
            <div style={{ padding: '80px 48px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: '-50%', left: '50%', transform: 'translateX(-50%)', width: '1000px', height: '1000px', background: 'radial-gradient(circle, rgba(0,229,255,0.1) 0%, rgba(0,0,0,0) 70%)', zIndex: 0, pointerEvents: 'none' }}></div>

                <h1 style={{ fontSize: '64px', fontWeight: 950, letterSpacing: '-2px', marginBottom: '24px', position: 'relative', zIndex: 1, lineHeight: 1.1 }}>
                    Vaše putovanje, <br /><span style={{ color: '#00e5ff' }}>pametnije kreirano.</span>
                </h1>
                <p style={{ fontSize: '18px', color: '#94a3b8', maxWidth: '600px', margin: '0 auto 48px auto', position: 'relative', zIndex: 1 }}>
                    Otkrijte sistem uživo koji adaptira cene prema potražnji i nudi vam premium destinacije iz prve ruke.
                </p>

                {/* Smart Search Engine (B2C) */}
                <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(20px)', borderRadius: '24px', padding: '16px', display: 'flex', gap: '16px', maxWidth: '800px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
                    <div style={{ flex: 2, display: 'flex', alignItems: 'center', gap: '12px', background: 'rgba(0,0,0,0.4)', borderRadius: '16px', padding: '0 20px', border: '1px solid rgba(255,255,255,0.05)' }}>
                        <MapPin size={20} color="#00e5ff" />
                        <input type="text" placeholder="Kuda putujete?" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} style={{ background: 'transparent', border: 'none', color: 'white', width: '100%', outline: 'none', height: '56px', fontSize: '16px' }} />
                    </div>
                    <div style={{ flex: 1.5, display: 'flex', alignItems: 'center', gap: '12px', background: 'rgba(0,0,0,0.4)', borderRadius: '16px', padding: '0 20px', border: '1px solid rgba(255,255,255,0.05)' }}>
                        <Calendar size={20} color="#00e5ff" />
                        <span style={{ fontSize: '15px', color: 'white' }}>Jun - Jul</span>
                    </div>
                    <button style={{ background: '#00e5ff', color: '#0a0f18', border: 'none', borderRadius: '16px', padding: '0 32px', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 900, cursor: 'pointer' }}>
                        <Search size={20} /> TRAŽI
                    </button>
                </div>
            </div>

            {/* Smart Yield Offers */}
            <div style={{ padding: '40px 48px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '32px' }}>
                    <Activity size={24} color="#00e5ff" />
                    <h2 style={{ fontSize: '24px', fontWeight: 900, letterSpacing: '-1px', margin: 0 }}>Smart Yield Algoritam: Izdvojeno Uživo</h2>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px' }}>
                    {DESTINATIONS.map(dest => (
                        <motion.div
                            key={dest.id}
                            whileHover={{ y: -5 }}
                            style={{ background: 'linear-gradient(180deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '24px', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}
                        >
                            <div style={{ height: '200px', background: '#1e293b', position: 'relative' }}>
                                {/* Fake Image Placeholder */}
                                <div style={{ position: 'absolute', inset: 0, background: 'url("https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&q=80&w=800") center/cover', opacity: 0.6 }}></div>

                                {dest.yield !== 'normal' && (
                                    <div style={{ position: 'absolute', top: '16px', left: '16px', background: dest.yield === 'trending' ? '#ff3b3b' : '#ffb300', color: 'white', padding: '6px 16px', borderRadius: '20px', fontSize: '11px', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '6px', backdropFilter: 'blur(10px)' }}>
                                        <Bell size={12} /> {dest.alert.toUpperCase()}
                                    </div>
                                )}
                            </div>
                            <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', flex: 1 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                                    <div>
                                        <div style={{ fontSize: '18px', fontWeight: 900 }}>{dest.name}</div>
                                        <div style={{ fontSize: '13px', color: '#94a3b8' }}>{dest.country}</div>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'rgba(255,255,255,0.1)', padding: '4px 8px', borderRadius: '8px', fontSize: '12px', fontWeight: 800 }}>
                                        <Star size={12} color="#00e5ff" /> {dest.rating}
                                    </div>
                                </div>

                                <div style={{ marginTop: 'auto', paddingTop: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div>
                                        <div style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 700 }}>Polazna Cena</div>
                                        <div style={{ fontSize: '24px', fontWeight: 900, color: '#00e5ff' }}>€{dest.price} <span style={{ fontSize: '14px', color: '#94a3b8', fontWeight: 500 }}>/osobi</span></div>
                                    </div>
                                    <button style={{ width: '48px', height: '48px', borderRadius: '16px', background: 'white', color: '#0a0f18', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', border: 'none' }}>
                                        <ArrowRight size={20} />
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>

        </div>
    );
}

export default PublicBookingPortal;
