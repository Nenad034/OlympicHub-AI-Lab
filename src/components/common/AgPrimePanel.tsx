import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Send, 
  Terminal, 
  Cpu, 
  Layers, 
  Layout, 
  Zap, 
  Sun, 
  Moon, 
  Mic, 
  Volume2, 
  Eye, 
  Code, 
  Globe, 
  ShieldCheck,
  Search,
  Box,
  Share2,
  Settings as SettingsIcon,
  ChevronRight,
  LayoutGrid,
  TrendingUp,
  TrendingDown,
  Sparkles,
  ClipboardList,
  Mail,
  MessageCircle,
  Instagram,
  Smartphone,
  ExternalLink
} from 'lucide-react';
import { useAppStore, useThemeStore } from '../../stores';
import { AG_APP_KNOWLEDGE } from '../../constants/agKnowledge';
import { agPrimeService, type AgPrimeLog } from '../../services/agPrimeService';
import './AgPrimePanel.css';

export const AgPrimePanel: React.FC = () => {
  const { isAgOpen, setAgOpen } = useAppStore();
  const { theme } = useThemeStore();
  const [messages, setMessages] = useState<{ role: 'user' | 'agent', content: string }[]>([]);
  const [input, setInput] = useState('');
  const [activeModule, setActiveModule] = useState('Dashboard');
  const [expandedModules, setExpandedModules] = useState<string[]>([]);
  const [isPreviewMode, setIsPreviewMode] = useState(true);
  const [labViewMode, setLabViewMode] = useState<'default' | 'today_reservations' | 'dynamic_report'>('default');
  const [reportTitle, setReportTitle] = useState('');
  const [reportData, setReportData] = useState<any[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);

  // Load History and Start Session
  useEffect(() => {
    if (isAgOpen) {
      const initAG = async () => {
        const sessionId = await agPrimeService.startSession(activeModule);
        setCurrentSessionId(sessionId);

        const history = await agPrimeService.getRecentLogs();
        if (history.length > 0) {
          const formatted = history.map(log => [
            { role: 'user' as const, content: log.user_prompt },
            { role: 'agent' as const, content: log.ai_response }
          ]).flat();
          setMessages(formatted);
        } else {
          setMessages([
            { role: 'agent', content: `**[${new Date().getDate().toString().padStart(2, '0')}/${(new Date().getMonth() + 1).toString().padStart(2, '0')}/${new Date().getFullYear()} ${new Date().getHours().toString().padStart(2, '0')}:${new Date().getMinutes().toString().padStart(2, '0')}:${new Date().getSeconds().toString().padStart(2, '0')}]** Dobrodošli u **AG Prime Command Center**. Svi sistemi su sinhronizovani.` }
          ]);
        }
      };
      initAG();
    }
  }, [isAgOpen]);
  
  const toggleModule = (id: string, label: string) => {
    setActiveModule(label);
    setLabViewMode('default'); // Reset view on module change
    setExpandedModules(prev => 
      prev.includes(id) ? prev.filter(m => m !== id) : [...prev, id]
    );
  };
  
  // Resizing State
  const [leftWidth, setLeftWidth] = useState(300);
  const [rightWidth, setRightWidth] = useState(350);
  const isResizingLeft = useRef(false);
  const isResizingRight = useRef(false);

  const startResizingLeft = () => { isResizingLeft.current = true; document.body.style.cursor = 'col-resize'; };
  const startResizingRight = () => { isResizingRight.current = true; document.body.style.cursor = 'col-resize'; };
  const stopResizing = () => { 
    isResizingLeft.current = false; 
    isResizingRight.current = false; 
    document.body.style.cursor = 'default'; 
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isResizingLeft.current) {
        setLeftWidth(Math.max(200, Math.min(600, e.clientX)));
      } else if (isResizingRight.current) {
        setRightWidth(Math.max(250, Math.min(600, window.innerWidth - e.clientX)));
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', stopResizing);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', stopResizing);
    };
  }, []);

  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (!isAgOpen) return null;

  const formatMessage = (content: string) => {
    const parts = content.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i}>{part.slice(2, -2)}</strong>;
      }
      return part;
    });
  };

  const handleShare = (platform: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setMessages(prev => [...prev, { 
      role: 'agent', 
      content: `**[${timestamp}]** Protokol za distribuciju pokrenut. Izveštaj za **${activeModule}** je uspešno poslat putem platforme **${platform}**.` 
    }]);
  };

  const renderModulePrototype = () => {
    if (labViewMode === 'dynamic_report') {
      return (
        <div className="lab-prototype">
          <div className="proto-list" style={{ marginTop: 0 }}>
            <div className="proto-list-header" style={{ background: 'linear-gradient(90deg, #f0fdf4, #f0f9ff)', padding: '16px 20px', borderBottom: '2px solid rgba(0,0,0,0.05)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Layout size={18} color="#0369a1" />
                <span style={{ fontWeight: 800, fontSize: '0.85rem', color: '#1e293b', textTransform: 'uppercase', letterSpacing: '1px' }}>
                  {reportTitle || 'UNIVERZALNI IZVEŠTAJ'}
                </span>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                 <div className="share-btn-mini" onClick={() => handleShare('Email')} title="Pošalji na Email"><Mail size={14} /></div>
                 <div className="share-btn-mini" onClick={() => handleShare('WhatsApp')} title="Pošalji na WhatsApp"><MessageCircle size={14} /></div>
                 <div className="share-btn-mini" onClick={() => handleShare('Viber')} title="Pošalji na Viber"><Smartphone size={14} /></div>
                 <div className="share-btn-mini" onClick={() => handleShare('Telegram')} title="Pošalji na Telegram"><Send size={14} /></div>
                 <div className="share-btn-mini" onClick={() => handleShare('Instagram')} title="Pošalji na Instagram"><Instagram size={14} /></div>
              </div>
            </div>
            {reportData.map((item, idx) => (
              <div key={idx} className="proto-item" style={{ borderBottom: '1px solid rgba(0,0,0,0.03)' }}>
                {Object.entries(item).map(([key, value], vIdx) => (
                  <div key={vIdx} className="proto-item-info" style={{ flex: key === 'Label' ? 2 : 1 }}>
                    {vIdx === 0 && <span style={{ fontSize: '0.65rem', color: theme === 'navy' ? '#94a3b8' : '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>{key}</span>}
                    <div className="proto-item-title" style={{ 
                      fontSize: '0.85rem', 
                      color: key === 'Status' ? (theme === 'navy' ? '#4ade80' : '#166534') : (theme === 'navy' ? '#f1f5f9' : '#1e293b'),
                      fontWeight: key === 'Label' ? 700 : 500
                    }}>
                      {value as string}
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
          <div style={{ marginTop: '20px', padding: '15px', background: 'rgba(56, 189, 248, 0.05)', borderRadius: '12px', border: '1px dashed #bae6fd' }}>
            <p style={{ fontSize: '0.75rem', color: '#0369a1', textAlign: 'center', margin: 0 }}>
              <strong>Preporuka AG Prime:</strong> Sistem detektuje visoku efikasnost u ovim parametrima. Da li želite da ovaj prikaz sačuvate kao stalni widget na vašem Dashboardu?
            </p>
          </div>
        </div>
      );
    }

    const isReservations = activeModule.toLowerCase().includes('rezervacije') || activeModule.toLowerCase().includes('bookings') || labViewMode === 'today_reservations';
    
    if (isReservations) {
      return (
        <div className="lab-prototype">
          <div className="proto-grid" style={{ marginBottom: '20px' }}>
            <div className="proto-card" style={{ borderLeft: '4px solid #10b981' }}>
              <div className="proto-label">Današnje Rezervacije</div>
              <div className="proto-value">14</div>
              <div className="proto-trend up">
                <TrendingUp size={14} /> +3 vs Yesterday
              </div>
            </div>
            <div className="proto-card" style={{ borderLeft: '4px solid #38bdf8' }}>
              <div className="proto-label">Real-time Traffic</div>
              <div className="proto-value">852</div>
              <div className="proto-trend up">
                <Sparkles size={14} /> Active sessions
              </div>
            </div>
          </div>
          <div className="proto-list">
            <div className="proto-list-header" style={{ background: 'rgba(56, 189, 248, 0.05)', padding: '12px 20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ClipboardList size={16} color="#38bdf8" />
                <span style={{ fontWeight: 800, fontSize: '0.75rem', letterSpacing: '1px' }}>DANAŠNJI PRIORITETI</span>
              </div>
              <span style={{ color: '#38bdf8', fontSize: '0.7rem', cursor: 'pointer', fontWeight: 700 }}>LIVE SYNC ON</span>
            </div>
            {[
              { id: 'RES-10204', client: 'Jovan Marić', time: '18:45', status: 'Confirmed', amount: '€1.450' },
              { id: 'RES-10205', client: 'Elena Kostov', time: '17:30', status: 'Pending', amount: '€920' },
              { id: 'RES-10206', client: 'Dragan Stojanović', time: '16:15', status: 'Confirmed', amount: '€3.800' },
              { id: 'RES-10207', client: 'Maja Lazić', time: '15:20', status: 'Processing', amount: '€1.100' }
            ].map(item => (
              <div key={item.id} className="proto-item" style={{ borderBottom: '1px solid rgba(0,0,0,0.02)' }}>
                <div className="proto-item-info">
                  <div className="proto-item-title" style={{ fontSize: '0.8rem' }}>{item.client}</div>
                  <div className="proto-item-sub">{item.id} • Primljeno u **{item.time}h**</div>
                </div>
                <div className="status-pills-wrap">
                  <span className={`status-pill ${item.status === 'Confirmed' ? 'success' : item.status === 'Pending' ? 'warning' : 'info'}`}>
                    {item.status}
                  </span>
                  <span style={{ fontWeight: 800, fontSize: '0.8rem', minWidth: '70px', textAlign: 'right' }}>{item.amount}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }

    // Default Prototype for others
    return (
      <div className="lab-prototype">
        <div className="proto-grid">
          <div className="proto-card">
            <div className="proto-label">{activeModule} Status</div>
            <div className="proto-value">OPTIMIZED</div>
            <div className="proto-trend up">
              <Zap size={14} /> Energy efficient sync
            </div>
          </div>
          <div className="proto-card">
            <div className="proto-label">Neural Latency</div>
            <div className="proto-value">12ms</div>
            <div className="proto-trend up">
              <Sparkles size={14} /> Real-time active
            </div>
          </div>
        </div>
        <div className="lab-placeholder" style={{ padding: '40px' }}>
          <Box size={48} className="pulse" />
          <h3>Sistem Spreman</h3>
          <p>Instanciranje modula <strong>{activeModule}</strong> završeno uspešno.</p>
        </div>
      </div>
    );
  };

  const handleSend = async () => {
    if (!input.trim()) return;
    const userMessage = input;
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setInput('');

    // Prime Intelligence Simulation
    setTimeout(async () => {
      const now = new Date();
      const timestamp = `${now.getDate().toString().padStart(2, '0')}/${(now.getMonth() + 1).toString().padStart(2, '0')}/${now.getFullYear()} ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
      
      let response = '';
      let detectedIntent = 'Inquiry';
      const inputLower = userMessage.toLowerCase();
      
      if (inputLower.includes('para') || inputLower.includes('novac') || inputLower.includes('iznos') || inputLower.includes('bruto')) {
        const mockAmount = (Math.random() * 50000 + 5000).toFixed(2);
        response = `**[${timestamp}]** Prema mojim proračunima za modul **${activeModule}**, ukupni bruto iznos za odabrani period iznosi **€${mockAmount}**. Da li želite da uradim dublju analizu po stavkama?`;
        detectedIntent = 'FinancialAnalysis';
      } else if (inputLower.includes('dobavljaci') || inputLower.includes('partneri')) {
        response = `**[${timestamp}]** U okviru modula **${activeModule}** pronalazim vezu sa **4 glavna dobavljača** (Travelgate, Solvex, Amadeus i Sabre). Svi sistemi su stabilni i sinhronizovani.`;
        detectedIntent = 'PartnerInquiry';
      } else if (inputLower.includes('koliko') || inputLower.includes('broj')) {
        const mockCount = Math.floor(Math.random() * 85) + 12;
        response = `**[${timestamp}]** Trenutno u sistemu za modul **${activeModule}** pronalazim **${mockCount}** aktivnih zapisa koji odgovaraju vašem upitu.`;
      } else if (inputLower.includes('prikaži') || inputLower.includes('lista') || inputLower.includes('danas')) {
        setLabViewMode('today_reservations');
        response = `**[${timestamp}]** Naravno. Instanciram **live preview** listu današnjih rezervacija u centralnom Lab panelu. Sinhronizacija sa bazom je završena.`;
        detectedIntent = 'UILabCommand';
      } else if (inputLower.includes('izveštaj') || inputLower.includes('prikaži') || inputLower.includes('napravi') || inputLower.includes('statistika')) {
        const title = inputLower.includes('prodaj') ? 'IZVEŠTAJ PRODAJE' : 
                      inputLower.includes('finansij') ? 'FINANSIJSKI MATRIKS' : 
                      inputLower.includes('kupac') ? 'ANALIZA KUPACA' : 'DISTRIBUCIJA PODATAKA';
        
        setReportTitle(title + ` - ${activeModule.toUpperCase()}`);
        setReportData([
          { Label: 'Glavni Segment', Vrednost: '84%', Status: 'Optimalno', Trend: '+4.2%' },
          { Label: 'Sekundarni Protok', Vrednost: '12%', Status: 'Sinhronizovano', Trend: '+0.5%' },
          { Label: 'Rezervni Kanali', Vrednost: '4%', Status: 'Standby', Trend: '0.0%' }
        ]);
        setLabViewMode('dynamic_report');
        response = `**[${timestamp}]** Komanda primljena. Kreiram **${title}** u realnom vremenu unutar LAB panela. Podaci su filtrirani prema modulu **${activeModule}**.`;
        detectedIntent = 'ReportingCommand';
      } else if (inputLower.includes('analiziraj')) {
        response = `**[${timestamp}]** Analizirao sam vaš zahtev za modul **${activeModule}**. Pripremam vizuelni prototip u centralnom Lab panelu sa ključnim KPIs.`;
        detectedIntent = 'AnalysisRequest';
      } else {
        response = `**[${timestamp}]** Komanda primljena. AG Prime vrši optimizaciju parametara za **${activeModule}** i pretražuje relevantne baze podataka...`;
      }

      setMessages(prev => [...prev, { role: 'agent', content: response }]);

      // Persist to Database if session exists
      if (currentSessionId) {
        await agPrimeService.logInteraction(currentSessionId, userMessage, response, detectedIntent);
      }
    }, 1000);
  };

  return (
    <div className="ag-prime-overlay" onClick={() => setAgOpen(false)}>
      <motion.div 
        className={`ag-prime-container ${theme}`}
        style={{ 
          gridTemplateColumns: `${leftWidth}px 6px 1fr 6px ${rightWidth}px` 
        }}
        onClick={(e) => e.stopPropagation()}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
      >
        {/* LEFT PANEL: SYSTEM ORCHESTRATOR (Swapped to Left) */}
        <aside className="prime-panel system-orchestrator">
          <div className="panel-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Layers size={18} color="#38bdf8" />
              <span style={{ fontWeight: 700, fontSize: '0.8rem', color: '#94a3b8' }}>SYSTEM ORCHESTRATOR</span>
            </div>
            <Search size={14} />
          </div>

          <div className="prime-map-body">
            {/* MAIN OPERATIONS */}
            <h4 style={{ fontSize: '0.65rem', color: '#38bdf8', marginBottom: '16px', marginTop: '10px', textTransform: 'uppercase', letterSpacing: '2px', opacity: 0.8 }}>Main Operations</h4>
            {AG_APP_KNOWLEDGE.filter(m => ['dashboard', 'reservations', 'finances', 'reports'].includes(m.id)).map(m => (
              <div key={m.id} className="module-group">
                <div 
                  className={`system-node ${activeModule === m.label ? 'active' : ''}`}
                  onClick={() => toggleModule(m.id, m.label)}
                >
                  <Box size={14} />
                  <span>{m.label}</span>
                  {m.subItems && (
                     <motion.div
                       animate={{ rotate: expandedModules.includes(m.id) ? 90 : 0 }}
                       style={{ marginLeft: 'auto', display: 'flex' }}
                     >
                       <ChevronRight size={12} />
                     </motion.div>
                  )}
                  {activeModule === m.label && <motion.div layoutId="node-glow" className="node-glow" />}
                </div>

                <AnimatePresence>
                  {m.subItems && expandedModules.includes(m.id) && (
                    <motion.div 
                      className="sub-module-list"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      style={{ overflow: 'hidden' }}
                    >
                      {m.subItems.map(sub => (
                        <div 
                          key={sub.label} 
                          className={`system-node sub-node ${activeModule === sub.label ? 'active' : ''}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveModule(sub.label);
                          }}
                        >
                          <ChevronRight size={10} style={{ opacity: 0.5 }} />
                          <span>{sub.label}</span>
                        </div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}

            {/* ADVANCED INTELLIGENCE (Grouped under All Modules) */}
            <h4 style={{ fontSize: '0.65rem', color: '#f59e0b', marginBottom: '16px', marginTop: '32px', textTransform: 'uppercase', letterSpacing: '2px', opacity: 0.8 }}>Advanced Intelligence</h4>
            {(() => {
              const modulesGroup = AG_APP_KNOWLEDGE.find(m => m.id === 'modules');
              if (!modulesGroup) return null;
              
              const isExpanded = expandedModules.includes('modules_all');

              return (
                <div className="module-group">
                  <div 
                    className={`system-node ${activeModule === modulesGroup.label ? 'active' : ''}`}
                    onClick={() => {
                      setActiveModule(modulesGroup.label);
                      setExpandedModules(prev => 
                        prev.includes('modules_all') ? prev.filter(m => m !== 'modules_all') : [...prev, 'modules_all']
                      );
                    }}
                    style={{ borderLeftColor: activeModule === modulesGroup.label ? '#f59e0b' : 'transparent' }}
                  >
                    <LayoutGrid size={14} color="#f59e0b" style={{ opacity: 0.8 }} />
                    <span style={{ color: '#f59e0b', fontWeight: 600 }}>{modulesGroup.label}</span>
                    <motion.div
                       animate={{ rotate: isExpanded ? 90 : 0 }}
                       style={{ marginLeft: 'auto', display: 'flex' }}
                     >
                       <ChevronRight size={12} color="#f59e0b" />
                     </motion.div>
                    {activeModule === modulesGroup.label && <motion.div layoutId="node-glow" className="node-glow" style={{ background: 'rgba(245, 158, 11, 0.15)' }} />}
                  </div>

                  <AnimatePresence>
                    {isExpanded && modulesGroup.subItems && (
                      <motion.div 
                        className="sub-module-list"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        style={{ overflow: 'hidden', borderLeftColor: 'rgba(245, 158, 11, 0.2)' }}
                      >
                        {modulesGroup.subItems.map(sub => (
                          <div 
                            key={sub.label} 
                            className={`system-node sub-node ${activeModule === sub.label ? 'active' : ''}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveModule(sub.label);
                            }}
                          >
                            <Zap size={10} color="#fbbf24" style={{ opacity: 0.7 }} />
                            <span>{sub.label}</span>
                          </div>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })()}

            {/* BUSINESS SECTORS */}
            <h4 style={{ fontSize: '0.65rem', color: '#818cf8', marginBottom: '16px', marginTop: '32px', textTransform: 'uppercase', letterSpacing: '2px', opacity: 0.8 }}>Business Sectors</h4>
            {AG_APP_KNOWLEDGE.filter(m => !['dashboard', 'reservations', 'finances', 'reports', 'modules', 'settings'].includes(m.id)).map(m => (
              <div key={m.id} className="module-group">
                <div 
                  className={`system-node ${activeModule === m.label ? 'active' : ''}`}
                  onClick={() => toggleModule(m.id, m.label)}
                >
                  <Box size={14} />
                  <span>{m.label}</span>
                  {m.subItems && (
                     <motion.div
                       animate={{ rotate: expandedModules.includes(m.id) ? 90 : 0 }}
                       style={{ marginLeft: 'auto', display: 'flex' }}
                     >
                       <ChevronRight size={12} />
                     </motion.div>
                  )}
                  {activeModule === m.label && <motion.div layoutId="node-glow" className="node-glow" />}
                </div>

                <AnimatePresence>
                  {m.subItems && expandedModules.includes(m.id) && (
                    <motion.div 
                      className="sub-module-list"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      style={{ overflow: 'hidden' }}
                    >
                      {m.subItems.map(sub => (
                        <div 
                          key={sub.label} 
                          className={`system-node sub-node ${activeModule === sub.label ? 'active' : ''}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveModule(sub.label);
                          }}
                        >
                          <ChevronRight size={10} style={{ opacity: 0.5 }} />
                          <span>{sub.label}</span>
                        </div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
            
            {/* SYSTEM CONFIGURATION TIER */}
            <div style={{ marginTop: '32px', paddingBottom: '20px' }}>
              <h4 style={{ fontSize: '0.65rem', color: '#94a3b8', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '2px', opacity: 0.8 }}>Glavna stavka menija</h4>
              
              {/* Podesavanja (Simple Node) */}
              <div 
                className={`system-node ${activeModule === 'Podešavanja' ? 'active' : ''}`}
                onClick={() => toggleModule('settings_root', 'Podešavanja')}
              >
                <SettingsIcon size={14} />
                <span>Podešavanja</span>
              </div>

              {/* Globalne Postavke (Accordion Node) */}
              {(() => {
                const settingsGroup = AG_APP_KNOWLEDGE.find(m => m.id === 'settings');
                const isExpanded = expandedModules.includes('settings_global');
                if (!settingsGroup) return null;

                return (
                  <div className="module-group" style={{ marginTop: '8px' }}>
                    <div 
                      className={`system-node ${activeModule === 'Globalne Postavke' ? 'active' : ''}`}
                      onClick={() => {
                        setActiveModule('Globalne Postavke');
                        setExpandedModules(prev => 
                          prev.includes('settings_global') ? prev.filter(m => m !== 'settings_global') : [...prev, 'settings_global']
                        );
                      }}
                    >
                      <Layers size={14} />
                      <span>Globalne Postavke</span>
                      <motion.div
                         animate={{ rotate: isExpanded ? 90 : 0 }}
                         style={{ marginLeft: 'auto', display: 'flex' }}
                       >
                         <ChevronRight size={12} />
                       </motion.div>
                    </div>

                    <AnimatePresence>
                      {isExpanded && settingsGroup.subItems && (
                        <motion.div 
                          className="sub-module-list"
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                        >
                          {settingsGroup.subItems.map(sub => (
                            <div 
                              key={sub.label} 
                              className={`system-node sub-node ${activeModule === sub.label ? 'active' : ''}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveModule(sub.label);
                              }}
                            >
                              <ChevronRight size={10} style={{ opacity: 0.5 }} />
                              <span>{sub.label}</span>
                            </div>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })()}

              {/* Dnevnik Aktivnosti (Simple Node) */}
              <div 
                className={`system-node ${activeModule === 'Dnevnik Aktivnosti' ? 'active' : ''}`}
                style={{ marginTop: '8px' }}
                onClick={() => toggleModule('activity_log', 'Dnevnik Aktivnosti')}
              >
                <Terminal size={14} />
                <span>Dnevnik Aktivnosti</span>
              </div>
            </div>
          </div>

          <div className="prime-footer" style={{ marginTop: 'auto', padding: '20px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
             <button className="ag-close-btn-prime" onClick={() => setAgOpen(false)} style={{ width: '100%', padding: '10px', borderRadius: '8px', background: '#e11d48', color: 'white', border: 'none', fontWeight: 700, fontSize: '0.75rem', letterSpacing: '1px' }}>
                TERMINATE SESSION
             </button>
          </div>
        </aside>

        {/* LEFT RESIZER */}
        <div className="panel-resizer" onMouseDown={startResizingLeft} />

        {/* CENTER PANEL: THE LAB (VISUAL PREVIEW) */}
        <main className="prime-lab">
          <div className="panel-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div onClick={() => setIsPreviewMode(true)} className={`lab-tab ${isPreviewMode ? 'active' : ''}`}>
                <Eye size={16} /> LIVE PREVIEW
              </div>
              <div onClick={() => setIsPreviewMode(false)} className={`lab-tab ${!isPreviewMode ? 'active' : ''}`}>
                <Code size={16} /> SOURCE
              </div>
            </div>
            <ShieldCheck size={18} color="#10b981" />
          </div>

          <div className="lab-preview-area">
            <AnimatePresence mode="wait">
              {isPreviewMode ? (
                <motion.div 
                  key="preview"
                  className="preview-window"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                >
                  <div className="preview-toolbar">
                    <Globe size={12} /> <span>staging.primeclick.travel / {activeModule.toLowerCase()}</span>
                  </div>
                  <div className="preview-content">
                    {renderModulePrototype()}
                  </div>
                </motion.div>
              ) : (
                <motion.div 
                  key="code"
                  className="source-view"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <pre>
                    <code>{`// AG Prime Real-time Code Sync\nexport const ${activeModule}Mod = () => {\n  return <div>Executing Prime Logic...</div>\n}`}</code>
                  </pre>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </main>

        {/* RIGHT RESIZER */}
        <div className="panel-resizer" onMouseDown={startResizingRight} />

        {/* RIGHT PANEL: ARCHITECT CHAT (Swapped to Right) */}
        <aside className="prime-panel architect-chat">
          <div className="panel-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Cpu size={18} color="#38bdf8" />
              <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>ARCHITECT</span>
            </div>
          </div>
          
          <div className="prime-chat-body">
            {messages.map((m, i) => (
              <div key={i} className={`prime-msg ${m.role}`}>
                <div className="msg-content">{formatMessage(m.content)}</div>
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>

          <div className="prime-input-area">
            <div className="prime-input-wrapper">
              <input 
                type="text" 
                placeholder="Unesite komandu..." 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
              />
              <div className="prime-input-actions">
                <Mic size={16} />
                <Send size={16} onClick={handleSend} />
              </div>
            </div>
          </div>
        </aside>
      </motion.div>
    </div>
  );
};
