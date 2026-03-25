import React, { useState, useEffect, useRef } from 'react';
import {
    Brain,
    Send,
    Sparkles,
    ArrowLeft,
    Cpu,
    Zap,
    Network,
    Activity,
    Users,
    Database,
    Mail,
    Hotel,
    DollarSign,
    Shield,
    RefreshCcw,
    CheckCircle,
    AlertCircle,
    Clock,
    BookOpen,
    Plus,
    Trash2,
    Edit,
    Save,
    Upload,
    FileText,
    File,
    Paperclip,
    X,
    ImageIcon,
    Globe,
    BarChart3,
    Search,
    Download,
    FileSpreadsheet,
    FileCode,
    Award,
    MessageSquare,
    LayoutDashboard,
    ChevronRight,
    Volume2,
    VolumeX
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { GeometricBrain } from '../../components/icons/GeometricBrain';
import { supabase } from '../../supabaseClient';
import { apiCache } from '../../utils/apiCache';
import { checkNetworkHealth } from '../../utils/networkHealth';
import ExcelJS from 'exceljs';
import { loadFromCloud } from '../../utils/storageUtils';
import { multiKeyAI } from '../../services/multiKeyAI';

interface Props {
    onBack: () => void;
    userLevel: number;
}

interface Message {
    id: string;
    role: 'user' | 'assistant' | 'system' | 'orchestrator' | 'agent' | 'ceo';
    content: string;
    agentName?: string;
    timestamp: Date;
    status?: 'thinking' | 'processing' | 'complete' | 'error';
    files?: { name: string; type: string; size: number }[];
    report?: {
        title: string;
        summary: string;
        columns: { header: string; key: string }[];
        rows: any[];
    };
}

interface Employee {
    id: string;
    name: string;
    module: string;
    status: 'active' | 'busy' | 'idle' | 'offline';
    capabilities: string[];
    icon: React.ReactNode;
    color: string;
    lastActive?: Date;
    tasksCompleted: number;
    minLevel: number; // Minimum user level required to access this agent
    avatarUrl?: string; // For the new visual identity
}

interface TrainingDocument {
    id: string;
    name: string;
    type: string;
    size: number;
    uploadedAt: Date;
    content?: string; // For text files
}

interface TrainingRule {
    id: string;
    agentId: string;
    title: string;
    description: string;
    trigger: string;
    action: string;
    priority: 'low' | 'medium' | 'high';
    enabled: boolean;
    createdAt: Date;
    documents?: TrainingDocument[]; // Attached learning documents
}

const getFileIcon = (type: string, name?: string) => {
    const fileName = name || '';
    if (type.includes('image')) return <ImageIcon size={14} color="#667eea" />;
    if (type.includes('pdf')) return <FileText size={14} color="#ff4d4d" />;
    if (type.includes('excel') || type.includes('spreadsheet') || fileName.endsWith('.csv') || fileName.endsWith('.xlsx'))
        return <Database size={14} color="#22c55e" />;
    if (fileName.endsWith('.html') || fileName.endsWith('.htm'))
        return <Globe size={14} color="#3b82f6" />;
    return <File size={14} color="var(--text-secondary)" />;
};

const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

type TabType = 'chat' | 'office' | 'training' | 'logs' | 'security' | 'meeting';

interface AgentStats {
    id: string;
    tasksCompleted: number;
    efficiency: number;
    status: string;
}

interface DailyReport {
    date: string;
    totalTasks: number;
    highlight: string;
    agentBreakdown: { name: string; impact: string; tasks: number }[];
    anomalies: string[];
}

export default function MasterOrchestrator({ onBack, userLevel }: Props): React.ReactElement {
    const [messages, setMessages] = useState<Message[]>([]);
    const [currentInput, setCurrentInput] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [activeAgents, setActiveAgents] = useState<string[]>([]);
    const [selectedAgentIds, setSelectedAgentIds] = useState<string[]>([]);
    const [autoDelegate, setAutoDelegate] = useState(true);
    const [activeTab, setActiveTab] = useState<TabType>('chat');
    const [trainingRules, setTrainingRules] = useState<TrainingRule[]>([]);
    const [editingRule, setEditingRule] = useState<Partial<TrainingRule> | null>(null);
    const [uploadingDocs, setUploadingDocs] = useState<File[]>([]);
    const [chatFiles, setChatFiles] = useState<File[]>([]);
    const [fileHistory, setFileHistory] = useState<{ name: string; type: string; size: number; timestamp: Date; fileObj?: File }[]>([]);
    const [isLoadingRules, setIsLoadingRules] = useState(false);
    const [securityEvents, setSecurityEvents] = useState<any[]>([]);
    const [isLoadingSecurity, setIsLoadingSecurity] = useState(false);
    const [networkSpeed, setNetworkSpeed] = useState<any>(null);
    const chatEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const chatFileInputRef = useRef<HTMLInputElement>(null);
    const [agentRules, setAgentRules] = useState<Record<string, string>>({});
    const [voiceEnabled, setVoiceEnabled] = useState(false);

    // TTS Voice Configuration for each agent
    const TTS_VOICES: Record<string, { lang: string; pitch: number; rate: number }> = {
        'nenad': { lang: 'sr-RS', pitch: 0.8, rate: 0.9 },
        'ljubica': { lang: 'sr-RS', pitch: 1.1, rate: 1.05 },
        'milica': { lang: 'sr-RS', pitch: 1.2, rate: 1.1 },
        'viktor': { lang: 'sr-RS', pitch: 0.9, rate: 1.0 },
        'elena': { lang: 'sr-RS', pitch: 1.15, rate: 1.05 },
        'marko': { lang: 'sr-RS', pitch: 0.95, rate: 1.1 },
        'luka': { lang: 'sr-RS', pitch: 1.0, rate: 1.0 },
        'sara': { lang: 'sr-RS', pitch: 1.2, rate: 1.15 },
        'relja': { lang: 'sr-RS', pitch: 1.05, rate: 1.2 },
        'nikola': { lang: 'sr-RS', pitch: 0.7, rate: 0.85 },
        'orchestrator': { lang: 'sr-RS', pitch: 1.0, rate: 1.0 }
    };

    const speakContent = (text: string, agentId: string = 'orchestrator') => {
        if (!window.speechSynthesis) return;
        window.speechSynthesis.cancel(); // Stop current speech
        
        const utterance = new SpeechSynthesisUtterance(text);
        const config = TTS_VOICES[agentId] || TTS_VOICES['orchestrator'];
        
        utterance.lang = config.lang;
        utterance.pitch = config.pitch;
        utterance.rate = config.rate;
        
        // Find a Serbian/Croatian voice if available
        const voices = window.speechSynthesis.getVoices();
        const localVoice = voices.find(v => v.lang.startsWith('sr') || v.lang.startsWith('hr') || v.lang.startsWith('bs'));
        if (localVoice) utterance.voice = localVoice;
        
        window.speechSynthesis.speak(utterance);
    };

    // Fetch rules from Supabase on mount
    const [meetingData, setMeetingData] = useState<DailyReport | null>(null);
    const [isGeneratingReport, setIsGeneratingReport] = useState(false);
    const [agentStats, setAgentStats] = useState<AgentStats[]>([]);

    useEffect(() => {
        // Initialize mock stats for agents
        setAgentStats(allAgents.map(a => ({
            id: a.id,
            tasksCompleted: Math.floor(Math.random() * 50) + 20,
            efficiency: 85 + Math.random() * 14,
            status: a.status
        })));
    }, []);

    const generateDailyReport = async () => {
        setIsGeneratingReport(true);
        // Simulate AI analysis 
        await new Promise(r => setTimeout(r, 2000));
        
        const report: DailyReport = {
            date: new Date().toLocaleDateString('sr-RS'),
            totalTasks: agentStats.reduce((sum, s) => sum + s.tasksCompleted, 0),
            highlight: "Svi sistemi su stabilni. Primećen je porast u OCR obradi dokumenata zahvaljujući Lukinoj optimizaciji. Finansijski auditor Viktor je potvrdio validnost svih marži za tekući kvartal.",
            agentBreakdown: agents.map(a => {
                const stat = agentStats.find(s => s.id === a.id);
                return {
                    name: a.name,
                    tasks: stat?.tasksCompleted || 0,
                    impact: a.id === 'luka' ? 'Visok (OCR Optimizacija)' : a.id === 'viktor' ? 'Srednji (Finansijski Audit)' : 'Normalan'
                };
            }),
            anomalies: [
                "Blagi porast latencije na Solvex API-ju u 08:45 (Rešeno od strane Nikole)",
                "3 rezervacije na čekanju zbog nepotpune dokumentacije (Elena prati)"
            ]
        };
        
        setMeetingData(report);
        setIsGeneratingReport(false);
        if (voiceEnabled) speakContent("Dnevni izveštaj je spreman. Ukupan broj obrađenih zadataka danas je " + report.totalTasks + ". Svi sistemi su stabilni.", 'ljubica');
    };

    const loadManualRules = async () => {
        const { success, data } = await loadFromCloud('agent_rules');
        if (success && data) {
            const rulesMap: Record<string, string> = {};
            if (Array.isArray(data)) {
                data.forEach((item: any) => rulesMap[item.id] = item.rules);
            }
            setAgentRules(rulesMap);
        }
    };

    const fetchTrainingRules = async () => {
        setIsLoadingRules(true);
        try {
            const { data, error } = await supabase
                .from('training_rules')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;

            if (data) {
                const rules: TrainingRule[] = data.map((row: any) => ({
                    id: row.id,
                    agentId: row.agent_id,
                    title: row.title,
                    description: row.description,
                    trigger: row.trigger_text, // mapping trigger_text to trigger
                    action: row.action_text,   // mapping action_text to action
                    priority: row.priority,
                    enabled: row.enabled,
                    createdAt: new Date(row.created_at),
                    documents: row.documents || [] // Assuming JSONB column for documents
                }));
                setTrainingRules(rules);
            }
        } catch (error) {
            console.error('Error fetching rules:', error);
            // Fallback or just log, current state is empty array
        } finally {
            setIsLoadingRules(false);
        }
    };

    // Unified AI Team (Zaposleni)
    const allAgents: Employee[] = [
        {
            id: 'nenad',
            name: 'Nenad',
            module: 'CEO & Founder',
            status: 'active',
            capabilities: ['Ultimate Authority', 'Strategic Vision', 'Final Approval', 'High-Level Decision Making', 'System Architecture'],
            icon: <Award size={20} />,
            color: '#000000',
            tasksCompleted: 0,
            minLevel: 6,
            avatarUrl: '/avatars/nenad_ceo.png'
        },
        {
            id: 'ljubica',
            name: 'Ljubica',
            module: 'COO & Master Orchestrator',
            status: 'active',
            capabilities: ['Strategic Strategy', 'Agent Coordination', 'Conflict Resolution', 'Business Intelligence', 'Operational Oversight'],
            icon: <Brain size={20} />,
            color: '#6366f1',
            tasksCompleted: 0,
            minLevel: 5,
            avatarUrl: '/avatars/ljubica_coo.png'
        },
        {
            id: 'milica',
            name: 'Milica',
            module: 'Smart Search Guru',
            status: 'idle',
            capabilities: ['Customer Experience', 'Search Optimization', 'Sentiment Analysis', 'Travel Guidance', 'Personalized Recommendations'],
            icon: <Search size={20} />,
            color: '#ec4899',
            tasksCompleted: 0,
            minLevel: 1,
            avatarUrl: '/avatars/milica.png'
        },
        {
            id: 'viktor',
            name: 'Viktor',
            module: 'Financial Auditor',
            status: 'idle',
            capabilities: ['Financial Forensics', 'Margin Protection', 'Anomaly Detection', 'Tax Audit', 'Budget Analysis'],
            icon: <DollarSign size={20} />,
            color: '#10b981',
            tasksCompleted: 0,
            minLevel: 3,
            avatarUrl: '/avatars/viktor.png'
        },
        {
            id: 'elena',
            name: 'Elena',
            module: 'Booking & Operations',
            status: 'idle',
            capabilities: ['Operational Accuracy', 'Document Validation', 'Inventory Tracking', 'Voucher Prep', 'Reservation Management'],
            icon: <Hotel size={20} />,
            color: '#3b82f6',
            tasksCompleted: 0,
            minLevel: 2,
            avatarUrl: '/avatars/elena.png'
        },
        {
            id: 'marko',
            name: 'Marko',
            module: 'B2B Account Manager',
            status: 'idle',
            capabilities: ['Relationship Management', 'B2B Sales Assist', 'Debt Monitoring', 'Subagent Training', 'Partnership Development'],
            icon: <Users size={20} />,
            color: '#f59e0b',
            tasksCompleted: 0,
            minLevel: 2,
            avatarUrl: '/avatars/marko.png'
        },
        {
            id: 'luka',
            name: 'Luka',
            module: 'Pricing Operations Lead',
            status: 'idle',
            capabilities: ['Data Engineering', 'OCR Mapping', 'Pricing Logic', 'Excel Import Automation', 'Database Management'],
            icon: <Database size={20} />,
            color: '#06b6d4',
            tasksCompleted: 0,
            minLevel: 2,
            avatarUrl: '/avatars/luka.png'
        },
        {
            id: 'sara',
            name: 'Sara',
            module: 'Smart Marketing & Growth',
            status: 'idle',
            capabilities: ['Viral Content', 'Campaign Optimization', 'Funnel Analysis', 'Brand Sentiment', 'Market Research'],
            icon: <Sparkles size={20} />,
            color: '#f97316',
            tasksCompleted: 0,
            minLevel: 2,
            avatarUrl: '/avatars/sara.png'
        },
        {
            id: 'relja',
            name: 'Relja',
            module: 'Lead Software Engineer',
            status: 'idle',
            capabilities: ['Code Audit', 'Bug Resolution', 'Real-time Patching', 'Performance Tuning', 'System Integration'],
            icon: <FileCode size={20} />,
            color: '#8b5cf6',
            tasksCompleted: 0,
            minLevel: 4,
            avatarUrl: '/avatars/relja.png'
        },
        {
            id: 'nikola',
            name: 'Nikola',
            module: 'System Guardian (Sentinel)',
            status: 'active',
            capabilities: ['Cyber Security', 'API Reliability', 'System Health Monitoring', 'Self-Healing Protocols', 'Threat Detection'],
            icon: <Shield size={20} />,
            color: '#ef4444',
            tasksCompleted: 0,
            minLevel: 5,
            avatarUrl: '/avatars/nikola.png'
        }
    ];

    // Filter agents based on user level
    const agents = allAgents.filter(agent => userLevel >= agent.minLevel);

    useEffect(() => {
        // Inicijalna poruka
        setMessages([{
            id: '1',
            role: 'orchestrator',
            content: `Master Orchestrator Online. Upravljam sa ${agents.length} specijalizovanih AI agenata dostupnih na vašem nivou (Level ${userLevel}). Kako mogu da pomognem?`,
            timestamp: new Date(),
            status: 'complete'
        }]);
    }, [agents.length, userLevel]);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSend = async () => {
        if ((!currentInput.trim() && chatFiles.length === 0) || isProcessing) return;

        const currentFiles = [...chatFiles];
        const userMessage: Message = {
            id: Date.now().toString(),
            role: 'user',
            content: currentInput.trim() || (currentFiles.length === 1 ? `Poslao sam fajl: ${currentFiles[0].name}` : `Poslao sam ${currentFiles.length} fajla`),
            timestamp: new Date(),
            files: currentFiles.map(f => ({ name: f.name, type: f.type, size: f.size }))
        };

        setMessages(prev => [...prev, userMessage]);
        const currentInputSnapshot = currentInput; // Snapshot input for agent responses

        // Update File History (keep last 10)
        if (currentFiles.length > 0) {
            setFileHistory(prev => {
                const newItems = currentFiles.map(f => ({
                    name: f.name,
                    type: f.type,
                    size: f.size,
                    timestamp: new Date(),
                    fileObj: f
                }));
                const combined = [...newItems, ...prev];
                return combined.slice(0, 10);
            });
        }

        setCurrentInput('');
        setIsProcessing(true);
        setChatFiles([]); // Clear immediately so UI reflects "sent" state

        // Simulacija orchestrator razmišljanja
        const thinkingMessage: Message = {
            id: (Date.now() + 1).toString(),
            role: 'orchestrator',
            content: 'Analiziram zahtev i određujem koje agente treba aktivirati...',
            timestamp: new Date(),
            status: 'thinking'
        };

        setMessages(prev => [...prev, thinkingMessage]);

        // Pre-fetch network status if query is about Sentinel/Status
        let currentNetStatus = null;
        if (currentInputSnapshot.toLowerCase().includes('status') || currentInputSnapshot.toLowerCase().includes('api') || currentInputSnapshot.toLowerCase().includes('internet')) {
            currentNetStatus = await checkNetworkHealth();
            setNetworkSpeed(currentNetStatus);
        }

        // Simulacija identifikacije agenata
        setTimeout(() => {
            const query = currentInputSnapshot.toLowerCase();
            let identifiedAgents: string[] = [];
            const isCapabilityQuery = query.includes('zadaci') ||
                query.includes('šta možeš') ||
                query.includes('sta možeš') ||
                query.includes('sta mozes') ||
                query.includes('mogućnosti') ||
                query.includes('uloga') ||
                query.includes('pomoć') ||
                query.includes('help') ||
                query.includes('ko ste');

            // Ako korisnik NIJE ručno izabrao agente, koristi automatsku detekciju
            if (autoDelegate && selectedAgentIds.length === 0) {
                if (isCapabilityQuery) {
                    // Activate all agents to introduce themselves
                    identifiedAgents = agents.map(a => a.id);
                } else {
                    if (query.includes('hotel') || query.includes('smeštaj') || query.includes('soba')) {
                        identifiedAgents.push('elena');
                    }
                    if (query.includes('cena') || query.includes('popust') || query.includes('price')) {
                        identifiedAgents.push('luka');
                    }
                    if (query.includes('hotel') || query.includes('smeštaj') || query.includes('soba') || query.includes('destinacij') || query.includes('aranzman')) {
                        identifiedAgents.push('milica');
                    }
                    if (query.includes('cena') || query.includes('popust') || query.includes('price') || query.includes('profit') || query.includes('marža')) {
                        identifiedAgents.push('viktor');
                    }
                    if (query.includes('email') || query.includes('mail') || query.includes('poruka') || query.includes('customer')) {
                        identifiedAgents.push('milica');
                    }
                    if (query.includes('booking') || query.includes('rezervacij') || query.includes('vaučer') || query.includes('voucher')) {
                        identifiedAgents.push('elena');
                    }
                    if (query.includes('security') || query.includes('bezbednost') || query.includes('napad') || query.includes('api') || query.includes('limit') || query.includes('status')) {
                        identifiedAgents.push('nikola');
                    }
                    if (query.includes('b2b') || query.includes('subagent') || query.includes('dugovanj')) {
                        identifiedAgents.push('marko');
                    }
                    if (query.includes('data') || query.includes('podatak') || query.includes('report') || query.includes('excel') || query.includes('ocr')) {
                        identifiedAgents.push('luka');
                    }
                    if (query.includes('bug') || query.includes('error') || query.includes('greška') || query.includes('kod') || query.includes('sistem')) {
                        identifiedAgents.push('relja');
                    }
                    if (query.includes('marketing') || query.includes('kampanja') || query.includes('društvene mreže') || query.includes('rast')) {
                        identifiedAgents.push('sara');
                    }
                    if (query.includes('ceo') || query.includes('nenad') || query.includes('strategija') || query.includes('odluka')) {
                        identifiedAgents.push('nenad');
                    }

                    // Auto-activate based on file types
                    if (currentFiles.some(f => f.name.endsWith('.xlsx') || f.name.endsWith('.csv') || f.name.endsWith('.html') || f.name.endsWith('.htm'))) {
                        if (!identifiedAgents.includes('luka')) identifiedAgents.push('luka');
                        if (!identifiedAgents.includes('viktor')) identifiedAgents.push('viktor');
                    }
                    if (currentFiles.some(f => f.type.includes('image') || f.name.endsWith('.pdf'))) {
                        if (!identifiedAgents.includes('elena')) identifiedAgents.push('elena');
                        if (!identifiedAgents.includes('luka')) identifiedAgents.push('luka');
                    }

                    // New Intelligence Agent is always activated for file analysis
                    if (currentFiles.length > 0) {
                        if (!identifiedAgents.includes('viktor')) identifiedAgents.push('viktor');
                    }

                    // Ako nijedan agent nije identifikovan, koristi opšti pristup
                    if (identifiedAgents.length === 0) {
                        identifiedAgents.push('milica', 'ljubica');
                    }
                }
            } else {
                // Koristi ručno izabrane agente
                identifiedAgents = [...selectedAgentIds];
            }

            setActiveAgents(identifiedAgents);

            // Provera da li se neka pravila (Training Rules) aktiviraju
            const triggeredRules = trainingRules.filter(rule =>
                rule.enabled && (
                    query.includes(rule.title.toLowerCase()) ||
                    (rule.trigger && query.includes(rule.trigger.toLowerCase()))
                )
            );

            // Orchestrator poruka o identifikovanim agentima i pravilima
            const agentNames = identifiedAgents.map(id =>
                agents.find(a => a.id === id)?.name
            ).join(', ');

            let orchestratorContent = isCapabilityQuery
                ? `Razumem. Ja sam Master Orchestrator i upravljam mrežom specijalizovanih AI agenata. Evo njihovih uloga:`
                : `Aktiviram sledeće agente: ${agentNames}`;

            if (currentFiles.length > 0) {
                orchestratorContent += `\n\nIdentifikovao sam ${currentFiles.length} priloga. Agenti vrše analizu sadržaja...`;
            }
            if (triggeredRules.length > 0) {
                orchestratorContent += `\n\nPrimenjujem naučena pravila: ${triggeredRules.map(r => r.title).join(', ')}`;
            }

            const orchestratorMessage: Message = {
                id: (Date.now() + 2).toString(),
                role: 'orchestrator',
                content: orchestratorContent,
                timestamp: new Date(),
                status: 'processing'
            };

            setMessages(prev => [...prev.slice(0, -1), orchestratorMessage]);
            if (voiceEnabled) speakContent(orchestratorContent, 'orchestrator');

            // Simulacija odgovora zaposlenih (AI call)
            setTimeout(() => {
                identifiedAgents.forEach(async (agentId, index) => {
                    setTimeout(async () => {
                        const employee = agents.find(a => a.id === agentId);
                        if (!employee) return;

                        const agentResponse = await generateAgentResponse(agentId, currentInputSnapshot, currentFiles);

                        const agentMessage: Message = {
                            id: (Date.now() + 3 + index).toString(),
                            role: 'agent',
                            content: agentResponse,
                            agentName: employee.name,
                            timestamp: new Date(),
                            status: 'complete'
                        };

                        setMessages(prev => [...prev, agentMessage]);
                        if (voiceEnabled) speakContent(agentResponse, agentId);
                    }, index * 1000);
                });

                // Finalni odgovor orchestrator-a
                setTimeout(() => {
                    const finalMessage: Message = {
                        id: (Date.now() + 100).toString(),
                        role: 'orchestrator',
                        content: 'Svi agenti su završili sa obradom. Rezultati su agregirani i prikazani iznad.',
                        timestamp: new Date(),
                        status: 'complete'
                    };

                    setMessages(prev => [...prev, finalMessage]);
                    setIsProcessing(false);
                    setActiveAgents([]);

                    // Check for Intelligence Report trigger
                    if (identifiedAgents.includes('viktor') && currentFiles.length > 0) {
                        setTimeout(() => {
                            const reportMsg: Message = {
                                id: Date.now().toString() + '-report',
                                role: 'agent',
                                agentName: 'Intelligence Agent',
                                content: 'Završio sam dubinsku analizu vašeg dokumenta. Evo finalnog izveštaja sa akcentom na marže i detektovane anomalije:',
                                timestamp: new Date(),
                                status: 'complete',
                                report: {
                                    title: `BI Audit Report: ${currentFiles[0].name}`,
                                    summary: 'Analiza ukazuje na stabilne marže od 15-22%, ali su detektovana 3 odstupanja u nabavnim cenama kod dobavljača Solvex.',
                                    columns: [
                                        { header: 'Period', key: 'period' },
                                        { header: 'Dobavljač', key: 'supplier' },
                                        { header: 'Nabavna', key: 'purchase' },
                                        { header: 'Prodajna', key: 'selling' },
                                        { header: 'Marža', key: 'margin' }
                                    ],
                                    rows: [
                                        { period: 'Jun 2026', supplier: 'Solvex', purchase: '120€', selling: '150€', margin: '25%' },
                                        { period: 'Jul 2026', supplier: 'Solvex', purchase: '145€', selling: '165€', margin: '13.8% (Nisko!)' },
                                        { period: 'Avg 2026', supplier: 'Happy Travel', purchase: '95€', selling: '125€', margin: '31.5%' },
                                        { period: 'Sep 2026', supplier: 'Solvex', purchase: '110€', selling: '140€', margin: '27.2%' }
                                    ]
                                }
                            };
                            setMessages(prev => [...prev, reportMsg]);
                        }, 2000);
                    }
                }, identifiedAgents.length * 1000 + 500);
            }, 1500);
        }, 1000);
    };

    const handleChatFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        setChatFiles(prev => [...prev, ...files]);
    };

    const handleRemoveChatFile = (index: number) => {
        setChatFiles(prev => prev.filter((_, i) => i !== index));
    };

    const handleReAttachFile = (historyItem: any) => {
        if (historyItem.fileObj) {
            setChatFiles(prev => [...prev, historyItem.fileObj]);
        }
    };

    const toggleAgentSelection = (agentId: string) => {
        setSelectedAgentIds(prev =>
            prev.includes(agentId)
                ? prev.filter(id => id !== agentId)
                : [...prev, agentId]
        );
    };

    const selectAllAgents = () => {
        if (selectedAgentIds.length === agents.length) {
            setSelectedAgentIds([]);
        } else {
            setSelectedAgentIds(agents.map(a => a.id));
        }
    };

    const generateAgentResponse = async (agentId: string, query: string, files: File[] = []): Promise<string> => {
        const queryLower = query.toLowerCase();

        // Check for technical/code errors in query to trigger Relja
        if ((queryLower.includes('greška') || queryLower.includes('error') || queryLower.includes('ne radi') || queryLower.includes('bug') || queryLower.includes('bag')) && agentId === 'relja') {
            return `Nenade, analizirao sam sistemske logove. Primećujem problem sa putanjom modula u config fajlu. Predlažem sledeći fix: Promeni import u liniji 12. Želiš li da primenim zakrpu odmah?`;
        }

        // 1. Check for Capability Query
        const isCapabilityQuery = queryLower.includes('zadaci') ||
            queryLower.includes('šta možeš') ||
            queryLower.includes('sta možeš') ||
            queryLower.includes('sta mozes') ||
            queryLower.includes('mogućnosti') ||
            queryLower.includes('uloga') ||
            queryLower.includes('pomoć') ||
            queryLower.includes('help') ||
            queryLower.includes('ko ste');

        if (isCapabilityQuery) {
            const employee = agents.find(a => a.id === agentId);
            if (employee) {
                return `Zdravo! Ja sam ${employee.name} iz modula "${employee.module}". Moji zadaci uključuju: ${employee.capabilities.map(c => c.replace(/_/g, ' ')).join(', ')}. Kako mogu da vam pomognem?`;
            }
        }

        // 2. Check for Training Rules (from Hub)
        const relevantRule = trainingRules.find(rule =>
            rule.enabled &&
            rule.agentId === agentId &&
            (queryLower.includes(rule.title.toLowerCase()) || (rule.trigger && queryLower.includes(rule.trigger.toLowerCase())))
        );

        if (relevantRule) {
            let response = `Na osnovu naučenog pravila "${relevantRule.title}": ${relevantRule.action}. `;
            if (relevantRule.documents && relevantRule.documents.length > 0) {
                response += `Analizirao sam ${relevantRule.documents.length} dokumenata za učenje. `;
                const firstDoc = relevantRule.documents[0];
                if (firstDoc.content) {
                    const preview = firstDoc.content.slice(0, 150).replace(/\n/g, ' ');
                    response += `Izvadak iz "${firstDoc.name}": "${preview}..."`;
                }
            }
            return response;
        }

        // 3. System Responses (Real AI Fallback)
        const employee = agents.find(e => e.id === agentId);
        
        try {
            const systemPrompt = `Ti si ${employee?.name}, tvoja uloga je: ${employee?.module}. 
            Tvoj profil obuhvata: ${employee?.capabilities.join(', ')}.
            Vodi se instrukcijama: ${agentRules[agentId] || 'Sledi opšte smernice Prime kompanije.'}
            VAŽNO: Budi maksimalno štedljiv sa tokenima. Ako klijent traži podatke (cene, analizu), odgovori da ćeš izvršiti SQL upit ili obraditi bazu lokalno umesto da trošiš AI resurse na nagađanje.
            Obavezno koristi srpski jezik u profesionalnom, ali vedrom tonu.`;

            const aiResponse = await multiKeyAI.generateContent(query, {
                systemPrompt,
                cacheCategory: 'chat',
                temperature: 0.5
            });

            const manualInstruction = agentRules[agentId];
            let finalResponse = aiResponse;
            if (manualInstruction) {
                finalResponse = `[Instrukcija: ${manualInstruction}]\n\n${finalResponse}`;
            }
            return finalResponse;

        } catch (error) {
            console.error("AI Error:", error);
            const responses: Record<string, string> = {
                'ljubica': `Kao CEO, koordiniram rad svih modula. Vaš zahtev je uspešno delegiran specijalistima. Trenutni KPI sistema je na ${Math.floor(Math.random() * 5 + 95)}%, a profitabilnost raste uz aktivne optimizacije.`,
                'milica': `Pronašla sam najbolje opcije za vas! Hotel Splendid (5*) i Mediteran (4*) su trenutno najprodavaniji. Klijenti ostavljaju odlične recenzije za njihovu uslugu ovog jutra.`,
                'viktor': `Analizirao sam finansijski tok. Prosečna marža je stabilna, ali sam detektovao 2 hotela gde možemo povećati profit za 3% bez gubitka konkurentnosti. Revizija marži je završena.`,
                'elena': `Sve rezervacije su pod kontrolom. Validacija dokumenata za grupu u julu je završena, a vaučeri su spremni za automatskom slanje. Operativa teče neometano.`,
                'marko': `Subagenti su aktivni. Solvex B2B portal beleži porast prometa. Pratim njihova dugovanja i dospela plaćanja - sve je u okviru dozvoljenih limita.`,
                'luka': `OCR procesor je obradio dokumente. Mapirao sam nove cenovnike iz Solvex dokumentacije direktno u naš sistem. Import je spreman za finalno odobrenje.`,
                'nikola': `[Sentinel Status Report] 🟢 Sistem je 100% bezbedan.
                - Solvex API: Online (Latency: 120ms)
                - Firewall: Aktivno blokirano 15 sumnjivih IP adresa u poslednjih sat vremena.
                - Internet: ${networkSpeed ? `${networkSpeed.quality.toUpperCase()} (${networkSpeed.latency}ms)` : 'Stabilan.'}
                - Quota: Potrošeno 14% dnevnog limita.`
            };

            // 4. File-specific Logic (Fallback)
            if (files.length > 0) {
                const fileList = files.map(f => f.name).join(', ');
                const isExcel = files.some(f => f.name.endsWith('.xlsx') || f.name.endsWith('.csv'));
                const isImage = files.some(f => f.type.includes('image'));

                const fileContextMsg = files.length === 1
                    ? `Pažljivo sam analizirao dokument "${files[0].name}". `
                    : `Analizirao sam svih ${files.length} priloženih dokumenata (${fileList}). `;

                const fileSpecificResponses: Record<string, string> = {
                    'milica': isImage
                        ? `${fileContextMsg}Analizirala sam fotografije hotela. Kvalitet je odličan, možemo ih odmah postaviti na B2B portal.`
                        : `${fileContextMsg}Ekstraktovala sam želje klijenta iz fajla. Pripremila sam personalizovanu ponudu.`,
                    'viktor': isExcel
                        ? `${fileContextMsg}Vršim finansijsku reviziju tabela. Detektovao sam 15% niže cene kod konkurencije za Hotel Splendid.`
                        : `${fileContextMsg}Analizirao sam finansijske anomalije u izveštaju. Rezultati BI analize su spremni.`,
                    'elena': `${fileContextMsg}Potvrdila sam podatke o gostima. Svi pasoši su validni i u skladu sa booking zahtevom.`,
                    'luka': `${fileContextMsg}OCR prepoznavanje uspešno završeno. Mapirao sam ${files.length} dokumenata u bazu cena.`,
                    'marko': `${fileContextMsg}Analizirao sam promet subagenta. Njihov obim prodaje raste za 20% nakon što su dobili pristup novim alatima.`
                };

                if (fileSpecificResponses[agentId]) {
                    return fileSpecificResponses[agentId];
                }
            }

            return responses[agentId] || `${agentId} je obradio zahtev i vratio rezultate.`;
        }
    };

    const getStatusColor = (status: Employee['status']) => {
        switch (status) {
            case 'active': return '#10b981';
            case 'busy': return '#f59e0b';
            case 'offline': return '#ef4444';
            default: return '#6b7280';
        }
    };

    const getMessageStatusIcon = (status?: Message['status']) => {
        switch (status) {
            case 'thinking': return <RefreshCcw size={14} className="spin" />;
            case 'processing': return <Activity size={14} className="pulse" />;
            case 'complete': return <CheckCircle size={14} />;
            case 'error': return <AlertCircle size={14} />;
            default: return null;
        }
    };

    // Training Rules Functions
    const handleAddRule = async () => {
        // Legacy method, not used in favor of handleAddRuleWithDocs
        console.warn('Use handleAddRuleWithDocs instead');
    };

    const handleDeleteRule = async (id: string) => {
        // Optimistic update
        setTrainingRules(prev => prev.filter(r => r.id !== id));

        try {
            const { error } = await supabase
                .from('training_rules')
                .delete()
                .eq('id', id);

            if (error) throw error;
        } catch (error) {
            console.error('Error deleting rule:', error);
            // Revert on error would go here (fetchTrainingRules())
            fetchTrainingRules();
        }
    };

    const handleToggleRule = async (id: string) => {
        const rule = trainingRules.find(r => r.id === id);
        if (!rule) return;

        // Optimistic update
        setTrainingRules(prev => prev.map(r =>
            r.id === id ? { ...r, enabled: !r.enabled } : r
        ));

        try {
            const { error } = await supabase
                .from('training_rules')
                .update({ enabled: !rule.enabled })
                .eq('id', id);

            if (error) throw error;
        } catch (error) {
            console.error('Error toggling rule:', error);
            fetchTrainingRules();
        }
    };

    const getPriorityColor = (priority: TrainingRule['priority']) => {
        switch (priority) {
            case 'high': return '#ef4444';
            case 'medium': return '#f59e0b';
            case 'low': return '#3b82f6';
        }
    };

    // Document Upload Functions
    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        setUploadingDocs(prev => [...prev, ...files]);
    };

    const handleRemoveUploadingDoc = (index: number) => {
        setUploadingDocs(prev => prev.filter((_, i) => i !== index));
    };

    const handleAddRuleWithDocs = async () => {
        if (!editingRule?.title || !editingRule?.agentId) return;

        // Process uploaded documents
        const documents: TrainingDocument[] = await Promise.all(
            uploadingDocs.map(async (file) => {
                let content: string | undefined;

                // Read text-based files
                if (file.type.includes('text') || file.name.endsWith('.txt') || file.name.endsWith('.json') || file.type.includes('json')) {
                    content = await file.text();
                } else if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
                    // Parse Excel files using ExcelJS
                    try {
                        const arrayBuffer = await file.arrayBuffer();
                        const workbook = new ExcelJS.Workbook();
                        await workbook.xlsx.load(arrayBuffer);
                        const worksheet = workbook.getWorksheet(1);

                        let csvContent = '';
                        worksheet?.eachRow((row) => {
                            const rowValues = Array.isArray(row.values) ? row.values.slice(1) : [];
                            csvContent += rowValues.join(',') + '\n';
                        });
                        content = csvContent;
                    } catch (err) {
                        console.error('Error parsing Excel file:', err);
                        content = 'Error parsing Excel file.';
                    }
                }

                return {
                    id: Date.now().toString() + Math.random(),
                    name: file.name,
                    type: file.type || 'application/octet-stream',
                    size: file.size,
                    uploadedAt: new Date(),
                    content
                };
            })
        );

        const newRuleData = {
            agent_id: editingRule.agentId,
            title: editingRule.title,
            description: editingRule.description || '',
            trigger_text: editingRule.trigger || '',
            action_text: editingRule.action || '',
            priority: editingRule.priority || 'medium',
            enabled: true,
            documents: documents.length > 0 ? documents : null
            // created_at is handled by default now() in DB usually, but we can pass it if needed
        };

        try {
            const { data, error } = await supabase
                .from('training_rules')
                .insert([newRuleData])
                .select()
                .single();

            if (error) throw error;

            if (data) {
                const newRule: TrainingRule = {
                    id: data.id,
                    agentId: data.agent_id,
                    title: data.title,
                    description: data.description,
                    trigger: data.trigger_text,
                    action: data.action_text,
                    priority: data.priority,
                    enabled: data.enabled,
                    createdAt: new Date(data.created_at),
                    documents: data.documents || []
                };
                setTrainingRules(prev => [newRule, ...prev]);
            }
        } catch (error) {
            console.error('Error creating rule:', error);
            // Fallback for offline/error: add to local state anyway using simple structure
            const offlineRule: TrainingRule = {
                id: Date.now().toString(),
                agentId: editingRule.agentId!,
                title: editingRule.title!,
                description: editingRule.description || '',
                trigger: editingRule.trigger || '',
                action: editingRule.action || '',
                priority: editingRule.priority || 'medium',
                enabled: true,
                createdAt: new Date(),
                documents: documents.length > 0 ? documents : undefined
            };
            setTrainingRules(prev => [offlineRule, ...prev]);
        }

        setEditingRule(null);
        setUploadingDocs([]);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleExportExcel = async (report: any) => {
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Intelligence Report');

        worksheet.columns = report.columns;
        worksheet.addRows(report.rows);

        // Add summary row
        worksheet.addRow({});
        worksheet.addRow({ period: 'Summary', supplier: report.summary });

        const buffer = await workbook.xlsx.writeBuffer();
        const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${report.title.replace(/\s+/g, '_')}.xlsx`;
        a.click();
    };

    const handleExportHtml = (report: any) => {
        const html = `
            <html>
            <head>
                <title>${report.title}</title>
                <style>
                    body { font-family: sans-serif; padding: 40px; background: #f8f9fa; }
                    .report-card { background: white; padding: 30px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
                    h1 { color: #2d3748; }
                    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                    th, td { padding: 12px; border: 1px solid #e2e8f0; text-align: left; }
                    th { background: #f7fafc; }
                    .summary { background: #edf2f7; padding: 15px; border-radius: 8px; margin: 20px 0; }
                </style>
            </head>
            <body>
                <div class="report-card">
                    <h1>${report.title}</h1>
                    <div class="summary"><strong>Analiza:</strong> ${report.summary}</div>
                    <table>
                        <thead>
                            <tr>${report.columns.map((c: any) => `<th>${c.header}</th>`).join('')}</tr>
                        </thead>
                        <tbody>
                            ${report.rows.map((r: any) => `
                                <tr>${report.columns.map((c: any) => `<td>${r[c.key]}</td>`).join('')}</tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </body>
            </html>
        `;
        const blob = new Blob([html], { type: 'text/html' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${report.title.replace(/\s+/g, '_')}.html`;
        a.click();
    };

    const handleRemoveDocumentFromRule = (ruleId: string, docId: string) => {
        setTrainingRules(prev => prev.map(rule => {
            if (rule.id === ruleId) {
                return {
                    ...rule,
                    documents: rule.documents?.filter(doc => doc.id !== docId)
                };
            }
            return rule;
        }));
    };

    const fetchSecurityEvents = async () => {
        setIsLoadingSecurity(true);
        try {
            const { data, error } = await supabase
                .from('sentinel_events')
                .select('*')
                .eq('title', 'DETEKTOVAN PROMPT INJECTION')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setSecurityEvents(data || []);
        } catch (err) {
            console.error('Error fetching security events:', err);
        } finally {
            setIsLoadingSecurity(false);
        }
    };

    useEffect(() => {
        if (activeTab === 'security') {
            fetchSecurityEvents();
        }
    }, [activeTab]);

    return (
        <div style={{
            height: '100vh',
            display: 'flex',
            flexDirection: 'column',
            background: 'var(--bg-main)',
            overflow: 'hidden'
        }}>
            {/* Header */}
            <div style={{
                padding: '20px 30px',
                borderBottom: '1px solid var(--border)',
                background: 'var(--bg-card)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <div style={{
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        padding: '12px',
                        borderRadius: '16px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}>
                        <GeometricBrain size={32} color="#fff" />
                    </div>
                    <div>
                        <h1 style={{ fontSize: '24px', fontWeight: '800', margin: 0 }}>
                            Master Orchestrator
                        </h1>
                        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '4px 0 0' }}>
                            AI Agent Management System
                        </p>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <div style={{
                        padding: '6px 12px',
                        background: 'rgba(16, 185, 129, 0.1)',
                        border: '1px solid rgba(16, 185, 129, 0.2)',
                        borderRadius: '20px',
                        color: '#10b981',
                        fontSize: '11px',
                        fontWeight: 700,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                    }}>
                        <Activity size={12} />
                        {agents.filter(a => activeAgents.includes(a.id)).length} ACTIVE
                    </div>
                    <button
                        onClick={onBack}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            padding: '10px 20px',
                            borderRadius: '12px',
                            background: 'var(--bg-card)',
                            border: '1px solid var(--border)',
                            color: 'var(--text-primary)',
                            cursor: 'pointer',
                            fontSize: '14px',
                            fontWeight: 500
                        }}
                    >
                        <ArrowLeft size={16} />
                        Nazad
                    </button>
                </div>
            </div>

            {/* Tab Navigation */}
            <div style={{
                background: 'var(--bg-card)',
                borderBottom: '1px solid var(--border)',
                display: 'flex',
                gap: '5px',
                padding: '0 30px'
            }}>
                <button
                    onClick={() => setActiveTab('chat')}
                    style={{
                        padding: '12px 24px',
                        background: activeTab === 'chat' ? 'var(--bg-main)' : 'transparent',
                        border: 'none',
                        borderBottom: activeTab === 'chat' ? '2px solid var(--accent)' : '2px solid transparent',
                        color: activeTab === 'chat' ? 'var(--text-primary)' : 'var(--text-secondary)',
                        fontSize: '14px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                    }}
                >
                    <MessageSquare size={16} />
                    Live Chat
                </button>
                <button
                    onClick={() => setActiveTab('office')}
                    style={{
                        padding: '12px 24px',
                        background: activeTab === 'office' ? 'var(--bg-main)' : 'transparent',
                        border: 'none',
                        borderBottom: activeTab === 'office' ? '2px solid var(--accent)' : '2px solid transparent',
                        color: activeTab === 'office' ? 'var(--text-primary)' : 'var(--text-secondary)',
                        fontSize: '14px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                    }}
                >
                    <LayoutDashboard size={16} />
                    Virtuelna Kancelarija
                </button>
                <button
                    onClick={() => setActiveTab('training')}
                    style={{
                        padding: '12px 24px',
                        background: activeTab === 'training' ? 'var(--bg-main)' : 'transparent',
                        border: 'none',
                        borderBottom: activeTab === 'training' ? '2px solid var(--accent)' : '2px solid transparent',
                        color: activeTab === 'training' ? 'var(--text-primary)' : 'var(--text-secondary)',
                        fontSize: '14px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                    }}
                >
                    <BookOpen size={16} />
                    Training Hub
                </button>
                <button
                    onClick={() => setActiveTab('meeting')}
                    style={{
                        padding: '12px 24px',
                        background: activeTab === 'meeting' ? 'var(--bg-main)' : 'transparent',
                        border: 'none',
                        borderBottom: activeTab === 'meeting' ? '2px solid var(--accent)' : '2px solid transparent',
                        color: activeTab === 'meeting' ? 'var(--text-primary)' : 'var(--text-secondary)',
                        fontSize: '14px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                    }}
                >
                    <Users size={16} />
                    Sala za sastanke
                </button>
                <button
                    onClick={() => setActiveTab('logs')}
                    style={{
                        padding: '12px 24px',
                        background: activeTab === 'logs' ? 'var(--bg-main)' : 'transparent',
                        border: 'none',
                        borderBottom: activeTab === 'logs' ? '2px solid var(--accent)' : '2px solid transparent',
                        color: activeTab === 'logs' ? 'var(--text-primary)' : 'var(--text-secondary)',
                        fontSize: '14px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                    }}
                >
                    <Activity size={16} />
                    Logovi Aktivnosti
                </button>
                <button
                    onClick={() => setActiveTab('security')}
                    style={{
                        padding: '12px 24px',
                        background: activeTab === 'security' ? 'var(--bg-main)' : 'transparent',
                        border: 'none',
                        borderBottom: activeTab === 'security' ? '2px solid var(--accent)' : '2px solid transparent',
                        color: activeTab === 'security' ? 'var(--text-primary)' : 'var(--text-secondary)',
                        fontSize: '14px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                    }}
                >
                    <Shield size={16} />
                    Code Audit & Security
                </button>
            </div>
            
            {/* Content Area */}
            <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
                {activeTab === 'chat' && (
                    <div style={{
                        width: '320px',
                        borderRight: '1px solid var(--border)',
                        background: 'var(--bg-card)',
                        display: 'flex',
                        flexDirection: 'column',
                        overflow: 'hidden'
                    }}>
                        <div style={{ padding: '20px', borderBottom: '1px solid var(--border)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                <h3 style={{ fontSize: '14px', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <Network size={16} />
                                    Agent Registry
                                </h3>
                                <button
                                    onClick={selectAllAgents}
                                    style={{
                                        fontSize: '11px',
                                        padding: '4px 8px',
                                        borderRadius: '6px',
                                        background: 'rgba(102, 126, 234, 0.1)',
                                        border: '1px solid rgba(102, 126, 234, 0.2)',
                                        color: 'var(--accent)',
                                        cursor: 'pointer',
                                        fontWeight: 600
                                    }}
                                >
                                    {selectedAgentIds.length === agents.length ? 'Deselect All' : 'Select All'}
                                </button>
                            </div>
                            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: 0 }}>
                                {selectedAgentIds.length > 0
                                    ? `${selectedAgentIds.length} Agents Selected Manually`
                                    : `${agents.length} Agents (Auto-selection active)`}
                            </p>
                        </div>

                        <div style={{ flex: 1, overflowY: 'auto', padding: '15px' }}>
                            {agents.map(agent => (
                                <motion.div
                                    key={agent.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    onClick={() => toggleAgentSelection(agent.id)}
                                    style={{
                                        background: selectedAgentIds.includes(agent.id)
                                            ? 'rgba(59, 130, 246, 0.15)'
                                            : 'var(--bg-main)',
                                        border: `1px solid ${selectedAgentIds.includes(agent.id) ? 'var(--accent)' : 'var(--border)'}`,
                                        borderRadius: '12px',
                                        padding: '12px',
                                        marginBottom: '10px',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s',
                                        boxShadow: selectedAgentIds.includes(agent.id)
                                            ? `0 0 15px -5px ${agent.color}80`
                                            : 'none',
                                        position: 'relative'
                                    }}
                                >
                                    {selectedAgentIds.includes(agent.id) && (
                                        <div style={{
                                            position: 'absolute',
                                            top: '8px',
                                            right: '8px',
                                            width: '6px',
                                            height: '6px',
                                            borderRadius: '50%',
                                            background: agent.color,
                                            boxShadow: `0 0 8px ${agent.color}`
                                        }} />
                                    )}
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                                        <div style={{
                                            width: '36px',
                                            height: '36px',
                                            borderRadius: '10px',
                                            background: agent.avatarUrl ? 'transparent' : agent.color,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            color: '#fff',
                                            overflow: 'hidden',
                                            border: agent.avatarUrl ? '1px solid var(--border)' : 'none'
                                        }}>
                                            {agent.avatarUrl ? (
                                                <img 
                                                    src={agent.avatarUrl} 
                                                    alt={agent.name} 
                                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                                    onError={(e) => {
                                                        e.currentTarget.style.display = 'none';
                                                        e.currentTarget.parentElement!.innerHTML = `<span style="font-weight: 700; font-size: 14px;">${agent.name.charAt(0)}</span>`;
                                                    }}
                                                />
                                            ) : (
                                                agent.icon
                                            )}
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontSize: '13px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                {agent.name}
                                                <span style={{
                                                    fontSize: '9px',
                                                    fontWeight: 700,
                                                    padding: '2px 6px',
                                                    borderRadius: '6px',
                                                    background: agent.minLevel === 6 ? 'rgba(239, 68, 68, 0.1)' :
                                                        agent.minLevel >= 4 ? 'rgba(139, 92, 246, 0.1)' :
                                                            agent.minLevel >= 3 ? 'rgba(16, 185, 129, 0.1)' :
                                                                'rgba(59, 130, 246, 0.1)',
                                                    color: agent.minLevel === 6 ? '#ef4444' :
                                                        agent.minLevel >= 4 ? '#8b5cf6' :
                                                            agent.minLevel >= 3 ? '#10b981' :
                                                                '#3b82f6',
                                                    border: `1px solid ${agent.minLevel === 6 ? 'rgba(239, 68, 68, 0.2)' :
                                                        agent.minLevel >= 4 ? 'rgba(139, 92, 246, 0.2)' :
                                                            agent.minLevel >= 3 ? 'rgba(16, 185, 129, 0.2)' :
                                                                'rgba(59, 130, 246, 0.2)'}`
                                                }}>
                                                    Lvl {agent.minLevel}
                                                </span>
                                                {agent.id === 'insight-agent' && (
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            chatFileInputRef.current?.click();
                                                        }}
                                                        style={{
                                                            background: 'var(--accent)',
                                                            border: 'none',
                                                            borderRadius: '6px',
                                                            color: '#fff',
                                                            padding: '2px 8px',
                                                            fontSize: '10px',
                                                            fontWeight: 700,
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: '4px',
                                                            cursor: 'pointer'
                                                        }}
                                                    >
                                                        <Upload size={10} />
                                                        IMPORT
                                                    </button>
                                                )}
                                            </div>
                                            <div style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                                {agent.module}
                                                <span style={{ 
                                                    fontSize: '8px', 
                                                    background: 'rgba(99, 102, 241, 0.1)', 
                                                    padding: '1px 4px', 
                                                    borderRadius: '4px',
                                                    color: 'var(--accent)',
                                                    fontWeight: 700,
                                                    border: '1px solid rgba(99, 102, 241, 0.2)'
                                                }}>GEMINI 2.0 FLASH</span>
                                            </div>
                                        </div>
                                        <div style={{
                                            width: '8px',
                                            height: '8px',
                                            borderRadius: '50%',
                                            background: activeAgents.includes(agent.id) ? '#10b981' : '#6b7280'
                                        }} />
                                    </div>
                                    <div style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>
                                        {agent.capabilities.slice(0, 2).join(', ')}
                                        {agent.capabilities.length > 2 && ` +${agent.capabilities.length - 2}`}
                                    </div>
                                </motion.div>
                            ))}
                        </div>

                        {/* File history UI */}
                        {fileHistory.length > 0 && (
                            <div style={{
                                padding: '15px',
                                borderTop: '1px solid var(--border)',
                                background: 'rgba(0,0,0,0.1)',
                                maxHeight: '300px',
                                display: 'flex',
                                flexDirection: 'column'
                            }}>
                                <h4 style={{
                                    fontSize: '11px',
                                    fontWeight: 700,
                                    margin: '0 0 10px 0',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    opacity: 0.7
                                }}>
                                    <Clock size={12} />
                                    POSLEDNJI FAJLOVI (10)
                                </h4>
                                <div style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '6px',
                                    overflowY: 'auto'
                                }}>
                                    {fileHistory.map((item, idx) => (
                                        <div
                                            key={idx}
                                            onClick={() => handleReAttachFile(item)}
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '8px',
                                                padding: '8px',
                                                background: 'var(--bg-main)',
                                                borderRadius: '8px',
                                                border: '1px solid var(--border)',
                                                cursor: 'pointer',
                                                transition: 'all 0.2s'
                                            }}
                                            title="Kliknite da ponovo priložite ovaj fajl"
                                        >
                                            <div style={{ opacity: 0.8 }}>
                                                {getFileIcon(item.type, item.name)}
                                            </div>
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <div style={{
                                                    fontSize: '11px',
                                                    fontWeight: 600,
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis',
                                                    whiteSpace: 'nowrap'
                                                }}>
                                                    {item.name}
                                                </div>
                                                <div style={{ fontSize: '9px', opacity: 0.5 }}>
                                                    {formatFileSize(item.size)} • {item.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </div>
                                            </div>
                                            <Plus size={10} style={{ opacity: 0.5 }} />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Main Content Area - Chat or Training */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                    {activeTab === 'chat' ? (
                        <>
                            {/* Messages */}
                            <div style={{
                                flex: 1,
                                overflowY: 'auto',
                                padding: '20px',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '15px'
                            }}>
                                <AnimatePresence>
                                    {messages.map((message) => (
                                        <motion.div
                                            key={message.id}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            style={{
                                                alignSelf: message.role === 'user' ? 'flex-end' : 'flex-start',
                                                maxWidth: '70%'
                                            }}
                                        >
                                            <div style={{
                                                background: message.role === 'user'
                                                    ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                                                    : message.role === 'orchestrator'
                                                        ? 'var(--bg-card)'
                                                        : 'rgba(59, 130, 246, 0.1)',
                                                color: message.role === 'user' ? '#fff' : 'var(--text-primary)',
                                                padding: '12px 16px',
                                                borderRadius: '16px',
                                                border: message.role !== 'user' ? '1px solid var(--border)' : 'none',
                                                boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                                            }}>
                                                {message.agentName && (
                                                    <div style={{
                                                        fontSize: '10px',
                                                        fontWeight: 700,
                                                        color: 'var(--accent)',
                                                        marginBottom: '6px',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'space-between',
                                                        width: '100%'
                                                    }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                            <Cpu size={12} />
                                                            {message.agentName}
                                                        </div>
                                                        {(message.role === 'agent' || message.role === 'orchestrator') && (
                                                            <button 
                                                                onClick={() => {
                                                                    const agentId = agents.find(a => a.name === message.agentName)?.id || 'orchestrator';
                                                                    speakContent(message.content, agentId);
                                                                }}
                                                                style={{ background: 'transparent', border: 'none', color: 'var(--accent)', cursor: 'pointer', padding: '2px', display: 'flex' }}
                                                                title="Slušaj poruku"
                                                            >
                                                                <Volume2 size={12} />
                                                            </button>
                                                        )}
                                                    </div>
                                                )}
                                                <div style={{ fontSize: '14px', lineHeight: '1.5' }}>
                                                    {message.content}
                                                </div>

                                                {/* Message File Attachments */}
                                                {message.files && message.files.length > 0 && (
                                                    <div style={{
                                                        marginTop: '10px',
                                                        display: 'flex',
                                                        flexDirection: 'column',
                                                        gap: '6px'
                                                    }}>
                                                        {message.files.map((file, idx) => (
                                                            <div key={idx} style={{
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                gap: '8px',
                                                                background: message.role === 'user' ? 'rgba(255,255,255,0.1)' : 'var(--bg-main)',
                                                                padding: '6px 10px',
                                                                borderRadius: '8px',
                                                                border: message.role === 'user' ? 'none' : '1px solid var(--border)',
                                                                fontSize: '11px'
                                                            }}>
                                                                {getFileIcon(file.type, file.name)}
                                                                <span style={{ fontWeight: 600 }}>{file.name}</span>
                                                                <span style={{ opacity: 0.6 }}>({formatFileSize(file.size)})</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}

                                                <div style={{
                                                    fontSize: '10px',
                                                    opacity: 0.7,
                                                    marginTop: '6px',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '6px',
                                                    justifyContent: 'space-between'
                                                }}>
                                                    <span>{message.timestamp.toLocaleTimeString()}</span>
                                                    {message.status && getMessageStatusIcon(message.status)}
                                                </div>

                                                {/* Report Rendering */}
                                                {message.report && (
                                                    <div style={{
                                                        marginTop: '15px',
                                                        background: 'var(--bg-main)',
                                                        borderRadius: '12px',
                                                        border: '1px solid var(--accent)',
                                                        overflow: 'hidden',
                                                        boxShadow: '0 4px 20px rgba(0,0,0,0.2)'
                                                    }}>
                                                        <div style={{
                                                            padding: '12px',
                                                            background: 'linear-gradient(90deg, rgba(59, 130, 246, 0.2), transparent)',
                                                            borderBottom: '1px solid var(--border)',
                                                            display: 'flex',
                                                            justifyContent: 'space-between',
                                                            alignItems: 'center'
                                                        }}>
                                                            <div style={{ fontWeight: 700, fontSize: '12px', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-primary)' }}>
                                                                <BarChart3 size={14} color="var(--accent)" />
                                                                {message.report.title}
                                                            </div>
                                                            <div style={{ display: 'flex', gap: '5px' }}>
                                                                <button
                                                                    onClick={() => message.report && handleExportExcel(message.report)}
                                                                    style={{ background: 'rgba(34, 197, 94, 0.1)', border: 'none', borderRadius: '4px', padding: '4px 8px', color: '#22c55e', fontSize: '10px', cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}
                                                                >
                                                                    <FileSpreadsheet size={12} /> EXCEL
                                                                </button>
                                                                <button
                                                                    onClick={() => message.report && handleExportHtml(message.report)}
                                                                    style={{ background: 'rgba(59, 130, 246, 0.1)', border: 'none', borderRadius: '4px', padding: '4px 8px', color: '#3b82f6', fontSize: '10px', cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}
                                                                >
                                                                    <FileCode size={12} /> HTML
                                                                </button>
                                                            </div>
                                                        </div>
                                                        <div style={{ padding: '15px' }}>
                                                            <div style={{ fontSize: '12px', opacity: 0.8, marginBottom: '15px', fontStyle: 'italic', borderLeft: '2px solid var(--accent)', paddingLeft: '10px', color: 'var(--text-primary)' }}>
                                                                {message.report.summary}
                                                            </div>
                                                            <div style={{ overflowX: 'auto' }}>
                                                                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
                                                                    <thead>
                                                                        <tr>
                                                                            {message.report?.columns.map((col, i) => (
                                                                                <th key={i} style={{ textAlign: 'left', padding: '8px', borderBottom: '2px solid var(--border)', color: 'var(--text-secondary)' }}>{col.header}</th>
                                                                            ))}
                                                                        </tr>
                                                                    </thead>
                                                                    <tbody>
                                                                        {message.report?.rows.map((row, ri) => (
                                                                            <tr key={ri} style={{ borderBottom: '1px solid var(--border)', color: 'var(--text-primary)' }}>
                                                                                {message.report?.columns.map((col, ci) => (
                                                                                    <td key={ci} style={{ padding: '8px', color: row[col.key]?.toString().includes('!') ? '#ef4444' : 'inherit', fontWeight: row[col.key]?.toString().includes('!') ? 700 : 400 }}>
                                                                                        {row[col.key]}
                                                                                    </td>
                                                                                ))}
                                                                            </tr>
                                                                        ))}
                                                                    </tbody>
                                                                </table>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                                <div ref={chatEndRef} />
                            </div>

                            {/* Input Area */}
                            <div style={{
                                padding: '20px',
                                borderTop: '1px solid var(--border)',
                                background: 'var(--bg-card)'
                            }}>
                                {/* Chat File Preview */}
                                {chatFiles.length > 0 && (
                                    <div style={{
                                        display: 'flex',
                                        gap: '10px',
                                        marginBottom: '15px',
                                        flexWrap: 'wrap'
                                    }}>
                                        {chatFiles.map((file, index) => (
                                            <div key={index} style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '8px',
                                                background: 'var(--bg-main)',
                                                border: '1px solid var(--border)',
                                                borderRadius: '8px',
                                                padding: '4px 10px',
                                                fontSize: '12px'
                                            }}>
                                                <FileText size={14} color="var(--accent)" />
                                                <span style={{ maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                    {file.name}
                                                </span>
                                                <button
                                                    onClick={() => handleRemoveChatFile(index)}
                                                    style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', padding: 0 }}
                                                >
                                                    <X size={14} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                <div style={{ display: 'flex', gap: '10px' }}>
                                    <input
                                        type="file"
                                        ref={chatFileInputRef}
                                        onChange={handleChatFileSelect}
                                        style={{ display: 'none' }}
                                        accept=".xlsx,.csv,.pdf,image/*,.html,.htm"
                                        multiple
                                    />
                                    <button
                                        onClick={() => chatFileInputRef.current?.click()}
                                        disabled={isProcessing}
                                        style={{
                                            padding: '14px',
                                            borderRadius: '12px',
                                            background: 'var(--bg-main)',
                                            border: '1px solid var(--border)',
                                            color: 'var(--text-secondary)',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            transition: 'all 0.2s'
                                        }}
                                        title="Dodaj fajl"
                                    >
                                        <Paperclip size={20} />
                                    </button>
                                    <input
                                        type="text"
                                        value={currentInput}
                                        onChange={(e) => setCurrentInput(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                                        placeholder="Pitajte Master Orchestrator-a..."
                                        disabled={isProcessing}
                                        style={{
                                            flex: 1,
                                            padding: '14px 18px',
                                            borderRadius: '12px',
                                            background: 'var(--bg-main)',
                                            border: '1px solid var(--border)',
                                            color: 'var(--text-primary)',
                                            fontSize: '14px',
                                            outline: 'none'
                                        }}
                                    />
                                    <button
                                        onClick={handleSend}
                                        disabled={(!currentInput.trim() && chatFiles.length === 0) || isProcessing}
                                        style={{
                                            padding: '14px 24px',
                                            borderRadius: '12px',
                                            background: isProcessing
                                                ? 'var(--bg-main)'
                                                : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                            border: 'none',
                                            color: '#fff',
                                            cursor: isProcessing ? 'not-allowed' : 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '8px',
                                            fontSize: '14px',
                                            fontWeight: 700,
                                            boxShadow: isProcessing ? 'none' : '0 4px 15px rgba(102, 126, 234, 0.4)',
                                            transition: 'all 0.2s'
                                        }}
                                    >
                                        {isProcessing ? (
                                            <>
                                                <RefreshCcw size={18} className="spin" />
                                                <span>OBRADA...</span>
                                            </>
                                        ) : (
                                            <>
                                                <Send size={18} />
                                                <span>POŠALJI</span>
                                            </>
                                        )}
                                    </button>

                                    <button
                                        onClick={() => setVoiceEnabled(!voiceEnabled)}
                                        style={{
                                            padding: '14px',
                                            borderRadius: '12px',
                                            background: voiceEnabled ? 'rgba(99, 102, 241, 0.1)' : 'var(--bg-main)',
                                            border: voiceEnabled ? '1px solid var(--accent)' : '1px solid var(--border)',
                                            color: voiceEnabled ? 'var(--accent)' : 'var(--text-secondary)',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s'
                                        }}
                                        title={voiceEnabled ? "Isključi glas" : "Uključi glas"}
                                    >
                                        {voiceEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
                                    </button>
                                </div>
                            </div>
                        </>
                    ) : activeTab === 'office' ? (
                        <div style={{ flex: 1, overflowY: 'auto', padding: '40px', background: 'var(--bg-main)' }}>
                            <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                                <div style={{ textAlign: 'center', marginBottom: '50px' }}>
                                    <h2 style={{ fontSize: '32px', fontWeight: 900, marginBottom: '10px', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                                        Virtuelna Kancelarija Prime Click
                                    </h2>
                                    <p style={{ color: 'var(--text-secondary)', fontSize: '16px' }}>
                                        Struktura agencije i AI zaposleni
                                    </p>
                                </div>

                                {/* CEO - Nenad */}
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '60px', position: 'relative' }}>
                                    <motion.div
                                        whileHover={{ scale: 1.05 }}
                                        style={{
                                            width: '320px',
                                            padding: '24px',
                                            background: 'var(--bg-card)',
                                            borderRadius: '24px',
                                            border: '2px solid #000',
                                            boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
                                            textAlign: 'center',
                                            position: 'relative',
                                            zIndex: 2
                                        }}
                                    >
                                        <div style={{ width: '100px', height: '100px', borderRadius: '50%', background: '#000', margin: '0 auto 15px', overflow: 'hidden', border: '4px solid var(--accent)' }}>
                                            <img src="/avatars/nenad_ceo.png" alt="Nenad" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={(e) => (e.currentTarget.src = 'https://ui-avatars.com/api/?name=Nenad&background=000&color=fff')} />
                                        </div>
                                        <h3 style={{ margin: '0 0 5px 0', fontSize: '20px', fontWeight: 800 }}>Nenad</h3>
                                        <div style={{ display: 'inline-block', padding: '4px 12px', background: 'rgba(0,0,0,0.1)', borderRadius: '20px', fontSize: '12px', fontWeight: 700, marginBottom: '5px' }}>CEO & FOUNDER</div>
                                        <div style={{ fontSize: '10px', fontWeight: 800, color: 'var(--accent)', marginBottom: '12px' }}>AI MODEL: GEMINI 2.0 FLASH</div>
                                        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 20, fontStyle: 'italic' }}>"Tata nad svim avatarima. Vizija i strateške odluke."</p>
                                        <button
                                            onClick={() => {
                                                setActiveTab('chat');
                                                setSelectedAgentIds(['ljubica']);
                                                setCurrentInput('Instrukcije od CEO: ');
                                            }}
                                            style={{
                                                width: '100%',
                                                padding: '10px',
                                                borderRadius: '12px',
                                                background: 'var(--accent)',
                                                border: 'none',
                                                color: '#fff',
                                                fontSize: '12px',
                                                fontWeight: 800,
                                                cursor: 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                gap: '8px',
                                                boxShadow: '0 4px 10px rgba(99, 102, 241, 0.3)'
                                            }}
                                        >
                                            <Shield size={14} />
                                            DAJ INSTRUKCIJE LJUBICI
                                        </button>
                                    </motion.div>
                                    <div style={{ width: '2px', height: '60px', background: 'var(--border)', marginTop: '-10px' }} />
                                </div>

                                {/* COO - Ljubica */}
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '60px', position: 'relative' }}>
                                    <motion.div
                                        whileHover={{ scale: 1.05 }}
                                        style={{
                                            width: '300px',
                                            padding: '20px',
                                            background: 'var(--bg-card)',
                                            borderRadius: '20px',
                                            border: '1px solid var(--accent)',
                                            boxShadow: '0 8px 25px rgba(99, 102, 241, 0.1)',
                                            textAlign: 'center',
                                            zIndex: 2
                                        }}
                                    >
                                        <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'var(--accent)', margin: '0 auto 12px', overflow: 'hidden', border: '3px solid #fff' }}>
                                            <img src="/avatars/ljubica_coo.png" alt="Ljubica" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={(e) => (e.currentTarget.src = 'https://ui-avatars.com/api/?name=Ljubica&background=6366f1&color=fff')} />
                                        </div>
                                        <h3 style={{ margin: '0 0 5px 0', fontSize: '18px', fontWeight: 700 }}>Ljubica</h3>
                                        <div style={{ display: 'inline-block', padding: '3px 10px', background: 'rgba(99, 102, 241, 0.1)', borderRadius: '20px', fontSize: '11px', fontWeight: 700, color: 'var(--accent)', marginBottom: '5px' }}>COO & MASTER ORCHESTRATOR</div>
                                        <div style={{ fontSize: '10px', fontWeight: 800, color: 'var(--accent)', marginBottom: '10px' }}>AI MODEL: GEMINI 2.0 FLASH</div>
                                        <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: 0 }}>Direktno izvršava Nenadove instrukcije i koordiniše tim.</p>
                                    </motion.div>
                                    <div style={{ width: '80%', height: '2px', background: 'var(--border)', position: 'absolute', bottom: '-30px', left: '10%' }} />
                                    <div style={{ width: '2px', height: '30px', background: 'var(--border)' }} />
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '25px', padding: '0 20px' }}>
                                    {agents.filter(a => a.id !== 'nenad' && a.id !== 'ljubica').map(agent => (
                                        <motion.div
                                            key={agent.id}
                                            whileHover={{ y: -5 }}
                                            style={{
                                                background: 'var(--bg-card)',
                                                borderRadius: '20px',
                                                padding: '24px',
                                                border: '1px solid var(--border)',
                                                boxShadow: '0 4px 15px rgba(0,0,0,0.05)',
                                                display: 'flex',
                                                flexDirection: 'column',
                                                alignItems: 'center',
                                                textAlign: 'center'
                                            }}
                                        >
                                            <div style={{
                                                width: '80px',
                                                height: '80px',
                                                borderRadius: '20px',
                                                background: agent.avatarUrl ? 'transparent' : agent.color,
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                color: '#fff',
                                                marginBottom: '15px',
                                                boxShadow: agent.avatarUrl ? '0 5px 15px rgba(0,0,0,0.1)' : `0 8px 20px ${agent.color}40`,
                                                overflow: 'hidden',
                                                border: agent.avatarUrl ? '2px solid #fff' : 'none'
                                            }}>
                                                {agent.avatarUrl ? (
                                                    <img 
                                                        src={agent.avatarUrl} 
                                                        alt={agent.name} 
                                                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                                        onError={(e) => {
                                                            e.currentTarget.src = `https://ui-avatars.com/api/?name=${agent.name}&background=${agent.color.replace('#', '')}&color=fff`;
                                                        }}
                                                    />
                                                ) : (
                                                    agent.icon
                                                )}
                                            </div>
                                            <h4 style={{ margin: '0 0 4px 0', fontSize: '16px', fontWeight: 700 }}>{agent.name}</h4>
                                            <div style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 600, marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                                {agent.module}
                                            </div>
                                            <div style={{ 
                                                fontSize: '9px', 
                                                fontWeight: 800, 
                                                color: agent.color, 
                                                background: `${agent.color}10`,
                                                padding: '2px 8px',
                                                borderRadius: '8px',
                                                marginBottom: '10px',
                                                border: `1px solid ${agent.color}30`
                                            }}>
                                                GEMINI 2.0 FLASH
                                            </div>
                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', justifyContent: 'center', marginTop: 'auto' }}>
                                                {agent.capabilities.slice(0, 3).map((cap, i) => (
                                                    <span key={i} style={{ fontSize: '10px', padding: '3px 8px', background: 'var(--bg-main)', borderRadius: '12px', border: '1px solid var(--border)' }}>
                                                        {cap}
                                                    </span>
                                                ))}
                                            </div>
                                            <button
                                                onClick={() => {
                                                    setActiveTab('chat');
                                                    setSelectedAgentIds([agent.id]);
                                                }}
                                                style={{
                                                    marginTop: '15px',
                                                    width: '100%',
                                                    padding: '8px',
                                                    borderRadius: '10px',
                                                    background: 'transparent',
                                                    border: `1px solid ${agent.color}`,
                                                    color: agent.color,
                                                    fontSize: '12px',
                                                    fontWeight: 600,
                                                    cursor: 'pointer',
                                                    transition: 'all 0.2s'
                                                }}
                                                onMouseOver={(e) => {
                                                    e.currentTarget.style.background = agent.color;
                                                    e.currentTarget.style.color = '#fff';
                                                }}
                                                onMouseOut={(e) => {
                                                    e.currentTarget.style.background = 'transparent';
                                                    e.currentTarget.style.color = agent.color;
                                                }}
                                            >
                                                Dodeli Zadatak
                                            </button>
                                        </motion.div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ) : activeTab === 'training' ? (
                        <div style={{ flex: 1, overflowY: 'auto', padding: '30px', background: 'var(--bg-main)' }}>
                            <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                                    <div>
                                        <h2 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '8px' }}>
                                            <Users size={24} color="var(--accent)" style={{ marginRight: '10px' }} />
                                            Sala za sastanke
                                        </h2>
                                        <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                                            Izveštaji, pravila i obuka AI agenata
                                        </p>
                                    </div>
                                    <div style={{ display: 'flex', gap: '10px' }}>
                                         <button 
                                            onClick={() => {/* Trigger daily report manually */}}
                                            style={{
                                                padding: '10px 20px',
                                                borderRadius: '12px',
                                                background: 'var(--bg-card)',
                                                border: '1px solid var(--border)',
                                                color: 'var(--text-primary)',
                                                fontSize: '14px',
                                                fontWeight: 600,
                                                cursor: 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '8px'
                                            }}
                                         >
                                            <BarChart3 size={16} />
                                            Dnevni Izveštaj
                                         </button>
                                    </div>
                                </div>


                                {/* Add New Rule Form */}
                                <div style={{
                                    background: 'var(--bg-card)',
                                    border: '1px solid var(--border)',
                                    borderRadius: '16px',
                                    padding: '24px',
                                    marginBottom: '30px',
                                    boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
                                }}>
                                    <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <Plus size={18} color="var(--accent)" />
                                        Novo Pravilo
                                    </h3>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
                                        <input
                                            placeholder="Naziv pravila (npr: Email Automatizacija)"
                                            value={editingRule?.title || ''}
                                            onChange={e => setEditingRule({ ...editingRule, title: e.target.value })}
                                            style={{
                                                padding: '12px 16px',
                                                borderRadius: '10px',
                                                background: 'var(--bg-main)',
                                                border: '1px solid var(--border)',
                                                color: 'var(--text-primary)',
                                                fontSize: '14px'
                                            }}
                                        />
                                        <select
                                            value={editingRule?.agentId || ''}
                                            onChange={e => setEditingRule({ ...editingRule, agentId: e.target.value })}
                                            style={{
                                                padding: '12px 16px',
                                                borderRadius: '10px',
                                                background: 'var(--bg-main)',
                                                border: '1px solid var(--border)',
                                                color: 'var(--text-primary)',
                                                fontSize: '14px'
                                            }}
                                        >
                                            <option value="" style={{ background: 'var(--bg-card)', color: 'var(--text-primary)' }}>Izaberi Agenta...</option>
                                            {agents.map(agent => (
                                                <option key={agent.id} value={agent.id} style={{ background: 'var(--bg-card)', color: 'var(--text-primary)' }}>{agent.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <textarea
                                        placeholder="Opis pravila i instrukcije..."
                                        value={editingRule?.description || ''}
                                        onChange={e => setEditingRule({ ...editingRule, description: e.target.value })}
                                        style={{
                                            width: '100%',
                                            height: '100px',
                                            padding: '12px 16px',
                                            borderRadius: '10px',
                                            background: 'var(--bg-main)',
                                            border: '1px solid var(--border)',
                                            color: 'var(--text-primary)',
                                            fontSize: '14px',
                                            marginBottom: '15px',
                                            resize: 'vertical'
                                        }}
                                    />
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px', marginBottom: '15px' }}>
                                        <input
                                            placeholder="Trigger (npr: 'kada dobijemo email')"
                                            value={editingRule?.trigger || ''}
                                            onChange={e => setEditingRule({ ...editingRule, trigger: e.target.value })}
                                            style={{
                                                padding: '12px 16px',
                                                borderRadius: '10px',
                                                background: 'var(--bg-main)',
                                                border: '1px solid var(--border)',
                                                color: 'var(--text-primary)',
                                                fontSize: '14px'
                                            }}
                                        />
                                        <input
                                            placeholder="Action (npr: 'analiziraj i odgovori')"
                                            value={editingRule?.action || ''}
                                            onChange={e => setEditingRule({ ...editingRule, action: e.target.value })}
                                            style={{
                                                padding: '12px 16px',
                                                borderRadius: '10px',
                                                background: 'var(--bg-main)',
                                                border: '1px solid var(--border)',
                                                color: 'var(--text-primary)',
                                                fontSize: '14px'
                                            }}
                                        />
                                        <select
                                            value={editingRule?.priority || 'medium'}
                                            onChange={e => setEditingRule({ ...editingRule, priority: e.target.value as TrainingRule['priority'] })}
                                            style={{
                                                padding: '12px 16px',
                                                borderRadius: '10px',
                                                background: 'var(--bg-main)',
                                                border: '1px solid var(--border)',
                                                color: 'var(--text-primary)',
                                                fontSize: '14px'
                                            }}
                                        >
                                            <option value="low" style={{ background: 'var(--bg-card)', color: 'var(--text-primary)' }}>Low Priority</option>
                                            <option value="medium" style={{ background: 'var(--bg-card)', color: 'var(--text-primary)' }}>Medium Priority</option>
                                            <option value="high" style={{ background: 'var(--bg-card)', color: 'var(--text-primary)' }}>High Priority</option>
                                        </select>
                                    </div>

                                    {/* Document Upload Section */}
                                    <div style={{ marginBottom: '15px' }}>
                                        <div style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '10px',
                                            marginBottom: '10px'
                                        }}>
                                            <Upload size={16} style={{ color: 'var(--text-secondary)' }} />
                                            <label style={{
                                                fontSize: '13px',
                                                fontWeight: 600,
                                                color: 'var(--text-secondary)'
                                            }}>
                                                Dodaj Dokumente za Učenje (PDF, Excel, Word, TXT, JSON)
                                            </label>
                                        </div>
                                        <input
                                            ref={fileInputRef}
                                            type="file"
                                            multiple
                                            accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,.csv,.json"
                                            onChange={handleFileSelect}
                                            style={{
                                                padding: '12px 16px',
                                                borderRadius: '10px',
                                                background: 'var(--bg-main)',
                                                border: '1px solid var(--border)',
                                                color: 'var(--text-primary)',
                                                fontSize: '14px',
                                                width: '100%',
                                                cursor: 'pointer'
                                            }}
                                        />

                                        {/* Uploaded Files Preview */}
                                        {uploadingDocs.length > 0 && (
                                            <div style={{
                                                marginTop: '10px',
                                                display: 'flex',
                                                flexDirection: 'column',
                                                gap: '8px'
                                            }}>
                                                {uploadingDocs.map((file, index) => (
                                                    <div key={index} style={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'space-between',
                                                        padding: '8px 12px',
                                                        background: 'rgba(102, 126, 234, 0.1)',
                                                        border: '1px solid rgba(102, 126, 234, 0.2)',
                                                        borderRadius: '8px'
                                                    }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                            {getFileIcon(file.type)}
                                                            <span style={{ fontSize: '13px' }}>{file.name}</span>
                                                            <span style={{
                                                                fontSize: '11px',
                                                                color: 'var(--text-secondary)'
                                                            }}>
                                                                ({formatFileSize(file.size)})
                                                            </span>
                                                        </div>
                                                        <button
                                                            onClick={() => handleRemoveUploadingDoc(index)}
                                                            style={{
                                                                background: 'rgba(239, 68, 68, 0.1)',
                                                                border: 'none',
                                                                borderRadius: '6px',
                                                                padding: '4px 8px',
                                                                color: '#ef4444',
                                                                cursor: 'pointer',
                                                                display: 'flex',
                                                                alignItems: 'center'
                                                            }}
                                                        >
                                                            <X size={14} />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    <button
                                        onClick={() => handleAddRuleWithDocs()}
                                        disabled={!editingRule?.title || !editingRule?.agentId}
                                        style={{
                                            padding: '12px 24px',
                                            borderRadius: '10px',
                                            background: (!editingRule?.title || !editingRule?.agentId)
                                                ? 'var(--bg-main)'
                                                : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                            border: 'none',
                                            color: '#fff',
                                            fontSize: '14px',
                                            fontWeight: 600,
                                            cursor: (!editingRule?.title || !editingRule?.agentId) ? 'not-allowed' : 'pointer',
                                            opacity: (!editingRule?.title || !editingRule?.agentId) ? 0.5 : 1,
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '8px',
                                            transition: 'all 0.2s'
                                        }}
                                    >
                                        <Save size={16} />
                                        Sačuvaj Pravilo
                                    </button>
                                </div>

                                {/* Existing Rules */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                    {trainingRules.length === 0 ? (
                                        <div style={{
                                            textAlign: 'center',
                                            padding: '60px 20px',
                                            color: 'var(--text-secondary)'
                                        }}>
                                            <BookOpen size={48} style={{ margin: '0 auto 16px', opacity: 0.3 }} />
                                            <p style={{ fontSize: '16px', fontWeight: 600, marginBottom: '8px' }}>
                                                Još nema definisanih pravila
                                            </p>
                                            <p style={{ fontSize: '14px' }}>
                                                Kreirajte prvo pravilo da biste naučili AI agente kako da rade
                                            </p>
                                        </div>
                                    ) : (
                                        trainingRules.map(rule => {
                                            const agent = agents.find(a => a.id === rule.agentId);
                                            return (
                                                <motion.div
                                                    key={rule.id}
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    style={{
                                                        background: 'var(--bg-card)',
                                                        border: '1px solid var(--border)',
                                                        borderRadius: '12px',
                                                        padding: '20px',
                                                        opacity: rule.enabled ? 1 : 0.5
                                                    }}
                                                >
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                                                        <div style={{ flex: 1 }}>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                                                                {agent && (
                                                                    <div style={{
                                                                        width: '32px',
                                                                        height: '32px',
                                                                        borderRadius: '8px',
                                                                        background: agent.color,
                                                                        display: 'flex',
                                                                        alignItems: 'center',
                                                                        justifyContent: 'center',
                                                                        color: '#fff'
                                                                    }}>
                                                                        {agent.icon}
                                                                    </div>
                                                                )}
                                                                <div>
                                                                    <h4 style={{ fontSize: '15px', fontWeight: 600, margin: 0 }}>
                                                                        {rule.title}
                                                                    </h4>
                                                                    <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '2px 0 0' }}>
                                                                        {agent?.name}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                            {rule.description && (
                                                                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '12px' }}>
                                                                    {rule.description}
                                                                </p>
                                                            )}
                                                            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                                                                {rule.trigger && (
                                                                    <div style={{ fontSize: '12px' }}>
                                                                        <span style={{ color: 'var(--text-secondary)' }}>Trigger:</span>{' '}
                                                                        <span style={{ color: 'var(--text-primary)' }}>{rule.trigger}</span>
                                                                    </div>
                                                                )}
                                                                {rule.action && (
                                                                    <div style={{ fontSize: '12px' }}>
                                                                        <span style={{ color: 'var(--text-secondary)' }}>Action:</span>{' '}
                                                                        <span style={{ color: 'var(--text-primary)' }}>{rule.action}</span>
                                                                    </div>
                                                                )}
                                                                <div style={{
                                                                    fontSize: '11px',
                                                                    fontWeight: 700,
                                                                    padding: '4px 8px',
                                                                    borderRadius: '6px',
                                                                    background: `${getPriorityColor(rule.priority)}20`,
                                                                    color: getPriorityColor(rule.priority)
                                                                }}>
                                                                    {rule.priority.toUpperCase()}
                                                                </div>
                                                            </div>

                                                            {/* Attached Documents */}
                                                            {rule.documents && rule.documents.length > 0 && (
                                                                <div style={{ marginTop: '12px' }}>
                                                                    <div style={{
                                                                        fontSize: '12px',
                                                                        fontWeight: 600,
                                                                        color: 'var(--text-secondary)',
                                                                        marginBottom: '8px',
                                                                        display: 'flex',
                                                                        alignItems: 'center',
                                                                        gap: '6px'
                                                                    }}>
                                                                        <FileText size={14} />
                                                                        Dokumenti za učenje ({rule.documents.length})
                                                                    </div>
                                                                    <div style={{
                                                                        display: 'flex',
                                                                        flexDirection: 'column',
                                                                        gap: '6px'
                                                                    }}>
                                                                        {rule.documents.map(doc => (
                                                                            <div key={doc.id} style={{
                                                                                display: 'flex',
                                                                                alignItems: 'center',
                                                                                justifyContent: 'space-between',
                                                                                padding: '6px 10px',
                                                                                background: 'rgba(102, 126, 234, 0.05)',
                                                                                border: '1px solid rgba(102, 126, 234, 0.1)',
                                                                                borderRadius: '6px'
                                                                            }}>
                                                                                <div style={{
                                                                                    display: 'flex',
                                                                                    alignItems: 'center',
                                                                                    gap: '8px',
                                                                                    flex: 1
                                                                                }}>
                                                                                    {getFileIcon(doc.type)}
                                                                                    <span style={{ fontSize: '12px' }}>{doc.name}</span>
                                                                                    <span style={{
                                                                                        fontSize: '10px',
                                                                                        color: 'var(--text-secondary)'
                                                                                    }}>
                                                                                        {formatFileSize(doc.size)}
                                                                                    </span>
                                                                                </div>
                                                                                <button
                                                                                    onClick={() => handleRemoveDocumentFromRule(rule.id, doc.id)}
                                                                                    style={{
                                                                                        background: 'transparent',
                                                                                        border: 'none',
                                                                                        color: '#ef4444',
                                                                                        cursor: 'pointer',
                                                                                        padding: '2px',
                                                                                        display: 'flex',
                                                                                        alignItems: 'center'
                                                                                    }}
                                                                                >
                                                                                    <X size={12} />
                                                                                </button>
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div style={{ display: 'flex', gap: '8px' }}>
                                                            <button
                                                                onClick={() => handleToggleRule(rule.id)}
                                                                style={{
                                                                    padding: '8px 12px',
                                                                    borderRadius: '8px',
                                                                    background: rule.enabled ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                                                                    border: 'none',
                                                                    color: rule.enabled ? '#10b981' : '#ef4444',
                                                                    fontSize: '12px',
                                                                    fontWeight: 600,
                                                                    cursor: 'pointer'
                                                                }}
                                                            >
                                                                {rule.enabled ? 'Enabled' : 'Disabled'}
                                                            </button>
                                                            <button
                                                                onClick={() => handleDeleteRule(rule.id)}
                                                                style={{
                                                                    padding: '8px',
                                                                    borderRadius: '8px',
                                                                    background: 'rgba(239, 68, 68, 0.1)',
                                                                    border: 'none',
                                                                    color: '#ef4444',
                                                                    cursor: 'pointer',
                                                                    display: 'flex',
                                                                    alignItems: 'center'
                                                                }}
                                                            >
                                                                <Trash2 size={16} />
                                                            </button>
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            );
                                        })
                                    )}
                                </div>
                            </div>
                        </div>
                    ) : activeTab === 'meeting' ? (
                        <div style={{ flex: 1, overflowY: 'auto', padding: '40px', background: 'var(--bg-main)' }}>
                            <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
                                    <div>
                                        <h2 style={{ fontSize: '28px', fontWeight: 900, margin: 0 }}>Sala za Sastanke</h2>
                                        <p style={{ color: 'var(--text-secondary)', marginTop: '5px' }}>Koordinacija i dnevni strateški pregled</p>
                                    </div>
                                    <button
                                        onClick={generateDailyReport}
                                        disabled={isGeneratingReport}
                                        style={{
                                            padding: '12px 24px',
                                            borderRadius: '12px',
                                            background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                                            color: '#fff',
                                            border: 'none',
                                            fontWeight: 700,
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '10px'
                                        }}
                                    >
                                        <Activity size={18} className={isGeneratingReport ? 'spin' : ''} />
                                        GENERISI DNEVNI IZVEŠTAJ
                                    </button>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '40px' }}>
                                    <div style={{ background: 'var(--bg-card)', padding: '20px', borderRadius: '16px', border: '1px solid var(--border)' }}>
                                        <div style={{ color: 'var(--text-secondary)', fontSize: '12px', fontWeight: 600, marginBottom: '10px' }}>AKTIVNI AGENTI</div>
                                        <div style={{ fontSize: '24px', fontWeight: 900, color: '#10b981' }}>{agents.length} / {allAgents.length}</div>
                                    </div>
                                    <div style={{ background: 'var(--bg-card)', padding: '20px', borderRadius: '16px', border: '1px solid var(--border)' }}>
                                        <div style={{ color: 'var(--text-secondary)', fontSize: '12px', fontWeight: 600, marginBottom: '10px' }}>UKUPNO ZADATAKA</div>
                                        <div style={{ fontSize: '24px', fontWeight: 900 }}>{agentStats.reduce((sum, s) => sum + s.tasksCompleted, 0)}</div>
                                    </div>
                                    <div style={{ background: 'var(--bg-card)', padding: '20px', borderRadius: '16px', border: '1px solid var(--border)' }}>
                                        <div style={{ color: 'var(--text-secondary)', fontSize: '12px', fontWeight: 600, marginBottom: '10px' }}>PROS. EFIKASNOST</div>
                                        <div style={{ fontSize: '24px', fontWeight: 900, color: 'var(--accent)' }}>94.2%</div>
                                    </div>
                                    <div style={{ background: 'var(--bg-card)', padding: '20px', borderRadius: '16px', border: '1px solid var(--border)' }}>
                                        <div style={{ color: 'var(--text-secondary)', fontSize: '12px', fontWeight: 600, marginBottom: '10px' }}>STATUS SISTEMA</div>
                                        <div style={{ fontSize: '24px', fontWeight: 900, color: '#10b981' }}>OPTIMALAN</div>
                                    </div>
                                </div>

                                {meetingData ? (
                                    <motion.div
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        style={{ background: 'var(--bg-card)', borderRadius: '24px', border: '1px solid var(--border)', overflow: 'hidden' }}
                                    >
                                        <div style={{ padding: '30px', borderBottom: '1px solid var(--border)', background: 'rgba(99, 102, 241, 0.05)' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <h3 style={{ margin: 0, fontSize: '20px', fontWeight: 800 }}>Dnevni Strateški Izveštaj - {meetingData.date}</h3>
                                                <div style={{ padding: '6px 12px', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '20px', color: '#10b981', fontSize: '11px', fontWeight: 700 }}>VERIFIKOVANO OD CEO</div>
                                            </div>
                                        </div>
                                        <div style={{ padding: '30px' }}>
                                            <div style={{ marginBottom: '30px' }}>
                                                <h4 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--accent)', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <Brain size={16} /> GLAVNI ZAKLJUČAK
                                                </h4>
                                                <p style={{ fontSize: '16px', lineHeight: '1.6', color: 'var(--text-primary)' }}>{meetingData.highlight}</p>
                                            </div>

                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
                                                <div>
                                                    <h4 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '15px' }}>UČINAK PO AGENTIMA</h4>
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                                        {meetingData.agentBreakdown.map((a, i) => (
                                                            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: 'var(--bg-main)', borderRadius: '12px' }}>
                                                                <div>
                                                                    <div style={{ fontWeight: 700, fontSize: '13px' }}>{a.name}</div>
                                                                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{a.impact}</div>
                                                                </div>
                                                                <div style={{ fontWeight: 800, color: 'var(--accent)' }}>{a.tasks}</div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                                <div>
                                                    <h4 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '15px', color: '#ef4444' }}>DETEKTOVANE ANOMALIJE</h4>
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                                        {meetingData.anomalies.map((a, i) => (
                                                            <div key={i} style={{ display: 'flex', gap: '12px', padding: '12px', background: 'rgba(239, 68, 68, 0.05)', borderRadius: '12px', color: '#ef4444', fontSize: '12px' }}>
                                                                <AlertCircle size={16} style={{ flexShrink: 0 }} />
                                                                {a}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                ) : (
                                    <div style={{ height: '300px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-card)', borderRadius: '24px', border: '1px dashed var(--border)', color: 'var(--text-secondary)' }}>
                                        <Users size={48} style={{ opacity: 0.1, marginBottom: '20px' }} />
                                        <p>Kliknite na dugme iznad da započnete analizu današnjih aktivnosti.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div style={{ flex: 1, overflowY: 'auto', padding: '30px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                                <div>
                                    <h2 style={{ fontSize: '24px', fontWeight: 900, color: 'var(--text-primary)', margin: 0 }}>
                                        <Shield size={24} color="#ef4444" style={{ marginRight: '10px' }} />
                                        AI Security Shield
                                    </h2>
                                    <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginTop: '4px' }}>Logovi detektovanih pretnji i pokušaja manipulacije</p>
                                </div>
                                <button
                                    onClick={fetchSecurityEvents}
                                    className="btn-secondary"
                                    style={{ height: '40px', padding: '0 16px', gap: '8px' }}
                                >
                                    <RefreshCcw size={16} className={isLoadingSecurity ? 'spin' : ''} />
                                    Osveži Logove
                                </button>
                            </div>

                            {securityEvents.length === 0 ? (
                                <div style={{
                                    height: '400px',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    background: 'var(--bg-card)',
                                    borderRadius: '24px',
                                    border: '1px dashed var(--border)',
                                    gap: '20px',
                                    color: 'var(--text-secondary)'
                                }}>
                                    <Shield size={64} style={{ opacity: 0.1 }} />
                                    <p>Nisu detektovane bezbednosne pretnje u poslednjih 30 dana.</p>
                                </div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                    {securityEvents.map((event) => (
                                        <div key={event.id} style={{
                                            background: 'var(--bg-card)',
                                            border: '1px solid var(--border)',
                                            borderRadius: '16px',
                                            padding: '20px',
                                            display: 'flex',
                                            gap: '20px',
                                            transition: 'all 0.2s',
                                            borderLeft: '4px solid #ef4444'
                                        }}>
                                            <div style={{
                                                width: '40px',
                                                height: '40px',
                                                borderRadius: '12px',
                                                background: 'rgba(239, 68, 68, 0.1)',
                                                color: '#ef4444',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                flexShrink: 0
                                            }}>
                                                <AlertCircle size={24} />
                                            </div>
                                            <div style={{ flex: 1 }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                                    <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#ef4444', margin: 0 }}>{event.title}</h3>
                                                    <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                                                        {new Date(event.created_at).toLocaleString('sr-RS')}
                                                    </span>
                                                </div>
                                                <p style={{ fontSize: '14px', color: 'var(--text-primary)', lineHeight: '1.6', margin: '0 0 12px 0' }}>{event.message}</p>
                                                <div style={{ display: 'flex', gap: '10px' }}>
                                                    <span style={{ fontSize: '11px', padding: '4px 10px', background: 'var(--bg-main)', borderRadius: '6px', color: 'var(--text-secondary)', fontWeight: 700 }}>
                                                        SEVERITY: CRITICAL
                                                    </span>
                                                    <span style={{ fontSize: '11px', padding: '4px 10px', background: 'var(--bg-main)', borderRadius: '6px', color: 'var(--text-secondary)', fontWeight: 700 }}>
                                                        ACTION: BLOCKED
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            <style>{`
                .spin {
                    animation: spin 1s linear infinite;
                }
                .pulse {
                    animation: pulse 2s ease-in-out infinite;
                }
                @keyframes spin {
                    100% { transform: rotate(360deg); }
                }
                @keyframes pulse {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.5; }
                }
                select option {
                    background-color: #1a1b1e !important;
                    color: #ffffff !important;
                    padding: 10px;
                }
                select:focus {
                    border-color: #667eea !important;
                    box-shadow: 0 0 0 2px rgba(102, 126, 234, 0.2);
                }
            `}</style>
        </div>
    );
}
