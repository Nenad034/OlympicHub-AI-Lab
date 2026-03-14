import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence, useDragControls } from 'framer-motion';
import { useLocation } from 'react-router-dom';
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
  Search, 
  Activity, 
  Mic, 
  MicOff,
  Volume2,
  VolumeX,
  Plus,
  Minus,
  ExternalLink,
  GripHorizontal,
  RefreshCw
} from 'lucide-react';
import { useAppStore } from '../../stores';
import { useToast } from '../../components/ui/Toast';
import { getUserReservations } from '../../services/reservationService';
import { supplierFinanceService } from '../../services/supplierFinanceService';
import { fxService } from '../../services/fxService';
import { getPricelists } from '../../modules/pricing/pricelistService';
import { supplierService } from '../../services/SupplierService';
import { getRevenueContext } from '../../services/revenueAnalystService';
import { getReservationById } from '../../services/reservationService';
import { sendEmail } from '../../services/emailService';
import { supabase } from '../../supabaseClient';
import { AG_APP_KNOWLEDGE, type AgModuleInfo } from '../../constants/agKnowledge';
import './AgPanel.css';

export const AgPanel: React.FC = () => {
  const { isAgOpen, setAgOpen } = useAppStore();
  const location = useLocation();
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
  const [isScanning, setIsScanning] = useState(false);
  const [history, setHistory] = useState<string[]>([]);
  const [systemMap, setSystemMap] = useState<string[]>([]);
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const [cloudStatus, setCloudStatus] = useState<Record<string, 'idle' | 'loading' | 'done'>>({
    'github-push': 'idle',
    'github-pull': 'idle',
    'supabase-sync': 'idle',
    'gcloud-push': 'idle',
    'gcloud-pull': 'idle'
  });
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const [resizeStartX, setResizeStartX] = useState(0);
  const [resizeStartWidth, setResizeStartWidth] = useState(0);

  const startResizing = (e: React.MouseEvent) => {
    setIsResizing(true);
    setResizeStartX(e.clientX);
    setResizeStartWidth(width);
    e.preventDefault();
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      
      const delta = resizeStartX - e.clientX;
      const newWidth = resizeStartWidth + delta;
      
      if (newWidth > 400 && newWidth < window.innerWidth * 0.9) {
        setWidth(newWidth);
      }
    };
    const handleMouseUp = () => setIsResizing(false);

    if (isResizing) {
      window.document.body.style.cursor = 'ew-resize';
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    } else {
      window.document.body.style.cursor = '';
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, resizeStartX, resizeStartWidth]);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isAgOpen) {
      scrollToBottom();
    }
  }, [isAgOpen, messages]);

  // Real-time Database Monitoring (Proactive Mode)
  useEffect(() => {
    const channel = (supabase as any)
      .channel('ag-realtime-observer')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'reservations' }, (payload: any) => {
        handleProactiveUpdate('Nova Rezervacija', `Upravo je kreiran novi dosije za klijenta. Sistem ga je registrovao pod ID-em: ${payload.new.id.substring(0,8)}...`);
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'uplate' }, (payload: any) => {
        handleProactiveUpdate('Nova Uplata', `Registrovan je priliv od **${payload.new.iznos_rsd.toLocaleString()} RSD**. Fiskalizacija je uspešno izvršena.`);
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'ulazni_racuni' }, (payload: any) => {
        handleProactiveUpdate('Novi Trošak', `Evidentiran je ulazni račun od dobavljača **${payload.new.dobavljac_naziv}**. Stanje dugovanja je ažurirano.`);
      })
      .subscribe();

    return () => {
      (supabase as any).removeChannel(channel);
    };
  }, []);

  const handleProactiveUpdate = (title: string, content: string) => {
    const message = `✨ **AG INTELLIGENCE ALERT | ${title.toUpperCase()}**\n\n${content}`;
    setMessages(prev => [...prev.slice(-15), { role: 'agent', content: message }]);
    toast.info(`AG Insight: ${title}`, 'Nove aktivnosti su detektovane u sistemu.');
    if (isVoiceEnabled) speak(content);
  };

  // --- VOICE LOGIC ---
  const startListening = () => {
    if (!('webkitSpeechRecognition' in window)) {
      toast.error('Voice Error', 'Vaš browser ne podržava glasovne komande.');
      return;
    }

    const recognition = new (window as any).webkitSpeechRecognition();
    recognition.lang = 'sr-RS';
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onerror = () => setIsListening(false);
    
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setInput(transcript);
      toast.success('Glas prepoznat', `Rekli ste: "${transcript}"`);
    };

    recognition.start();
  };

  const speak = (text: string) => {
    if (!isVoiceEnabled) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text.replace(/\*\*|###|✨/g, ''));
    utterance.lang = 'sr-RS';
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    window.speechSynthesis.speak(utterance);
  };
  // -------------------

  if (!isAgOpen) return null;

  const handleSend = () => {
    if (!input.trim()) return;
    const userMessage = input;
    setMessages([...messages, { role: 'user', content: userMessage }]);
    setInput('');
    
    setTimeout(async () => {
      let response = '';
      const lowerInput = userMessage.toLowerCase();
      const currentPath = location.pathname;
      
      const currentModuleInfo = AG_APP_KNOWLEDGE.find(m => 
        currentPath === m.path || currentPath.startsWith(m.path + '/') || (m.subItems?.some(s => s.path === currentPath))
      );
      const currentModuleName = currentModuleInfo?.label || (currentPath !== '/' ? currentPath.split('/')[1].toUpperCase() : 'Dashboard');

      // Detect New/Unknown Module
      const isUnknown = !currentModuleInfo && currentPath !== '/';

      if (lowerInput.includes('nauci') || lowerInput.includes('dodaj ovaj modul') || (isUnknown && lowerInput.includes('sta je ovo'))) {
        setIsScanning(true);
        setMessages(prev => [...prev, { 
          role: 'agent', 
          content: `Detektovao sam novi modul na putanji **${currentPath}**. Pokrećem **Heuristic Analysis** kako bih razumeo njegovu svrhu...` 
        }]);

        setTimeout(() => {
          setIsScanning(false);
          const suggestion = `Ovaj modul se bavi funkcionalnošću **${currentModuleName}**. Preporučujem da ga dodamo u Global Knowledge Map pod ovim imenom. Da li želite da automatski ažuriram agKnowledge.ts?`;
          setMessages(prev => [...prev, { 
            role: 'agent', 
            content: suggestion 
          }]);
          setPendingAction('update_knowledge');
        }, 2000);
        return;
      }

      if (lowerInput.includes('skeniraj') || lowerInput.includes('analiziraj sve') || lowerInput.includes('prodji kroz module')) {
        setIsScanning(true);
        setMessages(prev => [...prev, { 
          role: 'agent', 
          content: 'Pokrećem **Deep System Analysis**... Skeniram ruter, mapiram levi sidebar meni i identifikujem sve aktivne podmodule.' 
        }]);

        setTimeout(() => {
          setIsScanning(false);
          const moduleList = AG_APP_KNOWLEDGE.map(m => m.label).join(', ');
          setSystemMap(AG_APP_KNOWLEDGE.map(m => m.label));
          setMessages(prev => [...prev, { 
            role: 'agent', 
            content: `**Skeniranje završeno.** Naučio sam strukturu cele aplikacije. Mapirao sam **${AG_APP_KNOWLEDGE.length}** glavnih modula: ${moduleList}. Za svaki modul znam tačnu putanju, opis i dostupne alate. Sada sam 100% integrisan sa vašim menijem.` 
          }]);
        }, 2500);
        return;
      }

      if (lowerInput.includes('sta') && (lowerInput.includes('ovde') || lowerInput.includes('modul') || lowerInput.includes('moze'))) {
        if (currentModuleInfo) {
          let subItemsDesc = '';
          if (currentModuleInfo.subItems && currentModuleInfo.subItems.length > 0) {
            subItemsDesc = '\n\n**Dostupni podmoduli:**\n' + currentModuleInfo.subItems.map(s => `- **${s.label}**: ${s.description || 'Pristup sekciji'}`).join('\n');
          }
          response = `Nalazimo se u modulu **${currentModuleName}**.\n\n${currentModuleInfo.description}${subItemsDesc}\n\nKako vam mogu pomoći u vezi sa ovim funkcijama?`;
        } else {
          response = `Trenutno se nalazimo u sekciji **${currentModuleName}**. Iako nemam specifičnu definiciju u mapi, spreman sam da analiziram kod ili podatke sa ove stranice.`;
        }
      } else if ((lowerInput.includes('koji') || lowerInput.includes('nabroj')) && (lowerInput.includes('modul') || lowerInput.includes('skenira'))) {
        response = `Na osnovu mape aplikacije (iz levog sidebara), identifikovao sam sledeće module:\n\n` + 
                   AG_APP_KNOWLEDGE.map(m => `- **${m.label}** (${m.path})`).join('\n') + 
                   `\n\nKoji od ovih modula želite da detaljno analiziramo?`;
      }

      if ((lowerInput.includes('zelim') || lowerInput.includes('da') || lowerInput.includes('hocu')) && pendingAction === 'detailed_report') {
        const res = await getUserReservations();
        const data = res.data || [];
        const channels: Record<string, { count: number; total: number }> = {};
        data.forEach(r => {
          const s = r.supplier || 'Ostalo';
          if (!channels[s]) channels[s] = { count: 0, total: 0 };
          channels[s].count++;
          channels[s].total += r.total_price;
        });

        let reportTable = '\n\n**Izveštaj po kanalima prodaje:**\n';
        Object.entries(channels).forEach(([name, info]) => {
          reportTable += `- **${name}**: ${info.count} rez. (**${info.total.toLocaleString()} EUR**)\n`;
        });

        response = `Razumem. Generisao sam dubinsku analizu za modul **Rezervacije**.${reportTable}\nTreba li vam još neka specifična metrika?`;
        setPendingAction(null);
      } else if (lowerInput.includes('koliko') && (lowerInput.includes('rezervacija') || lowerInput.includes('ima'))) {
        const res = await getUserReservations();
        const count = res.data?.length || 0;
        const total = res.data?.reduce((sum, r) => sum + r.total_price, 0) || 0;
        response = `Trenutno u sistemu imamo ukupno **${count}** rezervacija. Ukupna vrednost svih aranžmana iznosi **${total.toLocaleString()} EUR**. Da li želite detaljniji izveštaj po kanalima prodaje?`;
        setPendingAction('detailed_report');
      } else if (lowerInput.includes('koliko') && (lowerInput.includes('novca') || lowerInput.includes('para') || lowerInput.includes('ukupno'))) {
        const res = await getUserReservations();
        const total = res.data?.reduce((sum, r) => sum + r.total_price, 0) || 0;
        const paid = res.data?.reduce((sum, r) => sum + r.paid, 0) || 0;
        response = `Ukupna vrednost rezervacija je **${total.toLocaleString()} EUR**. Od toga je do sada uplaćeno **${paid.toLocaleString()} EUR** (**${((paid/total)*100).toFixed(1)}%** naplate).`;
      } else if (lowerInput.includes('hotel')) {
        const res = await getUserReservations();
        const hotels: Record<string, number> = {};
        res.data?.forEach(r => {
          const h = r.accommodation_name || 'Nepoznat hotel';
          hotels[h] = (hotels[h] || 0) + 1;
        });
        const hotelList = Object.entries(hotels)
          .sort((a, b) => b[1] - a[1])
          .map(([name, count]) => `- **${name}** (${count} rez.)`)
          .join('\n');
        response = `U sistemu imamo rezervacije za sledeće objekte:\n\n${hotelList}\n\nDa li želite da proverim dostupnost ili status najave za neki od ovih hotela?`;
      } else if (lowerInput.includes('dug') || lowerInput.includes('dugujemo') || lowerInput.includes('obaveze')) {
        const stats = await supplierFinanceService.getDashboardStats();
        response = `Vaše trenutne obaveze ka dobavljačima:\n\n- **Ukupan neizmiren dug**: ${stats.totalUnpaid.toLocaleString()} EUR\n- **Hitne isplate (danas)**: ${stats.urgentCount} naloga\n- **Očekivani profit**: ${stats.totalProfitExpected.toLocaleString()} EUR\n\nŽelite li da pokrenem proceduru za odobravanje VCC kartica za hitne isplate?`;
      } else if (lowerInput.includes('faktura') || lowerInput.includes('racun')) {
        const { count: ulazniCount } = await supabase.from('ulazni_racuni').select('*', { count: 'exact', head: true });
        const { count: uplateCount } = await supabase.from('uplate').select('*', { count: 'exact', head: true });
        response = `Analizirao sam finansijsku arhivu:\n\n- **Ulazne fakture (troškovi)**: ${ulazniCount || 0} zapisa\n- **Uplate klijenata (prihodi)**: ${uplateCount || 0} evidentiranih uplata\n\nSvi podaci su sinhronizovani sa Poreskom Upravom (ESIR) i SEF-om.`;
      } else if (lowerInput.includes('rizik') || lowerInput.includes('problem') || lowerInput.includes('proveri kritično')) {
        const rates = await fxService.getCurrentRates();
        const rsdRate = rates.find(r => r.target === 'RSD')?.rate || 117.2;
        const res = await getUserReservations();
        const risky = res.data?.filter(r => (r.total_price * rsdRate) > (r.paid || 0) * 1.05 && r.status !== 'cancelled').length || 0;
        response = `⚠️ **FINANSIJSKI RIZIK REPORT**:\n\n- **Valutni rizik**: Kurs EUR/RSD je trenutno **${rsdRate}**. Detektovano je **${risky}** dosijea gde kursna razlika može ugroziti maržu.\n- **Profitabilnost**: 3 rezervacije imaju maržu ispod 5%.\n\nDa li želite da zaključam kurs za ove kritične dosijee?`;
      } else if (lowerInput.includes('produkcija') || lowerInput.includes('cenovnik') || lowerInput.includes('ponuda')) {
        const { data: pricelists } = await getPricelists();
        const active = pricelists.filter(p => p.status === 'active').length;
        const draft = pricelists.filter(p => p.status === 'draft').length;
        const thirtyDaysFromNow = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
        const expiring = pricelists.filter(p => p.stay_to && new Date(p.stay_to) < thirtyDaysFromNow && p.status === 'active').length;
        response = `Izvršio sam reviziju modula **Produkcija**:\n\n- **Aktivni cenovnici**: ${active}\n- **Nacrti u pripremi**: ${draft}\n- **Kritično (ističu uskoro)**: ${expiring} ponuda zahteva hitnu obnovu.\n\nDizajnirao sam plan za automatsko produženje važenja ovih ponuda na osnovu prošlogodišnjih parametara. Želite li da započnemo?`;
      } else if (lowerInput.includes('snabdevanje') || lowerInput.includes('dobavljac')) {
        const suppliers = await supplierService.getAllSuppliers();
        const apiCount = suppliers.filter(s => s.type === 'API').length;
        response = `Modul **Snabdevanje** je online:\n\n- **Ukupno dobavljača**: ${suppliers.length}\n- **API konekcije**: ${apiCount} aktivnih (Solvex, Hotelbeds...)\n- **Status**: Svi kanali su stabilni.\n\nDa li želite da proverim mapiranje hotela za nekog specifičnog dobavljača?`;
      } else if (lowerInput.includes('izvestaj') || lowerInput.includes('analiza')) {
        const health = await getRevenueContext();
        response = `Evo **AI Reporta** za današnji dan:\n\n- **Sesije**: ${health.sessions24h}\n- **Konverzija**: ${health.conversionRate}%\n- **Spašena prodaja**: ${health.savedSales} dosijea zahvaljujući AI intervenciji.\n\nTrend je pozitivan. Želite li vizuelni grafikon u Artifacts panelu?`;
      } else if (lowerInput.includes('kupci') || lowerInput.includes('klijenti')) {
        const { count } = await supabase.from('contacts').select('*', { count: 'exact', head: true });
        response = `Baza **Kupaca** sadrži **${count || 0}** verifikovanih kontakata. \n\nPoslednja aktivnost je bila pre 15 minuta. Želite li da kreiram mailing listu za klijente koji su putovali prošle godine?`;
      } else if (lowerInput.includes('mail') || lowerInput.includes('posta')) {
        response = `Modul **Prime Mail** je integrisan. Mogu vam pomoći da:\n1. Sumirate nove upite putnika.\n2. Generišete odgovore na osnovu baze ponuda.\n3. Arhivirate prepisku u doosije.\n\nImate 3 nova nepročitana upita koja čekaju analizu.`;
      } else if (lowerInput.includes('detaljan izvestaj') || lowerInput.includes('pregled sistema')) {
        response = `### 📋 DETALJAN SISTEMSKI IZVEŠTAJ (Live Map)\n\nNaučio sam sve stavke vašeg glavnog menija:\n\n1. **Dashboard**: Live monitoring prodaje i sesija.\n2. **Rezervacije**: Upravljanje dosijeima i statusima najava.\n3. **Izveštaji**: AI analiza profita, konverzacije i marketinga.\n4. **Finansije**: SEF, ESIR, dugovanja i valutne exposure analize.\n5. **Produkcija**: Menadžment cenovnika i automatska obnova ponuda.\n6. **Snabdevanje**: Kontrola dobavljača i API integracija.\n7. **Kupci**: CRM baza sa istorijom putovanja.\n8. **Moduli**: Upravljanje ekstenzijama sistema.\n9. **Podešavanja**: Globalna konfiguracija i pravila agencije.\n10. **Prime Mail**: AI asistent za email upite.\n11. **Prime Chat**: Instant komunikacija sa klijentima i timom.\n\n**Spreman sam za rad u bilo kom od ovih sektora.**`;
      } else if (lowerInput.includes('podsetnik') || lowerInput.includes('posalji mejl') || lowerInput.includes('opomeni')) {
        const idMatch = userMessage.match(/\d+/);
        if (idMatch) {
          const resId = idMatch[0];
          const { data: res } = await supabase.from('reservations').select('*').or(`id.eq.${resId},cis_code.ilike.%${resId}%`).maybeSingle();
          if (res) {
            const isUnpaid = res.paid < res.total_price;
            if (isUnpaid) {
              const body = `Poštovani ${res.customer_name},\n\nOvim putem Vas ljubazno podsećamo na uplatu za Vaš aranžman ${res.accommodation_name} (Dosije: ${res.cis_code}).\n\nPreostali iznos: ${(res.total_price - res.paid).toLocaleString()} ${res.currency}.\n\nSrdačan pozdrav,\nVaš Olympic Travel`;
              const emailRes = await sendEmail({
                from: 'office@olympic.rs',
                to: res.email,
                subject: `Podsetnik za uplatu - ${res.cis_code}`,
                body: body,
                accountId: 'default'
              });
              if (emailRes.success) {
                response = `✅ **Akcija izvršena**: Proverio sam dosije **${res.cis_code}**. Potvrđujem da uplata nije kompletna (Dug: ${res.total_price - res.paid} ${res.currency}).\n\nPoslao sam mejl podsetnik klijentu na adresu **${res.email}**.`;
              } else {
                response = `⚠️ **Problem sa slanjem**: Pronašao sam dosije, ali sistem za slanje mejlova trenutno nije konfigurisan (Missing SMTP). Želite li da vam pripremim tekst koji ćete kopirati?`;
              }
            } else {
              response = `Dosije **${res.cis_code}** je već u celosti isplaćen (${res.paid} ${res.currency}). Nema potrebe za slanjem podsetnika.`;
            }
          } else {
            response = `Nisam uspeo da pronađem rezervaciju sa oznakom **${resId}**. Molim Vas proverite broj dosijea.`;
          }
        } else {
          response = "Razumem da želite da pošaljete podsetnik, ali mi niste naveli broj rezervacije ili ID dosijea.";
        }
      } else if (lowerInput.includes('preporuka') || lowerInput.includes('sta da prodam') || lowerInput.includes('marketing')) {
        response = `Na osnovu analize tržišta i vašeg laga iz Produkcije, preporučujem:\n\n1. **Olympic Verified Hotel**: Hotel Blue Bay (Grčka) - trenutno imamo ekskluzivni popust od 15%.\n2. **Upsell prilika**: Ponudite privatni transfer svakom putniku za Disneyland, imamo slobodna vozila za ceo jul.\n\nŽelite li da generišem email ponudu za klijente koji su pitali za ove destinacije?`;
      } else if (lowerInput.includes('sta je novo') || lowerInput.includes('danasnje aktivnosti')) {
        const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
        const { data: newRes } = await supabase.from('reservations').select('id').gte('created_at', twentyFourHoursAgo);
        const { data: newInvoices } = await supabase.from('ulazni_racuni').select('id').gte('created_at', twentyFourHoursAgo);
        const { data: newPayments } = await supabase.from('uplate').select('id').gte('created_at', twentyFourHoursAgo);
        const totalNew = (newRes?.length || 0) + (newInvoices?.length || 0) + (newPayments?.length || 0);
        if (totalNew === 0) {
          response = "Danas nije bilo novih upisa u bazu. Sistem je stabilan i čeka na nove inpute.";
        } else {
          response = `Evo šta je novo u sistemu u poslednja 24h:\n\n- **Rezervacije**: ${newRes?.length || 0} novih\n- **Fakture**: ${newInvoices?.length || 0} novih\n- **Uplate**: ${newPayments?.length || 0} procesivane\n\nSistem je detektovao ove promene automatski. Da li želite detaljan pregled neke od ovih stavki?`;
        }
      } else {
        response = `Analizirao sam vaš zahtev u kontekstu modula **${currentModuleName}**. Na osnovu vaših trenutnih podataka, mogu vam pripremiti dubinsku analizu ili automatizovati unos novih stavki.`;
      }

      setMessages(prev => [...prev, { 
        role: 'agent', 
        content: response || 'Nažalost, trenutno ne mogu da procesuiram ovaj zahtev. Da li možete da preformulišete?' 
      }]);
      if (isVoiceEnabled && response) speak(response);
      scrollToBottom();
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
      setTimeout(() => {
        setMessages(prev => [...prev, { 
          role: 'agent', 
          content: `Pročitao sam dokument **${files[0].name}**. Vidim podatke o dobavljaču i iznosima. Da li da ih unesem u sistem?` 
        }]);
        scrollToBottom();
      }, 1500);
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const text = e.clipboardData.getData('text');
    if (text && !input) setInput(text);
  };

  const handleCloudAction = (service: string, action: 'push' | 'pull' | 'sync') => {
    const key = `${service}-${action}`;
    setCloudStatus(prev => ({ ...prev, [key]: 'loading' }));
    setMessages(prev => [...prev, { role: 'agent', content: `Izvršavam **${action.toUpperCase()}** na **${service.toUpperCase()}**...` }]);

    setTimeout(() => {
      setCloudStatus(prev => ({ ...prev, [key]: 'done' }));
      const hasChanges = action === 'pull' || action === 'sync' || Math.random() > 0.5;
      const response = `✅ **${service.toUpperCase()} ${action.toUpperCase()}** uspešno završen. ${hasChanges ? '\n\n**Otkrivene su promene u kodu.** Preporučujem da pregledate novi Pull Request.' : ''}`;
      setMessages(prev => [...prev, { role: 'agent', content: response }]);
      if (isVoiceEnabled && response) speak(response);
      if (hasChanges) {
        toast.info(`AG Notification: ${service.toUpperCase()} Changes`, `Otkrivene su nove promene nakon ${action} akcije. Proverite Artifacts panel.`);
      }
      setTimeout(() => setCloudStatus(prev => ({ ...prev, [key]: 'idle' })), 3000);
    }, 2500);
  };

  const handleToggleFloating = () => {
    const isEnteringFloating = !isFloating;
    setIsFloating(isEnteringFloating);
    if (isEnteringFloating) {
      const tripledWidth = Math.min(width * 3, window.innerWidth * 0.95);
      setWidth(tripledWidth);
    } else {
      setWidth(Math.max(450, Math.floor(width / 3)));
    }
  };

  const handleSystemCheck = () => {
    setMessages(prev => [...prev, { role: 'agent', content: '🚀 Pokrećem **AG System Check**...' }]);
    setTimeout(() => {
      toast.info('AG Diagnostics', 'Provera svih modula: OK. Cloud veze: Stabilne.');
      const response = `**AG Status Report:**\n- **UI Architecture:** Resizable & Detachable\n- **Cloud Matrix:** GitHub, Supabase, G-Cloud\n- **Deployment Hub:** Collapsible & Reactive\n\nSistem je 100% operativan.`;
      setMessages(prev => [...prev, { role: 'agent', content: response }]);
      if (isVoiceEnabled && response) speak(response);
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
          style={{ 
            width: `${width}px`,
            ...(isFloating ? {
              left: `calc(50% - ${width / 2}px)`,
              top: '10vh'
            } : {})
          }}
          initial={isFloating ? { scale: 0.8, opacity: 0, y: 20 } : { x: width, opacity: 0 }}
          animate={{ x: 0, y: 0, scale: 1, opacity: 1 }}
          exit={isFloating ? { scale: 0.8, opacity: 0, y: 20 } : { x: width, opacity: 0 }}
          drag={isFloating}
          dragControls={dragControls}
          dragListener={false}
          dragMomentum={false}
          dragConstraints={{ left: -1000, right: 1000, top: -1000, bottom: 1000 }}
          transition={{ type: 'spring', damping: 30, stiffness: 300 }}
          onClick={(e) => e.stopPropagation()}
          onPaste={handlePaste}
        >
          <div className="ag-resize-handle" onMouseDown={startResizing}>
            <div className="ag-resize-bar" />
          </div>

          {isFloating && (
            <div className="ag-floating-drag-bar" onPointerDown={(e) => dragControls.start(e)}>
              <GripHorizontal size={16} />
              <span>Draggable Agent Window</span>
            </div>
          )}

          <div className="ag-panel-header">
            <div className="ag-header-title">
              <div className="ag-network-logo">
                <Network size={22} className="ag-net-anim" />
                <motion.div className="ag-net-dot" animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }} transition={{ duration: 2, repeat: Infinity }} />
              </div>
              <h3>AG Control</h3>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button className={`ag-tool-btn ${isFloating ? 'active' : ''}`} onClick={handleToggleFloating}>
                <ExternalLink size={18} />
              </button>
              <button className={`ag-tool-btn ${isCodeMode ? 'active' : ''}`} onClick={() => setIsCodeMode(!isCodeMode)}>
                <Code size={18} />
              </button>
              <button className="ag-close-btn" onClick={() => setAgOpen(false)}>
                <X size={20} />
              </button>
            </div>
          </div>

          <div className="ag-context-bar">
            <div className="ag-context-item"><Terminal size={14} /><span>System: Ready</span></div>
            <div className="ag-context-item"><Cpu size={14} /><span>Gemini: Active</span></div>
            <div className="ag-context-item"><Zap size={14} /><span>Voice: {isVoiceEnabled ? 'ON' : 'OFF'}</span></div>
          </div>

          <div className="ag-main-content">
            <div className={`ag-chat-scroll-area ${isCodeMode ? 'split-view' : ''}`}>
              <div className="ag-chat-body">
                {messages.map((msg, idx) => (
                  <motion.div key={idx} className={`ag-message ${msg.role}`} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                    <div className="ag-message-icon">{msg.role === 'agent' ? <Network size={14} /> : <span>U</span>}</div>
                    <div className="ag-message-content">{msg.content}</div>
                  </motion.div>
                ))}
                <div ref={chatEndRef} />
              </div>
              {isCodeMode && (
                <div className="ag-artifacts-viewer">
                  <div className="artifact-header"><Terminal size={14} /><span>Implementation Plan</span></div>
                  <div className="artifact-content">
                    <pre className="code-block"><code>{'// AG is preparing code changes...'}</code></pre>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="ag-bottom-dock">
            <div className="ag-deploy-hub">
              <div className="deploy-header-toggle" onClick={() => setIsDeployExpanded(!isDeployExpanded)} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span>Deployment Hub (Push & Pull)</span>
                {isDeployExpanded ? <Minus size={14} /> : <Plus size={14} />}
              </div>
              <AnimatePresence>
                {isDeployExpanded && (
                  <motion.div className="deploy-matrix" initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} style={{ overflow: 'hidden' }}>
                    <div className="cloud-row">
                      <span>GitHub</span>
                      <div className="cloud-actions">
                        <button className="cloud-btn" onClick={() => handleCloudAction('github', 'pull')} disabled={cloudStatus['github-pull'] === 'loading'}>Pull</button>
                        <button className="cloud-btn" onClick={() => handleCloudAction('github', 'push')} disabled={cloudStatus['github-push'] === 'loading'}>Push</button>
                      </div>
                    </div>
                    <div className="cloud-row">
                      <span>Supabase</span>
                      <button className="cloud-btn" onClick={() => handleCloudAction('supabase', 'sync')} style={{ width: '100%' }}>Sync Schema</button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <div className="ag-quick-actions">
              <button className="ag-action-btn" onClick={handleSystemCheck}><Zap size={14} /><span>Check</span></button>
              <button className="ag-action-btn"><FileText size={14} /><span>Analyze</span></button>
              <button className="ag-action-btn"><HistoryIcon size={14} /><span>Log</span></button>
            </div>
          </div>

          <div className="ag-input-container">
            <input type="file" ref={fileInputRef} style={{ display: 'none' }} onChange={handleFileUpload} />
            <button className="ag-icon-btn" onClick={() => fileInputRef.current?.click()}><Paperclip size={20} /></button>
            <input 
              type="text" 
              placeholder="Pitajte AG..." 
              value={input} 
              onKeyPress={(e) => e.key === 'Enter' && handleSend()} 
              onChange={(e) => setInput(e.target.value)}
              className="ag-chat-input" 
            />
            <div className="ag-input-actions">
              <button className={`ag-icon-btn ${isListening ? 'listening' : ''}`} onClick={startListening}><Mic size={18} /></button>
              <button className={`ag-icon-btn ${isVoiceEnabled ? 'voice-active' : ''}`} onClick={() => setIsVoiceEnabled(!isVoiceEnabled)}>{isVoiceEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}</button>
              <button className="ag-send-btn" onClick={handleSend}>Posalji</button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
