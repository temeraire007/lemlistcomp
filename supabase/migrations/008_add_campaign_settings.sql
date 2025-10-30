-- Add Campaign Settings Fields
-- Adds email account selection and detailed scheduling options

-- ============================================
-- 1. ADD NEW COLUMNS TO CAMPAIGNS TABLE
-- ============================================

-- Add email_account_id to link campaign to a specific email account
ALTER TABLE campaigns 
ADD COLUMN IF NOT EXISTS email_account_id UUID REFERENCES email_accounts(id) ON DELETE SET NULL;

-- Add send frequency in minutes (e.g., 10, 60, 120)
ALTER TABLE campaigns
ADD COLUMN IF NOT EXISTS send_frequency_minutes INTEGER DEFAULT 60;

-- Add start hour of day (0-23) for sending window
ALTER TABLE campaigns
ADD COLUMN IF NOT EXISTS send_start_hour INTEGER DEFAULT 9 CHECK (send_start_hour >= 0 AND send_start_hour <= 23);

-- Add end hour of day (0-23) for sending window
ALTER TABLE campaigns
ADD COLUMN IF NOT EXISTS send_end_hour INTEGER DEFAULT 17 CHECK (send_end_hour >= 0 AND send_end_hour <= 23);

-- Add timezone for sending (default UTC)
ALTER TABLE campaigns
ADD COLUMN IF NOT EXISTS timezone TEXT DEFAULT 'UTC';

-- ============================================
-- 2. CREATE INDEX FOR EMAIL ACCOUNT
-- ============================================
CREATE INDEX IF NOT EXISTS idx_campaigns_email_account_id ON campaigns(email_account_id);

-- ============================================
-- 3. ADD HELPFUL COMMENTS
-- ============================================
COMMENT ON COLUMN campaigns.email_account_id IS 'Email account used to send emails for this campaign';
COMMENT ON COLUMN campaigns.send_frequency_minutes IS 'How often to send emails in minutes (e.g., 10, 60, 120)';
COMMENT ON COLUMN campaigns.send_start_hour IS 'Start hour of day for sending window (0-23)';
COMMENT ON COLUMN campaigns.send_end_hour IS 'End hour of day for sending window (0-23)';
COMMENT ON COLUMN campaigns.timezone IS 'Timezone for the sending window';
COMMENT ON COLUMN campaigns.days IS 'Days of week to send emails (e.g., [''monday'', ''tuesday'', ''wednesday''])';

