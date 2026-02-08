/**
 * Competitor Scraper Service
 * Scrapes competitor prices using Playwright with anti-detection measures
 * Targets: TravelLand, BigBlue, FilipTravel
 */

import { supabase } from '../../supabaseClient';
import type {
    CompetitorPrice,
    CompetitorScrapingTarget,
    ScrapingSession,
    YieldApiResponse
} from './types';

// Note: Playwright will be installed separately
// npm install playwright playwright-extra puppeteer-extra-plugin-stealth

export class CompetitorScraperService {
    private readonly COMPETITORS: CompetitorScrapingTarget[] = [
        {
            name: 'travelland',
            url: 'https://www.travelland.rs/',
            enabled: true,
            selectors: {
                hotelName: '.hotel-name, .hotel-title, h2.title',
                price: '.price, .hotel-price, .total-price',
                availability: '.availability, .status',
                mealPlan: '.meal-plan, .board-type',
                roomType: '.room-type, .accommodation-type'
            }
        },
        {
            name: 'bigblue',
            url: 'https://bigblue.rs/sr',
            enabled: true,
            selectors: {
                hotelName: '.hotel-name, .property-name',
                price: '.price, .amount',
                availability: '.available, .status',
                mealPlan: '.meal, .board',
                roomType: '.room, .type'
            }
        },
        {
            name: 'filiptravel',
            url: 'https://www.filiptravel.rs/sr',
            enabled: true,
            selectors: {
                hotelName: '.hotel-title, h3',
                price: '.price-value, .cost',
                availability: '.availability',
                mealPlan: '.meal-plan',
                roomType: '.room-category'
            }
        }
    ];

