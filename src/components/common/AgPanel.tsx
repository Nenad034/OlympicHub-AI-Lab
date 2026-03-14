import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence, useDragControls } from 'framer-motion';
import { 
  X, 
  Send, 
  Terminal, 
  Cpu, 
  FileText, 
  History as HistoryIcon, 
  Zap,
  ChevronRight,
  Code,
  ChevronLeft,
  Github,
  Database,
  Cloud,
  Rocket,
  CheckCircle2,
  Loader2,
  Network,
  Paperclip,
  ArrowUpCircle,
  ArrowDownCircle,
  RefreshCw,
  Plus,
  Minus,
  ExternalLink,
  GripHorizontal
} from 'lucide-react';
import { useAppStore } from '../../stores';
import { useToast } from '../../components/ui/Toast';
import './AgPanel.css';

export const AgPanel: React.FC = () => {
  const { isAgOpen, setAgOpen } = useAppStore();
  const toast = useToast();
  const dragControls = useDragControls();
  const [messages, setMessages] = useState<{ role: 'user' | 'agent'; content: string; files?: string[] }[]>([
    { role: 'agent', content: 'Inicijalizovan **AG Core**. Spreman sam za rad na kodu i dokumentima.' }
  ]);
  const [input, setInput] = useState('');
  const [width, setWidth] = useState(450);
  const [isResizing, setIsResizing] = useState(false);
  const [isCodeMode, setIsCodeMode] = useState(false);
  const [isDeployExpanded, setIsDeployExpanded] = useState(false);
  const [isFloating, setIsFloating] = useState(false);
  const [cloudStatus, setCloudStatus] = useState<Record<string, 'idle' | 'loading' | 'done'>>({
    'github-push': 'idle',
    'github-pull': 'idle',
    'supabase-sync': 'idle',
    'gcloud-push': 'idle',
    'gcloud-pull': 'idle'
  });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const startResizing = (e: React.MouseEvent) => {
    setIsResizing(true);
    e.preventDefault();
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      const newWidth = window.innerWidth - e.clientX;
      if (newWidth > 400 && newWidth < window.innerWidth * 0.8) {
        setWidth(newWidth);
      }
    };
    const handleMouseUp = () => setIsResizing(false);

    if (isResizing) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing]);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isAgOpen) {
      scrollToBottom();
    }
  }, [isAgOpen, messages]);

  if (!isAgOpen) return null;

  const handleSend = () => {
    if (!input.trim()) return;
    setMessages([...messages, { role: 'user', content: input }]);
    setInput('');
    
    // Simulate thinking & Code change
    setTimeout(() => {
      if (input.toLowerCase().includes('kod') || input.toLowerCase().includes('napravi')) {
        setIsCodeMode(true);
      }
      setMessages(prev => [...prev, { 
        role: 'agent', 
        content: `Analiziram zahtev. ${input.toLowerCase().includes('kod') ? 'Pripremam izmene u kodu...' : 'Spreman za obradu dokumenata.'}` 
      }]);
    }, 1000);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
      setMessages([...messages, { 
        role: 'user', 
        content: `Poslat fajl: ${files[0].name}`,
        files: [files[0].name]
      }]);
      // Simulation of AI processing the file
      setTimeout(() => {
        setMessages(prev => [...prev, { 
          role: 'agent', 
          content: `Pročitao sam dokument **${files[0].name}**. Vidim podatke o dobavljaču i iznosima. Da li da ih unesem u sistem?` 
        }]);
      }, 1500);
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const text = e.clipboardData.getData('text');
    if (text && !input) {
      // If input is empty and we paste, maybe it's a large block of code/text
      setInput(text);
    }
  };
  const handleCloudAction = (service: string, action: 'push' | 'pull' | 'sync') => {
    const key = `${service}-${action}`;
    setCloudStatus(prev => ({ ...prev, [key]: 'loading' }));
    
    setMessages(prev => [...prev, { 
      role: 'agent', 
      content: `Izvršavam **${action.toUpperCase()}** na **${service.toUpperCase()}**...` 
    }]);

    setTimeout(() => {
      setCloudStatus(prev => ({ ...prev, [key]: 'done' }));
      
      const hasChanges = action === 'pull' || action === 'sync' || Math.random() > 0.5;
      
      setMessages(prev => [...prev, { 
        role: 'agent', 
        content: `✅ **${service.toUpperCase()} ${action.toUpperCase()}** uspešno završen. ${hasChanges ? '\n\n**Otkrivene su promene u kodu.** Preporučujem da pregledate novi Pull Request.' : ''}` 
      }]);

      if (hasChanges) {
        toast.info(
          `AG Notification: ${service.toUpperCase()} Changes`, 
          `Otkrivene su nove promene nakon ${action} akcije. Proverite Artifacts panel.`
        );
      } else {
        toast.success(`AG System: ${service.toUpperCase()} ${action} ok`);
      }

      // Reset status after a while
      setTimeout(() => setCloudStatus(prev => ({ ...prev, [key]: 'idle' })), 3000);
    }, 2500);
  };

  const handleToggleFloating = () => {
    const isEnteringFloating = !isFloating;
    setIsFloating(isEnteringFloating);
    
    if (isEnteringFloating) {
      // Triple the width when floating, but keep it within 95% of screen width
      const tripledWidth = Math.min(width * 3, window.innerWidth * 0.95);
      setWidth(tripledWidth);
    } else {
      // Restore sidebar width (1/3 of floating)
      setWidth(Math.max(450, Math.floor(width / 3)));
    }
  };

  const handleSystemCheck = () => {
    setMessages(prev => [...prev, { 
      role: 'agent', 
      content: '🚀 Pokrećem **AG System Check**...' 
    }]);

    setTimeout(() => {
      toast.info('AG Diagnostics', 'Provera svih modula: OK. Cloud veze: Stabilne.');
      setMessages(prev => [...prev, { 
        role: 'agent', 
        content: `**AG Status Report:**
- **UI Architecture:** Resizable & Detachable (3x Scale active)
- **Cloud Matrix:** GitHub (Push/Pull), Supabase (Sync), G-Cloud (Push/Pull)
- **Deployment Hub:** Collapsible & Reactive
- **Notifications:** Integrated & Testing OK

Sistem je 100% operativan.` 
      }]);
    }, 1500);
  };
  return (
    <AnimatePresence>
      <motion.div 
        className="ag-panel-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={() => setAgOpen(false)}
      >
        <motion.div 
          className={`ag-panel-container ${isFloating ? 'floating' : ''}`}
          style={{ width: `${width}px` }}
          initial={isFloating ? { scale: 0.9, opacity: 0 } : { x: 450, opacity: 0 }}
          animate={{ x: 0, y: 0, scale: 1, opacity: 1 }}
          exit={isFloating ? { scale: 0.9, opacity: 0 } : { x: width, opacity: 0 }}
          drag={isFloating}
          dragControls={dragControls}
          dragListener={false}
          dragMomentum={false}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          onClick={(e) => e.stopPropagation()}
          onPaste={handlePaste}
        >
          {/* Resize Handle */}
          <div className="ag-resize-handle" onMouseDown={startResizing}>
            <div className="ag-resize-bar" />
          </div>

          {/* Floating Drag Handle */}
          {isFloating && (
            <div 
              className="ag-floating-drag-bar" 
              onPointerDown={(e) => dragControls.start(e)}
              style={{ touchAction: 'none' }}
            >
              <GripHorizontal size={16} />
              <span>Draggable Agent Window</span>
            </div>
          )}

          {/* Header */}
          <div className="ag-panel-header">
            <div className="ag-header-title">
              <div className="ag-network-logo">
                <Network size={22} className="ag-net-anim" />
                <motion.div 
                  className="ag-net-dot"
                  animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
              </div>
              <h3>AG Control</h3>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button 
                className={`ag-tool-btn ${isFloating ? 'active' : ''}`}
                onClick={handleToggleFloating}
                title={isFloating ? "Attach to Sidebar" : "Detach to Floating Window"}
              >
                <ExternalLink size={18} />
              </button>
              <button 
                className={`ag-tool-btn ${isCodeMode ? 'active' : ''}`}
                onClick={() => setIsCodeMode(!isCodeMode)}
                title="Toggle Code View"
              >
                <Code size={18} />
              </button>
              <button className="ag-close-btn" onClick={() => setAgOpen(false)}>
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Quick Stats / Context Bar */}
          <div className="ag-context-bar">
            <div className="ag-context-item">
              <Terminal size={14} />
              <span>System: Ready</span>
            </div>
            <div className="ag-context-item">
              <Cpu size={14} />
              <span>Gemini Pro: Active</span>
            </div>
            <div className="ag-context-item">
              <Zap size={14} />
              <span>Phase: 1</span>
            </div>
          </div>

          {/* Chat Body & Artifacts Viewer */}
          <div className="ag-main-content">
            <div className={`ag-chat-scroll-area ${isCodeMode ? 'split-view' : ''}`}>
              <div className="ag-chat-body">
                {messages.map((msg, idx) => (
                  <motion.div 
                    key={idx}
                    className={`ag-message ${msg.role}`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <div className="ag-message-icon">
                      {msg.role === 'agent' ? <Network size={14} className="ag-agent-net-icon" /> : <div className="user-icon">U</div>}
                    </div>
                    <div className="ag-message-content">
                      {msg.content}
                      {msg.files && (
                        <div className="ag-attached-files">
                          {msg.files.map(f => (
                            <div key={f} className="ag-file-chip"><Paperclip size={12} /> {f}</div>
                          ))}
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
                <div ref={chatEndRef} />
              </div>

              {isCodeMode && (
                <div className="ag-artifacts-viewer">
                  <div className="artifact-header">
                    <Terminal size={14} />
                    <span>Real-time Implementation Plan</span>
                  </div>
                  <div className="artifact-content">
                    <div className="code-block">
                      <div className="code-line added">+ // AG is writing code here...</div>
                      <div className="code-line added">+ export const NewModule = () =&gt; &#123;</div>
                      <div className="code-line">    return &lt;div&gt;New AG Module&lt;/div&gt;;</div>
                      <div className="code-line">&#125;;</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions & Deployment Hub */}
          <div className="ag-bottom-dock">
            <div className="ag-deploy-hub">
              <div 
                className="deploy-header-toggle" 
                onClick={() => setIsDeployExpanded(!isDeployExpanded)}
                style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
              >
                <div className="deploy-label">Deployment Hub (Push & Pull)</div>
                {isDeployExpanded ? <Minus size={14} className="toggle-icon" /> : <Plus size={14} className="toggle-icon" />}
              </div>
              
              <AnimatePresence>
                {isDeployExpanded && (
                  <motion.div 
                    className="deploy-matrix"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    style={{ overflow: 'hidden', marginTop: '12px' }}
                  >
                    {/* GitHub Row */}
                    <div className="cloud-row">
                      <div className="cloud-service">
                        <Github size={14} />
                        <span>GitHub</span>
                      </div>
                      <div className="cloud-actions">
                        <button 
                          className={`cloud-btn ${cloudStatus['github-pull']}`}
                          onClick={() => handleCloudAction('github', 'pull')}
                          disabled={cloudStatus['github-pull'] === 'loading'}
                        >
                          {cloudStatus['github-pull'] === 'loading' ? <Loader2 size={12} className="spin" /> : <ArrowDownCircle size={12} />}
                          Pull
                        </button>
                        <button 
                          className={`cloud-btn ${cloudStatus['github-push']}`}
                          onClick={() => handleCloudAction('github', 'push')}
                          disabled={cloudStatus['github-push'] === 'loading'}
                        >
                          {cloudStatus['github-push'] === 'loading' ? <Loader2 size={12} className="spin" /> : <ArrowUpCircle size={12} />}
                          Push
                        </button>
                      </div>
                    </div>

                    {/* Supabase Row */}
                    <div className="cloud-row">
                      <div className="cloud-service">
                        <Database size={14} />
                        <span>Supabase</span>
                      </div>
                      <div className="cloud-actions">
                        <button 
                          className={`cloud-btn ${cloudStatus['supabase-sync']}`}
                          onClick={() => handleCloudAction('supabase', 'sync')}
                          disabled={cloudStatus['supabase-sync'] === 'loading'}
                          style={{ flex: 1 }}
                        >
                          {cloudStatus['supabase-sync'] === 'loading' ? <Loader2 size={12} className="spin" /> : <RefreshCw size={12} />}
                          Sync Schema
                        </button>
                      </div>
                    </div>

                    {/* G-Cloud Row */}
                    <div className="cloud-row">
                      <div className="cloud-service">
                        <Cloud size={14} />
                        <span>G-Cloud</span>
                      </div>
                      <div className="cloud-actions">
                        <button 
                          className={`cloud-btn ${cloudStatus['gcloud-pull']}`}
                          onClick={() => handleCloudAction('gcloud', 'pull')}
                          disabled={cloudStatus['gcloud-pull'] === 'loading'}
                        >
                          {cloudStatus['gcloud-pull'] === 'loading' ? <Loader2 size={12} className="spin" /> : <ArrowDownCircle size={12} />}
                          Pull
                        </button>
                        <button 
                          className={`cloud-btn ${cloudStatus['gcloud-push']}`}
                          onClick={() => handleCloudAction('gcloud', 'push')}
                          disabled={cloudStatus['gcloud-push'] === 'loading'}
                        >
                          {cloudStatus['gcloud-push'] === 'loading' ? <Loader2 size={12} className="spin" /> : <ArrowUpCircle size={12} />}
                          Push
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="ag-quick-actions">
              <button className="ag-action-btn" onClick={handleSystemCheck}>
                <Zap size={14} />
                <span>Proveri sistem</span>
              </button>
              <button className="ag-action-btn">
                <FileText size={14} />
                <span>Analiziraj profakturu</span>
              </button>
              <button className="ag-action-btn">
                <HistoryIcon size={14} />
                <span>Istorija izmena</span>
              </button>
            </div>
          </div>

          {/* Input Area */}
          <div className="ag-input-container">
            <input type="file" ref={fileInputRef} style={{ display: 'none' }} onChange={handleFileUpload} />
            <button className="ag-icon-btn" onClick={() => fileInputRef.current?.click()}>
              <Paperclip size={20} />
            </button>
            <input 
              type="text" 
              placeholder="Postavite pitanje, pošaljite fajl ili nalepite kôd..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            />
            <button className="ag-send-btn" onClick={handleSend}>
              <Send size={18} />
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
