import React, { useState, useEffect } from 'react';
import {
    CloudSnow, MapPin, Wind, Thermometer, Info,
    CheckCircle, XCircle, AlertTriangle, Search,
    RefreshCw, Navigation, Maximize2, Mountain,
    BarChart3, Clock, ArrowUpCircle, ArrowDownCircle
} from 'lucide-react';
import { skiApiService } from '../integrations/ski/api/skiApiService';
import type { SkiResort } from '../integrations/ski/types/skiTypes';
import './HotelbedsTest.css'; // Reusing established styles

const SkiTest: React.FC = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [resorts, setResorts] = useState<SkiResort[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [lastUpdated, setLastUpdated] = useState<string>('');

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const data = await skiApiService.searchResorts(searchTerm);
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
        const interval = setInterval(fetchData, 300000); // refresh every 5 mins
        return () => clearInterval(interval);
    }, []);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        fetchData();
    };

    return (
        <div className="hb-test-page">
            <div className="hb-header" style={{ background: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)' }}>
                <div className="hb-header-left">
                    <div className="hb-logo" style={{ background: '#fff' }}>
                        <CloudSnow size={36} color="#1e3a8a" />
                    </div>
                    <div>
                        <h1 style={{ color: '#fff' }}>Ski Live Dashboard</h1>
                        <p style={{ color: '#bfdbfe' }}>Real-time snow reports, trail status and mountain weather</p>
                    </div>
                </div>
                <div className="hb-header-right">
                    <div className="hb-status-pill configured">
                        <Clock size={14} />
                        <span>Last update: {lastUpdated}</span>
                    </div>
                </div>
            </div>

            <div className="hb-content">
                <div className="hb-section">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                        <h2>Praćenje Ski Centara</h2>
                        <form onSubmit={handleSearch} style={{ display: 'flex', gap: '10px' }}>
                            <div className="hb-form-group" style={{ marginBottom: 0 }}>
                                <input
                                    className="hb-input"
                                    placeholder="Pretraži centar ili državu..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    style={{ width: '300px' }}
                                />
                            </div>
                            <button className="hb-btn primary" type="submit" disabled={isLoading}>
                                {isLoading ? <RefreshCw className="spin" size={16} /> : <Search size={16} />}
                            </button>
                        </form>
                    </div>

                    <div className="hb-results" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', display: 'grid', gap: '20px' }}>
                        {resorts.map(resort => (
                            <div key={resort.id} className="hb-hotel-card" style={{ padding: '0', overflow: 'hidden' }}>
                                <div style={{ padding: '20px', borderBottom: '1px solid var(--border)' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                        <div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                                                <span className="hb-api-badge" style={{ background: '#dbeafe', color: '#1e40af' }}>{resort.country}</span>
                                                <span className={`hb-status-pill ${resort.status === 'open' ? 'configured' : 'unconfigured'}`}>
                                                    {resort.status === 'open' ? 'OTVORENO' : 'ZATVORENO'}
                                                </span>
                                            </div>
                                            <h3 style={{ fontSize: '1.4rem', margin: '4px 0' }}>{resort.name}</h3>
                                            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                                                <MapPin size={12} /> {resort.region}
                                            </p>
                                        </div>
                                        <div style={{ textAlign: 'right' }}>
                                            <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#3b82f6' }}>{resort.snowReport.summitDepth}cm</div>
                                            <div style={{ fontSize: '0.8rem', opacity: 0.7 }}>Sneg na vrhu</div>
                                        </div>
                                    </div>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', padding: '15px', background: 'rgba(255,255,255,0.03)', gap: '15px' }}>
                                    <div className="ski-stat-box">
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                                            <CloudSnow size={16} /> <strong>Snow Report</strong>
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                <span>Base Depth:</span>
                                                <span>{resort.snowReport.baseDepth} cm</span>
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#10b981', fontWeight: 'bold' }}>
                                                <span>New 24h:</span>
                                                <span>+{resort.snowReport.newSnow24h} cm</span>
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                <span>Stanje:</span>
                                                <span>{resort.snowReport.snowCondition}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="ski-stat-box">
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                                            <Mountain size={16} /> <strong>Mountain Status</strong>
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                <span>Liftovi:</span>
                                                <span>{resort.mountainStatus.liftsOpen}/{resort.mountainStatus.liftsTotal}</span>
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                <span>Staze:</span>
                                                <span>{resort.mountainStatus.trailsOpen}/{resort.mountainStatus.trailsTotal}</span>
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                <span>Noćno:</span>
                                                <span>{resort.mountainStatus.nightSkiing ? 'DA' : 'NE'}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div style={{ padding: '20px' }}>
                                    <h4 style={{ marginBottom: '12px', fontSize: '0.9rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px' }}>Prognoza po visinama</h4>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px' }}>
                                        {['summit', 'mid', 'base'].map((level) => {
                                            const w = resort.weather[level as keyof typeof resort.weather];
                                            return (
                                                <div key={level} style={{ flex: 1, textAlign: 'center', padding: '10px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)' }}>
                                                    <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', marginBottom: '5px', opacity: 0.6 }}>{level}</div>
                                                    <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{w.temp}°C</div>
                                                    <div style={{ fontSize: '0.8rem', margin: '4px 0' }}>{w.conditions}</div>
                                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', fontSize: '0.7rem', opacity: 0.8 }}>
                                                        <Wind size={10} /> {w.windSpeed} km/h
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                                <div className="card-footer" style={{ borderTop: '1px solid var(--border)', background: 'transparent' }}>
                                    <button className="hb-btn primary full-width" style={{ borderRadius: 0 }}>
                                        Detaljna Ski Mapa <Navigation size={14} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>

                    {resorts.length === 0 && !isLoading && (
                        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
                            <CloudSnow size={48} style={{ opacity: 0.2, marginBottom: '10px' }} />
                            <p>Nema rezultata za vašu pretragu.</p>
                        </div>
                    )}
                </div>
            </div>

            <style>{`
                .ski-stat-box {
                    font-size: 0.85rem;
                }
                .spin {
                    animation: spin 1s linear infinite;
                }
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
};

export default SkiTest;
