import React from 'react';
import { 
    X, 
    Calculator, 
    ShieldCheck, 
    ArrowRight, 
    Info,
    Calendar,
    Users,
    Zap
} from 'lucide-react';
import { motion } from 'framer-motion';

interface InspectorProps {
    item: any;
    onClose: () => void;
}

const PriceInspector: React.FC<InspectorProps> = ({ item, onClose }) => {
    if (!item) return null;

    return (
        <motion.div 
            initial={{ x: 400 }}
            animate={{ x: 0 }}
            exit={{ x: 400 }}
            style={{ 
                position: 'fixed', 
                top: 0, 
                right: 0, 
                width: '400px', 
                height: '100vh', 
                background: 'var(--bg-dark)', 
                borderLeft: '1px solid var(--glass-border)',
                zIndex: 1000,
                padding: '30px',
                display: 'flex',
                flexDirection: 'column',
                gap: '24px',
                boxShadow: '-20px 0 50px rgba(0,0,0,0.5)',
                backdropFilter: 'blur(16px)'
            }}
        >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(0, 229, 255, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-cyan)' }}>
                        <Calculator size={20} />
                    </div>
                    <div>
                        <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800 }}>Inspektor Kalkulacije</h3>
                        <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Logika obračuna cene</div>
                    </div>
                </div>
                <X size={20} onClick={onClose} style={{ cursor: 'pointer', color: 'var(--text-secondary)' }} />
            </div>

            <div style={{ 
                padding: '20px', 
                background: 'rgba(255,255,255,0.02)', 
                borderRadius: '16px', 
                border: '1px solid var(--glass-border)' 
            }}>
                <div style={{ fontSize: '10px', color: 'var(--accent-cyan)', fontWeight: 800, marginBottom: '8px', textTransform: 'uppercase' }}>Osnovni Podaci</div>
                <div style={{ fontWeight: 800, fontSize: '16px' }}>{item.hotelName}</div>
                <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>{item.roomType} • {item.service}</div>
                <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
                    <div style={{ fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Calendar size={14} color="var(--accent-cyan)" /> {item.dateFrom}
                    </div>
                </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ fontSize: '10px', color: 'var(--text-secondary)', fontWeight: 800, textTransform: 'uppercase' }}>Putokaz Kalkulacije</div>
                
                {/* Step 1: Base */}
                <StepRow label="Osnovna cena (ugovor)" value={item.netPrice.toFixed(2)} type="base" />
                
                {/* Step 2: Supplements (Mock example) */}
                <StepRow label="Doplata za obrok (HB)" value="+4.50" type="plus" />
                
                {/* Step 3: Discounts (Mock example) */}
                <StepRow label="Early Booking Popust (10%)" value="-3.70" type="minus" />
                
                {/* Step 4: Margin */}
                <StepRow label={`Marža (${item.marginPercent}%)`} value={`+${item.margin.toFixed(2)}`} type="margin" />
                
                <div style={{ margin: '10px 0', borderTop: '1px dashed var(--glass-border)' }} />
                
                <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center', 
                    padding: '16px', 
                    background: 'rgba(16, 185, 129, 0.1)', 
                    borderRadius: '12px',
                    border: '1px solid rgba(16, 185, 129, 0.2)'
                }}>
                    <span style={{ fontWeight: 800, fontSize: '14px' }}>KONAČNA BRUTO CENA</span>
                    <span style={{ fontWeight: 900, fontSize: '20px', color: '#10b981' }}>{item.grossPrice.toFixed(2)} €</span>
                </div>
            </div>

            <div style={{ marginTop: 'auto', padding: '15px', background: 'rgba(255, 179, 0, 0.05)', borderRadius: '12px', border: '1px solid rgba(255, 179, 0, 0.2)', display: 'flex', gap: '12px' }}>
                <ShieldCheck size={20} color="var(--accent-gold)" />
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                    Cena je verifikovana od strane AI agenta. Svi parametri su usklađeni sa ugovorom br. #MP-2024.
                </div>
            </div>
        </motion.div>
    );
};

const StepRow = ({ label, value, type }: { label: string, value: string, type: 'base' | 'plus' | 'minus' | 'margin' }) => {
    const getColor = () => {
        if (type === 'plus') return '#3b82f6';
        if (type === 'minus') return '#10b981';
        if (type === 'margin') return 'var(--accent-cyan)';
        return 'var(--text-primary)';
    };

    return (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 4px' }}>
            <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{label}</span>
            <span style={{ fontWeight: 700, color: getColor() }}>{value} €</span>
        </div>
    );
};

export default PriceInspector;
