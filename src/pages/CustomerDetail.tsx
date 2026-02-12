import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
    ArrowLeft,
    Mail,
    Phone,
    MapPin,
    ChevronRight,
    Edit,
    History,
    Heart,
    Calendar,
    UserCheck,
    CreditCard,
    TrendingUp,
    Shield,
    MessageCircle,
    Info,
    ExternalLink,
    Zap
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { contactService } from '../services/contactService';

interface Customer {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    loyaltyLevel: 'Standard' | 'Silver' | 'Gold' | 'Platinum';
    address: {
        street: string;
        city: string;
        country: string;
    };
    totalBookings: number;
    totalSpent: number;
    birthDate?: string;
    notes?: string;
}

const CustomerDetail: React.FC = () => {
    const { customerId } = useParams<{ customerId: string }>();
    const navigate = useNavigate();
    const [customer, setCustomer] = useState<Customer | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'overview' | 'bookings' | 'billing' | 'notes'>('overview');

    useEffect(() => {
        const loadCustomer = async () => {
            setLoading(true);
            const data = await contactService.getById(customerId || '');

            if (data) {
                setCustomer({
                    id: data.id,
                    firstName: data.firstName || data.fullName?.split(' ')[0] || 'Gost',
                    lastName: data.lastName || data.fullName?.split(' ')[1] || 'Klijent',
                    email: data.email,
                    phone: data.phone,
                    loyaltyLevel: 'Platinum', // Mock for UI
                    address: {
                        street: data.address || 'Knez Mihailova 1',
                        city: data.city || 'Beograd',
                        country: data.country || 'Srbija'
                    },
                    totalBookings: 12,
                    totalSpent: 4500,
                    birthDate: data.birthDate || '1985-05-15',
                    notes: data.notes
                });
            }
            setLoading(false);
        };
        loadCustomer();
    }, [customerId]);

    if (loading) return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: 'var(--bg-main)' }}>
            <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }}>
                <Zap size={40} color="var(--accent)" />
            </motion.div>
        </div>
    );

    if (!customer) return <div className="module-container">Kupac nije pronađen.</div>;

    const loyaltyColors = {
        Standard: '#94a3b8',
        Silver: '#cbd5e1',
        Gold: '#fbbf24',
        Platinum: '#818cf8'
    };

    return (
        <div className="module-container fade-in" style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
            {/* Breadcrumb & Top Actions */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '14px', color: 'var(--text-secondary)' }}>
                    <button onClick={() => navigate('/contact-architect')} className="btn-icon circle" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                        <ArrowLeft size={18} />
                    </button>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Link to="/" style={{ color: 'inherit', textDecoration: 'none' }}>Hub</Link>
                        <ChevronRight size={14} />
                        <Link to="/contact-architect" style={{ color: 'inherit', textDecoration: 'none' }}>Kontakti</Link>
                        <ChevronRight size={14} />
                        <span style={{ color: 'var(--text-primary)', fontWeight: '600' }}>Dosije Putnika</span>
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '12px' }}>
                    <button className="btn-glass" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <MessageCircle size={16} /> Pošalji Poruku
                    </button>
                    <button
                        className="btn-primary-action"
                        onClick={() => navigate('/contact-architect', { state: { editContactId: customer.id } })}
                        style={{ background: 'var(--accent)', color: 'white' }}
                    >
                        <Edit size={16} /> Uredi Profil
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
                <div style={{ position: 'absolute', top: '-50px', right: '-50px', width: '200px', height: '200px', background: `radial-gradient(circle, ${loyaltyColors[customer.loyaltyLevel]}33 0%, transparent 70%)`, pointerEvents: 'none' }}></div>

                <div style={{ display: 'flex', gap: '32px', alignItems: 'center', position: 'relative' }}>
                    <div style={{ position: 'relative' }}>
                        <div style={{
                            width: '120px', height: '120px', borderRadius: '32px',
                            background: 'linear-gradient(135deg, #6366f1, #a855f7)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: '#fff', fontSize: '48px', fontWeight: '800',
                            boxShadow: '0 12px 24px rgba(99, 102, 241, 0.3)'
                        }}>
                            {customer.firstName[0]}{customer.lastName[0]}
                        </div>
                        <div style={{
                            position: 'absolute', bottom: '-5px', right: '-5px',
                            background: '#10b981', width: '30px', height: '30px',
                            borderRadius: '50%', border: '4px solid var(--bg-card)'
                        }}></div>
                    </div>

                    <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '8px' }}>
                            <h1 style={{ margin: 0, fontSize: '36px', fontWeight: '800', color: 'var(--text-primary)' }}>
                                {customer.firstName} {customer.lastName}
                            </h1>
                            <span style={{
                                display: 'flex', alignItems: 'center', gap: '6px',
                                padding: '6px 16px', borderRadius: '30px',
                                background: `${loyaltyColors[customer.loyaltyLevel]}22`,
                                color: loyaltyColors[customer.loyaltyLevel],
                                fontWeight: '800', fontSize: '12px', textTransform: 'uppercase',
                                border: `1px solid ${loyaltyColors[customer.loyaltyLevel]}44`
                            }}>
                                <Heart size={14} fill={loyaltyColors[customer.loyaltyLevel]} /> {customer.loyaltyLevel} Status
                            </span>
                        </div>
                        <div style={{ display: 'flex', gap: '24px', color: 'var(--text-secondary)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Mail size={16} /> {customer.email}</div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Phone size={16} /> {customer.phone}</div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><MapPin size={16} /> {customer.address.city}, {customer.address.country}</div>
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                        <div style={{ textAlign: 'right', padding: '16px', background: 'var(--bg-main)', borderRadius: '16px', border: '1px solid var(--border)' }}>
                            <div style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: '700' }}>Ukupno</div>
                            <div style={{ fontSize: '24px', fontWeight: '800', color: 'var(--accent)' }}>{customer.totalSpent} €</div>
                        </div>
                        <div style={{ textAlign: 'right', padding: '16px', background: 'var(--bg-main)', borderRadius: '16px', border: '1px solid var(--border)' }}>
                            <div style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: '700' }}>Rezervacije</div>
                            <div style={{ fontSize: '24px', fontWeight: '800' }}>{customer.totalBookings}</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content Layout */}
            <div style={{ display: 'grid', gridTemplateColumns: '350px 1fr', gap: '24px' }}>

                {/* Sidebar Info */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

                    {/* Verifikacija & Status */}
                    <div style={{ background: 'var(--bg-card)', padding: '24px', borderRadius: '24px', border: '1px solid var(--border)' }}>
                        <h3 style={{ fontSize: '16px', fontWeight: '700', margin: '0 0 20px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Shield size={18} color="#10b981" /> Bezbednost i Status
                        </h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: 'var(--bg-main)', borderRadius: '12px' }}>
                                <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Status Profila</span>
                                <span style={{ fontWeight: '700', color: '#10b981', fontSize: '13px' }}>VERIFIKOVAN</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: 'var(--bg-main)', borderRadius: '12px' }}>
                                <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>ID broj</span>
                                <span style={{ fontWeight: '700', fontSize: '13px' }}>CUST-2025-{customer.id}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: 'var(--bg-main)', borderRadius: '12px' }}>
                                <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Klijent od</span>
                                <span style={{ fontWeight: '700', fontSize: '13px' }}>Jan 2024.</span>
                            </div>
                        </div>
                    </div>

                    {/* Lični detalji Sidebar */}
                    <div style={{ background: 'var(--bg-card)', padding: '24px', borderRadius: '24px', border: '1px solid var(--border)' }}>
                        <h3 style={{ fontSize: '16px', fontWeight: '700', margin: '0 0 20px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Info size={18} color="var(--accent)" /> Detalji Kontakta
                        </h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '4px', fontWeight: '700' }}>Adresa Stanovanja</label>
                                <div style={{ fontWeight: '600' }}>{customer.address.street}</div>
                                <div style={{ fontSize: '14px' }}>{customer.address.city}, {customer.address.country}</div>
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '4px', fontWeight: '700' }}>Datum Rođenja</label>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '600' }}>
                                    <Calendar size={14} /> {customer.birthDate || 'Nije podeseno'}
                                </div>
                            </div>
                            <div style={{ borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
                                <button className="btn-glass" style={{ width: '100%', justifyContent: 'center' }}>
                                    Prikaži na mapi <ExternalLink size={14} />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Quick AI Tags */}
                    <div style={{ background: 'linear-gradient(135deg, #1e1b4b, #312e81)', padding: '24px', borderRadius: '24px', color: 'white' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                            <Zap size={18} color="#fbbf24" fill="#fbbf24" />
                            <span style={{ fontWeight: '800', fontSize: '14px' }}>AI ANALYTICS</span>
                        </div>
                        <p style={{ fontSize: '13px', opacity: 0.8, marginBottom: '16px' }}>Klijent preferira letnju sezonu i hotele sa 4+. Najčešća destinacija: Grčka.</p>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                            <span style={{ padding: '4px 10px', background: 'rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '11px' }}>High LTV</span>
                            <span style={{ padding: '4px 10px', background: 'rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '11px' }}>Early Bird</span>
                            <span style={{ padding: '4px 10px', background: 'rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '11px' }}>Family Traveler</span>
                        </div>
                    </div>
                </div>

                {/* Right Content Area */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

                    {/* Tab Navigation */}
                    <div style={{
                        background: 'var(--bg-card)',
                        padding: '6px',
                        borderRadius: '16px',
                        border: '1px solid var(--border)',
                        display: 'flex',
                        gap: '4px',
                        width: '100%'
                    }}>
                        {[
                            { id: 'overview', label: 'Pregled', icon: <UserCheck size={16} /> },
                            { id: 'bookings', label: 'Rezervacije', icon: <History size={16} /> },
                            { id: 'billing', label: 'Finansije', icon: <CreditCard size={16} /> },
                            { id: 'notes', label: 'Beleške', icon: <Edit size={16} /> }
                        ].map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as any)}
                                style={{
                                    flex: 1,
                                    justifyContent: 'center',
                                    padding: '10px 20px',
                                    borderRadius: '12px',
                                    border: 'none',
                                    background: activeTab === tab.id ? 'var(--accent)' : 'transparent',
                                    color: activeTab === tab.id ? 'white' : 'var(--text-secondary)',
                                    fontWeight: '700',
                                    fontSize: '14px',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    transition: 'all 0.2s'
                                }}
                            >
                                {tab.icon} {tab.label}
                            </button>
                        ))}
                    </div>

                    {/* Tab Content Rendering */}
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activeTab}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.2 }}
                            style={{ flex: 1 }}
                        >
                            {activeTab === 'overview' && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                                        <div style={{ background: 'var(--bg-card)', padding: '24px', borderRadius: '24px', border: '1px solid var(--border)' }}>
                                            <h4 style={{ margin: '0 0 16px 0', fontSize: '14px', fontWeight: '700' }}>Finansijski Snapshot</h4>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                    <span style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>Isplaćeno</span>
                                                    <span style={{ fontWeight: '700', color: '#10b981' }}>{customer.totalSpent} €</span>
                                                </div>
                                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                    <span style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>Dugovanja</span>
                                                    <span style={{ fontWeight: '700', color: '#ef4444' }}>0.00 €</span>
                                                </div>
                                                <div style={{ borderTop: '1px solid var(--border)', paddingTop: '12px', marginTop: '4px' }}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                        <span style={{ fontSize: '13px', fontWeight: '700' }}>Ukupan Bilans</span>
                                                        <span style={{ fontWeight: '800' }}>{customer.totalSpent} €</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div style={{ background: 'var(--bg-card)', padding: '24px', borderRadius: '24px', border: '1px solid var(--border)' }}>
                                            <h4 style={{ margin: '0 0 16px 0', fontSize: '14px', fontWeight: '700' }}>Aktivnost i Rezervacije</h4>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                    <span style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>Ukupno aranžmana</span>
                                                    <span style={{ fontWeight: '700' }}>{customer.totalBookings}</span>
                                                </div>
                                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                    <span style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>Otkazivanja</span>
                                                    <span style={{ fontWeight: '700' }}>0</span>
                                                </div>
                                                <div style={{ borderTop: '1px solid var(--border)', paddingTop: '12px', marginTop: '4px' }}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                        <span style={{ fontSize: '13px', fontWeight: '700' }}>Poslednja aktivnost</span>
                                                        <span style={{ fontWeight: '700', color: 'var(--accent)' }}>Pre 12 dana</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Timeline Placeholder */}
                                    <div style={{ background: 'var(--bg-card)', padding: '32px', borderRadius: '24px', border: '1px solid var(--border)' }}>
                                        <h4 style={{ margin: '0 0 24px 0', fontSize: '16px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <TrendingUp size={20} color="var(--accent)" /> Nedavna Istorija
                                        </h4>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                            {[1, 2, 3].map(i => (
                                                <div key={i} style={{ display: 'flex', gap: '16px' }}>
                                                    <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: 'var(--accent)', marginTop: '4px', position: 'relative' }}>
                                                        {i < 3 && <div style={{ position: 'absolute', top: '12px', left: '5px', width: '2px', height: '30px', background: 'var(--border)' }}></div>}
                                                    </div>
                                                    <div>
                                                        <div style={{ fontSize: '14px', fontWeight: '700' }}>{i === 1 ? 'Rezervacija #2315791 - Solvex' : i === 2 ? 'Uplata depozita' : 'Kreiran profil klijenta'}</div>
                                                        <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Pre {i * 5} dana • Admin: Marko</div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'bookings' && (
                                <div style={{ background: 'var(--bg-card)', padding: '64px 32px', borderRadius: '24px', border: '1px solid var(--border)', textAlign: 'center' }}>
                                    <div style={{
                                        width: '80px', height: '80px', borderRadius: '50%',
                                        background: 'var(--bg-main)', display: 'flex',
                                        alignItems: 'center', justifyContent: 'center',
                                        margin: '0 auto 24px auto'
                                    }}>
                                        <History size={40} style={{ opacity: 0.3 }} />
                                    </div>
                                    <h3 style={{ fontSize: '20px', fontWeight: '700', margin: '0 0 8px 0' }}>Sve Rezervacije</h3>
                                    <p style={{ color: 'var(--text-secondary)', maxWidth: '400px', margin: '0 auto 24px auto', fontSize: '14px' }}>
                                        Pregled svih putovanja, avio karata i vaučera za ovog klijenta. Podaci se povlače iz centralnog sistema.
                                    </p>
                                    <button className="btn-primary" style={{ padding: '12px 32px' }}>Vidi Dashboard Rezervacija</button>
                                </div>
                            )}

                            {activeTab === 'notes' && (
                                <div style={{ background: 'var(--bg-card)', padding: '32px', borderRadius: '24px', border: '1px solid var(--border)' }}>
                                    <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: '700' }}>Interne Beleške</h3>
                                    <textarea
                                        style={{
                                            width: '100%', minHeight: '300px',
                                            background: 'var(--bg-main)', border: '1px solid var(--border)',
                                            borderRadius: '16px', padding: '20px', color: 'var(--text-primary)',
                                            fontSize: '14px', outline: 'none'
                                        }}
                                        defaultValue={customer.notes || "Klijent zainteresovan za letovanje u junu. Preferira severnu Grčku."}
                                        placeholder="Unesite važne informacije o klijentu..."
                                    />
                                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
                                        <button className="btn-primary">Sačuvaj Belešku</button>
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
};

export default CustomerDetail;
