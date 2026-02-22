import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { contactService } from '../services/contactService';
import {
    ArrowLeft,
    Building,
    MapPin,
    Phone,
    Mail,
    Globe,
    ChevronRight,
    Edit,
    FileText,
    DollarSign,
    Star,
    Clock,
    Users,
    Briefcase,
    CreditCard,
    AlertCircle,
    Zap,
    ExternalLink,
    Shield,
    TrendingUp,
    Info
} from 'lucide-react';
import { loadFromCloud } from '../utils/storageUtils';

// Supplier type
interface Supplier {
    id: string;
    name: string;
    type: 'Hotel' | 'DMC' | 'Airline' | 'Transport' | 'Insurance' | 'Other';
    contact: {
        email: string;
        phone: string;
        website?: string;
        contactPerson?: string;
    };
    address: {
        street: string;
        city: string;
        country: string;
        postalCode?: string;
    };
    bankDetails?: {
        bankName: string;
        iban: string;
        swift: string;
    };
    contractStatus: 'Active' | 'Pending' | 'Expired';
    rating: number;
    notes?: string;
    created_at: string;
    updated_at: string;
}

const SupplierDetail: React.FC = () => {
    const { supplierId } = useParams<{ supplierId: string }>();
    const navigate = useNavigate();
    const [supplier, setSupplier] = useState<Supplier | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'overview' | 'contracts' | 'transactions' | 'notes'>('overview');

    useEffect(() => {
        const loadSupplier = async () => {
            setLoading(true);
            const data = await contactService.getById(supplierId || '');

            if (data) {
                setSupplier({
                    id: data.id,
                    name: data.firmName || data.fullName || 'Dobavljač',
                    type: data.type === 'Supplier' ? 'Hotel' : 'Other',
                    contact: {
                        email: data.email,
                        phone: data.phone,
                        website: 'https://olympic.rs',
                        contactPerson: 'Manager'
                    },
                    address: {
                        street: data.address || 'N/A',
                        city: data.city || 'N/A',
                        country: data.country || 'N/A'
                    },
                    contractStatus: 'Active',
                    rating: 5,
                    created_at: data.createdAt || new Date().toISOString(),
                    updated_at: new Date().toISOString()
                });
            }
            setLoading(false);
        };

        loadSupplier();
    }, [supplierId]);

    if (loading) return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: 'var(--bg-main)' }}>
            <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }}>
                <Building size={40} color="var(--accent)" />
            </motion.div>
        </div>
    );

    if (!supplier) return (
        <div className="module-container fade-in" style={{ textAlign: 'center', padding: '100px' }}>
            <AlertCircle size={64} color="#ef4444" style={{ marginBottom: '24px' }} />
            <h2>Dobavljač nije pronađen</h2>
            <button className="btn-primary" onClick={() => navigate('/contact-architect')}>Nazad na Hub</button>
        </div>
    );

    const statusColors = {
        Active: { bg: 'rgba(16, 185, 129, 0.1)', color: '#10b981', text: 'Aktivan' },
        Pending: { bg: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', text: 'Na Čekanju' },
        Expired: { bg: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', text: 'Istekao' },
    };

    const typeIcons = {
        Hotel: <Building size={20} />,
        DMC: <Briefcase size={20} />,
        Airline: <Globe size={20} />,
        Transport: <Users size={20} />,
        Insurance: <FileText size={20} />,
        Other: <Briefcase size={20} />,
    };

    const status = statusColors[supplier.contractStatus] || statusColors.Active;

    return (
        <div className="module-container fade-in" style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>

            {/* Top Navigation */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '14px', color: 'var(--text-secondary)' }}>
                    <button onClick={() => navigate('/contact-architect')} className="btn-icon circle" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                        <ArrowLeft size={18} />
                    </button>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Link to="/" style={{ color: 'inherit', textDecoration: 'none' }}>Hub</Link>
                        <ChevronRight size={14} />
                        <Link to="/contact-architect" style={{ color: 'inherit', textDecoration: 'none' }}>Dobavljači</Link>
                        <ChevronRight size={14} />
                        <span style={{ color: 'var(--text-primary)', fontWeight: '600' }}>Dosije Dobavljača</span>
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '12px' }}>
                    <button className="btn-glass" onClick={() => window.open(supplier.contact.website, '_blank')}>
                        <Globe size={16} /> Poseti sajt
                    </button>
                    <button
                        className="btn-primary-action"
                        onClick={() => navigate('/contact-architect', { state: { editContactId: supplier.id } })}
                        style={{ background: 'var(--accent)', color: 'white' }}
                    >
                        <Edit size={16} /> Uredi Podatke
                    </button>
                </div>
            </div>

            {/* Profile Header Card */}
            <div style={{
                background: 'var(--bg-card)',
                borderRadius: '24px',
                border: '1px solid var(--border)',
                padding: '32px',
                marginBottom: '24px',
                position: 'relative',
                overflow: 'hidden',
                boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
            }}>
                <div style={{ display: 'flex', gap: '32px', alignItems: 'center' }}>
                    <div style={{
                        width: '100px', height: '100px', borderRadius: '24px',
                        background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: '#fff', boxShadow: '0 8px 16px rgba(37, 99, 235, 0.2)'
                    }}>
                        {typeIcons[supplier.type] || <Building size={40} />}
                    </div>

                    <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '8px' }}>
                            <h1 style={{ margin: 0, fontSize: '32px', fontWeight: '800' }}>{supplier.name}</h1>
                            <span style={{
                                padding: '4px 12px', borderRadius: '20px', fontSize: '11px',
                                fontWeight: '700', background: status.bg, color: status.color,
                                border: `1px solid ${status.color}33`, textTransform: 'uppercase'
                            }}>
                                {status.text}
                            </span>
                        </div>
                        <div style={{ display: 'flex', gap: '24px', color: 'var(--text-secondary)', fontSize: '14px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Info size={14} /> {supplier.type}</div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><MapPin size={14} /> {supplier.address.city}, {supplier.address.country}</div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                {[...Array(5)].map((_, i) => (
                                    <Star key={i} size={12} fill={i < supplier.rating ? "#fbbf24" : "transparent"} color={i < supplier.rating ? "#fbbf24" : "var(--border)"} />
                                ))}
                            </div>
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '16px' }}>
                        <div style={{ textAlign: 'right', padding: '16px', background: 'var(--bg-main)', borderRadius: '16px', border: '1px solid var(--border)', minWidth: '140px' }}>
                            <div style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: '700' }}>Bilans</div>
                            <div style={{ fontSize: '20px', fontWeight: '800', color: '#10b981' }}>+1,250 €</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '350px 1fr', gap: '24px' }}>

                {/* Left Sidebar */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

                    {/* Contact Person Card */}
                    <div style={{ background: 'var(--bg-card)', padding: '24px', borderRadius: '24px', border: '1px solid var(--border)' }}>
                        <h3 style={{ fontSize: '15px', fontWeight: '700', margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Users size={18} color="var(--accent)" /> Kontakt Osoba
                        </h3>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                            <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--bg-main)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700' }}>
                                {supplier.contact.contactPerson?.charAt(0) || 'D'}
                            </div>
                            <div>
                                <div style={{ fontWeight: '700', fontSize: '14px' }}>{supplier.contact.contactPerson || 'Glavni Kontakt'}</div>
                                <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Menadžer prodaje</div>
                            </div>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px' }}>
                                <Mail size={14} color="var(--text-secondary)" /> {supplier.contact.email}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px' }}>
                                <Phone size={14} color="var(--text-secondary)" /> {supplier.contact.phone}
                            </div>
                        </div>
                    </div>

                    {/* Bank & Company Info */}
                    <div style={{ background: 'var(--bg-card)', padding: '24px', borderRadius: '24px', border: '1px solid var(--border)' }}>
                        <h3 style={{ fontSize: '15px', fontWeight: '700', margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <CreditCard size={18} color="#8b5cf6" /> Bankovni Podaci
                        </h3>
                        {supplier.bankDetails ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '10px', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: '700' }}>Banka</label>
                                    <div style={{ fontSize: '13px', fontWeight: '600' }}>{supplier.bankDetails.bankName}</div>
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '10px', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: '700' }}>IBAN</label>
                                    <div style={{ fontSize: '12px', fontWeight: '600', fontFamily: 'monospace', background: 'var(--bg-main)', padding: '4px 8px', borderRadius: '4px' }}>{supplier.bankDetails.iban}</div>
                                </div>
                                <div style={{ display: 'flex', gap: '12px' }}>
                                    <button className="btn-glass" style={{ flex: 1, fontSize: '11px' }}>Kopiraj</button>
                                    <button className="btn-glass" style={{ flex: 1, fontSize: '11px' }}>Fakture</button>
                                </div>
                            </div>
                        ) : (
                            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0 }}>Nema unetih bankovnih podataka.</p>
                        )}
                    </div>

                    {/* Meta Timeline */}
                    <div style={{ background: 'var(--bg-card)', padding: '24px', borderRadius: '24px', border: '1px solid var(--border)' }}>
                        <h3 style={{ fontSize: '15px', fontWeight: '700', margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Clock size={18} color="var(--text-secondary)" /> Aktivnost
                        </h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '12px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ color: 'var(--text-secondary)' }}>Kreiran:</span>
                                <span>{new Date(supplier.created_at).toLocaleDateString('sr-RS')}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ color: 'var(--text-secondary)' }}>Ažuriran:</span>
                                <span>{new Date(supplier.updated_at).toLocaleDateString('sr-RS')}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Content Area */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

                    {/* Tabs */}
                    <div style={{
                        background: 'var(--bg-card)', padding: '6px', borderRadius: '16px', border: '1px solid var(--border)',
                        display: 'flex', gap: '4px', width: '100%'
                    }}>
                        {[
                            { id: 'overview', label: 'Pregled', icon: <TrendingUp size={16} /> },
                            { id: 'contracts', label: 'Ugovori', icon: <FileText size={16} /> },
                            { id: 'transactions', label: 'Transakcije', icon: <DollarSign size={16} /> },
                            { id: 'notes', label: 'Beleške', icon: <Edit size={16} /> }
                        ].map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as any)}
                                style={{
                                    flex: 1,
                                    justifyContent: 'center',
                                    padding: '10px 20px', borderRadius: '12px', border: 'none',
                                    background: activeTab === tab.id ? 'var(--accent)' : 'transparent',
                                    color: activeTab === tab.id ? 'white' : 'var(--text-secondary)',
                                    fontWeight: '700', fontSize: '14px', cursor: 'pointer',
                                    display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.2s'
                                }}
                            >
                                {tab.icon} {tab.label}
                            </button>
                        ))}
                    </div>

                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activeTab}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.2 }}
                        >
                            {activeTab === 'overview' && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

                                    {/* Stats Grid */}
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px' }}>
                                        <div style={{ background: 'var(--bg-card)', padding: '24px', borderRadius: '24px', border: '1px solid var(--border)' }}>
                                            <div style={{ color: 'var(--text-secondary)', fontSize: '12px', textTransform: 'uppercase', fontWeight: '700', marginBottom: '8px' }}>Godišnji Promet</div>
                                            <div style={{ fontSize: '24px', fontWeight: '800' }}>42,500 €</div>
                                            <div style={{ fontSize: '12px', color: '#10b981', marginTop: '4px', fontWeight: '600' }}>+12% vs prošla god</div>
                                        </div>
                                        <div style={{ background: 'var(--bg-card)', padding: '24px', borderRadius: '24px', border: '1px solid var(--border)' }}>
                                            <div style={{ color: 'var(--text-secondary)', fontSize: '12px', textTransform: 'uppercase', fontWeight: '700', marginBottom: '8px' }}>Br. Rezervacija</div>
                                            <div style={{ fontSize: '24px', fontWeight: '800' }}>156</div>
                                            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>Prosek: 12/mesec</div>
                                        </div>
                                        <div style={{ background: 'var(--bg-card)', padding: '24px', borderRadius: '24px', border: '1px solid var(--border)' }}>
                                            <div style={{ color: 'var(--text-secondary)', fontSize: '12px', textTransform: 'uppercase', fontWeight: '700', marginBottom: '8px' }}>Status Ugovora</div>
                                            <div style={{ fontSize: '20px', fontWeight: '800', color: '#10b981' }}>AKTIVAN</div>
                                            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>Ističe za: 240 dana</div>
                                        </div>
                                    </div>

                                    {/* Location Info */}
                                    <div style={{ background: 'var(--bg-card)', padding: '32px', borderRadius: '24px', border: '1px solid var(--border)' }}>
                                        <h3 style={{ margin: '0 0 20px 0', fontSize: '16px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <MapPin size={18} color="var(--accent)" /> Lokacija i Sedište
                                        </h3>
                                        <div style={{ display: 'flex', gap: '40px' }}>
                                            <div>
                                                <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '4px', fontWeight: '700' }}>Ulica i broj</label>
                                                <div style={{ fontWeight: '600' }}>{supplier.address.street}</div>
                                            </div>
                                            <div>
                                                <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '4px', fontWeight: '700' }}>Grad / Poštanski br.</label>
                                                <div style={{ fontWeight: '600' }}>{supplier.address.postalCode} {supplier.address.city}</div>
                                            </div>
                                            <div>
                                                <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '4px', fontWeight: '700' }}>Država</label>
                                                <div style={{ fontWeight: '600' }}>{supplier.address.country}</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'notes' && (
                                <div style={{ background: 'var(--bg-card)', padding: '32px', borderRadius: '24px', border: '1px solid var(--border)' }}>
                                    <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: '700' }}>Dobavljačke Beleške</h3>
                                    <textarea
                                        style={{
                                            width: '100%', minHeight: '300px', background: 'var(--bg-main)', border: '1px solid var(--border)',
                                            borderRadius: '16px', padding: '20px', color: 'var(--text-primary)', fontSize: '14px', outline: 'none'
                                        }}
                                        defaultValue={supplier.notes || "Ključni dobavljač za Solunska regiju. Odlična podrška."}
                                    />
                                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
                                        <button className="btn-primary">Ažuriraj Beleške</button>
                                    </div>
                                </div>
                            )}

                            {(activeTab === 'contracts' || activeTab === 'transactions') && (
                                <div style={{ background: 'var(--bg-card)', padding: '64px 32px', borderRadius: '24px', border: '1px solid var(--border)', textAlign: 'center' }}>
                                    <Info size={40} style={{ opacity: 0.3, marginBottom: '16px' }} />
                                    <h3>Nema dostupnih podataka</h3>
                                    <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Ovaj modul je trenutno u fazi povezivanja sa eksternim bazama.</p>
                                </div>
                            )}
                        </motion.div>
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
};

export default SupplierDetail;
