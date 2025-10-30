-- Create Leads Table
-- Stores leads/contacts for campaigns

-- ============================================
-- 1. CREATE LEAD_STATUS TYPE
-- ============================================
DO $$ BEGIN
  CREATE TYPE lead_status AS ENUM (
    'lead',        -- New lead, not contacted yet
    'scheduled',   -- Email scheduled but not sent
    'sent',        -- Email sent, awaiting response
    'opened',      -- Lead opened the email
    'replied',     -- Lead replied to email
    'won',         -- Successfully converted
    'lost'         -- Lead lost/not interested
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- ============================================
-- 2. CREATE LEADS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  
  -- Lead information
  first_name TEXT,
  last_name TEXT,
  email TEXT NOT NULL,
  company TEXT,
  
  -- Lead status
  status lead_status NOT NULL DEFAULT 'lead',
  
  -- Additional metadata
  notes TEXT, -- Optional notes about the lead
  tags TEXT[], -- Optional tags for filtering
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 3. CREATE INDEXES
-- ============================================
-- Index on user_id for user-specific queries
CREATE INDEX IF NOT EXISTS idx_leads_user_id ON leads(user_id);

-- Index on campaign_id for campaign-specific leads
CREATE INDEX IF NOT EXISTS idx_leads_campaign_id ON leads(campaign_id);

-- Index on email for lookup and uniqueness checking
CREATE INDEX IF NOT EXISTS idx_leads_email ON leads(email);

-- Index on status for filtering
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);

-- Composite index for campaign and status (common query pattern)
CREATE INDEX IF NOT EXISTS idx_leads_campaign_status ON leads(campaign_id, status);

-- Composite index for user and campaign
CREATE INDEX IF NOT EXISTS idx_leads_user_campaign ON leads(user_id, campaign_id);

-- Unique constraint: one email per campaign
CREATE UNIQUE INDEX IF NOT EXISTS idx_leads_campaign_email_unique ON leads(campaign_id, email);

-- ============================================
-- 4. ENABLE ROW LEVEL SECURITY
-- ============================================
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 5. CREATE RLS POLICIES
-- ============================================

-- Policy: Users can view their own leads
CREATE POLICY "Users can view own leads" ON leads
  FOR SELECT
  USING (
    user_id IN (
      SELECT id FROM users WHERE clerk_user_id = (auth.jwt() ->> 'sub')
    )
  );

-- Policy: Users can insert their own leads
CREATE POLICY "Users can insert own leads" ON leads
  FOR INSERT
  WITH CHECK (
    user_id IN (
      SELECT id FROM users WHERE clerk_user_id = (auth.jwt() ->> 'sub')
    )
  );

-- Policy: Users can update their own leads
CREATE POLICY "Users can update own leads" ON leads
  FOR UPDATE
  USING (
    user_id IN (
      SELECT id FROM users WHERE clerk_user_id = (auth.jwt() ->> 'sub')
    )
  );

-- Policy: Users can delete their own leads
CREATE POLICY "Users can delete own leads" ON leads
  FOR DELETE
  USING (
    user_id IN (
      SELECT id FROM users WHERE clerk_user_id = (auth.jwt() ->> 'sub')
    )
  );

-- Policy: Allow authenticated role (for API routes with Clerk token)
CREATE POLICY "Allow authenticated to manage leads" ON leads
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ============================================
-- 6. ADD FOREIGN KEY TO EMAIL_MESSAGES
-- ============================================
-- Now that leads table exists, we can add the foreign key constraint
ALTER TABLE email_messages 
  DROP CONSTRAINT IF EXISTS email_messages_lead_id_fkey;

ALTER TABLE email_messages 
  ADD CONSTRAINT email_messages_lead_id_fkey 
  FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE CASCADE;

-- ============================================
-- 7. CREATE UPDATED_AT TRIGGER
-- ============================================
CREATE TRIGGER update_leads_updated_at
  BEFORE UPDATE ON leads
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 8. ADD HELPFUL COMMENTS
-- ============================================
COMMENT ON TABLE leads IS 'Stores leads/contacts for campaigns';
COMMENT ON COLUMN leads.id IS 'Unique lead identifier';
COMMENT ON COLUMN leads.user_id IS 'Reference to the user who owns this lead';
COMMENT ON COLUMN leads.campaign_id IS 'Reference to the campaign this lead belongs to';
COMMENT ON COLUMN leads.first_name IS 'Lead first name';
COMMENT ON COLUMN leads.last_name IS 'Lead last name';
COMMENT ON COLUMN leads.email IS 'Lead email address (unique per campaign)';
COMMENT ON COLUMN leads.company IS 'Lead company name';
COMMENT ON COLUMN leads.status IS 'Lead status: lead, scheduled, sent, opened, replied, won, or lost';
COMMENT ON COLUMN leads.notes IS 'Optional notes about the lead';
COMMENT ON COLUMN leads.tags IS 'Optional tags for filtering and organization';

