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
    UserCheck
} from 'lucide-react';
import { loadFromCloud } from '../utils/storageUtils';

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
            const { data } = await loadFromCloud('customers');
            let customers: Customer[] = data as Customer[] || [];

            if (customers.length === 0) {
                customers = [
                    {
                        id: '1',
                        firstName: 'Marko',
                        lastName: 'Marković',
                        email: 'marko.ma@example.com',
                        phone: '+381 64 123 4567',
                        loyaltyLevel: 'Gold',
                        address: { street: 'Knez Mihailova 1', city: 'Beograd', country: 'Srbija' },
                        totalBookings: 12,
                        totalSpent: 4500,
                        birthDate: '1985-05-15'
                    }
                ];
            }

            const found = customers.find(c => c.id === customerId);
            setCustomer(found || customers[0]);
            setLoading(false);
        };
        loadCustomer();
    }, [customerId]);

    if (loading) return <div className="module-container">Učitavanje...</div>;
    if (!customer) return <div className="module-container">Kupac nije pronađen.</div>;

    const loyaltyColors = {
        Standard: '#94a3b8',
        Silver: '#cbd5e1',
        Gold: '#fbbf24',
        Platinum: '#818cf8'
    };

    return (
        <div className="module-container fade-in">
            {/* Breadcrumb */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px', fontSize: '14px', color: 'var(--text-secondary)' }}>
                <Link to="/" style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>Početna</Link>
                <ChevronRight size={14} />
                <Link to="/customers" style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>Klijenti</Link>
                <ChevronRight size={14} />
                <span style={{ color: 'var(--accent)' }}>{customer.firstName} {customer.lastName}</span>
            </div>

            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' }}>
                <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                    <button onClick={() => navigate('/customers')} className="btn-icon circle">
                        <ArrowLeft size={20} />
                    </button>
                    <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                        <div style={{
                            width: '64px', height: '64px', borderRadius: '50%', background: 'linear-gradient(135deg, #6366f1, #a855f7)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '24px', fontWeight: '700'
                        }}>
                            {customer.firstName[0]}{customer.lastName[0]}
                        </div>
                        <div>
                            <h1 style={{ margin: 0, fontSize: '28px', fontWeight: '700' }}>{customer.firstName} {customer.lastName}</h1>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                                <span style={{ padding: '2px 10px', borderRadius: '20px', fontSize: '12px', background: 'rgba(59, 130, 246, 0.1)', color: 'var(--accent)', fontWeight: '600' }}>
                                    KLIJENT #{customer.id}
                                </span>
                                <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: loyaltyColors[customer.loyaltyLevel], fontWeight: '700' }}>
                                    <Heart size={14} fill={loyaltyColors[customer.loyaltyLevel]} /> {customer.loyaltyLevel} Member
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
                <button className="btn-primary-action">
                    <Edit size={18} /> Uredi Profil
                </button>
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '32px', borderBottom: '1px solid var(--border)', paddingBottom: '0' }}>
                <button
                    onClick={() => setActiveTab('overview')}
                    style={{ padding: '12px 24px', background: 'none', border: 'none', borderBottom: activeTab === 'overview' ? '2px solid var(--accent)' : '2px solid transparent', color: activeTab === 'overview' ? 'var(--accent)' : 'var(--text-secondary)', fontWeight: '600', cursor: 'pointer' }}
                >Pregled</button>
                <button
                    onClick={() => setActiveTab('bookings')}
                    style={{ padding: '12px 24px', background: 'none', border: 'none', borderBottom: activeTab === 'bookings' ? '2px solid var(--accent)' : '2px solid transparent', color: activeTab === 'bookings' ? 'var(--accent)' : 'var(--text-secondary)', fontWeight: '600', cursor: 'pointer' }}
                >Rezervacije ({customer.totalBookings})</button>
                <button
                    onClick={() => setActiveTab('billing')}
                    style={{ padding: '12px 24px', background: 'none', border: 'none', borderBottom: activeTab === 'billing' ? '2px solid var(--accent)' : '2px solid transparent', color: activeTab === 'billing' ? 'var(--accent)' : 'var(--text-secondary)', fontWeight: '600', cursor: 'pointer' }}
                >Finansije</button>
                <button
                    onClick={() => setActiveTab('notes')}
                    style={{ padding: '12px 24px', background: 'none', border: 'none', borderBottom: activeTab === 'notes' ? '2px solid var(--accent)' : '2px solid transparent', color: activeTab === 'notes' ? 'var(--accent)' : 'var(--text-secondary)', fontWeight: '600', cursor: 'pointer' }}
                >Beleške</button>
            </div>

            {/* Content Display */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    {activeTab === 'overview' && (
                        <>
                            {/* Stats */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px' }}>
                                <div style={{ background: 'var(--bg-card)', padding: '20px', borderRadius: '16px', border: '1px solid var(--border)' }}>
                                    <div style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>Ukupno Rezervacija</div>
                                    <div style={{ fontSize: '24px', fontWeight: '700', marginTop: '8px' }}>{customer.totalBookings}</div>
                                </div>
                                <div style={{ background: 'var(--bg-card)', padding: '20px', borderRadius: '16px', border: '1px solid var(--border)' }}>
                                    <div style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>Ukupna Potrošnja</div>
                                    <div style={{ fontSize: '24px', fontWeight: '700', marginTop: '8px', color: '#10b981' }}>{customer.totalSpent} €</div>
                                </div>
                                <div style={{ background: 'var(--bg-card)', padding: '20px', borderRadius: '16px', border: '1px solid var(--border)' }}>
                                    <div style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>Poslednja Rezervacija</div>
                                    <div style={{ fontSize: '18px', fontWeight: '600', marginTop: '8px' }}>Pre 12 dana</div>
                                </div>
                            </div>

                            {/* Info Card */}
                            <div style={{ background: 'var(--bg-card)', padding: '24px', borderRadius: '16px', border: '1px solid var(--border)' }}>
                                <h3 style={{ marginTop: 0, marginBottom: '20px' }}>Kontakt i Lični Podaci</h3>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                    <div style={{ display: 'flex', gap: '12px' }}>
                                        <Mail size={18} color="var(--text-secondary)" />
                                        <div>
                                            <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Email Adresa</div>
                                            <div style={{ fontWeight: '500' }}>{customer.email}</div>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', gap: '12px' }}>
                                        <Phone size={18} color="var(--text-secondary)" />
                                        <div>
                                            <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Broj Telefona</div>
                                            <div style={{ fontWeight: '500' }}>{customer.phone}</div>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', gap: '12px' }}>
                                        <Calendar size={18} color="var(--text-secondary)" />
                                        <div>
                                            <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Datum Rođenja</div>
                                            <div style={{ fontWeight: '500' }}>{customer.birthDate || 'Nije uneto'}</div>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', gap: '12px' }}>
                                        <UserCheck size={18} color="var(--text-secondary)" />
                                        <div>
                                            <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Status Profila</div>
                                            <div style={{ fontWeight: '500', color: '#10b981' }}>Verifikovan</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}

                    {activeTab === 'bookings' && (
                        <div style={{ background: 'var(--bg-card)', padding: '40px', borderRadius: '16px', border: '1px solid var(--border)', textAlign: 'center' }}>
                            <History size={48} style={{ opacity: 0.2, marginBottom: '16px' }} />
                            <h3>Istorija Rezervacija</h3>
                            <p style={{ color: 'var(--text-secondary)' }}>Modul za rezervacije je trenutno u fazi migracije na React Router.</p>
                        </div>
                    )}
                </div>

                {/* Sidebar */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    <div style={{ background: 'var(--bg-card)', padding: '24px', borderRadius: '16px', border: '1px solid var(--border)' }}>
                        <h3 style={{ marginTop: 0, marginBottom: '16px', fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <MapPin size={18} /> Lokacija
                        </h3>
                        <div style={{ fontSize: '14px', lineHeight: '1.6' }}>
                            <div>{customer.address.street}</div>
                            <div>{customer.address.city}</div>
                            <div style={{ fontWeight: '600' }}>{customer.address.country}</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CustomerDetail;
