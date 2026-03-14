import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ChannelType = 'whatsapp' | 'viber' | 'telegram' | 'internal';

export interface OmniMessage {
    id: string;
    channel: ChannelType;
    to: string;
    content: string;
    status: 'pending' | 'sent' | 'failed';
    timestamp: string;
}

interface OmniChannelState {
    messages: OmniMessage[];
    activeChannel: ChannelType | null;
    
    // Actions
    sendMessage: (channel: ChannelType, to: string, content: string) => Promise<boolean>;
    getMessagesByChannel: (channel: ChannelType) => OmniMessage[];
}

export const useOmniChannelStore = create<OmniChannelState>()(
    persist(
        (set, get) => ({
            messages: [],
            activeChannel: null,

            sendMessage: async (channel, to, content) => {
                const newMessage: OmniMessage = {
                    id: Math.random().toString(36).substr(2, 9),
                    channel,
                    to,
                    content,
                    status: 'sent', // Mocking success
                    timestamp: new Date().toISOString()
                };

                set(state => ({
                    messages: [newMessage, ...state.messages]
                }));

                // Logic for real API integration would go here
                // For now, we simulate the "Internal Integrations" the user mentioned
                console.log(`[OmniChannel] Sending to ${channel} (${to}): ${content}`);
                
                return true;
            },

            getMessagesByChannel: (channel) => {
                return get().messages.filter(m => m.channel === channel);
            }
        }),
        {
            name: 'prime-omnichannel-storage'
        }
    )
);
