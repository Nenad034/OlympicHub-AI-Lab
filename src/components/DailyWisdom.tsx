import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Quote, Sparkles, Sword, Plus, X } from 'lucide-react';
import { GeometricBrain } from './icons/GeometricBrain';
import { useThemeStore } from '../stores';

interface Wisdom {
    text: string;
    author: string;
    role: string;
}

const wisdoms: Wisdom[] = [
    {
        text: "Nema ništa izvan tebe što ti može ikada dopustiti da postaneš bolji, jači, bogatiji, brži ili pametniji. Sve je unutra. Sve postoji. Ne traži ništa izvan sebe.",
        author: "Miyamoto Musashi",
        role: "Legendardni Mačevalac & Strateg"
    },
    {
        text: "Sreća tvog života zavisi od kvaliteta tvojih misli.",
        author: "Marko Aurelije",
        role: "Rimski Imperator & Stoički Filozof"
    },
    {
        text: "Nije da imamo malo vremena, već da ga mnogo gubimo. Dok odlažemo život, on prolazi.",
        author: "Seneka",
        role: "Stoički Filozof & Dramaturg"
    },
    {
        text: "Ako želite da saznate tajne univerzuma, razmišljajte u terminima energije, frekvencije i vibracije.",
        author: "Nikola Tesla",
        role: "Vizionar, Inženjer & Pronalazač"
    },
    {
        text: "Vreme je ograničeno, zato ga ne trošite živeći tuđi život. Nemojte dopustiti da buka tuđih mišljenja utiša vaš unutrašnji glas.",
        author: "Steve Jobs",
        role: "Inovator & Vizionar"
    },
    {
        text: "Sve što čujemo je mišljenje, a ne činjenica. Sve što vidimo je perspektiva, a ne istina.",
        author: "Marko Aurelije",
        role: "Autor 'Samom Sebi'"
    },
    {
        text: "Najbolja osveta je ne biti poput onoga ko je naneo nepravdu.",
        author: "Marko Aurelije",
        role: "Rimski Car"
    },
    {
        text: "Onaj ko je pobedio sebe je moćniji od onoga ko je pobedio hiljadu ljudi u bici.",
        author: "Buda",
        role: "Duhovni Učitelj"
    },
    {
        text: "Mašta je važnija od znanja. Znanje je ograničeno, dok mašta obuhvata ceo svet.",
        author: "Albert Einstein",
        role: "Teorijski Fizičar"
    },
    {
        text: "Jednom kada upoznaš Put, videćeš ga u svim stvarima.",
        author: "Miyamoto Musashi",
        role: "Autor 'Knjige Pet Prstenova'"
    },
    {
        text: "Priroda ne žuri, a ipak je sve postignuto.",
        author: "Lao Ce",
        role: "Osnivač Taoizma"
    },
    {
        text: "Budite promena koju želite da vidite u svetu.",
        author: "Mahatma Gandhi",
        role: "Politički i Duhovni Vođa"
    },
    {
        text: "Nije važno koliko sporo ideš, sve dok ne staješ.",
        author: "Konfučije",
        role: "Filozof & Reformator"
    },
    {
        text: "Možeš napustiti svoje telo, ali nikada nemoj napustiti svoju čast.",
        author: "Miyamoto Musashi",
        role: "Samuraj Strateg"
    },
    {
        text: "Ne možete naučiti dete da vozi bicikl na seminaru. Prodaja se uči kroz praksu, ne samo kroz teoriju.",
        author: "David Sandler",
        role: "Osnivač Sandler Prodajnog Sistema"
    },
    {
        text: "Ne prosipajte svoje bombone u lobiju. Sačuvajte najbolja rešenja za trenutak kada zaista razumete problem klijenta.",
        author: "David Sandler",
        role: "Sandler Rule #13"
    },
    {
        text: "Ako su vam usta otvorena, ne učite. Slušanje je moćnije oružje od govora u prodaji.",
        author: "David Sandler",
        role: "Sandler Rule #14"
    },
    {
        text: "Bez uzajamne mistifikacije. Obe strane moraju tačno znati šta se dešava u svakom trenutku procesa.",
        author: "David Sandler",
        role: "Sandler Rule #3"
    },
    {
        text: "Ostavite svoj ego ispred vrata. Vaš uspeh zavisi od fokusa na klijenta, a ne na sopstveni ponos.",
        author: "David Sandler",
        role: "Sandler Rule #1"
    },
    {
        text: "Ne odgovarajte na nepostavljena pitanja. Svaki put kada to uradite, rizikujete da izgubite kontrolu nad razgovorom.",
        author: "David Sandler",
        role: "Prodajni Strateg"
    },
    {
        text: "Zatvorite prodaju ili zatvorite dosije. Ne gubite vreme na 'možda' - tražite jasno 'da' ili 'ne'.",
        author: "David Sandler",
        role: "Sandler Rule #10"
    },
    {
        text: "Prodavac ne sme da bude 'potreban' klijentu. Morate biti ravnopravan partner u rešavanju problema.",
        author: "David Sandler",
        role: "Sandler Rule #2"
    },
    {
        text: "Nikada ne donosite odluku umesto klijenta. Vaš posao je da ih dovedete do trenutka gde oni sami odluče.",
        author: "David Sandler",
        role: "Sandler Rule #38"
    },
    {
        text: "Novac raste na drveću... upornosti. Doslednost u primeni sistema uvek donosi plodove.",
        author: "David Sandler",
        role: "Osnivač Sandler Traininga"
    }
];

