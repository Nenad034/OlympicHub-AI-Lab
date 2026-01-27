import React, { useState } from 'react';
import { motion, AnimatePresence, useDragControls } from 'framer-motion';
import LocationPicker from '../../components/LocationPicker';
import {
    Users,
    ArrowLeft,
    Briefcase,
    Plus,
    X,
    Mail,
    Phone,
    User,
    MapPin,
    Building2,
    Contact,
    GripHorizontal,
    Globe,
    Trash2,
    LayoutGrid,
    List as ListIcon,
    Search,
    Download,
    Lock
} from 'lucide-react';
import { exportToJSON, exportToExcel, exportToXML, exportToPDF } from '../../utils/exportUtils';
import { useEffect } from 'react';
import { saveToCloud, loadFromCloud } from '../../utils/storageUtils';
import { useConfig } from '../../context/ConfigContext';

interface ContactPerson {
    id: string;
    name: string;
    phone: string;
    title: string;
}

interface Customer {
    id: string;
    type: 'B2C' | 'B2B';
    category: string;
    fname: string;
    lname: string;
    email: string;
    phone: string;
    contacts: ContactPerson[];
    firmName?: string;
    cui?: string; // Tax ID
    iban?: string;
    bank?: string;
    address: string;
    city: string;
    country: string;
    identityNo?: string; // Passport/ID
    newsletter: boolean;
}

interface CustomersProps {
    onBack: () => void;
}

