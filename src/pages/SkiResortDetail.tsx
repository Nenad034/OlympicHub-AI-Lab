import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ChevronLeft,
    Map as MapIcon,
    CloudSnow,
    Wind,
    Thermometer,
    Cloud,
    Navigation,
    Activity,
    Info,
    Camera,
    ExternalLink,
    Globe,
    ArrowRight,
    RefreshCw,
    MapPin,
    FileText
} from 'lucide-react';
import { skiApiService } from '../integrations/ski/api/skiApiService';
import type { SkiResort } from '../integrations/ski/types/skiTypes';
import './SkiResort.css'; // Premium UI CSS

const SkiResortDetail: React.FC = () => {
    const { resortId } = useParams<{ resortId: string }>();
    const navigate = useNavigate();
    const [resort, setResort] = useState<SkiResort | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchResort = async () => {
            if (!resortId) return;
            setLoading(true);
            try {
                const data = await skiApiService.getResortById(resortId);
                setResort(data);
            } catch (err) {
                console.error("Failed to fetch resort:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchResort();
    }, [resortId]);

    if (loading) {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: 'var(--bg-dark)', color: 'white' }}>
                <RefreshCw className="spin-slow" size={48} color="var(--accent-cyan)" />
                <p style={{ marginTop: '20px', fontSize: '0.8rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '2px', opacity: 0.5 }}>Učitavanje skijališta...</p>
            </div>
        );
    }

    if (!resort) {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: 'var(--bg-dark)', color: 'white', padding: '40px', textAlign: 'center' }}>
                <Info size={40} className="text-red-500" style={{ marginBottom: '20px' }} />
                <h2 style={{ fontSize: '2rem', fontWeight: 900 }}>Ups! Skijalište nije pronađeno</h2>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '30px' }}>Nažalost, nismo uspeli da pronađemo traženu lokaciju.</p>
                <button
                    onClick={() => navigate('/ski-test')}
                    className="btn-primary"
                >
                    <ChevronLeft size={20} />
                    Nazad na Dashboard
                </button>
            </div>
        );
    }

    const mountainStats = resort.mountainStatus.stats;
    const runsByDifficulty = mountainStats?.runs?.byDifficulty || {};
    const totalKm = mountainStats?.runs?.totalLengthKm || 0;

    const diffConfig: Record<string, { class: string, label: string }> = {
        'easy': { class: 'diff-easy', label: 'Laka (Plava)' },
        'novice': { class: 'diff-novice', label: 'Početnička (Zelena)' },
        'intermediate': { class: 'diff-intermediate', label: 'Srednja (Crvena)' },
        'advanced': { class: 'diff-advanced', label: 'Teška (Crna)' },
        'expert': { class: 'diff-expert', label: 'Ekspert (Crna/Dupla)' }
    };

    return (
        <div style={{ background: 'var(--bg-dark)', minHeight: '100vh', color: 'white' }}>
            {/* Minimal Navbar */}
            <nav style={{ position: 'sticky', top: 0, zIndex: 100, background: 'rgba(2, 11, 14, 0.8)', backdropFilter: 'blur(10px)', borderBottom: '1px solid rgba(255,255,255,0.05)', padding: '20px 40px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', maxWidth: '1400px', margin: '0 auto' }}>
                    <button
                        onClick={() => navigate('/ski-test')}
                        style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 900, textTransform: 'uppercase', fontSize: '0.7rem', letterSpacing: '1px' }}
                    >
                        <ChevronLeft size={16} />
                        Povratak na Dash
                    </button>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: resort.status === 'open' ? '#10b981' : '#ef4444' }} />
                        <span style={{ fontSize: '0.65rem', fontWeight: 900, textTransform: 'uppercase' }}>{resort.status === 'open' ? 'Otvoreno' : 'Zatvoreno'}</span>
                    </div>
                </div>
            </nav>

            <div className="ski-container">
                {/* Hero */}
                <header className="mountain-hero">
                    <img
                        src={resort.mapImageUrl || 'https://images.unsplash.com/photo-1483921020237-2ff51e8e4b22?auto=format&fit=crop&q=80&w=2000'}
                        className="mountain-hero-bg"
                        alt="Background"
                    />
                    <div className="mountain-hero-content">
                        <div className="location">
                            <MapPin size={18} />
                            {resort.country}, {resort.region}
                        </div>
                        <h1>
                            {resort.country !== 'Srbija' && resort.country !== 'Serbia' ? (
                                <>
                                    {resort.localizedName || resort.name}
                                    {resort.localizedName !== resort.name && (
                                        <span style={{ fontSize: '0.5em', opacity: 0.7, textTransform: 'none', marginLeft: '12px', verticalAlign: 'middle' }}>
                                            ({resort.name})
                                        </span>
                                    )}
                                </>
                            ) : resort.name}
                        </h1>
                        <p style={{ color: 'var(--text-secondary)', fontWeight: 800, textTransform: 'uppercase', fontSize: '0.7rem', marginTop: '10px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <Navigation size={14} /> GPS: {(resort.location?.lat ?? 0).toFixed(4)}, {(resort.location?.lng ?? 0).toFixed(4)}
                        </p>
                    </div>
                </header>

                <div className="ski-detail-layout">
                    {/* Left Column: Stats & Map */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>

                        {/* Quick Stats Grid */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '15px' }}>
                            {[
                                { label: 'Ukupno Km', value: `${totalKm.toFixed(1)} km`, icon: Activity, color: '#10b981' },
                                { label: 'Žičara', value: mountainStats?.lifts?.totalCount || 0, icon: MapIcon, color: '#3b82f6' },
                                { label: 'Visina Snega', value: `${resort.snowReport.summitDepth} cm`, icon: CloudSnow, color: 'var(--accent-cyan)' },
                                { label: 'Temperatura', value: `${resort.weather.summit.temp}°C`, icon: Thermometer, color: '#fb7185' }
                            ].map((stat, i) => (
                                <div key={i} className="glass-card" style={{ padding: '20px', textAlign: 'center' }}>
                                    <stat.icon style={{ color: stat.color, marginBottom: '10px' }} size={24} />
                                    <div style={{ fontSize: '0.6rem', fontWeight: 900, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '5px' }}>{stat.label}</div>
                                    <div style={{ fontSize: '1.2rem', fontWeight: 900 }}>{stat.value}</div>
                                </div>
                            ))}
                        </div>

                        {/* About & Highlights */}
                        {resort.description && (
                            <section className="glass-card" style={{ padding: '40px', marginBottom: '20px' }}>
                                <div style={{ display: 'flex', gap: '40px' }}>
                                    <div style={{ flex: 2 }}>
                                        <h3 style={{ fontSize: '1.8rem', fontWeight: 900, textTransform: 'uppercase', marginBottom: '20px' }}>O Ski Centru</h3>
                                        <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', lineHeight: 1.6, fontWeight: 500 }}>
                                            {resort.description}
                                        </p>
                                    </div>
                                    {resort.keyHighlights && resort.keyHighlights.length > 0 && (
                                        <div style={{ flex: 1, padding: '30px', background: 'rgba(0, 229, 255, 0.05)', borderRadius: '30px', border: '1px solid rgba(0, 229, 255, 0.1)' }}>
                                            <h4 style={{ fontSize: '0.8rem', fontWeight: 900, textTransform: 'uppercase', color: 'var(--accent-cyan)', marginBottom: '20px' }}>Izdvajamo</h4>
                                            <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                                {resort.keyHighlights.map((h, i) => (
                                                    <li key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.9rem', fontWeight: 700 }}>
                                                        <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--accent-cyan)' }} />
                                                        {h}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </div>
                            </section>
                        )}

                        {/* Gallery */}
                        {resort.gallery && resort.gallery.length > 0 && (
                            <section style={{ marginBottom: '40px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '25px' }}>
                                    <Camera size={24} className="text-cyan-400" />
                                    <h3 style={{ fontSize: '1.8rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '-1px' }}>Foto Galerija</h3>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '15px' }}>
                                    {resort.gallery.map((img, i) => (
                                        <motion.div
                                            key={i}
                                            whileHover={{ scale: 1.02 }}
                                            style={{ height: '250px', borderRadius: '30px', overflow: 'hidden', cursor: 'pointer' }}
                                        >
                                            <img src={img} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt={`Gallery ${i}`} />
                                        </motion.div>
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* Infrastructure Section */}
                        <section className="glass-card" style={{ padding: '40px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                                <div>
                                    <h3 style={{ fontSize: '1.8rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '-1px' }}>Infrastruktura Staza</h3>
                                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', fontWeight: 700 }}>Detaljan prikaz po težinskim nivoima</p>
                                </div>
                                <div className="glass-pane" style={{ padding: '8px 20px', borderRadius: '15px', fontSize: '0.7rem', fontWeight: 900, color: 'var(--accent-cyan)' }}>
                                    Live Status
                                </div>
                            </div>

                            <div className="difficulty-bar-container" style={{ height: '30px', borderRadius: '15px', marginBottom: '40px' }}>
                                {Object.entries(runsByDifficulty).map(([diff, s]: [string, any]) => {
                                    const percent = (s.lengthKm / (totalKm || 1)) * 100;
                                    const config = diffConfig[diff] || { class: 'diff-advanced' };
                                    return (
                                        <div
                                            key={diff}
                                            className={`diff-bar ${config.class}`}
                                            style={{ width: `${percent}%` }}
                                            title={diff}
                                        />
                                    );
                                })}
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
                                {Object.entries(runsByDifficulty).map(([diff, s]: [string, any]) => {
                                    const config = diffConfig[diff] || { class: 'diff-advanced', label: diff };
                                    return (
                                        <div key={diff} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px', background: 'rgba(255,255,255,0.02)', borderRadius: '20px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                                <div className={`icon-circle ${config.class}`} style={{ width: '12px', height: '12px', borderRadius: '50%' }} />
                                                <div style={{ fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase' }}>{config.label}</div>
                                            </div>
                                            <div style={{ textAlign: 'right' }}>
                                                <div style={{ fontSize: '1.1rem', fontWeight: 900 }}>{s.lengthKm.toFixed(1)} km</div>
                                                <div style={{ fontSize: '0.6rem', color: 'var(--text-secondary)', fontWeight: 800 }}>Dostupno</div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </section>

                        {/* Ski Pass Prices - NEW COMPACT TABLE LAYOUT */}
                        {resort.skiPassPrices && (
                            <section className="glass-card" style={{ padding: '40px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                                    <div>
                                        <h3 style={{ fontSize: '1.8rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '-1px' }}>Ski Pass Cene</h3>
                                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', fontWeight: 700 }}>Zvanični cenovnik po sezonama i uzrastu</p>
                                    </div>
                                    <FileText className="text-cyan-400" size={32} />
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
                                    {resort.skiPassPrices.seasons.map((season, idx) => (
                                        <div key={idx} style={{ background: 'rgba(255,255,255,0.02)', borderRadius: '30px', padding: '30px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', paddingBottom: '15px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                                <h4 style={{ fontSize: '1.1rem', fontWeight: 900, color: 'var(--accent-cyan)', textTransform: 'uppercase' }}>{season.name}</h4>
                                                <span style={{ fontSize: '0.75rem', fontWeight: 800, opacity: 0.6 }}>{season.dates}</span>
                                            </div>

                                            <div style={{ overflowX: 'auto' }}>
                                                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                                                    <thead>
                                                        <tr>
                                                            <th style={{ padding: '12px 0', fontSize: '0.7rem', fontWeight: 900, textTransform: 'uppercase', opacity: 0.5, borderBottom: '2px solid rgba(255,255,255,0.1)' }}>Trajanje</th>
                                                            <th style={{ padding: '12px 0', fontSize: '0.7rem', fontWeight: 900, textTransform: 'uppercase', opacity: 0.5, borderBottom: '2px solid rgba(255,255,255,0.1)' }}>Odrasli</th>
                                                            <th style={{ padding: '12px 0', fontSize: '0.7rem', fontWeight: 900, textTransform: 'uppercase', opacity: 0.5, borderBottom: '2px solid rgba(255,255,255,0.1)' }}>Mladi</th>
                                                            <th style={{ padding: '12px 0', fontSize: '0.7rem', fontWeight: 900, textTransform: 'uppercase', opacity: 0.5, borderBottom: '2px solid rgba(255,255,255,0.1)' }}>Deca</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {season.prices.map((p, pIdx) => (
                                                            <tr key={pIdx}>
                                                                <td style={{ padding: '20px 0', fontSize: '0.85rem', fontWeight: 900, textTransform: 'uppercase' }}>{p.duration}</td>
                                                                <td style={{ padding: '20px 0' }}>
                                                                    <div style={{ fontSize: '1.1rem', fontWeight: 900 }}>€{p.adult.price.toFixed(2)}</div>
                                                                    <div style={{ fontSize: '0.6rem', fontWeight: 800, opacity: 0.5 }}>{p.adult.label.includes('(') ? p.adult.label.split('(')[1].replace(')', '') : p.adult.label}</div>
                                                                </td>
                                                                <td style={{ padding: '20px 0' }}>
                                                                    <div style={{ fontSize: '1.1rem', fontWeight: 900 }}>€{p.youth.price.toFixed(2)}</div>
                                                                    <div style={{ fontSize: '0.6rem', fontWeight: 800, opacity: 0.5 }}>{p.youth.label.includes('(') ? p.youth.label.split('(')[1].replace(')', '') : p.youth.label}</div>
                                                                </td>
                                                                <td style={{ padding: '20px 0' }}>
                                                                    <div style={{ fontSize: '1.1rem', fontWeight: 900 }}>€{p.child.price.toFixed(2)}</div>
                                                                    <div style={{ fontSize: '0.6rem', fontWeight: 800, opacity: 0.5 }}>{p.child.label.includes('(') ? p.child.label.split('(')[1].replace(')', '') : p.child.label}</div>
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <p style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', marginTop: '25px', fontStyle: 'italic', fontWeight: 700, textAlign: 'center' }}>
                                    *Deca 0-5 god besplatno ili Toddler karta (6€). Cene su informativne i podložne promenama.
                                </p>
                            </section>
                        )}

                        {/* Ski Map Large */}
                        <section style={{ marginTop: '20px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '20px' }}>
                                <h3 style={{ fontSize: '1.8rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '-1px' }}>Detaljna Ski Mapa</h3>
                                <button
                                    onClick={() => window.open(resort.mapImageUrl || 'https://openskimap.org', '_blank')}
                                    style={{ color: 'var(--accent-cyan)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 800, fontSize: '0.7rem', textTransform: 'uppercase' }}
                                >
                                    Puna Rezolucija <ExternalLink size={14} style={{ marginLeft: '5px' }} />
                                </button>
                            </div>
                            <div className="glass-card" style={{ padding: '20px', borderRadius: '40px', overflow: 'hidden' }}>
                                <img
                                    src={resort.mapImageUrl || 'https://images.unsplash.com/photo-1544256718-3bda237f3944?auto=format&fit=crop&q=80&w=2000'}
                                    style={{ width: '100%', height: 'auto', borderRadius: '30px' }}
                                    alt="Official Ski Map"
                                    referrerPolicy="no-referrer"
                                    onError={(e) => {
                                        (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1544256718-3bda237f3944?auto=format&fit=crop&q=80&w=2000';
                                    }}
                                />
                            </div>
                        </section>
                    </div>

                    {/* Right Column: Weather & CTA */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>

                        {/* Live Weather Forecast */}
                        <div className="glass-card" style={{ padding: '40px', border: '1px solid var(--accent-cyan-30, rgba(0, 229, 255, 0.1))' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '40px' }}>
                                <h4 style={{ fontSize: '1.2rem', fontWeight: 900, textTransform: 'uppercase' }}>Prognoza Uživo</h4>
                                <Cloud className="text-cyan-400" />
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                {[
                                    { level: 'Vrh planine', weather: resort.weather.summit, icon: Wind },
                                    { level: 'Baza planine', weather: resort.weather.base, icon: Activity }
                                ].map((w, i) => (
                                    <div key={i} className="glass-pane" style={{ padding: '20px', borderRadius: '25px' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
                                            <span style={{ fontSize: '0.6rem', fontWeight: 900, textTransform: 'uppercase', color: 'var(--accent-cyan)' }}>{w.level}</span>
                                            <span style={{ fontSize: '0.6rem', fontWeight: 700, opacity: 0.5 }}>{w.weather.conditions}</span>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                                            <div style={{ fontSize: '2.5rem', fontWeight: 900 }}>{w.weather.temp}°</div>
                                            <div style={{ textAlign: 'right' }}>
                                                <div style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-secondary)' }}>Vetar: {w.weather.windSpeed} km/h</div>
                                                <div style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-secondary)' }}>FEELS LIKE: {w.weather.feelsLike}°</div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div style={{ marginTop: '40px', paddingTop: '30px', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: 800 }}>
                                    <span style={{ color: 'var(--text-secondary)' }}>Zvanični sajt:</span>
                                    <a href={resort.websiteUrl || '#'} target="_blank" style={{ color: 'var(--accent-cyan)', textDecoration: 'none' }}>Poseti</a>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: 800 }}>
                                    <span style={{ color: 'var(--text-secondary)' }}>Ažurirano:</span>
                                    <span>Pre par sekundi</span>
                                </div>
                            </div>
                        </div>

                        {/* Live Weather Forecast */}
                        <div className="glass-card" style={{ padding: '40px', border: '1px solid var(--accent-cyan-30, rgba(0, 229, 255, 0.1))' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '40px' }}>
                                <h4 style={{ fontSize: '1.2rem', fontWeight: 900, textTransform: 'uppercase' }}>Prognoza Uživo</h4>
                                <Cloud className="text-cyan-400" />
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                {[
                                    { level: 'Vrh planine', weather: resort.weather.summit, icon: Wind },
                                    { level: 'Baza planine', weather: resort.weather.base, icon: Activity }
                                ].map((w, i) => (
                                    <div key={i} className="glass-pane" style={{ padding: '20px', borderRadius: '25px' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                <w.icon size={16} className="text-cyan-400" />
                                                <span style={{ fontSize: '0.75rem', fontWeight: 900, textTransform: 'uppercase' }}>{w.level}</span>
                                            </div>
                                            <span style={{ color: 'var(--accent-cyan)', fontWeight: 900, fontSize: '1.2rem' }}>{w.weather.temp}°C</span>
                                        </div>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                                            <div style={{ background: 'rgba(255,255,255,0.02)', padding: '10px 15px', borderRadius: '15px' }}>
                                                <div style={{ fontSize: '0.55rem', fontWeight: 800, opacity: 0.5, textTransform: 'uppercase' }}>Vetar</div>
                                                <div style={{ fontSize: '0.85rem', fontWeight: 900 }}>{w.weather.windSpeed} km/h</div>
                                            </div>
                                            <div style={{ background: 'rgba(255,255,255,0.02)', padding: '10px 15px', borderRadius: '15px' }}>
                                                <div style={{ fontSize: '0.55rem', fontWeight: 800, opacity: 0.5, textTransform: 'uppercase' }}>Vidljivost</div>
                                                <div style={{ fontSize: '0.85rem', fontWeight: 900 }}>{w.weather.visibility} m</div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div style={{ marginTop: '40px', paddingTop: '30px', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: 800 }}>
                                    <span style={{ color: 'var(--text-secondary)' }}>Zvanični sajt:</span>
                                    <a href={resort.websiteUrl || '#'} target="_blank" style={{ color: 'var(--accent-cyan)', textDecoration: 'none' }}>Poseti</a>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: 800 }}>
                                    <span style={{ color: 'var(--text-secondary)' }}>Ažurirano:</span>
                                    <span>Pre par sekundi</span>
                                </div>
                            </div>
                        </div>

                        {/* Conversion Card */}
                        <div style={{ padding: '40px', borderRadius: '40px', background: 'linear-gradient(135deg, var(--accent-cyan) 0%, var(--petrol-600) 100%)', color: 'var(--bg-dark)' }}>
                            <h4 style={{ fontSize: '1.5rem', fontWeight: 900, textTransform: 'uppercase', lineHeight: 1.1, marginBottom: '20px' }}>
                                Spremni za avanturu?
                            </h4>
                            <p style={{ fontSize: '0.85rem', fontWeight: 700, opacity: 0.8, marginBottom: '30px' }}>
                                Naš tim nudi ekskluzivne pakete sa popustom na ski-pass i hotelski smeštaj direktno pored staze.
                            </p>
                            <button style={{ width: '100%', background: 'white', border: 'none', padding: '18px', borderRadius: '20px', fontWeight: 900, textTransform: 'uppercase', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', boxShadow: '0 10px 20px rgba(0,0,0,0.1)' }}>
                                Rezerviši odmah <ArrowRight size={20} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SkiResortDetail;