const DailyWisdom: React.FC = () => {
    const [showAll, setShowAll] = useState(false);
    const { theme } = useThemeStore();
    const isActuallyLight = theme === 'light' || (theme as string) === 'standard' || (theme as string) === 'white';

    const wisdomLogic = useMemo(() => {
        const now = new Date();
        const startOfYear = new Date(now.getFullYear(), 0, 0);
        const diff = (now as any) - (startOfYear as any);
        const oneDay = 1000 * 60 * 60 * 24;
        const dayOfYear = Math.floor(diff / oneDay);

        const current = wisdoms[dayOfYear % wisdoms.length];
        const next7 = [];
        for (let i = 1; i <= 7; i++) {
            next7.push(wisdoms[(dayOfYear + i) % wisdoms.length]);
        }

        return { current, next7 };
    }, []);

    const { current: todayWisdom, next7: upcomingWisdoms } = wisdomLogic;

    const isMobileApp = document.body.classList.contains('mobile-view');
    if (isMobileApp) return null;

    return (
        <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '0 20px',
                height: '100%',
                cursor: 'default',
                userSelect: 'none',
                maxWidth: '960px',
                overflow: 'hidden'
            }}
        >
            <div style={{
                background: 'var(--accent-glow)',
                width: '18px',
                height: '18px',
                minWidth: '18px',
                borderRadius: '5px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
            }}>
                <Sparkles size={9} color="var(--accent)" />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
                <span style={{
                    fontSize: '9px',
                    fontWeight: '900',
                    letterSpacing: '1px',
                    textTransform: 'uppercase',
                    color: 'var(--accent)',
                    whiteSpace: 'nowrap',
                    opacity: 0.8
                }}>
                    Misao Dana:
                </span>

                <span style={{
                    fontSize: '11px',
                    fontWeight: '500',
                    color: 'var(--text-primary)',
                    fontFamily: "'Outfit', sans-serif",
                    whiteSpace: 'normal',
                    lineHeight: '1.2',
                    maxHeight: '32px',
                    overflow: 'hidden',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    opacity: 0.9,
                    flex: 1
                }}>
                    "{todayWisdom.text}"
                </span>

                <span style={{
                    fontSize: '10px',
                    fontWeight: '800',
                    color: 'var(--accent)',
                    whiteSpace: 'nowrap',
                    paddingLeft: '6px',
                    paddingRight: '10px',
                    borderLeft: '1px solid rgba(255,255,255,0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                }}>
                    {todayWisdom.author}
                </span>

                <button 
                    onClick={() => setShowAll(!showAll)}
                    style={{
                        background: isActuallyLight ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.05)',
                        border: isActuallyLight ? '1px solid rgba(0,0,0,0.1)' : '1px solid rgba(255,255,255,0.1)',
                        width: '18px',
                        height: '18px',
                        borderRadius: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        color: isActuallyLight ? '#0ea5e9' : 'var(--accent)',
                        transition: 'all 0.2s'
                    }}
                >
                    <Plus size={10} />
                </button>
            </div>

            <AnimatePresence>
                {showAll && (
                    <>
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowAll(false)}
                            style={{
                                position: 'fixed',
                                inset: 0,
                                background: 'rgba(0,0,0,0.4)',
                                backdropFilter: 'blur(4px)',
                                zIndex: 2000
                            }}
                        />
                        <motion.div 
                            initial={{ opacity: 0, y: 100 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 100 }}
                            style={{
                                position: 'fixed',
                                bottom: '60px',
                                right: '40px',
                                width: '400px',
                                background: isActuallyLight ? '#ffffff' : 'var(--navy-medium)',
                                border: isActuallyLight ? '1px solid #cbd5e1' : '1px solid var(--navy-accent)',
                                borderRadius: '0',
                                padding: '24px',
                                zIndex: 2001,
                                boxShadow: isActuallyLight ? '0 10px 30px rgba(0,0,0,0.1)' : '0 20px 50px rgba(0,0,0,0.5)',
                            }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                                <h4 style={{ margin: 0, fontSize: '13px', fontWeight: 900, color: isActuallyLight ? '#0ea5e9' : 'var(--accent)', letterSpacing: '1px' }}>NAREDNE MUDROSTI</h4>
                                <X size={16} onClick={() => setShowAll(false)} style={{ cursor: 'pointer', opacity: 0.5, color: isActuallyLight ? '#1e293b' : '#fff' }} />
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxHeight: '500px', overflowY: 'auto' }}>
                                {upcomingWisdoms.map((w, i) => (
                                    <div key={i} style={{ borderBottom: isActuallyLight ? '1px solid #f1f5f9' : '1px solid rgba(255,255,255,0.05)', paddingBottom: '12px' }}>
                                        <p style={{ margin: '0 0 6px', fontSize: '12px', fontWeight: 500, fontStyle: 'italic', opacity: 0.9, color: isActuallyLight ? '#1e293b' : '#fff' }}>"{w.text}"</p>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <span style={{ fontSize: '10px', fontWeight: 800, color: isActuallyLight ? '#0ea5e9' : 'var(--accent)' }}>{w.author}</span>
                                            <span style={{ fontSize: '9px', opacity: 0.5, color: isActuallyLight ? '#64748b' : '#fff' }}>Dan {i + 1}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

export default DailyWisdom;
