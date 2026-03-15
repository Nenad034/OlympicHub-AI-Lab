import React from 'react';
import { CheckCircle, FileText, Calendar, MapPin, Users, Plane, Hotel, Car, X } from 'lucide-react';

interface DossierSummaryProps {
  data: any;
  onClose: () => void;
}

export const DossierSummary: React.FC<DossierSummaryProps> = ({ data, onClose }) => {
  return (
    <div className="ms-dossier-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(10px)' }}>
      <div className="ms-dossier-card" style={{ background: 'var(--ms-panel)', width: '90%', maxWidth: '800px', borderRadius: '32px', padding: '40px', position: 'relative', boxShadow: '0 30px 60px rgba(0,0,0,0.5)', border: '1px solid var(--ms-brand-purple)' }}>
        
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
           <CheckCircle size={64} color="var(--ms-brand-purple)" style={{ marginBottom: '16px' }} />
           <h2 style={{ fontSize: '24px', fontWeight: 900, margin: 0 }}>DOSIJE KREIRAN: #TCT-2026-{Math.floor(Math.random() * 9000) + 1000}</h2>
           <p style={{ color: 'var(--ms-text-sec)', marginTop: '8px' }}>Vaša rezervacija je uspešno generisana i sačuvana u sistemu.</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px' }}>
           
           {/* Left Column: Trip Details */}
           <div>
              <h3 style={{ fontSize: '14px', fontWeight: 800, textTransform: 'uppercase', color: 'var(--ms-brand-purple)', marginBottom: '20px' }}>Detalji Putovanja</h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                 <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <Hotel size={18} color="var(--ms-text-sec)" />
                    <div>
                       <div style={{ fontWeight: 700 }}>{data.hotel?.name}</div>
                       <div style={{ fontSize: '11px', color: 'var(--ms-text-sec)' }}>{data.hotel?.location}</div>
                    </div>
                 </div>

                 <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <Calendar size={18} color="var(--ms-text-sec)" />
                    <div>
                       <div style={{ fontWeight: 700 }}>15. Maj — 22. Maj 2026.</div>
                       <div style={{ fontSize: '11px', color: 'var(--ms-text-sec)' }}>7 Noćenja</div>
                    </div>
                 </div>

                 <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <Users size={18} color="var(--ms-text-sec)" />
                    <div>
                       <div style={{ fontWeight: 700 }}>2 Odrasle osobe</div>
                       <div style={{ fontSize: '11px', color: 'var(--ms-text-sec)' }}>Standard Sea View Room</div>
                    </div>
                 </div>
              </div>
           </div>

           {/* Right Column: Added Services & Total */}
           <div style={{ background: 'var(--ms-glass)', padding: '24px', borderRadius: '24px' }}>
              <h3 style={{ fontSize: '14px', fontWeight: 800, textTransform: 'uppercase', marginBottom: '20px' }}>Uključene Usluge</h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                 <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                    <span>Smeštaj</span>
                    <span style={{ fontWeight: 700 }}>€{data.hotel?.price}</span>
                 </div>
                 <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: 'var(--ms-brand-purple)' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Plane size={14} /> Avio Karte (Povratni let)</span>
                    <span style={{ fontWeight: 700 }}>€230</span>
                 </div>
                 <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: 'var(--ms-brand-purple)' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Car size={14} /> Privatni Transfer</span>
                    <span style={{ fontWeight: 700 }}>€25</span>
                 </div>

                 <div style={{ borderTop: '1px solid var(--ms-border)', marginTop: '20px', paddingTop: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                    <div>
                       <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--ms-text-sec)', textTransform: 'uppercase' }}>UKUPNA CENA</div>
                       <div style={{ fontSize: '28px', fontWeight: 900, color: 'white' }}>€{(data.hotel?.price || 0) + 255}</div>
                    </div>
                    <button className="ms-btn-primary" onClick={onClose} style={{ padding: '12px 24px' }}>PREUZMI PDF</button>
                 </div>
              </div>
           </div>
        </div>

        <button 
          onClick={onClose}
          style={{ position: 'absolute', top: '24px', right: '24px', background: 'none', border: 'none', color: 'var(--ms-text-sec)', cursor: 'pointer' }}
        >
          <X size={24} />
        </button>

      </div>
    </div>
  );
};
