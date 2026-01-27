import { useIntelligenceStore, type MarketTrigger } from '../stores/intelligenceStore';

interface DestinationTwin {
    name: string;
    twins: string[];
    type: 'ski' | 'tropical' | 'city';
    priceRange: 'budget' | 'mid' | 'premium';
}

class SoftZoneService {
    private twinMap: Record<string, DestinationTwin> = {
        'bansko': { name: 'Bansko', twins: ['Jahorina', 'Borovec', 'Kopaonik'], type: 'ski', priceRange: 'budget' },
        'hurgada': { name: 'Hurgada', twins: ['Šarm el Šeik', 'Marsa Alam'], type: 'tropical', priceRange: 'budget' },
        'dubai': { name: 'Dubai', twins: ['Doha', 'Abu Dabi'], type: 'tropical', priceRange: 'premium' },
        'bec': { name: 'Beč', twins: ['Prag', 'Budimpešta'], type: 'city', priceRange: 'mid' }
    };

    // Simulate periodic scanning of external APIs
    public async scanEnvironment() {
        console.log("Meka Zona: Skeniranje realnog vremena i vesti...");

        // 1. Fetch Real Weather (Default: Belgrade)
        try {
            const weatherData = await this.fetchRealWeather('Belgrade');
            if (weatherData) {
                console.log(`[Meka Zona] Podaci o vremenu primljeni: ${weatherData.temp}°C`);
                this.processWeatherSignal(weatherData.temp, weatherData.city);
            } else {
                throw new Error("Prazan odgovor sa weather API");
            }
        } catch (e) {
            console.warn("[Meka Zona] Weather API nedostupan ili blokiran, koristim zimski fallback.");
            this.processWeatherSignal(4, 'Beograd'); // Zimski fallback: 4°C
        }

        // 2. Simulate Politics/News Check
        const mockRisk = 'caution';
        this.processPoliticalSignal(mockRisk, ['strike', 'airport delay']);

        // 3. Fetch Real News Sentiment
        try {
            const newsHeadline = await this.fetchRealNews();
            if (newsHeadline) {
                this.processEconomicNews(newsHeadline);
            }
        } catch (e) {
            console.warn("[Meka Zona] News API nedostupan, koristim interne izveštaje.");
            const mockHeadline = "Stabilizacija cena i fokus na rane bukinge";
            this.processEconomicNews(mockHeadline);
        }

        // 4. Simulate Economic/Search Trends
        const mockKeywords = ['last minute', 'rata', 'najjeftinije'];
        this.processMarketSignal(mockKeywords);

        // 5. Simulate Flight Timing (Late Arrival)
        this.processLogisticsSignal("23:15");
    }

    private async fetchRealWeather(city: string) {
        try {
            // Dodajemo timestamp da izbegnemo keširanje
            const response = await fetch(`https://wttr.in/${city}?format=j1&t=${Date.now()}`);
            if (!response.ok) return null;
            const data = await response.json();

            if (!data.current_condition || !data.current_condition[0]) return null;

            const current = data.current_condition[0];
            return {
                temp: parseInt(current.temp_C),
                city: city === 'Belgrade' ? 'Beograd' : city
            };
        } catch (e) {
            console.error("Fetch error:", e);
            return null;
        }
    }

    private async fetchRealNews() {
        // Fetching latest business/economy news (Using a proxy or demo endpoint)
        try {
            const response = await fetch('https://ok.surf/api/v1/cors/news-feed');
            if (!response.ok) return null;
            const data = await response.json();
            const businessNews = data.Business || data.World || [];
            if (businessNews.length > 0) {
                return businessNews[0].title;
            }
        } catch (e) {
            return null;
        }
        return null;
    }

    public recordInteraction(destination: string, dates?: { checkIn: string; checkOut: string }) {
        const store = useIntelligenceStore.getState();
        store.trackDestinationView(destination);

        // 1. Categorize intent based on destination
        const intent = this.categorizeDestination(destination);
        store.setUserIntent(intent);

        // 2. Check conditions at the target destination (Consultative AI)
        this.checkDestinationQuality(destination, dates);

        this.processBehavioralSignal(destination);
    }

