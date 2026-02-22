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
        // Calculate index based on date to rotate daily
        const now = new Date();
        const startOfYear = new Date(now.getFullYear(), 0, 0);
        const diff = (now as any) - (startOfYear as any);
        const oneDay = 1000 * 60 * 60 * 24;
        const dayOfYear = Math.floor(diff / oneDay);

        return wisdoms[dayOfYear % wisdoms.length];
    }, []);

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="wisdom-card"
            style={{
                marginTop: '24px',
                background: 'var(--bg-card)',
                border: '1px solid var(--border)',
                borderRadius: '32px',
                padding: '40px',
                position: 'relative',
                overflow: 'hidden',
                boxShadow: '0 15px 45px rgba(0,0,0,0.15)'
            }}
        >
            {/* Background Decorations */}
            <div style={{ position: 'absolute', top: '-10%', right: '-5%', opacity: 0.03 }}>
                <Quote size={200} />
            </div>

            <div style={{ position: 'relative', zIndex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '30px' }}>
                    <div style={{
                        background: 'var(--gradient-blue)',
                        width: '40px',
                        height: '40px',
                        borderRadius: '14px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 8px 16px rgba(0, 92, 197, 0.3)'
                    }}>
                        <Sparkles size={20} color="#fff" />
                    </div>
                    <div>
                        <h3 style={{ fontSize: '18px', fontWeight: '800', letterSpacing: '1px', textTransform: 'uppercase' }}>Misao Dana</h3>
                        <p style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 600 }}>Unutrašnja snaga za Mastera</p>
                    </div>
                </div>

                <div style={{ marginBottom: '40px' }}>
                    <p style={{
                        fontSize: '24px',
                        fontWeight: '500',
                        lineHeight: '1.5',
                        fontStyle: 'italic',
                        color: 'var(--text-primary)',
                        fontFamily: "'Outfit', sans-serif"
                    }}>
                        "{todayWisdom.text}"
                    </p>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                        <div style={{
                            width: '50px',
                            height: '50px',
                            borderRadius: '16px',
                            background: 'var(--bg-sidebar)',
                            border: '1px solid var(--border)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}>
                            {todayWisdom.author.includes('Musashi') ? <Sword size={28} color="var(--accent)" /> : <GeometricBrain size={28} color="var(--accent)" />}
                        </div>
                        <div>
                            <div style={{ fontSize: '18px', fontWeight: '800', color: 'var(--accent)' }}>{todayWisdom.author}</div>
                            <div style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 500 }}>{todayWisdom.role}</div>
                        </div>
                    </div>

                    <div style={{
                        fontSize: '11px',
                        color: 'var(--text-secondary)',
                        background: 'var(--glass-bg)',
                        padding: '6px 14px',
                        borderRadius: '10px',
                        border: '1px solid var(--border)',
                        fontWeight: 600
                    }}>
                        {new Date().toLocaleDateString('sr-RS', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </div>
                </div>
            </div>

            {/* Accent light effect */}
            <div style={{
                position: 'absolute',
                bottom: 0,
                left: '10%',
                width: '40%',
                height: '1px',
                background: 'linear-gradient(90deg, transparent, var(--accent), transparent)',
                opacity: 0.5
            }}></div>
        </motion.div>
    );
};

export default DailyWisdom;
