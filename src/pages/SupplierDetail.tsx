import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
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
    AlertCircle
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

            const { success, data } = await loadFromCloud('suppliers');
            let suppliers: Supplier[] = [];

            if (success && data && data.length > 0) {
                suppliers = data as Supplier[];
            } else {
                // Fallback to localStorage
                const saved = localStorage.getItem('olympic_hub_suppliers');
                if (saved) suppliers = JSON.parse(saved);
            }

            // Find supplier by ID or slug
            const found = suppliers.find(s =>
                s.id === supplierId ||
                s.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') === supplierId
            );

            setSupplier(found || null);
            setLoading(false);
        };

        loadSupplier();
    }, [supplierId]);

    if (loading) {
        return (
            <div className="module-container fade-in" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '50vh' }}>
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 1 }}
                    style={{ color: 'var(--accent)' }}
                >
                    <Building size={48} />
                </motion.div>
            </div>
        );
    }

    if (!supplier) {
        return (
            <div className="module-container fade-in">
                <div style={{ textAlign: 'center', padding: '60px' }}>
                    <AlertCircle size={64} style={{ color: '#ef4444', marginBottom: '16px' }} />
                    <h2 style={{ color: 'var(--text-primary)', marginBottom: '16px' }}>Dobavljač nije pronađen</h2>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>
                        Dobavljač sa ID-om "{supplierId}" ne postoji u sistemu.
                    </p>
                    <button
                        className="btn-primary-action"
                        onClick={() => navigate('/suppliers')}
                    >
                        <ArrowLeft size={18} /> Nazad na listu
                    </button>
                </div>
            </div>
        );
    }

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

    const tabs = [
        { id: 'overview', label: 'Pregled', icon: <FileText size={16} /> },
        { id: 'contracts', label: 'Ugovori', icon: <Briefcase size={16} /> },
        { id: 'transactions', label: 'Transakcije', icon: <DollarSign size={16} /> },
        { id: 'notes', label: 'Beleške', icon: <FileText size={16} /> },
    ];

    const status = statusColors[supplier.contractStatus];

    return (
        <div className="module-container fade-in">
            {/* Breadcrumb */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '24px',
                fontSize: '14px',
                color: 'var(--text-secondary)'
            }}>
                <Link to="/" style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>
                    Početna
                </Link>
                <ChevronRight size={14} />
                <Link to="/suppliers" style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>
                    Dobavljači
                </Link>
                <ChevronRight size={14} />
                <span style={{ color: 'var(--accent)' }}>{supplier.name}</span>
            </div>

            {/* Header */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                marginBottom: '32px'
            }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '20px' }}>
                    <button
                        onClick={() => navigate('/suppliers')}
                        className="btn-icon circle"
                    >
                        <ArrowLeft size={20} />
                    </button>

                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                            <div style={{
                                width: '48px',
                                height: '48px',
                                borderRadius: '12px',
                                background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: '#fff',
                            }}>
                                {typeIcons[supplier.type]}
                            </div>
                            <div>
                                <h1 style={{ fontSize: '28px', fontWeight: '700', margin: 0 }}>{supplier.name}</h1>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '4px' }}>
                                    <span style={{
                                        padding: '4px 12px',
                                        borderRadius: '20px',
                                        fontSize: '12px',
                                        fontWeight: '600',
                                        background: status.bg,
                                        color: status.color
                                    }}>
                                        {status.text}
                                    </span>
                                    <span style={{
                                        padding: '4px 12px',
                                        borderRadius: '20px',
                                        fontSize: '12px',
                                        fontWeight: '500',
                                        background: 'var(--bg-card)',
                                        border: '1px solid var(--border)',
                                    }}>
                                        {supplier.type}
                                    </span>
                                    {supplier.rating > 0 && (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                            {[...Array(supplier.rating)].map((_, i) => (
                                                <Star key={i} size={14} fill="#fbbf24" strokeWidth={0} />
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '12px' }}>
                    <button className="btn-primary-action">
                        <Edit size={18} /> Uredi
                    </button>
                </div>
            </div>

            {/* Tabs */}
            <div style={{
                display: 'flex',
                gap: '4px',
                marginBottom: '32px',
                background: 'var(--bg-card)',
                padding: '4px',
                borderRadius: '12px',
                border: '1px solid var(--border)',
                width: 'fit-content'
            }}>
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            padding: '10px 20px',
                            border: 'none',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontWeight: '600',
                            fontSize: '14px',
                            background: activeTab === tab.id ? 'var(--accent)' : 'transparent',
                            color: activeTab === tab.id ? '#fff' : 'var(--text-secondary)',
                            transition: 'all 0.2s'
                        }}
                    >
                        {tab.icon} {tab.label}
                    </button>
                ))}
            </div>

            {/* Content */}
            {activeTab === 'overview' && (
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
                    {/* Main Content */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                        {/* Contact Info */}
                        <div style={{
                            background: 'var(--bg-card)',
                            border: '1px solid var(--border)',
                            borderRadius: '16px',
                            padding: '24px'
                        }}>
                            <h3 style={{ marginBottom: '20px' }}>Kontakt Informacije</h3>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <div style={{
                                        width: '40px',
                                        height: '40px',
                                        borderRadius: '10px',
                                        background: 'rgba(59, 130, 246, 0.1)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: '#3b82f6'
                                    }}>
                                        <Mail size={18} />
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Email</div>
                                        <div style={{ fontWeight: '500' }}>{supplier.contact.email}</div>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <div style={{
                                        width: '40px',
                                        height: '40px',
                                        borderRadius: '10px',
                                        background: 'rgba(16, 185, 129, 0.1)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: '#10b981'
                                    }}>
                                        <Phone size={18} />
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Telefon</div>
                                        <div style={{ fontWeight: '500' }}>{supplier.contact.phone}</div>
                                    </div>
                                </div>

                                {supplier.contact.website && (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <div style={{
                                            width: '40px',
                                            height: '40px',
                                            borderRadius: '10px',
                                            background: 'rgba(139, 92, 246, 0.1)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            color: '#8b5cf6'
                                        }}>
                                            <Globe size={18} />
                                        </div>
                                        <div>
                                            <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Website</div>
                                            <a href={supplier.contact.website} target="_blank" rel="noopener noreferrer" style={{ fontWeight: '500', color: 'var(--accent)' }}>
                                                {supplier.contact.website}
                                            </a>
                                        </div>
                                    </div>
                                )}

                                {supplier.contact.contactPerson && (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <div style={{
                                            width: '40px',
                                            height: '40px',
                                            borderRadius: '10px',
                                            background: 'rgba(245, 158, 11, 0.1)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            color: '#f59e0b'
                                        }}>
                                            <Users size={18} />
                                        </div>
                                        <div>
                                            <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Kontakt Osoba</div>
                                            <div style={{ fontWeight: '500' }}>{supplier.contact.contactPerson}</div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Bank Details */}
                        {supplier.bankDetails && (
                            <div style={{
                                background: 'var(--bg-card)',
                                border: '1px solid var(--border)',
                                borderRadius: '16px',
                                padding: '24px'
                            }}>
                                <h3 style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <CreditCard size={20} /> Bankovni Podaci
                                </h3>
                                <div style={{ display: 'grid', gap: '12px' }}>
                                    <div>
                                        <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Banka</div>
                                        <div style={{ fontWeight: '500' }}>{supplier.bankDetails.bankName}</div>
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>IBAN</div>
                                        <div style={{ fontWeight: '500', fontFamily: 'monospace' }}>{supplier.bankDetails.iban}</div>
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>SWIFT</div>
                                        <div style={{ fontWeight: '500', fontFamily: 'monospace' }}>{supplier.bankDetails.swift}</div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Sidebar */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                        {/* Address */}
                        <div style={{
                            background: 'var(--bg-card)',
                            border: '1px solid var(--border)',
                            borderRadius: '16px',
                            padding: '24px'
                        }}>
                            <h3 style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <MapPin size={18} /> Adresa
                            </h3>
                            <div style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
                                <p style={{ margin: 0 }}>{supplier.address.street}</p>
                                <p style={{ margin: '4px 0 0' }}>{supplier.address.postalCode} {supplier.address.city}</p>
                                <p style={{ margin: '4px 0 0', fontWeight: '500' }}>{supplier.address.country}</p>
                            </div>
                        </div>

                        {/* Meta Info */}
                        <div style={{
                            background: 'var(--bg-card)',
                            border: '1px solid var(--border)',
                            borderRadius: '16px',
                            padding: '24px'
                        }}>
                            <h3 style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Clock size={18} /> Informacije
                            </h3>
                            <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                    <span>ID:</span>
                                    <span style={{ fontFamily: 'monospace' }}>{supplier.id}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                    <span>Kreiran:</span>
                                    <span>{new Date(supplier.created_at).toLocaleDateString('sr-RS')}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span>Ažuriran:</span>
                                    <span>{new Date(supplier.updated_at).toLocaleDateString('sr-RS')}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'contracts' && (
                <div style={{
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border)',
                    borderRadius: '16px',
                    padding: '40px',
                    textAlign: 'center'
                }}>
                    <Briefcase size={48} style={{ color: 'var(--text-secondary)', marginBottom: '16px', opacity: 0.5 }} />
                    <h3>Ugovori</h3>
                    <p style={{ color: 'var(--text-secondary)' }}>Upravljanje ugovorima dolazi uskoro...</p>
                </div>
            )}

            {activeTab === 'transactions' && (
                <div style={{
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border)',
                    borderRadius: '16px',
                    padding: '40px',
                    textAlign: 'center'
                }}>
                    <DollarSign size={48} style={{ color: 'var(--text-secondary)', marginBottom: '16px', opacity: 0.5 }} />
                    <h3>Transakcije</h3>
                    <p style={{ color: 'var(--text-secondary)' }}>Pregled transakcija dolazi uskoro...</p>
                </div>
            )}

            {activeTab === 'notes' && (
                <div style={{
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border)',
                    borderRadius: '16px',
                    padding: '24px'
                }}>
                    <h3 style={{ marginBottom: '16px' }}>Beleške</h3>
                    <textarea
                        defaultValue={supplier.notes || ''}
                        placeholder="Dodajte beleške o ovom dobavljaču..."
                        style={{
                            width: '100%',
                            minHeight: '200px',
                            padding: '16px',
                            borderRadius: '12px',
                            border: '1px solid var(--border)',
                            background: 'var(--bg-main)',
                            color: 'var(--text-primary)',
                            fontSize: '14px',
                            resize: 'vertical',
                        }}
                    />
                </div>
            )}
        </div>
    );
};

export default SupplierDetail;