    private async checkDestinationQuality(destination: string, dates?: { checkIn: string; checkOut: string }) {
        const store = useIntelligenceStore.getState();
        const d = destination.toLowerCase();

        // Format dates for context
        const dateStr = dates ? ` (za termin ${dates.checkIn} - ${dates.checkOut})` : '';

        // Simulation: If it's Bansko, simulate rain/poor snow
        if (d.includes('bansko')) {
            const twin = this.twinMap['bansko'];
            if (twin) {
                const trigger: MarketTrigger = {
                    id: 'pivot_reflex',
                    type: 'weather',
                    severity: 'medium',
                    label: 'Preporuka Savetnika',
                    description: `ZAŠTO IZBEĆI: U Banskom je trenutno loša prognoza${dateStr}. Kiša i visoka vlažnost dovode do topljenja snega. Rizik od "kašastog" snega je visok.`,
                    action: `Sugerisano preusmerenje na ${twin.twins[0]} (Tamo je hladnije, stabilan sneg i slična cena).`,
                    isActive: true
                };
                store.addTrigger(trigger);
            }
        } else {
            store.removeTrigger('pivot_reflex');
        }
    }

    private categorizeDestination(dest: string): 'ski' | 'tropical' | 'city' | 'unknown' {
        const d = dest.toLowerCase();
        if (d.includes('bansko') || d.includes('borovec') || d.includes('kopaonik') || d.includes('jahorina') || d.includes('alpi') || d.includes('ski')) {
            return 'ski';
        }
        if (d.includes('egipat') || d.includes('dubai') || d.includes('hurgada') || d.includes('maldivi') || d.includes('tropical') || d.includes('more')) {
            return 'tropical';
        }
        if (d.includes('bec') || d.includes('rim') || d.includes('pariz') || d.includes('budimpesta')) {
            return 'city';
        }
        return 'unknown';
    }

    private processWeatherSignal(temp: number, location: string) {
        const store = useIntelligenceStore.getState();
        const isHeatWave = temp > 38;
        const isColdWave = temp < 10;
        const isExtreme = isHeatWave || isColdWave;

        store.updateWeather({
            temp,
            location,
            condition: isHeatWave ? 'Ekstremna Vrućina' : (isColdWave ? 'Ekstremna Hladnoća' : 'Umereno'),
            isExtreme
        });

        if (isHeatWave) {
            const heatTrigger: MarketTrigger = {
                id: 'heat_wave_reflex',
                type: 'weather',
                severity: 'high',
                label: 'Strategija Osveženja',
                description: `Detektovana ekstremna vrućina u ${location} (${temp}°C).`,
                action: 'Promocija planinskih i severnih destinacija.',
                isActive: true
            };
            store.addTrigger(heatTrigger);
        } else if (isColdWave) {
            const intent = store.behaviorContext.userIntent;

            if (intent === 'ski') {
                // If user wants ski, emphasize the cold as a GOOD thing (Snow condition)
                const skiTrigger: MarketTrigger = {
                    id: 'cold_wave_reflex',
                    type: 'weather',
                    severity: 'low',
                    label: 'Vrhunski Snežni Uslovi',
                    description: `Idealna temperatura za sneg u ${location} (${temp}°C).`,
                    action: 'Prikaz stanja na stazama i "Ski-pass" pogodnosti.',
                    isActive: true
                };
                store.addTrigger(skiTrigger);
            } else {
                // Default: User might want escape
                const coldTrigger: MarketTrigger = {
                    id: 'cold_wave_reflex',
                    type: 'weather',
                    severity: 'medium',
                    label: 'Beg u Toplije Krajeve',
                    description: `Detektovana niska temperatura u ${location} (${temp}°C).`,
                    action: 'Prioritizacija Egipta, Dubaija i tropskih destinacija.',
                    isActive: true
                };
                store.addTrigger(coldTrigger);
            }
        } else {
            store.removeTrigger('heat_wave_reflex');
            store.removeTrigger('cold_wave_reflex');
        }
    }

