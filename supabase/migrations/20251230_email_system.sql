-- Email Configuration Table
CREATE TABLE IF NOT EXISTS email_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id TEXT NOT NULL UNIQUE,
    smtp_host TEXT NOT NULL,
    smtp_port INTEGER NOT NULL DEFAULT 587,
    smtp_user TEXT NOT NULL,
    smtp_password TEXT NOT NULL,
    imap_host TEXT NOT NULL,
    imap_port INTEGER NOT NULL DEFAULT 993,
    imap_user TEXT NOT NULL,
    imap_password TEXT NOT NULL,
    use_ssl BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Emails Table
CREATE TABLE IF NOT EXISTS emails (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id TEXT NOT NULL,
    message_id TEXT UNIQUE NOT NULL,
    sender TEXT NOT NULL,
    sender_email TEXT,
    recipient TEXT NOT NULL,
    cc TEXT,
    bcc TEXT,
    subject TEXT NOT NULL,
    body TEXT,
    html TEXT,
    preview TEXT,
    folder TEXT NOT NULL DEFAULT 'inbox' CHECK (folder IN ('inbox', 'sent', 'drafts', 'archive', 'trash')),
    is_read BOOLEAN DEFAULT false,
    is_starred BOOLEAN DEFAULT false,
    has_attachments BOOLEAN DEFAULT false,
    sent_at TIMESTAMPTZ,
    received_at TIMESTAMPTZ,
    deleted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Email Attachments Table
CREATE TABLE IF NOT EXISTS email_attachments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email_id UUID NOT NULL REFERENCES emails(id) ON DELETE CASCADE,
    filename TEXT NOT NULL,
    content_type TEXT NOT NULL,
    size_bytes INTEGER,
    storage_path TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Email Labels Table
CREATE TABLE IF NOT EXISTS email_labels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    color TEXT NOT NULL,
    account_id TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(name, account_id)
);

-- Email Label Assignments
CREATE TABLE IF NOT EXISTS email_label_assignments (
    email_id UUID NOT NULL REFERENCES emails(id) ON DELETE CASCADE,
    label_id UUID NOT NULL REFERENCES email_labels(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (email_id, label_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_emails_account_id ON emails(account_id);
CREATE INDEX IF NOT EXISTS idx_emails_folder ON emails(folder);
CREATE INDEX IF NOT EXISTS idx_emails_message_id ON emails(message_id);
CREATE INDEX IF NOT EXISTS idx_emails_sent_at ON emails(sent_at DESC);
CREATE INDEX IF NOT EXISTS idx_emails_received_at ON emails(received_at DESC);
CREATE INDEX IF NOT EXISTS idx_email_configs_account_id ON email_configs(account_id);

-- Enable Row Level Security
ALTER TABLE email_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE emails ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_labels ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_label_assignments ENABLE ROW LEVEL SECURITY;

-- RLS Policies (adjust based on your auth setup)
-- For now, allowing all authenticated users
CREATE POLICY "Allow authenticated users to manage email configs"
    ON email_configs FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Allow authenticated users to manage emails"
    ON emails FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Allow authenticated users to manage attachments"
    ON email_attachments FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Allow authenticated users to manage labels"
    ON email_labels FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Allow authenticated users to manage label assignments"
    ON email_label_assignments FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_email_configs_updated_at
    BEFORE UPDATE ON email_configs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_emails_updated_at
    BEFORE UPDATE ON emails
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Insert some default labels
INSERT INTO email_labels (name, color, account_id) VALUES
    ('Hitno', '#ef4444', 'acc1'),
    ('Ponude', '#3b82f6', 'acc1'),
    ('Partneri', '#a855f7', 'acc1'),
    ('Hitno', '#ef4444', 'acc2'),
    ('Ponude', '#3b82f6', 'acc2'),
    ('Partneri', '#a855f7', 'acc2'),
    ('Hitno', '#ef4444', 'acc3'),
    ('Ponude', '#3b82f6', 'acc3'),
    ('Partneri', '#a855f7', 'acc3')
ON CONFLICT (name, account_id) DO NOTHING;
