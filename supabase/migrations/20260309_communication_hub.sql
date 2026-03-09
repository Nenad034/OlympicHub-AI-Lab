-- Communication Hub: Email Locking, Internal Comments, and Enquiry Tracking

-- Add status and tracking to emails
ALTER TABLE emails ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'replied', 'processing', 'archived', 'ignored'));
ALTER TABLE emails ADD COLUMN IF NOT EXISTS responded_at TIMESTAMPTZ;
ALTER TABLE emails ADD COLUMN IF NOT EXISTS assigned_to UUID;

-- Table for Real-time Collision Prevention (Locking)
CREATE TABLE IF NOT EXISTS email_locks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email_id UUID NOT NULL REFERENCES emails(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    user_name TEXT NOT NULL,
    locked_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '10 minutes'),
    UNIQUE(email_id)
);

-- Table for Internal Comments
CREATE TABLE IF NOT EXISTS email_internal_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email_id UUID NOT NULL REFERENCES emails(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    user_name TEXT NOT NULL,
    comment_text TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table for Website Enquiries (Unified with Communication Hub)
CREATE TABLE IF NOT EXISTS web_enquiries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source TEXT NOT NULL DEFAULT 'website', -- 'website', 'landing_page', 'mobile_app'
    customer_name TEXT,
    customer_email TEXT,
    customer_phone TEXT,
    subject TEXT,
    message TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'replied', 'processing', 'closed', 'ignored')),
    assigned_to UUID,
    responded_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Locks and Comments for Web Enquiries too
CREATE TABLE IF NOT EXISTS web_enquiry_locks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    enquiry_id UUID NOT NULL REFERENCES web_enquiries(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    user_name TEXT NOT NULL,
    locked_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '10 minutes'),
    UNIQUE(enquiry_id)
);

CREATE TABLE IF NOT EXISTS web_enquiry_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    enquiry_id UUID NOT NULL REFERENCES web_enquiries(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    user_name TEXT NOT NULL,
    comment_text TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_emails_status ON emails(status);
CREATE INDEX IF NOT EXISTS idx_web_enquiries_status ON web_enquiries(status);
CREATE INDEX IF NOT EXISTS idx_email_locks_expires ON email_locks(expires_at);

-- RLS
ALTER TABLE email_locks ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_internal_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE web_enquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE web_enquiry_locks ENABLE ROW LEVEL SECURITY;
ALTER TABLE web_enquiry_comments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow authenticated users to manage email locks" ON email_locks;
CREATE POLICY "Allow authenticated users to manage email locks" ON email_locks FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow authenticated users to manage email comments" ON email_internal_comments;
CREATE POLICY "Allow authenticated users to manage email comments" ON email_internal_comments FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow authenticated users to manage web enquiries" ON web_enquiries;
CREATE POLICY "Allow authenticated users to manage web enquiries" ON web_enquiries FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow authenticated users to manage web enquiry locks" ON web_enquiry_locks;
CREATE POLICY "Allow authenticated users to manage web enquiry locks" ON web_enquiry_locks FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow authenticated users to manage web enquiry comments" ON web_enquiry_comments;
CREATE POLICY "Allow authenticated users to manage web enquiry comments" ON web_enquiry_comments FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Trigger for web_enquiries updated_at
DROP TRIGGER IF EXISTS update_web_enquiries_updated_at ON web_enquiries;
CREATE TRIGGER update_web_enquiries_updated_at
    BEFORE UPDATE ON web_enquiries
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Function for automatic email archiving of old replied/ignored messages
CREATE OR REPLACE FUNCTION automatic_email_archiving(days_limit INTEGER DEFAULT 30)
RETURNS INTEGER AS $$
DECLARE
    archived_count INTEGER;
BEGIN
    UPDATE emails 
    SET folder = 'archive',
        updated_at = NOW()
    WHERE folder = 'inbox' 
      AND (status = 'replied' OR status = 'ignored')
      AND (received_at < (NOW() - (days_limit || ' days')::INTERVAL) OR sent_at < (NOW() - (days_limit || ' days')::INTERVAL));
      
    GET DIAGNOSTICS archived_count = ROW_COUNT;
    RETURN archived_count;
END;
$$ LANGUAGE plpgsql;
