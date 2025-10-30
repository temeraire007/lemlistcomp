-- Create Email Messages Table
-- Tracks actual emails sent/received with leads (like a CRM inbox)

-- ============================================
-- 1. CREATE EMAIL_MESSAGES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS email_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL, -- Will reference leads table (to be created)
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Email direction
  direction TEXT NOT NULL CHECK (direction IN ('outbound', 'inbound')),
  
  -- Email identifiers (for threading and tracking)
  message_id TEXT, -- Unique message ID from email provider
  thread_id TEXT, -- For grouping emails in conversations
  
  -- Email content
  subject TEXT,
  html_body TEXT, -- HTML version of email
  text_body TEXT, -- Plain text version of email
  
  -- Timestamps
  sent_at TIMESTAMP WITH TIME ZONE,
  
  -- Email headers (stored as JSON for flexibility)
  headers JSONB,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 2. CREATE INDEXES
-- ============================================
-- Index on user_id for user-specific queries
CREATE INDEX IF NOT EXISTS idx_email_messages_user_id ON email_messages(user_id);

-- Index on lead_id for lead-specific email history
CREATE INDEX IF NOT EXISTS idx_email_messages_lead_id ON email_messages(lead_id);

-- Index on direction for filtering outbound/inbound
CREATE INDEX IF NOT EXISTS idx_email_messages_direction ON email_messages(direction);

-- Index on message_id for quick lookup
CREATE INDEX IF NOT EXISTS idx_email_messages_message_id ON email_messages(message_id);

-- Index on thread_id for conversation grouping
CREATE INDEX IF NOT EXISTS idx_email_messages_thread_id ON email_messages(thread_id);

-- Index on sent_at for chronological ordering
CREATE INDEX IF NOT EXISTS idx_email_messages_sent_at ON email_messages(sent_at DESC);

-- Composite index for lead conversations
CREATE INDEX IF NOT EXISTS idx_email_messages_lead_thread ON email_messages(lead_id, thread_id);

-- Composite index for user's recent messages
CREATE INDEX IF NOT EXISTS idx_email_messages_user_sent ON email_messages(user_id, sent_at DESC);

-- ============================================
-- 3. ENABLE ROW LEVEL SECURITY
-- ============================================
ALTER TABLE email_messages ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 4. CREATE RLS POLICIES
-- ============================================

-- Policy: Users can view their own email messages
CREATE POLICY "Users can view own email messages" ON email_messages
  FOR SELECT
  USING (
    user_id IN (
      SELECT id FROM users WHERE clerk_user_id = (auth.jwt() ->> 'sub')
    )
  );

-- Policy: Users can insert their own email messages
CREATE POLICY "Users can insert own email messages" ON email_messages
  FOR INSERT
  WITH CHECK (
    user_id IN (
      SELECT id FROM users WHERE clerk_user_id = (auth.jwt() ->> 'sub')
    )
  );

-- Policy: Users can update their own email messages
CREATE POLICY "Users can update own email messages" ON email_messages
  FOR UPDATE
  USING (
    user_id IN (
      SELECT id FROM users WHERE clerk_user_id = (auth.jwt() ->> 'sub')
    )
  );

-- Policy: Users can delete their own email messages
CREATE POLICY "Users can delete own email messages" ON email_messages
  FOR DELETE
  USING (
    user_id IN (
      SELECT id FROM users WHERE clerk_user_id = (auth.jwt() ->> 'sub')
    )
  );

-- Policy: Allow authenticated role (for API routes with Clerk token)
CREATE POLICY "Allow authenticated to manage email messages" ON email_messages
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ============================================
-- 5. CREATE UPDATED_AT TRIGGER
-- ============================================
CREATE TRIGGER update_email_messages_updated_at
  BEFORE UPDATE ON email_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 6. ADD HELPFUL COMMENTS
-- ============================================
COMMENT ON TABLE email_messages IS 'Tracks actual emails sent/received with leads (like a CRM inbox)';
COMMENT ON COLUMN email_messages.id IS 'Unique message identifier';
COMMENT ON COLUMN email_messages.lead_id IS 'Reference to the lead (recipient)';
COMMENT ON COLUMN email_messages.user_id IS 'Reference to the user who sent/received the email';
COMMENT ON COLUMN email_messages.direction IS 'Email direction: outbound or inbound';
COMMENT ON COLUMN email_messages.message_id IS 'Unique message ID from email provider';
COMMENT ON COLUMN email_messages.thread_id IS 'Thread ID for grouping conversation emails';
COMMENT ON COLUMN email_messages.subject IS 'Email subject line';
COMMENT ON COLUMN email_messages.html_body IS 'HTML version of the email body';
COMMENT ON COLUMN email_messages.text_body IS 'Plain text version of the email body';
COMMENT ON COLUMN email_messages.sent_at IS 'When the email was sent/received';
COMMENT ON COLUMN email_messages.headers IS 'Email headers stored as JSON';

