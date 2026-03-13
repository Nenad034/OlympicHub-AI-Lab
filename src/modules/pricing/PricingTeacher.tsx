import React, { useState } from 'react';
import { 
    Upload, FileSpreadsheet, Brain, CheckCircle2, AlertTriangle, 
    ArrowRight, Save, Building2, MapPin, Star, Users, Info, X, Ticket, Calendar
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface MappingField {
    source: string;
    target: string;
    status: 'ok' | 'warning' | 'error';
    suggestion?: string;
}

const PricingTeacher: React.FC = () => {
    const [file, setFile] = useState<File | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [step, setStep] = useState<'upload' | 'onboarding' | 'mapping' | 'blueprint' | 'complete'>('upload');
    
    // Mock mapping data
    const [mappings, setMappings] = useState<MappingField[]>([
        { source: 'Hotel name', target: 'hotelName', status: 'ok' },
        { source: 'Room Type', target: 'roomType', status: 'ok' },
        { source: 'Price/Day', target: 'netPrice', status: 'ok' },
        { source: 'SGL Supplement', target: 'supplement_single', status: 'warning', suggestion: 'Doplata za jednokrevetnu' },
        { source: 'HB Extra', target: 'service_hb', status: 'error', suggestion: 'Usluga Polupansion' }
    ]);

    const [hotelInfo, setHotelInfo] = useState({
        name: 'Hotel Materada Plava Laguna',
        id: 'HR-POR-202',
        category: '4*',
        location: 'Poreč, Hrvatska',
        pricelistName: 'Leto 2024 - Meeting Point',
        exists: false
    });

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files?.[0]) {
            setFile(e.target.files[0]);
            setIsAnalyzing(true);
            setTimeout(() => {
                setIsAnalyzing(false);
                setStep('onboarding');
            }, 2000);
        }
    };

    return (
        <div className="pricing-teacher-container" style={{ padding: '20px 0' }}>
            <AnimatePresence mode="wait">
                {step === 'upload' && (
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        style={{ textAlign: 'center', padding: '100px 40px', background: 'rgba(255,255,255,0.02)', borderRadius: '30px', border: '2px dashed var(--glass-border)' }}
                    >
                        <div style={{ marginBottom: '30px', position: 'relative', display: 'inline-block' }}>
                            <div style={{ position: 'absolute', inset: '-20px', background: 'var(--accent-cyan)', filter: 'blur(40px)', opacity: 0.2 }}></div>
                            <Upload size={80} color="var(--accent-cyan)" style={{ position: 'relative' }} />
                        </div>
                        <h2 style={{ fontSize: '32px', fontWeight: 800, marginBottom: '10px' }}>Učitaj Cenovnik za Obuku</h2>
                        <p style={{ color: 'var(--text-secondary)', marginBottom: '40px', fontSize: '16px' }}>
                            Prevucite Excel ili PDF fajl ovde kako bi AI analizirao strukturu dobavljača.
                        </p>
                        
                        <label className="luxury-btn" style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '12px', padding: '15px 40px', borderRadius: '15px', background: 'var(--accent-cyan)', color: '#000', fontWeight: 800 }}>
                            <FileSpreadsheet size={20} />
                            IZABERI FAJL
                            <input type="file" hidden onChange={handleFileUpload} />
                        </label>

                        {isAnalyzing && (
                            <div style={{ marginTop: '40px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '15px' }}>
                                <div className="loading-bar-container" style={{ width: '300px', height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '10px', overflow: 'hidden' }}>
                                    <motion.div 
                                        initial={{ width: 0 }}
                                        animate={{ width: '100%' }}
                                        transition={{ duration: 2 }}
                                        style={{ height: '100%', background: 'var(--accent-cyan)' }}
                                    ></motion.div>
                                </div>
                                <span style={{ fontSize: '13px', color: 'var(--accent-cyan)', fontWeight: 800 }}>AI ANALIZIRA MATRICU...</span>
                            </div>
                        )}
                    </motion.div>
                )}

                {step === 'onboarding' && (
                    <motion.div 
                        initial={{ opacity: 0, x: 50 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="glass-card"
                        style={{ padding: '40px' }}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '40px' }}>
                            <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--accent-cyan)', marginBottom: '8px' }}>
                                    <Brain size={18} />
                                    <span style={{ fontWeight: 800, fontSize: '12px', textTransform: 'uppercase' }}>Analiza Smeštaja</span>
                                </div>
                                <h3 style={{ margin: 0, fontSize: '28px', fontWeight: 800 }}>Prepoznat Novi Hotel</h3>
                            </div>
                            <div style={{ background: 'rgba(255,255,255,0.05)', padding: '8px 16px', borderRadius: '10px', fontSize: '12px', border: '1px solid var(--glass-border)' }}>
                                Sors: {file?.name}
                            </div>
                        </div>

                        <div className="onboarding-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                <div className="field-group">
                                    <label style={{ display: 'block', marginBottom: '10px', fontSize: '13px', color: 'var(--text-secondary)' }}>Naziv Hotela</label>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'rgba(0,0,0,0.2)', padding: '15px', borderRadius: '12px', border: '1px solid var(--accent-cyan)' }}>
                                        <Building2 size={20} color="var(--accent-cyan)" />
                                        <input value={hotelInfo.name} onChange={e => setHotelInfo({...hotelInfo, name: e.target.value})} style={{ background: 'transparent', border: 'none', color: '#fff', fontSize: '16px', fontWeight: 700, width: '100%' }} />
                                    </div>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                    <div className="field-group">
                                        <label style={{ display: 'block', marginBottom: '10px', fontSize: '13px', color: 'var(--text-secondary)' }}>Lokacija</label>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'rgba(0,0,0,0.2)', padding: '15px', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
                                            <MapPin size={20} color="var(--accent-cyan)" />
                                            <input value={hotelInfo.location} onChange={e => setHotelInfo({...hotelInfo, location: e.target.value})} style={{ background: 'transparent', border: 'none', color: '#fff', fontSize: '16px', fontWeight: 600, width: '100%' }} />
                                        </div>
                                    </div>
                                    <div className="field-group">
                                        <label style={{ display: 'block', marginBottom: '10px', fontSize: '13px', color: 'var(--text-secondary)' }}>Interni ID Hotela</label>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'rgba(0,0,0,0.2)', padding: '15px', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
                                            <Ticket size={20} color="var(--accent-cyan)" />
                                            <input value={hotelInfo.id} onChange={e => setHotelInfo({...hotelInfo, id: e.target.value})} style={{ background: 'transparent', border: 'none', color: '#fff', fontSize: '16px', fontWeight: 700, width: '100%' }} />
                                        </div>
                                    </div>
                                </div>
                                <div className="field-group">
                                    <label style={{ display: 'block', marginBottom: '10px', fontSize: '13px', color: 'var(--accent-cyan)', fontWeight: 800 }}>NAZIV NOVOG CENOVNIKA</label>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'rgba(0,0,0,0.2)', padding: '15px', borderRadius: '12px', border: '1.5px solid var(--accent-cyan)', boxShadow: '0 0 15px rgba(0, 229, 255, 0.2)' }}>
                                        <FileSpreadsheet size={20} color="var(--accent-cyan)" />
                                        <input value={hotelInfo.pricelistName} onChange={e => setHotelInfo({...hotelInfo, pricelistName: e.target.value})} placeholder="Npr: Summer Special 2024" style={{ background: 'transparent', border: 'none', color: '#fff', fontSize: '18px', fontWeight: 800, width: '100%', outline: 'none' }} />
                                    </div>
                                </div>
                                <div className="field-group">
                                    <label style={{ display: 'block', marginBottom: '10px', fontSize: '13px', color: 'var(--text-secondary)' }}>Kategorija</label>
                                    <div style={{ display: 'flex', gap: '10px' }}>
                                        {['3*', '4*', '5*'].map(cat => (
                                            <button 
                                                key={cat}
                                                onClick={() => setHotelInfo({...hotelInfo, category: cat})}
                                                style={{ flex: 1, padding: '12px', borderRadius: '10px', border: hotelInfo.category === cat ? '1px solid var(--accent-cyan)' : '1px solid var(--glass-border)', background: hotelInfo.category === cat ? 'rgba(0, 229, 255, 0.1)' : 'transparent', color: hotelInfo.category === cat ? 'var(--accent-cyan)' : 'var(--text-secondary)', fontWeight: 800, cursor: 'pointer' }}
                                            >
                                                {cat}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div style={{ background: 'rgba(0,0,0,0.2)', borderRadius: '20px', padding: '25px', border: '1px solid var(--glass-border)' }}>
                                <h4 style={{ margin: '0 0 20px 0', fontSize: '14px', fontWeight: 800, color: 'var(--accent-cyan)' }}>DETECTED ROOM TYPES</h4>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                    {[
                                        { type: 'Standard Soba', occ: '2-3 osobe' },
                                        { type: 'Family Room', occ: '2-4 osobe' },
                                        { type: 'Junior Suite', occ: '2-3 osobe' }
                                    ].map((r, i) => (
                                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: '10px', border: '1px solid var(--glass-border)' }}>
                                            <div style={{ fontWeight: 600 }}>{r.type}</div>
                                            <div style={{ fontSize: '11px', color: 'var(--accent-cyan)', background: 'rgba(0,229,255,0.1)', padding: '4px 8px', borderRadius: '6px' }}>{r.occ}</div>
                                        </div>
                                    ))}
                                </div>
                                <div style={{ marginTop: '20px', padding: '15px', background: 'rgba(34, 197, 94, 0.05)', borderRadius: '12px', border: '1px solid #22c55e33', display: 'flex', gap: '12px', alignItems: 'center' }}>
                                    <Info size={16} color="#22c55e" />
                                    <p style={{ margin: 0, fontSize: '11px', color: '#22c55e', lineHeight: 1.4 }}>
                                        Sistem je automatski prepoznao kapacitete na osnovu naziva kolona u fajlu.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div style={{ marginTop: '40px', display: 'flex', justifyContent: 'flex-end', gap: '15px' }}>
                            <button onClick={() => setStep('upload')} style={{ padding: '15px 30px', borderRadius: '12px', border: '1px solid var(--glass-border)', background: 'transparent', color: '#fff', fontWeight: 700, cursor: 'pointer' }}>ODUSTANI</button>
                            <button onClick={() => setStep('mapping')} style={{ padding: '15px 40px', borderRadius: '12px', border: 'none', background: 'var(--accent-cyan)', color: '#000', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                POTVRDI I NASTAVI NA MAPIRANJE <ArrowRight size={18} />
                            </button>
                        </div>
                    </motion.div>
                )}

                {step === 'mapping' && (
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="glass-card"
                        style={{ padding: '40px' }}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                            <h3 style={{ margin: 0, fontSize: '24px', fontWeight: 800 }}>Mapiranje Matrice Dobavljača</h3>
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#22c55e' }}><CheckCircle2 size={14} /> 3 OK</div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#eab308' }}><AlertTriangle size={14} /> 1 Sugestija</div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#ef4444' }}><X size={14} /> 1 Greška</div>
                            </div>
                        </div>

                        <div className="mapping-table" style={{ background: 'rgba(0,0,0,0.2)', borderRadius: '20px', border: '1px solid var(--glass-border)', overflow: 'hidden' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1.5fr 2fr', padding: '15px 25px', background: 'rgba(255,255,255,0.05)', borderBottom: '1px solid var(--glass-border)', fontSize: '11px', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px' }}>
                                <div>Polje iz Fajla</div>
                                <div>Sistemsko Polje</div>
                                <div>Akcija AI Agenta</div>
                            </div>
                            {mappings.map((m, i) => (
                                <div key={i} style={{ display: 'grid', gridTemplateColumns: '1.5fr 1.5fr 2fr', padding: '20px 25px', borderBottom: '1px solid var(--glass-border)', alignItems: 'center' }}>
                                    <div style={{ fontWeight: 700 }}>{m.source}</div>
                                    <div style={{ color: 'var(--accent-cyan)', fontWeight: 800 }}>{m.target}</div>
                                    <div>
                                        {m.status === 'ok' ? (
                                            <span style={{ fontSize: '12px', color: '#22c55e', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <CheckCircle2 size={16} /> Automatski mapirano
                                            </span>
                                        ) : (
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                <input 
                                                    placeholder={m.suggestion} 
                                                    style={{ flex: 1, background: 'rgba(255,191,0,0.05)', border: `1px solid ${m.status === 'warning' ? '#eab308' : '#ef4444'}`, padding: '8px 12px', borderRadius: '8px', fontSize: '12px', color: '#fff' }} 
                                                />
                                                <button style={{ padding: '8px 15px', borderRadius: '8px', border: 'none', background: 'var(--accent-cyan)', color: '#000', fontSize: '10px', fontWeight: 800, cursor: 'pointer' }}>NAUČI</button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div style={{ marginTop: '30px', padding: '20px', background: 'rgba(0, 229, 255, 0.05)', borderRadius: '15px', border: '1px solid var(--accent-cyan)', display: 'flex', gap: '15px', alignItems: 'center' }}>
                            <Brain size={24} color="var(--accent-cyan)" />
                            <div style={{ flex: 1 }}>
                                <p style={{ margin: 0, fontSize: '13px', fontWeight: 600 }}>AI Predlog</p>
                                <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: 'var(--text-secondary)' }}>
                                    Mapirao sam "HB Extra" u sistemski popust za Polupansion jer kolona sadrži vrednosti manje od osnovne cene. Da li je ovo ispravno?
                                </p>
                            </div>
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <button style={{ padding: '8px 20px', borderRadius: '8px', border: '1px solid var(--accent-cyan)', background: 'transparent', color: 'var(--accent-cyan)', fontSize: '11px', fontWeight: 800 }}>DA, ISPRAVNO</button>
                                <button style={{ padding: '8px 20px', borderRadius: '8px', border: 'none', background: 'var(--accent-cyan)', color: '#000', fontSize: '11px', fontWeight: 800 }}>PIŠI AGENTU</button>
                            </div>
                        </div>

                        <div style={{ marginTop: '40px', display: 'flex', justifyContent: 'flex-end', gap: '15px' }}>
                            <button onClick={() => setStep('complete')} style={{ padding: '15px 40px', borderRadius: '12px', border: 'none', background: 'var(--accent-cyan)', color: '#000', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <Save size={18} /> ANALIZIRAJ LOGIKU I KREIRAJ BLUEPRINT
                            </button>
                        </div>
                    </motion.div>
                )}

                {step === 'blueprint' && (
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="glass-card"
                        style={{ padding: '40px', maxWidth: '900px', margin: '0 auto' }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '30px' }}>
                            <div style={{ background: 'var(--accent-cyan)', padding: '10px', borderRadius: '10px' }}>
                                <Brain size={24} color="#000" />
                            </div>
                            <div>
                                <h3 style={{ margin: 0, fontSize: '24px', fontWeight: 800 }}>Pricing Logic Blueprint: {hotelInfo.name}</h3>
                                <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary)' }}>Rekapitulacija logike obračuna pre finalne aktivacije</p>
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '25px', marginBottom: '35px' }}>
                            {/* Seasons */}
                            <div style={{ background: 'rgba(255,255,255,0.02)', padding: '20px', borderRadius: '15px', border: '1px solid var(--glass-border)' }}>
                                <h4 style={{ margin: '0 0 15px 0', fontSize: '14px', color: 'var(--accent-cyan)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <Calendar size={16} /> SEZONALNOST (PERIODI)
                                </h4>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', opacity: 0.8 }}>
                                        <span>Peak Season (Vrhunac):</span>
                                        <span style={{ fontWeight: 700 }}>16.07 - 25.08</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', opacity: 0.8 }}>
                                        <span>Full Season:</span>
                                        <span style={{ fontWeight: 700 }}>21.06 - 15.07</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', opacity: 0.8 }}>
                                        <span>Summer Start:</span>
                                        <span style={{ fontWeight: 700 }}>15.05 - 20.06</span>
                                    </div>
                                </div>
                            </div>

                            {/* Rules & Limits */}
                            <div style={{ background: 'rgba(255,255,255,0.02)', padding: '20px', borderRadius: '15px', border: '1px solid var(--glass-border)' }}>
                                <h4 style={{ margin: '0 0 15px 0', fontSize: '14px', color: '#eab308', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <AlertTriangle size={16} /> OGRANIČENJA I KOČNICE
                                </h4>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px' }}>
                                    <div style={{ color: '#fca5a5', fontWeight: 600 }}>
                                        • Standard Soba: Isključivo 2+0 (Max 2 osobe)
                                    </div>
                                    <div style={{ opacity: 0.8 }}>
                                        • Granica za decu: <span style={{ fontWeight: 700 }}>11.99 godina</span>
                                    </div>
                                    <div style={{ opacity: 0.8 }}>
                                        • Bebe (Infant): <span style={{ fontWeight: 700 }}>0 - 1.99 god</span> (Gratis u svim sobama)
                                    </div>
                                </div>
                            </div>

                            {/* Discounts Logic */}
                            <div style={{ background: 'rgba(255,255,255,0.02)', padding: '20px', borderRadius: '15px', border: '1px solid var(--glass-border)' }}>
                                <h4 style={{ margin: '0 0 15px 0', fontSize: '14px', color: '#22c55e', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <Star size={16} /> LOGIKA POPUSTA
                                </h4>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', opacity: 0.8 }}>
                                        <span>Dete na pomoćnom:</span>
                                        <span style={{ fontWeight: 700, color: '#22c55e' }}>-30%</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', opacity: 0.8 }}>
                                        <span>Early Booking:</span>
                                        <span style={{ color: 'var(--text-secondary)' }}>Nije detektovan u fajlu</span>
                                    </div>
                                    <div style={{ fontSize: '11px', fontStyle: 'italic', opacity: 0.6, marginTop: '5px' }}>
                                        * Popusti se obračunavaju kumulativno na osnovnu bruto cenu.
                                    </div>
                                </div>
                            </div>

                            {/* Supplements */}
                            <div style={{ background: 'rgba(255,255,255,0.02)', padding: '20px', borderRadius: '15px', border: '1px solid var(--glass-border)' }}>
                                <h4 style={{ margin: '0 0 15px 0', fontSize: '14px', color: 'var(--accent-cyan)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <Info size={16} /> DOPLATE I SERVISI
                                </h4>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', opacity: 0.8 }}>
                                        <span>Sea View:</span>
                                        <span style={{ fontWeight: 700 }}>+25.00€ / dan</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', opacity: 0.8 }}>
                                        <span>Klub maskota (Pino):</span>
                                        <span style={{ fontWeight: 700, color: '#22c55e' }}>Uračunato</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div style={{ padding: '20px', background: 'rgba(34, 197, 94, 0.05)', borderRadius: '15px', border: '1px solid #22c55e33', marginBottom: '40px' }}>
                            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                <CheckCircle2 size={20} color="#22c55e" />
                                <div style={{ fontSize: '13px', fontWeight: 600, color: '#22c55e' }}>LOGIKA SPREMNA ZA PRODUKCIJU</div>
                            </div>
                            <p style={{ margin: '8px 0 0 32px', fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                                Potvrđivanjem ovog nacrta, sistem će generisati matricu cena za <b>Vesperu</b>. Svaki proračun u simulatoru će se oslanjati na ove parametre.
                            </p>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '15px' }}>
                            <button onClick={() => setStep('mapping')} style={{ padding: '15px 30px', borderRadius: '12px', border: '1px solid var(--glass-border)', background: 'transparent', color: '#fff', fontWeight: 700 }}>NAZAD NA MAPIRANJE</button>
                            <button onClick={() => setStep('complete')} style={{ padding: '15px 40px', borderRadius: '12px', border: 'none', background: 'var(--accent-cyan)', color: '#000', fontWeight: 800 }}>
                                POTVRĐUJEM LOGIKU I AKTIVIRAM
                            </button>
                        </div>
                    </motion.div>
                )}

                {step === 'complete' && (
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        style={{ textAlign: 'center', padding: '100px 40px' }}
                    >
                        <div style={{ width: '100px', height: '100px', borderRadius: '50%', background: 'rgba(34, 197, 94, 0.1)', border: '2px solid #22c55e', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 30px auto' }}>
                            <CheckCircle2 size={50} color="#22c55e" />
                        </div>
                        <h2 style={{ fontSize: '32px', fontWeight: 800, marginBottom: '10px' }}>Upešno Naučeno!</h2>
                        <p style={{ color: 'var(--text-secondary)', marginBottom: '40px', fontSize: '16px' }}>
                            Cenovnik <b>{hotelInfo.pricelistName}</b> je procesiran, hotel je kreiran u bazi, a matrica je sačuvana. 
                            Sve promene su zabeležene u <b>Audit Logu</b> cenovnika.
                        </p>
                        <div style={{ display: 'flex', justifyContent: 'center', gap: '15px' }}>
                            <button onClick={() => setStep('upload')} style={{ padding: '15px 30px', borderRadius: '12px', border: '1px solid var(--glass-border)', background: 'transparent', color: '#fff', fontWeight: 700 }}>Učitaj Sledeći</button>
                            <button style={{ padding: '15px 40px', borderRadius: '12px', border: 'none', background: 'var(--accent-cyan)', color: '#000', fontWeight: 800 }}>IDI NA SIMULATOR</button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default PricingTeacher;
