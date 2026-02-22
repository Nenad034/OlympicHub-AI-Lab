import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Languages, FileText, Download, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getTranslation } from '../utils/translations';
import type { Language } from '../utils/translations';

const DocumentPreviewDemo: React.FC = () => {
    const navigate = useNavigate();
    const [lang, setLang] = useState<Language>('Srpski');
    const t = getTranslation(lang);

    const mockData = {
        hotelName: "Aman Sveti Stefan",
        destination: "Sveti Stefan, Crna Gora",
        period: "15.07.2026 - 22.07.2026",
        passengers: ["Nenad Lazic", "Marko Petrovic"],
        totalPrice: "1,250.00 €"
    };

    return (
        <div className="module-container fade-in" style={{ padding: '40px', maxWidth: '1200px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <button onClick={() => navigate(-1)} className="btn-icon circle">
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h1 style={{ fontSize: '28px', fontWeight: '800', margin: 0 }}>Simulacija Dokumentacije</h1>
                        <p style={{ color: 'var(--text-secondary)' }}>Pogledajte kako se dokumenti prilagođavaju izabranom jeziku</p>
                    </div>
                </div>

                <div style={{ display: 'flex', background: 'var(--bg-card)', padding: '6px', borderRadius: '14px', border: '1px solid var(--border)', gap: '4px' }}>
                    <button
                        onClick={() => setLang('Srpski')}
                        className={`tab-btn ${lang === 'Srpski' ? 'active' : ''}`}
                        style={tabStyle(lang === 'Srpski')}
                    >
                        Srpski (SR)
                    </button>
                    <button
                        onClick={() => setLang('Engleski')}
                        className={`tab-btn ${lang === 'Engleski' ? 'active' : ''}`}
                        style={tabStyle(lang === 'Engleski')}
                    >
                        English (EN)
                    </button>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 400px', gap: '40px' }}>
                {/* PDF Preview Area */}
                <div style={{
                    background: '#fff',
                    borderRadius: '8px',
                    boxShadow: '0 20px 50px rgba(0,0,0,0.3)',
                    padding: '60px',
                    color: '#333',
                    minHeight: '800px',
                    fontFamily: "'Segoe UI', Roboto, sans-serif"
                }}>
                    {/* Header */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #667eea', paddingBottom: '20px', marginBottom: '40px' }}>
                        <div>
                            <h2 style={{ color: '#667eea', margin: 0, fontSize: '24px' }}>O L Y M P I C &nbsp; H U B</h2>
                            <p style={{ margin: '5px 0', fontSize: '12px', color: '#666' }}>Travel & Technology Solutions</p>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: '18px', fontWeight: '700', color: '#333' }}>V O U C H E R</div>
                            <p style={{ margin: '5px 0', fontSize: '12px', color: '#666' }}>ID: #OH-2026-X821</p>
                        </div>
                    </div>

                    {/* Voucher Content */}
                    <div style={{ marginBottom: '40px' }}>
                        <h3 style={{ fontSize: '16px', color: '#667eea', textTransform: 'uppercase', marginBottom: '15px' }}>{t.basicInfo}</h3>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <tbody>
                                <tr>
                                    <td style={{ padding: '10px 0', borderBottom: '1px solid #eee', color: '#666', width: '200px' }}>{t.hotel}</td>
                                    <td style={{ padding: '10px 0', borderBottom: '1px solid #eee', fontWeight: '700' }}>{mockData.hotelName}</td>
                                </tr>
                                <tr>
                                    <td style={{ padding: '10px 0', borderBottom: '1px solid #eee', color: '#666' }}>{t.destinations} / {t.city}</td>
                                    <td style={{ padding: '10px 0', borderBottom: '1px solid #eee' }}>{mockData.destination}</td>
                                </tr>
                                <tr>
                                    <td style={{ padding: '10px 0', borderBottom: '1px solid #eee', color: '#666' }}>{t.period}</td>
                                    <td style={{ padding: '10px 0', borderBottom: '1px solid #eee' }}>{mockData.period}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    <div style={{ marginBottom: '40px' }}>
                        <h3 style={{ fontSize: '16px', color: '#667eea', textTransform: 'uppercase', marginBottom: '15px' }}>{t.travelers}</h3>
                        <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '8px' }}>
                            {mockData.passengers.map((p, i) => (
                                <div key={i} style={{ padding: '5px 0', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <CheckCircle2 size={14} color="#10b981" />
                                    <span>{p}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Pricing */}
                    <div style={{ marginTop: 'auto', borderTop: '2px solid #eee', paddingTop: '20px', display: 'flex', justifyContent: 'flex-end' }}>
                        <div style={{ textAlign: 'right' }}>
                            <span style={{ fontSize: '14px', color: '#666' }}>{t.totalPrice}:</span>
                            <div style={{ fontSize: '28px', fontWeight: '800', color: '#667eea' }}>{mockData.totalPrice}</div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div style={{ marginTop: '100px', textAlign: 'center', color: '#999', fontSize: '10px', borderTop: '1px solid #eee', paddingTop: '20px' }}>
                        {t.footerTag} | {t.page} 1 {t.of} 1
                    </div>
                </div>

                {/* Automation Panel */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div className="app-card" style={{ padding: '24px' }}>
                        <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <Languages size={20} color="var(--accent)" /> AI Prevodna Logika
                        </h3>
                        <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
                            Sistem na osnovu polja <code>language</code> u profilu subagenta automatski povlači set labela:
                        </p>
                        <div style={{ background: 'rgba(255,255,255,0.03)', padding: '15px', borderRadius: '12px', marginTop: '15px', fontFamily: 'monospace', fontSize: '12px' }}>
                            {lang === 'Srpski' ? (
                                <>
                                    "docTitle": "Plan Putovanja"<br />
                                    "accommodation": "Smeštaj"<br />
                                    "totalPrice": "Ukupna Cena"
                                </>
                            ) : (
                                <>
                                    "docTitle": "Trip Plan"<br />
                                    "accommodation": "Accommodation"<br />
                                    "totalPrice": "Total Price"
                                </>
                            )}
                        </div>
                    </div>

                    <div className="app-card" style={{ padding: '24px', background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1), transparent)' }}>
                        <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '15px' }}>Prednosti</h3>
                        <ul style={{ paddingLeft: '20px', fontSize: '14px', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            <li>Automatski vaučeri za ino-partnere</li>
                            <li>Dvojezične fakture u par sekundi</li>
                            <li>AI prevod napomena (Notes) u realnom vremenu</li>
                            <li>Profesionalniji imidž agencije</li>
                        </ul>
                        <button className="btn-primary" style={{ width: '100%', marginTop: '20px' }}>
                            <Download size={18} /> Preuzmi PDF ({lang === 'Srpski' ? 'SR' : 'EN'})
                        </button>
                    </div>
                </div>
            </div>

            <style>{`
                .active-tab { background: var(--accent); color: white; }
                .tab-btn { border: none; padding: 8px 16px; border-radius: 10px; cursor: pointer; font-weight: 600; font-size: 13px; transition: 0.2s; }
            `}</style>
        </div>
    );
};

const tabStyle = (isActive: boolean) => ({
    background: isActive ? 'var(--accent)' : 'transparent',
    color: isActive ? '#fff' : 'var(--text-secondary)',
});

export default DocumentPreviewDemo;
