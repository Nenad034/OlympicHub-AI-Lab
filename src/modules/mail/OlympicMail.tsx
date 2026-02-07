import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import {
    Mail,
    Send,
    Inbox,
    Star,
    Archive,
    Trash2,
    Search,
    Plus,
    Clock,
    Filter,
    Paperclip,
    MoreVertical,
    Reply,
    Forward,
    ChevronDown,
    Bold,
    Italic,
    Underline,
    List,
    ListOrdered,
    Image as ImageIcon,
    Link as LinkIcon,
    Smile,
    Maximize2,
    Check,
    RotateCcw,
    Shield,
    Settings,
    RefreshCw,
    Loader2,
    Sparkles,
    Wand2,
    Languages
} from 'lucide-react';
import { useMailStore, useAuthStore } from '../../stores';
import { sendEmail as sendEmailViaSmtp, fetchEmails as fetchEmailsViaImap } from '../../services/emailService';
import { generateOfferFromEmail, translateWithTone } from '../../services/aiOfferService';
import { supabase } from '../../supabaseClient';
import { EmailConfigModal } from '../../components/email/EmailConfigModal';
import { AIOfferModal } from '../../components/email/AIOfferModal';
import { AIMailRules } from '../../components/email/AIMailRules';
import { useNotificationCenter } from '../../hooks/useNotificationCenter';
import './OlympicMail.modern.css';
import '../../components/email/AIMailRules.css';

