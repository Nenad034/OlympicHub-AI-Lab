import React, { useState, useEffect } from 'react';
import {
    Users, Search, Plus, Filter, Download, MoreHorizontal, Mail, Phone, MapPin, Building2, User, Briefcase,
    Truck, CheckCircle2, AlertTriangle, Shield, Zap, Sparkles,
    Trash2, Edit3, Eye, Calendar, Globe, Tag, ArrowRight, X,
    LayoutGrid, List as ListIcon, MessageSquare
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { contactService } from '../services/contactService';
import type { Contact } from '../services/contactService';
import { useAppStore } from '../stores';
import './ContactArchitect.css';

const ContactArchitect: React.FC = () => {
    const [contacts, setContacts] = useState<Contact[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeType, setActiveType] = useState<'All' | 'Individual' | 'Legal' | 'Supplier' | 'Subagent'>('All');
    const [searchQuery, setSearchQuery] = useState('');
    const [showAddModal, setShowAddModal] = useState(false);
    const [editingContact, setEditingContact] = useState<Partial<Contact> | null>(null);
    const [aiInsightOpen, setAiInsightOpen] = useState(false);
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [showLabelModal, setShowLabelModal] = useState(false);
    const [newTag, setNewTag] = useState('');
    const { setChatOpen, setChatContext } = useAppStore();
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        fetchContacts();
    }, []);

    useEffect(() => {
        if (location.state?.editContactId && contacts.length > 0) {
            const contactToEdit = contacts.find(c => c.id === location.state.editContactId);
            if (contactToEdit) {
                setEditingContact(contactToEdit);
                setShowAddModal(true);
                // Clear state to avoid reopening on refresh
                navigate(location.pathname, { replace: true, state: {} });
            }
        }
    }, [location.state, contacts]);

    const COUNTRIES = [
        'Srbija', 'Crna Gora', 'Bosna i Hercegovina', 'Hrvatska', 'Severna Makedonija',
        'Grčka', 'Slovenija', 'Bugarska', 'Mađarska', 'Rumunija', 'Turska', 'Austrija',
        'Nemačka', 'Italija', 'Švajcarska', 'Francuska', 'Ostalo'
    ];

    const LANGUAGES = [
        { code: 'sr', name: 'Srpski' },
        { code: 'en', name: 'Engleski' },
        { code: 'ru', name: 'Ruski' },
        { code: 'it', name: 'Italijanski' },
        { code: 'de', name: 'Nemački' },
        { code: 'fr', name: 'Francuski' },
        { code: 'es', name: 'Španski' }
    ];

    useEffect(() => {
        fetchContacts();
    }, []);

    const fetchContacts = async () => {
        setLoading(true);
        const data = await contactService.getAll();
        setContacts(data);
        setLoading(false);
    };

    const toggleSelection = (id: string) => {
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const handleBulkLabel = async () => {
        if (!newTag || selectedIds.length === 0) return;

        const updatedContacts = contacts.map(c => {
            if (selectedIds.includes(c.id)) {
                const currentTags = c.tags || [];
                return { ...c, tags: Array.from(new Set([...currentTags, newTag.trim()])) };
            }
            return c;
        });

        // Simplified: Update local state and save to service
        setContacts(updatedContacts);

        // In real scenario, we would call a bulk update in contactService
        for (const id of selectedIds) {
            const contact = updatedContacts.find(c => c.id === id);
            if (contact) await contactService.save(contact);
        }

        setSelectedIds([]);
        setNewTag('');
        setShowLabelModal(false);
        alert(`Dodat label #${newTag} za ${selectedIds.length} kontakata.`);
    };

    const filteredContacts = contacts.filter(c => {
        const matchesType = activeType === 'All' || c.type === activeType;
        const searchLower = searchQuery.toLowerCase();
        const matchesSearch =
            c.fullName?.toLowerCase().includes(searchLower) ||
            c.email?.toLowerCase().includes(searchLower) ||
            c.phone?.includes(searchQuery) ||
            c.firmName?.toLowerCase().includes(searchLower) ||
            c.pib?.includes(searchQuery);
        return matchesType && matchesSearch;
    });

    const handleOpenContactChat = (contact: Contact) => {
        setChatContext({
            type: 'contact',
            contactId: contact.id,
            contactEmail: contact.email,
            contactName: contact.fullName || contact.firmName,
            contactLanguage: contact.preferredLanguage || 'sr'
        });
        setChatOpen(true);
    };

    const handleViewProfile = (contact: Contact) => {
        if (contact.type === 'Individual' || contact.type === 'Legal') {
            navigate(`/customers/${contact.id}`);
        } else if (contact.type === 'Supplier') {
            navigate(`/suppliers/${contact.id}`);
        } else if (contact.type === 'Subagent') {
            navigate(`/subagent-admin`);
        }
    };

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'Individual': return <User size={16} />;
            case 'Legal': return <Building2 size={16} />;
            case 'Supplier': return <Truck size={16} />;
            case 'Subagent': return <Briefcase size={16} />;
            default: return <Users size={16} />;
        }
    };

    const getTypeLabel = (type: string) => {
        switch (type) {
            case 'Individual': return 'Putnik / Fizičko Lice';
            case 'Legal': return 'Pravno Lice';
            case 'Supplier': return 'Dobavljač';
            case 'Subagent': return 'Subagent';
            default: return type;
        }
    };

    return (
        <div className="contact-architect-container fade-in">
            {/* --- HEADER --- */}
            <div className="contact-header">
                <div className="title-wrapper">
                    <div className="icon-hub">
                        <Users size={32} />
                        <div className="pulse-dots"></div>
                    </div>
                    <div>
                        <h1>Master Contact Hub</h1>
                        <p>Centralna inteligencija svih kontakata, partnera i putnika</p>
                    </div>
                </div>
                <div className="header-actions">
                    <div className="ai-search-box">
                        <Sparkles size={18} className="ai-spark" />
                        <input
                            type="text"
                            placeholder="Pitajte AI: 'Pronađi sve VIP klijente iz Niša'..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        <button className="ai-voice-btn"><Zap size={14} /></button>
                    </div>
                    <button className="btn-add-primary" onClick={() => setShowAddModal(true)}>
                        <Plus size={18} /> Dodaj kontakt
                    </button>
                </div>
            </div>

            {/* --- QUICK STATS --- */}
            <div className="stats-strip">
                <div className="stat-pill">
                    <span className="label">Ukupno</span>
                    <span className="value">{contacts.length}</span>
                </div>
                <div className="stat-pill">
                    <span className="label">Aktivni Putnici</span>
                    <span className="value">{contacts.filter(c => c.type === 'Individual').length}</span>
                </div>
                <div className="stat-pill">
                    <span className="label">Partneri (B2B)</span>
                    <span className="value">{contacts.filter(c => c.type === 'Subagent').length}</span>
                </div>
                <div className="stat-pill success">
                    <span className="label">Novi (24h)</span>
                    <span className="value">+12</span>
                </div>
            </div>

            {/* --- FILTERS SIDEBAR + LIST --- */}
            <div className="hub-layout">
                <div className="sidebar-filters">
                    <h3>Kategorije</h3>
                    <div className="filter-list">
                        <button className={activeType === 'All' ? 'active' : ''} onClick={() => setActiveType('All')}>
                            <Users size={18} /> Svi Kontakti
                        </button>
                        <button className={activeType === 'Individual' ? 'active' : ''} onClick={() => setActiveType('Individual')}>
                            <User size={18} /> Putnici
                        </button>
                        <button className={activeType === 'Legal' ? 'active' : ''} onClick={() => setActiveType('Legal')}>
                            <Building2 size={18} /> Pravna Lica
                        </button>
                        <button className={activeType === 'Supplier' ? 'active' : ''} onClick={() => setActiveType('Supplier')}>
                            <Truck size={18} /> Dobavljači
                        </button>
                        <button className={activeType === 'Subagent' ? 'active' : ''} onClick={() => setActiveType('Subagent')}>
                            <Briefcase size={18} /> Subagenti
                        </button>
                    </div>

                    <div className="ai-insight-card">
                        <div className="ai-badge"><Sparkles size={12} /> AI INSIGHT</div>
                        <p>Imate 5 putnika kojima ističe pasoš u narednih 30 dana.</p>
                        <button onClick={() => setAiInsightOpen(true)}>Vidi Akcije</button>
                    </div>
                </div>

                <div className="main-content-list">
                    <div className="list-toolbar">
                        <div className="selection-info">Odabrano: {filteredContacts.length} kontakata</div>
                        <div className="toolbar-btns">
                            {selectedIds.length > 0 && (
                                <motion.div
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    style={{ display: 'flex', gap: '8px' }}
                                >
                                    <button
                                        onClick={() => setShowLabelModal(true)}
                                        style={{ background: 'var(--accent)', color: 'white' }}
                                    >
                                        <Tag size={16} /> Dodaj Label ({selectedIds.length})
                                    </button>
                                    <button onClick={() => setSelectedIds([])} className="btn-glass">Poništi</button>
                                </motion.div>
                            )}
                            <div className="view-switcher">
                                <button
                                    className={viewMode === 'grid' ? 'active' : ''}
                                    onClick={() => setViewMode('grid')}
                                    title="Grid View"
                                >
                                    <LayoutGrid size={16} />
                                </button>
                                <button
                                    className={viewMode === 'list' ? 'active' : ''}
                                    onClick={() => setViewMode('list')}
                                    title="List View"
                                >
                                    <ListIcon size={16} />
                                </button>
                            </div>
                            <button><Download size={16} /> Export</button>
                            <button><Tag size={16} /> Label</button>
                            <button><Filter size={16} /> Napredno</button>
                        </div>
                    </div>

                    {loading ? (
                        <div className="loading-state">Učitavanje inteligencije kontakata...</div>
                    ) : viewMode === 'grid' ? (
                        <div className="contact-results-grid">
                            {filteredContacts.map(contact => (
                                <motion.div
                                    key={contact.id}
                                    className={`contact-card ${contact.type.toLowerCase()} ${selectedIds.includes(contact.id) ? 'selected' : ''}`}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    whileHover={{ scale: 1.02, translateY: -5 }}
                                    onClick={() => toggleSelection(contact.id)}
                                >
                                    <div className="selection-checkbox">
                                        <div className={`checkbox-box ${selectedIds.includes(contact.id) ? 'checked' : ''}`}>
                                            {selectedIds.includes(contact.id) && <CheckCircle2 size={12} />}
                                        </div>
                                    </div>
                                    <div className="card-top">
                                        <div className="avatar-wrapper">
                                            <div className="avatar-circle">
                                                {contact.type === 'Legal' ? <Building2 size={24} /> : (contact.firstName?.charAt(0) || 'U')}
                                            </div>
                                            <div className={`status-dot active`}></div>
                                        </div>
                                        <div className="type-tag">
                                            {getTypeIcon(contact.type)} {contact.type}
                                        </div>
                                        <button
                                            className="btn-more"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                // More actions menu could be here
                                            }}
                                        >
                                            <MoreHorizontal size={18} />
                                        </button>
                                    </div>

                                    <div className="card-body">
                                        <h3>{contact.fullName || contact.firmName}</h3>
                                        <div className="info-row">
                                            <Mail size={14} /> <span>{contact.email}</span>
                                        </div>
                                        {contact.financeEmail && (
                                            <div className="info-row finance">
                                                <Shield size={14} /> <span>{contact.financeEmail} (Finansije)</span>
                                            </div>
                                        )}
                                        <div className="info-row">
                                            <Phone size={14} /> <span>{contact.phone}</span>
                                        </div>
                                        {contact.city && (
                                            <div className="info-row">
                                                <MapPin size={14} /> <span>{contact.city}, {contact.country}</span>
                                            </div>
                                        )}
                                    </div>

                                    <div className="tag-strip">
                                        {contact.tags?.map(tag => (
                                            <span key={tag} className="tag-item">#{tag}</span>
                                        ))}
                                    </div>

                                    <div className="card-footer">
                                        <button
                                            className="btn-view"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleViewProfile(contact);
                                            }}
                                        >
                                            Profil <ArrowRight size={14} />
                                        </button>
                                        <div className="activity-stamp">Aktivan pre 2h</div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    ) : (
                        <div className="contact-results-list">
                            <table className="contacts-table">
                                <thead>
                                    <tr>
                                        <th style={{ width: '40px' }}>
                                            <div
                                                className={`checkbox-box ${selectedIds.length === filteredContacts.length ? 'checked' : ''}`}
                                                onClick={() => {
                                                    if (selectedIds.length === filteredContacts.length) setSelectedIds([]);
                                                    else setSelectedIds(filteredContacts.map(c => c.id));
                                                }}
                                            >
                                                {selectedIds.length === filteredContacts.length && selectedIds.length > 0 && <CheckCircle2 size={12} />}
                                            </div>
                                        </th>
                                        <th>Kontakt</th>
                                        <th>Tip</th>
                                        <th>Email</th>
                                        <th>Telefon</th>
                                        <th>Lokacija</th>
                                        <th>Jezik</th>
                                        <th>Status</th>
                                        <th>Akcije</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredContacts.map(contact => (
                                        <motion.tr
                                            key={contact.id}
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            className={selectedIds.includes(contact.id) ? 'selected-row' : ''}
                                            onClick={() => toggleSelection(contact.id)}
                                            style={{ cursor: 'pointer' }}
                                        >
                                            <td>
                                                <div className={`checkbox-box ${selectedIds.includes(contact.id) ? 'checked' : ''}`}>
                                                    {selectedIds.includes(contact.id) && <CheckCircle2 size={12} />}
                                                </div>
                                            </td>
                                            <td>
                                                <div className="table-contact-info">
                                                    <div className="table-avatar">
                                                        {contact.type === 'Legal' ? <Building2 size={14} /> : (contact.firstName?.charAt(0) || 'U')}
                                                    </div>
                                                    <div className="name-wrapper">
                                                        <span className="main-name">{contact.fullName || contact.firmName}</span>
                                                        <span className="sub-name">{contact.pib ? `PIB: ${contact.pib}` : 'Individualni klijent'}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td>
                                                <span className={`type-pill ${contact.type.toLowerCase()}`}>
                                                    {getTypeIcon(contact.type)}
                                                    {contact.type}
                                                </span>
                                            </td>
                                            <td>
                                                <div className="email-stack">
                                                    <span>{contact.email}</span>
                                                    {contact.financeEmail && <span className="finance-sub">{contact.financeEmail} (Fin)</span>}
                                                </div>
                                            </td>
                                            <td>{contact.phone}</td>
                                            <td>{contact.city ? `${contact.city}, ${contact.country}` : 'N/A'}</td>
                                            <td>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', textTransform: 'uppercase', fontSize: '12px', fontWeight: 600 }}>
                                                    <Sparkles size={10} color="#FFD700" /> {contact.preferredLanguage || 'sr'}
                                                </div>
                                            </td>
                                            <td><span className="status-badge active">Aktivan</span></td>
                                            <td>
                                                <div className="table-actions">
                                                    <button
                                                        className="btn-table-action"
                                                        title="Chat with AI"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleOpenContactChat(contact);
                                                        }}
                                                    >
                                                        <MessageSquare size={16} />
                                                    </button>
                                                    <button
                                                        className="btn-table-action"
                                                        title="View Profile"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleViewProfile(contact);
                                                        }}
                                                    >
                                                        <Eye size={16} />
                                                    </button>
                                                    <button
                                                        className="btn-table-action"
                                                        title="Edit"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setEditingContact(contact);
                                                            setShowAddModal(true);
                                                        }}
                                                    >
                                                        <Edit3 size={16} />
                                                    </button>
                                                    <button
                                                        className="btn-table-action delete"
                                                        title="Delete"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            // Delete logic here
                                                        }}
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        </motion.tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {/* AI MODAL OVERLAY (Placeholder) */}
            <AnimatePresence>
                {aiInsightOpen && (
                    <div className="ai-overlay" onClick={() => setAiInsightOpen(false)}>
                        <motion.div
                            className="ai-modal"
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="ai-modal-header">
                                <Sparkles size={24} color="#FFD700" />
                                <h2>AI Menadžer Kontakata</h2>
                                <button onClick={() => setAiInsightOpen(false)}><X size={20} /></button>
                            </div>
                            <div className="ai-content">
                                <p>Na osnovu analize pasuša, identifikovao sam kritične stavke za sledeće klijente:</p>
                                <div className="insight-list">
                                    <div className="insight-item">
                                        <AlertTriangle size={16} color="#ef4444" />
                                        <span>MARKO MARKOVIĆ - Pasoš ističe 15.03.2025 (Ima zakazan put 20.03.2025)</span>
                                    </div>
                                </div>
                                <button className="ai-execute-btn">Pošalji podsetnik svima (Email/SMS)</button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* LABEL MODAL */}
            <AnimatePresence>
                {showLabelModal && (
                    <div className="ai-overlay" onClick={() => setShowLabelModal(false)}>
                        <motion.div
                            className="label-bulk-modal"
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            onClick={e => e.stopPropagation()}
                        >
                            <h3>Dodaj Label za {selectedIds.length} kontakata</h3>
                            <p>Unesite naziv labela (tag-a) koji želite da dodelite selektovanim stavkama.</p>

                            <div className="label-input-wrapper">
                                <Tag size={18} />
                                <input
                                    type="text"
                                    placeholder="Npr: VIP, Ski, Sajam2025..."
                                    value={newTag}
                                    onChange={(e) => setNewTag(e.target.value)}
                                    autoFocus
                                    onKeyDown={(e) => e.key === 'Enter' && handleBulkLabel()}
                                />
                            </div>

                            <div className="common-labels">
                                <span onClick={() => setNewTag('VIP')}>#VIP</span>
                                <span onClick={() => setNewTag('Subagent')}>#Subagent</span>
                                <span onClick={() => setNewTag('Potencijalni')}>#Potencijalni</span>
                                <span onClick={() => setNewTag('Crna Lista')}>#CrnaLista</span>
                            </div>

                            <div className="modal-actions">
                                <button className="btn-cancel" onClick={() => setShowLabelModal(false)}>Odustani</button>
                                <button className="btn-apply" onClick={handleBulkLabel}>Primeni Label</button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* ADD/EDIT CONTACT MODAL */}
            <AnimatePresence>
                {showAddModal && (
                    <div className="ai-overlay" onClick={() => { setShowAddModal(false); setEditingContact(null); }}>
                        <motion.div
                            className="contact-form-modal"
                            initial={{ y: 50, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: 50, opacity: 0 }}
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="form-header">
                                <h2>{editingContact?.id ? 'Uredi Kontakt' : 'Novi Kontakt'}</h2>
                                <button className="btn-close" onClick={() => { setShowAddModal(false); setEditingContact(null); }}><X size={20} /></button>
                            </div>

                            <div className="form-body">
                                <div className="form-section">
                                    <label>Tip Kontakta</label>
                                    <div className="type-selector">
                                        {(['Individual', 'Legal', 'Supplier', 'Subagent'] as const).map(t => (
                                            <button
                                                key={t}
                                                className={(editingContact?.type || 'Individual') === t ? 'active' : ''}
                                                onClick={() => setEditingContact({ ...editingContact, type: t })}
                                            >
                                                {getTypeIcon(t)} {t}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="form-grid">
                                    {(editingContact?.type || 'Individual') === 'Individual' ? (
                                        <>
                                            <div className="form-group">
                                                <label>Ime</label>
                                                <input
                                                    type="text"
                                                    value={editingContact?.firstName || ''}
                                                    onChange={e => setEditingContact({ ...editingContact, firstName: e.target.value })}
                                                    placeholder="Npr: Marko"
                                                />
                                            </div>
                                            <div className="form-group">
                                                <label>Prezime</label>
                                                <input
                                                    type="text"
                                                    value={editingContact?.lastName || ''}
                                                    onChange={e => setEditingContact({ ...editingContact, lastName: e.target.value })}
                                                    placeholder="Npr: Marković"
                                                />
                                            </div>
                                        </>
                                    ) : (
                                        <div className="form-group full">
                                            <label>Naziv Firme / Agencije</label>
                                            <input
                                                type="text"
                                                value={editingContact?.firmName || ''}
                                                onChange={e => setEditingContact({ ...editingContact, firmName: e.target.value })}
                                                placeholder="Npr: Olympic Travel DOO"
                                            />
                                        </div>
                                    )}

                                    <div className="form-group">
                                        <label>Email Adresa (Opšta)</label>
                                        <input
                                            type="email"
                                            value={editingContact?.email || ''}
                                            onChange={e => setEditingContact({ ...editingContact, email: e.target.value })}
                                            placeholder="adresa@mail.com"
                                        />
                                    </div>
                                    {(editingContact?.type !== 'Individual') && (
                                        <div className="form-group">
                                            <label>Email za Finansije</label>
                                            <input
                                                type="email"
                                                value={editingContact?.financeEmail || ''}
                                                onChange={e => setEditingContact({ ...editingContact, financeEmail: e.target.value })}
                                                placeholder="finansije@mail.com"
                                            />
                                        </div>
                                    )}
                                    <div className="form-group">
                                        <label>Telefon</label>
                                        <input
                                            type="text"
                                            value={editingContact?.phone || ''}
                                            onChange={e => setEditingContact({ ...editingContact, phone: e.target.value })}
                                            placeholder="+381..."
                                        />
                                    </div>

                                    {((editingContact?.type || 'Individual') === 'Legal' || (editingContact?.type || 'Individual') === 'Subagent') && (
                                        <>
                                            <div className="form-group">
                                                <label>PIB</label>
                                                <input
                                                    type="text"
                                                    value={editingContact?.pib || ''}
                                                    onChange={e => setEditingContact({ ...editingContact, pib: e.target.value })}
                                                    placeholder="10xxxxxxx"
                                                />
                                            </div>
                                            <div className="form-group">
                                                <label>Matični Broj</label>
                                                <input
                                                    type="text"
                                                    value={editingContact?.mb || ''}
                                                    onChange={e => setEditingContact({ ...editingContact, mb: e.target.value })}
                                                    placeholder="0xxxxxxx"
                                                />
                                            </div>
                                        </>
                                    )}

                                    <div className="form-group">
                                        <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            <Sparkles size={12} color="#FFD700" /> Primarni Jezik (AI & Chat)
                                        </label>
                                        <select
                                            value={editingContact?.preferredLanguage || 'sr'}
                                            onChange={e => setEditingContact({ ...editingContact, preferredLanguage: e.target.value })}
                                            className="country-select"
                                        >
                                            {LANGUAGES.map(lang => (
                                                <option key={lang.code} value={lang.code}>{lang.name}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="form-group full">
                                        <label>Adresa i Lokacija</label>
                                        <div className="location-inputs">
                                            <input
                                                type="text"
                                                value={editingContact?.address || ''}
                                                onChange={e => setEditingContact({ ...editingContact, address: e.target.value })}
                                                placeholder="Ulica i broj"
                                            />
                                            <input
                                                type="text"
                                                value={editingContact?.city || ''}
                                                onChange={e => setEditingContact({ ...editingContact, city: e.target.value })}
                                                placeholder="Grad"
                                            />
                                            <select
                                                value={editingContact?.country || 'Srbija'}
                                                onChange={e => setEditingContact({ ...editingContact, country: e.target.value })}
                                                className="country-select"
                                            >
                                                <option value="" disabled>Odaberite Državu</option>
                                                {COUNTRIES.map(c => (
                                                    <option key={c} value={c}>{c}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                <div className="form-group full">
                                    <label>Napomene (Interne)</label>
                                    <textarea
                                        value={editingContact?.notes || ''}
                                        onChange={e => setEditingContact({ ...editingContact, notes: e.target.value })}
                                        placeholder="Dodatni detalji o kontaktu..."
                                    />
                                </div>
                            </div>

                            <div className="form-footer">
                                <button className="btn-cancel" onClick={() => { setShowAddModal(false); setEditingContact(null); }}>Poništi</button>
                                <button className="btn-save-primary" onClick={async () => {
                                    const finalContact = {
                                        ...editingContact,
                                        id: editingContact?.id || `C-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
                                        fullName: editingContact?.type === 'Individual'
                                            ? `${editingContact.firstName || ''} ${editingContact.lastName || ''}`.trim()
                                            : editingContact?.firmName,
                                        createdAt: editingContact?.createdAt || new Date().toISOString(),
                                        lastActivity: new Date().toISOString()
                                    };

                                    await contactService.save(finalContact as Contact);
                                    await fetchContacts();
                                    setShowAddModal(false);
                                    setEditingContact(null);
                                    alert('Kontakt uspešno sačuvan!');
                                }}>
                                    Sačuvaj Kontakt
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default ContactArchitect;
