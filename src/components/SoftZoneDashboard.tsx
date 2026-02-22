import React, { useEffect, useState } from 'react';
import { useIntelligenceStore } from '../stores/intelligenceStore';
import { softZoneService } from '../services/softZoneService';
import { translations } from '../translations';
import { useThemeStore } from '../stores';
import './SoftZoneDashboard.css';

const SoftZoneDashboard: React.FC = () => {
    const { lang } = useThemeStore();
    const t = translations[lang];
    const { weatherContext, marketSentiment, activeTriggers } = useIntelligenceStore();
    const [isScanning, setIsScanning] = useState(false);

    const handleManualScan = async () => {
        setIsScanning(true);
        // Add a bit more dramatic delay to show scanning state
        await new Promise(r => setTimeout(r, 2000));
        await softZoneService.scanEnvironment();
        setIsScanning(false);
    };

    return (
        <div className="soft-zone-container">
            <header className="soft-zone-header">
                <div className="title-group">
                    <h1>{t.softZone}</h1>
                    <p className="subtitle">{t.intelligence} - Dinamičko prilagođavanje tržištu</p>
                </div>
                <button
                    className={`scan-button ${isScanning ? 'scanning' : ''}`}
                    onClick={handleManualScan}
                    disabled={isScanning}
                >
                    {isScanning ? (lang === 'sr' ? 'Skeniranje...' : 'Sensing...') : (lang === 'sr' ? 'Skeniraj Okruženje' : 'Scan Environment')}
                </button>
            </header>

            <div className="intelligence-grid">
                {/* 1. Environmental Sensors */}
                <section className="intelligence-card sensor-card">
                    <h3><span className="icon">🌡️</span> {t.sensors}</h3>
                    <div className="sensor-data">
                        <div className="data-item">
                            <label>{t.location}</label>
                            <span>{weatherContext.location}</span>
                        </div>
                        <div className="data-item">
                            <label>{t.temperature}</label>
                            <span className={weatherContext.isExtreme ? 'extreme' : ''}>
                                {weatherContext.temp}°C
                            </span>
                        </div>
                        <div className="data-item">
                            <label>{t.condition}</label>
                            <span>{weatherContext.condition}</span>
                        </div>
                    </div>
                    {weatherContext.isExtreme && (
                        <div className="status-alert warn">
                            {lang === 'sr' ? 'Sistem sugeriše prelazak na svežije destinacije.' : 'System suggests shifting priority to cooler destinations.'}
                        </div>
                    )}
                </section>

                {/* 2. Market Sentiment */}
                <section className="intelligence-card sentiment-card">
                    <h3><span className="icon">🧠</span> {t.sentiment}</h3>
                    <div className="sensor-data">
                        <div className="data-item">
                            <label>{t.riskLevel}</label>
                            <span className={`risk-${marketSentiment.riskLevel}`}>
                                {marketSentiment.riskLevel.toUpperCase()}
                            </span>
                        </div>
                        <div className="data-item">
                            <label>{t.economicTone}</label>
                            <span>{marketSentiment.economicTone}</span>
                        </div>
                    </div>
                    <div className="trending-tags">
                        <label>{t.trendingSignals}:</label>
                        <div className="tag-cloud">
                            {marketSentiment.trendingKeywords.map(kw => (
                                <span key={kw} className="tag">{kw}</span>
                            ))}
                        </div>
                    </div>
                </section>

                {/* 3. Active Reflexes (The "Meka Zona") */}
                <section className="intelligence-card reflexes-card">
                    <h3><span className="icon">⚡</span> {t.activeReflexes}</h3>
                    <div className="triggers-list">
                        {activeTriggers.length === 0 ? (
                            <p className="no-data">{t.baselineMode}. Sistem je u osnovnom režimu.</p>
                        ) : (
                            activeTriggers.map(trigger => (
                                <div key={trigger.id} className={`trigger-item severity-${trigger.severity}`}>
                                    <div className="trigger-header">
                                        <h4>{trigger.label}</h4>
                                        <span className="type-badge">{trigger.type}</span>
                                    </div>
                                    <p className="trigger-desc">{trigger.description}</p>
                                    <div className="trigger-action">
                                        <strong>{t.reflexAction}:</strong> {trigger.action}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </section>
            </div>

            {/* Practical UI Impact Example */}
            <section className="impact-preview intelligence-card">
                <h3><span className="icon">🖼️</span> {t.dynamicImpact} (Preview)</h3>
                <div className="preview-content">
                    {activeTriggers.some(t => t.id === 'heat_wave_reflex') ? (
                        <div className="hero-preview cool-cation">
                            <div className="content">
                                <h2>Preskočite vrelinu! 🏔️</h2>
                                <p>Trenutno je 42°C u vašim omiljenim letovalištima. Otkrijte svežinu Alpa i fjordova Norveške.</p>
                                <button className="cta-button">Istraži "Cool-cation" ponude</button>
                            </div>
                        </div>
                    ) : (
                        <div className="hero-preview standard">
                            <div className="content">
                                <h2>Vaš letnji odmor počinje ovde 🌊</h2>
                                <p>Najbolje ponude za more i sunce na jednom mestu.</p>
                                <button className="cta-button">Vidi sve ponude</button>
                            </div>
                        </div>
                    )}
                </div>
            </section>
        </div>
    );
};

export default SoftZoneDashboard;
