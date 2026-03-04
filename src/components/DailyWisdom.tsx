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
        <div className="daily-wisdom-container" style={{
            width: '100%',
            padding: '40px 20px',
            marginTop: '20px'
        }}>
            <div style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="wisdom-card"
                    style={{
                        pointerEvents: 'auto',
                        width: 'calc(100% - 60px)',
                        maxWidth: '1400px',
                        background: 'rgba(255, 255, 255, 0.05)',
                        backdropFilter: 'blur(15px)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: '14px',
                        padding: '10px 30px',
                        boxShadow: '0 10px 30px rgba(142, 36, 172, 0.15), 0 0 0 1px rgba(255, 255, 255, 0.05)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '20px',
                        minHeight: '48px',
                        textAlign: 'center',
                        borderBottom: '1.5px solid #8e24ac' // Matching the purple in screenshot
                    }}
                >
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        flexWrap: 'wrap',
                        justifyContent: 'center'
                    }}>
                        <div style={{
                            background: 'var(--accent-glow)',
                            width: '24px',
                            height: '24px',
                            minWidth: '24px',
                            borderRadius: '6px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}>
                            <Sparkles size={12} color="var(--accent)" />
                        </div>

                        <span style={{
                            fontSize: '10px',
                            fontWeight: '800',
                            letterSpacing: '1px',
                            textTransform: 'uppercase',
                            color: 'var(--accent)',
                            opacity: 0.9,
                            whiteSpace: 'nowrap'
                        }}>
                            Misao Dana:
                        </span>

                        <p style={{
                            fontSize: '14px',
                            fontWeight: '500',
                            color: 'var(--text-primary)',
                            fontFamily: "'Outfit', sans-serif",
                            margin: 0,
                            lineHeight: '1.4'
                        }}>
                            "{todayWisdom.text}"
                        </p>

                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            opacity: 0.8,
                            paddingLeft: '10px',
                            borderLeft: '1px solid rgba(255,255,255,0.1)'
                        }}>
                            <span style={{ fontSize: '12px', fontWeight: '800', color: 'var(--accent)', whiteSpace: 'nowrap' }}>
                                {todayWisdom.author}
                            </span>
                            <span style={{ fontSize: '9px', color: 'var(--text-secondary)', fontWeight: 500, whiteSpace: 'nowrap' }}>
                                — {todayWisdom.role}
                            </span>
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default DailyWisdom;
