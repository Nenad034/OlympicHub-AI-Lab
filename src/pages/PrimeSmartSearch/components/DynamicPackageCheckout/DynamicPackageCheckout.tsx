import React, { useState } from 'react';
import { useSearchStore } from '../../stores/useSearchStore';

const formatPrice = (n: number, currency = 'EUR') =>
    new Intl.NumberFormat('de-DE', { style: 'currency', currency, minimumFractionDigits: 0 }).format(n);

export const DynamicPackageCheckout: React.FC = () => {
    const { packageBasket, setShowPackageCheckout, clearBasket } = useSearchStore();

    const [formParams, setFormParams] = useState({
        firstName: '', lastName: '', email: '', phone: '', note: ''
    });
    
    const [submitting, setSubmitting] = useState(false);
    const [success, setSuccess] = useState(false);

    if (packageBasket.length === 0 && !success) {
        setShowPackageCheckout(false);
        return null;
    }

    const rawTotal = packageBasket.reduce((sum, item) => sum + item.totalPrice, 0);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setTimeout(() => {
            setSubmitting(false);
            setSuccess(true);
        }, 1500);
    };

    const handleClose = () => {
        if (success) {
            clearBasket(); // Očisti korpu ako je uspesno poslato
        }
        setShowPackageCheckout(false);
    };

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
            background: 'rgba(15,23,42,0.85)', backdropFilter: 'blur(8px)',
            zIndex: 100000, display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '24px', overflowY: 'auto'
        }}>
            <div style={{
                background: 'var(--v6-bg-main)', width: '100%', maxWidth: '900px',
                borderRadius: 'var(--v6-radius-xl)', boxShadow: '0 24px 48px rgba(0,0,0,0.3)',
                position: 'relative', display: 'flex', flexDirection: 'column',
                animation: 'v6-scale-up 0.3s cubic-bezier(0.16, 1, 0.3, 1)', overflow: 'hidden'
            }}>
                
                {/* ── HEADER ── */}
                <div style={{ padding: '24px 32px', borderBottom: '1px solid var(--v6-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <h2 style={{ margin: 0, fontSize: '24px', fontWeight: 900, color: 'var(--v6-text-primary)' }}>Vaš Prilagođeni Paket</h2>
                        <p style={{ margin: '4px 0 0 0', fontSize: '14px', color: 'var(--v6-text-muted)' }}>Proverite detalje i pošaljite upit za rezervaciju.</p>
                    </div>
                    <button onClick={handleClose} style={{ background: 'none', border: 'none', fontSize: '24px', color: 'var(--v6-text-muted)', cursor: 'pointer', padding: '8px' }}>✕</button>
                </div>

                {success ? (
                    /* ── SUCCESS MESSAGE ── */
                    <div style={{ padding: '64px 32px', textAlign: 'center' }}>
                        <div style={{ fontSize: '64px', marginBottom: '24px' }}>✅</div>
                        <h2 style={{ margin: '0 0 12px 0', fontSize: '28px', fontWeight: 900, color: 'var(--v6-text-primary)' }}>Upit Uspešno Poslat!</h2>
                        <p style={{ margin: '0 0 32px 0', fontSize: '16px', color: 'var(--v6-text-secondary)', maxWidth: '500px', marginInline: 'auto' }}>
                            Hvala Vam <strong>{formParams.firstName}</strong>! Vaš zahtev za dinamički paket je evidentiran. 
                            Naš agent će Vas kontaktirati na <strong>{formParams.email}</strong> u najkraćem roku sa potvrdom raspoloživosti.
                        </p>
                        <button onClick={handleClose} style={{ padding: '14px 32px', background: 'var(--v6-accent)', color: 'var(--v6-accent-text)', border: 'none', borderRadius: 'var(--v6-radius-md)', fontSize: '14px', fontWeight: 800, cursor: 'pointer', fontFamily: 'var(--v6-font)' }}>
                            Zatvori i Pregledaj Nove Ponude
                        </button>
                    </div>
                ) : (
                    /* ── MAIN CONTENT (SPLIT VIEW) ── */
                    <div style={{ display: 'flex', flexWrap: 'wrap', minHeight: '400px' }}>
                        
                        {/* ── LEVO: REZIME PAKETA ── */}
                        <div style={{ flex: 1, minWidth: '350px', background: 'var(--v6-bg-section)', padding: '32px', borderRight: '1px solid var(--v6-border)' }}>
                            <h3 style={{ margin: '0 0 20px 0', fontSize: '16px', fontWeight: 800, color: 'var(--v6-text-primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Presek Usluga ({packageBasket.length})</h3>
                            
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                {packageBasket.map(item => (
                                    <div key={item.id} style={{ display: 'flex', alignItems: 'flex-start', gap: '14px', background: 'var(--v6-bg-main)', padding: '16px', borderRadius: '12px', border: '1px solid var(--v6-border)' }}>
                                        <div style={{ fontSize: '24px', background: 'var(--v6-bg-section)', padding: '10px', borderRadius: '10px' }}>
                                            {item.icon}
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontSize: '14px', fontWeight: 800, color: 'var(--v6-text-primary)', marginBottom: '4px' }}>{item.label}</div>
                                            <div style={{ fontSize: '12px', color: 'var(--v6-text-muted)', marginBottom: '8px' }}>{item.details}</div>
                                            <div style={{ fontSize: '15px', fontWeight: 900, color: 'var(--v6-text-primary)' }}>{formatPrice(item.totalPrice, item.currency)}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div style={{ marginTop: '32px', paddingTop: '24px', borderTop: '2px dashed var(--v6-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                                <div>
                                    <div style={{ fontSize: '12px', color: 'var(--v6-text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Total (Procenjeno)</div>
                                    <div style={{ fontSize: '11px', color: 'var(--v6-text-muted)', marginTop: '4px' }}>Uključene takse i naknade</div>
                                </div>
                                <div style={{ fontSize: '32px', fontWeight: 900, color: 'var(--v6-color-prime)' }}>
                                    {formatPrice(rawTotal, 'EUR')}
                                </div>
                            </div>
                        </div>

                        {/* ── DESNO: FORMA ZA UPIT ── */}
                        <div style={{ flex: 1, minWidth: '350px', padding: '32px' }}>
                            <h3 style={{ margin: '0 0 24px 0', fontSize: '16px', fontWeight: 800, color: 'var(--v6-text-primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Podaci Nosioca Rezervacije</h3>
                            
                            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--v6-text-muted)', marginBottom: '6px' }}>Ime</label>
                                        <input required type="text" value={formParams.firstName} onChange={e => setFormParams({...formParams, firstName: e.target.value})} style={{ width: '100%', padding: '12px', border: '1.5px solid var(--v6-border)', borderRadius: '8px', background: 'var(--v6-bg-main)', color: 'var(--v6-text-primary)', outline: 'none', fontFamily: 'var(--v6-font)' }} />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--v6-text-muted)', marginBottom: '6px' }}>Prezime</label>
                                        <input required type="text" value={formParams.lastName} onChange={e => setFormParams({...formParams, lastName: e.target.value})} style={{ width: '100%', padding: '12px', border: '1.5px solid var(--v6-border)', borderRadius: '8px', background: 'var(--v6-bg-main)', color: 'var(--v6-text-primary)', outline: 'none', fontFamily: 'var(--v6-font)' }} />
                                    </div>
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--v6-text-muted)', marginBottom: '6px' }}>Email Adresa</label>
                                    <input required type="email" value={formParams.email} onChange={e => setFormParams({...formParams, email: e.target.value})} style={{ width: '100%', padding: '12px', border: '1.5px solid var(--v6-border)', borderRadius: '8px', background: 'var(--v6-bg-main)', color: 'var(--v6-text-primary)', outline: 'none', fontFamily: 'var(--v6-font)' }} />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--v6-text-muted)', marginBottom: '6px' }}>Broj Telefona</label>
                                    <input required type="tel" value={formParams.phone} onChange={e => setFormParams({...formParams, phone: e.target.value})} style={{ width: '100%', padding: '12px', border: '1.5px solid var(--v6-border)', borderRadius: '8px', background: 'var(--v6-bg-main)', color: 'var(--v6-text-primary)', outline: 'none', fontFamily: 'var(--v6-font)' }} />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--v6-text-muted)', marginBottom: '6px' }}>Posebne Napomene (Opciono)</label>
                                    <textarea value={formParams.note} onChange={e => setFormParams({...formParams, note: e.target.value})} rows={3} style={{ width: '100%', padding: '12px', border: '1.5px solid var(--v6-border)', borderRadius: '8px', background: 'var(--v6-bg-main)', color: 'var(--v6-text-primary)', outline: 'none', fontFamily: 'var(--v6-font)', resize: 'vertical' }} placeholder="npr. Potreban nam je krevetac za bebu..." />
                                </div>

                                <div style={{ marginTop: '16px' }}>
                                    <button type="submit" disabled={submitting} style={{
                                        width: '100%', padding: '16px', background: submitting ? 'var(--v6-border)' : 'var(--v6-accent)', color: submitting ? 'var(--v6-text-muted)' : 'var(--v6-accent-text)',
                                        border: 'none', borderRadius: '8px', fontSize: '15px', fontWeight: 800, cursor: submitting ? 'not-allowed' : 'pointer', fontFamily: 'var(--v6-font)', transition: 'background 0.2s'
                                    }}>
                                        {submitting ? '⏳ Šaljem upit PrimeClick timu...' : '✉️ POŠALJI UPIT ZA REZERVACIJU'}
                                    </button>
                                    <p style={{ marginTop: '12px', fontSize: '11px', color: 'var(--v6-text-muted)', textAlign: 'center' }}>Klikom na dugme ne vršite plaćanje. Naš agent će kontaktirati sa vama u vezi sa raspoloživošću i instrukcijama za potvrdu vašeg dinamički iskreiranog putovanja.</p>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
