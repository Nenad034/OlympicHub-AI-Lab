import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Users, MapPin, Building2, Calendar, ClipboardCheck,
    MessageSquare, Info, ShieldCheck, ShieldAlert,
    ChevronRight, Save, Printer, FileText, Send,
    RefreshCw, Search, Filter, Clock, Bell, Sword,
    Trash2, Plus, Shield
} from 'lucide-react';
import { useAuthStore, useDestRepStore } from '../../stores';
import { getUserReservations, updateReservation, type DatabaseReservation } from '../../services/reservationService';
import './DestinationRep.css';

const DestinationRep: React.FC = () => {
    const { userName, userEmail, userLevel } = useAuthStore();
    const { assignments, addMessage, getDossierMessages, getGeneralMessages, messages, addMessage: postMessage } = useDestRepStore();

    const [activeTab, setActiveTab] = useState<'reservations' | 'chat' | 'rooming' | 'management'>('reservations');
    const [reservations, setReservations] = useState<DatabaseReservation[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [selectedDossier, setSelectedDossier] = useState<DatabaseReservation | null>(null);
    const [noteDraft, setNoteDraft] = useState('');
    const [chatInput, setChatInput] = useState('');
    const [searchQuery, setSearchQuery] = useState('');

    // Management State
    const [newRep, setNewRep] = useState({ email: '', name: '', destinations: '', hotels: '' });
    const { addAssignment, removeAssignment } = useDestRepStore();

    // Load assignments for this specific rep
    const myAssignment = useMemo(() => {
        return assignments.find(a => a.email === userEmail) || { destinations: [], hotels: [] };
    }, [assignments, userEmail]);

    const loadReservations = async () => {
        setIsLoading(true);
        const result = await getUserReservations();
        if (result.success && result.data) {
            // Filter by assigned destinations and hotels
            const filtered = result.data.filter(res => {
                const matchesDest = myAssignment.destinations.some(d => res.destination.includes(d));
                const matchesHotel = myAssignment.hotels.some(h => res.accommodation_name.includes(h));
                return matchesDest || matchesHotel;
            });
            setReservations(filtered);
        }
        setIsLoading(false);
    };

    useEffect(() => {
        loadReservations();
    }, [myAssignment]);

    const handleToggleCheck = async (res: DatabaseReservation) => {
        const isChecking = !res.rep_checked;
        const updates = {
            rep_checked: isChecking,
            rep_checked_at: isChecking ? new Date().toISOString() : undefined,
            rep_checked_by: isChecking ? userName : undefined
        };

        const result = await updateReservation(res.id!, updates);
        if (result.success) {
            setReservations(prev => prev.map(r => r.id === res.id ? { ...r, ...updates } : r));
            if (selectedDossier?.id === res.id) {
                setSelectedDossier({ ...selectedDossier, ...updates } as DatabaseReservation);
            }

            // Auto-post to dossier chat
            postMessage({
                dossierId: res.id,
                sender: 'System',
                senderEmail: 'system@olympic.rs',
                text: `${userName} je ${isChecking ? 'POTVRDIO' : 'PONIŠTIO POTVRDU'} provere rezervacije.`,
                role: 'rep'
            });
        }
    };

    const handleSaveNote = async () => {
        if (!selectedDossier) return;
        const result = await updateReservation(selectedDossier.id!, { rep_internal_note: noteDraft });
        if (result.success) {
            setReservations(prev => prev.map(r => r.id === selectedDossier.id ? { ...r, rep_internal_note: noteDraft } : r));
            setSelectedDossier({ ...selectedDossier, rep_internal_note: noteDraft });
            alert('Napomena sačuvana!');
        }
    };

    const handleSendMessage = async (dossierId?: string) => {
        if (!chatInput.trim()) return;

        await postMessage({
            dossierId,
            sender: userName,
            senderEmail: userEmail || '',
            text: chatInput,
            role: 'rep'
        });

        setChatInput('');
    };

    const filteredList = reservations.filter(r =>
        r.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.cis_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.accommodation_name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const roomingList = useMemo(() => {
        const grouped: Record<string, Record<string, DatabaseReservation[]>> = {};
        reservations.forEach(res => {
            const hotel = res.accommodation_name;
            const date = res.check_in;
            if (!grouped[hotel]) grouped[hotel] = {};
            if (!grouped[hotel][date]) grouped[hotel][date] = [];
            grouped[hotel][date].push(res);
        });
        return grouped;
    }, [reservations]);

    return (
        <div className="rep-module">
            {/* Header */}
            <header className="rep-header">
                <div className="rep-user-info">
                    <div className="rep-avatar">{userName.charAt(0)}</div>
                    <div>
                        <h1>Modul za Predstavnike</h1>
                        <p>{userName} • {myAssignment.destinations.join(', ')}</p>
                    </div>
                </div>
                <div className="rep-nav">
                    <button
                        className={activeTab === 'reservations' ? 'active' : ''}
                        onClick={() => setActiveTab('reservations')}
                    >
                        <ClipboardCheck size={18} /> Rezervacije
                    </button>
                    <button
                        className={activeTab === 'rooming' ? 'active' : ''}
                        onClick={() => setActiveTab('rooming')}
                    >
                        <Calendar size={18} /> Rooming Lista
                    </button>
                    <button
                        className={activeTab === 'chat' ? 'active' : ''}
                        onClick={() => setActiveTab('chat')}
                    >
                        <MessageSquare size={18} /> Opšte Dopisivanje
                    </button>
                    {userLevel >= 6 && (
                        <button
                            className={activeTab === 'management' ? 'active' : ''}
                            onClick={() => setActiveTab('management')}
                            style={{ color: 'var(--accent)', borderLeft: '1px solid var(--border)', paddingLeft: '20px' }}
                        >
                            <Shield size={18} /> Upravljanje (Admin)
                        </button>
                    )}
                </div>
                <div className="rep-actions">
                    <button className="btn-refresh" onClick={loadReservations} disabled={isLoading}>
                        <RefreshCw size={18} className={isLoading ? 'spin' : ''} />
                    </button>
                </div>
            </header>

            <div className="rep-content">
                <AnimatePresence mode="wait">
                    {activeTab === 'reservations' && (
                        <motion.div
                            key="res"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="res-grid"
                        >
                            <div className="res-list-panel">
                                <div className="search-bar">
                                    <Search size={16} />
                                    <input
                                        type="text"
                                        placeholder="Pretraži putnike, hotele, CIS..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                    />
                                </div>
                                <div className="res-items">
                                    {filteredList.map(res => (
                                        <div
                                            key={res.id}
                                            className={`res-item ${selectedDossier?.id === res.id ? 'active' : ''}`}
                                            onClick={() => {
                                                setSelectedDossier(res);
                                                setNoteDraft(res.rep_internal_note || '');
                                            }}
                                        >
                                            <div className="res-item-main">
                                                <span className="res-name">{res.customer_name}</span>
                                                <span className="res-cis">{res.cis_code}</span>
                                            </div>
                                            <div className="res-item-sub">
                                                <span><Building2 size={12} /> {res.accommodation_name}</span>
                                                <span><Calendar size={12} /> {res.check_in}</span>
                                            </div>
                                            <div className="res-item-status">
                                                {res.rep_checked ? (
                                                    <span className="status-badge checked">
                                                        <ShieldCheck size={14} /> Provereno
                                                    </span>
                                                ) : (
                                                    <span className="status-badge unchecked">
                                                        <ShieldAlert size={14} /> Nije provereno
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                    {filteredList.length === 0 && (
                                        <div className="empty-state">Nema pronađenih rezervacija.</div>
                                    )}
                                </div>
                            </div>

                            <div className="res-detail-panel">
                                {selectedDossier ? (
                                    <div className="detail-view">
                                        <div className="detail-header">
                                            <h2>Detalji Rezervacije: {selectedDossier.customer_name}</h2>
                                            <div className="rep-check-actions">
                                                <button
                                                    className={`btn-check ${selectedDossier.rep_checked ? 'checked' : ''}`}
                                                    onClick={() => handleToggleCheck(selectedDossier)}
                                                >
                                                    {selectedDossier.rep_checked ? <ShieldCheck size={18} /> : <ShieldAlert size={18} />}
                                                    {selectedDossier.rep_checked ? 'Poništi Proveru' : 'Označi kao Provereno'}
                                                </button>
                                            </div>
                                        </div>

                                        <div className="detail-info-grid">
                                            <div className="info-card">
                                                <h3><Info size={16} /> Osnovni podaci</h3>
                                                <p><strong>CIS:</strong> {selectedDossier.cis_code}</p>
                                                <p><strong>Status:</strong> {selectedDossier.status}</p>
                                                <p><strong>Destinacija:</strong> {selectedDossier.destination}</p>
                                                <p><strong>Hotel:</strong> {selectedDossier.accommodation_name}</p>
                                            </div>
                                            <div className="info-card">
                                                <h3><Clock size={16} /> Period boravka</h3>
                                                <p><strong>Check-in:</strong> {selectedDossier.check_in}</p>
                                                <p><strong>Check-out:</strong> {selectedDossier.check_out}</p>
                                                <p><strong>Noćenja:</strong> {selectedDossier.nights}</p>
                                                <p><strong>Putnika:</strong> {selectedDossier.pax_count}</p>
                                            </div>
                                        </div>

                                        {/* Internal Note */}
                                        <div className="note-section">
                                            <h3>Interna Napomena Predstavnika</h3>
                                            <textarea
                                                placeholder="Unesite važne napomene o ovoj rezervaciji..."
                                                value={noteDraft}
                                                onChange={(e) => setNoteDraft(e.target.value)}
                                            />
                                            <button className="btn-save" onClick={handleSaveNote}>
                                                <Save size={16} /> Sačuvaj Napomenu
                                            </button>
                                        </div>

                                        {/* Dossier Chat */}
                                        <div className="dossier-chat-section">
                                            <h3>Korespodencija (Dossier Chat)</h3>
                                            <div className="chat-messages">
                                                {messages.filter(m => m.dossierId === selectedDossier.id).map(m => (
                                                    <div key={m.id} className={`chat-bubble ${m.role === 'rep' ? 'mine' : 'theirs'}`}>
                                                        <div className="msg-header">
                                                            <span className="sender">{m.sender}</span>
                                                            <span className="time">{new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                        </div>
                                                        <div className="msg-text">{m.text}</div>
                                                    </div>
                                                ))}
                                                {messages.filter(m => m.dossierId === selectedDossier.id).length === 0 && (
                                                    <div className="no-chat">Još nema poruka za ovu rezervaciju.</div>
                                                )}
                                            </div>
                                            <div className="chat-input-area">
                                                <input
                                                    type="text"
                                                    placeholder="Pišite agenciji o ovoj rezervaciji..."
                                                    value={chatInput}
                                                    onChange={(e) => setChatInput(e.target.value)}
                                                    onKeyDown={(e) => e.key === 'Enter' && handleSendMessage(selectedDossier.id)}
                                                />
                                                <button onClick={() => handleSendMessage(selectedDossier.id)}><Send size={18} /></button>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="no-selection">
                                        <ClipboardCheck size={48} />
                                        <p>Izaberite rezervaciju iz liste za detaljan pregled.</p>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    )}

                    {activeTab === 'rooming' && (
                        <motion.div
                            key="rooming"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="rooming-list-view"
                        >
                            <div className="rooming-header">
                                <h2>Pregled Rooming Liste</h2>
                                <div className="rooming-export-actions">
                                    <button onClick={() => window.print()} className="btn-print"><Printer size={18} /> Štampaj</button>
                                    <button className="btn-export"><FileText size={18} /> Export Excel</button>
                                </div>
                            </div>

                            <div className="rooming-tables">
                                {Object.entries(roomingList).map(([hotel, dates]) => (
                                    <div key={hotel} className="hotel-group">
                                        <h3 className="hotel-title"><Building2 size={20} /> {hotel}</h3>
                                        {Object.entries(dates).map(([date, resList]) => (
                                            <div key={date} className="date-group">
                                                <h4 className="date-title">Datum dolaska: {date}</h4>
                                                <table className="rooming-table">
                                                    <thead>
                                                        <tr>
                                                            <th>Putnik / Nosilac</th>
                                                            <th>CIS Code</th>
                                                            <th>Pax</th>
                                                            <th>Check-out</th>
                                                            <th>Nights</th>
                                                            <th>Status</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {resList.map(r => (
                                                            <tr key={r.id}>
                                                                <td><strong>{r.customer_name}</strong></td>
                                                                <td>{r.cis_code}</td>
                                                                <td>{r.pax_count} pax</td>
                                                                <td>{r.check_out}</td>
                                                                <td>{r.nights}</td>
                                                                <td>
                                                                    <span className={`table-status ${r.rep_checked ? 'done' : 'pending'}`}>
                                                                        {r.rep_checked ? 'Provereno' : 'Nije provereno'}
                                                                    </span>
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        ))}
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    )}

                    {activeTab === 'chat' && (
                        <motion.div
                            key="chat"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="general-chat-view"
                        >
                            <div className="chat-container">
                                <div className="chat-header">
                                    <h2>Opšte dopisivanje sa agencijom</h2>
                                    <p>Koristite ovaj chat za opšta pitanja koja nisu vezana za specifičnu rezervaciju.</p>
                                </div>
                                <div className="chat-messages-area">
                                    {messages.filter(m => !m.dossierId).map(m => (
                                        <div key={m.id} className={`chat-bubble ${m.role === 'rep' ? 'mine' : 'theirs'}`}>
                                            <div className="msg-header">
                                                <span className="sender">{m.sender}</span>
                                                <span className="time">{new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                            </div>
                                            <div className="msg-text">{m.text}</div>
                                        </div>
                                    ))}
                                </div>
                                <div className="chat-input-bar">
                                    <input
                                        type="text"
                                        placeholder="Unesite poruku..."
                                        value={chatInput}
                                        onChange={(e) => setChatInput(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                                    />
                                    <button onClick={() => handleSendMessage()}><Send size={18} /></button>
                                </div>
                            </div>
                        </motion.div>
                    )}
                    {activeTab === 'management' && (
                        <motion.div
                            key="management"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="rep-management-view"
                        >
                            <div className="management-container">
                                <div className="management-header">
                                    <h2 style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <Users size={24} color="var(--accent)" /> Definisanje Predstavnika i Destinacija
                                    </h2>
                                    <p>Dodajte nove predstavnike i dodelite im destinacije ili specifične hotele koje pokrivaju.</p>
                                </div>

                                <div className="management-grid">
                                    {/* Form Part */}
                                    <div className="add-rep-form">
                                        <h3>Dodaј novog predstavnika</h3>
                                        <div className="form-group">
                                            <label>Email predstavnika (mora odgovarati emailu naloga)</label>
                                            <input
                                                type="email"
                                                placeholder="npr. petar.rep@olympic.rs"
                                                value={newRep.email}
                                                onChange={e => setNewRep({ ...newRep, email: e.target.value })}
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label>Puna Destinacija (npr. Grčka, Tasos)</label>
                                            <input
                                                type="text"
                                                placeholder="npr. Hurgada, Egipat"
                                                value={newRep.destinations}
                                                onChange={e => setNewRep({ ...newRep, destinations: e.target.value })}
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label>Specifični Hoteli (opciono, razdvojite zarezom)</label>
                                            <input
                                                type="text"
                                                placeholder="npr. Hotel Splendid, Jaz Aquamarine"
                                                value={newRep.hotels}
                                                onChange={e => setNewRep({ ...newRep, hotels: e.target.value })}
                                            />
                                        </div>
                                        <button
                                            className="btn-add-rep"
                                            onClick={() => {
                                                if (!newRep.email) return alert('Email je obavezan');
                                                addAssignment({
                                                    email: newRep.email,
                                                    destinations: newRep.destinations.split(',').map(d => d.trim()).filter(d => d),
                                                    hotels: newRep.hotels.split(',').map(h => h.trim()).filter(h => h)
                                                });
                                                setNewRep({ email: '', name: '', destinations: '', hotels: '' });
                                                alert('Predstavnik uspesno dodat');
                                            }}
                                        >
                                            <Plus size={18} /> Aktiviraj Predstavnika
                                        </button>
                                    </div>

                                    {/* List Part */}
                                    <div className="active-reps-list">
                                        <h3>Aktivni Predstavnici ({assignments.length})</h3>
                                        <div className="reps-table-wrapper">
                                            <table className="reps-table">
                                                <thead>
                                                    <tr>
                                                        <th>Email</th>
                                                        <th>Pokriva Destinacije</th>
                                                        <th>Hoteli</th>
                                                        <th>Akcije</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {assignments.map((a, idx) => (
                                                        <tr key={idx}>
                                                            <td><strong>{a.email}</strong></td>
                                                            <td>
                                                                {a.destinations.map(d => (
                                                                    <span key={d} className="tag dest">{d}</span>
                                                                ))}
                                                            </td>
                                                            <td>
                                                                {a.hotels.map(h => (
                                                                    <span key={h} className="tag hotel">{h}</span>
                                                                ))}
                                                                {a.hotels.length === 0 && <span style={{ opacity: 0.5 }}>Svi hoteli na destinaciji</span>}
                                                            </td>
                                                            <td>
                                                                <button
                                                                    className="btn-icon-delete"
                                                                    onClick={() => {
                                                                        if (window.confirm(`Da li ste sigurni da želite da uklonite predstavnika ${a.email}?`)) {
                                                                            removeAssignment(a.email);
                                                                        }
                                                                    }}
                                                                >
                                                                    <Trash2 size={16} />
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default DestinationRep;
