import React, { useState, useEffect } from 'react';
import {
    CloudSnow, MapPin, Wind, Search,
    RefreshCw, Navigation, Mountain,
    BarChart3, Clock, ArrowRight
} from 'lucide-react';
import { useThemeStore } from '../stores';
import { skiApiService } from '../integrations/ski/api/skiApiService';
import type { SkiResort } from '../integrations/ski/types/skiTypes';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import './SkiResort.css'; // Dedicated CSS for high-fidelity UI

const SkiTest: React.FC = () => {
    const { theme } = useThemeStore();
    const navigate = useNavigate();
    const isLight = theme === 'light';
    const [searchTerm, setSearchTerm] = useState('');
    const [resorts, setResorts] = useState<SkiResort[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [lastUpdated, setLastUpdated] = useState<string>('');

    const fetchData = async (query: string = searchTerm) => {
        setIsLoading(true);
        try {
            const data = await skiApiService.searchResorts(query);
            setResorts(data.resorts);
            setLastUpdated(new Date().toLocaleTimeString());
        } catch (error) {
            console.error('Error fetching ski data:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        const interval = setInterval(() => fetchData(), 300000);
        return () => clearInterval(interval);
    }, []);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        fetchData();
    };

    const diffToClass: Record<string, string> = {
        'easy': 'diff-easy',
        'novice': 'diff-novice',
        'intermediate': 'diff-intermediate',
        'advanced': 'diff-advanced',
        'expert': 'diff-expert'
    };

    const diffColors: Record<string, string> = {
        'easy': '#3b82f6',
        'novice': '#10b981',
        'intermediate': '#ef4444',
        'advanced': '#000000',
        'expert': '#581c87'
    };

    return (
        <div className={`ski-container ${isLight ? 'light-mode' : ''}`}>
            {/* Premium Header */}
            <div className="mountain-hero" style={{ height: '300px', marginBottom: '40px' }}>
                <img
                    src="https://images.unsplash.com/photo-1483921020237-2ff51e8e4b22?auto=format&fit=crop&q=80&w=2000"
                    className="mountain-hero-bg"
                    alt="Ski Background"
                />
                <div className="mountain-hero-content">
                    <div className="location">
                        <CloudSnow size={18} />
                        Live Mountain Analytics
                    </div>
                    <h1>Ski Dashboard</h1>
                    <div style={{ display: 'flex', gap: '15px', marginTop: '20px' }}>
                        <div className="glass-pane" style={{ padding: '8px 16px', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 600 }}>
                            <Clock size={14} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
                            Ažurirano: {lastUpdated}
                        </div>
                    </div>
                </div>
            </div>

            {/* Search & Filters */}
            <div className="glass-card" style={{ padding: '40px', marginBottom: '40px', border: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '30px' }}>
                    <div style={{ flex: 1, minWidth: '300px' }}>
                        <h2 style={{ fontSize: '2.2rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '-1.5px', marginBottom: '10px' }}>
                            Ski Monitoring
                        </h2>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: 600 }}>Pronađite idealne uslove za skijanje širom sveta</p>
                    </div>

                    <form onSubmit={handleSearch} style={{ display: 'flex', gap: '15px', flex: 1, justifyContent: 'flex-end', minWidth: '350px' }}>
                        <div style={{ position: 'relative', flex: 1, maxWidth: '500px' }}>
                            <input
                                placeholder="Pretraži skijalište, državu ili regiju..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                style={{
                                    width: '100%',
                                    paddingRight: '20px',
                                    paddingLeft: '55px',
                                    height: '56px',
                                    borderRadius: '16px',
                                    background: 'rgba(2, 11, 20, 0.6)',
                                    border: '1px solid var(--border)',
                                    color: 'white',
                                    fontSize: '0.95rem',
                                    fontWeight: 500,
                                    outline: 'none',
                                    boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.3)'
                                }}
                            />
                            <Search
                                style={{ position: 'absolute', left: '20px', top: '16px', opacity: 0.8, color: 'var(--accent-cyan)' }}
                                size={22}
                            />
                        </div>
                        <button
                            className="btn-primary"
                            type="submit"
                            disabled={isLoading}
                            style={{
                                height: '56px',
                                padding: '0 30px',
                                borderRadius: '16px',
                                fontSize: '0.85rem',
                                fontWeight: 800,
                                letterSpacing: '1px',
                                background: 'linear-gradient(135deg, var(--petrol-500), var(--petrol-700))',
                                boxShadow: '0 8px 20px rgba(0, 229, 255, 0.15)'
                            }}
                        >
                            {isLoading ? <RefreshCw className="spin-slow" size={20} /> : 'PRETRAGA'}
                        </button>
                    </form>
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginTop: '35px', paddingTop: '30px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                    <span style={{ fontSize: '0.7rem', fontWeight: 900, textTransform: 'uppercase', color: 'var(--text-secondary)', alignSelf: 'center', marginRight: '10px', letterSpacing: '1px' }}>
                        Popularne regije:
                    </span>
                    {[
                        { label: 'Srbija', query: 'Srbija' },
                        { label: 'Austrija', query: 'Austrija' },
                        { label: 'Italija', query: 'Italija' },
                        { label: 'Francuska', query: 'Francuska' },
                        { label: 'Švajcarska', query: 'Švajcarska' },
                        { label: 'Sve lokacije', query: '' }
                    ].map((chip) => (
                        <button
                            key={chip.label}
                            onClick={() => {
                                setSearchTerm(chip.query);
                                fetchData(chip.query);
                            }}
                            className={searchTerm === chip.query ? 'btn-primary' : 'glass-pane'}
                            style={{
                                padding: '12px 24px',
                                borderRadius: '15px',
                                border: 'none',
                                cursor: 'pointer',
                                fontSize: '0.75rem',
                                fontWeight: 800,
                                textTransform: 'uppercase',
                                letterSpacing: '1px',
                                transition: 'all 0.3s ease'
                            }}
                        >
                            {chip.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Results Grid */}
            <div className="ski-grid">
                <AnimatePresence mode="popLayout">
                    {resorts.map((resort, idx) => (
                        <motion.div
                            key={resort.id}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.4, delay: idx * 0.05 }}
                            className="glass-card ski-card"
                            onClick={() => navigate(`/ski-test/resort/${resort.id}`)}
                            style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', height: '100%' }}
                        >
                            <div className="ski-card-header">
                                <img
                                    src={resort.mapImageUrl || `https://images.unsplash.com/photo-1551698618-1dfe5d97d256?auto=format&fit=crop&q=80&w=800`}
                                    className="ski-card-img"
                                    alt={resort.name}
                                    onError={(e) => {
                                        (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1483921020237-2ff51e8e4b22?auto=format&fit=crop&q=80&w=800';
                                    }}
                                />
                                <div className="ski-card-overlay" />
                                <div style={{ position: 'absolute', top: '20px', left: '20px', zIndex: 10 }}>
                                    <span style={{
                                        padding: '4px 10px',
                                        borderRadius: '8px',
                                        background: 'rgba(255,255,255,0.1)',
                                        backdropFilter: 'blur(5px)',
                                        fontSize: '0.6rem',
                                        fontWeight: 900,
                                        textTransform: 'uppercase'
                                    }}>
                                        {resort.country}
                                    </span>
                                </div>
                                <div style={{ position: 'absolute', bottom: '20px', right: '20px', zIndex: 10, textAlign: 'right' }}>
                                    <div style={{ fontSize: '2rem', fontWeight: 900 }}>{resort.snowReport.summitDepth}cm</div>
                                    <div style={{ fontSize: '0.6rem', fontWeight: 900, color: 'var(--accent-cyan)', textTransform: 'uppercase' }}>Sneg na vrhu</div>
                                </div>
                            </div>

                            <div className="ski-card-content" style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                                <div style={{ marginBottom: '20px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', minHeight: '65px', marginBottom: '5px' }}>
                                        <h3 style={{ fontSize: '1.4rem', fontWeight: 900, textTransform: 'uppercase', lineHeight: 1.2, paddingRight: '10px' }}>
                                            {resort.country !== 'Srbija' && resort.country !== 'Serbia' ? (
                                                <>
                                                    {resort.localizedName || resort.name}
                                                    {resort.localizedName !== resort.name && (
                                                        <span style={{ fontSize: '0.6em', opacity: 0.7, textTransform: 'none', marginLeft: '8px', display: 'inline-block' }}>
                                                            ({resort.name})
                                                        </span>
                                                    )}
                                                </>
                                            ) : resort.name}
                                        </h3>
                                        <div className={`status-pill ${resort.status}`} style={{ flexShrink: 0 }}>
                                            {resort.status === 'open' ? 'Otvoreno' : 'Zatvoreno'}
                                        </div>
                                    </div>
                                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                        <MapPin size={12} className="text-emerald-500" /> {resort.region}
                                    </p>
                                </div>

                                {/* Infrastructure Visualization */}
                                {resort.mountainStatus?.stats && (
                                    <div style={{ marginBottom: '25px', marginTop: 'auto' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', fontWeight: 900, textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                                            <span>Infrastruktura staza</span>
                                            <span style={{ color: 'white' }}>{resort.mountainStatus.stats.runs.totalLengthKm.toFixed(1)} km</span>
                                        </div>
                                        <div className="difficulty-bar-container">
                                            {Object.entries(resort.mountainStatus.stats.runs.byDifficulty).map(([diff, s]: [string, any]) => {
                                                const width = (s.lengthKm / (resort.mountainStatus.stats?.runs.totalLengthKm || 1)) * 100;
                                                return (
                                                    <div
                                                        key={diff}
                                                        className={`diff-bar ${diffToClass[diff] || ''}`}
                                                        style={{ width: `${width}%` }}
                                                    />
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}

                                {/* Weather Mini-Grid */}
                                <div className="weather-mini-grid" style={{ marginBottom: '30px' }}>
                                    {['summit', 'mid', 'base'].map((level) => {
                                        const w = resort.weather[level as keyof typeof resort.weather];
                                        return (
                                            <div key={level} className="weather-box">
                                                <div className="label">{level}</div>
                                                <div className="temp">{w.temp}°</div>
                                                <div style={{ fontSize: '0.6rem', color: 'var(--text-secondary)', fontWeight: 700 }}>{w.conditions}</div>
                                            </div>
                                        );
                                    })}
                                </div>

                                <button className="btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
                                    Detalji <ArrowRight size={18} />
                                </button>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>

            {resorts.length === 0 && !isLoading && (
                <div style={{ textAlign: 'center', padding: '100px 20px' }}>
                    <CloudSnow size={64} style={{ opacity: 0.1, marginBottom: '20px' }} />
                    <h3 style={{ fontSize: '1.5rem', fontWeight: 900, textTransform: 'uppercase' }}>Nema rezultata</h3>
                    <p style={{ color: 'var(--text-secondary)', marginTop: '10px' }}>Pokušajte sa drugim imenom planine ili države.</p>
                </div>
            )}

            <div style={{ textAlign: 'center', marginTop: '60px', padding: '40px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                <p style={{ fontSize: '0.6rem', fontWeight: 900, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '2px' }}>
                    PrimeClickToTravel | Powered by Open-Meteo & OpenSkiMap
                </p>
            </div>
        </div>
    );
};

export default SkiTest;
