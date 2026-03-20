import React from 'react';
import {
    Users, User, Mail, Phone, Hash, Calendar, ShieldCheck,
    Trash2, Plus, Edit3, Smartphone, Globe, Briefcase, Zap, Info,
    UserCircle, MapPin, CreditCard, Bed, ChevronDown
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
            id: 'pax-' + Date.now().toString(36),
            firstName: '',
            lastName: '',
            type: 'Adult',
            idNumber: '',
            birthDate: '',
            email: '',
            phone: '',
            address: '',
            city: '',
            country: 'Srbija'
        };
        setDossier(prev => ({ ...prev, passengers: [...prev.passengers, newPax] }));
        addLog('Putnici', 'Dodat novi putnik u manifest.', 'info');
    };

    const removePassenger = (idx: number) => {
        const nextPax = dossier.passengers.filter((_, i) => i !== idx);
        setDossier(prev => ({ ...prev, passengers: nextPax }));
        addLog('Putnici', 'Putnik uklonjen iz manifesta.', 'warning');
    };

    const InputField = ({ label, value, onChange, icon: Icon, placeholder, type = 'text', select = false, options = [] }: any) => (
        <div className="v5-input-group">
            <label className="v5-label">{label}</label>
            <div style={{ position: 'relative' }}>
                {select ? (
                    <div style={{ position: 'relative' }}>
                        <select className="v5-input" value={value} onChange={onChange} style={{ paddingLeft: '56px', appearance: 'none' }}>
                            {options.map((opt: any) => <option key={opt.val} value={opt.val}>{opt.label}</option>)}
                        </select>
                        <ChevronDown size={18} style={{ position: 'absolute', right: '20px', top: '23px', opacity: 0.3, pointerEvents: 'none' }} />
                    </div>
                ) : (
                    <input className="v5-input" type={type} value={value} onChange={onChange} placeholder={placeholder} spellCheck={false} style={{ paddingLeft: '56px' }} />
                )}
                {Icon && <Icon size={20} style={{ position: 'absolute', left: '20px', top: '22px', opacity: 0.4, color: 'var(--accent-cyan)' }} />}
            </div>
        </div>
    );

    return (
        <div className="v5-passengers">

            {/* Premium Header V6 */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '48px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                    <div style={{ width: '64px', height: '64px', borderRadius: '22px', background: 'var(--petroleum)', color: 'var(--accent-cyan)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 10px 30px rgba(0,229,255,0.1)' }}>
                        <Users size={32} />
                    </div>
                    <div>
                        <h2 style={{ margin: 0, fontSize: '32px', fontWeight: 950, letterSpacing: '-1.5px' }}>MANIFEST I ROOMING LISTA</h2>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '4px' }}>
                            <div style={{ fontSize: '14px', color: 'var(--text-secondary)', fontWeight: 600 }}>Upravljanje podacima • {dossier.passengers.length} osoba na listi</div>
                            <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: 'rgba(255,255,255,0.2)' }}></div>
                            <div className="v5-status-badge active" style={{ fontSize: '9px', padding: '3px 12px' }}>MANIFEST VALIDAN</div>
                        </div>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '16px' }}>
                    <button className="v5-btn v5-btn-secondary" style={{ height: '56px' }}>
                         EXPORT CSV
                    </button>
                    <button className="v5-btn v5-btn-primary" onClick={addPassenger} style={{ height: '56px', padding: '0 32px' }}>
                        <Plus size={20} /> DODAJ NOVOG PUTNIKA
                    </button>
                </div>
            </div>

            {/* Rooming / Manifest Area V6 */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                <AnimatePresence>
                    {dossier.passengers.map((p, idx) => (
                        <motion.div
                            key={p.id}
                            initial={{ opacity: 0, scale: 0.98, y: 30 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ duration: 0.4, ease: 'easeOut' }}
                            className="v5-card"
                            style={{ padding: '0' }}
                        >
                            {/* Premium Pax Header V6 */}
                            <div style={{
                                padding: '24px 40px',
                                borderBottom: '1px solid var(--glass-border)',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                background: 'linear-gradient(90deg, rgba(0, 229, 255, 0.04) 0%, transparent 100%)'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                                    <div style={{
                                        width: '56px', height: '56px', borderRadius: '18px',
                                        background: 'var(--petroleum)', color: 'white',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontSize: '22px', fontWeight: 950, border: '1px solid rgba(0,229,255,0.2)',
                                        boxShadow: '0 5px 15px rgba(0,0,0,0.2)'
                                    }}>
                                        {idx + 1}
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '20px', fontWeight: 950, letterSpacing: '-0.5px' }}>{p.firstName || 'NOVI'} {p.lastName || 'PUTNIK'}</div>
                                        <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
                                            <span className={`v5-status-badge ${p.type.toLowerCase() === 'adult' ? 'active' : 'info'}`} style={{ fontSize: '9px', padding: '4px 12px', background: 'rgba(0,0,0,0.2)' }}>
                                                {p.type === 'Adult' ? 'ODRASLA OSOBA' : p.type === 'Child' ? 'DETE' : 'BEBA'}
                                            </span>
                                            {p.isLeadPassenger && (
                                                <span className="v5-status-badge active" style={{ fontSize: '9px', padding: '4px 12px', background: 'linear-gradient(90deg, #3b82f6, #6366f1)', color: 'white' }}>
                                                    <Zap size={10} fill="white" /> UGOVARAČ
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: '12px' }}>
                                     <button className="v5-btn v5-btn-secondary" style={{ width: '44px', height: '44px', padding: 0, justifyContent: 'center', borderRadius: '12px' }}>
                                        <Bed size={18} />
                                    </button>
                                    <button className="v5-btn" onClick={() => removePassenger(idx)} style={{ background: 'rgba(239, 68, 68, 0.08)', color: '#ef4444', height: '44px', padding: '0 16px', borderRadius: '12px', border: '1px solid rgba(239,68,68,0.2)' }}>
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>

                            {/* Form Body V6 */}
                            <div style={{ padding: '48px 40px' }}>
                                <div className="v5-grid-3">
                                    <InputField
                                        label="IME PUTNIKA (FIRST NAME)"
                                        value={p.firstName}
                                        onChange={(e: any) => updatePassenger(idx, { firstName: e.target.value })}
                                        icon={User}
                                        placeholder="Kao u pasošu..."
                                    />
                                    <InputField
                                        label="PREZIME PUTNIKA (LAST NAME)"
                                        value={p.lastName}
                                        onChange={(e: any) => updatePassenger(idx, { lastName: e.target.value })}
                                        icon={UserCircle}
                                        placeholder="Kao u pasošu..."
                                    />
                                    <InputField
                                        label="DATUM ROĐENJA (D.O.B)"
                                        type="date"
                                        value={p.birthDate}
                                        onChange={(e: any) => updatePassenger(idx, { birthDate: e.target.value })}
                                        icon={Calendar}
                                    />

                                    <InputField
                                        label="DOKUMENT (PASSPORT/ID)"
                                        value={p.idNumber}
                                        onChange={(e: any) => updatePassenger(idx, { idNumber: e.target.value })}
                                        icon={ShieldCheck}
                                        placeholder="Broj dokumenta..."
                                    />
                                    <InputField
                                        label="DRŽAVLJANSTVO (CITIZENSHIP)"
                                        value={p.country || ''}
                                        onChange={(e: any) => updatePassenger(idx, { country: e.target.value })}
                                        icon={Globe}
                                        placeholder="Srbija..."
                                    />
                                    <InputField
                                        label="KATEGORIJA (PAX CATEGORY)"
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

                                    <div className="v5-full-width" style={{ marginTop: '40px', paddingTop: '40px', borderTop: '1px solid var(--glass-border)', background: 'rgba(255,255,255,0.01)', borderRadius: '0 0 28px 28px' }}>
                                        <div className="v5-grid-2">
                                            <InputField
                                                label="ELEKTRONSKA POŠTA (PRIVATE EMAIL)"
                                                value={p.email || ''}
                                                onChange={(e: any) => updatePassenger(idx, { email: e.target.value })}
                                                icon={Mail}
                                                placeholder="email@primer.rs"
                                            />
                                            <InputField
                                                label="MOBILNI TELEFON (GSM)"
                                                value={p.phone || ''}
                                                onChange={(e: any) => updatePassenger(idx, { phone: e.target.value })}
                                                icon={Smartphone}
                                                placeholder="+381..."
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>

                {dossier.passengers.length === 0 && (
                    <div className="v5-card" style={{ textAlign: 'center', padding: '120px 40px', border: '2px dashed var(--glass-border)', background: 'transparent' }}>
                        <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} transition={{ repeat: Infinity, duration: 2, repeatType: 'reverse' }}>
                            <Users size={80} style={{ opacity: 0.1, margin: '0 auto 32px auto' }} />
                        </motion.div>
                        <h3 style={{ color: 'var(--text-primary)', fontSize: '20px', fontWeight: 900, letterSpacing: '1px' }}>TRENUTNO NEMA EVIDENTIRANIH PUTNIKA</h3>
                        <p style={{ color: 'var(--text-secondary)', maxWidth: '500px', margin: '12px auto 40px auto', fontSize: '15px', fontWeight: 600, lineHeight: 1.6 }}>
                            Manifest putnika je neophodan za izdavanje vaučera i polisa osiguranja. Dodajte podatke o putnicima za ovaj dosije.
                        </p>
                        <button className="v5-btn v5-btn-primary" onClick={addPassenger} style={{ margin: '0 auto', height: '64px', padding: '0 40px' }}>
                            <Plus size={24} /> DODAJ PRVOG PUTNIKA
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};
