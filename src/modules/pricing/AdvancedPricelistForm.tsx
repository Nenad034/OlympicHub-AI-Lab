import React, { useState } from 'react';
import {
    Settings,
    Calendar,
    DollarSign,
    Users,
    Gift,
    AlertCircle,
    Plus,
    Trash2,
    Copy,
    Eye
} from 'lucide-react';

const AdvancedPricelistForm: React.FC<{ onAddItem?: (item: any) => void }> = ({ onAddItem }) => {
    const [currentStep, setCurrentStep] = useState(1);
    const [activeSection, setActiveSection] = useState<'osnove' | 'stavke' | 'doplate' | 'popusti' | 'offers'>('osnove');

    const inputStyle: React.CSSProperties = {
        width: '100%',
        padding: '12px 16px',
        borderRadius: '10px',
        background: 'var(--bg-input)', // Opaque background for dark mode selects
        border: '1.5px solid var(--border)',
        color: 'var(--text-primary)',
        fontSize: '14px',
        fontFamily: "'Inter', sans-serif",
        outline: 'none',
        transition: 'all 0.2s',
        boxSizing: 'border-box'
    };

    const selectStyle: React.CSSProperties = {
        ...inputStyle,
        cursor: 'pointer',
        appearance: 'none',
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='white' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`,
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'right 12px center',
        backgroundSize: '16px',
        backgroundColor: 'var(--bg-input)' // Explicitly opaque
    };

    const optionStyle: React.CSSProperties = {
        background: 'var(--bg-card)',
        color: 'var(--text-primary)'
    };

    const handleAddItem = (data: any) => {
        if (!onAddItem) return;
        onAddItem({
            id: `ADV-${Date.now().toString().slice(-4)}`,
            roomType: data.roomType || 'Standard Room',
            dateFrom: data.dateFrom || '2026-06-01',
            dateTo: data.dateTo || '2026-06-30',
            netPrice: data.netPrice || 100,
            brutoPrice: data.brutoPrice || 120,
            occupancy: { adults: 2, children: 1 },
            status: 'active'
        });
    };

    const sections = [
        { id: 'osnove', label: 'Osnovne Info', icon: Settings },
        { id: 'stavke', label: 'Cenovne Stavke', icon: Calendar },
        { id: 'doplate', label: 'Doplate', icon: DollarSign },
        { id: 'popusti', label: 'Popusti', icon: Gift },
        { id: 'offers', label: 'Special Offers', icon: AlertCircle },
    ];

    return (
        <div style={{ display: 'flex', height: '100%', gap: '24px' }}>
            {/* Left Sidebar - Navigation */}
            <div style={{
                width: '240px',
                background: 'var(--bg-card)',
                borderRadius: '20px',
                border: '1px solid var(--border)',
                padding: '20px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px'
            }}>
                <div style={{
                    marginBottom: '16px',
                    paddingBottom: '16px',
                    borderBottom: '1px solid var(--border)'
                }}>
                    <h4 style={{ margin: 0, fontSize: '14px', color: 'var(--text-secondary)' }}>
                        WIZARD KORACI
                    </h4>
                </div>

                {sections.map((section, idx) => {
                    const Icon = section.icon;
                    const isActive = activeSection === section.id;
                    const isCompleted = idx < sections.findIndex(s => s.id === activeSection);

                    return (
                        <button
                            key={section.id}
                            onClick={() => setActiveSection(section.id as any)}
                            style={{
                                padding: '14px 16px',
                                borderRadius: '12px',
                                border: 'none',
                                background: isActive ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
                                color: isActive ? 'var(--accent)' : 'var(--text-secondary)',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '12px',
                                fontSize: '13px',
                                fontWeight: 600,
                                textAlign: 'left',
                                transition: 'all 0.2s',
                                position: 'relative'
                            }}
                        >
                            <div style={{
                                width: '28px',
                                height: '28px',
                                borderRadius: '8px',
                                background: isCompleted ? '#10b981' : isActive ? 'var(--accent)' : 'var(--bg-sidebar)',
                                color: isCompleted || isActive ? '#fff' : 'var(--text-secondary)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '11px',
                                fontWeight: 700,
                                flexShrink: 0
                            }}>
                                {isCompleted ? '✓' : idx + 1}
                            </div>
                            <div style={{ flex: 1 }}>
                                {section.label}
                            </div>
                            {isActive && (
                                <div style={{
                                    width: '6px',
                                    height: '6px',
                                    borderRadius: '50%',
                                    background: 'var(--accent)'
                                }} />
                            )}
                        </button>
                    );
                })}
            </div>

            {/* Main Content Area */}
            <div style={{
                flex: 1,
                background: 'var(--bg-card)',
                borderRadius: '20px',
                border: '1px solid var(--border)',
                padding: '32px',
                overflow: 'auto'
            }}>
                {activeSection === 'osnove' && <OsnoveInfoSection />}
                {activeSection === 'stavke' && <CenovneStavkeSection />}
                {activeSection === 'doplate' && <DoplateSection />}
                {activeSection === 'popusti' && <PopustiSection />}
                {activeSection === 'offers' && <SpecialOffersSection />}
            </div>
        </div>
    );
};

// Osnove Info Section
const OsnoveInfoSection = () => (
    <div>
        <h2 style={{ margin: '0 0 8px 0', fontSize: '24px', fontWeight: 800 }}>
            Osnovne Informacije
        </h2>
        <p style={{ margin: '0 0 32px 0', fontSize: '14px', color: 'var(--text-secondary)' }}>
            Unesite osnovne podatke o cenovniku. Naziv se automatski čuva sa dodeljenim ID brojem.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '32px' }}>
            {/* Left Column */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                {/* Naziv */}
                <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '8px' }}>
                        Naziv Cenovnika *
                    </label>
                    <input
                        type="text"
                        placeholder="Npr. Leto 2026 - Grčka Premium"
                        style={{
                            width: '100%',
                            padding: '14px 16px',
                            borderRadius: '12px',
                            background: 'var(--bg-input)',
                            border: '1px solid var(--border)',
                            color: 'var(--text-primary)',
                            fontSize: '14px',
                            fontFamily: "'Inter', sans-serif",
                            outline: 'none'
                        }}
                    />
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        marginTop: '8px',
                        fontSize: '12px',
                        color: 'var(--text-secondary)'
                    }}>
                        <span style={{
                            background: 'rgba(59, 130, 246, 0.2)',
                            color: 'var(--accent)',
                            padding: '4px 10px',
                            borderRadius: '6px',
                            fontWeight: 600
                        }}>
                            #CV-00125
                        </span>
                        <span>• Kreirano: 09.02.2026 19:15</span>
                        <span>• Autor: nenad034</span>
                    </div>
                </div>

                {/* Hotel & Dobavljač */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div>
                        <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '8px' }}>
                            🏨 Hotel / Objekat *
                        </label>
                        <select style={{
                            width: '100%',
                            padding: '14px 16px',
                            borderRadius: '12px',
                            background: 'var(--bg-input)',
                            border: '1px solid var(--border)',
                            color: 'var(--text-primary)',
                            fontSize: '14px',
                            fontFamily: "'Inter', sans-serif",
                            outline: 'none',
                            cursor: 'pointer'
                        }}>
                            <option style={{ background: 'var(--bg-card)', color: 'var(--text-primary)' }}>Izaberite hotel...</option>
                            <option style={{ background: 'var(--bg-card)', color: 'var(--text-primary)' }}>Grand Resort & Spa</option>
                            <option style={{ background: 'var(--bg-card)', color: 'var(--text-primary)' }}>Luxury Beach Hotel</option>
                        </select>
                    </div>
                    <div>
                        <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '8px' }}>
                            🤝 Dobavljač *
                        </label>
                        <select style={{
                            width: '100%',
                            padding: '14px 16px',
                            borderRadius: '12px',
                            background: 'var(--bg-input)',
                            border: '1px solid var(--border)',
                            color: 'var(--text-primary)',
                            fontSize: '14px',
                            outline: 'none',
                            cursor: 'pointer'
                        }}>
                            <option>Izaberite dobavljača...</option>
                            <option>Solvex</option>
                            <option>Filos</option>
                            <option>ORS</option>
                        </select>
                    </div>
                </div>

                {/* Usluga & Model */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div>
                        <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '8px' }}>
                            🍴 Tip Usluge *
                        </label>
                        <select style={{
                            width: '100%',
                            padding: '14px 16px',
                            borderRadius: '12px',
                            background: 'var(--bg-input)',
                            border: '1px solid var(--border)',
                            color: 'var(--text-primary)',
                            fontSize: '14px',
                            outline: 'none',
                            cursor: 'pointer'
                        }}>
                            <option value="BB">Bed & Breakfast (BB)</option>
                            <option value="HB">Half Board (HB)</option>
                            <option value="FB">Full Board (FB)</option>
                            <option value="AI">All Inclusive (AI)</option>
                            <option value="RO">Room Only (RO)</option>
                        </select>
                    </div>
                    <div>
                        <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '8px' }}>
                            📊 Model Obračuna *
                        </label>
                        <select style={{
                            width: '100%',
                            padding: '14px 16px',
                            borderRadius: '12px',
                            background: 'var(--bg-input)',
                            border: '1px solid var(--border)',
                            color: 'var(--text-primary)',
                            fontSize: '14px',
                            outline: 'none',
                            cursor: 'pointer'
                        }}>
                            <option>Po osobi / dan</option>
                            <option>Po osobi / period</option>
                            <option>Po sobi / dan</option>
                            <option>Po sobi / period</option>
                        </select>
                    </div>
                </div>

                {/* Marža */}
                <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '8px' }}>
                        💰 Globalna Marža
                    </label>
                    <div style={{
                        padding: '20px',
                        background: 'var(--bg-sidebar)',
                        borderRadius: '12px',
                        border: '1px solid var(--border)'
                    }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                                    Procenat (%)
                                </label>
                                <input
                                    type="number"
                                    placeholder="20"
                                    style={{
                                        width: '100%',
                                        padding: '12px',
                                        borderRadius: '10px',
                                        background: 'var(--bg-input)',
                                        border: '1px solid var(--border)',
                                        color: 'var(--text-primary)',
                                        fontSize: '14px',
                                        outline: 'none',
                                        textAlign: 'center'
                                    }}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                                    Iznos (€)
                                </label>
                                <input
                                    type="number"
                                    placeholder="5"
                                    style={{
                                        width: '100%',
                                        padding: '12px',
                                        borderRadius: '10px',
                                        background: 'var(--bg-input)',
                                        border: '1px solid var(--border)',
                                        color: 'var(--text-primary)',
                                        fontSize: '14px',
                                        outline: 'none',
                                        textAlign: 'center'
                                    }}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                                    Preview
                                </label>
                                <div style={{
                                    padding: '12px',
                                    borderRadius: '10px',
                                    background: 'rgba(16, 185, 129, 0.1)',
                                    border: '1px solid #10b981',
                                    color: '#10b981',
                                    fontSize: '14px',
                                    fontWeight: 700,
                                    textAlign: 'center'
                                }}>
                                    20% + 5€
                                </div>
                            </div>
                        </div>
                        <div style={{
                            fontSize: '11px',
                            color: 'var(--text-secondary)',
                            marginTop: '12px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px'
                        }}>
                            💡 <span>Marža može biti pregazena na nivou pojedinačne stavke</span>
                        </div>
                    </div>
                </div>

                {/* Provizija */}
                <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '8px' }}>
                        📊 Provizija Dobavljača (%)
                    </label>
                    <input
                        type="number"
                        placeholder="15"
                        style={{
                            width: '100%',
                            padding: '14px 16px',
                            borderRadius: '12px',
                            background: 'var(--bg-input)',
                            border: '1px solid var(--border)',
                            color: 'var(--text-primary)',
                            fontSize: '14px',
                            outline: 'none'
                        }}
                    />
                    <div style={{
                        fontSize: '11px',
                        color: 'var(--text-secondary)',
                        marginTop: '6px'
                    }}>
                        Kalkulacija: Neto - Provizija + Marža = Bruto
                    </div>
                </div>

                {/* Ugovor */}
                <div>
                    <label style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        fontSize: '13px',
                        fontWeight: 600,
                        marginBottom: '12px',
                        cursor: 'pointer'
                    }}>
                        <input type="checkbox" style={{ cursor: 'pointer' }} />
                        ✅ Potpisan Ugovor sa Dobavljačem
                    </label>
                    <input
                        type="text"
                        placeholder="Broj ugovora (npr. UG-2026-0045)"
                        style={{
                            width: '100%',
                            padding: '14px 16px',
                            borderRadius: '12px',
                            background: 'var(--bg-input)',
                            border: '1px solid var(--border)',
                            color: 'var(--text-primary)',
                            fontSize: '14px',
                            outline: 'none'
                        }}
                    />
                </div>
            </div>

            {/* Right Column - Info */}
            <div>
                <div style={{
                    padding: '20px',
                    background: 'rgba(59, 130, 246, 0.05)',
                    borderRadius: '16px',
                    border: '1px solid rgba(59, 130, 246, 0.2)',
                    marginBottom: '20px'
                }}>
                    <div style={{
                        fontSize: '13px',
                        fontWeight: 700,
                        color: 'var(--accent)',
                        marginBottom: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                    }}>
                        💡 Smart Tips
                    </div>
                    <ul style={{
                        margin: 0,
                        paddingLeft: '20px',
                        fontSize: '12px',
                        color: 'var(--text-secondary)',
                        lineHeight: '1.8'
                    }}>
                        <li>Naziv se automatski čuva nakon 2 sekunde</li>
                        <li>ID se generiše čim unesete naziv</li>
                        <li>Globalna marža se može pregaziti po stavci</li>
                        <li>Sve promene se loguju (ko, šta, kada)</li>
                    </ul>
                </div>

                <div style={{
                    padding: '20px',
                    background: 'var(--bg-sidebar)',
                    borderRadius: '16px',
                    border: '1px solid var(--border)'
                }}>
                    <div style={{
                        fontSize: '13px',
                        fontWeight: 700,
                        marginBottom: '16px'
                    }}>
                        📋 Change Log
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)', lineHeight: '1.8' }}>
                        <div style={{ marginBottom: '8px', paddingBottom: '8px', borderBottom: '1px solid var(--border)' }}>
                            <strong>19:15</strong> • Kreiran cenovnik<br />
                            <span style={{ opacity: 0.7 }}>nenad034</span>
                        </div>
                        <div style={{ marginBottom: '8px', paddingBottom: '8px', borderBottom: '1px solid var(--border)' }}>
                            <strong>19:16</strong> • Promenjen hotel<br />
                            <span style={{ opacity: 0.7 }}>nenad034</span>
                        </div>
                        <div style={{ opacity: 0.5 }}>
                            <strong>19:17</strong> • Auto-save<br />
                            <span style={{ opacity: 0.7 }}>sistem</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
);

// Cenovne Stavke Section
const CenovneStavkeSection = () => (
    <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
            <div>
                <h2 style={{ margin: '0 0 8px 0', fontSize: '24px', fontWeight: 800 }}>
                    Osnovne Stavke Cenovnika
                </h2>
                <p style={{ margin: 0, fontSize: '14px', color: 'var(--text-secondary)' }}>
                    Definišite cene, periode, pravila i kapacitete smeštaja
                </p>
            </div>
            <button style={{
                padding: '12px 24px',
                borderRadius: '12px',
                border: 'none',
                background: 'var(--accent)',
                color: '#fff',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '14px',
                fontWeight: 600
            }}>
                <Plus size={18} /> Dodaj Stavku
            </button>
        </div>

        <div style={{
            background: 'rgba(16, 185, 129, 0.05)',
            border: '1px solid rgba(16, 185, 129, 0.2)',
            borderRadius: '12px',
            padding: '16px 20px',
            marginBottom: '24px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            fontSize: '13px',
            color: '#10b981'
        }}>
            <AlertCircle size={18} />
            <div>
                <strong>Smart Filling Aktivan:</strong> Podaci iz prethodne stavke će se automatski kopirati u sledeću
            </div>
        </div>

        {/* Stavka Example */}
        <div style={{
            background: 'var(--bg-sidebar)',
            borderRadius: '16px',
            border: '2px solid var(--accent)',
            padding: '24px',
            position: 'relative',
            marginBottom: '20px'
        }}>
            <div style={{
                position: 'absolute',
                top: '-12px',
                left: '20px',
                background: 'var(--accent)',
                color: '#fff',
                padding: '4px 16px',
                borderRadius: '8px',
                fontSize: '12px',
                fontWeight: 700
            }}>
                STAVKA #1
            </div>

            {/* Periodi */}
            <div style={{ marginTop: '12px', marginBottom: '24px' }}>
                <h4 style={{ margin: '0 0 16px 0', fontSize: '14px', fontWeight: 700 }}>
                    📅 Periodi Vazenja
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div>
                        <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                            Rezervacije Od
                        </label>
                        <input type="date" style={{
                            width: '100%',
                            padding: '12px',
                            borderRadius: '10px',
                            background: 'var(--bg-input)',
                            border: '1px solid var(--border)',
                            color: 'var(--text-primary)',
                            fontSize: '13px'
                        }} />
                    </div>
                    <div>
                        <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                            Rezervacije Do
                        </label>
                        <input type="date" style={{
                            width: '100%',
                            padding: '12px',
                            borderRadius: '10px',
                            background: 'var(--bg-input)',
                            border: '1px solid var(--border)',
                            color: 'var(--text-primary)',
                            fontSize: '13px'
                        }} />
                    </div>
                    <div>
                        <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                            Boravak Od
                        </label>
                        <input type="date" style={{
                            width: '100%',
                            padding: '12px',
                            borderRadius: '10px',
                            background: 'var(--bg-input)',
                            border: '1px solid var(--border)',
                            color: 'var(--text-primary)',
                            fontSize: '13px'
                        }} />
                    </div>
                    <div>
                        <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                            Boravak Do
                        </label>
                        <input type="date" style={{
                            width: '100%',
                            padding: '12px',
                            borderRadius: '10px',
                            background: 'var(--bg-input)',
                            border: '1px solid var(--border)',
                            color: 'var(--text-primary)',
                            fontSize: '13px'
                        }} />
                        <div style={{ fontSize: '10px', color: 'var(--accent)', marginTop: '4px' }}>
                            ⚡ Sledeći termin: 01.07.2026
                        </div>
                    </div>
                </div>
            </div>

            {/* Tip Smeštaja & Kapacitet */}
            <div style={{ marginBottom: '24px' }}>
                <h4 style={{ margin: '0 0 16px 0', fontSize: '14px', fontWeight: 700 }}>
                    🛏️ Tip Smeštaja & Kapacitet
                </h4>
                <div style={{
                    padding: '16px',
                    background: 'var(--bg-input)',
                    borderRadius: '12px',
                    border: '1px solid var(--border)',
                    marginBottom: '12px'
                }}>
                    <label style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        fontSize: '13px',
                        marginBottom: '8px',
                        cursor: 'pointer'
                    }}>
                        <input type="checkbox" checked style={{ cursor: 'pointer' }} />
                        <strong>Double Room Standard (2+2)</strong>
                    </label>
                    <label style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        fontSize: '13px',
                        marginBottom: '8px',
                        cursor: 'pointer'
                    }}>
                        <input type="checkbox" checked style={{ cursor: 'pointer' }} />
                        <strong>Double Room Sea View (2+2)</strong>
                    </label>
                    <label style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        fontSize: '13px',
                        cursor: 'pointer'
                    }}>
                        <input type="checkbox" style={{ cursor: 'pointer' }} />
                        Family Suite (2+3)
                    </label>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div>
                        <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                            👥 Broj Odraslih
                        </label>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                            <input type="number" placeholder="Min" style={{
                                flex: 1,
                                padding: '12px',
                                borderRadius: '10px',
                                background: 'var(--bg-input)',
                                border: '1px solid var(--border)',
                                color: 'var(--text-primary)',
                                fontSize: '13px',
                                textAlign: 'center'
                            }} />
                            <span style={{ color: 'var(--text-secondary)' }}>-</span>
                            <input type="number" placeholder="Max" style={{
                                flex: 1,
                                padding: '12px',
                                borderRadius: '10px',
                                background: 'var(--bg-input)',
                                border: '1px solid var(--border)',
                                color: 'var(--text-primary)',
                                fontSize: '13px',
                                textAlign: 'center'
                            }} />
                        </div>
                    </div>
                    <div>
                        <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                            👶 Broj Dece
                        </label>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                            <input type="number" placeholder="Min" style={{
                                flex: 1,
                                padding: '12px',
                                borderRadius: '10px',
                                background: 'var(--bg-input)',
                                border: '1px solid var(--border)',
                                color: 'var(--text-primary)',
                                fontSize: '13px',
                                textAlign: 'center'
                            }} />
                            <span style={{ color: 'var(--text-secondary)' }}>-</span>
                            <input type="number" placeholder="Max" style={{
                                flex: 1,
                                padding: '12px',
                                borderRadius: '10px',
                                background: 'var(--bg-input)',
                                border: '1px solid var(--border)',
                                color: 'var(--text-primary)',
                                fontSize: '13px',
                                textAlign: 'center'
                            }} />
                        </div>
                    </div>
                    <div style={{ gridColumn: 'span 2' }}>
                        <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                            Godine Dece (uzrasna ograničenja)
                        </label>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>1. dete:</span>
                                <input type="number" placeholder="Od" style={{
                                    flex: 1,
                                    padding: '8px',
                                    borderRadius: '8px',
                                    background: 'var(--bg-input)',
                                    border: '1px solid var(--border)',
                                    color: 'var(--text-primary)',
                                    fontSize: '12px',
                                    textAlign: 'center'
                                }} />
                                <span>-</span>
                                <input type="number" placeholder="Do" style={{
                                    flex: 1,
                                    padding: '8px',
                                    borderRadius: '8px',
                                    background: 'var(--bg-input)',
                                    border: '1px solid var(--border)',
                                    color: 'var(--text-primary)',
                                    fontSize: '12px',
                                    textAlign: 'center'
                                }} />
                                <span style={{ fontSize: '12px' }}>god</span>
                            </div>
                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>2. dete:</span>
                                <input type="number" placeholder="Od" style={{
                                    flex: 1,
                                    padding: '8px',
                                    borderRadius: '8px',
                                    background: 'var(--bg-input)',
                                    border: '1px solid var(--border)',
                                    color: 'var(--text-primary)',
                                    fontSize: '12px',
                                    textAlign: 'center'
                                }} />
                                <span>-</span>
                                <input type="number" placeholder="Do" style={{
                                    flex: 1,
                                    padding: '8px',
                                    borderRadius: '8px',
                                    background: 'var(--bg-input)',
                                    border: '1px solid var(--border)',
                                    color: 'var(--text-primary)',
                                    fontSize: '12px',
                                    textAlign: 'center'
                                }} />
                                <span style={{ fontSize: '12px' }}>god</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Cene */}
            <div style={{ marginBottom: '24px' }}>
                <h4 style={{ margin: '0 0 16px 0', fontSize: '14px', fontWeight: 700 }}>
                    💰 Cene & Kalkulacija
                </h4>
                <div style={{
                    padding: '20px',
                    background: 'var(--bg-input)',
                    borderRadius: '12px',
                    border: '1px solid var(--border)'
                }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                                💶 Neto Cena
                            </label>
                            <input type="number" defaultValue="85" style={{
                                width: '100%',
                                padding: '12px',
                                borderRadius: '10px',
                                background: 'var(--bg-sidebar)',
                                border: '1px solid var(--border)',
                                color: 'var(--text-primary)',
                                fontSize: '14px',
                                fontWeight: 700,
                                textAlign: 'center'
                            }} />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                                📊 Provizija (%)
                            </label>
                            <input type="number" defaultValue="15" style={{
                                width: '100%',
                                padding: '12px',
                                borderRadius: '10px',
                                background: 'var(--bg-sidebar)',
                                border: '1px solid var(--border)',
                                color: 'var(--text-primary)',
                                fontSize: '14px',
                                textAlign: 'center'
                            }} />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                                💰 Marža
                            </label>
                            <div style={{
                                padding: '12px',
                                borderRadius: '10px',
                                background: 'var(--bg-sidebar)',
                                border: '1px solid var(--border)',
                                fontSize: '13px',
                                textAlign: 'center',
                                color: 'var(--text-secondary)'
                            }}>
                                20% + 5€
                            </div>
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                                💵 Bruto Cena
                            </label>
                            <div style={{
                                padding: '12px',
                                borderRadius: '10px',
                                background: 'rgba(16, 185, 129, 0.1)',
                                border: '1px solid #10b981',
                                fontSize: '14px',
                                fontWeight: 800,
                                textAlign: 'center',
                                color: '#10b981'
                            }}>
                                94.88 €
                            </div>
                        </div>
                    </div>
                    <div style={{
                        padding: '12px 16px',
                        background: 'rgba(59, 130, 246, 0.05)',
                        borderRadius: '8px',
                        fontSize: '11px',
                        color: 'var(--text-secondary)'
                    }}>
                        💡 Kalkulacija: 85€ - 12.75€ (15%) + 22€ (20% + 5€) = <strong style={{ color: '#10b981' }}>94.88€</strong>
                    </div>
                </div>
            </div>

            {/* Buttons */}
            <div style={{ display: 'flex', gap: '12px' }}>
                <button style={{
                    flex: 1,
                    padding: '12px',
                    borderRadius: '10px',
                    border: '1px solid var(--border)',
                    background: 'transparent',
                    color: 'var(--text-secondary)',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px'
                }}>
                    <Copy size={16} /> Clone Stavku
                </button>
                <button style={{
                    flex: 1,
                    padding: '12px',
                    borderRadius: '10px',
                    border: '1px solid var(--accent)',
                    background: 'transparent',
                    color: 'var(--accent)',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px'
                }}>
                    <Eye size={16} /> Preview
                </button>
                <button style={{
                    flex: 1,
                    padding: '12px',
                    borderRadius: '10px',
                    border: '1px solid #ef4444',
                    background: 'transparent',
                    color: '#ef4444',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px'
                }}>
                    <Trash2 size={16} /> Delete
                </button>
            </div>
        </div>
    </div>
);

// Placeholder sections
const DoplateSection = () => (
    <div style={{ textAlign: 'center', padding: '60px 20px' }}>
        <DollarSign size={64} style={{ opacity: 0.2, marginBottom: '20px' }} />
        <h3>Doplate & Nadoplate</h3>
        <p style={{ color: 'var(--text-secondary)' }}>
            Ovde definirate obavezne i opcione doplate (dodatni krevet, pogled, itd.)
        </p>
    </div>
);

const PopustiSection = () => (
    <div style={{ textAlign: 'center', padding: '60px 20px' }}>
        <Gift size={64} style={{ opacity: 0.2, marginBottom: '20px' }} />
        <h3>Popusti</h3>
        <p style={{ color: 'var(--text-secondary)' }}>
            Ovde definirate različite tipove popusta
        </p>
    </div>
);

const SpecialOffersSection = () => (
    <div style={{ textAlign: 'center', padding: '60px 20px' }}>
        <AlertCircle size={64} style={{ opacity: 0.2, marginBottom: '20px' }} />
        <h3>Special Offers</h3>
        <p style={{ color: 'var(--text-secondary)' }}>
            Early Booking, Last Minute, Dete Gratis, Dani Gratis, itd.
        </p>
    </div>
);

export default AdvancedPricelistForm;