    private processPoliticalSignal(risk: 'safe' | 'caution' | 'high_risk', keywords: string[]) {
        const store = useIntelligenceStore.getState();
        store.updateSentiment({ riskLevel: risk });

        if (risk !== 'safe') {
            const stabilityTrigger: MarketTrigger = {
                id: 'stability_reflex',
                type: 'politics',
                severity: risk === 'high_risk' ? 'high' : 'medium',
                label: 'Algoritam Sigurne Luke',
                description: 'Detektovana regionalna nestabilnost ili smetnje u putovanju.',
                action: 'Isticanje "Flexi-cancel" opcija i stabilnih EU destinacija.',
                isActive: true
            };
            store.addTrigger(stabilityTrigger);
        }
    }

    private processEconomicNews(headline: string) {
        const store = useIntelligenceStore.getState();
        const lowerHeadline = headline.toLowerCase();

        // Update trending keywords with news title fragment
        const newsTitleSnippet = headline.split(' ').slice(0, 3).join(' ');
        const currentKeywords = store.marketSentiment.trendingKeywords || [];

        if (!currentKeywords.includes(newsTitleSnippet)) {
            const updatedKeywords = [newsTitleSnippet, ...currentKeywords.filter(k => k !== newsTitleSnippet)].slice(0, 5);
            store.updateSentiment({ trendingKeywords: updatedKeywords });
        }

        if (lowerHeadline.includes('inflation') || lowerHeadline.includes('high') || lowerHeadline.includes('installment') || lowerHeadline.includes('rate') || lowerHeadline.includes('price')) {
            store.updateSentiment({ economicTone: 'bearish' });

            const financeTrigger: MarketTrigger = {
                id: 'economy_reflex',
                type: 'economy',
                severity: 'medium',
                label: 'Režim Finansijske Podrške',
                description: 'Detektovan ekonomski pritisak iz svetskih vesti.',
                action: 'Isticanje plaćanja na rate i "Rezerviši odmah, plati kasnije" opcija.',
                isActive: true
            };
            store.addTrigger(financeTrigger);
        }
    }

    private processMarketSignal(keywords: string[]) {
        const store = useIntelligenceStore.getState();
        const currentKeywords = store.marketSentiment.trendingKeywords || [];

        // Merge keywords instead of overwriting
        const merged = Array.from(new Set([...currentKeywords, ...keywords])).slice(0, 6);
        store.updateSentiment({ trendingKeywords: merged });

        if (keywords.includes('payment plan') || keywords.includes('rata') || keywords.includes('najjeftinije')) {
            const economicTrigger: MarketTrigger = {
                id: 'economy_reflex',
                type: 'economy',
                severity: 'medium',
                label: 'Režim Finansijske Podrške',
                description: 'Korisnici traže budžetsku sigurnost.',
                action: 'Dinamički prelaz na poruke o uštedi i pogodnostima plaćanja.',
                isActive: true
            };
            store.addTrigger(economicTrigger);
        }
    }

    private processBehavioralSignal(destination: string) {
        const store = useIntelligenceStore.getState();
        const views = store.behaviorContext.viewedDestinations[destination] || 0;

        if (views >= 2) {
            const priceGuard: MarketTrigger = {
                id: 'price_guard_reflex',
                type: 'economy',
                severity: 'medium',
                label: 'Zaštita Cene',
                description: `Detektovano visoko interesovanje za ${destination}. Kupac okleva.`,
                action: 'Aktivacija bedža Zaštita Cene (48h) i zaključavanje ponude.',
                isActive: true
            };
            store.addTrigger(priceGuard);
        }
    }

    private processLogisticsSignal(arrivalTime: string) {
        const store = useIntelligenceStore.getState();
        const [hours] = arrivalTime.split(':').map(Number);

        if (hours >= 22 || hours <= 5) {
            const logisticsTrigger: MarketTrigger = {
                id: 'guardian_angel_reflex',
                type: 'weather',
                severity: 'medium',
                label: 'Anđeo Čuvar',
                description: `Detektovan kasni dolazak (${arrivalTime}). Putnik može biti umoran.`,
                action: 'Aktivacija privatnog transfera i "Late Checkout" opcije.',
                isActive: true
            };
            store.addTrigger(logisticsTrigger);
        }
    }
}

export const softZoneService = new SoftZoneService();
