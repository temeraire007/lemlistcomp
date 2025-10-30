-- Create Email Templates Table
-- Stores reusable email templates for campaigns

-- ============================================
-- 1. CREATE EMAIL_TEMPLATES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS email_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  campaign_id UUID REFERENCES campaigns(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  subject TEXT NOT NULL,
  content TEXT NOT NULL,
  preview_text TEXT,
  variables TEXT[], -- Array of variable names used in template (e.g., ['firstName', 'company'])
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'archived')),
  category TEXT, -- 'welcome', 'follow-up', 'promotional', 'cold-outreach', etc.
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 2. CREATE INDEXES
-- ============================================
-- Index on user_id for faster user-specific queries
CREATE INDEX IF NOT EXISTS idx_email_templates_user_id ON email_templates(user_id);

-- Index on campaign_id for campaign-specific templates
CREATE INDEX IF NOT EXISTS idx_email_templates_campaign_id ON email_templates(campaign_id);

-- Index on status for filtering
CREATE INDEX IF NOT EXISTS idx_email_templates_status ON email_templates(status);

-- Composite index for user_id and status
CREATE INDEX IF NOT EXISTS idx_email_templates_user_status ON email_templates(user_id, status);

-- ============================================
-- 3. ENABLE ROW LEVEL SECURITY
-- ============================================
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 4. CREATE RLS POLICIES
-- ============================================

-- Policy: Users can view their own templates
CREATE POLICY "Users can view own templates" ON email_templates
  FOR SELECT
  USING (
    user_id IN (
      SELECT id FROM users WHERE clerk_user_id = (auth.jwt() ->> 'sub')
    )
  );

-- Policy: Users can insert their own templates
CREATE POLICY "Users can insert own templates" ON email_templates
  FOR INSERT
  WITH CHECK (
    user_id IN (
      SELECT id FROM users WHERE clerk_user_id = (auth.jwt() ->> 'sub')
    )
  );

-- Policy: Users can update their own templates
CREATE POLICY "Users can update own templates" ON email_templates
  FOR UPDATE
  USING (
    user_id IN (
      SELECT id FROM users WHERE clerk_user_id = (auth.jwt() ->> 'sub')
    )
  );

-- Policy: Users can delete their own templates
CREATE POLICY "Users can delete own templates" ON email_templates
  FOR DELETE
  USING (
    user_id IN (
      SELECT id FROM users WHERE clerk_user_id = (auth.jwt() ->> 'sub')
    )
  );

-- Policy: Allow authenticated role to manage templates (for API routes with Clerk token)
CREATE POLICY "Allow authenticated to manage templates" ON email_templates
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ============================================
-- 5. CREATE UPDATED_AT TRIGGER
-- ============================================
CREATE TRIGGER update_email_templates_updated_at
  BEFORE UPDATE ON email_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 6. ADD HELPFUL COMMENTS
-- ============================================
COMMENT ON TABLE email_templates IS 'Stores reusable email templates for campaigns';
COMMENT ON COLUMN email_templates.id IS 'Unique template identifier';
COMMENT ON COLUMN email_templates.user_id IS 'Reference to the user who owns this template';
COMMENT ON COLUMN email_templates.campaign_id IS 'Optional reference to specific campaign';
COMMENT ON COLUMN email_templates.name IS 'Template name for identification';
COMMENT ON COLUMN email_templates.subject IS 'Email subject line (can include variables)';
COMMENT ON COLUMN email_templates.content IS 'Email body content (can include variables)';
COMMENT ON COLUMN email_templates.preview_text IS 'Email preview/preheader text';
COMMENT ON COLUMN email_templates.variables IS 'Array of variable names used in template';
COMMENT ON COLUMN email_templates.status IS 'Template status: draft, active, or archived';
COMMENT ON COLUMN email_templates.category IS 'Template category for organization';

