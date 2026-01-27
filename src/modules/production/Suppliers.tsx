import React, { useState } from 'react';
import { motion, AnimatePresence, useDragControls } from 'framer-motion';
import LocationPicker from '../../components/LocationPicker';
import {
    Truck,
    X,
    ArrowLeft,
    Plus,
    Building,
    Phone,
    Mail,
    Wallet,
    Info,
    GripHorizontal,
    Globe,
    Trash2,
    User,
    LayoutGrid,
    List as ListIcon,
    Search,
    Download,
    Lock
} from 'lucide-react';
import { exportToJSON, exportToExcel, exportToXML, exportToPDF } from '../../utils/exportUtils';
import { useEffect } from 'react';
import { saveToCloud, loadFromCloud, archiveItem } from '../../utils/storageUtils';
import { useConfig } from '../../context/ConfigContext';
import SecurityGate from '../../components/SecurityGate';

interface ContactPerson {
    id: string;
    name: string;
    phone: string;
    title: string;
}

interface Supplier {
    id: string;
    name: string;
    type: string;
    firmName: string;
    cui: string; // Tax ID
    jNo: string; // Reg No
    iban: string;
    bank: string;
    address: string;
    city: string;
    country: string;
    email: string;
    phone: string;
    contacts: ContactPerson[];
}

interface SuppliersProps {
    onBack: () => void;
}

