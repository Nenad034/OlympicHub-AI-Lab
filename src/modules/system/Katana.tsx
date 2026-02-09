import { useState, useEffect, useRef } from 'react';
import {
    Circle,
    Star,
    Calendar,
    Plus,
    Trash2,
    Sword,
    Sun,
    Layout,
    Search,
    Send,
    Tag,
    LogOut,
    CheckCircle,
    X,
    Bell
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { GeometricBrain } from '../../components/icons/GeometricBrain';
import type { KatanaTask } from '../../stores/katanaStore';
import { useKatanaStore } from '../../stores/katanaStore';

interface Props {
    onBack: () => void;
}

export default function Katana({ onBack }: Props) {
    const { tasks, loadTasks, addTask, updateTask, deleteTask, toggleTask } = useKatanaStore();
    const [input, setInput] = useState('');
    const [aiInput, setAiInput] = useState('');
    const [activeCategory, setActiveCategory] = useState<'daily' | 'planned' | 'general' | 'all'>('all');
    const [selectedTask, setSelectedTask] = useState<KatanaTask | null>(null);
    const [isAiThinking, setIsAiThinking] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        loadTasks();
    }, []);

    const handleAddTask = (text: string, important = false, category: 'daily' | 'planned' | 'general' = 'general') => {
        if (!text.trim()) return;
        addTask(text, important, category);
        setInput('');
    };

    const toggleImportant = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        const task = tasks.find(t => t.id === id);
        if (task) {
            updateTask(id, { important: !task.important });
        }
    };

    const handleDeleteTask = (id: string, e?: React.MouseEvent) => {
        e?.stopPropagation();
        deleteTask(id);
        if (selectedTask?.id === id) setSelectedTask(null);
    };

    const updateTaskDetail = (id: string, field: keyof KatanaTask, value: any) => {
        updateTask(id, { [field]: value });
        if (selectedTask?.id === id) {
            setSelectedTask(prev => prev ? { ...prev, [field]: value } : null);
        }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0] && selectedTask) {
            const fileName = e.target.files[0].name;
            updateTaskDetail(selectedTask.id, 'attachments', [...(selectedTask.attachments || []), fileName]);
        }
    };

    const handleAiSubmit = async () => {
        if (!aiInput.trim()) return;
        setIsAiThinking(true);

        setTimeout(() => {
            const text = aiInput;
            let category: 'daily' | 'planned' | 'general' = 'general';
            let important = false;

            if (text.toLowerCase().includes('hitno') || text.toLowerCase().includes('bitno')) important = true;
            if (text.toLowerCase().includes('danas')) category = 'daily';
            if (text.toLowerCase().includes('planir')) category = 'planned';

            handleAddTask(text.replace(/hitno|danas|planirano/gi, '').trim(), important, category);
            setAiInput('');
            setIsAiThinking(false);
        }, 1200);
    };

    const filteredTasks = tasks.filter(t => {
        if (activeCategory === 'all') return true;
        return t.category === activeCategory;
    });

    const categories = [
        { id: 'all', title: 'Sve Obaveze', icon: <Layout size={18} /> },
        { id: 'daily', title: 'Moj Dan', icon: <Sun size={18} /> },
        { id: 'planned', title: 'Planirano', icon: <Calendar size={18} /> }
    ];

    return (
        <div className="wizard-overlay">
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="wizard-container"
            >
                {/* SIDEBAR NAVIGATION */}
                <div className="wizard-sidebar">
                    <div className="wizard-sidebar-header">
                        <div style={{ background: 'var(--gradient-blue)', width: '36px', height: '36px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Sword size={18} color="#fff" />
                        </div>
                        <div>
                            <h2 style={{ fontSize: '18px', fontWeight: '800' }}>KATANA</h2>
                            <div style={{ fontSize: '9px', color: 'var(--accent)', fontWeight: 800 }}>Task Management</div>
                        </div>
                    </div>

                    <div className="wizard-steps-list">
                        {categories.map((cat) => (
                            <div
                                key={cat.id}
                                className={`step-item-row ${activeCategory === cat.id ? 'active' : ''}`}
                                onClick={() => setActiveCategory(cat.id as any)}
                            >
                                <div className="step-icon-small">
                                    {cat.icon}
                                </div>
                                <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{cat.title}</span>
                                {cat.id === 'all' && tasks.length > 0 && (
                                    <span style={{ marginLeft: 'auto', fontSize: '10px', padding: '2px 6px', borderRadius: '100px', background: 'var(--border)', color: 'var(--text-secondary)' }}>
                                        {tasks.filter(t => !t.completed).length}
                                    </span>
                                )}
                            </div>
                        ))}

                        {/* AI Section Moved Here */}
                        <div style={{ padding: '20px 0', marginTop: '10px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', paddingLeft: '8px' }}>
                                <GeometricBrain size={18} color="#FFD700" />
                                <span style={{ fontSize: '13px', fontWeight: 700 }}>Katana AI</span>
                            </div>
                            <textarea
                                placeholder="Unesi preko AI..."
                                value={aiInput}
                                onChange={e => setAiInput(e.target.value)}
                                style={{ width: '100%', height: '80px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '14px', padding: '12px', fontSize: '12px', color: 'var(--text-primary)', resize: 'none', outline: 'none' }}
                            />
                            <button
                                onClick={handleAiSubmit}
                                disabled={isAiThinking}
                                style={{ width: '100%', marginTop: '10px', padding: '12px', borderRadius: '100px', border: 'none', background: 'var(--gradient-blue)', color: '#fff', fontSize: '12px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                            >
                                {isAiThinking ? 'Razmišljam...' : <><Send size={14} /> Dodaj AI</>}
                            </button>
                        </div>
                    </div>
                </div>

                {/* MAIN CONTENT AREA */}
                <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
                    {/* MAIN CONTENT AREA */}
                    <div className="wizard-main-area">
                        {/* TOPBAR */}
                        <div className="wizard-topbar">
                            <div className="topbar-title">
                                <h3>{categories.find(c => c.id === activeCategory)?.title}</h3>
                                <span className="topbar-subtitle">{new Date().toLocaleDateString('sr-RS', { weekday: 'long', day: 'numeric', month: 'long' })} • {tasks.length} zadataka</span>
                            </div>
                            <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                                <div style={{ position: 'relative', width: '250px' }}>
                                    <Search style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} size={16} />
                                    <input
                                        type="text"
                                        placeholder="Pretraži..."
                                        style={{ width: '100%', padding: '8px 12px 8px 36px', borderRadius: '100px', background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-primary)', outline: 'none', fontSize: '13px' }}
                                    />
                                </div>
                                <button
                                    onClick={onBack}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px',
                                        background: 'var(--bg-card)',
                                        border: '1px solid var(--border)',
                                        padding: '8px 16px',
                                        borderRadius: '100px',
                                        cursor: 'pointer',
                                        color: 'var(--text-primary)',
                                        fontSize: '13px',
                                        fontWeight: 600
                                    }}
                                >
                                    <LogOut size={16} /> Zatvori
                                </button>
                            </div>
                        </div>

                        {/* SCROLLABLE CONTENT */}
                        <div className="wizard-content-wrapper">
                            <div className="content-center-limit">
                                {/* Task Input Box */}
                                <div style={{ background: 'var(--bg-card)', padding: '15px 24px', borderRadius: '24px', border: '1px solid var(--border)', display: 'flex', gap: '15px', alignItems: 'center', boxShadow: '0 10px 30px rgba(0,0,0,0.1)', marginBottom: '30px' }}>
                                    <Plus size={24} color="var(--accent)" />
                                    <input
                                        type="text"
                                        placeholder="Dodaj novi zadatak..."
                                        value={input}
                                        onChange={e => setInput(e.target.value)}
                                        onKeyDown={e => e.key === 'Enter' && handleAddTask(input)}
                                        style={{ flex: 1, background: 'transparent', border: 'none', fontSize: '16px', color: 'var(--text-primary)', outline: 'none' }}
                                    />
                                    <div style={{ display: 'flex', gap: '10px' }}>
                                        <Tag size={20} color="var(--text-secondary)" style={{ cursor: 'pointer' }} />
                                        <Calendar size={20} color="var(--text-secondary)" style={{ cursor: 'pointer' }} />
                                    </div>
                                </div>

                                {/* Task List */}
                                <div ref={scrollRef} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                    <AnimatePresence>
                                        {filteredTasks.map(task => (
                                            <motion.div
                                                key={task.id}
                                                layout
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, scale: 0.95 }}
                                                onClick={() => setSelectedTask(task)}
                                                style={{
                                                    background: selectedTask?.id === task.id ? 'rgba(59, 130, 246, 0.1)' : 'var(--bg-card)',
                                                    padding: '16px 20px',
                                                    borderRadius: '20px',
                                                    border: selectedTask?.id === task.id ? '1px solid var(--accent)' : '1px solid var(--border)',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '15px',
                                                    cursor: 'pointer',
                                                    transition: 'all 0.2s',
                                                    position: 'relative'
                                                }}
                                                className="katana-task-row"
                                            >
                                                <div
                                                    onClick={(e) => { e.stopPropagation(); toggleTask(task.id); }}
                                                    style={{ color: task.completed ? 'var(--accent)' : 'var(--text-secondary)', cursor: 'pointer' }}
                                                >
                                                    {task.completed ? <CheckCircle size={22} /> : <Circle size={22} />}
                                                </div>
                                                <div style={{ flex: 1 }}>
                                                    <div style={{ fontSize: '15px', fontWeight: 600, color: task.completed ? 'var(--text-secondary)' : 'var(--text-primary)', textDecoration: task.completed ? 'line-through' : 'none' }}>
                                                        {task.text}
                                                    </div>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '4px' }}>
                                                        <span style={{ fontSize: '10px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px', textTransform: 'capitalize' }}>
                                                            <Tag size={10} /> {task.category}
                                                        </span>
                                                        {task.text.startsWith('OBAVEZA:') && (
                                                            <span style={{ fontSize: '10px', color: '#FFD700', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                                <Sword size={10} /> Iz Mejl Modula
                                                            </span>
                                                        )}
                                                        {task.note?.includes('PODSETNIK:') && (
                                                            <span style={{ fontSize: '10px', color: 'var(--accent)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                                <Bell size={10} /> Podsetnik
                                                            </span>
                                                        )}
                                                        {task.tags && task.tags.length > 0 && (
                                                            <div style={{ display: 'flex', gap: '4px' }}>
                                                                {task.tags.map(t => (
                                                                    <span key={t} style={{ fontSize: '10px', background: 'rgba(255,255,255,0.1)', padding: '2px 6px', borderRadius: '4px', color: '#94a3b8' }}>#{t}</span>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                                    <motion.button
                                                        whileHover={{ scale: 1.2 }}
                                                        onClick={(e) => toggleImportant(task.id, e)}
                                                        style={{ background: 'none', border: 'none', color: task.important ? '#f59e0b' : 'var(--text-secondary)', cursor: 'pointer' }}
                                                    >
                                                        <Star size={20} fill={task.important ? '#f59e0b' : 'none'} />
                                                    </motion.button>
                                                </div>
                                            </motion.div>
                                        ))}
                                    </AnimatePresence>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* RIGHT SIDEBAR (DETAILS PANEL) */}
                    <AnimatePresence>
                        {selectedTask && (
                            <motion.div
                                initial={{ width: 0, opacity: 0 }}
                                animate={{ width: 350, opacity: 1 }}
                                exit={{ width: 0, opacity: 0 }}
                                style={{
                                    background: 'var(--bg-card)',
                                    borderLeft: '1px solid var(--border)',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    overflow: 'hidden',
                                    flexShrink: 0
                                }}
                            >
                                <div style={{ padding: '24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <h3 style={{ margin: 0, fontSize: '16px' }}>Detalji Zadatka</h3>
                                    <button onClick={() => setSelectedTask(null)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}><LogOut size={16} /></button>
                                </div>

                                <div style={{ padding: '24px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '24px' }}>
                                    {/* Title Edit */}
                                    <div style={{ display: 'flex', gap: '12px' }}>
                                        <div
                                            onClick={() => toggleTask(selectedTask.id)}
                                            style={{ color: selectedTask.completed ? 'var(--accent)' : 'var(--text-secondary)', cursor: 'pointer', marginTop: '4px' }}
                                        >
                                            {selectedTask?.completed ? <CheckCircle size={22} /> : <Circle size={22} />}
                                        </div>
                                        <textarea
                                            value={selectedTask.text}
                                            onChange={(e) => updateTaskDetail(selectedTask.id, 'text', e.target.value)}
                                            style={{
                                                width: '100%', background: 'transparent', border: 'none', color: 'var(--text-primary)',
                                                fontSize: '18px', fontWeight: 600, resize: 'none', outline: 'none', height: 'auto', minHeight: '60px'
                                            }}
                                        />
                                        <div onClick={() => toggleImportant(selectedTask.id, { stopPropagation: () => { } } as any)} style={{ cursor: 'pointer' }}>
                                            <Star size={22} fill={selectedTask.important ? '#f59e0b' : 'none'} color={selectedTask.important ? '#f59e0b' : 'var(--text-secondary)'} />
                                        </div>
                                    </div>

                                    {/* Notepad Section */}
                                    <div>
                                        <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '8px', textTransform: 'uppercase' }}>Beleške</div>
                                        <textarea
                                            placeholder="Dodaj belešku..."
                                            value={selectedTask.note || ''}
                                            onChange={(e) => updateTaskDetail(selectedTask.id, 'note', e.target.value)}
                                            style={{
                                                width: '100%', minHeight: '150px', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border)',
                                                borderRadius: '12px', padding: '12px', color: 'var(--text-primary)', resize: 'vertical', fontSize: '13px'
                                            }}
                                        />
                                    </div>

                                    {/* Hashtags Section */}
                                    <div>
                                        <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '8px', textTransform: 'uppercase' }}>Hashtags</div>
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '8px' }}>
                                            {(selectedTask.tags || []).map(tag => (
                                                <span key={tag} style={{ background: 'rgba(59, 130, 246, 0.2)', color: '#60a5fa', padding: '4px 10px', borderRadius: '100px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                    #{tag}
                                                    <X size={12} style={{ cursor: 'pointer' }} onClick={() => updateTaskDetail(selectedTask.id, 'tags', selectedTask.tags?.filter(t => t !== tag))} />
                                                </span>
                                            ))}
                                        </div>
                                        <div style={{ position: 'relative' }}>
                                            <Tag size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                                            <input
                                                placeholder="Dodaj tag (Enter)"
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') {
                                                        const val = e.currentTarget.value.trim();
                                                        if (val && !selectedTask.tags?.includes(val)) {
                                                            updateTaskDetail(selectedTask.id, 'tags', [...(selectedTask.tags || []), val]);
                                                            e.currentTarget.value = '';
                                                        }
                                                    }
                                                }}
                                                style={{ width: '100%', padding: '8px 8px 8px 30px', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border)', borderRadius: '8px', color: '#fff', fontSize: '13px' }}
                                            />
                                        </div>
                                    </div>

                                    {/* Attachments Section */}
                                    <div>
                                        <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '8px', textTransform: 'uppercase' }}>Attachments</div>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                            {selectedTask.attachments && selectedTask.attachments.map((file, idx) => (
                                                <div key={idx} style={{ padding: '10px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '13px', color: 'var(--text-primary)' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
                                                        <Tag size={14} />
                                                        <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '180px' }}>{file}</span>
                                                    </div>
                                                    <button
                                                        onClick={() => updateTaskDetail(selectedTask.id, 'attachments', selectedTask.attachments?.filter((_, i) => i !== idx))}
                                                        style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', display: 'flex' }}
                                                    >
                                                        <X size={14} />
                                                    </button>
                                                </div>
                                            ))}

                                            <input
                                                type="file"
                                                ref={fileInputRef}
                                                style={{ display: 'none' }}
                                                onChange={handleFileSelect}
                                            />
                                            <button
                                                onClick={() => fileInputRef.current?.click()}
                                                style={{ width: '100%', padding: '12px', border: '1px dashed var(--border)', background: 'transparent', borderRadius: '12px', color: 'var(--text-secondary)', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', transition: 'all 0.2s' }}
                                            >
                                                <Plus size={16} /> Dodaj Fajl
                                            </button>
                                        </div>
                                    </div>
                                </div>
                                <div style={{ padding: '20px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-secondary)' }}>
                                    <span>Created: {new Date(selectedTask.createdAt).toLocaleDateString()}</span>
                                    <button onClick={() => handleDeleteTask(selectedTask.id)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}><Trash2 size={16} /></button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

            </motion.div>

            <style>{`
                .wizard-overlay {
                    position: fixed;
                    inset: 0;
                    background: var(--bg-dark);
                    z-index: 2000;
                    display: flex;
                }

                .wizard-container {
                    width: 100vw;
                    height: 100vh;
                    display: flex;
                    background: var(--bg-dark);
                    overflow: hidden;
                }

                .wizard-sidebar {
                    width: 280px;
                    background: var(--bg-card);
                    border-right: 1px solid var(--border);
                    display: flex;
                    flex-direction: column;
                    flex-shrink: 0;
                    overflow-y: auto;
                }

                .wizard-sidebar-header {
                    padding: 24px;
                    border-bottom: 1px solid var(--border);
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    flex-shrink: 0;
                }

                .wizard-steps-list {
                    padding: 16px;
                    display: flex;
                    flex-direction: column;
                    gap: 4px;
                }

                .step-item-row {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    padding: 12px 16px;
                    border-radius: 12px;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    color: var(--text-secondary);
                    font-weight: 500;
                    user-select: none;
                }

                .step-item-row:hover {
                    background: var(--glass-bg);
                }

                .step-item-row.active {
                    background: var(--accent-glow);
                    color: var(--accent);
                    font-weight: 600;
                    border-right: 3px solid var(--accent);
                }

                .step-icon-small {
                    width: 32px;
                    height: 32px;
                    border-radius: 10px;
                    background: rgba(0,0,0,0.05);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 14px;
                    flex-shrink: 0;
                }

                .step-item-row.active .step-icon-small {
                    background: var(--accent);
                    color: #fff;
                }

                .wizard-main-area {
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    height: 100%;
                    background: var(--bg-dark);
                }

                .wizard-topbar {
                    height: 80px;
                    padding: 0 40px;
                    border-bottom: 1px solid var(--border);
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    background: var(--bg-card);
                    flex-shrink: 0;
                }

                .topbar-title h3 {
                    margin: 0;
                    font-size: 22px;
                    font-weight: 700;
                }

                .topbar-subtitle {
                    font-size: 13px;
                    color: var(--text-secondary);
                }

                .wizard-content-wrapper {
                    flex: 1;
                    overflow-y: auto;
                    padding: 40px;
                }

                .content-center-limit {
                    max-width: 95%; /* Widened as requested */
                    margin: 0 auto;
                    padding-bottom: 40px;
                }

                .katana-task-row:hover {
                    transform: translateX(5px);
                    background: var(--bg-sidebar) !important;
                    border-color: var(--accent) !important;
                    box-shadow: 0 5px 15px rgba(0,0,0,0.1);
                }
            `}</style>
        </div>
    );
}
