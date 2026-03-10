import React, { useState } from 'react';
import {
    Brain, Target, Users, Mail, MessageSquare, Zap,
    TrendingUp, FileText, Gift, Send, PlayCircle, Settings
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const PERSONAS = [
    { id: 'sandler', name: 'Sandler', role: 'Edukativna Prodaja', quote: '"You get what you pay for" - Diskvalifikacija jeftinog', color: '#ffb300' },
    { id: 'musashi', name: 'Miyamoto Musashi', role: 'Strategija', quote: 'Rani buking je pobeda izvojevana pre prve bitke', color: '#ef4444' },
    { id: 'aurelius', name: 'Marko Aurelije', role: 'Stoicizam', quote: 'Mir počinje onog trenutka kada delegiraš brigu nama', color: '#3b82f6' },
    { id: 'coelho', name: 'Paulo Koeljo', role: 'Inspiracija', quote: 'Putovanje je transformacija duše, a ne promena mesta', color: '#10b981' }
];

const TRIGGERS = [
    { id: 1, name: 'Grčka - Kasni Kapaciteti', audience: 'Porodice (Prošle Sezone)', condition: 'Popunjenost > 85%', status: 'active' },
    { id: 2, name: 'Kopaonik Ski Opening', audience: 'Mladi & Parovi', condition: 'Do početka < 45 dana', status: 'paused' },
    { id: 3, name: 'Silent Loyalty Upsell', audience: 'VIP Dosijei', condition: 'LTV > 5000 EUR', status: 'active' }
];

export default function SmartMarketingHub() {
    const [activeTab, setActiveTab] = useState('matrix');
    const [selectedPersona, setSelectedPersona] = useState('sandler');
    const [isGenerating, setIsGenerating] = useState(false);
    const [generatedText, setGeneratedText] = useState('');

    const handleGenerate = () => {
        setIsGenerating(true);
        setTimeout(() => {
            const persona = PERSONAS.find(p => p.id === selectedPersona);
            if (persona?.id === 'sandler') {
                setGeneratedText('Da li vas zaista ispunjava jurnjava za najjeftinijom ponudom na internetu? Mnogi klijenti kod nas dolaze umorni od skrivenih troškova i stresa. Naša cena nije najniža, ali garantujemo mir, transparentnost i uslugu od momenta kada izađete iz kuće do povratka. Ako tražite mir, na pravom ste mestu.');
            } else if (persona?.id === 'musashi') {
                setGeneratedText('Pobednička strategija letovanja ne donosi se u junu, već u januaru. Obezbeđivanje najboljih resursa dok ostali još uvek spavaju je odlika vrsnih stratega. Bukirajte danas i dozvolite vremenu da radi u vašu korist.');
            } else if (persona?.id === 'aurelius') {
                setGeneratedText('Zašto prepuštate svoj unutrašnji mir nečemu što ne možete kontrolisati? Preuzimanjem rizika na sebe, mi vas oslobađamo tereta organizacije. Vaš jedini zadatak je da prisustvujete trenutku, mi brinemo o ostalom.');
            } else {
                setGeneratedText('Kada putujemo, ne menjamo samo geografsku lokaciju; mi menjamo način na koji posmatramo svet. Dopustite da vam organizujemo putovanje koje neće ostati samo slika u telefonu, već trajni zapis u vašoj duši.');
            }
            setIsGenerating(false);
        }, 1500);
    };

    return (
        <div style={{ padding: '32px', minHeight: '100vh', background: 'var(--bg-main)', color: 'var(--text-primary)' }}>

            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                    <div style={{ width: '64px', height: '64px', borderRadius: '16px', background: 'var(--petroleum)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 32px rgba(0,0,0,0.3)' }}>
                        <Brain size={32} style={{ color: 'var(--accent-cyan)' }} />
                    </div>
                    <div>
                        <h1 style={{ margin: 0, fontSize: '32px', fontWeight: 950, letterSpacing: '-1px' }}>AI SMART MARKETING HUB</h1>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '4px', color: 'var(--text-secondary)' }}>
                            <span style={{ fontSize: '14px', fontWeight: 600 }}>Filozofski Content Matrix & Data-Driven Trigeri</span>
                            <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: 'currentColor' }}></div>
                            <span style={{ fontSize: '12px', background: 'rgba(0,229,255,0.1)', color: 'var(--accent-cyan)', padding: '4px 12px', borderRadius: '20px', fontWeight: 900 }}>V5 NEURAL ENGINE</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div style={{ display: 'flex', gap: '12px', marginBottom: '32px' }}>
                {[
                    { id: 'matrix', label: 'CONTENT MATRIX', icon: MessageSquare },
                    { id: 'triggers', label: 'SMART TRIGGERS', icon: Zap },
                    { id: 'loyalty', label: 'SILENT LOYALTY', icon: Gift }
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`v5-btn ${activeTab === tab.id ? 'v5-btn-primary' : 'v5-btn-secondary'}`}
                        style={{ padding: '0 24px', height: '48px', fontSize: '13px', display: 'flex', gap: '8px' }}
                    >
                        <tab.icon size={16} /> {tab.label}
                    </button>
                ))}
            </div>

            <AnimatePresence mode="wait">
                <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3 }}
                >
                    {activeTab === 'matrix' && (
                        <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '32px' }}>
                            {/* Personas Sidebar */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                <h3 style={{ fontSize: '14px', fontWeight: 900, color: 'var(--text-secondary)', letterSpacing: '1px', marginBottom: '8px' }}>AI PERSONE (PATTERN INTERRUPT)</h3>
                                {PERSONAS.map(p => (
                                    <div
                                        key={p.id}
                                        onClick={() => setSelectedPersona(p.id)}
                                        className="v5-card"
                                        style={{
                                            padding: '16px',
                                            cursor: 'pointer',
                                            borderLeft: `4px solid ${p.color}`,
                                            background: selectedPersona === p.id ? `linear-gradient(90deg, ${p.color}15 0%, transparent 100%)` : 'transparent',
                                            borderColor: selectedPersona === p.id ? p.color : 'var(--glass-border)'
                                        }}
                                    >
                                        <div style={{ fontSize: '16px', fontWeight: 900, marginBottom: '4px' }}>{p.name}</div>
                                        <div style={{ fontSize: '12px', color: p.color, fontWeight: 700, marginBottom: '8px' }}>{p.role}</div>
                                        <div style={{ fontSize: '11px', color: 'var(--text-secondary)', fontStyle: 'italic' }}>{p.quote}</div>
                                    </div>
                                ))}
                            </div>

                            {/* Generator Area */}
                            <div className="v5-card" style={{ padding: '32px', display: 'flex', flexDirection: 'column' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                                    <div>
                                        <h2 style={{ fontSize: '20px', fontWeight: 950 }}>GENERATOR SADRŽAJA</h2>
                                        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                                            Kreira prilagođene newslettere i SMS poruke prema tonu odabrane persone.
                                        </p>
                                    </div>
                                    <div style={{ display: 'flex', gap: '12px' }}>
                                        <button className="v5-btn v5-btn-secondary" style={{ width: '48px', height: '48px', padding: 0, justifyContent: 'center' }}>
                                            <Settings size={20} />
                                        </button>
                                        <button
                                            className="v5-btn v5-btn-primary"
                                            onClick={handleGenerate}
                                            disabled={isGenerating}
                                            style={{ height: '48px', padding: '0 24px' }}
                                        >
                                            {isGenerating ? <Zap size={20} className="spin" /> : <PlayCircle size={20} />}
                                            {isGenerating ? 'GENERISANJE...' : 'SINTETIZUJ TEKST'}
                                        </button>
                                    </div>
                                </div>

                                {/* Editor / Output */}
                                <div style={{ flex: 1, background: 'rgba(0,0,0,0.2)', borderRadius: '12px', border: '1px solid var(--glass-border)', padding: '24px', minHeight: '300px', display: 'flex', flexDirection: 'column' }}>
                                    {generatedText ? (
                                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ flex: 1 }}>
                                            <div style={{ fontSize: '15px', lineHeight: 1.8, color: 'var(--text-primary)', whiteSpace: 'pre-wrap' }}>
                                                {generatedText}
                                            </div>
                                        </motion.div>
                                    ) : (
                                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)', opacity: 0.5 }}>
                                            <Brain size={48} style={{ marginBottom: '16px' }} />
                                            <div>Aktivirajte neuralni engine za generisanje sadržaja</div>
                                        </div>
                                    )}
                                </div>

                                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '24px', gap: '12px' }}>
                                    <button className="v5-btn v5-btn-secondary" disabled={!generatedText}>
                                        <Mail size={16} style={{ marginRight: '8px' }} /> KREIRAJ NEWSLETTER
                                    </button>
                                    <button className="v5-btn v5-btn-primary" disabled={!generatedText} style={{ background: 'rgba(0, 229, 255, 0.1)', color: 'var(--accent-cyan)' }}>
                                        <Send size={16} style={{ marginRight: '8px' }} /> POKRENI KAMPANJU
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'triggers' && (
                        <div>
                            <div className="v5-card" style={{ padding: '24px', marginBottom: '24px', background: 'rgba(16, 185, 129, 0.05)', borderColor: 'rgba(16, 185, 129, 0.2)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                    <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(16, 185, 129, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981' }}>
                                        <Target size={24} />
                                    </div>
                                    <div>
                                        <h3 style={{ fontSize: '18px', fontWeight: 900, margin: 0 }}>Data-Driven Automation</h3>
                                        <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                                            Sistem automatski nadgleda Dosijee i šalje SMS/Email kada se ispune kritični uslovi (kapacitet prodaje).
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                {TRIGGERS.map(t => (
                                    <div key={t.id} className="v5-card" style={{ padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                                                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: t.status === 'active' ? '#10b981' : '#ef4444', boxShadow: `0 0 10px ${t.status === 'active' ? '#10b981' : '#ef4444'}` }}></div>
                                                <span style={{ fontSize: '16px', fontWeight: 900 }}>{t.name}</span>
                                            </div>
                                            <div style={{ display: 'flex', gap: '24px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                                                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Users size={14} /> Publika: {t.audience}</span>
                                                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><TrendingUp size={14} /> Uslov: {t.condition}</span>
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', gap: '12px' }}>
                                            <button className="v5-btn v5-btn-secondary" style={{ padding: '0 16px' }}>IZMENI LOGIKU</button>
                                            <div className="v5-toggle-switch" style={{ width: '50px', height: '26px', background: t.status === 'active' ? 'var(--accent-cyan)' : 'var(--glass-border)', borderRadius: '13px', position: 'relative', cursor: 'pointer' }}>
                                                <div style={{ position: 'absolute', top: '2px', left: t.status === 'active' ? '26px' : '2px', width: '22px', height: '22px', background: 'white', borderRadius: '50%', transition: 'all 0.2s' }}></div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {activeTab === 'loyalty' && (
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>
                            <div className="v5-card" style={{ padding: '32px', textAlign: 'center', alignSelf: 'start' }}>
                                <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(255, 179, 0, 0.1)', color: '#ffb300', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px auto' }}>
                                    <Gift size={40} />
                                </div>
                                <h2 style={{ fontSize: '24px', fontWeight: 900, marginBottom: '16px' }}>SILENT LOYALTY ENGINE</h2>
                                <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '32px' }}>
                                    Praćenje dosijea bez svesti agenata. Sistem beleži Lifetime Value (LTV),
                                    datume rođenja i godišnjice. Na osnovu margina dobiti automatski nudi
                                    Room-upgrades bez finansijskog pritiska.
                                </p>
                                <button className="v5-btn v5-btn-primary" style={{ width: '100%', height: '56px' }}>
                                    SKENIRAJ DOSIJEE (684 ZAPISA)
                                </button>
                            </div>
                        </div>
                    )}
                </motion.div>
            </AnimatePresence>
        </div>
    );
}
