import React, { useState } from 'react';
import { 
    X, 
    Calculator, 
    ShieldCheck, 
    Trash2, 
    Edit3,
    CheckCircle2,
    Calendar,
    Users,
    Zap,
    AlertTriangle,
    Plus,
    Code
} from 'lucide-react';
import { motion } from 'framer-motion';

interface InspectorProps {
    item: any;
    onClose: () => void;
    onOpenDev?: () => void;
    onOpenDevNewTab?: (id: string) => void;
}

const PriceInspector: React.FC<InspectorProps> = ({ item, onClose, onOpenDev, onOpenDevNewTab }) => {
    const [rules, setRules] = useState([
        { id: 1, label: 'Osnovna cena po sobi', value: 'Ugovorna', type: 'base', status: 'verified' },
        { id: 2, label: 'Min Stay Pravilo', value: '2-5 noći', type: 'stay', status: 'verified' },
        { id: 3, label: 'Early Booking', value: '-15%', type: 'discount', status: 'warning' },
        { id: 4, label: 'Doplata za HB', value: '+45€/d', type: 'supplement', status: 'verified' }
    ]);

    const [confirmed, setConfirmed] = useState(false);

    if (!item) return null;

    return (
        <motion.div 
            initial={{ x: 500 }}
            animate={{ x: 0 }}
            exit={{ x: 500 }}
            style={{ 
                position: 'fixed', 
                top: 0, 
                right: 0, 
                width: '500px', 
                height: '100vh', 
                background: 'var(--bg-card)', 
                borderLeft: '1px solid var(--glass-border)',
                zIndex: 1000,
                padding: '0',
                display: 'flex',
                flexDirection: 'column',
                boxShadow: '-20px 0 50px rgba(0,0,0,0.3)',
                backdropFilter: 'blur(30px)'
            }}
        >
            {/* Header */}
            <div style={{ padding: '30px', borderBottom: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <div style={{ width: '45px', height: '45px', borderRadius: '12px', background: 'rgba(0, 229, 255, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-cyan)' }}>
                        <Calculator size={24} />
                    </div>
                    <div>
                        <h3 style={{ margin: 0, fontSize: '20px', fontWeight: 900, color: 'var(--text-primary)' }}>Logika & Pravila</h3>
                        <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Determinacija pravila za {item.roomType}</div>
                    </div>
                </div>
                <X size={24} onClick={onClose} style={{ cursor: 'pointer', color: 'var(--text-secondary)' }} />
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '30px', display: 'flex', flexDirection: 'column', gap: '25px' }}>
                {/* Meta Info */}
                <div style={{ background: 'rgba(128,128,128,0.05)', padding: '20px', borderRadius: '20px', border: '1px solid var(--glass-border)' }}>
                    <div style={{ fontSize: '10px', color: 'var(--accent-cyan)', fontWeight: 800, marginBottom: '8px', textTransform: 'uppercase' }}>Analizirani Objekat</div>
                    <div style={{ fontWeight: 800, fontSize: '18px', color: 'var(--text-primary)' }}>{item.hotelName}</div>
                    <div style={{ fontSize: '14px', color: 'var(--text-secondary)', marginTop: '4px' }}>{item.roomType}</div>
                </div>

                {/* Rules Section */}
                <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                        <div style={{ fontSize: '12px', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Determinisana Pravila (AI)</div>
                        <button style={{ background: 'rgba(0,229,255,0.1)', border: 'none', color: 'var(--accent-cyan)', fontSize: '11px', fontWeight: 800, padding: '5px 10px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}>
                            <Plus size={14} /> DODAJ
                        </button>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {rules.map(rule => (
                            <div key={rule.id} style={{ 
                                padding: '15px', 
                                background: 'rgba(128,128,128,0.03)', 
                                borderRadius: '14px', 
                                border: '1px solid var(--glass-border)',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    {rule.status === 'verified' ? <CheckCircle2 size={16} color="#10b981" /> : <AlertTriangle size={16} color="var(--accent-gold)" />}
                                    <div>
                                        <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>{rule.label}</div>
                                        <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Vrednost: <span style={{ color: 'var(--text-primary)' }}>{rule.value}</span></div>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: '10px' }}>
                                    <Edit3 size={16} style={{ cursor: 'pointer', opacity: 0.5, color: 'var(--text-primary)' }} />
                                    <Trash2 size={16} style={{ cursor: 'pointer', color: '#ef4444', opacity: 0.5 }} />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Calculation Path */}
                <div style={{ marginTop: '10px' }}>
                    <div style={{ fontSize: '12px', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '15px' }}>Putokaz Kalkulacije</div>
                    <div style={{ background: 'rgba(128,128,128,0.05)', borderRadius: '20px', padding: '20px', border: '1px solid var(--glass-border)' }}>
                        <PriceStep label="Osnovna Cena (HB uključeno)" value={item.net.toFixed(2)} />
                        <PriceStep label="Agencijska Provizija (15%)" value={item.profit.toFixed(2)} color="var(--accent-gold)" />
                        
                        <div style={{ height: '1px', background: 'var(--glass-border)', margin: '15px 0' }} />
                        
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontWeight: 800, color: 'var(--accent-cyan)' }}>UKUPNO BRUTO</span>
                            <span style={{ fontSize: '22px', fontWeight: 900, color: 'var(--accent-cyan)' }}>{item.total.toFixed(2)} €</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Actions Footer */}
            <div style={{ padding: '30px', borderTop: '1px solid var(--glass-border)', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                {(onOpenDev || onOpenDevNewTab) && (
                    <div style={{ display: 'flex', gap: '10px' }}>
                        {onOpenDev && (
                            <button 
                                onClick={() => onOpenDev()}
                                style={{ flex: 1, height: '45px', background: 'rgba(0, 229, 255, 0.1)', color: 'var(--accent-cyan)', border: '1px solid var(--accent-cyan)', borderRadius: '12px', fontWeight: 800, fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                            >
                                <Code size={16} /> DEV MODE
                            </button>
                        )}
                        {onOpenDevNewTab && (
                            <button 
                                onClick={() => onOpenDevNewTab(item.id)}
                                style={{ width: '45px', height: '45px', background: 'rgba(255,255,255,0.05)', color: 'var(--text-secondary)', border: '1px solid var(--glass-border)', borderRadius: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                title="Otvori u novom tabu"
                            >
                                <Zap size={16} />
                            </button>
                        )}
                    </div>
                )}

                {!confirmed ? (
                    <button 
                        onClick={() => setConfirmed(true)}
                        style={{ width: '100%', height: '55px', background: 'var(--accent-cyan)', color: '#000', border: 'none', borderRadius: '15px', fontWeight: 900, fontSize: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', boxShadow: '0 10px 30px rgba(0,229,255,0.3)' }}
                    >
                        <ShieldCheck size={20} />
                        POTVRDI I KEŠIRAJ KOMBINACIJE
                    </button>
                ) : (
                    <div style={{ height: '55px', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid #10b981', borderRadius: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', color: '#10b981', fontWeight: 800 }}>
                        <CheckCircle2 size={20} />
                        KOMBINACIJE KEŠIRANE
                    </div>
                )}
                <div style={{ fontSize: '10px', color: 'var(--text-secondary)', textAlign: 'center', padding: '0 20px' }}>
                    Sistem je generisao sve moguće kombinacije putnika za ovaj tip smeštaja i period. Pretraga će sada biti trenutna.
                </div>
            </div>
        </motion.div>
    );
};

const PriceStep = ({ label, value, color }: { label: string, value: string, color?: string }) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
        <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{label}</span>
        <span style={{ fontSize: '13px', fontWeight: 700, color: color || 'var(--text-primary)' }}>{value} €</span>
    </div>
);

export default PriceInspector;
