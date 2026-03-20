import { useState, useCallback } from 'react';
import { GoogleGenerativeAI } from "@google/generative-ai";

// OpenClaw Configuration (using Vite Proxy to bypass CORS)
const GATEWAY_URL = '/api/openclaw'; 
const GATEWAY_TOKEN = 'olympic-hub-secret-token-2026'; 

// Init Gemini SDK for Backup
const genAI = new GoogleGenerativeAI('AIzaSyC_vYi80SghECEYmmKA3CCY4wuhWZrKXRU');
const geminiModel = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

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
    model: string = 'google/gemini-2.0-flash'
  ): Promise<OpenClawResponse> => {
    try {
      setIsThinking(true);
      setError(null);

      // --- 1. TRY FREE OPENCLAW (DOCKER) VIA PROXY (PORT 18790) ---
      try {
        console.log('🦞 Calling OpenClaw local gateway (18790)...');
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
          console.log('✅ OpenClaw Response obtained.');
          return { content, isFallback: false };
        } else {
           const errText = await response.text();
           console.warn('⚠️ OpenClaw Gateway Error (Status ', response.status, '):', errText);
        }
      } catch (e) {
        console.warn('⚠️ OpenClaw Bridge not reachable (make sure Docker is running):', e);
      }

      // --- 2. GOOGLE GEMINI BACKUP (VIA OFFICIAL SDK) ---
      console.log('🔄 OpenClaw failed or skipped, calling Gemini SDK Backup...');
      const prompt = `Odgovori stručno i tečno na srpskom jeziku kao stručnjak za inventar u turizmu.\nKontekst podataka: ${context}\n\nKorisnik pita: ${message}`;
      const result = await geminiModel.generateContent(prompt);
      const response = await result.response;
      const content = response.text();
      
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
