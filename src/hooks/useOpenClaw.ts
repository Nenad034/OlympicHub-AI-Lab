import { useState, useCallback } from 'react';

// OpenClaw Configuration (using Vite Proxy to bypass CORS)
const GATEWAY_URL = '/api/openclaw'; 
const GATEWAY_TOKEN = 'olympic-hub-secret-token-2026'; // Token koji smo definisali u docker-compose.yml

export interface OpenClawMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface OpenClawResponse {
  content: string;
  error?: string;
  isFallback?: boolean;
}

export const useOpenClaw = () => {
  const [isThinking, setIsThinking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendMessage = useCallback(async (
    message: string, 
    context: string = '', 
    model: string = 'google/gemini-1.5-flash-latest'
  ): Promise<OpenClawResponse> => {
    try {
      setIsThinking(true);
      setError(null);

      // --- 1. TRY FREE OPENCLAW (DOCKER) VIA PROXY (PORT 18791) ---
      try {
        const response = await fetch(`${GATEWAY_URL}/v1/chat/completions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${GATEWAY_TOKEN}`,
          },
          body: JSON.stringify({
            model: model,
            messages: [
              { role: 'system', content: `Ti si stručnjak za inventar u agenciji ClickToTravel. Pomažeš u upravljanju kapacitetima. Kontekst: ${context}` },
              { role: 'user', content: message }
            ],
            stream: false
          }),
        });

        if (response.ok) {
          const data = await response.json();
          const content = data.choices?.[0]?.message?.content || 'Prazan odgovor od OpenClaw-a.';
          return { content, isFallback: false };
        } else {
           const errText = await response.text();
           console.warn('⚠️ OpenClaw Gateway Error (Status ', response.status, '):', errText);
        }
      } catch (e) {
        console.warn('⚠️ OpenClaw Bridge not reachable (make sure Docker is running):', e);
      }

      // --- 2. GOOGLE GEMINI BACKUP (VIA SECURE VITE TUNNEL /api/ai/google) ---
      console.log('🔄 Calling Google Gemini Backup for:', message);
      const GOOGLE_KEY = 'AIzaSyB-CiOvVFh5529ynyOLRGbPR8V4OeSwnkI';
      const geminiRes = await fetch(`/api/ai/google/v1/models/gemini-1.5-flash:generateContent?key=${GOOGLE_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ 
            parts: [{ text: `Odgovori stručno i tečno na srpskom jeziku kao stručnjak za inventar u turizmu.\nKontekst podataka: ${context}\n\nKorisnik pita: ${message}` }] 
          }]
        })
      });
      
      const geminiData = await geminiRes.json();
      
      if (!geminiRes.ok) {
        console.error('❌ Google Gemini API Error:', geminiData);
        throw new Error(`Google API Error: ${geminiRes.status}`);
      }

      const content = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || 'AI tunel nije vratio tekstualni odgovor.';
      
      return { content, isFallback: true };

    } catch (err: any) {
      console.error('❌ AI Ultimate failure:', err);
      return { 
        content: 'Nažalost, trenutno ne možemo uspostaviti vezu sa AI serverima. Proverite Docker i internet konekciju.',
        error: err.message,
        isFallback: true 
      };
    } finally {
      setIsThinking(false);
    }
  }, []);

  return { sendMessage, isThinking, error };
};