const Customers: React.FC<CustomersProps> = ({ onBack }) => {
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [showAddForm, setShowAddForm] = useState(false);
    const [selectedTab, setSelectedTab] = useState<'B2C' | 'B2B'>('B2C');
    const [activeModalTab, setActiveModalTab] = useState<'basic' | 'company' | 'location'>('basic');
    const dragControls = useDragControls();

    // New States for View and Search
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [searchQuery, setSearchQuery] = useState('');

    // Permissions and Export Menu State
    const { config } = useConfig();
    const currentLevel = config.userLevels?.current || 5;
    const permissions = config.levelPermissions?.[currentLevel] || { canImport: false, canExport: false };
    const [showExportMenu, setShowExportMenu] = useState(false);

    const [formData, setFormData] = useState<Partial<Customer>>({
        type: 'B2C',
        country: 'RS',
        newsletter: true,
        contacts: []
    });

    const b2cCategories = ['Individualni putnici', 'Pravna lica (Firme)'];
    const b2bCategories = ['Subagenti', 'Touroperatori'];

    // Helper to generate smart IDs
    const generateID = () => {
        const year = new Date().getFullYear().toString().substr(-2);
        const random = Math.random().toString(36).substr(2, 4).toUpperCase();
        return `KUP-${year}-${random}`;
    };

    // Load data
    useEffect(() => {
        const loadCustomers = async () => {
            let loadedFromCloudSuccess = false;

            // 1. Try Cloud
            const { success, data } = await loadFromCloud('customers');
            if (success && data && Array.isArray(data) && data.length > 0) {
                console.log("Loaded customers from Cloud:", data.length);
                setCustomers(data as Customer[]);
                loadedFromCloudSuccess = true;
            }

            // 2. Fallback to LocalStorage
            if (!loadedFromCloudSuccess) {
                try {
                    const saved = localStorage.getItem('olympic_hub_customers');
                    if (saved) {
                        const parsed = JSON.parse(saved);
                        if (Array.isArray(parsed)) {
                            console.log("Loaded customers from LocalStorage:", parsed.length);
                            setCustomers(parsed);
                        }
                    }
                } catch (e) {
                    console.error("Failed to parse local customers:", e);
                }
            }
        };
        loadCustomers();
    }, []);

    // Save data
    useEffect(() => {
        if (customers.length > 0) {
            localStorage.setItem('olympic_hub_customers', JSON.stringify(customers));
            saveToCloud('customers', customers);
        }
    }, [customers]);

    const handleSaveCustomer = (e: React.FormEvent) => {
        e.preventDefault();
        if (formData.id) {
            setCustomers(customers.map(c => c.id === formData.id ? { ...formData } as Customer : c));
        } else {
            const newCustomer = {
                ...formData,
                id: generateID(),
                type: formData.type || selectedTab
            } as Customer;
            setCustomers([...customers, newCustomer]);
        }
        setShowAddForm(false);
        setFormData({ type: selectedTab, country: 'RS', newsletter: true, contacts: [] });
        setActiveModalTab('basic');
    };

    const handleEditCustomer = (customer: Customer) => {
        setFormData(customer);
        setShowAddForm(true);
        setActiveModalTab('basic');
    };

    const addContact = () => {
        const newContact: ContactPerson = { id: Math.random().toString(36).substr(2, 9), name: '', title: '', phone: '' };
        setFormData({ ...formData, contacts: [...(formData.contacts || []), newContact] });
    };

    const removeContact = (id: string) => {
        setFormData({ ...formData, contacts: (formData.contacts || []).filter(c => c.id !== id) });
    };

    const updateContact = (id: string, field: keyof ContactPerson, value: string) => {
        setFormData({
            ...formData,
            contacts: (formData.contacts || []).map(c => c.id === id ? { ...c, [field]: value } : c)
        });
    };

    const handleExport = (format: 'json' | 'excel' | 'xml' | 'pdf') => {
        const filtered = customers.filter(c => c.type === selectedTab);
        if (filtered.length === 0) return alert('Nema kupaca za export');
        switch (format) {
            case 'json': exportToJSON(filtered, `kupci_${selectedTab}`); break;
            case 'excel': exportToExcel(filtered, `kupci_${selectedTab}`); break;
            case 'xml': exportToXML(filtered, `kupci_${selectedTab}`); break;
            case 'pdf': exportToPDF(filtered, `kupci_${selectedTab}`, `Baza Kupaca - ${selectedTab}`); break;
        }
    };

    const modalTabs = [
        { id: 'basic', label: 'Lični Podaci', icon: <Contact size={18} /> },
        { id: 'company', label: 'Firma / Identitet', icon: <Building2 size={18} /> },
        { id: 'location', label: 'Lokacija', icon: <MapPin size={18} /> }
    ];

    // Filter logic
    const filteredCustomers = customers.filter(c => {
        if (c.type !== selectedTab) return false;
        if (!searchQuery) return true;
        const query = searchQuery.toLowerCase();
        return (
            c.fname?.toLowerCase().includes(query) ||
            c.lname?.toLowerCase().includes(query) ||
            c.id?.toLowerCase().includes(query) ||
            c.firmName?.toLowerCase().includes(query) ||
            c.email?.toLowerCase().includes(query)
        );
    });

    return (
        <div className="module-container">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <button onClick={onBack} className="btn-icon"><ArrowLeft size={20} /></button>
                    <div>
                        <h2 style={{ fontSize: '24px', fontWeight: '700' }}>Kupci</h2>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Upravljanje bazom putnika i subagenata</p>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                    <div style={{ position: 'relative' }}>
                        <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                        <input
                            type="text"
                            placeholder="Pretraga po ID, imenu ili firmi..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            style={{
                                padding: '10px 10px 10px 40px',
                                borderRadius: '12px',
                                border: '1px solid var(--border)',
                                background: 'var(--bg-card)',
                                color: 'var(--text-primary)',
                                width: '250px'
                            }}
                        />
                    </div>
                    <div style={{ display: 'flex', background: 'var(--bg-card)', borderRadius: '12px', border: '1px solid var(--border)', padding: '4px' }}>
                        <button
                            onClick={() => setViewMode('grid')}
                            style={{
                                padding: '8px',
                                borderRadius: '8px',
                                background: viewMode === 'grid' ? 'var(--accent)' : 'transparent',
                                color: viewMode === 'grid' ? '#fff' : 'var(--text-secondary)',
                                border: 'none',
                                cursor: 'pointer',
                                display: 'flex'
                            }}
                        >
                            <LayoutGrid size={18} />
                        </button>
                        <button
                            onClick={() => setViewMode('list')}
                            style={{
                                padding: '8px',
                                borderRadius: '8px',
                                background: viewMode === 'list' ? 'var(--accent)' : 'transparent',
                                color: viewMode === 'list' ? '#fff' : 'var(--text-secondary)',
                                border: 'none',
                                cursor: 'pointer',
                                display: 'flex'
                            }}
                        >
                            <ListIcon size={18} />
                        </button>
                    </div>

                    {/* Action Buttons with Permissions */}
                    <div className="export-group" style={{ position: 'relative' }}>
                        {permissions.canImport ? (
                            <button className="btn-secondary" onClick={() => alert("Import functionality coming soon")} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <Download size={16} className="rotate-180" /> Import
                            </button>
                        ) : (
                            <button className="btn-secondary" disabled style={{ opacity: 0.5, cursor: 'not-allowed' }}>Import <Lock size={12} /></button>
                        )}

                        {permissions.canExport ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <button
                                    className="btn-secondary"
                                    onClick={() => setShowExportMenu(!showExportMenu)}
                                    style={{ display: 'flex', alignItems: 'center', gap: '6px', background: showExportMenu ? 'var(--accent)' : 'var(--glass-bg)', color: showExportMenu ? '#fff' : 'var(--text-primary)' }}
                                >
                                    <Download size={16} /> Export
                                </button>
                                {showExportMenu && (
                                    <motion.div
                                        initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                                        style={{ display: 'flex', gap: '4px' }}
                                    >
                                        <button className="btn-secondary" onClick={() => handleExport('json')}>JSON</button>
                                        <button className="btn-secondary" onClick={() => handleExport('excel')}>XLSX</button>
                                        <button className="btn-secondary" onClick={() => handleExport('pdf')}>PDF</button>
                                    </motion.div>
                                )}
                            </div>
                        ) : (
                            <button className="btn-secondary" disabled style={{ opacity: 0.5, cursor: 'not-allowed' }}>Export <Lock size={12} /></button>
                        )}
                    </div>

                    <button onClick={() => { setFormData({ type: selectedTab, country: 'RS', newsletter: true, contacts: [] }); setShowAddForm(true); }} className="btn-primary">
                        <Plus size={18} /> Dodaj Kupca
                    </button>
                </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', marginBottom: '32px' }}>
                <button
                    onClick={() => setSelectedTab('B2C')}
                    className={`nav-btn ${selectedTab === 'B2C' ? 'active' : ''}`}
                >
                    <Users size={18} /> B2C Segment
                </button>
                <button
                    onClick={() => setSelectedTab('B2B')}
                    className={`nav-btn ${selectedTab === 'B2B' ? 'active' : ''}`}
                >
                    <Briefcase size={18} /> B2B Segment
                </button>
            </div>

            <div className="customers-list">
                {filteredCustomers.length === 0 ? (
                    <div style={{ padding: '80px', textAlign: 'center', background: 'var(--bg-card)', borderRadius: '24px', border: '1px solid var(--border)' }}>
                        <User size={48} color="var(--text-secondary)" style={{ marginBottom: '16px', opacity: 0.3 }} />
                        <p style={{ color: 'var(--text-secondary)' }}>Nema rezultata za {selectedTab} segment.</p>
                    </div>
                ) : (
                    <>
                        {viewMode === 'grid' ? (
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '20px' }}>
                                {filteredCustomers.map(c => (
                                    <motion.div
                                        key={c.id}
                                        layout
                                        className="app-card"
                                        style={{ padding: '24px', cursor: 'pointer' }}
                                        onClick={() => handleEditCustomer(c)}
                                    >
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px', alignItems: 'flex-start' }}>
                                            <div>
                                                <div style={{ fontSize: '11px', color: 'var(--accent)', fontWeight: '700', marginBottom: '4px' }}>{c.id}</div>
                                                <h3 style={{ fontSize: '18px', fontWeight: '700', margin: 0 }}>{c.fname} {c.lname}</h3>
                                            </div>
                                            {c.firmName && <span style={{ fontSize: '11px', background: 'rgba(56, 189, 248, 0.1)', color: 'var(--accent)', padding: '4px 8px', borderRadius: '6px' }}>{c.firmName}</span>}
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Mail size={12} /> {c.email}</div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Phone size={12} /> {c.phone}</div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><MapPin size={12} /> {c.city}, {c.country}</div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        ) : (
                            <div className="table-responsive" style={{ background: 'var(--bg-card)', borderRadius: '20px', border: '1px solid var(--border)', overflow: 'hidden' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse', color: 'var(--text-primary)', fontSize: '14px' }}>
                                    <thead>
                                        <tr style={{ borderBottom: '1px solid var(--border)', background: 'rgba(255,255,255,0.02)' }}>
                                            <th style={{ padding: '16px', textAlign: 'left', fontWeight: '600', color: 'var(--text-secondary)', fontSize: '12px', textTransform: 'uppercase' }}>ID</th>
                                            <th style={{ padding: '16px', textAlign: 'left', fontWeight: '600', color: 'var(--text-secondary)', fontSize: '12px', textTransform: 'uppercase' }}>Ime i Prezime</th>
                                            <th style={{ padding: '16px', textAlign: 'left', fontWeight: '600', color: 'var(--text-secondary)', fontSize: '12px', textTransform: 'uppercase' }}>Firma</th>
                                            <th style={{ padding: '16px', textAlign: 'left', fontWeight: '600', color: 'var(--text-secondary)', fontSize: '12px', textTransform: 'uppercase' }}>Kontakt</th>
                                            <th style={{ padding: '16px', textAlign: 'left', fontWeight: '600', color: 'var(--text-secondary)', fontSize: '12px', textTransform: 'uppercase' }}>Lokacija</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredCustomers.map(c => (
                                            <tr
                                                key={c.id}
                                                style={{ borderBottom: '1px solid var(--border)', cursor: 'pointer' }}
                                                onClick={() => handleEditCustomer(c)}
                                                className="table-row-hover"
                                            >
                                                <td style={{ padding: '16px', fontWeight: '700', color: 'var(--accent)', fontFamily: 'monospace' }}>{c.id}</td>
                                                <td style={{ padding: '16px', fontWeight: '600' }}>{c.fname} {c.lname}</td>
                                                <td style={{ padding: '16px', color: 'var(--text-secondary)' }}>{c.firmName || '-'}</td>
                                                <td style={{ padding: '16px', color: 'var(--text-secondary)' }}>
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                                        <span>{c.email}</span>
                                                        <span style={{ fontSize: '12px' }}>{c.phone}</span>
                                                    </div>
                                                </td>
                                                <td style={{ padding: '16px' }}>{c.city}, {c.country}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </>
                )}
            </div>

            <AnimatePresence>
                {showAddForm && (
                    <div className="modal-overlay" onClick={() => setShowAddForm(false)} style={{ perspective: '1000px' }}>
                        <motion.div
                            drag
                            dragListener={false}
                            dragControls={dragControls}
                            dragMomentum={false}
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="modal-content glass-panel"
                            onClick={e => e.stopPropagation()}
                            style={{
                                width: '800px',
                                height: '600px',
                                position: 'fixed',
                                top: 'calc(50% - 300px)',
                                left: 'calc(50% - 400px)',
                                resize: 'both',
                                minWidth: '800px',
                                minHeight: '600px',
                                maxWidth: '95vw',
                                maxHeight: '95vh',
                                padding: 0,
                                display: 'flex',
                                flexDirection: 'column',
                                overflow: 'hidden',
                                boxShadow: '0 50px 100px -20px rgba(0,0,0,0.5)',
                                border: '1px solid var(--glass-border)',
                                zIndex: 1001
                            }}
                        >
                            {/* Draggable Header */}
                            <div
                                className="drag-handle"
                                onPointerDown={(e) => dragControls.start(e)}
                                style={{ background: 'var(--bg-main)', borderBottom: '1px solid var(--border)' }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <div style={{ cursor: 'grab', padding: '4px' }}><GripHorizontal size={20} color="var(--text-secondary)" /></div>
                                    <h3 style={{ fontSize: '16px', fontWeight: '700', margin: 0 }}>
                                        {formData.id ? 'Izmena Kupca' : 'Novi Kupac'} ({selectedTab})
                                    </h3>
                                </div>
                                <button onClick={() => setShowAddForm(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                                    <X size={20} />
                                </button>
                            </div>

                            <form onSubmit={handleSaveCustomer} style={{ display: 'flex', height: '100%' }}>
                                {/* Sidebar Navigation */}
                                <div style={{ width: '220px', background: 'rgba(0,0,0,0.2)', padding: '20px', display: 'flex', flexDirection: 'column', gap: '4px', borderRight: '1px solid var(--border)' }}>
                                    {modalTabs.map(tab => (
                                        <button
                                            type="button"
                                            key={tab.id}
                                            onClick={() => setActiveModalTab(tab.id as any)}
                                            className={`vtab-btn ${activeModalTab === tab.id ? 'active' : ''}`}
                                        >
                                            {tab.icon}
                                            {tab.label}
                                        </button>
                                    ))}

                                    <div style={{ flex: 1 }}></div>

                                    <button
                                        type="submit"
                                        className="btn-primary"
                                        style={{
                                            width: '100%',
                                            justifyContent: 'center',
                                            padding: '16px',
                                            marginTop: '20px',
                                            borderRadius: '16px',
                                            boxShadow: '0 10px 30px -10px var(--accent)'
                                        }}
                                    >
                                        <Plus size={18} /> Sačuvaj
                                    </button>
                                </div>

                                {/* Content Area */}
                                <div style={{ flex: 1, padding: '30px', overflowY: 'auto' }}>

                                    {activeModalTab === 'basic' && (
                                        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="form-grid">
                                            <div className="modal-field">
                                                <label>Tip</label>
                                                <select
                                                    value={formData.type}
                                                    disabled
                                                    style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', padding: '14px', borderRadius: '12px', color: 'var(--text-secondary)', opacity: 0.7 }}
                                                >
                                                    <option value="B2C">B2C</option>
                                                    <option value="B2B">B2B</option>
                                                </select>
                                            </div>
                                            <div className="modal-field">
                                                <label>Kategorija</label>
                                                <select
                                                    onChange={e => setFormData({ ...formData, category: e.target.value })}
                                                    style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border)', padding: '14px', borderRadius: '12px', color: 'var(--text-primary)' }}
                                                >
                                                    {selectedTab === 'B2B' ? b2bCategories.map(cat => <option key={cat} value={cat}>{cat}</option>) : b2cCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                                                </select>
                                            </div>
                                            <div className="modal-field">
                                                <label>Ime</label>
                                                <input required type="text" onChange={e => setFormData({ ...formData, fname: e.target.value })} placeholder="Ime putnika" />
                                            </div>
                                            <div className="modal-field">
                                                <label>Prezime</label>
                                                <input required type="text" onChange={e => setFormData({ ...formData, lname: e.target.value })} placeholder="Prezime putnika" />
                                            </div>
                                            <div className="modal-field">
                                                <label>Email</label>
                                                <input required type="email" onChange={e => setFormData({ ...formData, email: e.target.value })} placeholder="email@adresa.com" />
                                            </div>
                                            <div className="modal-field">
                                                <label>Telefon</label>
                                                <input required type="text" onChange={e => setFormData({ ...formData, phone: e.target.value })} placeholder="+381 6..." />
                                            </div>

                                            {/* Kontakt Osobe Section */}
                                            <div style={{ gridColumn: 'span 2', marginTop: '10px', borderTop: '1px solid var(--border)', paddingTop: '20px' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                                                    <h4 style={{ margin: 0, fontSize: '14px', color: 'var(--accent)', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                        <User size={16} /> Kontakt Osobe
                                                    </h4>
                                                    <button type="button" onClick={addContact} className="btn-secondary" style={{ padding: '8px 16px', fontSize: '12px' }}>
                                                        <Plus size={14} style={{ marginRight: '4px' }} /> Dodaj Kontakt
                                                    </button>
                                                </div>

                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                                    {(formData.contacts || []).map((contact, index) => (
                                                        <div key={contact.id} style={{ display: 'flex', gap: '12px', alignItems: 'flex-end', background: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: '16px', border: '1px solid var(--border)' }}>
                                                            <div className="modal-field" style={{ flex: 2 }}>
                                                                <label>{index + 1}. Ime i Prezime</label>
                                                                <input
                                                                    type="text"
                                                                    value={contact.name}
                                                                    onChange={e => updateContact(contact.id, 'name', e.target.value)}
                                                                    placeholder="Petar Petrović"
                                                                    style={{ padding: '12px 16px' }}
                                                                />
                                                            </div>
                                                            <div className="modal-field" style={{ flex: 1.5 }}>
                                                                <label>Zvanje / Pozicija</label>
                                                                <input
                                                                    type="text"
                                                                    value={contact.title}
                                                                    onChange={e => updateContact(contact.id, 'title', e.target.value)}
                                                                    placeholder="Direktor"
                                                                    style={{ padding: '12px 16px' }}
                                                                />
                                                            </div>
                                                            <div className="modal-field" style={{ flex: 1.5 }}>
                                                                <label>Telefon</label>
                                                                <input
                                                                    type="text"
                                                                    value={contact.phone}
                                                                    onChange={e => updateContact(contact.id, 'phone', e.target.value)}
                                                                    placeholder="+381..."
                                                                    style={{ padding: '12px 16px' }}
                                                                />
                                                            </div>
                                                            <button
                                                                type="button"
                                                                onClick={() => removeContact(contact.id)}
                                                                style={{
                                                                    background: 'rgba(239, 68, 68, 0.1)',
                                                                    border: '1px solid rgba(239, 68, 68, 0.2)',
                                                                    color: '#ef4444',
                                                                    width: '42px',
                                                                    height: '42px',
                                                                    borderRadius: '50%',
                                                                    display: 'flex',
                                                                    alignItems: 'center',
                                                                    justifyContent: 'center',
                                                                    cursor: 'pointer',
                                                                    flexShrink: 0
                                                                }}
                                                            >
                                                                <Trash2 size={16} />
                                                            </button>
                                                        </div>
                                                    ))}
                                                    {(formData.contacts || []).length === 0 && (
                                                        <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-secondary)', fontSize: '13px', fontStyle: 'italic' }}>
                                                            Nema unetih kontakt osoba.
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}

                                    {activeModalTab === 'company' && (
                                        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="form-grid">
                                            <div className="modal-field" style={{ gridColumn: 'span 2' }}>
                                                <label>Naziv Firme (Opciono za B2C)</label>
                                                <input type="text" onChange={e => setFormData({ ...formData, firmName: e.target.value })} placeholder="Puni naziv firme" />
                                            </div>
                                            <div className="modal-field">
                                                <label>PIB / CUI</label>
                                                <input type="text" onChange={e => setFormData({ ...formData, cui: e.target.value })} placeholder="Poreski ID" />
                                            </div>
                                            <div className="modal-field">
                                                <label>Broj L.K. / Pasoša</label>
                                                <input type="text" onChange={e => setFormData({ ...formData, identityNo: e.target.value })} placeholder="Br. dokumenta ako je fizičko lice" />
                                            </div>
                                        </motion.div>
                                    )}

                                    {activeModalTab === 'location' && (
                                        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                                            <div style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--accent)' }}>
                                                <Globe size={20} />
                                                <h4 style={{ margin: 0 }}>Adresa Stanovanja / Sedišta</h4>
                                            </div>
                                            <LocationPicker
                                                data={{
                                                    address: formData.address || '',
                                                    city: formData.city || '',
                                                    postalCode: '',
                                                    countryCode: formData.country || 'RS',
                                                    latitude: 0,
                                                    longitude: 0
                                                }}
                                                onChange={(data) => setFormData({
                                                    ...formData,
                                                    address: data.address,
                                                    city: data.city,
                                                    country: data.countryCode
                                                })}
                                            />
                                        </motion.div>
                                    )}
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <style>{`
                .btn-icon { background: var(--glass-bg); border: 1px solid var(--border); color: var(--text-primary); padding: 8px; borderRadius: 12px; cursor: pointer; display: flex; align-items: center; }
                .btn-primary { background: var(--accent); color: #fff; border: none; padding: 10px 20px; borderRadius: 12px; fontWeight: 600; cursor: pointer; display: flex; align-items: center; gap: 8px; }
                .btn-secondary { background: var(--glass-bg); border: 1px solid var(--border); color: var(--text-primary); padding: 10px 15px; borderRadius: 10px; cursor: pointer; font-size: 12px; font-weight: 600; }
                .export-group { display: flex; background: var(--glass-bg); padding: 4px; borderRadius: 14px; border: 1px solid var(--border); gap: 4px; }
                .nav-btn { background: var(--bg-card); border: 1px solid var(--border); color: var(--text-primary); padding: 12px 24px; borderRadius: 16px; cursor: pointer; display: flex; align-items: center; gap: 10px; font-weight: 600; }
                .nav-btn.active { background: var(--accent); color: #fff; border-color: var(--accent); }
                
                .modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.85); backdrop-filter: blur(8px); display: block; z-index: 1000; }
                .glass-panel { background: #1a1f2e; backdrop-filter: blur(20px); border-radius: 24px; }

                .app-card { background: var(--bg-card); border: 1px solid var(--border); border-radius: 20px; position: relative; overflow: hidden; }
                .app-card:hover { transform: translateY(-4px); box-shadow: 0 10px 30px rgba(0,0,0,0.2); border-color: var(--accent); transition: 0.3s; }

                /* VTabs Styles */
                .vtab-btn {
                    display: flex; align-items: center; gap: 12px; padding: 16px 20px;
                    width: 100%; border: none; background: transparent; color: var(--text-secondary);
                    font-size: 13px; font-weight: 600; cursor: pointer; transition: 0.2s;
                    border-left: 3px solid transparent;
                    border-radius: 12px;
                    margin-bottom: 4px;
                }
                .vtab-btn:hover { background: rgba(255,255,255,0.05); color: var(--text-primary); }
                .vtab-btn.active { background: rgba(0, 92, 197, 0.1); color: var(--accent); border-left: 3px solid var(--accent); }
                
                .form-grid { 
                    display: grid; 
                    grid-template-columns: 1fr 1fr; 
                    gap: 24px; 
                    align-items: start;
                }
                .modal-field { 
                    display: flex; 
                    flex-direction: column; 
                    gap: 8px; 
                    width: 100%;
                }
                .modal-field label { 
                    font-size: 12px; 
                    color: var(--text-secondary); 
                    font-weight: 600; 
                    margin-left: 8px;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }
                .modal-field input, .modal-field select { 
                    width: 100%;
                    background: rgba(255, 255, 255, 0.03); 
                    border: 1px solid rgba(255, 255, 255, 0.1); 
                    padding: 16px 24px; 
                    border-radius: 100px;
                    color: var(--text-primary); 
                    outline: none; 
                    transition: 0.3s; 
                    font-size: 14px; 
                }
                .modal-field input:focus, .modal-field select:focus { 
                    border-color: var(--accent); 
                    background: rgba(0, 92, 197, 0.1); 
                    box-shadow: 0 0 0 4px rgba(0, 92, 197, 0.1); 
                }

                .drag-handle { cursor: grab; background: var(--bg-card); padding: 20px; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--border); }
                .drag-handle:active { cursor: grabbing; }
            `}</style>
        </div>
    );
};

export default Customers;
