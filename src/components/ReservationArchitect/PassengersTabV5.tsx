import React from 'react';
import {
    Users, User, Mail, Phone, Hash, Calendar, ShieldCheck,
    Trash2, Plus, Edit3, Smartphone, Globe, Briefcase, Zap, Info,
    UserCircle, MapPin, CreditCard
} from 'lucide-react';
import type { Dossier, Passenger, ActivityLog } from '../../types/reservationArchitect';
import { motion, AnimatePresence } from 'framer-motion';

interface PassengersTabProps {
    dossier: Dossier;
    setDossier: React.Dispatch<React.SetStateAction<Dossier>>;
    addLog: (action: string, details: string, type?: ActivityLog['type']) => void;
}

export const PassengersTabV5: React.FC<PassengersTabProps> = ({
    dossier, setDossier, addLog
}) => {

    const updatePassenger = (idx: number, data: Partial<Passenger>) => {
        const nextPax = [...dossier.passengers];
        nextPax[idx] = { ...nextPax[idx], ...data };
        setDossier(prev => ({ ...prev, passengers: nextPax }));
    };

    const addPassenger = () => {
        const newPax: Passenger = {
            id: 'pax-' + Date.now(),
            firstName: '',
            lastName: '',
            type: 'Adult',
            idNumber: '',
            birthDate: '',
            email: '',
            phone: ''
        };
        setDossier(prev => ({ ...prev, passengers: [...prev.passengers, newPax] }));
        addLog('Putnici', 'Dodat novi putnik u dosije.', 'info');
    };

    const removePassenger = (idx: number) => {
        const nextPax = dossier.passengers.filter((_, i) => i !== idx);
        setDossier(prev => ({ ...prev, passengers: nextPax }));
        addLog('Putnici', 'Putnik uklonjen iz dosijea.', 'warning');
    };

    const InputField = ({ label, value, onChange, icon: Icon, placeholder, type = 'text', select = false, options = [] }: any) => (
        <div className="v5-input-group">
            <label className="v5-label">{label}</label>
            <div style={{ position: 'relative' }}>
                {select ? (
                    <select className="v5-input" value={value} onChange={onChange} style={{ paddingLeft: '56px' }}>
                        {options.map((opt: any) => <option key={opt.val} value={opt.val}>{opt.label}</option>)}
                    </select>
                ) : (
                    <input className="v5-input" type={type} value={value} onChange={onChange} placeholder={placeholder} style={{ paddingLeft: '56px' }} />
                )}
                {Icon && <Icon size={20} style={{ position: 'absolute', left: '20px', top: '19px', opacity: 0.4, color: 'var(--accent-cyan)' }} />}
            </div>
        </div>
    );

    return (
        <div className="v5-passengers">

            {/* Header Area */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                    <div style={{ width: '60px', height: '60px', borderRadius: '20px', background: 'var(--petroleum-glow)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-cyan)', border: '1px solid var(--accent-cyan)' }}>
                        <Users size={32} />
                    </div>
                    <div>
                        <h2 style={{ margin: 0, fontSize: '28px', fontWeight: 950, letterSpacing: '-0.5px' }}>MANIFEST PUTNIKA</h2>
                        <div style={{ fontSize: '14px', color: 'var(--text-secondary)', fontWeight: 600 }}>Upravljanje podacima o svim putnicima u dosijeu</div>
                    </div>
                </div>
                <button className="v5-btn v5-btn-primary" onClick={addPassenger} style={{ height: '56px', padding: '0 32px' }}>
                    <Plus size={20} /> DODAJ NOVOG PUTNIKA
                </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                <AnimatePresence>
                    {dossier.passengers.map((p, idx) => (
                        <motion.div
                            key={p.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="v5-card"
                            style={{ padding: '0' }} // Reset padding for custom header
                        >
                            {/* Premium Pax Header */}
                            <div style={{
                                padding: '24px 32px',
                                borderBottom: '1px solid var(--glass-border)',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                background: 'rgba(255,255,255,0.02)'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                                    <div style={{
                                        width: '44px', height: '44px', borderRadius: '12px',
                                        background: 'var(--petroleum)', color: 'white',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontSize: '18px', fontWeight: 900, border: '1px solid rgba(255,255,255,0.1)'
                                    }}>
                                        {idx + 1}
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '16px', fontWeight: 900 }}>{p.firstName || 'NOVO'} {p.lastName || 'LICE'}</div>
                                        <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                                            <span className={`v5-status-badge ${p.type.toLowerCase() === 'adult' ? 'reservation' : 'offer'}`} style={{ fontSize: '9px', padding: '3px 10px' }}>
                                                {p.type === 'Adult' ? 'ODRASLA OSOBA' : p.type === 'Child' ? 'DETE' : 'BEBA'}
                                            </span>
                                            {p.isLeadPassenger && (
                                                <span className="v5-status-badge active" style={{ fontSize: '9px', padding: '3px 10px', background: 'linear-gradient(90deg, #3b82f6, #6366f1)' }}>
                                                    <Zap size={10} fill="white" /> NOSILAC PUTOVANJA
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <button className="v5-btn" onClick={() => removePassenger(idx)} style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', height: '44px', padding: '0 16px' }}>
                                    <Trash2 size={18} />
                                </button>
                            </div>

                            {/* Form Body */}
                            <div style={{ padding: '40px 32px' }}>
                                <div className="v5-grid-3">
                                    <InputField
                                        label="IME PUTNIKA"
                                        value={p.firstName}
                                        onChange={(e: any) => updatePassenger(idx, { firstName: e.target.value })}
                                        icon={User}
                                        placeholder="Unesite ime..."
                                    />
                                    <InputField
                                        label="PREZIME PUTNIKA"
                                        value={p.lastName}
                                        onChange={(e: any) => updatePassenger(idx, { lastName: e.target.value })}
                                        icon={UserCircle}
                                        placeholder="Unesite prezime..."
                                    />
                                    <InputField
                                        label="DATUM ROĐENJA"
                                        type="date"
                                        value={p.birthDate}
                                        onChange={(e: any) => updatePassenger(idx, { birthDate: e.target.value })}
                                        icon={Calendar}
                                    />

                                    <InputField
                                        label="BROJ PASOŠA / LIČNE KARTE"
                                        value={p.idNumber}
                                        onChange={(e: any) => updatePassenger(idx, { idNumber: e.target.value })}
                                        icon={ShieldCheck}
                                        placeholder="Npr. 001234567..."
                                    />
                                    <InputField
                                        label="DRŽAVLJANSTVO"
                                        value={p.country || ''}
                                        onChange={(e: any) => updatePassenger(idx, { country: e.target.value })}
                                        icon={Globe}
                                        placeholder="Srbija..."
                                    />
                                    <InputField
                                        label="TIP PUTNIKA (CATEGORY)"
                                        select={true}
                                        value={p.type}
                                        onChange={(e: any) => updatePassenger(idx, { type: e.target.value })}
                                        icon={Info}
                                        options={[
                                            { val: 'Adult', label: 'ODRASLA OSOBA (ADULT)' },
                                            { val: 'Child', label: 'DETE (CHILD)' },
                                            { val: 'Infant', label: 'BEBA (INFANT)' }
                                        ]}
                                    />

                                    <div className="v5-full-width" style={{ marginTop: '32px', paddingTop: '32px', borderTop: '1px solid var(--glass-border)' }}>
                                        <div className="v5-grid-2">
                                            <InputField
                                                label="ELEKTRONSKA POŠTA (EMAIL)"
                                                value={p.email || ''}
                                                onChange={(e: any) => updatePassenger(idx, { email: e.target.value })}
                                                icon={Mail}
                                                placeholder="email@primer.com"
                                            />
                                            <InputField
                                                label="KONTAKT TELEFON"
                                                value={p.phone || ''}
                                                onChange={(e: any) => updatePassenger(idx, { phone: e.target.value })}
                                                icon={Smartphone}
                                                placeholder="+381 6... "
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>

                {dossier.passengers.length === 0 && (
                    <div className="v5-card" style={{ textAlign: 'center', padding: '100px 32px', border: '2px dashed var(--glass-border)', background: 'transparent' }}>
                        <Users size={64} style={{ opacity: 0.1, margin: '0 auto 24px auto' }} />
                        <h3 style={{ color: 'var(--text-secondary)' }}>NEMA EVIDENTIRANIH PUTNIKA</h3>
                        <p style={{ color: 'var(--text-secondary)', maxWidth: '400px', margin: '0 auto 32px auto', fontSize: '14px' }}>
                            Trenutno nema putnika u ovom dosijeu. Kliknite na dugme iznad da biste dodali prvog putnika.
                        </p>
                        <button className="v5-btn v5-btn-secondary" onClick={addPassenger} style={{ margin: '0 auto' }}>
                            <Plus size={18} /> DODAJ PUTNIKA
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};
