import React from 'react';
import {
    Users, FileText, UserPlus, Copy, Mail, Printer, Share2, Plus,
    Trash2, Search, ArrowRightLeft, Save
} from 'lucide-react';
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
    const [expandedPassengers, setExpandedPassengers] = React.useState<string[]>([]);

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
            phone: '',
            email: ''
        };
        setDossier({ ...dossier, passengers: [...dossier.passengers, newPax] });
        addLog('Putnik Dodat', 'Dodat novi prazan slot za putnika.', 'info');
    };

    const removePassenger = (id: string) => {
        if (dossier.passengers.length === 1) return alert('Dossier mora imati bar jednog putnika.');
        setDossier({ ...dossier, passengers: dossier.passengers.filter(p => p.id !== id) });
        addLog('Putnik Uklonjen', 'Putnik je uklonjen sa rezervacije.', 'warning');
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
                    email: dossier.booker.email
                };
            }
            return p;
        });
        setDossier({ ...dossier, passengers: next });
        addLog('Sinhronizacija', 'Podaci nosioca kopirani na prvog putnika.', 'success');
    };

    const getPartiesNotepadText = () => {
        let text = `--- PUTNICI I UGOVARAČ / DOSSIER ${dossier.cisCode} ---\n`;
        text += `TIP KLIJENTA: ${dossier.customerType}\n\n`;
        text += `UGOVARAČ:\n`;
        if (dossier.booker.companyName) text += `FIRMA: ${dossier.booker.companyName}\n`;
        text += `IME: ${dossier.booker.fullName}\n`;
        text += `ADRESA: ${dossier.booker.address}, ${dossier.booker.city}, ${dossier.booker.country}\n`;
        text += `EMAIL: ${dossier.booker.email}\n`;
        text += `TEL: ${dossier.booker.phone}\n`;
        text += `JEZIK: ${dossier.language}\n\n`;
        text += `SPISAK PUTNIKA (${dossier.passengers.length}):\n`;
        dossier.passengers.forEach((p, i) => {
            text += `${i + 1}. ${p.firstName} ${p.lastName} (${p.type})\n`;
            text += `   DOC: ${p.idNumber || '---'} | ROĐEN: ${p.birthDate || '---'}\n`;
            if (p.phone) text += `   TEL: ${p.phone}\n`;
            if (p.email) text += `   EMAIL: ${p.email}\n`;
        });
        return text;
    };

    const copyPartiesToClipboard = () => {
        navigator.clipboard.writeText(getPartiesNotepadText());
        addLog('Sistem', 'Podaci o putnicima kopirani.', 'success');
        alert('Kopirano!');
    };

    const sharePartiesToEmail = () => {
        window.location.href = `mailto:?subject=${encodeURIComponent(`Putnici - Dossier ${dossier.cisCode}`)}&body=${encodeURIComponent(getPartiesNotepadText())}`;
    };

    const sharePartiesGeneric = async () => {
        if (navigator.share) {
            try {
                await navigator.share({ title: `Putnici - ${dossier.cisCode}`, text: getPartiesNotepadText() });
            } catch (e) { }
        } else {
            copyPartiesToClipboard();
        }
    };

    return (
        <section className="res-section fade-in">
            <div className="section-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <div>
                    <h3 style={{ fontSize: '20px' }}>
                        <Users size={20} color="var(--accent)" style={{ marginRight: '10px' }} /> Svi Putnici
                    </h3>
                    <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                        Podaci o ugovaraču (nalagodavcu) i svim učesnicima putovanja
                    </p>
                </div>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <button
                        className="btn-notepad-toggle"
                        style={{
                            padding: '8px 16px',
                            borderRadius: '8px',
                            background: isPartiesNotepadView ? 'var(--accent)' : 'rgba(255, 255, 255, 0.05)',
                            color: isPartiesNotepadView ? 'white' : 'var(--text-secondary)',
                            border: '1px solid var(--border)',
                            fontSize: '11px',
                            fontWeight: 800,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px'
                        }}
                        onClick={() => setIsPartiesNotepadView(!isPartiesNotepadView)}
                    >
                        <FileText size={14} /> {isPartiesNotepadView ? 'Zatvori Notepad' : 'Notepad Pregled'}
                    </button>
                    <div className="type-toggle">
                        <button
                            className={dossier.customerType === 'B2C-Individual' ? 'selected' : ''}
                            disabled={isSubagent}
                            onClick={() => {
                                setDossier({ ...dossier, customerType: 'B2C-Individual' });
                                addLog('Tip Klijenta', 'Tip klijenta promenjen u "Individualni".', 'info');
                            }}
                        >
                            Individualni
                        </button>
                        <button
                            className={dossier.customerType === 'B2B-Subagent' ? 'selected' : ''}
                            disabled={isSubagent}
                            onClick={() => {
                                setDossier({ ...dossier, customerType: 'B2B-Subagent' });
                                addLog('Tip Klijenta', 'Tip klijenta promenjen u "Subagent".', 'info');
                            }}
                        >
                            Subagent
                        </button>
                        <button
                            className={dossier.customerType === 'B2C-Legal' ? 'selected' : ''}
                            disabled={isSubagent}
                            onClick={() => {
                                setDossier({ ...dossier, customerType: 'B2C-Legal' });
                                addLog('Tip Klijenta', 'Tip klijenta promenjen u "Pravno Lice".', 'info');
                            }}
                        >
                            Pravno Lice
                        </button>
                    </div>
                </div>
            </div>

            {isPartiesNotepadView ? (
                <div className="notepad-container" style={{
                    background: '#1e293b',
                    padding: '30px',
                    borderRadius: '16px',
                    border: '1px solid var(--border)',
                    fontFamily: 'monospace',
                    color: '#cbd5e1',
                    lineHeight: '1.6',
                    boxShadow: 'inset 0 2px 10px rgba(0,0,0,0.3)',
                    position: 'relative',
                    marginBottom: '30px'
                }}>
                    <div className="notepad-actions" style={{
                        position: 'absolute',
                        top: '20px',
                        right: '25px',
                        display: 'flex',
                        gap: '8px'
                    }}>
                        <button
                            onClick={copyPartiesToClipboard}
                            style={{ background: 'rgba(255, 255, 255, 0.05)', border: '1px solid var(--border)', color: 'white', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '11px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '6px' }}
                        >
                            <Copy size={14} /> Kopiraj
                        </button>
                        <button
                            onClick={sharePartiesToEmail}
                            style={{ background: 'rgba(59, 130, 246, 0.2)', border: '1px solid #3b82f6', color: '#60a5fa', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '11px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '6px' }}
                        >
                            <Mail size={14} /> Email
                        </button>
                        <button
                            onClick={handlePrint}
                            style={{ background: 'rgba(255, 255, 255, 0.05)', border: '1px solid var(--border)', color: 'white', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '11px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '6px' }}
                        >
                            <Printer size={14} /> Štampaj
                        </button>
                        <button
                            onClick={sharePartiesGeneric}
                            style={{ background: 'rgba(16, 185, 129, 0.2)', border: '1px solid #10b981', color: '#34d399', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '11px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '6px' }}
                        >
                            <Share2 size={14} /> Viber/Wapp/Insta
                        </button>
                    </div>

                    <div style={{ borderBottom: '1px dashed #475569', marginBottom: '20px', paddingBottom: '10px' }}>
                        <h4 style={{ margin: 0, color: 'var(--accent)' }}>--- PUTNICI I UGOVARAČ / DOSSIER {dossier.cisCode} ---</h4>
                    </div>
                    <pre style={{ margin: 0, whiteSpace: 'pre-wrap', fontFamily: 'inherit' }}>
                        {getPartiesNotepadText()}
                    </pre>
                </div>
            ) : (
                <>
                    <div className="info-group main-booker-card">
                        <div className="booker-header-row">
                            <label>Ugovarač (Nalagodavac)</label>
                            <button className="copy-to-all-btn" onClick={copyBookerToPassengers}>
                                <ArrowRightLeft size={12} /> Kopiraj podatke na sve putnike
                            </button>
                        </div>

                        <div className="grid-v4">
                            {dossier.customerType !== 'B2C-Individual' && (
                                <div className="input-field">
                                    <label>{dossier.customerType === 'B2B-Subagent' ? 'Naziv Subagenta' : 'Naziv Firme'}</label>
                                    <div style={{ position: 'relative' }}>
                                        <input
                                            value={dossier.booker.companyName}
                                            onChange={e => setDossier({ ...dossier, booker: { ...dossier.booker, companyName: e.target.value } })}
                                            placeholder={dossier.customerType === 'B2B-Subagent' ? 'Pretraži bazu subagenata...' : 'Naziv kompanije...'}
                                            style={{ paddingRight: '40px' }}
                                        />
                                        <Search size={16} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }} />
                                    </div>
                                </div>
                            )}
                            <div className="input-field">
                                <label>Kontakt Osoba (Ime i Prezime)</label>
                                <input
                                    value={dossier.booker.fullName}
                                    onChange={e => setDossier({ ...dossier, booker: { ...dossier.booker, fullName: e.target.value } })}
                                    placeholder="Unesite ime i prezime osobe"
                                />
                            </div>
                            <div className="input-field">
                                <label>Adresa</label>
                                <input
                                    value={dossier.booker.address}
                                    onChange={e => setDossier({ ...dossier, booker: { ...dossier.booker, address: e.target.value } })}
                                    placeholder="Zmaj Jovina 1"
                                />
                            </div>
                            <div className="input-field">
                                <label>Grad</label>
                                <input
                                    value={dossier.booker.city}
                                    onChange={e => setDossier({ ...dossier, booker: { ...dossier.booker, city: e.target.value } })}
                                    placeholder="Beograd"
                                />
                            </div>
                            <div className="input-field">
                                <label>Država</label>
                                <input
                                    value={dossier.booker.country}
                                    onChange={e => setDossier({ ...dossier, booker: { ...dossier.booker, country: e.target.value } })}
                                    placeholder="Srbija"
                                />
                            </div>
                            <div className="input-field">
                                <label>PIB / JMBG</label>
                                <input
                                    value={dossier.booker.companyPib}
                                    onChange={e => setDossier({ ...dossier, booker: { ...dossier.booker, companyPib: e.target.value } })}
                                    placeholder="Unesite PIB ili JMBG..."
                                />
                            </div>
                            <div className="input-field">
                                <label>Email</label>
                                <input
                                    value={dossier.booker.email}
                                    onChange={e => setDossier({ ...dossier, booker: { ...dossier.booker, email: e.target.value } })}
                                    placeholder="agent@click.rs"
                                />
                            </div>
                            <div className="input-field">
                                <label>Telefon</label>
                                <input
                                    value={dossier.booker.phone}
                                    onChange={e => setDossier({ ...dossier, booker: { ...dossier.booker, phone: e.target.value } })}
                                    placeholder="+381..."
                                />
                            </div>

                            {dossier.customerType !== 'B2C-Individual' && (
                                <div className="input-field">
                                    <label style={{ opacity: 0 }}>Akcije</label>
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        <button
                                            className="btn-sync-cis"
                                            style={{ width: 'auto', padding: '0 12px', fontSize: '11px', whiteSpace: 'nowrap' }}
                                            onClick={() => {
                                                if (!dossier.booker.companyPib) return alert('Molimo unesite PIB');
                                                addLog('APR Pretraga', `Pokrenuta pretraga za PIB: ${dossier.booker.companyPib}`, 'info');
                                                // Mocking company fetch
                                                setTimeout(() => {
                                                    setDossier({
                                                        ...dossier,
                                                        booker: {
                                                            ...dossier.booker,
                                                            companyName: 'OLYMPIC DEVELOPMENT DOO',
                                                            address: 'Bulevar Despota Stefana 12',
                                                            city: 'Beograd',
                                                            country: 'Srbija'
                                                        }
                                                    });
                                                    setShowSaveClientBtn(true);
                                                    addLog('APR Uspeh', 'Podaci o firmi uspešno povučeni sa APR-a.', 'success');
                                                }, 800);
                                            }}
                                        >
                                            <Save size={14} /> APR Provera
                                        </button>
                                        {showSaveClientBtn && (
                                            <button
                                                className="btn-sync-cis"
                                                style={{
                                                    width: 'auto',
                                                    padding: '0 12px',
                                                    fontSize: '11px',
                                                    whiteSpace: 'nowrap',
                                                    background: '#10b981',
                                                    borderColor: '#059669',
                                                    color: 'white'
                                                }}
                                                onClick={handleSaveToClients}
                                            >
                                                <Save size={14} /> Sačuvaj Klijenta
                                            </button>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="passengers-list">
                        <div className="list-header">
                            <h4>Svi putnici na ugovoru</h4>
                            <button className="add-btn" onClick={addPassenger}><UserPlus size={14} /> Dodaj putnika</button>
                        </div>
                        <table className="pax-table-v4">
                            <thead>
                                <tr>
                                    <th style={{ width: '40px' }}></th>
                                    <th>Ime</th>
                                    <th>Prezime</th>
                                    <th>ID / Pasoš</th>
                                    <th>Datum Rođenja</th>
                                    <th>Tip</th>
                                    <th></th>
                                </tr>
                            </thead>
                            <tbody>
                                {dossier.passengers.map((pax, pIdx) => (
                                    <React.Fragment key={pax.id}>
                                        <tr>
                                            <td>
                                                <button
                                                    className={`expand-pax-btn ${expandedPassengers.includes(pax.id) ? 'expanded' : ''}`}
                                                    onClick={() => togglePassengerExpand(pax.id)}
                                                >
                                                    <Plus size={14} />
                                                </button>
                                            </td>
                                            <td>
                                                <input
                                                    value={pax.firstName}
                                                    onChange={e => {
                                                        const next = [...dossier.passengers];
                                                        next[pIdx].firstName = e.target.value;
                                                        setDossier({ ...dossier, passengers: next });
                                                    }}
                                                />
                                            </td>
                                            <td>
                                                <input
                                                    value={pax.lastName}
                                                    onChange={e => {
                                                        const next = [...dossier.passengers];
                                                        next[pIdx].lastName = e.target.value;
                                                        setDossier({ ...dossier, passengers: next });
                                                    }}
                                                />
                                            </td>
                                            <td>
                                                <input
                                                    value={pax.idNumber}
                                                    onChange={e => {
                                                        const next = [...dossier.passengers];
                                                        next[pIdx].idNumber = e.target.value;
                                                        setDossier({ ...dossier, passengers: next });
                                                    }}
                                                />
                                            </td>
                                            <td>
                                                <input
                                                    type="date"
                                                    value={pax.birthDate}
                                                    onChange={e => {
                                                        const next = [...dossier.passengers];
                                                        next[pIdx].birthDate = e.target.value;
                                                        setDossier({ ...dossier, passengers: next });
                                                    }}
                                                />
                                            </td>
                                            <td>
                                                <select
                                                    value={pax.type}
                                                    onChange={e => {
                                                        const next = [...dossier.passengers];
                                                        next[pIdx].type = e.target.value as any;
                                                        setDossier({ ...dossier, passengers: next });
                                                    }}
                                                >
                                                    <option value="Adult" style={{ background: 'var(--bg-card)', color: 'var(--text-primary)' }}>Odrasli</option>
                                                    <option value="Child" style={{ background: 'var(--bg-card)', color: 'var(--text-primary)' }}>Dete</option>
                                                    <option value="Infant" style={{ background: 'var(--bg-card)', color: 'var(--text-primary)' }}>Beba</option>
                                                </select>
                                            </td>
                                            <td><button className="del-btn-v4" onClick={() => removePassenger(pax.id)}><Trash2 size={14} /></button></td>
                                        </tr>
                                        {expandedPassengers.includes(pax.id) && (
                                            <tr className="pax-extra-info-row fade-in">
                                                <td colSpan={1}></td>
                                                <td colSpan={6}>
                                                    <div className="pax-extra-fields" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
                                                        <div className="extra-field-group">
                                                            <label>Adresa</label>
                                                            <input
                                                                value={pax.address || ''}
                                                                placeholder="Unesite adresu..."
                                                                onChange={e => {
                                                                    const next = [...dossier.passengers];
                                                                    next[pIdx].address = e.target.value;
                                                                    setDossier({ ...dossier, passengers: next });
                                                                }}
                                                            />
                                                        </div>
                                                        <div className="extra-field-group">
                                                            <label>Grad</label>
                                                            <input
                                                                value={pax.city || ''}
                                                                placeholder="Unesite grad..."
                                                                onChange={e => {
                                                                    const next = [...dossier.passengers];
                                                                    next[pIdx].city = e.target.value;
                                                                    setDossier({ ...dossier, passengers: next });
                                                                }}
                                                            />
                                                        </div>
                                                        <div className="extra-field-group">
                                                            <label>Država</label>
                                                            <select
                                                                value={pax.country || 'Srbija'}
                                                                onChange={e => {
                                                                    const next = [...dossier.passengers];
                                                                    next[pIdx].country = e.target.value;
                                                                    setDossier({ ...dossier, passengers: next });
                                                                }}
                                                            >
                                                                {NATIONALITIES.map(n => (
                                                                    <option key={n.code} value={n.name}>{n.name}</option>
                                                                ))}
                                                            </select>
                                                        </div>
                                                        <div className="extra-field-group">
                                                            <label>Telefon</label>
                                                            <input
                                                                value={pax.phone || ''}
                                                                placeholder="+381..."
                                                                onChange={e => {
                                                                    const next = [...dossier.passengers];
                                                                    next[pIdx].phone = e.target.value;
                                                                    setDossier({ ...dossier, passengers: next });
                                                                }}
                                                            />
                                                        </div>
                                                        <div className="extra-field-group">
                                                            <label>Email</label>
                                                            <input
                                                                value={pax.email || ''}
                                                                placeholder="email@example.com"
                                                                onChange={e => {
                                                                    const next = [...dossier.passengers];
                                                                    next[pIdx].email = e.target.value;
                                                                    setDossier({ ...dossier, passengers: next });
                                                                }}
                                                            />
                                                        </div>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </React.Fragment>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </>
            )}
        </section>
    );
};
