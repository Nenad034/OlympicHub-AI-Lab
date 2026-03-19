import sr from './locales/sr.json';
import en from './locales/en.json';

export type SupportedLanguage = 'sr' | 'en';

/**
 * TranslationService - Upravlja lokalizacijom platforme.
 * Omogućava lako dodavanje novih jezika i prebacivanje u realnom vremenu.
 */
export class TranslationService {
  private static currentLanguage: SupportedLanguage = 'sr';
  private static locales: Record<SupportedLanguage, any> = { sr, en };

  /**
   * Postavlja aktivni jezik.
   */
  public static setLanguage(lang: SupportedLanguage) {
    this.currentLanguage = lang;
  }

  /**
   * Vraća trenutni jezik.
   */
  public static getLanguage(): SupportedLanguage {
    return this.currentLanguage;
  }

  /**
   * Prevodi ključ na trenutni jezik.
   * Primer: translate('finance.sell_price') -> "Prodajna Cena"
   */
  public static translate(key: string): string {
    const keys = key.split('.');
    let result = this.locales[this.currentLanguage];

    for (const k of keys) {
      if (result[k]) {
        result = result[k];
      } else {
        return key; // Fallback na ključ ako prevod ne postoji
      }
    }

    return result as string;
  }
}
