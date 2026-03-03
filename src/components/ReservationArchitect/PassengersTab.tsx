import React, { useState } from 'react';
import {
    Users, FileText, UserPlus, Copy, Mail, Printer, Share2, Plus,
    Trash2, Search, ArrowRightLeft, Save, MapPin, Phone, Globe,
    ChevronDown, ChevronUp, CheckCircle, Smartphone
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Dossier, Passenger } from '../../types/reservationArchitect';
import { NATIONALITIES } from '../../constants/nationalities';

interface PassengersTabProps {
    dossier: Dossier;
    setDossier: React.Dispatch<React.SetStateAction<Dossier>>;
    addLog: (action: string, details: string, type?: 'info' | 'success' | 'warning' | 'danger') => void;
    isPartiesNotepadView: boolean;
    setIsPartiesNotepadView: (val: boolean) => void;
    isSubagent: boolean;
    showSaveClientBtn: boolean;
    setShowSaveClientBtn: (val: boolean) => void;
    handleSaveToClients: () => void;
    handlePrint: () => void;
}

export const PassengersTab: React.FC<PassengersTabProps> = ({
    dossier,
    setDossier,
    addLog,
    isPartiesNotepadView,
    setIsPartiesNotepadView,
    isSubagent,
    showSaveClientBtn,
    setShowSaveClientBtn,
    handleSaveToClients,
    handlePrint
}) => {
    const [expandedPassengers, setExpandedPassengers] = useState<string[]>([]);

    const togglePassengerExpand = (id: string) => {
        setExpandedPassengers(prev =>
            prev.includes(id) ? prev.filter(pid => pid !== id) : [...prev, id]
        );
    };

    const addPassenger = () => {
        const newPax: Passenger = {
            id: 'p-' + Math.random().toString(36).substr(2, 9),
            firstName: '',
            lastName: '',
            idNumber: '',
            birthDate: '',
            type: 'Adult',
            address: '',
            city: '',
            country: 'Srbija',
            phone: '',
            email: '',
            isLeadPassenger: false
        };
        setDossier({ ...dossier, passengers: [...dossier.passengers, newPax] });
        addLog('Putnik Dodat', 'Dodat novi prazan slot za putnika.', 'info');
    };

    const removePassenger = (id: string) => {
        if (dossier.passengers.length === 1) return alert('Dossier mora imati bar jednog putnika.');
        setDossier({ ...dossier, passengers: dossier.passengers.filter(p => p.id !== id) });
        addLog('Putnik Uklonjen', 'Putnik je uklonjen sa rezervacije.', 'warning');
    };

    const setLeadPassenger = (id: string) => {
        const lead = dossier.passengers.find(p => p.id === id);
        if (!lead) return;

        const nextPassengers = dossier.passengers.map(p => ({
            ...p,
            isLeadPassenger: p.id === id
        }));

        setDossier({
            ...dossier,
            passengers: nextPassengers,
            booker: {
                ...dossier.booker,
                fullName: `${lead.firstName} ${lead.lastName}`.trim(),
                address: lead.address || '',
                city: lead.city || '',
                country: lead.country || '',
                idNumber: lead.idNumber || '',
                phone: lead.phone || '',
                email: lead.email || ''
            }
        });

        addLog('Nosilac Putovanja', `Nosilac putovanja postavljen: ${lead.firstName} ${lead.lastName}. Podaci sinhronizovani sa ugovaračem.`, 'success');
    };

    const updatePassenger = (id: string, updates: Partial<Passenger>) => {
        const next = dossier.passengers.map(p => p.id === id ? { ...p, ...updates } : p);
        setDossier({ ...dossier, passengers: next });
    };

    const copyBookerToPassengers = () => {
        const next = dossier.passengers.map((p, i) => {
            if (i === 0) {
                return {
                    ...p,
                    firstName: dossier.booker.fullName.split(' ')[0] || '',
                    lastName: dossier.booker.fullName.split(' ').slice(1).join(' ') || '',
                    address: dossier.booker.address,
                    city: dossier.booker.city,
                    country: dossier.booker.country,
                    idNumber: dossier.booker.idNumber || '',
                    phone: dossier.booker.phone,
                    email: dossier.booker.email,
                    isLeadPassenger: true
                };
            }
            return p;
        });
        setDossier({ ...dossier, passengers: next });
        addLog('Sinhronizacija', 'Podaci nosioca kopirani na prvog putnika.', 'success');
    };

    const getPartiesNotepadText = () => {
        let text = `PUTNICI I UGOVARAČ - DOSSIER ${dossier.cisCode}\n`;
        text += `TIP KLIJENTA: ${dossier.customerType}\n\n`;
        text += `UGOVARAČ:\n${dossier.booker.fullName}\n${dossier.booker.email} | ${dossier.booker.phone}\n`;
        text += `\nPUTNICI (${dossier.passengers.length}):\n`;
        dossier.passengers.forEach((p, i) => {
            text += `${i + 1}. ${p.isLeadPassenger ? '[NOSILAC] ' : ''}${p.firstName} ${p.lastName} (${p.type})\n`;
            text += `   Dokument: ${p.idNumber} | Rođen: ${p.birthDate}\n`;
            text += `   Adresa: ${p.address}, ${p.city}, ${p.country}\n`;
            text += `   Kontakt: ${p.email} | ${p.phone}\n\n`;
        });
        return text;
    };

    return (
        <div className="passengers-v2">
            <div className="header-actions">
                <div className="title-group">
                    <h3><Users size={18} className="cyan" /> UČESNICI I UGOVARAČ</h3>
                    <p className="subtitle">Upravljanje podacima klijenta i putnika</p>
                </div>
                <div className="btn-group">
                    <button
                        className={`fil-btn-ghost ${isPartiesNotepadView ? 'active' : ''}`}
                        onClick={() => setIsPartiesNotepadView(!isPartiesNotepadView)}
                    >
                        <FileText size={14} /> {isPartiesNotepadView ? 'INTERAKTIVNO' : 'NOTEPAD'}
                    </button>
                    <div className="segmented-control">
                        <button
                            className={dossier.customerType === 'B2C-Individual' ? 'active' : ''}
                            onClick={() => setDossier({ ...dossier, customerType: 'B2C-Individual' })}
                        >Individualni</button>
                        <button
                            className={dossier.customerType === 'B2B-Subagent' ? 'active' : ''}
                            onClick={() => setDossier({ ...dossier, customerType: 'B2B-Subagent' })}
                        >Subagent</button>
                    </div>
                </div>
            </div>

            <AnimatePresence mode="wait">
                {isPartiesNotepadView ? (
                    <motion.div
                        key="notepad"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="notepad-container glass"
                    >
                        <pre className="notepad-content">{getPartiesNotepadText()}</pre>
                    </motion.div>
                ) : (
                    <motion.div
                        key="interactive"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="interactive-grid"
                    >
                        {/* Booker Form */}
                        <div className="fil-card booker-card-v2">
                            <div className="card-header">
                                <div className="title">
                                    <Smartphone size={18} className="cyan" />
                                    <h4>UGOVARAČ / NALAGODAVAC</h4>
                                </div>
                                <button className="sync-btn" onClick={copyBookerToPassengers}>
                                    <ArrowRightLeft size={12} /> KOPIRAJ NA PUTNIKE
                                </button>
                            </div>
                            <div className="input-grid">
                                <div className="input-field">
                                    <label className="text-xs">IME I PREZIME / KONTAKT</label>
                                    <input
                                        className="fil-input"
                                        value={dossier.booker.fullName}
                                        onChange={e => setDossier({ ...dossier, booker: { ...dossier.booker, fullName: e.target.value } })}
                                    />
                                </div>
                                <div className="input-field">
                                    <label className="text-xs">ADRESA I GRAD</label>
                                    <input
                                        className="fil-input"
                                        value={dossier.booker.address}
                                        onChange={e => setDossier({ ...dossier, booker: { ...dossier.booker, address: e.target.value } })}
                                    />
                                </div>
                                <div className="input-field">
                                    <label className="text-xs">EMAIL ADRESA</label>
                                    <input
                                        className="fil-input"
                                        value={dossier.booker.email}
                                        onChange={e => setDossier({ ...dossier, booker: { ...dossier.booker, email: e.target.value } })}
                                    />
                                </div>
                                <div className="input-field">
                                    <label className="text-xs">TELEFON</label>
                                    <input
                                        className="fil-input"
                                        value={dossier.booker.phone}
                                        onChange={e => setDossier({ ...dossier, booker: { ...dossier.booker, phone: e.target.value } })}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Passengers List */}
                        <div className="passengers-list">
                            <div className="section-header">
                                <h3>LISTA PUTNIKA</h3>
                                <button className="add-pax-btn" onClick={addPassenger}>
                                    <Plus size={14} /> DODAJ PUTNIKA
                                </button>
                            </div>

                            <div className="pax-full-list">
                                {dossier.passengers.map((p, idx) => (
                                    <div key={p.id} className={`fil-card pax-card-extended ${p.isLeadPassenger ? 'is-lead' : ''}`}>
                                        <div className="pax-top-bar">
                                            <div className="pax-main-identity">
                                                <div className="idx-box">#{idx + 1}</div>
                                                <input
                                                    className="pax-name-input-styled"
                                                    placeholder="Ime i prezime..."
                                                    value={`${p.firstName} ${p.lastName}`}
                                                    onChange={e => {
                                                        const [f, ...l] = e.target.value.split(' ');
                                                        updatePassenger(p.id, { firstName: f || '', lastName: l.join(' ') });
                                                    }}
                                                />
                                                <button
                                                    className={`lead-tag-btn ${p.isLeadPassenger ? 'active' : ''}`}
                                                    onClick={() => setLeadPassenger(p.id)}
                                                >
                                                    {p.isLeadPassenger ? <CheckCircle size={14} /> : <div className="circle-outline" />}
                                                    NOSILAC PUTOVANJA
                                                </button>
                                            </div>
                                            <div className="top-actions">
                                                <button className="del-btn" onClick={() => removePassenger(p.id)}>
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </div>

                                        <div className="pax-details-grid">
                                            <div className="grid-section">
                                                <label className="text-xs">IDENTIFIKACIJA I TIP</label>
                                                <div className="row-3">
                                                    <input
                                                        placeholder="Broj pasoša"
                                                        className="fil-input mini"
                                                        value={p.idNumber}
                                                        onChange={e => updatePassenger(p.id, { idNumber: e.target.value })}
                                                    />
                                                    <input
                                                        type="date"
                                                        className="fil-input mini"
                                                        value={p.birthDate}
                                                        onChange={e => updatePassenger(p.id, { birthDate: e.target.value })}
                                                    />
                                                    <select
                                                        className="fil-input mini"
                                                        value={p.type}
                                                        onChange={e => updatePassenger(p.id, { type: e.target.value as any })}
                                                    >
                                                        <option value="Adult">Odrasli</option>
                                                        <option value="Child">Dete</option>
                                                        <option value="Infant">Beba</option>
                                                    </select>
                                                </div>
                                            </div>

                                            <div className="grid-section">
                                                <label className="text-xs">ADRESA STANOVANJA</label>
                                                <div className="row-3">
                                                    <input
                                                        placeholder="Država"
                                                        className="fil-input mini"
                                                        value={p.country}
                                                        onChange={e => updatePassenger(p.id, { country: e.target.value })}
                                                    />
                                                    <input
                                                        placeholder="Grad"
                                                        className="fil-input mini"
                                                        value={p.city}
                                                        onChange={e => updatePassenger(p.id, { city: e.target.value })}
                                                    />
                                                    <input
                                                        placeholder="Adresa"
                                                        className="fil-input mini"
                                                        value={p.address}
                                                        onChange={e => updatePassenger(p.id, { address: e.target.value })}
                                                    />
                                                </div>
                                            </div>

                                            <div className="grid-section">
                                                <label className="text-xs">KONTAKT PODACI</label>
                                                <div className="row-2">
                                                    <div className="input-with-icon">
                                                        <Mail size={12} className="text-dim" />
                                                        <input
                                                            placeholder="Email adresa"
                                                            className="fil-input mini"
                                                            value={p.email}
                                                            onChange={e => updatePassenger(p.id, { email: e.target.value })}
                                                        />
                                                    </div>
                                                    <div className="input-with-icon">
                                                        <Phone size={12} className="text-dim" />
                                                        <input
                                                            placeholder="Kontakt telefon"
                                                            className="fil-input mini"
                                                            value={p.phone}
                                                            onChange={e => updatePassenger(p.id, { phone: e.target.value })}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

        </div>
    );
};
