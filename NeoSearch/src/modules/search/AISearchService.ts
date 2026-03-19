import { SearchCriteria } from './SearchEngine';
import { TranslationService } from '../../core/i18n/TranslationService';

/**
 * AISearchService - "Uši" platforme koje slušaju prirodan jezik.
 * Pretvara rečenice u strukturirane parametre pretrage.
 */
export class AISearchService {
  /**
   * Analizira prirodan upit i vraća SearchCriteria.
   * Primer: "Hotel u Egiptu za dvoje sa dvoje dece (5 i 10 god) u julu do 2000 evra"
   */
  public static async parseNaturalQuery(query: string): Promise<SearchCriteria> {
    const q = query.toLowerCase();
    console.log(`[AISearch] Analiziram prirodni upit: "${query}"`);

    // 1. Ekstrakcija destinacije
    let destination = 'UNKNOWN';
    if (/egipat|egiptu|egypt/i.test(q)) destination = 'EG';
    if (/turska|turkey/i.test(q)) destination = 'TR';
    if (/grcja|grcka|greece/i.test(q)) destination = 'GR';

    // 2. Ekstrakcija datuma (Simulacija - July 2026)
    let startDate = new Date();
    let endDate = new Date();
    if (/jul|july/i.test(q)) {
      startDate = new Date(2026, 6, 1);
      endDate = new Date(2026, 6, 11);
    }

    // 3. Putnici
    let adults = 2;
    let children = 0;
    let childAges: number[] = [];

    if (/dvoje dece|2 dece/.test(q)) {
      children = 2;
      childAges = [5, 10];
    } else if (/jedno dete|1 dete/.test(q)) {
      children = 1;
      childAges = [7];
    }

    // 4. Budžet
    let budget = 0;
    const priceMatch = q.match(/do (\d+)/);
    if (priceMatch) {
      budget = parseInt(priceMatch[1]);
    }

    // 5. Semantika (Zadržavamo originalan miris upita)
    const prompt = query; // Šaljemo ceo upit AI-ju za reranking

    return {
      destinationCode: destination,
      startDate,
      endDate,
      rooms: [{ adults, children, childAges }],
      aiPrompt: prompt
    };
  }

  /**
   * Generiše "Natural Language Response" za agenta.
   */
  public static generateQuerySummary(criteria: SearchCriteria): string {
    const lang = TranslationService.getLanguage();
    const destName = criteria.destinationCode === 'EG' ? 'Egipat' : criteria.destinationCode;
    
    if (lang === 'sr') {
      return `Tražim ${destName} u julu, za ${criteria.rooms[0].adults} odraslih i ${criteria.rooms[0].children} dece. Fokus: ${criteria.aiPrompt}`;
    }
    return `Searching for ${destName} in July, for ${criteria.rooms[0].adults} adults and ${criteria.rooms[0].children} children. Focus: ${criteria.aiPrompt}`;
  }
}
