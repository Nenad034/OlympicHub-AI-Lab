import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { usePromoStore } from '../stores/promoStore';
import type { B2BCampaign } from '../stores/promoStore';
import { Plus, Trash2, Edit2, Play, Square, Calendar as CalendarIcon, Save, X, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const B2BPromoManager: React.FC = () => {
    const { campaigns, addCampaign, updateCampaign, deleteCampaign, toggleCampaignStatus } = usePromoStore();
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);

    // Form state
    const [formData, setFormData] = useState<Partial<B2BCampaign>>({
        title: '',
        subtitle: '',
        image: '',
        badge: 'HOT DEAL',
        commissionBoost: '',
        validFrom: new Date().toISOString().slice(0, 16),
        validTo: new Date(Date.now() + 86400000 * 7).toISOString().slice(0, 16), // +7 days
        searchParams: { destination: '', provider: '' },
        priority: 2,
        isActive: true
    });

    const openForm = (campaign?: B2BCampaign) => {
        if (campaign) {
            setFormData({
                ...campaign,
                validFrom: campaign.validFrom.slice(0, 16), // Format for datetime-local input
                validTo: campaign.validTo.slice(0, 16)
            });
            setEditingId(campaign.id);
        } else {
            setFormData({
                title: '',
                subtitle: '',
                image: '',
                badge: 'EKSTRA',
                commissionBoost: '+3%',
                validFrom: new Date().toISOString().slice(0, 16),
                validTo: new Date(Date.now() + 86400000 * 7).toISOString().slice(0, 16),
                searchParams: { destination: '', provider: '' },
                priority: 2,
                isActive: true
            });
            setEditingId(null);
        }
        setIsFormOpen(true);
    };

    const handleSave = () => {
        const payload = {
            ...formData,
            validFrom: new Date(formData.validFrom as string).toISOString(),
            validTo: new Date(formData.validTo as string).toISOString()
        } as Omit<B2BCampaign, 'id'>;

        if (editingId) {
            updateCampaign(editingId, payload);
        } else {
            addCampaign(payload);
        }
        setIsFormOpen(false);
    };

    return (
        <div style={{ padding: '40px', maxWidth: '1400px', margin: '0 auto', color: 'var(--text-primary)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                <div>
                    <h1 style={{ fontSize: '28px', color: 'var(--accent)' }}>B2B Promo Manager</h1>
                    <p style={{ color: 'var(--text-secondary)' }}>Kreirajte i upravljajte B2B kampanjama (istaknute ponude) koje se prikazuju subagentima.</p>
                </div>
                <button
                    className="btn-primary"
                    onClick={() => openForm()}
                    style={{
                        padding: '12px 24px', background: 'var(--accent)', color: 'white',
                        border: 'none', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold'
                    }}
                >
                    <Plus size={18} /> Nova Kampanja
                </button>
            </div>

            {/* Campaign List */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: '24px' }}>
                <AnimatePresence>
                    {campaigns.map((camp) => {
                        const isExpired = new Date(camp.validTo) < new Date();
                        const isFuture = new Date(camp.validFrom) > new Date();

                        let statusColor = '#3fb950'; // Live
                        let statusText = 'Lajv (Aktivno)';
                        if (!camp.isActive) { statusColor = '#6e7681'; statusText = 'Pauzirano'; }
                        else if (isExpired) { statusColor = '#f85149'; statusText = 'Isteklo'; }
                        else if (isFuture) { statusColor = '#d29922'; statusText = 'Zakazano (Budućnost)'; }

                        return (
                            <motion.div
                                key={camp.id}
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                style={{
                                    background: 'var(--bg-card)',
                                    border: `1px solid ${camp.isActive ? 'var(--border)' : 'rgba(255,255,255,0.05)'}`,
                                    borderRadius: '16px',
                                    padding: '20px',
                                    opacity: camp.isActive ? 1 : 0.6,
                                    position: 'relative'
                                }}
                            >
                                <div style={{ display: 'flex', gap: '16px' }}>
                                    <div style={{ width: '120px', height: '120px', borderRadius: '12px', overflow: 'hidden', flexShrink: 0 }}>
                                        <img src={camp.image} alt="camp" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    </div>
                                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                            <div style={{
                                                fontSize: '11px', padding: '4px 8px', borderRadius: '4px',
                                                background: `${statusColor}22`, color: statusColor, fontWeight: 'bold', letterSpacing: '1px', textTransform: 'uppercase'
                                            }}>
                                                {statusText}
                                            </div>
                                            <div style={{ display: 'flex', gap: '8px' }}>
                                                <button onClick={() => toggleCampaignStatus(camp.id)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: camp.isActive ? 'var(--text-secondary)' : '#3fb950' }} title={camp.isActive ? "Pauziraj" : "Pokreni"}>
                                                    {camp.isActive ? <Square size={16} /> : <Play size={16} />}
                                                </button>
                                                <button onClick={() => openForm(camp)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--accent)' }}>
                                                    <Edit2 size={16} />
                                                </button>
                                                <button onClick={() => deleteCampaign(camp.id)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#ff4d4d' }}>
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </div>
                                        <h3 style={{ fontSize: '18px', margin: '12px 0 4px 0', fontWeight: 'bold' }}>{camp.title}</h3>
                                        <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '8px' }}>{camp.subtitle}</p>

                                        <div style={{ display: 'flex', gap: '12px', fontSize: '12px', color: 'var(--text-secondary)', marginTop: 'auto' }}>
                                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><CalendarIcon size={12} /> Od: {new Date(camp.validFrom).toLocaleDateString()}</span>
                                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><CalendarIcon size={12} /> Do: {new Date(camp.validTo).toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })}
                </AnimatePresence>
            </div>

            {/* Modal Form Overlay - Using Portal for absolute centering & layout isolation */}
            {isFormOpen && createPortal(
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    width: '100vw',
                    height: '100vh',
                    background: 'rgba(0,0,0,0.85)',
                    backdropFilter: 'blur(8px)',
                    zIndex: 999999,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '20px'
                }}>
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 30 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 30 }}
                        style={{
                            background: '#1e293b',
                            padding: '40px',
                            borderRadius: '32px',
                            width: '100%',
                            maxWidth: '650px',
                            maxHeight: '90vh',
                            overflowY: 'auto',
                            border: '1px solid rgba(255,255,255,0.1)',
                            position: 'relative',
                            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
                            color: 'white'
                        }}
                    >
                        <button onClick={() => setIsFormOpen(false)} style={{
                            position: 'absolute', top: '24px', right: '24px', background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer',
                            zIndex: 10
                        }}><X size={24} /></button>

                        <h2 style={{ fontSize: '26px', marginBottom: '24px', color: 'white', fontWeight: '800' }}>
                            {editingId ? 'Izmeni Kampanju' : 'Nova Kampanja'}
                        </h2>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: '#94a3b8' }}>Naslov (Title)</label>
                                <input type="text" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })}
                                    style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', background: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', outline: 'none' }}
                                    placeholder="Npr. Grčka First Minute" />
                            </div>

                            <div>
                                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: '#94a3b8' }}>Podnaslov (Subtitle)</label>
                                <input type="text" value={formData.subtitle} onChange={e => setFormData({ ...formData, subtitle: e.target.value })}
                                    style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', background: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', outline: 'none' }}
                                    placeholder="Npr. Solvex Specijalne Cene" />
                            </div>

                            <div>
                                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: '#94a3b8' }}>Uniformni URL slike</label>
                                <input type="text" value={formData.image} onChange={e => setFormData({ ...formData, image: e.target.value })}
                                    style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', background: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', outline: 'none' }}
                                    placeholder="https://..." />
                            </div>

                            <div style={{ display: 'flex', gap: '20px' }}>
                                <div style={{ flex: 1 }}>
                                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: '#94a3b8' }}>Bedž (Traka u uglu)</label>
                                    <input type="text" value={formData.badge} onChange={e => setFormData({ ...formData, badge: e.target.value })}
                                        style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', background: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', outline: 'none' }}
                                        placeholder="Npr. HOT DEAL" />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: '#10b981', fontWeight: 'bold' }}>Zarada / Provizija</label>
                                    <input type="text" value={formData.commissionBoost} onChange={e => setFormData({ ...formData, commissionBoost: e.target.value })}
                                        style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)', color: '#10b981', fontWeight: 'bold', outline: 'none' }}
                                        placeholder="Npr. +3% Provizija" />
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: '20px' }}>
                                <div style={{ flex: 1 }}>
                                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: '#94a3b8' }}>Početak (Od)</label>
                                    <input type="datetime-local" value={formData.validFrom as string} onChange={e => setFormData({ ...formData, validFrom: e.target.value })}
                                        style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', background: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', outline: 'none' }} />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: '#94a3b8' }}>Istek (Do)</label>
                                    <input type="datetime-local" value={formData.validTo as string} onChange={e => setFormData({ ...formData, validTo: e.target.value })}
                                        style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', background: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', outline: 'none' }} />
                                </div>
                            </div>

                            <div style={{ padding: '20px', borderRadius: '16px', background: 'rgba(33, 136, 255, 0.05)', border: '1px solid rgba(33, 136, 255, 0.2)' }}>
                                <h4 style={{ marginBottom: '16px', color: '#3b82f6', fontSize: '15px', fontWeight: 'bold' }}>
                                    <Search size={16} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
                                    Smart Search Filteri
                                </h4>
                                <div style={{ display: 'flex', gap: '20px' }}>
                                    <div style={{ flex: 1 }}>
                                        <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: '#94a3b8' }}>Destinacija</label>
                                        <input type="text" value={formData.searchParams?.destination || ''} onChange={e => setFormData({ ...formData, searchParams: { ...formData.searchParams, destination: e.target.value } })}
                                            style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', background: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', outline: 'none' }}
                                            placeholder="Npr. Halkidiki" />
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: '#94a3b8' }}>Dobavljač ID</label>
                                        <input type="text" value={formData.searchParams?.provider || ''} onChange={e => setFormData({ ...formData, searchParams: { ...formData.searchParams, provider: e.target.value } })}
                                            style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', background: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', outline: 'none' }}
                                            placeholder="Npr. Solvex" />
                                    </div>
                                </div>
                            </div>

                            <button onClick={handleSave} style={{
                                width: '100%', padding: '18px', marginTop: '10px', background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
                                color: 'white', border: 'none', borderRadius: '16px', fontWeight: '800', fontSize: '16px', cursor: 'pointer',
                                display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px',
                                boxShadow: '0 10px 20px -5px rgba(59, 130, 246, 0.5)'
                            }}>
                                <Save size={20} /> Sačuvaj Kampanju
                            </button>
                        </div>
                    </motion.div>
                </div>,
                document.body
            )}
        </div>
    );
};

export default B2BPromoManager;
