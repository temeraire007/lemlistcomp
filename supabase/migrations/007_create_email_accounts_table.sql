-- Create Email Accounts Table
-- Stores connected email accounts (Gmail, Outlook, etc.)

-- ============================================
-- 1. CREATE EMAIL_PROVIDER TYPE
-- ============================================
DO $$ BEGIN
  CREATE TYPE email_provider AS ENUM ('gmail', 'outlook');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- ============================================
-- 2. CREATE EMAIL_ACCOUNTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS email_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Provider info
  provider email_provider NOT NULL,
  email TEXT NOT NULL,
  
  -- OAuth tokens (encrypted in production!)
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  token_expiry TIMESTAMP WITH TIME ZONE,
  
  -- Account details
  account_name TEXT, -- Display name (e.g., "John Doe")
  is_primary BOOLEAN DEFAULT false, -- Primary sending account
  is_active BOOLEAN DEFAULT true,
  
  -- Tracking settings
  track_opens BOOLEAN DEFAULT true,
  track_clicks BOOLEAN DEFAULT true,
  track_replies BOOLEAN DEFAULT true,
  
  -- Sync settings
  last_sync_at TIMESTAMP WITH TIME ZONE,
  sync_enabled BOOLEAN DEFAULT true,
  
  -- Sending limits
  daily_send_limit INTEGER DEFAULT 100, -- Max emails per day
  emails_sent_today INTEGER DEFAULT 0,
  last_reset_date DATE DEFAULT CURRENT_DATE,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 3. CREATE INDEXES
-- ============================================
-- Index on user_id for user-specific queries
CREATE INDEX IF NOT EXISTS idx_email_accounts_user_id ON email_accounts(user_id);

-- Index on email for lookup
CREATE INDEX IF NOT EXISTS idx_email_accounts_email ON email_accounts(email);

-- Index on provider
CREATE INDEX IF NOT EXISTS idx_email_accounts_provider ON email_accounts(provider);

-- Composite index for active accounts
CREATE INDEX IF NOT EXISTS idx_email_accounts_user_active ON email_accounts(user_id, is_active);

-- Unique constraint: one email per user
CREATE UNIQUE INDEX IF NOT EXISTS idx_email_accounts_user_email_unique ON email_accounts(user_id, email);

-- ============================================
-- 4. ENABLE ROW LEVEL SECURITY
-- ============================================
ALTER TABLE email_accounts ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 5. CREATE RLS POLICIES
-- ============================================

-- Policy: Users can view their own email accounts
CREATE POLICY "Users can view own email accounts" ON email_accounts
  FOR SELECT
  USING (
    user_id IN (
      SELECT id FROM users WHERE clerk_user_id = (auth.jwt() ->> 'sub')
    )
  );

-- Policy: Users can insert their own email accounts
CREATE POLICY "Users can insert own email accounts" ON email_accounts
  FOR INSERT
  WITH CHECK (
    user_id IN (
      SELECT id FROM users WHERE clerk_user_id = (auth.jwt() ->> 'sub')
    )
  );

-- Policy: Users can update their own email accounts
CREATE POLICY "Users can update own email accounts" ON email_accounts
  FOR UPDATE
  USING (
    user_id IN (
      SELECT id FROM users WHERE clerk_user_id = (auth.jwt() ->> 'sub')
    )
  );

-- Policy: Users can delete their own email accounts
CREATE POLICY "Users can delete own email accounts" ON email_accounts
  FOR DELETE
  USING (
    user_id IN (
      SELECT id FROM users WHERE clerk_user_id = (auth.jwt() ->> 'sub')
    )
  );

-- Policy: Allow authenticated role (for API routes with Clerk token)
CREATE POLICY "Allow authenticated to manage email accounts" ON email_accounts
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ============================================
-- 6. CREATE TRIGGER FOR DAILY LIMIT RESET
-- ============================================
CREATE OR REPLACE FUNCTION reset_daily_email_count()
RETURNS TRIGGER AS $$
BEGIN
  -- Reset count if it's a new day
  IF NEW.last_reset_date < CURRENT_DATE THEN
    NEW.emails_sent_today := 0;
    NEW.last_reset_date := CURRENT_DATE;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER check_daily_email_reset
  BEFORE UPDATE ON email_accounts
  FOR EACH ROW
  EXECUTE FUNCTION reset_daily_email_count();

-- ============================================
-- 7. CREATE UPDATED_AT TRIGGER
-- ============================================
CREATE TRIGGER update_email_accounts_updated_at
  BEFORE UPDATE ON email_accounts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 8. ADD HELPFUL COMMENTS
-- ============================================
COMMENT ON TABLE email_accounts IS 'Stores connected email accounts for sending campaigns';
COMMENT ON COLUMN email_accounts.id IS 'Unique email account identifier';
COMMENT ON COLUMN email_accounts.user_id IS 'Reference to the user who owns this account';
COMMENT ON COLUMN email_accounts.provider IS 'Email provider: gmail or outlook';
COMMENT ON COLUMN email_accounts.email IS 'Email address of the account';
COMMENT ON COLUMN email_accounts.access_token IS 'OAuth access token (encrypt in production!)';
COMMENT ON COLUMN email_accounts.refresh_token IS 'OAuth refresh token for renewing access';
COMMENT ON COLUMN email_accounts.token_expiry IS 'When the access token expires';
COMMENT ON COLUMN email_accounts.is_primary IS 'Primary account for sending emails';
COMMENT ON COLUMN email_accounts.is_active IS 'Whether the account is active';
COMMENT ON COLUMN email_accounts.track_opens IS 'Track email opens';
COMMENT ON COLUMN email_accounts.track_clicks IS 'Track link clicks';
COMMENT ON COLUMN email_accounts.track_replies IS 'Track email replies';
COMMENT ON COLUMN email_accounts.daily_send_limit IS 'Maximum emails per day';
COMMENT ON COLUMN email_accounts.emails_sent_today IS 'Number of emails sent today';

