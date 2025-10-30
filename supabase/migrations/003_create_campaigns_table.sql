-- Create Campaigns Table
-- Stores email campaign information for each user

-- ============================================
-- 1. CREATE CAMPAIGNS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  frequency TEXT,
  start_time TIMESTAMP WITH TIME ZONE,
  end_time TIMESTAMP WITH TIME ZONE,
  days TEXT[], -- Array of days (e.g., ['monday', 'tuesday', 'wednesday'])
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'paused', 'completed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 2. CREATE INDEXES
-- ============================================
-- Index on user_id for faster user-specific queries
CREATE INDEX IF NOT EXISTS idx_campaigns_user_id ON campaigns(user_id);

-- Index on status for filtering campaigns by status
CREATE INDEX IF NOT EXISTS idx_campaigns_status ON campaigns(status);

-- Composite index for user_id and status (common query pattern)
CREATE INDEX IF NOT EXISTS idx_campaigns_user_status ON campaigns(user_id, status);

-- ============================================
-- 3. ENABLE ROW LEVEL SECURITY
-- ============================================
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 4. CREATE RLS POLICIES
-- ============================================

-- Policy: Users can view their own campaigns
CREATE POLICY "Users can view own campaigns" ON campaigns
  FOR SELECT
  USING (
    user_id IN (
      SELECT id FROM users WHERE clerk_user_id = (auth.jwt() ->> 'sub')
    )
  );

-- Policy: Users can insert their own campaigns
CREATE POLICY "Users can insert own campaigns" ON campaigns
  FOR INSERT
  WITH CHECK (
    user_id IN (
      SELECT id FROM users WHERE clerk_user_id = (auth.jwt() ->> 'sub')
    )
  );

-- Policy: Users can update their own campaigns
CREATE POLICY "Users can update own campaigns" ON campaigns
  FOR UPDATE
  USING (
    user_id IN (
      SELECT id FROM users WHERE clerk_user_id = (auth.jwt() ->> 'sub')
    )
  );

-- Policy: Users can delete their own campaigns
CREATE POLICY "Users can delete own campaigns" ON campaigns
  FOR DELETE
  USING (
    user_id IN (
      SELECT id FROM users WHERE clerk_user_id = (auth.jwt() ->> 'sub')
    )
  );

-- Policy: Allow anon role to insert (for API routes)
CREATE POLICY "Allow anon to insert campaigns" ON campaigns
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Policy: Allow anon role to select (for API routes)
CREATE POLICY "Allow anon to select campaigns" ON campaigns
  FOR SELECT
  TO anon
  USING (true);

-- Policy: Allow anon role to update (for API routes)
CREATE POLICY "Allow anon to update campaigns" ON campaigns
  FOR UPDATE
  TO anon
  USING (true);

-- Policy: Allow anon role to delete (for API routes)
CREATE POLICY "Allow anon to delete campaigns" ON campaigns
  FOR DELETE
  TO anon
  USING (true);

-- ============================================
-- 5. CREATE UPDATED_AT TRIGGER
-- ============================================
-- Trigger to automatically update the updated_at timestamp
CREATE TRIGGER update_campaigns_updated_at
  BEFORE UPDATE ON campaigns
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 6. ADD HELPFUL COMMENTS
-- ============================================
COMMENT ON TABLE campaigns IS 'Stores email campaign information';
COMMENT ON COLUMN campaigns.id IS 'Unique campaign identifier';
COMMENT ON COLUMN campaigns.user_id IS 'Reference to the user who owns this campaign';
COMMENT ON COLUMN campaigns.name IS 'Campaign name';
COMMENT ON COLUMN campaigns.frequency IS 'How often emails should be sent (e.g., daily, weekly)';
COMMENT ON COLUMN campaigns.start_time IS 'When the campaign should start';
COMMENT ON COLUMN campaigns.end_time IS 'When the campaign should end';
COMMENT ON COLUMN campaigns.days IS 'Array of days when emails should be sent';
COMMENT ON COLUMN campaigns.status IS 'Campaign status: draft, active, paused, or completed';

