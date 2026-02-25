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
        <div className="daily-wisdom-container">
            <div style={{ display: 'flex', justifyContent: 'center', width: '100%', marginTop: '40px', marginBottom: '40px' }}>
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    whileHover={{ y: -5 }}
                    className="wisdom-card"
                    style={{
                        width: '100%',
                        maxWidth: '900px',
                        background: 'rgba(255, 255, 255, 0.03)',
                        backdropFilter: 'blur(10px)',
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                        borderRadius: '24px',
                        padding: '30px 40px',
                        position: 'relative',
                        overflow: 'hidden',
                        boxShadow: '0 20px 50px rgba(0,0,0,0.2)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '20px'
                    }}
                >
                    {/* Background quote mark */}
                    <div style={{ position: 'absolute', top: '10px', right: '20px', opacity: 0.05, color: 'var(--accent)' }}>
                        <Quote size={120} />
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{
                                background: 'var(--accent-glow)',
                                width: '32px',
                                height: '32px',
                                borderRadius: '10px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}>
                                <Sparkles size={16} color="var(--accent)" />
                            </div>
                            <span style={{
                                fontSize: '12px',
                                fontWeight: '800',
                                letterSpacing: '2px',
                                textTransform: 'uppercase',
                                color: 'var(--accent)',
                                opacity: 0.8
                            }}>
                                Misao Dana
                            </span>
                        </div>
                        <div style={{
                            fontSize: '10px',
                            color: 'var(--text-secondary)',
                            fontWeight: 700,
                            opacity: 0.6
                        }}>
                            {new Date().toLocaleDateString('sr-RS', { day: 'numeric', month: 'long', year: 'numeric' })}
                        </div>
                    </div>

                    <div style={{ position: 'relative' }}>
                        <p style={{
                            fontSize: '20px',
                            fontWeight: '500',
                            lineHeight: '1.6',
                            fontStyle: 'italic',
                            color: 'var(--text-primary)',
                            textAlign: 'center',
                            fontFamily: "'Outfit', sans-serif",
                            margin: '10px 0'
                        }}>
                            "{todayWisdom.text}"
                        </p>
                    </div>

                    <div style={{
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        gap: '12px',
                        borderTop: '1px solid rgba(255,255,255,0.05)',
                        paddingTop: '20px'
                    }}>
                        <div style={{
                            width: '36px',
                            height: '36px',
                            borderRadius: '12px',
                            background: 'rgba(255,255,255,0.03)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            border: '1px solid rgba(255,255,255,0.05)'
                        }}>
                            {todayWisdom.author.includes('Musashi') ? <Sword size={18} color="var(--accent)" /> : <GeometricBrain size={18} color="var(--accent)" />}
                        </div>
                        <div style={{ textAlign: 'left' }}>
                            <div style={{ fontSize: '15px', fontWeight: '800', color: 'var(--text-primary)' }}>{todayWisdom.author}</div>
                            <div style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 500 }}>{todayWisdom.role}</div>
                        </div>
                    </div>

                    {/* Accent line */}
                    <div style={{
                        position: 'absolute',
                        bottom: 0,
                        left: '50%',
                        transform: 'translateX(-50%)',
                        width: '60%',
                        height: '2px',
                        background: 'linear-gradient(90deg, transparent, var(--accent), transparent)',
                        opacity: 0.3
                    }}></div>
                </motion.div>
            </div>
        </div>
    );
};

export default DailyWisdom;
