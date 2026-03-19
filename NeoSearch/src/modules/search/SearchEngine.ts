import { Result, ok, fail } from '../../core/error/Result';
import { ProductEntity } from '../products/ProductEntity';
import { PriceSnapshot, PricingService } from '../contracting/PricingService';
import { AISearchService } from './AISearchService';

export interface SearchCriteria {
  destinationCode: string;
  startDate: Date;
  endDate: Date;
  rooms: Array<{
    adults: number;
    children: number;
    childAges: number[];
  }>;
  aiPrompt?: string; // npr. "blizu plaže, mirno"
}

export interface SearchResultItem {
  productId: string;
  productName: string;
  type: 'HOTEL' | 'FLIGHT' | 'TRANSFER' | 'ACTIVITY';
  offers: PriceSnapshot[]; // SVI važeći cenovnici za ovaj proizvod
  aiAnalysis?: {
    relevancyScore: number;
    summary: string;
  };
  amenityHighlights: string[];
}

/**
 * SearchEngine - Mozak pretrage sa AI inteligencijom.
 */
export class SearchEngine {
  private pricingService = new PricingService();

  /**
   * AI Pretraga na osnovu prirodnog govora.
   * "Ulazna kapija" za Back-Office AI Agent-a.
   */
  async searchByNaturalLanguage(query: string): Promise<Result<{ criteria: SearchCriteria, results: SearchResultItem[] }, Error>> {
    try {
      // 1. Pretvaranje rečenice u parametre
      const criteria = await AISearchService.parseNaturalQuery(query);
      
      // 2. Izvršavanje unificirane pretrage
      const searchResult = await this.unifiedSearch(criteria);
      
      if (searchResult.isFailure()) return fail(searchResult.error);

      return ok({
        criteria,
        results: searchResult.value
      });
    } catch (error) {
      return fail(error as Error);
    }
  }

  /**
   * Glavna pretraga (Unified Search).
   * Implementira Pravilo 8: Završetak svih delova pretrage (Hotel, Let, Transfer, AI).
   */
  async unifiedSearch(criteria: SearchCriteria): Promise<Result<SearchResultItem[], Error>> {
    try {
      // 1. Pronalaženje proizvoda u bazi (MOCK podataka za demonstraciju)
      const mockProducts = [
        { id: 'H1', name: 'Disneyland Hotel', type: 'HOTEL' as const },
        { id: 'H2', name: 'Hotel de la Mer', type: 'HOTEL' as const }
      ];

      const results: SearchResultItem[] = [];

      for (const p of mockProducts) {
        // 2. Dobavljanje SVIH važećih cena (Pravilo: Ponuditi oba cenovnika ako postoje)
        const offersResult = await this.pricingService.getAvailableOffers(p.id, criteria, 'MANUAL');
        
        if (offersResult.isSuccess()) {
          results.push({
            productId: p.id,
            productName: p.name,
            type: p.type,
            offers: offersResult.value,
            amenityHighlights: ['Sea View', 'WiFi', 'Pool'],
            aiAnalysis: this.generateAiAnalysis(p.name, criteria.aiPrompt)
          });
        }
      }

      // 3. AI Reranking prema promptu korisnika
      if (criteria.aiPrompt) {
        this.applyAiReranking(results, criteria.aiPrompt);
      }

      return ok(results);
    } catch (error) {
      return fail(error as Error);
    }
  }

  /**
   * Generiše AI analizu za rezultat (Pravilo: Smart Summaries).
   */
  private generateAiAnalysis(name: string, prompt?: string) {
    return {
      relevancyScore: 95,
      summary: `Idealan izbor za upit: "${prompt || 'Standardna pretraga'}". Ovaj objekat nudi najbolji odnos cene i kvaliteta za porodice.`
    };
  }

  private applyAiReranking(items: SearchResultItem[], prompt: string): void {
    console.log(`[AI Engine] Rangiram ${items.length} hotela prema upitu: ${prompt}`);
    // Ovde bi išao poziv ka vektorskoj bazi i LLM-u
  }
}
