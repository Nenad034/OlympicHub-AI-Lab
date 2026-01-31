-- B2B Subagent System - Database Extension
-- Olympic Hub 31.01.2026

-- 1. Subagent Configurations
CREATE TABLE IF NOT EXISTS public.subagent_configurations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    subagent_id TEXT UNIQUE NOT NULL, -- Logical ID linking to auth or existing subagent list
    allowed_suppliers TEXT[] DEFAULT '{}', -- List of supplier IDs they can see (Solvex, TCT, etc)
    default_margin_type TEXT CHECK (default_margin_type IN ('percentage', 'fixed')) DEFAULT 'percentage',
    default_margin_value DECIMAL DEFAULT 0.0,
    chat_enabled BOOLEAN DEFAULT TRUE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Staff Presence (For B2B Chat Choice)
CREATE TABLE IF NOT EXISTS public.staff_presence (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    role TEXT,
    avatar_url TEXT,
    is_online BOOLEAN DEFAULT FALSE,
    last_seen TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 3. B2B Correspondence (180 days retention)
CREATE TABLE IF NOT EXISTS public.b2b_support_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reservation_id TEXT, -- Contextual link to a reservation
    subagent_id TEXT NOT NULL,
    staff_id UUID REFERENCES public.staff_presence(id),
    subject TEXT,
    message TEXT NOT NULL,
    tab_context TEXT, -- 'passengers', 'items', 'payments', etc.
    attachments JSONB DEFAULT '[]',
    is_read_by_staff BOOLEAN DEFAULT FALSE,
    is_read_by_agent BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.subagent_configurations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.b2b_support_messages ENABLE ROW LEVEL SECURITY;

-- Note: In production, we should set up a Cron Job to delete messages older than 180 days.
-- DELETE FROM public.b2b_support_messages WHERE created_at < NOW() - INTERVAL '180 days';
