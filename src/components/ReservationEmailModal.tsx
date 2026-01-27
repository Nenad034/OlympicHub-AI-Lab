import React, { useState, useRef, useEffect, useCallback } from 'react';
import { X, Mail, FileText, Send, Paperclip, AlertTriangle, Shield, Info, Plus, Inbox, Trash2, Settings, Search, RefreshCw, Filter } from 'lucide-react';
import './ReservationEmailModal.css';

interface EmailDocument {
    id: string;
    name: string;
    description: string;
    recipientType: 'supplier' | 'customer' | 'both';
}

interface ReservationEmailModalProps {
    isOpen: boolean;
    onClose: () => void;
    reservations: Array<{
        cisCode: string;
        customerName: string;
        supplier: string;
        email: string;
    }>;
    isBulk?: boolean; // Bulk mode for multiple reservations
}

const ReservationEmailModal: React.FC<ReservationEmailModalProps> = ({ isOpen, onClose, reservations, isBulk = false }) => {
    const [docSelections, setDocSelections] = useState<Record<string, { html: boolean, pdf: boolean }>>({});
    const [format, setFormat] = useState<'pdf' | 'html' | 'both'>('pdf'); // This acts as default for new selections


    const [recipientType, setRecipientType] = useState<'supplier' | 'customer'>('customer');
    const [customRecipients, setCustomRecipients] = useState('');
    const [subject, setSubject] = useState('');
    const [message, setMessage] = useState('');
    const [mainRecipient, setMainRecipient] = useState('');

    // --- CC & BCC STATE ---
    const [showCc, setShowCc] = useState(false);
    const [showBcc, setShowBcc] = useState(false);
    const [ccLines, setCcLines] = useState<string[]>(['']);
    const [bccLines, setBccLines] = useState<string[]>(['']);

    const addCcLine = () => setCcLines([...ccLines, '']);
    const removeCcLine = (index: number) => setCcLines(ccLines.filter((_, i) => i !== index));
    const updateCcLine = (index: number, value: string) => {
        const newLines = [...ccLines];
        newLines[index] = value;
        setCcLines(newLines);
    };

    const addBccLine = () => setBccLines([...bccLines, '']);
    const removeBccLine = (index: number) => setBccLines(bccLines.filter((_, i) => i !== index));
    const updateBccLine = (index: number, value: string) => {
        const newLines = [...bccLines];
        newLines[index] = value;
        setBccLines(newLines);
    };

    // --- DRAG & RESIZE STATE ---
    const [position, setPosition] = useState<{ x: number, y: number } | null>(null);
    const [size, setSize] = useState({ width: 1300, height: 850 });
    const [isDragging, setIsDragging] = useState(false);
    const [isResizing, setIsResizing] = useState(false);
    const dragOffset = useRef({ x: 0, y: 0 });
    const modalRef = useRef<HTMLDivElement>(null);

    const documents: EmailDocument[] = [
        { id: 'inquiry', name: 'Upit', description: 'Zahtev za proveru raspoloživosti', recipientType: 'supplier' },
        { id: 'supplier-notification', name: 'Najava rezervacije', description: 'Obaveštenje dobavljaču o rezervaciji', recipientType: 'supplier' },
        { id: 'cancellation', name: 'Otkaz rezervacije', description: 'Storno poruka za dobavljača', recipientType: 'supplier' },
        { id: 'voucher', name: 'Voucher', description: 'Vaučer za rezervaciju', recipientType: 'customer' },
        { id: 'contract', name: 'Ugovor', description: 'Ugovor o putovanju', recipientType: 'customer' },
        { id: 'proforma', name: 'Profaktura', description: 'Profaktura za kupca', recipientType: 'customer' },
        { id: 'travel-guarantee', name: 'Garancija Putovanja', description: 'Garancija putovanja', recipientType: 'customer' },
        { id: 'travel-program', name: 'Program Putovanja', description: 'Detaljan program putovanja', recipientType: 'customer' }
    ];

    // Get recipients based on type
    const getRecipients = useCallback(() => {
        if (recipientType === 'supplier') {
            const allSuppliers = reservations.flatMap(r =>
                r.supplier.split(',').map((s: string) => s.trim())
            );
            return [...new Set(allSuppliers)].join(', ');
        } else {
            const allEmails = reservations.map(r => r.email);
            return [...new Set(allEmails)].join(', ');
        }
    }, [recipientType, reservations]);

    // Reset position and center modal ONLY on initial open
    useEffect(() => {
        if (isOpen) {
            const viewportWidth = window.innerWidth;
            const viewportHeight = window.innerHeight;

            const targetWidth = Math.min(viewportWidth * 0.9, 1300);
            const targetHeight = Math.min(viewportHeight * 0.9, 850);

            setSize({ width: targetWidth, height: targetHeight });

            // Postavljamo početnu poziciju odmah u pikselima umesto null
            const initialX = (viewportWidth - targetWidth) / 2;
            const initialY = (viewportHeight - targetHeight) / 2;
            setPosition({ x: initialX, y: initialY });

            setMainRecipient(getRecipients());
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen]);


    // Separately update main recipient when type changes (without moving modal)
    useEffect(() => {
        if (isOpen) {
            setMainRecipient(getRecipients());
        }
    }, [recipientType, getRecipients, isOpen]);

    // Drag Logic
    const handleMouseDown = (e: React.MouseEvent) => {
        if (e.target instanceof HTMLElement && (e.target.closest('.close-btn-fixed') || e.target.closest('button') || e.target.closest('input') || e.target.closest('textarea'))) return;

        if (!position) return;

        setIsDragging(true);

        dragOffset.current = {
            x: e.clientX - position.x,
            y: e.clientY - position.y
        };
    };

    // Resize Logic
    const handleResizeMouseDown = (e: React.MouseEvent) => {
        e.stopPropagation();
        e.preventDefault();
        setIsResizing(true);
    };


    const handleMouseMove = useCallback((e: MouseEvent) => {
        if (isDragging) {
            setPosition({
                x: e.clientX - dragOffset.current.x,
                y: e.clientY - dragOffset.current.y
            });
        }
        if (isResizing) {
            const currentX = position ? position.x : (window.innerWidth - size.width) / 2;
            const currentY = position ? position.y : (window.innerHeight - size.height) / 2;

            if (!position) setPosition({ x: currentX, y: currentY });

            const newWidth = Math.max(800, e.clientX - (position?.x || currentX));
            const newHeight = Math.max(500, e.clientY - (position?.y || currentY));
            setSize({ width: newWidth, height: newHeight });
        }
    }, [isDragging, isResizing, position, size.width, size.height]);

    const handleMouseUp = useCallback(() => {
        setIsDragging(false);
        setIsResizing(false);
    }, []);

    useEffect(() => {
        if (isDragging || isResizing) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
        } else {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        }
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging, isResizing, handleMouseMove, handleMouseUp]);

    const selectedDocIds = Object.keys(docSelections);

    const toggleDocument = (docId: string, forceMode?: 'html' | 'pdf') => {
        setDocSelections(prev => {
            const current = prev[docId];
            const next = { ...prev };

            if (forceMode) {
                // Toggle specific mode
                const newModes = current
                    ? { ...current, [forceMode]: !current[forceMode] }
                    : { html: forceMode === 'html', pdf: forceMode === 'pdf' };

                if (!newModes.html && !newModes.pdf) {
                    delete next[docId];
                } else {
                    next[docId] = newModes;
                }
            } else {
                // Toggle whole document (if selecting for the first time or unselecting)
                if (current) {
                    delete next[docId];
                } else {
                    next[docId] = {
                        html: format === 'html' || format === 'both',
                        pdf: format === 'pdf' || format === 'both'
                    };
                    // If format was somehow 'pdf' (default), let's ensure it has at least one
                    if (!next[docId].html && !next[docId].pdf) next[docId].pdf = true;
                }
            }

            // Update subject logic
            const currentSelectedIds = Object.keys(next);
            if (currentSelectedIds.length > 0) {
                const selectedNames = currentSelectedIds
                    .map(id => documents.find(d => d.id === id)?.name)
                    .filter(Boolean);

                const res = reservations[0];
                if (isBulk) {
                    setSubject(`${selectedNames.join(', ')} - ${reservations.length} rezervacija`);
                } else {
                    setSubject(`${selectedNames.join(', ')} - rezervacija broj ${res?.cisCode} - ${res?.customerName}`);
                }
            } else {
                setSubject('');
            }

            return next;
        });
    };

    const setAllFormats = (mode: 'html' | 'pdf' | 'both') => {
        setFormat(mode);
        setDocSelections(prev => {
            const next = { ...prev };
            Object.keys(next).forEach(id => {
                if (mode === 'both') {
                    next[id] = { html: true, pdf: true };
                } else {
                    next[id] = { ...next[id], [mode]: true, [mode === 'html' ? 'pdf' : 'html']: false };
                }
            });
            return next;
        });
    };



    const handleSend = () => {
        console.log('Sending email:', {
            reservations: reservations.map(r => r.cisCode),
            count: reservations.length,
            mainRecipient,
            ccLines,
            bccLines,
            documents: docSelections,
            recipientType,
            customRecipients,
            subject,
            message
        });
        alert(`Email će biti poslat za ${reservations.length} rezervacija`);
        onClose();
    };

    if (!isOpen) return null;



    return (
        <div className="email-modal-overlay">
            <div
                ref={modalRef}
                className="email-modal"
                style={{
                    left: `${position?.x || 0}px`,
                    top: `${position?.y || 0}px`,
                    width: `${size.width}px`,
                    height: `${size.height}px`,
                    position: 'fixed',
                    transform: 'none' // Potpuno ukidamo transformaciju radi stabilnosti
                }}
            >

                <div className="resize-handle" onMouseDown={handleResizeMouseDown}></div>
                <button className="close-btn-fixed" onClick={onClose}>
                    <X size={20} />
                </button>
                {/* Header - DRAG HANDLE */}
                <div className="email-modal-header" onMouseDown={handleMouseDown} style={{ cursor: isDragging ? 'grabbing' : 'grab' }}>
                    <div>
                        <h2>
                            <Mail size={24} />
                            Slanje Email-a
                        </h2>
                        <p>
                            {isBulk
                                ? `${reservations.length} rezervacija`
                                : `Broj Rezervacije: ${reservations[0]?.cisCode} - ${reservations[0]?.customerName}`
                            }
                        </p>
                    </div>
                </div>

                {/* Body - Horizontalni Layout */}
                <div className="email-modal-body-container">
                    {/* Sidebar sa Dokumentima */}
                    <div className="mail-sidebar-documents">
                        <div className="sidebar-header">
                            <div className="sidebar-title">DOKUMENTACIJA</div>
                            <span className="sidebar-count">{selectedDocIds.length} izabrano</span>
                        </div>


                        <div className="sidebar-doc-list">
                            {documents
                                .filter(doc => recipientType === 'supplier' ? doc.recipientType === 'supplier' : doc.recipientType !== 'supplier')
                                .map(doc => {
                                    const selection = docSelections[doc.id];
                                    return (
                                        <div
                                            key={doc.id}
                                            className={`sidebar-doc-item ${selection ? 'selected' : ''}`}
                                            onClick={() => toggleDocument(doc.id)}
                                        >
                                            <div className="doc-checkbox">
                                                <input
                                                    type="checkbox"
                                                    checked={!!selection}
                                                    readOnly
                                                />
                                            </div>
                                            <div className="doc-item-info">
                                                <span className="doc-item-name">{doc.name}</span>
                                                <span className="doc-item-desc">{doc.description}</span>
                                            </div>
                                            <div className="doc-item-modes">
                                                <button
                                                    className={`mode-badge ${selection?.html ? 'active' : ''}`}
                                                    onClick={(e) => { e.stopPropagation(); toggleDocument(doc.id, 'html'); }}
                                                    title="Direktno u mejlu"
                                                >
                                                    <FileText size={12} />
                                                </button>
                                                <button
                                                    className={`mode-badge ${selection?.pdf ? 'active' : ''}`}
                                                    onClick={(e) => { e.stopPropagation(); toggleDocument(doc.id, 'pdf'); }}
                                                    title="Kao PDF prilog"
                                                >
                                                    <Paperclip size={12} />
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}

                        </div>

                        <div className="sidebar-footer-info">
                            <div className="account-pill">
                                <div className="pill-dot"></div>
                                <span>nenad.tomic@olympic.rs</span>
                            </div>
                        </div>
                    </div>

                    {/* Glavni Panel za Pisanje */}
                    <div className="email-main-content">
                        <div className="compose-horizontal-header">
                            <div className="recipient-simple-row">
                                <span className="row-label">Prima:</span>
                                <input
                                    type="text"
                                    className="simple-input main-recipient-input"
                                    placeholder="email@primer.com"
                                    value={mainRecipient}
                                    onChange={(e) => setMainRecipient(e.target.value)}
                                />
                                <div className="recipient-actions-extras">
                                    <button
                                        className={`extra-toggle ${showCc ? 'active' : ''}`}
                                        onClick={() => setShowCc(!showCc)}
                                    >Cc</button>
                                    <button
                                        className={`extra-toggle ${showBcc ? 'active' : ''}`}
                                        onClick={() => setShowBcc(!showBcc)}
                                    >Bcc</button>
                                </div>
                                <div className="recipient-toggle-buttons">
                                    <button
                                        className={recipientType === 'customer' ? 'active' : ''}
                                        onClick={() => setRecipientType('customer')}
                                    >Kupac</button>
                                    <button
                                        className={recipientType === 'supplier' ? 'active' : ''}
                                        onClick={() => setRecipientType('supplier')}
                                    >Dobavljač</button>
                                </div>
                            </div>

                            {/* CC Sekcija */}
                            {showCc && ccLines.map((line, index) => (
                                <div className="recipient-simple-row extended" key={`cc-${index}`}>
                                    <span className="row-label">Cc:</span>
                                    <input
                                        type="text"
                                        className="simple-input"
                                        placeholder="email@primer.com"
                                        value={line}
                                        onChange={(e) => updateCcLine(index, e.target.value)}
                                    />
                                    <div className="line-actions">
                                        <button className="line-btn add" onClick={addCcLine} title="Dodaj liniju"><Plus size={14} /></button>
                                        {ccLines.length > 1 && (
                                            <button className="line-btn remove" onClick={() => removeCcLine(index)}><Trash2 size={14} /></button>
                                        )}
                                    </div>
                                </div>
                            ))}

                            {/* BCC Sekcija */}
                            {showBcc && bccLines.map((line, index) => (
                                <div className="recipient-simple-row extended" key={`bcc-${index}`}>
                                    <span className="row-label">Bcc:</span>
                                    <input
                                        type="text"
                                        className="simple-input"
                                        placeholder="email@primer.com"
                                        value={line}
                                        onChange={(e) => updateBccLine(index, e.target.value)}
                                    />
                                    <div className="line-actions">
                                        <button className="line-btn add" onClick={addBccLine} title="Dodaj liniju"><Plus size={14} /></button>
                                        {bccLines.length > 1 && (
                                            <button className="line-btn remove" onClick={() => removeBccLine(index)}><Trash2 size={14} /></button>
                                        )}
                                    </div>
                                </div>
                            ))}

                            <div className="subject-simple-row">
                                <span className="row-label">Naslov:</span>
                                <input
                                    type="text"
                                    className="simple-input"
                                    placeholder="Naslov poruke..."
                                    value={subject}
                                    onChange={(e) => setSubject(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="email-editor-area">
                            <div className="editor-toolbar-mini">
                                <button
                                    className={`toolbar-tool ${format === 'html' ? 'active' : ''}`}
                                    onClick={() => setAllFormats('html')}
                                >
                                    <FileText size={14} /> HTML Email (Svi)
                                </button>
                                <button
                                    className={`toolbar-tool ${format === 'pdf' ? 'active' : ''}`}
                                    onClick={() => setAllFormats('pdf')}
                                >
                                    <Paperclip size={14} /> PDF Prilozi (Svi)
                                </button>

                                <div className="v-divider-small"></div>
                                <div className="format-pills">
                                    <button className={format === 'html' ? 'active' : ''} onClick={() => setAllFormats('html')}>Direktno</button>
                                    <button className={format === 'pdf' ? 'active' : ''} onClick={() => setAllFormats('pdf')}>Kao PDF</button>
                                    <button className={format === 'both' ? 'active' : ''} onClick={() => setAllFormats('both')}>Oba</button>
                                </div>


                            </div>
                            <textarea
                                className="main-editor-textarea"
                                placeholder="Ovde unesite tekst poruke koja će biti poslata kupcu uz dokumente..."
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                            />
                        </div>
                    </div>
                </div>

                {/* Footer - Kompaktan */}
                <div className="email-modal-footer">
                    <div className="footer-stats">
                        <div className="stat-group">
                            <span className="stat-label">OPERATOR</span>
                            <span className="stat-value">Office Belgrade / NT</span>
                        </div>
                        <div className="footer-v-divider"></div>
                        <div className="stat-group">
                            <span className="stat-label">CENA REZERVACIJE</span>
                            <span className="stat-value">1.850,00 EUR</span>
                        </div>
                        <div className="stat-group">
                            <span className="stat-label">SALDO</span>
                            <span className="stat-value highlight">1.850,00</span>
                        </div>
                    </div>
                    <div className="footer-btns">
                        <button className="btn-secondary-flat" onClick={onClose}>OTKAŽI</button>
                        <button
                            className="btn-primary-send-large"
                            onClick={handleSend}
                            disabled={selectedDocIds.length === 0}

                        >
                            <Send size={18} />
                            POŠALJI EMAIL
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ReservationEmailModal;
