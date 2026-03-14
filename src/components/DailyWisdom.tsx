import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Quote, Sparkles, Sword } from 'lucide-react';
import { GeometricBrain } from './icons/GeometricBrain';

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
    }
];

const DailyWisdom: React.FC = () => {
    const todayWisdom = useMemo(() => {
        const now = new Date();
        const startOfYear = new Date(now.getFullYear(), 0, 0);
        const diff = (now as any) - (startOfYear as any);
        const oneDay = 1000 * 60 * 60 * 24;
        const dayOfYear = Math.floor(diff / oneDay);

        return wisdoms[dayOfYear % wisdoms.length];
    }, []);

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
                    borderLeft: '1px solid rgba(255,255,255,0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                }}>
                    {todayWisdom.author}
                </span>
            </div>
        </motion.div>
    );
};

export default DailyWisdom;
