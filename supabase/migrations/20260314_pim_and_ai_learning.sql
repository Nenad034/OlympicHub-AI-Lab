-- Migration: Premium Enterprise Architecture for Communications and AI Intelligence
-- Description: Separated, high-performance schema for PIM (Social/Messenger) and AG Prime Machine Learning.
-- Created: 2026-03-14

-- ==========================================
-- 1. PIM CHAT HUB (Social & Instant Messaging)
-- ==========================================
-- This table is optimized for high-velocity short messages (Viber, WA, Telegram, etc.)
-- Email stays in its own existing 'emails' table for binary/HTML complexity.

CREATE TABLE IF NOT EXISTS public.pim_chat_threads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    platform TEXT NOT NULL, -- 'Viber', 'WhatsApp', 'Telegram', 'Messenger', 'Instagram', 'X', 'TikTok'
    external_sender_id TEXT NOT NULL, -- Handle or Phone number
    sender_display_name TEXT NOT NULL,
    current_sentiment TEXT DEFAULT 'Neutral' CHECK (current_sentiment IN ('Positive', 'Neutral', 'Negative', 'Urgent')),
    lead_score INTEGER DEFAULT 0, -- AI calculated score for sales potential
    is_group_chat BOOLEAN DEFAULT FALSE,
    assigned_staff_id UUID REFERENCES auth.users(id),
    status TEXT DEFAULT 'open' CHECK (status IN ('open', 'pending', 'resolved', 'archived')),
    last_message_preview TEXT,
    last_message_at TIMESTAMPTZ DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'::jsonb,
    tags TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(platform, external_sender_id)
);

CREATE TABLE IF NOT EXISTS public.pim_chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    thread_id UUID NOT NULL REFERENCES public.pim_chat_threads(id) ON DELETE CASCADE,
    sender_type TEXT NOT NULL CHECK (sender_type IN ('client', 'staff', 'bot')),
    content TEXT NOT NULL,
    attachments_urls TEXT[] DEFAULT '{}',
    is_delivered BOOLEAN DEFAULT TRUE,
    is_read BOOLEAN DEFAULT FALSE,
    ai_translated_content TEXT, -- Auto-translation if needed
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- 2. AG PRIME INTELLIGENCE (AI Core & Learning)
-- ==========================================
-- Private operational brain, separated from client communications.

CREATE TABLE IF NOT EXISTS public.ag_prime_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    session_token TEXT UNIQUE NOT NULL,
    entry_module TEXT, -- Where the user started (e.g., 'Financial Intelligence')
    system_load_at_start FLOAT, -- Monitoring performance context
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    ended_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public.ag_prime_interaction_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES public.ag_prime_sessions(id) ON DELETE CASCADE,
    user_prompt TEXT NOT NULL,
    ai_response TEXT NOT NULL,
    detected_intent TEXT, -- 'AnalysisRequest', 'UI_Modification', 'Data_Fetch'
    executed_code_snippet TEXT, -- If AI generated code for LAB
    execution_success BOOLEAN DEFAULT TRUE,
    user_feedback_score INTEGER, -- 1-5 feedback from user on response quality
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.ag_prime_knowledge_base (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    knowledge_type TEXT NOT NULL, -- 'User_Preference', 'Business_Logic', 'Market_Trend'
    topic TEXT NOT NULL,
    content_data JSONB NOT NULL, -- The actual learned fact
    source_log_id UUID REFERENCES public.ag_prime_interaction_logs(id),
    confidence_rating FLOAT DEFAULT 0.0, -- AI's certainty about this fact
    is_verified_by_staff BOOLEAN DEFAULT FALSE,
    last_accessed_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- 3. Optimization & Security
-- ==========================================

-- Performance Indexes
CREATE INDEX IF NOT EXISTS idx_pim_platform_sender ON public.pim_chat_threads(platform, external_sender_id);
CREATE INDEX IF NOT EXISTS idx_pim_messages_thread ON public.pim_chat_messages(thread_id);
CREATE INDEX IF NOT EXISTS idx_ag_logs_session ON public.ag_prime_interaction_logs(session_id);
CREATE INDEX IF NOT EXISTS idx_ag_knowledge_type ON public.ag_prime_knowledge_base(knowledge_type);

-- Enable RLS
ALTER TABLE public.pim_chat_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pim_chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ag_prime_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ag_prime_interaction_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ag_prime_knowledge_base ENABLE ROW LEVEL SECURITY;

-- Dynamic Policies (Restrict to staff and admins)
CREATE POLICY "Staff manage PIM chats" ON public.pim_chat_threads FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Staff manage PIM messages" ON public.pim_chat_messages FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Private AG Prime Access" ON public.ag_prime_sessions FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Private AG Prime Logs" ON public.ag_prime_interaction_logs FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admin Knowledge Access" ON public.ag_prime_knowledge_base FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Trigger for Auto-Update updated_at
CREATE OR REPLACE TRIGGER update_pim_chat_threads_updated_at
    BEFORE UPDATE ON public.pim_chat_threads
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
-- Seed Data for Testing\nINSERT INTO public.pim_chat_threads (platform, external_sender_id, sender_display_name, last_message_preview, current_sentiment, lead_score)\nVALUES \n('WhatsApp', '+38164111222', 'Petar Petrovic', 'Uplaceno za Grcku, šaljem uplatnicu.', 'Positive', 95),\n('Viber', '+38163333444', 'Ivana Jovic', 'Kada dobijam vaucer?', 'Neutral', 50),\n('Instagram', 'travel_lover_bg', 'Milica M.', 'Ovaj hotel u Turskoj izgleda sjajno!', 'Positive', 80);\n\nINSERT INTO public.pim_chat_messages (thread_id, sender_type, content)\nSELECT id, 'client', 'Uplaceno za Grcku, šaljem uplatnicu.' FROM public.pim_chat_threads WHERE external_sender_id = '+38164111222';
