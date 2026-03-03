import type { Dossier, Language } from '../types/reservationArchitect';
import { generateDossierPDF, generateDossierHTML } from '../utils/dossierExport';

export const dossierDocumentService = {
    /**
     * Generates a document in the specified format and language.
     */
    generate: (dossier: Dossier, type: string, format: 'PDF' | 'HTML', lang: Language) => {
        if (format === 'PDF') {
            generateDossierPDF(dossier, lang);
        } else {
            generateDossierHTML(dossier, lang);
        }
        return true;
    },

    /**
     * Shares the dossier summary via email.
     */
    shareViaEmail: (dossier: Dossier, summaryText: string) => {
        const subject = encodeURIComponent(`Dokumentacija za putovanje - ${dossier.cisCode}`);
        const body = encodeURIComponent(summaryText);
        window.location.href = `mailto:?subject=${subject}&body=${body}`;
    },

    /**
     * Shares the dossier summary via generic Web Share API (Viber, WhatsApp, etc.).
     */
    shareGeneric: async (dossier: Dossier, summaryText: string) => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: `Putovanje - ${dossier.cisCode}`,
                    text: summaryText
                });
                return true;
            } catch (err) {
                console.error('Error sharing:', err);
                return false;
            }
        }
        return false;
    },

    /**
     * Prints the current dossier view.
     */
    print: () => {
        window.print();
    }
};