    /**
     * Scrape prices from all enabled competitors
     * NOTE: This is a placeholder implementation
     * In production, you would use Playwright with stealth plugin
     */
    async scrapeAllCompetitors(
        destination: string,
        checkIn: string,
        checkOut: string,
        adults: number = 2,
        children: number = 0
    ): Promise<YieldApiResponse<ScrapingSession>> {
        try {
            console.log('🕷️ [Scraper] Starting scraping session...');

            // Create scraping session
            const session = await this.createScrapingSession('manual', [
                'travelland',
                'bigblue',
                'filiptravel'
            ]);

            const sessionId = session.id!;
            const scrapedPrices: CompetitorPrice[] = [];

            // Scrape each competitor
            for (const competitor of this.COMPETITORS) {
                if (!competitor.enabled) continue;

                try {
                    console.log(`🔍 [Scraper] Scraping ${competitor.name}...`);

                    const prices = await this.scrapeCompetitor(
                        competitor,
                        destination,
                        checkIn,
                        checkOut,
                        adults,
                        children,
                        sessionId
                    );

                    scrapedPrices.push(...prices);

                    // Random delay to avoid detection (1-3 seconds)
                    await this.randomDelay(1000, 3000);

                } catch (error) {
                    console.error(`❌ [Scraper] Error scraping ${competitor.name}:`, error);
                    await this.logScrapingError(sessionId, competitor.name, error);
                }
            }

            // Update session
            await this.completeScrapingSession(sessionId, scrapedPrices.length);

            console.log(`✅ [Scraper] Session complete. Scraped ${scrapedPrices.length} prices.`);

            return {
                success: true,
                data: session,
                message: `Scraped ${scrapedPrices.length} prices from ${this.COMPETITORS.length} competitors`
            };

        } catch (error) {
            console.error('❌ [Scraper] Fatal error:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }

    /**
     * Scrape a single competitor
     * PLACEHOLDER: In production, this would use Playwright
     */
    private async scrapeCompetitor(
        competitor: CompetitorScrapingTarget,
        destination: string,
        checkIn: string,
        checkOut: string,
        adults: number,
        children: number,
        sessionId: string
    ): Promise<CompetitorPrice[]> {
        // PLACEHOLDER IMPLEMENTATION
        // In production, you would:
        // 1. Launch Playwright browser with stealth plugin
        // 2. Navigate to competitor's search page
        // 3. Fill in search form (destination, dates, guests)
        // 4. Wait for results to load
        // 5. Extract hotel data using selectors
        // 6. Parse prices and save to database

        console.log(`⚠️ [Scraper] PLACEHOLDER: Would scrape ${competitor.name} for ${destination}`);

        // For now, return empty array
        // In production, this would return actual scraped data
        return [];

        /* PRODUCTION CODE EXAMPLE:
        
        import { chromium } from 'playwright-extra';
        import StealthPlugin from 'puppeteer-extra-plugin-stealth';
        
        // Add stealth plugin
        chromium.use(StealthPlugin());
        
        const browser = await chromium.launch({
            headless: true,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-accelerated-2d-canvas',
                '--disable-gpu'
            ]
        });
        
        const context = await browser.newContext({
            userAgent: this.getRandomUserAgent(),
            viewport: { width: 1920, height: 1080 },
            locale: 'sr-RS'
        });
        
        const page = await context.newPage();
        
        // Navigate to search page
        await page.goto(competitor.url);
        
        // Fill search form
        await page.fill('input[name="destination"]', destination);
        await page.fill('input[name="checkin"]', checkIn);
        await page.fill('input[name="checkout"]', checkOut);
        await page.fill('input[name="adults"]', adults.toString());
        
        // Submit search
        await page.click('button[type="submit"]');
        await page.waitForSelector(competitor.selectors.hotelName);
        
        // Extract hotel data
        const hotels = await page.$$eval(competitor.selectors.hotelName, (elements, selectors) => {
            return elements.map(el => {
                const container = el.closest('.hotel-card, .result-item');
                return {
                    name: el.textContent?.trim(),
                    price: container?.querySelector(selectors.price)?.textContent,
                    // ... extract other fields
                };
            });
        }, competitor.selectors);
        
        // Save to database
        const prices: CompetitorPrice[] = [];
        for (const hotel of hotels) {
            const price = await this.saveCompetitorPrice({
                competitor_name: competitor.name,
                competitor_url: competitor.url,
                hotel_name: hotel.name,
                destination,
                check_in: checkIn,
                check_out: checkOut,
                // ... other fields
            });
            prices.push(price);
        }
        
        await browser.close();
        return prices;
        
        */
    }

    /**
     * Save competitor price to database
     */
    private async saveCompetitorPrice(price: Partial<CompetitorPrice>): Promise<CompetitorPrice> {
        const nights = this.calculateNights(price.check_in!, price.check_out!);

        const priceData: Partial<CompetitorPrice> = {
            ...price,
            nights,
            currency: price.currency || 'EUR',
            is_available: true,
            scraped_at: new Date().toISOString()
        };

        const { data, error } = await supabase
            .from('competitor_prices')
            .insert(priceData)
            .select()
            .single();

        if (error) throw error;

        return data as CompetitorPrice;
    }

    /**
     * Create a new scraping session
     */
    private async createScrapingSession(
        sessionType: 'scheduled' | 'manual' | 'on_demand',
        targetCompetitors: string[]
    ): Promise<ScrapingSession> {
        const session: Partial<ScrapingSession> = {
            session_type: sessionType,
            target_competitors: targetCompetitors,
            status: 'running',
            started_at: new Date().toISOString(),
            total_prices_scraped: 0,
            successful_scrapes: 0,
            failed_scrapes: 0,
            errors: []
        };

        const { data, error } = await supabase
            .from('scraping_sessions')
            .insert(session)
            .select()
            .single();

        if (error) throw error;

        return data as ScrapingSession;
    }

    /**
     * Complete a scraping session
     */
    private async completeScrapingSession(sessionId: string, totalPrices: number): Promise<void> {
        const startTime = await this.getSessionStartTime(sessionId);
        const duration = Math.floor((Date.now() - new Date(startTime).getTime()) / 1000);

        const { error } = await supabase
            .from('scraping_sessions')
            .update({
                status: 'completed',
                completed_at: new Date().toISOString(),
                total_prices_scraped: totalPrices,
                successful_scrapes: totalPrices,
                duration_seconds: duration
            })
            .eq('id', sessionId);

        if (error) throw error;
    }

    /**
     * Log scraping error
     */
    private async logScrapingError(sessionId: string, competitor: string, error: any): Promise<void> {
        try {
            // Fetch current errors
            const { data: session } = await supabase
                .from('scraping_sessions')
                .select('errors, failed_scrapes')
                .eq('id', sessionId)
                .single();

            const errors = session?.errors || [];
            errors.push({
                competitor,
                error: error instanceof Error ? error.message : String(error),
                timestamp: new Date().toISOString()
            });

            // Update session
            await supabase
                .from('scraping_sessions')
                .update({
                    errors,
                    failed_scrapes: (session?.failed_scrapes || 0) + 1
                })
                .eq('id', sessionId);

        } catch (err) {
            console.error('[Scraper] Error logging error:', err);
        }
    }

    /**
     * Get session start time
     */
    private async getSessionStartTime(sessionId: string): Promise<string> {
        const { data } = await supabase
            .from('scraping_sessions')
            .select('started_at')
            .eq('id', sessionId)
            .single();

        return data?.started_at || new Date().toISOString();
    }

    /**
     * Calculate nights between two dates
     */
    private calculateNights(checkIn: string, checkOut: string): number {
        const start = new Date(checkIn);
        const end = new Date(checkOut);
        const diff = end.getTime() - start.getTime();
        return Math.ceil(diff / (1000 * 60 * 60 * 24));
    }

    /**
     * Random delay to avoid detection
     */
    private async randomDelay(min: number, max: number): Promise<void> {
        const delay = Math.floor(Math.random() * (max - min + 1)) + min;
        return new Promise(resolve => setTimeout(resolve, delay));
    }

    /**
     * Get random user agent
     */
    private getRandomUserAgent(): string {
        const userAgents = [
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15'
        ];

        return userAgents[Math.floor(Math.random() * userAgents.length)];
    }

    /**
     * Get scraping sessions history
     */
    async getScrapingSessions(limit: number = 20): Promise<YieldApiResponse<ScrapingSession[]>> {
        try {
            const { data, error } = await supabase
                .from('scraping_sessions')
                .select('*')
                .order('started_at', { ascending: false })
                .limit(limit);

            if (error) throw error;

            return {
                success: true,
                data: (data || []) as ScrapingSession[]
            };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }

    /**
     * Get latest competitor prices for a destination
     */
    async getLatestPrices(destination: string, days: number = 7): Promise<YieldApiResponse<CompetitorPrice[]>> {
        try {
            const dateFrom = new Date();
            dateFrom.setDate(dateFrom.getDate() - days);

            const { data, error } = await supabase
                .from('competitor_prices')
                .select('*')
                .eq('destination', destination)
                .gte('scraped_at', dateFrom.toISOString())
                .order('scraped_at', { ascending: false });

            if (error) throw error;

            return {
                success: true,
                data: (data || []) as CompetitorPrice[]
            };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }
}

// Singleton instance
export const competitorScraper = new CompetitorScraperService();
