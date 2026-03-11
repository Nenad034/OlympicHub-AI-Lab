import React, { useState } from 'react';
import {
    Brain, Target, Users, Mail, MessageSquare, Zap,
    TrendingUp, FileText, Gift, Send, PlayCircle, Settings, Search, UserPlus, Cpu, Database,
    ChevronRight, ChevronDown, Folder, Plus, Filter, MessageCircle, Paperclip, Calendar, Clock, Trash2, Edit2, AlertCircle, Sparkles, Minus, MapPin
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const PERSONAS = [
    { id: 'sandler', name: 'Sandler', role: 'Edukativna Prodaja', quote: '"You get what you pay for" - Diskvalifikacija jeftinog', color: '#ffb300' },
    { id: 'musashi', name: 'Miyamoto Musashi', role: 'Strategija', quote: 'Rani buking je pobeda izvojevana pre prve bitke', color: '#ef4444' },
    { id: 'aurelius', name: 'Marko Aurelije', role: 'Stoicizam', quote: 'Mir počinje onog trenutka kada delegiraš brigu nama', color: '#3b82f6' },
    { id: 'coelho', name: 'Paulo Koeljo', role: 'Inspiracija', quote: 'Putovanje je transformacija duše, a ne promena mesta', color: '#10b981' }
];

const PrimeIcon = ({ size = 32, color = 'var(--accent-cyan)' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
            <linearGradient id="primeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor={color} />
                <stop offset="100%" stopColor="#00acc1" />
            </linearGradient>
        </defs>
        {/* Outer Case - Square divided by the cross logic */}
        <rect x="4" y="4" width="16" height="16" rx="1" stroke={color} strokeWidth="2" />
        
        {/* The Circle - Touching all 4 inner sides of the square */}
        <circle cx="12" cy="12" r="8" stroke={color} strokeWidth="1.5" opacity="0.7" />
        
        {/* The Main Cross - Dividing the square exactly */}
        <path 
            d="M12 4V20M4 12H20" 
            stroke="url(#primeGrad)" 
            strokeWidth="3" 
            strokeLinecap="butt"
        />
        
        {/* 3D Highlight layer to pop the cross */}
        <path d="M12 5V11M12 13V19M5 12H11M13 12H19" stroke="white" strokeWidth="0.5" strokeLinecap="round" opacity="0.6" />
        
        {/* Center intersection focus */}
        <rect x="11" y="11" width="2" height="2" fill="white" opacity="0.9" />
    </svg>
);

const PLATFORMS_MAP: Record<string, string> = {
    ig: 'Instagram',
    fb: 'Facebook',
    tt: 'TikTok',
    wa: 'WhatsApp',
    gm: 'Google Maps',
    email: 'Newsletter'
};

const TRIGGERS = [
    { id: 1, name: 'Grčka - Kasni Kapaciteti', audience: 'Porodice (Prošle Sezone)', condition: 'Popunjenost > 85%', status: 'active' },
    { id: 2, name: 'Kopaonik Ski Opening', audience: 'Mladi & Parovi', condition: 'Do početka < 45 dana', status: 'paused' },
    { id: 3, name: 'Silent Loyalty Upsell', audience: 'VIP Dosijei', condition: 'LTV > 5000 EUR', status: 'active' }
];

export default function SmartMarketingHub() {
    const [activeTab, setActiveTab] = useState('matrix');
    const [selectedPersona, setSelectedPersona] = useState('sandler');
    const [selectedPlatform, setSelectedPlatform] = useState('ig');
    const [isGenerating, setIsGenerating] = useState(false);
    const [generatedText, setGeneratedText] = useState('');
    const [selectedTemplate, setSelectedTemplate] = useState('vibrant');
    const [selectedImage, setSelectedImage] = useState('https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80');
    const [sesConfig, setSesConfig] = useState({ region: 'eu-central-1', accessKey: '', secretKey: '', sender: 'office@primeclick.travel' });
    const [isSesModalOpen, setIsSesModalOpen] = useState(false);
    const [selectedClients, setSelectedClients] = useState<string[]>([]);
    const [clientSearch, setClientSearch] = useState('');
    const [commandInput, setCommandInput] = useState('');
    const [commandResults, setCommandResults] = useState<any[]>([]);
    const [isCommandLoading, setIsCommandLoading] = useState(false);
    const [selectedHotel, setSelectedHotel] = useState<any>(null);
    const [expandedCategories, setExpandedCategories] = useState<string[]>(['Subagenti', 'Dobavljači', 'Individualci']);
    const [activeCategory, setActiveCategory] = useState<string>('Subagenti');
    const [activeSubcategory, setActiveSubcategory] = useState<string>('Sve');
    const [categories, setCategories] = useState(['Subagenti', 'Individualci', 'Dobavljači']);
    const [segmentSearch, setSegmentSearch] = useState('');
    const [isAddingCategory, setIsAddingCategory] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState('');
    const [newsletterAgentInput, setNewsletterAgentInput] = useState('');
    const [isAgentProcessing, setIsAgentProcessing] = useState(false);
    const [chatMessages, setChatMessages] = useState<any[]>([
        { role: 'agent', content: 'Dobar dan! Ja sam Vaš Marketing Asistent. Kako Vam mogu pomoći danas?' }
    ]);
    const [marketingQueue, setMarketingQueue] = useState<any[]>([
        { id: 'q1', type: 'newsletter', title: 'Lilia Secret Deal', audience: 'Kralj Travel', scheduledTime: '2026-03-12T09:00:00', status: 'planned', platform: 'email', content: 'Specijalna ponuda za hotel Lilia...' },
        { id: 'q2', type: 'social', title: 'Summer 2026 Teaser', audience: 'All Followers', scheduledTime: '2026-03-12T14:00:00', status: 'planned', platform: 'instagram', content: 'Spremite se za leto 2026! Rezervišite rano.' }
    ]);

    // NEW STATES FOR FLOATING CHAT & MULTI-GRID
    const [isFloatingChatOpen, setIsFloatingChatOpen] = useState(true);
    const [selectedHotels, setSelectedHotels] = useState<any[]>([]);
    const [selectedImages, setSelectedImages] = useState<string[]>([]);
    const [visualLayout, setVisualLayout] = useState('single'); // single, carousel, reels, grid-2, grid-4, grid-6, grid-8
    const [hotelSuggestions, setHotelSuggestions] = useState<any[]>([]);

    const handleAddCategory = () => {
        if (!newCategoryName.trim()) {
            setIsAddingCategory(false);
            return;
        }
        if (!categories.includes(newCategoryName)) {
            setCategories(prev => [...prev, newCategoryName]);
            setActiveCategory(newCategoryName);
            setActiveSubcategory('Sve');
            setNewCategoryName('');
            setIsAddingCategory(false);
        }
    };

    const CLIENT_DB = [
        { id: '1', name: 'Air Serbia', type: 'B2B', category: 'Subagenti', subcategory: 'Srbija', email: 'corporate@airserbia.com' },
        { id: '2', name: 'Marko Marković', type: 'B2C', category: 'Individualci', subcategory: 'Direktna stranka', email: 'marko.m@gmail.com' },
        { id: '3', name: 'Nelt Group', type: 'B2B', category: 'Individualci', subcategory: 'Pravno lice', email: 'hr@nelt.com' },
        { id: '4', name: 'Milena Jović', type: 'B2C', category: 'Individualci', subcategory: 'Direktna stranka', email: 'milena88@yahoo.com' },
        { id: '5', name: 'Nordeus', type: 'B2B', category: 'Individualci', subcategory: 'Pravno lice', email: 'office@nordeus.com' },
        { id: '6', name: 'Dragan Nikolić', type: 'B2C', category: 'Individualci', subcategory: 'Direktna stranka', email: 'dragan.nik@gmail.com' },
        { id: '7', name: 'Big Blue', type: 'B2B', category: 'Subagenti', subcategory: 'Srbija', email: 'office@bigblue.rs' },
        { id: '8', name: 'Atlas Rab', type: 'B2B', category: 'Subagenti', subcategory: 'Hrvatska', email: 'info@atlasrab.hr' },
        { id: '9', name: 'Hotel Splendid', type: 'SUPPLIER', category: 'Dobavljači', subcategory: 'Hotel', email: 'booking@splendid.me' },
        { id: '10', name: 'Lufthansa', type: 'SUPPLIER', category: 'Dobavljači', subcategory: 'Avio', email: 'groups@lufthansa.com' },
        { id: '11', name: 'MSC Cruises', type: 'SUPPLIER', category: 'Dobavljači', subcategory: 'Brod', email: 'res@msc.com' },
        { id: '12', name: 'Kralj Travel', type: 'B2B', category: 'Subagenti', subcategory: 'Hrvatska', email: 'vinko@kraljtravel.hr' },
        { id: '13', name: 'Relax Tours', type: 'B2B', category: 'Subagenti', subcategory: 'BiH', email: 'info@relaxtours.ba' },
    ];

    const HOTEL_DB = [
        { 
            id: 'h1', 
            name: 'Grand Hyatt Dubai', 
            location: 'Dubai, UAE', 
            image: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=800&q=80',
            lastSold: 2, 
            sales30d: 45, 
            features: ['Luxury', 'City Center', 'Spa'],
            promo: '15% Popusta'
        },
        { 
            id: 'h2', 
            name: 'Sani Resort', 
            location: 'Halkidiki, Grčka', 
            image: 'https://images.unsplash.com/photo-1540518614846-7eded433c457?auto=format&fit=crop&w=800&q=80',
            lastSold: 45, 
            sales30d: 5, 
            features: ['Plaža', 'Deca Gratis', 'All Inclusive'],
            promo: 'Early Booking'
        },
        { 
            id: 'h3', 
            name: 'Four Seasons Maldives', 
            location: 'Maldivi', 
            image: 'https://images.unsplash.com/photo-1514282401047-d79a71a590e8?auto=format&fit=crop&w=800&q=80',
            lastSold: 5, 
            sales30d: 12, 
            features: ['Plaža', 'Privatnost', 'Romantika'],
            promo: 'Free Upgrade'
        },
        { 
            id: 'h4', 
            name: 'Hilton Phuket', 
            location: 'Phuket, Tajland', 
            image: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80',
            lastSold: 60, 
            sales30d: 0, 
            features: ['Plaža', 'Egzotika', 'Bazen'],
            promo: 'Hit Ponuda'
        },
        { 
            id: 'h5', 
            name: 'Hotel Lilia', 
            location: 'Zlatni Pjasci, Bugarska', 
            image: 'https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?auto=format&fit=crop&w=800&q=80',
            lastSold: 10, 
            sales30d: 25, 
            features: ['Plaža', 'Blizu Grada', 'Povoljno'],
            promo: 'Agency Secret Deal'
        }
    ];

    const handleRemoveCategory = (catToRemove: string) => {
        if (['Subagenti', 'Individualci', 'Dobavljači'].includes(catToRemove)) {
            alert('Osnovne kategorije se ne mogu ukloniti.');
            return;
        }
        if (confirm(`Da li ste sigurni da želite da uklonite kategoriju "${catToRemove}"?`)) {
            setCategories(prev => prev.filter(c => c !== catToRemove));
            if (activeCategory === catToRemove) {
                setActiveCategory('Subagenti');
                setActiveSubcategory('Sve');
            }
        }
    };

    const getAdaptedText = () => {
        if (!generatedText) return '';
        
        switch (selectedPlatform) {
            case 'x':
                return generatedText.length > 280 ? generatedText.substring(0, 277) + '...' : generatedText;
            case 'tg':
                return `📢 **PONUDA DANA**\n\n${generatedText}\n\n#putovanja #odmor #primeclick`;
            case 'vb':
            case 'wa':
                return `✨ *Specijalno za Vas!* ✨\n\n${generatedText}`;
            default:
                return generatedText;
        }
    };

    const handleCommand = () => {
        if (!commandInput.trim()) return;
        setIsCommandLoading(true);
        setTimeout(() => {
            const input = commandInput.toLowerCase();
            let results = [...HOTEL_DB];
            
            if (input.includes('najprodavaniji')) {
                results = results.sort((a, b) => b.sales30d - a.sales30d).slice(0, 2);
            } else if (input.includes('nismo prodali') || input.includes('stoji')) {
                results = results.sort((a, b) => a.sales30d - b.sales30d).slice(0, 2);
            } else if (input.includes('plaž')) {
                results = results.filter(h => h.features.includes('Plaža'));
            } else if (input.includes('deca') || input.includes('gratis')) {
                results = results.filter(h => h.features.includes('Deca Gratis'));
            } else if (input.includes('popust')) {
                results = results.filter(h => h.promo.includes('Popust') || h.promo.includes('Hit'));
            }
            
            setCommandResults(results);
            setIsCommandLoading(false);
        }, 1200);
    };

    const handlePromote = (hotel: any) => {
        setSelectedHotel(hotel);
        setSelectedImage(hotel.image);
        setGeneratedText(`EKSKLUZIVNO: ${hotel.name} na destinaciji ${hotel.location}.\n\n${hotel.promo ? `POSEBNA POGODNOST: ${hotel.promo}!\n\n` : ''}Iskusite ${hotel.features.join(', ')} aranžman koji smo pažljivo pripremili za vas. Rezervišite odmah i osigurajte svoje mesto u ovom prestižnom objektu.`);
        setActiveTab('matrix');
    };

    const handleGenerate = () => {
        setIsGenerating(true);
        setTimeout(() => {
            const persona = PERSONAS.find(p => p.id === selectedPersona);
            if (persona?.id === 'sandler') {
                setGeneratedText('Da li vas zaista ispunjava jurnjava za najjeftinijom ponudom na internetu? Mnogi klijenti kod nas dolaze umorni od skrivenih troškova i stresa. Naša cena nije najniža, ali garantujemo mir, transparentnost i uslugu od momenta kada izađete iz kuće do povratka. Ako tražite mir, na pravom ste mestu.');
            } else if (persona?.id === 'musashi') {
                setGeneratedText('Pobednička strategija letovanja ne donosi se u junu, već u januaru. Obezbeđivanje najboljih resursa dok ostali još uvek spavaju je odlika vrsnih stratega. Bukirajte danas i dozvolite vremenu da radi u vašu korist.');
            } else if (persona?.id === 'aurelius') {
                setGeneratedText('Zašto prepuštate svoj unutrašnji mir nečemu što ne možete kontrolisati? Preuzimanjem rizika na sebe, mi vas oslobađamo tereta organizacije. Vaš jedini zadatak je da prisustvujete trenutku, mi brinemo o ostalom.');
            } else {
                setGeneratedText('Kada putujemo, ne menjamo samo geografsku lokaciju; mi menjamo način na koji posmatramo svet. Dopustite da vam organizujemo putovanje koje neće ostati samo slika u telefonu, već trajni zapis u vašoj duši.');
            }
            setIsGenerating(false);
        }, 1500);
    };

    const handleAiAgentNewsletter = () => {
        if (!newsletterAgentInput.trim()) return;
        
        const userMsg = { role: 'user', content: newsletterAgentInput };
        setChatMessages(prev => [...prev, userMsg]);
        const currentInput = newsletterAgentInput.toLowerCase();
        setNewsletterAgentInput('');
        
        setIsAgentProcessing(true);
        setTimeout(() => {
            const input = currentInput;
            let responseContent = '';
            
            // Search for client name in the DB
            const targetClient = CLIENT_DB.find(c => input.includes(c.name.toLowerCase()));
            if (targetClient) {
                setSelectedClients([targetClient.id]);
                responseContent += `Pronašao sam klijenta: **${targetClient.name}**. `;
            }

            // Search for hotel name in the DB
            const targetHotel = HOTEL_DB.find(h => input.includes(h.name.toLowerCase()) || input.includes(h.location.toLowerCase().split(',')[0]));
            if (targetHotel) {
                setSelectedHotel(targetHotel);
                setSelectedImage(targetHotel.image);
                responseContent += `Identifikovao sam hotel: **${targetHotel.name}**. `;
            }

            // Scheduling logic
            // Scheduling logic
            if (input.includes('zakaz') || input.includes('raspored') || input.includes('programir')) {
                const discount = input.includes('%') ? input.match(/(\d+)%/)?.[0] : null;
                const hotelName = targetHotel?.name || 'Vašem omiljenom hotelu';
                const clientName = targetClient?.name || 'Vašim klijentima';
                const newText = `Specijalna ponuda za ${clientName}!\n\nSa zadovoljstvom Vam predstavljamo ekskluzivni aranžman za ${hotelName}.${discount ? ` Samo za Vašu agenciju odobravamo dodatnih ${discount} popusta u narednih 7 dana.` : ''}\n\nOva ponuda je kreirana na osnovu naše dugogodišnje saradnje i poverenja.`;
                
                const platformType = input.includes('social') ? 'instagram' : 
                                     (input.includes('map') || input.includes('pin')) ? 'gm' : 'email';

                const newCampaign = {
                    id: 'q-' + Date.now(),
                    type: (input.includes('social') || input.includes('mrež') || input.includes('map')) ? 'social' : 'newsletter',
                    title: targetHotel ? targetHotel.name + ' Kampanja' : 'Nova Kampanja',
                    audience: targetClient ? targetClient.name : 'Ciljna grupa',
                    scheduledTime: '2026-03-15T10:00:00',
                    status: 'planned',
                    platform: platformType,
                    content: newText
                };
                setMarketingQueue(prev => [...prev, newCampaign]);
                setGeneratedText(newText);
                responseContent += `\n\n✅ **Uspešno zakazano!** Kampanja je dodata u Marketing Kalendar za 15. mart u 10:00.`;
            }

            // Generate contextual text
            const discount = input.includes('%') ? input.match(/(\d+)%/)?.[0] : null;
            if (targetHotel || targetClient) {
                const hotelName = targetHotel?.name || 'Vašem omiljenom hotelu';
                const clientName = targetClient?.name || 'Vašim klijentima';
                let newText = `Specijalna ponuda za ${clientName}!\n\nSa zadovoljstvom Vam predstavljamo ekskluzivni aranžman za ${hotelName}.${discount ? ` Samo za Vašu agenciju odobravamo dodatnih ${discount} popusta u narednih 7 dana.` : ''}\n\nOva ponuda je kreirana na osnovu naše dugogodišnje saradnje i poverenja.`;
                setGeneratedText(newText);
                responseContent += `\n\nPripremio sam tekst kampanje u preview prozoru. Da li želite neke izmene?`;
            } else if (!responseContent) {
                responseContent = "Nisam siguran koga želite da targetirate ili koji hotel promovišemo. Možete li mi dati više detalja?";
            }

            setChatMessages(prev => [...prev, { role: 'agent', content: responseContent }]);
            setIsAgentProcessing(false);
        }, 1200);
    };

    const newsLetterTemplates: { [key: string]: string } = {
        minimalist: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 40px; color: #333;">
                <div style="text-align: center; margin-bottom: 40px;">
                    <h1 style="color: #00acc1; margin: 0; font-size: 24px;">PRIME TRAVEL</h1>
                </div>
                <div style="line-height: 1.6; font-size: 16px;">
                    ${generatedText.replace(/\n/g, '<br/>')}
                </div>
                <div style="margin-top: 40px; text-align: center;">
                    <a href="#" style="background: #00acc1; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">REZERVIŠI SADA</a>
                </div>
            </div>
        `,
        vibrant: `
            <div style="font-family: 'Helvetica', sans-serif; max-width: 600px; margin: auto; background: #f8f9fa; overflow: hidden; border-radius: 10px;">
                <div style="background: url('${selectedImage}') center/cover no-repeat; padding: 80px 20px; text-align: center; color: white; position: relative;">
                    <div style="position: absolute; inset: 0; background: rgba(0,0,0,0.4);"></div>
                    <div style="position: relative;">
                        <h1 style="margin: 0; font-size: 32px; letter-spacing: 2px; text-shadow: 0 2px 10px rgba(0,0,0,0.5);">OTKRIJTE SVET</h1>
                        <p style="opacity: 0.9; margin-top: 10px; font-weight: bold;">Ekskluzivne ponude samo za vas</p>
                    </div>
                </div>
                <div style="padding: 40px; background: white; margin: -20px 20px 20px 20px; border-radius: 10px; box-shadow: 0 10px 30px rgba(0,0,0,0.05); position: relative;">
                    <div style="line-height: 1.8; font-size: 16px; color: #444;">
                        ${generatedText.replace(/\n/g, '<br/>')}
                    </div>
                    <div style="margin-top: 30px; border-top: 1px solid #eee; padding-top: 20px; text-align: center;">
                        <button style="background: #00acc1; color: white; border: none; padding: 15px 40px; font-size: 18px; border-radius: 50px; cursor: pointer; font-weight: bold;">POGLEDAJ PONUDU</button>
                    </div>
                </div>
            </div>
        `,
        urgent: `
            <div style="font-family: 'Impact', sans-serif; max-width: 600px; margin: auto; border: 4px solid #ef4444; padding: 20px;">
                <div style="background: #ef4444; color: white; padding: 10px; text-align: center; font-size: 24px; text-transform: uppercase;">
                    POSLEDNJA ŠANSA!
                </div>
                <div style="padding: 30px 0; font-family: Arial, sans-serif;">
                    <div style="font-size: 18px; line-height: 1.6; color: #111; font-weight: bold;">
                        ${generatedText.replace(/\n/g, '<br/>')}
                    </div>
                </div>
                <div style="text-align: center; padding-bottom: 20px;">
                    <div style="font-size: 40px; color: #ef4444; font-weight: 900; margin-bottom: 15px;">-45% POPUSTA</div>
                    <a href="#" style="background: #111; color: white; padding: 20px 50px; text-decoration: none; display: inline-block; font-size: 20px; border-radius: 4px;">REAGUJ ODMAH</a>
                </div>
            </div>
        `
    };

    return (
        <div style={{ padding: '32px', minHeight: '100vh', background: 'var(--bg-main)', color: 'var(--text-primary)' }}>
            <style>
                {`
                    .no-scrollbar::-webkit-scrollbar { display: none; }
                    .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
                `}
            </style>

            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                    <div style={{ width: '64px', height: '64px', borderRadius: '16px', background: 'var(--bg-card)', border: '1px solid var(--glass-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 32px rgba(0,0,0,0.4)', position: 'relative', overflow: 'hidden' }}>
                        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, rgba(0,229,255,0.05) 0%, transparent 100%)' }}></div>
                        <PrimeIcon size={38} />
                    </div>
                    <div>
                        <h1 style={{ margin: 0, fontSize: '32px', fontWeight: 950, letterSpacing: '-1px' }}>AI SMART MARKETING HUB</h1>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '4px', color: 'var(--text-secondary)' }}>
                            <span style={{ fontSize: '14px', fontWeight: 600 }}>Filozofski Content Matrix & Data-Driven Trigeri</span>
                            <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: 'currentColor' }}></div>
                            <span style={{ fontSize: '12px', background: 'rgba(0,229,255,0.1)', color: 'var(--accent-cyan)', padding: '4px 12px', borderRadius: '20px', fontWeight: 900 }}>V5 NEURAL ENGINE</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div style={{ display: 'flex', gap: '12px', marginBottom: '32px' }}>
                {[
                    { id: 'command', label: 'AI COMMAND CENTER', icon: Cpu },
                    { id: 'matrix', label: 'CONTENT MATRIX', icon: MessageSquare },
                    { id: 'social', label: 'SOCIAL STUDIO', icon: Send },
                    { id: 'newsletter', label: 'NEWSLETTER ENGINE', icon: Mail },
                    { id: 'calendar', label: 'MARKETING CALENDAR', icon: Calendar },
                    { id: 'triggers', label: 'SMART TRIGGERS', icon: Zap },
                    { id: 'loyalty', label: 'SILENT LOYALTY', icon: Gift }
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        style={{
                            padding: '0 28px',
                            height: '52px',
                            fontSize: '11px',
                            fontWeight: 900,
                            letterSpacing: '1.5px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            cursor: 'pointer',
                            borderRadius: '12px',
                            transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                            background: activeTab === tab.id 
                                ? 'linear-gradient(135deg, #00e5ff 0%, #00acc1 100%)' 
                                : 'var(--bg-card)',
                            color: activeTab === tab.id ? '#000000' : 'var(--text-secondary)',
                            boxShadow: activeTab === tab.id 
                                ? '0 10px 25px rgba(0, 229, 255, 0.4), inset 0 2px 1px rgba(255,255,255,0.4)' 
                                : '0 2px 8px rgba(0,0,0,0.05)',
                            transform: activeTab === tab.id ? 'translateY(-2px)' : 'none',
                            backdropFilter: 'blur(10px)',
                            border: activeTab === tab.id ? 'none' : '1px solid var(--glass-border)'
                        }}
                    >
                        <tab.icon size={16} style={{ filter: activeTab === tab.id ? 'drop-shadow(0 0 5px rgba(0,0,0,0.3))' : 'none' }} />
                        {tab.label}
                    </button>
                ))}
            </div>

            <AnimatePresence mode="wait">
                <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3 }}
                >
                    {activeTab === 'command' && (
                        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
                            <div className="v5-card" style={{ padding: '60px', textAlign: 'center', marginBottom: '40px', background: 'linear-gradient(135deg, rgba(0, 229, 255, 0.05) 0%, transparent 100%)', position: 'relative', overflow: 'hidden' }}>
                                <div style={{ position: 'absolute', top: '-100px', left: '-100px', width: '300px', height: '300px', background: 'radial-gradient(circle, rgba(0, 229, 255, 0.1) 0%, transparent 70%)', borderRadius: '50%' }}></div>
                                <div style={{ width: '80px', height: '80px', background: 'var(--bg-card)', border: '1px solid var(--glass-border)', borderRadius: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 32px auto', color: 'var(--accent-cyan)', boxShadow: '0 20px 50px rgba(0,0,0,0.3)' }}>
                                    <Cpu size={40} className={isCommandLoading ? 'animate-pulse' : ''} />
                                </div>
                                <h1 style={{ fontSize: '36px', fontWeight: 950, marginBottom: '16px', letterSpacing: '-1.5px' }}>AI COMMAND CENTER</h1>
                                <p style={{ color: 'var(--text-secondary)', fontSize: '16px', maxWidth: '600px', margin: '0 auto 40px auto', lineHeight: 1.6 }}>
                                    Pitajte agenta za analizu prodaje, najprodavanije hotele ili specifične atribute smeštaja. Agent direktno pretražuje vašu bazu i priprema marketing kreativu.
                                </p>

                                <div style={{ position: 'relative', maxWidth: '700px', margin: '0 auto' }}>
                                    <input 
                                        value={commandInput}
                                        onChange={e => setCommandInput(e.target.value)}
                                        onKeyDown={e => e.key === 'Enter' && handleCommand()}
                                        placeholder="Npr: Pokaži mi hotele koje nismo prodali 30 dana..."
                                        style={{ 
                                            width: '100%', 
                                            height: '72px', 
                                            background: 'rgba(255,255,255,0.03)', 
                                            border: '1px solid var(--glass-border)', 
                                            borderRadius: '20px', 
                                            padding: '0 80px 0 32px', 
                                            color: 'white', 
                                            fontSize: '18px',
                                            fontWeight: 500,
                                            boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
                                            outline: 'none',
                                            transition: '0.3s'
                                        }}
                                    />
                                    <button 
                                        onClick={handleCommand}
                                        style={{ 
                                            position: 'absolute', 
                                            right: '12px', 
                                            top: '12px', 
                                            width: '48px', 
                                            height: '48px', 
                                            background: 'linear-gradient(135deg, #00e5ff 0%, #00acc1 100%)', 
                                            border: 'none', 
                                            borderRadius: '12px', 
                                            cursor: 'pointer', 
                                            display: 'flex', 
                                            alignItems: 'center', 
                                            justifyContent: 'center',
                                            color: 'black'
                                        }}
                                    >
                                        {isCommandLoading ? <div className="animate-spin" style={{ width: '20px', height: '20px', border: '2px solid black', borderTopColor: 'transparent', borderRadius: '50%' }}></div> : <Zap size={20} fill="black" />}
                                    </button>
                                </div>

                                <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', marginTop: '24px' }}>
                                    {['Najprodavaniji', 'Nismo prodali 30 dana', 'Hoteli na plaži', 'Deca gratis'].map(suggestion => (
                                        <button 
                                            key={suggestion}
                                            onClick={() => { setCommandInput(suggestion); setTimeout(handleCommand, 100); }}
                                            style={{ padding: '8px 16px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', borderRadius: '10px', color: 'var(--text-secondary)', fontSize: '11px', fontWeight: 800, cursor: 'pointer', transition: '0.2s' }}
                                            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                                            onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                                        >
                                            {suggestion}
                                        </button>
                                    ))}
                                </div>
                            </div>

                                {commandResults.length > 0 && (
                                    <motion.div 
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}
                                    >
                                        {commandResults.map((hotel: any) => (
                                            <div key={hotel.id} className="v5-card" style={{ padding: '0', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                                            <div style={{ height: '200px', position: 'relative' }}>
                                                <img src={hotel.image} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                <div style={{ position: 'absolute', top: '16px', right: '16px', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(10px)', color: 'var(--accent-cyan)', padding: '6px 12px', borderRadius: '8px', fontSize: '10px', fontWeight: 950, border: '1px solid var(--accent-cyan)' }}>
                                                    {hotel.promo}
                                                </div>
                                            </div>
                                            <div style={{ padding: '24px' }}>
                                                <div style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '1px' }}>{hotel.location}</div>
                                                <h3 style={{ fontSize: '20px', fontWeight: 950, margin: '4px 0 12px 0' }}>{hotel.name}</h3>
                                                
                                                <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
                                                    {hotel.features.map((f: string) => (
                                                        <span key={f} style={{ fontSize: '9px', fontWeight: 950, background: 'rgba(255,255,255,0.05)', padding: '4px 10px', borderRadius: '6px', color: 'var(--text-secondary)' }}>{f}</span>
                                                    ))}
                                                </div>

                                                <div style={{ background: 'rgba(0,0,0,0.2)', borderRadius: '12px', padding: '16px', marginBottom: '24px', display: 'flex', justifyContent: 'space-between' }}>
                                                    <div>
                                                        <div style={{ fontSize: '10px', color: 'var(--text-secondary)', fontWeight: 800 }}>PRODATO (30d)</div>
                                                        <div style={{ fontSize: '18px', fontWeight: 950, color: hotel.sales30d > 20 ? '#10b981' : '#ef4444' }}>{hotel.sales30d} REZ.</div>
                                                    </div>
                                                    <div style={{ textAlign: 'right' }}>
                                                        <div style={{ fontSize: '10px', color: 'var(--text-secondary)', fontWeight: 800 }}>POSLEDNJA PRODAJA</div>
                                                        <div style={{ fontSize: '16px', fontWeight: 950 }}>PRE {hotel.lastSold} DANA</div>
                                                    </div>
                                                </div>

                                                <button 
                                                    onClick={() => handlePromote(hotel)}
                                                    style={{ 
                                                        width: '100%', 
                                                        height: '52px', 
                                                        background: 'linear-gradient(135deg, #00e5ff 0%, #00acc1 100%)', 
                                                        border: 'none', 
                                                        borderRadius: '12px', 
                                                        color: 'black', 
                                                        fontWeight: 950, 
                                                        cursor: 'pointer',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        gap: '10px',
                                                        transition: '0.3s'
                                                    }}
                                                    onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                                                    onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
                                                >
                                                    <Database size={18} /> PROMOVIŠI HOTEL
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </motion.div>
                            )}
                        </div>
                    )}

                    {activeTab === 'matrix' && (
                        <div style={{ display: 'grid', gridTemplateColumns: '360px 1fr 340px', height: 'calc(100vh - 250px)', gap: '24px' }}>
                            {/* Left: ASSET HUB (Hotel & Image Selection) */}
                            <div className="no-scrollbar" style={{ display: 'flex', flexDirection: 'column', gap: '24px', background: 'rgba(0,0,0,0.2)', padding: '24px', borderRight: '1px solid var(--glass-border)', overflowY: 'auto' }}>
                                <div>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <Database size={18} style={{ color: 'var(--accent-cyan)' }} />
                                            <h3 style={{ fontSize: '11px', fontWeight: 900, color: 'var(--text-secondary)', letterSpacing: '2px', margin: 0 }}>HOTEL & ASSET HUB</h3>
                                        </div>
                                        <a href="https://www.canva.com" target="_blank" rel="noreferrer" style={{ fontSize: '10px', color: '#00c4cc', fontWeight: 900, textDecoration: 'none', background: 'rgba(0, 196, 204, 0.1)', padding: '4px 8px', borderRadius: '4px' }}>CANVA ↗</a>
                                    </div>
                                    
                                    {/* Hotel Selector (Multi) */}
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '24px' }}>
                                        <p style={{ fontSize: '10px', color: 'var(--text-secondary)', fontWeight: 800, marginBottom: '4px' }}>ODABERI HOTELE ZA PROMOCIJU</p>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                            {HOTEL_DB.slice(0, 5).map(hotel => {
                                                const isSelected = selectedHotels.find(h => h.id === hotel.id);
                                                return (
                                                    <div 
                                                        key={hotel.id} 
                                                        onClick={() => {
                                                            if (isSelected) {
                                                                setSelectedHotels(prev => prev.filter(h => h.id !== hotel.id));
                                                                setSelectedImages(prev => prev.filter(img => img !== hotel.image));
                                                            } else {
                                                                setSelectedHotels(prev => [...prev, hotel]);
                                                                setSelectedImages(prev => [...prev, hotel.image]);
                                                            }
                                                        }}
                                                        style={{ 
                                                            padding: '10px 12px', 
                                                            background: isSelected ? 'rgba(0, 229, 255, 0.1)' : 'rgba(255,255,255,0.02)', 
                                                            border: '1px solid', 
                                                            borderColor: isSelected ? 'var(--accent-cyan)' : 'var(--glass-border)', 
                                                            borderRadius: '12px', 
                                                            cursor: 'pointer',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: '12px',
                                                            transition: '0.2s'
                                                        }}
                                                    >
                                                        <img src={hotel.image} style={{ width: '32px', height: '32px', borderRadius: '6px', objectFit: 'cover' }} />
                                                        <div style={{ flex: 1 }}>
                                                            <div style={{ fontSize: '12px', fontWeight: 900, color: isSelected ? 'var(--accent-cyan)' : 'white' }}>{hotel.name}</div>
                                                            <div style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>{hotel.location}</div>
                                                        </div>
                                                        {isSelected && <Zap size={10} fill="var(--accent-cyan)" />}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {/* Layout Options */}
                                    <div style={{ marginBottom: '24px' }}>
                                        <p style={{ fontSize: '10px', color: 'var(--text-secondary)', fontWeight: 800, marginBottom: '12px' }}>VIZUELNI PRIKAZ (LAYOUT)</p>
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
                                            {[
                                                { id: 'single', label: 'Single Post', icon: FileText },
                                                { id: 'carousel', label: 'Carousel', icon: Folder },
                                                { id: 'grid-2', label: 'Split (2)', icon: Database },
                                                { id: 'grid-4', label: 'Grid (4)', icon: Database },
                                                { id: 'grid-9', label: 'Grid (9)', icon: Database },
                                                { id: 'reels', label: 'Reels/Shorts', icon: PlayCircle },
                                                { id: 'gm-post', label: 'Maps Post', icon: MapPin }
                                            ].map(layout => (
                                                <button 
                                                    key={layout.id}
                                                    onClick={() => setVisualLayout(layout.id)}
                                                    style={{ 
                                                        height: '40px', 
                                                        background: visualLayout === layout.id ? 'var(--accent-cyan)' : 'rgba(255,255,255,0.05)', 
                                                        border: 'none', 
                                                        borderRadius: '10px', 
                                                        color: visualLayout === layout.id ? 'black' : 'white', 
                                                        fontSize: '10px', 
                                                        fontWeight: 900,
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        gap: '6px',
                                                        cursor: 'pointer'
                                                    }}
                                                >
                                                    <layout.icon size={14} /> {layout.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Asset Gallery / Upload */}
                                    <div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                                            <p style={{ fontSize: '10px', color: 'var(--text-secondary)', fontWeight: 800 }}>ASSET GALLERY</p>
                                            <button style={{ background: 'none', border: 'none', color: 'var(--accent-cyan)', fontSize: '10px', fontWeight: 900, cursor: 'pointer' }}>+ UPLOAD</button>
                                        </div>
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                                            {selectedImages.map((img, idx) => (
                                                <div 
                                                    key={idx} 
                                                    style={{ 
                                                        aspectRatio: '1/1', 
                                                        borderRadius: '8px', 
                                                        background: `url(${img}) center/cover`, 
                                                        border: '1px solid var(--accent-cyan)',
                                                        position: 'relative'
                                                    }}
                                                >
                                                    <button 
                                                        onClick={() => setSelectedImages(prev => prev.filter((_, i) => i !== idx))}
                                                        style={{ position: 'absolute', top: '2px', right: '2px', background: 'rgba(239, 68, 68, 0.8)', border: 'none', borderRadius: '4px', color: 'white', padding: '2px', cursor: 'pointer' }}
                                                    >
                                                        <Trash2 size={8} />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Center: Generator/Preview Hub */}
                            <div className="v5-card" style={{ padding: '0', display: 'flex', flexDirection: 'column', background: 'rgba(0,0,0,0.4)', borderRadius: '24px', overflow: 'hidden' }}>
                                <div style={{ padding: '24px', borderBottom: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <h2 style={{ fontSize: '16px', fontWeight: 950, margin: 0 }}>PREVIEW HUB</h2>
                                        <span style={{ fontSize: '10px', padding: '4px 8px', background: 'rgba(0, 229, 255, 0.1)', color: 'var(--accent-cyan)', borderRadius: '6px', fontWeight: 900 }}>{visualLayout.toUpperCase()} MODE</span>
                                    </div>
                                    <div style={{ display: 'flex', gap: '12px' }}>
                                        <button 
                                            onClick={() => setActiveTab('newsletter')}
                                            disabled={!generatedText}
                                            style={{ padding: '10px 20px', background: generatedText ? 'rgba(0, 229, 255, 0.1)' : 'rgba(255,255,255,0.05)', border: '1px solid', borderColor: generatedText ? 'var(--accent-cyan)' : 'transparent', borderRadius: '12px', color: generatedText ? 'var(--accent-cyan)' : 'var(--text-secondary)', fontSize: '10px', fontWeight: 900, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
                                        >
                                            <Mail size={16} /> U NEWSLETTER
                                        </button>
                                        <button 
                                            onClick={() => setActiveTab('social')}
                                            disabled={!generatedText}
                                            style={{ padding: '10px 20px', background: generatedText ? 'rgba(125, 42, 232, 0.1)' : 'rgba(255,255,255,0.05)', border: '1px solid', borderColor: generatedText ? '#7d2ae8' : 'transparent', borderRadius: '12px', color: generatedText ? '#a855f7' : 'var(--text-secondary)', fontSize: '10px', fontWeight: 900, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
                                        >
                                            <Send size={16} /> U SOCIAL
                                        </button>
                                    </div>
                                </div>

                                <div className="no-scrollbar" style={{ flex: 1, padding: '40px', overflowY: 'auto' }}>
                                    {selectedImages.length > 0 || generatedText ? (
                                        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
                                            {/* Dynamic Layout Renderer */}
                                            <div style={{ marginBottom: '32px' }}>
                                                {visualLayout === 'single' && (
                                                    <div style={{ width: '100%', aspectRatio: '16/9', background: `url(${selectedImages[0] || selectedImage}) center/cover`, borderRadius: '24px', boxShadow: '0 30px 60px rgba(0,0,0,0.5)', border: '1px solid var(--glass-border)' }}></div>
                                                )}
                                                {visualLayout === 'carousel' && (
                                                    <div style={{ display: 'flex', gap: '16px', overflowX: 'auto', paddingBottom: '20px' }}>
                                                        {selectedImages.map((img, i) => (
                                                            <div key={i} style={{ minWidth: '80%', aspectRatio: '4/5', background: `url(${img}) center/cover`, borderRadius: '20px', border: '1px solid var(--glass-border)' }}></div>
                                                        ))}
                                                    </div>
                                                )}
                                                {(visualLayout === 'grid-2' || visualLayout === 'grid-4' || visualLayout === 'grid-9') && (
                                                    <div style={{ 
                                                        display: 'grid', 
                                                        gridTemplateColumns: `repeat(${visualLayout === 'grid-2' ? 2 : visualLayout === 'grid-4' ? 2 : 3}, 1fr)`, 
                                                        gap: '8px',
                                                        borderRadius: '24px',
                                                        overflow: 'hidden',
                                                        border: '1px solid var(--glass-border)'
                                                    }}>
                                                        {[...Array(visualLayout === 'grid-2' ? 2 : visualLayout === 'grid-4' ? 4 : 9)].map((_, i) => (
                                                            <div key={i} style={{ aspectRatio: '1/1', background: `url(${selectedImages[i % (selectedImages.length || 1)] || selectedImage}) center/cover` }}></div>
                                                        ))}
                                                    </div>
                                                )}
                                                {visualLayout === 'reels' && (
                                                    <div style={{ width: '320px', height: '568px', margin: '0 auto', background: `url(${selectedImages[0] || selectedImage}) center/cover`, borderRadius: '32px', border: '8px solid #222', position: 'relative' }}>
                                                        <div style={{ position: 'absolute', bottom: '20px', left: '20px', color: 'white', textShadow: '0 2px 4px rgba(0,0,0,0.5)', fontSize: '12px' }}>
                                                            <div style={{ fontWeight: 900 }}>REELS PREVIEW</div>
                                                            <div style={{ opacity: 0.8 }}>Audio: Summer Vibe (Original)</div>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>

                                            <div style={{ position: 'relative' }}>
                                                <div style={{ position: 'absolute', top: '-12px', left: '20px', background: 'var(--accent-cyan)', color: 'black', padding: '2px 10px', borderRadius: '4px', fontSize: '10px', fontWeight: 900, zIndex: 1 }}>CONTENT EDITOR</div>
                                                <textarea 
                                                    value={generatedText}
                                                    onChange={e => setGeneratedText(e.target.value)}
                                                    style={{ 
                                                        width: '100%', 
                                                        minHeight: '200px',
                                                        background: 'rgba(255,255,255,0.03)', 
                                                        padding: '32px', 
                                                        borderRadius: '16px', 
                                                        border: '1px solid var(--glass-border)', 
                                                        lineHeight: 1.8, 
                                                        fontSize: '16px', 
                                                        color: '#fff',
                                                        outline: 'none',
                                                        resize: 'vertical',
                                                        fontFamily: 'inherit'
                                                    }}
                                                    placeholder="Unesite ili generišite sadržaj..."
                                                />
                                            </div>
                                        </div>
                                    ) : (
                                        <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', color: 'var(--text-secondary)', opacity: 0.6 }}>
                                            <Brain size={64} style={{ marginBottom: '24px' }} />
                                            <h3 style={{ fontSize: '20px', fontWeight: 950 }}>DIZAJNIRAJTE KAMPANJU</h3>
                                            <p style={{ maxWidth: '400px', fontSize: '14px' }}>Odaberite hotele ili assete sa leve strane, pa koristite AI Agenta da kreirate magiju.</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Right: Personas Sidebar */}
                            <div className="no-scrollbar" style={{ display: 'flex', flexDirection: 'column', gap: '16px', overflowY: 'auto' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                                    <Sparkles size={16} style={{ color: '#a855f7' }} />
                                    <h3 style={{ fontSize: '11px', fontWeight: 900, color: 'var(--text-secondary)', letterSpacing: '2px', margin: 0 }}>AI PERSONE / TON</h3>
                                </div>
                                {PERSONAS.map(p => (
                                    <div 
                                        key={p.id} 
                                        onClick={() => { setSelectedPersona(p.id); setNewsletterAgentInput(`Kao ${p.name}: `); }}
                                        style={{ padding: '16px', background: selectedPersona === p.id ? `${p.color}15` : 'rgba(255,255,255,0.02)', border: '1px solid', borderColor: selectedPersona === p.id ? p.color : 'var(--glass-border)', borderRadius: '20px', cursor: 'pointer', transition: '0.3s' }}
                                    >
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                                            <div style={{ fontWeight: 900, color: selectedPersona === p.id ? p.color : 'white', fontSize: '14px' }}>{p.name}</div>
                                            <span style={{ fontSize: '8px', background: `${p.color}20`, color: p.color, padding: '2px 4px', borderRadius: '4px', fontWeight: 900 }}>{p.role}</span>
                                        </div>
                                        <div style={{ fontSize: '11px', color: 'var(--text-secondary)', fontStyle: 'italic' }}>"{p.quote.substring(0, 60)}..."</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {activeTab === 'social' && (
                        <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr 340px', height: 'calc(100vh - 250px)', gap: '24px' }}>
                            {/* Left: Asset Hub for Social */}
                            <div style={{ padding: '0px', borderRight: '1px solid var(--glass-border)', display: 'flex', flexDirection: 'column', gap: '24px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                                    <Folder size={18} style={{ color: 'var(--accent-cyan)' }} />
                                    <h3 style={{ fontSize: '11px', fontWeight: 900, color: 'var(--text-secondary)', letterSpacing: '2px', margin: 0 }}>ASSET HUB</h3>
                                </div>

                                {/* Hotel Picker for Social */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                    <p style={{ fontSize: '10px', color: 'var(--text-secondary)', fontWeight: 800 }}>ODABERI HOTEL</p>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                        {HOTEL_DB.slice(0, 3).map(hotel => (
                                            <button 
                                                key={hotel.id} 
                                                onClick={() => setSelectedHotels(prev => prev.includes(hotel.id) ? prev.filter(h => h !== hotel.id) : [...prev, hotel.id])}
                                                style={{ height: '32px', padding: '0 12px', background: selectedHotels.includes(hotel.id) ? 'var(--accent-cyan)' : 'rgba(255,255,255,0.05)', border: 'none', borderRadius: '8px', color: selectedHotels.includes(hotel.id) ? 'black' : 'white', fontSize: '10px', fontWeight: 900, cursor: 'pointer' }}
                                            >
                                                {hotel.name}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Layout Quick Select */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                    <p style={{ fontSize: '10px', color: 'var(--text-secondary)', fontWeight: 800 }}>LAYOUT & FORMAT</p>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                                        {['single', 'reels', 'carousel', 'grid-4'].map(l => (
                                            <button key={l} onClick={() => setVisualLayout(l)} style={{ height: '30px', background: visualLayout === l ? 'rgba(0, 229, 255, 0.1)' : 'rgba(255,255,255,0.02)', border: '1px solid', borderColor: visualLayout === l ? 'var(--accent-cyan)' : 'transparent', borderRadius: '6px', color: visualLayout === l ? 'var(--accent-cyan)' : 'var(--text-secondary)', fontSize: '10px', fontWeight: 900, textTransform: 'uppercase' }}>{l}</button>
                                        ))}
                                    </div>
                                </div>

                                {/* Platform Selector */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                    <p style={{ fontSize: '10px', color: 'var(--text-secondary)', fontWeight: 800 }}>KANAL DISTRIBUCIJE</p>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
                                        {[
                                            { id: 'ig', icon: '📸', color: '#E1306C' },
                                            { id: 'fb', icon: '👥', color: '#1877F2' },
                                            { id: 'tt', icon: '🎵', color: '#000000' },
                                            { id: 'wa', icon: '🟢', color: '#25D366' },
                                            { id: 'gm', icon: '📍', color: '#4285F4' }
                                        ].map(platform => (
                                            <div key={platform.id} onClick={() => setSelectedPlatform(platform.id)} style={{ aspectRatio: '1/1', borderRadius: '12px', border: '1px solid', borderColor: selectedPlatform === platform.id ? platform.color : 'var(--glass-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', cursor: 'pointer', background: selectedPlatform === platform.id ? `${platform.color}15` : 'transparent' }}>{platform.icon}</div>
                                        ))}
                                    </div>
                                </div>

                                {/* Canva link */}
                                <div style={{ marginTop: 'auto' }}>
                                    <a href="https://www.canva.com" target="_blank" rel="noreferrer" style={{ width: '100%', height: '40px', background: 'rgba(0, 196, 204, 0.1)', border: '1px solid #00c4cc', borderRadius: '12px', color: '#00c4cc', fontSize: '11px', fontWeight: 950, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', textDecoration: 'none' }}>
                                        CANVA DESIGN HUB ↗
                                    </a>
                                </div>
                            </div>
                            {/* Center: Mobile Preview */}
                            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', background: 'rgba(0,0,0,0.5)', borderRadius: '24px' }}>
                                <div style={{ width: '280px', height: '560px', background: '#000', borderRadius: '40px', border: '10px solid #222', position: 'relative', boxShadow: '0 40px 80px rgba(0,0,0,0.6)', overflow: 'hidden' }}>
                                    <div style={{ height: '40px', background: '#222', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <div style={{ width: '60px', height: '18px', background: '#000', borderRadius: '9px' }}></div>
                                    </div>
                                    <div style={{ padding: '16px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                                            <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: selectedPlatform === 'gm' ? '#4285F4' : 'var(--accent-cyan)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                {selectedPlatform === 'gm' ? <MapPin size={16} color="white" /> : null}
                                            </div>
                                            <div>
                                                <div style={{ fontSize: '12px', fontWeight: 900, color: 'white' }}>{selectedPlatform === 'gm' ? 'Google Business Profile' : 'PrimeClick Travel'}</div>
                                                {selectedPlatform === 'gm' && <div style={{ fontSize: '8px', color: 'var(--text-secondary)' }}>Objava na mapi</div>}
                                            </div>
                                        </div>
                                        <div style={{ width: '100%', aspectRatio: '1/1', background: `url(${selectedImage}) center/cover`, borderRadius: '8px', marginBottom: '16px' }}></div>
                                        <div style={{ fontSize: '12px', color: 'white', opacity: 0.9, lineHeight: 1.6, height: '180px' }}>
                                            <div style={{ fontWeight: 900, marginBottom: '4px' }}>PrimeClick Travel</div>
                                            <textarea 
                                                value={generatedText}
                                                onChange={e => setGeneratedText(e.target.value)}
                                                style={{ 
                                                    width: '100%', 
                                                    height: '140px', 
                                                    background: 'transparent', 
                                                    border: 'none', 
                                                    color: 'white', 
                                                    fontSize: '11px', 
                                                    resize: 'none', 
                                                    outline: 'none', 
                                                    fontFamily: 'inherit',
                                                    padding: 0
                                                }}
                                                placeholder="Vaš sadržaj će se pojaviti ovde..."
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Right: Actions & Schedule */}
                            <div className="v5-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
                                <h3 style={{ fontSize: '11px', fontWeight: 900, color: 'var(--text-secondary)', letterSpacing: '2px' }}>PLANER PUBLIKACIJE</h3>
                                
                                <div style={{ background: 'rgba(255,255,255,0.03)', padding: '20px', borderRadius: '20px', border: '1px solid var(--glass-border)' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                                        <Clock size={16} />
                                        <span style={{ fontSize: '13px', fontWeight: 600 }}>Najbolje vreme: Danas, 18:00</span>
                                    </div>
                                    <button 
                                        onClick={() => {
                                            const newCampaign = {
                                                id: 'q-' + Date.now(),
                                                type: 'social',
                                                title: (PLATFORMS_MAP[selectedPlatform] || 'Social') + ' Objava',
                                                audience: 'Svi pratioci',
                                                scheduledTime: new Date().toISOString().split('T')[0] + 'T18:00:00',
                                                status: 'planned',
                                                platform: selectedPlatform,
                                                content: generatedText
                                            };
                                            setMarketingQueue(prev => [...prev, newCampaign]);
                                            alert('Objava uspešno programirana za danas u 18h!');
                                            setActiveTab('calendar');
                                        }}
                                        style={{ width: '100%', height: '48px', background: 'var(--accent-cyan)', border: 'none', borderRadius: '12px', color: 'black', fontWeight: 950, fontSize: '12px', cursor: 'pointer' }}
                                    >
                                        PROGRAMIRAJ OBJAVU
                                    </button>
                                </div>

                                <div style={{ marginTop: 'auto' }}>
                                    <button style={{ width: '100%', height: '48px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', borderRadius: '12px', color: 'white', fontWeight: 600, fontSize: '12px', marginBottom: '12px' }}>SAČUVAJ KAO DRAFT</button>
                                    <button 
                                        onClick={() => alert('Objava je poslata na odobrenje!')}
                                        style={{ width: '100%', height: '48px', background: 'white', border: 'none', borderRadius: '12px', color: 'black', fontWeight: 950, fontSize: '12px' }}
                                    >
                                        POŠALJI ODMAH
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'newsletter' && (
                            <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '320px 1fr 480px', overflow: 'hidden' }}>
                                {/* Left Sidebar: Control Panel */}
                                <div style={{ padding: '24px', borderRight: '1px solid var(--glass-border)', overflowY: 'hidden', display: 'flex', flexDirection: 'column', background: 'rgba(0,0,0,0.2)' }}>
                                    <h3 style={{ fontSize: '11px', fontWeight: 900, color: 'var(--text-secondary)', letterSpacing: '2px', marginBottom: '16px' }}>AI MARKETING CHAT</h3>
                                    
                                    {/* Chat Window - Now smaller Refinement Chat */}
                                    <div className="no-scrollbar" style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '20px', paddingRight: '4px' }}>
                                        <div style={{ padding: '12px', background: 'rgba(0, 229, 255, 0.05)', borderRadius: '12px', border: '1px dashed var(--accent-cyan)', fontSize: '11px', color: 'var(--accent-cyan)', textAlign: 'center', marginBottom: '10px' }}>
                                            POVEZANO SA CREATIVE STUDIOM
                                        </div>
                                        {chatMessages.map((msg, idx) => (
                                            <div key={idx} style={{ 
                                                alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                                                maxWidth: '85%',
                                                padding: '12px 16px',
                                                borderRadius: msg.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                                                background: msg.role === 'user' ? 'var(--accent-cyan)' : 'rgba(255,255,255,0.05)',
                                                color: msg.role === 'user' ? 'black' : 'white',
                                                fontSize: '13px',
                                                lineHeight: 1.5,
                                                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                                                border: msg.role === 'agent' ? '1px solid var(--glass-border)' : 'none'
                                            }}>
                                                <div dangerouslySetInnerHTML={{ __html: msg.content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br/>') }} />
                                            </div>
                                        ))}
                                        {isAgentProcessing && (
                                            <div style={{ alignSelf: 'flex-start', padding: '12px 16px', background: 'rgba(255,255,255,0.05)', borderRadius: '16px 16px 16px 4px', display: 'flex', gap: '4px' }}>
                                                <div className="animate-bounce" style={{ width: '6px', height: '6px', background: 'var(--accent-cyan)', borderRadius: '50%' }}></div>
                                                <div className="animate-bounce" style={{ width: '6px', height: '6px', background: 'var(--accent-cyan)', borderRadius: '50%', animationDelay: '0.2s' }}></div>
                                                <div className="animate-bounce" style={{ width: '6px', height: '6px', background: 'var(--accent-cyan)', borderRadius: '50%', animationDelay: '0.4s' }}></div>
                                            </div>
                                        )}
                                    </div>

                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
                                        <Mail size={18} style={{ color: 'var(--accent-cyan)' }} />
                                        <h3 style={{ fontSize: '11px', fontWeight: 900, color: 'var(--text-secondary)', letterSpacing: '2px', margin: 0 }}>NEWSLETTER CONFIG</h3>
                                    </div>
                                    
                                    {/* Asset Picker for Newsletter */}
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
                                        <p style={{ fontSize: '10px', color: 'var(--text-secondary)', fontWeight: 800 }}>ODABERI ASSETE</p>
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
                                            {selectedImages.map((img, i) => (
                                                <div key={i} onClick={() => setSelectedImage(img)} style={{ aspectRatio: '1/1', background: `url(${img}) center/cover`, borderRadius: '6px', border: selectedImage === img ? '2px solid var(--accent-cyan)' : '1px solid var(--glass-border)', cursor: 'pointer' }}></div>
                                            ))}
                                        </div>
                                        <a href="https://www.canva.com" target="_blank" rel="noreferrer" style={{ width: '100%', height: '32px', background: 'rgba(0, 196, 204, 0.1)', border: '1px solid #00c4cc', borderRadius: '8px', fontSize: '10px', color: '#00c4cc', fontWeight: 900, textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', transition: '0.3s' }}>
                                            POVEŽI CANVA DIZAJN ↗
                                        </a>
                                    </div>

                                    {/* Manual Content Override */}
                                    <div style={{ marginTop: '24px', marginBottom: '24px' }}>
                                        <h3 style={{ fontSize: '11px', fontWeight: 900, color: 'var(--text-secondary)', letterSpacing: '2px', marginBottom: '12px' }}>RUČNA IZMENA SADRŽAJA</h3>
                                        <textarea 
                                            value={generatedText}
                                            onChange={e => setGeneratedText(e.target.value)}
                                            style={{ 
                                                width: '100%', 
                                                height: '110px', 
                                                background: 'rgba(255,255,255,0.03)', 
                                                border: '1px solid var(--glass-border)', 
                                                borderRadius: '12px', 
                                                padding: '12px', 
                                                color: 'white', 
                                                fontSize: '12px',
                                                resize: 'none',
                                                outline: 'none',
                                                fontFamily: 'inherit'
                                            }}
                                            placeholder="Izmenite tekst kampanje ovde..."
                                        />
                                    </div>

                                    <h3 style={{ fontSize: '11px', fontWeight: 900, color: 'var(--text-secondary)', letterSpacing: '2px', marginBottom: '16px' }}>STATUS & SES</h3>
                                    <div style={{ background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '12px', border: '1px solid var(--glass-border)', marginBottom: '16px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                                            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: sesConfig.accessKey ? '#10b981' : '#ef4444' }}></div>
                                            <span style={{ fontSize: '11px', fontWeight: 800 }}>SES: {sesConfig.accessKey ? 'ONLINE' : 'OFFLINE'}</span>
                                        </div>
                                        <button onClick={() => setIsSesModalOpen(true)} style={{ width: '100%', height: '32px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', borderRadius: '8px', fontSize: '10px', fontWeight: 900, color: 'white' }}>POSTAVKE</button>
                                    </div>
                                    
                                    <div style={{ marginTop: 'auto' }}>
                                        <h3 style={{ fontSize: '11px', fontWeight: 900, color: 'var(--text-secondary)', letterSpacing: '2px', marginBottom: '16px' }}>PREDEFINISANI TEMPLEJTI</h3>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                            {[{ id: 'minimalist', name: 'Minimal', color: '#00acc1' }, { id: 'vibrant', name: 'Premium', color: '#10b981' }].map(tmp => (
                                                <button key={tmp.id} onClick={() => setSelectedTemplate(tmp.id)} style={{ width: '100%', height: '40px', background: selectedTemplate === tmp.id ? `${tmp.color}15` : 'rgba(255,255,255,0.02)', border: '1px solid', borderColor: selectedTemplate === tmp.id ? tmp.color : 'var(--glass-border)', borderRadius: '10px', color: selectedTemplate === tmp.id ? tmp.color : 'white', fontSize: '11px', fontWeight: 800 }}>{tmp.name.toUpperCase()}</button>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* Center: Professional Preview Area */}
                                <div style={{ padding: '60px', background: 'rgba(0,0,0,0.5)', overflowY: 'auto', display: 'flex', justifyContent: 'center' }}>
                                    <div style={{ width: '100%', maxWidth: '650px', boxShadow: '0 50px 100px rgba(0,0,0,0.8)', borderRadius: '12px', overflow: 'hidden' }}>
                                        <div 
                                            dangerouslySetInnerHTML={{ __html: newsLetterTemplates[selectedTemplate] }}
                                            style={{ background: 'white', minHeight: '800px' }}
                                        />
                                    </div>
                                </div>

                                {/* Right Sidebar: Advanced Segmentation Hub */}
                                <div style={{ padding: '32px', borderLeft: '1px solid var(--glass-border)', overflow: 'hidden', background: 'rgba(0,0,0,0.2)', display: 'flex', flexDirection: 'column' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                                        <h3 style={{ fontSize: '11px', fontWeight: 900, color: 'var(--text-secondary)', letterSpacing: '2px' }}>SEGMENTACIJA</h3>
                                        <div style={{ display: 'flex', gap: '8px' }}>
                                            {isAddingCategory ? (
                                                <div style={{ display: 'flex', gap: '4px' }}>
                                                    <input 
                                                        autoFocus
                                                        value={newCategoryName}
                                                        onChange={e => setNewCategoryName(e.target.value)}
                                                        onKeyDown={e => e.key === 'Enter' && handleAddCategory()}
                                                        placeholder="Naziv..."
                                                        style={{ height: '30px', background: 'rgba(255,255,255,0.1)', border: '1px solid var(--accent-cyan)', borderRadius: '6px', padding: '0 8px', fontSize: '10px', color: 'white', width: '80px', outline: 'none' }}
                                                    />
                                                    <button onClick={() => { setIsAddingCategory(false); setNewCategoryName(''); }} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', display: 'flex', alignItems: 'center' }}><Plus size={14} style={{ transform: 'rotate(45deg)' }} /></button>
                                                </div>
                                            ) : (
                                                <button 
                                                    onClick={() => setIsAddingCategory(true)}
                                                    style={{ background: 'rgba(0, 229, 255, 0.1)', border: 'none', color: 'var(--accent-cyan)', padding: '6px 12px', borderRadius: '8px', fontSize: '10px', fontWeight: 950, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                                                >
                                                    <Plus size={14} /> DODAJ
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    {/* Category Tabs */}
                                    <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', overflowX: 'auto', paddingBottom: '8px' }}>
                                        {categories.map(cat => (
                                            <div key={cat} style={{ position: 'relative' }}>
                                                <button 
                                                    onClick={() => { setActiveCategory(cat); setActiveSubcategory('Sve'); }}
                                                    style={{ 
                                                        padding: '8px 16px', 
                                                        background: activeCategory === cat ? 'var(--accent-cyan)' : 'rgba(255,255,255,0.05)', 
                                                        border: 'none', 
                                                        borderRadius: '8px', 
                                                        color: activeCategory === cat ? 'black' : 'var(--text-secondary)', 
                                                        fontSize: '11px', 
                                                        fontWeight: 900, 
                                                        cursor: 'pointer',
                                                        whiteSpace: 'nowrap',
                                                        paddingRight: !['Subagenti', 'Individualci', 'Dobavljači'].includes(cat) ? '32px' : '16px'
                                                    }}
                                                >
                                                    {cat.toUpperCase()}
                                                </button>
                                                {!['Subagenti', 'Individualci', 'Dobavljači'].includes(cat) && (
                                                    <button 
                                                        onClick={(e) => { e.stopPropagation(); handleRemoveCategory(cat); }}
                                                        style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: activeCategory === cat ? 'rgba(0,0,0,0.5)' : '#ef4444', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                                                    >
                                                        <Trash2 size={12} />
                                                    </button>
                                                )}
                                            </div>
                                        ))}
                                    </div>

                                    {/* Subcategory Filters */}
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '24px' }}>
                                        <button 
                                            onClick={() => setActiveSubcategory('Sve')}
                                            style={{ padding: '6px 12px', background: activeSubcategory === 'Sve' ? 'rgba(0, 229, 255, 0.2)' : 'rgba(255,255,255,0.03)', border: '1px solid', borderColor: activeSubcategory === 'Sve' ? 'var(--accent-cyan)' : 'transparent', borderRadius: '6px', color: 'white', fontSize: '10px', fontWeight: 800, cursor: 'pointer' }}
                                        >
                                            SVE
                                        </button>
                                        {Array.from(new Set(CLIENT_DB.filter(c => c.category === activeCategory).map(c => c.subcategory))).map(sub => (
                                            <button 
                                                key={sub}
                                                onClick={() => setActiveSubcategory(sub)}
                                                style={{ padding: '6px 12px', background: activeSubcategory === sub ? 'rgba(0, 229, 255, 0.2)' : 'rgba(255,255,255,0.03)', border: '1px solid', borderColor: activeSubcategory === sub ? 'var(--accent-cyan)' : 'transparent', borderRadius: '6px', color: 'white', fontSize: '10px', fontWeight: 800, cursor: 'pointer' }}
                                            >
                                                {sub.toUpperCase()}
                                            </button>
                                        ))}
                                    </div>

                                    {/* Bulk Actions (from screenshot) */}
                                    <div style={{ display: 'flex', gap: '10px', marginBottom: '24px' }}>
                                        <button 
                                            onClick={() => {
                                                const filtered = CLIENT_DB.filter(c => c.category === activeCategory && (activeSubcategory === 'Sve' || c.subcategory === activeSubcategory));
                                                setSelectedClients(prev => Array.from(new Set([...prev, ...filtered.map(c => c.id)])));
                                            }}
                                            style={{ flex: 1, padding: '10px', background: 'rgba(125, 42, 232, 0.2)', color: '#7d2ae8', border: '1px solid rgba(125, 42, 232, 0.3)', borderRadius: '8px', fontSize: '11px', fontWeight: 900, cursor: 'pointer' }}
                                        >
                                            ODABERI SVE
                                        </button>
                                        <button 
                                            onClick={() => setSelectedClients([])}
                                            style={{ flex: 1, padding: '10px', background: 'rgba(255,255,255,0.05)', color: 'var(--text-secondary)', border: '1px solid var(--glass-border)', borderRadius: '8px', fontSize: '11px', fontWeight: 900, cursor: 'pointer' }}
                                        >
                                            PONIŠTI SVE
                                        </button>
                                    </div>

                                    {/* Client Grid (from screenshot) */}
                                    <div className="no-scrollbar" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', flex: 1, overflowY: 'auto', paddingRight: '4px', marginBottom: '16px', alignContent: 'start', gridAutoRows: 'min-content' }}>
                                        {CLIENT_DB.filter(c => 
                                            c.category === activeCategory && 
                                            (activeSubcategory === 'Sve' || c.subcategory === activeSubcategory) &&
                                            (c.name.toLowerCase().includes(segmentSearch.toLowerCase()))
                                        ).map(client => (
                                            <div 
                                                key={client.id}
                                                onClick={() => setSelectedClients(prev => prev.includes(client.id) ? prev.filter(id => id !== client.id) : [...prev, client.id])}
                                                style={{ 
                                                    padding: '5px 12px', 
                                                    minHeight: '34px',
                                                    display: 'flex',
                                                    flexDirection: 'column',
                                                    justifyContent: 'center',
                                                    background: 'white', 
                                                    borderRadius: '6px', 
                                                    cursor: 'pointer',
                                                    border: '1.5px solid',
                                                    borderColor: selectedClients.includes(client.id) ? 'var(--accent-cyan)' : 'transparent',
                                                    position: 'relative',
                                                    transition: '0.2s',
                                                    boxShadow: '0 1px 4px rgba(0,0,0,0.1)'
                                                }}
                                            >
                                                {selectedClients.includes(client.id) && (
                                                    <div style={{ position: 'absolute', top: '-4px', right: '-4px', width: '16px', height: '16px', background: 'var(--accent-cyan)', color: 'black', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '9px', fontWeight: 950, border: '2px solid black' }}>✓</div>
                                                )}
                                                <div style={{ fontSize: '11px', fontWeight: 950, color: '#111', lineHeight: 1.1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{client.name}</div>
                                                <div style={{ fontSize: '8px', color: '#666', fontWeight: 800 }}>{client.subcategory}</div>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Bottom Search Bar for Clients */}
                                    <div style={{ position: 'relative', marginBottom: '12px' }}>
                                        <Search size={14} style={{ position: 'absolute', left: '12px', top: '10px', color: 'var(--text-secondary)' }} />
                                        <input 
                                            value={segmentSearch}
                                            onChange={e => setSegmentSearch(e.target.value)}
                                            placeholder="Pretraži listu u ovom segmentu..."
                                            style={{ 
                                                width: '100%', 
                                                height: '34px', 
                                                background: 'rgba(255,255,255,0.03)', 
                                                border: '1px solid var(--glass-border)', 
                                                borderRadius: '8px', 
                                                padding: '0 12px 0 32px', 
                                                color: 'white', 
                                                fontSize: '12px' 
                                            }}
                                        />
                                    </div>

                                    {/* Summary Footer - Reduced Height */}
                                    <div style={{ height: '44px', padding: '0 12px', background: 'rgba(125, 42, 232, 0.1)', border: '1px solid rgba(125, 42, 232, 0.2)', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <div style={{ fontSize: '9px', color: 'var(--text-secondary)', fontWeight: 800 }}>TARGET:</div>
                                            <div style={{ fontSize: '13px', fontWeight: 950, color: 'var(--accent-cyan)' }}>{selectedClients.length}</div>
                                        </div>
                                        <div style={{ display: 'flex', gap: '8px' }}>
                                            <button 
                                                onClick={() => {
                                                    const time = prompt('Unesite vreme slanja (YYYY-MM-DD HH:MM):', new Date().toISOString().slice(0, 16).replace('T', ' '));
                                                    if (time) {
                                                        const newCampaign = {
                                                            id: 'mq-' + Date.now(),
                                                            type: 'newsletter',
                                                            title: selectedHotel ? `Promo: ${selectedHotel.name}` : 'Ručno zakazana kampanja',
                                                            audience: `${selectedClients.length} klijena(ta)`,
                                                            scheduledTime: time.replace(' ', 'T'),
                                                            status: 'planned',
                                                            platform: 'email',
                                                            content: generatedText
                                                        };
                                                        setMarketingQueue(prev => [...prev, newCampaign]);
                                                        alert('Kampanja je uspešno dodata u kalendar.');
                                                    }
                                                }}
                                                style={{ height: '32px', padding: '0 12px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', borderRadius: '8px', color: 'white', fontSize: '10px', fontWeight: 900, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                                            >
                                                <Clock size={12} /> PROGRAMIRAJ
                                            </button>
                                            <button 
                                                onClick={() => setActiveTab('newsletter')} 
                                                style={{ width: '32px', height: '32px', background: 'linear-gradient(135deg, #7d2ae8 0%, #a855f7 100%)', border: 'none', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', cursor: 'pointer', transition: '0.3s' }}
                                                onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
                                                onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                                            >
                                                <Send size={14} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )
                    }

                    {activeTab === 'calendar' && (
                        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                                <div>
                                    <h2 style={{ fontSize: '24px', fontWeight: 950, letterSpacing: '-0.5px', marginBottom: '4px' }}>MARKETING KALENDAR</h2>
                                    <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Upravljajte zakazanim kampanjama i objavama na jednom mestu.</p>
                                </div>
                                <button style={{ padding: '12px 24px', background: 'var(--accent-cyan)', border: 'none', borderRadius: '12px', color: '#000', fontWeight: 900, fontSize: '12px', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                                    <Plus size={16} /> NOVA KAMPANJA
                                </button>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '32px' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                    {marketingQueue.length === 0 ? (
                                        <div style={{ padding: '60px', textAlign: 'center', background: 'rgba(255,255,255,0.02)', borderRadius: '24px', border: '1px dashed var(--glass-border)' }}>
                                            <Calendar size={48} style={{ color: 'var(--text-secondary)', marginBottom: '16px', opacity: 0.3 }} />
                                            <p style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>Nema zakazanih aktivnosti. Koristite AI Agenta da napravite plan.</p>
                                        </div>
                                    ) : (
                                        marketingQueue.sort((a, b) => new Date(a.scheduledTime).getTime() - new Date(b.scheduledTime).getTime()).map(item => (
                                            <div key={item.id} style={{ 
                                                padding: '20px', 
                                                background: 'var(--bg-card)', 
                                                border: '1px solid var(--glass-border)', 
                                                borderRadius: '20px', 
                                                display: 'flex', 
                                                alignItems: 'center', 
                                                gap: '24px'
                                            }}>
                                                <div style={{ 
                                                    width: '56px', height: '56px', 
                                                    borderRadius: '16px', 
                                                    background: item.platform === 'email' ? 'rgba(0,172,193,0.1)' : 
                                                               item.platform === 'gm' ? 'rgba(66,133,244,0.1)' : 'rgba(125,42,232,0.1)',
                                                    color: item.platform === 'email' ? '#00acc1' : 
                                                           item.platform === 'gm' ? '#4285F4' : '#7d2ae8',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                                                }}>
                                                    {item.platform === 'email' ? <Mail size={24} /> : 
                                                     item.platform === 'gm' ? <MapPin size={24} /> : <Send size={24} />}
                                                </div>
                                                
                                                <div style={{ flex: 1 }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '4px' }}>
                                                        <h4 style={{ fontWeight: 950, fontSize: '16px', margin: 0 }}>{item.title}</h4>
                                                        <span style={{ fontSize: '10px', background: 'rgba(255,255,255,0.05)', padding: '2px 8px', borderRadius: '10px', color: 'var(--text-secondary)', fontWeight: 800 }}>{item.status.toUpperCase()}</span>
                                                    </div>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', color: 'var(--text-secondary)', fontSize: '12px' }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Users size={14} /> {item.audience}</div>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Clock size={14} /> {new Date(item.scheduledTime).toLocaleString('sr-RS', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</div>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Target size={14} /> {item.platform.toUpperCase()}</div>
                                                    </div>
                                                </div>

                                                <div style={{ display: 'flex', gap: '8px' }}>
                                                    <button 
                                                        onClick={() => {
                                                            const newText = prompt('Izmenite sadržaj:', item.content);
                                                            if (newText !== null) {
                                                                setMarketingQueue(prev => prev.map(q => q.id === item.id ? { ...q, content: newText } : q));
                                                            }
                                                        }}
                                                        style={{ width: '36px', height: '36px', borderRadius: '10px', border: '1px solid var(--glass-border)', background: 'rgba(255,255,255,0.03)', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                                                        title="Izmeni sadržaj"
                                                    >
                                                        <FileText size={16} />
                                                    </button>
                                                    <button 
                                                        onClick={() => {
                                                            const newTime = prompt('Novo vreme (YYYY-MM-DD HH:MM):', item.scheduledTime.replace('T', ' '));
                                                            if (newTime) {
                                                                setMarketingQueue(prev => prev.map(q => q.id === item.id ? { ...q, scheduledTime: newTime.replace(' ', 'T') } : q));
                                                            }
                                                        }}
                                                        style={{ width: '36px', height: '36px', borderRadius: '10px', border: '1px solid var(--glass-border)', background: 'rgba(255,255,255,0.03)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                                                        title="Promeni vreme"
                                                    >
                                                        <Clock size={16} />
                                                    </button>
                                                    <button 
                                                        onClick={() => {
                                                            if (confirm('Da li želite da pošaljete ovo ODMAH?')) {
                                                                setMarketingQueue(prev => prev.map(q => q.id === item.id ? { ...q, status: 'sent', scheduledTime: new Date().toISOString() } : q));
                                                                alert('Uspešno poslato!');
                                                            }
                                                        }}
                                                        style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(0, 229, 255, 0.1)', color: 'var(--accent-cyan)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', border: 'none' }}
                                                        title="Pošalji odmah"
                                                    >
                                                        <Send size={16} />
                                                    </button>
                                                    <button 
                                                        onClick={() => {
                                                            if (confirm('Obriši zakazano?')) {
                                                                setMarketingQueue(prev => prev.filter(q => q.id !== item.id));
                                                            }
                                                        }}
                                                        style={{ width: '36px', height: '36px', borderRadius: '10px', border: '1px solid rgba(239,68,68,0.2)', background: 'rgba(239,68,68,0.05)', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                                    <div style={{ padding: '24px', background: 'var(--bg-card)', border: '1px solid var(--glass-border)', borderRadius: '24px' }}>
                                        <h3 style={{ fontSize: '11px', fontWeight: 900, color: 'var(--text-secondary)', letterSpacing: '2px', marginBottom: '20px' }}>ANALITIKA REDA</h3>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                            {[
                                                { label: 'Ukupno zakazano', value: marketingQueue.length, color: 'var(--accent-cyan)' },
                                                { label: 'Newsletter kampanje', value: marketingQueue.filter(q => q.type === 'newsletter').length, color: '#00acc1' },
                                                { label: 'Social objave', value: marketingQueue.filter(q => q.type === 'social').length, color: '#7d2ae8' }
                                            ].map(stat => (
                                                <div key={stat.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                    <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 600 }}>{stat.label}</span>
                                                    <span style={{ fontSize: '16px', fontWeight: 950, color: stat.color }}>{stat.value}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div style={{ padding: '24px', background: 'rgba(0,229,255,0.05)', border: '1px solid rgba(0,229,255,0.1)', borderRadius: '24px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px', color: 'var(--accent-cyan)' }}>
                                            <AlertCircle size={20} />
                                            <h4 style={{ fontSize: '14px', fontWeight: 950, margin: 0 }}>AI SAVET</h4>
                                        </div>
                                        <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)', lineHeight: 1.6, margin: 0 }}>
                                            Primetio sam da imate pauzu od 3 dana između kampanja. Da li želite da zakazm jedan "Silent Loyalty" podsetnik za subagente koji nisu rezervisali ništa u martu?
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'triggers' && (
                        <div>
                            <div className="v5-card" style={{ padding: '32px', marginBottom: '32px', background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, transparent 100%)', borderColor: 'rgba(16, 185, 129, 0.2)', position: 'relative', overflow: 'hidden' }}>
                                <div style={{ position: 'absolute', top: 0, right: 0, width: '150px', height: '150px', background: 'radial-gradient(circle, rgba(16, 185, 129, 0.1) 0%, transparent 70%)', borderRadius: '50%' }}></div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                                    <div style={{ width: '64px', height: '64px', borderRadius: '20px', background: 'rgba(16, 185, 129, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981', boxShadow: '0 8px 16px rgba(16, 185, 129, 0.1)' }}>
                                        <Target size={32} />
                                    </div>
                                    <div>
                                        <h3 style={{ fontSize: '20px', fontWeight: 950, margin: 0, letterSpacing: '-0.5px' }}>Data-Driven Automation</h3>
                                        <div style={{ fontSize: '14px', color: 'var(--text-secondary)', marginTop: '6px', lineHeight: 1.6 }}>
                                            Sistem automatski nadgleda Dosijee i šalje SMS/Email kada se ispune kritični uslovi prodaje.
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                {TRIGGERS.map(t => (
                                    <div key={t.id} className="v5-card" style={{ padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', transition: '0.3s', cursor: 'pointer' }} onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.01)'} onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}>
                                        <div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '10px' }}>
                                                <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: t.status === 'active' ? '#10b981' : '#ef4444', boxShadow: `0 0 15px ${t.status === 'active' ? '#10b981' : '#ef4444'}` }}></div>
                                                <span style={{ fontSize: '17px', fontWeight: 950, letterSpacing: '-0.2px' }}>{t.name}</span>
                                            </div>
                                            <div style={{ display: 'flex', gap: '24px', fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 600 }}>
                                                <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Users size={16} style={{ color: 'var(--accent-cyan)' }} /> Publika: {t.audience}</span>
                                                <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><TrendingUp size={16} style={{ color: 'var(--accent-cyan)' }} /> Uslov: {t.condition}</span>
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                                            <button 
                                                style={{ 
                                                    height: '40px', 
                                                    padding: '0 20px', 
                                                    background: 'var(--bg-card)', 
                                                    border: '1px solid var(--glass-border)', 
                                                    borderRadius: '8px', 
                                                    color: 'var(--text-primary)',
                                                    fontSize: '11px',
                                                    fontWeight: 900,
                                                    letterSpacing: '0.5px',
                                                    cursor: 'pointer',
                                                    transition: '0.3s'
                                                }}
                                                onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-sidebar)'; e.currentTarget.style.borderColor = 'var(--accent-cyan)'; }}
                                                onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--bg-card)'; e.currentTarget.style.borderColor = 'var(--glass-border)'; }}
                                            >
                                                IZMENI LOGIKU
                                            </button>
                                            <div style={{ width: '56px', height: '28px', background: t.status === 'active' ? 'linear-gradient(135deg, #00e5ff 0%, #00acc1 100%)' : 'var(--bg-sidebar)', borderRadius: '14px', position: 'relative', cursor: 'pointer', boxShadow: t.status === 'active' ? '0 0 15px rgba(0, 229, 255, 0.3)' : 'inset 0 2px 5px rgba(0,0,0,0.2)' }}>
                                                <div style={{ position: 'absolute', top: '3px', left: t.status === 'active' ? '31px' : '3px', width: '22px', height: '22px', background: 'white', borderRadius: '50%', transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)', boxShadow: '0 2px 5px rgba(0,0,0,0.2)' }}></div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {activeTab === 'loyalty' && (
                        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(400px, 600px)', gap: '32px', justifyContent: 'center', paddingTop: '40px' }}>
                            <div className="v5-card" style={{ padding: '48px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
                                <div style={{ position: 'absolute', top: '-50px', right: '-50px', width: '200px', height: '200px', background: 'radial-gradient(circle, rgba(255, 179, 0, 0.05) 0%, transparent 70%)', borderRadius: '50%' }}></div>
                                <div style={{ width: '100px', height: '100px', borderRadius: '30px', background: 'linear-gradient(135deg, rgba(255, 179, 0, 0.2) 0%, rgba(255, 179, 0, 0.05) 100%)', color: '#ffb300', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 32px auto', boxShadow: '0 15px 35px rgba(255, 179, 0, 0.15)', border: '1px solid rgba(255, 179, 0, 0.2)' }}>
                                    <Gift size={48} />
                                </div>
                                <h2 style={{ fontSize: '28px', fontWeight: 950, marginBottom: '20px', letterSpacing: '-1px' }}>SILENT LOYALTY ENGINE</h2>
                                <p style={{ color: 'var(--text-secondary)', fontSize: '15px', lineHeight: 1.8, marginBottom: '40px', maxWidth: '500px', margin: '0 auto 40px auto' }}>
                                    Praćenje dosijea bez svesti agenata. Sistem beleži **LTV**, datume rođenja i godišnjice. 
                                    Na osnovu margina profitabilnosti, automatski generiše **Room-upgrades** ponude koje oduševljavaju klijente.
                                </p>
                                <button 
                                    style={{ 
                                        width: '100%', 
                                        height: '64px', 
                                        background: 'linear-gradient(135deg, #ffb300 0%, #ff8f00 100%)',
                                        border: 'none',
                                        borderRadius: '16px',
                                        color: '#000',
                                        fontSize: '14px',
                                        fontWeight: 950,
                                        letterSpacing: '1px',
                                        cursor: 'pointer',
                                        boxShadow: '0 15px 35px rgba(255, 179, 0, 0.25)',
                                        transition: '0.3s'
                                    }}
                                    onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 20px 45px rgba(255, 179, 0, 0.35)'; }}
                                    onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 15px 35px rgba(255, 179, 0, 0.25)'; }}
                                >
                                    SKENIRAJ DOSIJEE (684 ZAPISA)
                                </button>
                                <div style={{ marginTop: '24px', fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 600 }}>
                                    POSLEDNJE SKENIRANJE: PRE 14 MINUTA
                                </div>
                            </div>
                        </div>
                    )}
                </motion.div>
            </AnimatePresence>
            {/* Amazon SES Settings Modal */}
            <AnimatePresence>
                {isSesModalOpen && (
                    <motion.div 
                        initial={{ opacity: 0 }} 
                        animate={{ opacity: 1 }} 
                        exit={{ opacity: 0 }}
                        style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(20px)', zIndex: 1000000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}
                    >
                        <motion.div 
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            style={{ width: '100%', maxWidth: '500px', background: 'var(--bg-card)', borderRadius: '24px', border: '1px solid var(--glass-border)', padding: '32px' }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
                                <div style={{ width: '48px', height: '48px', background: '#FF9900', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '16px', fontWeight: 900 }}>aws</div>
                                <div>
                                    <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 950 }}>AMAZON SES SETUP</h3>
                                    <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: 'var(--text-secondary)' }}>Konfiguracija za bulk slanje (30k+)</p>
                                </div>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 900, color: 'var(--text-secondary)', marginBottom: '8px' }}>AWS REGION</label>
                                    <input value={sesConfig.region} onChange={e => setSesConfig({...sesConfig, region: e.target.value})} style={{ width: '100%', height: '48px', background: 'var(--bg-sidebar)', border: '1px solid var(--glass-border)', borderRadius: '10px', color: 'white', padding: '0 16px' }} placeholder="eu-central-1" />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 900, color: 'var(--text-secondary)', marginBottom: '8px' }}>ACCESS KEY ID</label>
                                    <input type="password" value={sesConfig.accessKey} onChange={e => setSesConfig({...sesConfig, accessKey: e.target.value})} style={{ width: '100%', height: '48px', background: 'var(--bg-sidebar)', border: '1px solid var(--glass-border)', borderRadius: '10px', color: 'white', padding: '0 16px' }} placeholder="AKIA..." />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 900, color: 'var(--text-secondary)', marginBottom: '8px' }}>SECRET ACCESS KEY</label>
                                    <input type="password" value={sesConfig.secretKey} onChange={e => setSesConfig({...sesConfig, secretKey: e.target.value})} style={{ width: '100%', height: '48px', background: 'var(--bg-sidebar)', border: '1px solid var(--glass-border)', borderRadius: '10px', color: 'white', padding: '0 16px' }} />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 900, color: 'var(--text-secondary)', marginBottom: '8px' }}>SENDER EMAIL (VERIFIED)</label>
                                    <input value={sesConfig.sender} onChange={e => setSesConfig({...sesConfig, sender: e.target.value})} style={{ width: '100%', height: '48px', background: 'var(--bg-sidebar)', border: '1px solid var(--glass-border)', borderRadius: '10px', color: 'white', padding: '0 16px' }} />
                                </div>
                            </div>

                            <div style={{ marginTop: '32px', display: 'flex', gap: '12px' }}>
                                <button onClick={() => setIsSesModalOpen(false)} style={{ flex: 1, height: '52px', background: 'rgba(255,255,255,0.05)', border: 'none', borderRadius: '12px', color: 'white', fontWeight: 900, cursor: 'pointer' }}>ODUSTANI</button>
                                <button onClick={() => setIsSesModalOpen(false)} style={{ flex: 1, height: '52px', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', border: 'none', borderRadius: '12px', color: 'white', fontWeight: 950, cursor: 'pointer' }}>SAČUVAJ I AKTIVIRAJ</button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* FLOATING AI CHATBOT - ACCESSIBLE EVERYWHERE */}
            <AnimatePresence>
                {isFloatingChatOpen && (
                    <motion.div 
                        initial={{ opacity: 0, y: 50, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 50, scale: 0.9 }}
                        style={{ 
                            position: 'fixed', 
                            bottom: '30px', 
                            right: '30px', 
                            width: '380px', 
                            height: '520px', 
                            background: 'rgba(15, 15, 20, 0.95)', 
                            backdropFilter: 'blur(20px)',
                            border: '1px solid rgba(0, 229, 255, 0.2)',
                            borderRadius: '24px',
                            display: 'flex',
                            flexDirection: 'column',
                            boxShadow: '0 30px 60px rgba(0,0,0,0.8), 0 0 40px rgba(0, 229, 255, 0.1)',
                            zIndex: 9999,
                            overflow: 'hidden'
                        }}
                    >
                        {/* Header */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', background: 'rgba(0, 229, 255, 0.05)', borderBottom: '1px solid rgba(0, 229, 255, 0.1)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <div style={{ width: '32px', height: '32px', borderRadius: '10px', background: 'var(--accent-cyan)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <Brain size={18} color="black" />
                                </div>
                                <div>
                                    <div style={{ fontSize: '13px', fontWeight: 950, color: 'white' }}>MARKETING AGENT</div>
                                    <div style={{ fontSize: '10px', color: 'var(--accent-cyan)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: 'var(--accent-cyan)' }}></div> ODMAH DOSTUPAN
                                    </div>
                                </div>
                            </div>
                            <button 
                                onClick={() => setIsFloatingChatOpen(false)}
                                style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '4px' }}
                            >
                                <Minus size={20} />
                            </button>
                        </div>

                        {/* Messages */}
                        <div className="no-scrollbar" style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            {chatMessages.map((msg, idx) => (
                                <div key={idx} style={{ 
                                    alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                                    maxWidth: '85%',
                                    padding: '12px 16px',
                                    borderRadius: msg.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                                    background: msg.role === 'user' ? 'var(--accent-cyan)' : 'rgba(255,255,255,0.05)',
                                    color: msg.role === 'user' ? 'black' : 'white',
                                    fontSize: '12px',
                                    lineHeight: 1.5,
                                    border: msg.role === 'agent' ? '1px solid rgba(255,255,255,0.05)' : 'none'
                                }}>
                                    <div dangerouslySetInnerHTML={{ __html: msg.content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br/>') }} />
                                </div>
                            ))}
                            {isAgentProcessing && (
                                <div style={{ alignSelf: 'flex-start', padding: '12px 16px', background: 'rgba(255,255,255,0.05)', borderRadius: '16px 16px 16px 4px', display: 'flex', gap: '4px' }}>
                                    <div className="animate-bounce" style={{ width: '6px', height: '6px', background: 'var(--accent-cyan)', borderRadius: '50%' }}></div>
                                    <div className="animate-bounce" style={{ width: '6px', height: '6px', background: 'var(--accent-cyan)', borderRadius: '50%', animationDelay: '0.2s' }}></div>
                                    <div className="animate-bounce" style={{ width: '6px', height: '6px', background: 'var(--accent-cyan)', borderRadius: '50%', animationDelay: '0.4s' }}></div>
                                </div>
                            )}
                        </div>

                        {/* Input Area */}
                        <div style={{ padding: '20px', background: 'rgba(0,0,0,0.3)', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                            <div style={{ position: 'relative' }}>
                                <textarea 
                                    value={newsletterAgentInput}
                                    onChange={e => setNewsletterAgentInput(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleAiAgentNewsletter())}
                                    placeholder="Napišite nešto..."
                                    style={{ 
                                        width: '100%', 
                                        height: '70px', 
                                        background: 'rgba(255,255,255,0.03)', 
                                        border: '1px solid var(--glass-border)', 
                                        borderRadius: '16px', 
                                        padding: '12px 40px 12px 12px', 
                                        color: 'white', 
                                        fontSize: '13px',
                                        resize: 'none',
                                        outline: 'none'
                                    }}
                                />
                                <button 
                                    onClick={handleAiAgentNewsletter}
                                    style={{ 
                                        position: 'absolute', 
                                        bottom: '10px', 
                                        right: '10px', 
                                        background: 'var(--accent-cyan)', 
                                        border: 'none', 
                                        borderRadius: '8px', 
                                        width: '28px', 
                                        height: '28px', 
                                        display: 'flex', 
                                        alignItems: 'center', 
                                        justifyContent: 'center', 
                                        cursor: 'pointer',
                                        color: 'black'
                                    }}
                                >
                                    <Zap size={14} fill="black" />
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {!isFloatingChatOpen && (
                <button 
                    onClick={() => setIsFloatingChatOpen(true)}
                    style={{ position: 'fixed', bottom: '30px', right: '30px', width: '64px', height: '64px', borderRadius: '50%', background: 'var(--accent-cyan)', border: 'none', color: 'black', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 10px 30px rgba(0, 229, 255, 0.4)', cursor: 'pointer', zIndex: 9999 }}
                >
                    <MessageSquare size={28} />
                </button>
            )}
        </div>
    );
}
