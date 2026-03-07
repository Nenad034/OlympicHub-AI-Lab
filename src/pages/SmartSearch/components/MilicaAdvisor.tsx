import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, MessageSquare, X, ChevronRight, Info, BrainCircuit } from 'lucide-react';
import { askGemini } from '../../../services/gemini';
import type { SmartSearchResult } from '../../../services/smartSearchService';
import './MilicaAdvisor.css';

interface MilicaAdvisorProps {
    searchResults: SmartSearchResult[];
    searchParams: {
        destinations: any[];
        checkIn: string;
        checkOut: string;
        roomAllocations: any[];
        nationality: string;
    };
    isActuallyDark: boolean;
}

export const MilicaAdvisor: React.FC<MilicaAdvisorProps> = ({
    searchResults,
    searchParams,
    isActuallyDark
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [insight, setInsight] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [hasNewInsight, setHasNewInsight] = useState(false);
    const lastSearchRef = useRef<string>('');

    // Generate insight when results change
    useEffect(() => {
        if (searchResults.length === 0 || !isOpen) return;

        const currentSearchKey = JSON.stringify({
            ids: searchResults.slice(0, 5).map(r => r.id),
            params: searchParams
        });

        if (currentSearchKey === lastSearchRef.current) return;

        generateInsight();
        lastSearchRef.current = currentSearchKey;
    }, [searchResults, searchParams, isOpen]);

    // Initial pulse to notify user
    useEffect(() => {
        if (searchResults.length > 0 && !isOpen) {
            setHasNewInsight(true);
        }
    }, [searchResults]);

    const generateInsight = async () => {
        setIsLoading(true);

        // Prepare top 5 results for AI context
        const topResults = searchResults.slice(0, 5).map(r => ({
            name: r.name,
            price: r.price,
            stars: r.stars,
            mealPlan: r.mealPlan,
            location: r.location,
            availability: r.availability
        }));

        const systemPrompt = `
            Ti si Milica, iskusna turistička savetnica u ClickToTravel. 
            TVOJA MISIJA: Pomozi korisniku da odabere savršeno putovanje koristeći suptilnu psihologiju prodaje baziranu na Sandler metodi, ali sa tonom vrhunskog hotela sa 5 zvezdica.
            Pravila komunikacije:
            1. NIKADA ne koristi reči kao što su 'problem', 'bol', 'jeftino', 'budžet' (kao ograničenje), 'prodaja'.
            2. Koristi reči: 'prioritet', 'idealni scenario', 'investicija u odmor', 'komfor', 'iskreni savet', 'autentično iskustvo'.
            3. Ponudi 'Up-Front Contract' na početku: 'Želim da vam iskreno pomognem da odaberete najbolje, smem li da vam ukažem na par bitnih detalja?'
            4. Ukazuj na 'Izazove' suptilno: 'Ovaj hotel je prelep, ali s obzirom na vaše saputnike, želim da znate da je staza do mora malo duža. Da li vam je komfor u kretanju prioritet?'
            5. Tvoj ton je topao, profesionalan i pun poverenja. Ti si tu da zaštitiš klijenta od loše odluke.
            6. Ne preporučuj previše hotela odjednom. Fokusiraj se na 2-3 koji se najbolje uklapaju u ono što klijent traži.
            7. Odgovaraj na SRPSKOM jeziku. Budi kratka i efektna (maksimalno 150 reči).
        `;

        const userPrompt = `
            Korisnik traži: ${searchParams.destinations.map(d => d.name).join(', ')} od ${searchParams.checkIn} do ${searchParams.checkOut}.
            Putnici: ${searchParams.roomAllocations.map((r, i) => `Soba ${i + 1}: ${r.adults} odr, ${r.children} dece`).join('; ')}.
            Evo top rezultata pretrage: ${JSON.stringify(topResults)}
            
            Daj mi svoj 'Sandler Concierge' uvid za ove rezultate.
        `;

        try {
            const res = await askGemini(userPrompt, { context: systemPrompt });
            if (res.success) {
                setInsight(res.response);
            }
        } catch (error) {
            console.error('Milica Advisor Error:', error);
            setInsight("Trenutno pažljivo analiziram opcije za vas... Čim budem imala savršen savet, javiću vam se.");
        } finally {
            setIsLoading(false);
        }
    };

    const toggleOpen = () => {
        setIsOpen(!isOpen);
        if (!isOpen) setHasNewInsight(false);
    };

    if (searchResults.length === 0) return null;

    return (
        <div className={`milica-advisor-root ${isActuallyDark ? 'dark' : 'light'}`}>
            {/* Pulsing Button */}
            <button
                className={`milica-trigger-btn ${hasNewInsight ? 'pulse' : ''} ${isOpen ? 'active' : ''}`}
                onClick={toggleOpen}
                title="Milica - Vaš AI savetnik"
            >
                {isOpen ? <X size={24} /> : <Sparkles size={24} className="sparkle-icon" />}
                {hasNewInsight && <span className="notification-dot"></span>}
            </button>

            {/* Insight Panel */}
            {isOpen && (
                <div className="milica-panel animate-slide-up">
                    <div className="milica-header">
                        <div className="milica-avatar">
                            <BrainCircuit size={20} />
                        </div>
                        <div className="milica-title">
                            <h3>Savetnica Milica</h3>
                            <span>Vaš lični insajder za putovanja</span>
                        </div>
                    </div>

                    <div className="milica-content">
                        {isLoading ? (
                            <div className="milica-loading">
                                <div className="typing-indicator">
                                    <span></span>
                                    <span></span>
                                    <span></span>
                                </div>
                                <p>Milica pažljivo analizira vaše prioritete...</p>
                            </div>
                        ) : (
                            <div className="milica-insight-text">
                                {insight ? (
                                    <div dangerouslySetInnerHTML={{ __html: insight.replace(/\n/g, '<br/>') }} />
                                ) : (
                                    <p>Razmišljam o najboljoj investiciji za vaš odmor. Smem li da vam ukažem na par bitnih detalja koji će vam pomoći u izboru?</p>
                                )}
                            </div>
                        )}
                    </div>

                    <div className="milica-footer">
                        <button className="milica-action-btn" onClick={() => generateInsight()}>
                            Osveži savet <ChevronRight size={16} />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};