const Suppliers: React.FC<SuppliersProps> = ({ onBack }) => {
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [types] = useState(['Svi', 'Hoteli', 'Hotelske grupe i organizacije', 'Lanac Hotela', 'Brand Hotela', 'Touroperatori', 'Prevoznici']);
    const [selectedType, setSelectedType] = useState<string>('Svi');
    const [showAddForm, setShowAddForm] = useState(false);
    const [showSecurityGate, setShowSecurityGate] = useState(false);

    // New States for View and Search
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [searchQuery, setSearchQuery] = useState('');

    // Permissions and Export Menu State
    const { config } = useConfig();
    const currentLevel = config.userLevels?.current || 5;
    const permissions = config.levelPermissions?.[currentLevel] || { canImport: false, canExport: false };
    const [showExportMenu, setShowExportMenu] = useState(false);

    // Drag controls for the modal
    const dragControls = useDragControls();

    const [formData, setFormData] = useState<Partial<Supplier>>({
        type: 'Hoteli',
        country: 'RS',
        city: 'Beograd',
        contacts: []
    });

    // Helper to generate smart IDs
    const generateID = () => {
        const year = new Date().getFullYear().toString().substr(-2);
        const random = Math.random().toString(36).substr(2, 4).toUpperCase();
        return `SUP-${year}-${random}`;
    };

    // Load data
    useEffect(() => {
        const loadSuppliers = async () => {
            let loadedFromCloudSuccess = false;

            // 1. Try Cloud
            const { success, data } = await loadFromCloud('suppliers');
            if (success && data && Array.isArray(data) && data.length > 0) {
                console.log("Loaded suppliers from Cloud:", data.length);
                setSuppliers(data as Supplier[]);
                loadedFromCloudSuccess = true;
            }

            // 2. Fallback to LocalStorage if Cloud was empty (new sync) or failed
            if (!loadedFromCloudSuccess) {
                try {
                    const saved = localStorage.getItem('olympic_hub_suppliers');
                    if (saved) {
                        const parsed = JSON.parse(saved);
                        if (Array.isArray(parsed)) {
                            console.log("Loaded suppliers from LocalStorage:", parsed.length);
                            setSuppliers(parsed);
                        }
                    }
                } catch (e) {
                    console.error("Failed to parse local suppliers:", e);
                }
            }
        };
        loadSuppliers();
    }, []);

    // Save data
    useEffect(() => {
        if (suppliers.length > 0) {
            localStorage.setItem('olympic_hub_suppliers', JSON.stringify(suppliers));
            saveToCloud('suppliers', suppliers);
        }
    }, [suppliers]);

    const handleSaveSupplier = (e: React.FormEvent) => {
        e.preventDefault();

        if (formData.id) {
            // Update existing
            setSuppliers(suppliers.map(s => s.id === formData.id ? { ...formData } as Supplier : s));
        } else {
            // Create new
            const newSupplier = {
                ...formData,
                id: generateID(),
                type: formData.type || selectedType // Use form type or selected
            } as Supplier;
            setSuppliers([...suppliers, newSupplier]);
        }

        setShowAddForm(false);
        setFormData({ type: 'Hoteli', contacts: [] }); // Reset to default
    };

    const handleDelete = async () => {
        if (formData.id) {
            // Archive before delete
            await archiveItem(
                'Supplier',
                formData.id,
                formData,
                'current.user@example.com', // Replace with real user email from context
                `Obrisan dobavljač "${formData.name}"`
            );

            setSuppliers(suppliers.filter(s => s.id !== formData.id));
            setShowAddForm(false);
            setShowSecurityGate(false);
        }
    };

    const handleEditSupplier = (supplier: Supplier) => {
        setFormData(supplier);
        setShowAddForm(true);
    };

    const handleExport = (format: 'json' | 'excel' | 'xml' | 'pdf') => {
        const dataToExport = suppliers.filter(s => selectedType === 'Svi' || s.type === selectedType);
        if (dataToExport.length === 0) return alert('Nema podataka za export');

        switch (format) {
            case 'json': exportToJSON(dataToExport, `dobavljaci_${selectedType}`); break;
            case 'excel': exportToExcel(dataToExport, `dobavljaci_${selectedType}`); break;
            case 'xml': exportToXML(dataToExport, `dobavljaci_${selectedType}`); break;
            case 'pdf': exportToPDF(dataToExport, `dobavljaci_${selectedType}`, `Lista Dobavljaca - ${selectedType}`); break;
        }
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



    // Filter logic
    const filteredSuppliers = suppliers.filter(s => {
        if (selectedType !== 'Svi' && s.type !== selectedType) return false; // Corrected filter logic
        if (!searchQuery) return true;
        const query = searchQuery.toLowerCase();
        return (
            s.name?.toLowerCase().includes(query) ||
            s.id?.toLowerCase().includes(query) ||
            s.firmName?.toLowerCase().includes(query) ||
            s.city?.toLowerCase().includes(query)
        );
    });

    return (
        <div className="module-container">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <button onClick={onBack} className="btn-icon">
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h2 style={{ fontSize: '24px', fontWeight: '700' }}>Dobavljači</h2>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Baza partnera i ugovora</p>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                    <div style={{ position: 'relative' }}>
                        <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                        <input
                            type="text"
                            placeholder="Pretraga po ID ili nazivu..."
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

                    <button onClick={() => { setFormData({ type: selectedType, contacts: [] }); setShowAddForm(true); }} className="btn-primary">
                        <Plus size={18} /> {formData.id ? 'Izmeni' : 'Dodaj'}
                    </button>
                </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', marginBottom: '32px', overflowX: 'auto', paddingBottom: '8px' }}>
                {types.map(type => (
                    <button
                        key={type}
                        onClick={() => setSelectedType(type)}
                        style={{
                            padding: '10px 20px',
                            borderRadius: '12px',
                            border: '1px solid var(--border)',
                            background: selectedType === type ? 'var(--accent)' : 'var(--bg-card)',
                            color: selectedType === type ? '#fff' : 'var(--text-primary)',
                            cursor: 'pointer',
                            whiteSpace: 'nowrap',
                            fontWeight: '600',
                            transition: 'all 0.2s'
                        }}
                    >
                        {type}
                    </button>
                ))}
            </div>

            <div className="suppliers-list">
                {filteredSuppliers.length === 0 ? (
                    <div style={{ padding: '80px', textAlign: 'center', background: 'var(--bg-card)', borderRadius: '24px', border: '1px solid var(--border)' }}>
                        <Truck size={48} color="var(--text-secondary)" style={{ marginBottom: '16px', opacity: 0.3 }} />
                        <p style={{ color: 'var(--text-secondary)' }}>Nema rezultata.</p>
                    </div>
                ) : (
                    <>
                        {viewMode === 'grid' ? (
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '20px' }}>
                                {filteredSuppliers.map(s => (
                                    <motion.div
                                        key={s.id}
                                        layout
                                        className="app-card"
                                        style={{ padding: '24px', cursor: 'pointer' }}
                                        onClick={() => handleEditSupplier(s)}
                                    >
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px', alignItems: 'flex-start' }}>
                                            <div>
                                                <div style={{ fontSize: '11px', color: 'var(--accent)', fontWeight: '700', marginBottom: '4px' }}>{s.id}</div>
                                                <h3 style={{ fontSize: '18px', fontWeight: '700', margin: 0 }}>{s.name}</h3>
                                            </div>
                                            <span style={{ fontSize: '11px', background: 'rgba(63, 185, 80, 0.1)', color: 'var(--accent)', padding: '4px 8px', borderRadius: '6px' }}>{s.city}</span>
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Building size={14} /> {s.firmName} ({s.cui})</div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Mail size={14} /> {s.email}</div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Phone size={14} /> {s.phone}</div>
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
                                            <th style={{ padding: '16px', textAlign: 'left', fontWeight: '600', color: 'var(--text-secondary)', fontSize: '12px', textTransform: 'uppercase' }}>Naziv / Firma</th>
                                            <th style={{ padding: '16px', textAlign: 'left', fontWeight: '600', color: 'var(--text-secondary)', fontSize: '12px', textTransform: 'uppercase' }}>Grad / Država</th>
                                            <th style={{ padding: '16px', textAlign: 'left', fontWeight: '600', color: 'var(--text-secondary)', fontSize: '12px', textTransform: 'uppercase' }}>PIB / MB</th>
                                            <th style={{ padding: '16px', textAlign: 'left', fontWeight: '600', color: 'var(--text-secondary)', fontSize: '12px', textTransform: 'uppercase' }}>Kontakt</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredSuppliers.map(s => {
                                            const countries: Record<string, string> = { 'RS': 'Srbija', 'ME': 'Crna Gora', 'HR': 'Hrvatska', 'BA': 'Bosna i Hercegovina', 'MK': 'Makedonija', 'SI': 'Slovenija' };
                                            return (
                                                <tr
                                                    key={s.id}
                                                    style={{ borderBottom: '1px solid var(--border)', cursor: 'pointer' }}
                                                    onClick={() => handleEditSupplier(s)}
                                                    className="table-row-hover"
                                                >
                                                    <td style={{ padding: '16px', fontWeight: '700', color: 'var(--accent)', fontFamily: 'monospace' }}>{s.id}</td>
                                                    <td style={{ padding: '16px' }}>
                                                        <div style={{ fontWeight: '600', fontSize: '15px' }}>{s.name}</div>
                                                        <div style={{ color: 'var(--text-secondary)', fontSize: '13px', marginTop: '4px' }}>{s.firmName}</div>
                                                    </td>
                                                    <td style={{ padding: '16px' }}>
                                                        <div style={{ fontWeight: '500' }}>{s.city}</div>
                                                        <div style={{ color: 'var(--text-secondary)', fontSize: '13px', marginTop: '4px' }}>{countries[s.country] || ''} {s.country}</div>
                                                    </td>
                                                    <td style={{ padding: '16px' }}>
                                                        <div style={{ fontFamily: 'monospace', color: 'var(--text-primary)' }}>PIB: {s.cui}</div>
                                                        <div style={{ fontFamily: 'monospace', color: 'var(--text-secondary)', fontSize: '12px', marginTop: '4px' }}>MB: {s.jNo}</div>
                                                    </td>
                                                    <td style={{ padding: '16px', color: 'var(--text-secondary)' }}>
                                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                                            <span style={{ color: 'var(--text-primary)' }}>{s.email}</span>
                                                            <span style={{ fontSize: '12px' }}>{s.phone}</span>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
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
                                        {formData.id ? 'Izmena Dobavljača' : 'Novi Dobavljač'} ({formData.type || selectedType})
                                    </h3>
                                </div>
                                <button onClick={() => setShowAddForm(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                                    <X size={20} />
                                </button>
                            </div>

                            <div style={{ flex: 1, overflowY: 'auto', padding: '0 0 20px 0' }}>
                                <form onSubmit={handleSaveSupplier} style={{ padding: '30px', display: 'flex', flexDirection: 'column', gap: '40px' }}>

                                    {/* SECTION 1: BASIC DETAILS */}
                                    <div className="form-section">
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px', color: 'var(--accent)' }}>
                                            <Info size={20} />
                                            <h4 style={{ margin: 0, textTransform: 'uppercase', letterSpacing: '1px' }}>Osnovni Podaci</h4>
                                        </div>
                                        <div className="form-grid">
                                            <div className="modal-field">
                                                <label>Tip</label>
                                                <select
                                                    value={formData.type}
                                                    onChange={e => setFormData({ ...formData, type: e.target.value })}
                                                    style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', padding: '14px', borderRadius: '12px', color: 'var(--text-primary)' }}
                                                >
                                                    {types.filter(t => t !== 'Svi').map(t => (
                                                        <option key={t} value={t}>{t}</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div className="modal-field">
                                                <label>Naziv</label>
                                                <input required type="text" value={formData.name || ''} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="Naziv partnera" />
                                            </div>
                                            <div className="modal-field">
                                                <label>Naziv Firme</label>
                                                <input type="text" value={formData.firmName || ''} onChange={e => setFormData({ ...formData, firmName: e.target.value })} placeholder="Puni naziv firme" />
                                            </div>
                                            <div className="modal-field">
                                                <label>PIB</label>
                                                <input type="text" value={formData.cui || ''} onChange={e => setFormData({ ...formData, cui: e.target.value })} placeholder="Poreski ID" />
                                            </div>
                                            <div className="modal-field">
                                                <label>Matični Broj</label>
                                                <input type="text" value={formData.jNo || ''} onChange={e => setFormData({ ...formData, jNo: e.target.value })} placeholder="Registarski broj" />
                                            </div>
                                            <div className="modal-field">
                                                <label>Email</label>
                                                <input type="email" value={formData.email || ''} onChange={e => setFormData({ ...formData, email: e.target.value })} placeholder="email@adresa.com" />
                                            </div>
                                            <div className="modal-field">
                                                <label>Telefon</label>
                                                <input type="text" value={formData.phone || ''} onChange={e => setFormData({ ...formData, phone: e.target.value })} placeholder="+381 6..." />
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
                                        </div>
                                    </div>

                                    {/* SECTION 2: LOCATION */}
                                    <div className="form-section">
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px', color: 'var(--accent)' }}>
                                            <Globe size={20} />
                                            <h4 style={{ margin: 0, textTransform: 'uppercase', letterSpacing: '1px' }}>Adresa i Lokacija</h4>
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
                                    </div>

                                    {/* SECTION 3: FINANCE */}
                                    <div className="form-section">
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px', color: 'var(--accent)' }}>
                                            <Wallet size={20} />
                                            <h4 style={{ margin: 0, textTransform: 'uppercase', letterSpacing: '1px' }}>Finansijski Podaci</h4>
                                        </div>
                                        <div className="form-grid">
                                            <div className="modal-field" style={{ gridColumn: 'span 1' }}>
                                                <label>Broj Računa (IBAN)</label>
                                                <input type="text" value={formData.iban || ''} onChange={e => setFormData({ ...formData, iban: e.target.value })} placeholder="RS35..." />
                                            </div>
                                            <div className="modal-field" style={{ gridColumn: 'span 1' }}>
                                                <label>Banka</label>
                                                <input type="text" value={formData.bank || ''} onChange={e => setFormData({ ...formData, bank: e.target.value })} placeholder="Naziv banke" />
                                            </div>
                                        </div>
                                    </div>

                                    <div style={{ paddingTop: '20px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        {formData.id && (
                                            <button
                                                type="button"
                                                onClick={() => setShowSecurityGate(true)}
                                                className="btn-secondary"
                                                style={{ padding: '12px 24px', fontSize: '14px', color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.3)', background: 'rgba(239, 68, 68, 0.05)' }}
                                            >
                                                <Trash2 size={16} style={{ marginRight: '6px' }} /> Obriši
                                            </button>
                                        )}
                                        <div style={{ display: 'flex', gap: '12px', marginLeft: 'auto' }}>
                                            <button type="button" onClick={() => setShowAddForm(false)} className="btn-secondary" style={{ padding: '12px 24px', fontSize: '14px' }}>
                                                Otkaži
                                            </button>
                                            <button
                                                type="submit"
                                                className="btn-primary"
                                                style={{
                                                    padding: '12px 32px',
                                                    fontSize: '14px',
                                                    borderRadius: '12px',
                                                    boxShadow: '0 10px 30px -10px var(--accent)'
                                                }}
                                            >
                                                <Plus size={18} /> Sačuvaj Izmene
                                            </button>
                                        </div>
                                    </div>

                                </form>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {showSecurityGate && (
                    <SecurityGate
                        isOpen={showSecurityGate}
                        onCancel={() => setShowSecurityGate(false)}
                        onConfirm={handleDelete}
                        title="Brisanje Dobavljača"
                        description={`Da li ste sigurni da želite da trajno obrišete dobavljača "${formData.name}"? Ova akcija se ne može opozvati i svi povezani ugovori će biti arhivirani.`}
                        actionType="delete"
                        entityName={formData.name}
                        requireMasterAuth={currentLevel >= 6}
                    />
                )}
            </AnimatePresence>

            <style>{`
                .btn-icon { background: var(--glass-bg); border: 1px solid var(--border); color: var(--text-primary); padding: 8px; borderRadius: 12px; cursor: pointer; display: flex; align-items: center; }
                .btn-primary { background: var(--accent); color: #fff; border: none; padding: 10px 20px; borderRadius: 12px; fontWeight: 600; cursor: pointer; display: flex; align-items: center; gap: 8px; }
                .btn-secondary { background: var(--glass-bg); border: 1px solid var(--border); color: var(--text-primary); padding: 10px 15px; borderRadius: 10px; cursor: pointer; font-size: 12px; font-weight: 600; }
                .export-group { display: flex; background: var(--glass-bg); padding: 4px; borderRadius: 14px; border: 1px solid var(--border); gap: 4px; }
                
                .modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.85); backdrop-filter: blur(8px); display: block; z-index: 1000; }
                .glass-panel { background: #1a1f2e; backdrop-filter: blur(20px); border-radius: 24px; }

                .app-card { background: var(--bg-card); border: 1px solid var(--border); border-radius: 20px; position: relative; overflow: hidden; transition: 0.2s; }
                .app-card:hover { transform: translateY(-4px); box-shadow: 0 10px 30px rgba(0,0,0,0.2); border-color: var(--accent); }

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

                .table-row-hover:hover { background: rgba(255,255,255,0.02); }
            `}</style>
        </div >
    );
};

export default Suppliers;