export const OlympicMail: React.FC = () => {
    const { notify } = useNotificationCenter();
    const {
        accounts,
        emails,
        selectedAccountId,
        setSelectedAccount,
        sendEmail,
        deleteEmail,
        restoreEmail,
        setSignature,
        updateEmail,
        setEmails,
        addAccount,
        receiveEmail
    } = useMailStore();

    const { userLevel } = useAuthStore();

    const [activeFolder, setActiveFolder] = useState<'inbox' | 'sent' | 'drafts' | 'archive' | 'trash'>('inbox');
    const [selectedEmailId, setSelectedEmailId] = useState<string | null>(null);
    const [viewMode, setViewMode] = useState<'list' | 'compose' | 'settings'>('list');
    const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
    const [isMasterView, setIsMasterView] = useState(false);
    const [signatureEdit, setSignatureEdit] = useState('');
    const [searchText, setSearchText] = useState('');
    const [showConfigModal, setShowConfigModal] = useState(false);
    const [isFetching, setIsFetching] = useState(false);
    const [isSending, setIsSending] = useState(false);

    // New Account Dialog State
    const [showAddAccountDialog, setShowAddAccountDialog] = useState(false);
    const [newAccountData, setNewAccountData] = useState({ name: '', email: '', color: '#3b82f6' });

    // AI Offer State
    const [isLoadingAIOffer, setIsLoadingAIOffer] = useState(false);
    const [aiProposal, setAiProposal] = useState<any | null>(null);

    // AI Rules State
    const [showAIRules, setShowAIRules] = useState(false);

    // AI Translation/Tone State
    const [isTranslating, setIsTranslating] = useState(false);
    const [translationTone, setTranslationTone] = useState<'formal' | 'informal' | 'friendly'>('formal');

    // Compose State
    const [composeTo, setComposeTo] = useState('');
    const [composeSubject, setComposeSubject] = useState('');
    const [composeBody, setComposeBody] = useState('');

    // Layout State (Resizable Panels)
    const containerRef = useRef<HTMLDivElement>(null);
    const [sidebarWidth, setSidebarWidth] = useState(260);
    const [listWidth, setListWidth] = useState(340);
    const [isResizingSidebar, setIsResizingSidebar] = useState(false);
    const [isResizingList, setIsResizingList] = useState(false);

    const activeAccount = accounts.find(a => a.id === selectedAccountId) || accounts[0];
    const selectedEmail = emails.find(e => e.id === selectedEmailId);

    // Resize Logic
    const startResizingSidebar = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        setIsResizingSidebar(true);
    }, []);

    const startResizingList = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        setIsResizingList(true);
    }, []);

    const stopResizing = useCallback(() => {
        setIsResizingSidebar(false);
        setIsResizingList(false);
    }, []);

    const resize = useCallback((e: MouseEvent) => {
        if (!containerRef.current) return;

        const containerRect = containerRef.current.getBoundingClientRect();
        const relativeX = e.clientX - containerRect.left;

        if (isResizingSidebar) {
            if (relativeX > 150 && relativeX < 500) setSidebarWidth(relativeX);
        } else if (isResizingList) {
            const newWidth = relativeX - sidebarWidth;
            if (newWidth > 200 && newWidth < 600) setListWidth(newWidth);
        }
    }, [isResizingSidebar, isResizingList, sidebarWidth]);

    useEffect(() => {
        if (isResizingSidebar || isResizingList) {
            window.addEventListener('mousemove', resize);
            window.addEventListener('mouseup', stopResizing);
            document.body.style.cursor = 'col-resize';
            document.body.style.userSelect = 'none';
        } else {
            window.removeEventListener('mousemove', resize);
            window.removeEventListener('mouseup', stopResizing);
            document.body.style.cursor = '';
            document.body.style.userSelect = '';
        }

        return () => {
            window.removeEventListener('mousemove', resize);
            window.removeEventListener('mouseup', stopResizing);
            document.body.style.cursor = '';
            document.body.style.userSelect = '';
        };
    }, [isResizingSidebar, isResizingList, resize, stopResizing]);

    const filteredEmails = useMemo(() => {
        return emails.filter(e => {
            const matchesFolder = e.category === activeFolder;
            const matchesAccount = isMasterView ? true : e.accountId === selectedAccountId;
            const matchesSearch = searchText === '' ||
                e.subject.toLowerCase().includes(searchText.toLowerCase()) ||
                e.sender.toLowerCase().includes(searchText.toLowerCase()) ||
                e.body.toLowerCase().includes(searchText.toLowerCase());
            return matchesFolder && matchesAccount && matchesSearch;
        });
    }, [emails, activeFolder, selectedAccountId, isMasterView, searchText]);

    const handleCompose = () => {
        setComposeTo('');
        setComposeSubject('');
        setComposeBody('');
        setViewMode('compose');
    };

    const handleReply = (email: any) => {
        setComposeTo(email.senderEmail);
        setComposeSubject(`Re: ${email.subject}`);
        setComposeBody(`\n\n--- Originalna poruka ---\nOd: ${email.sender}\nPoslato: ${email.time}\n\n${email.body}`);
        setViewMode('compose');
    };

    const handleForward = (email: any) => {
        setComposeTo('');
        setComposeSubject(`Fwd: ${email.subject}`);
        setComposeBody(`\n\n--- Originalna poruka ---\nOd: ${email.sender}\nPoslato: ${email.time}\n\n${email.body}`);
        setViewMode('compose');
    };

    const handleSend = async () => {
        if (!composeTo) return alert('Unesite primaoca');

        setIsSending(true);

        try {
            // Try to send real email via SMTP
            const result = await sendEmailViaSmtp({
                from: activeAccount.email,
                to: composeTo,
                subject: composeSubject || '(Bez naslova)',
                body: composeBody,
                accountId: selectedAccountId
            });

            const isEnvironmentError = !result.success && result.error && (
                result.error.includes('Supabase') ||
                result.error.includes('configuration not found') ||
                result.error.includes('Edge Function') ||
                result.error.includes('Failed to fetch')
            );

            if (result.success || isEnvironmentError) {
                // Also add to local store for immediate UI update
                sendEmail({
                    accountId: selectedAccountId,
                    to: composeTo,
                    subject: composeSubject || '(Bez naslova)',
                    body: composeBody,
                    sender: activeAccount.name,
                    senderEmail: activeAccount.email
                });

                if (result.success) {
                    alert('✅ Poruka je uspešno poslata!');
                } else {
                    // Logic for Demo Mode: if sent to self, mock arrival in Inbox after 2 seconds
                    if (composeTo.toLowerCase() === activeAccount.email.toLowerCase()) {
                        setTimeout(() => {
                            receiveEmail({
                                accountId: selectedAccountId,
                                from: activeAccount.name,
                                fromEmail: activeAccount.email,
                                subject: composeSubject || '(Bez naslova)',
                                body: composeBody
                            });
                            notify('mail', 'info', 'Nova poruka', `Od: ${activeAccount.name}`);
                            console.log('Demo: Mock email arrived in Inbox');
                        }, 2000);
                    }

                    alert('✅ (Demo Mod) Poruka sačuvana lokalno. Pošto ste poslali sami sebi, stići će u Inbox za 2 sekunde.');
                }

                setViewMode('list');
                setActiveFolder('sent');
            } else {
                alert(`❌ Greška pri slanju: ${result.error}`);
            }
        } catch (error: any) {
            console.error('Error sending email:', error);
            // Fallback: still show in Sent if it's a demo
            sendEmail({
                accountId: selectedAccountId,
                to: composeTo,
                subject: composeSubject || '(Bez naslova)',
                body: composeBody,
                sender: activeAccount.name,
                senderEmail: activeAccount.email
            });
            setViewMode('list');
            setActiveFolder('sent');
            alert('✅ (Demo Mod) Poruka sačuvana lokalno.');
        } finally {
            setIsSending(false);
        }
    };

    // Load emails form Supabase on mount or account change
    const loadEmails = async () => {
        try {
            let query = supabase
                .from('emails')
                .select('*');

            if (selectedAccountId) {
                query = query.eq('account_id', selectedAccountId);
            }

            const { data, error } = await query.order('received_at', { ascending: false });

            // If error, likely offline/demo - keep local state or don't error out
            if (error) {
                console.warn('Could not load emails from DB, using local only', error);
                return;
            }

            if (data) {
                const mappedEmails = data.map((e: any) => ({
                    id: e.id,
                    sender: e.sender,
                    senderEmail: e.sender_email || '',
                    recipient: e.recipient,
                    subject: e.subject,
                    preview: e.preview || (e.body ? e.body.substring(0, 100) + '...' : ''),
                    body: e.body || '',
                    time: e.received_at ? new Date(e.received_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) :
                        e.sent_at ? new Date(e.sent_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '',
                    isUnread: !e.is_read,
                    isStarred: e.is_starred,
                    category: e.folder as any,
                    accountId: e.account_id,
                    deletedAt: e.deleted_at,
                    isLocal: false
                }));

                // FIX: Use useMailStore.getState() to get the LATEST emails directly from store
                // NOT the 'emails' variable from the component scope which might be stale
                const currentStoreEmails = useMailStore.getState().emails;
                const currentLocalEmails = currentStoreEmails.filter(e => e.isLocal && e.accountId === selectedAccountId);

                // Combine: Local (usually newer/mock) + Remote
                const combined = [...currentLocalEmails, ...mappedEmails];

                // Sort by time (heuristic, or just prepend local)
                // For simplicity, puts local first as they are likely "newest" in demo session
                setEmails(combined);
            }
        } catch (error: any) {
            console.error('Error loading emails:', error);
        }
    };

    useEffect(() => {
        loadEmails();
    }, [selectedAccountId]);

    const handleOpenSettings = () => {
        setShowConfigModal(true);
    };

    const handleAddNewAccount = () => {
        if (!newAccountData.email.includes('@')) {
            alert('❌ Molimo unesite ispravnu email adresu.');
            return;
        }
        if (!newAccountData.name) {
            alert('❌ Molimo unesite naziv naloga.');
            return;
        }

        const newId = addAccount({
            name: newAccountData.name,
            email: newAccountData.email,
            color: newAccountData.color
        });

        setShowAddAccountDialog(false);
        setNewAccountData({ name: '', email: '', color: '#3b82f6' });

        // Open config for the new account immediately
        setSelectedAccount(newId);
        setTimeout(() => setShowConfigModal(true), 100);
    };

    const handleFetchEmails = async () => {
        setIsFetching(true);
        try {
            const result = await fetchEmailsViaImap(selectedAccountId);

            const isEnvironmentError = !result.success && result.error && (
                result.error.includes('Supabase') ||
                result.error.includes('Edge Function') ||
                result.error.includes('Failed to fetch') ||
                result.error.includes('CORS')
            );

            if (result.success || isEnvironmentError) {
                if (result.success) {
                    alert(`✅ Preuzeto ${result.emails?.length || 0} novih poruka!`);
                } else {
                    alert('✅ (Demo Mod) Provera servera završena. Trenutno nema novih poruka na Cloud-u.');
                }
                // Refresh list from database
                await loadEmails();
            } else {
                if (result.error?.includes('configuration not found')) {
                    if (confirm('📧 Nalog nije podešen. Da li želite da ga podesite sada?')) {
                        setShowConfigModal(true);
                    }
                } else {
                    alert(`❌ Greška: ${result.error}`);
                }
            }
        } catch (error: any) {
            console.error('Fetch error:', error);
            alert('✅ (Demo Mod) Osvežavanje završeno.');
            await loadEmails();
        } finally {
            setIsFetching(false);
        }
    };

    const handleSaveSignature = () => {
        setSignature(selectedAccountId, signatureEdit);
        setViewMode('list');
    };

    const handleDelete = async (id: string) => {
        try {
            const { error } = await supabase
                .from('emails')
                .update({ folder: 'trash', deleted_at: new Date().toISOString() })
                .eq('id', id);

            if (error) throw error;

            deleteEmail(id);
            if (selectedEmailId === id) setSelectedEmailId(null);
        } catch (error: any) {
            console.error('Error deleting email:', error);
            alert('❌ Greška prilikom brisanja poruke.');
        }
    };

    const handleRestore = async (id: string) => {
        try {
            const { error } = await supabase
                .from('emails')
                .update({ folder: 'inbox', deleted_at: null })
                .eq('id', id);

            if (error) throw error;

            restoreEmail(id);
        } catch (error: any) {
            console.error('Error restoring email:', error);
            alert('❌ Greška prilikom vraćanja poruke.');
        }
    };

    const handleCreateAIOffer = async () => {
        if (!selectedEmail) return;

        setIsLoadingAIOffer(true);
        try {
            const result = await generateOfferFromEmail(selectedEmail.body);
            if (result.success && result.data) {
                setAiProposal(result.data);
            } else {
                alert(`❌ AI Greška: ${result.error}`);
            }
        } catch (error: any) {
            console.error('AI Offer generation error:', error);
            alert('❌ Došlo je do greške pri radu AI asistenta.');
        } finally {
            setIsLoadingAIOffer(false);
        }
    };

    const handleSendAIOffer = async (text: string) => {
        if (!selectedEmail) return;

        setIsSending(true);
        try {
            const result = await sendEmailViaSmtp({
                from: activeAccount.email,
                to: selectedEmail.senderEmail,
                subject: `Re: ${selectedEmail.subject}`,
                body: text,
                accountId: selectedAccountId
            });

            const isEnvironmentError = !result.success && result.error && (
                result.error.includes('Supabase') ||
                result.error.includes('Edge Function') ||
                result.error.includes('Failed to fetch')
            );

            if (result.success || isEnvironmentError) {
                // Immediate update
                sendEmail({
                    accountId: selectedAccountId,
                    to: selectedEmail.senderEmail,
                    subject: `Re: ${selectedEmail.subject}`,
                    body: text,
                    sender: activeAccount.name,
                    senderEmail: activeAccount.email
                });

                if (result.success) {
                    alert('✅ Ponuda je uspešno poslata!');
                } else {
                    alert('✅ (Demo Mod) Ponuda sačuvana u folderu "Poslato".');
                }
                setAiProposal(null);
            } else {
                alert(`❌ Greška pri slanju: ${result.error}`);
            }
        } catch (error: any) {
            alert(`❌ Greška: ${error.message}`);
        } finally {
            setIsSending(false);
        }
    };

    const handleTranslate = async (text: string, target: 'sr' | 'en', mode: 'compose' | 'view') => {
        setIsTranslating(true);
        try {
            const result = await translateWithTone(text, target, translationTone);
            if (mode === 'compose') {
                setComposeBody(result);
            } else {
                // For view mode, we update the local object (not persisting to DB)
                const updated = emails.map(e => e.id === selectedEmailId ? { ...e, body: result } : e);
                setEmails(updated);
            }
        } catch (error) {
            console.error('Translation failed:', error);
            alert('❌ Greška prilikom prevoda.');
        } finally {
            setIsTranslating(false);
        }
    };

    return (
        <div
            ref={containerRef}
            className="mail-module-container"
        >
            {/* Sidebar Folder & Account */}
            <div className="mail-folders-bar" style={{ width: sidebarWidth }}>
                {/* Account Switcher */}
                <div className="account-switcher">
                    <button className="current-account" onClick={() => setIsAccountMenuOpen(!isAccountMenuOpen)}>
                        <div className="account-avatar" style={{ background: activeAccount.color }}>
                            {activeAccount.name.charAt(0)}
                        </div>
                        <div className="account-info">
                            <span className="acc-name">{activeAccount.name}</span>
                            <span className="acc-email">{activeAccount.email}</span>
                        </div>
                        <ChevronDown size={14} />
                    </button>

                    {isAccountMenuOpen && (
                        <div className="account-dropdown">
                            {accounts.map(acc => (
                                <button
                                    key={acc.id}
                                    className={`dropdown-item ${selectedAccountId === acc.id ? 'active' : ''}`}
                                    onClick={() => {
                                        setSelectedAccount(acc.id);
                                        setIsAccountMenuOpen(false);
                                        setIsMasterView(false);
                                    }}
                                >
                                    <div className="acc-dot" style={{ background: acc.color }}></div>
                                    <div className="acc-details">
                                        <div className="acc-title">{acc.name}</div>
                                        <div className="acc-sub">{acc.email}</div>
                                    </div>
                                    {selectedAccountId === acc.id && !isMasterView && <Check size={14} color="#3fb950" />}
                                </button>
                            ))}

                            {userLevel >= 6 && (
                                <>
                                    <div className="dropdown-divider"></div>
                                    <button
                                        className={`dropdown-item master-view-btn ${isMasterView ? 'active' : ''}`}
                                        onClick={() => {
                                            setIsMasterView(true);
                                            setIsAccountMenuOpen(false);
                                        }}
                                    >
                                        <Shield size={14} color="var(--accent)" />
                                        <div className="acc-details">
                                            <div className="acc-title">Master View (Svi nalozi)</div>
                                            <div className="acc-sub">Administratorski pristup</div>
                                        </div>
                                        {isMasterView && <Check size={14} color="#3fb950" />}
                                    </button>
                                </>
                            )}

                            <div className="dropdown-divider"></div>
                            <button className="dropdown-item add-acc" onClick={() => setShowAddAccountDialog(true)}>
                                <Plus size={14} /> Dodaj nalog
                            </button>
                        </div>
                    )}
                </div>

                {showAddAccountDialog && (
                    <div className="add-account-dialog-overlay" onClick={() => setShowAddAccountDialog(false)}>
                        <div className="add-account-dialog" onClick={e => e.stopPropagation()}>
                            <h3>Dodaj novi email nalog</h3>
                            <div className="form-group">
                                <label>Ime (npr. Prodaja)</label>
                                <input
                                    type="text"
                                    value={newAccountData.name}
                                    onChange={e => setNewAccountData({ ...newAccountData, name: e.target.value })}
                                    placeholder="Unesite naziv naloga..."
                                />
                            </div>
                            <div className="form-group">
                                <label>Email adresa</label>
                                <input
                                    type="email"
                                    value={newAccountData.email}
                                    onChange={e => setNewAccountData({ ...newAccountData, email: e.target.value })}
                                    placeholder="korisnik@olympic.rs"
                                />
                            </div>
                            <div className="form-group">
                                <label>Boja indikatora</label>
                                <input
                                    type="color"
                                    value={newAccountData.color}
                                    onChange={e => setNewAccountData({ ...newAccountData, color: e.target.value })}
                                />
                            </div>
                            <div className="dialog-actions">
                                <button className="btn-secondary" onClick={() => setShowAddAccountDialog(false)}>Otkaži</button>
                                <button className="btn-primary" onClick={handleAddNewAccount}>Kreiraj</button>
                            </div>
                        </div>
                    </div>
                )}

                <div className="mail-sidebar-actions">
                    <button className="compose-btn-sidebar" onClick={handleCompose}>
                        <Plus size={18} />
                        <span>Nova poruka</span>
                    </button>
                </div>

                <div className="folder-list">
                    <button
                        className={`folder-item ${activeFolder === 'inbox' ? 'active' : ''}`}
                        onClick={() => {
                            setActiveFolder('inbox');
                            setViewMode('list');
                        }}
                    >
                        <Inbox size={18} />
                        <span>Inbox</span>
                        <span className="folder-badge">{emails.filter(e => e.category === 'inbox' && (isMasterView || e.accountId === selectedAccountId)).length}</span>
                    </button>
                    <button
                        className={`folder-item ${activeFolder === 'sent' ? 'active' : ''}`}
                        onClick={() => {
                            setActiveFolder('sent');
                            setViewMode('list');
                        }}
                    >
                        <Send size={18} />
                        <span>Poslato</span>
                    </button>
                    <button
                        className={`folder-item ${activeFolder === 'drafts' ? 'active' : ''}`}
                        onClick={() => {
                            setActiveFolder('drafts');
                            setViewMode('list');
                        }}
                    >
                        <Mail size={18} />
                        <span>Drafts</span>
                        {emails.filter(e => e.category === 'drafts' && (isMasterView || e.accountId === selectedAccountId)).length > 0 && (
                            <span className="folder-badge gray">{emails.filter(e => e.category === 'drafts' && (isMasterView || e.accountId === selectedAccountId)).length}</span>
                        )}
                    </button>
                    <button
                        className={`folder-item ${activeFolder === 'trash' ? 'active' : ''}`}
                        onClick={() => {
                            setActiveFolder('trash');
                            setViewMode('list');
                        }}
                    >
                        <Trash2 size={18} />
                        <span>Obrisano</span>
                        {emails.filter(e => e.category === 'trash').length > 0 && (
                            <span className="folder-badge gray">{emails.filter(e => e.category === 'trash').length}</span>
                        )}
                    </button>
                </div>

                <div className="folder-label">LABELI</div>
                <div className="label-list">
                    <div className="label-item"><span className="label-dot hitno"></span> Hitno</div>
                    <div className="label-item"><span className="label-dot ponude"></span> Ponude</div>
                    <div className="label-item"><span className="label-dot partneri"></span> Partneri</div>
                </div>

                <div className="mail-sidebar-footer">
                    <button className="ai-rules-btn-sidebar" onClick={() => setShowAIRules(true)} title="AI Mail Rules">
                        <Sparkles size={18} />
                        <span>AI Pravila</span>
                    </button>
                    <button className="settings-btn-sidebar" onClick={handleOpenSettings} title="Email Podešavanja">
                        <Settings size={18} />
                        <span>Podešavanja</span>
                    </button>
                </div>
            </div>

            <div className="resizer" onMouseDown={startResizingSidebar} />

            {viewMode === 'list' ? (
                <>
                    {/* Email List */}
                    <div className="email-list-panel" style={{ width: listWidth }}>
                        <div className="list-header">
                            <div className="search-box">
                                <Search size={16} />
                                <input
                                    type="text"
                                    placeholder="Pretraži poruke..."
                                    value={searchText}
                                    onChange={(e) => setSearchText(e.target.value)}
                                />
                            </div>
                            <button
                                className="filter-btn"
                                onClick={handleFetchEmails}
                                disabled={isFetching}
                                title="Preuzmi nove poruke"
                            >
                                {isFetching ? <Loader2 size={16} className="spin" /> : <RefreshCw size={16} />}
                            </button>
                            <button className="filter-btn"><Filter size={16} /></button>
                        </div>

                        <div className="email-items">
                            {filteredEmails.length > 0 ? filteredEmails.map(email => (
                                <div
                                    key={email.id}
                                    className={`email-item ${selectedEmailId === email.id ? 'active' : ''} ${email.isUnread ? 'unread' : ''}`}
                                    onClick={() => {
                                        setSelectedEmailId(email.id);
                                        if (email.isUnread) updateEmail(email.id, { isUnread: false });
                                    }}
                                >
                                    <div className="item-top">
                                        <span className="sender">{email.sender}</span>
                                        <span className="time">{email.time}</span>
                                    </div>
                                    <div className="item-subject">{email.subject}</div>
                                    <div className="item-preview">{email.preview}</div>
                                    {email.isStarred && <Star size={14} className="star-icon" fill="currentColor" />}
                                    {isMasterView && <div className="acc-indicator" style={{ background: accounts.find(a => a.id === email.accountId)?.color }}></div>}
                                </div>
                            )) : (
                                <div className="empty-box">Nema poruka u ovom folderu</div>
                            )}
                        </div>
                    </div>

                    <div className="resizer" onMouseDown={startResizingList} />

                    {/* Email View */}
                    <div className="email-view-panel">
                        {selectedEmail ? (
                            <>
                                <div className="view-header">
                                    <div className="view-actions">
                                        {activeFolder === 'trash' ? (
                                            <button className="restore-btn-action" title="Vrati poruku" onClick={() => handleRestore(selectedEmail.id)}>
                                                <RotateCcw size={18} /> Vrati u Inbox
                                            </button>
                                        ) : (
                                            <>
                                                <button title="Reply" onClick={() => handleReply(selectedEmail)}><Reply size={18} /></button>
                                                <button title="Forward" onClick={() => handleForward(selectedEmail)}><Forward size={18} /></button>

                                                <div className="v-divider"></div>

                                                <button
                                                    className="ai-magic-btn-main"
                                                    title="Kreiraj AI ponudu"
                                                    onClick={handleCreateAIOffer}
                                                    disabled={isLoadingAIOffer}
                                                >
                                                    {isLoadingAIOffer ? <Loader2 size={18} className="spin" /> : <Sparkles size={18} />}
                                                    <span>Kreiraj ponudu</span>
                                                </button>

                                                <div className="v-divider"></div>

                                                <button title="Archive" onClick={() => {
                                                    updateEmail(selectedEmail.id, { category: 'archive' });
                                                    setSelectedEmailId(null);
                                                }}><Archive size={18} /></button>
                                                <button title="Delete" onClick={() => handleDelete(selectedEmail.id)}><Trash2 size={18} /></button>
                                            </>
                                        )}
                                        <div className="spacer"></div>
                                        <button title="More"><MoreVertical size={18} /></button>
                                    </div>
                                </div>
                                <div className="view-content">
                                    <div className="view-meta-badges">
                                        {isMasterView && (
                                            <span className="master-acc-tag" style={{ background: accounts.find(a => a.id === selectedEmail.accountId)?.color + '22', color: accounts.find(a => a.id === selectedEmail.accountId)?.color }}>
                                                {accounts.find(a => a.id === selectedEmail.accountId)?.name}
                                            </span>
                                        )}
                                    </div>
                                    <h2 className="content-subject">{selectedEmail.subject}</h2>
                                    <div className="sender-info">
                                        <div className="sender-avatar" style={{ background: accounts.find(a => a.id === selectedEmail.accountId)?.color }}>
                                            {selectedEmail.sender.charAt(0)}
                                        </div>
                                        <div className="sender-details">
                                            <div className="sender-name">{selectedEmail.sender}</div>
                                            <div className="sender-email">&lt;{selectedEmail.senderEmail}&gt;</div>
                                        </div>
                                        <div className="content-time">
                                            <Clock size={14} /> {selectedEmail.time}
                                        </div>
                                    </div>
                                    <div className="content-body">
                                        {selectedEmail.body.split('\n').map((line, i) => (
                                            <p key={i}>{line}</p>
                                        ))}
                                    </div>

                                    {activeFolder !== 'trash' && (
                                        <div className="mail-ai-tools-panel">
                                            <div className="ai-translation-bar">
                                                <div className="translator-header">
                                                    <Languages size={16} color="var(--accent)" />
                                                    <span>AI Prevod & Ton</span>
                                                </div>
                                                <div className="tone-selector-mini">
                                                    <button
                                                        className={translationTone === 'formal' ? 'active' : ''}
                                                        onClick={() => setTranslationTone('formal')}
                                                    >Formalan</button>
                                                    <button
                                                        className={translationTone === 'informal' ? 'active' : ''}
                                                        onClick={() => setTranslationTone('informal')}
                                                    >Manje formalan</button>
                                                    <button
                                                        className={translationTone === 'friendly' ? 'active' : ''}
                                                        onClick={() => setTranslationTone('friendly')}
                                                    >Drugarski</button>
                                                </div>
                                                <div className="translation-actions">
                                                    <button
                                                        className="ai-tiny-btn"
                                                        onClick={() => handleTranslate(selectedEmail.body, 'sr', 'view')}
                                                        disabled={isTranslating}
                                                    >
                                                        {isTranslating ? <Loader2 size={12} className="spin" /> : 'SR'}
                                                    </button>
                                                    <button
                                                        className="ai-tiny-btn"
                                                        onClick={() => handleTranslate(selectedEmail.body, 'en', 'view')}
                                                        disabled={isTranslating}
                                                    >
                                                        {isTranslating ? <Loader2 size={12} className="spin" /> : 'EN'}
                                                    </button>
                                                </div>
                                            </div>

                                            <div className="ai-suggestion-mail-active">
                                                <div className="ai-header">
                                                    <div className="ai-title">
                                                        <Sparkles size={16} color="var(--accent)" />
                                                        <span>AI Ponuda Asistent</span>
                                                    </div>
                                                    <div className="ai-badge">Agentic</div>
                                                </div>
                                                <p>Pusti AI da proanalizira upit, pretraži bazu ponuda i sastavi profesionalan odgovor.</p>
                                                <div className="ai-actions">
                                                    <button
                                                        className="ai-gen-btn"
                                                        onClick={handleCreateAIOffer}
                                                        disabled={isLoadingAIOffer}
                                                    >
                                                        {isLoadingAIOffer ? (
                                                            <><Loader2 size={16} className="spin" /> Analiziram upit...</>
                                                        ) : (
                                                            <><Wand2 size={16} /> Kreiraj AI ponudu</>
                                                        )}
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </>
                        ) : (
                            <div className="no-selection">
                                <Mail size={48} opacity={0.2} />
                                <p>Izaberite poruku za prikaz</p>
                            </div>
                        )}
                    </div>
                </>
            ) : viewMode === 'compose' ? (
                /* Classic Outlook Compose Form */
                <div className="outlook-compose-container">
                    <div className="compose-top-bar">
                        <div className="compose-title">
                            <Mail size={16} /> Nova poruka
                        </div>
                        <div className="compose-win-actions">
                            <button onClick={() => setViewMode('list')}><Maximize2 size={14} /></button>
                            <button onClick={() => setViewMode('list')}>&times;</button>
                        </div>
                    </div>

                    <div className="compose-toolbar-main">
                        <button
                            className="btn-primary-send"
                            onClick={handleSend}
                            disabled={isSending}
                        >
                            {isSending ? <Loader2 size={16} className="spin" /> : <Send size={16} />}
                            {isSending ? ' Šaljem...' : ' Pošalji'}
                        </button>
                        <button className="btn-toolbar"><Paperclip size={16} /> Priloži</button>
                        <button className="btn-toolbar"><ImageIcon size={16} /> Slika</button>
                        <div className="toolbar-divider"></div>
                        <button className="btn-toolbar" onClick={() => setViewMode('list')}><Trash2 size={16} /> Odbaci</button>

                        <div className="compose-ai-tool-group">
                            <Languages size={16} className="ai-icon" />
                            <div className="tone-selector-mini">
                                <button
                                    className={translationTone === 'formal' ? 'active' : ''}
                                    onClick={() => setTranslationTone('formal')}
                                >Formalan</button>
                                <button
                                    className={translationTone === 'informal' ? 'active' : ''}
                                    onClick={() => setTranslationTone('informal')}
                                >Manje formalan</button>
                                <button
                                    className={translationTone === 'friendly' ? 'active' : ''}
                                    onClick={() => setTranslationTone('friendly')}
                                >Drugarski</button>
                            </div>
                            <button
                                className="ai-action-btn"
                                onClick={() => handleTranslate(composeBody, 'sr', 'compose')}
                                disabled={isTranslating}
                            >
                                {isTranslating ? <Loader2 size={12} className="spin" /> : 'AI SR'}
                            </button>
                            <button
                                className="ai-action-btn"
                                onClick={() => handleTranslate(composeBody, 'en', 'compose')}
                                disabled={isTranslating}
                            >
                                {isTranslating ? <Loader2 size={12} className="spin" /> : 'AI EN'}
                            </button>
                        </div>
                    </div>

                    <div className="compose-fields-outlook">
                        <div className="field-row">
                            <span className="field-label">Prima:</span>
                            <input
                                type="text"
                                placeholder="email@primera.com"
                                value={composeTo}
                                onChange={(e) => setComposeTo(e.target.value)}
                            />
                            <span className="field-action">Cc</span>
                            <span className="field-action">Bcc</span>
                        </div>
                        <div className="field-row">
                            <span className="field-label">Naslov:</span>
                            <input
                                type="text"
                                placeholder="Unesite naslov poruke"
                                value={composeSubject}
                                onChange={(e) => setComposeSubject(e.target.value)}
                            />
                        </div>
                        <div className="field-row">
                            <span className="field-label">Nalog:</span>
                            <select value={selectedAccountId} onChange={(e) => setSelectedAccount(e.target.value)}>
                                {accounts.map(a => <option key={a.id} value={a.id}>{a.email}</option>)}
                            </select>
                        </div>
                    </div>

                    {/* Rich Text Mock Toolbar */}
                    <div className="rich-text-toolbar">
                        <select className="font-select"><option>Segoe UI</option><option>Arial</option></select>
                        <select className="size-select"><option>11</option><option>12</option></select>
                        <div className="toolbar-section">
                            <button><Bold size={14} /></button>
                            <button><Italic size={14} /></button>
                            <button><Underline size={14} /></button>
                        </div>
                        <div className="toolbar-section">
                            <button><List size={14} /></button>
                            <button><ListOrdered size={14} /></button>
                        </div>
                        <div className="toolbar-section">
                            <button><LinkIcon size={14} /></button>
                            <button><Smile size={14} /></button>
                        </div>
                    </div>

                    <div className="compose-editor-area">
                        <div className="outlook-editor-inner">
                            <textarea
                                className="outlook-textarea"
                                placeholder="Poštovani,..."
                                value={composeBody}
                                onChange={(e) => setComposeBody(e.target.value)}
                            ></textarea>
                            <div className="editor-signature">
                                <div className="signature-divider"></div>
                                <pre>{activeAccount.signature}</pre>
                            </div>
                        </div>
                    </div>

                    <div className="compose-info-bar">
                        <span>HTML Format</span>
                        <span>Normalan prioritet</span>
                    </div>
                </div>
            ) : (
                /* Settings View for Signature */
                <div className="mail-settings-container">
                    <div className="settings-header">
                        <h2>Email Podešavanja</h2>
                        <button className="close-btn" onClick={() => setViewMode('list')}>&times;</button>
                    </div>
                    <div className="settings-content">
                        <div className="settings-section">
                            <h3>Vaš Potpis (Signature)</h3>
                            <p className="section-desc">Podešavanje potpisa za nalog: <strong>{activeAccount.email}</strong></p>
                            <textarea
                                className="signature-editor"
                                value={signatureEdit}
                                onChange={(e) => setSignatureEdit(e.target.value)}
                                placeholder="Unesite vaš potpis..."
                            ></textarea>
                            <div className="settings-actions">
                                <button className="save-btn" onClick={handleSaveSignature}>Sačuvaj Potpis</button>
                                <button className="cancel-btn" onClick={() => setViewMode('list')}>Otkaži</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Email Configuration Modal */}
            {showConfigModal && (
                <EmailConfigModal
                    accountId={selectedAccountId}
                    accountEmail={activeAccount.email}
                    onClose={() => setShowConfigModal(false)}
                    onSaved={() => {
                        // Refresh accounts if needed
                    }}
                />
            )}

            {aiProposal && (
                <AIOfferModal
                    proposal={aiProposal}
                    onClose={() => setAiProposal(null)}
                    onSend={handleSendAIOffer}
                />
            )}

            {showAIRules && (
                <AIMailRules onClose={() => setShowAIRules(false)} />
            )}
        </div>
    );
};

export default OlympicMail;
